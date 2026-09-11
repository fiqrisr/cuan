import { generateText, stepCountIs, streamText } from 'ai';
import { getLanguageModel } from '@/lib/ai-provider';
import { logger } from '../../middleware/logger';
import { categoryService } from '../category/category.service';
import { getSystemPrompt } from './chat.prompt';
import { buildChatTools } from './chat.tools';
import type { ChatResult, SavedTransaction, SavedTransfer } from './chat.types';

export class ChatService {
  async processChat(message: string, userId: string, locale?: 'en' | 'id'): Promise<ChatResult> {
    logger.info({ event: 'chat_process_started', userId }, 'processing chat message');
    const tools = buildChatTools(userId);

    const categories = await categoryService.getUserCategories(userId);
    const categoriesInfo = categories.map(c => `- ${c.name} (${c.label})`).join('\n');

    const aiResponse = await generateText({
      model: getLanguageModel(),
      tools,
      stopWhen: stepCountIs(3),
      system: getSystemPrompt(categoriesInfo, locale),
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
    let transfer: SavedTransfer | undefined;

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
        } else if (res.toolName === 'transfer_funds') {
          intent = 'transfer_funds';
          const data = res.output as { transfer: SavedTransfer };
          transfer = data.transfer;
          transactions = data.transfer.transactions;
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
      transfer,
    };
  }

  async streamChat(message: string, userId: string, locale?: 'en' | 'id'): Promise<Response> {
    logger.info({ event: 'chat_stream_started', userId }, 'streaming chat message');
    const tools = buildChatTools(userId);

    const categories = await categoryService.getUserCategories(userId);
    const categoriesInfo = categories.map(c => `- ${c.name} (${c.label})`).join('\n');

    return streamText({
      model: getLanguageModel(),
      tools,
      stopWhen: stepCountIs(3),
      system: getSystemPrompt(categoriesInfo, locale),
      prompt: message,
    }).toUIMessageStreamResponse();
  }
}

export const chatService = new ChatService();
export * from './chat.types';
