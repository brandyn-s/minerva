"use client";
import { LoadingStatus } from "../../components/ui/loading-status";
import ExpeditionLenses from "./expedition-lenses";
import ExpeditionSuggestions from "./expedition-suggestions";
import { useEffect, useRef, useState } from "react";
import { Button, Textarea, Input, Select, Field, Summary } from "../../components/ui/controls";
import FieldGuideHeading from "./field-guide-heading";
import type { Thought } from "./domain";
import type { ExpeditionRecord } from "./local-state";
import type { Run, Candidate, Reading, Operation, Intervention, Assessment } from "../experiments/contracts";

async function request(body:unknown){const response=await fetch("/api/expedition/runs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const value=await response.json();if(!response.ok)throw new Error(value.error);return value;}
type RunSummary=Pick<Run,"id"|"title"|"goal"|"status"|"calls"|"maxCalls"|"provider">;
export default function ExpeditionPanel({open,close,sources,brief,entries,inspect}:{open:boolean;close:()=>void;sources:Thought[];brief:string;entries:ExpeditionRecord[];inspect:(candidate:Candidate,operation:Operation)=>void}){
 const [loadedRequest,setLoadedRequest]=useState<string>(),[detailLoading,setDetailLoading]=useState(0),[activity,setActivity]=useState("Updating expedition…");
 const [selectedOperation,setSelectedOperation]=useState<Operation>();
 const [showLenses,setShowLenses]=useState(false);
 const [direction,setDirection]=useState("");
 const [limit,setLimit]=useState<number>();
 const [savedLimit,setSavedLimit]=useState(6);

 const [probeResult,setProbeResult]=useState<string>(""),[probeModel,setProbeModel]=useState<"central-queue"|"independent-reservations">("central-queue");
 const [runs,setRuns]=useState<RunSummary[]>([]),[active,setActive]=useState<string|null>(null),[run,setRun]=useState<Run>(),[items,setItems]=useState<Candidate[]>([]);
 const [reading,setReading]=useState<Reading>(),[interventions,setInterventions]=useState<Intervention[]>([]),[error,setError]=useState(""),[transportError,setTransportError]=useState(""),[configured,setConfigured]=useState(false),[busy,setBusy]=useState(false);
 const [candidateTotal,setCandidateTotal]=useState(0),[cursor,setCursor]=useState(0),[next,setNext]=useState(0),[more,setMore]=useState(false),[intent,setIntent]=useState(""),[challenge,setChallenge]=useState(""),[selected,setSelected]=useState<Candidate>(),[assessment,setAssessment]=useState<Assessment>();
 const suggestionContext=JSON.stringify({brief:brief.slice(0,1600),sources:sources.slice(0,8).map(({id,revision,title,summary,body})=>({id,revision,title,summary:summary.slice(0,1000),body:body.slice(0,4000)}))});
 const requestKey=`${active??"list"}:${cursor}`, loading=loadedRequest!==requestKey;
 const heading=useRef<HTMLElement>(null);
 useEffect(()=>{if(open)heading.current?.focus();},[open]);
 useEffect(()=>{
  if(!open)return;let disposed=false,inFlight=false;const controller=new AbortController();
  async function refresh(){if(inFlight)return;inFlight=true;try{
    const response=await fetch(`/api/expedition/runs${active?`?id=${active}&after=${cursor}&limit=30`:""}`,{signal:controller.signal});const data=await response.json();if(disposed)return;if(!response.ok)throw new Error(data.error);
    setConfigured(true);setTransportError("");
    if(active){setRun(data.run);setCandidateTotal(data.coverage.candidateCount);setItems(data.items);setNext(data.next);setMore(data.more);setReading(data.readings.at(-1));setInterventions(data.interventions);}
    else {setRuns(data.runs);setLimit(data.limitMicros);try{const saved=Number(localStorage.getItem("minerva-expedition-limit")??6);if(Number.isFinite(saved)&&saved>=1&&saved<=6)setSavedLimit(saved);}catch{}}
   }catch{if(!disposed){setTransportError("Expedition is temporarily unavailable. Your ideas are still saved.");setConfigured(false);}}finally{inFlight=false;if(!disposed)setLoadedRequest(requestKey);}}
  void refresh();const timer=setInterval(()=>void refresh(),1000);return()=>{disposed=true;controller.abort();clearInterval(timer);};
 },[open,active,cursor,requestKey]);
 async function act(body:unknown){const labels:Record<string,string>={start:"Starting expedition…",pause:"Pausing expedition…",resume:"Resuming expedition…",stop:"Stopping expedition…",reassess:"Assessing this idea…",analyze:"Reading the expedition…",intervene:"Exploring this direction…",probe:"Running the probe…"};setActivity(labels[(body as {action:string}).action]??"Updating expedition…");setBusy(true);setError("");try{return await request(body);}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}}
 async function start(){const created=await act({action:"start",input:{id:crypto.randomUUID(),limitMicros:Math.round(savedLimit*1000000),direction,brief:brief.slice(0,1600),sources:sources.slice(0,8).map(({id,revision,title,summary,body,contribution})=>({id,revision,title,summary,body,contribution}))}});if(created){setActive(created.id);setCursor(0);setSelected(undefined);setReading(undefined);setItems([]);setRun(created);}}
 async function detail(c:Candidate){setDetailLoading(n=>n+1);setAssessment(undefined);setSelectedOperation(undefined);try{const response=await fetch(`/api/expedition/runs?id=${active}&candidateId=${c.id}`);const data=await response.json();if(!response.ok)throw new Error(data.error);setSelected(data.candidate);setSelectedOperation(data.operation);setAssessment(data.assessments[0]);}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setDetailLoading(n=>n-1);}}
 async function onAtlas(c:Candidate){setDetailLoading(n=>n+1);try{const response=await fetch(`/api/expedition/runs?id=${active}&candidateId=${c.id}`);const data=await response.json();if(!response.ok||!data.operation)throw new Error(data.error??"Operation unavailable");inspect(data.candidate,data.operation);}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setDetailLoading(n=>n-1);}}
 return <aside ref={heading} tabIndex={-1} hidden={!open} className="detail-panel expedition-panel unified-pane" role="dialog" aria-label="Expedition" onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();close();}}}>
  <FieldGuideHeading title="Expedition" close={close}/>
  <div className="pane-body">
  {error&&<p role="alert">{error}</p>}{transportError&&<p role="alert">{transportError}</p>}
  {loading&&<LoadingStatus title={active?"Loading expedition…":"Loading expeditions…"} />}
  {busy&&<LoadingStatus title={activity} />}
  {detailLoading>0&&<LoadingStatus title="Loading idea evidence…" />}
  {!active?<>
   <h2>Explore further</h2>
   {sources.length>8&&<p className="small-note">Using the first eight selected ideas.</p>}
   {sources.length>0?<p>Starting from {sources.slice(0,8).map(s=>s.title).join(", ")}.</p>:<p>Select an idea, or give Minerva a direction to explore.</p>}
   {open&&(sources.length>0||!!brief.trim())&&<ExpeditionSuggestions key={suggestionContext} context={suggestionContext} choose={setDirection} direction={direction}/>}
   <form onSubmit={e=>{e.preventDefault();void start();}}>
    <Field label="Direction (optional)"><Textarea aria-label="Direction (optional)" value={direction} onChange={e=>setDirection(e.target.value)} placeholder="More abstract, unexpected connections, easier to try…" rows={2}/></Field>
    <p>Minerva will explore alternatives, combine ideas and assess what emerges.</p>
    {limit!==undefined&&<p className="small-note">{limit===0?"Test session · no model charges":`Up to $${savedLimit.toFixed(2)} per expedition`}. Pause or stop anytime.</p>}
    {limit!==undefined&&limit>0&&<details><Summary>Spending limit</Summary><Field label="Limit per expedition (USD)"><Input type="number" min={1} max={6} step={0.5} value={savedLimit} onChange={e=>{const value=Number(e.target.value);if(value>=1&&value<=6){setSavedLimit(value);try{localStorage.setItem("minerva-expedition-limit",String(value));}catch{}}}}/></Field></details>}
    <Button type="submit" variant="primary" disabled={!configured||busy||(!sources.length&&!direction.trim())}>Start expedition</Button>
   </form>
   <h3>Saved runs</h3>{runs.map(r=><p key={r.id}><Button onClick={()=>{setActive(r.id);setCursor(0);setSelected(undefined);setReading(undefined);setItems([]);}}>{r.title??r.goal}</Button> · {r.status}</p>)}
   {!!entries.length&&<section><h3>Earlier browser expeditions</h3><p>Historical results remain in the atlas export. These browser runs cannot resume as durable runs.</p>{entries.map((e,i)=><p key={i}>{e.run.goal} · {e.run.steps.length} steps · {e.run.stop??"Interrupted browser run"}</p>)}</section>}
  </>:<>
   <Button onClick={()=>{setActive(null);setRun(undefined);setSelected(undefined);}}>All expeditions</Button>
   <h2>{run?.title??run?.goal}</h2>{run?.status==="running"?<LoadingStatus title="Expedition is exploring new ideas…" description={`${candidateTotal} ideas explored. You can pause or stop anytime.`} />:<p role="status">{run?.status} · {candidateTotal} ideas explored</p>}
   <p>{run?.reason}</p>{!!run?.constraints.length&&<p>Preserve: {run.constraints.join("; ")}</p>}
   {run?.status==="running"&&<Button disabled={busy} onClick={()=>void act({action:"pause",id:active})}>Pause</Button>}
   {run?.status==="paused"&&<Button disabled={busy} onClick={()=>void act({action:"resume",id:active})}>Resume</Button>}
   {(run?.status==="running"||run?.status==="paused")&&<Button disabled={busy} onClick={()=>void act({action:"stop",id:active})}>Stop</Button>}
   <Button aria-expanded={showLenses} onClick={()=>setShowLenses(v=>!v)}>{showLenses?"Close expedition lenses":"Edit expedition lenses"}</Button>
   {showLenses&&<ExpeditionLenses key={active} runId={active} runStatus={run?.status}/>}
   <h3>Ideas explored</h3>
   {items.map(c=><p key={c.id}><Button onClick={()=>void detail(c)}>{c.snapshot.title}</Button> · revision {c.snapshot.revision}</p>)}
   {!!cursor&&<Button onClick={()=>setCursor(0)}>First page</Button>}{more&&<Button onClick={()=>setCursor(next)}>Next page</Button>}
   {selected&&<section aria-label="Candidate evidence"><h3>{selected.snapshot.title}</h3><p>{selected.snapshot.body}</p><p>{assessment?`Textual assessment: ${assessment.mechanism}. ${assessment.explanation}`:"Assessment not in this bounded page; no success claim."}</p>{assessment&&<blockquote>{assessment.evidence}</blockquote>}<p>{selected.parents.length} parents; {selected.exposure.length} other exposed sources.</p>{selectedOperation?.selection&&<details><Summary>Selection context</Summary><p>Applied lens revision {selectedOperation.selection.lensRevision} · selection {selectedOperation.selection.revision} · step {selectedOperation.selection.step}.</p><p>{selectedOperation.selection.reason}</p><ul>{selectedOperation.sources.map((source,i)=><li key={i}>{source.title} · source revision {source.revision} · candidate {selectedOperation.selection!.parentIds[i]}</li>)}</ul><p className="small-note">Policy: {selectedOperation.selection.policy}. Configuration {selectedOperation.selection.configurationId}.</p></details>}<Button onClick={()=>void onAtlas(selected)}>Inspect on atlas</Button><Button disabled={busy} onClick={()=>void act({action:"reassess",id:active,candidateId:selected.id,reason:"User requested another assessment; previous judgments retained",additionalCalls:1})}>Assess again{run?.provider==="gateway"?" · up to $0.50":""}</Button><p>Another judgment from the configured assessor is not independent validation.</p><Field label="Explicit toy model for this idea"><Select aria-label="Explicit toy model for this idea" value={probeModel} onChange={e=>setProbeModel(e.target.value as typeof probeModel)}><option value="central-queue">Central queue</option><option value="independent-reservations">Independent reservations</option></Select></Field><p>Two requests of 4 against capacity 5. This tests the selected model, not the truth of the idea.</p><Button onClick={async()=>{const p=await act({action:"probe",input:{runId:active,candidateId:selected.id,model:probeModel,capacity:5,requests:[4,4]}});if(p){setReading(p.reading);setProbeResult(`Observed ${p.total} allocated; capacity ${p.capacityPreserved?"preserved":"exceeded"}. ${p.limitation}`);}}}>Run allocation probe — no model calls</Button>{probeResult&&<p role="status">{probeResult}</p>}</section>}
   <Button disabled={busy} onClick={async()=>{const r=await act({action:"analyze",id:active});if(r)setReading(r);}}>What this expedition suggests</Button>
   {reading&&<section aria-label="What this expedition suggests"><h3>What this expedition suggests</h3><p>{reading.coverage.assessed}/{reading.coverage.candidates} revisions assessed. Lens: {reading.representation}. Showing up to 20 groups and 5 references per group.</p>{candidateTotal>reading.through&&<p>Reading may exclude recent or unassessed revisions.</p>}{reading.groups.slice(0,20).map(g=><p key={g.representative}>{g.status}: {g.mechanism} · {g.candidateCount??g.candidates.length} revisions · {g.independent?"Independent root returns; shared brief/model":"Shared-path or insufficient independence evidence"}</p>)}{reading.probes?.map(p=><p key={p.id}>Simulation evidence: {p.model} {p.capacityPreserved?"preserved":"exceeded"} capacity. Candidate {p.candidateId}.</p>)}{reading.limitations.map(l=><p className="small-note" key={l}>{l}</p>)}<p>{reading.preview?.totalUnusual??reading.unusual.length} unusual or unassessed revisions retained.</p>
    <Field label="Challenge this reading"><Textarea value={challenge} onChange={e=>setChallenge(e.target.value)}/></Field><Field label="Intervention to test on selected candidate"><Textarea value={intent} onChange={e=>setIntent(e.target.value)}/></Field><p>The test preserves the original goal and constraints.{run?.provider==="gateway"?" It adds up to $1 to this expedition’s limit.":""}</p>
    <Button disabled={busy||!selected||!challenge.trim()||!intent.trim()} onClick={()=>void act({action:"intervene",id:active,readingId:reading.id,candidateId:selected?.id,challenge,intent,operationKind:"develop",additionalCalls:2})}>Try this direction</Button>
   </section>}
   {interventions.map(i=><section key={i.id}><h4>Intervention: {i.status}</h4>{(i.status==="running"||i.status==="proposed")&&<LoadingStatus title={i.status==="running"?"Testing this direction…":"Preparing this direction…"} />}<p>{i.challenge}</p><p>{i.outcome??"Pending experiment; challenge is not assumed true."}</p></section>)}
  </>}
  </div>
 </aside>;
}
