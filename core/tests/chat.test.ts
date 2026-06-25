import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import type { Server } from 'bun';
import { z } from 'zod';
import { app } from '../src/app';
import { account, session, transactions, user, verification } from '../src/db/schema';
import { auth } from '../src/lib/auth';
import { db } from '../src/lib/db';

const MOCK_PORT = 3999;

const mockResponse = {
  transaction: {
    type: 'expense',
    amount: 125000,
    currency: 'IDR',
    category: 'groceries',
    description: 'Weekly groceries',
    date: '2026-06-24T08:00:00.000Z',
  },
  reply: 'Saved your weekly grocery transaction.',
};

const chatResponseSchema = z.object({
  transaction: z.object({
    id: z.string().uuid(),
    userId: z.string(),
    type: z.string(),
    amount: z.number(),
    currency: z.string(),
    category: z.string(),
    description: z.string(),
    date: z.string(),
  }),
  reply: z.string(),
});

let mockServer: Server<unknown>;

async function clearDatabase(): Promise<void> {
  await db.delete(transactions);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);
}

async function signUp(email: string): Promise<Response> {
  return auth.handler(
    new Request('http://localhost/api/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'password123',
        name: 'Chat Test',
      }),
    }),
  );
}

describe('POST /api/chat', () => {
  beforeAll(() => {
    mockServer = Bun.serve({
      port: MOCK_PORT,
      fetch(req) {
        const url = new URL(req.url);
        if (req.method !== 'POST' || url.pathname !== '/v1/responses') {
          return new Response('Not found', { status: 404 });
        }
        return new Response(
          JSON.stringify({
            id: 'resp_test',
            object: 'response',
            created_at: Date.now(),
            model: 'test-model',
            output: [
              {
                type: 'message',
                id: 'msg_test',
                role: 'assistant',
                content: [
                  {
                    type: 'output_text',
                    text: JSON.stringify(mockResponse),
                  },
                ],
              },
            ],
            usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
          }),
          { headers: { 'Content-Type': 'application/json' } },
        );
      },
    });
  });

  afterAll(() => {
    mockServer.stop();
  });

  beforeEach(clearDatabase);
  afterEach(clearDatabase);

  it('saves a transaction extracted from a chat message', async () => {
    const email = `chat-${Date.now()}@example.com`;
    const signUpResponse = await signUp(email);
    expect(signUpResponse.status).toBe(200);

    const cookies = signUpResponse.headers.getSetCookie();
    const response = await app.handle(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookies.join('; '),
        },
        body: JSON.stringify({ message: 'I spent 125k on groceries today' }),
      }),
    );

    expect(response.status).toBe(201);
    const body = chatResponseSchema.parse(await response.json());

    expect(body.reply).toBe(mockResponse.reply);
    expect(body.transaction.type).toBe('expense');
    expect(body.transaction.amount).toBe(125000);
    expect(body.transaction.category).toBe('groceries');
    expect(body.transaction.description).toBe('Weekly groceries');
    expect(body.transaction.date).toBe(new Date('2026-06-24T08:00:00.000Z').toISOString());

    const saved = await db.query.transactions.findFirst({
      where: (transactions, { eq }) => eq(transactions.id, body.transaction.id),
    });
    expect(saved).toBeDefined();
    expect(saved?.userId).toBe(body.transaction.userId);
  });
});
