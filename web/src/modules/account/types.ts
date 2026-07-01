export type FinancialAccount = {
  id: string;
  name: string;
  balance: string; // pg numeric returns string
  isDefault: boolean;
  currency: string;
  createdAt: string;
};

export type FinancialAccountListResponse = {
  data: FinancialAccount[];
};
