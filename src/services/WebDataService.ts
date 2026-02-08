import * as XLSX from "xlsx";
import {
  Person,
  Relationship,
  RelationshipEvent,
  DataLoadResult,
  ValidationError,
  LLMConfig,
} from "../models/types";

class WebDataService {
  private static instance: WebDataService;
  private workbook: XLSX.WorkBook | null = null;
  private people: Person[] = [];
  private relationships: Relationship[] = [];
  private events: RelationshipEvent[] = [];

  static getInstance(): WebDataService {
    if (!WebDataService.instance) {
      WebDataService.instance = new WebDataService();
    }
    return WebDataService.instance;
  }

  setWorkbook(wb: XLSX.WorkBook): void {
    this.workbook = wb;
    // Reset in-memory arrays when a new workbook is loaded
    this.people = [];
    this.relationships = [];
    this.events = [];
  }

  loadAllData(): DataLoadResult {
    const result: DataLoadResult = {
      people: [],
      relationships: [],
      events: [],
      errors: [],
    };

    // If we already have in-memory data (from apply suggestions), return it
    if (this.people.length > 0 || this.relationships.length > 0 || this.events.length > 0) {
      result.people = this.people;
      result.relationships = this.relationships;
      result.events = this.events;
      return result;
    }

    if (!this.workbook) {
      result.errors.push({ table: "", row: 0, field: "", message: "No workbook loaded" });
      return result;
    }

    const sheetNames = this.workbook.SheetNames;

    // Load People
    if (sheetNames.includes("People")) {
      const sheet = this.workbook.Sheets["People"];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false });
      if (rows.length > 0) {
        const headers = rows[0].map(String);
        const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell != null && cell !== ""));
        result.people = this.parseRows<Person>(headers, dataRows, "People", result.errors);
      }
    } else {
      result.errors.push({ table: "People", row: 0, field: "", message: "Sheet 'People' not found" });
    }

    // Load Relationships
    if (sheetNames.includes("Relationships")) {
      const sheet = this.workbook.Sheets["Relationships"];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false });
      if (rows.length > 0) {
        const headers = rows[0].map(String);
        const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell != null && cell !== ""));
        result.relationships = this.parseRows<Relationship>(headers, dataRows, "Relationships", result.errors);
      }
    } else {
      result.errors.push({ table: "Relationships", row: 0, field: "", message: "Sheet 'Relationships' not found" });
    }

    // Load Events
    if (sheetNames.includes("Events")) {
      const sheet = this.workbook.Sheets["Events"];
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false });
      if (rows.length > 0) {
        const headers = rows[0].map(String);
        const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell != null && cell !== ""));
        result.events = this.parseRows<RelationshipEvent>(headers, dataRows, "Events", result.errors);
      }
    } else {
      result.errors.push({ table: "Events", row: 0, field: "", message: "Sheet 'Events' not found" });
    }

    // Store parsed data in memory for subsequent reads
    this.people = result.people;
    this.relationships = result.relationships;
    this.events = result.events;

    return result;
  }

  private parseRows<T>(
    headers: string[],
    rows: unknown[][],
    tableName: string,
    errors: ValidationError[]
  ): T[] {
    const items: T[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const obj: Record<string, unknown> = {};
      let hasId = false;

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j];
        let value = row[j];

        // Convert numeric fields
        if (header === "Influence" || header === "Strength" || header === "Severity") {
          value = Number(value) || 0;
        } else {
          value = value != null ? String(value) : "";
        }

        obj[header] = value;
        if (header === "ID" && value) hasId = true;
      }

      if (!hasId) {
        errors.push({ table: tableName, row: i + 1, field: "ID", message: "Missing ID" });
        continue;
      }

      items.push(obj as T);
    }

    return items;
  }

  writeEventFields(
    eventId: string,
    fields: { Type?: string; Impact?: string; Severity?: number }
  ): void {
    for (const event of this.events) {
      if (event.ID === eventId) {
        if (fields.Type !== undefined) {
          event.Type = fields.Type as RelationshipEvent["Type"];
        }
        if (fields.Impact !== undefined) {
          event.Impact = fields.Impact as RelationshipEvent["Impact"];
        }
        if (fields.Severity !== undefined) {
          event.Severity = fields.Severity;
        }
        break;
      }
    }
  }

  updatePersonRiskLevel(personId: string, level: Person["RiskLevel"]): void {
    for (const person of this.people) {
      if (person.ID === personId) {
        person.RiskLevel = level;
        break;
      }
    }
  }

  saveLLMConfig(config: LLMConfig): void {
    localStorage.setItem("rn_llm_config", JSON.stringify(config));
  }

  loadLLMConfig(): LLMConfig | null {
    const stored = localStorage.getItem("rn_llm_config");
    if (!stored) return null;
    try {
      return JSON.parse(stored) as LLMConfig;
    } catch {
      return null;
    }
  }

  savePrivacyAccepted(accepted: boolean): void {
    localStorage.setItem("rn_privacy_accepted", String(accepted));
  }

  loadPrivacyAccepted(): boolean {
    return localStorage.getItem("rn_privacy_accepted") === "true";
  }

  /** Reset in-memory data so next loadAllData() re-parses from workbook */
  resetData(): void {
    this.people = [];
    this.relationships = [];
    this.events = [];
  }
}

export const webDataService = WebDataService.getInstance();
