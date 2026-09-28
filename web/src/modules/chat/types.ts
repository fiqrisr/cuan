export type ChatMessageRole = 'user' | 'assistant';

export type ToolCallStatus = 'running' | 'done' | 'error';

export type ToolCall = {
  id: string;
  name: string;
  status: ToolCallStatus;
};

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  reasoning?: string;
  reasoningId?: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
};
