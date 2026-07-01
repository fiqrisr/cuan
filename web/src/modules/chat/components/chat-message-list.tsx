import { MessageScroller, MessageScrollerContent } from '@cuan/ui';
import type { ChatMessage } from '../types';
import { ChatEmptyState } from './chat-empty-state';
import { ChatErrorBanner } from './chat-error-banner';
import { ChatMessageItem } from './chat-message-item';

type ChatMessageListProps = {
  messages: ChatMessage[];
  error: string | null;
  onSuggestion: (text: string) => void;
};

export function ChatMessageList({ messages, error, onSuggestion }: ChatMessageListProps) {
  return (
    <MessageScroller>
      <MessageScrollerContent>
        {messages.length === 0 ? (
          <ChatEmptyState onSuggestion={onSuggestion} />
        ) : (
          messages.map((m) => <ChatMessageItem key={m.id} message={m} />)
        )}
        {error && <ChatErrorBanner error={error} />}
      </MessageScrollerContent>
    </MessageScroller>
  );
}
