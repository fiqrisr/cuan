import { relations } from 'drizzle-orm';
import { index, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { transactions } from '../transaction/transaction.schema';

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

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
