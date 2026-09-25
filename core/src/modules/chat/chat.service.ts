import { generateText, stepCountIs, streamText } from 'ai';
import { env } from '@/env';
import { getLanguageModel } from '@/lib/ai-provider';
import { logger } from '@/lib/logger';
import { metrics } from '@/lib/metrics';
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

    const start = performance.now();
    const model =
      env.AI_PROVIDER === 'gemini' ? (env.GEMINI_MODEL ?? 'gemini') : env.OPENMODEL_MODEL;

    const aiResponse = await generateText({
      model: getLanguageModel(),
      tools,
      stopWhen: stepCountIs(3),
      system: getSystemPrompt(categoriesInfo, locale),
      prompt: message,
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

    let intent = 'unknown';
    let transactions: SavedTransaction[] | undefined;
    let queryResult: unknown;
    let account: unknown;
    let accounts: unknown[] | undefined;
    let categoriesData: unknown;
    let transfer: SavedTransfer | undefined;

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
        steps: aiResponse.steps?.length ?? 1,
        toolCount: aiResponse.toolResults?.length ?? 0,
      },
      `AI chat processed: intent=${intent} tokens=${totalTokens} duration=${durationMs}ms`,
    );

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

    const start = performance.now();
    const model =
      env.AI_PROVIDER === 'gemini' ? (env.GEMINI_MODEL ?? 'gemini') : env.OPENMODEL_MODEL;

    return streamText({
      model: getLanguageModel(),
      tools,
      stopWhen: stepCountIs(3),
      system: getSystemPrompt(categoriesInfo, locale),
      prompt: message,
      onError({ error }) {
        logger.error(
          { event: 'ai_stream_failed', userId, provider: env.AI_PROVIDER, model, err: error },
          'AI chat stream interrupted',
        );
      },
      onFinish({ usage }) {
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
      },
    }).toUIMessageStreamResponse();
  }
}

export const chatService = new ChatService();
export * from './chat.types';
