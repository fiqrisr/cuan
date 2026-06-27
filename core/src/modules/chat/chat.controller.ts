import { Elysia, t } from 'elysia';
import { authGuard } from '@/modules/auth';
import { CreateChatRequestDto, CreateChatResponseDto } from './chat.dto';
import { chatService } from './chat.service';

export const chatController = new Elysia({ prefix: '/api/chat' }).use(authGuard).post(
  '/',
  async ({ body, user, set }) => {
    try {
      const result = await chatService.processChat(body.message, user.id);
      set.status = result.transactions?.length ? 201 : 200;
      return result;
    } catch (error) {
      set.status = 400;
      const message = error instanceof Error ? error.message : 'Failed to process chat';
      return { error: message };
    }
  },
  {
    auth: true,
    body: CreateChatRequestDto,
    response: {
      200: CreateChatResponseDto,
      201: CreateChatResponseDto,
      400: t.Object({ error: t.String() }),
    },
  },
);
