import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

type MockResponse = {
  toolToCall?: string;
  args?: unknown;
  text: string;
};

let currentMockResponse: MockResponse | null = null;

mock.module('ai', () => ({
  generateText: async (options: {
    tools: Record<string, { execute: (args: unknown) => Promise<unknown> }>;
  }) => {
    const { tools } = options;
    const config = currentMockResponse;
    if (!config) throw new Error('Mock response not set');

    let result = null;
    if (config.toolToCall && tools[config.toolToCall]) {
      result = await tools[config.toolToCall].execute(config.args);
    }
    return {
      text: config.text,
      toolResults: config.toolToCall ? [{ toolName: config.toolToCall, output: result }] : [],
      steps: [],
    };
  },
  tool: (c: unknown) => c,
}));

import { app } from '@/app';
import { db } from '@/db';
import {
  account,
  categories,
  financialAccounts,
  session,
  transactions,
  user,
  verification,
} from '@/db/schema';
import { auth } from '@/modules/auth';
import type { ChatResult } from '@/modules/chat/chat.service';

async function clearDatabase(): Promise<void> {
  await db.delete(transactions);
  await db.delete(financialAccounts);
  await db.delete(session);
  await db.delete(account);
  await db.delete(verification);
  await db.delete(user);
  await db.delete(categories);

  const cats = [{ name: 'food-beverage', label: 'Makanan & Minuman' }];
  for (const c of cats) {
    await db.insert(categories).values(c);
  }
}

async function signUpAndGetCookies(email: string): Promise<string> {
  const res = await auth.handler(
    new Request('http://localhost/api/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123', name: 'Chat Test' }),
    }),
  );
  return res.headers.getSetCookie().join('; ');
}

async function createAccount(cookies: string, name: string): Promise<{ id: string }> {
  const res = await app.handle(
    new Request('http://localhost/api/financial-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookies },
      body: JSON.stringify({ name, type: 'bank', initialBalance: 1000000 }),
    }),
  );
  // Tests expect this specific format from the API
  const parsed = (await res.json()) as { data: { id: string } };
  return parsed.data;
}

async function chat(cookies: string, message: string): Promise<Response> {
  return app.handle(
    new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookies },
      body: JSON.stringify({ message }),
    }),
  );
}

