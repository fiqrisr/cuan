import { Button, Input } from '@cuan/ui';
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
    <div className='shrink-0 px-4 py-3 bg-background border-t border-border/50'>
      <form onSubmit={onSubmit} className='flex gap-2 items-center'>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='Type a message…'
          className='flex-1 rounded-full px-4 border-border/50 focus-visible:ring-primary/50 focus-visible:border-primary/50 bg-muted/40'
          disabled={isLoading}
          aria-label='Chat message'
        />
        <Button
          type='submit'
          size='icon'
          className='rounded-full shrink-0'
          disabled={isLoading || !value.trim()}
          aria-label='Send message'
        >
          <Send size={17} />
        </Button>
      </form>
    </div>
  );
}
