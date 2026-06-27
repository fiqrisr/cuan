# Implementation Plan: Chat Querying via Tool Calling

## Overview
Refactor the chat system from a single-shot JSON extractor (`generateObject`) to an iterative, agentic tool-calling flow (`generateText` with `maxSteps`). This will allow the LLM to understand the user's intent, call predefined tools (handlers) to execute database queries or mutations, read the returned structured data, and formulate a natural language response.

## Architecture Decisions
- **Keep `ChatResult` API Contract:** The API response will remain identical (returning `intent`, `reply`, and structured data like `transactions` or `queryResult`). We will derive the structured data by inspecting the `toolResults` array returned by the AI SDK.
- **Move Tools to Service Layer:** `openmodel.ts` will solely be responsible for configuring and returning the provider model. `chat.service.ts` will define the Vercel AI SDK tools since tools need access to business logic/handlers (e.g., `db`).
- **Retain Zod Schemas:** We will reuse the schemas from `openmodel.schema.ts` as the `parameters` definition for our tools.

## Task List

### Phase 1: Foundation
- [ ] **Task 1: Update `openmodel.ts` and its test**
  - Refactor `createOpenModelClient` to expose the underlying `LanguageModel` instance instead of a rigid `chat()` method.
  - Update `openmodel.test.ts` to reflect this simpler wrapper interface.

### Phase 2: Tool Integration
- [ ] **Task 2: Adapt Handlers to return raw data**
  - Modify `query.handler.ts`, `add-transaction.handler.ts`, and `manage-account.handler.ts`.
  - Remove hardcoded static strings (e.g., `"Ringkasan per kategori: ..."`, `"Berhasil menambahkan..."`).
  - Have them simply execute DB operations and return raw JSON data (e.g., `return { breakdown: [...] }`).
- [ ] **Task 3: Define AI Tools in `chat.service.ts`**
  - Import `tool` from `ai`.
  - Create the `tools` object containing `add_transaction`, `query_finances`, and `manage_account`.
  - Wire the `execute` functions to the adapted handlers from Task 2.

### Phase 3: Core Refactor & Polish
- [ ] **Task 4: Implement `generateText` in `chat.service.ts`**
  - Replace the old `generateObject` flow with `generateText`.
  - Configure `maxSteps: 3` (allowing the LLM to call a tool, read the result, and reply).
  - Construct the `ChatResult` by taking the LLM's final natural language output as `reply`, and mapping `toolResults` back to `intent` and payload (`transactions`, `queryResult`, etc.).
- [ ] **Task 5: Update `chat.test.ts`**
  - The test currently expects the mock LLM server to return JSON for `generateObject`.
  - Update the mock to simulate Vercel AI SDK tool-calling HTTP responses (or use `bun test` specific mocking if applicable).

### Checkpoint: Complete
- [ ] All `bun run test` tests pass.
- [ ] Manual test: Ask "berapa pengeluaran hari ini?" and verify the bot responds naturally based on actual DB data.

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| E2E Tests breaking due to mock format | High | The AI SDK expects a specific wire format for tool-calling when we mock the server. We will carefully update the HTTP mock in `chat.test.ts` to match Anthropic/OpenAI tool-calling JSON schemas. |
| LLM decides not to call a tool | Med | Set a strong system prompt in `generateText` directing it to ALWAYS use tools for financial tasks, and explicitly describe the tools. |