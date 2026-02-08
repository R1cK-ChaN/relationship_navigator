import { useEffect, useRef, useMemo } from "react";
import * as d3 from "d3";
import { makeStyles } from "@fluentui/react-components";
import {
  Person,
  Relationship,
  FilterState,
  GraphNode,
  GraphLink,
} from "../../models/types";
import {
  getDepartmentColor,
  getSentimentColor,
  getRiskBorderColor,
  getEdgeThickness,
} from "../../utils/colors";

const useStyles = makeStyles({
  container: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
});

interface GraphViewProps {
  people: Person[];
  relationships: Relationship[];
  filters: FilterState;
  onSelectPerson: (person: Person | null) => void;
  onSelectRelationship: (rel: Relationship | null) => void;
}

export default function GraphView({
  people,
  relationships,
  filters,
  onSelectPerson,
  onSelectRelationship,
}: GraphViewProps) {
  const styles = useStyles();
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  // Filter and build graph data
  const graphData = useMemo(() => {
    let filteredPeople = people;

    if (filters.departments.length > 0) {
      filteredPeople = filteredPeople.filter((p) =>
        filters.departments.includes(p.Department)
      );
    }
    if (filters.riskLevels.length > 0) {
      filteredPeople = filteredPeople.filter((p) =>
        filters.riskLevels.includes(p.RiskLevel)
      );
    }

    const personIds = new Set(filteredPeople.map((p) => p.ID));

    let filteredRels = relationships.filter(
      (r) => personIds.has(r.PersonA_ID) && personIds.has(r.PersonB_ID)
    );

    if (filters.relationshipTypes.length > 0) {
      filteredRels = filteredRels.filter((r) =>
        filters.relationshipTypes.includes(r.Type)
      );
    }
    if (filters.sentiments.length > 0) {
      filteredRels = filteredRels.filter((r) =>
        filters.sentiments.includes(r.Sentiment)
      );
    }

    const nodes: GraphNode[] = filteredPeople.map((p) => ({
      id: p.ID,
      name: p.Name,
      title: p.Title,
      department: p.Department,
      influence: p.Influence,
      riskLevel: p.RiskLevel,
    }));

    const links: GraphLink[] = filteredRels.map((r) => ({
      source: r.PersonA_ID,
      target: r.PersonB_ID,
      id: r.ID,
      type: r.Type,
      strength: r.Strength,
      sentiment: r.Sentiment,
      direction: r.Direction,
    }));

    return { nodes, links };
  }, [people, relationships, filters]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    if (!svgRef.current) return;

    // Stop previous simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Clear SVG
    svg.selectAll("*").remove();

    const { nodes, links } = graphData;
    if (nodes.length === 0) return;

    const width = svgRef.current.clientWidth || 400;
    const height = svgRef.current.clientHeight || 400;

    // Define arrowhead marker
    const defs = svg.append("defs");
    defs
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 28)
      .attr("refY", 0)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");

    // Container for zoom/pan
    const container = svg.append("g");

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Render links
    const linkGroup = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => getSentimentColor(d.sentiment))
      .attr("stroke-width", (d) => getEdgeThickness(d.strength))
      .attr("stroke-opacity", 0.7)
      .attr("marker-end", (d) =>
        d.direction === "A→B" || d.direction === "Both" ? "url(#arrowhead)" : ""
      )
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        const rel = relationships.find((r) => r.ID === d.id) || null;
        onSelectRelationship(rel);
      });

    // Render link labels
    const linkLabels = container
      .append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("font-size", "9px")
      .attr("fill", "#666")
      .attr("text-anchor", "middle")
      .attr("dy", -4)
      .text((d) => d.type);

    // Render nodes
    const nodeRadius = 16;

    const nodeGroup = container
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        const person = people.find((p) => p.ID === d.id) || null;
        onSelectPerson(person);
      });

    // Node circles
    nodeGroup
      .append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d) => getDepartmentColor(d.department))
      .attr("stroke", (d) => {
        const riskColor = getRiskBorderColor(d.riskLevel);
        return riskColor || "#ffffff";
      })
      .attr("stroke-width", (d) => (d.riskLevel === "High" ? 4 : 2));

    // Node labels
    nodeGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", nodeRadius + 14)
      .attr("font-size", "11px")
      .attr("fill", "#242424")
      .text((d) => d.name);

    // Accessibility
    nodeGroup
      .attr("aria-label", (d) => `${d.name}, ${d.title}, ${d.department}`)
      .append("title")
      .text((d) => `${d.name}\n${d.title}\n${d.department}`);

    // Drag behavior
    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        // Keep position fixed on drag end (PRD F3.5)
        d.fx = event.x;
        d.fy = event.y;
      });

    nodeGroup.call(drag);

    // Force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(nodeRadius + 10));

    simulation.on("tick", () => {
      linkGroup
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);

      linkLabels
        .attr("x", (d) => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return ((s.x ?? 0) + (t.x ?? 0)) / 2;
        })
        .attr("y", (d) => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          return ((s.y ?? 0) + (t.y ?? 0)) / 2;
        });

      nodeGroup.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    simulationRef.current = simulation;

    // Click on background to deselect
    svg.on("click", () => {
      onSelectPerson(null);
      onSelectRelationship(null);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, people, relationships, onSelectPerson, onSelectRelationship]);

  return (
    <div className={styles.container}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        aria-label="Relationship network graph"
      />
    </div>
  );
}
