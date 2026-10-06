# Spec: Comprehensive Activity Manager (Transactions List)

## Objective

Build a comprehensive, production-grade Activity Manager for Cuan's transactions (`/transactions` and `/accounts/:accountId/transactions`). 
Users currently only have a basic client-filtered list capped at 50 records without pagination, advanced filters, view toggles, or URL synchronization.

The comprehensive Activity Manager will provide:
1. **Server-Side Pagination & Sorting**: Efficient pagination with custom page sizes (10, 20, 50), total counts, and multi-field sorting (Date, Amount, Created At).
2. **Comprehensive Filters**: Search query (description), Transaction Type (All, Expense, Income), Account selector, Category selector, Date Range (quick presets: All Time, Today, This Week, This Month, Last 30 Days, or Custom Range), and Amount Range (Min/Max).
3. **Filter-Aware Financial Summary**: Quick stats bar showing total transactions, total income, total expenses, and net cashflow for the active filtered set.
4. **Dual View Modes**: Grouped timeline list view (current date-grouped style, enhanced) and a dense data table view (leveraging `@tanstack/react-table` and `@cuan/ui` table tokens).
5. **URL State Synchronization**: Bookmarkable and shareable search/filter/pagination state synced via TanStack Router search params.
6. **Full Accessibility & Design System Alignment**: Adherence to the 4-tier surface elevation system, keyboard navigation, responsive layout, and bilingual support (EN/ID).

---

## Tech Stack & Architecture

- **Backend (`core`)**:
  - Runtime: Bun v1.3.14
  - Framework: Elysia.js + TypeBox DTO validation
  - Database: Cloudflare D1 (SQLite) with Drizzle ORM
  - Tests: `bun:test` with ephemeral D1 test proxy
- **Frontend (`web`)**:
  - Framework: React 19 SPA + Vite
  - Routing & State: TanStack Router (file-based routing with search params validation)
  - Data Fetching: TanStack Query v5 + Eden Treaty (`api.api.transactions`)
  - Table: `@tanstack/react-table` v8 + `@cuan/ui`
  - Design & Icons: Tailwind CSS v4, `@cuan/ui` (Radix primitives), Lucide React
  - Localization: `react-i18next` (`en` & `id`)

---

## Commands

```bash
# Backend dev & test
cd core && bun run dev
cd core && bun test

# Frontend dev & test
cd web && bun run dev
cd web && bun test
cd web && bun run lint

# Global check & format
bun run lint
bun run format
moon check --all
```

---

## Project Structure

```
docs/specs/
  activity-manager.md                     → This specification document

core/src/modules/transaction/
  transaction.dto.ts                      → Extended ListTransactionsRequestDto & ResponseDto
  transaction.types.ts                    → Extended TransactionFilters with search, minAmount, maxAmount, categoryId
  transaction.service.ts                  → Drizzle query builder with search, amount filtering, numeric sort
  transaction.controller.ts               → Query param mapping and validation

web/src/modules/tx/
  types.ts                                → TransactionFilterState, ViewMode, PaginationState
  hooks/
    use-get-transaction-list-query.ts     → Filter-aware react-query hook with pagination
    use-transaction-filters.ts            → Hook to manage and sync filter state with URL search params
  components/
    activity-summary-bar.tsx              → Quick stats (income, expense, net cashflow, count)
    activity-filters-toolbar.tsx          → Search bar, filter dropdowns, date presets, reset button
    activity-filter-chips.tsx             → Active filter tags with single-click remove
    activity-pagination.tsx               → Page numbers, prev/next, page size selector
    activity-table-view.tsx               → TanStack Table tabular representation
    activity-list-view.tsx                → Enhanced grouped timeline view
    transaction-row.tsx                   → Individual row with edit/delete actions
    create-transaction-form.tsx           → Quick add transaction modal
    transaction-empty-state.tsx           → Filter-aware empty states (no data vs no filter matches)
    transaction-list-skeleton.tsx         → Skeleton loaders for list and table views
  pages/
    transactions-page.tsx                 → Main container orchestrating summary, toolbar, views, and pagination

web/src/routes/
  transactions.tsx                        → TanStack route with typed search params validation
  accounts.$accountId.transactions.tsx    → Account-scoped route with typed search params validation
```

