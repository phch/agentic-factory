import { useState } from "react";
import { getPaused, setPaused, type Config } from "./github";
import { Button, Card } from "./ui";
import { usePolling } from "./usePolling";

export function Controls({ cfg }: { cfg: Config }) {
  const state = usePolling(() => getPaused(cfg), `paused:${cfg.repo}:${cfg.token}`);
  const [err, setErr] = useState("");
  const paused = state.data;

  const toggle = async () => {
    try { await setPaused(cfg, !paused); setErr(""); state.refresh(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <Card className="max-w-md space-y-3">
      <h2 className="text-sm font-semibold">Kill switch</h2>
      {paused === null ? <p className="text-sm text-slate-500">Loading…</p> : (
        <>
          <p className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${paused ? "bg-rose-500" : "bg-emerald-500"}`} />
            Factory is <strong>{paused ? "paused" : "running"}</strong>
          </p>
          <Button variant={paused ? "primary" : "danger"} onClick={() => void toggle()}>{paused ? "Resume" : "Pause all agents"}</Button>
        </>
      )}
      {(err || state.error) && <p role="alert" className="text-sm text-rose-600">{err || state.error}</p>}
    </Card>
  );
}
