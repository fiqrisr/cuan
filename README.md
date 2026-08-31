# Cuan

Cuan is a modern personal finance tracking application that processes natural language chat messages into structured financial transactions using AI. Track daily expenses, manage multi-account balances, categorize spending, and visualize financial trends effortlessly.

## Key Features

- **AI-Powered Financial Assistant**: Log transactions, transfer funds, query spending habits, and manage accounts via natural language (supporting OpenAI-compatible OpenModel and Google Gemini).
- **Multi-Account Tracking**: Maintain real-time balances across bank accounts, e-wallets, cash, and credit cards with atomic balance recalculations.
- **Financial Analytics & Dashboard**: Visualize spending trends, category breakdowns, and recent activity with interactive charts.
- **Bilingual & Localization**: Full English and Indonesian (`id`/`en`) support across the web application and landing page.
- **Modern Design & Theming**: Built with Tailwind CSS v4 and a dedicated shared UI system (`@cuan/ui`), with light, dark, and system theme modes.
- **Secure Authentication**: Session-based authentication and user management powered by Better Auth.

## Architecture

Cuan is organized as a monorepo orchestrated with **[Moonrepo](https://moonrepo.dev/)** and powered by **[Bun](https://bun.sh/)**:

```
.
├── core/           # Backend REST API (Elysia.js, Drizzle ORM, Better Auth, AI SDK)
├── web/            # Frontend SPA (React 19, Vite, TanStack Router & Query, Tailwind CSS v4)
├── landing/        # Marketing Landing Page (Astro 5, Tailwind CSS v4, i18n)
└── packages/
    └── ui/         # Shared React component library (@cuan/ui, Radix UI, CVA)
```

- **Backend (`core`)**: A Bun-native REST API built with **Elysia.js**, **Drizzle ORM** (PostgreSQL), and **Better Auth**. Features an intent-driven AI handler (`openmodel` / `gemini`) for natural language processing, financial account balance management, transaction categorization, and OpenAPI documentation.
- **Web App (`web`)**: A single-page application built with **React 19**, **Vite**, **TanStack Router**, **TanStack Query**, **TanStack Table**, **Tailwind CSS v4**, and **Recharts**.
- **Landing Page (`landing`)**: A fast, SEO-friendly static marketing site built with **Astro 5**, featuring bilingual routing (`/` for Indonesian, `/en` for English), terms, and privacy pages.
- **Shared UI (`packages/ui`)**: Shared React 19 design system and UI components package (`@cuan/ui`) styled with Tailwind CSS v4.

## Prerequisites

- [Bun](https://bun.sh/) (v1.3.14+)
- [Moonrepo](https://moonrepo.dev/) (recommended via Proto)
- [Docker](https://www.docker.com/) & Docker Compose (for local PostgreSQL database)

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Environment Configuration

Copy the example environment file in `core` and adjust the variables as needed:

```bash
cp core/.env.example core/.env
```

Ensure your `core/.env` contains your database connection string, Better Auth secret/URL, and your desired AI provider credentials (`openmodel` or `gemini`).

### 3. Start Local Database

Start the PostgreSQL 15 container using Docker Compose (runs on port `5433` by default):

```bash
docker compose up -d
```

### 4. Run Database Migrations & Seeds

Apply database migrations and populate seed data:

```bash
# Run migrations
cd core && bun run db:migrate

# Seed initial categories and test data (optional)
cd core && bun run db:seed
```

### 5. Start Development Servers

You can run applications individually or via Moonrepo:

| Project | Moon Command | Direct Bun Command | Default URL |
| :--- | :--- | :--- | :--- |
| **Backend API** (`core`) | `moon core:dev` | `cd core && bun run dev` | `http://localhost:3000` |
| **Web App** (`web`) | `moon web:dev` | `cd web && bun run dev` | `http://localhost:5173` |
| **Landing Page** (`landing`) | `moon landing:dev` | `cd landing && bun run dev` | `http://localhost:4321` |
| **Shared UI** (`ui`) | `moon ui:dev` | `cd packages/ui && bun run dev` | — |

## Code Quality & Testing

The project uses **Biome** for formatting and linting, **Oxlint** for frontend linting, and native **bun:test** for backend integration tests.

- **Format Code**: `bun run format` or `moon run :format`
- **Lint Code**: `bun run lint` or `moon run :lint`
- **Typecheck Workspace**: `moon check --all`

### Running Backend Tests

Backend integration tests run against an isolated, automated PostgreSQL database instance:

```bash
cd core && bun run test
# or via moon
moon core:test
```

## Contributing

- **Git Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/). The commit scope **MUST** match the targeted project or package name:
  - `feat(core): ...`
  - `fix(web): ...`
  - `chore(landing): ...`
  - `style(ui): ...`
