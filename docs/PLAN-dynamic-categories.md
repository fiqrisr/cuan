# Implementation Plan: Dynamic Category System

## Overview
Implement user-specific custom categories alongside global defaults. The AI will dynamically receive the user's available categories to auto-categorize transactions securely, and users can manage their custom categories via chat.

## Task List

### Phase 1: Database Foundation
- [ ] **Task 1: Update `category.schema.ts`**
  - Add `userId` (varchar, nullable, references `users.id`).
  - Drop the global `.unique()` constraint on `name`.
  - Add unique indexes: one for `(name)` where `userId IS NULL`, and one for `(userId, name)` where `userId IS NOT NULL`.
  - Run `drizzle-kit generate`.

### Phase 2: Domain Service
- [ ] **Task 2: Create `category.service.ts`**
  - `getUserCategories(userId)`: returns `userId === null OR userId === currentUserId`.
  - `createCustomCategory(userId, name, label)`
  - `renameCustomCategory(userId, oldName, newLabel)`

### Phase 3: AI Chat Integration
- [ ] **Task 3: Inject Context in `chat.service.ts`**
  - Fetch categories via `categoryService.getUserCategories(userId)`.
  - Append the list of valid categories to the `system` prompt inside `processChat`.
- [ ] **Task 4: Update AI Schemas**
  - In `openmodel.schema.ts`, replace the static `z.enum([...])` for categories with `z.string()`.
- [ ] **Task 5: Implement `manage_category` Tool**
  - Create `manage-category.handler.ts`.
  - Expose `manage_category` tool in `chat.tools.ts` (`create_category`, `rename_category`, `list_categories`).
- [ ] **Task 6: Update Handlers**
  - Ensure `add-transaction.handler.ts` and `query.handler.ts` search categories using the `or(eq(userId, current), isNull(userId))` constraint.

### Phase 4: Verification & Docs
- [ ] **Task 7: Run Tests**
  - Ensure `bun test` passes. (We may need to fix tests broken by removing the static enum or schema changes).
- [ ] **Task 8: Update Docs**
  - Write `ADR-006-dynamic-categories.md`.
  - Update `feature-chat.md`.
