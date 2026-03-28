import { describe, expect, it, vi } from "vitest";
import {
  ADMIN_PROJECT_PERMISSION,
  adminAccessPolicy,
  isAdminUser,
} from "@/lib/admin/access";

describe("admin access policy", () => {
  it("uses a project-level Stack permission for admin access", () => {
    expect(ADMIN_PROJECT_PERMISSION).toBe("access_admin_dashboard");
    expect(adminAccessPolicy).toEqual({
      permissionId: "access_admin_dashboard",
      model: "stack-project-permission",
      fallback: "not-found",
    });
  });

  it("returns false when there is no user", async () => {
    await expect(isAdminUser(null)).resolves.toBe(false);
  });

  it("returns true when the user has the admin permission", async () => {
    const user = {
      hasPermission: vi.fn().mockResolvedValue(true),
    };

    await expect(isAdminUser(user)).resolves.toBe(true);
    expect(user.hasPermission).toHaveBeenCalledWith("access_admin_dashboard");
  });

  it("returns false when the user lacks the admin permission", async () => {
    const user = {
      hasPermission: vi.fn().mockResolvedValue(false),
    };

    await expect(isAdminUser(user)).resolves.toBe(false);
  });
});