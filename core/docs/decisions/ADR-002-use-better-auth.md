# ADR-002: Use Better Auth for Authentication

## Status
Accepted

## Date
2026-06-26

## Context
We need an authentication system for Cuan that supports:
- Email/Password sign-in.
- Session-based authentication via cookies.
- Direct integration with PostgreSQL via Drizzle ORM.
- Framework-agnostic so it can run inside Elysia.js seamlessly.
- Easy extension to OAuth providers in the future.

## Decision
Use **Better Auth** with the Drizzle adapter.

## Alternatives Considered

### Passport.js
- **Pros:** The legacy standard, supports every strategy imaginable.
- **Cons:** Boilerplate-heavy, relies heavily on Express-specific middleware, requires manual session store implementations and database wiring.
- **Rejected:** Too much manual wiring for basic features.

### Lucia Auth
- **Pros:** Framework agnostic, excellent Drizzle support, explicit session management.
- **Cons:** Lucia v3 deprecated its Drizzle adapter in favor of writing pure SQL or manual ORM calls, shifting the maintenance burden back to us.
- **Rejected:** The recent API shifts and removal of official ORM adapters made it less attractive for rapid development.

### Auth.js (NextAuth)
- **Pros:** Feature-rich, widely used.
- **Cons:** Historically very Next.js focused. While they are expanding to other frameworks, Better Auth provides a cleaner, more modern primitive specifically designed for any standard web Request/Response handler.
- **Rejected:** Better Auth feels lighter and more aligned with our stack.

## Consequences
- **Positive:** We generate auth tables natively alongside our application tables using `@better-auth/cli`. Session management and route protection (`authGuard`) are trivial to implement.
- **Negative:** It's a newer library.
- **Gotchas:** When protecting Elysia routes, we must manually extract headers and pass them to `auth.api.getSession()` inside a custom macro because Elysia doesn't use standard Node middleware.
