import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import type { ChatResponse, FetchLike, OpenModelClientOptions } from './openmodel.schema';
import { chatResponseSchema } from './openmodel.schema';

export interface OpenModelClient {
  chat(message: string): Promise<ChatResponse>;
}

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
  const openModel = getOpenModel(baseUrl, apiKey, model, fetch);

  return {
    async chat(message: string): Promise<ChatResponse> {
      const result = await generateObject({
        model: openModel,
        schema: chatResponseSchema,
        system: getSystemPrompt(),
        prompt: message,
        temperature: 0.2,
      });

      return result.object;
    },
  };
}
