import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { API_BASE_URL } from '../../../core/http';
import { type ChatStreamEvent, streamChat } from './use-chat-stream';

describe('streamChat', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('calls fetch with API_BASE_URL, POST, JSON content type, and credentials include', async () => {
    let capturedUrl: string | URL | Request = '';
    let capturedInit: RequestInit | undefined;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'data: {"type":"text-delta","id":"1","delta":"Hi"}\n\ndata: [DONE]\n\n',
          ),
        );
        controller.close();
      },
    });

    globalThis.fetch = mock((url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = url;
      capturedInit = init;
      return Promise.resolve(
        new Response(stream, {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      );
    }) as unknown as typeof fetch;

    const events: ChatStreamEvent[] = [];
    const controller = new AbortController();

    await streamChat('test message', 'en', event => events.push(event), controller.signal);

    expect(capturedUrl).toBe(`${API_BASE_URL}/api/chat/stream`);
    expect(capturedInit?.method).toBe('POST');
    expect(capturedInit?.credentials).toBe('include');
    expect(capturedInit?.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(capturedInit?.body as string)).toEqual({
      message: 'test message',
      locale: 'en',
    });
    expect(events).toEqual([{ type: 'text-delta', id: '1', delta: 'Hi' }]);
  });

  test('throws error and captures status code when response is not ok', async () => {
    globalThis.fetch = mock(() => {
      return Promise.resolve(
        new Response('Method Not Allowed', {
          status: 405,
          statusText: 'Method Not Allowed',
        }),
      );
    }) as unknown as typeof fetch;

    const events: ChatStreamEvent[] = [];
    const controller = new AbortController();

    await expect(
      streamChat('test message', 'en', event => events.push(event), controller.signal),
    ).rejects.toThrow('Chat request failed (405): Method Not Allowed');
  });
});
