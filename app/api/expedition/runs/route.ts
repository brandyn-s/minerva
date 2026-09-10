import { expeditionOwner } from "@/features/experiments/session";
import { startSchema, startConfig } from "@/features/experiments/start";
import { dispatch } from "@/features/experiments/dispatch";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { experimentStore, expeditionSettings } from "@/features/experiments/runtime";
import { runConfigSchema, type Reading, type Candidate, type Operation } from "@/features/experiments/contracts";
import { analyze, readingPreview } from "@/features/experiments/analysis";
import { proposeIntervention } from "@/features/experiments/runner";
import { probe, probeSchema } from "@/features/experiments/probe";
export const runtime = "nodejs";
export async function GET(request: Request) {
    let store;
    try {
        store = await experimentStore(request);
        const owner=await expeditionOwner();
        const url = new URL(request.url), id = url.searchParams.get("id");
        if (!id)
            return Response.json({ configured: true, limitMicros: expeditionSettings().maxCostMicros, runs: (await store.runs()).filter(r=>r.owner===owner).map(({ id, title, goal, status, calls, maxCalls, createdAt, provider }) => ({ id, title, goal, status, calls, maxCalls, createdAt, provider })), coverage: "Most recent 100 runs" });
        const run = (await store.get(id));
        if (!run || run.owner!==owner)
            return Response.json({ error: "Run unavailable" }, { status: 404 });
        const candidateId = url.searchParams.get("candidateId");
        if (candidateId) {
            const candidate = (await store.scopedRecord<Candidate>(id, candidateId));
            if (!candidate)
                return Response.json({ error: "Candidate unavailable" }, { status: 404 });
            return Response.json({ candidate, operation: (await store.scopedRecord(id, candidate.operationId)), assessments: (await store.assessments(id, candidateId)), coverage: "At most five latest assessments" });
        }
        const kind = z.enum(["candidate", "assessment", "operation", "reading"]).parse(url.searchParams.get("kind") ?? "candidate");
        const after = z.coerce.number().int().nonnegative().parse(url.searchParams.get("after") ?? 0);
        const limit = z.coerce.number().int().min(1).max(100).parse(url.searchParams.get("limit") ?? 30);
        const query = z.string().max(200).parse(url.searchParams.get("q") ?? "");
        const page = query ? (await store.search(id, query, after, limit)) : (await store.page(id, kind, after, limit));
        const projected = kind === "reading" ? page.items.map(item => readingPreview(item as Reading)) : kind === "operation" ? page.items.map(item => { const o = item as Operation; return { id: o.id, kind: o.kind, step: o.step, strategy: o.strategy, sources: o.sources.map(s => ({ id: s.id, revision: s.revision })), exposure: o.exposure.map(s => ({ id: s.id, revision: s.revision })) }; }) : kind === "candidate" ? page.items.map(item => { const c = item as Candidate; return { ...c, rootIds: undefined, snapshot: { id: c.snapshot.id, revision: c.snapshot.revision, title: c.snapshot.title, summary: c.snapshot.summary } }; }) : page.items;
        const { initial, ...runView } = run;
        return Response.json({ run: runView, initialCount: initial.length, ...page, items: projected, interventions: (await store.interventions(id)).slice(-30), readings: [readingPreview((await store.last<Reading>(id, "reading")))].filter(Boolean), coverage: { kind, limit, after, truncated: page.more, omitted: ["run.initial", "page bodies and full operation context; use candidateId for exact detail"], candidateCount: (await store.count(id, "candidate")) } });
    }
    catch {
        return Response.json({ configured: false, error: "Expedition is temporarily unavailable" }, { status: 503 });
    }
    finally {
        (await store?.close());
    }
}
const commandSchema = z.discriminatedUnion("action", [
    z.object({action:z.literal("start"),input:startSchema}),
    z.object({ action: z.literal("reassess"), id: z.string().uuid(), candidateId: z.string().uuid(), reason: z.string().min(1).max(2000), additionalCalls: z.literal(1) }),
    z.object({ action: z.literal("probe"), input: probeSchema }),
    z.object({ action: z.literal("create"), config: runConfigSchema }),
    z.object({ action: z.enum(["pause", "resume", "stop", "analyze"]), id: z.string().uuid() }),
    z.object({ action: z.literal("intervene"), id: z.string().uuid(), readingId: z.string().uuid(), candidateId: z.string().uuid(), challenge: z.string().min(1).max(2000), intent: z.string().min(1).max(2000), operationKind: z.enum(["wander", "develop"]), additionalCalls: z.literal(2) }),
]);
export async function POST(request: Request) {
    let store;
    try {
        store = await experimentStore(request);
        const owner=await expeditionOwner();
        const command = commandSchema.parse(await request.json());
        if(command.action==="start"){
          const run=await store.create(startConfig(command.input,expeditionSettings(),owner));
          try{await dispatch(run.id);}catch(error){await store.control(run.id,'pause');console.error('Expedition dispatch failed',error);return Response.json({...run,status:'paused',reason:'Could not start just now. Resume to try again.'});}
          return Response.json(run);
        }
        if(command.action!=="create"){
          const id=command.action==='probe'?command.input.runId:command.id;
          const owned=await store.get(id);if(!owned||owned.owner!==owner)return Response.json({error:'Run unavailable'},{status:404});
        }

        if (command.action === "probe") {
            const result = (await probe(store, command.input));
            return Response.json({ ...result, reading: readingPreview((await analyze(store, command.input.runId))) });
        }
        if (command.action === "create") {
            if(process.env.EXPEDITION_DATABASE_URL)throw new Error("Use the Expedition start action");
            if (command.config.provider === "gateway" && process.env.MINERVA_EXPERIMENT_LIVE !== "1")
                throw new Error("Live worker calls are not enabled");
            return Response.json((await store.create(command.config)));
        }
        if (command.action === "analyze")
            return Response.json(readingPreview((await analyze(store, command.id))));
        if (command.action === "reassess") {
            const s = store;
            const result=(await s.transaction(async () => { const run = (await s.get(command.id)); if (!run || !(await s.scopedRecord(command.id, command.candidateId)))
                throw new Error("Candidate unavailable"); const q = { id: randomUUID(), candidateId: command.candidateId, reason: command.reason }; (await s.put("assessment-request", q.id, run.id, q)); run.maxCalls++; run.maxCostMicros += run.callReservationMicros; run.status = "running"; run.execution = "worker"; run.reason = undefined; (await s.save(run)); return q; })); await dispatch(command.id);return Response.json(result);
        }
        if (command.action === "intervene") {
            const s = store;
            const result=(await s.transaction(async () => {
                const run = (await s.get(command.id));
                if (!run)
                    throw new Error("Run unavailable");
                const value = (await proposeIntervention(s, { runId: command.id, readingId: command.readingId, candidateId: command.candidateId, challenge: command.challenge, intent: command.intent, operationKind: command.operationKind }));
                // Explicitly authorized in the command, never an implicit success redefinition.
                run.maxCalls += command.additionalCalls;
                run.maxCostMicros += command.additionalCalls * run.callReservationMicros;
                run.status = "running";
                run.reason = undefined;
                (await s.save(run));
                return value;
            })); await dispatch(command.id);return Response.json(result);
        }
        const result=await store.control(command.id,command.action);if(command.action==="resume")await dispatch(command.id);return Response.json(result);
    }
    catch (error) {
        console.error("Expedition command failed",error);return Response.json({ error: "Could not update this expedition. Please try again." }, { status: 400 });
    }
    finally {
        (await store?.close());
    }
}
