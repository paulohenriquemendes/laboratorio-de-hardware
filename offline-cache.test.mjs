import {caseReward} from './src/economy.js';
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {cases} from './src/cases.js';
let update=false,failAssets=false,assetRequests=0;
const base='/laboratorio-de-hardware/';
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!pathname.startsWith(base)){res.writeHead(404).end();return;}
  let file=pathname.slice(base.length)||'index.html';
  if(file.startsWith('assets/')){assetRequests++;if(failAssets){res.writeHead(503).end();return;}}
  let body=await readFile(path.join('dist',file));
  if(file==='sw.js'&&update)body=Buffer.from(body.toString().replace(/const VERSION='([^']+)'/,"const VERSION='$1-update-test'"));
  const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'};
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','Vary':'Origin'});res.end(body);
 }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}${base}`;
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
try{
 const context=await browser.newContext(),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url+'?sala=00000000-0000-4000-8000-000000000040');
 await p.waitForSelector('#offlineInfo[data-ready=true]');await p.waitForFunction(()=>!!navigator.serviceWorker.controller);
 assert.match(await p.locator('#offlineStatus').innerText(),/Pronto para usar/);
 assert.equal(await p.evaluate(()=>navigator.serviceWorker.controller.scriptURL),url+'sw.js');
 const adminCached=await p.evaluate(async()=>{for(const name of await caches.keys()){for(const r of await(await caches.open(name)).keys())if(r.url.includes('/admin/'))return true;}return false;});assert.equal(adminCached,false);
 await p.fill('#registrationName','Aluno Completo QA');await p.click('#start');await context.setOffline(true);await p.reload();await p.waitForSelector('#offlineInfo[data-ready=true]');
 assert.ok(await p.locator('#joinTeam').isDisabled());await p.click('#start');assert.equal(await p.locator('#offlineBanner button').isVisible(),false);assert.equal(await p.locator('#joblist .job').count(),80);
 await p.keyboard.down('w');try{await p.waitForFunction(()=>window.oficina.state.near===63)}finally{await p.keyboard.up('w')}
 await p.click('#interact');await p.click('[data-test="0"]');await p.click('[data-test="1"]');await p.click(`[data-diagnosis="${cases[63].answer}"]`);await p.click(`[data-repair="${cases[63].repair}"]`);await p.click('[data-action="validate"]');
 assert.equal(await p.evaluate(()=>window.oficina.state.score),caseReward(63));await p.close();
 const next=await context.newPage();next.on('pageerror',e=>errors.push(e.message));await next.goto(url+'?sala=00000000-0000-4000-8000-000000000040');await next.click('#start');assert.equal(await next.evaluate(()=>window.oficina.state.score),caseReward(63));
 await next.click('#classroomButton');const downloading=next.waitForEvent('download');await next.click('#downloadReport');assert.match((await downloading).suggestedFilename(),/relatorio/);await next.click('#closeClass');
 await next.setViewportSize({width:390,height:844});await next.waitForFunction(()=>document.body.classList.contains('mobile-game'));assert.ok(await next.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await context.setOffline(false);await next.waitForFunction(()=>navigator.onLine);
 // A failed update must not remove the already prepared game or the student's progress.
 update=true;failAssets=true;
 const failed=await next.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();return await new Promise(async resolve=>{reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker.addEventListener('statechange',()=>{if(worker.state==='redundant')resolve(true);if(worker.state==='activated')resolve(false);});},{once:true});await reg.update();});});assert.equal(failed,true);
 failAssets=false;await context.setOffline(true);await next.reload();await next.click('#start');assert.equal(await next.evaluate(()=>window.oficina.state.score),caseReward(63));
 // Retry the complete update; a new worker activates without deleting progress.
 await context.setOffline(false);await next.evaluate(async()=>{const reg=await navigator.serviceWorker.getRegistration();await reg.update();});
 await next.waitForFunction(async()=>{const reg=await navigator.serviceWorker.getRegistration();if(!reg?.active)return false;return await new Promise(resolve=>{const ch=new MessageChannel();ch.port1.onmessage=e=>resolve(e.data.ready&&e.data.version.endsWith('update-test'));reg.active.postMessage({type:'OFFLINE_STATUS'},[ch.port2]);});});
 await context.setOffline(true);await next.reload();await next.click('#start');assert.equal(await next.evaluate(()=>window.oficina.state.score),caseReward(63));assert.deepEqual(errors,[]);
 console.log('PASS cache por subpasta, convite offline, 80 fichas, desafio, persistência, resumo, atualização falha/recuperada e tela móvel');
 // A first ever offline visit cannot pretend that the game is prepared.
 const fresh=await browser.newContext({offline:true});const first=await fresh.newPage();await assert.rejects(first.goto(url));await fresh.close();
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
