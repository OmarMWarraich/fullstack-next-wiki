export const ARTICLES_CACHE_KEY = "articles:all";
export const SUMMARY_FAILURES_KEY = "admin:summary-failures";
export const SUMMARY_FAILURES_LIMIT = 50;

export type SummaryFailureEvent = {
  articleId: number;
  title: string;
  message: string;
  occurredAt: string;
};

export function getPageviewKey(articleId: number): string {
  return `pageviews:article:${articleId}`;
}

export function getUtcDateStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function getDailyPageviewTotalKey(dateStamp: string): string {
  return `pageviews:daily:${dateStamp}:total`;
}

export function getDailyPageviewArticleKey(
  dateStamp: string,
  articleId: number,
): string {
  return `pageviews:daily:${dateStamp}:article:${articleId}`;
}

export function getRecentDateStamps(days: number, now = new Date()): string[] {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - (days - index - 1));
    return getUtcDateStamp(date);
  });
}

export function createSummaryFailureEvent(
  articleId: number,
  title: string,
  error: unknown,
  now = new Date(),
): SummaryFailureEvent {
  return {
    articleId,
    title,
    message: getErrorMessage(error),
    occurredAt: now.toISOString(),
  };
}

export function parseSummaryFailureEvent(
  rawValue: string,
): SummaryFailureEvent | null {
  try {
    const parsed = JSON.parse(rawValue) as Partial<SummaryFailureEvent>;

    if (
      typeof parsed.articleId !== "number" ||
      typeof parsed.title !== "string" ||
      typeof parsed.message !== "string" ||
      typeof parsed.occurredAt !== "string"
    ) {
      return null;
    }

    return {
      articleId: parsed.articleId,
      title: parsed.title,
      message: parsed.message,
      occurredAt: parsed.occurredAt,
    };
  } catch {
    return null;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown summary failure.";
}