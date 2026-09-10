import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base=process.env.MINERVA_URL??'http://127.0.0.1:3012';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base);await page.getByRole('button',{name:'Expedition panel',exact:true}).first().click();
 const panel=page.getByRole('dialog',{name:'Expedition',exact:true});await panel.getByLabel('Exploration goal',{exact:true}).fill('Synthetic population verification');
 await panel.getByLabel('Maximum calls, including assessments').fill('12');await panel.getByRole('button',{name:'Start expedition',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Expedition"]')?.textContent?.includes('completed · 12/12'),{},{timeout:60000});
 await panel.getByRole('button',{name:/Synthetic proposal/}).first().click();
 await panel.getByLabel('Challenge this reading',{exact:true}).fill('The grouping may hide different mechanisms');await panel.getByLabel('Intervention to test on selected candidate').fill('Use direct peer negotiation');
 await panel.getByRole('button',{name:'Test intervention — add 2 calls'}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Expedition"]')?.textContent?.includes('Intervention: completed'),{},{timeout:60000});
 await panel.getByRole('button',{name:'Run allocation probe — no model calls'}).click();await panel.getByText(/Observed 5 allocated/).waitFor();
 await panel.getByRole('button',{name:'Reassess — add 1 call'}).click();
 await page.waitForFunction(()=>document.querySelector('[aria-label="Expedition"]')?.textContent?.includes('completed · 15/15'),{},{timeout:60000});
 mkdirSync('evaluation-artifacts/transition',{recursive:true});await panel.screenshot({path:'evaluation-artifacts/transition/expedition-panel.png'});
 await page.setViewportSize({width:390,height:844});await panel.screenshot({path:'evaluation-artifacts/transition/expedition-touch.png'});await page.setViewportSize({width:1440,height:1000});
 await page.reload();await page.getByRole('button',{name:'Expedition panel',exact:true}).first().click();await page.getByRole('button',{name:'Synthetic population verification',exact:true}).first().click();
 await panel.getByRole('button',{name:/Synthetic proposal/}).first().click();await panel.getByRole('button',{name:'Inspect on atlas',exact:true}).click();
 await page.getByRole('dialog',{name:/Synthetic proposal/}).waitFor();
 assert.equal(errors.length,0,errors.join('\n'));
 mkdirSync('evaluation-artifacts/transition',{recursive:true});await page.screenshot({path:'evaluation-artifacts/transition/expedition.png'});
 console.log('PASS: durable synthetic run, intervention, simulation probe, reload and materialization; no model calls.');
}finally{await browser.close();}
