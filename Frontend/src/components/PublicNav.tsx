import { Link } from "@tanstack/react-router";
import { Coins } from "lucide-react";

export function PublicNav() {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(1100px,calc(100%-2rem))]">
      <div className="glass rounded-full px-5 py-2.5 flex items-center justify-between card-elevated">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="h-8 w-8 rounded-full grid place-items-center bg-[var(--gradient-coin)] shadow-inner">
            <Coins className="h-4 w-4 text-black/70" />
          </span>
          <span className="font-medium tracking-tight">Finance Manager</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="/#features" className="hover:text-foreground transition">Features</a>
          <a href="/#how" className="hover:text-foreground transition">How it works</a>
          <a href="/#privacy" className="hover:text-foreground transition">Privacy</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition">
            Login
          </Link>
          <Link
            to="/register"
            className="text-sm px-4 py-1.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition shadow-[0_0_20px_-4px_var(--primary)]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
