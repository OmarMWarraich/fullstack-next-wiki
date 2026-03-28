import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminUser } from "@/lib/admin/access";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await requireAdminUser();
  const userLabel = user.displayName ?? user.primaryEmail ?? user.id;

  return <AdminShell userLabel={userLabel}>{children}</AdminShell>;
}