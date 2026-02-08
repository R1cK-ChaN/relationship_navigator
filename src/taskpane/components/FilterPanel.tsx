import { useMemo } from "react";
import {
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItemCheckbox,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import type { MenuCheckedValueChangeData } from "@fluentui/react-components";
import { FilterRegular, DismissRegular } from "@fluentui/react-icons";
import {
  Person,
  FilterState,
  RiskLevel,
  RelationshipType,
  Sentiment,
} from "../../models/types";

const useStyles = makeStyles({
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "6px 12px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
    flexWrap: "wrap",
  },
  filterIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: "12px",
    marginRight: "4px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  activeCount: {
    fontSize: "11px",
    color: tokens.colorBrandForeground1,
    fontWeight: 600,
  },
});

const ALL_RISK_LEVELS: RiskLevel[] = ["Low", "Medium", "High"];

const ALL_RELATIONSHIP_TYPES: RelationshipType[] = [
  "Reports To", "Mentors", "Collaborates With", "Competes With",
  "Influences", "Sponsors", "Advises", "Blocks", "Supports", "Conflicts With",
];

const ALL_SENTIMENTS: Sentiment[] = ["Positive", "Negative", "Neutral", "Complex"];

interface FilterPanelProps {
  people: Person[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export default function FilterPanel({ people, filters, onFiltersChange }: FilterPanelProps) {
  const styles = useStyles();

  const departments = useMemo(() => {
    const unique = new Set(people.map((p) => p.Department).filter(Boolean));
    return Array.from(unique).sort();
  }, [people]);

  const activeFilterCount =
    filters.departments.length +
    filters.riskLevels.length +
    filters.relationshipTypes.length +
    filters.sentiments.length;

  const handleDepartmentChange = (_: unknown, data: MenuCheckedValueChangeData) => {
    onFiltersChange({ ...filters, departments: data.checkedItems });
  };

  const handleRiskChange = (_: unknown, data: MenuCheckedValueChangeData) => {
    onFiltersChange({
      ...filters,
      riskLevels: data.checkedItems as RiskLevel[],
    });
  };

  const handleTypeChange = (_: unknown, data: MenuCheckedValueChangeData) => {
    onFiltersChange({
      ...filters,
      relationshipTypes: data.checkedItems as RelationshipType[],
    });
  };

  const handleSentimentChange = (_: unknown, data: MenuCheckedValueChangeData) => {
    onFiltersChange({
      ...filters,
      sentiments: data.checkedItems as Sentiment[],
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      departments: [],
      riskLevels: [],
      relationshipTypes: [],
      sentiments: [],
    });
  };

  return (
    <div className={styles.toolbar}>
      <span className={styles.filterIcon}>
        <FilterRegular />
        Filters
        {activeFilterCount > 0 && (
          <span className={styles.activeCount}>({activeFilterCount})</span>
        )}
      </span>

      {departments.length > 0 && (
        <Menu
          checkedValues={{ department: filters.departments }}
          onCheckedValueChange={handleDepartmentChange}
        >
          <MenuTrigger>
            <Button size="small" appearance="subtle">
              Department{filters.departments.length > 0 ? ` (${filters.departments.length})` : ""}
            </Button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList>
              {departments.map((dept) => (
                <MenuItemCheckbox key={dept} name="department" value={dept}>
                  {dept}
                </MenuItemCheckbox>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>
      )}

      <Menu
        checkedValues={{ risk: filters.riskLevels }}
        onCheckedValueChange={handleRiskChange}
      >
        <MenuTrigger>
          <Button size="small" appearance="subtle">
            Risk{filters.riskLevels.length > 0 ? ` (${filters.riskLevels.length})` : ""}
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {ALL_RISK_LEVELS.map((level) => (
              <MenuItemCheckbox key={level} name="risk" value={level}>
                {level}
              </MenuItemCheckbox>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>

      <Menu
        checkedValues={{ relType: filters.relationshipTypes }}
        onCheckedValueChange={handleTypeChange}
      >
        <MenuTrigger>
          <Button size="small" appearance="subtle">
            Type{filters.relationshipTypes.length > 0 ? ` (${filters.relationshipTypes.length})` : ""}
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {ALL_RELATIONSHIP_TYPES.map((t) => (
              <MenuItemCheckbox key={t} name="relType" value={t}>
                {t}
              </MenuItemCheckbox>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>

      <Menu
        checkedValues={{ sentiment: filters.sentiments }}
        onCheckedValueChange={handleSentimentChange}
      >
        <MenuTrigger>
          <Button size="small" appearance="subtle">
            Sentiment{filters.sentiments.length > 0 ? ` (${filters.sentiments.length})` : ""}
          </Button>
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {ALL_SENTIMENTS.map((s) => (
              <MenuItemCheckbox key={s} name="sentiment" value={s}>
                {s}
              </MenuItemCheckbox>
            ))}
          </MenuList>
        </MenuPopover>
      </Menu>

      {activeFilterCount > 0 && (
        <Button
          size="small"
          appearance="subtle"
          icon={<DismissRegular />}
          onClick={clearFilters}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
