export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  userId?: string;
  accountId: string | null;
  type: TransactionType;
  amount: number | string;
  currency?: string;
  categoryId?: number;
  category: string | null;
  description: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
};

export type TransactionListResponse = {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary?: {
      totalIncome: number;
      totalExpense: number;
      netCashflow: number;
    };
  };
};

export type DatePreset = 'all' | 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'custom';

export type TransactionFilterParams = {
  search?: string;
  type?: 'expense' | 'income';
  category?: string;
  categoryId?: number;
  accountId?: string;
  from?: string;
  to?: string;
  datePreset?: DatePreset;
  minAmount?: number;
  maxAmount?: number;
  sort?: 'date' | 'amount' | 'created_at';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

export type ActivitySummaryMetrics = {
  totalCount: number;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  isFiltered?: boolean;
};
