import { describe, expect, mock, test } from 'bun:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import '@/core/i18n';
import i18n from '@/core/i18n';
import type { ChatMessage } from '../types';
import { ChatMessageItem } from './chat-message-item';
import { ChatMessageList } from './chat-message-list';

// Mock MessageScroller to avoid duplicate React instance in packages/ui during SSR testing
mock.module('@cuan/ui', () => {
  const actual = require('@cuan/ui');
  return {
    ...actual,
    MessageScroller: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'message-scroller' }, children),
    MessageScrollerContent: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => React.createElement('div', { className }, children),
  };
});

describe('ChatMessageItem', () => {
  test('renders thinking animation when assistant is actively streaming with empty content and no error', async () => {
    await i18n.changeLanguage('en');
    const message: ChatMessage = {
      id: 'ai-1',
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    const html = renderToString(React.createElement(ChatMessageItem, { message }));
    expect(html).toContain('Thinking');
    expect(html).toContain('animate-pulse');
  });

  test('does NOT render thinking animation when assistant is not streaming', async () => {
    await i18n.changeLanguage('en');
    const message: ChatMessage = {
      id: 'ai-1',
      role: 'assistant',
      content: '',
      isStreaming: false,
    };

    const html = renderToString(React.createElement(ChatMessageItem, { message }));
    expect(html).not.toContain('Thinking');
    expect(html).toBe('');
  });

  test('does NOT render thinking animation when hasGlobalError is true', async () => {
    await i18n.changeLanguage('en');
    const message: ChatMessage = {
      id: 'ai-1',
      role: 'assistant',
      content: '',
      isStreaming: true,
    };

    const html = renderToString(
      React.createElement(ChatMessageItem, {
        message,
        hasGlobalError: true,
      }),
    );
    expect(html).not.toContain('Thinking');
    expect(html).toBe('');
  });

  test('does NOT render thinking animation when message.error is present', async () => {
    await i18n.changeLanguage('en');
    const message: ChatMessage = {
      id: 'ai-1',
      role: 'assistant',
      content: '',
      isStreaming: true,
      error: 'An error occurred.',
    };

    const html = renderToString(React.createElement(ChatMessageItem, { message }));
    expect(html).not.toContain('Thinking');
  });

  test('does NOT render thinking animation when a tool call has error status', async () => {
    await i18n.changeLanguage('en');
    const message: ChatMessage = {
      id: 'ai-1',
      role: 'assistant',
      content: '',
      isStreaming: true,
      toolCalls: [{ id: 'tc-1', name: 'add_transaction', status: 'error' }],
    };

    const html = renderToString(React.createElement(ChatMessageItem, { message }));
    expect(html).not.toContain('Thinking');
    expect(html).toContain('Failed');
  });

  test('renders message bubble when content is present even during streaming', async () => {
    await i18n.changeLanguage('en');
    const message: ChatMessage = {
      id: 'ai-1',
      role: 'assistant',
      content: 'Here is your summary.',
      isStreaming: true,
    };

    const html = renderToString(React.createElement(ChatMessageItem, { message }));
    expect(html).toContain('Here is your summary.');
    expect(html).not.toContain('Thinking');
  });

  test('renders reasoning thought process when present without thinking animation on error', async () => {
    await i18n.changeLanguage('en');
    const message: ChatMessage = {
      id: 'ai-1',
      role: 'assistant',
      content: '',
      reasoning: 'Analyzing transactions',
      isStreaming: false,
      error: 'An error occurred.',
    };

    const html = renderToString(React.createElement(ChatMessageItem, { message }));
    expect(html).toContain('Thought process');
    expect(html).toContain('Analyzing transactions');
    expect(html).not.toContain('Thinking');
  });

  test('renders user bubble with w-fit max-w-full inside max-w-[85%] container to avoid premature line breaks', async () => {
    await i18n.changeLanguage('en');
    const message: ChatMessage = {
      id: 'u-1',
      role: 'user',
      content: 'gaji 10 juta',
    };

    const html = renderToString(React.createElement(ChatMessageItem, { message }));
    expect(html).toContain('gaji 10 juta');
    expect(html).toContain('max-w-[85%]');
    expect(html).toContain('w-fit');
    expect(html).toContain('max-w-full');
  });
});

describe('ChatMessageList with error', () => {
  test('renders error banner and suppresses thinking animation on error', async () => {
    await i18n.changeLanguage('en');
    const messages: ChatMessage[] = [
      { id: 'u-1', role: 'user', content: 'What did I spend?' },
      {
        id: 'a-1',
        role: 'assistant',
        content: '',
        isStreaming: false,
        error: 'An error occurred.',
      },
    ];

    const html = renderToString(
      React.createElement(ChatMessageList, {
        messages,
        error: 'An error occurred.',
        onSuggestion: () => {},
      }),
    );

    expect(html).toContain('What did I spend?');
    expect(html).toContain('An error occurred.');
    expect(html).not.toContain('Thinking');
  });

  test('suppresses thinking animation even if assistant is still flagged isStreaming when error banner is present', async () => {
    await i18n.changeLanguage('en');
    const messages: ChatMessage[] = [
      { id: 'u-1', role: 'user', content: 'What did I spend?' },
      { id: 'a-1', role: 'assistant', content: '', isStreaming: true },
    ];

    const html = renderToString(
      React.createElement(ChatMessageList, {
        messages,
        error: 'An error occurred.',
        onSuggestion: () => {},
      }),
    );

    expect(html).toContain('What did I spend?');
    expect(html).toContain('An error occurred.');
    expect(html).not.toContain('Thinking');
  });
});
