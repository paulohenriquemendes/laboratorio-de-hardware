import assert from 'node:assert/strict';import fs from 'node:fs';import {createClient} from '@supabase/supabase-js';import {chromium} from 'playwright';
import {SUPABASE_URL,SUPABASE_KEY} from './src/online-config.js';import {cases} from './src/cases.js';
const client=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const outsider=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function rpc(name,args){const r=await client.rpc(name,args);assert.equal(r.error,null,r.error?.message);return r.data}
let browser;
try{
 const auth=await client.auth.signInAnonymously();assert.equal(auth.error,null);await outsider.auth.signInAnonymously();
 const room=await rpc('lab_join',{p_room:null,p_name:'QA Visual',p_title:'QA física e recompensas '+Date.now()});
 const base={style:0,color:'#613b22',jacket:false,gloves:false,tattoo:false};
 for(const a of [{...base,style:4},{...base,jacket:true},{...base,gloves:true},{...base,tattoo:true}])assert.ok((await client.rpc('lab_wardrobe',{p_room:room.id,p_appearance:a})).error);
 assert.ok((await outsider.rpc('lab_wardrobe',{p_room:room.id})).error);
 assert.ok((await client.from('lab_members').update({wardrobe:{...base,tattoo:true}}).eq('room_id',room.id)).error);
 for(let pc=0;pc<40;pc++){
  for(const [kind,choice] of [['claim',null],['test',0],['test',1],['diagnosis',cases[pc].answer],['repair',cases[pc].repair],['validate',null]])await rpc('lab_action_v3',{p_room:room.id,p_round:room.round,p_pc:pc,p_kind:kind,p_choice:choice,p_request:crypto.randomUUID()});
  if(pc===1)assert.equal((await rpc('lab_wardrobe',{p_room:room.id,p_appearance:{...base,style:4}})).style,4);
  if(pc===9)assert.equal((await rpc('lab_wardrobe',{p_room:room.id,p_appearance:{...base,jacket:true}})).jacket,true);
  if(pc===15)assert.equal((await rpc('lab_wardrobe',{p_room:room.id,p_appearance:{...base,gloves:true}})).gloves,true);
  if((pc+1)%10===0)console.log('PASS pontuação validada:',(pc+1)*150);
 }
 const full={...base,style:7,jacket:true,gloves:true,tattoo:true};assert.deepEqual(await rpc('lab_wardrobe',{p_room:room.id,p_appearance:full}),full);assert.deepEqual(await rpc('lab_wardrobe',{p_room:room.id}),full);
 const snap=await rpc('lab_snapshot',{p_room:room.id});assert.equal(snap.scores.find(s=>s.user_id===auth.data.user.id).score,6000);
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});const ctx=await browser.newContext({viewport:{width:1280,height:900}});await ctx.addInitScript(session=>localStorage.setItem('hardware-coop.auth',JSON.stringify(session)),auth.data.session);
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const url=new URL(process.env.GAME_URL||'http://127.0.0.1:4181/laboratorio-de-hardware/');url.searchParams.set('sala',room.id);await page.goto(url.href);await page.fill('#nickname','QA Visual');await page.click('#joinTeam');await page.waitForFunction(()=>window.oficina?.state.online?.connected&&!document.querySelector('#welcome').open);await page.click('#wardrobeButton');await page.waitForSelector('[data-item=tattoo]');assert.equal(await page.locator('[data-item=tattoo]').isEnabled(),true);assert.equal(await page.locator('#wardrobeCatalog img').count(),11);await page.screenshot({path:'test-results/wardrobe-unlocked.png'});await page.click('[data-item=hair-6]');await page.click('#saveAppearance');await page.waitForFunction(()=>window.oficina.state.appearance.style===6);await page.click('#closeTeam');
 const ctx2=await browser.newContext({viewport:{width:1100,height:800}});const peer=await ctx2.newPage();peer.on('pageerror',e=>errors.push(e.message));await peer.goto(url.href);await peer.fill('#nickname','QA Colega');await peer.click('#joinTeam');await peer.waitForFunction(()=>window.oficina?.state.online?.connected&&!document.querySelector('#welcome').open);await page.waitForFunction(()=>window.oficina.state.online.peers.length===1);
 await peer.waitForFunction(()=>window.oficina.state.online.peers[0]?.appearance.style===6);await peer.click('#wardrobeButton');assert.equal(await peer.locator('[data-item=tattoo]').isDisabled(),true);await peer.setViewportSize({width:390,height:844});assert.ok(await peer.evaluate(()=>document.querySelector('#teamDialog').scrollWidth<=document.querySelector('#teamDialog').clientWidth+1));await peer.screenshot({path:'test-results/wardrobe-mobile.png'});await peer.click('#closeTeam');
 const state=p=>p.evaluate(()=>window.oficina.state);let a=(await state(page)).position,b=(await state(peer)).position;assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>.7);
 // Same entry corridor: walk towards the stationary colleague and observe bounded displacement.
 const mover=a.x<b.x?page:peer,target=mover===page?peer:page;const before={...(await state(target)).position};await mover.keyboard.down('d');await mover.waitForTimeout(1800);await mover.keyboard.up('d');await mover.waitForTimeout(1000);a=(await state(mover)).position;b=(await state(target)).position;assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>.65);assert.ok(Math.hypot(b.x-before.x,b.z-before.z)>.05,'Colega precisa receber o empurrão');
 await rpc('lab_open_admin',{});await rpc('lab_admin',{p_operation:'reset',p_room:room.id,p_round:room.round});const reset=await rpc('lab_wardrobe',{p_room:room.id});assert.equal(reset.tattoo,false);assert.equal(reset.jacket,false);assert.equal(reset.style,0);await page.waitForFunction(()=>window.oficina.state.score===0&&!window.oficina.state.appearance.tattoo);assert.deepEqual(errors,[]);fs.writeFileSync('test-results/rewards-physics.json',JSON.stringify({passed:true,room:room.id,checks:['server gates','6000 earned points unchanged','visual cards','mobile','peer appearance','separate spawns','push','reset gates'],errors},null,2));console.log('PASS catálogo, servidor, movimento entre dois alunos e reinício');
}finally{await browser?.close();client.auth.stopAutoRefresh();outsider.auth.stopAutoRefresh();}

