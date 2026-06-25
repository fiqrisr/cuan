import { transactions } from '../../../db/schema';
import { db } from '../../../lib/db';
import type { AddTransactionResponse } from '../../../lib/openmodel.schema';
import { financialAccountService } from '../../financial-account/financial-account.service';
import type { ChatResult, SavedTransaction } from '../chat.types';

export async function handleAddTransaction(
  response: AddTransactionResponse,
  userId: string,
): Promise<ChatResult> {
  const saved: SavedTransaction[] = [];

  for (const tx of response.transactions) {
    const result = await processSingleTransaction(tx, userId);
    if ('error' in result) {
      return {
        intent: 'add_transaction',
        reply: result.error,
      };
    }
    saved.push(result.saved);
  }

  return {
    intent: 'add_transaction',
    reply: response.reply,
    transactions: saved,
  };
}

async function processSingleTransaction(
  tx: AddTransactionResponse['transactions'][0],
  userId: string,
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
