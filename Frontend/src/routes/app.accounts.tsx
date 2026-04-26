import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Banknote, CreditCard, Pencil, Plus, Trash2, Wallet } from "lucide-react";

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
import { ApiError } from "@/lib/api";
import {
  createAccount,
  deleteAccount,
  getAccounts,
  type AccountInput,
  type AccountRecord,
  type AccountType,
  updateAccount,
} from "@/lib/accounts";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { notifyFinanceDataChanged, subscribeToFinanceDataChanged } from "@/lib/financeEvents";

export const Route = createFileRoute("/app/accounts")({
  head: () => ({
    meta: [
      { title: "Accounts — Finance Manager" },
      { name: "description", content: "Manage your accounts." },
    ],
  }),
  component: Page,
});

const iconMap = { Bank: Banknote, Cash: Wallet, Wallet: CreditCard } as const;
const tones = { Bank: "var(--primary)", Cash: "var(--amber)", Wallet: "var(--violet)" } as const;
const defaultFormState: AccountInput = { name: "", type: "Bank", initial_balance: 0 };

function Page() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<AccountInput>(defaultFormState);
  const [editingAccount, setEditingAccount] = useState<AccountRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteState, setDeleteState] = useState<{ accountId: number | null; error: string | null }>({
    accountId: null,
    error: null,
  });

  async function loadPage() {
    setLoading(true);
    setError(null);

    try {
      const [userResult, accountsResult] = await Promise.all([getCurrentUser(true), getAccounts()]);
      setUser(userResult);
      setAccounts(accountsResult.accounts);
    } catch (loadError) {
      if (loadError instanceof ApiError) {
        setError(loadError.message);
      } else {
        setError("Unable to load your accounts right now.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
    return subscribeToFinanceDataChanged(() => {
      void loadPage();
    });
  }, []);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.display_balance, 0),
    [accounts],
  );

  function openCreateDialog() {
    setEditingAccount(null);
    setFormState(defaultFormState);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(account: AccountRecord) {
    setEditingAccount(account);
    setFormState({
      name: account.name,
      type: account.type,
      initial_balance: account.initial_balance,
    });
    setFormError(null);
    setDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const payload: AccountInput = {
        name: formState.name.trim(),
        type: formState.type,
        initial_balance: Number(formState.initial_balance),
      };

      if (editingAccount) {
        const result = await updateAccount(editingAccount.account_id, payload);
        setAccounts((current) =>
          current.map((account) =>
            account.account_id === editingAccount.account_id ? result.account : account,
          ),
        );
      } else {
        const result = await createAccount(payload);
        setAccounts((current) => [...current, result.account]);
      }

      setDialogOpen(false);
      setEditingAccount(null);
      setFormState(defaultFormState);
      notifyFinanceDataChanged();
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setFormError(submitError.message);
      } else {
        setFormError("Unable to save this account right now.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(account: AccountRecord) {
    setDeleteState({ accountId: account.account_id, error: null });

    try {
      await deleteAccount(account.account_id);
      setAccounts((current) => current.filter((item) => item.account_id !== account.account_id));
      notifyFinanceDataChanged();
    } catch (deleteError) {
      if (deleteError instanceof ApiError) {
        setDeleteState({ accountId: account.account_id, error: deleteError.message });
      } else {
        setDeleteState({
          accountId: account.account_id,
          error: "Unable to delete this account right now.",
        });
      }
      return;
    }

    setDeleteState({ accountId: null, error: null });
  }

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 card-elevated">
        <h1 className="text-2xl">Loading accounts...</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We’re pulling your live account list from the backend now.
        </p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="glass rounded-xl p-6 card-elevated space-y-4">
        <div>
          <h1 className="text-2xl">Accounts unavailable</h1>
          <p className="mt-2 text-sm text-[var(--rose)]">
            {error ?? "We could not load your accounts."}
          </p>
        </div>
        <Button onClick={() => void loadPage()}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl">Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Cash, bank, and wallet balances backed by your real database records.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          Add account
        </Button>
      </div>

      {deleteState.error && (
        <div className="rounded-xl border border-[color-mix(in_oklab,var(--rose)_35%,transparent)] bg-[color-mix(in_oklab,var(--rose)_10%,transparent)] px-4 py-3 text-sm text-[var(--rose)]">
          {deleteState.error}
        </div>
      )}

      {accounts.length === 0 ? (
        <div className="glass rounded-xl p-6 card-elevated">
          <h2 className="text-xl">No accounts yet</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Add the first place where your money lives so we can anchor future transactions,
            budgets, and reports to something real.
          </p>
          <Button onClick={openCreateDialog} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Create first account
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const Icon = iconMap[account.type];
              const tone = tones[account.type];

              return (
                <div key={account.account_id} className="glass rounded-xl p-5 card-elevated hover-lift">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="h-10 w-10 rounded-lg grid place-items-center"
                      style={{
                        background: `color-mix(in oklab, ${tone} 18%, transparent)`,
                        color: tone,
                      }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      {account.type}
                    </span>
                  </div>
                  <div className="mt-4 text-lg">{account.name}</div>
                  <div className="mt-1 text-2xl font-medium">
                    {formatCurrency(account.display_balance, user.currency)}
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    Opening balance {formatCurrency(account.initial_balance, user.currency)} · Created{" "}
                    {new Date(account.created_at).toLocaleDateString()}
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => openEditDialog(account)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-[var(--rose)] hover:text-[var(--rose)]"
                      disabled={deleteState.accountId === account.account_id}
                      onClick={() => void handleDelete(account)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleteState.accountId === account.account_id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="glass rounded-xl p-5 card-elevated">
            <h3 className="text-lg mb-4">Account-wise summary</h3>
            <div className="space-y-3">
              {accounts.map((account) => {
                const pct = totalBalance > 0 ? Math.round((account.display_balance / totalBalance) * 100) : 0;
                return (
                  <div key={account.account_id}>
                    <div className="flex justify-between text-sm gap-3">
                      <span>{account.name}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(account.display_balance, user.currency)} · {pct}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: tones[account.type] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong border-border/70">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Edit account" : "Create account"}</DialogTitle>
            <DialogDescription>
              Add the opening balance you want this account to start with in the system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Account name
              </span>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, name: event.target.value }))
                }
                className="mt-1.5"
                placeholder="HDFC Savings"
              />
            </label>

            <label className="block">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Account type
              </span>
              <select
                value={formState.type}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    type: event.target.value as AccountType,
                  }))
                }
                className="mt-1.5 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Bank" className="bg-card">
                  Bank
                </option>
                <option value="Cash" className="bg-card">
                  Cash
                </option>
                <option value="Wallet" className="bg-card">
                  Wallet
                </option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Initial balance
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formState.initial_balance}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    initial_balance: Number(event.target.value),
                  }))
                }
                className="mt-1.5"
                placeholder="0.00"
              />
            </label>

            {formError && <p className="text-sm text-[var(--rose)]">{formError}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingAccount(null);
                  setFormError(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? editingAccount
                    ? "Saving..."
                    : "Creating..."
                  : editingAccount
                    ? "Save changes"
                    : "Create account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
