# ADR-006: Security Architecture and Input Hardening

## Status
Accepted

## Date
2026-10-01

## Context
A comprehensive security audit of the Cuan monorepo identified several critical and high-priority vulnerability surfaces:
1. **Broken Object Level Authorization (IDOR)**: `transactionService.create()` accepted an arbitrary `accountId` without validating that the account belonged to the authenticated `userId`, allowing cross-tenant balance manipulation.
2. **AI Context Poisoning / Prompt Injection**: The chat endpoint accepted untrusted conversation history from the client, prioritizing it over the database and enabling attackers to forge assistant turns or few-shot jailbreaks.
3. **Unbounded Input Consumption**: Chat `message` and `history` lacked upper length bounds, exposing the application to LLM token exhaustion, high provider costs, and Worker memory starvation.
4. **Non-Atomic Chat Tool Mutations**: `handleAddTransaction` directly performed separate SQL insert and balance adjustment queries with floating-point math, creating race conditions and balance desynchronization.
5. **CORS Origin Reflection**: Error responses (HTTP 429 and 500) reflected arbitrary request origins with credentials enabled without validating against allowed frontend origins.
6. **Missing Defensive Headers**: The API lacked standard browser security headers (`X-Content-Type-Options`, `X-Frame-Options`, `HSTS`, `Referrer-Policy`).

## Decision

### 1. Multi-Tenant Account & Category Ownership Enforcement
- `transactionService.create()` must explicitly verify that `data.accountId` (if provided) and `data.categoryId` belong to the authenticated `data.userId` (or that the category is a system category where `user_id IS NULL`).
- Batch updates on `financialAccounts` must bind both `id` and `userId` in the `WHERE` clause.

### 2. Authoritative Server-Side Chat History
- The chat service must prioritize database records in `chat_messages` as the single source of truth for conversation turns.
- Client-provided `history` is treated as untrusted. If present, it is only consulted when no database records exist, and all turns are strictly filtered by allowed roles and capped at 2,000 characters.

### 3. Strict Input Boundaries on All DTOs
- `CreateChatRequestDto`: `message` is bounded between 1 and 2,000 characters; `history` is bounded to at most 30 items, each with content at most 2,000 characters.
- Transaction and financial account DTOs enforce maximum string lengths, ISO date formats, and reasonable maximum amounts.

### 4. Atomic Financial Chat Tools
- `handleAddTransaction` is refactored to delegate directly to `transactionService.create()`, ensuring all transaction insertions and running balance updates execute inside a single atomic D1 `db.batch()` call.

### 5. Strict CORS Validation & Defensive Headers
- Wildcard origin reflection on error paths is replaced with `isAllowedOrigin()` checks.
- A dedicated `securityHeaders` middleware injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security: max-age=31536000; includeSubDomains` on every response.

### 6. Category Namespace Protection & Log Sanitization
- Category names are slugified before existence checks and creation to prevent collision and shadowing of global categories.
- User-supplied telemetry input is sanitized by stripping control characters (`[\x00-\x1F\x7F]`) to prevent log injection.

## Consequences

- **Positive**:
  - Completely prevents cross-tenant balance tampering via IDOR.
  - Immunizes the AI assistant against client-injected history spoofing and jailbreak context poisoning.
  - Eliminates token exhaustion DoS vectors on LLM provider APIs.
  - Guarantees data integrity and balance consistency through atomic batch mutations.
  - Prevents credentialed cross-origin data leakage on error and rate-limit responses.
- **Invariants**:
  - Any future API endpoint or AI tool modifying transactions or accounts **MUST** enforce ownership against `session.user.id` and wrap balance adjustments in `db.batch()`.
  - Client-supplied state is never trusted as authoritative over database records.
