# Cuan

Cuan is a modern personal finance tracking application that processes natural language chat messages into structured financial transactions using AI. Track daily expenses, manage multi-account balances, categorize spending, and visualize financial trends effortlessly.

## Key Features

- **AI-Powered Financial Assistant**: Log transactions, transfer funds, query spending habits, and manage accounts & categories via natural language or real-time streaming chat (powered by the Vercel AI SDK with tool calling, supporting OpenModel / OpenAI / Anthropic / DeepSeek and Google Gemini).
- **Multi-Account Tracking**: Maintain real-time balances across bank accounts, e-wallets, cash, and credit cards with atomic balance recalculations stored as exact decimal strings in Cloudflare D1.
- **Financial Analytics & Dashboard**: Visualize spending trends, category breakdowns, and recent activity with interactive charts (Recharts) and structured data tables (TanStack Table).
- **Bilingual & Localization**: Full English and Indonesian (`id`/`en`) support across the web application (i18next) and marketing landing page (Astro i18n).
- **Modern Design & Accessible Theming**: Built with Tailwind CSS v4 and a dedicated shared UI system (`@cuan/ui`) using shadcn component patterns on top of Radix UI primitives for accessibility by default, with light, dark, and system theme modes.
- **Secure Authentication**: Session-based authentication and user management powered by Better Auth.

## Architecture

Cuan is organized as a monorepo orchestrated with **[Moonrepo](https://moonrepo.dev/)** and powered by **[Bun](https://bun.sh/)**:

```
.
├── core/           # Backend REST API (Elysia.js, Drizzle ORM, Cloudflare D1, Better Auth, Vercel AI SDK)
├── web/            # Frontend SPA (React 19, Vite, TanStack Router & Query, Tailwind CSS v4, Eden Treaty)
├── landing/        # Marketing Landing Page (Astro, Tailwind CSS v4, i18n)
└── packages/
    ├── ui/             # Shared React component library (@cuan/ui, Radix UI, shadcn patterns, CVA, Tailwind CSS v4)
    └── elysia-logger/  # Zero-dependency structured logger, correlation ID & RED metrics (@cuan/elysia-logger)
```

- **Backend (`core`)**: A Bun-native REST API built with **Elysia.js**, running on Cloudflare Workers or Bun with **Cloudflare D1** via **Drizzle ORM** (SQLite dialect). Features an AI tool-calling engine powered by the **Vercel AI SDK** (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`) for natural language financial actions (transactions, transfers, queries, account/category management), atomic running balance calculations (`db.batch()`), and **Better Auth** session security.
- **Web App (`web`)**: A modern single-page application built with **React 19**, **Vite**, **TanStack Router** (file-based routing with automatic code-splitting), **TanStack Query v5**, **Elysia Eden Treaty** (end-to-end type-safe API client), **TanStack Table**, **Recharts**, **Tailwind CSS v4**, and real-time streaming AI chat via `@ai-sdk/react`. Deployable to Cloudflare Pages/Workers via Wrangler.
- **Landing Page (`landing`)**: A fast, SEO-friendly static marketing site built with **Astro** and **React**, featuring native bilingual routing (`/` for Indonesian, `/en` for English), Vercel Analytics/Speed Insights, and Open Graph image generation with Satori.
- **Shared UI (`packages/ui`)**: Shared React 19 design system and UI components package (`@cuan/ui`) bundled with **tsup**, built on **Radix UI** primitives and **shadcn** base component architecture for accessibility by default (buttons, dialogs, dropdowns, inputs, labels, separators, tabs, tooltips, avatars, cards, tables, badges, skeletons), using **class-variance-authority** (CVA) and styled with **Tailwind CSS v4**.
- **Elysia Logger (`packages/elysia-logger`)**: Zero-dependency structured logging, correlation ID (`X-Request-Id`) propagation, error classification, and in-memory RED and AI metrics package (`@cuan/elysia-logger`) built for Elysia.js services running on Cloudflare Workers and Bun.

## Prerequisites

- [Bun](https://bun.sh/) (v1.3.14+)
- [Moonrepo](https://moonrepo.dev/) (recommended via Proto)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (v4+, for Cloudflare Workers & local D1 database management)

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Configuration

Copy the example environment files and adjust variables as needed:

```bash
# Configure backend environment
cp core/.env.example core/.env

# Configure web frontend environment (optional for local dev; uses Vite proxy by default)
cp web/.env.example web/.env
```

Ensure your `core/.env` contains your Better Auth secret/URL, Cloudflare D1 credentials (if syncing with remote), and your desired AI provider credentials (`AI_PROVIDER=openmodel` or `AI_PROVIDER=gemini`).

### 3. Initialize Local D1 Database & Migrations

Cloudflare D1 runs locally through Wrangler without needing a local container or Docker service. Local database state is stored under `.wrangler/state/v3/d1/cuan`.

```bash
# Reset and initialize local D1 database with migrations and default categories:
cd core && bun run db:reset

# Or apply migrations directly:
cd core && bun run db:migrate

# Seed sample user, accounts, and transactions (optional):
cd core && bun run db:seed
```

### 4. Start Development Servers

You can run applications individually or via Moonrepo:

| Project | Moon Command | Direct Bun Command | Default URL |
| :--- | :--- | :--- | :--- |
| **Backend API** (`core`) | `moon core:dev` | `cd core && bun run dev` | `http://localhost:3000` |
| **Web App** (`web`) | `moon web:dev` | `cd web && bun run dev` | `http://localhost:5173` |
| **Landing Page** (`landing`) | `moon landing:dev` | `cd landing && bun run dev` | `http://localhost:4321` |
| **Shared UI** (`ui`) | `moon ui:dev` | `cd packages/ui && bun run dev` | — (build watcher) |

> **Note:** The Vite dev server in `web` automatically proxies `/api` and `/auth` requests to `http://localhost:3000`, so `VITE_API_URL` can be left empty during local development.

## Code Quality & Testing

The project uses **Biome** for formatting and linting, **Oxlint** for frontend linting, and native **bun:test** for backend and frontend test suites.

- **Format Code**: `bun run format` or `moon run :format`
- **Lint Workspace**: `bun run lint` or `moon run :lint`
- **Typecheck Workspace**: `moon check --all`

### Running Tests

- **Backend (`core`)**: Integration tests run against an isolated, in-process Cloudflare D1 database instance:
  ```bash
  cd core && bun run test
  # or via moon
  moon core:test
  ```
- **Frontend (`web`)**: Run web client test suites:
  ```bash
  cd web && bun test
  ```

## Deployment

Both `core` (Cloudflare Worker) and `web` (Cloudflare Pages / Workers static assets) are configured for deployment via Wrangler:

```bash
# Deploy backend API
moon core:deploy
# or: cd core && bunx wrangler deploy

# Deploy web frontend
moon web:deploy
# or: cd web && bun run deploy
```
## Contributing

- **Git Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/). The commit scope **MUST** match the targeted project or package name:
  - `feat(core): ...`
  - `fix(web): ...`
  - `chore(landing): ...`
  - `style(ui): ...`
