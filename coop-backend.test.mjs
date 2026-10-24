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
const act=(c,pc,kind,choice=null,id=crypto.randomUUID())=>rpc(c,'lab_action',{p_room:room.id,p_pc:pc,p_kind:kind,p_choice:choice,p_request:id});
assert.equal((await outsider.from('lab_tasks').select('*').eq('room_id',room.id)).data.length,0);
assert.ok((await anon.from('lab_tasks').select('*')).error);
assert.ok((await outsider.rpc('lab_action',{p_room:room.id,p_pc:0,p_kind:'claim',p_choice:null,p_request:crypto.randomUUID()})).error);
const writes=await a.from('lab_tasks').update({progress:{validated:true}}).eq('room_id',room.id);assert.ok(writes.error);
const simultaneous=await Promise.all([a,b].map(c=>c.rpc('lab_action',{p_room:room.id,p_pc:0,p_kind:'claim',p_choice:null,p_request:crypto.randomUUID()})));
assert.equal(simultaneous.filter(r=>!r.error).length,1);
const winner=simultaneous[0].error?b:a,loser=winner===a?b:a;
assert.ok((await winner.rpc('lab_action',{p_room:room.id,p_pc:0,p_kind:'validate',p_choice:null,p_request:crypto.randomUUID()})).error);
await act(winner,0,'release');await act(loser,0,'claim');await act(loser,0,'release');
for(let pc=0;pc<40;pc++){
 const c=pc%2?a:b;await act(c,pc,'claim');await act(c,pc,'test',0);await act(c,pc,'test',1);
 const request=crypto.randomUUID();await act(c,pc,'diagnosis',(cases[pc].answer+1)%3,request);await act(c,pc,'diagnosis',(cases[pc].answer+1)%3,request);
 await act(c,pc,'diagnosis',cases[pc].answer);await act(c,pc,'repair',cases[pc].repair);await act(c,pc,'validate');await act(c,pc,'challenge',challenges[pc].answer);await act(c,pc,'release');
}
const rows=await a.from('lab_tasks').select('*').eq('room_id',room.id);assert.equal(rows.data.length,40);assert.ok(rows.data.every(r=>r.progress.validated&&r.progress.challenge&&r.progress.errors===1));
const invalid=await a.rpc('lab_join',{p_room:room.id,p_name:'<script>'});assert.ok(invalid.error);
fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/coop-backend.json',JSON.stringify({passed:true,room:room.id,checks:['40 reparos e conceitos no servidor','Respostas idempotentes','Reserva concorrente','Liberação da reserva','Isolamento entre salas e usuários','Proibição de escrita direta e avanço de etapa','Apelidos validados']},null,2));
console.log('PASS: 40 online cases, authorization, concurrent lease, idempotency and stage validation');
for(const c of [...clients,anon])await c.removeAllChannels();
