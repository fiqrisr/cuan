import { Markdown, Message, MessageAvatar, MessageBubble, MessageContent } from '@cuan/ui';
import { AlertCircle, Bot, CheckCircle2, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ChatMessage, ToolCall } from '../types';

type ChatMessageItemProps = {
  message: ChatMessage;
  hasGlobalError?: boolean;
};

function getToolRunningLabel(toolName: string, t: (key: string) => string): string {
  switch (toolName) {
    case 'add_transaction':
      return t('chat.toolRecording');
    case 'transfer_funds':
      return t('chat.toolTransferring');
    case 'query_finances':
      return t('chat.toolAnalyzing');
    case 'manage_account':
      return t('chat.toolAccounts');
    case 'manage_category':
      return t('chat.toolCategories');
    default:
      return t('chat.processing');
  }
}

function getToolDoneLabel(toolName: string, t: (key: string) => string): string {
  switch (toolName) {
    case 'add_transaction':
      return t('chat.toolDoneTransaction');
    case 'transfer_funds':
      return t('chat.toolDoneTransfer');
    case 'query_finances':
      return t('chat.toolDoneQuery');
    case 'manage_account':
      return t('chat.toolDoneAccount');
    case 'manage_category':
      return t('chat.toolDoneCategory');
    default:
      return t('chat.toolDone');
  }
}

function ChatLoadingIndicator({
  runningTool,
  t,
}: {
  runningTool?: ToolCall;
  t: (key: string) => string;
}) {
  if (runningTool) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 text-xs text-muted-foreground select-none py-1.5"
      >
        <Loader2 size={13} className="animate-spin text-primary shrink-0" aria-hidden="true" />
        <span className="font-medium text-foreground/90">
          {getToolRunningLabel(runningTool.name, t)}
        </span>
      </div>
    );
  }

  // Clean thinking text without trailing ellipsis to prevent double ellipsis with animated dots
  const thinkingLabel = t('chat.thinking').replace(/[.…]+$/, '');

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-xs text-muted-foreground select-none py-1.5"
    >
      <Sparkles size={13} className="text-primary animate-pulse shrink-0" aria-hidden="true" />
      <span className="font-medium text-foreground/80">{thinkingLabel}</span>
      <div className="flex items-center gap-1" aria-hidden="true">
        <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
        <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
        <span className="h-1 w-1 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function getPrimaryDoneTool(toolCalls: ToolCall[]): ToolCall | undefined {
  const doneTools = toolCalls.filter(tool => tool.status === 'done');
  if (doneTools.length === 0) return undefined;

  const priority = [
    'add_transaction',
    'transfer_funds',
    'query_finances',
    'manage_account',
    'manage_category',
  ];

  for (const name of priority) {
    const match = doneTools.find(t => t.name === name);
    if (match) return match;
  }

  return doneTools[0];
}

export function ChatMessageItem({ message, hasGlobalError }: ChatMessageItemProps) {
  const { t } = useTranslation();
  const side = message.role === 'user' ? 'right' : 'left';
  const hasReasoning = message.reasoning !== undefined && message.reasoning.length > 0;
  const isStreaming = message.isStreaming ?? false;

  const toolCalls = message.toolCalls ?? [];
  const runningTool = toolCalls.find(tool => tool.status === 'running');
  const primaryDoneTool = getPrimaryDoneTool(toolCalls);
  const hasToolError = toolCalls.some(tool => tool.status === 'error');
  const hasError = Boolean(message.error) || hasToolError;
  const isAssistant = message.role === 'assistant';
  const isThinking = isAssistant && isStreaming && !message.content && !hasError && !hasGlobalError;

  if (isAssistant && !message.content && !hasReasoning && toolCalls.length === 0 && !isThinking) {
    return null;
  }
  return (
    <Message side={side}>
      {isAssistant && (
        <MessageAvatar className="mt-0.5">
          <Bot size={14} />
        </MessageAvatar>
      )}
      <MessageContent side={side}>
        {isAssistant && primaryDoneTool && message.content && (
          <div className="flex items-center gap-1.5 mb-1.5 select-none">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 transition-all">
              <CheckCircle2 size={11} strokeWidth={2.2} className="shrink-0" aria-hidden="true" />
              <span>{getToolDoneLabel(primaryDoneTool.name, t)}</span>
            </span>
          </div>
        )}
        {isAssistant && hasToolError && !primaryDoneTool && (
          <div className="flex items-center gap-1.5 mb-1.5 select-none">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20 transition-all">
              <AlertCircle size={11} strokeWidth={2.2} className="shrink-0" aria-hidden="true" />
              <span>{t('chat.toolError')}</span>
            </span>
          </div>
        )}

        {hasReasoning && (
          <details
            className="group mb-2 max-w-md"
            open={isStreaming && !message.content && !hasError && !hasGlobalError}
          >
            <summary className="flex items-center gap-1.5 list-none cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors select-none py-0.5">
              <ChevronDown
                size={13}
                className="transition-transform group-open:rotate-180 shrink-0"
                aria-hidden="true"
              />
              <span>
                {isStreaming && !hasError && !hasGlobalError
                  ? t('chat.thinking')
                  : t('chat.thoughtProcess')}
              </span>
            </summary>
            <div className="mt-1.5 p-3 rounded-xl bg-muted/30 text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap border border-border/20 font-mono text-[11px]">
              {message.reasoning}
            </div>
          </details>
        )}

        {message.content ? (
          <MessageBubble variant={message.role === 'user' ? 'sent' : 'received'}>
            <Markdown>{message.content}</Markdown>
          </MessageBubble>
        ) : isThinking ? (
          <ChatLoadingIndicator runningTool={runningTool} t={t} />
        ) : null}
      </MessageContent>
    </Message>
  );
}
