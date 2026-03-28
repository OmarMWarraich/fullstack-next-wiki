import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ShieldCheck } from "lucide-react";

export type AdminRouteItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const adminRouteItems: AdminRouteItem[] = [
  {
    href: "/admin",
    label: "Overview",
    description: "High-level application metrics and content signals.",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/operations",
    label: "Operations",
    description: "Infrastructure, delivery, and AI summary health.",
    icon: ShieldCheck,
  },
];