import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
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

async function streamChat(
  message: string,
  onEvent: (event: ChatStreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Chat request failed (${res.status})${body ? `: ${body}` : ''}`);
  }
  if (!res.body) throw new Error('No response body from server');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

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
        if (event) onEvent(event);
      }
    }
  }

  const remaining = buffer.trim();
  if (remaining) {
    for (const chunk of remaining.split('\n\n')) {
      const lines = chunk.split('\n');
      for (const line of lines) {
        const event = parseSSELine(line.trim());
        if (event) onEvent(event);
      }
    }
  }
}

type UseChatStreamReturn = {
  messages: ChatMessage[];
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  error: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
};

export function useChatStream(): UseChatStreamReturn {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const applyEvent = useCallback((id: string, event: ChatStreamEvent) => {
    setMessages(prev =>
      prev.map(m => {
        if (m.id !== id) return m;

        if (event.type === 'text-delta') {
          return { ...m, content: m.content + event.delta };
        }

        if (event.type === 'reasoning-start') {
          return { ...m, reasoning: '', reasoningId: event.id };
        }

        if (event.type === 'reasoning-delta') {
          return { ...m, reasoning: (m.reasoning ?? '') + event.delta };
        }

        if (event.type === 'tool-input-start') {
          const calls = m.toolCalls || [];
          return {
            ...m,
            toolCalls: [
              ...calls,
              { id: event.toolCallId, name: event.toolName, status: 'running' },
            ],
          };
        }

        if (event.type === 'tool-output-available') {
          const calls = m.toolCalls || [];
          return {
            ...m,
            toolCalls: calls.map(c => (c.id === event.toolCallId ? { ...c, status: 'done' } : c)),
          };
        }

        if (event.type === 'finish' || event.type === 'error') {
          return { ...m, isStreaming: false };
        }

        return m;
      }),
    );

    if (event.type === 'error') {
      setError(event.errorText);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      await streamChat(text, evt => applyEvent(aiMsgId, evt), controller.signal);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setMessages(prev => prev.filter(m => m.id !== aiMsgId));
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(m => (m.id === aiMsgId ? { ...m, isStreaming: false } : m)));
    }
  };

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, input, setInput, isLoading, error, handleSubmit };
}
