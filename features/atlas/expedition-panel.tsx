"use client";

import { useEffect, useRef, useState } from "react";
import type { Thought } from "./domain";
import { expeditionStepSchema, nearIdentical, validateReading, type ExpeditionStep, type Reading } from "./expedition";
import type { GeneratedCard } from "./generation";

type Run = { goal: string; budget: number; steps: ExpeditionStep[]; stop?: string };
export default function ExpeditionPanel({ open, close, source, cards, add, focus }: {
  open: boolean; close: () => void; source?: Thought; cards: Thought[];
  add: (card: GeneratedCard, parent: Thought, step: number, rationale: string) => Thought;
  focus: (id: string) => void;
}) {
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState(2);
  const [run, setRun] = useState<Run>();
  const [reading, setReading] = useState<{ result: Reading; cards: Thought[] }>();
  const [readingBusy, setReadingBusy] = useState(false);
  const [readingError, setReadingError] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const current = useRef({ cards, add });
  useEffect(() => { current.current = { cards, add }; }, [cards, add]);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => { if (open) panelRef.current?.focus(); }, [open]);
  const controller = useRef<AbortController | null>(null);
  const readingController = useRef<AbortController | null>(null);
  const running = !!run && !run.stop;
  const expeditionCards = (run?.steps ?? []).map(s => ({ ...cards.find(c => c.id === s.id)!, step: s.step }));
  const stale = !!reading && reading.cards.some(card => cards.find(c => c.id === card.id) !== card);
  useEffect(() => () => { controller.current?.abort(); readingController.current?.abort(); }, []);

  async function start() {
    if (!source || !goal.trim() || controller.current || readingController.current) return;
    const abort = new AbortController();
    controller.current = abort;
    const next: Run = { goal, budget, steps: [] };
    setRun({ ...next }); setReading(undefined); setReadingError(""); setNotes([]);
    let frontier = source, repeated = 0;
    try {
      for (let step = 1; step <= next.budget; step++) {
        const prior = next.steps.map(s => current.current.cards.find(c => c.id === s.id) ?? { ...s.card, id: s.id });
        const response = await fetch("/api/expedition", { method: "POST", headers: { "Content-Type": "application/json" }, signal: abort.signal,
          body: JSON.stringify({ goal: next.goal, frontier, cards: prior, step }) });
        const result = await response.json();
        if (abort.signal.aborted) return;
        if (!response.ok) throw new Error(result.error || response.statusText);
        const output = expeditionStepSchema.parse(result);
        const previous = next.steps.at(-1);
        repeated = previous && nearIdentical(previous.card, output.card) ? repeated + 1 : 0;
        frontier = current.current.add(output.card, frontier, step, output.rationale);
        next.steps = [...next.steps, { ...output, id: frontier.id, step }];
        if (output.reached) next.stop = `Model claims the goal appears reached: ${output.reason}`;
        else if (repeated >= 2) next.stop = "Stagnation: two consecutive steps repeated the previous title and summary.";
        else if (step === next.budget) next.stop = "Step budget reached.";
        setRun({ ...next });
        if (next.stop) break;
      }
    } catch (error) {
      if (!abort.signal.aborted) setRun({ ...next, stop: `Stopped after an error: ${error instanceof Error ? error.message : String(error)}` });
    } finally { if (controller.current === abort) controller.current = null; }
  }
  function stop() {
    controller.current?.abort(); controller.current = null;
    setRun(r => r && ({ ...r, stop: "Stopped by you. Completed cards remain on the atlas." }));
  }
  async function read() {
    if (!run?.stop || !expeditionCards.length || readingController.current) return;
    const abort = new AbortController(); readingController.current = abort;
    setReadingBusy(true); setReadingError("");
    try {
      const response = await fetch("/api/reading", { method: "POST", headers: { "Content-Type": "application/json" }, signal: abort.signal,
        body: JSON.stringify({ goal: run.goal, cards: expeditionCards }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || response.statusText);
      setReading({ result: validateReading(result, run.steps.map(s => s.step)), cards: run.steps.map(s => cards.find(c => c.id === s.id)!) });
    } catch (error) { if (!abort.signal.aborted) setReadingError(error instanceof Error ? error.message : String(error)); }
    finally { readingController.current = null; setReadingBusy(false); }
  }
  function links(steps: number[]) {
    return <span className="expedition-links">{steps.map(step => {
      const entry = run!.steps.find(s => s.step === step)!;
      return <button key={step} onClick={() => focus(entry.id)} title={cards.find(c => c.id === entry.id)?.title}>Step {step} ↗</button>;
    })}</span>;
  }
  return <aside ref={panelRef} tabIndex={-1} hidden={!open} className="detail-panel expedition-panel" role="dialog" aria-label="Expedition" onKeyDown={e => {
    if (e.key === "Escape") { e.stopPropagation(); close(); }
  }}>
    <div className="panel-heading"><span className="instrument-label">Expedition</span><button aria-label="Close panel" onClick={close}>×</button></div>
    {!run ? <>
      <h2>Follow a goal</h2>
      <p>From {source?.title ?? "one selected card"}</p>
      <label>Goal in one sentence<input value={goal} onChange={e => setGoal(e.target.value)} /></label>
      <label>Step budget<select aria-label="Step budget" value={budget} onChange={e => setBudget(Number(e.target.value))}>{[2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}</select></label>
      <button disabled={!source || !goal.trim()} onClick={() => void start()}>Start expedition</button>
    </> : <>
      <h2>Following your goal</h2>
      <p className="expedition-goal">{run.goal}</p>
      <p role="status">{run.steps.length} / {run.budget} steps{running ? ` · Generating step ${run.steps.length + 1}…` : ""}</p>
      {running && <button onClick={stop}>Stop</button>}
      <ol className="expedition-steps">{run.steps.map(s => <li key={s.id}>
        {links([s.step])}<p>{s.rationale}</p><p className="small-note">Model self-report: {s.reached ? "goal appears reached" : "goal not yet reached"}. {s.reason}</p>
      </li>)}</ol>
      {run.stop && <>
        <p className="expedition-stop" role="status">{run.stop}</p>
        <button disabled={readingBusy || !run.steps.length} onClick={() => void read()}>{readingBusy ? "Reading…" : reading ? "Re-read" : "What this expedition suggests"}</button>
        <button disabled={readingBusy} onClick={() => setRun(undefined)}>New expedition</button>
        {!run.steps.length && <p>Complete a step to read its cards.</p>}
      </>}
      {readingError && <p role="alert">{readingError}</p>}
      {reading && <section className="expedition-reading" aria-label="What this expedition suggests">
        <h3>What this expedition suggests</h3>
        <p>Model interpretation of speculative cards.</p>
        {stale && <p role="status">Stale reading — an expedition card was edited. Re-read to use its current text.</p>}
        <h4>Shared mechanisms</h4>
        {reading.result.groups.map((g, i) => <section key={i}>
          <p>{g.mechanism}</p>{links(g.steps)}
          <button aria-label={`Challenge group ${i + 1}`} onClick={() => setNotes(n => [...n, `I disagree with the grouping “${g.mechanism}” (steps ${g.steps.join(", ")}).`])}>Challenge</button>
        </section>)}
        <h4>Mechanism changes</h4>
        {!reading.result.changes.length && <p>No mechanism change identified by the model.</p>}
        {reading.result.changes.map((c, i) => <p key={i}>{c.why} {links([c.step])}</p>)}
        {[...reading.result.observations, ...reading.result.hypotheses].map((item, i) => <p key={i}><strong>{item.kind}</strong>: {item.text} {links(item.steps)}</p>)}
        <h4>Two next experiments</h4>
        {reading.result.experiments.map((item, i) => <p key={i}>{item.text} {links(item.steps)}</p>)}
        <h4>Coverage</h4><p>{reading.result.coverage.text} {links(reading.result.coverage.steps)}</p>
      </section>}
      {notes.length > 0 && <section aria-label="User notes"><h3>User notes</h3>{notes.map((note, i) => <p key={i}>User note: {note}</p>)}</section>}
    </>}
  </aside>;
}
