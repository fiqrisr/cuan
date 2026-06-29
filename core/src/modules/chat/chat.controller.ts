import { Elysia } from 'elysia';
import { authGuard } from '@/modules/auth';
import { CreateChatRequestDto, CreateChatResponseDto } from './chat.dto';
import { chatService } from './chat.service';

export const chatController = new Elysia({ prefix: '/api/chat' }).use(authGuard).post(
  '/',
  async ({ body, user, set }) => {
    const result = await chatService.processChat(body.message, user.id);
    set.status = result.transactions?.length ? 201 : 200;
    return result;
  },
  {
    auth: true,
    body: CreateChatRequestDto,
    response: {
      200: CreateChatResponseDto,
      201: CreateChatResponseDto,
    },
  },
);
