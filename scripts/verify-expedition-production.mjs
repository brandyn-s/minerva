import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base=process.env.MINERVA_URL;if(!base)throw new Error('Specify production URL');
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
let posts=0;
try{
 const response=await context.request.get(base+'/api/expedition/runs');assert.equal(response.status(),200);const settings=await response.json();assert.equal(settings.configured,true);assert.equal(settings.limitMicros,6000000,'Production must use live configuration');
 await page.route('**/api/**',route=>{if(route.request().url().endsWith('/api/expedition/suggestions'))return route.fulfill({status:503,json:{error:'Suggestions disabled for read-only verification'}});if(route.request().method()==='POST'){posts++;return route.abort();}return route.continue();});
 await page.goto(base);await page.getByRole('button',{name:'Thoughts 6',exact:true}).click();const browse=page.getByRole('dialog',{name:'Thought index'});await browse.getByRole('searchbox').fill('food');await browse.getByRole('checkbox').check();await browse.getByRole('button',{name:'Close panel',exact:true}).click();await page.getByRole('button',{name:'Expedition panel',exact:true}).click();const panel=page.getByRole('dialog',{name:'Expedition',exact:true});
 await panel.getByText(/Up to \$6.00 per expedition/).waitFor();assert.equal(await panel.getByRole('textbox').count(),1);assert.equal(await panel.getByRole('spinbutton').count(),0);assert.equal(await panel.getByRole('button',{name:'Start expedition',exact:true}).isEnabled(),true);
 mkdirSync('evaluation-artifacts/simple-start',{recursive:true});await panel.screenshot({path:'evaluation-artifacts/simple-start/production-mobile.png'});
 await panel.getByText('Spending limit',{exact:true}).click();await panel.getByLabel('Limit per expedition (USD)',{exact:true}).fill('2');await panel.getByText(/Up to \$2.00 per expedition/).waitFor();assert.equal(await page.evaluate(()=>localStorage.getItem('minerva-expedition-limit')),'2');assert.equal(posts,0);
 console.log('PASS: production store ready, live configuration, selection-only Start enabled, one optional direction, remembered limit. No run started and no model calls.');
}finally{await browser.close();}
