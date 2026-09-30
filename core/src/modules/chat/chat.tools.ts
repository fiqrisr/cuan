import { tool } from 'ai';
import { z } from 'zod';
import {
  deleteTransactionSchema,
  extractedTransactionSchema,
  manageAccountActionSchema,
  queryFiltersSchema,
  transferFundsSchema,
  updateTransactionSchema,
} from './chat.ai-schema';
import { handleAddTransaction } from './handlers/add-transaction.handler';
import { handleDeleteTransaction } from './handlers/delete-transaction.handler';
import { handleManageAccount } from './handlers/manage-account.handler';
import { handleManageCategory } from './handlers/manage-category.handler';
import { handleQuery } from './handlers/query.handler';
import { handleTransferFunds } from './handlers/transfer-funds.handler';
import { handleUpdateTransaction } from './handlers/update-transaction.handler';

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

export const buildChatTools = (userId: string, timezone: string = 'Asia/Jakarta') => ({
  add_transaction: tool({
    description: 'Record one or more transactions (expenses or income).',
    inputSchema: addTransactionParams,
    execute: async (args: z.infer<typeof addTransactionParams>) =>
      handleAddTransaction(args.transactions, userId, timezone),
  }),
  query_finances: tool({
    description: 'Query existing transactions to answer user questions about their finances.',
    inputSchema: queryParams,
    execute: async (args: z.infer<typeof queryParams>) =>
      handleQuery(args.queryType, args.filters, userId, timezone),
  }),
  manage_account: tool({
    description: 'Manage financial accounts (create, set default, list).',
    inputSchema: manageAccountParams,
    execute: async (args: z.infer<typeof manageAccountParams>) => handleManageAccount(args, userId),
  }),
  manage_category: tool({
    description: 'Manage custom transaction categories (create, rename, list).',
    inputSchema: manageCategoryParams,
    execute: async (args: z.infer<typeof manageCategoryParams>) =>
      handleManageCategory(args, userId),
  }),
  transfer_funds: tool({
    description: 'Transfer funds between two financial accounts.',
    inputSchema: transferFundsSchema,
    execute: async (args: z.infer<typeof transferFundsSchema>) =>
      handleTransferFunds(args, userId, timezone),
  }),
  update_transaction: tool({
    description:
      "Update or correct an existing transaction (e.g., mistyped amount, category, account, or description). Can target a specific transaction ID or the user's most recent transaction.",
    inputSchema: updateTransactionSchema,
    execute: async (args: z.infer<typeof updateTransactionSchema>) =>
      handleUpdateTransaction(args, userId, timezone),
  }),
  delete_transaction: tool({
    description:
      'Delete or cancel a recorded transaction (e.g. user says "cancel that", "delete last expense", "undo"). Can target a specific transaction ID or the user\'s most recent transaction.',
    inputSchema: deleteTransactionSchema,
    execute: async (args: z.infer<typeof deleteTransactionSchema>) =>
      handleDeleteTransaction(args, userId),
  }),
});
