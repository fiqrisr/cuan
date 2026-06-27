export type ExtractedTransaction = {
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  accountName?: string;
};

export type AddTransactionResponse = {
  intent: 'add_transaction';
  transactions: ExtractedTransaction[];
  reply: string;
};

export type QueryFilters = {
  period?: { from: string; to: string };
  category?: string;
  accountName?: string;
  type?: 'expense' | 'income';
  limit?: number;
};

export type QueryResponse = {
  intent: 'query';
  query: {
    queryType:
      | 'biggest_expense'
      | 'biggest_income'
      | 'total_spent'
      | 'total_income'
      | 'transaction_count'
      | 'recent_transactions'
      | 'category_breakdown';
    filters: QueryFilters;
  };
  reply: string;
};

export type ManageAccountResponse = {
  intent: 'manage_account';
  action: 'create_account' | 'set_default' | 'list_accounts';
  accountName?: string;
  accountType?: 'bank' | 'e-wallet' | 'cash' | 'other';
  currency?: string;
  initialBalance?: number;
  reply: string;
};

export type ChatResponse = AddTransactionResponse | QueryResponse | ManageAccountResponse;

export type OpenModelClientOptions = {
  apiKey: string;
  baseUrl: string;
  model: string;
  fetch?: FetchLike;
};

export type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
