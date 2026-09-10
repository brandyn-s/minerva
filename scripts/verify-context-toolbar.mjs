import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch();
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(process.env.MINERVA_URL || 'http://127.0.0.1:3198');
    await page.locator('.thought').first().waitFor();
    // Bring cards into detail mode on narrow viewports.
    for (let i = 0; i < 15 && !(await page.locator('.select-card').count()); i++) {
      await page.locator('.field').focus(); await page.keyboard.press('+'); await page.waitForTimeout(150);
    }
    const dock = page.getByRole('toolbar', { name: 'Selected thoughts' });
    assert.equal(await dock.count(), 0);
    const select = page.locator('.select-card');
    const labels = () => dock.getByRole('button').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-label') || n.textContent.trim()));
    // Keyboard activation also works for cards outside the current viewport.
    await select.nth(0).press('Enter');
    assert.deepEqual(await labels(), ['Focus', 'Develop', 'Wander', 'Expedition', 'Clear selection']);
    await select.nth(1).press('Enter');
    assert.deepEqual(await labels(), ['Focus both', 'Compare', 'Weave', 'Clear selection']);
    assert.equal(await dock.locator('.wander-action').innerText(), 'Weave');
    const beforeCount = await page.locator('.thought').count();
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    await page.route('**/api/weave', async route => {
      await pending;
      await route.fulfill({ json: { card: { title: 'Combined idea', summary: 'A fixture combination.', body: 'Combines the two source ideas.' }, contributions: ['First contribution', 'Second contribution'] } });
    });
    await dock.getByRole('button', { name: 'Weave', exact: true }).click();
    await page.getByText('Weave is combining your cards…', { exact: true }).waitFor();
    assert.deepEqual(await labels(), ['Focus both', 'Compare', 'Clear selection']);
    assert.equal(await dock.locator('button:disabled').count(), 0);
    release();
    await page.waitForFunction(count => document.querySelectorAll('.thought').length === count + 1, beforeCount);
    assert.equal(await dock.locator('.selection-count').innerText(), '2 selected');
    assert.equal(await select.nth(0).getAttribute('aria-pressed'), 'true');
    assert.equal(await select.nth(1).getAttribute('aria-pressed'), 'true');
    await select.nth(2).press('Enter');
    assert.deepEqual(await labels(), ['Focus selection', 'Clear selection']);
    await dock.getByRole('button', { name: 'Focus selection' }).click();
    assert.equal(await dock.locator('.selection-count').innerText(), '3 selected');
    await dock.getByRole('button', { name: 'Clear selection' }).focus();
    await page.keyboard.press('Escape');
    assert.equal(await dock.count(), 0);
    await page.close();
  }
  console.log('Passed: desktop/mobile selection counts 0–3, primary action, group focus, and Escape.');
} finally { await browser.close(); }
