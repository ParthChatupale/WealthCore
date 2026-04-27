import { apiRequest } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

export type AccountType = "Cash" | "Bank" | "Wallet";

export type AccountRecord = {
  account_id: number;
  name: string;
  type: AccountType;
  initial_balance: number;
  display_balance: number;
  created_at: string;
};

export type TransactionRecord = {
  transaction_id: number;
  user_id: number;
  account_id: number;
  account_name: string | null;
  category_id: number;
  category_name: string | null;
  category_icon_name: string | null;
  subcategory_id: number | null;
  subcategory_name: string | null;
  amount: number;
  type: "income" | "expense";
  date: string;
  description: string | null;
  created_at: string;
};

export type SubcategoryRecord = {
  subcategory_id: number;
  category_id: number;
  name: string;
};

export type CategoryRecord = {
  category_id: number;
  name: string;
  type: "income" | "expense";
  is_default: boolean;
  icon_name: string | null;
  subcategories: SubcategoryRecord[];
};

export type BudgetCategorySummary = {
  budget_id: number;
  category_id: number;
  category_name: string | null;
  icon_name: string | null;
  limit_amount: number;
  spent_amount: number;
  remaining_amount: number;
  over_budget_amount: number;
};

export type BudgetSummary = {
  month: string;
  has_budget: boolean;
  total_limit: number;
  total_spent: number;
  total_remaining: number;
  used_percentage: number;
  over_budget_categories: Array<{
    category_id: number;
    category_name: string | null;
    icon_name: string | null;
    over_budget_amount: number;
  }>;
  categories: BudgetCategorySummary[];
};

export type DashboardData = {
  user: AuthUser;
  accounts: AccountRecord[];
  summary: {
    total_balance: number;
    account_count: number;
    current_month_income: number;
    current_month_expenses: number;
    current_month_savings: number;
  };
  setup_status: {
    profile_complete: boolean;
    regional_complete: boolean;
    has_accounts: boolean;
  };
  recent_transactions: TransactionRecord[];
  budget: BudgetSummary;
};

export type AccountInput = {
  name: string;
  type: AccountType;
  initial_balance: number;
};

type AccountsResponse = {
  accounts: AccountRecord[];
};

type AccountResponse = {
  account: AccountRecord;
};

export function getAccounts() {
  return apiRequest<AccountsResponse>("/api/accounts");
}

export function createAccount(input: AccountInput) {
  return apiRequest<AccountResponse>("/api/accounts", {
    method: "POST",
    body: input,
  });
}

export function updateAccount(accountId: number, input: AccountInput) {
  return apiRequest<AccountResponse>(`/api/accounts/${accountId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteAccount(accountId: number) {
  return apiRequest<{ message: string }>(`/api/accounts/${accountId}`, {
    method: "DELETE",
  });
}

export function getDashboard() {
  return apiRequest<DashboardData>("/api/dashboard");
}
