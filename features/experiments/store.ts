import { stableJson } from "../atlas/stable-json";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname } from "node:path";
import { type Run, type RunConfig, runConfigSchema, type Attempt, type Candidate, type Assessment, type Reading, type Intervention } from "./contracts";

// Single-host adapter. Atomic transactions coordinate separate HTTP and worker processes.
// Never use an ephemeral serverless filesystem as durable storage.
export class ExperimentStore {
  private db: DatabaseSync;
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path); chmodSync(path, 0o600);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS records(seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT UNIQUE NOT NULL, run_id TEXT NOT NULL, kind TEXT NOT NULL, value TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS records_run ON records(run_id,kind,seq);
      CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY, run_id TEXT NOT NULL, value TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS attempts_run ON attempts(run_id);
      CREATE TABLE IF NOT EXISTS interventions(id TEXT PRIMARY KEY, run_id TEXT NOT NULL, value TEXT NOT NULL);`);
  }
  close() { this.db.close(); }
  transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try { const result = fn(); if (result instanceof Promise) return result.then(value=>{this.db.exec("COMMIT");return value;},error=>{this.db.exec("ROLLBACK");throw error;}) as T; this.db.exec("COMMIT"); return result; } catch (e) { this.db.exec("ROLLBACK"); throw e; }
  }
  create(config: RunConfig) {
    const valid = runConfigSchema.parse(config);
    return this.transaction(() => {
      const existing = this.get(valid.id);
      if (existing) { for (const key of Object.keys(valid) as (keyof RunConfig)[]) if (stableJson(existing[key]) !== stableJson(valid[key])) throw new Error("Run identity reused with different configuration"); return existing; }
      const run: Run = { ...valid, version: 1, status: "running", calls: 0, reservedMicros: 0, active: [], createdAt: new Date().toISOString() };
      this.db.prepare("INSERT INTO runs VALUES (?,?)").run(run.id, JSON.stringify(run)); return run;
    });
  }
  get(id: string): Run | undefined { const row = this.db.prepare("SELECT value FROM runs WHERE id=?").get(id); return row ? JSON.parse(String(row.value)) : undefined; }
  save(run: Run) { this.db.prepare("UPDATE runs SET value=? WHERE id=?").run(JSON.stringify(run), run.id); }
  runs(limit = 100): Run[] { return this.db.prepare("SELECT value FROM runs ORDER BY rowid DESC LIMIT ?").all(Math.min(100, limit)).map(r => JSON.parse(String(r.value))); }
  count(runId: string, kind: string): number { return Number(this.db.prepare("SELECT count(*) AS n FROM records WHERE run_id=? AND kind=?").get(runId,kind)!.n); }
  last<T>(runId: string, kind: string): T | undefined { const row=this.db.prepare("SELECT value FROM records WHERE run_id=? AND kind=? ORDER BY seq DESC LIMIT 1").get(runId,kind);return row?JSON.parse(String(row.value)):undefined; }
  runnable(): Run[] { return this.db.prepare("SELECT value FROM runs WHERE json_extract(value,'$.status')='running' AND json_extract(value,'$.execution')='worker' ORDER BY rowid LIMIT 100").all().map(r=>JSON.parse(String(r.value))); }
  put(kind: string, id: string, runId: string, value: unknown) {
    const encoded = JSON.stringify(value), old = this.db.prepare("SELECT value FROM records WHERE id=?").get(id);
    if (old) { if (old.value !== encoded) throw new Error("Immutable record conflict"); return; }
    this.db.prepare("INSERT INTO records(id,run_id,kind,value) VALUES (?,?,?,?)").run(id, runId, kind, encoded);
  }
  record<T>(id: string): T | undefined { const row = this.db.prepare("SELECT value FROM records WHERE id=?").get(id); return row ? JSON.parse(String(row.value)) : undefined; }
  page<T>(runId: string, kind: string, after = 0, limit = 50): { items: T[]; next: number; more: boolean } {
    const rows = this.db.prepare("SELECT seq,value FROM records WHERE run_id=? AND kind=? AND seq>? ORDER BY seq LIMIT ?").all(runId, kind, after, Math.min(200, limit) + 1);
    const more = rows.length > limit, chosen = rows.slice(0, limit);
    return { items: chosen.map(r => JSON.parse(String(r.value))), next: chosen.length ? Number(chosen.at(-1)!.seq) : after, more };
  }
  all<T>(runId: string, kind: string): T[] { return this.db.prepare("SELECT value FROM records WHERE run_id=? AND kind=? ORDER BY seq").all(runId, kind).map(r => JSON.parse(String(r.value))); }
  scopedRecord<T>(runId: string, id: string): T | undefined { const row = this.db.prepare("SELECT value FROM records WHERE run_id=? AND id=?").get(runId,id); return row ? JSON.parse(String(row.value)) : undefined; }
  assessments(runId: string, candidateId: string): Assessment[] { return this.db.prepare("SELECT value FROM records WHERE run_id=? AND kind='assessment' AND json_extract(value,'$.candidateId')=? ORDER BY seq DESC LIMIT 5").all(runId,candidateId).map(r=>JSON.parse(String(r.value))); }
  search(runId: string, query: string, after = 0, limit = 30) {
    const rows=this.db.prepare("SELECT seq,value FROM records WHERE run_id=? AND kind='candidate' AND seq>? AND instr(lower(value),lower(?))>0 ORDER BY seq LIMIT ?").all(runId,after,query,limit+1);
    return {items:rows.slice(0,limit).map(r=>JSON.parse(String(r.value))),next:rows.length?Number(rows.slice(0,limit).at(-1)!.seq):after,more:rows.length>limit};
  }
  attempts(runId: string): Attempt[] { return this.db.prepare("SELECT value FROM attempts WHERE run_id=? ORDER BY rowid").all(runId).map(r => JSON.parse(String(r.value))); }
  attempt(id: string): Attempt | undefined { const row = this.db.prepare("SELECT value FROM attempts WHERE id=?").get(id); return row ? JSON.parse(String(row.value)) : undefined; }
  observeUsage(id: string, owner: string, usage: NonNullable<Attempt["usage"]>) { this.transaction(()=>{const attempt=this.attempt(id);if(attempt?.owner===owner){attempt.usage=usage;this.saveAttempt(attempt);}}); }
  saveAttempt(a: Attempt) { this.db.prepare("INSERT INTO attempts VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").run(a.id, a.runId, JSON.stringify(a)); }
  control(id: string, action: "pause" | "resume" | "stop") {
    return this.transaction(() => {
      const r = this.get(id); if (!r) throw new Error("Run unavailable");
      if (["stopped", "completed"].includes(r.status)) return r;
      r.status = action === "pause" ? "paused" : action === "resume" ? "running" : "stopped";
      r.reason = action === "stop" ? "Stopped by user; completed results retained" : undefined;
      if (action === "stop") for (const a of this.attempts(id).filter(a => a.status === "reserved")) { a.status = "cancelled"; a.error = "Run stopped; external charge may still occur"; this.saveAttempt(a); }
      this.save(r); return r;
    });
  }
  reserve(attempt: Attempt): boolean {
    return this.transaction(() => {
      const r = this.get(attempt.runId); if (!r || r.status !== "running" || this.attempt(attempt.id)) return false;
      if (attempt.sequence !== r.calls + 1 || (attempt.maxCallsAtPlanning !== undefined && attempt.maxCallsAtPlanning !== r.maxCalls)) return false;
      // One in-flight call per run; different runs can execute concurrently.
      if (this.attempts(r.id).some(a => a.status === "reserved")) return false;
      if (r.calls >= r.maxCalls || r.reservedMicros + attempt.reservedMicros > r.maxCostMicros) { r.status = "completed"; r.reason = "Call or conservative spend allowance exhausted"; this.save(r); return false; }
      r.calls++; r.reservedMicros += attempt.reservedMicros; this.save(r); this.saveAttempt(attempt); this.put("operation", attempt.operation.id, r.id, attempt.operation); return true;
    });
  }
  recover(now: number) {
    for (const r of [...this.runnable(), ...this.runs().filter(r => r.execution === "manual")]) this.transaction(() => { for (const a of this.attempts(r.id)) if (a.status === "reserved" && a.leaseUntil < now) { a.status = "uncertain"; a.error = "Worker lease expired; invocation is not automatically replayed; reservation retained"; this.saveAttempt(a); } });
  }
  finish(id: string, owner: string, candidate?: Candidate | Candidate[], assessment?: Assessment, error?: string): boolean {
    return this.transaction(() => {
      const a = this.attempt(id); if (!a || a.owner !== owner || a.status !== "reserved" || a.leaseUntil < Date.now()) return false;
      const r = this.get(a.runId)!; if (r.status === "stopped") return false;
      a.status = error ? "failed" : "committed"; if (error) a.error = error;
      if (candidate) for (const c of Array.isArray(candidate) ? candidate : [candidate]) this.put("candidate", c.id, r.id, c);
      if (assessment) this.put("assessment", assessment.id, r.id, assessment);
      this.saveAttempt(a); return true;
    });
  }
  reading(reading: Reading) { this.put("reading", reading.id, reading.runId, reading); }
  intervention(value: Intervention) { this.db.prepare("INSERT INTO interventions VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value").run(value.id, value.runId, JSON.stringify(value)); }
  interventions(runId: string): Intervention[] { return this.db.prepare("SELECT value FROM interventions WHERE run_id=? ORDER BY rowid").all(runId).map(r => JSON.parse(String(r.value))); }
}
