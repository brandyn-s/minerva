import { z } from "zod";
import { snapshotSchema, runConfigSchema } from "./contracts";
export const startSchema=z.object({id:z.string().uuid(),limitMicros:z.number().int().min(1000000).max(6000000).optional(),sources:z.array(snapshotSchema).max(8).default([]),direction:z.string().trim().max(1000).default(""),brief:z.string().max(1600).default(""),constraints:z.array(z.string().max(1000)).max(30).default([])}).refine(v=>v.sources.length>0||!!v.direction,'Select an idea or add a direction');
export function startConfig(raw:z.infer<typeof startSchema>,settings:{provider:'fixture'|'gateway';maxCalls:number;maxCostMicros:number;callReservationMicros:number},owner?:string){
 const input=startSchema.parse(raw);
 const starting=input.sources.map(s=>`${s.title}: ${s.summary}`).join('\n').slice(0,1600);
 const goal=(input.brief.trim()||starting||input.direction).slice(0,1600);
 const budget=settings.provider==="fixture"?0:Math.min(settings.maxCostMicros,input.limitMicros??settings.maxCostMicros);
 return runConfigSchema.parse({id:input.id,title:(input.direction||`Explore ${input.sources.map(s=>s.title).join(", ")}`).slice(0,200),goal,direction:input.direction,owner,constraints:input.constraints,initial:input.sources,policy:'diversity',capacity:40,seed:1,mode:'explore',...settings,maxCostMicros:budget,maxCalls:settings.provider==="fixture"?settings.maxCalls:Math.min(settings.maxCalls,Math.floor(budget/settings.callReservationMicros))});
}
