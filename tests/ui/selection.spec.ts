import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { newLens, editLens } from '../../features/lenses/domain';
import { configurationFromLens, selectWithLens, type SelectionConfiguration } from '../../features/experiments/selection';
import type { Candidate } from '../../features/experiments/contracts';

test('preview, reject stale application, apply while paused and resume explicitly', async ({ page }, testInfo) => {
  const runId = randomUUID();
  const candidates: Candidate[] = Array.from({ length: 8 }, (_, n) => { const id = randomUUID(); return { id, snapshot: { id, revision: 1, title: `Candidate ${n + 1}`, summary: 'Shared resources', body: 'A shared queue.' }, operationId: randomUUID(), parents: [], exposure: [], rootIds: [id], admission: 'eligible', at: new Date().toISOString(), assessment: { id: randomUUID(), candidateId: id, mechanism: `Mechanism ${n % 4}`, constraints: n === 7 ? 'violated' : 'preserved', actionability: 'supported', changed: 'yes', evidence: 'shared queue', explanation: 'Fixture', version: 1, level: 'textual', assessor: 'fixture', at: new Date().toISOString(), sourceOperation: randomUUID() } }; });
  const members = candidates.map(c => ({ key: `candidate:${c.id}`, candidateId: c.id, sourceId: c.id, revision: 1, title: c.snapshot.title, summary: c.snapshot.summary, assessmentId: c.assessment!.id }));
  const lens = editLens(newLens({ kind: 'run', runId }, members, 'Coordination', 'manual', Array.from({ length: 4 }, (_, n) => ({ label: `Approach ${n + 1}`, members: members.filter((_, i) => i % 4 === n).map(m => m.key) }))), { kind: 'review' });
  const run = { id: runId, title: 'Paused design exploration', status: 'paused', capacity: 2, seed: 1, calls: 4, maxCalls: 12, constraints: [], provider: 'fixture', active: [candidates[6].id] };
  let configuration: SelectionConfiguration | null = null, staleOnce = true, applies = 0, resumes = 0, previews = 0;
  let savedPreview!: ReturnType<typeof makePreview>;
  function makePreview(protectedIds: string[]) {
    const config = configurationFromLens(lens, run, protectedIds, 1), decision = selectWithLens(candidates, config, 2);
    return { id: randomUUID(), runId, at: new Date().toISOString(), fingerprint: 'fixture', configuration: config, decision, previous: [...run.active], previousProtectedIds: [], entering: decision.active.filter(id => !run.active.includes(id)), leaving: run.active.filter(id => !decision.active.includes(id)), candidates: candidates.map(c => ({ id: c.id, title: c.snapshot.title, assessment: c.assessment!.constraints })) };
  }
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url()), post = route.request().method() === 'POST';
    if (url.pathname === '/api/expedition/runs') {
      if (post) { const command = route.request().postDataJSON(); expect(command.action).toBe('resume'); resumes++; run.status = 'running'; return route.fulfill({ json: run }); }
      return route.fulfill({ json: url.searchParams.has('id') ? { run, items: [], next: 0, more: false, coverage: { candidateCount: 8 }, readings: [], interventions: [] } : { runs: [run], limitMicros: 0 } });
    }
    if (url.pathname === '/api/expedition/lenses') return route.fulfill({ json: { lenses: [lens], members, coverage: { total: 8, complete: true } } });
    if (url.pathname === '/api/expedition/selection') {
      if (!post) return route.fulfill({ json: { status: run.status, capacity: run.capacity, inFlight: false, active: run.active, configuration } });
      const command = route.request().postDataJSON();
      if (command.action === 'preview') { previews++; savedPreview = makePreview(command.protectedIds); return route.fulfill({ json: { preview: savedPreview } }); }
      applies++; if (staleOnce) { staleOnce = false; return route.fulfill({ status: 409, json: { error: 'This preview is stale. Recompute it before applying.' } }); }
      expect(command.previewId).toBe(savedPreview.id); configuration = savedPreview.configuration; run.active = savedPreview.decision.active;
      return route.fulfill({ json: { application: { id: `applied:${command.previewId}`, previewId: command.previewId, runId, configurationId: configuration.id, revision: 1, lensId: lens.id, lensRevision: 2, active: run.active, at: new Date().toISOString() }, readingUpdated: true } });
    }
    return route.fulfill({ status: 503, json: { error: 'No provider calls in UI verification' } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Expedition panel', exact: true }).click();
  await page.getByRole('button', { name: run.title, exact: true }).click();
  await page.getByRole('button', { name: 'Edit expedition lenses', exact: true }).click();
  await page.getByRole('button', { name: 'Use for exploration', exact: true }).click();
  const controls = page.getByRole('region', { name: 'Use lens for exploration', exact: true });
  await controls.getByText('Protect candidates · 0 selected', { exact: true }).click();
  await controls.getByLabel('Protect Candidate 8', { exact: true }).check();
  await controls.getByRole('button', { name: 'Preview population', exact: true }).click();
  await expect(controls.getByText(/Protected but not eligible:/)).toContainText('Candidate 8');
  const preview = controls.getByRole('region', { name: 'Selection preview', exact: true });
  await expect(preview.getByRole('status').first()).toContainText('2 of 2 slots');
  await preview.getByRole('button', { name: 'Apply preview · stay paused', exact: true }).click();
  await expect(controls.getByRole('alert')).toContainText('preview is stale');
  expect(resumes).toBe(0); expect(run.status).toBe('paused');
  await controls.getByRole('button', { name: 'Recompute preview', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Expedition', exact: true }).getByRole('button', { name: 'Close panel', exact: true })).toBeInViewport();
  await page.screenshot({ path: testInfo.outputPath('selection-preview.png') });
  await preview.getByRole('button', { name: 'Apply preview · stay paused', exact: true }).click();
  await expect(controls.getByRole('region', { name: 'Applied selection', exact: true })).toContainText('The expedition stays paused');
  expect(resumes).toBe(0); expect(run.active).toEqual(savedPreview.decision.active);
  await controls.getByRole('button', { name: 'Resume expedition', exact: true }).click();
  await expect.poll(() => resumes).toBe(1);
  await expect(controls.getByRole('region', { name: 'Applied selection', exact: true })).toContainText('Run status: running');
  expect(applies).toBe(2); expect(previews).toBe(2);
});
