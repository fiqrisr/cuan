# Spec: Chat-Centric System with Accounts & Transaction Management

## Objective

Transform Cuan's backend from a single-transaction-per-chat expense tracker into a **chat-centric financial management system** where:

- **Chat is the primary interface.** Users can add one or many transactions, query their financial data, and manage accounts — all via natural language.
- **Financial accounts** (bank accounts, e-wallets, cash) replace the implicit single-wallet model. Each account has a name, type, currency, and running balance.
- **Default account** lets short-form input work: `"coffee 20000 idr"` → deducts from the user's chosen default account automatically.
- **Analytical queries** like `"what's my biggest expense this week?"` are answered with real data from the database, not hallucinated numbers.
- **REST endpoints** for transactions allow listing, filtering, and manual editing outside of chat.

### User Stories

1. As a user, I can chat `"coffee 15k, lunch 30k, grab 25k"` and all three expenses are saved against my default account.
2. As a user, I can chat `"income salary 10000000 to BCA"` and my BCA account balance increases.
3. As a user, I can chat `"create account BCA bank IDR 5000000"` and a new financial account is created.
4. As a user, I can chat `"set default account BCA"` and future short-form chats use that account.
5. As a user, I can chat `"what's my biggest expense this week?"` and get an accurate answer computed from my actual transaction data.
6. As a user, I can `GET /api/transactions?type=expense&from=2025-06-01&to=2025-06-30` to see filtered transactions.
7. As a user, I can `PATCH /api/transactions/:id` to manually edit a transaction's amount, description, category, or date.
8. As a user, I can `DELETE /api/transactions/:id` to remove a transaction.

## Tech Stack

- **Runtime:** Bun 1.3.14
- **Framework:** Elysia.js 1.4.x
- **ORM:** Drizzle ORM 0.45.x with `pg` driver
- **Database:** PostgreSQL 15 (Docker, port 5433)
- **Auth:** Better Auth (email/password, session cookies)
- **AI:** Vercel AI SDK (`ai` + `@ai-sdk/openai` / `@ai-sdk/anthropic`) via OpenModel env config
- **Validation:** Zod 4.x (schemas), Elysia `t` (route bodies)
- **Formatter/Linter:** Biome 2.5

## Commands

| Purpose              | Command                                              |
| -------------------- | ---------------------------------------------------- |
| Install deps         | `bun install`                                        |
| Dev server           | `cd core && bun run dev`                             |
| Build                | `cd core && bun run build`                           |
| Run tests            | `cd core && bun run test`                            |
| Typecheck            | `cd core && bun run typecheck`                       |
| Generate migration   | `cd core && bunx drizzle-kit generate`               |
| Run migrations       | `cd core && bun run db:migrate`                      |
| Push schema (dev)    | `cd core && bun run db:push`                         |
| Seed categories      | `cd core && bun run db:seed`                         |
| Reset dev DB         | `cd core && bun run db:reset`                        |
| Lint                 | `bun run lint`                                       |
| Format               | `bun run format`                                     |

## Project Structure

```
core/src/
├── index.ts                          # Server entry, graceful shutdown
├── app.ts                            # Elysia app, route mounting, error handler
├── db/
│   └── schema.ts                     # Barrel re-export of all module schemas
├── lib/
│   ├── env.ts                        # Zod env validation
│   ├── db.ts                         # pg Pool + Drizzle instance
│   ├── auth.ts                       # Better Auth config
│   ├── auth-guard.ts                 # Elysia auth macro
│   ├── openmodel.ts                  # AI SDK client factory
│   └── openmodel.schema.ts           # Zod schemas for AI structured output
├── modules/
│   ├── auth/
│   │   ├── auth.schema.ts            # Drizzle: user, session, account, verification
│   │   └── auth.types.ts             # AuthContext type
│   ├── category/
│   │   └── category.schema.ts        # Drizzle: categories table
│   ├── chat/
│   │   ├── chat.controller.ts        # POST /api/chat (enhanced)
│   │   ├── chat.service.ts           # Intent routing, multi-tx, queries
│   │   ├── chat.schema.ts            # Elysia body schema
│   │   └── index.ts                  # Barrel
│   ├── financial-account/            # NEW
│   │   ├── financial-account.schema.ts   # Drizzle: financial_accounts table
│   │   ├── financial-account.service.ts  # CRUD + default account logic
│   │   ├── financial-account.controller.ts # REST endpoints
│   │   └── index.ts
│   └── transaction/
│       ├── transaction.schema.ts     # Drizzle: transactions table (+ accountId FK)
│       ├── transaction.service.ts    # NEW: CRUD, filtering, balance updates
│       ├── transaction.controller.ts # NEW: GET/PATCH/DELETE endpoints
│       └── index.ts
```

