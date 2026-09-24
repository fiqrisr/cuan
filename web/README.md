# Cuan Web App (`web`)

The official frontend Single-Page Application (SPA) for **Cuan**, an AI-powered personal finance management and expense tracking platform. It allows users to track expenses, manage multi-account balances, categorize spending, and interact with an AI financial assistant via natural language.

---

## 🚀 Tech Stack

- **Framework & Runtime**: [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev)
- **Routing**: [TanStack Router](https://tanstack.com/router) (file-based routing, auto code-splitting)
- **State & Data Fetching**: [TanStack Query v5](https://tanstack.com/query), [Elysia Eden Treaty](https://elysiajs.com/eden/treaty) (type-safe RPC client connecting to `@cuan/core`)
- **Tables & Visualizations**: [TanStack Table](https://tanstack.com/table), [Recharts](https://recharts.org)
- **Styling & Design System**: [Tailwind CSS v4](https://tailwindcss.com), shared `@cuan/ui` workspace package (built with Radix UI and CVA), [Lucide React](https://lucide.dev)
- **AI Streaming**: Real-time server-sent events (SSE) chat stream (`use-chat-stream` hook, `@ai-sdk/react`)
- **Authentication**: [Better Auth](https://better-auth.com) client with session persistence and route protection
- **Internationalization (i18n)**: [i18next](https://www.i18next.com) & `react-i18next` supporting Indonesian (`id`, default) and English (`en`)
- **Deployment & Hosting**: [Cloudflare Pages / Workers](https://developers.cloudflare.com/) via [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

---

## 📁 Directory Structure

```text
web/
├── public/                 # Static assets, icons, and favicon
├── src/
│   ├── assets/             # Bundled application images and media
│   ├── components/         # Shared app-level components (footer, confirm modal, not-found)
│   ├── core/               # Infrastructure & foundational utilities
│   │   ├── http/           # Eden RPC client, Better Auth client, query client, error handling
│   │   ├── locales/        # Translation JSON catalogs (id.json, en.json)
│   │   ├── i18n.ts         # i18next initialization and configuration
│   │   └── theme-context.tsx # Theme provider (light, dark, system) with localStorage persistence
│   ├── modules/            # Feature-sliced domain modules
│   │   ├── account/        # Financial accounts management (CRUD, balances, cards)
│   │   ├── auth/           # Login and registration forms and layouts
│   │   ├── chat/           # Natural language AI chat assistant (streaming messages, intent handling)
│   │   ├── dashboard/      # Financial analytics (summary cards, spending trends, category breakdown)
│   │   ├── profile/        # User settings, custom category management, logout
│   │   └── tx/             # Transaction ledger (table, filters, manual create/edit)
│   ├── routes/             # TanStack Router file-based route definitions
│   │   ├── __root.tsx      # Root layout, navigation bar, auth guard, and 404 handler
│   │   ├── index.tsx       # Dashboard page (/)
│   │   ├── chat.tsx        # AI Assistant chat (/chat)
│   │   ├── transactions.tsx # Transactions page (/transactions)
│   │   ├── accounts.tsx    # Accounts layout & routes (/accounts, /accounts/:accountId/transactions)
│   │   ├── profile.tsx     # User profile and categories (/profile)
│   │   ├── login.tsx       # Sign-in page (/login)
│   │   └── register.tsx    # Sign-up page (/register)
│   ├── index.css           # Global stylesheet and Tailwind CSS v4 design tokens
│   ├── main.tsx            # Application entry point (QueryClient, Router, Theme, i18n)
│   └── routeTree.gen.ts    # Auto-generated TanStack Router tree
├── .env.example            # Environment variable template
├── index.html              # HTML entry template
├── moon.yml                # Moonrepo task configuration (dev, build, lint, preview, deploy)
├── package.json            # Project dependencies and npm scripts
├── vite.config.ts          # Vite configuration (plugins, aliases, dev server proxy)
└── wrangler.toml           # Cloudflare Pages / Workers static deployment configuration
```

---

## 🛠️ Development & Commands

This package is managed as part of the Cuan monorepo via **Moonrepo** and **Bun**. Commands can be run directly inside `web/` or from the monorepo root:

| Command | Moon Command | Description |
| :--- | :--- | :--- |
| `bun run dev` | `moon web:dev` | Starts the Vite development server at `http://localhost:5173` with proxy to backend |
| `bun run build` | `moon web:build` | Typechecks and compiles the SPA into the `dist/` directory |
| `bun run preview` | `moon web:preview` | Locally serves the production build in `dist/` |
| `bun run lint` | `moon web:lint` | Runs fast static linting with [Oxlint](https://oxc.rs) |
| `bun test` | — | Runs unit and integration test suites using `bun:test` |
| `bun run deploy` | `moon web:deploy` | Deploys production bundle to Cloudflare Pages via Wrangler |

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` to configure environment variables:

```bash
cp .env.example .env
```

| Variable | Required | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | No | Base URL for the Cuan API (`core`). Leave empty in local development to use the Vite reverse proxy (`/api` and `/auth` redirected to `http://localhost:3000`). Set to the backend public URL in production (e.g., `https://api.yourdomain.com`). |

---

## 🧭 Key Features & Architecture

### 1. Feature-Sliced Architecture
Application code is organized into decoupled domain modules under `src/modules/`:
- **`chat`**: Interactive conversational AI assistant supporting real-time SSE streaming to log transactions, query spending, and transfer balances.
- **`dashboard`**: High-level financial analytics featuring Recharts visualizations (spending trend line/bar charts, category breakdown pie charts) and summary statistics.
- **`account`**: Multi-account management (bank accounts, e-wallets, cash, credit cards) with default account toggle and balance overview.
- **`tx`**: Comprehensive transaction tracking ledger with sorting, filtering, and manual creation/editing modal.
- **`profile`**: User account settings, theme and language selection, and custom category management (income and expense).
- **`auth`**: Dedicated login and registration flows backed by Better Auth.

### 2. Type-Safe Client & State Management
- **Eden Treaty**: Communicates with the Elysia.js backend using `@elysiajs/eden`, providing end-to-end type safety directly from the backend route definitions.
- **TanStack Query**: Handles caching, automatic background revalidation, optimistic updates, and loading/error states for all API interactions.

### 3. File-Based Routing & Code Splitting
- Uses **TanStack Router** with automated code-splitting and type-safe route navigation.
- Root layout (`__root.tsx`) orchestrates navigation header, language/theme controls, session verification, and fallback handling.

---

## 🔗 Workspace Dependencies

- **`@cuan/ui`**: Consumes shared design tokens, Tailwind v4 configurations, and reusable UI primitives (buttons, dialogs, dropdowns, inputs).
- **`@cuan/core`**: Supplies backend type definitions and API contract definitions for end-to-end type safety.
