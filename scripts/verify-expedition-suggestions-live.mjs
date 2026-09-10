// Explicit opt-in: one bounded suggestion call, never an Expedition run.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
if(process.env.MINERVA_LIVE_SUGGESTIONS!=='1')throw new Error('Explicit live suggestion verification required');
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:390,height:844}});let calls=0;
try{
 await page.route('**/api/**',route=>{if(route.request().method()!=='POST')return route.continue();if(route.request().url().endsWith('/api/expedition/suggestions')&&++calls===1)return route.continue();return route.abort();});
 await page.goto('https://www.thalient.ai');await page.getByRole('button',{name:'Thoughts 6',exact:true}).click();const browse=page.getByRole('dialog',{name:'Thought index'});await browse.getByRole('searchbox').fill('food');await browse.getByRole('checkbox').check();await browse.getByRole('button',{name:'Close panel',exact:true}).click();
 const response=page.waitForResponse(r=>r.url().endsWith('/api/expedition/suggestions'),{timeout:90000});await page.getByRole('button',{name:'Expedition panel',exact:true}).click();const result=await response;assert.equal(result.status(),200);const data=await result.json();assert.equal(data.suggestions.length,3);
 const panel=page.getByRole('dialog',{name:'Expedition',exact:true}),choices=panel.getByRole('region',{name:'Suggested directions'});await choices.getByRole('button',{name:data.suggestions[0].title,exact:true}).click();assert.equal(await panel.getByLabel('Direction (optional)',{exact:true}).inputValue(),data.suggestions[0].direction);
 mkdirSync('evaluation-artifacts/suggestions',{recursive:true});writeFileSync('evaluation-artifacts/suggestions/live.json',JSON.stringify(data,null,2),{mode:0o600});await panel.screenshot({path:'evaluation-artifacts/suggestions/live-mobile.png'});
 await panel.getByRole('button',{name:'Close panel',exact:true}).click();await page.getByRole('button',{name:'Expedition panel',exact:true}).click();await choices.getByRole('button',{name:data.suggestions[1].title,exact:true}).click();assert.equal(calls,1);
 console.log('PASS: one live LLM call returned three selectable directions; reopening reused them. No expedition started.');
}finally{await browser.close();}
