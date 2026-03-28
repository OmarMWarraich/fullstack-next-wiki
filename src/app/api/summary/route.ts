import { eq, isNull } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import summarizeArticle from "@/ai/summarize";
import redis from "@/cache";
import db from "@/db";
import { articles } from "@/db/schema";
import { getRuntimeFeatureFlags } from "@/lib/config/feature-flags";
import {
  ARTICLES_CACHE_KEY,
  createSummaryFailureEvent,
  SUMMARY_FAILURES_KEY,
  SUMMARY_FAILURES_LIMIT,
} from "@/lib/admin/telemetry";

export async function GET(req: NextRequest) {
  const featureFlags = getRuntimeFeatureFlags();

  if (
    process.env.NODE_ENV !== "development" &&
    req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!featureFlags.summaryCronEnabled || !featureFlags.aiSummariesEnabled) {
    return NextResponse.json({
      ok: true,
      updated: 0,
      skipped: true,
    });
  }

  // find articles that don't yet have a summary
  const rows = await db
    .select({
      id: articles.id,
      title: articles.title,
      content: articles.content,
    })
    .from(articles)
    .where(isNull(articles.summary));

  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 });
  }

  let updated = 0;
  console.log("🤖 Starting AI summary job");

  for (const row of rows) {
    try {
      const summary = await summarizeArticle(row.title ?? "", row.content);

      if (summary && summary.trim().length > 0) {
        await db
          .update(articles)
          .set({ summary })
          .where(eq(articles.id, row.id));
        updated++;
      }
    } catch (err) {
      try {
        const failureEvent = createSummaryFailureEvent(row.id, row.title, err);
        await redis.lpush(SUMMARY_FAILURES_KEY, JSON.stringify(failureEvent));
        await redis.ltrim(SUMMARY_FAILURES_KEY, 0, SUMMARY_FAILURES_LIMIT - 1);
      } catch (loggingError) {
        console.warn("⚠️ Failed to record summary job failure", loggingError);
      }

      console.warn("⚠️ Failed to summarize article id=", row.id, err);
    }
  }

  if (updated > 0) {
    // Clear articles cache used by getArticles
    try {
      await redis.del(ARTICLES_CACHE_KEY);
    } catch (e) {
      console.warn("⚠️ Failed to clear articles cache", e);
    }
  }

  console.log(`🤖 Concluding AI summary job, updated ${updated} rows`);
  return NextResponse.json({ ok: true, updated });
}
