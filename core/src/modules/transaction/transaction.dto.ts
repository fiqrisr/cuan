import { t } from 'elysia';

export const FormattedTransactionDto = t.Object({
  id: t.String(),
  userId: t.String(),
  accountId: t.Union([t.String(), t.Null()]),
  type: t.String(),
  amount: t.Number(),
  currency: t.String(),
  categoryId: t.Number(),
  category: t.Union([t.String(), t.Null()]),
  description: t.String(),
  date: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
});

export const CreateTransactionRequestDto = t.Object({
  type: t.Union([t.Literal('expense'), t.Literal('income')]),
  amount: t.Numeric({ minimum: 0, maximum: 1_000_000_000_000 }),
  currency: t.Optional(t.String({ minLength: 3, maxLength: 3 })),
  categoryId: t.Numeric({ minimum: 1 }),
  description: t.Optional(t.String({ maxLength: 500 })),
  date: t.String({ minLength: 10, maxLength: 35 }),
  accountId: t.Optional(t.Union([t.String({ format: 'uuid' }), t.Null()])),
});
export type CreateTransactionRequest = typeof CreateTransactionRequestDto.static;

export const ListTransactionsRequestDto = t.Object({
  type: t.Optional(t.Union([t.Literal('expense'), t.Literal('income')])),
  category: t.Optional(t.String()),
  categoryId: t.Optional(t.Numeric({ minimum: 1 })),
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

export type ListTransactionsRequest = typeof ListTransactionsRequestDto.static;

export const UpdateTransactionRequestDto = t.Object({
  amount: t.Optional(t.Numeric({ minimum: 0, maximum: 1_000_000_000_000 })),
  description: t.Optional(t.String({ minLength: 1, maxLength: 500 })),
  categoryId: t.Optional(t.Numeric({ minimum: 1 })),
  date: t.Optional(t.String({ minLength: 10, maxLength: 35 })),
  type: t.Optional(t.Union([t.Literal('expense'), t.Literal('income')])),
  accountId: t.Optional(t.Union([t.String({ format: 'uuid' }), t.Null()])),
});

export type UpdateTransactionRequest = typeof UpdateTransactionRequestDto.static;

export const ListTransactionsResponseDto = t.Object({
  data: t.Array(FormattedTransactionDto),
  meta: t.Object({
    total: t.Number(),
    page: t.Number(),
    limit: t.Number(),
    totalPages: t.Number(),
    summary: t.Object({
      totalIncome: t.Number(),
      totalExpense: t.Number(),
      netCashflow: t.Number(),
    }),
  }),
});

export type ListTransactionsResponse = typeof ListTransactionsResponseDto.static;

export const TransactionResponseDto = t.Object({
  data: FormattedTransactionDto,
});

export const GetTransactionStatsRequestDto = t.Object({
  from: t.Optional(t.String()),
  to: t.Optional(t.String()),
  accountId: t.Optional(t.String()),
});

export type GetTransactionStatsRequest = typeof GetTransactionStatsRequestDto.static;

export const GetTransactionStatsResponseDto = t.Object({
  data: t.Object({
    summary: t.Object({
      totalIncome: t.Number(),
      totalExpense: t.Number(),
      netSavings: t.Number(),
      savingsRate: t.Number(),
    }),
    categories: t.Array(
      t.Object({
        id: t.Union([t.Number(), t.Null()]),
        label: t.String(),
        amount: t.Number(),
        percentage: t.Number(),
      }),
    ),
    daily: t.Array(
      t.Object({
        date: t.String(),
        income: t.Number(),
        expense: t.Number(),
      }),
    ),
  }),
});

export type GetTransactionStatsResponse = typeof GetTransactionStatsResponseDto.static;
