import { relations, sql } from 'drizzle-orm';
import { index, pgTable, serial, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from '@/modules/auth/auth.schema';
import { transactions } from '@/modules/transaction/transaction.schema';

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    label: text('label').notNull(),
    userId: text('user_id').references(() => user.id),
  },
  table => [
    index('categories_name_idx').on(table.name),
    uniqueIndex('categories_global_name_idx').on(table.name).where(sql`user_id IS NULL`),
    uniqueIndex('categories_user_name_idx')
      .on(table.userId, table.name)
      .where(sql`user_id IS NOT NULL`),
  ],
);

export const categoryRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
