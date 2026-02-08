import { Sentiment, RiskLevel } from "../models/types";

// 12-color accessible palette for departments
const DEPARTMENT_PALETTE = [
  "#0078D4", // Blue
  "#E74856", // Red
  "#00CC6A", // Green
  "#F7630C", // Orange
  "#8764B8", // Purple
  "#00B7C3", // Teal
  "#CA5010", // Burnt Orange
  "#498205", // Olive
  "#E3008C", // Magenta
  "#4F6BED", // Indigo
  "#986F0B", // Gold
  "#69797E", // Steel
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

export function getDepartmentColor(department: string): string {
  if (!department) return DEPARTMENT_PALETTE[DEPARTMENT_PALETTE.length - 1];
  const index = hashString(department) % DEPARTMENT_PALETTE.length;
  return DEPARTMENT_PALETTE[index];
}

export function getSentimentColor(sentiment: Sentiment): string {
  switch (sentiment) {
    case "Positive":
      return "#107C10";
    case "Negative":
      return "#D13438";
    case "Neutral":
      return "#8A8886";
    case "Complex":
      return "#8764B8";
    default:
      return "#8A8886";
  }
}

export function getRiskBorderColor(riskLevel: RiskLevel): string | null {
  if (riskLevel === "High") return "#D13438";
  return null;
}

export function getEdgeThickness(strength: number): number {
  const clamped = Math.max(1, Math.min(10, strength));
  return 1.5 + ((clamped - 1) / 9) * 4.5;
}
