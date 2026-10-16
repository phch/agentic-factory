import { describe, expect, it } from "vitest";
import { timeAgo } from "./time";

describe("timeAgo", () => {
  it("just now", () => expect(timeAgo(1000, 1000 + 2000)).toBe("just now"));
  it("seconds", () => expect(timeAgo(0, 42_000)).toBe("42s ago"));
  it("minutes", () => expect(timeAgo(0, 180_000)).toBe("3m ago"));
  it("hours", () => expect(timeAgo(0, 7_300_000)).toBe("2h ago"));
  it("never negative", () => expect(timeAgo(5000, 1000)).toBe("just now"));
});
