import { apiRequest } from "@/lib/api";
import type { CategoryRecord, SubcategoryRecord } from "@/lib/accounts";

export type CategoryListResponse = {
  categories: CategoryRecord[];
  available_icons: string[];
};

export type CategoryInput = {
  name: string;
  type: "income" | "expense";
  icon_name: string;
};

export type CategoryUpdateInput = {
  name: string;
  icon_name: string;
};

export type SubcategoryInput = {
  name: string;
};

export function getCategories(type?: "income" | "expense") {
  const query = type ? `?type=${type}` : "";
  return apiRequest<CategoryListResponse>(`/api/categories${query}`);
}

export function createCategory(input: CategoryInput) {
  return apiRequest<{ category: CategoryRecord }>("/api/categories", {
    method: "POST",
    body: input,
  });
}

export function updateCategory(categoryId: number, input: CategoryUpdateInput) {
  return apiRequest<{ category: CategoryRecord }>(`/api/categories/${categoryId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteCategory(categoryId: number) {
  return apiRequest<{ message: string }>(`/api/categories/${categoryId}`, {
    method: "DELETE",
  });
}

export function createSubcategory(categoryId: number, input: SubcategoryInput) {
  return apiRequest<{ subcategory: SubcategoryRecord }>(`/api/categories/${categoryId}/subcategories`, {
    method: "POST",
    body: input,
  });
}

export function updateSubcategory(subcategoryId: number, input: SubcategoryInput) {
  return apiRequest<{ subcategory: SubcategoryRecord }>(`/api/subcategories/${subcategoryId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteSubcategory(subcategoryId: number) {
  return apiRequest<{ message: string }>(`/api/subcategories/${subcategoryId}`, {
    method: "DELETE",
  });
}
