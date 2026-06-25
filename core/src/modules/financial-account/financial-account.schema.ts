import { relations } from 'drizzle-orm';
import { boolean, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { user } from '../auth/auth.schema';
import { transactions } from '../transaction/transaction.schema';

export const financialAccounts = pgTable(
  'financial_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'bank', 'e-wallet', 'cash', 'other'
    currency: text('currency').notNull().default('IDR'),
    balance: numeric('balance', { precision: 15, scale: 2 }).notNull().default('0'),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
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
