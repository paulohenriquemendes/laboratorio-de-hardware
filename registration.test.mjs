import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {OnlineLab} from './src/online.js';
const lab=new OnlineLab({status(){}}),original=lab.client,calls=[];
const room={id:'9451a802-a79a-43c4-bf12-97030c04b285',title:'1A',round:1};
lab.client={auth:{async getSession(){return {data:{session:{user:{id:'test-user'},access_token:'test-token'}}}}},realtime:{async setAuth(){}},async rpc(name,args){calls.push({name,args});return {data:name==='lab_join'?room:{},error:null}}};
lab.connect=async()=>{};
try{await lab.enter('Personagem QA',room.id,null,{fullName:'Aluno Completo QA',className:'Outra turma'});assert.equal(calls.find(c=>c.name==='lab_student_identity').args.p_class,'1A');assert.equal(calls[0].args.p_room,room.id);}finally{clearInterval(lab.timer);await original.auth.stopAutoRefresh();}
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
try{for(const width of [390,1280]){const page=await browser.newPage({viewport:{width,height:844}});await page.goto(process.env.GAME_URL||'http://127.0.0.1:4181/');assert.equal(await page.locator('#registrationClass').count(),0);assert.equal(await page.locator('#welcome input:visible').count(),2);await page.fill('#registrationName','Aluno Completo QA');await page.fill('#nickname','Personagem QA');await page.click('#start');await page.waitForFunction(()=>!document.querySelector('#welcome').open);const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hardware.studentRegistration.v1')));assert.equal(saved.fullName,'Aluno Completo QA');await page.click('#mobileMenuButton');await page.click('#notesButton');assert.equal(await page.locator('#studentClass').isVisible(),false);assert.equal(await page.locator('label[for=studentClass]').count(),0);await page.close();}console.log('PASS nome completo e personagem, sem campo de turma, celular e desktop; identidade deriva do convite');}finally{await browser.close();}
