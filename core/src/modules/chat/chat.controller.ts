import { Elysia } from 'elysia';
import { authGuard } from '../../lib/auth-guard';
import { chatBodySchema } from './chat.schema';
import { chatService } from './chat.service';

export const chatController = new Elysia({ prefix: '/api/chat' }).use(authGuard).post(
  '/',
  async ({ body, user, set }) => {
    const result = await chatService.processChat(body.message, user.id);

    if (result.error) {
      set.status = 400;
      return { error: result.error };
    }

    set.status = 201;
    return result.data;
  },
  {
    auth: true,
    body: chatBodySchema,
  },
);
