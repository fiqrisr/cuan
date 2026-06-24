import { z } from 'zod';

const extractedExpenseSchema = z.object({
  amount: z.union([z.number(), z.string()]).transform(value => {
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(parsed) || parsed <= 0) {
      throw new Error('amount must be a positive number');
    }
    return parsed;
  }),
  currency: z.string().length(3).default('IDR'),
  category: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

const chatResponseSchema = z.object({
  expense: extractedExpenseSchema,
  reply: z.string().min(1),
});

const responseSchema = z.object({
  output: z.array(
    z.object({
      type: z.literal('message'),
      role: z.literal('assistant'),
      content: z.array(
        z.object({
          type: z.literal('output_text'),
          text: z.string(),
        }),
      ),
    }),
  ),
});

export interface ExtractedExpense {
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
}

export interface ChatResponse {
  expense: ExtractedExpense;
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

const SYSTEM_PROMPT = `You are an expense tracking assistant. Extract an expense from the user's message and respond with a single JSON object (no markdown, no explanation) in this exact shape:

{
  "expense": {
    "amount": number,
    "currency": "3-letter ISO code, e.g. IDR or USD",
    "category": "one or two words, e.g. Food, Transport, Utilities",
    "description": "short summary of the expense",
    "date": "YYYY-MM-DD"
  },
  "reply": "a friendly one-sentence confirmation to show the user"
}

If the message does not contain a clear expense, set amount to 0 and reply explaining that you could not understand.`;

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced?.[1]) return fenced[1].trim();
  return trimmed;
}

export function createOpenModelClient(options: OpenModelClientOptions): OpenModelClient {
  const { apiKey, baseUrl, model, fetch: fetchImpl = globalThis.fetch } = options;
  const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/responses`;

  return {
    async chat(message: string): Promise<ChatResponse> {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenModel request failed (${response.status}): ${body}`);
      }

      const payload = responseSchema.parse(await response.json());
      const content = payload.output[0]?.content[0]?.text;

      if (!content) {
        throw new Error('OpenModel response did not contain any content');
      }

      const parsed = chatResponseSchema.safeParse(JSON.parse(extractJson(content)));
      if (!parsed.success) {
        throw new Error(`Failed to parse extracted expense: ${parsed.error.message}`);
      }

      return parsed.data;
    },
  };
}
