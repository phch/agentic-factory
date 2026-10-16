import DOMPurify from "dompurify";
import { marked } from "marked";
import { useCallback, useEffect, useState } from "react";
import { STAGES, groupByStage, type Issue } from "./board";
import { getPaused, listTasks, setPaused, submitPrd, type Config } from "./github";

// The PAT lives in sessionStorage only: it is gone when the tab closes.
const load = (): Config => ({
  token: sessionStorage.getItem("factory.token") ?? "",
  repo: localStorage.getItem("factory.repo") ?? "",
});

export function App() {
  const [cfg, setCfg] = useState<Config>(load);
  const [tab, setTab] = useState<"board" | "submit" | "controls">("board");
  const ready = cfg.token !== "" && cfg.repo.includes("/");

  const save = (c: Config) => {
    sessionStorage.setItem("factory.token", c.token);
    localStorage.setItem("factory.repo", c.repo);
    setCfg(c);
  };

  return (
    <main style={{ fontFamily: "system-ui", padding: 16 }}>
      <h1>Agentic Factory</h1>
      <Settings cfg={cfg} onSave={save} />
      {ready && (
        <>
          <nav>
            {(["board", "submit", "controls"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} disabled={tab === t}>{t}</button>
            ))}
          </nav>
          {tab === "board" && <Board cfg={cfg} />}
          {tab === "submit" && <SubmitPrd cfg={cfg} />}
          {tab === "controls" && <Controls cfg={cfg} />}
        </>
      )}
    </main>
  );
}

function Settings({ cfg, onSave }: { cfg: Config; onSave: (c: Config) => void }) {
  const [draft, setDraft] = useState(cfg);
  return (
    <details open={!cfg.token}>
      <summary>Connection</summary>
      <p>
        Use a fine-grained token scoped to this one repository (Issues, Actions variables: read/write).
        It is kept in this tab only and sent only to api.github.com.
      </p>
      <input placeholder="owner/repo" value={draft.repo} onChange={(e) => setDraft({ ...draft, repo: e.target.value })} />
      <input type="password" placeholder="token" value={draft.token} onChange={(e) => setDraft({ ...draft, token: e.target.value })} />
      <button onClick={() => onSave(draft)}>Save</button>
    </details>
  );
}

function Board({ cfg }: { cfg: Config }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [error, setError] = useState("");
  const refresh = useCallback(() => listTasks(cfg).then(setIssues).catch((e: Error) => setError(e.message)), [cfg]);
  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(t);
  }, [refresh]);
  const groups = groupByStage(issues);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 8 }}>
        {STAGES.map((s) => (
          <section key={s}>
            <h3>{s} ({groups[s].length})</h3>
            {groups[s].map((i) => (
              // Titles render as text nodes, never as HTML.
              <p key={i.number}><a href={i.html_url} target="_blank" rel="noreferrer">#{i.number}</a> {i.title}</p>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}

function SubmitPrd({ cfg }: { cfg: Config }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState("");
  const html = DOMPurify.sanitize(marked.parse(body, { async: false }));
  const submit = () =>
    submitPrd(cfg, title, body).then((i) => setMsg(`Created #${i.number}`)).catch((e: Error) => setMsg(e.message));
  return (
    <>
      <input placeholder="Feature title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea rows={12} style={{ width: "100%" }} placeholder="Describe the feature or paste a PRD (markdown)" value={body} onChange={(e) => setBody(e.target.value)} />
      <button disabled={!title || !body} onClick={submit}>Submit</button>
      <p>{msg}</p>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </>
  );
}

function Controls({ cfg }: { cfg: Config }) {
  const [paused, setP] = useState<boolean | null>(null);
  useEffect(() => { void getPaused(cfg).then(setP); }, [cfg]);
  if (paused === null) return <p>Loading…</p>;
  return (
    <p>
      Factory is <strong>{paused ? "PAUSED" : "running"}</strong>{" "}
      <button onClick={() => setPaused(cfg, !paused).then(() => setP(!paused))}>{paused ? "Resume" : "Pause"}</button>
    </p>
  );
}
