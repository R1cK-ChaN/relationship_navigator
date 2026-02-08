/* global Excel, Office, OfficeExtension */

import {
  Person,
  Relationship,
  RelationshipEvent,
  DataLoadResult,
  ValidationError,
  LLMConfig,
  RiskLevel,
} from "../models/types";
import { debounce } from "../utils/debounce";

const TABLE_NAMES = {
  people: "tbl_People",
  relationships: "tbl_Relationships",
  events: "tbl_Events",
};

const PEOPLE_HEADERS = ["ID", "Name", "Title", "Department", "Influence", "RiskLevel", "Notes"];
const RELATIONSHIPS_HEADERS = [
  "ID", "PersonA_ID", "PersonB_ID", "Type", "Strength", "Sentiment", "Direction", "Notes",
];
const EVENTS_HEADERS = ["ID", "Date", "People_IDs", "Type", "Description", "Impact", "Severity"];

class DataService {
  private static instance: DataService;
  private changeHandlerResults: OfficeExtension.EventHandlerResult<Excel.TableChangedEventArgs>[] = [];

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async loadAllData(): Promise<DataLoadResult> {
    const result: DataLoadResult = {
      people: [],
      relationships: [],
      events: [],
      errors: [],
    };

    await Excel.run(async (context) => {
      const sheets = context.workbook.worksheets;
      sheets.load("items/name");
      await context.sync();

      const sheetNames = sheets.items.map((s) => s.name);

      // Load People
      if (sheetNames.includes("People")) {
        try {
          const table = context.workbook.tables.getItem(TABLE_NAMES.people);
          const headerRange = table.getHeaderRowRange();
          const bodyRange = table.getDataBodyRange();
          headerRange.load("values");
          bodyRange.load("values");
          await context.sync();

          const headers = (headerRange.values[0] as unknown[]).map(String);
          const rows = bodyRange.values;
          result.people = this.parseRows<Person>(headers, rows, "People", result.errors);
        } catch {
          result.errors.push({ table: "People", row: 0, field: "", message: "Table tbl_People not found" });
        }
      }

      // Load Relationships
      if (sheetNames.includes("Relationships")) {
        try {
          const table = context.workbook.tables.getItem(TABLE_NAMES.relationships);
          const headerRange = table.getHeaderRowRange();
          const bodyRange = table.getDataBodyRange();
          headerRange.load("values");
          bodyRange.load("values");
          await context.sync();

          const headers = (headerRange.values[0] as unknown[]).map(String);
          const rows = bodyRange.values;
          result.relationships = this.parseRows<Relationship>(headers, rows, "Relationships", result.errors);
        } catch {
          result.errors.push({ table: "Relationships", row: 0, field: "", message: "Table tbl_Relationships not found" });
        }
      }

      // Load Events
      if (sheetNames.includes("Events")) {
        try {
          const table = context.workbook.tables.getItem(TABLE_NAMES.events);
          const headerRange = table.getHeaderRowRange();
          const bodyRange = table.getDataBodyRange();
          headerRange.load("values");
          bodyRange.load("values");
          await context.sync();

          const headers = (headerRange.values[0] as unknown[]).map(String);
          const rows = bodyRange.values;
          result.events = this.parseRows<RelationshipEvent>(headers, rows, "Events", result.errors);
        } catch {
          result.errors.push({ table: "Events", row: 0, field: "", message: "Table tbl_Events not found" });
        }
      }
    });

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

  async writeEventFields(
    eventId: string,
    fields: { Type?: string; Impact?: string; Severity?: number }
  ): Promise<void> {
    await Excel.run(async (context) => {
      const table = context.workbook.tables.getItem(TABLE_NAMES.events);
      const headerRange = table.getHeaderRowRange();
      const bodyRange = table.getDataBodyRange();
      headerRange.load("values");
      bodyRange.load("values");
      await context.sync();

      const headers = (headerRange.values[0] as unknown[]).map(String);
      const idCol = headers.indexOf("ID");
      if (idCol === -1) return;

      const rows = bodyRange.values;
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][idCol]) === eventId) {
          if (fields.Type !== undefined) {
            const col = headers.indexOf("Type");
            if (col !== -1) {
              bodyRange.getCell(i, col).values = [[fields.Type]];
            }
          }
          if (fields.Impact !== undefined) {
            const col = headers.indexOf("Impact");
            if (col !== -1) {
              bodyRange.getCell(i, col).values = [[fields.Impact]];
            }
          }
          if (fields.Severity !== undefined) {
            const col = headers.indexOf("Severity");
            if (col !== -1) {
              bodyRange.getCell(i, col).values = [[fields.Severity]];
            }
          }
          break;
        }
      }

