import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {cases,blocked} from './src/cases.js';
import fs from 'node:fs';
import {challenges} from './src/challenges.js';
fs.mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('requestfailed',r=>errors.push(r.url()));
const state=()=>page.evaluate(()=>window.oficina.state);
async function move(key,axis,value,greater){await page.keyboard.down(key);try{await page.waitForFunction(({axis,value,greater})=>greater?window.oficina.state.position[axis]>=value:window.oficina.state.position[axis]<=value,{axis,value,greater},{timeout:20000,polling:'raf'});}finally{await page.keyboard.up(key)}}
async function solve(i,wrong=false){await page.waitForFunction(i=>window.oficina.state.near===i,i);await page.keyboard.press('e');await page.waitForSelector('#panel[open]');assert.equal(await page.locator('[data-diagnosis]:disabled').count(),3);const before=await state();await page.keyboard.down('w');await page.waitForTimeout(100);await page.keyboard.up('w');assert.deepEqual((await state()).position,before.position);for(let t=0;t<2;t++)await page.click(`[data-test="${t}"]`);for(let a=0;a<3;a++){if(a!==cases[i].answer){await page.click(`[data-diagnosis="${a}"]`);assert.match(await page.locator('#feedback').innerText(),/−15/)}}await page.click(`[data-diagnosis="${cases[i].answer}"]`);for(let a=0;a<3;a++){if(a!==cases[i].repair){await page.click(`[data-repair="${a}"]`);assert.match(await page.locator('#feedback').innerText(),/−15/)}}await page.click(`[data-repair="${cases[i].repair}"]`);assert.equal((await state()).progress[i].validated,false);await page.click('[data-action="validate"]');assert.equal((await state()).progress[i].validated,true);const practical=(await state()).score;for(let a=0;a<3;a++){if(a!==challenges[i].answer){await page.click(`[data-challenge="${a}"]`);assert.match(await page.locator('#feedback').innerText(),/pontuação prática foi mantida/)}}await page.click(`[data-challenge="${challenges[i].answer}"]`);assert.equal((await state()).progress[i].challenge,true);assert.equal((await state()).score,practical);if(i===2)await page.screenshot({path:'test-results/completed.png'});await page.keyboard.press('Escape');console.log(`PASS case ${i+1}: tests, diagnosis, repair, validation`);}
try{
await page.goto((process.env.GAME_URL || 'http://127.0.0.1:4180/'));await page.click('#start');await page.screenshot({path:'test-results/workshop.png'});
await page.keyboard.press('e');assert.equal(await page.locator('#panel[open]').count(),0);
await move('w','z',5.15,false);await page.keyboard.down('w');await page.waitForTimeout(1000);const collision=await state();assert.ok(collision.position.z>=4.95);assert.ok(Math.abs(collision.moving)>0);await page.keyboard.up('w');assert.ok(!blocked(collision.position.x,collision.position.z));console.log('PASS movement, walking animation, desk collision, proximity gate');
await solve(4,true);
await move('s','z',6.3,true);await move('d','x',6,true);await move('w','z',5.2,false);await solve(5);
await move('s','z',6.3,true);await move('a','x',-6,false);await move('w','z',5.2,false);await solve(3);
await move('s','z',6.3,true);await move('d','x',-3,true);await move('w','z',0,false);await move('a','x',-6,false);await move('w','z',-2.35,false);await solve(0);
await move('s','z',0,true);await move('d','x',0,true);await move('w','z',-2.35,false);await solve(1);
await move('s','z',0,true);await move('d','x',6,true);await move('w','z',-2.35,false);await solve(2);
assert.equal((await state()).score,540);assert.ok((await state()).progress.every(p=>p.validated&&p.challenge&&p.errors===4&&p.challengeErrors===2));
await move('s','z',0,true);await move('d','x',10.35,true);await page.keyboard.down('d');await page.waitForTimeout(500);await page.keyboard.up('d');assert.ok((await state()).position.x<=10.5);console.log('PASS room boundary collision');
await page.keyboard.down('q');await page.waitForTimeout(600);await page.keyboard.up('q');assert.ok((await state()).angle>.2);await page.waitForTimeout(300);assert.ok((await state()).camera.x<=10.8);console.log('PASS camera orbit and boundary');
await page.reload();await page.click('#start');assert.equal((await state()).score,540);assert.ok((await state()).progress.every(p=>p.validated));console.log('PASS saved progress after reload');
await page.click('#classroomButton');assert.match(await page.locator('#classContent').innerText(),/Conceitos na prática · 6\/6/);const downloadPromise=page.waitForEvent('download');await page.click('#downloadReport');const download=await downloadPromise;await download.saveAs('test-results/student-report.txt');assert.match(fs.readFileSync('test-results/student-report.txt','utf8'),/540 \/ 900/);await page.click('#closeClass');
await page.click('#help');assert.equal(await page.locator('#welcome[open]').count(),1);await page.click('#start');
page.once('dialog',d=>d.accept());await page.click('#reset');assert.equal((await state()).score,0);assert.ok((await state()).progress.every(p=>!p.validated));console.log('PASS help and new turn');
await page.setViewportSize({width:390,height:844});await page.click('#help');await page.screenshot({path:'test-results/mobile.png'});assert.ok(await page.locator('#start').isVisible());
assert.deepEqual(errors,[]);console.log('PASS no runtime, console or network errors');
fs.writeFileSync('test-results/report.json',JSON.stringify({passed:true,cases:6,score:540,errors,date:new Date().toISOString()},null,2));
}finally{await browser.close()}
