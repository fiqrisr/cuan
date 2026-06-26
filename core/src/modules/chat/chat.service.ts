import type { Pino as Logger } from 'logixlysia';
import { env } from '../../lib/env';
import { createOpenModelClient } from '../../lib/openmodel';
import type { ChatResponse } from '../../lib/openmodel.types';
import type { ChatResult } from './chat.types';
import { handleAddTransaction } from './handlers/add-transaction.handler';
import { handleManageAccount } from './handlers/manage-account.handler';
import { handleQuery } from './handlers/query.handler';

const openmodel = createOpenModelClient({
  apiKey: env.OPENMODEL_API_KEY,
  baseUrl: env.OPENMODEL_BASE_URL,
  model: env.OPENMODEL_MODEL,
});

export class ChatService {
  async processChat(message: string, userId: string, log: Logger): Promise<ChatResult> {
    log.info({ event: 'chat_process_started', userId }, 'processing chat message');
    const aiResponse: ChatResponse = await openmodel.chat(message);
    log.info(
      { event: 'chat_intent_identified', intent: aiResponse.intent },
      'identified chat intent',
    );

    switch (aiResponse.intent) {
      case 'add_transaction':
        return handleAddTransaction(aiResponse, userId, log);
      case 'query':
        return handleQuery(aiResponse, userId, log);
      case 'manage_account':
        return handleManageAccount(aiResponse, userId, log);
    }
  }
}

export const chatService = new ChatService();
export * from './chat.types';
