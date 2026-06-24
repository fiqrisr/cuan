# Spec: Cuan Monorepo Scaffolding

## Objective

Establish the initial monorepo infrastructure for **Cuan**, a chat-based AI-powered expense tracker. This phase delivers the workspace foundation so future backend (`/core`) and frontend (`/web-app`) development can proceed with a shared build system, toolchain, and code-quality standards.

**Success criteria:**

- `moon check --all` passes using inherited `format` and `lint` tasks.
- `bun install` can resolve workspace dependencies from the root.
- Root `tsconfig.json` extends `tsconfig-moon`, and `core`/`web-app` tsconfigs extend `tsconfig-moon/projects`.
- No application code is added in this phase.

- **Monorepo:** Moonrepo 2.3

- **Runtime / Package Manager:** Bun 1.3
- **Backend:** Elysia.js (future)
- **Frontend:** React + Vite + TanStack Router (future)
- **Database:** PostgreSQL (future)
- **TypeScript base config:** tsconfig-moon

## Commands

| Purpose                  | Command                                            |
| ------------------------ | -------------------------------------------------- |
| Install dependencies     | `bun install`                                      |
| List Moon projects       | `moon query projects`                              |
| Check all projects       | `moon check --all`                                 |
| Check single project     | `moon check core` / `moon check web-app`           |
| Format all (root)        | `bun run format`                                   |
| Format single project    | `moon run core:format` / `moon run web-app:format` |
| Lint all (root)          | `bun run lint`                                     |
| Lint single project      | `moon run core:lint` / `moon run web-app:lint`     |
| Type-check (per-project) | `moon run <project>:typecheck` once source exists  |

## Project Structure

```
~/devs/cuan/
├── .moon/
│   ├── workspace.yml      # Moon workspace + project locations
│   ├── toolchains.yml     # Bun / Node toolchain configuration
│   └── tasks/
│       └── node.yml       # Shared format/lint tasks for JS/TS projects
├── core/                  # Elysia.js backend (stub only for now)
│   ├── moon.yml
│   ├── package.json
│   └── tsconfig.json      # Extends tsconfig-moon/projects
├── web-app/               # React + Vite frontend (stub only for now)
│   ├── moon.yml
│   ├── package.json
│   └── tsconfig.json      # Extends tsconfig-moon/projects + React
├── docs/
│   └── SPEC.md            # This spec
├── .editorconfig
├── .gitignore
├── .prettierrc.json
├── eslint.config.js
├── package.json           # Root workspace manifest
└── tsconfig.json          # Base TypeScript configuration
```

## Code Style

- **Formatter:** Prettier with 2-space indentation, single quotes, trailing commas.
- **Linter:** ESLint flat config for TypeScript.
- **Line endings:** LF via EditorConfig.
- **Naming:** `kebab-case` for files, `camelCase` for variables/functions, `PascalCase` for types/components.

Example:

```ts
// utils/sum.ts
export function sum(a: number, b: number): number {
  return a + b;
}
```

## Testing Strategy

Testing will be configured per project once application code begins:

- **Backend (`core`):** Bun test runner.
- **Frontend (`web-app`):** Vitest.
- **Coverage target:** ≥ 80% for future application code.

## Boundaries

- **Always:** Run `moon check` after workspace changes; keep root tooling language-agnostic where possible.
- **Ask first:** Adding runtime dependencies to root, changing CI/CD, altering project locations.
- **Never:** Commit secrets, vendor `node_modules`, remove failing tests without approval, or add application code in this scaffolding phase.

## Open Questions

1. Should we pin Bun to an exact version in `.moon/toolchain.yml`?
2. Do we want a root-level `tsconfig.json` that strict-mode packages extend, or a more permissive base?
3. Is there an existing PostgreSQL/Docker setup to integrate now, or deferred to a later phase?

## Assumptions

1. Moonrepo 1.29 and Bun 1.3 are pre-installed in the environment.
2. Projects live at root-level directories `core/` and `web-app/` instead of `apps/*`.
3. Modern ESLint v9 flat config is acceptable.
4. No application code is required in this phase — only workspace/tooling scaffolding.
5. TypeScript 5.x will be used by future packages.
