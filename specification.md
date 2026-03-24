# Product & Technical Specification: Home Assistant Cowork

## 1. Executive Summary
Home Assistant Cowork is a next-generation AI assistant interface for Home Assistant (HA). Inspired by the "Claude Artifacts" UI paradigm, this project bridges the gap between conversational AI and interactive smart home management. 

Instead of generating YAML for the user to copy/paste, or returning plain text lists of device states, Cowork dynamically renders native Home Assistant UI components (Lovelace cards, graphs, control entities) directly inline within the chat stream. 

## 2. Core Objectives & Target Use Cases
The system must be capable of interpreting natural language to perform complex HA tasks, returning both text explanations and interactive UI elements. 

* **Interact & Control:** Render inline toggles, sliders, or camera streams (e.g., "Show me the living room light controls").
* **Historic Data Visualization:** Generate `statistics-graph` or `history-graph` cards overlaid with requested data (e.g., "Compare energy usage for the past two weeks").
* **Automation Configuration & Debugging:** Fetch automation traces, explain failure points in natural language, and render UI tools to edit or override the logic.
* **Dashboard Generation:** Prototype Lovelace views on the fly based on user prompts.
* **Integration Setup:** Guide the user through integration configurations with actionable inline steps.

## 3. High-Level Architecture
To achieve native UI rendering and deep integration with HA internals, the project will be built as a **Custom Integration** paired with a **Custom Lovelace Panel**, distributed via the Home Assistant Community Store (HACS). 

This approach ensures compatibility across all HA installation types (Core, Container, Supervised, OS) and avoids the limitations of isolated Add-on containers.

### 3.1. Backend: Custom Integration (Python)
The backend acts as the orchestrator between Home Assistant Core and the external LLM API (e.g., OpenAI, Anthropic, Gemini).
* **Location:** Runs within the HA event loop (`custom_components/cowork/`).
* **Responsibilities:**
    * Manage LLM API authentication and session state.
    * Register WebSocket endpoints for frontend communication.
    * Expose HA internals (states, history, device registry) to the LLM via defined "Tools" or "Function Calling."
    * Implement Context Retrieval/RAG: Filter and inject only relevant entity states into the LLM context window to optimize latency and token usage.

### 3.2. Frontend: Custom Lovelace Panel (TypeScript / LitElement)
The frontend provides the conversational UI and handles the dynamic rendering of HA components.
* **Location:** Served natively via the HA web server. Appears as a sidebar item.
* **Responsibilities:**
    * Provide a modern, chat-like interface.
    * Maintain the WebSocket connection to the Python backend.
    * **The Artifact Engine:** Parse structured JSON payloads from the LLM containing standard HA `card_config` data.
    * Dynamically instantiate HTML elements (e.g., `<hui-tile-card>`), inject the global `hass` object, and mount them inline within the chat log.

## 4. Functional Requirements

### 4.1. LLM Integration & Tooling
* **REQ-1:** The backend must support tool-calling/function-calling capabilities.
* **REQ-2:** Implement a `respond_with_ui(card_type, config)` tool that the LLM is prompted to use when visual representation is required.
* **REQ-3:** Implement data-fetching tools (e.g., `get_entities_by_domain()`, `get_entity_history()`) that the LLM can use iteratively before generating a final response.

### 4.2. Frontend Rendering
* **REQ-4:** The frontend must accept standard Lovelace YAML/JSON configurations.
* **REQ-5:** The rendered inline cards must be fully interactive and reactive (e.g., toggling a light in the chat turns off the physical light and updates the card state instantly).

## 5. Areas for Investigation & Technical Spikes
The development team should prioritize researching the following areas before full implementation:

1.  **Dynamic Component Loading (Lovelace):** * *Question:* How do we cleanly instantiate standard HA cards (like `hui-entities-card` or `hui-statistics-graph-card`) dynamically via JavaScript if they haven't been pre-loaded by the main dashboard? 
    * *Spike:* Create a proof-of-concept Lit element that takes a raw JSON config and successfully renders a core HA card using the `createCardElement` helper (or equivalent) from HA's frontend repo.
2.  **Custom Card Compatibility:**
    * *Question:* Will the Artifact Engine be able to render popular community custom cards (e.g., Mushroom Cards, ApexCharts) if they are installed on the user's system?
3.  **Context Window Management & RAG Strategy:**
    * *Question:* Feeding the entire HA state machine to an LLM on every prompt is impossible. What is the most performant way to search and retrieve only relevant entities based on the user's natural language prompt *before* sending the payload to the LLM?
4.  **Event Loop Blocking:**
    * *Question:* LLM API calls are inherently slow network requests. Ensure the Python backend utilizes `asyncio` properly so that waiting for an LLM response does not block the main Home Assistant event loop.

## 6. Phased Rollout Plan
* **Phase 1 (Foundation):** Basic Custom Integration boilerplate + Custom Panel. Establish WebSocket communication. Send text to backend, echo text back.
* **Phase 2 (The Artifact Engine):** Hardcode a JSON card configuration in the backend and successfully render it as a live, interactive Lovelace card in the frontend chat UI.
* **Phase 3 (LLM Connection):** Integrate the LLM API. Implement basic entity filtering and prompt the LLM to generate card configurations for simple requests (e.g., toggles and entities cards).
* **Phase 4 (Advanced Tooling):** Add support for history queries, graph generation, and automation trace debugging.
