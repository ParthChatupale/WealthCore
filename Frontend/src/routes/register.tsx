import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { Coins } from "lucide-react";
import { FormEvent, useState } from "react";

import { ApiError } from "@/lib/api";
import { getCurrentUser, register } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  beforeLoad: async () => {
    let user = null;
    try {
      user = await getCurrentUser();
    } catch {
      user = null;
    }

    if (user) {
      throw redirect({ to: "/app" });
    }
  },
  head: () => ({ meta: [{ title: "Create account — Finance Manager" }, { name: "description", content: "Create your Finance Manager account." }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState("India");
  const [currency, setCurrency] = useState("INR (₹)");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, email, password, country, currency });
      await nav({ to: "/app" });
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
      } else {
        setError("Unable to create your account right now.");
      }
    } finally {
      setSubmitting(false);
    }
  }

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
          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name" placeholder="Aanya Sharma" value={name} onChange={(event) => setName(event.target.value)} />
            <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
            <Field label="Confirm password" type="password" placeholder="••••••••" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            <Select label="Country" options={["India", "United States", "United Kingdom", "Germany", "Japan"]} value={country} onChange={(event) => setCountry(event.target.value)} />
            <Select label="Currency" options={["INR (₹)", "USD ($)", "EUR (€)", "GBP (£)", "JPY (¥)"]} value={currency} onChange={(event) => setCurrency(event.target.value)} />
            {error && <p className="md:col-span-2 text-sm text-[var(--rose)]">{error}</p>}
            <button
              disabled={submitting}
              className="md:col-span-2 mt-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium glow-ring hover:opacity-95 transition disabled:opacity-60"
            >
              {submitting ? "Creating account..." : "Create account"}
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
function Select(
  {
    label,
    options,
    ...props
  }: { label: string; options: string[] } & React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <select
        {...props}
        className="mt-1.5 w-full bg-input/60 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
      >
        {options.map((o) => <option key={o} className="bg-card">{o}</option>)}
      </select>
    </label>
  );
}
