import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { addMonths, format, parse } from "date-fns";
import {
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  PiggyBank,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Empty } from "@/components/Empty";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ApiError } from "@/lib/api";
import type { BudgetSummary } from "@/lib/accounts";
import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/currency";
import { subscribeToFinanceDataChanged } from "@/lib/financeEvents";
import {
  getBudgetVsActualReport,
  getCategoryBreakdown,
  getMonthlyTrend,
  getReportsOverview,
  type CategoryBreakdownResponse,
  type MonthlyTrendResponse,
  type ReportOverview,
} from "@/lib/reports";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Finance Manager" },
      { name: "description", content: "Live spending trends and analytics." },
    ],
  }),
  component: Page,
});

const tooltipStyle = {
  background: "oklch(0.2 0.014 260)",
  border: "1px solid oklch(0.32 0.014 260 / 60%)",
  borderRadius: 8,
  fontSize: 12,
};
const axis = "oklch(0.7 0.02 260)";
const pieColors = [
  "oklch(0.72 0.18 18)",
  "oklch(0.7 0.18 255)",
  "oklch(0.65 0.2 295)",
  "oklch(0.78 0.16 155)",
  "oklch(0.77 0.16 80)",
  "oklch(0.72 0.14 340)",
  "oklch(0.75 0.13 220)",
];

function currentMonthKey() {
  return format(new Date(), "yyyy-MM");
}

function monthKeyToDate(monthKey: string) {
  return parse(`${monthKey}-01`, "yyyy-MM-dd", new Date());
}

function shiftMonthKey(monthKey: string, offset: number) {
  return format(addMonths(monthKeyToDate(monthKey), offset), "yyyy-MM");
}

