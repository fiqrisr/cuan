import { and, count, eq, gte, lte, sql } from 'drizzle-orm';
import { financialAccounts, transactions } from '../../db/schema';
import { db } from '../../lib/db';
import type { Transaction } from './transaction.schema';
import type {
  FormattedTransaction,
  PaginatedResult,
  TransactionFilters,
} from './transaction.types';

function formatTransaction(tx: Transaction, categoryName: string | null): FormattedTransaction {
  return {
    id: tx.id,
    userId: tx.userId,
    accountId: tx.accountId,
    type: tx.type,
    amount: Number(tx.amount),
    currency: tx.currency,
    categoryId: tx.categoryId,
    category: categoryName,
    description: tx.description,
    date: tx.date.toISOString(),
    createdAt: tx.createdAt.toISOString(),
    updatedAt: tx.updatedAt.toISOString(),
  };
}

export class TransactionService {
  async list(filters: TransactionFilters): Promise<PaginatedResult> {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const conditions = [eq(transactions.userId, filters.userId)];

    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type));
    }
    if (filters.accountId) {
      conditions.push(eq(transactions.accountId, filters.accountId));
    }
    if (filters.from) {
      conditions.push(gte(transactions.date, new Date(filters.from)));
    }
    if (filters.to) {
      conditions.push(lte(transactions.date, new Date(filters.to)));
    }

    const categoryName = filters.category;
    if (categoryName) {
      const cat = await db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.name, categoryName),
      });
      if (cat) {
        conditions.push(eq(transactions.categoryId, cat.id));
      } else {
        return { data: [], meta: { page, limit, total: 0 } };
      }
    }

    const whereClause = and(...conditions);

    const sortCol =
      filters.sort === 'amount'
        ? transactions.amount
        : filters.sort === 'created_at'
          ? transactions.createdAt
          : transactions.date;

    const orderFn = filters.order === 'asc' ? sql`${sortCol} asc` : sql`${sortCol} desc`;

    const [rows, totalResult] = await Promise.all([
      db
        .select()
        .from(transactions)
        .where(whereClause)
        .orderBy(orderFn)
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(transactions).where(whereClause),
    ]);

    const total = totalResult[0]?.count ?? 0;

    // Batch-fetch category names
    const categoryIds = [...new Set(rows.map(r => r.categoryId))];
    const cats =
      categoryIds.length > 0
        ? await db.query.categories.findMany({
            where: (c, { inArray }) => inArray(c.id, categoryIds),
          })
        : [];
    const catMap = new Map(cats.map(c => [c.id, c.name]));

    const data = rows.map(r => formatTransaction(r, catMap.get(r.categoryId) ?? null));

    return { data, meta: { page, limit, total } };
  }

  async getById(id: string, userId: string): Promise<FormattedTransaction | null> {
    const row = await db.query.transactions.findFirst({
      where: (tx, { and, eq }) => and(eq(tx.id, id), eq(tx.userId, userId)),
      with: { category: true },
    });
    if (!row) return null;
    return formatTransaction(row, row.category?.name ?? null);
  }

  async update(
    id: string,
    userId: string,
    data: {
      amount?: number;
      description?: string;
      categoryId?: number;
      date?: string;
      type?: 'expense' | 'income';
      accountId?: string;
    },
  ): Promise<FormattedTransaction> {
    const existing = await db.query.transactions.findFirst({
      where: (tx, { and, eq }) => and(eq(tx.id, id), eq(tx.userId, userId)),
    });
    if (!existing) {
      throw new TransactionError('Transaction not found', 404);
    }

    // Calculate balance adjustments if amount or type changed
    const oldAmount = Number(existing.amount);
    const newAmount = data.amount ?? oldAmount;
    const oldType = existing.type;
    const newType = data.type ?? oldType;
    const oldAccountId = existing.accountId;
    const newAccountId = data.accountId ?? oldAccountId;

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (data.amount !== undefined) updateValues.amount = data.amount.toString();
    if (data.description !== undefined) updateValues.description = data.description;
    if (data.categoryId !== undefined) updateValues.categoryId = data.categoryId;
    if (data.date !== undefined) updateValues.date = new Date(data.date);
    if (data.type !== undefined) updateValues.type = data.type;
    if (data.accountId !== undefined) updateValues.accountId = data.accountId;

    await db.transaction(async tx => {
      await tx
        .update(transactions)
        .set(updateValues)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

      // Reverse old balance impact
      if (oldAccountId) {
        const oldDelta = oldType === 'expense' ? oldAmount : -oldAmount;
        await tx
          .update(financialAccounts)
          .set({
            balance: sql`${financialAccounts.balance} + ${oldDelta}`,
            updatedAt: new Date(),
          })
          .where(eq(financialAccounts.id, oldAccountId));
      }

      // Apply new balance impact
      const effectiveAccountId = newAccountId;
      if (effectiveAccountId) {
        const newDelta = newType === 'expense' ? -newAmount : newAmount;
        await tx
          .update(financialAccounts)
          .set({
            balance: sql`${financialAccounts.balance} + ${newDelta}`,
            updatedAt: new Date(),
          })
          .where(eq(financialAccounts.id, effectiveAccountId));
      }
    });

    const updated = await this.getById(id, userId);
    if (!updated) throw new TransactionError('Failed to retrieve updated transaction', 500);
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await db.query.transactions.findFirst({
      where: (tx, { and, eq }) => and(eq(tx.id, id), eq(tx.userId, userId)),
    });
    if (!existing) {
      throw new TransactionError('Transaction not found', 404);
    }

    await db.transaction(async tx => {
      // Reverse balance impact
      if (existing.accountId) {
        const amount = Number(existing.amount);
        const delta = existing.type === 'expense' ? amount : -amount;
        await tx
          .update(financialAccounts)
          .set({
            balance: sql`${financialAccounts.balance} + ${delta}`,
            updatedAt: new Date(),
          })
          .where(eq(financialAccounts.id, existing.accountId));
      }

      await tx
        .delete(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    });
  }
}

export class TransactionError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'TransactionError';
  }
}

export const transactionService = new TransactionService();
