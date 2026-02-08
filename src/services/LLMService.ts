import { LLMConfig, AIAnalysisResult, EventType, Impact } from "../models/types";

const SYSTEM_PROMPT = `You are an expert corporate political analyst. Given a description of a workplace event, analyze it and return a JSON object with exactly these fields:
- "eventType": one of "Meeting", "Email", "Decision", "Conflict", "Promotion", "Departure", "Reorganization", "Alliance", "Betrayal", "Achievement"
- "impact": one of "Positive", "Negative", "Neutral", "Mixed"
- "severity": integer from 1 to 10, where 10 is most severe/impactful
- "summary": a concise 1-2 sentence analysis of the political implications

Return ONLY valid JSON, no additional text.`;

const VALID_EVENT_TYPES: EventType[] = [
  "Meeting", "Email", "Decision", "Conflict", "Promotion",
  "Departure", "Reorganization", "Alliance", "Betrayal", "Achievement",
];

const VALID_IMPACTS: Impact[] = ["Positive", "Negative", "Neutral", "Mixed"];

class LLMService {
  private static instance: LLMService;

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  async analyzeEvent(description: string, config: LLMConfig): Promise<AIAnalysisResult> {
    switch (config.provider) {
      case "openai":
        return this.callOpenAI(description, config);
      case "anthropic":
        return this.callAnthropic(description, config);
      case "google":
        return this.callGoogle(description, config);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  private async callOpenAI(description: string, config: LLMConfig): Promise<AIAnalysisResult> {
    const response = await this.fetchWithErrorHandling(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Analyze this workplace event:\n\n${description}` },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      }
    );

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from OpenAI");
    return this.parseResponse(content);
  }

  private async callAnthropic(description: string, config: LLMConfig): Promise<AIAnalysisResult> {
    const response = await this.fetchWithErrorHandling(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: [
            { role: "user", content: `Analyze this workplace event:\n\n${description}` },
          ],
        }),
      }
    );

    const data = await response.json();
    const content = data.content?.[0]?.text;
    if (!content) throw new Error("Empty response from Anthropic");
    return this.parseResponse(content);
  }

  private async callGoogle(description: string, config: LLMConfig): Promise<AIAnalysisResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
    const response = await this.fetchWithErrorHandling(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${SYSTEM_PROMPT}\n\nAnalyze this workplace event:\n\n${description}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    });

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Empty response from Google");
    return this.parseResponse(content);
  }

  private async fetchWithErrorHandling(url: string, init: RequestInit): Promise<Response> {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch {
      throw new Error("Connection failed. Please check your network connection.");
    }

    if (!response.ok) {
      switch (response.status) {
        case 401:
          throw new Error("Invalid API key. Please check your key in Settings.");
        case 429:
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        case 500:
        case 502:
        case 503:
          throw new Error("AI service is temporarily unavailable. Please try again later.");
        default:
          throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }

    return response;
  }

  private parseResponse(raw: string): AIAnalysisResult {
    // Strip markdown code blocks if present
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error("Failed to parse AI response as JSON.");
    }

    const eventType = String(parsed.eventType || "");
    const impact = String(parsed.impact || "");
    const severity = Number(parsed.severity) || 5;
    const summary = String(parsed.summary || "");

    return {
      eventType: VALID_EVENT_TYPES.includes(eventType as EventType)
        ? (eventType as EventType)
        : "Meeting",
      impact: VALID_IMPACTS.includes(impact as Impact)
        ? (impact as Impact)
        : "Neutral",
      severity: Math.max(1, Math.min(10, Math.round(severity))),
      summary: summary || "No analysis available.",
    };
  }
}

export const llmService = LLMService.getInstance();
