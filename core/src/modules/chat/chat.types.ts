export type ChatResult = {
  intent: string;
  reply: string;
  transactions?: SavedTransaction[];
  queryResult?: unknown;
  account?: unknown;
  accounts?: unknown[];
  categories?: unknown;
};

export type SavedTransaction = {
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
};
