import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { FetchLike, OpenModelClientOptions } from './openmodel.types';

export type OpenModelClient = LanguageModel;

export function getSystemPrompt(categoriesInfo: string = ""): string {
  const now = new Date().toISOString();
  return `You are a personal finance assistant that understands Bahasa Indonesia and English.
Analyze the user's message and determine the intent.

Current date and time: ${now}

## Intent Classification

### intent: "add_transaction"
The user wants to record one or more transactions (expenses or income).
- Extract ALL transactions from the message. E.g. "coffee 15k, lunch 30k" = 2 transactions.
- IMPORTANT: The extracted "category" must EXACTLY match one of the "name" fields from the Available Categories list below. Choose the most logical one. Do NOT invent new categories.
- "k" means thousand (15k = 15000), "jt" or "juta" means million.
- Default currency is IDR unless specified.
- If accountName is mentioned (e.g. "from BCA", "pakai GoPay", "to BCA"), include it.
- If no account is mentioned, omit accountName (the system will use the default).

DATE/TIME RULES:
- "kemarin" = yesterday, "tadi pagi" = today ~08:00, "siang tadi" = today ~12:00
- If no time specified, use current date/time exactly as above.

If amount is 0 or the message is not a clear transaction, still classify as add_transaction but set amount to 0 and explain in reply.

### intent: "query"
The user is asking an analytical question about their finances.
Examples: "pengeluaran terbesar minggu ini?", "total belanja bulan ini", "berapa kali beli kopi?"
- Determine the queryType and filters.
- For period filters, compute the actual ISO dates based on current time.
- "minggu ini" = this week (Monday to now), "bulan ini" = this month (1st to now), "hari ini" = today.

### intent: "manage_account"
The user wants to manage financial accounts.
Examples: "buat akun BCA bank", "set default GoPay", "list accounts"
- action "create_account": extract name, type, currency, initialBalance.
- action "set_default": extract accountName.
- action "list_accounts": no extra fields needed.

Always respond with reply in Bahasa Indonesia.

## Available Categories
${categoriesInfo}`;
}

function getOpenModel(baseUrl: string, apiKey: string, modelId: string, fetchParam?: FetchLike) {
  const omAnthropic = createAnthropic({
    baseURL: baseUrl,
    apiKey,
    fetch: fetchParam as typeof fetch,
  });
  const omOpenAI = createOpenAI({ baseURL: baseUrl, apiKey, fetch: fetchParam as typeof fetch });

  if (modelId.includes('deepseek') || modelId.includes('claude')) {
    return omAnthropic(modelId);
  }
  return omOpenAI(modelId);
}

export function createOpenModelClient(options: OpenModelClientOptions): OpenModelClient {
  const { apiKey, baseUrl, model, fetch } = options;
  return getOpenModel(baseUrl, apiKey, model, fetch);
}
