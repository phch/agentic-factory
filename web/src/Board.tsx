import { useEffect } from "react";
import { STAGES, STAGE_STYLE, groupByStage, type Issue } from "./stages";
import { listPrds, listTasks, type Config } from "./github";
import { Card } from "./ui";
import { usePolling } from "./usePolling";

export function Board({ cfg, onStatus }: { cfg: Config; onStatus: (s: StatusInfo) => void }) {
  const key = `${cfg.repo}:${cfg.token}`;
  const tasks = usePolling(() => listTasks(cfg), `tasks:${key}`);
  const prds = usePolling(() => listPrds(cfg), `prds:${key}`);
  const { updatedAt, loading, refresh: refreshTasks } = tasks;
  const { refresh: refreshPrds } = prds;
  const error = tasks.error || prds.error;
  useEffect(() => {
    onStatus({ updatedAt, error, loading, refresh: () => { refreshTasks(); refreshPrds(); } });
  }, [updatedAt, error, loading, onStatus, refreshTasks, refreshPrds]);

  const groups = groupByStage(tasks.data ?? []);
  const total = tasks.data?.length ?? 0;
  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">PRD requests</h2>
        {prds.data?.length ? (
          <div className="flex flex-wrap gap-2">
            {prds.data.map((i) => <PrdChip key={i.number} issue={i} />)}
          </div>
        ) : (
          <p className="text-sm text-slate-500">None yet. Submit one from the Submit tab.</p>
        )}
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Tasks ({total})</h2>
        {tasks.data && total === 0 && <p className="text-sm text-slate-500">No tasks yet. They appear once a PRD is merged and decomposed.</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {STAGES.map((s) => (
            <div key={s} className="min-w-0 rounded-xl bg-slate-100/70 p-2 dark:bg-slate-900/60">
              <h3 className="mb-2 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                <span className={`h-2 w-2 rounded-full ${STAGE_STYLE[s].dot}`} />
                {STAGE_STYLE[s].title}
                <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] dark:bg-slate-800">{groups[s].length}</span>
              </h3>
              <div className="space-y-2">
                {groups[s].map((i) => <TaskCard key={i.number} issue={i} />)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export interface StatusInfo { updatedAt: number | null; error: string; loading: boolean; refresh: () => void }

function TaskCard({ issue }: { issue: Issue }) {
  return (
    <Card className="!p-3 text-sm">
      <a href={issue.html_url} target="_blank" rel="noreferrer" className="font-mono text-xs text-indigo-600 hover:underline dark:text-indigo-400">#{issue.number}</a>
      {/* Titles render as text nodes, never as HTML. */}
      <p className="mt-1 break-words">{issue.title}</p>
    </Card>
  );
}

function PrdChip({ issue }: { issue: Issue }) {
  const open = issue.state === "open";
  return (
    <a href={issue.html_url} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm hover:border-indigo-400 dark:border-slate-800 dark:bg-slate-900">
      <span className={`h-2 w-2 rounded-full ${open ? "animate-pulse bg-amber-500" : "bg-emerald-500"}`} />
      #{issue.number} {issue.title}
    </a>
  );
}
