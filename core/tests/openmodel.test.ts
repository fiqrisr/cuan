import { describe, expect, it } from 'bun:test';
import { createOpenModelClient } from '../src/lib/openmodel';

function makeResponsePayload(text: string) {
  return {
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
            text,
            annotations: [],
          },
        ],
      },
    ],
    usage: {
      input_tokens: 10,
      output_tokens: 20,
      total_tokens: 30,
    },
  };
}

function makeFakeFetch(responseBody: unknown) {
  return async () =>
    new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
}

describe('createOpenModelClient', () => {
  it('parses an add_transaction intent with one transaction', async () => {
    const client = createOpenModelClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.openmodel.ai',
      model: 'test-model',
      fetch: makeFakeFetch(
        makeResponsePayload(
          JSON.stringify({
            intent: 'add_transaction',
            transactions: [
              {
                type: 'expense',
                amount: 150000,
                currency: 'IDR',
                category: 'public-transit',
                description: 'Taxi to airport',
                date: '2026-06-25T08:00:00.000Z',
              },
            ],
            reply: 'Got it, saved your transport transaction.',
          }),
        ),
      ),
    });

    const result = await client.chat('Taxi to airport cost 150k');

    expect(result.intent).toBe('add_transaction');
    const addResult = result as any;
    expect(addResult.transactions).toHaveLength(1);
    expect(addResult.transactions[0].amount).toBe(150000);
    expect(addResult.transactions[0].currency).toBe('IDR');
    expect(addResult.transactions[0].category).toBe('public-transit');
    expect(addResult.reply).toBe('Got it, saved your transport transaction.');
  });

  it('parses multiple transactions from a single message', async () => {
    const client = createOpenModelClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.openmodel.ai',
      model: 'test-model',
      fetch: makeFakeFetch(
        makeResponsePayload(
          JSON.stringify({
            intent: 'add_transaction',
            transactions: [
              {
                type: 'expense',
                amount: 15000,
                currency: 'IDR',
                category: 'coffee',
                description: 'Coffee',
                date: '2026-06-25T08:00:00.000Z',
              },
              {
                type: 'expense',
                amount: 30000,
                currency: 'IDR',
                category: 'dining-out',
                description: 'Lunch',
                date: '2026-06-25T12:00:00.000Z',
              },
            ],
            reply: 'Saved 2 transactions.',
          }),
        ),
      ),
    });

    const result = await client.chat('coffee 15k, lunch 30k');

    expect(result.intent).toBe('add_transaction');
    const addResult = result as any;
    expect(addResult.transactions).toHaveLength(2);
    expect(addResult.transactions[0].amount).toBe(15000);
    expect(addResult.transactions[1].amount).toBe(30000);
  });

  it('parses a query intent', async () => {
    const client = createOpenModelClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.openmodel.ai',
      model: 'test-model',
      fetch: makeFakeFetch(
        makeResponsePayload(
          JSON.stringify({
            intent: 'query',
            query: {
              queryType: 'biggest_expense',
              filters: {
                period: {
                  from: '2026-06-18T00:00:00.000Z',
                  to: '2026-06-25T23:59:59.000Z',
                },
                limit: 1,
              },
            },
            reply: 'placeholder',
          }),
        ),
      ),
    });

    const result = await client.chat('pengeluaran terbesar minggu ini?');

    expect(result.intent).toBe('query');
    const qResult = result as any;
    if (qResult.intent === 'query') {
      expect(qResult.query.queryType).toBe('biggest_expense');
      expect(qResult.query.filters.period).toBeDefined();
    }
  });

  it('parses a manage_account intent', async () => {
    const client = createOpenModelClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.openmodel.ai',
      model: 'test-model',
      fetch: makeFakeFetch(
        makeResponsePayload(
          JSON.stringify({
            intent: 'manage_account',
            action: 'create_account',
            accountName: 'BCA',
            accountType: 'bank',
            currency: 'IDR',
            initialBalance: 5000000,
            reply: 'Akun BCA berhasil dibuat.',
          }),
        ),
      ),
    });

    const result = await client.chat('buat akun BCA bank IDR 5jt');

    expect(result.intent).toBe('manage_account');
    const mResult = result as any;
    if (mResult.intent === 'manage_account') {
      expect(mResult.action).toBe('create_account');
      expect(mResult.accountName).toBe('BCA');
      expect(mResult.accountType).toBe('bank');
      expect(mResult.initialBalance).toBe(5000000);
    }
  });
});
