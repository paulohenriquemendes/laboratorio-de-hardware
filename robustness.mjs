import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fresh} from './src/cases.js';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
const results=[],errors=[];
const context=await browser.newContext({viewport:{width:1366,height:768}});
const page=await context.newPage();
function monitor(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('requestfailed',r=>errors.push(r.url()))}
monitor(page);
const state=()=>page.evaluate(()=>window.oficina.state);
async function check(name,fn){await fn();results.push(name);console.log('PASS '+name)}
async function approach(){await page.keyboard.down('ArrowUp');try{await page.waitForFunction(()=>window.oficina.state.position.z<5.2,null,{timeout:10000})}finally{await page.keyboard.up('ArrowUp')}await page.click('#interact')}
async function reloadCase(){await page.reload();await page.click('#start');await approach()}
try{
await page.goto((process.env.GAME_URL || 'http://127.0.0.1:4180/'));await page.click('#start');
await check('Setas, teclas opostas, perda de foco e teclado nos menus',async()=>{
await page.keyboard.down('ArrowLeft');await page.waitForFunction(()=>window.oficina.state.position.x<-.3);await page.keyboard.up('ArrowLeft');
await page.keyboard.down('a');await page.keyboard.down('d');await page.waitForTimeout(80);const a=await state();await page.waitForTimeout(200);assert.equal((await state()).position.x,a.position.x);await page.keyboard.up('a');await page.keyboard.up('d');
await page.keyboard.down('s');await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForTimeout(80);const b=await state();await page.waitForTimeout(200);assert.deepEqual((await state()).position,b.position);await page.keyboard.up('s');
await page.click('#help');await page.locator('#start').focus();await page.keyboard.press('Space');assert.equal(await page.locator('#welcome[open]').count(),0);
await page.click('#classroomButton');const c=await state();await page.keyboard.press('w');assert.deepEqual((await state()).position,c.position);await page.keyboard.press('Escape');
});
await check('Câmera por arraste e tecla R',async()=>{const before=(await state()).angle;await page.mouse.move(1000,600);await page.mouse.down();await page.mouse.move(1100,600,{steps:8});await page.mouse.up();assert.ok((await state()).angle<before-.3);await page.keyboard.down('r');await page.waitForTimeout(300);await page.keyboard.up('r');assert.ok((await state()).angle<before-.4)});
await page.reload();await page.click('#start');await approach();
await check('Persistência intermediária: pistas, diagnóstico, reparo, entrega e desafio',async()=>{
await page.click('[data-test="0"]');assert.equal(await page.locator('[data-diagnosis]:disabled').count(),3);await reloadCase();assert.equal(await page.locator('[data-test="0"]:disabled').count(),1);assert.equal((await state()).progress[4].tests.length,1);
await page.click('[data-test="1"]');await page.click('[data-diagnosis="2"]');await reloadCase();assert.equal(await page.locator('[data-repair]').count(),3);
await page.click('[data-repair="1"]');await reloadCase();assert.equal(await page.locator('[data-action="validate"]').count(),1);assert.equal((await state()).score,0);
await page.click('[data-action="validate"]');await reloadCase();assert.equal((await state()).score,150);assert.equal(await page.locator('[data-action="validate"]').count(),0);await page.click('[data-challenge="2"]');await reloadCase();assert.equal((await state()).progress[4].challenge,true);assert.equal(await page.locator('[data-challenge]').count(),0);assert.equal((await state()).score,150);await page.keyboard.press('Escape');
});
await check('Reinício cancelado preserva o turno; confirmado limpa tudo',async()=>{page.once('dialog',d=>d.dismiss());await page.click('#reset');assert.equal((await state()).score,150);page.once('dialog',d=>d.accept());await page.click('#reset');assert.deepEqual((await state()).progress,fresh());await page.reload();await page.click('#start');assert.deepEqual((await state()).progress,fresh())});
await check('Armazenamento corrompido não quebra a página nem libera respostas',async()=>{for(const raw of ['{invalid',JSON.stringify([null,null,null,null,null,null])]){await page.evaluate(raw=>localStorage.setItem('oficina3d.progress.v1',raw),raw);await page.reload();await page.click('#start');assert.deepEqual((await state()).progress,fresh())}});
await check('Sem armazenamento: jogo continua e avisa',async()=>{const isolated=await browser.newContext();await isolated.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}}));const p=await isolated.newPage();monitor(p);await p.goto((process.env.GAME_URL || 'http://127.0.0.1:4180/'));await p.click('#start');assert.match(await p.locator('#save').innerText(),/indisponível/);await p.keyboard.down('w');await p.waitForFunction(()=>window.oficina.state.near===4);await p.keyboard.up('w');await p.click('#interact');await p.click('[data-test="0"]');assert.equal(await p.evaluate(()=>window.oficina.state.progress[4].tests.length),1);await isolated.close()});
await check('Layout em notebook, projetor, celular e paisagem',async()=>{for(const [w,h] of [[1366,768],[1024,768],[1920,1080],[390,844],[844,390]]){await page.setViewportSize({width:w,height:h});await page.click('#classroomButton');assert.ok(await page.locator('#downloadReport').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`test-results/layout-${w}x${h}.png`});await page.keyboard.press('Escape')}});
await check('Toque real: andar, parar, interagir e reiniciar',async()=>{
const mobile=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await mobile.newPage();monitor(p);await p.goto((process.env.GAME_URL || 'http://127.0.0.1:4180/'));await p.locator('#start').tap();assert.ok(await p.locator('#touch').isVisible());const rect=await p.locator('[data-key="w"]').boundingBox();const cdp=await mobile.newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+rect.width/2,y:rect.y+rect.height/2}]});await p.waitForFunction(()=>window.oficina.state.position.z<5.3);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(100);const pos=await p.evaluate(()=>window.oficina.state.position);await p.waitForTimeout(200);assert.deepEqual(await p.evaluate(()=>window.oficina.state.position),pos);await p.locator('#interact').tap();await p.locator('[data-test="0"]').tap();await p.locator('[data-test="1"]').tap();assert.equal(await p.locator('[data-diagnosis]:disabled').count(),0);await p.screenshot({path:'test-results/touch-inspection.png'});await p.locator('#close').tap();await p.locator('#classroomButton').tap();p.once('dialog',d=>d.accept());await p.locator('#restartClass').tap();assert.deepEqual(await p.evaluate(()=>window.oficina.state.progress),fresh());await mobile.close();
});
assert.deepEqual(errors,[]);results.push('Zero erros de execução, console ou rede');fs.writeFileSync('test-results/robustness.json',JSON.stringify({browser:await browser.version(),passed:results,errors,date:new Date().toISOString()},null,2));
}finally{await browser.close()}
