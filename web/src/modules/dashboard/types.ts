export type DashboardStats = {
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

export type DashboardStatsResponse = {
  data: DashboardStats;
};
