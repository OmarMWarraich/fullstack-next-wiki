import { beforeEach, describe, expect, it, vi } from "vitest";
import { setArticlePublishedState, setUserAdminAccess } from "@/app/actions/admin";
import redis from "@/cache";
import db from "@/db/index";
import { requireAdminUser } from "@/lib/admin/access";
import { stackServerApp } from "@/stack/server";

vi.mock("@/cache");
vi.mock("@/db/index");
vi.mock("@/lib/admin/access");
vi.mock("@/stack/server");
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminUser).mockResolvedValue({
      id: "admin-1",
      displayName: "Admin",
      primaryEmail: "admin@example.com",
      hasPermission: vi.fn().mockResolvedValue(true),
    });
    vi.mocked(redis.del).mockResolvedValue(1);
  });

  it("updates the article published state and clears the articles cache", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    vi.mocked(db.update).mockReturnValue({ set } as never);

    const formData = new FormData();
    formData.set("articleId", "7");
    formData.set("published", "true");

    await expect(setArticlePublishedState(formData)).resolves.toBeUndefined();
    expect(db.update).toHaveBeenCalled();
    expect(redis.del).toHaveBeenCalledWith("articles:all");
  });

  it("grants admin access to a Stack user", async () => {
    const grantPermission = vi.fn().mockResolvedValue(undefined);
    vi.mocked(stackServerApp.getUser).mockResolvedValue({
      grantPermission,
      revokePermission: vi.fn(),
    } as never);

    const formData = new FormData();
    formData.set("userId", "user-1");
    formData.set("enabled", "true");

    await expect(setUserAdminAccess(formData)).resolves.toBeUndefined();
    expect(grantPermission).toHaveBeenCalledWith("access_admin_dashboard");
  });

  it("revokes admin access from a Stack user", async () => {
    const revokePermission = vi.fn().mockResolvedValue(undefined);
    vi.mocked(stackServerApp.getUser).mockResolvedValue({
      grantPermission: vi.fn(),
      revokePermission,
    } as never);

    const formData = new FormData();
    formData.set("userId", "user-1");
    formData.set("enabled", "false");

    await setUserAdminAccess(formData);
    expect(revokePermission).toHaveBeenCalledWith("access_admin_dashboard");
  });
});