import { describe, expect, it } from "vitest";
import {
  createSummaryFailureEvent,
  getRecentDateStamps,
  getUtcDateStamp,
  parseSummaryFailureEvent,
} from "@/lib/admin/telemetry";

describe("admin telemetry helpers", () => {
  it("creates a structured summary failure event", () => {
    const now = new Date("2026-03-28T12:00:00.000Z");

    expect(
      createSummaryFailureEvent(3, "Alpha", new Error("Boom"), now),
    ).toEqual({
      articleId: 3,
      title: "Alpha",
      message: "Boom",
      occurredAt: "2026-03-28T12:00:00.000Z",
    });
  });

  it("parses persisted summary failure events", () => {
    const raw = JSON.stringify({
      articleId: 7,
      title: "Beta",
      message: "Failed",
      occurredAt: "2026-03-28T12:00:00.000Z",
    });

    expect(parseSummaryFailureEvent(raw)).toEqual({
      articleId: 7,
      title: "Beta",
      message: "Failed",
      occurredAt: "2026-03-28T12:00:00.000Z",
    });
  });

  it("builds stable recent UTC date stamps", () => {
    const now = new Date("2026-03-28T12:00:00.000Z");

    expect(getUtcDateStamp(now)).toBe("2026-03-28");
    expect(getRecentDateStamps(3, now)).toEqual([
      "2026-03-26",
      "2026-03-27",
      "2026-03-28",
    ]);
  });
});