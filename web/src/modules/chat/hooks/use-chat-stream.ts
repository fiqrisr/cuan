import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import type { ChatMessage } from '../types';

function parseStreamLine(line: string): string | null {
  if (line.startsWith('0:')) {
    try {
      return JSON.parse(line.slice(2)) as string;
    } catch {
      return null;
    }
  }
  if (line.startsWith('text:')) {
    return line.slice(5);
  }
  return null;
}

async function streamChat(
  message: string,
  onDelta: (text: string) => void,
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
  let isRawText = true; // Assume raw text unless we see protocol markers

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    
    // Check if we are receiving the Vercel AI SDK Data Stream protocol
    if (chunk.startsWith('0:"') || chunk.startsWith('e:{')) {
      isRawText = false;
    }

    if (isRawText) {
      onDelta(chunk);
    } else {
      buffer += chunk;
      const newlineIdx = buffer.lastIndexOf('\n');
      if (newlineIdx === -1) continue;
      const completeChunk = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      for (const line of completeChunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const delta = parseStreamLine(trimmed);
        if (delta) onDelta(delta);
      }
    }
  }

  if (!isRawText) {
    const remaining = buffer.trim();
    if (remaining) {
      for (const line of remaining.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const delta = parseStreamLine(trimmed);
        if (delta) onDelta(delta);
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

  const applyDelta = useCallback((id: string, delta: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m)),
    );
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
    const aiMsg: ChatMessage = { id: aiMsgId, role: 'assistant', content: '' };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput('');
    setError(null);
    setIsLoading(true);

    try {
      await streamChat(text, (delta) => applyDelta(aiMsgId, delta), controller.signal);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, input, setInput, isLoading, error, handleSubmit };
}
