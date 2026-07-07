import { Bot } from 'lucide-react';

type ChatHeaderProps = {
  isLoading: boolean;
};

export function ChatHeader({ isLoading }: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-6 py-4 border-b border-border/20 bg-background/40 backdrop-blur-lg sticky top-0 z-10">
      <div className="flex items-center justify-center w-8 h-8 rounded-full glass-panel border-primary/20 text-primary">
        <Bot size={16} />
      </div>
      <div>
        <h1 className="text-sm font-bold tracking-wide text-foreground leading-none">Cuan</h1>
        <p className="text-[10px] label-caps text-muted-foreground mt-1">
          {isLoading ? 'Typing…' : 'Your financial assistant'}
        </p>
      </div>
    </header>
  );
}
