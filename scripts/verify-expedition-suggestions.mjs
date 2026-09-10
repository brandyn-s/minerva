import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch(),page=await browser.newPage();let calls=0;
const suggestions=[{title:'Change the scale',direction:'Explore the idea at neighborhood scale.'},{title:'Make it temporary',direction:'Explore reversible short-lived versions.'},{title:'Share ownership',direction:'Explore collective ownership.'}];
try{
 await page.route('**/api/**',route=>{if(route.request().url().endsWith('/api/expedition/suggestions')){calls++;return route.fulfill({json:{suggestions}});}if(route.request().method()==='POST')return route.abort();return route.continue();});
 await page.goto(process.env.MINERVA_URL??'http://127.0.0.1:3086');await page.getByRole('button',{name:'Expedition panel',exact:true}).click();const panel=page.getByRole('dialog',{name:'Expedition',exact:true}),choices=panel.getByRole('region',{name:'Suggested directions'});
 await choices.getByRole('button',{name:'Change the scale',exact:true}).click();assert.equal(await choices.getByRole('button').count(),3);assert.equal(await panel.getByLabel('Direction (optional)',{exact:true}).inputValue(),suggestions[0].direction);
 await panel.getByRole('button',{name:'Close panel',exact:true}).click();await page.getByRole('button',{name:'Expedition panel',exact:true}).click();await choices.getByRole('button',{name:'Share ownership',exact:true}).click();assert.equal(calls,1);assert.equal(await panel.getByLabel('Direction (optional)',{exact:true}).inputValue(),suggestions[2].direction);
 console.log('PASS: three tailored suggestion buttons, editable selection and cached reopen; mocked model response, no run started.');
}finally{await browser.close();}
