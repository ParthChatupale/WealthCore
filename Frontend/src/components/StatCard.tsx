import type { LucideIcon } from "lucide-react";

export function StatCard({
  label, value, sub, icon: Icon, accent = "var(--primary)",
}: { label: string; value: string; sub?: string; icon: LucideIcon; accent?: string }) {
  return (
    <div className="glass rounded-xl p-4 card-elevated hover-lift">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span
          className="h-8 w-8 rounded-lg grid place-items-center"
          style={{ background: `color-mix(in oklab, ${accent} 18%, transparent)`, color: accent }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-2xl font-medium tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
