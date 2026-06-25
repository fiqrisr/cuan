export interface ChatResult {
  intent: string;
  reply: string;
  transactions?: SavedTransaction[];
  queryResult?: unknown;
  account?: unknown;
  accounts?: unknown[];
}

export interface SavedTransaction {
  id: string;
  userId: string;
  accountId: string | null;
  type: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}
