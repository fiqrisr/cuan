import { Message, MessageAvatar, MessageBubble, MessageContent, TypingIndicator } from '@cuan/ui';
import { Bot, User, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types';

type ChatMessageItemProps = {
  message: ChatMessage;
};

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const side = message.role === 'user' ? 'right' : 'left';
  
  const hasRunningTools = message.toolCalls?.some(t => t.status === 'running');
  const hasCompletedTools = message.toolCalls?.some(t => t.status === 'done');
  
  const showBubble = message.content || (!hasRunningTools && message.role === 'assistant');

  return (
    <Message side={side}>
      {message.role === 'assistant' && (
        <MessageAvatar className='bg-primary/10 text-primary mt-0.5'>
          <Bot size={16} />
        </MessageAvatar>
      )}
      <MessageContent side={side}>
        {hasRunningTools && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-surface-muted border border-border/50 rounded-full w-fit mb-1 shadow-sm">
            <TypingIndicator />
            <span>Thinking...</span>
          </div>
        )}
        
        {!hasRunningTools && hasCompletedTools && !message.content && (
           <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-surface-muted border border-border/50 rounded-full w-fit mb-1 shadow-sm">
             <TypingIndicator />
             <span>Generating response...</span>
           </div>
        )}

        {showBubble && (
          <MessageBubble variant={message.role === 'user' ? 'sent' : 'received'}>
            {message.content ? (
              <div className='markdown-body text-sm space-y-2 break-words'>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-2 rounded-md border border-border/50 bg-background/50">
                        <table className="w-full text-left border-collapse text-sm">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-muted/50 border-b border-border/50">{children}</thead>,
                    th: ({ children }) => <th className="p-2 font-medium">{children}</th>,
                    td: ({ children }) => <td className="p-2 border-t border-border/50">{children}</td>,
                    hr: () => <hr className="my-3 border-border/50" />
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
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
