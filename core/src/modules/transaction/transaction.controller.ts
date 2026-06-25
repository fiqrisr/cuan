import { Elysia, t } from 'elysia';
import { authGuard } from '../../lib/auth-guard';
import { TransactionError, transactionService } from './transaction.service';

export const transactionController = new Elysia({ prefix: '/api/transactions' })
  .use(authGuard)
  .onError(({ error, set }) => {
    if (error instanceof TransactionError) {
      set.status = error.statusCode;
      return { error: error.message };
    }
  })
  .get(
    '/',
    async ({ query, user }) => {
      return transactionService.list({
        userId: user.id,
        type: query.type as 'expense' | 'income' | undefined,
        category: query.category,
        accountId: query.accountId,
        from: query.from,
        to: query.to,
        page: query.page ? Number(query.page) : undefined,
        limit: query.limit ? Number(query.limit) : undefined,
        sort: query.sort as 'date' | 'amount' | 'created_at' | undefined,
        order: query.order as 'asc' | 'desc' | undefined,
      });
    },
    {
      auth: true,
      query: t.Object({
        type: t.Optional(t.Union([t.Literal('expense'), t.Literal('income')])),
        category: t.Optional(t.String()),
        accountId: t.Optional(t.String()),
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
        page: t.Optional(t.String()),
        limit: t.Optional(t.String()),
        sort: t.Optional(
          t.Union([t.Literal('date'), t.Literal('amount'), t.Literal('created_at')]),
        ),
        order: t.Optional(t.Union([t.Literal('asc'), t.Literal('desc')])),
      }),
    },
  )
  .get(
    '/:id',
    async ({ params, user, set }) => {
      const tx = await transactionService.getById(params.id, user.id);
      if (!tx) {
        set.status = 404;
        return { error: 'Transaction not found' };
      }
      return { data: tx };
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) => {
      const updated = await transactionService.update(params.id, user.id, body);
      return { data: updated };
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: t.Object({
        amount: t.Optional(t.Number({ minimum: 0 })),
        description: t.Optional(t.String({ minLength: 1 })),
        categoryId: t.Optional(t.Number()),
        date: t.Optional(t.String()),
        type: t.Optional(t.Union([t.Literal('expense'), t.Literal('income')])),
        accountId: t.Optional(t.String({ format: 'uuid' })),
      }),
    },
  )
  .delete(
    '/:id',
    async ({ params, user, set }) => {
      await transactionService.remove(params.id, user.id);
      set.status = 204;
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
    },
  );
