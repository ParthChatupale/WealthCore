import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { addMonths, format, startOfMonth } from "date-fns";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";

import { Empty } from "@/components/Empty";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApiError } from "@/lib/api";
import type { CategoryRecord } from "@/lib/accounts";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { getCurrentBudget, saveMonthlyBudget, type BudgetPageData } from "@/lib/budgets";
import { formatCurrency } from "@/lib/currency";
import { notifyFinanceDataChanged } from "@/lib/financeEvents";

export const Route = createFileRoute("/app/budget")({
  head: () => ({
    meta: [
      { title: "Budget — Finance Manager" },
      { name: "description", content: "Plan and track your monthly budget." },
    ],
  }),
  component: Page,
});

function currentMonthKey() {
  return format(new Date(), "yyyy-MM");
}

function monthKeyToDate(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function shiftMonthKey(monthKey: string, offset: number) {
  return format(addMonths(monthKeyToDate(monthKey), offset), "yyyy-MM");
}

function Page() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [month, setMonth] = useState(currentMonthKey());
  const [budgetData, setBudgetData] = useState<BudgetPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [categoryLimits, setCategoryLimits] = useState<Record<number, string>>({});

  async function loadBudgetData(targetMonth = month) {
    setLoading(true);
    setError(null);

    try {
      const [userResult, result] = await Promise.all([
        getCurrentUser(true),
        getCurrentBudget(targetMonth),
      ]);
      setUser(userResult);
      setBudgetData(result);
    } catch (loadError) {
      if (loadError instanceof ApiError) {
        setError(loadError.message);
      } else {
        setError("Unable to load your budget right now.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBudgetData(month);
  }, [month]);

  useEffect(() => {
    if (!budgetData) {
      return;
    }

    const initialState: Record<number, string> = {};
    const budgetMap = new Map(
      budgetData.categories.map((item) => [item.category_id, item.limit_amount]),
    );

    budgetData.available_categories.forEach((category) => {
      initialState[category.category_id] = String(budgetMap.get(category.category_id) ?? 0);
    });

    setCategoryLimits(initialState);
  }, [budgetData]);

  const titleMonth = useMemo(() => {
    return format(monthKeyToDate(month), "LLLL yyyy");
  }, [month]);

  function openEditor() {
    setFormError(null);
    setEditing(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!budgetData) {
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        month,
        category_limits: budgetData.available_categories
          .map((category) => ({
            category_id: category.category_id,
            limit_amount: Number(categoryLimits[category.category_id] ?? 0),
          }))
          .filter((item) => item.limit_amount > 0),
      };

      const result = await saveMonthlyBudget(payload);
      setBudgetData(result);
      setEditing(false);
      notifyFinanceDataChanged();
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setFormError(submitError.message);
      } else {
        setFormError("Unable to save this budget right now.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClearBudget() {
    if (!budgetData?.has_budget) {
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const result = await saveMonthlyBudget({ month, category_limits: [] });
      setBudgetData(result);
      notifyFinanceDataChanged();
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setFormError(submitError.message);
      } else {
        setFormError("Unable to clear this budget right now.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 card-elevated">
        <h1 className="text-2xl">Loading budget...</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We’re calculating this month’s budget and actual spending now.
        </p>
      </div>
    );
  }

  if (!budgetData || !user || error) {
    return (
      <div className="glass rounded-xl p-6 card-elevated space-y-4">
        <div>
          <h1 className="text-2xl">Budget unavailable</h1>
          <p className="mt-2 text-sm text-[var(--rose)]">
            {error ?? "We could not load your budget."}
          </p>
        </div>
        <Button onClick={() => void loadBudgetData(month)}>Try again</Button>
      </div>
    );
  }

  if (!budgetData.has_budget) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl">Budget</h1>
            <p className="text-sm text-muted-foreground">
              Plan limits, then track them against real spending.
            </p>
          </div>
          <MonthPicker
            month={month}
            onChange={setMonth}
            className="self-start lg:self-auto"
          />
        </div>
        <div className="glass rounded-xl p-6 card-elevated">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/20 px-3 py-1 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-[var(--violet)]" />
                Monthly planning for {titleMonth}
              </div>
              <h2 className="mt-4 text-2xl">No budget set yet</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Your transactions are already live. The next step is setting category limits so
                the app can tell you where you are still within plan and where spending has gone
                past it.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <BudgetInfoCard
                label="Expense categories"
                value={String(budgetData.available_categories.length)}
                note="Ready for planning"
                icon={Target}
              />
              <BudgetInfoCard
                label="Budget state"
                value="Not set"
                note="Create your first monthly plan"
                icon={AlertTriangle}
              />
              <BudgetInfoCard
                label="Tracking"
                value="Live"
                note="Transactions will update budget usage automatically"
                icon={CheckCircle2}
              />
            </div>
          </div>
        </div>
        <Empty
          icon={Target}
          title={`No budget set for ${titleMonth}`}
          description="Budgets help you compare planned vs actual spending. Create one to start seeing category limits and overall progress."
          action={
            <Button onClick={openEditor}>
              Create Monthly Budget
            </Button>
          }
        />
        <BudgetEditor
          open={editing}
          month={month}
          currency={user.currency}
          categories={budgetData.available_categories}
          categoryLimits={categoryLimits}
          setCategoryLimits={setCategoryLimits}
          formError={formError}
          submitting={submitting}
          hasExistingBudget={false}
          onClose={() => setEditing(false)}
          onSubmit={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl">Budget · {titleMonth}</h1>
          <p className="text-sm text-muted-foreground">
            Monthly plan with live category-wise tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker month={month} onChange={setMonth} />
          <Button variant="outline" onClick={openEditor} className="gap-2">
            <Pencil className="h-4 w-4" /> Edit budget
          </Button>
        </div>
      </div>

      <div className="glass rounded-xl p-6 card-elevated">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/20 px-3 py-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-[var(--primary)]" />
              Budget window: {titleMonth}
            </div>
            <div className="mt-5 grid gap-6 md:grid-cols-4">
              <Stat label="Monthly budget" value={formatCurrency(budgetData.total_limit, user.currency)} />
              <Stat label="Total spent" value={formatCurrency(budgetData.total_spent, user.currency)} />
              <Stat
                label="Remaining"
                value={formatCurrency(budgetData.total_remaining, user.currency)}
                tone={budgetData.total_remaining < 0 ? "var(--rose)" : "var(--positive)"}
              />
              <Stat label="Used" value={`${budgetData.used_percentage}%`} />
            </div>
            <div className="mt-6 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, budgetData.used_percentage)}%`,
                  background: "linear-gradient(90deg, var(--primary), var(--violet))",
                }}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <BudgetInfoCard
              label="Tracked categories"
              value={String(budgetData.categories.length)}
              note="Expense categories with limits"
              icon={Target}
            />
            <BudgetInfoCard
              label="Over budget"
              value={String(budgetData.over_budget_categories.length)}
              note={
                budgetData.over_budget_categories.length > 0
                  ? "Needs attention now"
                  : "Everything is within plan"
              }
              icon={budgetData.over_budget_categories.length > 0 ? AlertTriangle : CheckCircle2}
            />
            <BudgetInfoCard
              label="Status"
              value={budgetData.total_remaining < 0 ? "Over" : "Healthy"}
              note={
                budgetData.total_remaining < 0
                  ? "Actual spending is above plan"
                  : "You still have budget headroom"
              }
              icon={Sparkles}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetData.categories.map((item) => {
          const usedPercentage =
            item.limit_amount > 0
              ? Math.min(100, Math.round((item.spent_amount / item.limit_amount) * 100))
              : 0;
          const over = item.over_budget_amount > 0;

          return (
            <div
              key={item.category_id}
              className={`glass rounded-xl p-5 card-elevated hover-lift ${
                over ? "border-[color-mix(in_oklab,var(--rose)_45%,var(--border))]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-[var(--primary)]">
                    <CategoryIcon iconName={item.icon_name} className="h-4 w-4" />
                  </span>
                  <span>{item.category_name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{usedPercentage}% used</span>
              </div>
              <div className="mt-3 text-2xl font-medium">
                {formatCurrency(item.spent_amount, user.currency)}
              </div>
              <div className="text-xs text-muted-foreground">
                of {formatCurrency(item.limit_amount, user.currency)} limit
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${usedPercentage}%`,
                    background: over ? "var(--rose)" : "var(--primary)",
                  }}
                />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Remaining {formatCurrency(item.remaining_amount, user.currency)}
              </div>
              {over ? (
                <div className="mt-2 text-xs text-[var(--rose)]">
                  Over by {formatCurrency(item.over_budget_amount, user.currency)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {budgetData.over_budget_categories.length > 0 ? (
        <div className="glass rounded-xl p-5 card-elevated">
          <h3 className="text-lg">Over-budget categories</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {budgetData.over_budget_categories.map((item) => (
              <li key={item.category_id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_10%,transparent)] text-[var(--primary)]">
                    <CategoryIcon iconName={item.icon_name} className="h-3.5 w-3.5" />
                  </span>
                  <span>{item.category_name}</span>
                </span>
                <span className="text-[var(--rose)]">
                  {formatCurrency(item.over_budget_amount, user.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={() => void handleClearBudget()}
          disabled={submitting}
          className="gap-2 text-[var(--rose)] hover:text-[var(--rose)]"
        >
          <Trash2 className="h-4 w-4" />
          Clear this month budget
        </Button>
      </div>

      <BudgetEditor
        open={editing}
        month={month}
        currency={user.currency}
        categories={budgetData.available_categories}
        categoryLimits={categoryLimits}
        setCategoryLimits={setCategoryLimits}
        formError={formError}
        submitting={submitting}
        hasExistingBudget
        onClose={() => setEditing(false)}
        onSubmit={handleSave}
      />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="mt-1.5 text-2xl font-medium" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
    </div>
  );
}

function BudgetInfoCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Target;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-1 text-xl font-medium">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{note}</div>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--primary)_12%,transparent)] text-[var(--primary)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function MonthPicker({
  month,
  onChange,
  className,
}: {
  month: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const monthDate = monthKeyToDate(month);

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0"
        onClick={() => onChange(shiftMonthKey(month, -1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 min-w-[210px] justify-start gap-2 bg-input/60 border-border"
          >
            <CalendarDays className="h-4 w-4 text-[var(--primary)]" />
            <span>{format(monthDate, "MMMM yyyy")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-auto p-0 border-border/70 bg-[color-mix(in_oklab,var(--card)_94%,transparent)]"
        >
          <div className="border-b border-border/60 px-4 py-3">
            <div className="text-sm font-medium">Select month</div>
            <div className="text-xs text-muted-foreground">
              Pick any date inside the month you want to open.
            </div>
          </div>
          <Calendar
            mode="single"
            month={monthDate}
            selected={monthDate}
            onSelect={(selected) => {
              if (!selected) {
                return;
              }
              onChange(format(startOfMonth(selected), "yyyy-MM"));
            }}
            className="rounded-b-xl"
          />
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0"
        onClick={() => onChange(shiftMonthKey(month, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function BudgetEditor({
  open,
  month,
  currency,
  categories,
  categoryLimits,
  setCategoryLimits,
  formError,
  submitting,
  hasExistingBudget,
  onClose,
  onSubmit,
}: {
  open: boolean;
  month: string;
  currency: string | null;
  categories: CategoryRecord[];
  categoryLimits: Record<number, string>;
  setCategoryLimits: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  formError: string | null;
  submitting: boolean;
  hasExistingBudget: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const plannedTotal = useMemo(
    () =>
      categories.reduce((sum, category) => {
        const value = Number(categoryLimits[category.category_id] ?? 0);
        return Number.isFinite(value) && value > 0 ? sum + value : sum;
      }, 0),
    [categories, categoryLimits],
  );

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-[560px] p-0 glass-strong border-border/70 bg-[color-mix(in_oklab,var(--card)_92%,transparent)]"
      >
        <form onSubmit={(event) => void onSubmit(event)} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/60 px-6 py-6 text-left">
            <SheetTitle className="text-3xl font-medium">
              {hasExistingBudget ? "Edit budget" : "Create budget"}
            </SheetTitle>
            <SheetDescription>
              Set category-wise monthly limits. The overall total is derived from their sum.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Month
                </Label>
                <Input
                  value={format(monthKeyToDate(month), "MMMM yyyy")}
                  readOnly
                  className="h-11 bg-input/60 border-border text-sm"
                />
              </div>

              <div className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Planned total
                </div>
                <div className="mt-1 text-2xl font-medium">
                  {formatCurrency(plannedTotal, currency)}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Sum of all positive category limits for this month
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Category limits
                </Label>
                {categories.map((category) => (
                  <div key={category.category_id} className="grid grid-cols-[1fr_140px] items-center gap-3">
                    <span className="text-sm">{category.name}</span>
                    <Input
                      value={categoryLimits[category.category_id] ?? "0"}
                      onChange={(event) =>
                        setCategoryLimits((current) => ({
                          ...current,
                          [category.category_id]: event.target.value,
                        }))
                      }
                      inputMode="decimal"
                      className="h-11 bg-input/60 border-border text-sm"
                    />
                  </div>
                ))}
              </div>

              {formError ? (
                <p className="text-sm text-[var(--rose)]">{formError}</p>
              ) : null}
            </div>
          </div>

          <SheetFooter className="border-t border-border/60 px-6 py-4 sm:justify-between sm:space-x-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save budget"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
