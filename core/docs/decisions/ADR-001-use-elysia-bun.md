# ADR-001: Use Elysia and Bun for Backend Framework

## Status
Accepted

## Date
2026-06-26

## Context
We need a backend framework to serve REST API endpoints, handle authentication, and orchestrate AI interactions for Cuan. Key requirements:
- Native TypeScript support without complex build steps.
- High performance for routing and request validation.
- Easy integration with edge-compatible libraries.
- Strong typing from route definition down to the response (end-to-end type safety).

## Decision
Use **Bun** as the runtime and package manager, and **Elysia.js** as the web framework.

## Alternatives Considered

### Node.js + Express
- **Pros:** Massive ecosystem, proven stability.
- **Cons:** Requires external tooling (ts-node, tsc, nodemon) for TypeScript. No built-in end-to-end type safety.
- **Rejected:** Tooling overhead and slower performance compared to modern alternatives.

### Node.js + NestJS
- **Pros:** Highly structured, great for large teams.
- **Cons:** Heavy OOP boilerplate (decorators, DI containers) which feels over-engineered for a startup/chat-centric app.
- **Rejected:** Too heavy for our current scope.

### Hono
- **Pros:** Extremely fast, Web Standard compliant, works on Edge.
- **Cons:** Elysia provides a slightly better developer experience (DX) when exclusively targeting Bun, specifically with its TypeBox (`t`) integration for schema validation.
- **Rejected:** Close second, but Elysia's native synergy with Bun won out.

## Consequences
- **Positive:** Zero-config TypeScript. Instant startup times. Strict request validation using Elysia's TypeBox (`t`) macro which directly infers TypeScript types.
- **Negative:** Bun and Elysia are relatively newer; we may encounter edge cases or missing niche ecosystem plugins compared to Express.
- **Mitigation:** Keep business logic in plain TypeScript functions/services so it's not tightly coupled to the HTTP layer.
