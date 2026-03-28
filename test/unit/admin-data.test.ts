import { describe, expect, it } from "vitest";
import { buildAdminAnalytics, buildAdminOverview } from "@/lib/data/admin";

describe("admin overview aggregation", () => {
  it("summarizes totals, coverage, recent articles, and top articles", () => {
    const overview = buildAdminOverview(
      [
        {
          id: 3,
          title: "Gamma",
          author: "Casey",
          updatedAt: "2025-01-03T00:00:00.000Z",
          published: false,
          hasSummary: false,
          hasUpload: true,
          pageviews: 5,
        },
        {
          id: 2,
          title: "Beta",
          author: "Blair",
          updatedAt: "2025-01-02T00:00:00.000Z",
          published: true,
          hasSummary: true,
          hasUpload: false,
          pageviews: 40,
        },
        {
          id: 1,
          title: "Alpha",
          author: "Alex",
          updatedAt: "2025-01-01T00:00:00.000Z",
          published: true,
          hasSummary: true,
          hasUpload: true,
          pageviews: 10,
        },
      ],
      4,
    );

    expect(overview.totals).toEqual({
      articles: 3,
      publishedArticles: 2,
      draftArticles: 1,
      users: 4,
      summaries: 2,
      uploads: 2,
      pageviews: 55,
    });
    expect(overview.coverage).toEqual({
      summaries: 67,
      uploads: 67,
    });
    expect(overview.recentArticles.map((article) => article.id)).toEqual([
      3,
      2,
      1,
    ]);
    expect(overview.topArticles.map((article) => article.id)).toEqual([2, 1, 3]);
  });

  it("returns zero coverage when there are no articles", () => {
    const overview = buildAdminOverview([], 0);

    expect(overview.coverage).toEqual({
      summaries: 0,
      uploads: 0,
    });
    expect(overview.totals.pageviews).toBe(0);
    expect(overview.recentArticles).toEqual([]);
    expect(overview.topArticles).toEqual([]);
  });

  it("builds analytics totals and day-over-day deltas", () => {
    const analytics = buildAdminAnalytics(
      [
        {
          id: 2,
          title: "Beta",
          author: "Blair",
          updatedAt: "2025-01-02T00:00:00.000Z",
          published: true,
          hasSummary: true,
          hasUpload: true,
          pageviews: 40,
        },
        {
          id: 1,
          title: "Alpha",
          author: "Alex",
          updatedAt: "2025-01-01T00:00:00.000Z",
          published: true,
          hasSummary: true,
          hasUpload: true,
          pageviews: 10,
        },
      ],
      [
        { date: "2026-03-26", total: 3 },
        { date: "2026-03-27", total: 7 },
        { date: "2026-03-28", total: 9 },
      ],
    );

    expect(analytics.totalPageviews).toBe(50);
    expect(analytics.sevenDayPageviews).toBe(19);
    expect(analytics.todayPageviews).toBe(9);
    expect(analytics.yesterdayPageviews).toBe(7);
    expect(analytics.deltaFromYesterday).toBe(2);
    expect(analytics.averageDailyPageviews).toBe(6);
  });
});