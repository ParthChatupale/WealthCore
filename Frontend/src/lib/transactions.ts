import { apiRequest } from "@/lib/api";
import type { CategoryRecord, TransactionRecord } from "@/lib/accounts";

export type TransactionFilters = {
  type?: "income" | "expense" | "all";
  account_id?: number | "";
  category_id?: number | "";
  date_from?: string;
  date_to?: string;
};

export type TransactionInput = {
  account_id: number;
  category_id: number;
  amount: number;
  type: "income" | "expense";
  date: string;
  description?: string;
  subcategory_id?: number | null;
};

function buildQueryString(filters: TransactionFilters = {}) {
  const params = new URLSearchParams();

  if (filters.type && filters.type !== "all") {
    params.set("type", filters.type);
  }
  if (filters.account_id !== undefined && filters.account_id !== "") {
    params.set("account_id", String(filters.account_id));
  }
  if (filters.category_id !== undefined && filters.category_id !== "") {
    params.set("category_id", String(filters.category_id));
  }
  if (filters.date_from) {
    params.set("date_from", filters.date_from);
  }
  if (filters.date_to) {
    params.set("date_to", filters.date_to);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function getCategories(type?: "income" | "expense") {
  const query = type ? `?type=${type}` : "";
  return apiRequest<{ categories: CategoryRecord[] }>(`/api/categories${query}`);
}

export function getTransactions(filters: TransactionFilters = {}) {
  return apiRequest<{ transactions: TransactionRecord[] }>(
    `/api/transactions${buildQueryString(filters)}`,
  );
}

export function createTransaction(input: TransactionInput) {
  return apiRequest<{ transaction: TransactionRecord }>("/api/transactions", {
    method: "POST",
    body: input,
  });
}

export function updateTransaction(transactionId: number, input: TransactionInput) {
  return apiRequest<{ transaction: TransactionRecord }>(`/api/transactions/${transactionId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteTransaction(transactionId: number) {
  return apiRequest<{ message: string }>(`/api/transactions/${transactionId}`, {
    method: "DELETE",
  });
}
