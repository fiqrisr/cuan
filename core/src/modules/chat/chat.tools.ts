import { tool } from 'ai';
import { z } from 'zod';
import type { Pino as Logger } from 'logixlysia';
import { handleAddTransaction } from './handlers/add-transaction.handler';
import { handleManageAccount } from './handlers/manage-account.handler';
import { handleQuery } from './handlers/query.handler';

// We inline or re-import the Zod schemas from openmodel.schema.ts
import {
  extractedTransactionSchema,
  queryFiltersSchema,
  manageAccountActionSchema,
} from '../../lib/openmodel.schema';

export const buildChatTools = (userId: string, log: Logger) => ({
  add_transaction: tool({
    description: 'Record one or more transactions (expenses or income).',
    parameters: z.object({
      transactions: z
        .array(extractedTransactionSchema)
        .min(1)
        .describe('One or more transactions extracted from the message'),
    }),
    execute: async args => {
      return handleAddTransaction(args.transactions, userId, log);
    },
  }),
  query_finances: tool({
    description: 'Query existing transactions to answer user questions about their finances.',
    parameters: z.object({
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
    }),
    execute: async args => {
      return handleQuery(args.queryType, args.filters, userId, log);
    },
  }),
  manage_account: tool({
    description: 'Manage financial accounts (create, set default, list).',
    parameters: z.object({
      action: manageAccountActionSchema,
      accountName: z.string().optional(),
      accountType: z.string().optional(),
      currency: z.string().optional(),
      initialBalance: z.number().optional(),
    }),
    execute: async args => {
      return handleManageAccount(args, userId, log);
    },
  }),
});
