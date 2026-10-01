import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { API_BASE_URL, handleUnauthorized } from '@/core/http';
import i18n from '@/core/i18n';
import { generateRequestId, HEADER_REQUEST_ID, telemetry } from '@/core/telemetry';
import type { ChatMessage } from '../types';

export type ChatStreamEvent =
  | { type: 'start'; messageId?: string }
  | { type: 'start-step' }
  | { type: 'finish-step' }
  | { type: 'finish'; finishReason?: string }
  | { type: 'text-delta'; id: string; delta: string }
  | { type: 'reasoning-start'; id: string }
  | { type: 'reasoning-delta'; id: string; delta: string }
  | { type: 'reasoning-end'; id: string }
  | { type: 'tool-input-start'; toolCallId: string; toolName: string }
  | { type: 'tool-output-available'; toolCallId: string }
  | { type: 'error'; errorText: string };

function parseSSELine(line: string): ChatStreamEvent | null {
  if (line.startsWith('data: ')) {
    const data = line.slice(6);
    if (data === '[DONE]') return null;
    try {
      return JSON.parse(data) as ChatStreamEvent;
    } catch {
      return null;
    }
  }
  return null;
}

export async function streamChat(
  message: string,
  locale: string,
  onEvent: (event: ChatStreamEvent) => void,
  signal: AbortSignal,
  history?: { role: 'user' | 'assistant'; content: string }[],
  timezone?: string,
): Promise<void> {
  const startTime = performance.now();
  const requestId = generateRequestId();
  const userTimezone =
    timezone ??
    (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined) ??
    'Asia/Jakarta';
  let firstChunkReceived = false;
  let eventCount = 0;

  telemetry.addBreadcrumb({
    category: 'chat',
    message: 'chat_stream_started',
    data: { requestId },
    level: 'info',
  });
  telemetry.recordEvent('chat_stream_started', { requestId }, 'info', requestId);

  try {
    const res = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-timezone': userTimezone,
        [HEADER_REQUEST_ID]: requestId,
      },
      body: JSON.stringify({
        message,
        locale,
        timezone: userTimezone,
        ...(history && history.length > 0 ? { history } : {}),
      }),
      credentials: 'include',
    });
    handleUnauthorized(res);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Chat request failed (${res.status})${body ? `: ${body}` : ''}`);
    }
    if (!res.body) throw new Error('No response body from server');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const dispatchEvent = (event: ChatStreamEvent) => {
      if (!firstChunkReceived) {
        firstChunkReceived = true;
        const ttft = Math.round(performance.now() - startTime);
        telemetry.recordMetric('chat_stream_ttft', ttft, 'ms');
      }
      eventCount++;
      onEvent(event);
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const newlineIdx = buffer.lastIndexOf('\n\n');
      if (newlineIdx === -1) continue;

      const completeChunk = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 2);

      for (const chunk of completeChunk.split('\n\n')) {
        const lines = chunk.split('\n');
        for (const line of lines) {
          const event = parseSSELine(line.trim());
          if (event) dispatchEvent(event);
        }
      }
    }

    const remaining = buffer.trim();
    if (remaining) {
      for (const chunk of remaining.split('\n\n')) {
        const lines = chunk.split('\n');
        for (const line of lines) {
          const event = parseSSELine(line.trim());
          if (event) dispatchEvent(event);
        }
      }
    }

    const duration = Math.round(performance.now() - startTime);
    telemetry.recordMetric('chat_stream_duration', duration, 'ms');
    telemetry.recordEvent(
      'chat_stream_completed',
      { duration, eventCount, requestId },
      'info',
      requestId,
    );
  } catch (err) {
    const duration = Math.round(performance.now() - startTime);
    if (signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
      telemetry.recordEvent('chat_stream_aborted', { duration, requestId }, 'info', requestId);
    } else {
      telemetry.captureException(err, {
        requestId,
        metadata: { context: 'chat_stream', duration, eventCount },
      });
      telemetry.recordEvent(
        'chat_stream_failed',
        { duration, error: String(err), requestId },
        'error',
        requestId,
      );
    }
    throw err;
  }
}

type UseChatStreamReturn = {
  messages: ChatMessage[];
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  isLoading: boolean;
  error: string | null;
  handleSubmit: (e: FormEvent) => Promise<void>;
  clearChat: () => Promise<void>;
};
export function applyChatStreamEvent(message: ChatMessage, event: ChatStreamEvent): ChatMessage {
  switch (event.type) {
    case 'text-delta':
      return { ...message, content: message.content + event.delta };

    case 'reasoning-start':
      return {
        ...message,
        reasoning: message.reasoning ?? '',
        reasoningId: event.id,
      };

    case 'reasoning-delta':
      return {
        ...message,
        reasoning: (message.reasoning ?? '') + event.delta,
      };

    case 'tool-input-start': {
      const calls = message.toolCalls || [];
      const exists = calls.some(c => c.id === event.toolCallId);
      return {
        ...message,
        toolCalls: exists
          ? calls.map(c =>
              c.id === event.toolCallId ? { ...c, name: event.toolName, status: 'running' } : c,
            )
          : [...calls, { id: event.toolCallId, name: event.toolName, status: 'running' }],
      };
    }

    case 'tool-output-available': {
      const calls = message.toolCalls || [];
      return {
        ...message,
        toolCalls: calls.map(c => (c.id === event.toolCallId ? { ...c, status: 'done' } : c)),
      };
    }

    case 'finish': {
      return {
        ...message,
        isStreaming: false,
      };
    }

    case 'error': {
      const calls = message.toolCalls || [];
      return {
        ...message,
        isStreaming: false,
        error: event.errorText,
        toolCalls: calls.map(c =>
          c.status === 'running' ? { ...c, status: 'error' as const } : c,
        ),
      };
    }

    default:
      return message;
  }
}
export function useChatStream(): UseChatStreamReturn {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSavedMessages() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/chat/messages`, {
          credentials: 'include',
        });
        handleUnauthorized(res);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && Array.isArray(json.data)) {
            const formatted: ChatMessage[] = json.data.map(
              (m: {
                id: string;
                role: 'user' | 'assistant' | 'system';
                content: string;
                toolCalls?: string | null;
              }) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                toolCalls: m.toolCalls ? JSON.parse(m.toolCalls) : [],
                isStreaming: false,
              }),
            );
            setMessages(formatted);
          }
        }
      } catch {
        // Ignore loading errors on initial mount
      }
    }
    loadSavedMessages();
    return () => {
      isMounted = false;
    };
  }, []);

  const applyEvent = useCallback((id: string, event: ChatStreamEvent) => {
    if (event.type === 'error') {
      setError(event.errorText);
      setMessages(prev =>
        prev
          .map(m => (m.id === id ? applyChatStreamEvent(m, event) : m))
          .filter(m => {
            if (m.id !== id) return true;
            const hasContent = Boolean(m.content && m.content.trim().length > 0);
            const hasReasoning = Boolean(m.reasoning && m.reasoning.length > 0);
            const hasToolCalls = Boolean(m.toolCalls && m.toolCalls.length > 0);
            return hasContent || hasReasoning || hasToolCalls;
          }),
      );
      return;
    }

    setMessages(prev => prev.map(m => (m.id === id ? applyChatStreamEvent(m, event) : m)));
  }, []);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    const aiMsgId = `a-${Date.now()}`;
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'assistant',
      content: '',
      toolCalls: [],
      isStreaming: true,
    };

    const history = messages
      .filter(m => !m.isStreaming && Boolean(m.content))
      .slice(-20)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      await streamChat(
        text,
        i18n.language,
        evt => applyEvent(aiMsgId, evt),
        controller.signal,
        history,
      );
    } catch (err) {
      if (!controller.signal.aborted && !(err instanceof Error && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : i18n.t('common.error'));
      }
      setMessages(prev =>
        prev.filter(m => {
          if (m.id !== aiMsgId) return true;
          const hasContent = Boolean(m.content && m.content.trim().length > 0);
          const hasReasoning = Boolean(m.reasoning && m.reasoning.length > 0);
          const hasToolCalls = Boolean(m.toolCalls && m.toolCalls.length > 0);
          return hasContent || hasReasoning || hasToolCalls;
        }),
      );
    } finally {
      setIsLoading(false);
      setMessages(prev =>
        prev
          .map(m =>
            m.id === aiMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  toolCalls: (m.toolCalls || []).map(c =>
                    c.status === 'running' ? { ...c, status: 'error' as const } : c,
                  ),
                }
              : m,
          )
          .filter(m => {
            if (m.id !== aiMsgId) return true;
            const hasContent = Boolean(m.content && m.content.trim().length > 0);
            const hasReasoning = Boolean(m.reasoning && m.reasoning.length > 0);
            const hasToolCalls = Boolean(m.toolCalls && m.toolCalls.length > 0);
            return hasContent || hasReasoning || hasToolCalls;
          }),
      );
    }
  };

  const clearChat = useCallback(async () => {
    abortRef.current?.abort();
    try {
      await fetch(`${API_BASE_URL}/api/chat/messages`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setMessages([]);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to clear chat';
      setError(msg);
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, input, setInput, isLoading, error, handleSubmit, clearChat };
}
