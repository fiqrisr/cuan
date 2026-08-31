import { and, count, eq, gte, lte, sql } from 'drizzle-orm';
import { db, financialAccounts, transactions } from '@/db';
import { InternalServerError, NotFoundError } from '@/lib/error';
import { logger } from '@/middleware/logger';
import type { Transaction } from './transaction.schema';
import type {
  FormattedTransaction,
  PaginatedResult,
  TransactionFilters,
  TransactionStats,
  TransactionStatsFilters,
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
    const catMap = new Map<number, string>(cats.map(c => [c.id, c.label]));

    const data = rows.map(r => formatTransaction(r, catMap.get(r.categoryId) ?? null));

    return { data, meta: { page, limit, total } };
  }

  async getById(id: string, userId: string): Promise<FormattedTransaction | null> {
    const row = await db.query.transactions.findFirst({
      where: (tx, { and, eq }) => and(eq(tx.id, id), eq(tx.userId, userId)),
      with: { category: true },
    });
    if (!row) return null;
    return formatTransaction(row, row.category?.label ?? null);
  }
  async create(data: {
    userId: string;
    type: 'expense' | 'income';
    amount: number;
    currency: string;
    categoryId: number;
    description?: string;
    date: Date;
    accountId?: string;
  }): Promise<FormattedTransaction> {
    return db.transaction(async tx => {
      const [created] = await tx
        .insert(transactions)
        .values({
          userId: data.userId,
          type: data.type,
          amount: data.amount.toString(),
          currency: data.currency,
          categoryId: data.categoryId,
          description: data.description ?? '',
          date: data.date,
          accountId: data.accountId || null,
        })
        .returning();

      if (created.accountId) {
        const delta = created.type === 'expense' ? -data.amount : data.amount;
        await tx
          .update(financialAccounts)
          .set({ balance: sql`${financialAccounts.balance} + ${delta.toString()}::numeric` })
          .where(eq(financialAccounts.id, created.accountId));
      }

      const cat = await tx.query.categories.findFirst({
        where: (c, { eq }) => eq(c.id, data.categoryId),
      });

      return formatTransaction(created, cat?.label || null);
    });
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
    logger.info(
      { event: 'updating_transaction_db', transactionId: id },
      'running transaction update logic',
    );
    const existing = await db.query.transactions.findFirst({
      where: (tx, { and, eq }) => and(eq(tx.id, id), eq(tx.userId, userId)),
    });
    if (!existing) {
      throw new NotFoundError('Transaction not found');
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
    if (!updated) throw new InternalServerError('Failed to retrieve updated transaction');
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    logger.info(
      { event: 'removing_transaction_db', transactionId: id },
      'running transaction remove logic',
    );
    const existing = await db.query.transactions.findFirst({
      where: (tx, { and, eq }) => and(eq(tx.id, id), eq(tx.userId, userId)),
    });
    if (!existing) {
      throw new NotFoundError('Transaction not found');
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

  async getStats(filters: TransactionStatsFilters): Promise<TransactionStats> {
    const toDate = filters.to ? new Date(`${filters.to}T23:59:59.999Z`) : new Date();
    const fromDate = filters.from
      ? new Date(`${filters.from}T00:00:00.000Z`)
      : new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const conditions = [
      eq(transactions.userId, filters.userId),
      gte(transactions.date, fromDate),
      lte(transactions.date, toDate),
    ];

    if (filters.accountId) {
      conditions.push(eq(transactions.accountId, filters.accountId));
    }

    const rows = await db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(transactions.date);

    // 1. Calculate Summary Info
    let totalIncome = 0;
    let totalExpense = 0;

    for (const row of rows) {
      const amount = Number(row.amount);
      if (row.type === 'income') {
        totalIncome += amount;
      } else if (row.type === 'expense') {
        totalExpense += amount;
      }
    }

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

    // 2. Calculate Category Breakdown for Expenses
    const categoryAmountMap = new Map<number, number>();
    for (const row of rows) {
      if (row.type === 'expense') {
        const amount = Number(row.amount);
        const current = categoryAmountMap.get(row.categoryId) ?? 0;
        categoryAmountMap.set(row.categoryId, current + amount);
      }
    }

    const categoryIds = [...categoryAmountMap.keys()];
    const cats =
      categoryIds.length > 0
        ? await db.query.categories.findMany({
            where: (c, { inArray }) => inArray(c.id, categoryIds),
          })
        : [];
    const catMap = new Map<number, string>(cats.map(c => [c.id, c.label]));

    const categoriesBreakdown = Array.from(categoryAmountMap.entries())
      .map(([catId, amount]) => {
        const label = catMap.get(catId) ?? 'Uncategorized';
        const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
        return {
          id: catId,
          label,
          amount: Math.round(amount * 100) / 100,
          percentage: Math.round(percentage * 100) / 100,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // 3. Daily Stats (Time Series)
    // We want to generate all dates from fromDate to toDate (inclusive) formatted as YYYY-MM-DD
    const dailyMap = new Map<string, { income: number; expense: number }>();

    const currentDate = new Date(fromDate);
    // Use a safety counter to avoid infinite loops
    let safetyCounter = 0;
    while (currentDate <= toDate && safetyCounter < 1000) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dailyMap.set(dateStr, { income: 0, expense: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
      safetyCounter++;
    }
    // Also make sure to include the toDate itself (if not already included due to time components)
    const toDateStr = toDate.toISOString().split('T')[0];
    if (!dailyMap.has(toDateStr)) {
      dailyMap.set(toDateStr, { income: 0, expense: 0 });
    }

    for (const row of rows) {
      const dateStr = row.date.toISOString().split('T')[0];
      const amount = Number(row.amount);
      const dayData = dailyMap.get(dateStr) ?? { income: 0, expense: 0 };

      if (row.type === 'income') {
        dayData.income += amount;
      } else if (row.type === 'expense') {
        dayData.expense += amount;
      }

      dailyMap.set(dateStr, dayData);
    }

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        income: Math.round(data.income * 100) / 100,
        expense: Math.round(data.expense * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netSavings: Math.round(netSavings * 100) / 100,
        savingsRate: Math.round(savingsRate * 100) / 100,
      },
      categories: categoriesBreakdown,
      daily: dailyStats,
    };
  }
}

export const transactionService = new TransactionService();
