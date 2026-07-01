import { Message, MessageAvatar, MessageBubble, MessageContent, TypingIndicator, Markdown, Marker } from '@cuan/ui';
import { Bot, User, CheckCircle2 } from 'lucide-react';
import type { ChatMessage } from '../types';

type ChatMessageItemProps = {
  message: ChatMessage;
};

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const side = message.role === 'user' ? 'right' : 'left';
  const hasRunningTools = message.toolCalls?.some(t => t.status === 'running');
  
  const showBubble = message.content || (!hasRunningTools && message.role === 'assistant');
  
  const toolNameMapping: Record<string, string> = {
    add_transaction: 'Recording transaction...',
    query_finances: 'Analyzing finances...',
    manage_account: 'Managing accounts...',
    manage_category: 'Managing categories...'
  };

  return (
    <Message side={side}>
      {message.role === 'assistant' && (
        <MessageAvatar className='bg-primary/10 text-primary mt-0.5'>
          <Bot size={16} />
        </MessageAvatar>
      )}
      <MessageContent side={side}>
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1 mb-1 items-start">
            {message.toolCalls.map((tool) => (
              <Marker key={tool.id} variant={tool.status === 'done' ? 'success' : 'default'} isLoading={tool.status === 'running'}>
                {tool.status === 'done' && <CheckCircle2 size={12} className="mr-0.5" />}
                {tool.status === 'done' ? 'Completed' : (toolNameMapping[tool.name] || 'Thinking...')}
              </Marker>
            ))}
          </div>
        )}

        {showBubble && (
          <MessageBubble variant={message.role === 'user' ? 'sent' : 'received'}>
            {message.content ? (
              <Markdown>{message.content}</Markdown>
            ) : (
              <TypingIndicator />
            )}
          </MessageBubble>
        )}
      </MessageContent>
      {message.role === 'user' && (
        <MessageAvatar className='bg-secondary text-secondary-foreground mt-0.5'>
          <User size={16} />
        </MessageAvatar>
      )}
    </Message>
  );
}
