import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';import {cases} from './src/cases.js';import {challenges} from './src/challenges.js';
const url=process.env.GAME_URL||'http://127.0.0.1:4181/laboratorio-de-hardware/';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
const errors=[];const contexts=[];async function page(){const c=await browser.newContext({viewport:{width:1366,height:900}});contexts.push(c);const p=await c.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(e.message));return p}
const a=await page(),b=await page();
async function joined(p){await p.waitForFunction(()=>window.oficina?.state.online?.connected&&document.querySelector('#welcome').open===false)}
async function walk(p,pc){await p.keyboard.down('w');try{await p.waitForFunction(pc=>window.oficina.state.near===pc,pc)}finally{await p.keyboard.up('w')}}
async function solve(p,pc){await p.click('[data-test="0"]');await p.click('[data-test="1"]');await p.click(`[data-diagnosis="${cases[pc].answer}"]`);await p.click(`[data-repair="${cases[pc].repair}"]`);await p.click('[data-action="validate"]');await p.click(`[data-challenge="${challenges[pc].answer}"]`);await p.waitForFunction(pc=>window.oficina.state.progress[pc].challenge,pc);await p.keyboard.press('Escape')}
try{
 console.log('Creating classroom');await a.goto(url);await a.fill('#nickname','Aluno Azul');await a.locator('.join-team summary').click();await a.fill('#roomTitle','Turma de teste');await a.click('#createTeam');await joined(a);
 console.log('Joining second student');const roomUrl=a.url();await b.goto(roomUrl);await b.fill('#nickname','Aluno Laranja');await b.click('#joinTeam');await joined(b);
 await a.waitForFunction(()=>window.oficina.state.online.peers.length===1);await b.waitForFunction(()=>window.oficina.state.online.peers.length===1);
 console.log('Customizing avatars');
 await a.click('#teamButton');await a.selectOption('#hairStyle','1');await a.selectOption('#hairColor','#a34324');await a.click('#saveAppearance');await a.waitForFunction(()=>window.oficina.state.appearance.style===1&&window.oficina.state.appearance.color==='#a34324');await a.click('#closeTeam');
 await b.waitForFunction(()=>window.oficina.state.online.peers[0].appearance.style===1&&window.oficina.state.online.peers[0].appearance.color==='#a34324');
 await b.click('#teamButton');await b.selectOption('#hairStyle','3');await b.selectOption('#hairColor','#d4a84b');await b.click('#saveAppearance');await b.waitForFunction(()=>window.oficina.state.appearance.style===3);await b.click('#closeTeam');
 console.log('Walking and reserving');await walk(a,19);await a.click('#interact');await a.waitForFunction(()=>document.querySelector('#panel').open);
 await b.waitForFunction(()=>window.oficina.state.online.peers[0].z<17.5);
 await b.click('#teamButton');await b.getByRole('button',{name:'Localizar Aluno Azul',exact:true}).click();await b.waitForFunction(()=>window.oficina.state.focusedPeer!==null);await b.waitForFunction(()=>window.oficina.state.online.peers[0].pc===19);await b.waitForTimeout(1200);await b.screenshot({path:'test-results/coop-localizar.png'});await b.click('#returnToMe');
 await walk(b,19);await b.click('#interact');await b.waitForFunction(()=>document.querySelector('#toast').textContent.includes('em atendimento'));assert.equal(await b.locator('#panel').evaluate(e=>e.open),false);
 await walk(b,18);await b.click('#interact');await b.waitForFunction(()=>document.querySelector('#panel').open);
 console.log('Solving two computers');await Promise.all([solve(a,19),solve(b,18)]);
 for(const p of [a,b])await p.waitForFunction(()=>window.oficina.state.progress[18].validated&&window.oficina.state.progress[19].validated&&window.oficina.state.computerColors[18]==='3cb769'&&window.oficina.state.computerColors[19]==='3cb769');
 console.log('Reload and persistence');await a.reload();await a.click('#joinTeam');await joined(a);assert.equal(await a.evaluate(()=>window.oficina.state.score),300);assert.deepEqual(await a.evaluate(()=>window.oficina.state.appearance),{style:1,color:'#a34324'});
 await b.waitForFunction(()=>window.oficina.state.online.peers.length===1);
 await a.click('#teamButton');assert.match(await a.locator('#teamMembers').innerText(),/Aluno Laranja/);assert.match(await a.locator('#teamActivity').innerText(),/Reparado por/);await a.screenshot({path:'test-results/coop-equipe.png'});await a.click('#closeTeam');
 await a.click('#mapButton');await a.screenshot({path:'test-results/coop-laboratorio.png'});await a.click('#mapButton');
 console.log('Offline and reconnect');await contexts[1].setOffline(true);await b.waitForFunction(()=>!window.oficina.state.online.connected,{},{timeout:60000});
 await contexts[1].setOffline(false);await b.waitForFunction(()=>window.oficina.state.online.connected);await b.waitForFunction(()=>window.oficina.state.progress[18].validated);
 console.log('Leaving team');await b.click('#teamButton');await b.click('#leaveTeam');await a.waitForFunction(()=>window.oficina.state.online.peers.length===0);assert.equal(await b.evaluate(()=>window.oficina.state.online),null);assert.equal(await b.evaluate(()=>window.oficina.state.score),0);
 console.log('Separate room and mobile');await b.close();const c=await page();await c.goto(url);await c.fill('#nickname','Outra turma');await c.locator('.join-team summary').click();await c.fill('#roomTitle','Sala isolada');await c.click('#createTeam');await joined(c);assert.equal(await c.evaluate(()=>window.oficina.state.online.peers.length),0);assert.equal(await c.evaluate(()=>window.oficina.state.score),0);
 await c.setViewportSize({width:390,height:844});await c.click('#teamButton');assert.equal(await c.locator('#teamDialog').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true);await c.screenshot({path:'test-results/coop-mobile.png'});
 assert.deepEqual(errors,[]);fs.writeFileSync('test-results/coop-browser.json',JSON.stringify({passed:true,url,roomUrl,checks:['Dois navegadores independentes','Cabelo e penteado personalizados persistidos e sincronizados','Localizar colega no PC em atendimento','Avatares e movimento sincronizados','Reserva concorrente','Dois reparos simultâneos em PCs diferentes','Cores e pontuação da equipe','Reconexão e persistência após reload','Saída remove avatar e restaura individual','Sala separada isolada','Painel móvel sem overflow'],errors},null,2));console.log('PASS cooperative browser end-to-end');
}catch(e){console.error(e);await a.screenshot({path:'test-results/coop-failure.png',timeout:10000}).catch(()=>{});throw e}finally{await browser.close()}
