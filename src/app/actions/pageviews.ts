"use server";

import redis from "@/cache";
import sendCelebrationEmail from "@/email/celebration-email";
import {
  getDailyPageviewArticleKey,
  getDailyPageviewTotalKey,
  getPageviewKey,
  getUtcDateStamp,
} from "@/lib/admin/telemetry";

const milestones = [10, 50, 100, 1000, 10000];

export async function incrementPageview(articleId: number) {
  const articleKey = getPageviewKey(articleId);
  const newVal = await redis.incr(articleKey);

  try {
    const dateStamp = getUtcDateStamp();
    await Promise.all([
      redis.incr(getDailyPageviewTotalKey(dateStamp)),
      redis.incr(getDailyPageviewArticleKey(dateStamp, articleId)),
    ]);
  } catch (error) {
    console.warn("Failed to record daily pageview analytics", error);
  }

  if (milestones.includes(newVal)) {
    sendCelebrationEmail(articleId, +newVal); // don't await, just send it
  }

  return +newVal;
}
