import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/summary/route";
import redis from "@/cache";
import db from "@/db";
import { articles } from "@/db/schema";

vi.mock("@/cache");
vi.mock("@/db");

describe("summary route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-secret";
  });

  it("clears the articles cache only once after successful updates", async () => {
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([
          {
            id: 1,
            title: "Alpha",
            content: "Body",
          },
        ]),
      }),
    } as never);

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as never);
    vi.mocked(redis.del).mockResolvedValue(1);

    const response = await GET(
      new Request("http://localhost/api/summary", {
        headers: {
          authorization: "Bearer test-secret",
        },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalledWith(articles);
    expect(redis.del).toHaveBeenCalledTimes(1);
    expect(redis.del).toHaveBeenCalledWith("articles:all");
  });
});