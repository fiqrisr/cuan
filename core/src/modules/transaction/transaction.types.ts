export type TransactionFilters = {
  userId: string;
  type?: 'expense' | 'income';
  category?: string;
  accountId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort?: 'date' | 'amount' | 'created_at';
  order?: 'asc' | 'desc';
};

export type PaginatedResult = {
  data: FormattedTransaction[];
  meta: { page: number; limit: number; total: number };
};

export type FormattedTransaction = {
  id: string;
  userId: string;
  accountId: string | null;
  type: string;
  amount: number;
  currency: string;
  categoryId: number;
  category: string | null;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type TransactionStatsFilters = {
  userId: string;
  accountId?: string;
  from?: string;
  to?: string;
};

export type TransactionStats = {
  summary: {
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    savingsRate: number;
  };
  categories: {
    id: number | null;
    label: string;
    amount: number;
    percentage: number;
  }[];
  daily: {
    date: string;
    income: number;
    expense: number;
  }[];
};
