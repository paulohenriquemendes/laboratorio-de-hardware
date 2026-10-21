import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {cases,blocked} from './src/cases.js';
import {stations,spawn} from './src/layout.js';
import {challenges} from './src/challenges.js';
import fs from 'node:fs';
fs.mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const state=()=>page.evaluate(()=>window.oficina.state);
async function move(key,axis,value,greater){await page.keyboard.down(key);try{await page.waitForFunction(({axis,value,greater})=>greater?window.oficina.state.position[axis]>=value:window.oficina.state.position[axis]<=value,{axis,value,greater},{timeout:25000,polling:'raf'})}finally{await page.keyboard.up(key)}}
async function solve(i){await page.waitForFunction(i=>window.oficina.state.near===i,i);await page.keyboard.press('e');assert.match(await page.locator('#caseTag').innerText(),new RegExp('PC '+String(i+1).padStart(2,'0')));assert.equal(await page.locator('[data-diagnosis]:disabled').count(),3);for(let t=0;t<2;t++)await page.click(`[data-test="${t}"]`);for(let a=0;a<3;a++)if(a!==cases[i].answer)await page.click(`[data-diagnosis="${a}"]`);await page.click(`[data-diagnosis="${cases[i].answer}"]`);for(let a=0;a<3;a++)if(a!==cases[i].repair)await page.click(`[data-repair="${a}"]`);await page.click(`[data-repair="${cases[i].repair}"]`);assert.equal((await state()).progress[i].validated,false);await page.click('[data-action="validate"]');for(let a=0;a<3;a++)if(a!==challenges[i].answer)await page.click(`[data-challenge="${a}"]`);await page.click(`[data-challenge="${challenges[i].answer}"]`);assert.equal((await state()).progress[i].challenge,true);assert.equal((await state()).computerColors[i],'3cb769');await page.keyboard.press('Escape');console.log(`PASS PC ${i+1}, bancada ${stations[i].bench}, lado ${stations[i].side}: acesso e missão completa`)}
try{
await page.goto(process.env.GAME_URL||'http://127.0.0.1:4181/oficina-3d/');await page.click('#start');assert.equal((await state()).benchCount,5);assert.equal((await state()).stations.length,40);await page.keyboard.press('e');assert.equal(await page.locator('#panel[open]').count(),0);
await page.click('#mapButton');await page.waitForTimeout(1600);const before=(await state()).position;await page.keyboard.press('w');assert.deepEqual((await state()).position,before);await page.screenshot({path:'test-results/laboratorio-geral.png'});await page.click('#mapButton');await page.waitForTimeout(900);await page.screenshot({path:'test-results/laboratorio-tecnico.png'});
for(let i=19;i>=10;i--){await move('w','z',stations[i].useZ,false);assert.ok(!blocked((await state()).position.x,(await state()).position.z));await solve(i)}
await move('w','z',-18.3,false);await move('a','x',-3.9,false);
for(let i=0;i<10;i++){await move('s','z',stations[i].useZ,true);assert.ok(!blocked((await state()).position.x,(await state()).position.z));await solve(i)}
await page.keyboard.down('d');await page.waitForTimeout(650);await page.keyboard.up('d');assert.ok((await state()).position.x<=-3.45);console.log('PASS colisão com cadeiras');
await move('s','z',18.3,true);await move('a','x',-8.6,false);for(let i=29;i>=20;i--){await move('w','z',stations[i].useZ,false);await solve(i)}await move('w','z',-18.3,false);await move('d','x',8.6,true);for(let i=30;i<40;i++){await move('s','z',stations[i].useZ,true);await solve(i)}
assert.equal((await state()).score,3600);assert.ok((await state()).progress.every(p=>p.validated&&p.challenge));

await page.reload();await page.click('#start');assert.equal((await state()).score,3600);assert.ok((await state()).computerColors.every(c=>c==='3cb769'));await page.click('#classroomButton');assert.match(await page.locator('#classContent').innerText(),/Conceitos na prática · 40\/40/);const pending=page.waitForEvent('download');await page.click('#downloadReport');await (await pending).saveAs('test-results/student-report.txt');assert.match(fs.readFileSync('test-results/student-report.txt','utf8'),/3600 \/ 6000/);await page.click('#closeClass');
assert.deepEqual(errors,[]);fs.writeFileSync('test-results/report.json',JSON.stringify({passed:true,computers:40,benches:5,score:3600,errors,date:new Date().toISOString()},null,2));
}finally{await browser.close()}
