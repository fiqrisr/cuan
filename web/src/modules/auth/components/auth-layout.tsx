import { cn } from '@cuan/ui';
import { Bot } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthLayout({
  children,
  title,
  subtitle,
  className,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className="relative flex min-h-full flex-col overflow-y-auto">
      {/* Ambient background layers */}
      <div className="pointer-events-none fixed inset-0 -z-10 ambient-glow" />
      <div className="pointer-events-none fixed inset-0 -z-10 ambient-glow-bottom opacity-60" />
      {/* Content wrapper */}
      <div
        className={cn('mx-auto flex w-full flex-1 flex-col lg:flex-row lg:max-w-5xl', className)}
      >
        {/* Left panel — brand */}
        <div className="relative flex flex-col justify-between px-6 py-10 sm:px-12 lg:w-5/12 lg:px-16 lg:py-14">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl glass-panel border-primary/20 text-primary">
              <Bot size={18} strokeWidth={1.75} />
            </div>
            <span className="font-serif logo-weight text-2xl tracking-tight text-foreground">
              Cuan
            </span>
          </div>
          <div className="mt-12 lg:mt-0">
            <h2 className="display-lg-mobile lg:display-lg text-foreground">{title}</h2>
            <p className="body-lg text-muted-foreground mt-4 prose-short">{subtitle}</p>
          </div>
          <div className="hidden lg:block">
            <p className="text-xs text-muted-foreground">
              Private finance, tracked by chat. No spreadsheets required.
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 items-start lg:items-center justify-center px-6 pb-12 pt-4 sm:px-12 lg:px-16 lg:py-14">
          {children}
        </div>
      </div>
    </div>
  );
}
