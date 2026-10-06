import { and, count, eq, gte, like, lte, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { db, financialAccounts, transactions } from '@/db';
import { BadRequestError, InternalServerError, NotFoundError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
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
    if (filters.search && filters.search.trim().length > 0) {
      conditions.push(like(transactions.description, `%${filters.search.trim()}%`));
    }

    if (filters.minAmount !== undefined) {
      conditions.push(gte(sql`CAST(${transactions.amount} AS REAL)`, filters.minAmount));
    }

    if (filters.maxAmount !== undefined) {
      conditions.push(lte(sql`CAST(${transactions.amount} AS REAL)`, filters.maxAmount));
    }

    if (filters.categoryId !== undefined) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    }

    const categoryName = filters.category;
    if (categoryName) {
      const cat = await db.query.categories.findFirst({
        where: (c, { eq, or }) => or(eq(c.name, categoryName), eq(c.label, categoryName)),
      });
      if (cat) {
        conditions.push(eq(transactions.categoryId, cat.id));
      } else {
        return {
          data: [],
          meta: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            summary: { totalIncome: 0, totalExpense: 0, netCashflow: 0 },
          },
        };
      }
    }

    const whereClause = and(...conditions);

    const sortCol =
      filters.sort === 'amount'
        ? sql`CAST(${transactions.amount} AS REAL)`
        : filters.sort === 'created_at'
          ? transactions.createdAt
          : transactions.date;

    const orderFn = filters.order === 'asc' ? sql`${sortCol} asc` : sql`${sortCol} desc`;

    const [rows, [aggResult]] = await Promise.all([
      db
        .select()
        .from(transactions)
        .where(whereClause)
        .orderBy(orderFn)
        .limit(limit)
        .offset(offset),
      db
        .select({
          totalCount: count(),
          totalIncome: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'income' THEN CAST(${transactions.amount} AS REAL) ELSE 0 END), 0)`,
          totalExpense: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'expense' THEN CAST(${transactions.amount} AS REAL) ELSE 0 END), 0)`,
        })
        .from(transactions)
        .where(whereClause),
    ]);

    const total = aggResult?.totalCount ?? 0;
    const totalIncome = Number(aggResult?.totalIncome ?? 0);
    const totalExpense = Number(aggResult?.totalExpense ?? 0);
    const netCashflow = totalIncome - totalExpense;
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

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        summary: {
          totalIncome,
          totalExpense,
          netCashflow,
        },
      },
    };
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
    if (data.accountId) {
      const targetAccountId = data.accountId;
      const acct = await db.query.financialAccounts.findFirst({
        where: (fa, { and, eq }) => and(eq(fa.id, targetAccountId), eq(fa.userId, data.userId)),
      });
      if (!acct) {
        throw new NotFoundError('Financial account not found');
      }
    }

    const cat = await db.query.categories.findFirst({
      where: (c, { eq, and, or, isNull }) =>
        and(eq(c.id, data.categoryId), or(eq(c.userId, data.userId), isNull(c.userId))),
    });
    if (!cat) {
      throw new NotFoundError('Category not found');
    }

    const insertStmt = db
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

    // D1 has no interactive transactions; db.batch is the atomic unit.
    const balanceDelta = data.type === 'expense' ? -data.amount : data.amount;
    const startBatch = performance.now();
    const results = data.accountId
      ? await db.batch([
          insertStmt,
          db
            .update(financialAccounts)
            .set({ balance: sql`${financialAccounts.balance} + ${balanceDelta}` })
            .where(
              and(
                eq(financialAccounts.id, data.accountId),
                eq(financialAccounts.userId, data.userId),
              ),
            ),
        ])
      : await db.batch([insertStmt]);
    const batchDurationMs = Math.round(performance.now() - startBatch);
    metrics.recordD1Batch(data.accountId ? 2 : 1, batchDurationMs);
    const [created] = results[0];

    logger.info(
      {
        event: 'transaction_created',
        transactionId: created.id,
        userId: data.userId,
        type: data.type,
        amount: data.amount,
        accountId: data.accountId,
        batchDurationMs,
      },
      'Transaction created and account balance updated via atomic batch',
    );
    return formatTransaction(created, cat.label);
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
      accountId?: string | null;
    },
  ): Promise<FormattedTransaction> {
    const existing = await db.query.transactions.findFirst({
      where: (tx, { and, eq }) => and(eq(tx.id, id), eq(tx.userId, userId)),
    });
    if (!existing) {
      throw new NotFoundError('Transaction not found');
    }

    // Validate and process new amount/type
    const oldAmount = Number(existing.amount);
    const newAmount = data.amount !== undefined ? Number(data.amount) : oldAmount;
    if (Number.isNaN(newAmount) || newAmount < 0) {
      throw new BadRequestError('Invalid amount');
    }

    const oldType = existing.type;
    const newType = data.type ?? oldType;

    const oldAccountId = existing.accountId;
    const newAccountId = data.accountId !== undefined ? data.accountId : oldAccountId;

    // Validate account if changing/setting
    if (newAccountId) {
      const acct = await db.query.financialAccounts.findFirst({
        where: (fa, { and, eq }) => and(eq(fa.id, newAccountId), eq(fa.userId, userId)),
      });
      if (!acct) {
        throw new NotFoundError('Financial account not found');
      }
    }

    // Validate category if changing
    if (data.categoryId !== undefined) {
      const catId = Number(data.categoryId);
      const cat = await db.query.categories.findFirst({
        where: (c, { eq, and, or, isNull }) =>
          and(eq(c.id, catId), or(eq(c.userId, userId), isNull(c.userId))),
      });
      if (!cat) {
        throw new NotFoundError('Category not found');
      }
    }

    // Validate date if changing
    let parsedDate: Date | undefined;
    if (data.date !== undefined) {
      parsedDate = new Date(data.date);
      if (Number.isNaN(parsedDate.getTime())) {
        throw new BadRequestError('Invalid date format');
      }
    }

    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    if (data.amount !== undefined) updateValues.amount = newAmount.toString();
    if (data.description !== undefined) updateValues.description = data.description;
    if (data.categoryId !== undefined) updateValues.categoryId = Number(data.categoryId);
    if (parsedDate !== undefined) updateValues.date = parsedDate;
    if (data.type !== undefined) updateValues.type = data.type;
    if (data.accountId !== undefined) updateValues.accountId = data.accountId;

    // D1 has no interactive transactions; db.batch is the atomic unit.
    const statements: BatchItem<'sqlite'>[] = [
      db
        .update(transactions)
        .set(updateValues)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId))),
    ];

    if (oldAccountId === newAccountId) {
      // Account didn't change - compute net delta on the same account
      if (oldAccountId) {
        const oldImpact = oldType === 'expense' ? -oldAmount : oldAmount;
        const newImpact = newType === 'expense' ? -newAmount : newAmount;
        const netDelta = newImpact - oldImpact;

        if (netDelta !== 0) {
          statements.push(
            db
              .update(financialAccounts)
              .set({
                balance: sql`${financialAccounts.balance} + ${netDelta}`,
                updatedAt: new Date(),
              })
              .where(eq(financialAccounts.id, oldAccountId)),
          );
        }
      }
    } else {
      // Account changed - reverse old impact on oldAccountId and apply new impact on newAccountId
      if (oldAccountId) {
        const oldDelta = oldType === 'expense' ? oldAmount : -oldAmount;
        statements.push(
          db
            .update(financialAccounts)
            .set({
              balance: sql`${financialAccounts.balance} + ${oldDelta}`,
              updatedAt: new Date(),
            })
            .where(eq(financialAccounts.id, oldAccountId)),
        );
      }

      if (newAccountId) {
        const newDelta = newType === 'expense' ? -newAmount : newAmount;
        statements.push(
          db
            .update(financialAccounts)
            .set({
              balance: sql`${financialAccounts.balance} + ${newDelta}`,
              updatedAt: new Date(),
            })
            .where(eq(financialAccounts.id, newAccountId)),
        );
      }
    }

    const startBatch = performance.now();
    await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
    const batchDurationMs = Math.round(performance.now() - startBatch);
    metrics.recordD1Batch(statements.length, batchDurationMs);

    logger.info(
      {
        event: 'transaction_updated',
        transactionId: id,
        userId,
        statementCount: statements.length,
        batchDurationMs,
        effectiveAccountId: newAccountId,
      },
      'Transaction updated and account balance adjusted via atomic batch',
    );
    const updated = await this.getById(id, userId);
    if (!updated) throw new InternalServerError('Failed to retrieve updated transaction');
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await db.query.transactions.findFirst({
      where: (tx, { and, eq }) => and(eq(tx.id, id), eq(tx.userId, userId)),
    });
    if (!existing) {
      throw new NotFoundError('Transaction not found');
    }

    // D1 has no interactive transactions; db.batch is the atomic unit.
    const statements: BatchItem<'sqlite'>[] = [
      db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId))),
    ];

    // Reverse balance impact
    if (existing.accountId) {
      const amount = Number(existing.amount);
      const delta = existing.type === 'expense' ? amount : -amount;
      statements.push(
        db
          .update(financialAccounts)
          .set({
            balance: sql`${financialAccounts.balance} + ${delta}`,
            updatedAt: new Date(),
          })
          .where(eq(financialAccounts.id, existing.accountId)),
      );
    }

    // db.batch types require a fixed tuple; the balance statement is optional.
    const startBatch = performance.now();
    await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
    const batchDurationMs = Math.round(performance.now() - startBatch);
    metrics.recordD1Batch(statements.length, batchDurationMs);

    logger.info(
      {
        event: 'transaction_deleted',
        transactionId: id,
        userId,
        statementCount: statements.length,
        batchDurationMs,
      },
      'Transaction deleted and account balance adjusted via atomic batch',
    );
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
