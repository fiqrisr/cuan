# Repository Guidelines

## Project Overview
Cuan is a monorepo application containing a backend API (`core`), a frontend SPA (`web`), a marketing landing page (`landing`), and a shared UI component library (`packages/ui`). The backend is an Elysia.js REST API running on Cloudflare Workers / Bun that processes natural language chats into structured financial transactions using AI tool calling.

## Architecture & Data Flow
The monorepo uses **Moonrepo** for task orchestration and **Bun** as the primary runtime and package manager.
- **Backend (`core`)**: A Bun-native application using **Elysia.js** for routing, **Drizzle ORM** for database interaction (**Cloudflare D1** SQLite dialect), and **better-auth** for session management.
  - **Feature-Module Architecture**: Domain logic is grouped vertically into feature modules (e.g., `auth`, `chat`, `transaction`, `financial-account`, `category`). 
  - **Data Flow**: Controllers (`Elysia.post` / `.get`) extract HTTP payloads -> delegate to Services -> Services orchestrate business logic (e.g., calling Vercel AI SDK tool calling or interacting with D1) -> interact directly with Drizzle ORM using batch operations.
  - **State Management**: The API is completely stateless. Sessions are managed via Cloudflare D1 and validated using an Elysia macro (`auth-guard.ts` in `modules/auth`).
  - **AI Intent System**: Chat messages are processed with the Vercel AI SDK (`ai`) using tool calling (`add_transaction`, `transfer_funds`, `query_finances`, `manage_account`, `manage_category`). It supports OpenModel (OpenAI, Anthropic, DeepSeek) and Google Gemini providers, returning structured tool results or streaming text via SSE (`/api/chat/stream`). It **MUST NOT** generate raw SQL or hallucinate financial numbers.
  - **Money Storage**: Money is stored as `text` (decimal strings) in Cloudflare D1 (SQLite) for exact precision (see `ADR-004`). Avoid floating-point arithmetic in JS; parse with decimal-safe precision.

- **Frontend (`web`)**: A React 19 SPA built with Vite, TanStack Router (file-based routing with automatic code-splitting), TanStack Query v5, TanStack Table, Recharts for data visualization, Tailwind CSS v4, Eden Treaty (`@elysiajs/eden`) for type-safe API communication, and the shared `@cuan/ui` package. It uses `better-auth/react` for session management and native `bun:test` for testing.
- **Landing Page (`landing`)**: A fast, SEO-friendly static marketing site built with Astro and React, featuring Tailwind CSS v4, native Astro i18n (`id`/`en`), Vercel Analytics / Speed Insights, and Satori Open Graph image generation.
- **Shared UI (`packages/ui`)**: Shared React 19 design system and UI components package (`@cuan/ui`) built with Radix UI, CVA, Tailwind CSS v4, and bundled with tsup.
- **Database**: **Cloudflare D1** (SQLite). Local development uses **Wrangler** to manage local D1 SQLite state under `.wrangler/state/v3/d1/cuan`. No Docker container or PostgreSQL service is needed.

## Core Domain Concepts & Gotchas
- **Atomic Balances**: `financial_accounts` maintain a running `balance`. In Cloudflare D1, there are no interactive transactions; `db.batch()` is the atomic execution unit. Any service modifying `transactions` MUST recalculate and update the linked account's balance within the same `db.batch([...])` call to prevent data corruption.
- **Default Account**: Users can have one default `financial_account`. Transactions from chat without a specified account fallback to the default. When toggling `is_default` for an account, all other accounts for that user must be set to `false`.
- **Backward Compatibility**: `transactions.account_id` is nullable to support legacy rows from before financial accounts existed.
- **Auth Guard Headers**: Elysia relies on Web Standard Requests. When using Better Auth in `auth-guard.ts`, you MUST manually extract headers: `auth.api.getSession({ headers: request.headers })`.
- **Auth Schema**: Do not manually modify tables like `user` or `session` in `schema.ts`. Use `@better-auth/cli generate` if auth configuration changes.
- **D1 Binding Proxy**: In `core/src/db/index.ts`, `db` is a lazy Proxy backed by `setD1Binding()`. At runtime in Cloudflare Workers, the D1 binding arrives via worker `env`. In local dev and tests, `wrangler` platform proxy wires the binding before queries execute.

## Key Directories
- `core/src/env.ts`: Environment validation via Zod.
- `core/src/lib/`: Core cross-cutting libraries (`ai-provider.ts` for Vercel AI SDK provider routing, `error.ts`).
- `core/src/modules/<feature>/`: Feature-sliced modules (e.g., `chat`, `financial-account`, `transaction`, `auth`, `category`). Each contains its own `.controller.ts`, `.service.ts`, `.schema.ts`, `.dto.ts`, `.types.ts` and barrel `index.ts`.
- `core/src/db/`: Centralized database schema and D1 Drizzle singleton.
- `core/tests/`: Integration tests for the backend (using ephemeral in-process D1 proxy).
- `web/`: React 19 frontend workspace.
- `landing/`: Astro marketing landing page workspace.
- `packages/ui/`: Shared React component library and design system used by `web` and `landing`.
- `.moon/`: Moonrepo toolchains, inherited tasks, and workspace configurations.

