export type FinancialAccount = {
  id: string;
  name: string;
  balance: number;
  isDefault: boolean;
  currency: string;
  createdAt: string;
  updatedAt: string;
};

export type FinancialAccountListResponse = {
  data: FinancialAccount[];
};
