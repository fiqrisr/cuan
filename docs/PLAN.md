# Implementation Plan: Cuan Monorepo Scaffolding

## Overview

Bootstrap a Moonrepo/Bun monorepo with root-level projects `core` and `web-app`, global code-quality tooling, and a base TypeScript configuration. No application code is added.

## Architecture Decisions

1. **Root-level projects** — Use `projects: { core: 'core', web-app: 'web-app' }` in `.moon/workspace.yml` instead of the default `apps/*` layout to match the requested architecture.
2. **Bun + Node toolchains** — Configure `.moon/toolchains.yml` with Bun as the package manager and Node for tools that require it (Prettier, ESLint).
3. **Moon v2 project metadata** — Use `layer` and `stack` instead of the v1 `type` field.
4. **Root workspace manifest** — Use `package.json` workspaces so `bun install` hoists shared tooling and resolves inter-project dependencies.
5. **Flat ESLint config** — Adopt ESLint v9 `eslint.config.js` for TypeScript-first linting.
6. **tsconfig-moon** — Use Moon's strict `tsconfig-moon` presets:
   - Root extends `tsconfig-moon/tsconfig.json`.
   - `core` extends `tsconfig-moon/tsconfig.projects.json`.
   - `web-app` extends `tsconfig-moon/tsconfig.projects.json` with React DOM + JSX overrides.
7. **Shared tasks** — Define reusable `format` and `lint` tasks in `.moon/tasks/node.yml` inherited by all JS/TS projects.

## Task List

### Phase 1: Moon Workspace

- [x] Create `.moon/workspace.yml` to locate `core` and `web-app`.
- [x] Create `.moon/toolchains.yml` to pin Bun and Node, and sync TypeScript project references.

### Phase 2: Root Package Manifest

- [x] Create root `package.json` with workspaces, scripts, and dev dependencies (including `tsconfig-moon`).

### Phase 3: Project Stubs

- [x] Create `core/moon.yml`, `core/package.json`, and `core/tsconfig.json`.
- [x] Create `web-app/moon.yml`, `web-app/package.json`, and `web-app/tsconfig.json`.

### Phase 4: Global Tooling

- [x] Add `.prettierrc.json`.
- [x] Add `eslint.config.js`.
- [x] Add `.editorconfig`.

### Phase 5: Shared Tasks

- [x] Add `.moon/tasks/node.yml` with inherited `format` and `lint` tasks.

### Checkpoint

- [x] `moon check --all` passes for `core` and `web-app`.
- [x] `moon query projects` lists `core` and `web-app` as valid projects.
- [x] `bun install` completes.
- [x] `bun run lint` and `bun run format:check` execute without config errors.

## Risks and Mitigations

| Risk                                                         | Impact | Mitigation                                                          |
| ------------------------------------------------------------ | ------ | ------------------------------------------------------------------- |
| Moon/Bun version mismatch                                    | Medium | Pin versions in `.moon/toolchains.yml` and `package.json`.          |
| Root ESLint config conflicts with future per-project configs | Low    | Keep root config minimal; projects can extend/override later.       |
| Bun workspaces incompatible with Moon project globs          | Low    | Align `package.json` workspaces with `.moon/workspace.yml` entries. |

## Open Questions

See `docs/SPEC.md`.
