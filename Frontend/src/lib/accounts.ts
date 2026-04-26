import { apiRequest } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

export type AccountType = "Cash" | "Bank" | "Wallet";

export type AccountRecord = {
  account_id: number;
  name: string;
  type: AccountType;
  initial_balance: number;
  created_at: string;
};

export type DashboardData = {
  user: AuthUser;
  accounts: AccountRecord[];
  summary: {
    total_balance: number;
    account_count: number;
  };
  setup_status: {
    profile_complete: boolean;
    regional_complete: boolean;
    has_accounts: boolean;
  };
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
