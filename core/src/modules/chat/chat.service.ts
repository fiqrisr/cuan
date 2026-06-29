import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText, type LanguageModel, stepCountIs } from 'ai';
import { env } from '@/env';
import { logger } from '../../middleware/logger';
import { categoryService } from '../category/category.service';
import { getSystemPrompt } from './chat.prompt';
import { buildChatTools } from './chat.tools';
import type { ChatResult, SavedTransaction } from './chat.types';

function getLanguageModel(baseUrl: string, apiKey: string, modelId: string): LanguageModel {
  const anthropic = createAnthropic({ baseURL: baseUrl, apiKey });
  const openai = createOpenAI({ baseURL: baseUrl, apiKey });

  if (modelId.includes('deepseek') || modelId.includes('claude')) {
    return anthropic(modelId);
  }
  return openai(modelId);
}

export const openmodel = getLanguageModel(
  env.OPENMODEL_BASE_URL,
  env.OPENMODEL_API_KEY,
  env.OPENMODEL_MODEL,
);

export class ChatService {
  async processChat(message: string, userId: string): Promise<ChatResult> {
    logger.info({ event: 'chat_process_started', userId }, 'processing chat message');
    const tools = buildChatTools(userId);

    const categories = await categoryService.getUserCategories(userId);
    const categoriesInfo = categories.map(c => `- ${c.name} (${c.label})`).join('\n');

    const aiResponse = await generateText({
      model: openmodel,
      tools,
      stopWhen: stepCountIs(3),
      system: getSystemPrompt(categoriesInfo),
      prompt: message,
    });

    logger.info(
      { event: 'chat_generated', steps: aiResponse.steps?.length ?? 1 },
      'generated chat response',
    );

    let intent = 'unknown';
    let transactions: SavedTransaction[] | undefined;
    let queryResult: unknown;
    let account: unknown;
    let accounts: unknown[] | undefined;
    let categoriesData: unknown;

    if (aiResponse.toolResults && aiResponse.toolResults.length > 0) {
      for (const res of aiResponse.toolResults) {
        if (res.toolName === 'add_transaction') {
          intent = 'add_transaction';
          const data = res.output as { savedTransactions: SavedTransaction[] };
          transactions = data.savedTransactions;
        } else if (res.toolName === 'query_finances') {
          intent = 'query';
          queryResult = res.output;
        } else if (res.toolName === 'manage_account') {
          intent = 'manage_account';
          const data = res.output as { account?: unknown; accounts?: unknown[] };
          account = data.account;
          accounts = data.accounts;
        } else if (res.toolName === 'manage_category') {
          intent = 'manage_category';
          categoriesData = res.output;
        }
      }
    }

    return {
      intent,
      reply: aiResponse.text || 'Sorry, I could not process your request.',
      transactions,
      queryResult,
      account,
      accounts,
      categories: categoriesData,
    };
  }

  async streamChat(message: string, userId: string) {
    logger.info({ event: 'chat_stream_started', userId }, 'streaming chat message');
    const tools = buildChatTools(userId);

    const categories = await categoryService.getUserCategories(userId);
    const categoriesInfo = categories.map(c => `- ${c.name} (${c.label})`).join('\n');

    return streamText({
      model: openmodel,
      tools,
      maxSteps: 3,
      system: getSystemPrompt(categoriesInfo),
      prompt: message,
    });
  }
}

export const chatService = new ChatService();
export * from './chat.types';
