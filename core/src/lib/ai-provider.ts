import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { env } from '@/env';

export function getLanguageModel(): LanguageModel {
  if (env.AI_PROVIDER === 'gemini') {
    const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
    return google(env.GEMINI_MODEL);
  }

  const anthropic = createAnthropic({
    baseURL: env.OPENMODEL_BASE_URL,
    apiKey: env.OPENMODEL_API_KEY,
  });
  const openai = createOpenAI({
    baseURL: env.OPENMODEL_BASE_URL,
    apiKey: env.OPENMODEL_API_KEY,
  });

  if (env.OPENMODEL_MODEL.includes('deepseek') || env.OPENMODEL_MODEL.includes('claude')) {
    return anthropic(env.OPENMODEL_MODEL);
  }

  return openai(env.OPENMODEL_MODEL);
}

export const languageModel = getLanguageModel();
