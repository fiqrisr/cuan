import { Button } from '@cuan/ui';
import { Send } from 'lucide-react';
import type React from 'react';

type ChatInputProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
};

export function ChatInput({ value, onChange, onSubmit, isLoading }: ChatInputProps) {
  return (
    <div className="shrink-0 px-6 py-4 bg-background/50 backdrop-blur-md border-t border-border/20">
      <form onSubmit={onSubmit} className="max-w-[1440px] mx-auto w-full">
        <div className="glass-panel rounded-full p-2 flex items-center border border-border/40 shadow-lg w-full">
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Ask Cuan to log expenses, check balances, or manage accounts..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-foreground placeholder:text-muted-foreground/60 px-4 py-2"
            disabled={isLoading}
            aria-label="Chat message"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full shrink-0 h-10 w-10 p-0 min-w-0"
            disabled={isLoading || !value.trim()}
            aria-label="Send message"
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}
