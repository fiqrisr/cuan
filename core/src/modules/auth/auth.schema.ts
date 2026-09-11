import { relations, sql } from 'drizzle-orm';
import { customType, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const timestampText = customType<{ data: Date; driverData: string }>({
  dataType() {
    return 'text';
  },
  toDriver(val: Date) {
    return val.toISOString();
  },
  fromDriver(val: string) {
    return new Date(val);
  },
});

import { financialAccounts } from '@/modules/financial-account/financial-account.schema';
import { transactions } from '@/modules/transaction/transaction.schema';

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false).notNull(),
  image: text('image'),
  createdAt: timestampText('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestampText('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestampText('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestampText('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestampText('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  table => [index('session_userId_idx').on(table.userId)],
);

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestampText('access_token_expires_at'),
    refreshTokenExpiresAt: timestampText('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestampText('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestampText('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index('account_userId_idx').on(table.userId)],
);

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestampText('expires_at').notNull(),
    createdAt: timestampText('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestampText('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  table => [index('verification_identifier_idx').on(table.identifier)],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  financialAccounts: many(financialAccounts),
  transactions: many(transactions),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
