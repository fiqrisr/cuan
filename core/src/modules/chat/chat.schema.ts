import { t } from 'elysia';

export const chatBodySchema = t.Object({
  message: t.String({ minLength: 1 }),
});

export type ChatBody = typeof chatBodySchema.static;