## Development Commands
- **Dependency Install**: `bun install`
- **Run Backend**: `moon core:dev` or `cd core && bun run dev` (runs `wrangler dev`)
- **Run Frontend**: `moon web:dev` or `cd web && bun run dev` (runs the Vite dev server on port 5173 with proxy to backend)
- **Run Landing**: `moon landing:dev` or `cd landing && bun run dev` (runs the Astro dev server on port 4321)
- **Database Local Reset & Seed**: `cd core && bun run db:reset` (drops local D1 state, reapplies migrations, seeds default categories)
- **Database Migrations**: `cd core && bun run db:migrate`
- **Database Seed (sample data)**: `cd core && bun run db:seed`
- **Lint & Format**: 
  - Global format: `bun run format` or `moon run :format`
  - Global lint: `bun run lint` or `moon run :lint`
  - Web lint: `cd web && bun run lint` (runs `oxlint`)
- **Typecheck & Static Analysis**: `moon check --all`

## Code Conventions & Common Patterns
- **Async/Await**: Data flow relies heavily on native `async/await`. AI streaming uses Vercel AI SDK `streamText` SSE streaming.
- **Dependency Injection**: No formal IoC container. Dependencies are instantiated directly and exported as singletons (e.g., `export const chatService = new ChatService()`).
- **Formatting Rules**: Enforced by **Biome**. 2 spaces, 100 character line limit, single quotes, and trailing commas.
- **Git Commits**: Must use Conventional Commits. The scope **MUST** match the targeted project or package name (e.g., `feat(core): ...`, `fix(web): ...`, `chore(landing): ...`, `style(ui): ...`).

- **Types**: Put all type definitions into their own type file, e.g., `chat.types.ts`. Import the types to the file that uses it. ALWAYS use `type` instead of `interface`.
- **DTOs**: Put all Data Transfer Objects (DTOs) into their own DTO file using Elysia's TypeBox (`t`), e.g., `chat.dto.ts`. Name DTOs explicitly like `CreateFinancialAccountRequestDto` and `CreateFinancialAccountResponseDto`. Always create explicit DTOs for both requests and responses.

## Important Files
- `core/src/app.ts`: Elysia app definition, global error handling, and route mounting.
- `core/src/index.ts`: Worker entrypoint extracting D1 binding and dispatching to `app.fetch`.
- `core/src/db/schema.ts`: Central barrel file aggregating Drizzle SQLite schemas from individual modules.
- `core/src/db/index.ts`: Database singleton setup utilizing `drizzle-orm/d1` and lazy proxy binding.
- `core/src/modules/auth/auth-guard.ts`: Elysia authentication macro protecting private routes using `better-auth`.
- `core/src/lib/ai-provider.ts`: Vercel AI SDK provider factory for OpenAI, Anthropic, or Gemini.
- `web/src/main.tsx`: React entry point, query client, router, and theme provider setup.
- `web/src/routes/__root.tsx`: Root TanStack Router layout with navigation, footer, skip link, and 404 page.
- `web/src/core/theme-context.tsx`: Light/dark/system theme provider persisted to local storage.
- `web/src/core/http/api.ts`: Eden Treaty RPC client connected to backend API.
- `packages/ui/src/index.css`: Shared Tailwind CSS v4 design tokens, theme variables, and utility classes.
- `biome.json`: Monorepo formatting and linting rules.
- `.moon/workspace.yml` & `.moon/toolchains.yml`: Key Moon configurations mapping toolchains and shared tasks.

## Runtime/Tooling Preferences
- **Runtime & Package Manager**: Strictly **Bun** (v1.3.14). Node is only defined as a fallback for specific tooling in `.moon/toolchains.yml`.
- **Task Runner**: **Moonrepo** (v2.x), managed by Proto (`.prototools`).
- **Formatting/Linting**: **Biome** (v2.5.1) across workspace; **Oxlint** for fast frontend linting in `web`. Do not use Prettier or ESLint.
- **Cloudflare Tooling**: **Wrangler** (v4.x) for Workers and D1 database management.

## Testing & QA
- **Backend Tests**: Highly integration-focused using the native `bun:test` runner.
  - Tests do **not** mock the database. Tests connect to an ephemeral, in-process Cloudflare D1 database instance provisioned by `core/tests/setup.ts` via Wrangler's `getPlatformProxy({ persist: false })`. No local containers or state to create or drop.
  - Test via HTTP: Tests instantiate the Elysia app directly and use `app.handle(new Request(...))` for E2E endpoint verification.
  - Mocking External APIs: Third-party AI APIs are mocked using `Bun.serve` on an isolated port and pointing `OPENMODEL_BASE_URL` to it.
  - **Coverage**: Target ≥80% coverage.
  - Command: `cd core && bun run test` (or `moon core:test`).
- **Frontend Tests**: Native `bun:test` test suites in `web/` (`cd web && bun test`).
