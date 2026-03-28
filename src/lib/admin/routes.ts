import type { LucideIcon } from "lucide-react";
import { BarChart3, LayoutDashboard, ShieldCheck, ShieldUser, Users } from "lucide-react";

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
    href: "/admin/moderation",
    label: "Moderation",
    description: "Review drafts and content needing publication attention.",
    icon: ShieldUser,
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "Inspect Stack users and manage admin access.",
    icon: Users,
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    description: "Pageview totals, daily trends, and top content.",
    icon: BarChart3,
  },
  {
    href: "/admin/operations",
    label: "Operations",
    description: "Infrastructure, delivery, and AI summary health.",
    icon: ShieldCheck,
  },
];