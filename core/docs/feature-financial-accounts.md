# Feature: Financial Accounts

The Financial Accounts module enables users to track money across various real-world accounts (e.g., Bank accounts, e-Wallets, Cash).

## Context & Rationale
Initially, Cuan used a "single wallet" assumption. This was insufficient because users manage real-world money across multiple accounts (e.g., Bank, e-Wallet, Cash). This feature introduces `financial_accounts` to represent reality. 
The concept of a "default account" was added to preserve the frictionless chat UX—users shouldn't *have* to type "from BCA" for every daily coffee expense.

## Database Schema (`financial_accounts`)
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to users)
- `name`: string (e.g., "BCA", "GoPay")
- `type`: string (`bank`, `e-wallet`, `cash`, `other`)
- `currency`: string (Default: `IDR`)
- `balance`: numeric(15,2) (Running balance)
- `is_default`: boolean (Only ONE account per user can be default)
- **Constraint:** Unique index on `(user_id, name)`.

## Key Behaviors

### 1. Default Account Logic
A user can have multiple accounts, but only **one** can be the default. 
- The default account is heavily used in the Chat interface. If a user types `"coffee 20k"` without specifying an account, the transaction automatically uses the default account.
- **Invariant:** When `is_default` is set to `true` for an account, all other accounts belonging to that user must have `is_default` set to `false` in the same DB transaction.

### 2. Balance Updates
The `balance` field is a running total. It is **automatically updated** whenever a transaction linked to the account is created, modified, or deleted:
- **Income Transaction:** Adds to the balance.
- **Expense Transaction:** Deducts from the balance.
- Reversing/updating transactions applies the difference to the balance atomically.

### 3. Deletion Constraints
Deleting an account is blocked if there are any existing transactions linked to it. The user must delete or reassign the transactions to another account before deleting the financial account.

## REST Endpoints (`/api/financial-accounts`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/financial-accounts` | List all accounts for the authenticated user, including their running balances. |
| `POST` | `/api/financial-accounts` | Create a new financial account. Body: `{ name, type, currency?, initialBalance? }` |
| `PATCH` | `/api/financial-accounts/:id` | Update account details. Body: `{ name?, type?, isDefault? }`. If `isDefault` is set to true, other defaults are cleared. |
| `DELETE`| `/api/financial-accounts/:id` | Delete an account (blocked if transactions exist). |

## Known Gotchas

- **Atomic Updates Requirement:** Any service that adds, updates, or deletes a transaction MUST recalculate the linked account's balance in the exact same `db.transaction()` block. If a balance falls out of sync, the data is corrupted.
- **Default Account Toggle:** When setting an account as default, ensure you clear the default status of all other accounts belonging to that `user_id`. (See `financial-account.service.ts` for the exact Drizzle code).
