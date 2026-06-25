# Repository Guidelines

## Project Overview
Cuan is a monorepo application containing a backend (`core`) and a frontend (`web-app`). The backend is a robust REST API that processes natural language chats into structured expense data using AI (OpenAI-compatible endpoints).

## Architecture & Data Flow
The monorepo uses **Moonrepo** for task orchestration and **Bun** as the primary runtime and package manager.
- **Backend (`core`)**: A Bun-native application using **Elysia.js** for routing, **Drizzle ORM** for database interaction (PostgreSQL), and **better-auth** for session management.
  - **Feature-Module Architecture**: Domain logic is grouped vertically into feature modules (e.g., `auth`, `chat`, `transaction`, `category`). 
  - **Data Flow**: Controllers (`Elysia.post`) extract HTTP payloads -> delegate to Services -> Services orchestrate business logic (e.g., calling AI models via `openmodel.ts`) -> interact directly with Drizzle ORM for async database operations.
  - **State Management**: The API is completely stateless. Sessions are managed via PostgreSQL and validated using an Elysia macro (`authGuard.ts`).
- **Frontend (`web-app`)**: Currently an empty scaffold planned to be a React SPA built with Vite and TanStack Router.
- **Database**: Local development relies on **PostgreSQL 15** via Docker Compose on port `5433`. Database columns for money use `numeric(12,2)` to avoid floating-point errors.

## Key Directories
- `core/src/lib/`: Core cross-cutting concerns (DB connection, environment validation via Zod, custom AI client wrappers).
- `core/src/modules/<feature>/`: Vertical feature folders containing controller, service, and Drizzle schemas specific to the domain.
- `core/src/db/`: Centralized database configurations.
- `core/tests/`: Integration tests for the backend.
- `web-app/`: React frontend workspace.
- `docs/`: Architecture decisions, implementation plans, and specifications (e.g., `PLAN-core-backend.md`).
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
