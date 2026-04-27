import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Shapes,
  Trash2,
} from "lucide-react";

import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api";
import type { CategoryRecord, SubcategoryRecord } from "@/lib/accounts";
import { iconLabelFromName } from "@/lib/category-icons";
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  getCategories,
  updateCategory,
  updateSubcategory,
  type CategoryInput,
} from "@/lib/categories";
import { notifyFinanceDataChanged } from "@/lib/financeEvents";

export const Route = createFileRoute("/app/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Finance Manager" },
      { name: "description", content: "Manage transaction categories and subcategories." },
    ],
  }),
  loader: () => getCategories(),
  component: Page,
});

type CategoryType = "expense" | "income";
type CategoryDialogMode =
  | { kind: "create"; type: CategoryType }
  | { kind: "edit"; category: CategoryRecord }
  | null;
type SubcategoryDialogMode =
  | { kind: "create"; category: CategoryRecord }
  | { kind: "edit"; category: CategoryRecord; subcategory: SubcategoryRecord }
  | null;

const defaultCategoryForm = {
  name: "",
  type: "expense" as CategoryType,
  icon_name: "CircleHelp",
};

function Page() {
  const initial = Route.useLoaderData();
  const [categories, setCategories] = useState<CategoryRecord[]>(initial.categories);
  const [availableIcons] = useState<string[]>(initial.available_icons);
  const [tab, setTab] = useState<CategoryType>("expense");
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [categoryDialog, setCategoryDialog] = useState<CategoryDialogMode>(null);
  const [subcategoryDialog, setSubcategoryDialog] = useState<SubcategoryDialogMode>(null);
  const [categoryForm, setCategoryForm] = useState(defaultCategoryForm);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteState, setDeleteState] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === tab),
    [categories, tab],
  );

  function updateCategoryInState(updated: CategoryRecord) {
    setCategories((current) =>
      current
        .map((category) => (category.category_id === updated.category_id ? updated : category))
        .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type))),
    );
  }

  function openCreateCategory(type: CategoryType) {
    setCategoryDialog({ kind: "create", type });
    setCategoryForm({ ...defaultCategoryForm, type });
    setFormError(null);
  }

  function openEditCategory(category: CategoryRecord) {
    setCategoryDialog({ kind: "edit", category });
    setCategoryForm({
      name: category.name,
      type: category.type,
      icon_name: category.icon_name ?? "CircleHelp",
    });
    setFormError(null);
  }

  function openCreateSubcategory(category: CategoryRecord) {
    setSubcategoryDialog({ kind: "create", category });
    setSubcategoryName("");
    setFormError(null);
  }

  function openEditSubcategory(category: CategoryRecord, subcategory: SubcategoryRecord) {
    setSubcategoryDialog({ kind: "edit", category, subcategory });
    setSubcategoryName(subcategory.name);
    setFormError(null);
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      const payload: CategoryInput = {
        name: categoryForm.name.trim(),
        type: categoryForm.type,
        icon_name: categoryForm.icon_name,
      };
      if (categoryDialog?.kind === "edit") {
        const result = await updateCategory(categoryDialog.category.category_id, {
          name: payload.name,
          icon_name: payload.icon_name,
        });
        updateCategoryInState(result.category);
      } else {
        const result = await createCategory(payload);
        setCategories((current) =>
          [...current, result.category].sort((a, b) =>
            a.type === b.type ? a.name.localeCompare(b.name) : a.type.localeCompare(b.type),
          ),
        );
      }
      setCategoryDialog(null);
      notifyFinanceDataChanged();
    } catch (submitError) {
      setFormError(submitError instanceof ApiError ? submitError.message : "Unable to save this category right now.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubcategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subcategoryDialog) {
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const categoryId = subcategoryDialog.category.category_id;
      if (subcategoryDialog.kind === "edit") {
        const result = await updateSubcategory(subcategoryDialog.subcategory.subcategory_id, {
          name: subcategoryName.trim(),
        });
        setCategories((current) =>
          current.map((category) =>
            category.category_id !== categoryId
              ? category
              : {
                  ...category,
                  subcategories: category.subcategories
                    .map((subcategory) =>
                      subcategory.subcategory_id === result.subcategory.subcategory_id
                        ? result.subcategory
                        : subcategory,
                    )
                    .sort((a, b) => a.name.localeCompare(b.name)),
                },
          ),
        );
      } else {
        const result = await createSubcategory(categoryId, {
          name: subcategoryName.trim(),
        });
        setCategories((current) =>
          current.map((category) =>
            category.category_id !== categoryId
              ? category
              : {
                  ...category,
                  subcategories: [...category.subcategories, result.subcategory].sort((a, b) =>
                    a.name.localeCompare(b.name),
                  ),
                },
          ),
        );
      }
      setExpanded((current) => ({ ...current, [categoryId]: true }));
      setSubcategoryDialog(null);
      notifyFinanceDataChanged();
    } catch (submitError) {
      setFormError(
        submitError instanceof ApiError
          ? submitError.message
          : "Unable to save this subcategory right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCategory(category: CategoryRecord) {
    setDeleteState(null);
    try {
      await deleteCategory(category.category_id);
      setCategories((current) => current.filter((item) => item.category_id !== category.category_id));
      notifyFinanceDataChanged();
    } catch (deleteError) {
      setDeleteState(deleteError instanceof ApiError ? deleteError.message : "Unable to delete this category right now.");
    }
  }

  async function handleDeleteSubcategory(category: CategoryRecord, subcategory: SubcategoryRecord) {
    setDeleteState(null);
    try {
      await deleteSubcategory(subcategory.subcategory_id);
      setCategories((current) =>
        current.map((item) =>
          item.category_id !== category.category_id
            ? item
            : {
                ...item,
                subcategories: item.subcategories.filter(
                  (currentSubcategory) => currentSubcategory.subcategory_id !== subcategory.subcategory_id,
                ),
              },
        ),
      );
      notifyFinanceDataChanged();
    } catch (deleteError) {
      setDeleteState(
        deleteError instanceof ApiError
          ? deleteError.message
          : "Unable to delete this subcategory right now.",
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage the taxonomy behind transactions, budgets, and reports.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "expense" ? "default" : "outline"} onClick={() => setTab("expense")}>
            Expense
          </Button>
          <Button variant={tab === "income" ? "default" : "outline"} onClick={() => setTab("income")}>
            Income
          </Button>
          <Button onClick={() => openCreateCategory(tab)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        </div>
      </div>

      {deleteState ? (
        <div className="rounded-xl border border-[color-mix(in_oklab,var(--rose)_35%,transparent)] bg-[color-mix(in_oklab,var(--rose)_10%,transparent)] px-4 py-3 text-sm text-[var(--rose)]">
          {deleteState}
        </div>
      ) : null}

      {filteredCategories.length === 0 ? (
        <div className="glass rounded-xl p-6 card-elevated">
          <h2 className="text-xl">No {tab} categories yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create the first {tab} category to start organizing your financial activity.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCategories.map((category) => {
            const open = expanded[category.category_id] ?? false;
            return (
              <div key={category.category_id} className="glass rounded-xl p-5 card-elevated">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]">
                      <CategoryIcon iconName={category.icon_name} className="h-5 w-5" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg">{category.name}</h3>
                        <span className="rounded-full border border-border/60 bg-secondary/30 px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                          {category.is_default ? "Default" : "Custom"}
                        </span>
                        <span className="rounded-full border border-border/60 bg-secondary/30 px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                          {category.subcategories.length} subcategories
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {iconLabelFromName(category.icon_name ?? "CircleHelp")} icon · {category.type}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditCategory(category)}>
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => openCreateSubcategory(category)}>
                      <Plus className="h-4 w-4" />
                      Add subcategory
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-[var(--rose)]"
                      onClick={() => void handleDeleteCategory(category)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border/60 bg-secondary/20">
                  <button
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
                    onClick={() => setExpanded((current) => ({ ...current, [category.category_id]: !open }))}
                  >
                    <span>Subcategories</span>
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {open ? (
                    <div className="border-t border-border/60 px-4 py-3">
                      {category.subcategories.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No subcategories yet.</div>
                      ) : (
                        <ul className="space-y-2">
                          {category.subcategories.map((subcategory) => (
                            <li
                              key={subcategory.subcategory_id}
                              className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
                            >
                              <span>{subcategory.name}</span>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2"
                                  onClick={() => openEditSubcategory(category, subcategory)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-[var(--rose)]"
                                  onClick={() => void handleDeleteSubcategory(category, subcategory)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={categoryDialog !== null} onOpenChange={(open) => !open && setCategoryDialog(null)}>
        <DialogContent className="glass-strong border-border/70 bg-[color-mix(in_oklab,var(--card)_94%,transparent)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{categoryDialog?.kind === "edit" ? "Edit category" : "Create category"}</DialogTitle>
            <DialogDescription>
              Categories drive transactions, budgets, and reports. Choose an icon that keeps them easy to scan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void handleCategorySubmit(event)} className="space-y-5">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={categoryForm.type}
                onValueChange={(value) =>
                  setCategoryForm((current) => ({ ...current, type: value as CategoryType }))
                }
                disabled={categoryDialog?.kind === "edit"}
              >
                <SelectTrigger className="bg-input/60 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableIcons.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setCategoryForm((current) => ({ ...current, icon_name: iconName }))}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      categoryForm.icon_name === iconName
                        ? "border-primary bg-[color-mix(in_oklab,var(--primary)_14%,transparent)]"
                        : "border-border/60 bg-secondary/20 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CategoryIcon iconName={iconName} className="h-4 w-4 text-[var(--primary)]" />
                      <span className="text-xs">{iconLabelFromName(iconName)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            {formError ? <p className="text-sm text-[var(--rose)]">{formError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCategoryDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={subcategoryDialog !== null} onOpenChange={(open) => !open && setSubcategoryDialog(null)}>
        <DialogContent className="glass-strong border-border/70 bg-[color-mix(in_oklab,var(--card)_94%,transparent)]">
          <DialogHeader>
            <DialogTitle>
              {subcategoryDialog?.kind === "edit" ? "Edit subcategory" : "Create subcategory"}
            </DialogTitle>
            <DialogDescription>
              Keep detailed labels under a main category so transactions stay organized without exploding the top-level list.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void handleSubcategorySubmit(event)} className="space-y-5">
            <div className="space-y-2">
              <Label>Subcategory name</Label>
              <Input
                value={subcategoryName}
                onChange={(event) => setSubcategoryName(event.target.value)}
              />
            </div>
            {formError ? <p className="text-sm text-[var(--rose)]">{formError}</p> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubcategoryDialog(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save subcategory"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
