// Physical PC 20 now uses immutable case ID 63; PC 60 uses ID 7.
import {cases} from './src/cases.js';
import {challenges} from './src/challenges.js';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fresh} from './src/cases.js';
const url=process.env.GAME_URL||'http://127.0.0.1:4181/';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1366,height:768}}),requests=[],errors=[];
page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
await page.addInitScript(()=>{window.renderedLabels=[];const original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.renderedLabels.push(String(text));return original.call(this,text,...args)}});
try{
const response=await page.goto(url);assert.equal(response.status(),200);await page.fill('#registrationName','Aluno Testes QA');await page.click('#start');assert.ok((await page.evaluate(()=>window.renderedLabels)).includes('LABORATÓRIO DE HARDWARE'));assert.ok(!(await page.evaluate(()=>window.renderedLabels)).some(t=>t.includes('ARQUITETURA + MANUTENÇÃO')||t.includes('FUNDAMENTOS')));assert.ok((await page.evaluate(()=>window.renderedLabels)).filter(t=>t==='LABORATÓRIO DE HARDWARE').length>=3);assert.equal(await page.locator('#teacherButton,#adminPanel').count(),0);
assert.ok(requests.some(r=>r.startsWith(new URL('assets/',url).href)));assert.ok(requests.every(r=>new URL(r).origin===new URL(url).origin));assert.ok(!requests.some(r=>r.includes('/src/')||r.includes('/@vite/')));
await page.keyboard.down('w');await page.waitForFunction(()=>window.oficina.state.near===63);await page.keyboard.up('w');await page.click('#interact');
await page.locator('[data-test="0"]').dblclick();assert.deepEqual(await page.evaluate(()=>window.oficina.state.progress[63].tests),[0]);await page.click('[data-test="1"]');
for(let i=0;i<12;i++)await page.click(`[data-diagnosis="${(cases[63].answer+1)%3}"]`);
await page.click(`[data-diagnosis="${cases[63].answer}"]`);await page.click(`[data-repair="${cases[63].repair}"]`);await page.locator('[data-action="validate"]').dblclick();assert.equal(await page.evaluate(()=>window.oficina.state.score),30);
await page.keyboard.press('Escape');await page.click('#interact');assert.equal(await page.locator('[data-action="validate"]').count(),0);assert.equal(await page.evaluate(()=>window.oficina.state.score),30);await page.keyboard.press('Escape');
await page.click('#classroomButton');const waitDownload=page.waitForEvent('download');await page.click('#downloadReport');const download=await waitDownload;await download.saveAs('test-results/partial-report.txt');assert.match(fs.readFileSync('test-results/partial-report.txt','utf8'),/Pontuação prática: 30 \/ 12000/);await page.keyboard.press('Escape');
const perfect=fresh().map(p=>({...p,tests:[0,1],diagnosed:true,repaired:true,validated:true,challenge:true}));await page.evaluate(p=>localStorage.setItem('laboratorioHardware80.v1',JSON.stringify(p)),perfect);await page.reload();await page.click('#start');await page.click('#classroomButton');assert.equal(await page.evaluate(()=>window.oficina.state.score),12000);const summary=await page.locator('#classContent').innerText();for(const name of ['Laboratório recuperado','Diagnóstico de primeira','Conceitos na prática'])assert.ok(summary.includes(name+' · 80/80'));await page.screenshot({path:'test-results/production-goals.png'});
assert.deepEqual(errors,[]);fs.writeFileSync('test-results/production.json',JSON.stringify({url,passed:true,checks:['Recursos compilados sob subdiretório','Nenhuma dependência externa em runtime','Clique duplo sem duplicar pistas ou pontos','Piso de pontuação no navegador','Revisão sem crédito duplicado','Download de relatório parcial','Carregamento de turno perfeito e três metas'],errors},null,2));console.log('PASS production: 7 additional checks, zero errors');
}finally{await browser.close()}
