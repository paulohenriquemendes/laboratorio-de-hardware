import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_KEY} from './src/online-config.js';
import {cases} from './src/cases.js';import {challenges} from './src/challenges.js';
const clients=Array.from({length:3},()=>createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}));
const [student,peer,teacher]=clients;
async function rpc(c,name,args){const r=await c.rpc(name,args);assert.equal(r.error,null,r.error?.message);return r.data;}
try{
for(const c of clients)assert.equal((await c.auth.signInAnonymously()).error,null);
const room=await rpc(student,'lab_join',{p_room:null,p_name:'Aluno QA',p_title:'QA participação '+Date.now()});await rpc(peer,'lab_join',{p_room:room.id,p_name:'Colega QA'});
const identity=(operation,name='Aluno Completo QA',turma='Informática 2A')=>rpc(student,'lab_student_identity',{p_room:room.id,p_operation:operation,p_name:name,p_class:turma});
assert.ok((await student.rpc('lab_student_identity',{p_room:room.id,p_operation:'submit',p_name:'A',p_class:'X'})).error);
assert.ok((await student.rpc('lab_notes',{p_operation:'send',p_room:room.id,p_body:'Sem identificação',p_request:crypto.randomUUID()})).error);
await identity('save');
const act=(kind,choice=null,request=crypto.randomUUID())=>rpc(student,'lab_action_v3',{p_room:room.id,p_round:1,p_pc:0,p_kind:kind,p_choice:choice,p_request:request});
await act('claim');await act('test',0);await act('test',1);const request=crypto.randomUUID();await act('diagnosis',(cases[0].answer+1)%3,request);await act('diagnosis',(cases[0].answer+1)%3,request);await act('diagnosis',cases[0].answer);await act('repair',cases[0].repair);await act('validate');await act('challenge',challenges[0].answer);await act('release');
assert.ok((await identity('submit')).submitted_at);
const noteRequest=crypto.randomUUID();const sends=await Promise.all([1,2].map(()=>rpc(student,'lab_notes',{p_operation:'send',p_room:room.id,p_body:'QA: sugestão de leitura <img src=x>',p_request:noteRequest})));assert.equal(sends[0].id,sends[1].id);
assert.equal((await peer.from('lab_notes').select('*').eq('room_id',room.id)).data.length,0);
assert.ok((await peer.rpc('lab_notes',{p_operation:'list',p_room:room.id})).error);assert.ok((await peer.rpc('lab_notes',{p_operation:'read',p_note:sends[0].id})).error);
assert.ok((await student.rpc('lab_student_report',{p_room:room.id})).error);assert.ok((await peer.rpc('lab_manage_rooms',{})).error);
const publicData=JSON.stringify(await rpc(peer,'lab_snapshot',{p_room:room.id}));assert.ok(!publicData.includes('Aluno Completo QA'));assert.ok(!publicData.includes('Informática 2A'));
const key=fs.readFileSync('.private/ACESSO-PROFESSOR.txt','utf8').split('Chave privada: ')[1].split(/\r?\n/)[0];await rpc(teacher,'lab_admin',{p_operation:'login',p_room:room.id,p_key:key});
const uid=(await student.auth.getUser()).data.user.id;
const report=await rpc(teacher,'lab_student_report',{p_room:room.id,p_round:1,p_user:uid});assert.equal(report.students[0].full_name,'Aluno Completo QA');assert.equal(report.students[0].class_name,'Informática 2A');assert.equal(report.students[0].practiced,1);assert.equal(report.students[0].solved,1);assert.equal(report.students[0].concepts,1);assert.equal(report.students[0].score,135);assert.equal(report.events.length,7);assert.equal(report.events.filter(e=>e.correct===false).length,1);assert.equal(report.events.find(e=>e.kind==='diagnosis'&&!e.correct).choice,(cases[0].answer+1)%3);
const inbox=await rpc(teacher,'lab_notes',{p_operation:'list',p_room:room.id});assert.equal(inbox.total,1);assert.equal(inbox.notes[0].full_name,'Aluno Completo QA');await rpc(teacher,'lab_notes',{p_operation:'read',p_note:sends[0].id});assert.equal((await rpc(teacher,'lab_notes',{p_operation:'list',p_room:room.id})).unread,0);
await rpc(teacher,'lab_admin',{p_operation:'reset',p_room:room.id,p_round:1});assert.equal((await rpc(teacher,'lab_student_report',{p_room:room.id,p_round:2})).students.length,0);assert.equal((await rpc(teacher,'lab_student_report',{p_room:room.id,p_round:1})).students[0].solved,1);assert.equal((await rpc(teacher,'lab_notes',{p_operation:'list',p_room:room.id})).total,1);assert.equal((await identity('get')).full_name,null);
await rpc(teacher,'lab_admin',{p_operation:'logout',p_room:room.id});assert.ok((await teacher.rpc('lab_student_report',{p_room:room.id})).error);
fs.mkdirSync('test-results',{recursive:true});fs.writeFileSync('test-results/participation-backend.json',JSON.stringify({passed:true,room:room.id,checks:['Identificação privada','Atividades e pontos salvos','Alternativas e erros registrados sem duplicação','Anotações privadas identificadas','Histórico preservado após reinício','Autorização exclusiva do professor']},null,2));console.log('PASS participation, answer audit, private identity, notes and teacher authorization');
}finally{for(const c of clients){c.auth.stopAutoRefresh();await c.removeAllChannels();}}
