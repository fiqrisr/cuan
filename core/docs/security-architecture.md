# Security Architecture & Hardening Guide

## Overview & Trust Boundaries

Cuan is a financial management platform comprising an Elysia.js backend running on Cloudflare Workers (`core`), a React 19 SPA (`web`), an Astro marketing site (`landing`), and shared UI/middleware packages.

Security is governed by a **Three-Tier Boundary System**:
1. **External Ingress Boundary**: Client HTTP requests, auth cookies, chat inputs, and telemetry submissions. Every incoming payload is treated as untrusted and validated against strict schemas before execution.
2. **Internal Business Logic & Multi-Tenant Boundary**: Database operations and AI tool handlers. All financial entities (`financial_accounts`, `transactions`, `categories`) must be bound to the authenticated `userId`. Cross-tenant mutations are prevented by explicit ownership checks.
3. **AI / LLM Model Boundary**: Prompts and conversational turns sent to LLMs (OpenAI, Anthropic, Gemini). System prompts are supplemented by strict code-level permission gates. Output from tools and models is defensively typed and validated.

```
[ Web SPA / Mobile ]
        │
        ▼ (HTTPS, Auth Cookies, Strict CORS)
[ Cloudflare Worker (core) ]
  ├── Security Headers Middleware (CSP, HSTS, nosniff, DENY)
  ├── Rate Limiter (IP & Tier-based: auth, chat, api)
  ├── CORS Origin Validator (Whitelisted Frontends)
  ├── Auth Guard (better-auth session validation)
  └── TypeBox DTO Validation
        │
        ├──▶ [ AI Intent / LLM Gateway ] (Authoritative DB History, Bounded Turns)
        │       └── Tools (handleAddTransaction, query, transfer)
        │
        └──▶ [ Cloudflare D1 (SQLite) ] (Atomic db.batch updates, Ownership Checks)
```

---

## 1. Authentication & Session Management

- **Framework**: `better-auth` backed by Cloudflare D1 SQLite tables (`user`, `session`, `account`, `verification`).
- **Session Transport**: HTTP-only, secure, SameSite cookies.
- **Route Protection**: Elysia macro `authGuard` (`core/src/modules/auth/auth-guard.ts`) automatically extracts the `Session` from D1 and injects the authenticated `user` and a scoped logger `log` into the route context.
- **Session Validation**: Requests missing valid sessions fail immediately with `401 Unauthorized` before reaching route handlers.

---

## 2. Authorization & Multi-Tenant Isolation

### IDOR (Insecure Direct Object Reference) Prevention
- In Cloudflare D1, SQLite tables partition rows by `user_id`.
- **Transaction Creation (`POST /api/transactions`)**:
  - `data.accountId` (if provided) is verified to belong to `data.userId` before creating the transaction or adjusting balances.
  - `data.categoryId` is verified to belong to `data.userId` or be a global system category (`user_id IS NULL`).
  - Batch balance updates enforce `eq(financialAccounts.id, data.accountId)` **and** `eq(financialAccounts.userId, data.userId)`.
- **Transaction Updates / Deletes**:
  - Updates verify that both the transaction and any target account belong to the authenticated user.
  - Deletions are scoped strictly to `eq(transactions.userId, userId)`.

### Atomic Balance Synchronization
- Cloudflare D1 does not support interactive transactions.
- **Invariant**: Any modification to a transaction that affects balances must update `transactions` and `financial_accounts` atomically inside `db.batch([...])`.
- Both REST endpoints and chat tools (`handleAddTransaction`, `handleUpdateTransaction`, `handleDeleteTransaction`, `handleTransferFunds`) execute atomic batch statements with SQL-level delta calculations to prevent race conditions and lost updates.

---

## 3. AI & Chat Input Security (OWASP Top 10 for LLMs)

