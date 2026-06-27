# Feature: Chat Interface

The chat module is the primary natural-language interface for Cuan. It allows users to manage transactions, query their data, and manage their accounts without navigating complex UI forms.

## Context & Rationale
Rather than using complex UI forms, Cuan leverages AI to parse natural language into structured actions.
We use a Vercel AI SDK Tool Calling architecture. The AI acts as a parser and conversationalist, deciding which tool to trigger. The backend executes the actual SQL queries securely and returns raw JSON data back to the AI. Finally, the AI summarizes the result conversationally. This prevents hallucination and SQL injection risks while preserving a dynamic chat experience.
## Architecture

- **Endpoint:** `POST /api/chat`
- **Controller:** `chat.controller.ts` routes the incoming message to the `ChatService`.
- **Service:** `chat.service.ts` calls the LLM (via `openmodel`) to classify the user's **intent**.
- **Handlers:** 
  - `add-transaction.handler.ts`
  - `manage-account.handler.ts`
  - `query.handler.ts`

## 4-Intent Tool System

The LLM uses predefined tools (`chat.tools.ts`) to fulfill user intents.

### 1. `add_transaction`
Used when the user wants to add one or more transactions (expenses or incomes).
- **Behavior:**
  - The LLM extracts transactions and triggers the `add_transaction` tool.
  - If `accountName` is omitted, the system falls back to the user's **default account**.
  - All extracted transactions are inserted into the database.
  - The handler returns the raw saved records, and the LLM formulates a confirmation message.

### 2. `query_finances`
Used for analytical questions about the user's data (e.g., "what's my biggest expense this week?").
- **Behavior:**
  - The LLM identifies the `queryType` (e.g., `biggest_expense`, `total_spent`, `category_breakdown`) and any `filters`.
  - The backend executes the real, safe Drizzle ORM query on the PostgreSQL database.
  - The backend returns raw data (e.g. `{ total: 50000 }`) to the LLM.
  - The LLM reads this real data to generate an accurate, conversational response without hallucinating.

### 3. `manage_account`
Used for account management operations via chat.
- **Behavior:**
  - The LLM extracts the action (`create_account`, `set_default`, `list_accounts`) and parameters.
  - Executes the requested action securely in the database.
  - The LLM receives the result and generates a confirmation reply.
### 4. `manage_category`
Used for custom category management operations via chat.
- **Behavior:**
  - The LLM extracts the action (`create_category`, `rename_category`, `list_categories`) and category names.
  - Executes the requested action securely in the database, tying custom categories to the user's ID.
  - The LLM receives the result and generates a confirmation reply.

## OpenModel Client
The interaction with the LLM is abstracted via `openmodel/index.ts`. It acts as an OpenAI-compatible client, configured via environment variables (`OPENMODEL_API_KEY`, `OPENMODEL_BASE_URL`, `OPENMODEL_MODEL`), meaning it can swap between OpenAI, DeepInfra, Groq, Anthropic (via Vercel AI SDK), or local models seamlessly.

## Known Gotchas

- **Tool Fallbacks:** The AI might occasionally hallucinate an unsupported tool or format. Vercel AI SDK handles retries automatically up to the `maxSteps` loop limit.
- **Account Matching:** The AI is instructed to return an `accountName`. If the user has multiple accounts with similar names, the handler must carefully match the exact name (case-insensitive) against the database.
- **Stateless LLM:** This iteration of the chat endpoint does not retain conversation history. Each request is evaluated entirely independently via a single `generateText` multi-step call.
