import type { Pino as Logger } from 'logixlysia';
import { transactions } from '../../../db/schema';
import { db } from '../../../lib/db';
import type { z } from 'zod';
import type { extractedTransactionSchema } from '../../../lib/openmodel.schema';
import { financialAccountService } from '../../financial-account/financial-account.service';
import type { ChatResult, SavedTransaction } from '../chat.types';

export async function handleAddTransaction(
  transactionsParams: z.infer<typeof extractedTransactionSchema>[],
  userId: string,
  log: Logger,
) {
  log.info(
    { event: 'handle_add_transaction', transactionCount: transactionsParams.length },
    'adding transactions from chat',
  );
  const saved: SavedTransaction[] = [];

  for (const tx of transactionsParams) {
    const result = await processSingleTransaction(tx, userId, log);
    if ('error' in result) {
      log.warn(
        { event: 'add_transaction_failed', reason: result.error, transaction: tx },
        'failed to process single transaction',
      );
      // If one fails, we throw so the LLM knows it failed
      throw new Error(result.error);
    }
    saved.push(result.saved);
  }

  return { savedTransactions: saved };
}

async function processSingleTransaction(
  tx: z.infer<typeof extractedTransactionSchema>,
  userId: string,
  log: Logger,
): Promise<{ error: string } | { saved: SavedTransaction }> {
  let accountId: string | null = null;
  if (tx.accountName) {
    const acct = await financialAccountService.getByName(tx.accountName, userId);
    if (acct) accountId = acct.id;
  }
  if (!accountId) {
    const defaultAcct = await financialAccountService.getDefault(userId);
    if (defaultAcct) accountId = defaultAcct.id;
  }

  const cat = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.name, tx.category),
  });
  if (!cat) {
    log.warn({ event: 'category_not_found', category: tx.category }, 'category not found');
    return { error: `Kategori '${tx.category}' tidak ditemukan.` };
  }

  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      accountId,
      type: tx.type,
      amount: tx.amount.toString(),
      currency: tx.currency,
      categoryId: cat.id,
      description: tx.description,
      date: new Date(tx.date),
    })
    .returning();

  log.info(
    { event: 'transaction_created', transactionId: row.id, amount: tx.amount },
    'transaction created successfully',
  );
  if (accountId) {
    const delta = tx.type === 'expense' ? -tx.amount : tx.amount;
    await financialAccountService.adjustBalance(accountId, delta);
  }

  return {
    saved: {
      id: row.id,
      userId: row.userId,
      accountId: row.accountId,
      type: row.type,
      amount: Number(row.amount),
      currency: row.currency,
      category: cat.name,
      description: row.description,
      date: row.date.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    },
  };
}
