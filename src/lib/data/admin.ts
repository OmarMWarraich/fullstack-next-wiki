import { count, desc, eq, inArray, isNull } from "drizzle-orm";
import { SUMMARY_MODEL } from "@/ai/summarize";
import redis from "@/cache";
import db, { sql } from "@/db/index";
import { articles, usersSync } from "@/db/schema";
import { ADMIN_PROJECT_PERMISSION } from "@/lib/admin/access";
import {
  ARTICLES_CACHE_KEY,
  getDailyPageviewTotalKey,
  getPageviewKey,
  getRecentDateStamps,
  parseSummaryFailureEvent,
  SUMMARY_FAILURES_KEY,
  type SummaryFailureEvent,
} from "@/lib/admin/telemetry";
import {
  getAdminFeatureFlags,
  getRuntimeFeatureFlags,
  isStackAuthConfigured,
  type AdminFeatureFlag,
} from "@/lib/config/feature-flags";

export type AdminArticleSnapshot = {
  id: number;
  title: string;
  author: string | null;
  updatedAt: string;
  published: boolean;
  hasSummary: boolean;
  hasUpload: boolean;
  pageviews: number;
};

export type AdminOverview = {
  totals: {
    articles: number;
    publishedArticles: number;
    draftArticles: number;
    users: number;
    summaries: number;
    uploads: number;
    pageviews: number;
  };
  coverage: {
    summaries: number;
    uploads: number;
  };
  recentArticles: AdminArticleSnapshot[];
  topArticles: AdminArticleSnapshot[];
};

export type AdminModerationItem = AdminArticleSnapshot & {
  reasons: string[];
};

export type AdminManagedUser = {
  id: string;
  name: string | null;
  email: string | null;
  signedUpAt: string;
  articleCount: number;
  synced: boolean;
  isAdmin: boolean;
};

export type AdminDailyPageviews = {
  date: string;
  total: number;
};

export type AdminAnalytics = {
  totalPageviews: number;
  sevenDayPageviews: number;
  todayPageviews: number;
  yesterdayPageviews: number;
  deltaFromYesterday: number;
  averageDailyPageviews: number;
  dailyPageviews: AdminDailyPageviews[];
  topArticles: AdminArticleSnapshot[];
};

export type AdminServiceCheck = {
  name: string;
  status: "healthy" | "configured" | "degraded" | "missing-config";
  detail: string;
};

export type AdminOperationsStatus = {
  serviceChecks: AdminServiceCheck[];
  summaryQueue: {
    pendingArticles: number;
    trackedFailures: number;
    recentFailures: SummaryFailureEvent[];
    summaryModel: string;
    cronProtected: boolean;
  };
  cache: {
    articlesKey: string;
    articleListCached: boolean;
    pageviewPattern: string;
    visibleKeys: string[];
  };
  featureFlags: AdminFeatureFlag[];
  authStatus: {
    stackAuthConfigured: boolean;
    adminPermission: string;
  };
};

export function buildAdminOverview(
  articlesWithMetrics: AdminArticleSnapshot[],
  userCount: number,
): AdminOverview {
  const articleCount = articlesWithMetrics.length;
  const publishedArticles = articlesWithMetrics.filter(
    (article) => article.published,
  ).length;
  const summaries = articlesWithMetrics.filter(
    (article) => article.hasSummary,
  ).length;
  const uploads = articlesWithMetrics.filter(
    (article) => article.hasUpload,
  ).length;
  const pageviews = articlesWithMetrics.reduce(
    (total, article) => total + article.pageviews,
    0,
  );

  return {
    totals: {
      articles: articleCount,
      publishedArticles,
      draftArticles: articleCount - publishedArticles,
      users: userCount,
      summaries,
      uploads,
      pageviews,
    },
    coverage: {
      summaries: toPercentage(summaries, articleCount),
      uploads: toPercentage(uploads, articleCount),
    },
    recentArticles: articlesWithMetrics.slice(0, 5),
    topArticles: [...articlesWithMetrics]
      .sort((left, right) => right.pageviews - left.pageviews)
      .slice(0, 5),
  };
}

