import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { budgets, monthlyTotalBudget, formatINR } from "@/lib/mockData";
import { Empty } from "@/components/Empty";
import { Target, Pencil } from "lucide-react";

export const Route = createFileRoute("/app/budget")({
  head: () => ({ meta: [{ title: "Budget — Finance Manager" }, { name: "description", content: "Plan and track your monthly budget." }] }),
  component: Page,
});

function Page() {
  const [hasBudget, setHasBudget] = useState(true);
  const [editing, setEditing] = useState(false);

  if (!hasBudget) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl">Budget</h1>
          <p className="text-sm text-muted-foreground">Plan limits, then track them in real time.</p>
        </div>
        <Empty
          icon={Target}
          title="No budget set for this month"
          description="Budgets help you compare planned vs actual spending. Create one to start seeing limits per category and an overall progress bar."
          action={
            <button onClick={() => setHasBudget(true)} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium glow-ring">
              Create Monthly Budget
            </button>
          }
        />
      </div>
    );
  }

  const spent = budgets.reduce((s, b) => s + b.spent, 0);
  const remaining = monthlyTotalBudget - spent;
  const pct = Math.min(100, Math.round((spent / monthlyTotalBudget) * 100));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Budget · April</h1>
          <p className="text-sm text-muted-foreground">Monthly plan with category-wise limits.</p>
        </div>
        <button onClick={() => setEditing(true)} className="px-3 py-2 rounded-lg glass text-sm flex items-center gap-2 hover:border-primary/40">
          <Pencil className="h-4 w-4" /> Edit budget
        </button>
      </div>

      <div className="glass rounded-xl p-6 card-elevated">
        <div className="grid md:grid-cols-4 gap-6">
          <Stat label="Monthly budget" value={formatINR(monthlyTotalBudget)} />
          <Stat label="Total spent" value={formatINR(spent)} />
          <Stat label="Remaining" value={formatINR(remaining)} tone={remaining < 0 ? "var(--rose)" : "var(--positive)"} />
          <Stat label="Used" value={`${pct}%`} />
        </div>
        <div className="mt-6 h-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--primary), var(--violet))" }} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => {
          const p = Math.min(100, Math.round((b.spent / b.limit) * 100));
          const over = b.spent > b.limit;
          return (
            <div key={b.category} className={`glass rounded-xl p-5 card-elevated hover-lift ${over ? "border-[color-mix(in_oklab,var(--rose)_45%,var(--border))]" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm">{b.category}</span>
                <span className="text-xs text-muted-foreground">{p}% used</span>
              </div>
              <div className="mt-3 text-2xl font-medium">{formatINR(b.spent)}</div>
              <div className="text-xs text-muted-foreground">of {formatINR(b.limit)} limit</div>
              <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${p}%`, background: over ? "var(--rose)" : b.color }} />
              </div>
              {over && <div className="mt-3 text-xs text-[var(--rose)]">Over by {formatINR(b.spent - b.limit)}</div>}
            </div>
          );
        })}
      </div>

      {editing && <EditPanel onClose={() => setEditing(false)} />}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="mt-1.5 text-2xl font-medium" style={tone ? { color: tone } : undefined}>{value}</div>
    </div>
  );
}

function EditPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-background/70 backdrop-blur" onClick={onClose} />
      <div className="ml-auto h-full w-full max-w-md glass-strong border-l p-6 overflow-y-auto fade-up">
        <h2 className="text-2xl">Edit budget</h2>
        <p className="text-sm text-muted-foreground mt-1">Adjust monthly total and per-category limits.</p>
        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <label className="block">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Month</span>
            <input type="month" defaultValue="2025-04" className="mt-1.5 w-full bg-input/60 border border-border rounded-lg px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Total budget</span>
            <input type="number" defaultValue={monthlyTotalBudget} className="mt-1.5 w-full bg-input/60 border border-border rounded-lg px-3 py-2.5 text-sm" />
          </label>
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Category limits</span>
            {budgets.map((b) => (
              <div key={b.category} className="flex items-center gap-3">
                <span className="w-32 text-sm">{b.category}</span>
                <input type="number" defaultValue={b.limit} className="flex-1 bg-input/60 border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
            ))}
          </div>
          <button className="w-full mt-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium glow-ring">Save</button>
        </form>
      </div>
    </div>
  );
}
