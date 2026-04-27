import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  CarFront,
  CircleHelp,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  PiggyBank,
  Plane,
  Popcorn,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

const categoryIconMap: Record<string, LucideIcon> = {
  UtensilsCrossed,
  Plane,
  ReceiptText,
  ShoppingBag,
  Popcorn,
  HeartPulse,
  CircleHelp,
  BriefcaseBusiness,
  Laptop,
  Landmark,
  HandCoins,
  PiggyBank,
  Wallet,
  Gift,
  GraduationCap,
  House,
  CarFront,
  ShieldCheck,
};

export function getCategoryIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) {
    return CircleHelp;
  }
  return categoryIconMap[iconName] ?? CircleHelp;
}

export function iconLabelFromName(iconName: string) {
  return iconName.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export const CATEGORY_ICON_NAMES = Object.keys(categoryIconMap);
