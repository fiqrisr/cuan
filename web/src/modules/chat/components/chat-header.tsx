import { Bot } from 'lucide-react';

type ChatHeaderProps = {
  isLoading: boolean;
};

export function ChatHeader({ isLoading }: ChatHeaderProps) {
  return (
    <header className='flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-10'>
      <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary'>
        <Bot size={18} />
      </div>
      <div>
        <h1 className='text-sm font-semibold text-foreground leading-none'>Cuan</h1>
        <p className='text-xs text-muted-foreground mt-0.5'>
          {isLoading ? 'Typing…' : 'Your financial assistant'}
        </p>
      </div>
    </header>
  );
}
