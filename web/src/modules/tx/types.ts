export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  description: string;
  amount: string; // pg numeric → string
  type: TransactionType;
  category: string | null;
  date: string;
  accountId: string | null;
  createdAt: string;
};

export type TransactionListResponse = {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
};
