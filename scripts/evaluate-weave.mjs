// Prepared corpus and bounded live comparison. Human judgments are never generated.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { loader } from '../tests/helpers/load-ts.mjs';
const load = loader();
const { operationSchema } = load('features/experiments/contracts.ts');
const { executeOperation, planOperation } = load('features/experiments/operators.ts');
const cases = JSON.parse(readFileSync(new URL('../evaluation/weave-cases.json', import.meta.url), 'utf8'));
const live = process.argv.includes('--live');
const allowance = Number(process.argv.find(s => s.startsWith('--allow-calls='))?.split('=')[1] ?? 0);
if (live && allowance !== 9) throw new Error('This protocol requires an explicit --allow-calls=9 allowance. No retries.');
if (process.env.MINERVA_WEAVE_ENV) process.loadEnvFile(process.env.MINERVA_WEAVE_ENV);
if (live && !process.env.VERCEL_OIDC_TOKEN) throw new Error('Project-scoped VERCEL_OIDC_TOKEN is required.');
const directory = resolve('evaluation-artifacts/weave', new Date().toISOString().replace(/[:.]/g, '-'));
mkdirSync(directory, { recursive: true });
const jobs = cases.flatMap((item, index) => {
  const selected = { version: 1, interaction: item.interaction, selections: item.sources.map((source, i) => ({ id: `${item.id}-${i}`, sourceId: source.id, sourceRevision: source.revision, text: item.contributions[i] })) };
  const variant = structuredClone(selected); variant.selections[0].text = item.replacement;
  const arms = { whole: undefined, selected, variant };
  // Rotate request order; blind artifact labels are independent of method labels.
  const order = [['whole', 'selected', 'variant'], ['selected', 'variant', 'whole'], ['variant', 'whole', 'selected']][index];
  return order.map(arm => ({ caseId: item.id, brief: item.brief, arm, label: randomUUID().slice(0, 8), reviewFocus: item.reviewFocus,
    op: operationSchema.parse({ id: randomUUID(), version: 1, kind: 'weave', goal: 'Combine these ideas', constraints: [], sources: item.sources, intent: "Preserve each source's distinct contribution", ...(arms[arm] ? { weave: arms[arm] } : {}) }) }));
});
const record = { protocol: 'weave-formative-v1', live, maxCalls: live ? allowance : 0, corpusSha256: createHash('sha256').update(JSON.stringify(cases)).digest('hex'), cases, jobs: jobs.map(job => ({ ...job, plan: planOperation(job.op) })), results: [] };
const save = () => writeFileSync(`${directory}/evidence.json`, JSON.stringify(record, null, 2));
save();
if (live) {
  const { gatewayProvider } = load('features/experiments/gateway.ts');
  for (const job of jobs) {
    const started = Date.now(), entry = { label: job.label, caseId: job.caseId, arm: job.arm, status: 'started', usage: null };
    record.results.push(entry); save();
    try {
      entry.output = await executeOperation(job.op, gatewayProvider, AbortSignal.timeout(60000), usage => { entry.usage = usage; });
      entry.status = 'completed';
    } catch (error) { entry.status = 'failed'; entry.error = error instanceof Error ? error.message : String(error); }
    entry.elapsedMs = Date.now() - started; save();
    console.log(JSON.stringify({ case: job.caseId, label: job.label, status: entry.status }));
  }
}
const blind = [...record.results].sort((a, b) => a.label.localeCompare(b.label));
writeFileSync(`${directory}/review.md`, '# Weave formative review\n\nPrepared design briefs, not a user study. Review outputs before opening evidence.json, which reveals method labels and mappings. One sample per arm cannot establish efficacy or causal sensitivity. Preparation time and interaction effort need an actual participant session.\n\n' + (live ? blind.map(result => {
  const job = jobs.find(j => j.label === result.label), card = result.output?.cards[0];
  return `## ${result.label} · ${result.caseId}\n\nBrief: ${job.brief}\n\n${card ? `### ${card.title}\n\n${card.summary}\n\n${card.body}` : 'No valid result; retain this failure in the comparison.'}\n\nReview focus: ${job.reviewFocus}\n\n- Contribution recognition: [unreviewed]\n- Interaction between contributions: [unreviewed]\n- Coherence and usefulness: [unreviewed]\n- Preserved constraints and omissions: [unreviewed]\n- Next step worth taking: [unreviewed]\n\nAfter unblinding, inspect claims and quotation support separately.\n`;
}).join('\n') : 'No model calls have been made. The prepared requests are in evidence.json.\n'));
console.log(JSON.stringify({ directory, calls: record.results.length, validResults: record.results.filter(r => r.status === 'completed').length, humanReview: 'pending' }));
