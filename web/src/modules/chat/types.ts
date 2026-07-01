export type ChatMessageRole = 'user' | 'assistant';
export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  content: string;
  toolCalls?: { id: string; name: string; status: 'running' | 'done' }[];
};
