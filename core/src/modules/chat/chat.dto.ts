import { t } from 'elysia';

export const CreateChatRequestDto = t.Object({
  message: t.String({ minLength: 1 }),
});

export type CreateChatRequest = typeof CreateChatRequestDto.static;

export const CreateChatResponseDto = t.Object({
  intent: t.String(),
  reply: t.String(),
  transactions: t.Optional(t.Array(t.Any())),
  queryResult: t.Optional(t.Any()),
  account: t.Optional(t.Any()),
  accounts: t.Optional(t.Array(t.Any())),
});

export type CreateChatResponse = typeof CreateChatResponseDto.static;
