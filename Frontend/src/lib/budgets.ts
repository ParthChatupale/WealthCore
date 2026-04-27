import { apiRequest } from "@/lib/api";
import type { BudgetSummary, CategoryRecord } from "@/lib/accounts";

export type BudgetPageData = BudgetSummary & {
  available_categories: CategoryRecord[];
};

export type BudgetInput = {
  month: string;
  category_limits: Array<{
    category_id: number;
    limit_amount: number;
  }>;
};

export function getCurrentBudget(month: string) {
  return apiRequest<BudgetPageData>(`/api/budgets/current?month=${month}`);
}

export function getBudgetSummary(month: string) {
  return apiRequest<BudgetSummary>(`/api/budgets/summary?month=${month}`);
}

export function saveMonthlyBudget(input: BudgetInput) {
  return apiRequest<BudgetPageData>("/api/budgets", {
    method: "POST",
    body: input,
  });
}

export function updateBudgetRow(budgetId: number, limitAmount: number) {
  return apiRequest<{ budget: BudgetSummary["categories"][number] }>(`/api/budgets/${budgetId}`, {
    method: "PATCH",
    body: { limit_amount: limitAmount },
  });
}

export function deleteBudgetRow(budgetId: number) {
  return apiRequest<{ message: string }>(`/api/budgets/${budgetId}`, {
    method: "DELETE",
  });
}
