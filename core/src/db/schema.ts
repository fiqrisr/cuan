import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export * from './auth-schema';

import { user } from './auth-schema';

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    label: text('label').notNull(),
  },
  table => [index('categories_name_idx').on(table.name)],
);

export const categoryRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
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
});

export const transactionRelations = relations(transactions, ({ one }) => ({
  user: one(user, {
    fields: [transactions.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
