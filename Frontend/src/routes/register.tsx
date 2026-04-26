import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { Coins } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Finance Manager" }, { name: "description", content: "Create your Finance Manager account." }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen relative">
      <PublicNav />
      <div className="min-h-screen grid place-items-center px-6 pt-32 pb-16">
        <div className="w-full max-w-lg glass-strong rounded-2xl p-8 card-elevated fade-up">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-9 w-9 rounded-full grid place-items-center bg-[var(--gradient-coin)]">
              <Coins className="h-4 w-4 text-black/70" />
            </span>
            <span className="font-medium">Finance Manager</span>
          </div>
          <h1 className="text-3xl">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Set up your profile in under a minute.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); nav({ to: "/app" }); }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Field label="Name" placeholder="Aanya Sharma" />
            <Field label="Email" type="email" placeholder="you@example.com" />
            <Field label="Password" type="password" placeholder="••••••••" />
            <Field label="Confirm password" type="password" placeholder="••••••••" />
            <Select label="Country" options={["India", "United States", "United Kingdom", "Germany", "Japan"]} />
            <Select label="Currency" options={["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "JPY (¥)"]} />
            <button className="md:col-span-2 mt-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium glow-ring hover:opacity-95 transition">
              Create account
            </button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground text-center">
            Already have one? <Link to="/login" className="text-foreground hover:underline">Login</Link>
          </p>
        </div>
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
function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <select className="mt-1.5 w-full bg-input/60 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition">
        {options.map((o) => <option key={o} className="bg-card">{o}</option>)}
      </select>
    </label>
  );
}
