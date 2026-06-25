import { t } from 'elysia';

export const FormattedTransactionDto = t.Object({
  id: t.String(),
  userId: t.String(),
  accountId: t.Union([t.String(), t.Null()]),
  type: t.String(),
  amount: t.String(),
  currency: t.String(),
  categoryId: t.Union([t.Number(), t.Null()]),
  description: t.String(),
  date: t.String(),
  createdAt: t.Union([t.Date(), t.Null()]),
  updatedAt: t.Union([t.Date(), t.Null()]),
});

export const ListTransactionsRequestDto = t.Object({
  type: t.Optional(t.Union([t.Literal('expense'), t.Literal('income')])),
  category: t.Optional(t.String()),
  accountId: t.Optional(t.String()),
  from: t.Optional(t.String()),
  to: t.Optional(t.String()),
  page: t.Optional(t.String()),
  limit: t.Optional(t.String()),
  sort: t.Optional(t.Union([t.Literal('date'), t.Literal('amount'), t.Literal('created_at')])),
  order: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
});

export type ListTransactionsRequest = typeof ListTransactionsRequestDto.static;

export const UpdateTransactionRequestDto = t.Object({
  amount: t.Optional(t.Number({ minimum: 0 })),
  description: t.Optional(t.String({ minLength: 1 })),
  categoryId: t.Optional(t.Number()),
  date: t.Optional(t.String()),
  type: t.Optional(t.Union([t.Literal('expense'), t.Literal('income')])),
  accountId: t.Optional(t.String({ format: 'uuid' })),
});

export type UpdateTransactionRequest = typeof UpdateTransactionRequestDto.static;

export const ListTransactionsResponseDto = t.Object({
  data: t.Array(t.Any()),
  meta: t.Object({
    total: t.Number(),
    page: t.Number(),
    limit: t.Number(),
  }),
});

export type ListTransactionsResponse = typeof ListTransactionsResponseDto.static;

export const TransactionResponseDto = t.Object({
  data: t.Any(),
});

export type TransactionResponse = typeof TransactionResponseDto.static;
