# Repository Guidelines

## Project Overview
Cuan is a monorepo application containing a backend (`core`) and a frontend (`web-app`). The backend is a robust REST API that processes natural language chats into structured expense data using AI (OpenAI-compatible endpoints).

## Architecture & Data Flow
The monorepo uses **Moonrepo** for task orchestration and **Bun** as the primary runtime and package manager.
- **Backend (`core`)**: A Bun-native application using **Elysia.js** for routing, **Drizzle ORM** for database interaction (PostgreSQL), and **better-auth** for session management.
  - **Feature-Module Architecture**: Domain logic is grouped vertically into feature modules (e.g., `auth`, `chat`, `transaction`, `category`). 
  - **Data Flow**: Controllers (`Elysia.post`) extract HTTP payloads -> delegate to Services -> Services orchestrate business logic (e.g., calling AI models via `openmodel.ts`) -> interact directly with Drizzle ORM for async database operations.
  - **State Management**: The API is completely stateless. Sessions are managed via PostgreSQL and validated using an Elysia macro (`authGuard.ts`).
  - **AI Intent System**: Chat messages are sent to an LLM via `openmodel.ts`. The LLM classifies the intent into `add_transaction`, `query`, or `manage_account`. It returns structured JSON. It **MUST NOT** generate raw SQL or hallucinate financial numbers.
  - **Money Storage**: Money is stored as `numeric(12,2)` in PostgreSQL for exact precision. The `pg` driver returns these as strings in JS to prevent floating-point truncation; be aware of this when doing math.

- **Frontend (`web-app`)**: Currently an empty scaffold planned to be a React SPA built with Vite and TanStack Router.
- **Database**: Local development relies on **PostgreSQL 15** via Docker Compose on port `5433`. Database columns for money use `numeric(12,2)` to avoid floating-point errors.

## Core Domain Concepts & Gotchas
- **Atomic Balances**: `financial_accounts` maintain a running `balance`. Any service modifying `transactions` MUST recalculate the linked account's balance within the same `db.transaction()` block to prevent data corruption.
- **Default Account**: Users can have one default `financial_account`. Transactions from chat without a specified account fallback to the default. When toggling `is_default` for an account, all other accounts for that user must be set to `false`.
- **Backward Compatibility**: `transactions.account_id` is nullable to support legacy rows from before financial accounts existed.
- **Auth Guard Headers**: Elysia relies on Web Standard Requests. When using Better Auth in `authGuard.ts`, you MUST manually extract headers: `auth.api.getSession({ headers: request.headers })`.
- **Auth Schema**: Do not manually modify tables like `user` or `session` in `schema.ts`. Use `@better-auth/cli generate` if auth configuration changes.

## Key Directories
- `core/src/lib/`: Core cross-cutting concerns (DB connection, environment validation via Zod, custom AI client wrappers `openmodel.ts`).
- `core/src/modules/<feature>/`: Feature-sliced modules (e.g., `chat`, `financial-account`, `transaction`, `auth`). Each contains its own `.controller.ts`, `.service.ts`, `.schema.ts`, `.dto.ts`, and `.types.ts`.
- `core/src/db/`: Centralized database configurations.
- `core/tests/`: Integration tests for the backend.
- `web-app/`: React frontend workspace.
- `.moon/`: Moonrepo toolchains, inherited tasks, and workspace configurations.

## Development Commands
- **Dependency Install**: `bun install`
- **Run Backend**: `moon core:dev` or `cd core && bun run dev` (runs the Elysia server)
- **Database Local Setup**: `docker compose up -d`
- **Database Migrations**: `cd core && bun run db:migrate` or `bun run db:reset`
- **Lint & Format**: 
  - Global format: `bun run format` or `moon run :format`
  - Global lint: `bun run lint` or `moon run :lint`
- **Typecheck & Static Analysis**: `moon check --all`

## Code Conventions & Common Patterns
- **Async/Await**: Data flow relies heavily on native `async/await` without complex streams.
- **Dependency Injection**: No formal IoC container. Dependencies are instantiated directly and exported as singletons (e.g., `export const chatService = new ChatService()`).
- **Formatting Rules**: Enforced by **Biome**. 2 spaces, 100 character line limit, single quotes, and trailing commas.
- **Git Commits**: Must use Conventional Commits. The scope **MUST** exactly match the project name (e.g., `feat(core): ...`, `fix(web-app): ...`). Enforced by `.cursorrules`.

- **Types**: Put all type definitions into their own type file, e.g., `chat.types.ts`. Import the types to the file that uses it. ALWAYS use `type` instead of `interface`.
- **DTOs**: Put all Data Transfer Objects (DTOs) into their own DTO file using Elysia's TypeBox (`t`), e.g., `chat.dto.ts`. Name DTOs explicitly like `CreateFinancialAccountRequestDto` and `CreateFinancialAccountResponseDto`. Always create explicit DTOs for both requests and responses.

## Important Files
- `core/src/app.ts`: Elysia app definition, global error handling, and route mounting.
- `core/src/db/schema.ts`: Central barrel file aggregating Drizzle schemas from individual modules.
- `core/src/lib/db.ts`: Database singleton setup utilizing `pg` Pool and Drizzle.
- `core/src/lib/auth-guard.ts`: Elysia authentication macro protecting private routes using `better-auth`.
- `core/src/lib/openmodel.ts`: Custom AI SDK wrapper that connects to LLMs based on model strings.
- `biome.json`: Monorepo formatting and linting rules.
- `.moon/workspace.yml` & `.moon/toolchains.yml`: Key Moon configurations mapping toolchains and shared tasks.

## Runtime/Tooling Preferences
- **Runtime & Package Manager**: Strictly **Bun** (v1.3.14). Node is only defined as a fallback for specific tooling in `.moon/toolchains.yml`.
- **Task Runner**: **Moonrepo** (v2.3.4), managed by Proto (`.prototools`).
- **Formatting/Linting**: **Biome** (v2.5.1). Do not use Prettier or ESLint.

## Testing & QA
- **Backend Tests**: Highly integration-focused using the native `bun:test` runner.
  - Tests do **not** mock the database. `core/scripts/test-with-db.sh` drops/creates a fresh test DB, applies migrations, runs `bun test`, and drops it. Test cases use `beforeEach`/`afterEach` to clear rows.
  - Test via HTTP: Tests instantiate the Elysia app directly and use `app.handle(new Request(...))` for E2E endpoint verification.
  - Mocking External APIs: Third-party APIs (like Anthropic/OpenAI) are mocked using `Bun.serve` on a different port and pointing environment variables to it, rather than DI or function mocking.
  - **Coverage**: Target ≥80% coverage.
  - Command: `cd core && bun run test` (which triggers `test-with-db.sh`).
- **Frontend Tests**: Designed to use **Vitest**.