export function buildAdminAnalytics(
  topArticles: AdminArticleSnapshot[],
  dailyPageviews: AdminDailyPageviews[],
): AdminAnalytics {
  const totalPageviews = topArticles.reduce(
    (total, article) => total + article.pageviews,
    0,
  );
  const sevenDayPageviews = dailyPageviews.reduce(
    (total, day) => total + day.total,
    0,
  );
  const todayPageviews = dailyPageviews.at(-1)?.total ?? 0;
  const yesterdayPageviews = dailyPageviews.at(-2)?.total ?? 0;

  return {
    totalPageviews,
    sevenDayPageviews,
    todayPageviews,
    yesterdayPageviews,
    deltaFromYesterday: todayPageviews - yesterdayPageviews,
    averageDailyPageviews:
      dailyPageviews.length === 0
        ? 0
        : Math.round(sevenDayPageviews / dailyPageviews.length),
    dailyPageviews,
    topArticles: [...topArticles].sort(
      (left, right) => right.pageviews - left.pageviews,
    ),
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [articleSnapshots, userCount] = await Promise.all([
    getArticleSnapshots(),
    getUserSyncCount(),
  ]);

  return buildAdminOverview(articleSnapshots, userCount);
}

export async function getAdminModerationQueue(): Promise<AdminModerationItem[]> {
  const articleSnapshots = await getArticleSnapshots();

  return articleSnapshots
    .map((article) => ({
      ...article,
      reasons: buildModerationReasons(article),
    }))
    .filter((article) => article.reasons.length > 0);
}

export async function getAdminUsers(): Promise<AdminManagedUser[]> {
  const { stackServerApp } = await import("@/stack/server");
  const users = await stackServerApp.listUsers({
    desc: true,
    limit: 25,
    orderBy: "signedUpAt",
  });

  const userIds = users.map((user) => user.id);
  const [syncedUsers, articleCounts] = await Promise.all([
    userIds.length === 0
      ? Promise.resolve([])
      : db
          .select({
            id: usersSync.id,
          })
          .from(usersSync)
          .where(inArray(usersSync.id, userIds)),
    db
      .select({
        authorId: articles.authorId,
        articleCount: count(),
      })
      .from(articles)
      .groupBy(articles.authorId),
  ]);

  const syncedUserIds = new Set(syncedUsers.map((user) => user.id));
  const articleCountByUser = new Map(
    articleCounts.map((item) => [item.authorId, item.articleCount]),
  );

  return Promise.all(
    users.map(async (user) => ({
      id: user.id,
      name: user.displayName,
      email: user.primaryEmail,
      signedUpAt: user.signedUpAt.toISOString(),
      articleCount: articleCountByUser.get(user.id) ?? 0,
      synced: syncedUserIds.has(user.id),
      isAdmin: await user.hasPermission(ADMIN_PROJECT_PERMISSION),
    })),
  );
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const [articleSnapshots, dailyPageviews] = await Promise.all([
    getArticleSnapshots(),
    getDailyPageviews(),
  ]);

  return buildAdminAnalytics(articleSnapshots, dailyPageviews);
}

export async function getAdminOperationsStatus(): Promise<AdminOperationsStatus> {
  const featureFlags = getAdminFeatureFlags();
  const runtimeFlags = getRuntimeFeatureFlags();

  const [serviceChecks, pendingSummaryResult, trackedFailures, recentFailures, cacheState] =
    await Promise.all([
      Promise.all([
        checkDatabase(),
        checkRedis(),
        Promise.resolve(
          checkConfiguredService(
            "Email",
            Boolean(process.env.RESEND_API_KEY),
            "Milestone email delivery uses the configured Resend API key.",
          ),
        ),
        Promise.resolve(
          checkConfiguredService(
            "AI Summaries",
            runtimeFlags.aiSummariesEnabled,
            `Summary generation is wired to ${SUMMARY_MODEL}.`,
          ),
        ),
      ]),
      db.select({ value: count() }).from(articles).where(isNull(articles.summary)),
      getTrackedFailureCount(),
      getRecentSummaryFailures(),
      inspectCacheKeys(),
    ]);

  return {
    serviceChecks,
    summaryQueue: {
      pendingArticles: pendingSummaryResult[0]?.value ?? 0,
      trackedFailures,
      recentFailures,
      summaryModel: SUMMARY_MODEL,
      cronProtected: Boolean(process.env.CRON_SECRET),
    },
    cache: {
      articlesKey: ARTICLES_CACHE_KEY,
      articleListCached: cacheState.articleListCached,
      pageviewPattern: "pageviews:article:*",
      visibleKeys: cacheState.visibleKeys,
    },
    featureFlags,
    authStatus: {
      stackAuthConfigured: isStackAuthConfigured(),
      adminPermission: ADMIN_PROJECT_PERMISSION,
    },
  };
}

function buildModerationReasons(article: AdminArticleSnapshot): string[] {
  const reasons: string[] = [];

  if (!article.published) {
    reasons.push("draft");
  }

  if (!article.hasSummary) {
    reasons.push("missing-summary");
  }

  return reasons;
}

function hasValue(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function toPercentage(countValue: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((countValue / total) * 100);
}

async function getArticleSnapshots(): Promise<AdminArticleSnapshot[]> {
  const articleRows = await db
    .select({
      id: articles.id,
      title: articles.title,
      author: usersSync.name,
      updatedAt: articles.updatedAt,
      published: articles.published,
      summary: articles.summary,
      imageUrl: articles.imageUrl,
    })
    .from(articles)
    .leftJoin(usersSync, eq(articles.authorId, usersSync.id))
    .orderBy(desc(articles.updatedAt));

  const pageviews = await getPageviewsByArticle(
    articleRows.map((article) => article.id),
  );

  return articleRows.map((article, index) => ({
    id: article.id,
    title: article.title,
    author: article.author,
    updatedAt: article.updatedAt,
    published: article.published,
    hasSummary: hasValue(article.summary),
    hasUpload: hasValue(article.imageUrl),
    pageviews: pageviews[index] ?? 0,
  }));
}

async function getUserSyncCount(): Promise<number> {
  const result = await db.select({ value: count() }).from(usersSync);
  return result[0]?.value ?? 0;
}

async function getPageviewsByArticle(articleIds: number[]): Promise<number[]> {
  if (articleIds.length === 0) {
    return [];
  }

  try {
    const pageviewValues = await redis.mget<(number | string | null)[]>(
      ...articleIds.map(getPageviewKey),
    );

    return pageviewValues.map((value) => Number(value ?? 0));
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }

    console.warn("Failed to load pageview totals for admin overview", error);
    return articleIds.map(() => 0);
  }
}

async function getDailyPageviews(): Promise<AdminDailyPageviews[]> {
  const dates = getRecentDateStamps(7);

  try {
    const totals = await redis.mget<(number | string | null)[]>(
      ...dates.map(getDailyPageviewTotalKey),
    );

    return dates.map((date, index) => ({
      date,
      total: Number(totals[index] ?? 0),
    }));
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }

    console.warn("Failed to load daily pageview totals", error);
    return dates.map((date) => ({ date, total: 0 }));
  }
}

