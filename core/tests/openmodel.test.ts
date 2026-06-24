import { describe, it, expect } from 'bun:test';
import { createOpenModelClient } from '../src/lib/openmodel';

function makeFakeFetch(responseBody: unknown) {
  return async () =>
    new Response(JSON.stringify(responseBody), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
}

describe('createOpenModelClient', () => {
  it('parses a plain JSON completion into an expense and reply', async () => {
    const client = createOpenModelClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.example.com/v1',
      model: 'test-model',
      fetch: makeFakeFetch({
        choices: [
          {
            message: {
              content: JSON.stringify({
                expense: {
                  amount: 150000,
                  currency: 'IDR',
                  category: 'Transport',
                  description: 'Taxi to airport',
                  date: '2026-06-24',
                },
                reply: 'Got it, saved your transport expense.',
              }),
            },
          },
        ],
      }),
    });

    const result = await client.chat('Taxi to airport cost 150k');

    expect(result.expense.amount).toBe(150000);
    expect(result.expense.currency).toBe('IDR');
    expect(result.expense.category).toBe('Transport');
    expect(result.reply).toBe('Got it, saved your transport expense.');
  });

  it('extracts JSON from a markdown code fence', async () => {
    const client = createOpenModelClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.example.com/v1',
      model: 'test-model',
      fetch: makeFakeFetch({
        choices: [
          {
            message: {
              content:
                '```json\n' +
                JSON.stringify({
                  expense: {
                    amount: '25000',
                    currency: 'IDR',
                    category: 'Food',
                    description: 'Coffee',
                    date: '2026-06-24',
                  },
                  reply: 'Saved.',
                }) +
                '\n```',
            },
          },
        ],
      }),
    });

    const result = await client.chat('Coffee 25k');

    expect(result.expense.amount).toBe(25000);
    expect(result.expense.description).toBe('Coffee');
  });

  it('throws when the upstream request fails', async () => {
    const client = createOpenModelClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.example.com/v1',
      model: 'test-model',
      fetch: async () => new Response('bad request', { status: 400 }),
    });

    await expect(client.chat('anything')).rejects.toThrow('OpenModel request failed');
  });
});
