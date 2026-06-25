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
  it('parses a plain JSON response into a transaction and reply', async () => {
    const client = createOpenModelClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.openmodel.ai',
      model: 'test-model',
      fetch: makeFakeFetch(
        makeResponsePayload(
          JSON.stringify({
            transaction: {
              type: 'expense',
              amount: 150000,
              currency: 'IDR',
              category: 'public-transit',
              description: 'Taxi to airport',
              date: '2026-06-25T08:00:00.000Z',
            },
            reply: 'Got it, saved your transport transaction.',
          }),
        ),
      ),
    });

    const result = await client.chat('Taxi to airport cost 150k');

    expect(result.transaction.amount).toBe(150000);
    expect(result.transaction.currency).toBe('IDR');
    expect(result.transaction.category).toBe('public-transit');
    expect(result.reply).toBe('Got it, saved your transport transaction.');
  });

  it('extracts JSON from a markdown code fence', async () => {
    const client = createOpenModelClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.openmodel.ai',
      model: 'test-model',
      fetch: makeFakeFetch(
        makeResponsePayload(
          '```json\n' +
            JSON.stringify({
              transaction: {
                type: 'expense',
                amount: '25000',
                currency: 'IDR',
                category: 'coffee',
                description: 'Coffee',
                date: '2026-06-25T08:00:00.000Z',
              },
              reply: 'Saved.',
            }) +
            '\n```',
        ),
      ),
    });

    const result = await client.chat('Coffee 25k');

    expect(result.transaction.amount).toBe(25000);
    expect(result.transaction.description).toBe('Coffee');
  });

  it('throws when the upstream request fails', async () => {
    const client = createOpenModelClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.openmodel.ai',
      model: 'test-model',
      fetch: async () => new Response('bad request', { status: 400 }),
    });

    await expect(client.chat('anything')).rejects.toThrow('OpenModel request failed');
  });
});
