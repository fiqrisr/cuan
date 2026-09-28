import { t } from 'elysia';

export const CreateChatRequestDto = t.Object({
  message: t.String({ minLength: 1 }),
  locale: t.Optional(t.Union([t.Literal('en'), t.Literal('id')])),
  history: t.Optional(
    t.Array(
      t.Object({
        role: t.Union([t.Literal('user'), t.Literal('assistant')]),
        content: t.String(),
      }),
    ),
  ),
});

export type CreateChatRequest = typeof CreateChatRequestDto.static;

export const CreateChatResponseDto = t.Object({
  data: t.Object({
    intent: t.String(),
    reply: t.String(),
    transactions: t.Optional(t.Array(t.Any())),
    queryResult: t.Optional(t.Any()),
    account: t.Optional(t.Any()),
    accounts: t.Optional(t.Array(t.Any())),
    categories: t.Optional(t.Any()),
    transfer: t.Optional(t.Any()),
    updatedTransaction: t.Optional(t.Any()),
    deletedTransaction: t.Optional(t.Any()),
  }),
});

export type CreateChatResponse = typeof CreateChatResponseDto.static;

export const ChatMessageDto = t.Object({
  id: t.String(),
  role: t.Union([t.Literal('user'), t.Literal('assistant'), t.Literal('system')]),
  content: t.String(),
  toolCalls: t.Optional(t.Nullable(t.String())),
  createdAt: t.String(),
});

export const GetChatMessagesResponseDto = t.Object({
  data: t.Array(ChatMessageDto),
});

export type GetChatMessagesResponse = typeof GetChatMessagesResponseDto.static;

export const ClearChatMessagesResponseDto = t.Object({
  success: t.Boolean(),
  message: t.String(),
});

export type ClearChatMessagesResponse = typeof ClearChatMessagesResponseDto.static;
