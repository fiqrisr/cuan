# ADR-005: Use LLM Tool Calling for Chat Intents

## Status
Accepted | Supersedes ADR-003

## Date
2026-06-26

## Context
Previously (ADR-003), we used a single-shot JSON extractor (`generateObject`) to classify chat intents into a rigid discriminant schema. This approach forced handlers to hardcode static string replies (e.g., "Ringkasan per kategori: ...") and restricted the LLM from generating natural, conversational responses based on the actual retrieved data.

We need the LLM to function as a two-way financial assistant that can dynamically write replies based on actual database query results, while maintaining the same security guarantee (no hallucinated data, no raw SQL execution).

## Decision
Refactor the chat system to use the Vercel AI SDK's native **Tool Calling** architecture (`generateText` with `maxSteps`/`stopWhen`).

1. The LLM receives the user prompt and decides which tool to call (`add_transaction`, `query_finances`, `manage_account`).
2. The backend executes the specific tool, running safe, parameterized Drizzle ORM queries against the PostgreSQL database.
3. The raw JSON results (e.g., `{ total: 50000 }`) are returned to the LLM.
4. The LLM reads the result and formulates a completely natural, conversational response based on those facts.

## Alternatives Considered

### Keep Single-Shot `generateObject`
- Pros: Simple, fast, deterministic.
- Cons: Formatting dynamic data requires hardcoded template strings in the backend, removing the conversational nature of the AI.

### RAG (Retrieval-Augmented Generation)
- Pros: Natural conversation.
- Cons: Hard to filter structured, precise numerical data based on exact SQL queries.
- Rejected: RAG is meant for semantic text search, not deterministic financial aggregations.

## Consequences
- **Positive:** Chat responses are highly natural and context-aware. The backend code is cleaner because presentation logic is shifted to the LLM. We retain 100% control over database execution safety.
- **Negative:** Slower response times (two LLM roundtrips per query: one to call the tool, one to write the reply) and higher token usage.
- **Gotchas:** 
  - Vercel AI SDK generic type inference breaks when `z.object` contains `.transform()` methods. Explicit variables and `@ts-expect-error` flags are required at the tool definition boundary.
  - Test suites must be carefully structured to simulate tool call loops and `toolResults` injection.