describe('POST /api/chat', () => {
  beforeEach(() => {
    currentMockResponse = null;
    return clearDatabase();
  });
  afterEach(clearDatabase);

  it('saves a single transaction via add_transaction intent', async () => {
    currentMockResponse = {
      toolToCall: 'add_transaction',
      args: {
        transactions: [
          {
            type: 'expense',
            amount: 125000,
            currency: 'IDR',
            category: 'food-beverage',
            description: 'Weekly groceries',
            date: '2026-06-24T08:00:00.000Z',
          },
        ],
      },
      text: 'Pengeluaran groceries Rp125.000 berhasil dicatat.',
    };

    const cookies = await signUpAndGetCookies(`chat-single-${Date.now()}@example.com`);
    await createAccount(cookies, 'Cash');

    const response = await chat(cookies, 'belanja 125k');

    expect(response.status).toBe(201);
    const body = (await response.json()) as ChatResult;
    expect(body.intent).toBe('add_transaction');
    expect(body.transactions?.length).toBe(1);
    expect(body.transactions?.[0].amount).toBe(125000);
    expect(body.transactions?.[0].category).toBe('food-beverage');
  });

  it('saves multiple transactions from one chat message', async () => {
    currentMockResponse = {
      toolToCall: 'add_transaction',
      args: {
        transactions: [
          {
            type: 'expense',
            amount: 15000,
            currency: 'IDR',
            category: 'food-beverage',
            description: 'Coffee',
            date: '2026-06-25T08:00:00.000Z',
          },
          {
            type: 'expense',
            amount: 30000,
            currency: 'IDR',
            category: 'food-beverage',
            description: 'Lunch',
            date: '2026-06-25T12:00:00.000Z',
          },
        ],
      },
      text: 'Berhasil catat 2 transaksi.',
    };

    const cookies = await signUpAndGetCookies(`chat-multi-${Date.now()}@example.com`);
    await createAccount(cookies, 'Cash');

    const response = await chat(cookies, 'coffee 15k, lunch 30k');

    expect(response.status).toBe(201);
    const body = (await response.json()) as ChatResult;
    expect(body.intent).toBe('add_transaction');
    expect(body.transactions?.length).toBe(2);
    expect(body.transactions?.[0].amount).toBe(15000);
    expect(body.transactions?.[1].amount).toBe(30000);
    // Verify both saved in DB
    const allTx = await db.query.transactions.findMany();
    expect(allTx.length).toBeGreaterThanOrEqual(2);
  });

  it('uses default account when no account name is specified', async () => {
    currentMockResponse = {
      toolToCall: 'add_transaction',
      args: {
        transactions: [
          {
            type: 'expense',
            amount: 20000,
            currency: 'IDR',
            category: 'food-beverage',
            description: 'Coffee',
            date: '2026-06-25T08:00:00.000Z',
          },
        ],
      },
      text: 'Pengeluaran coffee Rp20.000 dicatat.',
    };

    const cookies = await signUpAndGetCookies(`chat-default-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'MyWallet');

    const response = await chat(cookies, 'coffee 20k');

    expect(response.status).toBe(201);
    const body = (await response.json()) as ChatResult;
    expect(body.transactions?.[0].accountId).toBe(acct.id);
  });

  it('handles manage_account create intent', async () => {
    currentMockResponse = {
      toolToCall: 'manage_account',
      args: {
        action: 'create_account',
        accountName: 'BCA',
        accountType: 'bank',
        currency: 'IDR',
        initialBalance: 5000000,
      },
      text: 'Akun BCA berhasil dibuat dengan saldo Rp5.000.000.',
    };

    const cookies = await signUpAndGetCookies(`chat-acct-${Date.now()}@example.com`);

    const response = await chat(cookies, 'buat akun BCA bank 5jt');

    expect(response.status).toBe(200);
    const body = (await response.json()) as ChatResult;
    expect(body.intent).toBe('manage_account');
    expect(body.account).toBeDefined();
    const acctResult = body.account as { name: string; balance: number };
    expect(acctResult.name).toBe('BCA');
    expect(acctResult.balance).toBe(5000000);
  });

  it('handles query intent (biggest_expense placeholder)', async () => {
    // First create a transaction to query
    const cookies = await signUpAndGetCookies(`chat-query-${Date.now()}@example.com`);
    const acct = await createAccount(cookies, 'Wallet');

    // Insert transaction directly
    const cat = await db.query.categories.findFirst({
      where: (c, { eq }) => eq(c.name, 'food-beverage'),
    });
    const sessionRes = await auth.handler(
      new Request('http://localhost/api/get-session', {
        headers: { Cookie: cookies },
      }),
    );
    // Tests expect this specific format from the API
    const sessionData = (await sessionRes.json()) as { user: { id: string } };
    const userId = sessionData.user.id;

    await db.insert(transactions).values({
      userId,
      accountId: acct.id,
      type: 'expense',
      amount: '50000',
      currency: 'IDR',
      categoryId: cat?.id ?? 0,
      description: 'Expensive coffee',
      date: new Date(),
    });

    currentMockResponse = {
      toolToCall: 'query_finances',
      args: {
        queryType: 'biggest_expense',
        filters: {
          period: {
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            to: new Date().toISOString(),
          },
          limit: 1,
        },
      },
      text: 'Pengeluaran terbesar minggu ini adalah Rp 50.000',
    };

    const response = await chat(cookies, 'pengeluaran terbesar minggu ini?');

    expect(response.status).toBe(200);
    const body = (await response.json()) as ChatResult;
    expect(body.intent).toBe('query');
    expect(body.reply).toContain('50');
    expect(body.queryResult).toBeDefined();
  });

  it('returns 401 without auth', async () => {
    const response = await app.handle(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'test' }),
      }),
    );
    expect(response.status).toBe(401);
  });
});
