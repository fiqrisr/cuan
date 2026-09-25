import { and, eq } from 'drizzle-orm';
import { db, financialAccounts } from '@/db';
import { BadRequestError, InternalServerError, NotFoundError } from '@/lib/error';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
import type {
  AccountType,
  FinancialAccount,
  NewFinancialAccount,
} from './financial-account.schema';

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
      throw new BadRequestError(`Account '${rest.name}' already exists`);
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

    logger.info(
      {
        event: 'financial_account_created',
        accountId: created.id,
        userId: rest.userId,
        name: created.name,
        type: created.type,
        isDefault: created.isDefault,
      },
      'Financial account created',
    );

    return created;
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; type?: AccountType; isDefault?: boolean },
  ): Promise<FinancialAccount> {
    const existing = await this.getById(id, userId);
    if (!existing) {
      throw new NotFoundError('Account not found');
    }

    if (data.isDefault) {
      // D1 has no interactive transactions; db.batch is the atomic unit.
      const startBatch = performance.now();
      await db.batch([
        db
          .update(financialAccounts)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(eq(financialAccounts.userId, userId)),
        db
          .update(financialAccounts)
          .set({ ...data, updatedAt: new Date() })
          .where(and(eq(financialAccounts.id, id), eq(financialAccounts.userId, userId))),
      ]);
      const batchDurationMs = Math.round(performance.now() - startBatch);
      metrics.recordD1Batch(2, batchDurationMs);

      logger.info(
        {
          event: 'financial_account_updated',
          accountId: id,
          userId,
          isDefault: true,
          batchDurationMs,
        },
        'Financial account updated with default status toggle via atomic batch',
      );
    } else {
      await db
        .update(financialAccounts)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(financialAccounts.id, id), eq(financialAccounts.userId, userId)));

      logger.info(
        {
          event: 'financial_account_updated',
          accountId: id,
          userId,
          updates: Object.keys(data),
        },
        'Financial account updated',
      );
    }
    const updated = await this.getById(id, userId);
    if (!updated) throw new InternalServerError('Failed to retrieve updated account');
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.getById(id, userId);
    if (!existing) {
      throw new NotFoundError('Account not found');
    }
    if (existing.isDefault) {
      throw new BadRequestError(
        'Cannot delete the default account. Set another account as default first.',
      );
    }

    const hasTx = await db.query.transactions.findFirst({
      where: (tx, { eq }) => eq(tx.accountId, id),
      columns: { id: true },
    });
    if (hasTx) {
      throw new BadRequestError('Cannot delete an account with transactions. Reassign them first.');
    }

    await db
      .delete(financialAccounts)
      .where(and(eq(financialAccounts.id, id), eq(financialAccounts.userId, userId)));
    logger.info(
      { event: 'financial_account_deleted', accountId: id, userId },
      'Financial account deleted',
    );
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

export const financialAccountService = new FinancialAccountService();
