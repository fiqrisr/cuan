import { Bot } from 'lucide-react';

type ChatEmptyStateProps = {
  onSuggestion: (text: string) => void;
};

const SUGGESTIONS = ['I spent 150k on coffee', "What's my balance?", "Show this month's expenses"];

export function ChatEmptyState({ onSuggestion }: ChatEmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center min-h-[60dvh] gap-3 text-muted-foreground select-none"
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-full glass-panel border-primary/20 text-primary">
        <Bot size={24} />
      </div>
      <div className="text-center space-y-1 mt-1">
        <p className="font-serif font-semibold text-foreground text-lg tracking-tight">
          Hi, I'm Cuan
        </p>
        <p className="text-xs text-muted-foreground label-caps tracking-wider mt-1">
          Your Private Financial Lounge
        </p>
      </div>
      <div className="flex flex-col gap-2 mt-4 w-full max-w-[260px]">
        {SUGGESTIONS.map(suggestion => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            className="rounded border border-tertiary/20 bg-transparent px-4 py-2.5 text-xs text-left text-foreground hover:bg-white/5 hover:border-tertiary/40 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
