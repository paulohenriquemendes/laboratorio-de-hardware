import {mockClassroom,enterClassroom} from './classroom-test-support.mjs';
import {caseReward,money,MAX_EARNINGS} from './src/economy.js';
import {challengeOrder,pcLabel} from './src/challenge-order.js';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {cases,blocked} from './src/cases.js';
import {stations,spawn} from './src/layout.js';
import {challenges} from './src/challenges.js';
import fs from 'node:fs';
fs.mkdirSync('test-results',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:900}});await mockClassroom(context);const page=await context.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const state=()=>page.evaluate(()=>window.oficina.state);
async function move(key,axis,value,greater){await page.keyboard.down(key);try{await page.waitForFunction(({axis,value,greater})=>greater?window.oficina.state.position[axis]>=value:window.oficina.state.position[axis]<=value,{axis,value,greater},{timeout:60000,polling:'raf'})}finally{await page.keyboard.up(key)}}
async function solve(i){await page.waitForFunction(i=>window.oficina.state.near===i,i);await page.keyboard.press('e');await page.waitForSelector('#panel[open]');assert.match(await page.locator('#caseTag').innerText(),new RegExp('PC '+pcLabel(i)));assert.equal(await page.locator('[data-diagnosis]:disabled').count(),3);for(let t=0;t<2;t++)await page.click(`[data-test="${t}"]`);for(let a=0;a<3;a++)if(a!==cases[i].answer)await page.click(`[data-diagnosis="${a}"]`);await page.click(`[data-diagnosis="${cases[i].answer}"]`);for(let a=0;a<3;a++)if(a!==cases[i].repair)await page.click(`[data-repair="${a}"]`);await page.click(`[data-repair="${cases[i].repair}"]`);assert.equal((await state()).progress[i].validated,false);await page.click('[data-action="validate"]');for(let a=0;a<3;a++)if(a!==challenges[i].answer)await page.click(`[data-challenge="${a}"]`);await page.click(`[data-challenge="${challenges[i].answer}"]`);await page.waitForFunction(()=>!window.oficina.state.busy);assert.equal((await state()).progress[i].challenge,true);assert.equal((await state()).computerColors[i],'3cb769');await page.keyboard.press('Escape');console.log(`PASS PC ${pcLabel(i)}, bancada ${stations[i].bench}, lado ${stations[i].side}: acesso e missão completa`)}
try{
await enterClassroom(page,process.env.GAME_URL||'http://127.0.0.1:4181/');assert.equal((await state()).benchCount,10);assert.equal((await state()).stations.length,80);assert.deepEqual(await page.locator('#joblist .num').allTextContents(),challengeOrder.map(pcLabel));assert.deepEqual(await page.locator('#joblist .job > div').evaluateAll(els=>els.map(e=>e.firstChild.textContent)),challengeOrder.map(id=>cases[id].title));await page.keyboard.press('e');assert.equal(await page.locator('#panel[open]').count(),0);
await page.click('#mapButton');await page.waitForTimeout(1600);const before=(await state()).position;await page.keyboard.press('w');assert.deepEqual((await state()).position,before);await page.screenshot({path:'test-results/laboratorio-geral.png'});await page.click('#mapButton');await page.waitForTimeout(900);await page.screenshot({path:'test-results/laboratorio-tecnico.png'});
const lastWallOnly=process.env.TEST_LAST_WALL==='1';
if(lastWallOnly){await move('d','x',36.6,true);for(let i=79;i>=70;i--){await move('w','z',stations[challengeOrder[i]].useZ,false);await solve(challengeOrder[i])}}
for(const offset of lastWallOnly?[]:[0,40]){const x=offset?28:0;
 if(offset){await move('s','z',18.3,true);await move('d','x',x+3.9,true);}
 for(let i=offset+19;i>=offset+10;i--){await move('w','z',stations[challengeOrder[i]].useZ,false);await solve(challengeOrder[i])}
 await move('w','z',-18.3,false);await move('a','x',x-3.9,false);
 for(let i=offset;i<offset+10;i++){await move('s','z',stations[challengeOrder[i]].useZ,true);await solve(challengeOrder[i])}
 await move('s','z',18.3,true);await move('a','x',x-8.6,false);
 for(let i=offset+29;i>=offset+20;i--){await move('w','z',stations[challengeOrder[i]].useZ,false);await solve(challengeOrder[i])}
 await move('w','z',-18.3,false);await move('d','x',x+8.6,true);
 for(let i=offset+30;i<offset+40;i++){await move('s','z',stations[challengeOrder[i]].useZ,true);await solve(challengeOrder[i])}
}
const expectedScore=(lastWallOnly?challengeOrder.slice(70):challengeOrder).reduce((sum,id)=>sum+caseReward(id,4),0);const expectedCount=lastWallOnly?10:80;assert.equal((await state()).score,expectedScore);assert.equal((await state()).progress.filter(p=>p.validated&&p.challenge).length,expectedCount);

await page.reload();await page.click('#joinTeam');await page.waitForFunction(()=>window.oficina.state.online?.connected&&!document.querySelector('#welcome').open);assert.equal((await state()).score,expectedScore);assert.equal((await state()).computerColors.filter(c=>c==='3cb769').length,expectedCount);await page.click('#classroomButton');assert.match(await page.locator('#classContent').innerText(),new RegExp('Conceitos na prática · '+expectedCount+'/80'));const pending=page.waitForEvent('download');await page.click('#downloadReport');await (await pending).saveAs('test-results/student-report.txt');assert.ok(fs.readFileSync('test-results/student-report.txt','utf8').includes(money(expectedScore)+' / '+money(MAX_EARNINGS)));await page.click('#closeClass');
assert.deepEqual(errors,[]);fs.writeFileSync('test-results/report.json',JSON.stringify({passed:true,computers:expectedCount,benches:10,score:expectedScore,errors,date:new Date().toISOString()},null,2));
}finally{await browser.close()}
