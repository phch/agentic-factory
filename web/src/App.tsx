import { useState } from "react";
import { Board, type StatusInfo } from "./Board";
import { Controls } from "./Controls";
import type { Config } from "./github";
import { SubmitPrd } from "./SubmitPrd";
import { timeAgo } from "./time";
import { Button, Card, input } from "./ui";
import { useNow } from "./usePolling";

// The PAT lives in sessionStorage only: it is gone when the tab closes.
const load = (): Config => ({
  token: sessionStorage.getItem("factory.token") ?? "",
  repo: localStorage.getItem("factory.repo") ?? "",
});

const TABS = ["board", "submit", "controls"] as const;
type Tab = (typeof TABS)[number];

export function App() {
  const [cfg, setCfg] = useState<Config>(load);
  const [tab, setTab] = useState<Tab>("board");
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const ready = cfg.token !== "" && cfg.repo.includes("/");

  const save = (c: Config) => {
    sessionStorage.setItem("factory.token", c.token);
    localStorage.setItem("factory.repo", c.repo);
    setCfg(c);
  };

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">Agentic Factory</h1>
        {ready && (
          <nav className="ml-4 flex gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800/70">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1 text-sm capitalize transition ${tab === t ? "bg-white shadow-sm dark:bg-slate-950" : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"}`}>
                {t}
              </button>
            ))}
          </nav>
        )}
        {ready && tab === "board" && status && <LiveStatus s={status} />}
        {ready && (
          <Button variant="ghost" className="ml-auto" onClick={() => save({ token: "", repo: cfg.repo })}>
            Disconnect
          </Button>
        )}
      </header>

      {!ready ? <Connect cfg={cfg} onSave={save} /> : (
        <>
          {tab === "board" && <Board cfg={cfg} onStatus={setStatus} />}
          {tab === "submit" && <SubmitPrd cfg={cfg} />}
          {tab === "controls" && <Controls cfg={cfg} />}
        </>
      )}
    </div>
  );
}

function LiveStatus({ s }: { s: StatusInfo }) {
  const now = useNow();
  const bad = s.error !== "";
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500" title={s.error}>
      <span className={`h-2 w-2 rounded-full ${bad ? "bg-rose-500" : s.loading ? "animate-pulse bg-amber-500" : "bg-emerald-500"}`} />
      {bad ? "Error, retrying…" : s.updatedAt ? `Live · updated ${timeAgo(s.updatedAt, now)}` : "Connecting…"}
      <button className="underline hover:text-slate-800 dark:hover:text-slate-200" onClick={s.refresh}>Refresh</button>
    </div>
  );
}

function Connect({ cfg, onSave }: { cfg: Config; onSave: (c: Config) => void }) {
  const [draft, setDraft] = useState(cfg);
  return (
    <Card className="max-w-lg space-y-3">
      <h2 className="text-lg font-semibold">Connect to your repo</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Use a fine-grained token scoped to this one repository (Issues and Variables: read/write). It
        stays in this tab only and is sent only to api.github.com.
      </p>
      <input className={input} placeholder="owner/repo" value={draft.repo} onChange={(e) => setDraft({ ...draft, repo: e.target.value.trim() })} />
      <input className={input} type="password" placeholder="Fine-grained token" value={draft.token} onChange={(e) => setDraft({ ...draft, token: e.target.value.trim() })} />
      <Button disabled={!draft.token || !draft.repo.includes("/")} onClick={() => onSave(draft)}>Connect</Button>
    </Card>
  );
}
