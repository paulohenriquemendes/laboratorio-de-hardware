import {room as bounds} from './layout.js';
import {normalizeAppearance} from './avatar.js';
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_URL,SUPABASE_KEY,OPEN_ROOM} from './online-config.js';
export {OPEN_ROOM};
export function validRoom(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value||'')}
export function cleanName(value){return String(value||'').replace(/[<>\x00-\x1f]/g,'').trim().slice(0,24)}
export function validPose(p){return p&&Number.isFinite(p.x)&&p.x>=bounds.minX&&p.x<=bounds.maxX&&Number.isFinite(p.z)&&Math.abs(p.z)<=20&&Number.isFinite(p.angle)&&Math.abs(p.angle)<100}
export class OnlineLab {
 constructor(callbacks){this.cb=callbacks;this.client=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{storageKey:'hardware-coop.auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});this.rows=new Map();this.scores=[];this.refreshSerial=0;this.peers=new Map();this.connected=false;this.activePc=-1;this.closed=false;this.lastSend=0;this.lastPose=null;this.instance=crypto.randomUUID();}
 status(message){this.cb.status(message,this.connected)}
 async enter(name,room=OPEN_ROOM,title=null,identity=null){
  this.status('Conectando à sala…');
  let {data:{session},error}=await this.client.auth.getSession();if(error)throw error;
  if(!session){const result=await this.client.auth.signInAnonymously();if(result.error)throw new Error(result.error.code==='anonymous_provider_disabled'?'A entrada de alunos ainda não foi ativada no servidor.':result.error.message);session=result.data.session;}
  this.userId=session.user.id;
  const joined=await this.client.rpc('lab_join',{p_room:room,p_name:cleanName(name),p_title:title});if(joined.error)throw joined.error;this.room=joined.data;
  if(identity){const saved=await this.client.rpc('lab_student_identity',{p_room:this.room.id,p_operation:'save',p_name:identity.fullName,p_class:identity.className});if(saved.error)throw saved.error;}
  const profile=await this.client.rpc('lab_wardrobe',{p_room:this.room.id});if(profile.error)throw profile.error;this.appearance=profile.data;
  await this.client.realtime.setAuth(session.access_token);
  await this.connect();
  this.timer=setInterval(async()=>{if(!this.connected||this.closed)return;try{if(this.activePc>=0)await this.action(this.activePc,'renew');await this.refresh();}catch(e){this.status(e.message||'Falha ao sincronizar. Tentando novamente…')}},20000);
  return this.room;
 }
 async connect(){
  this.connected=false;
  if(this.channel){const old=this.channel;this.channel=null;await this.client.removeChannel(old);}
  this.channel=this.client.channel('lab:'+this.room.id,{config:{private:true,presence:{key:this.instance},broadcast:{self:false}}});
  const channel=this.channel;
  this.channel.on('presence',{event:'sync'},()=>this.syncPeers()).on('broadcast',{event:'pose'},({payload})=>{if(payload?.instance===this.instance||!validPose(payload))return;const peer=this.peers.get(payload.instance);if(peer){Object.assign(peer,payload,{name:peer.name,userId:peer.userId,instance:peer.instance});this.cb.peers([...this.peers.values()]);}})
   .on('broadcast',{event:'contact'},({payload})=>{const peer=this.peers.get(payload?.instance);const now=performance.now();if(payload?.target===this.instance&&peer&&now-(this.lastContactReceived||0)>220){this.lastContactReceived=now;this.cb.push?.(peer);}})
   .on('postgres_changes',{event:'UPDATE',schema:'public',table:'lab_rooms',filter:'id=eq.'+this.room.id},()=>{void this.refresh().catch(()=>this.status('Não foi possível atualizar a rodada. Reconecte.'))})
   .on('postgres_changes',{event:'*',schema:'public',table:'lab_attempts',filter:'room_id=eq.'+this.room.id},({new:row})=>this.accept(row))
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'lab_completions',filter:'room_id=eq.'+this.room.id},()=>this.scheduleRefresh());
  await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(new Error('Não foi possível conectar à sala. Tente novamente.')),20000);
   this.channel.subscribe(async status=>{
    if(this.closed||this.channel!==channel)return;
    this.connected=status==='SUBSCRIBED';
    if(this.connected){try{await this.refresh();await this.channel.track({instance:this.instance,userId:this.userId,name:this.room.nickname,appearance:this.appearance,pc:this.activePc,...(this.lastPose||{x:3.9,z:18.4,angle:0})});this.ready=true;this.status('Online · seu progresso e suas recompensas fictícias estão salvos');clearTimeout(timeout);resolve();}catch(e){this.connected=false;this.status('Sem sincronização. Reconectando…');clearTimeout(timeout);reject(e);}}
    else{this.status('Conexão interrompida · aguardando reconexão');}
   });
  });
 }
 disconnect(){this.connected=false;this.status('Sem internet · respostas pausadas até reconectar');const old=this.channel;this.channel=null;this.offlineCleanup=old?this.client.removeChannel(old):Promise.resolve();this.peers.clear();this.cb.peers([]);}
 async reconnect(){if(this.closed||this.reconnecting)return;this.reconnecting=true;this.status('Reconectando à sala…');try{await this.offlineCleanup;await this.connect();}catch{this.status('Não foi possível reconectar. Use Reconectar no painel Equipe.');}finally{this.reconnecting=false;}}
 scheduleRefresh(){clearTimeout(this.refreshTimer);this.refreshTimer=setTimeout(()=>{if(!this.closed)void this.refresh().catch(()=>this.status('Não foi possível atualizar o placar. Use Reconectar.'));},250);}
 scoreFor(userId){return this.scores.find(s=>s.user_id===userId)?.score||0;}
 async refresh(){
  const serial=++this.refreshSerial;
  const {data,error}=await this.client.rpc('lab_snapshot',{p_room:this.room.id});if(error)throw error;
  if(this.closed||serial!==this.refreshSerial||data.room.round<this.room.round)return;
  if(data.room.round!==this.room.round){this.room.round=data.room.round;this.rows.clear();this.scores=[];this.activePc=-1;this.cb.round?.(data.room.round);void this.track();}
  this.scores=data.scores;
  for(const row of data.tasks){const previous=this.rows.get(row.pc);this.rows.set(row.pc,previous&&previous.revision>row.revision?{...row,progress:previous.progress,revision:previous.revision}:row);}
  this.cb.tasks([...this.rows.values()]);
 }
 accept(row){if(row.user_id!==this.userId||row.round!==this.room?.round||row.room_id!==this.room?.id||!Number.isInteger(row.pc)||row.pc<0||row.pc>79)return;const previous=this.rows.get(row.pc);if(previous&&previous.revision>=row.revision)return;this.rows.set(row.pc,{...previous,...row});this.cb.tasks([...this.rows.values()]);}
 syncPeers(){const next=new Map();for(const entries of Object.values(this.channel.presenceState()))for(const entry of entries){if(entry.instance===this.instance||typeof entry.instance!=='string')continue;const prior=this.peers.get(entry.instance);next.set(entry.instance,{...entry,...(prior?{x:prior.x,z:prior.z,angle:prior.angle}:{}),name:cleanName(entry.name)});}this.peers=next;this.cb.peers([...next.values()]);}
 pose(p){if(!this.connected||!validPose(p))return;const now=performance.now();const changed=!this.lastPose||Math.hypot(p.x-this.lastPose.x,p.z-this.lastPose.z)>.02||Math.abs(p.angle-this.lastPose.angle)>.05;const participants=this.peers.size+1;const interval=Math.max(120,participants*participants/100*1000);if(now-this.lastSend<(changed?interval:Math.max(10000,interval)))return;this.lastSend=now;this.lastPose={...p};void this.channel.send({type:'broadcast',event:'pose',payload:{...p,appearance:this.appearance,instance:this.instance}});}
 push(target){if(!this.connected||!this.peers.has(target))return;const now=performance.now(),interval=Math.max(260,(this.peers.size+1)**2/100*1000);if(now-(this.lastPush||0)<interval)return;this.lastPush=now;void this.channel.send({type:'broadcast',event:'contact',payload:{instance:this.instance,target}});}
 async action(pc,kind,choice=null,request=crypto.randomUUID()){
  if(!this.connected)throw new Error('Aguarde a reconexão antes de responder.');
  // A retry uses the same identifier: an ambiguous network response cannot charge twice.
  const params={p_room:this.room.id,p_round:this.room.round,p_pc:pc,p_kind:kind,p_choice:choice,p_request:request};
  let result=await this.client.rpc('lab_action_v3',params);
  if(result.error&&(!result.status||result.status>=500))result=await this.client.rpc('lab_action_v3',params);
  if(result.error)throw result.error;if(result.data.task.round!==this.room.round)throw new Error('A rodada mudou. Abra o computador novamente.');this.accept(result.data.task);if(kind==='validate')await this.refresh();return result.data;
 }
 async setAppearance(value){const a=normalizeAppearance(value);const {data,error}=await this.client.rpc('lab_wardrobe',{p_room:this.room.id,p_appearance:a});if(error)throw error;this.appearance=data;if(this.connected)await this.channel.track({instance:this.instance,userId:this.userId,name:this.room.nickname,appearance:this.appearance,pc:this.activePc,...(this.lastPose||{x:3.9,z:18.4,angle:0})});return data;}
 async claim(pc){await this.action(pc,'claim');this.activePc=pc;await this.track();}
 async track(){if(this.connected)await this.channel.send({type:'broadcast',event:'pose',payload:{instance:this.instance,pc:this.activePc,...(this.lastPose||{x:3.9,z:18.4,angle:0})}});if(this.connected&&performance.now()-(this.lastTrack||0)>7000){this.lastTrack=performance.now();await this.channel.track({instance:this.instance,userId:this.userId,name:this.room.nickname,appearance:this.appearance,pc:this.activePc,...(this.lastPose||{x:3.9,z:18.4,angle:0})});}}
 async release(){const pc=this.activePc;this.activePc=-1;if(pc>=0&&this.connected){try{await this.action(pc,'release')}catch{ /* Lease expires on the server if the connection was lost. */ }}await this.track();}
 async leave(){this.closed=true;clearInterval(this.timer);clearTimeout(this.refreshTimer);await this.release();this.connected=false;if(this.channel)await this.client.removeChannel(this.channel);this.client.auth.stopAutoRefresh();this.peers.clear();this.cb.peers([]);}
}
