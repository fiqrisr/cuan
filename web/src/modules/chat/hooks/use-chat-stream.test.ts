import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { API_BASE_URL } from '../../../core/http';
import type { ChatMessage } from '../types';
import { applyChatStreamEvent, type ChatStreamEvent, streamChat } from './use-chat-stream';

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
    expect(capturedInit?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    const requestHeaders = (capturedInit?.headers ?? {}) as Record<string, string>;
    expect(requestHeaders['x-request-id']).toBeDefined();
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

describe('applyChatStreamEvent', () => {
  const initialMessage: ChatMessage = {
    id: 'ai-1',
    role: 'assistant',
    content: '',
    toolCalls: [],
    isStreaming: true,
  };

  test('appends text on text-delta event', () => {
    const m1 = applyChatStreamEvent(initialMessage, {
      type: 'text-delta',
      id: 't-1',
      delta: 'Hello',
    });
    expect(m1.content).toBe('Hello');

    const m2 = applyChatStreamEvent(m1, {
      type: 'text-delta',
      id: 't-2',
      delta: ' world!',
    });
    expect(m2.content).toBe('Hello world!');
  });

  test('accumulates reasoning deltas on reasoning events', () => {
    const m1 = applyChatStreamEvent(initialMessage, {
      type: 'reasoning-start',
      id: 'r-1',
    });
    expect(m1.reasoning).toBe('');
    expect(m1.reasoningId).toBe('r-1');

    const m2 = applyChatStreamEvent(m1, {
      type: 'reasoning-delta',
      id: 'r-1',
      delta: 'Thinking...',
    });
    expect(m2.reasoning).toBe('Thinking...');
  });

  test('does not wipe content or reasoning on start-step event', () => {
    const existingMessage: ChatMessage = {
      id: 'ai-1',
      role: 'assistant',
      content: 'Recorded coffee',
      reasoning: 'Extracted 25k',
      toolCalls: [{ id: 'tc-1', name: 'add_transaction', status: 'done' }],
      isStreaming: true,
    };

    const result = applyChatStreamEvent(existingMessage, { type: 'start-step' });
    expect(result.content).toBe('Recorded coffee');
    expect(result.reasoning).toBe('Extracted 25k');
    expect(result.toolCalls).toEqual([{ id: 'tc-1', name: 'add_transaction', status: 'done' }]);
  });

  test('registers tool call with running status on tool-input-start', () => {
    const result = applyChatStreamEvent(initialMessage, {
      type: 'tool-input-start',
      toolCallId: 'call-1',
      toolName: 'add_transaction',
    });

    expect(result.toolCalls).toEqual([
      { id: 'call-1', name: 'add_transaction', status: 'running' },
    ]);
  });

  test('does not duplicate existing tool call on duplicate tool-input-start', () => {
    const withTool = applyChatStreamEvent(initialMessage, {
      type: 'tool-input-start',
      toolCallId: 'call-1',
      toolName: 'add_transaction',
    });
    const duplicate = applyChatStreamEvent(withTool, {
      type: 'tool-input-start',
      toolCallId: 'call-1',
      toolName: 'add_transaction',
    });

    expect(duplicate.toolCalls?.length).toBe(1);
    expect(duplicate.toolCalls?.[0].id).toBe('call-1');
  });

  test('marks tool call as done on tool-output-available', () => {
    const withRunningTool: ChatMessage = {
      ...initialMessage,
      toolCalls: [{ id: 'call-1', name: 'add_transaction', status: 'running' }],
    };

    const result = applyChatStreamEvent(withRunningTool, {
      type: 'tool-output-available',
      toolCallId: 'call-1',
    });

    expect(result.toolCalls).toEqual([{ id: 'call-1', name: 'add_transaction', status: 'done' }]);
  });

  test('marks isStreaming as false on finish event without overwriting tool calls', () => {
    const withDoneTool: ChatMessage = {
      ...initialMessage,
      content: 'All done!',
      toolCalls: [{ id: 'call-1', name: 'add_transaction', status: 'done' }],
      isStreaming: true,
    };

    const result = applyChatStreamEvent(withDoneTool, { type: 'finish' });
    expect(result.isStreaming).toBe(false);
    expect(result.toolCalls).toEqual([{ id: 'call-1', name: 'add_transaction', status: 'done' }]);
  });

  test('marks isStreaming as false and running tools as error on error event', () => {
    const withRunningTool: ChatMessage = {
      ...initialMessage,
      toolCalls: [
        { id: 'call-1', name: 'add_transaction', status: 'done' },
        { id: 'call-2', name: 'manage_account', status: 'running' },
      ],
      isStreaming: true,
    };

    const result = applyChatStreamEvent(withRunningTool, {
      type: 'error',
      errorText: 'Internal server error',
    });

    expect(result.isStreaming).toBe(false);
    expect(result.toolCalls).toEqual([
      { id: 'call-1', name: 'add_transaction', status: 'done' },
      { id: 'call-2', name: 'manage_account', status: 'error' },
    ]);
  });
});
