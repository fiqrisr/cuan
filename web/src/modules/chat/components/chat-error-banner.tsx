import { AlertCircle } from 'lucide-react';

type ChatErrorBannerProps = {
  error: string;
};

export function ChatErrorBanner({ error }: ChatErrorBannerProps) {
  return (
    <div
      role='alert'
      className='flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive'
    >
      <AlertCircle size={14} className='shrink-0 mt-0.5' />
      <span>{error}</span>
    </div>
  );
}
