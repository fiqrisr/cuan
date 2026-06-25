import { and, count, desc, eq, gte, lte, type SQL, sum } from 'drizzle-orm';
import { transactions } from '../../../db/schema';
import { db } from '../../../lib/db';
import type { QueryResponse } from '../../../lib/openmodel.schema';
import { financialAccountService } from '../../financial-account/financial-account.service';
import type { ChatResult } from '../chat.types';

export async function handleQuery(response: QueryResponse, userId: string): Promise<ChatResult> {
  const { queryType, filters } = response.query;
  const conditions = [eq(transactions.userId, userId)];

  if (filters.type) {
    conditions.push(eq(transactions.type, filters.type));
  }
  if (filters.period) {
    conditions.push(gte(transactions.date, new Date(filters.period.from)));
    conditions.push(lte(transactions.date, new Date(filters.period.to)));
  }

  const categoryName = filters.category;
  if (categoryName) {
    const cat = await db.query.categories.findFirst({
      where: (c, { eq }) => eq(c.name, categoryName),
    });
    if (cat) conditions.push(eq(transactions.categoryId, cat.id));
  }

  if (filters.accountName) {
    const acct = await financialAccountService.getByName(filters.accountName, userId);
    if (acct) conditions.push(eq(transactions.accountId, acct.id));
  }

  const where = and(...conditions);
  const limit = filters.limit ?? 10;

  switch (queryType) {
    case 'biggest_expense':
      return getBiggestTransaction(conditions, 'expense');
    case 'biggest_income':
      return getBiggestTransaction(conditions, 'income');
    case 'total_spent':
      return getTotalAmount(conditions, 'expense');
    case 'total_income':
      return getTotalAmount(conditions, 'income');
    case 'transaction_count':
      return getTransactionCount(where);
    case 'recent_transactions':
      return getRecentTransactions(where, limit);
    case 'category_breakdown':
      return getCategoryBreakdown(where);
    default:
      return { intent: 'query', reply: 'Maaf, query tidak dikenali.' };
  }
}

async function getBiggestTransaction(
  baseConditions: SQL<unknown>[],
  type: 'expense' | 'income',
): Promise<ChatResult> {
  const label = type === 'expense' ? 'Pengeluaran' : 'Pemasukan';
  const conditions = [...baseConditions, eq(transactions.type, type)];

  const rows = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.amount))
    .limit(1);

  if (rows.length === 0) {
    return {
      intent: 'query',
      reply: `Tidak ada ${label.toLowerCase()} ditemukan pada periode ini.`,
    };
  }

  const tx = rows[0];
  const cat = await db.query.categories.findFirst({
    where: (c, { eq }) => eq(c.id, tx.categoryId),
  });

  return {
    intent: 'query',
    reply: `${label} terbesar: ${tx.description} sebesar ${Number(tx.amount).toLocaleString('id-ID')} ${tx.currency} (${cat?.label ?? tx.categoryId}) pada ${tx.date.toLocaleDateString('id-ID')}.`,
    queryResult: { transaction: { ...tx, amount: Number(tx.amount), category: cat?.name } },
  };
}

async function getTotalAmount(
  baseConditions: SQL<unknown>[],
  type: 'expense' | 'income',
): Promise<ChatResult> {
  const label = type === 'expense' ? 'pengeluaran' : 'pemasukan';
  const conditions = [...baseConditions, eq(transactions.type, type)];

  const [result] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(and(...conditions));

  const total = Number(result?.total ?? 0);
  return {
    intent: 'query',
    reply: `Total ${label}: ${total.toLocaleString('id-ID')} IDR.`,
    queryResult: { total },
  };
}

async function getTransactionCount(where: SQL<unknown> | undefined): Promise<ChatResult> {
  const [result] = await db.select({ count: count() }).from(transactions).where(where);
  return {
    intent: 'query',
    reply: `Jumlah transaksi: ${result?.count ?? 0}.`,
    queryResult: { count: result?.count ?? 0 },
  };
}

async function getRecentTransactions(
  where: SQL<unknown> | undefined,
  limit: number,
): Promise<ChatResult> {
  const rows = await db
    .select()
    .from(transactions)
    .where(where)
    .orderBy(desc(transactions.date))
    .limit(limit);

  const catMap = await getCategoryMap(rows.map(r => r.categoryId));

  const formatted = rows.map(r => ({
    ...r,
    amount: Number(r.amount),
    category: catMap.get(r.categoryId) ?? null,
  }));

  const lines = formatted.map(
    (t, i) =>
      `${i + 1}. ${t.description} - ${t.amount.toLocaleString('id-ID')} ${t.currency} (${t.type})`,
  );

  return {
    intent: 'query',
    reply: `Transaksi terbaru:\n${lines.join('\n')}`,
    queryResult: { transactions: formatted },
  };
}

async function getCategoryBreakdown(where: SQL<unknown> | undefined): Promise<ChatResult> {
  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      total: sum(transactions.amount),
      count: count(),
    })
    .from(transactions)
    .where(where)
    .groupBy(transactions.categoryId)
    .orderBy(desc(sum(transactions.amount)));

  const catMap = await getCategoryMap(rows.map(r => r.categoryId));

  const breakdown = rows.map(r => ({
    category: catMap.get(r.categoryId) ?? 'unknown',
    total: Number(r.total ?? 0),
    count: r.count,
  }));

  const lines = breakdown.map(
    b => `- ${b.category}: ${b.total.toLocaleString('id-ID')} IDR (${b.count}x)`,
  );

  return {
    intent: 'query',
    reply: `Ringkasan per kategori:\n${lines.join('\n')}`,
    queryResult: { breakdown },
  };
}

async function getCategoryMap(categoryIds: number[]): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(categoryIds)];
  if (uniqueIds.length === 0) return new Map();

  const cats = await db.query.categories.findMany({
    where: (c, { inArray }) => inArray(c.id, uniqueIds),
  });

  return new Map(cats.map(c => [c.id, c.name]));
}
