import { Bot } from 'lucide-react';

type ChatEmptyStateProps = {
  onSuggestion: (text: string) => void;
};

const SUGGESTIONS = ["I spent 150k on coffee", "What's my balance?", "Show this month's expenses"];

export function ChatEmptyState({ onSuggestion }: ChatEmptyStateProps) {
  return (
    <div
      role='status'
      className='flex flex-col items-center justify-center min-h-[60dvh] gap-3 text-muted-foreground select-none'
    >
      <div className='flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary'>
        <Bot size={28} />
      </div>
      <div className='text-center space-y-1'>
        <p className='font-medium text-foreground text-sm'>Hi, I'm Cuan</p>
        <p className='text-sm'>How can I help with your finances today?</p>
      </div>
      <div className='flex flex-col gap-2 mt-2 w-full max-w-[240px]'>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type='button'
            onClick={() => onSuggestion(suggestion)}
            className='rounded-xl border border-border/60 bg-surface-muted px-3 py-2 text-xs text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
