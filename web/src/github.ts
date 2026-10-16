import type { Issue } from "./board";

const API = "https://api.github.com";

export interface Config { token: string; repo: string } // repo = "owner/name"

async function gh<T>(cfg: Config, path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${cfg.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

export const listTasks = (cfg: Config) =>
  gh<Issue[]>(cfg, `/repos/${cfg.repo}/issues?labels=factory:task&state=all&per_page=100`);

/** PRD intake: a maintainer-created issue labelled factory:prd starts the /prd stage. */
export const submitPrd = (cfg: Config, title: string, body: string) =>
  gh<Issue>(cfg, `/repos/${cfg.repo}/issues`, {
    method: "POST",
    body: JSON.stringify({ title, body, labels: ["factory:prd"] }),
  });

export const getPaused = async (cfg: Config): Promise<boolean> => {
  try {
    const v = await gh<{ value: string }>(cfg, `/repos/${cfg.repo}/actions/variables/FACTORY_PAUSED`);
    return v.value === "true";
  } catch {
    return false; // variable not created yet
  }
};

export const setPaused = async (cfg: Config, paused: boolean): Promise<void> => {
  const body = JSON.stringify({ name: "FACTORY_PAUSED", value: String(paused) });
  try {
    await gh(cfg, `/repos/${cfg.repo}/actions/variables/FACTORY_PAUSED`, { method: "PATCH", body });
  } catch {
    await gh(cfg, `/repos/${cfg.repo}/actions/variables`, { method: "POST", body });
  }
};

/** Re-queue a stuck task by adding its stage label back (the label event triggers the workflow). */
export const requeue = async (cfg: Config, issue: number, stage: string): Promise<void> => {
  await gh(cfg, `/repos/${cfg.repo}/issues/${issue}/labels/factory:needs-human`, { method: "DELETE" });
  await gh(cfg, `/repos/${cfg.repo}/issues/${issue}/labels`, {
    method: "POST",
    body: JSON.stringify({ labels: [`factory:stage:${stage}`] }),
  });
};
