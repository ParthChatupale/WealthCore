import type { LucideIcon } from "lucide-react";

export function Empty({
  icon: Icon, title, description, action,
}: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-10 text-center card-elevated">
      <div className="mx-auto h-14 w-14 rounded-full grid place-items-center bg-secondary/60 border">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
