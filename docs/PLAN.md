# Implementation Plan: Cuan Monorepo Scaffolding

## Overview

Bootstrap a Moonrepo/Bun monorepo with root-level projects `core` and `web-app`, global code-quality tooling, and a base TypeScript configuration. No application code is added.

## Architecture Decisions

1. **Root-level projects** — Use `projects: [core, web-app]` in `.moon/workspace.yml` instead of the default `apps/*` layout to match the requested architecture.
2. **Bun toolchain** — Configure `.moon/toolchain.yml` with Bun as the package manager and runtime; this aligns with the stated stack.
3. **Root workspace manifest** — Use `package.json` workspaces so `bun install` hoists shared tooling and resolves inter-project dependencies.
4. **Flat ESLint config** — Adopt ESLint v9 `eslint.config.js` for TypeScript-first linting.
5. **Base TSConfig** — Provide a strict root `tsconfig.json` that future packages can extend.

## Task List

### Phase 1: Moon Workspace

- [ ] Update `.moon/workspace.yml` to locate `core` and `web-app`.
- [ ] Create `.moon/toolchain.yml` to pin Bun.
- [ ] Create root `moon.yml` with shared tasks.

### Phase 2: Root Package Manifest

- [ ] Create root `package.json` with workspaces, scripts, and dev dependencies.

### Phase 3: Project Stubs

- [ ] Create `core/moon.yml` and `core/package.json`.
- [ ] Create `web-app/moon.yml` and `web-app/package.json`.

### Phase 4: Global Tooling

- [ ] Add `.prettierrc.json`.
- [ ] Add `eslint.config.js`.
- [ ] Add `.editorconfig`.
- [ ] Add `tsconfig.json`.

### Checkpoint

- [ ] `moon check` passes for the workspace.
- [ ] `bun install` completes.
- [ ] `bun run lint`, `bun run format`, and `bun run typecheck` execute without config errors.

## Risks and Mitigations

| Risk                                                         | Impact | Mitigation                                                          |
| ------------------------------------------------------------ | ------ | ------------------------------------------------------------------- |
| Moon/Bun version mismatch                                    | Medium | Pin versions in `toolchain.yml` and `package.json`.                 |
| Root ESLint config conflicts with future per-project configs | Low    | Keep root config minimal; projects can extend/override later.       |
| Bun workspaces incompatible with Moon project globs          | Low    | Align `package.json` workspaces with `.moon/workspace.yml` entries. |

## Open Questions

See `docs/SPEC.md`.
