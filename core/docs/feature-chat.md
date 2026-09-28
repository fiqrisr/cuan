# Feature: Chat Interface

The chat module is the primary natural-language interface for Cuan. It allows users to manage transactions, query their data, and manage their accounts without navigating complex UI forms.

## Context & Rationale
Rather than using complex UI forms, Cuan leverages AI to parse natural language into structured actions.
We use a Vercel AI SDK Tool Calling architecture. The AI acts as a parser and conversationalist, deciding which tool to trigger. The backend executes the actual SQL queries securely and returns raw JSON data back to the AI. Finally, the AI summarizes the result conversationally. This prevents hallucination and SQL injection risks while preserving a dynamic chat experience.

## Architecture

- **Endpoints:**
  - `POST /api/chat`: Non-streaming endpoint returning full structured tool results and text response.
  - `POST /api/chat/stream`: SSE streaming endpoint returning incremental text deltas, reasoning, and tool states.
  - `GET /api/chat/messages`: Retrieves the authenticated user's recent persisted conversation history (up to 30 messages).
  - `DELETE /api/chat/messages`: Clears the authenticated user's conversation history.
- **Controller:** `chat.controller.ts` routes incoming messages and requests to `ChatService`.
- **Service:** `chat.service.ts` loads prior conversation turns, invokes the LLM (via Vercel AI SDK provider routing), coordinates tool execution, persists chat turns to Cloudflare D1, and enforces rolling retention limits.
- **Handlers:**
  - `add-transaction.handler.ts`
  - `update-transaction.handler.ts`
  - `delete-transaction.handler.ts`
  - `manage-account.handler.ts`
  - `manage-category.handler.ts`
  - `query.handler.ts`
  - `transfer-funds.handler.ts`

## 7-Intent Tool System

The LLM uses predefined tools (`chat.tools.ts`) to fulfill user intents.

### 1. `add_transaction`
Used when the user wants to add one or more transactions (expenses or incomes).
- **Behavior:**
  - The LLM extracts transactions and triggers the `add_transaction` tool.
  - If `accountName` is omitted, the system falls back to the user's **default account**.
  - All extracted transactions are inserted into the database, and account balances are updated.
  - The handler returns the raw saved records, and the LLM formulates a confirmation message.

### 2. `update_transaction`
Used when the user wants to edit, correct, or update an existing transaction (e.g. "Wait, typo, make it 50k", "Actually that coffee was from BCA", "Change the category to Groceries").
- **Behavior:**
  - Can target a specific `transactionId` or default automatically to the user's **most recent transaction**.
  - Updates only the specified fields (`amount`, `category`, `accountName`, `description`, `date`, `type`).
  - Delegates to `transactionService.update` to atomically adjust the linked financial account balance (or swap accounts) using `db.batch()`.
  - Returns the updated transaction details for the LLM to format a clear confirmation.

### 3. `delete_transaction`
Used when the user wants to cancel, undo, or delete a recorded transaction (e.g. "Cancel that last coffee", "Delete the expense I just entered", "Undo").
- **Behavior:**
  - Can target a specific `transactionId` or default to the user's **most recent transaction**.
  - Delegates to `transactionService.remove` to delete the transaction record and reverse the balance impact on the linked financial account inside an atomic `db.batch()` block.
  - Returns deleted transaction details so the LLM can confirm the deletion.

### 4. `query_finances`
Used for analytical questions about the user's data (e.g., "what's my biggest expense this week?").
- **Behavior:**
  - The LLM identifies the `queryType` (e.g., `biggest_expense`, `total_spent`, `category_breakdown`) and any `filters`.
  - The backend executes safe Drizzle ORM queries on Cloudflare D1.
  - The backend returns raw data (e.g. `{ total: 50000 }`) to the LLM.
  - The LLM reads this real data to generate an accurate, conversational response without hallucinating.

### 5. `manage_account`
Used for account management operations via chat.
- **Behavior:**
  - The LLM extracts the action (`create_account`, `set_default`, `list_accounts`) and parameters.
  - Executes the requested action securely in the database.
  - The LLM receives the result and generates a confirmation reply.

### 6. `manage_category`
Used for custom category management operations via chat.
- **Behavior:**
  - The LLM extracts the action (`create_category`, `rename_category`, `list_categories`) and category names.
  - Executes the requested action securely in the database, tying custom categories to the user's ID.
  - The LLM receives the result and generates a confirmation reply.

### 7. `transfer_funds`
Used when the user wants to transfer money between two of their own financial accounts.
- **Behavior:**
  - The LLM extracts the `sourceAccount`, `destinationAccount`, `amount`, and `date`.
  - The backend verifies both accounts exist, retrieves the system `transfer` category, and atomically records the transfer as two transaction entries.
  - The backend adjusts balances of both accounts atomically inside a D1 `db.batch()` block.
  - The handler returns the updated account balances and recorded transactions, allowing the LLM to format a detailed confirmation response.

## Conversational Memory & Persistence

To support continuous conversation and referential requests ("make *that* 50k", "delete *the last one*"):
1. **Multi-Turn Context:** Up to 29 previous conversation turns are loaded from the database or supplied in the request `history` payload and passed directly to `streamText`/`generateText`.
2. **D1 Message Persistence:** Chat turns are persisted to the `chat_messages` table (`id`, `user_id`, `role`, `content`, `tool_calls`, `created_at`) so conversations survive page reloads and device switches.
3. **Rolling Retention Pruning:** To optimize token usage and storage, message history is capped at 30 messages per user. Whenever new messages are saved, older messages beyond the most recent 30 are pruned automatically.

## OpenModel & Gemini Provider Routing
The interaction with the LLM is routed through `lib/ai-provider.ts`. Based on `AI_PROVIDER`, it selects either Google Gemini (`@ai-sdk/google`) or OpenModel/OpenAI-compatible endpoints (`@ai-sdk/openai`), configurable via environment variables (`OPENMODEL_API_KEY`, `OPENMODEL_BASE_URL`, `OPENMODEL_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`).

## Known Gotchas

- **Tool Fallbacks:** The AI might occasionally hallucinate an unsupported tool or format. Vercel AI SDK handles retries automatically up to the `stopWhen: stepCountIs(3)` limit.
- **Account Matching:** The AI is instructed to return an `accountName`. The handler matches the exact name against the user's database accounts or falls back to the default account.
- **Local Migrations:** When running local development (`wrangler dev`), ensure local migrations are applied using `bun run db:migrate:local` so that the `chat_messages` table is initialized in the local D1 state.
