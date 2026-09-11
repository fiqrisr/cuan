# Feature: Transactions

The Transactions module is responsible for recording the user's financial activities (incomes and expenses). While transactions are primarily created via the Chat interface, this module exposes standard CRUD endpoints for manual entry, bulk viewing, and editing.

## Context & Rationale
While chat is great for rapid entry, users often need to see a historical list, fix a typo, or delete an accidental entry. We built standard REST endpoints for these because natural language isn't great at targeting a specific historical row for deletion.
We store all monetary amounts as `text` (decimal strings) in Cloudflare D1 to preserve exact precision without floating-point truncation.

## Database Schema (`transactions`)
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to users)
- `account_id`: UUID (Foreign Key to `financial_accounts`, Nullable for backwards compatibility with old records)
- `type`: string (`expense` | `income`)
- `amount`: text (decimal string)
- `currency`: string
- `category_id`: int (Foreign Key to `categories` table)
- `description`: string
- `date`: Timestamp
- `created_at` / `updated_at`: Timestamps

## Key Behaviors

### 1. Account Linkage & Balances
New transactions created via chat or the API will always link to an `account_id` (either explicitly passed or resolved to the user's default account).
- Inserting a transaction recalculates the associated account's `balance`.
- Modifying a transaction's `amount` or `type` calculates the delta and applies it to the account.
- Deleting a transaction reverses the balance impact on the linked account.
All balance updates occur atomically via D1 `db.batch()` (D1 does not support interactive transactions).

## REST Endpoints (`/api/transactions`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | Fetch transactions with robust filtering and pagination capabilities. |
| `GET` | `/api/transactions/:id` | Fetch a single transaction by its ID (must belong to the user). |
| `PATCH` | `/api/transactions/:id` | Edit a transaction. Body supports partial updates: `{ amount?, description?, categoryId?, date?, type?, accountId? }`. Recalculates balances automatically. |
| `DELETE`| `/api/transactions/:id` | Delete a transaction. Reverses balance impact on the linked account. |

### GET Filters (Query Parameters)
The `GET /api/transactions` endpoint supports:
- `type`: Filter by `expense` or `income`.
- `category`: Filter by category name.
- `accountId`: Filter by specific financial account.
- `from` / `to`: ISO date strings for date range filtering.
- `page` / `limit`: Pagination (default: page 1, limit 20).
- `sort` / `order`: Sorting column (`date`, `amount`, `created_at`) and direction (`asc`, `desc`).

## Known Gotchas

- **Dynamic Categories:** Transactions map to `category_id`, which references the `categories` table. Categories can be global (default) or user-specific (custom).
- **Nullable `account_id`:** `account_id` is nullable in the database for backward compatibility with v1 data (which had no financial accounts). New inserts from the application layer always require an `account_id` or fallback to the user's default account.
- **Currency Parsing:** D1 stores monetary values as text (decimal strings). Ensure services parse them with a decimal-safe library and the API/client expects strings, or handles conversions properly if math is needed on the frontend.
