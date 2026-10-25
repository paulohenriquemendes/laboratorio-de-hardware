import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_KEY} from './src/online-config.js';
import {cases} from './src/cases.js';import {challenges} from './src/challenges.js';
import fs from 'node:fs';
const client=()=>createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const a=client(),b=client(),outsider=client(),anon=client();const clients=[a,b,outsider];
for(const c of clients){const r=await c.auth.signInAnonymously();assert.equal(r.error,null);}
async function rpc(c,name,args){const r=await c.rpc(name,args);assert.equal(r.error,null,r.error?.message);return r.data}
const room=await rpc(a,'lab_join',{p_room:null,p_name:'Teste A',p_title:'QA coop '+Date.now()});
await rpc(b,'lab_join',{p_room:room.id,p_name:'Teste B'});
const act=(c,pc,kind,choice=null,id=crypto.randomUUID())=>rpc(c,'lab_action_v2',{p_room:room.id,p_round:room.round,p_pc:pc,p_kind:kind,p_choice:choice,p_request:id});
assert.equal((await outsider.from('lab_tasks').select('*').eq('room_id',room.id)).data.length,0);
assert.ok((await anon.from('lab_tasks').select('*')).error);
assert.ok((await outsider.rpc('lab_action_v2',{p_room:room.id,p_round:room.round,p_pc:0,p_kind:'claim',p_choice:null,p_request:crypto.randomUUID()})).error);
const writes=await a.from('lab_tasks').update({progress:{validated:true}}).eq('room_id',room.id);assert.ok(writes.error);
const simultaneous=await Promise.all([a,b].map(c=>c.rpc('lab_action_v2',{p_room:room.id,p_round:room.round,p_pc:0,p_kind:'claim',p_choice:null,p_request:crypto.randomUUID()})));
assert.equal(simultaneous.filter(r=>!r.error).length,1);
const winner=simultaneous[0].error?b:a,loser=winner===a?b:a;
assert.ok((await winner.rpc('lab_action_v2',{p_room:room.id,p_round:room.round,p_pc:0,p_kind:'validate',p_choice:null,p_request:crypto.randomUUID()})).error);
await act(winner,0,'release');await act(loser,0,'claim');await act(loser,0,'release');
for(let pc=0;pc<80;pc++){
 const c=pc%2?a:b;await act(c,pc,'claim');await act(c,pc,'test',0);await act(c,pc,'test',1);
 const request=crypto.randomUUID();await act(c,pc,'diagnosis',(cases[pc].answer+1)%3,request);await act(c,pc,'diagnosis',(cases[pc].answer+1)%3,request);
 await act(c,pc,'diagnosis',cases[pc].answer);await act(c,pc,'repair',cases[pc].repair);await act(c,pc,'validate');await act(c,pc,'challenge',challenges[pc].answer);await act(c,pc,'release');
}
const rows=await a.from('lab_tasks').select('*').eq('room_id',room.id);assert.equal(rows.data.length,80);assert.ok(rows.data.every(r=>r.progress.validated&&r.progress.challenge&&r.progress.errors===1));
const invalid=await a.rpc('lab_join',{p_room:room.id,p_name:'<script>'});assert.ok(invalid.error);
// Teacher operations are exercised only in this newly-created QA room.
assert.ok((await b.rpc('lab_admin',{p_operation:'reset',p_room:room.id,p_round:1})).error);
const wrongKey=await a.rpc('lab_admin',{p_operation:'login',p_room:room.id,p_key:'not-the-teacher-key'});assert.equal(wrongKey.data.ok,false);
const teacherKey=fs.readFileSync('.private/ACESSO-PROFESSOR.txt','utf8').split('Chave privada: ')[1].split(/\r?\n/)[0];
const admin=await rpc(a,'lab_admin',{p_operation:'login',p_room:room.id,p_key:teacherKey});assert.equal(admin.authorized,true);assert.equal(admin.tasks.filter(t=>t.progress.validated&&t.completed_at&&t.completed_by).length,80);
const reset=await rpc(a,'lab_admin',{p_operation:'reset',p_room:room.id,p_round:1});assert.equal(reset.room.round,2);assert.equal(reset.tasks.length,80);assert.ok(reset.tasks.every(t=>!t.progress.validated&&!t.owner_id&&!t.completed_by));
const history=await rpc(a,'lab_admin',{p_operation:'report',p_room:room.id,p_round:1});assert.equal(history.tasks.filter(t=>t.progress.validated&&t.completed_at).length,80);
assert.ok((await b.rpc('lab_action_v2',{p_room:room.id,p_round:1,p_pc:0,p_kind:'claim',p_choice:null,p_request:crypto.randomUUID()})).error);
const double=await Promise.all([0,1].map(()=>a.rpc('lab_admin',{p_operation:'reset',p_room:room.id,p_round:2})));assert.equal(double.filter(r=>!r.error).length,1);
await rpc(a,'lab_admin',{p_operation:'logout',p_room:room.id});assert.ok((await a.rpc('lab_admin',{p_operation:'reset',p_room:room.id,p_round:3})).error);
console.log('PASS teacher authorization, archive, reset, stale-round rejection, concurrent reset and logout');
fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/coop-backend.json',JSON.stringify({passed:true,room:room.id,checks:['80 reparos e conceitos no servidor','Respostas idempotentes','Reserva concorrente','Liberação da reserva','Isolamento entre salas e usuários','Proibição de escrita direta e avanço de etapa','Apelidos validados']},null,2));
console.log('PASS: 80 online cases, authorization, concurrent lease, idempotency and stage validation');
for(const c of [...clients,anon])await c.removeAllChannels();
