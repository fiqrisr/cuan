import { useEffect, useRef, useState } from 'react';
import { Button, Input, Card } from '@cuan/ui';
import { Send, User, Bot } from 'lucide-react';

export function ChatModule() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{id: string, role: string, content: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content })
      });
      
      if (!res.ok) throw new Error('Failed to fetch chat');
      if (!res.body) throw new Error('No response body');
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiResponse = '';
      
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '' }]);
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          // Simple Vercel AI SDK text stream parser
          // Lines are like `0:"text"` or `e:{"type":"error"}`
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.substring(2));
                aiResponse += text;
                setMessages(prev => 
                  prev.map(m => m.id === aiMsgId ? { ...m, content: aiResponse } : m)
                );
              } catch (e) {}
            } else if (line.startsWith('text:')) {
              // Some other formats
              aiResponse += line.substring(5);
              setMessages(prev => 
                prev.map(m => m.id === aiMsgId ? { ...m, content: aiResponse } : m)
              );
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-primary-foreground tracking-tight text-body-strong">
          Cuan
        </h1>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Bot size={48} className="mb-4 text-primary/50" />
            <p className="text-center">Hi, I'm Cuan. How can I help with your finances today?</p>
            <p className="text-sm mt-2 text-center max-w-xs opacity-75">
              Try: "I spent 150k on coffee" or "What's my biggest expense?"
            </p>
          </div>
        ) : (
          messages.map(m => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-surface-muted text-body-strong'}`}
              >
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <Card
                  className={`px-4 py-2 border-0 max-w-[85%] ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-surface-muted text-body-strong rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                </Card>
              </div>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-background border-t border-border/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 rounded-full px-4 border-border/50 shadow-sm focus-visible:ring-primary/50 focus-visible:border-primary/50"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full shrink-0 shadow-sm"
            disabled={isLoading || !input.trim()}
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
