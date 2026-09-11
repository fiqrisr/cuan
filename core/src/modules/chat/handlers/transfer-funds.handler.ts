import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { financialAccounts, transactions } from '@/db/schema';
import { BadRequestError } from '@/lib/error';
import { logger } from '@/middleware/logger';
import { financialAccountService } from '@/modules/financial-account/financial-account.service';

export type TransferFundsParams = {
  sourceAccount: string;
  destinationAccount: string;
  amount: number;
  date: string;
  currency?: string;
};

export async function handleTransferFunds(params: TransferFundsParams, userId: string) {
  const { sourceAccount, destinationAccount, amount, date, currency = 'IDR' } = params;

  logger.info(
    { event: 'handle_transfer_funds', sourceAccount, destinationAccount, amount },
    'processing transfer funds intent',
  );

  if (sourceAccount.toLowerCase() === destinationAccount.toLowerCase()) {
    throw new BadRequestError('Source account and destination account cannot be the same.');
  }

  // 1. Fetch source account
  const sourceAcct = await financialAccountService.getByName(sourceAccount, userId);
  if (!sourceAcct) {
    throw new BadRequestError(`Source account '${sourceAccount}' not found.`);
  }

  // 2. Fetch destination account
  const destinationAcct = await financialAccountService.getByName(destinationAccount, userId);
  if (!destinationAcct) {
    throw new BadRequestError(`Destination account '${destinationAccount}' not found.`);
  }

  // 3. Find the 'transfer' category
  const cat = await db.query.categories.findFirst({
    where: (c, { eq, and, or, isNull }) =>
      and(eq(c.name, 'transfer'), or(eq(c.userId, userId), isNull(c.userId))),
  });
  if (!cat) {
    throw new BadRequestError("System category 'transfer' not found. Please seed the database.");
  }

  // 4. Perform database updates atomically via db.batch
  // (D1 has no interactive transactions)
  const [sourceRows, destRows] = await db.batch([
    // Insert outgoing transaction
    db
      .insert(transactions)
      .values({
        userId,
        accountId: sourceAcct.id,
        type: 'expense',
        amount: amount.toString(),
        currency,
        categoryId: cat.id,
        description: `Transfer to ${destinationAcct.name}`,
        date: new Date(date),
      })
      .returning(),
    // Insert incoming transaction
    db
      .insert(transactions)
      .values({
        userId,
        accountId: destinationAcct.id,
        type: 'income',
        amount: amount.toString(),
        currency,
        categoryId: cat.id,
        description: `Transfer from ${sourceAcct.name}`,
        date: new Date(date),
      })
      .returning(),
    // Deduct balance from source account
    db
      .update(financialAccounts)
      .set({
        balance: sql`${financialAccounts.balance} - ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(financialAccounts.id, sourceAcct.id)),
    // Add balance to destination account
    db
      .update(financialAccounts)
      .set({
        balance: sql`${financialAccounts.balance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(financialAccounts.id, destinationAcct.id)),
  ]);
  const [sourceTx] = sourceRows;
  const [destTx] = destRows;

  logger.info(
    { event: 'transfer_recorded', sourceTxId: sourceTx.id, destTxId: destTx.id },
    'transfer recorded successfully',
  );

  // Fetch updated balances
  const updatedSource = await financialAccountService.getById(sourceAcct.id, userId);
  const updatedDest = await financialAccountService.getById(destinationAcct.id, userId);

  return {
    transfer: {
      sourceAccount: {
        id: sourceAcct.id,
        name: sourceAcct.name,
        balance: Number(updatedSource?.balance ?? 0),
      },
      destinationAccount: {
        id: destinationAcct.id,
        name: destinationAcct.name,
        balance: Number(updatedDest?.balance ?? 0),
      },
      amount,
      date,
      transactions: [
        {
          id: sourceTx.id,
          userId: sourceTx.userId,
          accountId: sourceTx.accountId,
          type: sourceTx.type,
          amount: Number(sourceTx.amount),
          currency: sourceTx.currency,
          category: cat.label,
          description: sourceTx.description,
          date: sourceTx.date.toISOString(),
          createdAt: sourceTx.createdAt.toISOString(),
          updatedAt: sourceTx.updatedAt.toISOString(),
        },
        {
          id: destTx.id,
          userId: destTx.userId,
          accountId: destTx.accountId,
          type: destTx.type,
          amount: Number(destTx.amount),
          currency: destTx.currency,
          category: cat.label,
          description: destTx.description,
          date: destTx.date.toISOString(),
          createdAt: destTx.createdAt.toISOString(),
          updatedAt: destTx.updatedAt.toISOString(),
        },
      ],
    },
  };
}
