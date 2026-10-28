import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {fresh} from './src/cases.js';
const all=fresh().map(p=>({...p,tests:[0,1],diagnosed:true,repaired:true,validated:true}));
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addInitScript(progress=>{if(!localStorage.getItem('local.visual.qa')){localStorage.setItem('local.visual.qa','1');localStorage.setItem('laboratorioHardware80.v1',JSON.stringify(progress));localStorage.setItem('hardware.studentRegistration.v1',JSON.stringify({fullName:'Aluno Visual QA',className:'Informática QA'}));}},all);
 const p=await context.newPage();await p.goto(process.env.GAME_URL||'http://127.0.0.1:4181/');await p.waitForSelector('#offlineInfo[data-ready=true]');await p.click('#start');await context.setOffline(true);
 await p.click('#mobileMenuButton');await p.click('#wardrobeButton');assert.equal(await p.locator('#wardrobeCatalog img').count(),17);
 for(const item of ['sandals','beard','nails','strong','tattooBolt'])await p.click(`[data-item=${item}]`);
 await p.click('#saveAppearance');assert.equal(await p.evaluate(()=>window.oficina.state.appearance.sandals),true);await p.locator('[data-item=sandals]').scrollIntoViewIfNeeded();await p.screenshot({path:'test-results/skin-chinelo.png'});
 await p.click('#closeTeam');for(const size of [{width:320,height:568},{width:390,height:844}]){await p.setViewportSize(size);await p.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth);assert.ok(await p.locator('#score').innerText().then(s=>s.includes('4.800')));}
 await p.reload();await p.click('#start');assert.equal(await p.evaluate(()=>window.oficina.state.appearance.sandals),true);assert.equal(await p.evaluate(()=>window.oficina.state.appearance.strong),true);
 console.log('PASS 17 miniaturas, visuais locais offline persistidos e saldo máximo em telas 320/390');
}finally{await browser.close()}
