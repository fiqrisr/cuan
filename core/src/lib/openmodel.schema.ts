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
    'misc',
  ]),
  description: z.string().min(1).describe('Short summary of the transaction'),
  date: z.iso
    .datetime()
    .describe(
      'ISO 8601 string of the transaction date. Resolve relative times using the provided current time.',
    ),
});

export const chatResponseSchema = z.object({
  transaction: extractedTransactionSchema,
  reply: z
    .string()
    .min(1)
    .describe(
      'A friendly one-sentence confirmation to show the user, written in Bahasa Indonesia. If not a valid transaction, explain why.',
    ),
});

export interface ExtractedTransaction {
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
}

export interface ChatResponse {
  transaction: ExtractedTransaction;
  reply: string;
}

export interface OpenModelClientOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  fetch?: FetchLike;
}

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
