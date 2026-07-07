import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';

export interface MarkdownProps {
  children: string;
  className?: string;
}

export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div className={cn('markdown-body text-sm space-y-2 break-words', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-lg border border-border/25 bg-background/50">
              <table className="w-full text-left border-collapse text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/50 border-b border-border/25">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="p-2 font-semibold text-foreground label-caps">{children}</th>
          ),
          td: ({ children }) => (
            <td className="p-2 border-t border-border/25 text-foreground/90">{children}</td>
          ),
          hr: () => <hr className="my-4 border-border/25" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
