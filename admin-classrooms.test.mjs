import {chromium} from 'playwright';
import {createClient} from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import {SUPABASE_URL,SUPABASE_KEY} from './src/online-config.js';
const client=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let browser;
try{
 assert.equal((await client.auth.signInAnonymously()).error,null);
 const blocked=await client.rpc('lab_join',{p_room:null,p_name:'Aluno QA',p_title:'Não deve criar'});assert.ok(blocked.error);assert.match(blocked.error.message,/administração/);
 assert.ok((await client.rpc('lab_manage_rooms',{p_title:'Não deve criar'})).error);
 browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});const adminContext=await browser.newContext(),admin=await adminContext.newPage(),errors=[];admin.on('pageerror',e=>errors.push(e.message));
 const url=process.env.GAME_URL||'http://127.0.0.1:4181/';let empty=true;
 // Verify the initial empty state without deleting existing student rooms.
 await admin.route('**/rest/v1/rpc/lab_manage_rooms',async route=>{const data=route.request().postDataJSON();if(data?.p_title)empty=false;if(empty)await route.fulfill({status:200,contentType:'application/json',body:'[]'});else await route.continue();});
 await admin.goto(new URL('admin/',url).href);await admin.waitForFunction(()=>document.querySelector('#adminStatus').textContent.includes('Nenhuma turma'));assert.ok(await admin.locator('#roomManagement').isVisible());assert.ok(await admin.locator('#copyInvite').isDisabled());
 await admin.fill('#newRoomTitle','QA criada pelo administrador '+Date.now());await admin.locator('#createRoomForm button').click();await admin.waitForFunction(()=>document.querySelector('#adminStatus').textContent.includes('Turma criada'));
 const invite=await admin.locator('#adminInvite').inputValue();assert.match(invite,/sala=[0-9a-f-]{36}/);assert.ok(await admin.locator('#copyInvite').isEnabled());assert.ok(await admin.locator('#teacherTools').isVisible());
 const studentContext=await browser.newContext(),p=await studentContext.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(invite);await p.fill('#registrationName','Aluno Completo QA');await p.fill('#registrationClass','Informática QA');await p.fill('#nickname','Aluno QA');await p.click('#joinTeam');await p.waitForFunction(()=>window.oficina.state.online?.connected&&!document.querySelector('#welcome').open);assert.equal(await p.locator('#createRoomForm,#newTeamTitle').count(),0);
 const home=await studentContext.newPage();await home.goto(url);await home.waitForSelector('#offlineHelp');assert.ok(await home.locator('#joinTeam').isDisabled());await home.fill('#registrationName','Aluno Completo QA');await home.fill('#registrationClass','Informática QA');await home.click('#start');assert.equal(await home.locator('#joblist .job').count(),80);
 assert.deepEqual(errors,[]);console.log('PASS criação negada ao aluno, painel vazio, nome + link no admin, entrada pelo convite e prática individual sem convite');
}finally{client.auth.stopAutoRefresh();if(browser)await browser.close()}
