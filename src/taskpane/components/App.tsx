import { useState, useEffect, useCallback } from "react";
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
import {
  Person,
  Relationship,
  RelationshipEvent,
  FilterState,
  LLMConfig,
  ValidationError,
} from "../../models/types";
import { dataService } from "../../services/DataService";
import { riskService } from "../../services/RiskService";
import GraphView from "./GraphView";
import DetailsPanel from "./DetailsPanel";
import EventsView from "./EventsView";
import SettingsView from "./SettingsView";
import FilterPanel from "./FilterPanel";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  },
  header: {
    padding: "8px 12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
  },
  title: {
    fontSize: "16px",
    fontWeight: 600,
    marginBottom: "4px",
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

export default function App() {
  const styles = useStyles();

  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [events, setEvents] = useState<RelationshipEvent[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("graph");
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [tablesExist, setTablesExist] = useState(true);
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

  const loadData = useCallback(async () => {
    try {
      const result = await dataService.loadAllData();

      if (
        result.people.length === 0 &&
        result.relationships.length === 0 &&
        result.events.length === 0 &&
        result.errors.some((e) => e.message.includes("not found"))
      ) {
        setTablesExist(false);
        setIsLoading(false);
        return;
      }

      setTablesExist(true);
      setPeople(result.people);
      setRelationships(result.relationships);
      setEvents(result.events);
      setErrors(result.errors);

      // Update risk levels
      if (result.people.length > 0) {
        await riskService.updateRiskLevels(result.people, result.events);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
      setTablesExist(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      // Load saved settings
      const config = dataService.loadLLMConfig();
      if (config) setLlmConfig(config);
      setPrivacyAccepted(dataService.loadPrivacyAccepted());

      // Load data
      await loadData();

      // Register change handlers
      await dataService.registerChangeHandlers(loadData);
    };

    init();

    return () => {
      dataService.unregisterChangeHandlers();
    };
  }, [loadData]);

  const handleInsertTemplate = async () => {
    setIsLoading(true);
    await dataService.insertTemplate();
    await loadData();
  };

  const handleConfigChange = (config: LLMConfig) => {
    setLlmConfig(config);
    dataService.saveLLMConfig(config);
  };

  const handlePrivacyAccepted = () => {
    setPrivacyAccepted(true);
    dataService.savePrivacyAccepted(true);
  };

  const handleApplySuggestions = async (
    eventId: string,
    fields: { Type?: string; Impact?: string; Severity?: number }
  ) => {
    await dataService.writeEventFields(eventId, fields);
    await loadData();
  };

  const handleSelectPerson = (person: Person | null) => {
    setSelectedPerson(person);
    setSelectedRelationship(null);
  };

  const handleSelectRelationship = (rel: Relationship | null) => {
    setSelectedRelationship(rel);
    setSelectedPerson(null);
  };

  if (isLoading) {
    return (
      <div className={styles.centerMessage}>
        <Spinner size="large" label="Loading data..." />
      </div>
    );
  }

  if (!tablesExist) {
    return (
      <div className={styles.centerMessage}>
        <div style={{ fontSize: "18px", fontWeight: 600 }}>Welcome to Relationship Navigator</div>
        <p>No data tables found in this workbook. Insert the template to get started.</p>
        <Button appearance="primary" onClick={handleInsertTemplate}>
          Insert Template
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
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
