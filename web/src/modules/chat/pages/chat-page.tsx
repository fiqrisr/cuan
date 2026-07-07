import { ChatHeader } from '../components/chat-header';
import { ChatInput } from '../components/chat-input';
import { ChatMessageList } from '../components/chat-message-list';
import { useChatStream } from '../hooks/use-chat-stream';

export function ChatPage() {
  const { messages, input, setInput, isLoading, error, handleSubmit } = useChatStream();

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader isLoading={isLoading} />
      <ChatMessageList messages={messages} error={error} onSuggestion={setInput} />
      <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
