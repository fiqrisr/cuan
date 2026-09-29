import { generateText, stepCountIs, streamText } from 'ai';
import { and, asc, desc, eq, lte } from 'drizzle-orm';
import { chatMessages, db } from '@/db';
import { env } from '@/env';
import { getLanguageModel } from '@/lib/ai-provider';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
import { categoryService } from '../category/category.service';
import { financialAccountService } from '../financial-account/financial-account.service';
import { getSystemPrompt } from './chat.prompt';
import { buildChatTools } from './chat.tools';
import type { ChatResult, SavedTransaction, SavedTransfer } from './chat.types';

type ChatTurn = { role: 'user' | 'assistant' | 'system'; content: string };

export class ChatService {
  async getMessages(userId: string) {
    const rows = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(30);

    return rows.map(r => ({
      id: r.id,
      role: r.role,
      content: r.content,
      toolCalls: r.toolCalls,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  }

  async clearMessages(userId: string) {
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId));
    return { success: true, message: 'Chat history cleared successfully.' };
  }

  async saveMessage(
    userId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    toolCalls?: string,
  ) {
    await db.insert(chatMessages).values({
      userId,
      role,
      content,
      toolCalls,
    });
    await this.pruneOldMessages(userId, 30);
  }

  async pruneOldMessages(userId: string, keepLimit = 30) {
    const cutoff = await db
      .select({ createdAt: chatMessages.createdAt })
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(desc(chatMessages.createdAt))
      .offset(keepLimit)
      .limit(1);

    if (cutoff.length > 0) {
      await db
        .delete(chatMessages)
        .where(
          and(eq(chatMessages.userId, userId), lte(chatMessages.createdAt, cutoff[0].createdAt)),
        );
    }
  }

  private async buildConversationHistory(
    userId: string,
    history?: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<ChatTurn[]> {
    if (history && history.length > 0) {
      return history.slice(-29).map(m => ({ role: m.role, content: m.content }));
    }

    const rows = await db
      .select({ role: chatMessages.role, content: chatMessages.content })
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(asc(chatMessages.createdAt))
      .limit(29);

    return rows.map(r => ({
      role: r.role as 'user' | 'assistant',
      content: r.content,
    }));
  }

  async processChat(
    message: string,
    userId: string,
    locale?: 'en' | 'id',
    history?: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<ChatResult> {
    logger.info({ event: 'chat_process_started', userId }, 'processing chat message');
    const tools = buildChatTools(userId);

    const [categories, userAccounts] = await Promise.all([
      categoryService.getUserCategories(userId),
      financialAccountService.getByUserId(userId),
    ]);
    const categoriesInfo = categories.map(c => `- ${c.name} (${c.label})`).join('\n');
    const accountsInfo =
      userAccounts.length > 0
        ? userAccounts
            .map(a => `- ${a.name} (${a.type})${a.isDefault ? ' [DEFAULT]' : ''}`)
            .join('\n')
        : '- Belum ada akun keuangan yang dibuat.';

    const start = performance.now();
    const model =
      env.AI_PROVIDER === 'gemini' ? (env.GEMINI_MODEL ?? 'gemini') : env.OPENMODEL_MODEL;

    const priorTurns = await this.buildConversationHistory(userId, history);
    const messages: ChatTurn[] = [...priorTurns, { role: 'user', content: message }];

    const aiResponse = await generateText({
      model: getLanguageModel(),
      tools,
      stopWhen: stepCountIs(3),
      system: getSystemPrompt(categoriesInfo, accountsInfo, locale),
      messages,
    });
    const durationMs = Math.round(performance.now() - start);

    const inputTokens = aiResponse.usage?.inputTokens ?? 0;
    const outputTokens = aiResponse.usage?.outputTokens ?? 0;
    const totalTokens = aiResponse.usage?.totalTokens ?? inputTokens + outputTokens;

    metrics.recordAiGeneration({
      model,
      inputTokens,
      outputTokens,
      totalTokens,
      durationMs,
    });

    let intent = 'out_of_scope';
    let transactions: SavedTransaction[] | undefined;
    let queryResult: unknown;
    let account: unknown;
    let accounts: unknown[] | undefined;
    let categoriesData: unknown;
    let transfer: SavedTransfer | undefined;
    let updatedTransaction: unknown;
    let deletedTransaction: unknown;

    if (aiResponse.toolResults && aiResponse.toolResults.length > 0) {
      for (const res of aiResponse.toolResults) {
        const isError =
          typeof res.output === 'object' && res.output !== null && 'error' in res.output;
        metrics.recordAiToolExecution(res.toolName, Boolean(isError));
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
        } else if (res.toolName === 'update_transaction') {
          intent = 'update_transaction';
          const data = res.output as { updatedTransaction?: unknown };
          updatedTransaction = data.updatedTransaction;
        } else if (res.toolName === 'delete_transaction') {
          intent = 'delete_transaction';
          const data = res.output as { deletedTransaction?: unknown };
          deletedTransaction = data.deletedTransaction;
        }
      }
    }
    logger.info(
      {
        event: 'ai_chat_completed',
        userId,
        provider: env.AI_PROVIDER,
        model,
        intent,
        durationMs,
        tokens: {
          input: inputTokens,
          output: outputTokens,
          total: totalTokens,
        },
      },
      `AI chat processed: intent=${intent} tokens=${totalTokens} duration=${durationMs}ms`,
    );

    try {
      await this.saveMessage(userId, 'user', message);
      if (aiResponse.text) {
        await this.saveMessage(userId, 'assistant', aiResponse.text);
      }
    } catch (err) {
      logger.error({ event: 'chat_save_failed', userId, err }, 'failed to persist chat message');
    }

    return {
      intent,
      reply: aiResponse.text,
      transactions,
      queryResult,
      account,
      accounts,
      categories: categoriesData,
      transfer,
      updatedTransaction,
      deletedTransaction,
    };
  }

  async streamChat(
    message: string,
    userId: string,
    locale?: 'en' | 'id',
    history?: { role: 'user' | 'assistant'; content: string }[],
  ): Promise<Response> {
    logger.info({ event: 'chat_stream_started', userId }, 'streaming chat message');
    const tools = buildChatTools(userId);

    const [categories, userAccounts] = await Promise.all([
      categoryService.getUserCategories(userId),
      financialAccountService.getByUserId(userId),
    ]);
    const categoriesInfo = categories.map(c => `- ${c.name} (${c.label})`).join('\n');
    const accountsInfo =
      userAccounts.length > 0
        ? userAccounts
            .map(a => `- ${a.name} (${a.type})${a.isDefault ? ' [DEFAULT]' : ''}`)
            .join('\n')
        : '- Belum ada akun keuangan yang dibuat.';

    const start = performance.now();
    const model =
      env.AI_PROVIDER === 'gemini' ? (env.GEMINI_MODEL ?? 'gemini') : env.OPENMODEL_MODEL;

    const priorTurns = await this.buildConversationHistory(userId, history);
    const messages: ChatTurn[] = [...priorTurns, { role: 'user', content: message }];

    return streamText({
      model: getLanguageModel(),
      tools,
      stopWhen: stepCountIs(3),
      system: getSystemPrompt(categoriesInfo, accountsInfo, locale),
      messages,
      onError({ error }) {
        logger.error(
          { event: 'ai_stream_failed', userId, provider: env.AI_PROVIDER, model, err: error },
          'AI chat stream interrupted',
        );
      },
      onFinish: async ({ usage, text }) => {
        const durationMs = Math.round(performance.now() - start);
        const inputTokens = usage?.inputTokens ?? 0;
        const outputTokens = usage?.outputTokens ?? 0;
        const totalTokens = usage?.totalTokens ?? inputTokens + outputTokens;
        metrics.recordAiGeneration({
          model,
          inputTokens,
          outputTokens,
          totalTokens,
          durationMs,
        });
        logger.info(
          {
            event: 'ai_stream_finished',
            userId,
            provider: env.AI_PROVIDER,
            model,
            durationMs,
            tokens: usage,
          },
          `AI chat stream completed in ${durationMs}ms`,
        );

        try {
          await this.saveMessage(userId, 'user', message);
          if (text) {
            await this.saveMessage(userId, 'assistant', text);
          }
        } catch (err) {
          logger.error(
            { event: 'chat_stream_save_failed', userId, err },
            'failed to persist streamed chat message',
          );
        }
      },
    }).toUIMessageStreamResponse();
  }
}

export const chatService = new ChatService();
export * from './chat.types';
