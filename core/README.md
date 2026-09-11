# Cuan Core Backend

The core backend for Cuan, an AI-powered, chat-centric financial management and expense tracking system. It processes natural language inputs into structured financial data.

## Quick Start

1. **Install Dependencies:**
   ```bash
   bun install
   ```

2. **Set up Environment:**
   ```bash
   cp .env.example .env
   # Add your OPENMODEL_API_KEY and Cloudflare D1 credentials
   ```

3. **Initialize Local D1 Database:**
   Cloudflare D1 is serverless; there is no local container to start. The first migration will create your local D1 database state via Wrangler.

4. **Run Migrations:**
   ```bash
   bun run db:migrate
   ```

5. **Start Dev Server:**
   ```bash
   bun run dev
   ```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot-reload |
| `bun run build` | Build the application |
| `bun run test` | Run integration tests (uses an isolated D1 database) |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Apply Drizzle migrations |
| `bun run db:push` | Push schema changes directly (dev only) |
| `bun run db:seed` | Seed default categories |

## Architecture Overview

The backend uses a **feature-module architecture** to keep domains isolated.
- **Runtime:** Bun 1.3+
- **Framework:** Elysia.js
- **Database:** Cloudflare D1 via Drizzle ORM
- **Authentication:** Better Auth

### Feature Documentation
- **[Chat Interface](docs/feature-chat.md):** AI intent routing (`add_transaction`, `query`, `manage_account`).
- **[Financial Accounts](docs/feature-financial-accounts.md):** Account management and default account logic.
- **[Transactions](docs/feature-transactions.md):** Transaction CRUD and atomic account balance linkage.
- **[Authentication](docs/feature-auth.md):** Email/password auth, sessions, and route guards.

## Architecture Decision Records (ADRs)

We document our significant technical decisions to capture context, constraints, and trade-offs.

- [ADR-001: Use Elysia and Bun for Backend Framework](docs/decisions/ADR-001-use-elysia-bun.md)
- [ADR-002: Use Better Auth for Authentication](docs/decisions/ADR-002-use-better-auth.md)
- [ADR-003: AI Intent Routing System](docs/decisions/ADR-003-ai-intent-routing.md)
- [ADR-004: Money Storage and Atomic Balances](docs/decisions/ADR-004-money-storage.md)
