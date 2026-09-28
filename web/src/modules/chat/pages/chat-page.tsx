import { ChatHeader } from '../components/chat-header';
import { ChatInput } from '../components/chat-input';
import { ChatMessageList } from '../components/chat-message-list';
import { useChatStream } from '../hooks/use-chat-stream';

export function ChatPage() {
  const { messages, input, setInput, isLoading, error, handleSubmit, clearChat } = useChatStream();

  return (
    <div className="flex flex-col h-full bg-workspace">
      <ChatHeader isLoading={isLoading} onClear={clearChat} hasMessages={messages.length > 0} />
      <ChatMessageList messages={messages} error={error} onSuggestion={setInput} />
      <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
