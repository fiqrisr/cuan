# Feature: Chat Interface

The chat module is the primary natural-language interface for Cuan. It allows users to manage transactions, query their data, and manage their accounts without navigating complex UI forms.

## Context & Rationale
Rather than using complex UI forms, Cuan leverages AI to parse natural language into structured actions.
We chose a structured "Intent" classification system instead of letting the AI generate raw SQL or answer freely. This prevents hallucination (a critical requirement for financial data) and completely eliminates SQL injection risks. The AI acts only as a parser; the backend retains full control over database execution.

## Architecture

- **Endpoint:** `POST /api/chat`
- **Controller:** `chat.controller.ts` routes the incoming message to the `ChatService`.
- **Service:** `chat.service.ts` calls the LLM (via `openmodel.ts`) to classify the user's **intent**.
- **Handlers:** 
  - `add-transaction.handler.ts`
  - `manage-account.handler.ts`
  - `query.handler.ts`

## 3-Intent System

The LLM classifies incoming messages into one of three intents and extracts structured data based on it.

### 1. `add_transaction`
Used when the user wants to add one or more transactions (expenses or incomes).
- **Extraction Schema:**
  ```ts
  {
    intent: 'add_transaction';
    transactions: Array<{
      type: 'expense' | 'income';
      amount: number;
      currency: string;
      category: string;
      description: string;
      date: string; // ISO 8601
      accountName?: string;
    }>;
    reply: string;
  }
  ```
- **Behavior:**
  - If `accountName` is omitted, the system falls back to the user's **default account**.
  - All extracted transactions are inserted in a single database transaction.
  - Account balances are updated atomically (deducts for expenses, adds for incomes).

### 2. `query`
Used for analytical questions about the user's data (e.g., "what's my biggest expense this week?").
- **Extraction Schema:**
  ```ts
  {
    intent: 'query';
    query: {
      queryType: string; // e.g., 'biggest_expense', 'total_spent', 'recent_transactions'
      filters: {
        period?: { from: string; to: string };
        category?: string;
        accountName?: string;
        type?: 'expense' | 'income';
        limit?: number;
      };
    };
    reply: string;
  }
  ```
- **Behavior:**
  - The AI does **not** hallucinate financial data. It returns the query descriptor.
  - The backend executes the real SQL query on the database using the filters provided.
  - The real result is formatted and returned to the user in a human-readable reply.

### 3. `manage_account`
Used for account management operations via chat.
- **Extraction Schema:**
  ```ts
  {
    intent: 'manage_account';
    action: 'create_account' | 'set_default' | 'list_accounts';
    accountName?: string;
    accountType?: string;
    currency?: string;
    initialBalance?: number;
    reply: string;
  }
  ```
- **Behavior:**
  - Executes the requested action (creating an account, changing the default account, etc.).
  - Returns a confirmation reply.

## OpenModel Client
The interaction with the LLM is abstracted via `openmodel.ts`. It acts as an OpenAI-compatible client, configured via environment variables (`OPENMODEL_API_KEY`, `OPENMODEL_BASE_URL`, `OPENMODEL_MODEL`), meaning it can swap between OpenAI, DeepInfra, Groq, Anthropic (via Vercel AI SDK), or local models seamlessly.

## Known Gotchas

- **AI Output Parsing:** The AI might occasionally generate malformed JSON. The `openmodel.ts` client must strictly validate the output against Zod schemas (`openmodel.schema.ts`) and handle retries or graceful fallbacks.
- **Account Matching:** The AI is instructed to return an `accountName`. If the user has multiple accounts with similar names, the handler must carefully match the exact name (case-insensitive) against the database.
- **Stateless LLM:** This iteration of the chat endpoint does not retain conversation history. Each request is evaluated entirely independently.
