export const STAGES = ["blocked", "design", "tests", "build", "validate", "done", "needs-human"] as const;
export type Stage = (typeof STAGES)[number];

export interface Issue {
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  labels: { name: string }[];
  pull_request?: unknown; // present when the "issue" is really a PR
}

/** Which board column an issue belongs to, derived from its factory:* labels. */
export function stageOf(issue: Issue): Stage | null {
  const names = new Set(issue.labels.map((l) => l.name));
  if (!names.has("factory:task")) return null;
  if (names.has("factory:needs-human")) return "needs-human";
  if (names.has("factory:done") || issue.state === "closed") return "done";
  if (names.has("factory:blocked")) return "blocked";
  for (const s of ["design", "tests", "build", "validate"] as const) {
    if (names.has(`factory:stage:${s}`)) return s;
  }
  return "blocked";
}

export function groupByStage(issues: Issue[]): Record<Stage, Issue[]> {
  const out = Object.fromEntries(STAGES.map((s) => [s, [] as Issue[]])) as Record<Stage, Issue[]>;
  for (const issue of issues) {
    const s = stageOf(issue);
    if (s) out[s].push(issue);
  }
  return out;
}

export const STAGE_STYLE: Record<Stage, { title: string; dot: string }> = {
  blocked: { title: "Blocked", dot: "bg-slate-400" },
  design: { title: "Design", dot: "bg-violet-500" },
  tests: { title: "Tests", dot: "bg-sky-500" },
  build: { title: "Build", dot: "bg-amber-500" },
  validate: { title: "Validate", dot: "bg-indigo-500" },
  done: { title: "Done", dot: "bg-emerald-500" },
  "needs-human": { title: "Needs human", dot: "bg-rose-500" },
};
