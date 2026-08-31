import {
  Markdown,
  Marker,
  Message,
  MessageAvatar,
  MessageBubble,
  MessageContent,
  TypingIndicator,
} from '@cuan/ui';
import { Bot, CheckCircle2, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ChatMessage } from '../types';

type ChatMessageItemProps = {
  message: ChatMessage;
};

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const { t } = useTranslation();
  const side = message.role === 'user' ? 'right' : 'left';
  const hasReasoning = message.reasoning !== undefined && message.reasoning.length > 0;
  const isStreaming = message.isStreaming ?? false;

  const showBubble = message.content || (isStreaming && message.role === 'assistant');

  const toolNameMapping: Record<string, string> = {
    add_transaction: t('chat.toolRecording'),
    query_finances: t('chat.toolAnalyzing'),
    manage_account: t('chat.toolAccounts'),
    manage_category: t('chat.toolCategories'),
  };

  return (
    <Message side={side}>
      {message.role === 'assistant' && (
        <MessageAvatar className="mt-0.5">
          <Bot size={14} />
        </MessageAvatar>
      )}
      <MessageContent side={side}>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1 mb-1 items-start">
            {message.toolCalls.map(tool => (
              <Marker
                key={tool.id}
                variant={tool.status === 'done' ? 'success' : 'default'}
                isLoading={tool.status === 'running'}
              >
                {tool.status === 'done' && <CheckCircle2 size={12} className="mr-0.5" />}
                {tool.status === 'done'
                  ? t('chat.toolDone')
                  : toolNameMapping[tool.name] || t('chat.thinking')}
              </Marker>
            ))}
          </div>
        )}

        {hasReasoning && (
          <details className="group mb-1 max-w-md" open={isStreaming && !message.content}>
            <summary className="flex items-center gap-1 list-none cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
              <span>{isStreaming ? t('chat.thinking') : t('chat.thoughtProcess')}</span>
            </summary>
            <div className="mt-1.5 p-3 rounded bg-muted/30 text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap border border-border/10">
              {message.reasoning}
            </div>
          </details>
        )}

        {showBubble && (
          <MessageBubble variant={message.role === 'user' ? 'sent' : 'received'}>
            {message.content ? <Markdown>{message.content}</Markdown> : <TypingIndicator />}
          </MessageBubble>
        )}
      </MessageContent>
    </Message>
  );
}