## Database Changes

### New table: `financial_accounts`

| Column       | Type              | Notes                                      |
| ------------ | ----------------- | ------------------------------------------ |
| id           | uuid PK           | `gen_random_uuid()`                        |
| user_id      | text FK → user.id | `ON DELETE CASCADE`                        |
| name         | text NOT NULL      | User-facing name, e.g. "BCA", "GoPay"     |
| type         | text NOT NULL      | `bank`, `e-wallet`, `cash`, `other`        |
| currency     | text NOT NULL      | 3-letter ISO code, default `IDR`           |
| balance      | numeric(15,2)     | Running balance, default `0`               |
| is_default   | boolean           | Only one per user can be `true`            |
| created_at   | timestamptz       | `DEFAULT now()`                            |
| updated_at   | timestamptz       | `DEFAULT now()`                            |

**Constraint:** unique index on `(user_id, name)` — a user can't have two accounts with the same name.

**Default account invariant:** At most one account per user has `is_default = true`. Setting a new default clears the old one in the same transaction.

### Modified table: `transactions`

| Column       | Change                                            |
| ------------ | ------------------------------------------------- |
| account_id   | **ADD** uuid FK → financial_accounts.id, NULLABLE |

`account_id` is nullable to preserve existing rows. New transactions created via chat will always have an `account_id` (default account fallback). When an account is linked, inserting an expense decreases the account balance; inserting an income increases it. Deleting/editing a transaction reverses/adjusts the balance.

## AI Chat Intent System

The current single-purpose chat (always extract one transaction) is replaced with a **3-intent classification**:

### Intent: `add_transaction`
- Extracts **one or more** transactions from the message.
- Each transaction: `{ type, amount, currency, category, description, date, accountName? }`.
- If `accountName` is absent or null, use the user's default account.
- All transactions are inserted in a single DB transaction; account balances are updated atomically.

### Intent: `query`
- The user is asking an analytical question about their data.
- The LLM returns a structured query descriptor: `{ queryType, filters }`.
- `queryType` examples: `biggest_expense`, `total_spent`, `total_income`, `transaction_count`, `recent_transactions`.
- `filters`: `{ period?, category?, accountName?, type?, limit? }`.
- The backend executes the real SQL query, formats the result, and returns it with a human-readable reply.

### Intent: `manage_account`
- Account operations: `create_account`, `set_default`, `list_accounts`.
- The LLM extracts: `{ action, accountName?, accountType?, currency?, initialBalance? }`.
- The backend executes the operation and returns a confirmation reply.

### Schema (structured output from LLM)

```ts
// The LLM returns one of:
type ChatAIResponse =
  | {
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
  | {
      intent: 'query';
      query: {
        queryType: string;
        filters: {
          period?: { from: string; to: string };
          category?: string;
          accountName?: string;
          type?: 'expense' | 'income';
          limit?: number;
        };
      };
      reply: string; // placeholder; backend replaces with real data
    }
  | {
      intent: 'manage_account';
      action: 'create_account' | 'set_default' | 'list_accounts';
      accountName?: string;
      accountType?: string;
      currency?: string;
      initialBalance?: number;
      reply: string;
    };
```

## REST Endpoints (Transaction CRUD)

### `GET /api/transactions`
- **Auth:** Required
- **Query params:**
  - `type`: `expense` | `income` (optional filter)
  - `category`: category name (optional)
  - `accountId`: uuid (optional)
  - `from`: ISO date string (optional, inclusive)
  - `to`: ISO date string (optional, inclusive)
  - `page`: number, default 1
  - `limit`: number, default 20, max 100
  - `sort`: `date` | `amount` | `created_at`, default `date`
  - `order`: `asc` | `desc`, default `desc`
- **Response:** `{ data: Transaction[], meta: { page, limit, total } }`

### `GET /api/transactions/:id`
- **Auth:** Required (must own the transaction)
- **Response:** `Transaction` with joined category name

### `PATCH /api/transactions/:id`
- **Auth:** Required (must own the transaction)
- **Body:** partial `{ amount?, description?, categoryId?, date?, type?, accountId? }`
- **Side effect:** If amount or type changes, recalculate old and new account balances.
- **Response:** Updated `Transaction`

### `DELETE /api/transactions/:id`
- **Auth:** Required (must own the transaction)
- **Side effect:** Reverse the balance impact on the linked account.
- **Response:** `204 No Content`

### `GET /api/financial-accounts`
- **Auth:** Required
- **Response:** All accounts for the user

### `POST /api/financial-accounts`
- **Auth:** Required
- **Body:** `{ name, type, currency?, initialBalance? }`
- **Response:** Created account

