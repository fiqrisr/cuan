# Cuan

Cuan is a monorepo application containing a backend (`core`) and a frontend (`web-app`). The backend is a robust REST API that processes natural language chats into structured expense data using AI (OpenAI-compatible endpoints).

## Architecture

This project uses **Moonrepo** for task orchestration and **Bun** as the primary runtime and package manager.

- **Backend (`core`)**: A Bun-native application using **Elysia.js** for routing, **Drizzle ORM** for database interaction (PostgreSQL), and **better-auth** for session management.
- **Frontend (`web-app`)**: A React SPA built with Vite and TanStack Router.

## Prerequisites

- [Bun](https://bun.sh/) (v1.3.14+)
- [Moonrepo](https://moonrepo.dev/) (via Proto)
- Docker & Docker Compose (for local database)

## Development Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Start the local database**:
   ```bash
   docker compose up -d
   ```
   *The database runs PostgreSQL 15 on port `5433`.*

3. **Run database migrations**:
   ```bash
   cd core && bun run db:migrate
   ```

4. **Start the backend**:
   ```bash
   moon core:dev
   # or: cd core && bun run dev
   ```

## Linting & Formatting

The project enforces formatting and linting rules using **Biome**.

- **Format**: `moon run :format` (or `bun run format`)
- **Lint**: `moon run :lint` (or `bun run lint`)
- **Typecheck**: `moon check --all`

## Testing

Backend tests are integration-focused and use the native `bun:test` runner.

```bash
cd core && bun run test
```

*Note: The test command automatically handles creating and migrating a temporary database.*

## Contributing

- **Git Commits**: Must use Conventional Commits. The scope **MUST** exactly match the project name (e.g., `feat(core): ...`, `fix(web-app): ...`). Enforced by `.cursorrules`.
