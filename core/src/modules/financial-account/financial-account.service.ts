import { and, eq } from 'drizzle-orm';
import { financialAccounts } from '../../db/schema';
import { db } from '../../lib/db';
import type { FinancialAccount, NewFinancialAccount } from './financial-account.schema';

export class FinancialAccountService {
  async getByUserId(userId: string): Promise<FinancialAccount[]> {
    return db.query.financialAccounts.findMany({
      where: (fa, { eq }) => eq(fa.userId, userId),
      orderBy: (fa, { desc }) => desc(fa.createdAt),
    });
  }

  async getById(id: string, userId: string): Promise<FinancialAccount | undefined> {
    return db.query.financialAccounts.findFirst({
      where: (fa, { and, eq }) => and(eq(fa.id, id), eq(fa.userId, userId)),
    });
  }

  async getByName(name: string, userId: string): Promise<FinancialAccount | undefined> {
    const normalized = name.trim().toLowerCase();
    const accounts = await db.query.financialAccounts.findMany({
      where: (fa, { eq }) => eq(fa.userId, userId),
    });
    return accounts.find(a => a.name.toLowerCase() === normalized);
  }

  async getDefault(userId: string): Promise<FinancialAccount | undefined> {
    return db.query.financialAccounts.findFirst({
      where: (fa, { and, eq }) => and(eq(fa.userId, userId), eq(fa.isDefault, true)),
    });
  }

  async create(
    data: Pick<NewFinancialAccount, 'userId' | 'name' | 'type' | 'currency'> & {
      initialBalance?: number;
    },
  ): Promise<FinancialAccount> {
    const { initialBalance, ...rest } = data;

    const existing = await this.getByName(rest.name, rest.userId);
    if (existing) {
      throw new AccountError(`Account '${rest.name}' already exists`);
    }

    const hasAccounts = await db.query.financialAccounts.findFirst({
      where: (fa, { eq }) => eq(fa.userId, rest.userId),
      columns: { id: true },
    });

    const isDefault = !hasAccounts;
    const balance = initialBalance?.toString() ?? '0';

    const [created] = await db
      .insert(financialAccounts)
      .values({ ...rest, balance, isDefault })
      .returning();

    return created;
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; type?: string; isDefault?: boolean },
  ): Promise<FinancialAccount> {
    const existing = await this.getById(id, userId);
    if (!existing) {
      throw new AccountError('Account not found', 404);
    }

    if (data.isDefault) {
      await db.transaction(async tx => {
        await tx
          .update(financialAccounts)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(financialAccounts.userId, userId));
        await tx
          .update(financialAccounts)
          .set({ ...data, updatedAt: new Date() })
          .where(and(eq(financialAccounts.id, id), eq(financialAccounts.userId, userId)));
      });
    } else {
      await db
        .update(financialAccounts)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(financialAccounts.id, id), eq(financialAccounts.userId, userId)));
    }

    const updated = await this.getById(id, userId);
    if (!updated) throw new AccountError('Failed to retrieve updated account', 500);
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.getById(id, userId);
    if (!existing) {
      throw new AccountError('Account not found', 404);
    }
    if (existing.isDefault) {
      throw new AccountError(
        'Cannot delete the default account. Set another account as default first.',
      );
    }

    const hasTx = await db.query.transactions.findFirst({
      where: (tx, { eq }) => eq(tx.accountId, id),
      columns: { id: true },
    });
    if (hasTx) {
      throw new AccountError('Cannot delete an account with transactions. Reassign them first.');
    }

    await db
      .delete(financialAccounts)
      .where(and(eq(financialAccounts.id, id), eq(financialAccounts.userId, userId)));
  }

  async adjustBalance(accountId: string, delta: number): Promise<void> {
    const account = await db.query.financialAccounts.findFirst({
      where: (fa, { eq }) => eq(fa.id, accountId),
    });
    if (!account) return;

    const newBalance = Number(account.balance) + delta;
    await db
      .update(financialAccounts)
      .set({ balance: newBalance.toString(), updatedAt: new Date() })
      .where(eq(financialAccounts.id, accountId));
  }
}

export class AccountError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AccountError';
  }
}

export const financialAccountService = new FinancialAccountService();
