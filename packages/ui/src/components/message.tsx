import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------

const messageBubbleVariants = cva(
  'relative max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed break-words',
  {
    variants: {
      variant: {
        sent: 'bg-primary text-primary-foreground rounded-tr-sm',
        received: 'bg-muted text-foreground rounded-tl-sm',
      },
    },
    defaultVariants: {
      variant: 'received',
    },
  },
);

export type MessageBubbleProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageBubbleVariants>;

const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({ className, variant, children, ...props }, ref) => (
    <div ref={ref} className={cn(messageBubbleVariants({ variant }), className)} {...props}>
      {children}
    </div>
  ),
);
MessageBubble.displayName = 'MessageBubble';

// ---------------------------------------------------------------------------
// MessageAvatar
// ---------------------------------------------------------------------------

export type MessageAvatarProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Fallback icon/text when no src */
  fallback?: React.ReactNode;
};

const MessageAvatar = React.forwardRef<HTMLDivElement, MessageAvatarProps>(
  ({ className, fallback, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-muted text-muted-foreground',
        className,
      )}
      aria-hidden="true"
      {...props}
    >
      {children ?? fallback}
    </div>
  ),
);
MessageAvatar.displayName = 'MessageAvatar';

// ---------------------------------------------------------------------------
// Message (row container)
// ---------------------------------------------------------------------------

const messageVariants = cva('flex w-full gap-3', {
  variants: {
    side: {
      left: 'flex-row',
      right: 'flex-row-reverse',
    },
  },
  defaultVariants: {
    side: 'left',
  },
});

export type MessageProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageVariants>;

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, side, children, ...props }, ref) => (
    <div ref={ref} className={cn(messageVariants({ side }), className)} {...props}>
      {children}
    </div>
  ),
);
Message.displayName = 'Message';

// ---------------------------------------------------------------------------
// MessageContent — wraps bubble + metadata in a column aligned to the side
// ---------------------------------------------------------------------------

const messageContentVariants = cva('flex flex-col gap-1', {
  variants: {
    side: {
      left: 'items-start',
      right: 'items-end',
    },
  },
  defaultVariants: {
    side: 'left',
  },
});

export type MessageContentProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageContentVariants>;

const MessageContent = React.forwardRef<HTMLDivElement, MessageContentProps>(
  ({ className, side, children, ...props }, ref) => (
    <div ref={ref} className={cn(messageContentVariants({ side }), className)} {...props}>
      {children}
    </div>
  ),
);
MessageContent.displayName = 'MessageContent';

// ---------------------------------------------------------------------------
// Typing indicator — animated dots for streaming / loading state
// ---------------------------------------------------------------------------

const TypingIndicator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-label="Typing"
      className={cn('flex items-center gap-1 px-1 py-0.5', className)}
      {...props}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
        />
      ))}
    </div>
  ),
);
TypingIndicator.displayName = 'TypingIndicator';

export { Message, MessageContent, MessageAvatar, MessageBubble, TypingIndicator };
