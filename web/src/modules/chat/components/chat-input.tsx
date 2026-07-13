import { Button } from '@cuan/ui';
import { ArrowUp } from 'lucide-react';
import type React from 'react';

type ChatInputProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
};

export function ChatInput({ value, onChange, onSubmit, isLoading }: ChatInputProps) {
  return (
    <div className="shrink-0 px-5 pt-4 pb-24 lg:pb-4 bg-background/80 backdrop-blur-xl border-t border-border/10">
      <form onSubmit={onSubmit} className="max-w-[1440px] mx-auto w-full">
        <div className="glass-panel rounded-2xl p-1.5 flex items-center border border-border/30 shadow-tint w-full transition-all focus-within:border-primary/30 focus-within:shadow-tint-lg">
          <input
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Ask Cuan to log expenses, check balances, or manage accounts..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-foreground placeholder:text-muted-foreground/60 px-4 py-2.5"
            disabled={isLoading}
            aria-label="Chat message"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-xl shrink-0 h-9 w-9 p-0 min-w-0"
            disabled={isLoading || !value.trim()}
            aria-label="Send message"
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </Button>
        </div>
      </form>
    </div>
  );
}
