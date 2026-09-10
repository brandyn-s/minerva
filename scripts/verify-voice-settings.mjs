import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const events=[]; const errors=[]; let microphones=0;
 page.on('pageerror',e=>errors.push(e.message));
 await page.exposeFunction('microphoneUsed',()=>{microphones++;});
 await page.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{await window.microphoneUsed(); throw new Error('Microphone should not open for a preview');};});
 await page.route('**/api/voice',route=>route.fulfill({json:{token:'fixture',url:'wss://voice.test/realtime-model',tools:[]}}));
 await page.routeWebSocket('wss://voice.test/realtime-model',socket=>{
  const send=e=>socket.send(JSON.stringify({...e,raw:{}}));
  socket.onMessage(raw=>{const e=JSON.parse(String(raw));events.push(e);
   if(e.type==='session-update') send({type:'session-updated'});
   if(e.type==='response-create') {send({type:'response-created',responseId:'sample'});send({type:'audio-transcript-done',itemId:'sample',responseId:'sample',transcript:'Hello from Minerva.'});send({type:'response-done',responseId:'sample',status:'completed'});}
  });
 });
 await page.goto(process.env.MINERVA_URL||'http://127.0.0.1:3198');
 await page.getByRole('button',{name:'Talk to Minerva',exact:true}).click();
 await page.getByRole('button',{name:'Voice settings',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Minerva’s voice'});
 await dialog.getByRole('combobox',{name:'Voice',exact:true}).selectOption('cedar');
 await dialog.getByLabel('Response length').selectOption('Detailed');
 await dialog.getByLabel('Custom instructions').fill('Challenge my assumptions with concrete examples.');
 await dialog.getByLabel('End-of-turn detection').selectOption('semantic-vad');
 assert.ok(await dialog.getByRole('slider').first().isDisabled());
 await dialog.getByRole('button',{name:'Preview voice',exact:true}).click();
 await page.waitForFunction(()=>!document.querySelector('.voice-settings-dialog fieldset').disabled);
 assert.equal(microphones,0);
 const config=events.find(e=>e.type==='session-update').config;
 assert.equal(config.voice,'cedar'); assert.equal(config.turnDetection,null); assert.match(config.instructions,/Challenge my assumptions/);
 await page.reload();
 await page.getByRole('button',{name:'Talk to Minerva',exact:true}).click();
 await page.getByRole('button',{name:'Voice settings',exact:true}).click();
 assert.equal(await dialog.getByRole('combobox',{name:'Voice',exact:true}).inputValue(),'cedar');
 assert.equal(await dialog.getByLabel('Response length').inputValue(),'Detailed');
 await page.screenshot({path:'/tmp/minerva-voice-settings-mobile.png'});
 assert.ok(await dialog.evaluate(el=>el.getBoundingClientRect().width<=innerWidth));
 await dialog.getByRole('button',{name:'Reset defaults'}).click();
 assert.equal(await dialog.getByRole('combobox',{name:'Voice',exact:true}).inputValue(),'marin');
 await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);
 assert.deepEqual(errors,[]);
 console.log('Passed: settings, persistence, reset, mobile dialog, microphone-free preview, and normalized session preferences (mock transport).');
} finally {await browser.close();}
