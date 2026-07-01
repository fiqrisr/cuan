import * as React from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// useScrollAnchor — keeps scroll pinned to the bottom while streaming,
// releases the anchor when the user scrolls up.
// ---------------------------------------------------------------------------

function useScrollAnchor() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const isAtBottomRef = React.useRef(true);
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = 'smooth') => {
    anchorRef.current?.scrollIntoView({ behavior, block: 'end' });
    isAtBottomRef.current = true;
    setShowScrollButton(false);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const atBottom = distanceFromBottom < 40;
      isAtBottomRef.current = atBottom;
      setShowScrollButton(!atBottom);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll when content grows, only if already at bottom
  const onContentChange = React.useCallback(() => {
    if (isAtBottomRef.current) {
      anchorRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
  }, []);

  return { scrollRef, anchorRef, showScrollButton, scrollToBottom, onContentChange };
}

// ---------------------------------------------------------------------------
// MessageScrollerContext — lets inner content trigger scroll updates
// ---------------------------------------------------------------------------

type MessageScrollerContextValue = {
  onContentChange: () => void;
};

const MessageScrollerContext = React.createContext<MessageScrollerContextValue>({
  onContentChange: () => {},
});

export function useMessageScroller() {
  return React.useContext(MessageScrollerContext);
}

// ---------------------------------------------------------------------------
// MessageScroller
// ---------------------------------------------------------------------------

export type MessageScrollerProps = React.HTMLAttributes<HTMLDivElement>;

const MessageScroller = React.forwardRef<HTMLDivElement, MessageScrollerProps>(
  ({ className, children, ...props }, ref) => {
    const { scrollRef, anchorRef, showScrollButton, scrollToBottom, onContentChange } =
      useScrollAnchor();

    // Merge forwarded ref with internal scrollRef
    const mergedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref, scrollRef],
    );

    return (
      <MessageScrollerContext.Provider value={{ onContentChange }}>
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={mergedRef}
            className={cn('h-full overflow-y-auto', className)}
            {...props}
          >
            {children}
            {/* Scroll anchor — always at the bottom */}
            <div ref={anchorRef} className="h-px shrink-0" aria-hidden="true" />
          </div>

          {/* Jump-to-bottom button */}
          {showScrollButton && (
            <button
              type="button"
              aria-label="Scroll to latest message"
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              ↓ Latest message
            </button>
          )}
        </div>
      </MessageScrollerContext.Provider>
    );
  },
);
MessageScroller.displayName = 'MessageScroller';

// ---------------------------------------------------------------------------
// MessageScrollerContent — reports size changes to trigger scroll anchor
// ---------------------------------------------------------------------------

const MessageScrollerContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { onContentChange } = useMessageScroller();
  const innerRef = React.useRef<HTMLDivElement>(null);

  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      (innerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  React.useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(onContentChange);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onContentChange]);

  return (
    <div ref={mergedRef} className={cn('flex flex-col gap-4 p-4', className)} {...props}>
      {children}
    </div>
  );
});
MessageScrollerContent.displayName = 'MessageScrollerContent';

export { MessageScroller, MessageScrollerContent };
