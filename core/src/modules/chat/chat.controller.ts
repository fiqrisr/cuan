import { Elysia } from 'elysia';
import { authGuard } from '@/modules/auth/auth-guard';
import {
  ClearChatMessagesResponseDto,
  CreateChatRequestDto,
  CreateChatResponseDto,
  GetChatMessagesResponseDto,
} from './chat.dto';
import { chatService } from './chat.service';

export const chatController = new Elysia({ prefix: '/api/chat' })
  .use(authGuard)
  .get(
    '/messages',
    async ({ user }) => {
      const messages = await chatService.getMessages(user.id);
      return { data: messages };
    },
    {
      auth: true,
      response: {
        200: GetChatMessagesResponseDto,
      },
    },
  )
  .delete(
    '/messages',
    async ({ user }) => {
      return await chatService.clearMessages(user.id);
    },
    {
      auth: true,
      response: {
        200: ClearChatMessagesResponseDto,
      },
    },
  )
  .post(
    '/',
    async ({ body, headers, user, set }) => {
      const timezone = body.timezone || headers['x-timezone'];
      const result = await chatService.processChat(
        body.message,
        user.id,
        body.locale,
        body.history,
        timezone,
      );
      set.status = result.transactions?.length ? 201 : 200;
      return { data: result };
    },
    {
      auth: true,
      body: CreateChatRequestDto,
      response: {
        200: CreateChatResponseDto,
        201: CreateChatResponseDto,
      },
    },
  )
  .post(
    '/stream',
    async ({ body, headers, user }) => {
      const timezone = body.timezone || headers['x-timezone'];
      return chatService.streamChat(body.message, user.id, body.locale, body.history, timezone);
    },
    {
      auth: true,
      body: CreateChatRequestDto,
    },
  );
