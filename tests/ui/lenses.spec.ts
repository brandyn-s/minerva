import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { newLens, currentLens, editLens, type Lens } from '../../features/lenses/domain';
import { fixtureSave } from '../../features/atlas/local-state';
import { atlasLens } from '../../features/atlas/lenses';
import { cardEdit, reviseCard } from '../../features/atlas/card-revisions';

test('edit atlas lenses, undo and switch without model calls or camera movement', async ({ page }, testInfo) => {
  let calls = 0;
  await page.route('**/api/**', route => { if (route.request().method() === 'POST') calls++; return route.fulfill({ status: 503, json: { error: 'Offline verification' } }); });
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Constellation', exact: true }).click();
  await page.getByRole('button', { name: 'Edit lenses', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Lenses', exact: true });
  await page.getByLabel('New lens name', { exact: true }).fill('Shared activities');
  await panel.getByRole('button', { name: 'Create lens', exact: true }).click();
  await expect(panel.getByRole('heading', { name: 'Shared activities', exact: true })).toBeVisible();
  const camera = () => page.locator('.react-flow__viewport').getAttribute('style');
  const before = await camera();
  await panel.getByLabel('Select A food hall revision 1', { exact: true }).check();
  await panel.getByLabel('Select A shared tool library revision 1', { exact: true }).check();
  await panel.getByLabel('New group name', { exact: true }).fill('Shared table');
  await panel.getByRole('button', { name: 'Create group from selected', exact: true }).click();
  const group = panel.getByRole('region', { name: 'Group: Shared table', exact: true });
  await group.getByText('Shared table · 2', { exact: true }).click();
  await group.getByLabel('Representative: Shared table', { exact: true }).selectOption({ label: 'A shared tool library · r1' });
  await group.getByLabel('Group name: Shared table', { exact: true }).fill('Mutual support');
  await group.getByRole('button', { name: 'Rename group', exact: true }).click();
  const renamed = panel.getByRole('region', { name: 'Group: Mutual support', exact: true });
  await expect(renamed.getByLabel('Representative: Mutual support', { exact: true })).toHaveValue('card:tools:1');
  await renamed.getByLabel('Select A food hall revision 1', { exact: true }).check();
  await panel.getByRole('button', { name: 'Move selected members', exact: true }).click();
  await expect(renamed.getByText('Mutual support · 1', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Undo lens edit', exact: true }).click();
  await expect(renamed.getByText('Mutual support · 2', { exact: true })).toBeVisible();
  await renamed.getByRole('button', { name: 'A food hall · r1', exact: true }).click();
  await expect(panel.getByRole('region', { name: 'Frozen member', exact: true })).toContainText('A food hall');
  await expect.poll(camera).toBe(before);
  expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('lens-editor.png') });
  const arrangement = () => page.locator('.react-flow__node-thought').evaluateAll(nodes => Object.fromEntries(nodes.map(n => [n.getAttribute('data-id'), (n as HTMLElement).style.transform])));
  const savedArrangement = await arrangement();
  await panel.getByRole('button', { name: 'New lens', exact: true }).click();
  await panel.getByLabel('New lens name', { exact: true }).fill('Resource ownership');
  await panel.getByRole('button', { name: 'Create lens', exact: true }).click();
  await expect(panel.getByRole('heading', { name: 'Resource ownership', exact: true })).toBeVisible();
  await panel.getByLabel('Lens', { exact: true }).selectOption({ label: 'Shared activities' });
  await expect(panel.getByText('Mutual support · 2', { exact: true })).toBeVisible();
  await expect.poll(arrangement).toEqual(savedArrangement);
  await expect.poll(camera).toBe(before);
  await page.waitForTimeout(700);
  await page.reload();
  await page.getByRole('button', { name: 'Edit lenses', exact: true }).click();
  await expect(panel.getByRole('heading', { name: 'Shared activities', exact: true })).toBeVisible();
  await expect(panel.getByText('Mutual support · 2', { exact: true })).toBeVisible();
  await expect.poll(camera).toBe(before);
  expect(calls).toBe(0); expect(errors).toEqual([]);
});

test('Expedition lenses edit all 65 members beyond reading and member-list previews', async ({ page }, testInfo) => {
  const runId = randomUUID();
  const members = Array.from({ length: 65 }, (_, i) => { const id = randomUUID(); return { key: `candidate:${id}`, sourceId: id, candidateId: id, revision: 1, title: `Idea ${i + 1}`, summary: 'A frozen corpus idea', assessmentId: `assessment-${i}` }; });
  let lenses: Lens[] = [newLens({ kind: 'run', runId }, members, 'Coordination', 'assessor-mechanisms', [{ label: 'Shared', members: members.slice(0, 40).map(m => m.key) }, { label: 'Local', members: members.slice(40).map(m => m.key) }])];
  let writes = 0, generation = 0;
  const run = { id: runId, title: 'Frozen collection', status: 'completed', calls: 0, maxCalls: 0, constraints: [], provider: 'fixture' };
  await page.route('**/api/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/expedition/lenses') {
      if (route.request().method() === 'POST') { writes++; const command = route.request().postDataJSON(); expect(command.expectedRevision).toBe(currentLens(lenses[0]).number); lenses = [editLens(lenses[0], command.edit)]; return route.fulfill({ json: { lens: lenses[0] } }); }
      return route.fulfill({ json: { lenses, members, coverage: { total: 65, complete: true } } });
    }
    if (url.pathname === '/api/expedition/runs') {
      if (url.searchParams.has('candidateId')) return route.fulfill({ json: { candidate: { id: url.searchParams.get('candidateId'), snapshot: { body: 'Exact frozen candidate body' } } } });
      return route.fulfill({ json: url.searchParams.has('id') ? { run, items: [], next: 0, more: false, coverage: { candidateCount: 65 }, readings: [], interventions: [] } : { runs: [run], limitMicros: 0 } });
    }
    if (route.request().method() === 'POST') generation++;
    return route.fulfill({ status: 503, json: { error: 'Offline verification' } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Expedition panel', exact: true }).click();
  await page.getByRole('button', { name: 'Frozen collection', exact: true }).click();
  const callsBeforeLens = generation; // Opening Expedition requests its existing direction suggestions.
  await page.getByRole('button', { name: 'Edit expedition lenses', exact: true }).click();
  const editor = page.getByRole('region', { name: 'Lens editor', exact: true });
  await expect(editor.getByRole('status')).toContainText('65 revisions · 65 assigned · 0 unassigned');
  for (const [label, count] of [['Shared', 40], ['Local', 25]] as const) {
    const group = editor.getByRole('region', { name: `Group: ${label}`, exact: true });
    await group.getByText(`${label} · ${count}`, { exact: true }).click();
    await group.getByLabel(`Merge group ${label}`, { exact: true }).check();
  }
  await editor.getByLabel('New group name', { exact: true }).fill('Combined');
  await editor.getByRole('button', { name: 'Merge 2 complete groups', exact: true }).click();
  const combined = editor.getByRole('region', { name: 'Group: Combined', exact: true });
  await combined.getByText('Combined · 65', { exact: true }).click();
  await expect(combined.getByRole('checkbox')).toHaveCount(21); // Group checkbox plus first 20 members.
  await combined.getByRole('button', { name: 'Select all 65 in Combined', exact: true }).click();
  await editor.getByRole('button', { name: 'Move selected members', exact: true }).click();
  await expect(editor.getByRole('status')).toContainText('65 revisions · 0 assigned · 65 unassigned');
  await editor.getByRole('button', { name: 'Undo lens edit', exact: true }).click();
  await expect(editor.getByRole('status')).toContainText('65 revisions · 65 assigned · 0 unassigned');
  await page.getByRole('button', { name: 'Reload lenses', exact: true }).click();
  await expect(editor.getByText('Combined · 65', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('expedition-lens.png') });
  expect(writes).toBe(3); expect(generation).toBe(callsBeforeLens);
});

test('an edited idea retains its historical assignment and includes the new revision as unassigned', async ({ page }) => {
  const save = fixtureSave(), original = save.thoughts.find(c => c.id === 'food')!;
  save.lenses = [atlasLens(save.thoughts, 'Frozen perspective', [{ name: 'Original grouping', reason: '', memberIds: save.thoughts.map(c => c.id) }])];
  save.activeLensId = save.lenses[0].id; save.perspective = 'Constellation';
  save.thoughts = save.thoughts.map(c => c.id === 'food' ? reviseCard(c, { ...cardEdit(c), title: 'A teaching kitchen', body: 'A revised mechanism for teaching.' }) : c);
  let calls = 0;
  await page.route('**/api/**', route => { if (route.request().method() === 'POST') calls++; return route.fulfill({ status: 503, json: { error: 'Offline' } }); });
  await page.goto('/dev/ui');
  await page.evaluate(async value => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => { const request = indexedDB.open('minerva-atlas', 1); request.onupgradeneeded = () => request.result.createObjectStore('saves'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise<void>((resolve, reject) => { const tx = db.transaction('saves', 'readwrite'); tx.objectStore('saves').put(value, 'root-atlas'); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close();
  }, save);
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit lenses', exact: true }).click();
  const panel = page.getByRole('dialog', { name: 'Lenses', exact: true });
  await expect(panel.getByRole('status')).toContainText('1 historical');
  await expect(panel.getByText('1 new or updated revisions await classification.', { exact: false })).toBeVisible();
  await panel.getByText('Original grouping · 6', { exact: true }).click();
  await panel.getByRole('button', { name: 'A food hall · r1', exact: true }).click();
  await expect(panel.getByRole('region', { name: 'Frozen member', exact: true })).toContainText(original.body);
  await panel.getByRole('button', { name: 'Include 1 revisions', exact: true }).click();
  await expect(panel.getByRole('status')).toContainText('7 revisions · 6 assigned · 1 unassigned · 1 historical');
  await expect(panel.getByRole('region', { name: 'Group: Unassigned', exact: true })).toContainText('A teaching kitchen · r2');
  await panel.getByRole('button', { name: 'Undo lens edit', exact: true }).click();
  await expect(panel.getByRole('status')).toContainText('6 revisions · 6 assigned · 0 unassigned · 1 historical');
  expect(calls).toBe(0);
});
