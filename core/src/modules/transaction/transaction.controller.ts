import { Elysia, t } from 'elysia';
import { authGuard } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import {
  ListTransactionsRequestDto,
  ListTransactionsResponseDto,
  TransactionResponseDto,
  UpdateTransactionRequestDto,
} from './transaction.dto';
import { TransactionError, transactionService } from './transaction.service';

export const transactionController = new Elysia({ prefix: '/api/transactions' })
  .use(authGuard)
  .onError(({ error, set }) => {
    if (error instanceof TransactionError) {
      set.status = error.statusCode;
      return { error: error.message };
    }
    return undefined;
  })
  .get(
    '/',
    async ({ query, user }) => {
      logger.info({ event: 'list_transactions', query }, 'listing transactions');
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
      query: ListTransactionsRequestDto,
      response: ListTransactionsResponseDto,
    },
  )
  .get(
    '/:id',
    async ({ params, user, set }) => {
      logger.info(
        { event: 'get_transaction', transactionId: params.id },
        'fetching transaction details',
      );
      const tx = await transactionService.getById(params.id, user.id);
      if (!tx) {
        logger.warn(
          { event: 'transaction_not_found', transactionId: params.id },
          'transaction not found',
        );
        set.status = 404;
        return { error: 'Transaction not found' };
      }
      return { data: tx };
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      response: {
        200: TransactionResponseDto,
        404: t.Object({ error: t.String() }),
      },
    },
  )
  .patch(
    '/:id',
    async ({ params, body, user }) => {
      logger.info(
        { event: 'update_transaction', transactionId: params.id, updates: body },
        'updating transaction',
      );
      const updated = await transactionService.update(params.id, user.id, body);
      return { data: updated };
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      body: UpdateTransactionRequestDto,
      response: TransactionResponseDto,
    },
  )
  .delete(
    '/:id',
    async ({ params, user, set }) => {
      logger.info(
        { event: 'delete_transaction', transactionId: params.id },
        'deleting transaction',
      );
      await transactionService.remove(params.id, user.id);
      set.status = 204;
    },
    {
      auth: true,
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
    },
  );
