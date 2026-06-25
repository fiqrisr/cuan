import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, Output } from 'ai';
import { z } from 'zod';

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
    'groceries', 'dining-out', 'coffee', 'snacks', 'public-transit',
    'ride-hailing', 'fuel', 'parking', 'maintenance', 'rent', 'electricity',
    'water', 'internet', 'subscriptions', 'gaming', 'hobbies', 'events',
    'clothing', 'electronics', 'personal-care', 'medical', 'pharmacy',
    'fitness', 'flights', 'accommodation', 'vacation', 'savings', 'investment',
    'insurance', 'gifts', 'charity', 'misc'
  ]),
  description: z.string().min(1).describe('Short summary of the transaction'),
  date: z.string().datetime().describe('ISO 8601 string of the transaction date. Resolve relative times using the provided current time.'),
});

const chatResponseSchema = z.object({
  transaction: extractedTransactionSchema,
  reply: z.string().min(1).describe('A friendly one-sentence confirmation to show the user, written in Bahasa Indonesia. If not a valid transaction, explain why.'),
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

export interface OpenModelClient {
  chat(message: string): Promise<ChatResponse>;
}

export interface OpenModelClientOptions {
  apiKey: string;
  baseUrl: string;
  model: string;
  fetch?: FetchLike;
}

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export function getSystemPrompt() {
  const now = new Date().toISOString();
  return `You are a personal finance assistant. Extract a transaction from the user's message.

IMPORTANT DATE/TIME RULES:
The current date and time is: ${now}
If the user specifies a time like "kemarin" (yesterday), set the date to yesterday.
If they say "tadi pagi" (this morning), set the date to today and the time to around 08:00.
If they say "siang tadi" (this noon), set it around 12:00.
If they don't specify a time, use the current date and time exactly as provided above.

If the message does not contain a clear transaction, set amount to 0 and write the "reply" in Bahasa Indonesia explaining that you could not understand.`;
}

function getOpenModel(baseUrl: string, apiKey: string, modelId: string) {
  const omAnthropic = createAnthropic({ baseURL: baseUrl, apiKey });
  const omOpenAI = createOpenAI({ baseURL: baseUrl, apiKey });

  if (modelId.includes('deepseek') || modelId.includes('claude')) {
    return omAnthropic(modelId);
  }
  return omOpenAI(modelId);
}

export function createOpenModelClient(options: OpenModelClientOptions): OpenModelClient {
  const { apiKey, baseUrl, model } = options;
  const openModel = getOpenModel(baseUrl, apiKey, model);

  return {
    async chat(message: string): Promise<ChatResponse> {
      const result = await generateText({
        model: openModel,
        output: Output.object({ schema: chatResponseSchema }),
        system: getSystemPrompt(),
        prompt: message,
        temperature: 0.2,
      });

      return result.output;
    },
  };
}
