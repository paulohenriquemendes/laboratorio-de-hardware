import test from 'node:test';
import assert from 'node:assert/strict';
import {cases,fresh,restoreProgress,scoreOf,blocked} from './src/cases.js';
import {benches,stations,nearestStation} from './src/layout.js';
import {challenges,goals} from './src/challenges.js';
for(let i=0;i<cases.length;i++)test(`PC ${i+1}: conteúdo e índices de resposta válidos`,()=>{
 const c=cases[i],q=challenges[i];assert.equal(c.tests.length,2);assert.equal(c.options.length,3);assert.equal(c.repairs.length,3);for(const str of [c.title,c.symptom,c.explain,c.validation,...c.tests.flat(),...c.options,...c.repairs,q.question,q.explanation,q.hint,...q.options])assert.ok(str.trim().length>5);assert.ok(c.options[c.answer]);assert.ok(c.repairs[c.repair]);assert.ok(q.options[q.answer]);assert.equal(new Set(c.options).size,3);
});
test('Partidas novas não compartilham referências',()=>{const a=fresh(),b=fresh();a[0].tests.push(0);assert.deepEqual(b[0].tests,[]);assert.deepEqual(a[1].tests,[])});
test('Pontuação só entra após validação, tem teto de 3000 e piso de 30 por caso',()=>{const p=fresh();p[0].diagnosed=true;p[0].repaired=true;assert.equal(scoreOf(p),0);p.forEach(c=>c.validated=true);assert.equal(scoreOf(p),3000);p.forEach(c=>c.errors=4);assert.equal(scoreOf(p),1800);p.forEach(c=>c.errors=1000);assert.equal(scoreOf(p),600)});
for(const raw of [null,'','{broken','null','{}','[]','[null,null,null,null,null,null]','true'])test(`Armazenamento inválido recuperado: ${raw}`,()=>assert.deepEqual(restoreProgress(raw),fresh()));
test('Dados antigos compatíveis preservam reparos sem inventar desafios',()=>{const p=fresh();p.forEach(c=>{c.tests=[0,1];c.diagnosed=true;c.repaired=true;c.validated=true;delete c.challenge;delete c.challengeErrors});assert.equal(scoreOf(restoreProgress(JSON.stringify(p))),3000);assert.ok(restoreProgress(JSON.stringify(p)).every(c=>!c.challenge))});
test('Corrupção em um caso não apaga os demais',()=>{const p=fresh();p[0].tests=[0];p[1].errors=-1;assert.deepEqual(restoreProgress(JSON.stringify(p))[0].tests,[0]);assert.deepEqual(restoreProgress(JSON.stringify(p))[1],fresh()[1])});
for(const mutation of [p=>p.tests=[0,0],p=>p.tests=[2],p=>p.errors=1.5,p=>p.errors=-3,p=>p.errors=1e25,p=>p.repaired=true,p=>p.validated=true,p=>{p.tests=[0];p.diagnosed=true}])test('Estados inconsistentes não desbloqueiam fases',()=>{const p=fresh();mutation(p[0]);const r=restoreProgress(JSON.stringify(p));assert.equal(r[0].diagnosed,false);assert.equal(r[0].validated,false);assert.ok(r[0].tests.length<2)});
test('Desafio não pode estar concluído antes da entrega',()=>{const p=fresh();p[0].challenge=true;assert.equal(restoreProgress(JSON.stringify(p))[0].challenge,false)});
test('Metas distinguem pontuação, reparos e conceitos',()=>{const p=fresh();p[0].validated=true;p[0].challenge=true;p[1].validated=true;p[1].errors=1;assert.deepEqual(goals(p).map(g=>g.value),[2,1,1])});

test('Cinco bancadas com quatro computadores e dez por lado',()=>{assert.equal(benches.length,5);assert.equal(stations.length,20);assert.equal(new Set(stations.map(s=>s.id)).size,20);for(const b of benches){assert.equal(stations.filter(s=>s.bench===b.id).length,4);for(const side of [-1,1])assert.equal(stations.filter(s=>s.bench===b.id&&s.side===side).length,2)}for(const side of [-1,1])assert.equal(stations.filter(s=>s.side===side).length,10)});
test('Todas as estações acessíveis, sem seleção através da bancada',()=>{stations.forEach((s,i)=>{assert.equal(blocked(s.useX,s.useZ),false);assert.equal(nearestStation(s.useX,s.useZ),i);assert.equal(blocked(s.side*2.8,s.z),true)});for(const b of benches)assert.equal(blocked(0,b.z),true);assert.equal(nearestStation(0,18),-1)});
test('Corredores e quatro limites do laboratório',()=>{for(let z=-19;z<=19;z+=.2)for(const x of [-3.9,3.9])assert.equal(blocked(x,z),false);for(const p of [[8,0],[-8,0],[0,20],[0,-20]])assert.equal(blocked(...p),true)});
test('Migração de seis casos preserva resultados e cria 14 computadores pendentes',()=>{const old=fresh().slice(0,6);old[0]={...old[0],tests:[0,1],diagnosed:true,repaired:true,validated:true};const p=restoreProgress(JSON.stringify(old));assert.equal(p.length,20);assert.equal(p[0].validated,true);assert.ok(p.slice(6).every(v=>!v.validated))});


test('Vinte casos e desafios distintos, sem repetição de conteúdo',()=>{assert.equal(cases.length,20);assert.equal(challenges.length,20);for(const field of ['title','symptom','validation'])assert.equal(new Set(cases.map(c=>c[field])).size,20);assert.equal(new Set(cases.map(c=>c.options[c.answer])).size,20);assert.equal(new Set(cases.map(c=>JSON.stringify(c.tests))).size,20);assert.equal(new Set(challenges.map(c=>c.question)).size,20)});
