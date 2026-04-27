import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/category-icons";

export function CategoryIcon({
  iconName,
  className,
}: {
  iconName: string | null | undefined;
  className?: string;
}) {
  const Icon = getCategoryIcon(iconName);
  return <Icon className={cn("h-4 w-4", className)} />;
}
