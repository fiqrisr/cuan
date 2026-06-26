import { generateText, stepCountIs } from 'ai';
import type { Pino as Logger } from 'logixlysia';
import { env } from '../../lib/env';
import { createOpenModelClient, getSystemPrompt } from '../../lib/openmodel';
import { categoryService } from '../category/category.service';
import { buildChatTools } from './chat.tools';
import type { ChatResult, SavedTransaction } from './chat.types';

const openmodel = createOpenModelClient({
  apiKey: env.OPENMODEL_API_KEY,
  baseUrl: env.OPENMODEL_BASE_URL,
  model: env.OPENMODEL_MODEL,
});

export class ChatService {
  async processChat(message: string, userId: string, log: Logger): Promise<ChatResult> {
    log.info({ event: 'chat_process_started', userId }, 'processing chat message');
    const tools = buildChatTools(userId, log);

    const categories = await categoryService.getUserCategories(userId);
    const categoriesInfo = categories.map(c => `- ${c.name} (${c.label})`).join('\n');

    const aiResponse = await generateText({
      model: openmodel,
      tools,
      stopWhen: stepCountIs(3),
      system: getSystemPrompt(categoriesInfo),
      prompt: message,
    });

    log.info(
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
      reply: aiResponse.text || 'Maaf, saya tidak bisa memproses permintaan Anda.',
      transactions,
      queryResult,
      account,
      accounts,
      categories: categoriesData,
    };
  }
}

export const chatService = new ChatService();
export * from './chat.types';