### Prompt Injection & History Spoofing Defense (LLM01)
- **Authoritative Server History**: Conversational context is reconstructed from the server's persisted `chat_messages` table in D1.
- **Client History Untrusted**: Client-provided `history` arrays are never permitted to override or poison existing server conversation turns. If database history exists, client history is ignored. If used as an initial fallback, turns are strictly filtered and truncated.
- **Code-Enforced Permissions**: The LLM is never trusted to enforce authorization. All tools (`buildChatTools(userId)`) receive the verified `userId` directly from the session context, and tool handlers validate ownership independently.

### Unbounded Consumption & DoS Defense (LLM10)
- **Message Size Limits**: `CreateChatRequestDto` restricts `message` to `minLength: 1, maxLength: 2000`.
- **History Limits**: The `history` array is constrained to `maxItems: 30`, with each item's content capped at 2,000 characters.
- **Token Control**: LLM calls specify `stopWhen: stepCountIs(3)` to prevent recursive or unbounded tool calling loops.

---

## 4. API Input Boundaries & Defensive Headers

### Schema Validation at Boundaries
All REST endpoints use explicit Elysia TypeBox (`t`) DTOs enforcing:
- Minimum and maximum string lengths (`name`, `description`, `label`, `currency`).
- Numeric boundaries (`amount >= 0` with sensible maximum ceilings).
- ISO date length and format bounds.

### Category Namespace Protection
- Custom category names are slugified (`toLowerCase().trim().replace(/\s+/g, '-')`) before existence checks and insertion.
- Users cannot create categories that conflict with global system categories (`user_id IS NULL`), preventing category hijacking in fund transfer and classification logic.

### HTTP Defensive Security Headers
Configured on all responses via `securityHeaders` middleware:
- `X-Content-Type-Options: nosniff`: Blocks MIME-type sniffing.
- `X-Frame-Options: DENY`: Prevents UI clickjacking in frames/iframes.
- `Referrer-Policy: strict-origin-when-cross-origin`: Restricts referrer leakage.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`: Enforces HTTPS transport.

### Strict CORS Policy
- Wildcard origin reflection with credentials is prohibited across all routes, rate-limit responses, and error handlers.
- Origins are validated against `isAllowedOrigin()`:
  - Development/Test: Whitelists `http://localhost:<port>` and `http://127.0.0.1:<port>`.
  - Production: Strictly permits `env.FRONTEND_URL`.

---

## 5. Telemetry & Operational Security

- **Log Injection Defense**: All user-influenced strings passed to structured logging (e.g. telemetry names, client IPs, request IDs) are sanitized by stripping ASCII control characters (`[\x00-\x1F\x7F]`) to prevent log forging and carriage return attacks.
- **Sensitive Key Redaction**: Client telemetry sanitizes payloads against patterns for passwords, tokens, secrets, account numbers, and credit cards.
- **Metrics Protection**: `/metrics` supports `METRICS_SECRET` authorization (`Authorization: Bearer <secret>`) to restrict internal operational metrics in production.

---

## 6. Threat Model (STRIDE Summary)

| Threat Category | Potential Attack Vector | Applied Mitigation |
|---|---|---|
| **Spoofing** | Attacker impersonates another user or injects fake assistant turns | Better-auth session verification; authoritative server-side chat history in D1. |
| **Tampering** | Attacker alters another user's account balance by passing their `accountId` | Strict account ownership check (`eq(userId, data.userId)`) and atomic `db.batch()` updates. |
| **Repudiation** | Actions denied without evidence | Correlated structured logging (`X-Request-Id`) across all authentication and transaction events. |
| **Information Disclosure** | Cross-origin attacker reads rate-limit error responses or internal system errors | Validated CORS origin checks; production error sanitizer hiding internal details. |
| **Denial of Service** | Oversized chat payloads or infinite history exhausting LLM tokens and memory | Strict length limits on `message` (2,000 chars) and `history` (30 items), plus multi-tier rate limiting. |
| **Elevation of Privilege** | Normal user creating or overriding system categories or accessing admin routes | Server-enforced system category immutability; role checks on administrative endpoints. |
