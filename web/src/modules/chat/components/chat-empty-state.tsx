import { Bot, Sparkles } from 'lucide-react';

type ChatEmptyStateProps = {
  onSuggestion: (text: string) => void;
};

const SUGGESTIONS = [
  'I spent Rp150,000 on coffee',
  "What's my balance?",
  "Show this month's expenses",
];

export function ChatEmptyState({ onSuggestion }: ChatEmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center min-h-[55dvh] gap-4 text-muted-foreground select-none px-4"
    >
      <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl glass-panel border-primary/20 text-primary shadow-tint">
        <Bot size={28} strokeWidth={1.5} />
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles size={10} strokeWidth={2.5} />
        </span>
      </div>
      <div className="text-center space-y-1">
        <p className="font-serif font-semibold text-foreground text-xl tracking-tight">
          Hi, I'm Cuan
        </p>
        <p className="text-sm text-muted-foreground prose-short">
          Ask me to log spending, check balances, or manage accounts.
        </p>
      </div>
      <div className="flex flex-col gap-2 mt-2 w-full max-w-[280px]">
        {SUGGESTIONS.map(suggestion => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            className="rounded-lg border border-tertiary/20 bg-transparent px-4 py-3 text-sm text-left text-foreground hover:bg-muted/40 hover:border-tertiary/40 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
