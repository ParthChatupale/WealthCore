import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Globe2,
  PiggyBank,
  Plus,
  Sparkles,
  Wallet,
} from "lucide-react";

import { StatCard } from "@/components/StatCard";
import { ApiError } from "@/lib/api";
import { getDashboard, type DashboardData } from "@/lib/accounts";
import { formatCurrency, formatCurrencyCode } from "@/lib/currency";

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
        note: dashboard.user.country && dashboard.user.currency
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
          We’re pulling your accounts and setup status now.
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl md:text-4xl">{dashboard.user.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account foundation is live. Next we’ll start feeding transactions into it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/app/accounts"
            className="px-3 py-2 rounded-lg glass text-sm flex items-center gap-2 hover:border-primary/40 transition"
          >
            <Plus className="h-4 w-4 text-[var(--primary)]" />
            <span>{dashboard.setup_status.has_accounts ? "Manage accounts" : "Add your first account"}</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={formatCurrency(dashboard.summary.total_balance, dashboard.user.currency)}
          sub="Current displayed balance comes from account opening amounts"
          icon={Wallet}
          accent="var(--primary)"
        />
        <StatCard
          label="Accounts"
          value={String(dashboard.summary.account_count)}
          sub={dashboard.summary.account_count === 1 ? "1 money source connected" : "Money sources connected"}
          icon={PiggyBank}
          accent="var(--amber)"
        />
        <StatCard
          label="Region"
          value={dashboard.user.country ?? "Not set"}
          sub={dashboard.user.currency ?? "Currency missing"}
          icon={Globe2}
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
              <h3 className="text-lg">Account balances</h3>
              <p className="text-xs text-muted-foreground">
                Live from your backend account records
              </p>
            </div>
            <Link to="/app/accounts" className="text-xs text-muted-foreground hover:text-foreground">
              Open accounts <ArrowRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>

          {dashboard.accounts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/70 bg-secondary/20 p-6">
              <h4 className="text-lg">No accounts yet</h4>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl">
                Start with the place where your money currently lives: a bank account, wallet,
                or cash balance. That gives the rest of the finance flow somewhere real to anchor.
              </p>
              <Link
                to="/app/accounts"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                Create first account
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboard.accounts.map((account) => (
                <div
                  key={account.account_id}
                  className="rounded-xl border border-border/60 bg-secondary/20 px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {account.type} · Opening balance tracked in {formatCurrencyCode(dashboard.user.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(account.initial_balance, dashboard.user.currency)}
                    </div>
                    <div className="text-xs text-muted-foreground">Since setup</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-5 card-elevated">
          <h3 className="text-lg">First-time setup</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            We’re keeping the first steps light so the app never feels empty.
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
          <h3 className="text-lg">What unlocks next</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Once accounts are in place, we can start recording daily income and expenses against
            them. That’s the step that will bring budgets, trends, and reports to life.
          </p>
        </div>

        <div className="glass rounded-xl p-5 card-elevated">
          <h3 className="text-lg">Phase 3 focus</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            This dashboard is intentionally live only for setup and account data right now. We’re
            keeping budgets, reports, and transactions for the next phase so the data story stays
            clean.
          </p>
        </div>
      </div>
    </div>
  );
}
