# ADR-004: Money Storage and Atomic Balances

## Status
Accepted

## Date
2026-06-26

## Context
We need to store transaction amounts and account balances in PostgreSQL. Financial applications require exact precision. Floating-point math (e.g., standard JavaScript `number` mapped to a PostgreSQL `real` or `double precision`) introduces rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`).

Furthermore, an account's running balance must stay perfectly synchronized with its linked transactions.

## Decision
1. Store all monetary values as `numeric(15,2)` or `numeric(12,2)` in PostgreSQL using Drizzle's `numeric` type.
2. Update account balances **atomically** inside database transactions alongside the transaction creation/modification.

## Alternatives Considered

### Storing as Integer (Cents)
- **Pros:** Completely avoids floating-point issues; fast arithmetic.
- **Cons:** Requires dividing/multiplying by 100 on every API request and UI render. Can get complicated if supporting currencies with 0 or 3 decimal places (e.g., JPY, BHD).
- **Rejected:** PostgreSQL's `numeric` type is heavily optimized and handles decimal precision perfectly without the mental overhead of converting cents in the application layer.

### Calculating Balance on the Fly (SUM)
- **Pros:** Impossible for the running balance to fall out of sync with transactions.
- **Cons:** `SELECT SUM(amount)` becomes progressively slower as the user adds thousands of transactions.
- **Rejected:** Read performance for listing accounts is critical. A cached running balance is necessary.

## Consequences
- **Positive:** Exact precision for money. Fast reads for account balances.
- **Gotchas:** 
  - JavaScript still uses IEEE 754 floats. When parsing `numeric` from Postgres (which `pg` often returns as strings to avoid precision loss), we must be careful with math in the Node/Bun layer.
  - **Invariant:** *Every* insert, update, or delete on the `transactions` table MUST be wrapped in a `db.transaction()` that simultaneously updates the `financial_accounts` balance. Failing to do so will corrupt the user's running balance.
