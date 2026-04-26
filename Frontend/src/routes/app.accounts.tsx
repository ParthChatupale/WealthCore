import { createFileRoute } from "@tanstack/react-router";
import { accounts, formatINR } from "@/lib/mockData";
import { Banknote, Wallet, CreditCard, Plus } from "lucide-react";

export const Route = createFileRoute("/app/accounts")({
  head: () => ({ meta: [{ title: "Accounts — Finance Manager" }, { name: "description", content: "Manage your accounts." }] }),
  component: Page,
});

const iconMap = { Bank: Banknote, Cash: Wallet, Wallet: CreditCard } as const;
const tones = { Bank: "var(--primary)", Cash: "var(--amber)", Wallet: "var(--violet)" } as const;

function Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Accounts</h1>
          <p className="text-sm text-muted-foreground">Cash, bank, and wallets in one ledger.</p>
        </div>
        <button className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm flex items-center gap-2 hover:opacity-95">
          <Plus className="h-4 w-4" /> Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((a) => {
          const Icon = iconMap[a.type];
          const tone = tones[a.type];
          return (
            <div key={a.id} className="glass rounded-xl p-5 card-elevated hover-lift">
              <div className="flex items-center justify-between">
                <span className="h-10 w-10 rounded-lg grid place-items-center" style={{ background: `color-mix(in oklab, ${tone} 18%, transparent)`, color: tone }}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{a.type}</span>
              </div>
              <div className="mt-4 text-lg">{a.name}</div>
              <div className="mt-1 text-2xl font-medium">{formatINR(a.balance)}</div>
              <div className="mt-3 text-xs text-muted-foreground">Updated today · 14:32</div>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-xl p-5 card-elevated">
        <h3 className="text-lg mb-4">Account-wise summary</h3>
        <div className="space-y-3">
          {accounts.map((a) => {
            const total = accounts.reduce((s, x) => s + x.balance, 0);
            const pct = Math.round((a.balance / total) * 100);
            return (
              <div key={a.id}>
                <div className="flex justify-between text-sm">
                  <span>{a.name}</span>
                  <span className="text-muted-foreground">{formatINR(a.balance)} · {pct}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tones[a.type] }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
