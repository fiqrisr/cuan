export type ChatResult = {
  intent: string;
  reply: string;
  transactions?: SavedTransaction[];
  queryResult?: unknown;
  account?: unknown;
  accounts?: unknown[];
  categories?: unknown;
  transfer?: SavedTransfer;
};

export type SavedTransfer = {
  sourceAccount: { id: string; name: string; balance: number };
  destinationAccount: { id: string; name: string; balance: number };
  amount: number;
  date: string;
  transactions: SavedTransaction[];
};

export type ChatResponse = {
  data: ChatResult;
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
