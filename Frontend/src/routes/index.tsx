import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { Coin } from "@/components/Coin";
import { ArrowRight, Wallet, TrendingUp, PieChart, BarChart3, Shield, Layers, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Finance Manager — Track money. Plan budgets. Understand flow." },
      { name: "description", content: "A premium personal finance app to track income, expenses, accounts, budgets and reports." },
      { property: "og:title", content: "Finance Manager" },
      { property: "og:description", content: "Track your money. Plan your budget. Understand your financial flow." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <PublicNav />

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full glass text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-[var(--amber)]" /> A calmer way to manage money
            </div>
            <h1 className="font-display mt-5 text-5xl md:text-6xl lg:text-[5.5rem] leading-[1.02] tracking-tight text-gradient">
              Track your money.<br />Plan your budget.<br />
              <span className="italic font-light text-foreground/80">Understand your flow.</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl">
              Finance Manager helps you record income and expenses, manage accounts, set monthly
              budgets, and see clear reports — all in one cinematic dashboard.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground font-medium glow-ring hover:opacity-95 transition"
              >
                Get Started <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link to="/login" className="px-5 py-3 rounded-full glass text-sm hover:border-primary/40 transition">
                Login
              </Link>
            </div>
          </div>
          <div className="relative h-[420px] lg:h-[520px]">
            <Coin />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 relative">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl md:text-5xl tracking-tight text-gradient">Everything you need, nothing you don't.</h2>
            <p className="mt-4 text-muted-foreground">Designed for clarity. Built for daily use.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, title: "Daily income & expense tracking", desc: "Capture every transaction with categories, accounts, and notes." , c: "var(--primary)" },
              { icon: Wallet, title: "Multiple accounts", desc: "Cash, bank, and wallet balances unified in one ledger.", c: "var(--cyan)" },
              { icon: PieChart, title: "Monthly & category budgets", desc: "Plan limits per category and track them in real time.", c: "var(--amber)" },
              { icon: BarChart3, title: "Budget vs actual", desc: "Spot overspending early with subtle visual signals.", c: "var(--violet)" },
              { icon: Layers, title: "Reports & trends", desc: "Month-over-month comparisons and category breakdowns.", c: "var(--rose)" },
              { icon: Shield, title: "Private multi-user", desc: "Each account's data stays isolated and private.", c: "var(--positive)" },
            ].map((f) => (
              <div key={f.title} className="glass rounded-xl p-5 card-elevated hover-lift">
                <span className="h-10 w-10 rounded-lg grid place-items-center"
                  style={{ background: `color-mix(in oklab, ${f.c} 15%, transparent)`, color: f.c }}>
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl tracking-tight text-gradient max-w-2xl">How it works</h2>
          <div className="mt-12 grid md:grid-cols-4 gap-4">
            {[
              { n: "01", t: "Add accounts", d: "Cash, bank or wallet — set starting balances." },
              { n: "02", t: "Record entries", d: "Log income and expenses as they happen." },
              { n: "03", t: "Set budgets", d: "Monthly totals and per-category limits." },
              { n: "04", t: "Analyze", d: "Reports show trends and where money goes." },
            ].map((s) => (
              <div key={s.n} className="glass rounded-xl p-5 card-elevated">
                <div className="text-xs text-muted-foreground tracking-widest">{s.n}</div>
                <div className="mt-2 text-lg">{s.t}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="px-6 py-24">
        <div className="max-w-4xl mx-auto glass rounded-2xl p-10 card-elevated text-center">
          <Shield className="h-7 w-7 mx-auto text-[var(--positive)]" />
          <h2 className="font-display mt-4 text-3xl md:text-4xl tracking-tight">Your finances stay yours.</h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Every user account is isolated. Your transactions, budgets, and balances remain private —
            visible only inside your account.
          </p>
        </div>
      </section>

      <footer className="px-6 py-10 text-center text-xs text-muted-foreground border-t border-border/40">
        © {new Date().getFullYear()} Finance Manager · A calmer view of your money
      </footer>
    </div>
  );
}
