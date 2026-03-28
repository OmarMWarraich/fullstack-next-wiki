import { count, desc, eq, isNull } from "drizzle-orm";
import { SUMMARY_MODEL } from "@/ai/summarize";
import redis from "@/cache";
import db, { sql } from "@/db/index";
import { articles, usersSync } from "@/db/schema";

const ARTICLES_CACHE_KEY = "articles:all";

type AdminArticleRow = {
  id: number;
  title: string;
  author: string | null;
  updatedAt: string;
  published: boolean;
  summary: string | null;
  imageUrl: string | null;
};

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

export type AdminServiceCheck = {
  name: string;
  status: "healthy" | "configured" | "degraded" | "missing-config";
  detail: string;
};

export type AdminOperationsStatus = {
  serviceChecks: AdminServiceCheck[];
  summaryQueue: {
    pendingArticles: number;
    summaryModel: string;
    cronProtected: boolean;
  };
  cache: {
    articlesKey: string;
    pageviewPattern: string;
  };
};

function hasValue(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function toPercentage(countValue: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((countValue / total) * 100);
}

function getPageviewKey(articleId: number): string {
  return `pageviews:article:${articleId}`;
}

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
  const uploads = articlesWithMetrics.filter((article) => article.hasUpload).length;
  const pageviews = articlesWithMetrics.reduce(
    (total, article) => total + article.pageviews,
    0,
  );

  const sortByPageviews = [...articlesWithMetrics].sort(
    (left, right) => right.pageviews - left.pageviews,
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
    topArticles: sortByPageviews.slice(0, 5),
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [articleRows, userCountResult] = await Promise.all([
    db
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
      .orderBy(desc(articles.updatedAt)),
    db.select({ value: count() }).from(usersSync),
  ]);

  const pageviews = await getPageviewsByArticle(
    articleRows.map((article) => article.id),
  );

  const articlesWithMetrics = articleRows.map((article, index) => ({
    id: article.id,
    title: article.title,
    author: article.author,
    updatedAt: article.updatedAt,
    published: article.published,
    hasSummary: hasValue(article.summary),
    hasUpload: hasValue(article.imageUrl),
    pageviews: pageviews[index] ?? 0,
  }));

  return buildAdminOverview(articlesWithMetrics, userCountResult[0]?.value ?? 0);
}

export async function getAdminOperationsStatus(): Promise<AdminOperationsStatus> {
  const [serviceChecks, pendingSummaryResult] = await Promise.all([
    Promise.all([
      checkDatabase(),
      checkRedis(),
      Promise.resolve(checkConfiguredService(
        "Email",
        Boolean(process.env.RESEND_API_KEY),
        "Milestone email delivery uses the configured Resend API key.",
      )),
      Promise.resolve(checkConfiguredService(
        "AI Summaries",
        Boolean(process.env.AI_GATEWAY_API_KEY || process.env.OPENAI_API_KEY),
        `Summary generation is wired to ${SUMMARY_MODEL}.`,
      )),
    ]),
    db.select({ value: count() }).from(articles).where(isNull(articles.summary)),
  ]);

  return {
    serviceChecks,
    summaryQueue: {
      pendingArticles: pendingSummaryResult[0]?.value ?? 0,
      summaryModel: SUMMARY_MODEL,
      cronProtected: Boolean(process.env.CRON_SECRET),
    },
    cache: {
      articlesKey: ARTICLES_CACHE_KEY,
      pageviewPattern: "pageviews:article:{id}",
    },
  };
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
    console.warn("Failed to load pageview totals for admin overview", error);
    return articleIds.map(() => 0);
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