import { db } from '@/db';
import { BadRequestError } from '@/lib/error';
import { logger } from '@/middleware/logger';
import { financialAccountService } from '@/modules/financial-account/financial-account.service';
import { transactionService } from '@/modules/transaction/transaction.service';

export type UpdateTransactionParams = {
  transactionId?: string;
  amount?: number;
  category?: string;
  accountName?: string;
  description?: string;
  date?: string;
  type?: 'expense' | 'income';
};

export async function handleUpdateTransaction(params: UpdateTransactionParams, userId: string) {
  logger.info(
    { event: 'handle_update_transaction', params, userId },
    'updating transaction from chat',
  );

  let targetId = params.transactionId;

  if (!targetId) {
    const latest = await db.query.transactions.findFirst({
      where: (tx, { eq }) => eq(tx.userId, userId),
      orderBy: (tx, { desc }) => [desc(tx.createdAt)],
    });

    if (!latest) {
      throw new BadRequestError('No recent transaction found to update.');
    }
    targetId = latest.id;
  }

  let accountId: string | undefined;
  if (params.accountName) {
    const acct = await financialAccountService.getByName(params.accountName, userId);
    if (!acct) {
      throw new BadRequestError(`Financial account '${params.accountName}' not found.`);
    }
    accountId = acct.id;
  }

  let categoryId: number | undefined;
  const categoryName = params.category;
  if (categoryName) {
    const cat = await db.query.categories.findFirst({
      where: (c, { eq, and, or, isNull }) =>
        and(eq(c.name, categoryName), or(eq(c.userId, userId), isNull(c.userId))),
    });
    if (!cat) {
      throw new BadRequestError(`Category '${categoryName}' not found.`);
    }
    categoryId = cat.id;
  }

  const updated = await transactionService.update(targetId, userId, {
    amount: params.amount,
    accountId,
    categoryId,
    description: params.description,
    date: params.date,
    type: params.type,
  });

  logger.info(
    { event: 'transaction_updated_from_chat', transactionId: targetId, userId },
    'transaction updated from chat successfully',
  );

  return { updatedTransaction: updated };
}
