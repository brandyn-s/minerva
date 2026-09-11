import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { previewAccess } from './expedition-browser-context.mjs';
import { verifyExpedition } from './expedition-journey.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
let page;
const artifacts = process.env.MINERVA_ARTIFACTS ?? 'evaluation-artifacts/expedition';
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await previewAccess(context);
  page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await verifyExpedition(page, process.env.MINERVA_URL ?? 'http://127.0.0.1:3012', artifacts);
  assert.deepEqual(errors, []);
} catch (error) {
  await mkdir(artifacts, { recursive: true });
  await page?.screenshot({ path: `${artifacts}/failure.png` }).catch(() => {});
  await writeFile(`${artifacts}/failure.txt`, await page?.locator('body').innerText() ?? '').catch(() => {});
  throw error;
} finally { await browser.close(); }