async function getRecentSummaryFailures(): Promise<SummaryFailureEvent[]> {
  try {
    const failures = await redis.lrange<string>(SUMMARY_FAILURES_KEY, 0, 9);
    return failures
      .map(parseSummaryFailureEvent)
      .filter((failure): failure is SummaryFailureEvent => failure !== null);
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }

    console.warn("Failed to load summary failure history", error);
    return [];
  }
}

async function getTrackedFailureCount(): Promise<number> {
  try {
    return await redis.llen(SUMMARY_FAILURES_KEY);
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }

    console.warn("Failed to load summary failure count", error);
    return 0;
  }
}

async function inspectCacheKeys(): Promise<{
  articleListCached: boolean;
  visibleKeys: string[];
}> {
  try {
    const [articleListCached, scanResult] = await Promise.all([
      redis.exists(ARTICLES_CACHE_KEY),
      redis.scan("0", { count: 20, match: "pageviews:*" }),
    ]);

    return {
      articleListCached: articleListCached > 0,
      visibleKeys: scanResult[1],
    };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }

    console.warn("Failed to inspect Redis cache keys", error);
    return {
      articleListCached: false,
      visibleKeys: [],
    };
  }
}

function checkConfiguredService(
  name: string,
  configured: boolean,
  configuredDetail: string,
): AdminServiceCheck {
  if (!configured) {
    return {
      name,
      status: "missing-config",
      detail: `${name} is not configured in the environment.`,
    };
  }

  return {
    name,
    status: "configured",
    detail: configuredDetail,
  };
}

async function checkDatabase(): Promise<AdminServiceCheck> {
  if (!process.env.DATABASE_URL) {
    return {
      name: "Database",
      status: "missing-config",
      detail: "DATABASE_URL is not set.",
    };
  }

  try {
    await sql`select 1`;

    return {
      name: "Database",
      status: "healthy",
      detail: "Neon Postgres responded to a live query.",
    };
  } catch (error) {
    return {
      name: "Database",
      status: "degraded",
      detail: getErrorMessage(error),
    };
  }
}

async function checkRedis(): Promise<AdminServiceCheck> {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return {
      name: "Redis",
      status: "missing-config",
      detail: "Upstash Redis environment variables are missing.",
    };
  }

  try {
    await redis.ping();

    return {
      name: "Redis",
      status: "healthy",
      detail: "Upstash Redis responded to PING.",
    };
  } catch (error) {
    return {
      name: "Redis",
      status: "degraded",
      detail: getErrorMessage(error),
    };
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown service error.";
}

function isDynamicServerUsageError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    error.digest === "DYNAMIC_SERVER_USAGE"
  );
}