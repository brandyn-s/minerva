import type { Thought, Relationship } from "../atlas/domain";
import { firstRevision, reviseCard, cardEdit } from "../atlas/card-revisions";
import type { Candidate, Operation } from "./contracts";
import { validateWeaveMappings } from "./weave";
import { resolveSnapshot } from "../atlas/weave";
export function materialize(candidate:Candidate,operation:Operation,cards:Thought[]):{card:Thought;edges:Relationship[];sources:Thought[]} {
  if(operation.weave)validateWeaveMappings(operation.weave,candidate.weaveMappings??[],candidate.snapshot);
  const existing=cards.find(c=>c.revisions.some(r=>r.experiment?.candidateId===candidate.id));
  if(existing)return {card:existing,edges:[],sources:[]};
  const base=operation.sources[0], target=cards.find(c=>c.id===candidate.snapshot.id);
  const experiment={candidateId:candidate.id,operation};
  if(operation.kind==="develop"&&target&&base&&target.revision===base.revision&&target.title===base.title&&target.summary===base.summary&&target.body===base.body){
    return {card:reviseCard(target,{...cardEdit(target),...candidate.snapshot,revision:target.revision,contribution:candidate.snapshot.contribution??target.contribution},`Develop · Expedition`,{experiment}),edges:[],sources:[]};
  }
  const sourceCards:Thought[]=[];
  const sourceRefs=operation.sources.map(s=>{
    const original=resolveSnapshot(s,cards);
    if(original)return {id:original.id,revision:s.revision};
    let id=`snapshot-${s.id}-${s.revision}`;
    const same = cards.find(c=>c.id===id);
    if(same && (same.title!==s.title || same.summary!==s.summary || same.body!==s.body)) id=`snapshot-${crypto.randomUUID()}`;
    if(!cards.some(c=>c.id===id))sourceCards.push({...s,id,revision:1,revisions:[firstRevision(s,`Imported source snapshot of revision ${s.revision}`)],kind:"proposal",contribution:s.contribution??"Unknown",move:{title:"Explore this direction",question:"What could change?",preview:s.summary}});
    return {id,revision:1};
  });
  const snapshot=candidate.snapshot,id=candidate.id;
  const card:Thought={...snapshot,id,revision:1,revisions:[{...firstRevision(snapshot,`${operation.kind} · Expedition${operation.kind==="develop"?" (separate result; source changed or unavailable)":""}`),experiment,...(candidate.weaveMappings?{weaveMappings:candidate.weaveMappings}:{})}],kind:operation.kind==="weave"?"recombination":"exploration",contribution:snapshot.contribution??"Generated proposal",provenance:{feature:`Expedition / ${operation.kind}`,tag:"feature:expedition",sourceTitles:operation.sources.map(s=>s.title)},move:{title:"Explore this direction",question:"Where could this lead?",preview:snapshot.summary}};
  const edges:Relationship[]=sourceRefs.map((s,i)=>({id:`${id}-source-${i}`,from:s.id,to:id,sourceRevision:s.revision,kind:operation.kind==="weave"?"recombination":"derivation",label:`${operation.kind} · source revision ${operation.sources[i].revision}`}));
  return {card,edges,sources:sourceCards};
}
