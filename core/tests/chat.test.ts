import { z } from 'zod';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import type { Server } from 'bun';
import { createApp } from '../src/app';
import { auth } from '../src/lib/auth';
import { db } from '../src/lib/db';
import { expenses, account, session, user, verification } from '../src/db/schema';

const MOCK_PORT = 3999;

const mockResponse = {
  expense: {
    amount: 125000,
    currency: 'IDR',
    category: 'Groceries',
    description: 'Weekly groceries',
    date: '2026-06-24',
  },
  reply: 'Saved your weekly grocery expense.',
};

const chatResponseSchema = z.object({
  expense: z.object({
    id: z.string().uuid(),
    userId: z.string(),
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
  await db.delete(expenses);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);
}

async function signUp(email: string): Promise<Response> {
  return auth.handler(
    new Request('http://localhost/api/auth/sign-up/email', {
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
      fetch() {
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(mockResponse),
                },
              },
            ],
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

  it('saves an expense extracted from a chat message', async () => {
    const app = createApp();
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
    expect(body.expense.amount).toBe(125000);
    expect(body.expense.category).toBe('Groceries');
    expect(body.expense.description).toBe('Weekly groceries');
    expect(body.expense.date).toBe('2026-06-24');

    const saved = await db.query.expenses.findFirst({
      where: (expenses, { eq }) => eq(expenses.id, body.expense.id),
    });
    expect(saved).toBeDefined();
    expect(saved?.userId).toBe(body.expense.userId);
  });
});
