import { env } from '../../lib/env';
import { createOpenModelClient } from '../../lib/openmodel';
import type { ChatResponse } from '../../lib/openmodel.schema';
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
  async processChat(message: string, userId: string): Promise<ChatResult> {
    const aiResponse: ChatResponse = await openmodel.chat(message);

    switch (aiResponse.intent) {
      case 'add_transaction':
        return handleAddTransaction(aiResponse, userId);
      case 'query':
        return handleQuery(aiResponse, userId);
      case 'manage_account':
        return handleManageAccount(aiResponse, userId);
    }
  }
}

export const chatService = new ChatService();
export * from './chat.types';
