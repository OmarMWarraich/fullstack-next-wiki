import { notFound } from "next/navigation";
import { getRuntimeFeatureFlags } from "@/lib/config/feature-flags";

export const ADMIN_PROJECT_PERMISSION = "access_admin_dashboard";

export const adminAccessPolicy = {
  permissionId: ADMIN_PROJECT_PERMISSION,
  model: "stack-project-permission",
  fallback: "not-found",
} as const;

type AdminPermissionSubject = {
  hasPermission(permissionId: string): Promise<boolean>;
};

type AdminUser = AdminPermissionSubject & {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
};

export async function isAdminUser(
  user: AdminPermissionSubject | null,
): Promise<boolean> {
  if (!user) {
    return false;
  }

  return user.hasPermission(adminAccessPolicy.permissionId);
}

export async function requireAdminUser(): Promise<AdminUser> {
  if (!getRuntimeFeatureFlags().adminDashboardEnabled) {
    notFound();
  }

  const { stackServerApp } = await import("@/stack/server");
  const user = await stackServerApp.getUser({ or: "redirect" });

  if (!(await isAdminUser(user))) {
    notFound();
  }

  return user;
}