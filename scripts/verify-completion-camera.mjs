import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const card = title => ({ title, summary: `${title} summary`, body: `${title} proposal` });
try {
  for (const feature of ['wander', 'weave', 'expedition']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    let requested;
    const started = new Promise(resolve => { requested = resolve; });
    await page.route('**/api/moves', route => route.fulfill({ json: { moves: [1, 2, 3].map(i => ({ title: `Move ${i}`, question: 'What next?', preview: 'A next step.' })) } }));
    await page.route(`**/api/${feature}`, async route => {
      requested();
      await pending;
      const json = feature === 'wander' ? { cards: [card('New one'), card('New two')] }
        : feature === 'weave' ? { card: card('Woven result'), contributions: ['Tables', 'Tools'] }
          : { card: card('Expedition result'), rationale: 'A practical next step.', reached: true, reason: 'Goal reached.' };
      await route.fulfill({ json });
    });
    await page.goto(process.env.MINERVA_URL || 'http://127.0.0.1:3000');
    await page.locator('.thought').first().waitFor();
    const button = name => page.getByRole('button', { name, exact: true });
    for (const id of feature === 'weave' ? ['food', 'tools'] : ['repair']) {
      await page.locator(`[data-id="${id}"] .select-card`).click();
    }
    await button(feature === 'wander' ? 'Wander' : feature === 'weave' ? 'Weave' : 'Expedition').click();
    if (feature === 'wander') await button('Explore freely').click();
    if (feature === 'expedition') {
      await page.getByLabel('Where would you like to take this idea?').fill('Create a practical service');
      await button('Start expedition').click();
    }
    await started;
    await page.locator('.field').focus();
    await page.keyboard.press('-');
    await page.waitForTimeout(400);
    await page.mouse.move(50, 450);
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(400);
    const transform = () => page.locator('.react-flow__viewport').getAttribute('style');
    const before = await transform();
    release();
    await page.waitForFunction(count => document.querySelectorAll('.thought').length === count, feature === 'wander' ? 8 : 7);
    if (feature === 'expedition') await page.locator('.expedition-stop').waitFor();
    await page.waitForTimeout(700);
    assert.equal(await transform(), before, `${feature} completion preserves the camera moved during generation`);
    assert.deepEqual(errors, []);
    console.log(`${feature}: camera unchanged after completion`);
    await page.close();
  }
} finally { await browser.close(); }
