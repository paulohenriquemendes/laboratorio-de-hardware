import {mockClassroom,enterClassroom} from './classroom-test-support.mjs';
// Physical PC 20 now uses immutable case ID 63; PC 60 uses ID 7.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {fresh,cases} from './src/cases.js';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1000}});await mockClassroom(context);const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
await enterClassroom(page,process.env.GAME_URL||'http://127.0.0.1:4181/');
await page.keyboard.down('w');await page.waitForFunction(()=>window.oficina.state.near===63);await page.keyboard.up('w');await page.click('#interact');await page.waitForSelector('#panel[open]');
const noOverlap=async()=>{const a=await page.locator('#panel [data-reading-size]').boundingBox(),b=await page.locator('#close').boundingBox();assert.ok(a.x+a.width<=b.x||a.y>=b.y+b.height||a.y+a.height<=b.y)};await noOverlap();assert.equal(await page.locator('.case-steps li').count(),5);assert.match(await page.locator('[aria-current="step"]').innerText(),/Investigar/);const standard=await page.locator('#symptom').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));await page.click('#panel [data-reading-size]');const large=await page.locator('#symptom').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert.ok(large>standard);await page.screenshot({path:'test-results/leitura-ampliada.png'});await page.click('#panel [data-reading-size]');
await page.click('[data-test="0"]');await page.click('[data-test="1"]');await page.waitForFunction(()=>!window.oficina.state.busy);assert.equal(await page.locator('.evidence-book .clue strong').count(),2);assert.match(await page.locator('[aria-current="step"]').innerText(),/Diagnosticar/);await page.locator('#panel').evaluate(e=>e.scrollTop=0);await page.screenshot({path:'test-results/leitura-desktop.png'});
await page.click(`[data-diagnosis="${cases[63].answer}"]`);await page.waitForFunction(()=>!window.oficina.state.busy);await page.locator('.evidence-book summary').click();assert.ok(await page.locator('.evidence-book .clue').first().isVisible());assert.match(await page.locator('[aria-current="step"]').innerText(),/Reparar/);
await page.setViewportSize({width:390,height:844});await noOverlap();await page.locator('#panel').evaluate(e=>e.scrollTop=0);await page.screenshot({path:'test-results/leitura-mobile.png'});assert.ok(await page.locator('#panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.click('#panel [data-reading-size]');assert.ok(await page.locator('#panel').evaluate(e=>e.scrollWidth<=e.clientWidth+1));await page.locator('#close').click();assert.equal(await page.locator('#panel[open]').count(),0);
assert.deepEqual(errors,[]);fs.writeFileSync('test-results/reading.json',JSON.stringify({passed:true,standard,large,evidencePreserved:true,mobileOverflow:false,errors},null,2));console.log('PASS reading: text size, steps, evidence, mobile, close');
}finally{await browser.close()}