### `PATCH /api/financial-accounts/:id`
- **Auth:** Required (must own)
- **Body:** partial `{ name?, type?, isDefault? }`
- **Side effect:** If `isDefault: true`, clear other defaults for the user.
- **Response:** Updated account

### `DELETE /api/financial-accounts/:id`
- **Auth:** Required (must own, must not be default, must have no transactions — or reassign first)
- **Response:** `204 No Content`

## Code Style

Follows existing conventions:

```ts
// core/src/modules/financial-account/financial-account.service.ts
import { and, eq } from 'drizzle-orm';
import { financialAccounts } from '../../db/schema';
import { db } from '../../lib/db';

export class FinancialAccountService {
  async getByUserId(userId: string) {
    return db.query.financialAccounts.findMany({
      where: (fa, { eq }) => eq(fa.userId, userId),
      orderBy: (fa, { desc }) => desc(fa.createdAt),
    });
  }

  async getDefault(userId: string) {
    return db.query.financialAccounts.findFirst({
      where: (fa, { and, eq }) =>
        and(eq(fa.userId, userId), eq(fa.isDefault, true)),
    });
  }

  async setDefault(userId: string, accountId: string) {
    await db.transaction(async tx => {
      await tx
        .update(financialAccounts)
        .set({ isDefault: false })
        .where(eq(financialAccounts.userId, userId));
      await tx
        .update(financialAccounts)
        .set({ isDefault: true })
        .where(
          and(
            eq(financialAccounts.id, accountId),
            eq(financialAccounts.userId, userId),
          ),
        );
    });
  }
}

export const financialAccountService = new FinancialAccountService();
```

**Naming:** `kebab-case` files, `camelCase` vars/functions, `PascalCase` types/classes.
**Formatting:** Biome — 2 spaces, single quotes, trailing commas, 100 char line width.
**Pattern:** Controller → Service → Drizzle. No DI container; exported singletons.

## Testing Strategy

- **Runner:** `bun:test` via `scripts/test-with-db.sh` (creates fresh test DB, migrates, runs, drops).
- **Style:** Integration tests — real DB, mock only the external LLM via `Bun.serve`.
- **Location:** `core/tests/` — one file per feature area.
- **Coverage target:** ≥ 80%.

### Test files

| File                             | Covers                                                        |
| -------------------------------- | ------------------------------------------------------------- |
| `tests/chat.test.ts`            | Enhanced: multi-tx, query intent, account management via chat |
| `tests/transaction.test.ts`     | NEW: GET/PATCH/DELETE transaction CRUD                        |
| `tests/financial-account.test.ts` | NEW: Account CRUD, default account logic                    |

## Boundaries

- **Always:**
  - Run `bun run typecheck` before considering a task done.
  - Validate all user inputs (Elysia `t` for HTTP, Zod for AI output).
  - Update account balances atomically in a DB transaction when adding/editing/deleting transactions.
  - Ensure `account_id` nullable for backward compatibility with existing rows.

- **Ask first:**
  - Changing the categories seed data or enum.
  - Adding new npm dependencies beyond what's already in `package.json`.
  - Changing Better Auth configuration.

- **Never:**
  - Commit `.env` secrets.
  - Delete or modify existing migration files.
  - Hallucinate financial data — all query responses must come from real DB queries.
  - Break backward compatibility of existing `POST /api/chat` response shape (extend, don't replace).

## Success Criteria

1. `POST /api/chat` with `"coffee 15k, lunch 30k"` creates 2 transactions and deducts from the default account.
2. `POST /api/chat` with `"what's my biggest expense this week?"` returns the actual biggest expense from the DB.
3. `POST /api/chat` with `"create account BCA bank IDR 5000000"` creates a financial account.
4. `POST /api/chat` with `"set default account BCA"` updates the user's default.
5. `GET /api/transactions?type=expense&from=2025-06-01` returns filtered transactions with pagination.
6. `PATCH /api/transactions/:id` with `{ "amount": 50000 }` updates the transaction and adjusts account balance.
7. `DELETE /api/transactions/:id` removes the transaction and reverses balance impact.
8. `GET /api/financial-accounts` returns all user accounts with balances.
9. Short-form chat `"coffee 20000 idr"` with no account mention uses the default account.
10. All tests pass: `cd core && bun run test`.
11. `bun run typecheck` passes with zero errors.

## Open Questions

1. Should deleting a financial account be blocked if it has transactions, or should transactions be reassigned to another account? **Proposed:** Block deletion if transactions exist; user must reassign first.
2. Should the `query` intent support arbitrary natural-language SQL, or only the predefined query types? **Proposed:** Predefined types only for safety; expand later.
3. Should chat history / conversation context be stored for multi-turn? **Proposed:** Not in this phase — each chat message is independent.
