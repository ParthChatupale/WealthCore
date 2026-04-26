import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    try {
      await getCurrentUser();
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