---

## Code Style & API Contracts

### 1. Extended Backend DTO (`core/src/modules/transaction/transaction.dto.ts`)

```typescript
export const ListTransactionsRequestDto = t.Object({
  type: t.Optional(t.Union([t.Literal('expense'), t.Literal('income')])),
  category: t.Optional(t.String()),
  categoryId: t.Optional(t.Numeric()),
  accountId: t.Optional(t.String()),
  search: t.Optional(t.String({ maxLength: 100 })),
  minAmount: t.Optional(t.Numeric({ minimum: 0 })),
  maxAmount: t.Optional(t.Numeric({ minimum: 0 })),
  from: t.Optional(t.String()),
  to: t.Optional(t.String()),
  page: t.Optional(t.Numeric({ minimum: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100 })),
  sort: t.Optional(t.Union([t.Literal('date'), t.Literal('amount'), t.Literal('created_at')])),
  order: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
});

export const ListTransactionsResponseDto = t.Object({
  data: t.Array(FormattedTransactionDto),
  meta: t.Object({
    total: t.Number(),
    page: t.Number(),
    limit: t.Number(),
    totalPages: t.Number(),
  }),
});
```

### 2. Frontend Filter State Contract (`web/src/modules/tx/types.ts`)

```typescript
export type TransactionFilterParams = {
  search?: string;
  type?: 'expense' | 'income';
  categoryId?: number;
  accountId?: string;
  from?: string;
  to?: string;
  datePreset?: 'all' | 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'custom';
  minAmount?: number;
  maxAmount?: number;
  sort?: 'date' | 'amount' | 'created_at';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  view?: 'list' | 'table';
};
```

---

## Testing Strategy

1. **Backend Integration Tests (`core/tests/transaction.test.ts`)**:
   - Test text search by transaction description (e.g., searching for "Coffee" returns matching records only).
   - Test amount range filtering (`minAmount` and `maxAmount`).
   - Test numeric sorting by amount (e.g. descending order correctly places 100,000 above 25,000).
   - Test pagination metadata (`totalPages`, `total`, `page`, `limit`).
   - Test combined filters (e.g., search + type + date range).
2. **Frontend Unit/Component Tests (`web/src/modules/tx/**/*.test.ts`)**:
   - Filter state management, date range preset calculations.
   - Pagination calculation tests (page slice, boundary conditions).
   - Render and interactions for filter chips and reset behavior.
3. **Regression & Quality Verification**:
   - `core`: Run all backend integration tests (`bun test`).
   - `web`: Run frontend tests (`bun test`), linting (`oxlint`), and TypeScript validation.

---

## Boundaries

- **Always do**:
  - Maintain atomic balances and backward compatibility for transactions with nullable `account_id`.
  - Use TanStack Router's search param validation for URL persistence.
  - Follow the 4-tier surface elevation system and design tokens from `@cuan/ui`.
  - Add bilingual i18n keys in both `en.json` and `id.json`.
- **Ask first**:
  - Modifying the underlying SQLite schema in `transactions` table.
  - Changing defaults of other unrelated routes or modules.
- **Never do**:
  - Hardcode limits or perform all filtering client-side on arbitrary slices.
  - Break existing Eden Treaty contracts or public REST routes.
  - Perform unrounded floating point operations on monetary values.

---

## Success Criteria

- [ ] Backend supports `search`, `minAmount`, `maxAmount`, `categoryId`, and numeric `amount` sorting.
- [ ] Backend returns accurate pagination metadata including `totalPages`.
- [ ] Frontend displays an Activity Manager with searchable, filterable, and paginated transaction records.
- [ ] Quick summary cards accurately display total count, inflow, outflow, and net cashflow for the active view.
- [ ] Filter toolbar provides search, date presets, type filter, account selector, category picker, and amount range.
- [ ] Active filter chips appear with single-click dismiss and a global "Reset" button.
- [ ] Dual view modes (Timeline List and Data Table) allow users to switch layouts seamlessly.
- [ ] Pagination controls allow jumping between pages and changing page size (10, 20, 50).
- [ ] Filters and pagination state are preserved in URL search params.
- [ ] 100% of backend and frontend test suites pass with zero regressions.