      await context.sync();
    });
  }

  async updatePersonRiskLevel(personId: string, level: RiskLevel): Promise<void> {
    await Excel.run(async (context) => {
      const table = context.workbook.tables.getItem(TABLE_NAMES.people);
      const headerRange = table.getHeaderRowRange();
      const bodyRange = table.getDataBodyRange();
      headerRange.load("values");
      bodyRange.load("values");
      await context.sync();

      const headers = (headerRange.values[0] as unknown[]).map(String);
      const idCol = headers.indexOf("ID");
      const riskCol = headers.indexOf("RiskLevel");
      if (idCol === -1 || riskCol === -1) return;

      const rows = bodyRange.values;
      for (let i = 0; i < rows.length; i++) {
        if (String(rows[i][idCol]) === personId) {
          bodyRange.getCell(i, riskCol).values = [[level]];
          break;
        }
      }

      await context.sync();
    });
  }

  async insertTemplate(): Promise<void> {
    await Excel.run(async (context) => {
      const workbook = context.workbook;
      const sheets = workbook.worksheets;
      sheets.load("items/name");
      await context.sync();

      const existingNames = sheets.items.map((s) => s.name);

      // Create People sheet
      if (!existingNames.includes("People")) {
        const sheet = sheets.add("People");
        const headerRange = sheet.getRange("A1:G1");
        headerRange.values = [PEOPLE_HEADERS];
        headerRange.format.font.bold = true;
        const table = sheet.tables.add("A1:G1", true);
        table.name = TABLE_NAMES.people;
        sheet.activate();
      }

      // Create Relationships sheet
      if (!existingNames.includes("Relationships")) {
        const sheet = sheets.add("Relationships");
        const headerRange = sheet.getRange("A1:H1");
        headerRange.values = [RELATIONSHIPS_HEADERS];
        headerRange.format.font.bold = true;
        const table = sheet.tables.add("A1:H1", true);
        table.name = TABLE_NAMES.relationships;
      }

      // Create Events sheet
      if (!existingNames.includes("Events")) {
        const sheet = sheets.add("Events");
        const headerRange = sheet.getRange("A1:G1");
        headerRange.values = [EVENTS_HEADERS];
        headerRange.format.font.bold = true;
        const table = sheet.tables.add("A1:G1", true);
        table.name = TABLE_NAMES.events;
      }

      await context.sync();
    });
  }

  async registerChangeHandlers(callback: () => void): Promise<void> {
    const debouncedCallback = debounce(callback, 500);

    await Excel.run(async (context) => {
      const tableNames = [TABLE_NAMES.people, TABLE_NAMES.relationships, TABLE_NAMES.events];

      for (const name of tableNames) {
        try {
          const table = context.workbook.tables.getItem(name);
          const handler = table.onChanged.add(() => {
            debouncedCallback();
          });
          await context.sync();
          this.changeHandlerResults.push(handler);
        } catch {
          // Table may not exist yet, skip
        }
      }
    });
  }

  async unregisterChangeHandlers(): Promise<void> {
    for (const handler of this.changeHandlerResults) {
      await Excel.run(handler.context, async () => {
        handler.remove();
        await handler.context.sync();
      });
    }
    this.changeHandlerResults = [];
  }

  saveLLMConfig(config: LLMConfig): void {
    const settings = Office.context.document.settings;
    settings.set("llm_provider", config.provider);
    settings.set("llm_model", config.model);
    settings.set("llm_apiKey", config.apiKey);
    settings.saveAsync();
  }

  loadLLMConfig(): LLMConfig | null {
    const settings = Office.context.document.settings;
    const provider = settings.get("llm_provider");
    const model = settings.get("llm_model");
    const apiKey = settings.get("llm_apiKey");

    if (!provider || !apiKey) return null;

    return {
      provider,
      model: model || "",
      apiKey,
    };
  }

  savePrivacyAccepted(accepted: boolean): void {
    const settings = Office.context.document.settings;
    settings.set("privacy_accepted", accepted);
    settings.saveAsync();
  }

  loadPrivacyAccepted(): boolean {
    const settings = Office.context.document.settings;
    return settings.get("privacy_accepted") === true;
  }
}

export const dataService = DataService.getInstance();
