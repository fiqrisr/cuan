import {
  Markdown,
  Marker,
  Message,
  MessageAvatar,
  MessageBubble,
  MessageContent,
  TypingIndicator,
} from '@cuan/ui';
import { Bot, CheckCircle2, ChevronDown, User } from 'lucide-react';
import type { ChatMessage } from '../types';

type ChatMessageItemProps = {
  message: ChatMessage;
};

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const side = message.role === 'user' ? 'right' : 'left';
  const hasRunningTools = message.toolCalls?.some(t => t.status === 'running');
  const hasReasoning = message.reasoning !== undefined && message.reasoning.length > 0;

  const showBubble = message.content || (!hasRunningTools && message.role === 'assistant');

  const toolNameMapping: Record<string, string> = {
    add_transaction: 'Recording transaction...',
    query_finances: 'Analyzing finances...',
    manage_account: 'Managing accounts...',
    manage_category: 'Managing categories...',
  };

  return (
    <Message side={side}>
      {message.role === 'assistant' && (
        <MessageAvatar className="bg-primary/10 text-primary mt-0.5">
          <Bot size={16} />
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
                {tool.status === 'done' ? 'Completed' : toolNameMapping[tool.name] || 'Thinking...'}
              </Marker>
            ))}
          </div>
        )}

        {hasReasoning && (
          <details className="group mb-1 max-w-md" open={!message.content}>
            <summary className="flex items-center gap-1 list-none cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
              <span>Thinking</span>
            </summary>
            <div className="mt-1.5 p-3 rounded-lg bg-muted/50 text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
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
      {message.role === 'user' && (
        <MessageAvatar className="bg-secondary text-secondary-foreground mt-0.5">
          <User size={16} />
        </MessageAvatar>
      )}
    </Message>
  );
}
