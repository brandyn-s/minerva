"use client";

import { Button, Textarea, Select, SegmentedControl, Field } from "../../components/ui/controls";

import FieldGuideHeading from "./field-guide-heading";
import { ArrowRight, ExternalLink } from "../../components/ui/icons";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { Thought } from "./domain";
import { expeditionStepSchema, nearIdentical, validateReading } from "./expedition";
import type { GeneratedCard } from "./generation";

import type { ExpeditionRecord } from "./local-state";
type Run = ExpeditionRecord["run"];
export default function ExpeditionPanel({ open, close, source, cards, add, focus, entries, setEntries, activeEntry, setActiveEntry }: {
  entries: ExpeditionRecord[]; setEntries: Dispatch<SetStateAction<ExpeditionRecord[]>>;
  activeEntry: number | null; setActiveEntry: Dispatch<SetStateAction<number | null>>;
  open: boolean; close: () => void; source?: Thought; cards: Thought[];
  add: (card: GeneratedCard, parent: Thought, step: number, rationale: string) => Thought;
  focus: (id: string) => void;
}) {
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState(2);
  const entry = activeEntry === null ? undefined : entries[activeEntry];
  const run = entry?.run, reading = entry?.reading, notes = entry?.notes ?? [];
  const runIndex = useRef(activeEntry);
  function updateEntry(update: (entry: ExpeditionRecord) => ExpeditionRecord) {
    const index = runIndex.current;
    setEntries(all => all.map((e, i) => i === index ? update(e) : e));
  }
  function setRun(update: Run | ((run: Run) => Run)) {
    updateEntry(e => ({ ...e, run: typeof update === "function" ? update(e.run) : update }));
  }
  function setReading(reading: ExpeditionRecord["reading"]) { updateEntry(e => ({ ...e, reading })); }
  function setNotes(update: (notes: string[]) => string[]) { updateEntry(e => ({ ...e, notes: update(e.notes) })); }
  const [readingBusy, setReadingBusy] = useState(false);
  const [readingError, setReadingError] = useState("");
  const current = useRef({ cards, add });
  useEffect(() => { current.current = { cards, add }; }, [cards, add]);
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => { if (open) panelRef.current?.focus(); }, [open]);
  const controller = useRef<AbortController | null>(null);
  const readingController = useRef<AbortController | null>(null);
  const running = !!run && !run.stop;
  const expeditionCards = (run?.steps ?? []).map(s => ({ ...cards.find(c => c.id === s.id)!, step: s.step }));
  const stale = !!reading && reading.cards.some(card => cards.find(c => c.id === card.id)?.revision !== card.revision || JSON.stringify(cards.find(c => c.id === card.id)) !== JSON.stringify(card));
  useEffect(() => () => { controller.current?.abort(); readingController.current?.abort(); }, []);

  async function start() {
    if (!source || !goal.trim() || controller.current || readingController.current) return;
    const abort = new AbortController();
    controller.current = abort;
    const next: Run = { goal, budget, steps: [] };
    runIndex.current = entries.length; setActiveEntry(entries.length);
    setEntries(all => [...all, { run: { ...next }, notes: [] }]); setReadingError("");
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
    setRun(r => r && ({ ...r, stop: `Stopped by you. Step ${r.steps.length + 1} was cancelled. Completed cards remain on the atlas.` }));
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
      return <Button key={step} onClick={() => focus(entry.id)} title={cards.find(c => c.id === entry.id)?.title}>Step {step} <ExternalLink /></Button>;
    })}</span>;
  }
  return <aside ref={panelRef} tabIndex={-1} hidden={!open} className="detail-panel field-guide expedition-panel" role="dialog" aria-label="Expedition" onKeyDown={e => {
    if (e.key === "Escape") { e.stopPropagation(); close(); }
  }}>
    <FieldGuideHeading title="Expedition" image="/images/expedition-compass.png" close={close} />
    {entries.length > 0 && <label>Expedition history<Select aria-label="Expedition history" disabled={running || readingBusy} value={activeEntry ?? ""} onChange={e => { const index = e.target.value === "" ? null : Number(e.target.value); setActiveEntry(index); runIndex.current = index; }}>
      <option value="">New expedition</option>{entries.map((e, i) => <option key={i} value={i}>{i + 1}. {e.run.goal}</option>)}
    </Select></label>}
    {!run ? <>
      <form className="expedition-setup" onSubmit={event => { event.preventDefault(); void start(); }}>
        <div className="expedition-source-label">Starting from</div>
        <div className="expedition-source">
          {source ? <><h2>{source.title}</h2><p>{source.summary}</p></> : <p>Select one card on the atlas to begin.</p>}
        </div>
        <div className="expedition-destination"><Field label="Where would you like to take this idea?">
          <Textarea rows={3} value={goal} onChange={e => setGoal(e.target.value)} placeholder="Describe the direction you want to explore…" />
        </Field></div>
        <div className="expedition-budget">
          <SegmentedControl label="Maximum steps" options={[2, 3, 4, 5]} value={budget} onChange={setBudget} />
          <p>Each step adds one connected card. It may finish sooner.</p>
        </div>
        <Button variant="primary" className="expedition-start" type="submit" disabled={!source || !goal.trim()}>Start expedition <ArrowRight aria-hidden="true" /></Button>
      </form>
    </> : <>
      <h2>Following your goal</h2>
      <p className="expedition-goal">{run.goal}</p>
      <p role="status">{run.steps.length} / {run.budget} steps{running ? ` · Generating step ${run.steps.length + 1}…` : ""}</p>
      {running && <Button onClick={stop}>Stop</Button>}
      <ol className="expedition-steps">{run.steps.map(s => <li key={s.id}>
        {links([s.step])}<p>{s.rationale}</p><p className="small-note">Model self-report: {s.reached ? "goal appears reached" : "goal not yet reached"}. {s.reason}</p>
      </li>)}</ol>
      {run.stop && <>
        <p className="expedition-stop" role="status">{run.stop}</p>
        <Button disabled={readingBusy || !run.steps.length} onClick={() => void read()}>{readingBusy ? "Reading…" : reading ? "Re-read" : "What this expedition suggests"}</Button>
        <Button disabled={readingBusy} onClick={() => { setActiveEntry(null); runIndex.current = null; }}>New expedition</Button>
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
          <Button aria-label={`Challenge group ${i + 1}`} onClick={() => setNotes(n => [...n, `I disagree with the grouping “${g.mechanism}” (steps ${g.steps.join(", ")}).`])}>Challenge</Button>
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
