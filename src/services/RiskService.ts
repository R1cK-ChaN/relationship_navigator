import { Person, RelationshipEvent, RiskLevel } from "../models/types";
import { dataService } from "./DataService";

class RiskService {
  private static instance: RiskService;

  static getInstance(): RiskService {
    if (!RiskService.instance) {
      RiskService.instance = new RiskService();
    }
    return RiskService.instance;
  }

  calculateRiskScores(
    people: Person[],
    events: RelationshipEvent[]
  ): Map<string, RiskLevel> {
    const scores = new Map<string, number>();

    // Initialize all people with 0
    for (const person of people) {
      scores.set(person.ID, 0);
    }

    // Sum severity for negative-impact events
    for (const event of events) {
      if (event.Impact !== "Negative") continue;

      const peopleIds = event.People_IDs.split(",").map((id) => id.trim());
      for (const pid of peopleIds) {
        if (scores.has(pid)) {
          scores.set(pid, (scores.get(pid) || 0) + event.Severity);
        }
      }
    }

    // Map scores to risk levels
    const levels = new Map<string, RiskLevel>();
    for (const [id, score] of scores) {
      if (score >= 15) {
        levels.set(id, "High");
      } else if (score >= 8) {
        levels.set(id, "Medium");
      } else {
        levels.set(id, "Low");
      }
    }

    return levels;
  }

  async updateRiskLevels(
    people: Person[],
    events: RelationshipEvent[]
  ): Promise<void> {
    const computed = this.calculateRiskScores(people, events);

    for (const person of people) {
      const newLevel = computed.get(person.ID);
      if (newLevel && newLevel !== person.RiskLevel) {
        await dataService.updatePersonRiskLevel(person.ID, newLevel);
      }
    }
  }
}

export const riskService = RiskService.getInstance();
