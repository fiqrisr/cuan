import { z } from 'zod';

export const extractedTransactionSchema = z.object({
  type: z.enum(['expense', 'income']).describe('Whether this is an expense or income'),
  amount: z.union([z.number(), z.string()]).transform(value => {
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new Error('amount must be a positive number');
    }
    return parsed;
  }),
  currency: z.string().length(3).default('IDR').describe('3-letter ISO code, default IDR'),
  category: z.string().describe('Exact category name provided in the context'),
  description: z.string().min(1).describe('Short summary of the transaction'),
  date: z.iso
    .datetime()
    .describe(
      'ISO 8601 string of the transaction date. Resolve relative times using the provided current time.',
    ),
  accountName: z
    .string()
    .optional()
    .describe('Name of the financial account to use. Omit to use default account.'),
});

export const queryFiltersSchema = z.object({
  period: z
    .object({
      from: z.string().describe('ISO 8601 date start'),
      to: z.string().describe('ISO 8601 date end'),
    })
    .optional(),
  category: z.string().optional(),
  accountName: z.string().optional(),
  type: z.enum(['expense', 'income']).optional(),
  limit: z.number().int().positive().optional().default(10),
});

export const manageAccountActionSchema = z.enum(['create_account', 'set_default', 'list_accounts']);
