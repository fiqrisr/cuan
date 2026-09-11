# ADR-004: Money Storage and Atomic Balances

## Status
Accepted

## Date
2026-06-26

## Context
We need to store transaction amounts and account balances in Cloudflare D1. Financial applications require exact precision. Floating-point math (e.g., standard JavaScript `number` mapped to a SQLite `real`) introduces rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`).

Furthermore, an account's running balance must stay perfectly synchronized with its linked transactions.

## Decision
1. Store all monetary values as `text` (decimal strings) in Cloudflare D1 to preserve exact precision.
2. Update account balances **atomically** inside D1 `db.batch()` calls alongside the transaction creation/modification.

## Alternatives Considered

### Storing as Integer (Cents)
- **Pros:** Completely avoids floating-point issues; fast arithmetic.
- **Cons:** Requires dividing/multiplying by 100 on every API request and UI render. Can get complicated if supporting currencies with 0 or 3 decimal places (e.g., JPY, BHD).
- **Rejected:** Cloudflare D1 is SQLite-based and lacks a native exact decimal type. Storing values as `text` decimal strings avoids the mental overhead of converting cents in the application layer while preserving precision.

### Calculating Balance on the Fly (SUM)
- **Pros:** Impossible for the running balance to fall out of sync with transactions.
- **Cons:** `SELECT SUM(amount)` becomes progressively slower as the user adds thousands of transactions.
- **Rejected:** Read performance for listing accounts is critical. A cached running balance is necessary.

## Consequences
- **Positive:** Exact precision for money. Fast reads for account balances.
- **Gotchas:** 
  - JavaScript still uses IEEE 754 floats. Monetary values are stored as text in D1 and must be parsed with a decimal-safe library before any math in the Bun layer.
  - **Invariant:** *Every* insert, update, or delete on the `transactions` table MUST be wrapped in a `db.batch()` that simultaneously updates the `financial_accounts` balance. Failing to do so will corrupt the user's running balance.
