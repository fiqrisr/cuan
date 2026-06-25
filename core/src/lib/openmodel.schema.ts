import { z } from 'zod';

// --- Shared sub-schemas ---

const extractedTransactionSchema = z.object({
  type: z.enum(['expense', 'income']).describe('Whether this is an expense or income'),
  amount: z.union([z.number(), z.string()]).transform(value => {
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new Error('amount must be a positive number');
    }
    return parsed;
  }),
  currency: z.string().length(3).default('IDR').describe('3-letter ISO code, default IDR'),
  category: z.enum([
    'groceries',
    'dining-out',
    'coffee',
    'snacks',
    'public-transit',
    'ride-hailing',
    'fuel',
    'parking',
    'maintenance',
    'rent',
    'electricity',
    'water',
    'internet',
    'subscriptions',
    'gaming',
    'hobbies',
    'events',
    'clothing',
    'electronics',
    'personal-care',
    'medical',
    'pharmacy',
    'fitness',
    'flights',
    'accommodation',
    'vacation',
    'savings',
    'investment',
    'insurance',
    'gifts',
    'charity',
    'salary',
    'freelance',
    'misc',
  ]),
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

const queryFiltersSchema = z.object({
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

// --- Intent-based response schemas ---

const addTransactionResponseSchema = z.object({
  intent: z.literal('add_transaction'),
  transactions: z
    .array(extractedTransactionSchema)
    .min(1)
    .describe('One or more transactions extracted from the message'),
  reply: z
    .string()
    .min(1)
    .describe(
      'A friendly confirmation to show the user, written in Bahasa Indonesia. Summarize all transactions added.',
    ),
});

const queryResponseSchema = z.object({
  intent: z.literal('query'),
  query: z.object({
    queryType: z
      .enum([
        'biggest_expense',
        'biggest_income',
        'total_spent',
        'total_income',
        'transaction_count',
        'recent_transactions',
        'category_breakdown',
      ])
      .describe('The type of analytical query'),
    filters: queryFiltersSchema,
  }),
  reply: z
    .string()
    .min(1)
    .describe('Placeholder reply - backend will replace with actual data'),
});

const manageAccountResponseSchema = z.object({
  intent: z.literal('manage_account'),
  action: z
    .enum(['create_account', 'set_default', 'list_accounts'])
    .describe('The account management action'),
  accountName: z.string().optional().describe('Name of the account'),
  accountType: z
    .enum(['bank', 'e-wallet', 'cash', 'other'])
    .optional()
    .describe('Type of financial account'),
  currency: z
    .string()
    .length(3)
    .optional()
    .describe('3-letter ISO currency code'),
  initialBalance: z.number().optional().describe('Starting balance for new account'),
  reply: z
    .string()
    .min(1)
    .describe('Confirmation reply in Bahasa Indonesia'),
});

export const chatResponseSchema = z.discriminatedUnion('intent', [
  addTransactionResponseSchema,
  queryResponseSchema,
  manageAccountResponseSchema,
]);

// --- Exported types (named, not ReturnType) ---

export interface ExtractedTransaction {
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  accountName?: string;
}

export interface AddTransactionResponse {
  intent: 'add_transaction';
  transactions: ExtractedTransaction[];
  reply: string;
}

export interface QueryFilters {
  period?: { from: string; to: string };
  category?: string;
  accountName?: string;
  type?: 'expense' | 'income';
  limit?: number;
}

export interface QueryResponse {
  intent: 'query';
  query: {
    queryType:
      | 'biggest_expense'
      | 'biggest_income'
      | 'total_spent'
      | 'total_income'
      | 'transaction_count'
      | 'recent_transactions'
      | 'category_breakdown';
    filters: QueryFilters;
  };
  reply: string;
}

export interface ManageAccountResponse {
  intent: 'manage_account';
  action: 'create_account' | 'set_default' | 'list_accounts';
  accountName?: string;
  accountType?: 'bank' | 'e-wallet' | 'cash' | 'other';
  currency?: string;
  initialBalance?: number;
  reply: string;
}

export type ChatResponse = AddTransactionResponse | QueryResponse | ManageAccountResponse;

export interface OpenModelClientOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  fetch?: FetchLike;
}

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
