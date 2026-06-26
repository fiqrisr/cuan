# ADR-003: AI Intent Routing System

## Status
Superseded by ADR-005

## Date
2026-06-26

## Context
Cuan's primary user interface is a chat box. Initially, the chat only extracted a single expense transaction. We need to expand this so users can:
- Add multiple transactions at once.
- Ask questions about their financial data (e.g., "how much did I spend on food?").
- Manage their accounts (e.g., "create a BCA bank account").

We need a system that can understand the user's goal without hallucinating financial data.

## Decision
Implement a **3-Intent AI Classification System** (`add_transaction`, `query`, `manage_account`). 
Instead of the LLM answering everything directly, the LLM outputs a **structured JSON descriptor** (e.g., `{ intent: 'query', queryType: 'biggest_expense', filters: {...} }`). The backend then executes real SQL queries and formats the response.

## Alternatives Considered

### Direct LLM Querying (RAG / SQL Generation)
- **Pros:** Maximum flexibility; the user can ask anything.
- **Cons:** High risk of hallucination. Generating raw SQL from user input is a massive security risk (SQL Injection) and prone to syntax errors.
- **Rejected:** Financial data requires 100% accuracy. We cannot trust an LLM to write raw SQL or do math on raw data.

### Standard UI Forms
- **Pros:** Deterministic, easy to validate, traditional.
- **Cons:** Defeats the unique value proposition of Cuan (frictionless, natural language entry).
- **Rejected:** We want to maintain a chat-centric UX.

## Consequences
- **Positive:** We get the UX of a chatbot but the deterministic safety of hard-coded SQL queries. The LLM acts purely as a Natural Language to JSON parser.
- **Negative:** Users are restricted to the `queryTypes` we explicitly support. Arbitrary questions ("predict my spending next month") won't work until we build specific handlers for them.
- **Gotchas:** 
  - The AI prompt must heavily emphasize returning exact category and account names matching the user's DB. 
  - Validation (via Zod) is mandatory on the AI's output to ensure it matches the required schema before processing.
