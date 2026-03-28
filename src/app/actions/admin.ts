"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import redis from "@/cache";
import { ADMIN_PROJECT_PERMISSION, requireAdminUser } from "@/lib/admin/access";
import { ARTICLES_CACHE_KEY } from "@/lib/admin/telemetry";
import db from "@/db/index";
import { articles } from "@/db/schema";

export async function setArticlePublishedState(
  formData: FormData,
): Promise<void> {
  await requireAdminUser();

  const articleId = Number(formData.get("articleId"));
  const published = formData.get("published") === "true";

  if (!Number.isInteger(articleId) || articleId <= 0) {
    throw new Error("Invalid article id.");
  }

  await db
    .update(articles)
    .set({ published })
    .where(eq(articles.id, articleId));

  await redis.del(ARTICLES_CACHE_KEY);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/moderation");
  revalidatePath("/admin/analytics");
}

export async function setUserAdminAccess(
  formData: FormData,
): Promise<void> {
  await requireAdminUser();

  const userId = formData.get("userId");
  const enabled = formData.get("enabled") === "true";

  if (typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("Invalid user id.");
  }

  const { stackServerApp } = await import("@/stack/server");
  const user = await stackServerApp.getUser(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (enabled) {
    await user.grantPermission(ADMIN_PROJECT_PERMISSION);
  } else {
    await user.revokePermission(ADMIN_PROJECT_PERMISSION);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
}