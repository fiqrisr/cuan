import { and, count, desc, eq, gte, lte, sum } from 'drizzle-orm';
import { transactions } from '../../db/schema';
import { db } from '../../lib/db';
import { env } from '../../lib/env';
import { createOpenModelClient } from '../../lib/openmodel';
import type {
  AddTransactionResponse,
  ChatResponse,
  ManageAccountResponse,
  QueryResponse,
} from '../../lib/openmodel.schema';
import { financialAccountService } from '../financial-account/financial-account.service';

const openmodel = createOpenModelClient({
  apiKey: env.OPENMODEL_API_KEY,
  baseUrl: env.OPENMODEL_BASE_URL,
  model: env.OPENMODEL_MODEL,
});

export interface ChatResult {
  intent: string;
  reply: string;
  transactions?: SavedTransaction[];
  queryResult?: unknown;
  account?: unknown;
  accounts?: unknown[];
}

export interface SavedTransaction {
  id: string;
  userId: string;
  accountId: string | null;
  type: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export class ChatService {
  async processChat(message: string, userId: string): Promise<ChatResult> {
    const aiResponse: ChatResponse = await openmodel.chat(message);

    switch (aiResponse.intent) {
      case 'add_transaction':
        return this.handleAddTransaction(aiResponse, userId);
      case 'query':
        return this.handleQuery(aiResponse, userId);
      case 'manage_account':
        return this.handleManageAccount(aiResponse, userId);
    }
  }

  private async handleAddTransaction(
    response: AddTransactionResponse,
    userId: string,
  ): Promise<ChatResult> {
    const saved: SavedTransaction[] = [];

    for (const tx of response.transactions) {
      // Resolve account
      let accountId: string | null = null;
      if (tx.accountName) {
        const acct = await financialAccountService.getByName(tx.accountName, userId);
        if (acct) accountId = acct.id;
      }
      if (!accountId) {
        const defaultAcct = await financialAccountService.getDefault(userId);
        if (defaultAcct) accountId = defaultAcct.id;
      }

      // Resolve category
      const cat = await db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.name, tx.category),
      });
      if (!cat) {
        return {
          intent: 'add_transaction',
          reply: `Kategori '${tx.category}' tidak ditemukan.`,
        };
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

      // Adjust account balance
      if (accountId) {
        const delta = tx.type === 'expense' ? -tx.amount : tx.amount;
        await financialAccountService.adjustBalance(accountId, delta);
      }

      saved.push({
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
      });
    }

