import { createFileRoute, Link } from "@tanstack/react-router";
import { StatCard } from "@/components/StatCard";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Target, Plus, ArrowUpRight, ArrowDownRight, AlertTriangle, Info, AlertOctagon } from "lucide-react";
import { accounts, transactions, budgets, monthlyTotalBudget, cashFlow, insights, formatINR } from "@/lib/mockData";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [{ title: "Dashboard — Finance Manager" }, { name: "description", content: "Your financial dashboard." }] }),
  component: Dashboard,
});

function Dashboard() {
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const savings = income - expenses;
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const usedPct = Math.round((totalSpent / monthlyTotalBudget) * 100);

  const topCats = [...budgets].sort((a, b) => b.spent - a.spent).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-3xl md:text-4xl">Aanya Sharma</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <QA to="/app/transactions" icon={ArrowUpRight} label="Add Income" tone="var(--positive)" />
          <QA to="/app/transactions" icon={ArrowDownRight} label="Add Expense" tone="var(--rose)" />
          <QA to="/app/budget" icon={Target} label="Set Budget" tone="var(--amber)" />
          <Link to="/app/reports" className="px-3 py-2 rounded-lg glass text-sm hover:border-primary/40 transition">View Reports</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Balance" value={formatINR(totalBalance)} sub="Across all accounts" icon={Wallet} accent="var(--primary)" />
        <StatCard label="This Month Income" value={formatINR(income)} sub="+12% vs last month" icon={TrendingUp} accent="var(--positive)" />
        <StatCard label="This Month Expenses" value={formatINR(expenses)} sub="−8% vs last month" icon={TrendingDown} accent="var(--rose)" />
        <StatCard label="Savings" value={formatINR(savings)} sub="69% savings rate" icon={PiggyBank} accent="var(--cyan)" />
        <StatCard label="Budget Used" value={`${usedPct}%`} sub={`${formatINR(totalSpent)} of ${formatINR(monthlyTotalBudget)}`} icon={Target} accent="var(--amber)" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass rounded-xl p-5 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg">Cash flow · April</h3>
            <span className="text-xs text-muted-foreground">Income vs expense</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={cashFlow}>
                <defs>
                  <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.16 155)" stopOpacity={0.5}/>
                    <stop offset="100%" stopColor="oklch(0.78 0.16 155)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.72 0.18 18)" stopOpacity={0.45}/>
                    <stop offset="100%" stopColor="oklch(0.72 0.18 18)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="day" stroke="oklch(0.7 0.02 260)" fontSize={12} />
                <YAxis stroke="oklch(0.7 0.02 260)" fontSize={12} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip contentStyle={{ background: "oklch(0.2 0.014 260)", border: "1px solid oklch(0.32 0.014 260 / 60%)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="income" stroke="oklch(0.78 0.16 155)" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" stroke="oklch(0.72 0.18 18)" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-5 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg">Budget progress</h3>
            <Link to="/app/budget" className="text-xs text-muted-foreground hover:text-foreground">Open budget →</Link>
          </div>
          <div className="space-y-3.5">
            {budgets.map((b) => {
              const pct = Math.min(100, Math.round((b.spent / b.limit) * 100));
              const over = b.spent > b.limit;
              return (
                <div key={b.category}>
                  <div className="flex justify-between text-sm">
                    <span>{b.category}</span>
                    <span className={over ? "text-[var(--rose)]" : "text-muted-foreground"}>
                      {formatINR(b.spent)} / {formatINR(b.limit)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? "var(--rose)" : b.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg">Top spending</h3>
            <Link to="/app/reports" className="text-xs text-muted-foreground hover:text-foreground">Analyze →</Link>
          </div>
          <ul className="space-y-3">
            {topCats.map((c) => (
              <li key={c.category} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  {c.category}
                </span>
                <span className="font-medium">{formatINR(c.spent)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 glass rounded-xl p-5 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg">Recent transactions</h3>
            <Link to="/app/transactions" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
          </div>
          <ul className="divide-y divide-border/60">
            {transactions.slice(0, 6).map((t) => (
              <li key={t.id} className="py-2.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${t.type === "income" ? "bg-[color-mix(in_oklab,var(--positive)_15%,transparent)] text-[var(--positive)]" : "bg-[color-mix(in_oklab,var(--rose)_15%,transparent)] text-[var(--rose)]"}`}>
                    {t.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate">{t.description}</div>
                    <div className="text-xs text-muted-foreground">{t.category} · {t.account}</div>
                  </div>
                </div>
                <div className={`font-medium ${t.type === "income" ? "text-[var(--positive)]" : "text-foreground"}`}>
                  {t.type === "income" ? "+" : "−"}{formatINR(t.amount)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 card-elevated">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg">Account balances</h3>
            <Link to="/app/accounts" className="text-xs text-muted-foreground hover:text-foreground">Manage →</Link>
          </div>
          <ul className="space-y-3">
            {accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <div>{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.type}</div>
                </div>
                <div className="font-medium">{formatINR(a.balance)}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 glass rounded-xl p-5 card-elevated">
          <h3 className="text-lg mb-4">Alerts & insights</h3>
          <ul className="space-y-2.5">
            {insights.map((i) => {
              const Icon = i.tone === "alert" ? AlertOctagon : i.tone === "warn" ? AlertTriangle : Info;
              const color = i.tone === "alert" ? "var(--rose)" : i.tone === "warn" ? "var(--amber)" : "var(--cyan)";
              return (
                <li key={i.text} className="flex items-start gap-3 text-sm p-3 rounded-lg border border-border/60 bg-secondary/30">
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color }} />
                  <span>{i.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function QA({ to, icon: Icon, label, tone }: { to: "/app/transactions" | "/app/budget"; icon: any; label: string; tone: string }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 rounded-lg glass text-sm flex items-center gap-2 hover:border-primary/40 transition"
      style={{ color: tone }}
    >
      <Icon className="h-4 w-4" /> <span className="text-foreground">{label}</span>
      <Plus className="h-3 w-3 opacity-60" />
    </Link>
  );
}
