import { createFileRoute, Link } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Filter,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ApiError } from "@/lib/api";
import {
  getAccounts,
  type AccountRecord,
  type CategoryRecord,
  type TransactionRecord,
} from "@/lib/accounts";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { formatIndianDate, formatIndianDateLong } from "@/lib/date";
import { notifyFinanceDataChanged } from "@/lib/financeEvents";
import {
  createTransaction,
  deleteTransaction,
  getCategories,
  getTransactions,
  updateTransaction,
  type TransactionFilters,
} from "@/lib/transactions";

export const Route = createFileRoute("/app/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Finance Manager" },
      { name: "description", content: "Your transactions." },
    ],
  }),
  component: Page,
});

type TransactionTypeFilter = "all" | "income" | "expense";
type TransactionPanelMode =
  | { kind: "create"; type: "income" | "expense" }
  | { kind: "edit"; transaction: TransactionRecord }
  | null;

type TransactionFormState = {
  type: "income" | "expense";
  account_id: string;
  category_id: string;
  amount: string;
  date: string;
  description: string;
};

const todayString = format(new Date(), "yyyy-MM-dd");

function Page() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransactionTypeFilter>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [panel, setPanel] = useState<TransactionPanelMode>(null);
  const [formState, setFormState] = useState<TransactionFormState>({
    type: "expense",
    account_id: "",
    category_id: "",
    amount: "",
    date: todayString,
    description: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteState, setDeleteState] = useState<{
    transactionId: number | null;
    error: string | null;
  }>({
    transactionId: null,
    error: null,
  });

  async function loadReferences() {
    setLoading(true);
    setError(null);

    try {
      const [userResult, accountsResult, categoriesResult] = await Promise.all([
        getCurrentUser(true),
        getAccounts(),
        getCategories(),
      ]);
      setUser(userResult);
      setAccounts(accountsResult.accounts);
      setCategories(categoriesResult.categories);
    } catch (loadError) {
      if (loadError instanceof ApiError) {
        setError(loadError.message);
      } else {
        setError("Unable to load transaction references right now.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions() {
    setTransactionsLoading(true);
    setDeleteState({ transactionId: null, error: null });

    try {
      const filters: TransactionFilters = {
        type: filter,
        account_id: accountFilter === "all" ? "" : Number(accountFilter),
        category_id: categoryFilter === "all" ? "" : Number(categoryFilter),
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      };
      const result = await getTransactions(filters);
      setTransactions(result.transactions);
    } catch (loadError) {
      if (loadError instanceof ApiError) {
        setError(loadError.message);
      } else {
        setError("Unable to load your transactions right now.");
      }
    } finally {
      setTransactionsLoading(false);
    }
  }

  useEffect(() => {
    void loadReferences();
  }, []);

  useEffect(() => {
    if (!loading) {
      void loadTransactions();
    }
  }, [loading, filter, accountFilter, categoryFilter, dateFrom, dateTo]);

  const availableCategories = useMemo(
    () => categories.filter((category) => category.type === formState.type),
    [categories, formState.type],
  );

  useEffect(() => {
    if (
      !availableCategories.some(
        (category) => String(category.category_id) === formState.category_id,
      )
    ) {
      setFormState((current) => ({
        ...current,
        category_id: availableCategories[0]
          ? String(availableCategories[0].category_id)
          : "",
      }));
    }
  }, [availableCategories, formState.category_id]);

  function openCreatePanel(type: "income" | "expense") {
    setFormError(null);
    setPanel({ kind: "create", type });
    const firstCategory = categories.find((category) => category.type === type);
    setFormState({
      type,
      account_id: accounts[0] ? String(accounts[0].account_id) : "",
      category_id: firstCategory ? String(firstCategory.category_id) : "",
      amount: "",
      date: todayString,
      description: "",
    });
  }

  function openEditPanel(transaction: TransactionRecord) {
    setFormError(null);
    setPanel({ kind: "edit", transaction });
    setFormState({
      type: transaction.type,
      account_id: String(transaction.account_id),
      category_id: String(transaction.category_id),
      amount: String(transaction.amount),
      date: transaction.date,
      description: transaction.description ?? "",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload = {
        account_id: Number(formState.account_id),
        category_id: Number(formState.category_id),
        amount: Number(formState.amount),
        type: formState.type,
        date: formState.date,
        description: formState.description.trim(),
      };

      if (panel?.kind === "edit") {
        await updateTransaction(panel.transaction.transaction_id, payload);
      } else {
        await createTransaction(payload);
      }

      setPanel(null);
      await Promise.all([loadTransactions(), loadReferences()]);
      notifyFinanceDataChanged();
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setFormError(submitError.message);
      } else {
        setFormError("Unable to save this transaction right now.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(transaction: TransactionRecord) {
    setDeleteState({ transactionId: transaction.transaction_id, error: null });

    try {
      await deleteTransaction(transaction.transaction_id);
      await Promise.all([loadTransactions(), loadReferences()]);
      notifyFinanceDataChanged();
      setDeleteState({ transactionId: null, error: null });
    } catch (deleteError) {
      if (deleteError instanceof ApiError) {
        setDeleteState({
          transactionId: transaction.transaction_id,
          error: deleteError.message,
        });
      } else {
        setDeleteState({
          transactionId: transaction.transaction_id,
          error: "Unable to delete this transaction right now.",
        });
      }
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 card-elevated">
        <h1 className="text-2xl">Loading transactions...</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We’re pulling accounts, categories, and your transaction history now.
        </p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="glass rounded-xl p-6 card-elevated space-y-4">
        <div>
          <h1 className="text-2xl">Transactions unavailable</h1>
          <p className="mt-2 text-sm text-[var(--rose)]">
            {error ?? "We could not load your transactions."}
          </p>
        </div>
        <Button
          onClick={() => {
            void loadReferences();
            void loadTransactions();
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Daily flow of income and expenses.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => openCreatePanel("income")}
            disabled={accounts.length === 0}
            className="gap-2"
          >
            <Plus className="h-4 w-4 text-[var(--positive)]" />
            Add Income
          </Button>
          <Button
            onClick={() => openCreatePanel("expense")}
            disabled={accounts.length === 0}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {accounts.length === 0 && (
        <div className="glass rounded-xl p-6 card-elevated">
          <h2 className="text-xl">Add an account before recording transactions</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Transactions need a real account target so the system can calculate
            balances correctly. Create a bank, cash, or wallet account first,
            then come back here.
          </p>
          <Link
            to="/app/accounts"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Open accounts
          </Link>
        </div>
      )}

      {deleteState.error && (
        <div className="rounded-xl border border-[color-mix(in_oklab,var(--rose)_35%,transparent)] bg-[color-mix(in_oklab,var(--rose)_10%,transparent)] px-4 py-3 text-sm text-[var(--rose)]">
          {deleteState.error}
        </div>
      )}

      <div className="glass rounded-xl p-4 card-elevated flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-4 w-4" /> Filters
        </div>
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            ["all", "All"],
            ["income", "Income"],
            ["expense", "Expense"],
          ]}
        />
        <InlineSelect
          value={accountFilter}
          onValueChange={setAccountFilter}
          placeholder="All accounts"
          options={[
            { value: "all", label: "All accounts" },
            ...accounts.map((account) => ({
              value: String(account.account_id),
              label: account.name,
            })),
          ]}
        />
        <InlineSelect
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          placeholder="All categories"
          options={[
            { value: "all", label: "All categories" },
            ...categories.map((category) => ({
              value: String(category.category_id),
              label: category.name,
            })),
          ]}
        />
        <CompactDatePicker
          label="From date"
          value={dateFrom}
          onChange={setDateFrom}
        />
        <CompactDatePicker
          label="To date"
          value={dateTo}
          onChange={setDateTo}
        />
      </div>

      <div className="glass rounded-xl card-elevated overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
          <div className="col-span-4">Description</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Account</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
        {transactionsLoading ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            Refreshing transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="px-5 py-6 text-sm text-muted-foreground">
            No transactions match the current filters.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {transactions.map((transaction) => (
              <li
                key={transaction.transaction_id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 px-5 py-3 text-sm hover:bg-secondary/30 transition"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <span
                    className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
                      transaction.type === "income"
                        ? "bg-[color-mix(in_oklab,var(--positive)_15%,transparent)] text-[var(--positive)]"
                        : "bg-[color-mix(in_oklab,var(--rose)_15%,transparent)] text-[var(--rose)]"
                    }`}
                  >
                    {transaction.type === "income" ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div>{transaction.description || transaction.category_name || "Transaction"}</div>
                    <div className="text-xs text-muted-foreground md:hidden">
                      {transaction.category_name} · {transaction.account_name} ·{" "}
                      {formatIndianDate(transaction.date)}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-muted-foreground hidden md:block">
                  {transaction.category_name}
                </div>
                <div className="col-span-2 text-muted-foreground hidden md:block">
                  {transaction.account_name}
                </div>
                <div className="col-span-2 text-muted-foreground hidden md:block">
                  {formatIndianDate(transaction.date)}
                </div>
                <div className="col-span-2 md:text-right font-medium flex items-center justify-between md:justify-end gap-3">
                  <span className={transaction.type === "income" ? "text-[var(--positive)]" : ""}>
                    {transaction.type === "income" ? "+" : "−"}
                    {formatCurrency(transaction.amount, user.currency)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditPanel(transaction)}
                      className="rounded-md p-1.5 hover:bg-secondary/60"
                      aria-label="Edit transaction"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => void handleDelete(transaction)}
                      className="rounded-md p-1.5 text-[var(--rose)] hover:bg-secondary/60"
                      disabled={deleteState.transactionId === transaction.transaction_id}
                      aria-label="Delete transaction"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <TransactionSheet
        open={panel !== null}
        mode={panel}
        formState={formState}
        setFormState={setFormState}
        categories={availableCategories}
        accounts={accounts}
        formError={formError}
        submitting={submitting}
        onClose={() => setPanel(null)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5 text-xs">
      {options.map(([optionValue, label]) => (
        <button
          key={optionValue}
          onClick={() => onChange(optionValue)}
          className={`px-3 py-1.5 rounded-md transition ${
            value === optionValue ? "bg-background text-foreground" : "text-muted-foreground"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function InlineSelect({
  value,
  onValueChange,
  placeholder,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px] bg-input/60 border-border">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CompactDatePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedDate = value ? parseISO(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 min-w-[150px] justify-between border-border bg-input/60 px-3 font-normal"
        >
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value ? formatIndianDate(value) : label}
          </span>
          <CalendarDays className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 glass-strong border-border/70" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "");
          }}
        />
        {value ? (
          <div className="border-t border-border/60 p-2">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-center"
              onClick={() => onChange("")}
            >
              Clear date
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function TransactionSheet({
  open,
  mode,
  formState,
  setFormState,
  categories,
  accounts,
  formError,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: Exclude<TransactionPanelMode, null> | null;
  formState: TransactionFormState;
  setFormState: React.Dispatch<React.SetStateAction<TransactionFormState>>;
  categories: CategoryRecord[];
  accounts: AccountRecord[];
  formError: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  if (!mode) {
    return null;
  }

  const title = mode.kind === "edit" ? "Edit transaction" : `Add ${mode.type}`;

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-w-[560px] p-0 glass-strong border-border/70 bg-[color-mix(in_oklab,var(--card)_92%,transparent)]"
      >
        <form onSubmit={(event) => void onSubmit(event)} className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/60 px-6 py-6 text-left">
            <SheetTitle className="text-3xl font-medium">{title}</SheetTitle>
            <SheetDescription>
              Record the amount, account, category, and date for this entry.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-5">
              <FormSelectField
                label="Type"
                value={formState.type}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    type: value as "income" | "expense",
                    category_id: "",
                  }))
                }
                options={[
                  { value: "income", label: "Income" },
                  { value: "expense", label: "Expense" },
                ]}
              />

              <FormInputField
                label="Amount"
                value={formState.amount}
                inputMode="decimal"
                placeholder="0.00"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    amount: event.target.value,
                  }))
                }
              />

              <FormDateField
                label="Date"
                value={formState.date}
                onChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    date: value,
                  }))
                }
              />

              <FormSelectField
                label="Account"
                value={formState.account_id}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    account_id: value,
                  }))
                }
                options={accounts.map((account) => ({
                  value: String(account.account_id),
                  label: account.name,
                }))}
              />

              <FormSelectField
                label="Category"
                value={formState.category_id}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    category_id: value,
                  }))
                }
                options={categories.map((category) => ({
                  value: String(category.category_id),
                  label: category.name,
                }))}
              />

              <FormInputField
                label="Description"
                value={formState.description}
                placeholder="Optional note"
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />

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
              {submitting
                ? "Saving..."
                : mode.kind === "edit"
                  ? "Save changes"
                  : "Save transaction"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function FormInputField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Input
        {...props}
        type="text"
        className="h-11 bg-input/60 border-border text-sm"
      />
    </div>
  );
}

function FormSelectField({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-11 bg-input/60 border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FormDateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedDate = value ? parseISO(value) : undefined;

  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full justify-between border-border bg-input/60 px-3 font-normal"
          >
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {value ? formatIndianDateLong(value) : "Select date"}
            </span>
            <CalendarDays className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 glass-strong border-border/70" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "");
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
