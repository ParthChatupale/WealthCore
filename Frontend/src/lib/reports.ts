import { apiRequest } from "@/lib/api";
import type { AccountRecord, BudgetSummary } from "@/lib/accounts";

export type ReportOverview = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  income_delta_pct: number;
  expense_delta_pct: number;
  savings_delta_pct: number;
  top_category: {
    category_id: number;
    category_name: string | null;
    icon_name: string | null;
    spent_amount: number;
  } | null;
  account_balances: AccountRecord[];
};

export type ReportTrendPoint = {
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

export type MonthlyTrendResponse = {
  month: string;
  months: number;
  trend: ReportTrendPoint[];
};

export type CategoryBreakdownRow = {
  category_id: number;
  category_name: string | null;
  icon_name: string | null;
  spent_amount: number;
  percentage_of_expenses: number;
  previous_month_spent: number;
  change_pct: number;
};

export type CategoryBreakdownResponse = {
  month: string;
  categories: CategoryBreakdownRow[];
};

export function getReportsOverview(month: string) {
  return apiRequest<ReportOverview>(`/api/reports/overview?month=${month}`);
}

export function getMonthlyTrend(month: string, months = 6) {
  return apiRequest<MonthlyTrendResponse>(`/api/reports/monthly-trend?month=${month}&months=${months}`);
}

export function getCategoryBreakdown(month: string) {
  return apiRequest<CategoryBreakdownResponse>(`/api/reports/category-breakdown?month=${month}`);
}

export function getBudgetVsActualReport(month: string) {
  return apiRequest<BudgetSummary>(`/api/reports/budget-vs-actual?month=${month}`);
}
