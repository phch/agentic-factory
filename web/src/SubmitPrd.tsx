import DOMPurify from "dompurify";
import { marked } from "marked";
import { useState } from "react";
import { submitPrd, type Config } from "./github";
import { Button, Card, input } from "./ui";

export function SubmitPrd({ cfg }: { cfg: Config }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const html = DOMPurify.sanitize(marked.parse(body, { async: false }));

  const submit = async () => {
    setBusy(true);
    try {
      const issue = await submitPrd(cfg, title, body);
      setMsg({ ok: true, text: `Created #${issue.number}. The PRD stage is starting.` });
      setTitle(""); setBody("");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3">
        <input className={input} placeholder="Feature title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={`${input} font-mono`} rows={14} placeholder="Describe the feature or paste a PRD (markdown)" value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex items-center gap-3">
          <Button disabled={!title || !body || busy} onClick={() => void submit()}>{busy ? "Submitting…" : "Submit"}</Button>
          {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-600" : "text-rose-600"}`}>{msg.text}</p>}
        </div>
      </Card>
      <Card>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</h2>
        <div className="space-y-2 text-sm [&_h1]:text-lg [&_h1]:font-bold [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 dark:[&_code]:bg-slate-800"
          dangerouslySetInnerHTML={{ __html: html }} />
      </Card>
    </div>
  );
}
