import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Globe2,
  PiggyBank,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { StatCard } from "@/components/StatCard";
import { ApiError } from "@/lib/api";
import { getDashboard, type DashboardData } from "@/lib/accounts";
import { formatCurrency } from "@/lib/currency";
import { formatIndianDate } from "@/lib/date";
import { subscribeToFinanceDataChanged } from "@/lib/financeEvents";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Finance Manager" },
      { name: "description", content: "Your financial dashboard." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);

    try {
      const result = await getDashboard();
      setDashboard(result);
    } catch (loadError) {
      if (loadError instanceof ApiError) {
        setError(loadError.message);
      } else {
        setError("Unable to load your dashboard right now.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    return subscribeToFinanceDataChanged(() => {
      void loadDashboard();
    });
  }, []);

  const checklist = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      {
        key: "profile",
        label: "Profile created",
        done: dashboard.setup_status.profile_complete,
        note: "Your account is registered and ready.",
      },
      {
        key: "region",
        label: "Regional settings configured",
        done: dashboard.setup_status.regional_complete,
        note:
          dashboard.user.country && dashboard.user.currency
            ? `${dashboard.user.country} · ${dashboard.user.currency}`
            : "Country and currency are still missing.",
      },
      {
        key: "accounts",
        label: "First account added",
        done: dashboard.setup_status.has_accounts,
        note: dashboard.setup_status.has_accounts
          ? `${dashboard.summary.account_count} account${dashboard.summary.account_count === 1 ? "" : "s"} available`
          : "Add your first cash, bank, or wallet account.",
      },
    ];
  }, [dashboard]);

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 card-elevated">
        <h1 className="text-2xl">Loading dashboard...</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We’re pulling your accounts and transaction summaries now.
        </p>
      </div>
    );
  }

  if (!dashboard || error) {
    return (
      <div className="glass rounded-xl p-6 card-elevated space-y-4">
        <div>
          <h1 className="text-2xl">Dashboard unavailable</h1>
          <p className="mt-2 text-sm text-[var(--rose)]">
            {error ?? "We could not load your dashboard."}
          </p>
        </div>
        <button
          onClick={() => void loadDashboard()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  const completedSteps = checklist.filter((item) => item.done).length;
  const progressText = `${completedSteps}/${checklist.length} complete`;
  const hasTransactions = dashboard.recent_transactions.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl md:text-4xl">{dashboard.user.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your balances now move with real transactions, not just setup data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickAction to="/app/transactions" icon={ArrowUpRight} label="Add Income" tone="var(--positive)" />
          <QuickAction to="/app/transactions" icon={ArrowDownRight} label="Add Expense" tone="var(--rose)" />
          <Link
            to="/app/accounts"
            className="px-3 py-2 rounded-lg glass text-sm flex items-center gap-2 hover:border-primary/40 transition"
          >
            <Plus className="h-4 w-4 text-[var(--primary)]" />
            <span>{dashboard.setup_status.has_accounts ? "Manage accounts" : "Add your first account"}</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Balance"
          value={formatCurrency(dashboard.summary.total_balance, dashboard.user.currency)}
          sub="Initial balances plus transaction history"
          icon={Wallet}
          accent="var(--primary)"
        />
        <StatCard
          label="This Month Income"
          value={formatCurrency(dashboard.summary.current_month_income, dashboard.user.currency)}
          sub="Income recorded this month"
          icon={TrendingUp}
          accent="var(--positive)"
        />
        <StatCard
          label="This Month Expenses"
          value={formatCurrency(dashboard.summary.current_month_expenses, dashboard.user.currency)}
          sub="Expenses recorded this month"
          icon={TrendingDown}
          accent="var(--rose)"
        />
        <StatCard
          label="Savings"
          value={formatCurrency(dashboard.summary.current_month_savings, dashboard.user.currency)}
          sub="Current month income minus expenses"
          icon={PiggyBank}
          accent="var(--cyan)"
        />
        <StatCard
          label="Setup Progress"
          value={progressText}
          sub="Profile, region, and first account"
          icon={Sparkles}
          accent="var(--violet)"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-xl p-5 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg">Recent transactions</h3>
              <p className="text-xs text-muted-foreground">
                Live from your daily income and expense flow
              </p>
            </div>
            <Link to="/app/transactions" className="text-xs text-muted-foreground hover:text-foreground">
              Open transactions <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>

          {!hasTransactions ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-secondary/20 p-6">
              <h4 className="text-lg">No transactions yet</h4>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                Your accounts are ready. The next step is recording income and expenses so the
                system can start showing real spending patterns.
              </p>
              <Link
                to="/app/transactions"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Add first transaction
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {dashboard.recent_transactions.map((transaction) => (
                <li
                  key={transaction.transaction_id}
                  className="py-2.5 flex items-center justify-between gap-4 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
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
                      <div className="truncate">
                        {transaction.description || transaction.category_name || "Transaction"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.category_name} · {transaction.account_name} · {formatIndianDate(transaction.date)}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-medium ${
                      transaction.type === "income" ? "text-[var(--positive)]" : "text-foreground"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "−"}
                    {formatCurrency(transaction.amount, dashboard.user.currency)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass rounded-xl p-5 card-elevated">
          <h3 className="text-lg">First-time setup</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The checklist stays visible, but now it sits beside the live finance data instead of
            replacing it.
          </p>
          <ul className="mt-5 space-y-3">
            {checklist.map((item) => (
              <li
                key={item.key}
                className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 flex items-start gap-3"
              >
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-[var(--positive)] shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{item.note}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg">Account balances</h3>
              <p className="text-xs text-muted-foreground">Calculated from opening balance and history</p>
            </div>
            <Link to="/app/accounts" className="text-xs text-muted-foreground hover:text-foreground">
              Manage accounts
            </Link>
          </div>
          <ul className="space-y-3">
            {dashboard.accounts.map((account) => (
              <li
                key={account.account_id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 text-sm"
              >
                <div>
                  <div>{account.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {account.type} · Opening {formatCurrency(account.initial_balance, dashboard.user.currency)}
                  </div>
                </div>
                <div className="font-medium">
                  {formatCurrency(account.display_balance, dashboard.user.currency)}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-xl p-5 card-elevated">
          <h3 className="text-lg">Region</h3>
          <div className="mt-4 rounded-xl border border-border/60 bg-secondary/20 px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="h-9 w-9 rounded-lg grid place-items-center bg-[color-mix(in_oklab,var(--cyan)_18%,transparent)] text-[var(--cyan)]">
                <Globe2 className="h-4 w-4" />
              </span>
              <div>
                <div className="font-medium">{dashboard.user.country ?? "Not set"}</div>
                <div className="text-sm text-muted-foreground">
                  {dashboard.user.currency ?? "Currency missing"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  tone,
}: {
  to: "/app/transactions";
  icon: typeof ArrowUpRight;
  label: string;
  tone: string;
}) {
  return (
    <Link
      to={to}
      className="px-3 py-2 rounded-lg glass text-sm flex items-center gap-2 hover:border-primary/40 transition"
      style={{ color: tone }}
    >
      <Icon className="h-4 w-4" />
      <span className="text-foreground">{label}</span>
    </Link>
  );
}
