import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { transactions as mock, formatINR, accounts } from "@/lib/mockData";
import { ArrowUpRight, ArrowDownRight, Plus, Filter, X } from "lucide-react";

export const Route = createFileRoute("/app/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Finance Manager" }, { name: "description", content: "Your transactions." }] }),
  component: Page,
});

function Page() {
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [open, setOpen] = useState<null | "income" | "expense">(null);
  const list = mock.filter((t) => filter === "all" || t.type === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Transactions</h1>
          <p className="text-sm text-muted-foreground">Daily flow of income and expenses.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setOpen("income")} className="px-3 py-2 rounded-lg glass text-sm flex items-center gap-2 hover:border-primary/40">
            <Plus className="h-4 w-4 text-[var(--positive)]" /> Add Income
          </button>
          <button onClick={() => setOpen("expense")} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-2 hover:opacity-95">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      <div className="glass rounded-xl p-4 card-elevated flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Filter className="h-4 w-4" /> Filters</div>
        <Tabs value={filter} onChange={setFilter} options={[["all","All"],["income","Income"],["expense","Expense"]]} />
        <Select label="Account" options={["All accounts", ...accounts.map(a => a.name)]} />
        <Select label="Category" options={["All categories", "Food", "Travel", "Bills", "Shopping", "Entertainment", "Salary"]} />
        <input type="date" className="bg-input/60 border border-border rounded-lg px-3 py-2 text-sm outline-none" />
      </div>

      <div className="glass rounded-xl card-elevated overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
          <div className="col-span-4">Description</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Account</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2 text-right">Amount</div>
        </div>
        <ul className="divide-y divide-border/60">
          {list.map((t) => (
            <li key={t.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 px-5 py-3 text-sm hover:bg-secondary/30 transition">
              <div className="col-span-4 flex items-center gap-3">
                <span className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${t.type === "income" ? "bg-[color-mix(in_oklab,var(--positive)_15%,transparent)] text-[var(--positive)]" : "bg-[color-mix(in_oklab,var(--rose)_15%,transparent)] text-[var(--rose)]"}`}>
                  {t.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </span>
                <span>{t.description}</span>
              </div>
              <div className="col-span-2 text-muted-foreground">{t.category}</div>
              <div className="col-span-2 text-muted-foreground">{t.account}</div>
              <div className="col-span-2 text-muted-foreground">{t.date}</div>
              <div className={`col-span-2 md:text-right font-medium ${t.type === "income" ? "text-[var(--positive)]" : ""}`}>
                {t.type === "income" ? "+" : "−"}{formatINR(t.amount)}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {open && <TxnPanel type={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5 text-xs">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} className={`px-3 py-1.5 rounded-md transition ${value === v ? "bg-background text-foreground" : "text-muted-foreground"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}
function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <select aria-label={label} className="bg-input/60 border border-border rounded-lg px-3 py-2 text-sm outline-none">
      {options.map((o) => <option key={o} className="bg-card">{o}</option>)}
    </select>
  );
}

function TxnPanel({ type, onClose }: { type: "income" | "expense"; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-background/70 backdrop-blur" onClick={onClose} />
      <div className="ml-auto h-full w-full max-w-md glass-strong border-l p-6 relative fade-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-secondary/60"><X className="h-4 w-4" /></button>
        <h2 className="text-2xl">Add {type}</h2>
        <p className="text-sm text-muted-foreground mt-1">Mock form — frontend prototype only.</p>
        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
          <Field label="Amount" type="number" placeholder="0" />
          <Field label="Date" type="date" />
          <FormSelect label="Account" options={accounts.map(a => a.name)} />
          <FormSelect label="Category" options={type === "income" ? ["Salary","Freelance","Other"] : ["Food","Travel","Bills","Shopping","Entertainment"]} />
          <Field label="Description" placeholder="Optional" />
          <button className="w-full mt-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium glow-ring">Save</button>
        </form>
      </div>
    </div>
  );
}
function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <input {...props} className="mt-1.5 w-full bg-input/60 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition" />
    </label>
  );
}
function FormSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <select className="mt-1.5 w-full bg-input/60 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition">
        {options.map((o) => <option key={o} className="bg-card">{o}</option>)}
      </select>
    </label>
  );
}
