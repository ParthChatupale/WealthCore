import { createFileRoute } from "@tanstack/react-router";
import { trend, budgets, accounts, formatINR } from "@/lib/mockData";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/app/reports")({
  head: () => ({ meta: [{ title: "Reports — Finance Manager" }, { name: "description", content: "Spending trends and analytics." }] }),
  component: Page,
});

const tooltipStyle = { background: "oklch(0.2 0.014 260)", border: "1px solid oklch(0.32 0.014 260 / 60%)", borderRadius: 8, fontSize: 12 };
const axis = "oklch(0.7 0.02 260)";

function Page() {
  const cur = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  const incomeDelta = ((cur.income - prev.income) / prev.income) * 100;
  const expenseDelta = ((cur.expense - prev.expense) / prev.expense) * 100;
  const savingsDelta = ((cur.savings - prev.savings) / prev.savings) * 100;

  const pieData = budgets.map((b) => ({ name: b.category, value: b.spent, color: b.color }));
  const bvA = budgets.map((b) => ({ name: b.category, Budget: b.limit, Actual: b.spent }));
  const topCat = [...budgets].sort((a, b) => b.spent - a.spent)[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl">Reports</h1>
        <p className="text-sm text-muted-foreground">Six-month trends, comparisons, and category insights.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Compare label="Income" cur={cur.income} delta={incomeDelta} good />
        <Compare label="Expenses" cur={cur.expense} delta={expenseDelta} good={expenseDelta < 0} />
        <Compare label="Savings" cur={cur.savings} delta={savingsDelta} good={savingsDelta > 0} />
        <div className="glass rounded-xl p-4 card-elevated">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Top category</div>
          <div className="mt-2 text-2xl font-medium">{topCat.category}</div>
          <div className="text-xs text-muted-foreground">{formatINR(topCat.spent)} this month</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard title="Income trend" className="lg:col-span-1">
          <ResponsiveContainer><LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
            <XAxis dataKey="month" stroke={axis} fontSize={12} />
            <YAxis stroke={axis} fontSize={12} tickFormatter={v => `${v/1000}k`} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="income" stroke="oklch(0.78 0.16 155)" strokeWidth={2} dot={false} />
          </LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Expense trend" className="lg:col-span-1">
          <ResponsiveContainer><LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
            <XAxis dataKey="month" stroke={axis} fontSize={12} />
            <YAxis stroke={axis} fontSize={12} tickFormatter={v => `${v/1000}k`} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="expense" stroke="oklch(0.72 0.18 18)" strokeWidth={2} dot={false} />
          </LineChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Savings trend" className="lg:col-span-1">
          <ResponsiveContainer><LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
            <XAxis dataKey="month" stroke={axis} fontSize={12} />
            <YAxis stroke={axis} fontSize={12} tickFormatter={v => `${v/1000}k`} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="savings" stroke="oklch(0.7 0.18 255)" strokeWidth={2} dot={false} />
          </LineChart></ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Category-wise spending">
          <ResponsiveContainer><PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} stroke="none">
              {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Budget vs actual">
          <ResponsiveContainer><BarChart data={bvA}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
            <XAxis dataKey="name" stroke={axis} fontSize={12} />
            <YAxis stroke={axis} fontSize={12} tickFormatter={v => `${v/1000}k`} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Budget" fill="oklch(0.7 0.18 255)" radius={[4,4,0,0]} />
            <Bar dataKey="Actual" fill="oklch(0.65 0.2 295)" radius={[4,4,0,0]} />
          </BarChart></ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 card-elevated lg:col-span-2">
          <h3 className="text-lg mb-4">Month-over-month by category</h3>
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
              {budgets.map((b) => {
                const last = Math.round(b.spent * (0.7 + Math.random() * 0.5));
                const change = ((b.spent - last) / last) * 100;
                return (
                  <tr key={b.category}>
                    <td className="py-2.5">{b.category}</td>
                    <td className="text-right text-muted-foreground">{formatINR(last)}</td>
                    <td className="text-right">{formatINR(b.spent)}</td>
                    <td className={`text-right ${change > 0 ? "text-[var(--rose)]" : "text-[var(--positive)]"}`}>
                      {change > 0 ? "+" : ""}{change.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="glass rounded-xl p-5 card-elevated">
          <h3 className="text-lg mb-4">Account balance summary</h3>
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
      </div>
    </div>
  );
}

function Compare({ label, cur, delta, good }: { label: string; cur: number; delta: number; good: boolean }) {
  return (
    <div className="glass rounded-xl p-4 card-elevated">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-medium">{formatINR(cur)}</div>
      <div className={`mt-1 text-xs ${good ? "text-[var(--positive)]" : "text-[var(--rose)]"}`}>
        {delta > 0 ? "+" : ""}{delta.toFixed(1)}% vs last month
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-xl p-5 card-elevated ${className}`}>
      <h3 className="text-lg mb-4">{title}</h3>
      <div className="h-60">{children}</div>
    </div>
  );
}
