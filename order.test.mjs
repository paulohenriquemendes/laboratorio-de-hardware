import {caseReward} from './src/economy.js';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {challengeOrder,pcLabel} from './src/challenge-order.js';
import {cases,fresh} from './src/cases.js';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:4181/');await page.fill('#registrationName','Aluno Completo QA');await page.click('#start');
 assert.deepEqual(await page.locator('#joblist .num').allTextContents(),challengeOrder.map(pcLabel));
 assert.deepEqual(await page.locator('#joblist .job > div').evaluateAll(els=>els.map(e=>e.firstChild.textContent)),challengeOrder.map(id=>cases[id].title));
 const saved=fresh();saved[0]={...saved[0],tests:[0,1],diagnosed:true,repaired:true,validated:true,challenge:true};
 await page.evaluate(p=>localStorage.setItem('laboratorioHardware80.v1',JSON.stringify(p)),saved);await page.reload();await page.click('#start');
 const state=await page.evaluate(()=>window.oficina.state);assert.equal(state.score,caseReward(0));assert.equal(state.stations[0].id,67);assert.equal(state.computerColors[0],'3cb769');assert.equal(state.progress[40].validated,false);
 assert.match(await page.locator('#joblist .job').nth(66).innerText(),/Silêncio na partida/);assert.match(await page.locator('#joblist .job').nth(66).getAttribute('class'),/done/);
 await page.keyboard.down('w');try{await page.waitForFunction(()=>window.oficina.state.near===63)}finally{await page.keyboard.up('w')};await page.click('#interact');assert.match(await page.locator('#caseTag').innerText(),/PC 20/);assert.equal(await page.locator('#caseTitle').innerText(),cases[63].title);
 assert.deepEqual(errors,[]);console.log('PASS ordem 01–80, conteúdo, progresso anterior e abertura do PC correto');
}finally{await browser.close()}
