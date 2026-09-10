import { relations, sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { user } from '@/modules/auth/auth.schema';
import { categories } from '@/modules/category/category.schema';
import { financialAccounts } from '@/modules/financial-account/financial-account.schema';

export const transactions = sqliteTable(
  'transactions',
  {
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: text('account_id').references(() => financialAccounts.id),
    type: text('type').$type<'expense' | 'income'>().notNull(),
    amount: text('amount').notNull(),
    currency: text('currency').notNull().default('IDR'),
    categoryId: integer('category_id')
      .references(() => categories.id)
      .notNull(),
    description: text('description').notNull(),
    date: text('date').default(sql`CURRENT_TIMESTAMP`).notNull(),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  },
  table => [index('transactions_user_id_idx').on(table.userId)],
);

export const transactionRelations = relations(transactions, ({ one }) => ({
  user: one(user, {
    fields: [transactions.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  financialAccount: one(financialAccounts, {
    fields: [transactions.accountId],
    references: [financialAccounts.id],
  }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
