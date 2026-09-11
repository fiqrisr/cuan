import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { user } from '@/modules/auth/auth.schema';
import { transactions } from '@/modules/transaction/transaction.schema';

export type AccountType = 'bank' | 'e-wallet' | 'cash' | 'other';

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
    currency: text('currency').notNull().default('IDR'),
    type: text('type').$type<AccountType>().notNull(),
    balance: text('balance').notNull().default('0'),
    isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
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
