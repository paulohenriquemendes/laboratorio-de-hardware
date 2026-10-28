import {mockClassroom,enterClassroom} from './classroom-test-support.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import {symptomScenes,symptomMarkup} from './src/symptom-animation.js';
import {cases} from './src/cases.js';
assert.equal(symptomScenes.length,cases.length);
assert.equal(new Set(symptomScenes.map(s=>s.description)).size,80);
for(let i=0;i<80;i++){assert.equal(symptomScenes[i].id,i);assert.match(symptomMarkup(i),/<svg/);assert.doesNotMatch(symptomMarkup(i),/https?:|<video|<iframe|<img/);}
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
fs.mkdirSync('test-results',{recursive:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844}});await mockClassroom(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await enterClassroom(page);
 await page.keyboard.down('w');try{await page.waitForFunction(()=>window.oficina.state.near===63);}finally{await page.keyboard.up('w');}
 await page.keyboard.press('e');await page.waitForSelector('#symptomAnimation svg');assert.equal(await page.locator('#symptomAnimation').getAttribute('data-case-id'),'63');
 await page.click('[data-motion=pause]');assert.equal(await page.locator('[data-motion=pause]').getAttribute('aria-pressed'),'true');
 await page.click('[data-motion=replay]');assert.equal(await page.locator('[data-motion=pause]').getAttribute('aria-pressed'),'false');
 await page.click('[data-test="0"]');assert.equal(await page.locator('#symptomAnimation figure').count(),1);assert.equal(await page.locator('#symptomAnimation').getAttribute('data-case-id'),'63');
 // Exercise the same rendering/control module against every stable case ID without changing progress.
 const source=fs.readFileSync('src/symptom-animation.js','utf8');await page.route('**/__animation-test.js',route=>route.fulfill({contentType:'text/javascript',body:source}));
 await page.evaluate(async()=>{window.animationTest=await import('/__animation-test.js');});
 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:844});
  for(let id=0;id<80;id++){
   await page.evaluate(id=>{document.querySelector('#symptomAnimation').dataset.caseId='';window.animationTest.showSymptomAnimation(id);},id);
   assert.equal(await page.locator('#symptomAnimation svg').count(),1);
   assert.ok(await page.locator('#symptomAnimation svg').getAttribute('aria-label'));
   assert.ok(await page.locator('#symptomAnimation').evaluate(e=>e.scrollWidth<=e.clientWidth+1),`overflow ${id} width ${width}`);
   assert.ok(await page.locator('#panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  }
 }
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.animationTest.showSymptomAnimation(32));await page.locator('#symptomAnimation').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/symptom-mouse-mobile.png'});
 const closeBox=await page.locator('#close').boundingBox(),replayBox=await page.locator('[data-motion=replay]').boundingBox();assert.ok(replayBox.x+replayBox.width<=closeBox.x||replayBox.y>=closeBox.y+closeBox.height,'Rever livre do botão de fechar');
 const movement=await page.locator('.sa-cursor').evaluate(async e=>{const a=getComputedStyle(e).transform;await new Promise(r=>setTimeout(r,2000));return [a,getComputedStyle(e).transform];});assert.notEqual(...movement);
 await page.click('[data-motion=pause]');const paused=await page.locator('.sa-cursor').evaluate(async e=>{const a=getComputedStyle(e).transform;await new Promise(r=>setTimeout(r,250));return [a,getComputedStyle(e).transform];});assert.equal(...paused);
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.animationTest.showSymptomAnimation(9));assert.equal(await page.locator('[data-motion=pause]').getAttribute('aria-pressed'),'true');
 const states=await page.locator('#symptomAnimation svg *').evaluateAll(els=>els.filter(e=>getComputedStyle(e).animationName!=='none').map(e=>getComputedStyle(e).animationPlayState));assert.ok(states.length>0);assert.ok(states.every(s=>s==='paused'));
 assert.deepEqual(errors,[]);console.log('PASS 80 animações em 320/390/1280, ficha real, evidências, movimento irregular, pausa/rever e movimento reduzido; sem mídia externa');
}finally{await browser.close();}
