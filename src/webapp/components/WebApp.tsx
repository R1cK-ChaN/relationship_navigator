import { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  TabList,
  Tab,
  Button,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowUploadRegular } from "@fluentui/react-icons";
import {
  Person,
  Relationship,
  RelationshipEvent,
  FilterState,
  LLMConfig,
  ValidationError,
} from "../../models/types";
import { webDataService } from "../../services/WebDataService";
import { riskService } from "../../services/RiskService";
import GraphView from "../../taskpane/components/GraphView";
import DetailsPanel from "../../taskpane/components/DetailsPanel";
import EventsView from "../../taskpane/components/EventsView";
import SettingsView from "../../taskpane/components/SettingsView";
import FilterPanel from "../../taskpane/components/FilterPanel";
import FileUpload from "./FileUpload";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  },
  header: {
    padding: "8px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  title: {
    fontSize: "16px",
    fontWeight: 600,
  },
  content: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  centerMessage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: "24px",
    textAlign: "center",
    gap: "12px",
  },
  errorContainer: {
    padding: "8px 12px",
    flexShrink: 0,
  },
});

type ActiveTab = "graph" | "events" | "settings";

export default function WebApp() {
  const styles = useStyles();

  const [workbookLoaded, setWorkbookLoaded] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [events, setEvents] = useState<RelationshipEvent[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("graph");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    riskLevels: [],
    relationshipTypes: [],
    sentiments: [],
  });
  const [llmConfig, setLlmConfig] = useState<LLMConfig | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Load saved settings from localStorage on mount
  useEffect(() => {
    const config = webDataService.loadLLMConfig();
    if (config) setLlmConfig(config);
    setPrivacyAccepted(webDataService.loadPrivacyAccepted());
  }, []);

  const loadData = useCallback(() => {
    const result = webDataService.loadAllData();

    setPeople(result.people);
    setRelationships(result.relationships);
    setEvents(result.events);
    setErrors(result.errors);

    // Calculate risk scores in-memory (no Office.js write-back)
    if (result.people.length > 0) {
      const riskLevels = riskService.calculateRiskScores(result.people, result.events);
      for (const person of result.people) {
        const newLevel = riskLevels.get(person.ID);
        if (newLevel && newLevel !== person.RiskLevel) {
          person.RiskLevel = newLevel;
          webDataService.updatePersonRiskLevel(person.ID, newLevel);
        }
      }
      // Re-set people to trigger re-render with updated risk levels
      setPeople([...result.people]);
    }
  }, []);

  const handleFileLoaded = useCallback(
    (workbook: XLSX.WorkBook) => {
      setIsLoading(true);
      webDataService.setWorkbook(workbook);
      loadData();
      setWorkbookLoaded(true);
      setIsLoading(false);
    },
    [loadData]
  );

  const handleReUpload = useCallback(() => {
    setWorkbookLoaded(false);
    setPeople([]);
    setRelationships([]);
    setEvents([]);
    setErrors([]);
    setSelectedPerson(null);
    setSelectedRelationship(null);
    setFilters({ departments: [], riskLevels: [], relationshipTypes: [], sentiments: [] });
    setActiveTab("graph");
  }, []);

  const handleConfigChange = (config: LLMConfig) => {
    setLlmConfig(config);
    webDataService.saveLLMConfig(config);
  };

  const handlePrivacyAccepted = () => {
    setPrivacyAccepted(true);
    webDataService.savePrivacyAccepted(true);
  };

  const handleApplySuggestions = async (
    eventId: string,
    fields: { Type?: string; Impact?: string; Severity?: number }
  ) => {
    webDataService.writeEventFields(eventId, fields);
    loadData();
  };

  const handleSelectPerson = (person: Person | null) => {
    setSelectedPerson(person);
    setSelectedRelationship(null);
  };

  const handleSelectRelationship = (rel: Relationship | null) => {
    setSelectedRelationship(rel);
    setSelectedPerson(null);
  };

  if (!workbookLoaded) {
    return <FileUpload onFileLoaded={handleFileLoaded} />;
  }

  if (isLoading) {
    return (
      <div className={styles.centerMessage}>
        <Spinner size="large" label="Loading data..." />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>Relationship Navigator</div>
          <TabList
            selectedValue={activeTab}
            onTabSelect={(_, data) => setActiveTab(data.value as ActiveTab)}
            size="small"
          >
            <Tab value="graph">Graph</Tab>
            <Tab value="events">Events</Tab>
            <Tab value="settings">Settings</Tab>
          </TabList>
        </div>
        <Button
          appearance="subtle"
          icon={<ArrowUploadRegular />}
          onClick={handleReUpload}
        >
          Re-upload File
        </Button>
      </div>

      {errors.length > 0 && (
        <div className={styles.errorContainer}>
          <MessageBar intent="warning">
            <MessageBarBody>
              {errors.length} validation warning{errors.length > 1 ? "s" : ""} found in data.
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      <div className={styles.content}>
        {activeTab === "graph" && (
          <>
            <FilterPanel
              people={people}
              filters={filters}
              onFiltersChange={setFilters}
            />
            <GraphView
              people={people}
              relationships={relationships}
              filters={filters}
              onSelectPerson={handleSelectPerson}
              onSelectRelationship={handleSelectRelationship}
            />
          </>
        )}

        {activeTab === "events" && (
          <EventsView
            events={events}
            people={people}
            onSelectPerson={handleSelectPerson}
          />
        )}

        {activeTab === "settings" && (
          <SettingsView
            config={llmConfig}
            onConfigChange={handleConfigChange}
          />
        )}
      </div>

      <DetailsPanel
        person={selectedPerson}
        relationship={selectedRelationship}
        people={people}
        events={events}
        llmConfig={llmConfig}
        privacyAccepted={privacyAccepted}
        onPrivacyAccepted={handlePrivacyAccepted}
        onApplySuggestions={handleApplySuggestions}
        onDismiss={() => {
          setSelectedPerson(null);
          setSelectedRelationship(null);
        }}
      />
    </div>
  );
}
