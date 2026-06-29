# Feature: Categories

The Categories module enables users to categorize their financial transactions using a mix of system default categories and user-specific custom categories.

## Context & Rationale
Cuan provides a set of global/system default categories out of the box (e.g., `food-beverage`, `transportation`, `housing`) to give users immediate utility. 
However, personal finance is highly subjective, and users frequently require custom tracking (e.g., specific projects, holidays, granular hobbies). This module introduces a mechanism for users to define their own categories safely without leaking them to other users.

## Database Schema (`categories`)
- `id`: serial (Primary Key)
- `name`: string (Machine-readable identifier, e.g., `food-beverage`, `custom-holiday`)
- `label`: string (Human-readable name, e.g., `Makanan & Minuman`, `Custom Holiday`)
- `user_id`: string (Foreign Key to users, nullable, `onDelete: cascade`)
- **Indexes:**
  - `categories_name_idx`: B-tree on `name`
  - `categories_global_name_idx`: Unique index on `name` where `user_id IS NULL` (Ensures global categories are unique)
  - `categories_user_name_idx`: Unique index on `(user_id, name)` where `user_id IS NOT NULL` (Ensures users cannot create duplicate categories for themselves)

## Key Behaviors

### 1. Unified Category List
When fetching categories, the service automatically unions two sets:
- **System Defaults:** Categories where `user_id IS NULL`.
- **User Custom:** Categories where `user_id` matches the authenticated user.
This unified list is utilized both by the REST API and the Chat Assistant to guide natural language parsing accurately.

### 2. Isolation & Security
- Users can create, update, and delete **only their own categories** (where `user_id` matches theirs).
- If a user attempts to update or delete a category where `user_id IS NULL`, the system rejects it as "System default categories cannot be modified/deleted."
- Unique indexes ensure a user cannot create a custom category with a `name` that collides with an existing category belonging to them.

### 3. Cascading Deletion
The `user_id` field has an `onDelete: 'cascade'` constraint. If a user deletes their account from the system, all of their custom categories are automatically purged from the database without leaving orphaned records.

## REST Endpoints (`/api/categories`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | List all categories available to the authenticated user (System Defaults + User Custom). |
| `POST` | `/api/categories` | Create a new custom category. Body: `{ name, label }`. |
| `GET` | `/api/categories/:id` | Get details of a specific category available to the user. |
| `PATCH` | `/api/categories/:id` | Update details of a user's custom category. Body: `{ name?, label? }`. Rejects modifications on System Defaults. |
| `DELETE`| `/api/categories/:id` | Delete a user's custom category. Rejects deletion of System Defaults. |

## AI Chat Integration
The AI Prompt dynamically receives the unified list of categories available to the user. 
- The AI is instructed to exactly match transaction categories against the `name` column provided in its context.
- When an intent like `create Holiday category` is processed, the `manage_category` chat tool executes `categoryService.create(...)`, seamlessly building custom entries for that user in real time.
