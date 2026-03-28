import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAdminAnalytics } from "@/lib/data/admin";
import redis from "@/cache";
import db from "@/db/index";

vi.mock("@/cache");
vi.mock("@/db/index");

describe("admin analytics query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes analytics from the full article snapshot set, not only recent items", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: 6,
              title: "Newest",
              author: "A",
              updatedAt: "2026-03-28T00:00:00.000Z",
              published: true,
              summary: "summary",
              imageUrl: null,
            },
            {
              id: 5,
              title: "Fifth",
              author: "B",
              updatedAt: "2026-03-27T00:00:00.000Z",
              published: true,
              summary: "summary",
              imageUrl: null,
            },
            {
              id: 4,
              title: "Fourth",
              author: "C",
              updatedAt: "2026-03-26T00:00:00.000Z",
              published: true,
              summary: "summary",
              imageUrl: null,
            },
            {
              id: 3,
              title: "Third",
              author: "D",
              updatedAt: "2026-03-25T00:00:00.000Z",
              published: true,
              summary: "summary",
              imageUrl: null,
            },
            {
              id: 2,
              title: "Second",
              author: "E",
              updatedAt: "2026-03-24T00:00:00.000Z",
              published: true,
              summary: "summary",
              imageUrl: null,
            },
            {
              id: 1,
              title: "Old But Popular",
              author: "F",
              updatedAt: "2026-03-01T00:00:00.000Z",
              published: true,
              summary: "summary",
              imageUrl: null,
            },
          ]),
        }),
      }),
    } as never);

    vi.mocked(redis.mget).mockImplementation((...keys: unknown[]) => {
      const firstKey = String(keys[0] ?? "");

      if (firstKey.startsWith("pageviews:article:")) {
        return Promise.resolve([1, 2, 3, 4, 5, 100] as never);
      }

      return Promise.resolve([3, 7, 9, 0, 0, 0, 0] as never);
    });

    const analytics = await getAdminAnalytics();

    expect(analytics.totalPageviews).toBe(115);
    expect(analytics.topArticles[0]?.id).toBe(1);
    expect(analytics.topArticles).toHaveLength(6);
  });
});