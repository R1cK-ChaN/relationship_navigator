import { useState, useMemo } from "react";
import {
  Badge,
  Dropdown,
  Option,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Person,
  RelationshipEvent,
  EventType,
  Impact,
} from "../../models/types";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  filters: {
    display: "flex",
    gap: "8px",
    padding: "8px 12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
    flexWrap: "wrap",
  },
  filterDropdown: {
    minWidth: "130px",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 12px",
  },
  card: {
    padding: "12px",
    marginBottom: "8px",
    borderRadius: "6px",
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  date: {
    fontSize: "12px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
  },
  description: {
    fontSize: "13px",
    marginBottom: "8px",
    lineHeight: "1.4",
  },
  people: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
    marginBottom: "4px",
  },
  personLink: {
    color: tokens.colorBrandForeground1,
    cursor: "pointer",
    textDecoration: "none",
    ":hover": {
      textDecoration: "underline",
    },
  },
  badgeRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  },
  empty: {
    textAlign: "center",
    padding: "40px 24px",
    color: tokens.colorNeutralForeground3,
  },
});

const ALL_EVENT_TYPES: EventType[] = [
  "Meeting", "Email", "Decision", "Conflict", "Promotion",
  "Departure", "Reorganization", "Alliance", "Betrayal", "Achievement",
];

const ALL_IMPACTS: Impact[] = ["Positive", "Negative", "Neutral", "Mixed"];

interface EventsViewProps {
  events: RelationshipEvent[];
  people: Person[];
  onSelectPerson: (person: Person | null) => void;
}

export default function EventsView({ events, people, onSelectPerson }: EventsViewProps) {
  const styles = useStyles();
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [impactFilter, setImpactFilter] = useState<string>("");

  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (typeFilter) {
      filtered = filtered.filter((e) => e.Type === typeFilter);
    }
    if (impactFilter) {
      filtered = filtered.filter((e) => e.Impact === impactFilter);
    }

    // Sort by date descending
    filtered.sort((a, b) => (b.Date || "").localeCompare(a.Date || ""));

    return filtered;
  }, [events, typeFilter, impactFilter]);

  const getPersonName = (id: string): string => {
    const p = people.find((p) => p.ID === id);
    return p?.Name || id;
  };

  const resolvePeopleIds = (ids: string): string[] => {
    return ids
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  };

  return (
    <div className={styles.container}>
      <div className={styles.filters}>
        <Dropdown
          className={styles.filterDropdown}
          placeholder="All Types"
          value={typeFilter || undefined}
          onOptionSelect={(_, data) => setTypeFilter(data.optionValue || "")}
        >
          <Option value="">All Types</Option>
          {ALL_EVENT_TYPES.map((t) => (
            <Option key={t} value={t}>
              {t}
            </Option>
          ))}
        </Dropdown>

        <Dropdown
          className={styles.filterDropdown}
          placeholder="All Impact"
          value={impactFilter || undefined}
          onOptionSelect={(_, data) => setImpactFilter(data.optionValue || "")}
        >
          <Option value="">All Impact</Option>
          {ALL_IMPACTS.map((i) => (
            <Option key={i} value={i}>
              {i}
            </Option>
          ))}
        </Dropdown>
      </div>

      <div className={styles.list}>
        {filteredEvents.length === 0 && (
          <div className={styles.empty}>
            No events found. Add events to the Events worksheet.
          </div>
        )}

        {filteredEvents.map((evt) => {
          const personIds = resolvePeopleIds(evt.People_IDs);

          return (
            <div key={evt.ID} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.date}>{evt.Date}</span>
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
                </div>
              </div>

              <div className={styles.people}>
                People:{" "}
                {personIds.map((id, idx) => (
                  <span key={id}>
                    {idx > 0 && ", "}
                    <span
                      className={styles.personLink}
                      onClick={() => {
                        const p = people.find((p) => p.ID === id) || null;
                        onSelectPerson(p);
                      }}
                    >
                      {getPersonName(id)}
                    </span>
                  </span>
                ))}
              </div>

              <div className={styles.description}>{evt.Description}</div>

              {evt.Severity > 0 && (
                <div className={styles.badgeRow}>
                  <Badge appearance="outline">Severity: {evt.Severity}/10</Badge>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
