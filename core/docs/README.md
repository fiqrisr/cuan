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
   # Add your OPENMODEL_API_KEY and DATABASE_URL
   ```

3. **Start Local Database:**
   (From the monorepo root)
   ```bash
   docker compose up -d
   ```

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
| `bun run test` | Run integration tests (requires Docker for fresh DB) |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Apply Drizzle migrations |
| `bun run db:push` | Push schema changes directly (dev only) |
| `bun run db:seed` | Seed default categories |

## Architecture Overview

The backend uses a **feature-module architecture** to keep domains isolated.
- **Runtime:** Bun 1.3+
- **Framework:** Elysia.js
- **Database:** PostgreSQL via Drizzle ORM
- **Authentication:** Better Auth

### Feature Documentation
- **[Chat Interface](feature-chat.md):** AI intent routing (`add_transaction`, `query`, `manage_account`).
- **[Financial Accounts](feature-financial-accounts.md):** Account management and default account logic.
- **[Transactions](feature-transactions.md):** Transaction CRUD and atomic account balance linkage.
- **[Authentication](feature-auth.md):** Email/password auth, sessions, and route guards.

## Architecture Decision Records (ADRs)

We document our significant technical decisions to capture context, constraints, and trade-offs.

- [ADR-001: Use Elysia and Bun for Backend Framework](decisions/ADR-001-use-elysia-bun.md)
- [ADR-002: Use Better Auth for Authentication](decisions/ADR-002-use-better-auth.md)
- [ADR-003: AI Intent Routing System](decisions/ADR-003-ai-intent-routing.md)
- [ADR-004: Money Storage and Atomic Balances](decisions/ADR-004-money-storage.md)