    return {
      intent: 'add_transaction',
      reply: response.reply,
      transactions: saved,
    };
  }

  private async handleQuery(response: QueryResponse, userId: string): Promise<ChatResult> {
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
      case 'biggest_expense': {
        conditions.push(eq(transactions.type, 'expense'));
        const rows = await db
          .select()
          .from(transactions)
          .where(and(...conditions))
          .orderBy(desc(transactions.amount))
          .limit(1);

        if (rows.length === 0) {
          return { intent: 'query', reply: 'Tidak ada pengeluaran ditemukan pada periode ini.' };
        }
        const tx = rows[0];
        const cat = await db.query.categories.findFirst({
          where: (c, { eq }) => eq(c.id, tx.categoryId),
        });
        return {
          intent: 'query',
          reply: `Pengeluaran terbesar: ${tx.description} sebesar ${Number(tx.amount).toLocaleString('id-ID')} ${tx.currency} (${cat?.label ?? tx.categoryId}) pada ${tx.date.toLocaleDateString('id-ID')}.`,
          queryResult: { transaction: { ...tx, amount: Number(tx.amount), category: cat?.name } },
        };
      }

      case 'biggest_income': {
        conditions.push(eq(transactions.type, 'income'));
        const rows = await db
          .select()
          .from(transactions)
          .where(and(...conditions))
          .orderBy(desc(transactions.amount))
          .limit(1);

        if (rows.length === 0) {
          return { intent: 'query', reply: 'Tidak ada pemasukan ditemukan pada periode ini.' };
        }
        const tx = rows[0];
        const cat = await db.query.categories.findFirst({
          where: (c, { eq }) => eq(c.id, tx.categoryId),
        });
        return {
          intent: 'query',
          reply: `Pemasukan terbesar: ${tx.description} sebesar ${Number(tx.amount).toLocaleString('id-ID')} ${tx.currency} (${cat?.label ?? tx.categoryId}) pada ${tx.date.toLocaleDateString('id-ID')}.`,
          queryResult: { transaction: { ...tx, amount: Number(tx.amount), category: cat?.name } },
        };
      }

      case 'total_spent': {
        conditions.push(eq(transactions.type, 'expense'));
        const [result] = await db
          .select({ total: sum(transactions.amount) })
          .from(transactions)
          .where(and(...conditions));
        const total = Number(result?.total ?? 0);
        return {
          intent: 'query',
          reply: `Total pengeluaran: ${total.toLocaleString('id-ID')} IDR.`,
          queryResult: { total },
        };
      }

      case 'total_income': {
        conditions.push(eq(transactions.type, 'income'));
        const [result] = await db
          .select({ total: sum(transactions.amount) })
          .from(transactions)
          .where(and(...conditions));
        const total = Number(result?.total ?? 0);
        return {
          intent: 'query',
          reply: `Total pemasukan: ${total.toLocaleString('id-ID')} IDR.`,
          queryResult: { total },
        };
      }

      case 'transaction_count': {
        const [result] = await db.select({ count: count() }).from(transactions).where(where);
        return {
          intent: 'query',
          reply: `Jumlah transaksi: ${result?.count ?? 0}.`,
          queryResult: { count: result?.count ?? 0 },
        };
      }

      case 'recent_transactions': {
        const rows = await db
          .select()
          .from(transactions)
          .where(where)
          .orderBy(desc(transactions.date))
          .limit(limit);

        const catIds = [...new Set(rows.map(r => r.categoryId))];
        const cats =
          catIds.length > 0
            ? await db.query.categories.findMany({
                where: (c, { inArray }) => inArray(c.id, catIds),
              })
            : [];
        const catMap = new Map(cats.map(c => [c.id, c.name]));

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

      case 'category_breakdown': {
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

        const catIds = rows.map(r => r.categoryId);
        const cats =
          catIds.length > 0
            ? await db.query.categories.findMany({
                where: (c, { inArray }) => inArray(c.id, catIds),
              })
            : [];
        const catMap = new Map(cats.map(c => [c.id, c.name]));

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

      default:
        return { intent: 'query', reply: 'Maaf, query tidak dikenali.' };
    }
  }

  private async handleManageAccount(
    response: ManageAccountResponse,
    userId: string,
  ): Promise<ChatResult> {
    switch (response.action) {
      case 'create_account': {
        if (!response.accountName) {
          return {
            intent: 'manage_account',
            reply: 'Nama akun diperlukan untuk membuat akun baru.',
          };
        }
        const created = await financialAccountService.create({
          userId,
          name: response.accountName,
          type: response.accountType ?? 'other',
          currency: response.currency ?? 'IDR',
          initialBalance: response.initialBalance,
        });
        return {
          intent: 'manage_account',
          reply: response.reply,
          account: {
            id: created.id,
            name: created.name,
            type: created.type,
            currency: created.currency,
            balance: Number(created.balance),
            isDefault: created.isDefault,
          },
        };
      }

      case 'set_default': {
        if (!response.accountName) {
          return { intent: 'manage_account', reply: 'Nama akun diperlukan.' };
        }
        const acct = await financialAccountService.getByName(response.accountName, userId);
        if (!acct) {
          return {
            intent: 'manage_account',
            reply: `Akun '${response.accountName}' tidak ditemukan.`,
          };
        }
        await financialAccountService.update(acct.id, userId, { isDefault: true });
        return {
          intent: 'manage_account',
          reply: response.reply,
          account: { id: acct.id, name: acct.name, isDefault: true },
        };
      }

      case 'list_accounts': {
        const accounts = await financialAccountService.getByUserId(userId);
        const formatted = accounts.map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          currency: a.currency,
          balance: Number(a.balance),
          isDefault: a.isDefault,
        }));

        if (formatted.length === 0) {
          return {
            intent: 'manage_account',
            reply:
              'Belum ada akun keuangan. Buat akun baru dengan chat, contoh: "buat akun BCA bank".',
            accounts: [],
          };
        }

        const lines = formatted.map(
          a =>
            `- ${a.name} (${a.type}): ${a.balance.toLocaleString('id-ID')} ${a.currency}${a.isDefault ? ' ⭐ default' : ''}`,
        );
        return {
          intent: 'manage_account',
          reply: `Daftar akun:\n${lines.join('\n')}`,
          accounts: formatted,
        };
      }

      default:
        return { intent: 'manage_account', reply: 'Aksi tidak dikenali.' };
    }
  }
}

export const chatService = new ChatService();
