import { Message, MessageAvatar, MessageBubble, MessageContent, TypingIndicator } from '@cuan/ui';
import { Bot, User } from 'lucide-react';
import type { ChatMessage } from '../types';

type ChatMessageItemProps = {
  message: ChatMessage;
};

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const side = message.role === 'user' ? 'right' : 'left';
  return (
    <Message side={side}>
      {message.role === 'assistant' && (
        <MessageAvatar className='bg-primary/10 text-primary mt-0.5'>
          <Bot size={16} />
        </MessageAvatar>
      )}
      <MessageContent side={side}>
        <MessageBubble variant={message.role === 'user' ? 'sent' : 'received'}>
          {message.content ? (
            <p className='whitespace-pre-wrap'>{message.content}</p>
          ) : (
            <TypingIndicator />
          )}
        </MessageBubble>
      </MessageContent>
      {message.role === 'user' && (
        <MessageAvatar className='bg-secondary text-secondary-foreground mt-0.5'>
          <User size={16} />
        </MessageAvatar>
      )}
    </Message>
  );
}
