"use client";
import { LoadingStatus } from "../../components/ui/loading-status";
import {useEffect,useState} from "react";
import {Button} from "../../components/ui/controls";
import {suggestionsSchema} from "../experiments/suggestions";
type Result=ReturnType<typeof suggestionsSchema.parse>;
// Reopening a panel with unchanged context does not make another model call.
const requests=new Map<string,Promise<Result>>();
function load(context:string){
 let pending=requests.get(context);
 if(!pending){pending=fetch('/api/expedition/suggestions',{method:'POST',headers:{'Content-Type':'application/json'},body:context}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error('Suggestions unavailable');return suggestionsSchema.parse(body);});requests.set(context,pending);void pending.catch(()=>requests.delete(context));if(requests.size>20)requests.delete(requests.keys().next().value!);}
 return pending;
}
export default function ExpeditionSuggestions({context,choose,direction}:{context:string;choose:(direction:string)=>void;direction:string}){
 const [result,setResult]=useState<Result>(),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{let active=true;void load(context).then(value=>{if(active)setResult(value);},()=>{if(active)setFailed(true);});return()=>{active=false;};},[context,retry]);
 return <section aria-label="Suggested directions">
  {!result&&!failed&&<LoadingStatus title="Finding three directions…" />}
  {failed&&<><p className="small-note">Suggestions unavailable. You can still start.</p><Button onClick={()=>{setFailed(false);setRetry(n=>n+1);}}>Retry suggestions</Button></>}
  {result?.suggestions.map(s=><Button key={s.title} type="button" aria-pressed={direction===s.direction} title={s.direction} onClick={()=>choose(s.direction)}>{s.title}</Button>)}
 </section>;
}
