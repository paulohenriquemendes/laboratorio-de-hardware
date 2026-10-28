import {caseReward} from './src/economy.js';
import {chromium} from 'playwright';
import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import {SUPABASE_URL,SUPABASE_KEY} from './src/online-config.js';
import {cases,fresh} from './src/cases.js';
const client=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let browser;
try{
 const auth=await client.auth.signInAnonymously();assert.equal(auth.error,null);
 assert.equal((await client.rpc('lab_open_admin')).error,null);const joined=await client.rpc('lab_join',{p_room:null,p_name:'QA Offline',p_title:'QA continuidade offline '+Date.now()});assert.equal(joined.error,null);const room=joined.data;assert.equal((await client.rpc('lab_admin',{p_operation:'logout',p_room:room.id})).error,null);
 const local=fresh();Object.assign(local[0],{tests:[0,1],diagnosed:true,repaired:true,validated:true});
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});const context=await browser.newContext();
 await context.addInitScript(({session,local})=>{if(!localStorage.getItem('offline.qa.seed')){localStorage.setItem('hardware-coop.auth',JSON.stringify(session));localStorage.setItem('laboratorioHardware80.v1',JSON.stringify(local));localStorage.setItem('offline.qa.seed','1');}},{session:auth.data.session,local});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));const url=new URL(process.env.GAME_URL||'http://127.0.0.1:4181/');url.searchParams.set('sala',room.id);await p.goto(url.href);await p.waitForSelector('#offlineInfo[data-ready=true]');
 const join=async()=>{await p.fill('#registrationName','Aluno Completo QA');await p.fill('#registrationClass','Informática QA');await p.fill('#nickname','QA Offline');await p.click('#joinTeam');await p.waitForFunction(()=>window.oficina.state.online?.connected&&!document.querySelector('#welcome').open);};
 const solve=async()=>{await p.keyboard.down('w');try{await p.waitForFunction(()=>window.oficina.state.near===63)}finally{await p.keyboard.up('w')}await p.click('#interact');for(const [k,v] of [['test',0],['test',1],['diagnosis',cases[63].answer],['repair',cases[63].repair]])await p.click(`[data-${k}="${v}"]`);await p.click('[data-action=validate]');await p.waitForFunction(()=>window.oficina.state.progress[63].validated);await p.waitForFunction(()=>window.oficina.state.progress[63].validated);await p.click('#close');};
 await join();assert.equal(await p.evaluate(()=>window.oficina.state.score),0);await solve();assert.equal(await p.evaluate(()=>window.oficina.state.score),caseReward(63));
 await context.setOffline(true);await p.waitForSelector('#offlineBanner:not([hidden]) button:not([hidden])');await p.click('#offlineBanner button');
 assert.equal(await p.evaluate(()=>window.oficina.state.online),null);assert.equal(await p.evaluate(()=>window.oficina.state.progress[0].validated),true);assert.equal(await p.evaluate(()=>window.oficina.state.progress[63].validated),false);
 await solve();assert.equal(await p.evaluate(()=>window.oficina.state.score),caseReward(0)+caseReward(63));
 await context.setOffline(false);await p.click('#help');await join();assert.equal(await p.evaluate(()=>window.oficina.state.score),caseReward(63));assert.equal(await p.evaluate(()=>window.oficina.state.progress[0].validated),false);
 await p.click('#help');await p.click('#start');assert.equal(await p.evaluate(()=>window.oficina.state.score),caseReward(0)+caseReward(63));
 const snapshot=await client.rpc('lab_snapshot',{p_room:room.id});assert.equal(snapshot.error,null);assert.equal(snapshot.data.scores.find(s=>s.user_id===auth.data.user.id).score,caseReward(63));
 assert.deepEqual(errors,[]);console.log('PASS queda de turma real, prática offline, retorno à turma e preservação dos dois progressos sem duplicar pontos');
}finally{client.auth.stopAutoRefresh();if(browser)await browser.close();}
