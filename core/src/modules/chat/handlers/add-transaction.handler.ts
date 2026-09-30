import type { z } from 'zod';
import { db } from '@/db';
import { BadRequestError } from '@/lib/error';
import { logger } from '@/middleware/logger';
import type { SavedTransaction } from '@/modules/chat/chat.types';
import { financialAccountService } from '@/modules/financial-account/financial-account.service';
import { transactionService } from '@/modules/transaction/transaction.service';
import type { extractedTransactionSchema } from '../chat.ai-schema';
export async function handleAddTransaction(
  transactionsParams: z.infer<typeof extractedTransactionSchema>[],
  userId: string,
) {
  logger.info(
    { event: 'handle_add_transaction', transactionCount: transactionsParams.length },
    'adding transactions from chat',
  );
  const saved: SavedTransaction[] = [];

  for (const tx of transactionsParams) {
    const result = await processSingleTransaction(tx, userId);
    if ('error' in result) {
      logger.warn(
        { event: 'add_transaction_failed', reason: result.error, transaction: tx },
        'failed to process single transaction',
      );
      // If one fails, we throw so the LLM knows it failed
      throw new BadRequestError(result.error);
    }
    saved.push(result.saved);
  }

  return { savedTransactions: saved };
}

async function processSingleTransaction(
  tx: z.infer<typeof extractedTransactionSchema>,
  userId: string,
): Promise<{ error: string } | { saved: SavedTransaction }> {
  let accountId: string | null = null;
  let accountName: string | null = null;
  if (tx.accountName) {
    const acct = await financialAccountService.getByName(tx.accountName, userId);
    if (acct) {
      accountId = acct.id;
      accountName = acct.name;
    }
  }
  if (!accountId) {
    const defaultAcct = await financialAccountService.getDefault(userId);
    if (defaultAcct) {
      accountId = defaultAcct.id;
      accountName = defaultAcct.name;
    }
  }

  const cat = await db.query.categories.findFirst({
    where: (c, { eq, and, or, isNull }) =>
      and(eq(c.name, tx.category), or(eq(c.userId, userId), isNull(c.userId))),
  });
  if (!cat) {
    logger.warn({ event: 'category_not_found', category: tx.category }, 'category not found');
    return { error: `Category '${tx.category}' not found.` };
  }

  const created = await transactionService.create({
    userId,
    accountId: accountId ?? undefined,
    type: tx.type,
    amount: tx.amount,
    currency: tx.currency,
    categoryId: cat.id,
    description: tx.description,
    date: new Date(tx.date),
  });

  return {
    saved: {
      id: created.id,
      userId: created.userId,
      accountId: created.accountId,
      accountName,
      type: created.type as 'expense' | 'income',
      amount: created.amount,
      currency: created.currency,
      category: created.category ?? cat.label,
      description: created.description,
      date: created.date,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    },
  };
}
