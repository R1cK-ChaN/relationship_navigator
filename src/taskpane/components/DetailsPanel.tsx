import { useState } from "react";
import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Badge,
  Spinner,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import {
  Person,
  Relationship,
  RelationshipEvent,
  LLMConfig,
  AIAnalysisResult,
} from "../../models/types";
import { llmService } from "../../services/LLMService";
import { getSentimentColor } from "../../utils/colors";

const useStyles = makeStyles({
  field: {
    marginBottom: "8px",
  },
  fieldLabel: {
    fontWeight: 600,
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
    marginBottom: "2px",
  },
  fieldValue: {
    fontSize: "14px",
  },
  section: {
    marginTop: "16px",
    marginBottom: "8px",
    fontWeight: 600,
    fontSize: "14px",
  },
  eventCard: {
    padding: "10px",
    marginBottom: "8px",
    borderRadius: "6px",
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  eventHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "4px",
  },
  eventDate: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
  },
  eventDescription: {
    fontSize: "13px",
    marginTop: "4px",
    marginBottom: "8px",
  },
  analysisResult: {
    padding: "10px",
    marginTop: "8px",
    borderRadius: "6px",
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorBrandStroke1}`,
  },
  analysisField: {
    fontSize: "13px",
    marginBottom: "4px",
  },
  analysisSummary: {
    fontStyle: "italic",
    fontSize: "13px",
    marginTop: "4px",
  },
  badgeRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginTop: "4px",
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: "13px",
    marginTop: "4px",
  },
});

interface DetailsPanelProps {
  person: Person | null;
  relationship: Relationship | null;
  people: Person[];
  events: RelationshipEvent[];
  llmConfig: LLMConfig | null;
  privacyAccepted: boolean;
  onPrivacyAccepted: () => void;
  onApplySuggestions: (
    eventId: string,
    fields: { Type?: string; Impact?: string; Severity?: number }
  ) => Promise<void>;
  onDismiss: () => void;
}

export default function DetailsPanel({
  person,
  relationship,
  people,
  events,
  llmConfig,
  privacyAccepted,
  onPrivacyAccepted,
  onApplySuggestions,
  onDismiss,
}: DetailsPanelProps) {
  const styles = useStyles();
  const [analyzingEventId, setAnalyzingEventId] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<Map<string, AIAnalysisResult>>(new Map());
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const [pendingAnalysisEventId, setPendingAnalysisEventId] = useState<string | null>(null);

  const isOpen = person !== null || relationship !== null;

  const getPersonName = (id: string): string => {
    const p = people.find((p) => p.ID === id);
    return p?.Name || id;
  };

  const getPersonEvents = (personId: string): RelationshipEvent[] => {
    return events
      .filter((e) => {
        const ids = e.People_IDs.split(",").map((id) => id.trim());
        return ids.includes(personId);
      })
      .sort((a, b) => (b.Date || "").localeCompare(a.Date || ""));
  };

  const handleAnalyze = async (event: RelationshipEvent) => {
    if (!privacyAccepted) {
      setPendingAnalysisEventId(event.ID);
      setShowPrivacyDialog(true);
      return;
    }

    if (!llmConfig || !llmConfig.apiKey) {
      setAnalysisError("Please configure your AI provider in the Settings tab first.");
      return;
    }

    setAnalyzingEventId(event.ID);
    setAnalysisError(null);

    try {
      const result = await llmService.analyzeEvent(event.Description, llmConfig);
      setAnalysisResults((prev) => new Map(prev).set(event.ID, result));
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzingEventId(null);
    }
  };

  const handlePrivacyAccept = () => {
    onPrivacyAccepted();
    setShowPrivacyDialog(false);
    if (pendingAnalysisEventId) {
      const event = events.find((e) => e.ID === pendingAnalysisEventId);
      if (event) handleAnalyze(event);
      setPendingAnalysisEventId(null);
    }
  };

  const handleApply = async (eventId: string) => {
    const result = analysisResults.get(eventId);
    if (!result) return;

    await onApplySuggestions(eventId, {
      Type: result.eventType,
      Impact: result.impact,
      Severity: result.severity,
    });
  };

  const renderPersonDetails = () => {
    if (!person) return null;
    const personEvents = getPersonEvents(person.ID);

    return (
      <>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Name</div>
          <div className={styles.fieldValue}>{person.Name}</div>
        </div>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Title</div>
          <div className={styles.fieldValue}>{person.Title}</div>
        </div>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Department</div>
          <div className={styles.fieldValue}>{person.Department}</div>
        </div>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Influence</div>
          <div className={styles.fieldValue}>{person.Influence} / 10</div>
        </div>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Risk Level</div>
          <Badge
            appearance="filled"
            color={
              person.RiskLevel === "High"
                ? "danger"
                : person.RiskLevel === "Medium"
                ? "warning"
                : "success"
            }
          >
            {person.RiskLevel}
          </Badge>
        </div>
        {person.Notes && (
          <div className={styles.field}>
            <div className={styles.fieldLabel}>Notes</div>
            <div className={styles.fieldValue}>{person.Notes}</div>
          </div>
        )}

        <Divider style={{ margin: "12px 0" }} />

        <div className={styles.section}>
          Events ({personEvents.length})
        </div>

        {personEvents.map((evt) => renderEventCard(evt))}
      </>
    );
  };

  const renderRelationshipDetails = () => {
    if (!relationship) return null;

    return (
      <>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Person A</div>
          <div className={styles.fieldValue}>{getPersonName(relationship.PersonA_ID)}</div>
        </div>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Person B</div>
          <div className={styles.fieldValue}>{getPersonName(relationship.PersonB_ID)}</div>
        </div>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Type</div>
          <div className={styles.fieldValue}>{relationship.Type}</div>
        </div>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Strength</div>
          <div className={styles.fieldValue}>{relationship.Strength} / 10</div>
        </div>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Sentiment</div>
          <Badge
            style={{ backgroundColor: getSentimentColor(relationship.Sentiment), color: "white" }}
          >
            {relationship.Sentiment}
          </Badge>
        </div>
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Direction</div>
          <div className={styles.fieldValue}>{relationship.Direction}</div>
        </div>
        {relationship.Notes && (
          <div className={styles.field}>
            <div className={styles.fieldLabel}>Notes</div>
            <div className={styles.fieldValue}>{relationship.Notes}</div>
          </div>
        )}
      </>
    );
  };

  const renderEventCard = (evt: RelationshipEvent) => {
    const analysis = analysisResults.get(evt.ID);
    const isAnalyzing = analyzingEventId === evt.ID;

    return (
      <div key={evt.ID} className={styles.eventCard}>
        <div className={styles.eventHeader}>
          <span className={styles.eventDate}>{evt.Date}</span>
          <div className={styles.badgeRow}>
            {evt.Type && <Badge appearance="outline">{evt.Type}</Badge>}
            {evt.Impact && (
              <Badge
                appearance="filled"
                color={
                  evt.Impact === "Positive"
                    ? "success"
                    : evt.Impact === "Negative"
                    ? "danger"
                    : "informative"
                }
              >
                {evt.Impact}
              </Badge>
            )}
            {evt.Severity > 0 && (
              <Badge appearance="outline">Severity: {evt.Severity}</Badge>
            )}
          </div>
        </div>
        <div className={styles.eventDescription}>{evt.Description}</div>

        {isAnalyzing && <Spinner size="tiny" label="Analyzing..." />}

        {analysis && (
          <div className={styles.analysisResult}>
            <div className={styles.analysisField}>
              <strong>Type:</strong> {analysis.eventType}
            </div>
            <div className={styles.analysisField}>
              <strong>Impact:</strong> {analysis.impact}
            </div>
            <div className={styles.analysisField}>
              <strong>Severity:</strong> {analysis.severity}/10
            </div>
            <div className={styles.analysisSummary}>{analysis.summary}</div>
            <Button
              size="small"
              appearance="primary"
              style={{ marginTop: "8px" }}
              onClick={() => handleApply(evt.ID)}
            >
              Apply Suggestions
            </Button>
          </div>
        )}

        {!analysis && !isAnalyzing && (
          <Button
            size="small"
            appearance="subtle"
            onClick={() => handleAnalyze(evt)}
          >
            Analyze with AI
          </Button>
        )}

        {analysisError && analyzingEventId === null && (
          <div className={styles.error}>{analysisError}</div>
        )}
      </div>
    );
  };

  return (
    <>
      <OverlayDrawer
        open={isOpen}
        onOpenChange={(_, data) => {
          if (!data.open) onDismiss();
        }}
        position="end"
        size="medium"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                icon={<Dismiss24Regular />}
                onClick={onDismiss}
                aria-label="Close"
              />
            }
          >
            {person ? person.Name : relationship ? "Relationship" : "Details"}
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          {person && renderPersonDetails()}
          {relationship && renderRelationshipDetails()}
        </DrawerBody>
      </OverlayDrawer>

      <Dialog
        open={showPrivacyDialog}
        onOpenChange={(_, data) => {
          if (!data.open) {
            setShowPrivacyDialog(false);
            setPendingAnalysisEventId(null);
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Privacy Disclosure</DialogTitle>
            <DialogContent>
              <p style={{ marginBottom: "12px" }}>
                AI analysis will send event descriptions to an external AI service
                ({llmConfig?.provider || "your configured provider"}).
              </p>
              <p style={{ marginBottom: "12px" }}>
                <strong>What is sent:</strong> Only the event description text. No names,
                IDs, or other personal data from your spreadsheet.
              </p>
              <p>
                <strong>Your API key</strong> is stored locally in this workbook&apos;s
                settings and is never shared with third parties.
              </p>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => {
                  setShowPrivacyDialog(false);
                  setPendingAnalysisEventId(null);
                }}
              >
                Cancel
              </Button>
              <Button appearance="primary" onClick={handlePrivacyAccept}>
                I Understand, Continue
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
