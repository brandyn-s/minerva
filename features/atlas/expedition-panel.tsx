"use client";
import { useEffect, useRef, useState } from "react";
import { Button, Textarea, Input, Select, Field } from "../../components/ui/controls";
import FieldGuideHeading from "./field-guide-heading";
import type { Thought } from "./domain";
import type { ExpeditionRecord } from "./local-state";
import type { Run, Candidate, Reading, Operation, Intervention, Assessment } from "../experiments/contracts";

async function request(body:unknown){const response=await fetch("/api/expedition/runs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const value=await response.json();if(!response.ok)throw new Error(value.error);return value;}
type Summary=Pick<Run,"id"|"goal"|"status"|"calls"|"maxCalls"|"provider">;
export default function ExpeditionPanel({open,close,source,entries,inspect}:{open:boolean;close:()=>void;source?:Thought;entries:ExpeditionRecord[];inspect:(candidate:Candidate,operation:Operation)=>void}){
 const [constraints,setConstraints]=useState("");
 const [goal,setGoal]=useState(""),[policy,setPolicy]=useState<Run["policy"]>("diversity"),[provider,setProvider]=useState<Run["provider"]>("fixture"),[calls,setCalls]=useState(12);
 const [probeResult,setProbeResult]=useState<string>(""),[probeModel,setProbeModel]=useState<"central-queue"|"independent-reservations">("central-queue");
 const [ceiling,setCeiling]=useState(0),[runs,setRuns]=useState<Summary[]>([]),[active,setActive]=useState<string|null>(null),[run,setRun]=useState<Run>(),[items,setItems]=useState<Candidate[]>([]);
 const [reading,setReading]=useState<Reading>(),[interventions,setInterventions]=useState<Intervention[]>([]),[error,setError]=useState(""),[transportError,setTransportError]=useState(""),[configured,setConfigured]=useState(false),[busy,setBusy]=useState(false);
 const [candidateTotal,setCandidateTotal]=useState(0),[cursor,setCursor]=useState(0),[next,setNext]=useState(0),[more,setMore]=useState(false),[intent,setIntent]=useState(""),[challenge,setChallenge]=useState(""),[selected,setSelected]=useState<Candidate>(),[assessment,setAssessment]=useState<Assessment>();
 const heading=useRef<HTMLElement>(null);
 useEffect(()=>{if(open)heading.current?.focus();},[open]);
 useEffect(()=>{
  if(!open)return;let disposed=false,inFlight=false;const controller=new AbortController();
  async function refresh(){if(inFlight)return;inFlight=true;try{
    const response=await fetch(`/api/expedition/runs${active?`?id=${active}&after=${cursor}&limit=30`:""}`,{signal:controller.signal});const data=await response.json();if(disposed)return;if(!response.ok)throw new Error(data.error);
    setConfigured(true);setTransportError("");
    if(active){setRun(data.run);setCandidateTotal(data.coverage.candidateCount);setItems(data.items);setNext(data.next);setMore(data.more);setReading(data.readings.at(-1));setInterventions(data.interventions);}
    else setRuns(data.runs);
   }catch(e){if(!disposed){setTransportError(e instanceof Error?e.message:String(e));setConfigured(false);}}finally{inFlight=false;}}
  void refresh();const timer=setInterval(()=>void refresh(),1000);return()=>{disposed=true;controller.abort();clearInterval(timer);};
 },[open,active,cursor]);
 async function act(body:unknown){setBusy(true);setError("");try{return await request(body);}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 async function start(){const config={id:crypto.randomUUID(),goal,constraints:constraints.split("\n").map(s=>s.trim()).filter(Boolean),initial:source?[source]:[],policy,maxCalls:calls,maxCostMicros:Math.round(calls*ceiling*1000000),callReservationMicros:Math.round(ceiling*1000000),capacity:40,seed:1,provider,mode:"explore"};const created=await act({action:"create",config});if(created){setActive(created.id);setCursor(0);setSelected(undefined);setReading(undefined);setItems([]);setRun(created);}}
 async function detail(c:Candidate){setAssessment(undefined);try{const response=await fetch(`/api/expedition/runs?id=${active}&candidateId=${c.id}`);const data=await response.json();if(!response.ok)throw new Error(data.error);setSelected(data.candidate);setAssessment(data.assessments[0]);}catch(e){setError(e instanceof Error?e.message:String(e));}}
 async function onAtlas(c:Candidate){try{const response=await fetch(`/api/expedition/runs?id=${active}&candidateId=${c.id}`);const data=await response.json();if(!response.ok||!data.operation)throw new Error(data.error??"Operation unavailable");inspect(data.candidate,data.operation);}catch(e){setError(e instanceof Error?e.message:String(e));}}
 return <aside ref={heading} tabIndex={-1} hidden={!open} className="detail-panel field-guide expedition-panel" role="dialog" aria-label="Expedition" onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();close();}}}>
  <FieldGuideHeading title="Expedition" image="/images/expedition-compass.png" close={close}/>
  {error&&<p role="alert">{error}</p>}{transportError&&<p role="alert">{transportError}</p>}
  {!active?<>
   <h2>Explore a population of ideas</h2><p>Wander, Weave and Develop share the same operations used directly on the atlas. Results remain in the run; inspect selected evidence on the atlas.</p>
   <form onSubmit={e=>{e.preventDefault();void start();}}>
    <Field label="Exploration goal"><Textarea value={goal} onChange={e=>setGoal(e.target.value)} rows={3}/></Field>
    <Field label="Constraints to preserve (one per line)"><Textarea value={constraints} onChange={e=>setConstraints(e.target.value)} rows={2}/></Field>
    <p>{source?`Starting material: ${source.title}. Independent roots see only the brief.`:"Independent roots start from the brief."}</p>
    <Field label="Search policy"><Select aria-label="Search policy" value={policy} onChange={e=>setPolicy(e.target.value as Run["policy"])}><option value="diversity">Preserve different mechanisms</option><option value="independent">Independent sampling</option><option value="fitness">Develop actionable candidates</option></Select></Field>
    <Field label="Execution"><Select aria-label="Execution" value={provider} onChange={e=>setProvider(e.target.value as Run["provider"])}><option value="fixture">Synthetic rehearsal — no model calls</option><option value="gateway">Live models — configured worker required</option></Select></Field>
    <Field label="Maximum calls, including assessments"><Input type="number" min={2} max={10000} value={calls} onChange={e=>setCalls(Number(e.target.value))}/></Field>
    {provider==="gateway"&&<Field label="Conservative allowance per call (USD)"><Input type="number" min={0.01} step={0.01} value={ceiling} onChange={e=>setCeiling(Number(e.target.value))}/></Field>}
    <p>Assessments consume calls too. Live allowances are reserved upper bounds, not measured charges.</p>
    <Button type="submit" variant="primary" disabled={!configured||busy||!goal.trim()}>Start expedition</Button>
   </form>
   <h3>Saved runs</h3>{runs.map(r=><p key={r.id}><Button onClick={()=>{setActive(r.id);setCursor(0);setSelected(undefined);setReading(undefined);setItems([]);}}>{r.goal}</Button> · {r.status} · {r.calls}/{r.maxCalls} · {r.provider}</p>)}
   {!!entries.length&&<section><h3>Earlier browser expeditions</h3><p>Historical results remain in the atlas export. These browser runs cannot resume as durable runs.</p>{entries.map((e,i)=><p key={i}>{e.run.goal} · {e.run.steps.length} steps · {e.run.stop??"Interrupted browser run"}</p>)}</section>}
  </>:<>
   <Button onClick={()=>{setActive(null);setRun(undefined);setSelected(undefined);}}>All expeditions</Button>
   <h2>{run?.goal}</h2><p role="status">{run?.status} · {run?.calls}/{run?.maxCalls} calls · {run?.provider==="fixture"?"Synthetic rehearsal":"Live model proposals"}</p>
   <p>{run?.reason}</p>{!!run?.constraints.length&&<p>Preserve: {run.constraints.join("; ")}</p>}<p>Reserved allowance: ${((run?.reservedMicros??0)/1000000).toFixed(2)}. Uncertain invocations retain their reservation.</p>
   {run?.status==="running"&&<Button disabled={busy} onClick={()=>void act({action:"pause",id:active})}>Pause</Button>}
   {run?.status==="paused"&&<Button disabled={busy} onClick={()=>void act({action:"resume",id:active})}>Resume</Button>}
   {(run?.status==="running"||run?.status==="paused")&&<Button disabled={busy} onClick={()=>void act({action:"stop",id:active})}>Stop</Button>}
   <h3>Candidate revisions</h3><p>Showing at most 30 records. Population retention does not delete history.</p>
   {items.map(c=><p key={c.id}><Button onClick={()=>void detail(c)}>{c.snapshot.title}</Button> · revision {c.snapshot.revision}</p>)}
   {!!cursor&&<Button onClick={()=>setCursor(0)}>First page</Button>}{more&&<Button onClick={()=>setCursor(next)}>Next page</Button>}
   {selected&&<section aria-label="Candidate evidence"><h3>{selected.snapshot.title}</h3><p>{selected.snapshot.body}</p><p>{assessment?`Textual assessment: ${assessment.mechanism}. ${assessment.explanation}`:"Assessment not in this bounded page; no success claim."}</p>{assessment&&<blockquote>{assessment.evidence}</blockquote>}<p>{selected.parents.length} parents; {selected.exposure.length} other exposed sources.</p><Button onClick={()=>void onAtlas(selected)}>Inspect on atlas</Button><Button disabled={busy} onClick={()=>void act({action:"reassess",id:active,candidateId:selected.id,reason:"User requested another assessment; previous judgments retained",additionalCalls:1})}>Reassess — add 1 call</Button><p>Another judgment from the configured assessor is not independent validation.</p><Field label="Explicit toy model for this idea"><Select aria-label="Explicit toy model for this idea" value={probeModel} onChange={e=>setProbeModel(e.target.value as typeof probeModel)}><option value="central-queue">Central queue</option><option value="independent-reservations">Independent reservations</option></Select></Field><p>Two requests of 4 against capacity 5. This tests the selected model, not the truth of the idea.</p><Button onClick={async()=>{const p=await act({action:"probe",input:{runId:active,candidateId:selected.id,model:probeModel,capacity:5,requests:[4,4]}});if(p){setReading(p.reading);setProbeResult(`Observed ${p.total} allocated; capacity ${p.capacityPreserved?"preserved":"exceeded"}. ${p.limitation}`);}}}>Run allocation probe — no model calls</Button>{probeResult&&<p role="status">{probeResult}</p>}</section>}
   <Button disabled={busy} onClick={async()=>{const r=await act({action:"analyze",id:active});if(r)setReading(r);}}>What this expedition suggests</Button>
   {reading&&<section aria-label="What this expedition suggests"><h3>What this expedition suggests</h3><p>{reading.coverage.assessed}/{reading.coverage.candidates} revisions assessed. Lens: {reading.representation}. Showing up to 20 groups and 5 references per group.</p>{candidateTotal>reading.through&&<p>Reading may exclude recent or unassessed revisions.</p>}{reading.groups.slice(0,20).map(g=><p key={g.representative}>{g.status}: {g.mechanism} · {g.candidateCount??g.candidates.length} revisions · {g.independent?"Independent root returns; shared brief/model":"Shared-path or insufficient independence evidence"}</p>)}{reading.probes?.map(p=><p key={p.id}>Simulation evidence: {p.model} {p.capacityPreserved?"preserved":"exceeded"} capacity. Candidate {p.candidateId}.</p>)}{reading.limitations.map(l=><p className="small-note" key={l}>{l}</p>)}<p>{reading.preview?.totalUnusual??reading.unusual.length} unusual or unassessed revisions retained.</p>
    <Field label="Challenge this reading"><Textarea value={challenge} onChange={e=>setChallenge(e.target.value)}/></Field><Field label="Intervention to test on selected candidate"><Textarea value={intent} onChange={e=>setIntent(e.target.value)}/></Field><p>The test preserves the original goal and constraints and adds two calls to its allowance.</p>
    <Button disabled={busy||!selected||!challenge.trim()||!intent.trim()} onClick={()=>void act({action:"intervene",id:active,readingId:reading.id,candidateId:selected?.id,challenge,intent,operationKind:"develop",additionalCalls:2})}>Test intervention — add 2 calls</Button>
   </section>}
   {interventions.map(i=><section key={i.id}><h4>Intervention: {i.status}</h4><p>{i.challenge}</p><p>{i.outcome??"Pending experiment; challenge is not assumed true."}</p></section>)}
  </>}
 </aside>;
}
