import {previewAccess,mockDirections} from "./expedition-browser-context.mjs";
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base=process.env.MINERVA_URL??'http://127.0.0.1:3086';
const browser=await chromium.launch(),context=await browser.newContext(),page=await context.newPage();
try{
 await previewAccess(context);await mockDirections(page);
 const settings=await (await context.request.get(base+'/api/expedition/runs')).json();assert.equal(settings.limitMicros,0,'Synthetic verification only');
 await page.goto(base);await page.getByRole('button',{name:'Thoughts 6',exact:true}).click();const browse=page.getByRole('dialog',{name:'Thought index'});await browse.getByRole('searchbox').fill('food');await browse.getByRole('checkbox').check();await browse.getByRole('button',{name:'Close panel',exact:true}).click();
 await page.getByRole('button',{name:'Expedition panel',exact:true}).click();const panel=page.getByRole('dialog',{name:'Expedition',exact:true});
 assert.equal(await panel.getByRole('textbox').count(),1);assert.equal(await panel.getByRole('spinbutton').count(),0);assert.equal(await panel.getByRole('combobox').count(),0);await panel.getByRole('button',{name:'Start expedition',exact:true}).waitFor();
 mkdirSync('evaluation-artifacts/simple-start',{recursive:true});await page.setViewportSize({width:1440,height:1000});await panel.screenshot({path:'evaluation-artifacts/simple-start/desktop.png'});await page.setViewportSize({width:390,height:844});await panel.screenshot({path:'evaluation-artifacts/simple-start/mobile.png'});
 const response=page.waitForResponse(r=>r.url().endsWith('/api/expedition/runs')&&r.request().method()==='POST');await panel.getByRole('button',{name:'Start expedition',exact:true}).click();const run=await (await response).json();assert.equal(run.initial.length,1);assert.equal(run.direction,'');assert.ok(run.goal.length);assert.equal(run.status,'running');
 const loopback=['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname);
 if(!loopback)assert.ok(run.owner,'Hosted runs must have browser ownership');
 if(run.owner){const second=await browser.newContext();await previewAccess(second);assert.equal((await second.request.get(base+'/api/expedition/runs?id='+run.id)).status(),404,'Another browser cannot read this run');await second.close();}
 const stop=await context.request.post(base+'/api/expedition/runs',{data:{action:'stop',id:run.id}});assert.equal((await stop.json()).status,'stopped');
 console.log(`PASS: selection starts with no typing, compact desktop/mobile form; ${run.owner?'hosted browser ownership checked':'shared loopback store; hosted ownership not exercised'}. Synthetic only.`);
}finally{await browser.close();}
