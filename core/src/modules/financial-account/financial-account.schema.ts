import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from '@/modules/auth/auth.schema';
import { transactions } from '@/modules/transaction/transaction.schema';

export const financialAccounts = sqliteTable(
  'financial_accounts',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').$type<'bank' | 'e-wallet' | 'cash' | 'other'>().notNull(),
    currency: text('currency').notNull().default('IDR'),
    balance: text('balance').notNull().default('0'),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  table => [uniqueIndex('financial_accounts_user_id_name_idx').on(table.userId, table.name)],
);

export const financialAccountRelations = relations(financialAccounts, ({ one, many }) => ({
  user: one(user, {
    fields: [financialAccounts.userId],
    references: [user.id],
  }),
  transactions: many(transactions),
}));

export type FinancialAccount = typeof financialAccounts.$inferSelect;
export type NewFinancialAccount = typeof financialAccounts.$inferInsert;
