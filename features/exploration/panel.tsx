"use client";
import { useEffect, useState } from "react";
import type { Thought } from "../atlas/domain";
import type { Manifest, ProposalArtifact, Assessment } from "./domain";

type RunView = { id: string; state: string; error: string | null };
type AttemptView = { runId: string; slot: number; purpose: string; status: string; proposalId: string; error: string | null; artifact: ProposalArtifact | Assessment | null };
async function request(body: unknown) {
  const result = await fetch("/internal/exploration", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await result.json();
  if (!result.ok) throw Object.assign(new Error(data.error), { status: result.status });
  return data;
}
function useCommand() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<unknown>(null);
  async function act(body: unknown) {
    setBusy(true); setPending(body);
    try { const result = await request(body); setPending(null); setMessage("Saved. You can keep working in the atlas."); return result; }
    catch (error) {
      if (error && typeof error === "object" && "status" in error && Number(error.status) < 500) setPending(null);
      setMessage(error instanceof Error ? error.message : "Request interrupted.");
    } finally { setBusy(false); }
  }
  return { message, busy, pending, act };
}
export default function ExplorationPanel({ workspaceId, sources, inspect }: { workspaceId: string; sources: Thought[]; inspect: (id: string) => void }) {
  const [change, setChange] = useState("Develop two distinct alternatives while retaining useful source contributions.");
  const [preview, setPreview] = useState<{ id: string; hash: string; content: Manifest } | null>(null);
  const [state, setState] = useState<{ runs: RunView[]; attempts: AttemptView[] }>({ runs: [], attempts: [] });
  const { message, busy, pending, act } = useCommand();
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const result = await fetch(`/internal/exploration?workspaceId=${workspaceId}`, { cache: "no-store", signal: controller.signal });
        if (result.ok) setState(await result.json());
      } catch { /* Keep the last saved state during a transient disconnect. */ }
      if (!controller.signal.aborted) timer = setTimeout(poll, 2500);
    }
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [workspaceId]);
  return <>
    <h2>Develop alternatives</h2>
    <p>{sources.length ? `${sources.length} selected sources.` : "Brief only; no idea or archive content is included."}</p>
    <label htmlFor="desired-change">Desired change</label>
    <textarea id="desired-change" rows={4} maxLength={2000} value={change} onChange={(e) => { setChange(e.target.value); setPreview(null); }} />
    <button disabled={busy || !!pending} onClick={() => { void act({ operation: "preview", workspaceId, change,
      sources: sources.map(({ id, revision }) => ({ id, revision })) }).then((result) => { if (result) setPreview(result); }); }}>Preview exact input</button>
    {preview && <section><h3>Frozen input</h3><p>{preview.content.brief}</p><p>Constraints: {preview.content.constraints || "None stated"}</p>
      {preview.content.sources.map((source) => <details key={source.id}><summary>{source.title} · revision {source.revision}</summary><p>{source.text}</p></details>)}
      <p>Archive excluded. Model: {preview.content.profile.id}. Two alternatives and assessments reserve $0.20 of the M2 allowance.</p>
      <button disabled={busy || !!pending} onClick={() => { void act({ operation: "start", commandId: crypto.randomUUID(), manifestId: preview.id, hash: preview.hash }); }}>Generate two alternatives</button>
    </section>}
    {message && <p role="status">{message}</p>}
    {!!pending && <button disabled={busy} onClick={() => { void act(pending).then((result) => { if (result?.content) setPreview(result); }); }}>Retry same request</button>}
    <h3>Saved runs</h3>
    {state.runs.map((run) => <section key={run.id} className="run-card"><strong>{run.state}</strong><p>{run.error}</p>
      {!['completed', 'failed', 'stopped'].includes(run.state) && <div>
        {(run.state === "awaiting-input" ? ["resume", "stop", "recover"] : ["pause", "stop", "recover"]).map((action) =>
          <button key={action} disabled={busy || !!pending} onClick={() => { void act({ operation: "control", commandId: crypto.randomUUID(), runId: run.id, action }); }}>{action === "recover" ? "Reconcile interrupted run" : action}</button>)}
        <p>Already admitted calls may finish. Closing this panel does not stop the run.</p>
      </div>}
      {state.attempts.filter((a) => a.runId === run.id).map((a) => <div key={`${a.slot}-${a.purpose}`}>
        <p>Alternative {a.slot + 1} · {a.purpose} · {a.status}</p>{a.error && <p>{a.error}</p>}
        {a.purpose === "generate" && a.status === "completed" && <button onClick={() => inspect(a.proposalId)}>Inspect {(a.artifact as ProposalArtifact).title}</button>}
        {a.purpose === "assess" && a.artifact && <p>{(a.artifact as Assessment).state}: {(a.artifact as Assessment).transformation}</p>}
      </div>)}
    </section>)}
  </>;
}
export function ProposalDecisions({ workspaceId, thought }: { workspaceId: string; thought: Thought }) {
  const [unreviewed, setUnreviewed] = useState(false);
  const [historical, setHistorical] = useState(false);
  const { message, busy, pending, act } = useCommand();
  return <section><h3>Your decision</h3>
    <label><input type="checkbox" checked={unreviewed} onChange={(e) => setUnreviewed(e.target.checked)} />I acknowledge this revision may be unreviewed.</label>
    <label><input type="checkbox" checked={historical} onChange={(e) => setHistorical(e.target.checked)} />Keep a separate branch from historical source revisions.</label>
    <div className="panel-actions">{[["kept", "Keep this revision"], ["set aside", "Set aside"], ["unkept draft", "Undo decision"]].map(([decision, label]) =>
      <button key={decision} disabled={busy || !!pending} onClick={() => { void act({ operation: "decide", commandId: crypto.randomUUID(), workspaceId, ideaId: thought.id,
        revision: thought.revision, decision, historicalContext: historical, acknowledgeUnreviewed: unreviewed }); }}>{label}</button>)}
      {!!pending && <button disabled={busy} onClick={() => { void act(pending); }}>Retry same decision</button>}</div>
    {message && <p role="status">{message}</p>}
  </section>;
}
