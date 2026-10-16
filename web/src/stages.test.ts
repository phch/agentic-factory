import { describe, expect, it } from "vitest";
import { groupByStage, stageOf, type Issue } from "./stages";

const mk = (labels: string[], state: "open" | "closed" = "open", n = 1): Issue => ({
  number: n, title: "t", html_url: "u", state, labels: labels.map((name) => ({ name })),
});

describe("stageOf", () => {
  it("ignores non-task issues", () => expect(stageOf(mk(["bug"]))).toBeNull());
  it("maps stage labels", () =>
    expect(stageOf(mk(["factory:task", "factory:stage:build"]))).toBe("build"));
  it("blocked", () => expect(stageOf(mk(["factory:task", "factory:blocked"]))).toBe("blocked"));
  it("needs-human wins over stage", () =>
    expect(stageOf(mk(["factory:task", "factory:stage:build", "factory:needs-human"]))).toBe("needs-human"));
  it("closed is done", () => expect(stageOf(mk(["factory:task"], "closed"))).toBe("done"));
});

describe("groupByStage", () => {
  it("groups", () => {
    const g = groupByStage([mk(["factory:task", "factory:stage:design"], "open", 1), mk(["x"], "open", 2)]);
    expect(g.design.map((i) => i.number)).toEqual([1]);
    expect(Object.values(g).flat()).toHaveLength(1);
  });
});
