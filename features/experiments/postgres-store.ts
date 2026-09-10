import { stableJson } from "../atlas/stable-json";
import { AsyncLocalStorage } from "node:async_hooks";
import { Pool, type PoolClient } from "pg";
import { runConfigSchema, type RunConfig, type Run, type Attempt, type Assessment, type Candidate, type Reading, type Intervention } from "./contracts";

const pools = new Map<string, Pool>();
// A separate schema keeps the existing Neon resource's application data untouched.
export class PostgresStore {
  private pool: Pool;
  private context = new AsyncLocalStorage<PoolClient>();
  constructor(url: string) { let pool=pools.get(url);if(!pool){pool=new Pool({connectionString:url,max:5});pools.set(url,pool);}this.pool=pool; }
  async query(sql:string,params:unknown[]=[]){return (this.context.getStore()??this.pool).query(sql,params);}
  async initialize(){await this.query(`CREATE SCHEMA IF NOT EXISTS expedition;
    CREATE TABLE IF NOT EXISTS expedition.runs(id text PRIMARY KEY,value jsonb NOT NULL);
    CREATE TABLE IF NOT EXISTS expedition.records(seq bigserial PRIMARY KEY,id text UNIQUE NOT NULL,run_id text NOT NULL,kind text NOT NULL,value jsonb NOT NULL);
    CREATE INDEX IF NOT EXISTS records_run ON expedition.records(run_id,kind,seq);
    CREATE TABLE IF NOT EXISTS expedition.attempts(seq bigserial PRIMARY KEY,id text UNIQUE NOT NULL,run_id text NOT NULL,value jsonb NOT NULL);
    CREATE INDEX IF NOT EXISTS attempts_run ON expedition.attempts(run_id,seq);
    CREATE TABLE IF NOT EXISTS expedition.interventions(seq bigserial PRIMARY KEY,id text UNIQUE NOT NULL,run_id text NOT NULL,value jsonb NOT NULL);`);}
  close() { /* Shared bounded pool survives warm requests. */ }
  async transaction<T>(fn:()=>T):Promise<Awaited<T>> {
    if(this.context.getStore())return await fn();
    const client=await this.pool.connect();
    try{return await this.context.run(client,async()=>{await client.query('BEGIN');try{const value=await fn();await client.query('COMMIT');return value;}catch(error){await client.query('ROLLBACK');throw error;}});}finally{client.release();}
  }
  async lock(id:string){await this.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[id]);}
  async create(config:RunConfig){return this.transaction(async()=>{await this.lock(config.id);const valid=runConfigSchema.parse(config),existing=await this.get(valid.id);if(existing){for(const key of Object.keys(valid) as (keyof RunConfig)[])if(stableJson(existing[key])!==stableJson(valid[key]))throw new Error('Run identity reused with different configuration');return existing;}const run:Run={...valid,version:1,status:'running',calls:0,reservedMicros:0,active:[],createdAt:new Date().toISOString()};await this.query('INSERT INTO expedition.runs VALUES ($1,$2)',[run.id,run]);return run;});}
  async get(id:string):Promise<Run|undefined>{return (await this.query('SELECT value FROM expedition.runs WHERE id=$1'+(this.context.getStore()?' FOR UPDATE':''),[id])).rows[0]?.value;}
  async save(run:Run){await this.query('UPDATE expedition.runs SET value=$2 WHERE id=$1',[run.id,run]);}
  async runs(limit=100):Promise<Run[]>{return (await this.query("SELECT value FROM expedition.runs ORDER BY value->>'createdAt' DESC LIMIT $1",[Math.min(100,limit)])).rows.map(r=>r.value);}
  async runnable():Promise<Run[]>{return (await this.query("SELECT value FROM expedition.runs WHERE value->>'status'='running' AND value->>'execution'='worker' ORDER BY value->>'createdAt' LIMIT 100")).rows.map(r=>r.value);}
  async count(id:string,kind:string){return Number((await this.query('SELECT count(*) AS n FROM expedition.records WHERE run_id=$1 AND kind=$2',[id,kind])).rows[0].n);}
  async last<T>(id:string,kind:string):Promise<T|undefined>{return (await this.query('SELECT value FROM expedition.records WHERE run_id=$1 AND kind=$2 ORDER BY seq DESC LIMIT 1',[id,kind])).rows[0]?.value;}
  async put(kind:string,id:string,runId:string,value:unknown){const result=await this.query('INSERT INTO expedition.records(id,run_id,kind,value) VALUES ($1,$2,$3,$4) ON CONFLICT(id) DO UPDATE SET value=expedition.records.value WHERE expedition.records.value=EXCLUDED.value RETURNING id',[id,runId,kind,value]);if(!result.rowCount)throw new Error('Immutable record conflict');}
  async record<T>(id:string):Promise<T|undefined>{return (await this.query('SELECT value FROM expedition.records WHERE id=$1',[id])).rows[0]?.value;}
  async scopedRecord<T>(runId:string,id:string):Promise<T|undefined>{return (await this.query('SELECT value FROM expedition.records WHERE run_id=$1 AND id=$2',[runId,id])).rows[0]?.value;}
  async all<T>(runId:string,kind:string):Promise<T[]>{return (await this.query('SELECT value FROM expedition.records WHERE run_id=$1 AND kind=$2 ORDER BY seq',[runId,kind])).rows.map(r=>r.value);}
  async page<T>(runId:string,kind:string,after=0,limit=50):Promise<{items:T[];next:number;more:boolean}>{const rows=(await this.query('SELECT seq,value FROM expedition.records WHERE run_id=$1 AND kind=$2 AND seq>$3 ORDER BY seq LIMIT $4',[runId,kind,after,Math.min(200,limit)+1])).rows,chosen=rows.slice(0,limit);return {items:chosen.map(r=>r.value),next:chosen.length?Number(chosen.at(-1)!.seq):after,more:rows.length>limit};}
  async search(runId:string,query:string,after=0,limit=30){const rows=(await this.query("SELECT seq,value FROM expedition.records WHERE run_id=$1 AND kind='candidate' AND seq>$2 AND strpos(lower(value::text),lower($3))>0 ORDER BY seq LIMIT $4",[runId,after,query,limit+1])).rows;return {items:rows.slice(0,limit).map(r=>r.value),next:rows.length?Number(rows.slice(0,limit).at(-1)!.seq):after,more:rows.length>limit};}
  async assessments(runId:string,candidateId:string):Promise<Assessment[]>{return (await this.query("SELECT value FROM expedition.records WHERE run_id=$1 AND kind='assessment' AND value->>'candidateId'=$2 ORDER BY seq DESC LIMIT 5",[runId,candidateId])).rows.map(r=>r.value);}
  async attempts(runId:string):Promise<Attempt[]>{return (await this.query('SELECT value FROM expedition.attempts WHERE run_id=$1 ORDER BY seq',[runId])).rows.map(r=>r.value);}
  async attempt(id:string):Promise<Attempt|undefined>{return (await this.query('SELECT value FROM expedition.attempts WHERE id=$1',[id])).rows[0]?.value;}
  async saveAttempt(a:Attempt){await this.query('INSERT INTO expedition.attempts(id,run_id,value) VALUES ($1,$2,$3) ON CONFLICT(id) DO UPDATE SET value=EXCLUDED.value',[a.id,a.runId,a]);}
  async observeUsage(id:string,owner:string,usage:NonNullable<Attempt['usage']>){await this.query("UPDATE expedition.attempts SET value=jsonb_set(value,'{usage}',$3::jsonb) WHERE id=$1 AND value->>'owner'=$2",[id,owner,JSON.stringify(usage)]);}
  async control(id:string,action:'pause'|'resume'|'stop'){return this.transaction(async()=>{const r=await this.get(id);if(!r)throw new Error('Run unavailable');if(['stopped','completed'].includes(r.status))return r;r.status=action==='pause'?'paused':action==='resume'?'running':'stopped';r.reason=action==='stop'?'Stopped by user; completed results retained':undefined;if(action==='stop')for(const a of (await this.attempts(id)).filter(a=>a.status==='reserved')){a.status='cancelled';a.error='Run stopped; external charge may still occur';await this.saveAttempt(a);}await this.save(r);return r;});}
  async reserve(a:Attempt){return this.transaction(async()=>{const r=await this.get(a.runId);if(!r||r.status!=='running'||await this.attempt(a.id))return false;if(a.sequence!==r.calls+1||(a.maxCallsAtPlanning!==undefined&&a.maxCallsAtPlanning!==r.maxCalls))return false;if((await this.attempts(r.id)).some(a=>a.status==='reserved'))return false;if(r.calls>=r.maxCalls||r.reservedMicros+a.reservedMicros>r.maxCostMicros){r.status='completed';r.reason='Exploration limit reached';await this.save(r);return false;}r.calls++;r.reservedMicros+=a.reservedMicros;await this.save(r);await this.saveAttempt(a);await this.put('operation',a.operation.id,r.id,a.operation);return true;});}
  async recover(now:number){await this.query("UPDATE expedition.attempts SET value=value || $2::jsonb WHERE value->>'status'='reserved' AND (value->>'leaseUntil')::bigint<$1",[now,JSON.stringify({status:'uncertain',error:'Worker lease expired; invocation is not automatically replayed; reservation retained'})]);}
  async finish(id:string,owner:string,candidate?:Candidate|Candidate[],assessment?:Assessment,error?:string){return this.transaction(async()=>{let a=await this.attempt(id);if(!a)return false;const r=await this.get(a.runId);a=await this.attempt(id);if(!a||a.owner!==owner||a.status!=='reserved'||a.leaseUntil<Date.now()||r?.status==='stopped')return false;a.status=error?'failed':'committed';if(error)a.error=error;if(candidate)for(const c of Array.isArray(candidate)?candidate:[candidate])await this.put('candidate',c.id,a.runId,c);if(assessment)await this.put('assessment',assessment.id,a.runId,assessment);await this.saveAttempt(a);return true;});}
  async reading(reading:Reading){await this.put('reading',reading.id,reading.runId,reading);}
  async intervention(i:Intervention){await this.query('INSERT INTO expedition.interventions(id,run_id,value) VALUES ($1,$2,$3) ON CONFLICT(id) DO UPDATE SET value=EXCLUDED.value',[i.id,i.runId,i]);}
  async interventions(runId:string):Promise<Intervention[]>{return (await this.query('SELECT value FROM expedition.interventions WHERE run_id=$1 ORDER BY seq',[runId])).rows.map(r=>r.value);}
}
