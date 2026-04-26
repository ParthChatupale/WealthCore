import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, ArrowLeftRight, Wallet, Target, BarChart3, Settings, LogOut, Coins, Menu, X } from "lucide-react";
import { useState } from "react";

const items = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/transactions", label: "Transactions", icon: ArrowLeftRight },
  { to: "/app/accounts", label: "Accounts", icon: Wallet },
  { to: "/app/budget", label: "Budget", icon: Target },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const Side = (
    <aside className="h-full w-64 shrink-0 glass-strong border-r flex flex-col">
      <Link to="/app" className="flex items-center gap-2 px-5 py-5 border-b border-border/60">
        <span className="h-8 w-8 rounded-full grid place-items-center bg-[var(--gradient-coin)]">
          <Coins className="h-4 w-4 text-black/70" />
        </span>
        <span className="font-medium tracking-tight">Finance Manager</span>
      </Link>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((it) => {
          const active = loc.pathname === it.to || (it.to !== "/app" && loc.pathname.startsWith(it.to));
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                active
                  ? "bg-[color-mix(in_oklab,var(--primary)_15%,transparent)] text-foreground border border-[color-mix(in_oklab,var(--primary)_25%,transparent)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => nav({ to: "/" })}
        className="m-3 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition"
      >
        <LogOut className="h-4 w-4" /> Logout
      </button>
    </aside>
  );

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block sticky top-0 h-screen">{Side}</div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-background/70 backdrop-blur" onClick={() => setOpen(false)} />
          <div className="relative h-full">{Side}</div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 glass-strong border-b px-4 py-3 flex items-center justify-between">
          <button onClick={() => setOpen(true)} className="p-2 rounded-md hover:bg-secondary/60">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-medium">Finance Manager</span>
          <span className="w-9" />
        </div>
        <main className="p-5 md:p-8 max-w-[1400px] mx-auto fade-up">{children}</main>
      </div>
    </div>
  );
}
