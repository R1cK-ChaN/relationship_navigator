import * as d3 from "d3";

// ─── Union Types ───────────────────────────────────────────────

export type RelationshipType =
  | "Reports To"
  | "Mentors"
  | "Collaborates With"
  | "Competes With"
  | "Influences"
  | "Sponsors"
  | "Advises"
  | "Blocks"
  | "Supports"
  | "Conflicts With";

export type Sentiment = "Positive" | "Negative" | "Neutral" | "Complex";

export type EventType =
  | "Meeting"
  | "Email"
  | "Decision"
  | "Conflict"
  | "Promotion"
  | "Departure"
  | "Reorganization"
  | "Alliance"
  | "Betrayal"
  | "Achievement";

export type Impact = "Positive" | "Negative" | "Neutral" | "Mixed";

export type RiskLevel = "Low" | "Medium" | "High";

// ─── Excel Data Models ─────────────────────────────────────────

export interface Person {
  ID: string;
  Name: string;
  Title: string;
  Department: string;
  Influence: number;   // 1–10
  RiskLevel: RiskLevel;
  Notes: string;
}

export interface Relationship {
  ID: string;
  PersonA_ID: string;
  PersonB_ID: string;
  Type: RelationshipType;
  Strength: number;    // 1–10
  Sentiment: Sentiment;
  Direction: "A→B" | "B→A" | "Both";
  Notes: string;
}

export interface RelationshipEvent {
  ID: string;
  Date: string;        // ISO date string
  People_IDs: string;  // Comma-separated IDs
  Type: EventType;
  Description: string;
  Impact: Impact;
  Severity: number;    // 1–10
}

// ─── D3 Graph Types ────────────────────────────────────────────

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  title: string;
  department: string;
  influence: number;
  riskLevel: RiskLevel;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  type: RelationshipType;
  strength: number;
  sentiment: Sentiment;
  direction: "A→B" | "B→A" | "Both";
}

// ─── LLM Types ─────────────────────────────────────────────────

export type LLMProvider = "openai" | "anthropic" | "google";

export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
}

export const AVAILABLE_MODELS: LLMModel[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
  { id: "claude-sonnet-4-5-20250514", name: "Claude 3.5 Sonnet", provider: "anthropic" },
  { id: "claude-haiku-4-5-20251001", name: "Claude 3.5 Haiku", provider: "anthropic" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "google" },
];

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey: string;
}

export interface AIAnalysisResult {
  eventType: EventType;
  impact: Impact;
  severity: number;
  summary: string;
}

// ─── Filter & App State Types ──────────────────────────────────

export interface FilterState {
  departments: string[];
  riskLevels: RiskLevel[];
  relationshipTypes: RelationshipType[];
  sentiments: Sentiment[];
}

export interface ValidationError {
  table: string;
  row: number;
  field: string;
  message: string;
}

export interface DataLoadResult {
  people: Person[];
  relationships: Relationship[];
  events: RelationshipEvent[];
  errors: ValidationError[];
}
