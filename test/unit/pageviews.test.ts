import { beforeEach, describe, expect, it, vi } from "vitest";
import { incrementPageview } from "@/app/actions/pageviews";
import redis from "@/cache";
import sendCelebrationEmail from "@/email/celebration-email";

vi.mock("@/cache");
vi.mock("@/email/celebration-email");

describe("pageview analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("increments the main counter and daily analytics keys", async () => {
    vi.mocked(redis.incr)
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);

    await expect(incrementPageview(5)).resolves.toBe(10);
    expect(redis.incr).toHaveBeenNthCalledWith(1, "pageviews:article:5");
    expect(redis.incr).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^pageviews:daily:\d{4}-\d{2}-\d{2}:total$/),
    );
    expect(redis.incr).toHaveBeenNthCalledWith(
      3,
      expect.stringMatching(/^pageviews:daily:\d{4}-\d{2}-\d{2}:article:5$/),
    );
    expect(sendCelebrationEmail).toHaveBeenCalledWith(5, 10);
  });

  it("does not fail the primary counter when daily analytics recording breaks", async () => {
    vi.mocked(redis.incr)
      .mockResolvedValueOnce(3)
      .mockRejectedValueOnce(new Error("redis down"));

    await expect(incrementPageview(9)).resolves.toBe(3);
  });
});