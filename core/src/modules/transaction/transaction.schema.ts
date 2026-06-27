import { relations } from 'drizzle-orm';
import { index, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user } from '@/modules/auth/auth.schema';
import { categories } from '@/modules/category/category.schema';
import { financialAccounts } from '@/modules/financial-account/financial-account.schema';

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id').references(() => financialAccounts.id),
    type: text('type').notNull(), // 'expense' or 'income'
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('IDR'),
    categoryId: integer('category_id')
      .references(() => categories.id)
      .notNull(),
    description: text('description').notNull(),
    date: timestamp('date', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
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
