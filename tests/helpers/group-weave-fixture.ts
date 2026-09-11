import { randomUUID } from 'node:crypto';
import { saveRunLens } from "../../features/experiments/lenses";
import { previewSelection, applySelection } from "../../features/experiments/selection-service";
import { runConfigSchema } from "../../features/experiments/contracts";
import type { Store } from "../../features/experiments/store-contract";
export async function seedGroupWeave(store: Store, count = 65, owner?: string) {
  const id = randomUUID(), artifactId = randomUUID(), at = new Date().toISOString(), ids = [];
  await store.create(runConfigSchema.parse({ id, owner, title: 'Cross-group Weave fixture', goal: 'Explore shared resources', capacity: 3, maxCalls: 12, maxCostMicros: 0, callReservationMicros: 0, execution: 'manual', provider: 'fixture', seed: 1 }));
  for (let n = 0; n < count; n++) {
    const cid = randomUUID(), operationId = randomUUID(); ids.push(cid);
    await store.put('operation', operationId, id, { id: operationId, version: 1, kind: 'root', goal: 'Explore shared resources', constraints: [], sources: [], exposure: [], intent: '', step: 1, count: 1 });
    await store.put('candidate', cid, id, { id: cid, operationId, snapshot: { id: n < 2 ? artifactId : cid, revision: 1, title: `Approach ${n}`, summary: `Shared resources ${n}`, body: `Frozen source ${n}. ` + 'Context. '.repeat(500) + `Exact contribution ${n}.`, contribution: `Carry forward mechanism ${n}` }, parents: [], exposure: [], rootIds: [cid], admission: 'eligible', at });
    await store.put('assessment', `assessment-${cid}`, id, { id: `assessment-${cid}`, candidateId: cid, mechanism: `Group ${n % 3}`, constraints: 'preserved', actionability: 'supported', changed: 'yes', evidence: `Frozen source ${n}`, explanation: 'Synthetic assessment', version: 1, level: 'textual', at, sourceOperation: operationId, assessor: 'fixture' });
  }
  await store.control(id, 'pause');
  let lens = await saveRunLens(store, id, { id: randomUUID(), expectedRevision: 0, name: 'Resource coordination', seed: 'mechanisms' });
  lens = await saveRunLens(store, id, { id: lens.id, expectedRevision: 1, edit: { kind: 'review' } });
  const p = await previewSelection(store, id, lens.id, 2, []); await applySelection(store, id, p.id);
  const choices = ids.slice(0, 2).map(candidateId => ({ candidateId, groupId: lens.revisions.at(-1)!.groups.find(g => g.members.includes(`candidate:${candidateId}`))!.id }));
  return { id, ids, lens, choices };
}
