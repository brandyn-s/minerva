import { test, expect } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { seedGroupWeave } from '../helpers/group-weave-fixture';
import { ExperimentStore } from '../../features/experiments/store';
import { runLenses, runLensCorpus, saveRunLens } from '../../features/experiments/lenses';
import { groupWeaveOptions, prepareGroupWeave, submitGroupWeave, groupWeaveProgress, type GroupWeaveRequest } from '../../features/experiments/group-weave';
import { tick } from '../../features/experiments/runner';
import { fixtureProvider } from '../../features/experiments/fixture-provider';

test('choose complete groups, preserve contribution drafts on failure and place the bounded result in a lens', async ({ page }, testInfo) => {
  const dir = mkdtempSync(tmpdir() + '/minerva-group-weave-ui-'), store = new ExperimentStore(dir + '/runs.sqlite');
  try {
    const f = await seedGroupWeave(store), before = store.get(f.id)!; let failOnce = true;
    await page.route('**/api/**', async route => {
      const url = new URL(route.request().url()), post = route.request().method() === 'POST';
      if (url.pathname === '/api/expedition/runs') return route.fulfill({ json: url.searchParams.has('id') ? { run: store.get(f.id), items: [], next: 0, more: false, readings: [], interventions: [], coverage: { candidateCount: store.count(f.id, 'candidate') } } : { runs: [store.get(f.id)], limitMicros: 0 } });
      if (url.pathname === '/api/expedition/lenses') {
        if (post) return route.fulfill({ json: { lens: await saveRunLens(store, f.id, route.request().postDataJSON()) } });
        const corpus = await runLensCorpus(store, f.id); return route.fulfill({ json: { lenses: await runLenses(store, f.id), members: corpus.members, coverage: { total: corpus.members.length, complete: true } } });
      }
      if (url.pathname === '/api/expedition/group-weave') {
        if (!post) {
          const history = []; for (const r of store.all<GroupWeaveRequest>(f.id, 'group-weave-request')) history.push(await groupWeaveProgress(store, f.id, r.id));
          return route.fulfill({ json: { ...await groupWeaveOptions(store, f.id, f.lens.id), history } });
        }
        const command = route.request().postDataJSON();
        if (command.action === 'prepare') return route.fulfill({ json: { preview: await prepareGroupWeave(store, f.id, f.lens.id, command.lensRevision, command.choices) } });
        if (failOnce) { failOnce = false; return route.fulfill({ status: 503, json: { error: 'Temporary network failure.' } }); }
        const request = await submitGroupWeave(store, f.id, command.previewId, command.weave);
        await tick(store, f.id, fixtureProvider(1)); await tick(store, f.id, fixtureProvider(2));
        return route.fulfill({ json: { progress: await groupWeaveProgress(store, f.id, request.id), dispatchStarted: true } });
      }
      return route.fulfill({ status: 503, json: { error: 'No live provider requests in UI verification' } });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Expedition panel', exact: true }).click();
    await page.getByRole('button', { name: 'Cross-group Weave fixture', exact: true }).click();
    await page.getByRole('button', { name: 'Edit expedition lenses', exact: true }).click();
    await page.getByRole('button', { name: 'Explore across groups', exact: true }).click();
    const controls = page.getByRole('region', { name: 'Explore across groups', exact: true });
    const groups = f.lens.revisions.at(-1)!.groups;
    const first = groups.find((g: { label: string }) => g.label === 'Group 0')!, second = groups.find((g: { label: string }) => g.label === 'Group 1')!;
    await controls.getByLabel('Approach 1', { exact: true }).selectOption(first.id);
    await controls.getByLabel('Approach 2', { exact: true }).selectOption(second.id);
    await controls.getByLabel('Source from Group 0', { exact: true }).selectOption(f.ids[63]);
    await controls.getByLabel('Source from Group 1', { exact: true }).selectOption(f.ids[64]);
    const camera = await page.locator('.react-flow__viewport').getAttribute('style');
    await controls.getByRole('button', { name: 'Prepare contributions', exact: true }).click();
    await controls.getByLabel('Carry forward · Approach 63', { exact: true }).fill('Sharing that keeps local choice');
    await controls.getByLabel('Carry forward · Approach 64', { exact: true }).fill('A reversible commitment');
    const source = controls.locator('.weave-source').filter({ has: page.getByRole('heading', { name: 'Approach 63', exact: true }) });
    await source.getByText('Choose an excerpt (optional)', { exact: true }).click();
    const input = source.getByLabel('Source text · Approach 63', { exact: true });
    await input.focus();
    await input.evaluate((element: HTMLTextAreaElement) => { const start = element.value.indexOf('Exact contribution 63.'); element.setSelectionRange(start, start + 'Exact contribution 63.'.length); });
    await input.press('Shift');
    expect(await input.evaluate((element: HTMLTextAreaElement) => element.value.slice(element.selectionStart, element.selectionEnd))).toBe('Exact contribution 63.');
    await source.getByRole('button', { name: 'Use selected excerpt', exact: true }).click();
    await expect(source.locator('blockquote')).toHaveText('Exact contribution 63.');
    await controls.getByLabel('How should they interact? (optional)', { exact: true }).fill('Make each commitment reversible without a central queue.');
    await controls.getByRole('button', { name: 'Weave contributions · 2 calls', exact: true }).click();
    await expect(controls.getByRole('alert')).toContainText('Temporary network failure');
    await expect(controls.getByLabel('Carry forward · Approach 63', { exact: true })).toHaveValue('Sharing that keeps local choice');
    expect(store.get(f.id)!.calls).toBe(0);
    await controls.getByRole('button', { name: 'Prepare again', exact: true }).click();
    await expect(controls.getByLabel('Carry forward · Approach 63', { exact: true })).toHaveValue('Sharing that keeps local choice');
    await controls.getByRole('button', { name: 'Weave contributions · 2 calls', exact: true }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('dialog', { name: 'Expedition', exact: true }).getByRole('button', { name: 'Close panel', exact: true })).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath('group-weave-preparation.png') });
    await controls.getByRole('button', { name: 'Weave contributions · 2 calls', exact: true }).click();
    const result = controls.getByRole('region', { name: 'Group Weave result', exact: true });
    await expect(result.getByRole('status')).toHaveText('completed · 2 of 2 calls used.');
    const request = store.all<GroupWeaveRequest>(f.id, 'group-weave-request')[0], progress = await groupWeaveProgress(store, f.id, request.id);
    expect(progress.candidate!.parents).toEqual([f.ids[63], f.ids[64]]);
    expect(request.operation.weave!.selections[0].excerpt!.text).toBe('Exact contribution 63.');
    await result.getByRole('combobox').selectOption(first.id);
    await result.getByRole('button', { name: 'Place result in lens', exact: true }).click();
    await expect(controls.getByText('Result placed in this lens. Exploration still uses its separately applied configuration.', { exact: true })).toBeVisible();
    const edited = (await runLenses(store, f.id))[0];
    expect(edited.revisions.at(-1)!.groups.find(g => g.id === first.id)!.members).toContain(`candidate:${progress.candidate!.id}`);
    expect(store.get(f.id)!.status).toBe('paused'); expect(store.get(f.id)!.calls).toBe(2); expect(store.get(f.id)!.selection).toEqual(before.selection);
    expect(await page.locator('.react-flow__viewport').getAttribute('style')).toBe(camera);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});
