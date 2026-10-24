import assert from 'node:assert/strict';import {createClient} from '@supabase/supabase-js';import {SUPABASE_URL,SUPABASE_KEY} from './src/online-config.js';
const clients=[0,1].map(()=>createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}));
for(const c of clients){const {error}=await c.auth.signInAnonymously();assert.equal(error,null)}
const [a,b]=clients;const joined=await a.rpc('lab_join',{p_room:null,p_name:'Cabelo A',p_title:'QA aparência '+Date.now()});assert.equal(joined.error,null);const room=joined.data.id;assert.equal((await b.rpc('lab_join',{p_room:room,p_name:'Cabelo B'})).error,null);
const get=async c=>{const r=await c.from('lab_members').select('hair_style,hair_color').eq('room_id',room).single();assert.equal(r.error,null);return r.data};const pa=await get(a),pb=await get(b);assert.notDeepEqual(pa,pb);
const change=await a.rpc('lab_appearance',{p_room:room,p_style:2,p_color:'#3f704b'});assert.equal(change.error,null);assert.deepEqual(await get(a),{hair_style:2,hair_color:'#3f704b'});assert.deepEqual(await get(b),pb);
assert.ok((await a.rpc('lab_appearance',{p_room:room,p_style:99,p_color:'#3f704b'})).error);assert.ok((await a.rpc('lab_appearance',{p_room:crypto.randomUUID(),p_style:1,p_color:'#3f704b'})).error);
assert.equal((await a.rpc('lab_join',{p_room:room,p_name:'Cabelo A'})).error,null);assert.deepEqual(await get(a),{hair_style:2,hair_color:'#3f704b'});
console.log('PASS automatic distinct appearance, save, rejoin, ownership and invalid profile');
