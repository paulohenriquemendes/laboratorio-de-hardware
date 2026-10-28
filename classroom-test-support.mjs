import {challenges} from './src/challenges.js';
// Browser-only service double. Never creates a room, auth account or response in the real project.
import {fresh,cases,scoreOf} from './src/cases.js';
import {normalizeAppearance} from './src/avatar.js';
import {unlockedAppearance} from './src/cosmetics.js';
import {caseReward} from './src/economy.js';
export const MOCK_ROOM='00000000-0000-4000-8000-000000000080';
const userId='00000000-0000-4000-8000-000000000081';
export async function mockClassroom(context,{completed=false}={}){
 const state={progress:fresh(),appearance:normalizeAppearance({style:0,color:'#171717'}),fullName:'',nickname:'Aluno QA',submitted:null,requests:[],sockets:[],revision:0};
 if(completed)state.progress.forEach(p=>Object.assign(p,{tests:[0,1],diagnosed:true,repaired:true,validated:true,challenge:true}));
 const room=()=>({id:MOCK_ROOM,title:'Turma de teste local',round:1,nickname:state.nickname});
 const scores=()=>[{user_id:userId,name:state.nickname,score:scoreOf(state.progress),solved:state.progress.filter(p=>p.validated).length},...(state.peer?[{user_id:state.peer.userId,name:state.peer.name,score:4800,solved:80}]:[])];
 const task=pc=>({room_id:MOCK_ROOM,round:1,user_id:userId,pc,revision:++state.revision,progress:state.progress[pc],solvers:state.progress[pc].validated?[{user_id:userId,name:state.nickname,score:caseReward(pc,state.progress[pc].errors)}]:[]});
 const json=value=>Buffer.from(JSON.stringify(value)).toString('base64url'),expires=Math.floor(Date.now()/1000)+86400;
 const session={access_token:json({alg:'HS256',typ:'JWT'})+'.'+json({sub:userId,role:'authenticated',exp:expires})+'.signature',refresh_token:'local-test-only',expires_at:expires,expires_in:86400,token_type:'bearer',user:{id:userId,aud:'authenticated',role:'authenticated',is_anonymous:true}};
 await context.addInitScript(session=>localStorage.setItem('hardware-coop.auth',JSON.stringify(session)),session);
 await context.route('https://*.supabase.co/**',async route=>{
  const name=new URL(route.request().url()).pathname.split('/').pop();const p=route.request().postDataJSON()||{};state.requests.push({name,args:p});let data;
  if(name==='lab_join')data=room(),state.nickname=p.p_name,data.nickname=p.p_name;
  else if(name==='lab_snapshot')data={room:room(),tasks:state.progress.map((_,pc)=>task(pc)),scores:scores()};
  else if(name==='lab_student_identity'){if(p.p_operation!=='get'&&p.p_name)state.fullName=p.p_name;if(p.p_operation==='submit')state.submitted=new Date().toISOString();data={full_name:state.fullName,class_name:room().title,submitted_at:state.submitted};}
  else if(name==='lab_wardrobe'){if(p.p_appearance)state.appearance=normalizeAppearance(unlockedAppearance(p.p_appearance,scoreOf(state.progress),scores()[0].solved));data=state.appearance;}
  else if(name==='lab_notes')data={sent:true};
  else if(name==='lab_action_v3'){
   const v=state.progress[p.p_pc],c=cases[p.p_pc];if(p.p_kind==='test'&&!v.tests.includes(p.p_choice))v.tests.push(p.p_choice);
   if(p.p_kind==='diagnosis'){if(p.p_choice===c.answer)v.diagnosed=true;else v.errors++;}
   if(p.p_kind==='repair'){if(p.p_choice===c.repair)v.repaired=true;else v.errors++;}
   if(p.p_kind==='validate')v.validated=true;
   if(p.p_kind==='challenge'){if(p.p_choice===challenges[p.p_pc].answer)v.challenge=true;else v.challengeErrors++;}
   data={task:task(p.p_pc),feedback:'Registro confirmado na turma de teste.'};
  }else throw new Error('Unmocked service request: '+name);
  await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(data)});
 });
 await context.routeWebSocket(/wss:\/\/.*\.supabase\.co\//,ws=>{
  state.sockets.push(ws);
  ws.onMessage(message=>{
   if(typeof message!=='string')return; // Binary pose broadcasts do not request acknowledgements.
   const value=JSON.parse(String(message)),array=Array.isArray(value),[join_ref,ref,topic,event,payload]=array?value:[value.join_ref,value.ref,value.topic,value.event,value.payload];
   const send=(event,payload)=>ws.send(JSON.stringify(array?[join_ref,ref,topic,event,payload]:{join_ref,ref,topic,event,payload}));
   send('phx_reply',{status:'ok',response:event==='phx_join'?{postgres_changes:(payload.config?.postgres_changes||[]).map((v,id)=>({...v,id}))}:{}});
   if(event==='phx_join'){ws.testTopic=topic;send('presence_state',{});}
   if(event==='presence'&&state.peer)send('presence_state',{peer:{metas:[{...state.peer,phx_ref:'peer-test'}]}});
  });
 });
 return state;
}
export async function enterClassroom(page,url='http://127.0.0.1:4181/'){
 const invite=new URL(url);invite.searchParams.set('sala',MOCK_ROOM);await page.goto(invite.href);await page.fill('#registrationName','Aluno Completo QA');await page.fill('#nickname','Rock QA');await page.click('#joinTeam');await page.waitForFunction(()=>window.oficina.state.online?.connected&&!document.querySelector('#welcome').open);
}
