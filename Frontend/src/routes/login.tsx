import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { PublicNav } from "@/components/PublicNav";
import { Coins } from "lucide-react";
import { FormEvent, useState } from "react";

import { ApiError } from "@/lib/api";
import { getCurrentUser, login } from "@/lib/auth";

export const Route = createFileRoute("/login")({
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
  head: () => ({ meta: [{ title: "Login — Finance Manager" }, { name: "description", content: "Login to Finance Manager." }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      await nav({ to: "/app" });
    } catch (submitError) {
      if (submitError instanceof ApiError) {
        setError(submitError.message);
      } else {
        setError("Unable to sign in right now.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen relative">
      <PublicNav />
      <div className="min-h-screen grid place-items-center px-6 pt-32 pb-16">
        <div className="w-full max-w-md glass-strong rounded-2xl p-8 card-elevated fade-up">
          <div className="flex items-center gap-2 mb-6">
            <span className="h-9 w-9 rounded-full grid place-items-center bg-[var(--gradient-coin)]">
              <Coins className="h-4 w-4 text-black/70" />
            </span>
            <span className="font-medium">Finance Manager</span>
          </div>
          <h1 className="text-3xl">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your dashboard.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            <Field label="Password" type="password" placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} />
            {error && <p className="text-sm text-[var(--rose)]">{error}</p>}
            <button
              disabled={submitting}
              className="w-full mt-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium glow-ring hover:opacity-95 transition disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Login"}
            </button>
          </form>
          <p className="mt-6 text-sm text-muted-foreground text-center">
            New here? <Link to="/register" className="text-foreground hover:underline">Create an account</Link>
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
      <input
        {...props}
        className="mt-1.5 w-full bg-input/60 border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
      />
    </label>
  );
}
