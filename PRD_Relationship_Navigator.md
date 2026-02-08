# Product Requirements Document: Relationship Navigator

## An Open-Source, Excel-Native, AI-Powered People Relationship Analysis Tool

**Version:** 1.0  
**Date:** February 8, 2026  
**Status:** Draft  
**Author:** Manus AI  
**Codename:** Relationship Navigator

---

## Table of Contents

1.  [Introduction](#1-introduction)
2.  [User Stories](#2-user-stories)
3.  [Data Model & Excel Schema](#3-data-model--excel-schema)
4.  [Functional Requirements & Feature Specifications](#4-functional-requirements--feature-specifications)
5.  [API Contracts](#5-api-contracts)
6.  [Technical Architecture & Stack](#6-technical-architecture--stack)
7.  [Development Milestones & Roadmap](#7-development-milestones--roadmap)
8.  [Acceptance Criteria](#8-acceptance-criteria)
9.  [Non-Functional Requirements](#9-non-functional-requirements)
10. [Out of Scope / Future Work](#10-out-of-scope--future-work)
11. [Appendices](#11-appendices)

---

## 1. Introduction

### 1.1. Problem Statement

Navigating the complex web of interpersonal relationships within a large organization, particularly a family-run private company, is a significant and often overwhelming challenge. Key information about who holds real influence, who is aligned with whom, and who poses a risk is frequently unwritten, existing only as gossip, memory, and intuition. This makes it exceedingly difficult for individuals — especially those newer to the environment — to make strategic decisions, build productive alliances, and avoid political pitfalls. The absence of a structured, private, and intelligent system for mapping and analyzing these dynamics puts individuals at a considerable disadvantage.

### 1.2. Vision & Goal

The vision is to empower individuals to survive and thrive in complex organizational environments by providing them with a private, intelligent, and intuitive tool for relationship analysis.

The goal of this project is to create an open-source **Microsoft Excel Add-in**, codenamed **"Relationship Navigator,"** that allows a user to model, visualize, and analyze their professional and personal relationship network directly within their existing spreadsheet workflow. The tool will combine the familiarity of Excel with the power of interactive graph visualization and cloud-based AI to provide actionable insights. The user's data never leaves their Excel file, and AI analysis is performed on-demand using the user's own API key.

### 1.3. Target Audience

The product is designed for three tiers of users, each with decreasing specificity but increasing market size.

| Tier | Persona | Description |
|---|---|---|
| **Primary** | The Corporate Strategist | An employee working in a large, family-owned private company with a highly complex and political environment. This is the original use case. |
| **Secondary** | The Stakeholder Manager | Any professional, manager, or leader who needs to understand and manage a complex network of stakeholders, clients, or internal team members. |
| **Tertiary** | The Personal CRM User | Individuals interested in personal relationship management with a focus on network visualization. |

### 1.4. Key Performance Indicators (KPIs)

| KPI | Metric | Target |
|---|---|---|
| **Adoption** | GitHub Stars / Forks | 500+ stars within 6 months of launch. |
| **Usability** | Time to first graph | A new user can create a graph with 10 people in under 15 minutes. |
| **Engagement** | Frequency of use | Primary users open the add-in at least 3 times per week. |
| **AI Value** | AI feature adoption rate | At least 30% of active users configure and use the AI analysis feature. |

### 1.5. Glossary

| Term | Definition |
|---|---|
| **Node** | A single entity on the graph, representing a person. Corresponds to a row in the `tbl_People` table. |
| **Edge** | A connection between two nodes, representing a relationship. Corresponds to a row in the `tbl_Relationships` table. |
| **Event** | A recorded interaction or occurrence involving one or more people. Corresponds to a row in the `tbl_Events` table. |
| **Task Pane** | The sidebar panel within Excel that hosts the add-in's user interface. |
| **Office.js** | The JavaScript API provided by Microsoft for building Office Add-ins. |
| **Risk Level** | A score (Low/Medium/High) assigned to a person based on their history of negative events. |

---

## 2. User Stories

### 2.1. Persona: "The Strategist" (Primary User)

The following user stories define the core experience from the primary user's perspective, using the standard "As a... I want to... so that..." format.

**Data Entry & Management:**

As a Strategist, I want to enter all the key people in my company into a simple spreadsheet, so that I have a centralized, structured list of all the players. I want to define the relationships between these people (e.g., who is whose boss, who are rivals, who are allies), so that I can map out the political landscape. I also want to log important events (e.g., "Alice publicly blamed Bob in a meeting"), so that I have a historical record of actions and can identify patterns of behavior over time.

**Visualization & Analysis:**

As a Strategist, I want to see this network as an interactive graph, so that I can visually identify clusters of influence, key connectors, and potential threats. I want the graph to update automatically when I change data in the Excel sheet, so that my analysis is always based on the latest information. I also want the tool to automatically flag individuals who have a history of negative events, so that I know who to be cautious around.

**AI-Powered Insights:**

As a Strategist, I want to use a powerful AI to analyze event descriptions, so that I can automatically extract sentiment and classify the event type without tedious manual tagging.

**Privacy & Security:**

As a Strategist, I want all my data to remain within my own Excel file, so that I can be confident that this sensitive information is completely private and under my control.

---

## 3. Data Model & Excel Schema

The entire data model is contained within a single Excel workbook, using three dedicated worksheets with structured **Excel Tables**. Using named tables is critical, as it provides the Office.js API with a reliable, named reference to read and write data, and it allows the tables to expand dynamically as the user adds rows.

The user will be provided with a starter Excel template file (`relationship_navigator_template.xlsx`).

### 3.1. Sheet 1: `People` (Nodes)

This sheet defines the individuals (nodes) in the network. The table must be named `tbl_People`.

| Column Header | Data Type | Constraints | Description & Example |
|---|---|---|---|
| `ID` | Text | **Required, Unique** | A unique identifier for the person. Can be auto-generated or user-defined. **Ex:** `P001` |
| `Name` | Text | **Required** | The full name of the person. **Ex:** `Alice Wang` |
| `Gender` | Text | Optional, Dropdown | The person's gender. **Ex:** `Female` |
| `JobTitle` | Text | Optional | The person's official job title. **Ex:** `VP of Marketing` |
| `Department` | Text | Optional | The department or team the person belongs to. **Ex:** `Marketing` |
| `Company` | Text | Optional | The company the person works for. Useful in multi-company contexts. **Ex:** `Wang Family Corp` |
| `FamilyRole` | Text | Optional | The person's role within the owning family, if applicable. **Ex:** `Daughter of CEO` |
| `Notes` | Text | Optional | Free-text notes for observations, personality traits, etc. **Ex:** `Very influential, close to the CFO.` |
| `RiskLevel` | Text | Optional, Dropdown | A manually or AI-assigned risk level. **Allowed Values:** `Low`, `Medium`, `High`. **Ex:** `High` |

### 3.2. Sheet 2: `Relationships` (Edges)

This sheet defines the connections (edges) between the people. The table must be named `tbl_Relationships`.

| Column Header | Data Type | Constraints | Description & Example |
|---|---|---|---|
| `ID` | Text | **Required, Unique** | A unique identifier for the relationship. **Ex:** `R001` |
| `PersonA_ID` | Text | **Required, FK -> tbl_People.ID** | The `ID` of the first person. **Ex:** `P001` |
| `PersonB_ID` | Text | **Required, FK -> tbl_People.ID** | The `ID` of the second person. **Ex:** `P002` |
| `Type` | Text | **Required**, Dropdown | The nature of the relationship. **Allowed Values:** `Leader`, `Colleague`, `Family`, `Friend`, `Rival`, `Ally`, `Mentor`, `Protege`, `Lover`, `Other`. **Ex:** `Rival` |
| `Direction` | Text | **Required**, Dropdown | The directionality of the relationship. **Allowed Values:** `A -> B`, `B -> A`, `A <-> B`. **Ex:** `A <-> B` |
| `Strength` | Number | Optional, Range: 1-10 | The perceived strength or importance of the relationship. **Ex:** `8` |
| `Sentiment` | Text | Optional, Dropdown | The overall sentiment. **Allowed Values:** `Positive`, `Neutral`, `Negative`, `Complex`. **Ex:** `Negative` |
| `Notes` | Text | Optional | Free-text notes about the dynamics. **Ex:** `They are competing for the upcoming COO position.` |

### 3.3. Sheet 3: `Events` (History)

This sheet logs specific interactions and events that provide context to the relationships. The table must be named `tbl_Events`.

| Column Header | Data Type | Constraints | Description & Example |
|---|---|---|---|
| `ID` | Text | **Required, Unique** | A unique identifier for the event. **Ex:** `E001` |
| `Date` | Date | **Required** | The date the event occurred. **Ex:** `2026-01-15` |
| `People_IDs` | Text | **Required** | A comma-separated list of `ID`s of the people involved. **Ex:** `P001, P003` |
| `Type` | Text | Optional, Dropdown | The type of event. **Allowed Values:** `Conflict`, `Support`, `Betrayal`, `Alliance`, `Gossip`, `Decision`, `Meeting`. **Ex:** `Betrayal` |
| `Description` | Text | **Required** | A detailed, natural-language description of what happened. **Ex:** `Alice blamed Carol for the project failure in front of the CEO during the weekly review.` |
| `Impact` | Text | Optional, Dropdown | The impact of the event. **Allowed Values:** `Positive`, `Negative`, `Neutral`. **Ex:** `Negative` |
| `Severity` | Number | Optional, Range: 1-10 | The severity or significance of the event. **Ex:** `9` |

### 3.4. Entity-Relationship Diagram

The following diagram illustrates the relationships between the three data tables.

```
┌──────────────────┐       ┌──────────────────────┐       ┌──────────────────┐
│   tbl_People     │       │  tbl_Relationships   │       │   tbl_Events     │
├──────────────────┤       ├──────────────────────┤       ├──────────────────┤
│ *ID (PK)         │◄──┐   │ *ID (PK)             │       │ *ID (PK)         │
│  Name            │   ├───│ *PersonA_ID (FK)     │       │ *Date            │
│  Gender          │   ├───│ *PersonB_ID (FK)     │       │ *People_IDs (FK) │──► References
│  JobTitle        │   │   │ *Type                │       │  Type            │    tbl_People.ID
│  Department      │   │   │ *Direction           │       │ *Description     │
│  Company         │   │   │  Strength            │       │  Impact          │
│  FamilyRole      │   │   │  Sentiment           │       │  Severity        │
│  Notes           │   │   │  Notes               │       └──────────────────┘
│  RiskLevel       │   │   └──────────────────────┘
└──────────────────┘   │
                       └─── (One Person can be in many Relationships and Events)
```

---

## 4. Functional Requirements & Feature Specifications

This section provides the detailed, engineering-ready specifications for each feature area.

### 4.1. F1: Core — Excel Add-in Shell & Task Pane

This feature area covers the foundational setup of the add-in within the Excel environment.

| Req ID | Requirement |
|---|---|
| **F1.1** | The tool shall be packaged as a modern Office Add-in (using the `manifest.xml` or `manifest.json` format), installable in Microsoft Excel for Windows, macOS, and Web. |
| **F1.2** | A "Relationship Navigator" button with a custom icon shall be added to the Excel **Home** ribbon tab. |
| **F1.3** | Clicking the ribbon button shall toggle a **task pane** on the right side of the Excel window. This pane hosts the entire user interface of the application. |
| **F1.4** | The add-in shall provide a command (e.g., a button within the task pane) to **insert the required Excel template** — the three named tables (`tbl_People`, `tbl_Relationships`, `tbl_Events`) with their headers — into the current workbook. This simplifies onboarding. |
| **F1.5** | The task pane shall have a navigation bar at the top with three views: **Graph**, **Events**, and **Settings**. |

### 4.2. F2: Data — Real-Time Synchronization with Excel

This feature area covers the critical data bridge between the Excel worksheets and the add-in's internal state.

| Req ID | Requirement |
|---|---|
| **F2.1** | On startup (when the task pane opens), the add-in must read all data from the `tbl_People`, `tbl_Relationships`, and `tbl_Events` tables in the active workbook and parse them into internal data structures. |
| **F2.2** | The add-in must register `onChanged` event handlers on all three Excel tables using the `Table.onChanged` event from the Office.js API. |
| **F2.3** | When a user adds, edits, or deletes a row in any of the three tables, the add-in's internal data must update automatically and trigger a re-render of the affected UI component (e.g., the graph or the event list) without requiring a manual refresh. |
| **F2.4** | The add-in must validate data on read. If a required table is missing or a row has missing required fields, the add-in must display a clear, user-friendly error message in the task pane indicating the problem and how to fix it. |
| **F2.5** | The add-in must be able to **write data back** to the Excel tables. This is used by the "Apply Suggestions" feature (F4.2) to write AI-generated analysis results back into the `tbl_Events` table. |

### 4.3. F3: Visualization — Interactive Relationship Graph

This feature area defines the core visual output of the tool.

| Req ID | Requirement |
|---|---|
| **F3.1** | The **Graph** view in the task pane shall render an interactive, **force-directed graph** based on the data from `tbl_People` (nodes) and `tbl_Relationships` (edges). |
| **F3.2** | **Node Representation:** Each person from `tbl_People` shall be rendered as a circular node. The node label shall display the person's `Name`. The node color shall be determined by the `Department` field (using a consistent color palette). Nodes with a `RiskLevel` of `High` must have a distinct, prominent visual indicator (e.g., a thick red border or a warning icon overlay). |
| **F3.3** | **Edge Representation:** Each entry in `tbl_Relationships` shall be rendered as a line connecting two nodes. The edge `Direction` shall be indicated by arrowheads. The edge `Sentiment` shall be represented by color: Green for `Positive`, Red for `Negative`, Gray for `Neutral`, and Purple for `Complex`. The edge `Strength` shall be represented by line thickness (higher value = thicker line). The edge `Type` shall be displayed as a label on the edge. |
| **F3.4** | **Interactivity — Pan & Zoom:** The user must be able to pan the graph by clicking and dragging on the background, and zoom in/out using the scroll wheel or pinch gestures. |
| **F3.5** | **Interactivity — Drag Nodes:** The user must be able to click and drag individual nodes to manually adjust the layout. The node should remain in its new position after being released. |
| **F3.6** | **Details on Demand — Node:** Clicking on a node shall open a **details panel** (a slide-over or modal within the task pane) displaying all attributes of that person from `tbl_People`, along with a chronological timeline of all events from `tbl_Events` in which that person's `ID` appears in the `People_IDs` column. |
| **F3.7** | **Details on Demand — Edge:** Clicking on an edge shall open a details panel displaying all attributes of that relationship from `tbl_Relationships`. |
| **F3.8** | **Filtering:** The graph view shall include a filter control that allows the user to filter nodes by `Department` or `RiskLevel`, and to filter edges by `Type` or `Sentiment`. Filtered-out elements should be hidden from the graph. |

### 4.4. F4: AI — Cloud-Powered Event Analysis

This feature area defines the intelligent analysis capabilities powered by cloud LLMs.

| Req ID | Requirement |
|---|---|
| **F4.1** | **Configuration:** The **Settings** view in the task pane shall allow the user to: (a) Select a cloud LLM provider from a dropdown (OpenAI, Anthropic, Google). (b) Securely input and store their personal API key using the `Office.context.document.settings` API. (c) Select a specific model from a list of recommended options (see Section 5). |
| **F4.2** | **AI Analysis Workflow:** When viewing an event in the details panel (F3.6), an **"Analyze with AI"** button shall be present. Clicking this button will: (1) Send only the `Description` text of that event to the configured cloud LLM API. (2) Display a loading indicator. (3) Display the AI-generated analysis (suggested `Type`, `Impact`, `Severity`, and a brief `Summary`) in the panel. (4) Present an **"Apply Suggestions"** button that, when clicked, writes the AI's suggested values back into the corresponding cells in the `tbl_Events` table. |
| **F4.3** | **Risk Score Calculation:** The add-in shall compute a **Risk Score** for each person. The score is calculated as the sum of `Severity` values for all events where that person is involved and the `Impact` is `Negative`. If the score exceeds a configurable threshold, the person's `RiskLevel` in `tbl_People` shall be automatically updated to `High`. |
| **F4.4** | **Privacy Disclosure:** Before the first API call is made, the add-in must display a clear notification to the user explaining that the event description text will be sent to a third-party cloud service, and require explicit confirmation. |

---

## 5. API Contracts

### 5.1. Cloud LLM API — Event Analysis

This contract defines the request and expected response for the AI-powered event analysis feature (F4.2). The add-in acts as a direct client to the LLM provider's API.

**Endpoint:** User-configurable based on provider selection.

| Provider | Base URL |
|---|---|
| OpenAI | `https://api.openai.com/v1/chat/completions` |
| Anthropic | `https://api.anthropic.com/v1/messages` |
| Google | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` |

**Method:** `POST`  
**Authentication:** `Authorization: Bearer {USER_API_KEY}` (or provider-specific header)

#### 5.1.1. Request Payload (OpenAI Example)

The add-in will construct a prompt that instructs the LLM to act as a corporate political analyst and return structured JSON.

```json
{
  "model": "gpt-4.1-mini",
  "response_format": { "type": "json_object" },
  "messages": [
    {
      "role": "system",
      "content": "You are an expert corporate political analyst. Analyze the following event description from a workplace context. Return a JSON object with the following fields: 'eventType' (one of: 'Conflict', 'Support', 'Betrayal', 'Alliance', 'Gossip', 'Decision', 'Meeting'), 'impact' (one of: 'Positive', 'Negative', 'Neutral'), 'severity' (integer from 1 to 10, where 10 is most severe), and 'summary' (a brief 1-2 sentence analysis of the political implications)."
    },
    {
      "role": "user",
      "content": "Event Description: 'Alice blamed Carol for the project failure in front of the CEO during the weekly review.'"
    }
  ]
}
```

#### 5.1.2. Expected Success Response (200 OK)

```json
{
  "eventType": "Betrayal",
  "impact": "Negative",
  "severity": 9,
  "summary": "This is a high-severity negative event. Alice is publicly undermining Carol's credibility with the CEO, indicating a significant rivalry and a strategic attempt to damage Carol's standing with senior leadership."
}
```

#### 5.1.3. Error Handling

| HTTP Status | Cause | Add-in Behavior |
|---|---|---|
| `401 Unauthorized` | Invalid API key | Display: "Your API key is invalid. Please check your settings." |
| `429 Too Many Requests` | Rate limit exceeded | Display: "Rate limit reached. Please try again in a moment." |
| `500 Internal Server Error` | Provider outage | Display: "The AI service is temporarily unavailable. Please try again later." |
| Network Error | No internet connection | Display: "Could not connect to the AI service. Please check your internet connection." |

### 5.2. Recommended Models

The settings panel will offer the following models as pre-configured options.

| Provider | Model ID | Display Name | Notes |
|---|---|---|---|
| OpenAI | `gpt-4.1-mini` | GPT-4.1 Mini (Recommended) | Best cost-performance ratio. Strong structured output. **Default.** |
| OpenAI | `gpt-4.1` | GPT-4.1 (Premium) | Top-tier reasoning for complex analysis. |
| Anthropic | `claude-sonnet-4-5-20260101` | Claude Sonnet 4.5 | Nuanced analysis, large context window. |
| Anthropic | `claude-opus-4-5-20260101` | Claude Opus 4.5 (Premium) | Most powerful reasoning available. |
| Google | `gemini-2.0-flash` | Gemini 2.0 Flash (Budget) | Extremely cost-effective for high-volume use. |

---

## 6. Technical Architecture & Stack

### 6.1. High-Level Architecture Diagram

The architecture is a hybrid model. The data source (the Excel file) and the user interface (the task pane) are local. The only external dependency is the optional, on-demand call to a cloud LLM API.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Microsoft Excel                              │
│                                                                             │
│  ┌────────────────────────────┐     ┌──────────────────────────────────┐   │
│  │        Worksheets          │     │       Add-in Task Pane           │   │
│  │                            │     │     (React + TypeScript App)      │   │
│  │  ┌──────────────────────┐  │     │  ┌────────────────────────────┐  │   │
│  │  │ tbl_People           │  │     │  │ [Graph View]               │  │   │
│  │  │ tbl_Relationships    │──┼─────┼─►│   - D3.js / relation-graph │  │   │
│  │  │ tbl_Events           │  │     │  │   - Details Panel           │  │   │
│  │  └──────────────────────┘  │     │  ├────────────────────────────┤  │   │
│  │                            │     │  │ [Events View]              │  │   │
│  │  Data edited by user in    │     │  │   - Event List & Timeline  │  │   │
│  │  standard Excel cells.     │     │  ├────────────────────────────┤  │   │
│  │                            │     │  │ [Settings View]            │  │   │
│  └────────────────────────────┘     │  │   - API Key, Model Select  │  │   │
│                                     │  └─────────────┬──────────────┘  │   │
│           ▲                         │                │                  │   │
│           │ Office.js API           │                │ fetch()          │   │
│           │ (Read, Write, Events)   │                │ (On-demand)      │   │
│           └─────────────────────────┘                │                  │   │
└──────────────────────────────────────────────────────┼──────────────────┘   │
                                                       │                      │
                                                       ▼                      │
                                             ┌──────────────────┐             │
                                             │  Cloud LLM API   │             │
                                             │  (User's Key)    │             │
                                             └──────────────────┘             │
```

### 6.2. Technology Stack

| Layer | Technology | Version / Notes | Rationale |
|---|---|---|---|
| **Application Host** | Microsoft Excel | Desktop (Win/Mac) & Web | The native environment for the user's data and workflow. |
| **Add-in Framework** | Office.js (Office Add-ins) | Latest | The official Microsoft platform for building Excel extensions. Provides the Task Pane, Ribbon commands, and the Excel JavaScript API. |
| **Frontend Framework** | React | 18+ | The most mature and widely-used UI framework. Officially supported by the Microsoft Office Add-in project generator (`yo office`). |
| **Language** | TypeScript | 5+ | Provides type safety, which is essential for working with the Office.js API and complex data structures. |
| **Graph Visualization** | D3.js (`d3-force`) or `relation-graph-react` | Latest | D3.js offers maximum flexibility for custom graph rendering. `relation-graph-react` is a higher-level alternative that simplifies development. The engineering team should evaluate both during Milestone 1. |
| **Styling** | Fluent UI React (`@fluentui/react-components`) | v9 | Microsoft's official design system for Office Add-ins. Ensures the task pane UI looks native and consistent with the Excel environment. |
| **Data Source** | Live Excel Workbook (via Office.js) | N/A | The single source of truth. No external database is required. |
| **AI Engine** | Cloud LLM APIs (OpenAI, Anthropic, Google) | Configurable | Accessed directly from the add-in via `fetch()`. The user provides their own API key. |
| **Build Tool** | Webpack | 5+ | The standard bundler used by the Office Add-in project generator. |
| **Project Generator** | Yeoman (`yo office`) | Latest | The official scaffolding tool for creating new Office Add-in projects. |

### 6.3. Key Technical Decisions

**Decision 1: No Backend Server.** The add-in operates entirely within the Excel client. It reads data from the workbook via Office.js and makes direct `fetch()` calls to cloud LLM APIs. This eliminates the need for a separate backend server, simplifying deployment and enhancing privacy. The user's data never passes through a server controlled by the project.

**Decision 2: Excel as the Database.** The Excel workbook itself serves as the persistent data store. This is a deliberate design choice that aligns with the user's workflow. The trade-off is that the data model is limited to what can be reasonably represented in a flat table structure. For the scope of this project (people, relationships, events), this is more than sufficient.

**Decision 3: Fluent UI for Native Look and Feel.** Using Microsoft's own Fluent UI component library ensures that the task pane looks and feels like a natural extension of Excel, rather than a foreign embedded application. This significantly improves perceived quality and user trust.

---

## 7. Development Milestones & Roadmap

The project is structured into three milestones, each delivering a complete, testable increment of value.

### 7.1. Milestone 1: MVP — Core Graph Visualization (Target: 4 Weeks)

**Goal:** Deliver a functional Excel Add-in that reads data from the workbook and renders an interactive, static relationship graph.

| Week | Epic | Key Deliverables |
|---|---|---|
| **Week 1** | **Project Setup** | Scaffold the Office Add-in project using `yo office` (React + TypeScript). Configure Webpack, ESLint, and the development environment. Create the `relationship_navigator_template.xlsx` file with the three named tables and sample data. |
| **Week 2** | **Data Layer** | Implement the `DataService` module that uses Office.js to read all rows from `tbl_People` and `tbl_Relationships` and parse them into typed TypeScript interfaces (`Person`, `Relationship`). |
| **Week 3** | **Graph Rendering** | Implement the `GraphView` React component. Integrate D3.js (or `relation-graph-react`) to render a force-directed graph from the parsed data. Implement pan, zoom, and node dragging. |
| **Week 4** | **Details Panel & Polish** | Implement the `DetailsPanel` component that appears when a node or edge is clicked. Write documentation for sideloading. Perform end-to-end testing. |

### 7.2. Milestone 2: Real-Time Sync & Event Tracking (Target: +3 Weeks)

**Goal:** Make the graph dynamic and introduce the event tracking system.

| Week | Epic | Key Deliverables |
|---|---|---|
| **Week 5** | **Real-Time Sync** | Implement `onChanged` event handlers on all three tables. Build the diffing logic to update the internal data store and trigger a targeted re-render of the graph (add/remove/update nodes and edges). |
| **Week 6** | **Event System** | Implement the `EventsView` to display a list of all events. Extend the `DetailsPanel` to show a person's event timeline. Implement visual cues for `RiskLevel` on nodes and `Sentiment`/`Strength` on edges. |
| **Week 7** | **Filtering & Risk Score** | Implement the graph filtering controls (by Department, RiskLevel, Type, Sentiment). Implement the basic Risk Score calculation algorithm (F4.3). |

### 7.3. Milestone 3: AI-Powered Analysis (Target: +3 Weeks)

**Goal:** Integrate cloud AI to provide intelligent analysis of events.

| Week | Epic | Key Deliverables |
|---|---|---|
| **Week 8** | **Settings & API Client** | Build the `SettingsView` with provider selection, API key input, and model selection. Implement the `LLMService` module with a provider-agnostic interface for making API calls. |
| **Week 9** | **AI Workflow** | Implement the "Analyze with AI" button and the full workflow: send description, display results, "Apply Suggestions" to write back to Excel. Implement the privacy disclosure dialog (F4.4). |
| **Week 10** | **Testing & Launch** | End-to-end testing of all features. Write comprehensive `README.md` and `CONTRIBUTING.md`. Prepare for open-source launch on GitHub. |

---

## 8. Acceptance Criteria

Acceptance criteria are defined using the **Given-When-Then** format to ensure clarity and testability.

### 8.1. AC-1: MVP Graph Rendering

> **Given** a user has installed the add-in via sideloading and opened the provided Excel template populated with at least 5 people and 5 relationships,  
> **When** they click the "Relationship Navigator" button on the ribbon,  
> **Then** the task pane must open and display a force-directed graph with 5 nodes and 5 edges within 3 seconds.  
> **And** the user must be able to zoom in/out, pan, and drag individual nodes.  
> **And** clicking a node must display that person's full details in a side panel.

### 8.2. AC-2: Real-Time Sync

> **Given** the graph is displayed in the task pane,  
> **When** the user changes a person's `Name` in a cell within `tbl_People`,  
> **Then** the corresponding node label in the graph must update automatically within 2 seconds.  
> **And When** the user adds a new row to `tbl_Relationships` with valid `PersonA_ID` and `PersonB_ID`,  
> **Then** a new edge must appear on the graph automatically within 2 seconds.  
> **And When** the user deletes a row from `tbl_People`,  
> **Then** the corresponding node and all its connected edges must be removed from the graph within 2 seconds.

### 8.3. AC-3: AI Event Analysis

> **Given** a user has configured their OpenAI API key and selected the `gpt-4.1-mini` model in the Settings view,  
> **And** they have an event in `tbl_Events` with a `Description` of "Alice blamed Carol for the project failure in front of the CEO,"  
> **When** they click the "Analyze with AI" button for that event,  
> **Then** the add-in must display the AI-generated `Type`, `Impact`, `Severity`, and `Summary` within 10 seconds.  
> **And When** the user clicks "Apply Suggestions,"  
> **Then** the `Type`, `Impact`, and `Severity` cells for that event row in the Excel table must be updated with the AI's values.

### 8.4. AC-4: Error Handling

> **Given** the add-in is open and the workbook does not contain a table named `tbl_People`,  
> **When** the task pane attempts to load,  
> **Then** it must display a clear error message: "Required table 'tbl_People' not found. Please use the 'Insert Template' button to set up your workbook."

---

## 9. Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| **Performance** | The graph must render and respond smoothly (no perceptible lag on pan/zoom/drag). | Up to **200 nodes** and **400 edges**. |
| **Performance** | UI updates triggered by Excel data changes must complete. | Within **2 seconds**. |
| **Usability** | The interface must be intuitive for a non-technical user familiar with Microsoft Excel. | All core actions discoverable within the task pane without external documentation. |
| **Security** | The user's API key must be stored securely. | Using `Office.context.document.settings` (persisted within the workbook file, not in a global store). |
| **Security** | No user data (people, relationships) shall be sent to any external service without explicit user action. | Only the `Description` field of a single event is sent, and only when the user clicks "Analyze with AI." |
| **Compatibility** | The add-in must be compatible with Microsoft Excel. | Latest versions for **Windows**, **macOS**, and **Excel on the Web**. |
| **Reliability** | The add-in must handle common errors gracefully. | Missing tables, invalid data, API failures, and network errors must all produce clear, actionable error messages. |
| **Accessibility** | The task pane UI should follow basic accessibility guidelines. | Keyboard navigable, sufficient color contrast, screen-reader-friendly labels. |

---

## 10. Out of Scope / Future Work

The following features are explicitly excluded from the initial three milestones but are documented here as potential future enhancements.

| Feature | Description | Rationale for Deferral |
|---|---|---|
| **Direct Graph Editing** | Allowing users to add/edit nodes and edges by interacting with the graph directly (e.g., drag-to-connect). | Increases complexity significantly. The Excel sheet is the primary editing interface for the MVP. |
| **Multi-User Collaboration** | Supporting multiple users viewing or editing the same relationship graph simultaneously. | Requires a shared backend, which contradicts the local-first, no-server architecture. |
| **Automatic Event Detection** | Integrating with calendars, email, or chat to automatically log events. | Requires complex integrations and raises significant privacy concerns. |
| **Advanced Graph Algorithms** | Features like community detection (Louvain), centrality analysis (betweenness, PageRank), or shortest path. | Valuable but not essential for the MVP. Can be added as an "Insights" tab in a future version. |
| **Google Sheets / WPS Office Support** | Building equivalent add-ons for other spreadsheet platforms. | Focus on one platform first to ensure quality. Google Sheets (Apps Script) is the most logical next target. |
| **Local LLM Support (Ollama)** | Allowing users to connect to a locally running LLM via Ollama for fully offline AI. | Adds complexity to the setup process. Cloud LLMs provide better quality for the initial release. |
| **Relationship Inference Agent** | An AI agent that proactively suggests new relationships or predicts conflicts based on event patterns. | Requires a more mature data set and a more sophisticated AI pipeline. This is the "next version" vision. |

---

## 11. Appendices

### 11.1. Project Setup Guide (for Engineers)

The following commands will scaffold a new Office Add-in project with the recommended stack.

```bash
# Install the Yeoman generator for Office Add-ins
npm install -g yo generator-office

# Scaffold a new project
yo office --projectType taskpane --name "RelationshipNavigator" \
  --host excel --ts true --framework react

# Navigate into the project
cd RelationshipNavigator

# Install additional dependencies
npm install @fluentui/react-components d3 @types/d3
# OR for the alternative graph library:
# npm install relation-graph-react

# Start the development server
npm start
```

### 11.2. Key Research Documents

The following research reports were produced during the discovery phase and informed the decisions in this PRD.

| Document | Description |
|---|---|
| `research_report_v1.md` | Initial landscape analysis covering 30+ tools, competitive review, gap analysis, and technology survey. |
| `research_report_v2.md` | Exploration of a fully local-first, offline architecture using Tauri, SQLite, and Ollama. |
| `research_report_v3.md` | Final hybrid architecture proposal combining an Excel Add-in with cloud LLM APIs. |

### 11.3. Key Open-Source Inspirations

| Project | URL | Relevance |
|---|---|---|
| **Nametag** | [github.com/mattogodoy/nametag](https://github.com/mattogodoy/nametag) | UI/UX patterns for a personal relationship graph manager. |
| **relation-graph** | [github.com/seeksdream/relation-graph](https://github.com/seeksdream/relation-graph) | A purpose-built React/Vue component for rendering relationship graphs. |
| **Neo4j LLM Graph Builder** | [github.com/neo4j-labs/llm-graph-builder](https://github.com/neo4j-labs/llm-graph-builder) | Architectural pattern for using LLMs to extract entities and relationships from unstructured text. |
| **Monica CRM** | [github.com/monicahq/monica](https://github.com/monicahq/monica) | Data model for activity/event logging in a personal CRM context. |
| **Microsoft GraphRAG** | [github.com/microsoft/graphrag](https://github.com/microsoft/graphrag) | Advanced graph-based reasoning patterns for future AI agent features. |

---

*End of Document*
