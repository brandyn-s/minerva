"use client";
import { LoadingStatus } from "../../components/ui/loading-status";
import { receiptSchema } from "../experiments/contracts";
import { useEffect, useRef, useState } from "react";
import { Button, Input, Select } from "../../components/ui/controls";
import PanelHeader from "../../components/ui/panel-header";
import type { Thought, DevelopmentIntent } from "./domain";
import { cardEdit, reviseCard } from "./card-revisions";
import { developmentResultSchema } from "./development";

export default function DevelopPanel({ card, intents, remember, commit, close }: {
  card: Thought; intents: DevelopmentIntent[]; remember: (text: string) => void;
  commit: (previous: Thought, next: Thought) => void; close: () => void;
}) {
  const [intent, setIntent] = useState("");
  const [steps, setSteps] = useState(1);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { controller.current?.abort(); }, []);
  function stop() { controller.current?.abort(); controller.current = null; setRunning(false); setStatus("Stopped. Completed revisions are kept."); }
  async function run(text = intent) {
    const frozen = text.trim();
    if (!frozen || controller.current) return;
    setIntent(frozen); remember(frozen); setNotes([]); setRunning(true);
    const request = new AbortController(); controller.current = request;
    const runId = crypto.randomUUID(); let current = card;
    const priorSteps = card.revisions.filter(r => r.branch?.intent === frozen).map(r => ({ id:card.id, revision:r.number, title: r.title, summary: r.summary, body: r.body, note: r.note ?? "", step: r.branch!.step }));
    try {
      for (let step = 1; step <= steps; step++) {
        setStatus(`Developing step ${step} of ${steps}…`);
        const response = await fetch("/api/develop", { method: "POST", headers: { "Content-Type": "application/json" }, signal: request.signal,
          body: JSON.stringify({ intent: frozen, step, card: { id: current.id, revision: current.revision, title: current.title, summary: current.summary, body: current.body }, priorSteps }) });
        const result = await response.json();
        if (request.signal.aborted) return;
        if (!response.ok) throw new Error(result.error || "Develop failed.");
        const output = developmentResultSchema.parse(result);
        const next = reviseCard(current, { ...cardEdit(current), title: output.title, summary: output.summary, body: output.body }, `branch step ${step} of ${frozen}`, { note: output.note, ...(result.receipt ? { receipt: receiptSchema.parse(result.receipt) } : {}), branch: { intent: frozen, step, runId } });
        commit(current, next); current = next;
        priorSteps.push({ ...output, step, id:next.id, revision:next.revision }); setNotes(previous => [...previous, output.note]);
      }
      setStatus(`${steps} ${steps === 1 ? "step" : "steps"} completed. Revisions are kept in History.`);
    } catch (error) {
      if (!request.signal.aborted) setStatus(`Develop stopped: ${error instanceof Error ? error.message : String(error)} Completed revisions are kept.`);
    } finally {
      if (controller.current === request) { controller.current = null; setRunning(false); }
    }
  }
  return <aside className="detail-panel develop-panel unified-pane" role="dialog" aria-label="Develop idea" onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); stop(); close(); } }}>
    <PanelHeader title="Develop" close={() => { stop(); close(); }} />
    <div className="pane-body">
    <h3 className="pane-title">{card.title}</h3><p>Revise this idea in place. Each completed step stays in History.</p>
    <label>Intent<Input aria-label="Intent" value={intent} maxLength={500} disabled={running} placeholder="Make this cheaper to pilot" onChange={e => setIntent(e.target.value)} /></label>
    <label>Steps<Select aria-label="Steps" value={steps} disabled={running} onChange={e => setSteps(Number(e.target.value))}>{[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}</Select></label>
    <div className="develop-actions"><Button variant="primary" busy={running} disabled={!intent.trim()} onClick={() => void run()}>Start development</Button>{running && <Button onClick={stop}>Stop</Button>}</div>
    {running ? <LoadingStatus title={status} description="Completed revisions stay in History." /> : <p role="status">{status}</p>}
    {notes.length > 0 && <section aria-label="Model claims"><h3>What the model says changed</h3>{notes.map((note, i) => <p key={i}>Step {i + 1} · Model claim: {note}</p>)}</section>}
    {intents.length > 0 && <section aria-label="Reusable intents"><h3>Reuse intent</h3>{intents.map(item => <div className="develop-intent" key={item.id}><p>{item.text}</p><Button disabled={running} aria-label={`Reuse intent: ${item.text}`} onClick={() => void run(item.text)}>Reuse intent</Button></div>)}</section>}
    </div>
  </aside>;
}
