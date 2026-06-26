import { tool } from 'ai';
import type { Pino as Logger } from 'logixlysia';
import { z } from 'zod';
// We inline or re-import the Zod schemas from openmodel.schema.ts
import {
  extractedTransactionSchema,
  manageAccountActionSchema,
  queryFiltersSchema,
} from '../../lib/openmodel.schema';
import { handleAddTransaction } from './handlers/add-transaction.handler';
import { handleManageAccount } from './handlers/manage-account.handler';
import { handleManageCategory } from './handlers/manage-category.handler';
import { handleQuery } from './handlers/query.handler';

const addTransactionParams = z.object({
  transactions: z
    .array(extractedTransactionSchema)
    .min(1)
    .describe('One or more transactions extracted from the message'),
});

const queryParams = z.object({
  queryType: z.enum([
    'biggest_expense',
    'biggest_income',
    'total_spent',
    'total_income',
    'transaction_count',
    'recent_transactions',
    'category_breakdown',
  ]),
  filters: queryFiltersSchema,
});

const manageAccountParams = z.object({
  action: manageAccountActionSchema,
  accountName: z.string().optional(),
  accountType: z.string().optional(),
  currency: z.string().optional(),
  initialBalance: z.number().optional(),
});

const manageCategoryParams = z.object({
  action: z.enum(['create_category', 'rename_category', 'list_categories']),
  name: z.string().optional().describe('Original name of the category'),
  newName: z.string().optional().describe('New name for the category (if renaming)'),
});

export const buildChatTools = (userId: string, log: Logger) => ({
  add_transaction: tool({
    description: 'Record one or more transactions (expenses or income).',
    parameters: addTransactionParams,
    // @ts-expect-error Vercel AI SDK fails to infer execute args when Zod schema has transforms
    execute: async (args: z.infer<typeof addTransactionParams>) =>
      handleAddTransaction(args.transactions, userId, log),
  }),
  query_finances: tool({
    description: 'Query existing transactions to answer user questions about their finances.',
    parameters: queryParams,
    // @ts-expect-error Vercel AI SDK fails to infer execute args when Zod schema has transforms
    execute: async (args: z.infer<typeof queryParams>) =>
      handleQuery(args.queryType, args.filters, userId, log),
  }),
  manage_account: tool({
    description: 'Manage financial accounts (create, set default, list).',
    parameters: manageAccountParams,
    // @ts-expect-error Vercel AI SDK fails to infer execute args when Zod schema has transforms
    execute: async (args: z.infer<typeof manageAccountParams>) =>
      handleManageAccount(args, userId, log),
  }),
  manage_category: tool({
    description: 'Manage custom transaction categories (create, rename, list).',
    parameters: manageCategoryParams,
    // @ts-expect-error Vercel AI SDK fails to infer execute args when Zod schema has transforms
    execute: async (args: z.infer<typeof manageCategoryParams>) =>
      handleManageCategory(args, userId, log),
  }),
});
