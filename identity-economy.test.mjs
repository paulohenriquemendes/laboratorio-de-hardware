import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {chromium} from 'playwright';
import {SUPABASE_URL,SUPABASE_KEY} from './src/online-config.js';
import {cases} from './src/cases.js';
import {challengeOrder} from './src/challenge-order.js';
import {baseReward,caseReward,MAX_EARNINGS,money} from './src/economy.js';
import {accessories,stylePoints} from './src/cosmetics.js';
const clients=Array.from({length:3},()=>createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}));const [student,peer,teacher]=clients;
const rpc=async(client,name,args)=>{const {data,error}=await client.rpc(name,args);assert.equal(error,null,error?.message);return data;};
let browser;
try{
 for(const c of clients)assert.equal((await c.auth.signInAnonymously()).error,null);
 await rpc(student,'lab_open_admin');const room=await rpc(student,'lab_join',{p_room:null,p_name:'Inicial QA',p_title:'QA identidade e reais '+Date.now()});
 await rpc(student,'lab_admin',{p_operation:'logout',p_room:room.id});
 await rpc(peer,'lab_join',{p_room:room.id,p_name:'Colega QA'});
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});const context=await browser.newContext({viewport:{width:1280,height:900}});
 const auth=(await student.auth.getSession()).data.session;await context.addInitScript(session=>localStorage.setItem('hardware-coop.auth',JSON.stringify(session)),auth);
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));const url=new URL(process.env.GAME_URL||'http://127.0.0.1:4181/');url.searchParams.set('sala',room.id);await p.goto(url.href);
 await p.click('#joinTeam');assert.ok(await p.locator('#welcome').evaluate(e=>e.open));await p.fill('#registrationName','Ana');await p.fill('#registrationClass','Informática QA');await p.click('#joinTeam');assert.ok(await p.locator('#registrationName').evaluate(e=>!!e.validationMessage));
 await p.fill('#registrationName','Ana Completa Privada QA');await p.fill('#nickname','Raio QA');await p.click('#joinTeam');await p.waitForFunction(()=>window.oficina.state.online?.connected&&!document.querySelector('#welcome').open);
 const identity=await rpc(student,'lab_student_identity',{p_room:room.id});assert.equal(identity.full_name,'Ana Completa Privada QA');assert.equal(identity.class_name,'Informática QA');
 const snapshot=JSON.stringify(await rpc(peer,'lab_snapshot',{p_room:room.id}));assert.ok(!snapshot.includes(identity.full_name));assert.ok(!snapshot.includes(identity.class_name));assert.ok((await peer.rpc('lab_student_report',{p_room:room.id})).error);
 await rpc(teacher,'lab_open_admin');const privateReport=await rpc(teacher,'lab_student_report',{p_room:room.id});assert.equal(privateReport.students.find(s=>s.full_name===identity.full_name).nickname,'Raio QA');
 let earned=0;const full={style:7,color:'#613b22',...Object.fromEntries(accessories.map(a=>[a.key,true]))};
 assert.ok((await student.rpc('lab_wardrobe',{p_room:room.id,p_appearance:full})).error);
 const order=[...challengeOrder].reverse();
 for(const [index,pc] of order.entries()){
  const act=(kind,choice=null,request=crypto.randomUUID())=>rpc(student,'lab_action_v3',{p_room:room.id,p_round:room.round,p_pc:pc,p_kind:kind,p_choice:choice,p_request:request});
  await act('claim');await act('test',0);await act('test',1);
  const errorCount=index===0?1:0;
  if(errorCount){const request=crypto.randomUUID();await act('diagnosis',(cases[pc].answer+1)%3,request);await act('diagnosis',(cases[pc].answer+1)%3,request);}
  await act('diagnosis',cases[pc].answer);await act('repair',cases[pc].repair);const request=crypto.randomUUID();await act('validate',null,request);await act('validate',null,request);
  earned+=caseReward(pc,errorCount);
  if(index===18){assert.ok(earned>=800);assert.ok((await student.rpc('lab_wardrobe',{p_room:room.id,p_appearance:{style:0,color:'#613b22',sandals:true}})).error);}
  if(index===19){assert.equal((await rpc(student,'lab_wardrobe',{p_room:room.id,p_appearance:{style:0,color:'#613b22',sandals:true}})).sandals,true);}
  if((index+1)%20===0)console.log('PASS recompensas e desafios:',index+1,earned);
 }
 assert.equal(earned,MAX_EARNINGS-5);assert.deepEqual(await rpc(student,'lab_wardrobe',{p_room:room.id,p_appearance:full}),full);
 const snap=await rpc(student,'lab_snapshot',{p_room:room.id});assert.equal(snap.scores.find(s=>s.user_id===auth.user.id).score,earned);assert.equal(snap.scores.find(s=>s.user_id===auth.user.id).solved,80);
 // Reload only this QA student; the live student's rounds are not touched.
 await p.reload();await p.click('#joinTeam');await p.waitForFunction(()=>window.oficina.state.online?.connected&&!document.querySelector('#welcome').open);await p.waitForFunction(()=>window.oficina.state.progress.every(s=>s.validated));assert.equal(await p.locator('#score').innerText(),money(earned));
 await p.click('#wardrobeButton');assert.equal(await p.locator('#wardrobeCatalog img').count(),17);assert.ok(await p.locator('[data-item=sandals]').isEnabled());assert.ok(await p.locator('[data-item=tattooStar]').isEnabled());
 await p.click('[data-item=tattooStar]');await p.click('[data-item=tattooStar]');await p.click('#saveAppearance');await p.waitForFunction(()=>window.oficina.state.appearance.tattooStar);await p.screenshot({path:'test-results/skins-reais.png'});await p.click('#closeTeam');
 await p.click('#notesButton');await p.waitForFunction(()=>document.querySelector('#studentFullName').value==='Ana Completa Privada QA');await p.click('#closeNotes');
 await p.click('#help');await p.fill('#nickname','');await p.click('#joinTeam');await p.waitForFunction(()=>window.oficina.state.online?.connected&&!document.querySelector('#welcome').open);assert.equal((await rpc(student,'lab_snapshot',{p_room:room.id})).scores.find(s=>s.user_id===auth.user.id).name,'Ana');
 await p.click('#help');await p.click('#start');await p.click('#classroomButton');const downloading=p.waitForEvent('download');await p.click('#downloadReport');const file=await(await downloading).path();const content=fs.readFileSync(file,'utf8');assert.match(content,/Ana Completa Privada QA/);assert.match(content,/Informática QA/);assert.match(content,/Recompensas fictícias/);
 await rpc(teacher,'lab_admin',{p_operation:'reset',p_room:room.id,p_round:room.round});const reset=await rpc(student,'lab_wardrobe',{p_room:room.id});assert.equal(reset.style,0);for(const item of accessories)assert.equal(reset[item.key],false);
 assert.deepEqual(errors,[]);console.log('PASS nome privado, apelido/primeiro nome, 80 recompensas, 17 miniaturas, chinelo por valor + quantidade, relatório e reset QA');
}finally{for(const c of clients)c.auth.stopAutoRefresh();if(browser)await browser.close();}