function Page() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [month, setMonth] = useState(currentMonthKey());
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [trend, setTrend] = useState<MonthlyTrendResponse | null>(null);
  const [breakdown, setBreakdown] = useState<CategoryBreakdownResponse | null>(null);
  const [budgetReport, setBudgetReport] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReports(targetMonth = month) {
    setLoading(true);
    setError(null);

    try {
      const [userResult, overviewResult, trendResult, breakdownResult, budgetResult] = await Promise.all([
        getCurrentUser(true),
        getReportsOverview(targetMonth),
        getMonthlyTrend(targetMonth, 6),
        getCategoryBreakdown(targetMonth),
        getBudgetVsActualReport(targetMonth),
      ]);

      setUser(userResult);
      setOverview(overviewResult);
      setTrend(trendResult);
      setBreakdown(breakdownResult);
      setBudgetReport(budgetResult);
    } catch (loadError) {
      if (loadError instanceof ApiError) {
        setError(loadError.message);
      } else {
        setError("Unable to load your reports right now.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReports(month);
  }, [month]);

  useEffect(() => {
    return subscribeToFinanceDataChanged(() => {
      void loadReports(month);
    });
  }, [month]);

  const titleMonth = useMemo(() => format(monthKeyToDate(month), "LLLL yyyy"), [month]);
  const trendData = trend?.trend ?? [];
  const hasTrendActivity = trendData.some(
    (item) => item.income > 0 || item.expenses > 0 || item.savings !== 0,
  );
  const categoryRows = breakdown?.categories ?? [];
  const hasCategorySpend = categoryRows.some((item) => item.spent_amount > 0);
  const pieData = categoryRows
    .filter((item) => item.spent_amount > 0)
    .map((item, index) => ({
      name: item.category_name ?? "Unknown",
      value: item.spent_amount,
      color: pieColors[index % pieColors.length],
      icon_name: item.icon_name,
    }));
  const budgetChartData = (budgetReport?.categories ?? []).map((item) => ({
    name: item.category_name ?? "Unknown",
    Budget: item.limit_amount,
    Actual: item.spent_amount,
    icon_name: item.icon_name,
  }));

  if (loading) {
    return (
      <div className="glass rounded-xl p-6 card-elevated">
        <h1 className="text-2xl">Loading reports...</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We’re pulling live trends from your transactions, budgets, and accounts now.
        </p>
      </div>
    );
  }

  if (!user || !overview || !trend || !breakdown || !budgetReport || error) {
    return (
      <div className="glass rounded-xl p-6 card-elevated space-y-4">
        <div>
          <h1 className="text-2xl">Reports unavailable</h1>
          <p className="mt-2 text-sm text-[var(--rose)]">
            {error ?? "We could not load your report data."}
          </p>
        </div>
        <Button onClick={() => void loadReports(month)}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl">Reports · {titleMonth}</h1>
          <p className="text-sm text-muted-foreground">
            Live analytics across the last six months, anchored to your selected report month.
          </p>
        </div>
        <MonthPicker month={month} onChange={setMonth} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CompareCard
          label="Income"
          value={formatCurrency(overview.income, user.currency)}
          delta={overview.income_delta_pct}
          good
          icon={TrendingUp}
        />
        <CompareCard
          label="Expenses"
          value={formatCurrency(overview.expenses, user.currency)}
          delta={overview.expense_delta_pct}
          good={overview.expense_delta_pct < 0}
          icon={TrendingDown}
        />
        <CompareCard
          label="Savings"
          value={formatCurrency(overview.savings, user.currency)}
          delta={overview.savings_delta_pct}
          good={overview.savings_delta_pct > 0}
          icon={PiggyBank}
        />
        <TopCategoryCard
          currency={user.currency}
          topCategory={overview.top_category}
        />
      </div>

      {!hasTrendActivity ? (
        <Empty
          icon={BarChart3}
          title={`No transaction trend data for the 6 months ending ${titleMonth}`}
          description="Add income and expense transactions across the months you want to analyse. Once you do, trend charts and comparisons will populate here automatically."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <ChartCard title="Income trend">
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="month" stroke={axis} fontSize={12} tickFormatter={shortMonthLabel} />
                <YAxis stroke={axis} fontSize={12} tickFormatter={(value) => formatCompactValue(value)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value, user.currency)} />
                <Line type="monotone" dataKey="income" stroke="oklch(0.78 0.16 155)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Expense trend">
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="month" stroke={axis} fontSize={12} tickFormatter={shortMonthLabel} />
                <YAxis stroke={axis} fontSize={12} tickFormatter={(value) => formatCompactValue(value)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value, user.currency)} />
                <Line type="monotone" dataKey="expenses" stroke="oklch(0.72 0.18 18)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Savings trend">
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="month" stroke={axis} fontSize={12} tickFormatter={shortMonthLabel} />
                <YAxis stroke={axis} fontSize={12} tickFormatter={(value) => formatCompactValue(value)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value, user.currency)} />
                <Line type="monotone" dataKey="savings" stroke="oklch(0.7 0.18 255)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {hasCategorySpend ? (
          <ChartCard title="Category-wise spending">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95} stroke="none">
                  {pieData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value, user.currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <Empty
            icon={CircleDollarSign}
            title={`No expense categories recorded for ${titleMonth}`}
            description="Once you log expense transactions in this month, category breakdowns and top-spend insights will show up here."
          />
        )}

        {budgetReport.has_budget ? (
          <ChartCard title="Budget vs actual">
            <ResponsiveContainer>
              <BarChart data={budgetChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="name" stroke={axis} fontSize={12} />
                <YAxis stroke={axis} fontSize={12} tickFormatter={(value) => formatCompactValue(value)} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatCurrency(value, user.currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Budget" fill="oklch(0.7 0.18 255)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Actual" fill="oklch(0.65 0.2 295)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <Empty
            icon={PiggyBank}
            title={`No budget set for ${titleMonth}`}
            description="Create a budget for this month to compare planned limits against real spending from the reports page too."
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass rounded-xl p-5 card-elevated lg:col-span-2">
          <h3 className="text-lg">Month-over-month by category</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Comparing {titleMonth} spending with the previous month.
          </p>
          {!categoryRows.length ? (
            <div className="mt-6">
              <Empty
                icon={BarChart3}
                title="No category comparison yet"
                description="The table will appear once this month or the previous month has expense transactions."
              />
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left py-2">Category</th>
                    <th className="text-right">Last month</th>
                    <th className="text-right">This month</th>
                    <th className="text-right">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {categoryRows.map((row) => (
                    <tr key={row.category_id}>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary/35 text-[var(--primary)]">
                            <CategoryIcon iconName={row.icon_name} />
                          </span>
                          <span>{row.category_name ?? "Unknown"}</span>
                        </div>
                      </td>
                      <td className="text-right text-muted-foreground">
                        {formatCurrency(row.previous_month_spent, user.currency)}
                      </td>
                      <td className="text-right">
                        {formatCurrency(row.spent_amount, user.currency)}
                      </td>
                      <td className={`text-right ${row.change_pct > 0 ? "text-[var(--rose)]" : "text-[var(--positive)]"}`}>
                        {row.change_pct > 0 ? "+" : ""}{row.change_pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass rounded-xl p-5 card-elevated">
          <h3 className="text-lg">Account balance summary</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Live balances derived from opening balances and transaction history.
          </p>
          {!overview.account_balances.length ? (
            <div className="mt-6">
              <Empty
                icon={PiggyBank}
                title="No accounts yet"
                description="Create at least one account to start seeing current balance summaries here."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {overview.account_balances.map((account) => (
                <li key={account.account_id} className="flex items-center justify-between text-sm">
                  <div>
                    <div>{account.name}</div>
                    <div className="text-xs text-muted-foreground">{account.type}</div>
                  </div>
                  <div className="font-medium">{formatCurrency(account.display_balance, user.currency)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CompareCard({
  label,
  value,
  delta,
  good,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: number;
  good: boolean;
  icon: typeof TrendingUp;
}) {
  return (
    <div className="glass rounded-xl p-4 card-elevated">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-2xl font-medium">{value}</div>
          <div className={`mt-1 text-xs ${good ? "text-[var(--positive)]" : "text-[var(--rose)]"}`}>
            {delta > 0 ? "+" : ""}{delta.toFixed(1)}% vs last month
          </div>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary/25 text-[var(--primary)]">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function TopCategoryCard({
  currency,
  topCategory,
}: {
  currency: string | null;
  topCategory: ReportOverview["top_category"];
}) {
  return (
    <div className="glass rounded-xl p-4 card-elevated">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Top category</div>
      {topCategory ? (
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary/25 text-[var(--primary)]">
              <CategoryIcon iconName={topCategory.icon_name} />
            </span>
            <div>
              <div className="text-xl font-medium">{topCategory.category_name ?? "Unknown"}</div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(topCategory.spent_amount, currency)} this month
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 text-sm text-muted-foreground">
          No expense category activity yet for this month.
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-xl p-5 card-elevated">
      <h3 className="text-lg mb-4">{title}</h3>
      <div className="h-64">{children}</div>
    </div>
  );
}

function MonthPicker({
  month,
  onChange,
}: {
  month: string;
  onChange: (value: string) => void;
}) {
  const monthDate = monthKeyToDate(month);

  return (
    <div className="flex items-center gap-2">
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
            <div className="text-sm font-medium">Select report month</div>
            <div className="text-xs text-muted-foreground">
              Pick any date inside the month you want to analyse.
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
              onChange(format(selected, "yyyy-MM"));
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

function shortMonthLabel(monthKey: string) {
  return format(monthKeyToDate(monthKey), "MMM");
}

function formatCompactValue(value: number) {
  if (value === 0) {
    return "0";
  }
  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }
  return `${Math.round(value)}`;
}
