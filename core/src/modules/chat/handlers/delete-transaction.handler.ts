import { db } from '@/db';
import { BadRequestError } from '@/lib/error';
import { logger } from '@/middleware/logger';
import { transactionService } from '@/modules/transaction/transaction.service';

export type DeleteTransactionParams = {
  transactionId?: string;
  reason?: string;
};

export async function handleDeleteTransaction(params: DeleteTransactionParams, userId: string) {
  logger.info(
    { event: 'handle_delete_transaction', params, userId },
    'deleting transaction from chat',
  );

  const targetId = params.transactionId;
  const target = targetId
    ? await db.query.transactions.findFirst({
        where: (tx, { and, eq }) => and(eq(tx.id, targetId), eq(tx.userId, userId)),
      })
    : await db.query.transactions.findFirst({
        where: (tx, { eq }) => eq(tx.userId, userId),
        orderBy: (tx, { desc }) => [desc(tx.createdAt)],
      });

  if (!target) {
    throw new BadRequestError('No recent transaction found to delete.');
  }

  const deletedInfo = {
    id: target.id,
    description: target.description,
    amount: Number(target.amount),
    currency: target.currency,
    type: target.type,
  };

  await transactionService.remove(target.id, userId);

  logger.info(
    { event: 'transaction_deleted_from_chat', transactionId: target.id, userId },
    'transaction deleted from chat successfully',
  );

  return { deletedTransaction: deletedInfo };
}
