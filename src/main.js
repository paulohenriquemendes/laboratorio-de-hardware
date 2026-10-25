import {setupTeacher} from './teacher.js';
import {createHair,applyAppearance,hairColors,hairStyles} from './avatar.js';
function locationOf(s){return s.zone==='wall'?s.bench:'Bancada '+s.bench+' · Lado '+(s.side<0?'A':'B')}
import {OnlineLab,OPEN_ROOM,validRoom,cleanName} from './online.js';
import '../online.css';
import {phaseMarkup,evidenceMarkup,glossaryMarkup} from './reading.js';
import * as THREE from 'three';
import {cases,fresh,restoreProgress,scoreOf,blocked} from './cases.js';
import {benches,stations,room,spawn,nearestStation} from './layout.js';
import {challenges,goals} from './challenges.js';
const $=s=>document.querySelector(s),key='laboratorioHardware80.v1';
let progress=fresh(),storageAvailable=true;try{const saved=localStorage.getItem(key)??localStorage.getItem('laboratorioHardware40.v1');if(saved!==null)progress=restoreProgress(saved);else{const unique=localStorage.getItem('oficina3d.unique20.v1');if(unique!==null){progress=restoreProgress(unique)}else{const previous=restoreProgress(localStorage.getItem('oficina3d.lab20.v1') ?? localStorage.getItem('oficina3d.progress.v1'));progress=previous.map((p,i)=>i<6?p:fresh()[i])}}}catch{storageAvailable=false}
let current=-1,near=-1,started=false,angle=0,walk=0,drag=null,overview=false;
let teamSignature='';let focusedPeer=null;let online=null,onlineBusy=false,localProgress=null,onlineRows=[],onlineMessage='';const remotePlayers=new Map();
const keys=new Set(),scene=new THREE.Scene();scene.background=new THREE.Color('#142d25');scene.fog=new THREE.Fog('#142d25',100,220);
const renderer=new THREE.WebGLRenderer({canvas:$('#world'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,220);
scene.add(new THREE.HemisphereLight(0xc8f4ff,0x31403c,2.4));const sun=new THREE.DirectionalLight(0xffe6bb,3);sun.position.set(-7,13,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-36,right:60,top:40,bottom:-40});sun.shadow.bias=-.001;scene.add(sun);
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.7});const materials={floor:mat('#667b83'),wall:mat('#456559'),wood:mat('#c9d4d8'),dark:mat('#243640'),metal:mat('#53636b'),mint:mat('#008241'),orange:mat('#ed8b23'),screen: new THREE.MeshStandardMaterial({color:'#63cdbb',emissive:'#1e7b71',emissiveIntensity:.55})};
function box(w,h,d,m,x,y,z,parent=scene){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof m==='string'?mat(m):m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function label(text,w=512,h=128,color='#bbefe4',bg='#203943'){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=color;ctx.font=`600 ${Math.floor(h*.43)}px Segoe UI`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h/2,w-20);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t});}
// Five shared benches; two workstations on each face, ten on each side.
box(54.5,.25,40,materials.floor,14,-.14,0);
for(let x=-13;x<=41;x++)box(.018,.008,40,'#788c93',x,.003,0);
for(let z=-20;z<=20;z++)box(54,.008,.018,'#788c93',14,.004,z);
box(54.5,4.5,.25,materials.wall,14,2.1,-20);
box(.25,4.5,40,materials.wall,-13.25,2.1,0);
box(.25,.4,40,materials.wall,41.25,.2,0);box(54.5,.4,.25,materials.wall,14,.2,20);
box(9,1,.06,label('LABORATÓRIO DE HARDWARE',1024,128),0,3.6,-19.84);
box(7,1.7,.1,'#e4eeeb',0,1.9,-19.8);
box(6.5,.8,.03,label('LABORATÓRIO DE HARDWARE',1024,128,'#23454c','#e4eeeb'),0,2,-19.72);
for(const z of [-15,-7,1,9,16]){box(.06,1.6,3.2,'#a2cfda',-13.08,2.4,z);box(.1,1.6,.06,materials.dark,-13.04,2.4,z);box(.1,.06,3.2,materials.dark,-13.04,2.4,z);}
for(const x of [-5.8,5.8,22.2,33.8])box(.07,.012,36,materials.mint,x,.01,0);
for(const offset of [0,28])for(const side of [-1,1]){box(2.6,.16,34.2,materials.wood,offset+side*11.5,1.1,0);for(const z of [-16,-8,0,8,16])for(const x of [10.6,12.4])box(.1,1,.1,materials.dark,offset+side*x,.5,z);}
box(10,1,.06,label('FUNDAMENTOS · PCs 41–80',1024,128),28,3.6,-19.84);
const beacons=[];const finishedBody=mat('#3cb769'),finishedFront=mat('#84dc9f'),finishedRing=mat('#7fea9c'),inactiveScreen=mat('#263f4f'),chairMat=mat('#2a7050');
for(const b of benches){
 box(b.width,.16,b.depth,materials.wood,b.x,1.1,b.z);
 for(const x of [-1.65,1.65])for(const z of [-2.35,2.35])box(.1,1,.1,materials.dark,b.x+x,.5,b.z+z);
 box(.14,.28,4.8,materials.dark,b.x,1.3,b.z);
 box(1,.3,.02,label('BANCADA '+b.id,256,80),b.x,.85,b.z+2.72);
}
for(const s of stations){const g=new THREE.Group();g.position.set(s.x,0,s.z);g.rotation.y=s.facing*Math.PI/2;scene.add(g);
 const monitorFrame=box(.95,.65,.12,materials.dark,-.25,1.65,-.3,g);const screen=box(.84,.52,.015,materials.screen,-.25,1.66,-.23,g);
 box(.08,.3,.08,materials.metal,-.25,1.28,-.3,g);box(.5,.04,.3,materials.dark,-.25,1.19,-.3,g);
 box(.75,.04,.28,materials.dark,-.25,1.21,.3,g);box(.13,.06,.2,materials.mint,.32,1.23,.32,g);
 const tower=box(.38,.78,.6,materials.dark,.8,1.55,-.13,g);const towerFront=box(.28,.6,.02,materials.metal,.8,1.55,.18,g);box(.05,.05,.03,materials.mint,.85,1.8,.2,g);
 for(let n=0;n<4;n++)box(.2,.02,.02,'#1c2d38',.8,1.4+n*.07,.2,g);
 box(.55,.22,.02,label('PC '+String(s.id).padStart(2,'0'),256,80),-.25,.88,.77,g);
 const chair=new THREE.Group();chair.position.set(s.chairX,0,s.z);chair.rotation.y=s.facing*Math.PI/2;scene.add(chair);
 box(.7,.13,.7,chairMat,0,.65,0,chair);box(.7,.7,.1,chairMat,0,1.03,.36,chair);box(.08,.58,.08,materials.metal,0,.3,0,chair);box(.8,.06,.08,materials.dark,0,.08,0,chair);box(.08,.06,.8,materials.dark,0,.08,0,chair);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.32,.025,8,24),materials.mint);ring.rotation.x=-Math.PI/2;ring.position.set(s.useX,.03,s.z);scene.add(ring);
 const marker=new THREE.Mesh(new THREE.PlaneGeometry(.7,.3),label('PC '+String(s.id).padStart(2,'0'),256,96));marker.position.set(s.x,2.55,s.z);scene.add(marker);beacons.push({ring,marker,screen,tower,towerFront,monitorFrame,pendingLabel:marker.material,doneLabel:label('✓ '+String(s.id).padStart(2,'0')+' REVISADO',512,128,'#103b20','#a4f1b7')});
}
// Student uniform, stylized from the requested Ceará school palette.
const player=new THREE.Group();player.position.set(spawn.x,0,spawn.z);scene.add(player);
const uniform={shirt:mat('#ffffff'),green:mat('#008241'),trim:mat('#ed8b23'),shoes:mat('#111413'),hair:mat('#2c211b')};
box(.57,.66,.32,uniform.shirt,0,1.14,0,player);
box(.59,.15,.35,uniform.green,0,.83,0,player);
// Collar is visible from both the following camera and the front.
const collar=new THREE.Mesh(new THREE.TorusGeometry(.18,.035,8,24),uniform.green);collar.rotation.x=Math.PI/2;collar.position.set(0,1.48,0);player.add(collar);
for(const side of [-1,1]){const lapel=box(.13,.13,.035,uniform.green,side*.09,1.42,-.18,player);lapel.rotation.z=side*.3;box(.035,.55,.34,uniform.trim,side*.28,1.16,0,player);}
box(.1,.12,.025,uniform.green,.15,1.27,-.18,player);
const head=box(.4,.43,.39,'#c48c68',0,1.72,0,player);createHair(player);
for(const x of [-.11,.11])box(.05,.05,.02,'#17252b',x,1.77,-.2,player);
const limbs=[];for(const side of [-1,1]){
 const arm=new THREE.Group();arm.position.set(side*.39,1.41,0);player.add(arm);
 box(.2,.31,.23,uniform.shirt,0,-.13,0,arm);box(.205,.045,.235,uniform.trim,0,-.28,0,arm);box(.205,.06,.235,uniform.green,0,-.33,0,arm);box(.17,.26,.18,'#c48c68',0,-.49,0,arm);
 const leg=new THREE.Group();leg.position.set(side*.17,.8,0);player.add(leg);box(.23,.62,.27,uniform.green,0,-.3,0,leg);box(.018,.59,.035,uniform.trim,side*.12,-.3,0,leg);box(.25,.16,.4,uniform.shoes,0,-.69,-.05,leg);
 limbs.push({arm,leg,side});
}
function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.display='none',3500)}
function save(){if(online){updateHUD();return;}try{localStorage.setItem(key,JSON.stringify(progress))}catch{storageAvailable=false}updateHUD()}
function sharedSolved(i){return online?!!onlineRows.find(r=>r.pc===i)?.shared_solved||progress[i].validated:progress[i].validated;}
function solversFor(i){return onlineRows.find(r=>r.pc===i)?.solvers||[];}
function updateHUD(){if(online)$('#save').textContent=onlineMessage;if(!storageAvailable)$('#save').textContent='Armazenamento indisponível: progresso só nesta sessão';const done=progress.filter(p=>p.validated).length;$('#progress').textContent=`${done} / 80 desafios${online?' seus':''}`;$('#score').textContent=`${scoreOf(progress)} pts`;$('#joblist').innerHTML=cases.map((c,i)=>`<div class="job ${progress[i].validated?'done':''}"><span class="num">${progress[i].validated?'✓':String(i+1).padStart(2,'0')}</span><div>${c.title}<small>${progress[i].validated?'✓ Você resolveu':online&&sharedSolved(i)?'Já resolvido na turma · sua vez!':locationOf(stations[i])}</small></div></div>`).join('');beacons.forEach((b,i)=>{const done=sharedSolved(i);b.ring.material=done?finishedRing:materials.mint;b.screen.material=done?materials.screen:inactiveScreen;b.tower.material=done?finishedBody:materials.dark;b.towerFront.material=done?finishedFront:materials.metal;b.monitorFrame.material=done?finishedBody:materials.dark;b.marker.material=done?b.doneLabel:b.pendingLabel;b.marker.scale.x=done?1.6:1});if(online){updateOccupancy();updateTeam();}}
function renderCase(){const c=cases[current],p=progress[current];$('#caseTag').textContent=`${locationOf(stations[current]).toUpperCase()} / PC ${String(current+1).padStart(2,'0')}`;$('#caseTitle').textContent=c.title;$('#symptom').textContent=c.symptom;let html='';
if(p.validated){html=`<h3 class="result">✓ Reparo validado e entregue</h3><p>${c.explain}</p><div class="clue">${c.validation}</div><h3>+${Math.max(30,150-p.errors*15)} pontos nesta bancada</h3>`;if(progress.every(v=>v.validated))html+=`<div class="clue"><b>Turno concluído! ${scoreOf(progress)} / 12000 pontos</b><br>Oitenta computadores recuperados. ${scoreOf(progress)>=10000?'Excelente investigação, técnico!':'Bom trabalho! Você pode repetir o turno para aprimorar o diagnóstico.'}</div>`;}
else if(p.repaired){html=`<h3 class="result">Reparo aplicado</h3><p>${c.explain}</p><button class="primary" data-action="validate">Verificar solução e concluir →</button>`;}
else if(p.diagnosed){html=`<h3 class="result">✓ Diagnóstico confirmado: ${c.options[c.answer]}</h3><p class="hint">${c.category?'Confira as unidades e as definições para corrigir a informação.':'Procedimento simulado: desligue e desconecte a alimentação antes de trabalhar nos componentes. Não abra a fonte.'}</p><h3>Selecione a solução</h3><div class="options">${c.repairs.map((r,i)=>`<button data-repair="${i}">${r}</button>`).join('')}</div>`;}
else{html=`<h3>01 / Reúna evidências <small>(${p.tests.length}/2)</small></h3><div class="tests">${c.tests.map((t,i)=>`<button data-test="${i}" ${p.tests.includes(i)?'disabled':''}>${p.tests.includes(i)?'✓':'＋'} ${t[0]}</button>`).join('')}</div>${evidenceMarkup(c,p)}<h3>02 / Qual é o diagnóstico?</h3><p class="hint">${p.tests.length<2?'Complete os dois testes para liberar o diagnóstico.':'Use as evidências. Uma tentativa incorreta desconta 15 pontos.'}</p><div class="options">${c.options.map((o,i)=>`<button data-diagnosis="${i}" ${p.tests.length<2?'disabled':''}>${o}</button>`).join('')}</div>`;}
if(p.validated){const q=challenges[current];html+=`<section class="challenge"><span class="eyebrow">DESAFIO DE CONCEITO / ${q.topic}</span><h3>${q.question}</h3>${p.challenge?`<div class="clue"><b>✓ Conceito concluído</b><br>${q.explanation}</div>`:`<p class="hint">Sem desconto na pontuação prática. Leia, responda e discuta em aula.</p><div class="options">${q.options.map((o,i)=>`<button data-challenge="${i}">${o}</button>`).join('')}</div>`}</section>`;}
$('#caseContent').innerHTML=phaseMarkup(p)+(p.diagnosed?evidenceMarkup(c,p):'')+html+glossaryMarkup(c)+'<p id="feedback" class="error" role="status"></p>';if(online){const authors=document.createElement('section');authors.className='clue completion-list';const title=document.createElement('b');title.textContent=solversFor(current).length?'Já resolveram este computador':'Seja o primeiro a resolver este computador';authors.append(title);const list=document.createElement('ul');for(const solver of solversFor(current)){const li=document.createElement('li');li.textContent=solver.name+(solver.score===null?' · registro anterior':` · ${solver.score} pts neste PC`);list.append(li)}authors.append(list);const hint=document.createElement('p');hint.textContent=p.validated?'Sua conclusão e seus pontos já estão registrados.':'Sua ficha é individual. Você pode resolver mesmo que outros alunos já tenham concluído.';authors.append(hint);$('#caseContent').prepend(authors);}}

async function interact(){if(focusedPeer)return;if(near<0||!started||overview||$('#welcome').open||$('#classroom').open||$('#panel').open)return;if(onlineBusy)return;const selected=near;keys.clear();if(online){onlineBusy=true;try{await online.claim(selected)}catch(e){toast(e.message);return}finally{onlineBusy=false}}current=selected;renderCase();$('#panel').showModal();}
$('#caseContent').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||b.disabled||onlineBusy)return;if(online){const kind=['test','diagnosis','repair','challenge'].find(k=>b.dataset[k]!==undefined)||b.dataset.action;if(!kind)return;onlineBusy=true;$('#caseContent').querySelectorAll('button').forEach(x=>x.disabled=true);try{const result=await online.action(current,kind,b.dataset[kind]!==undefined?Number(b.dataset[kind]):null);renderCase();$('#feedback').textContent=result.feedback;if(kind==='validate')toast('Você resolveu! Pontos adicionados ao seu placar.')}catch(e){renderCase();$('#feedback').textContent=e.message;}finally{onlineBusy=false}return;}const p=progress[current],c=cases[current];let error='';if(b.dataset.challenge!==undefined&&p.validated&&!p.challenge){const q=challenges[current];if(+b.dataset.challenge===q.answer)p.challenge=true;else{p.challengeErrors++;error=q.hint+' Tente novamente; sua pontuação prática foi mantida.'}}else if(b.dataset.test!==undefined){const i=+b.dataset.test;if(!p.tests.includes(i))p.tests.push(i)}else if(b.dataset.diagnosis!==undefined){if(+b.dataset.diagnosis===c.answer)p.diagnosed=true;else{p.errors++;error='As evidências não sustentam essa hipótese. Releia os resultados. −15 pontos.'}}else if(b.dataset.repair!==undefined){if(+b.dataset.repair===c.repair)p.repaired=true;else{p.errors++;error='Esse procedimento não resolve o defeito identificado. Escolha novamente. −15 pontos.'}}else if(b.dataset.action==='validate'){p.validated=true;toast('Computador recuperado! Pontos adicionados.')}save();renderCase();$('#feedback').textContent=error;if(error)$('#feedback').scrollIntoView({block:'nearest'});const next=$('#caseContent button:not(:disabled)');if(next)next.focus({preventScroll:true});else $('#close').focus({preventScroll:true});});
document.querySelectorAll('[data-reading-size]').forEach(button=>button.onclick=()=>{const large=!$('#panel').classList.contains('large-text');document.querySelectorAll('dialog').forEach(d=>d.classList.toggle('large-text',large));document.querySelectorAll('[data-reading-size]').forEach(b=>{b.textContent=large?'A− Texto padrão':'A+ Ampliar texto';b.setAttribute('aria-pressed',String(large))})});
$('#close').onclick=()=>$('#panel').close();$('#interact').onclick=interact;$('#start').onclick=async()=>{if(online){await online.leave();online=null;progress=localProgress||fresh();localProgress=null;onlineRows=[];$('#save').textContent='Progresso individual salvo neste navegador';updateHUD();updateTeam();}$('#welcome').close();started=true;keys.clear()};$('#help').onclick=()=>{keys.clear();$('#welcome').showModal()};$('#welcome').addEventListener('cancel',()=>{started=true});
function modalOpen(){return $('#panel').open||$('#welcome').open||$('#classroom').open||$('#teamDialog').open||$('#adminPanel').open}
addEventListener('keydown',e=>{if(modalOpen())return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','q','r','e'].includes(k)){e.preventDefault();if(k==='e'){if(!e.repeat)interact();return;}keys.add(k)}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();drag=null});document.addEventListener('visibilitychange',()=>keys.clear());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',()=>keys.clear()));
$('#world').addEventListener('pointerdown',e=>{drag=e.clientX;$('#world').setPointerCapture(e.pointerId)});$('#world').addEventListener('pointermove',e=>{if(drag!==null){angle-=(e.clientX-drag)*.006;drag=e.clientX}});$('#world').addEventListener('pointerup',()=>drag=null);$('#world').addEventListener('pointercancel',()=>drag=null);
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key)};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key)});
const clock=new THREE.Clock(),target=new THREE.Vector3(),desired=new THREE.Vector3();camera.position.set(0,6,14);
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);let moving=false;if(started&&!modalOpen()&&!overview){if(keys.has('q'))angle+=dt*1.6;if(keys.has('r'))angle-=dt*1.6;let x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),z=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(x||z){focusedPeer=null;const l=Math.hypot(x,z);x/=l;z/=l;const dx=(x*Math.cos(angle)+z*Math.sin(angle))*dt*3.4,dz=(-x*Math.sin(angle)+z*Math.cos(angle))*dt*3.4;if(!blocked(player.position.x+dx,player.position.z))player.position.x+=dx;if(!blocked(player.position.x,player.position.z+dz))player.position.z+=dz;player.rotation.y=Math.atan2(-dx,-dz);walk+=dt*10;moving=true;}}
limbs.forEach(({arm,leg,side})=>{arm.rotation.x=moving?Math.sin(walk)*.55*side:0;leg.rotation.x=moving?-Math.sin(walk)*.65*side:0});head.position.y=1.72+(moving?Math.abs(Math.sin(walk))*.025:0);
target.set(player.position.x,1.1,player.position.z);
if(overview){desired.set(66,64,60);target.set(14,0,0)}else{desired.set(player.position.x+Math.sin(angle)*8,6.8,player.position.z+Math.cos(angle)*8);desired.x=THREE.MathUtils.clamp(desired.x,-12.7,40.7);desired.z=THREE.MathUtils.clamp(desired.z,-19.2,27.5)}
if(focusedPeer&&remotePlayers.has(focusedPeer)){const remote=remotePlayers.get(focusedPeer);target.copy(remote.group.position).y=1.1;desired.set(target.x+5,6.8,target.z+7);}
camera.position.lerp(desired,1-Math.exp(-6*dt));camera.lookAt(target);
near=nearestStation(player.position.x,player.position.z);
beacons.forEach((b,i)=>{b.marker.quaternion.copy(camera.quaternion);b.ring.scale.setScalar(1+Math.sin(clock.elapsedTime*2+i)*.05)});
$('#followBanner').hidden=!focusedPeer;if(focusedPeer){const watched=remotePlayers.get(focusedPeer);if(watched)$('#followBanner span').textContent='Observando '+watched.name+' · '+(online?.scoreFor(watched.userId)||0)+' pts'+(watched.pc>=0?' · PC '+String(watched.pc+1).padStart(2,'0'):'');else focusedPeer=null;}
$('#prompt').hidden=!!focusedPeer||near<0||!started||modalOpen()||overview;
if(near>=0)$('#prompt span').textContent=`${progress[near].validated?'Revisar':'Inspecionar'} PC ${String(near+1).padStart(2,'0')} · ${locationOf(stations[near])}`;
if(online){online.pose({x:player.position.x,z:player.position.z,angle:player.rotation.y});for(const remote of remotePlayers.values()){const d=remote.group.position.distanceTo(remote.target);remote.group.position.lerp(remote.target,1-Math.exp(-8*dt));remote.group.rotation.y=remote.angle;remote.tag.quaternion.copy(remote.group.quaternion).invert().multiply(camera.quaternion);for(const limb of remote.limbs){limb.arm.rotation.x=d>.03?Math.sin(clock.elapsedTime*10)*.5*limb.side:0;limb.leg.rotation.x=d>.03?-Math.sin(clock.elapsedTime*10)*.6*limb.side:0;}}}
renderer.render(scene,camera);}
function renderClassroom(){
 const list=goals(progress);$('#classContent').innerHTML=list.map(g=>`<div class="clue"><b>${g.value===g.total?'✓ ':''}${g.name} · ${g.value}/${g.total}</b><p>${g.description}</p><progress value="${g.value}" max="${g.total}" aria-label="${g.name}"></progress></div>`).join('')+`<p>Prática: <b>${scoreOf(progress)} / 12000 pontos</b>. Desafios conceituais não alteram essa pontuação.</p><p class="hint">Converse com um colega: qual evidência descartou cada hipótese? Qual teste confirmou o reparo? ${online?'Este resumo mostra somente suas respostas e seus pontos nesta rodada.':'Este resumo é local e não é enviado ao professor automaticamente.'}</p>`;
}
$('#mapButton').onclick=()=>{keys.clear();overview=!overview;$('#mapButton').textContent=overview?'Voltar ao aluno':'Ver laboratório';$('#mapButton').setAttribute('aria-pressed',String(overview))};
$('#classroomButton').onclick=()=>{keys.clear();renderClassroom();$('#classroom').showModal()};
$('#closeClass').onclick=()=>$('#classroom').close();

$('#downloadReport').onclick=()=>{
 const report=['LABORATÓRIO DE HARDWARE — REGISTRO DE PRÁTICA','Data: '+new Date().toLocaleString('pt-BR'),online?'Sala: '+online.room.title:'Modo individual','Pontuação prática: '+scoreOf(progress)+' / 12000',...goals(progress).map(g=>g.name+': '+g.value+'/'+g.total),'',...cases.map((c,i)=>{const p=progress[i];return [(i+1)+'. '+c.title,'Testes: '+p.tests.length+'/2; diagnóstico: '+(p.diagnosed?'confirmado':'pendente')+'; reparo: '+(p.repaired?'aplicado':'pendente')+'; validação: '+(p.validated?'concluída':'pendente'),'Resolvido por: '+(solversFor(i).map(s=>s.name).join(', ')||'—'),'Tentativas incorretas na prática: '+p.errors,'Desafio conceitual: '+(p.challenge?'concluído':'pendente')+'; tentativas incorretas: '+p.challengeErrors].join('\n')}),'',online?'Registro individual na sala para discussão em aula; não é uma avaliação supervisionada.':'Registro local para discussão em aula; não é uma avaliação supervisionada.'].join('\n');
 const url=URL.createObjectURL(new Blob([report],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='laboratorio-hardware-relatorio.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
setupTeam();setupTeacher({getSession:()=>online,onReset:()=>{if($('#panel').open)$('#panel').close();},notify:toast});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});updateHUD();$('#welcome').showModal();frame();
// Read-only diagnostics for reproducible browser verification.
window.oficina={get state(){return {appearance:player.userData.appearance,focusedPeer,online:online?{room:online.room?.id,round:online.room?.round,connected:online.connected,peers:[...remotePlayers.values()].map(p=>({name:p.name,x:p.group.position.x,z:p.group.position.z,appearance:p.group.userData.appearance,pc:p.pc,score:online.scoreFor(p.userId),label:p.tagText})),scores:structuredClone(online.scores),rows:structuredClone(onlineRows)}:null,position:{x:player.position.x,z:player.position.z},camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z},angle,near,overview,computerColors:beacons.map(b=>b.tower.material.color.getHexString()),stations:stations.map(s=>({...s})),benchCount:benches.length,moving:limbs[0].leg.rotation.x,progress:structuredClone(progress),score:scoreOf(progress)}}};


function updateTeam(){
 $('#teamSummary').textContent=online?`${online.room?.title||'Sala'} · Rodada ${online.room?.round||1} · ${remotePlayers.size+1} online · Você: ${progress.filter(p=>p.validated).length}/80`:'Modo individual';
 if(!online){teamSignature='';$('#teamMembers').replaceChildren();$('#teamActivity').replaceChildren();$('#teamRanking').replaceChildren();$('#roomLink').value='';$('#teamStatus').textContent='No modo individual, seu progresso fica neste navegador.';return;}
 const signature=JSON.stringify([online.room?.nickname,onlineMessage,[...remotePlayers].map(([id,p])=>[id,p.name,p.pc]),online.scores,onlineRows.map(r=>[r.pc,r.revision,r.solvers])]);if(signature===teamSignature)return;teamSignature=signature;
 $('#teamStatus').textContent=onlineMessage;
 const members=$('#teamMembers');members.replaceChildren();
 const me=document.createElement('li');me.textContent=(online.room?.nickname||'Você')+' (você) · '+scoreOf(progress)+' pts';members.append(me);
 for(const [id,p] of remotePlayers){const li=document.createElement('li');const text=document.createElement('span');text.textContent=p.name+' · '+online.scoreFor(p.userId)+' pts'+(p.pc>=0?' · PC '+String(p.pc+1).padStart(2,'0'):' · Explorando');li.append(text);const locate=document.createElement('button');locate.textContent='Localizar';locate.setAttribute('aria-label','Localizar '+p.name);locate.onclick=()=>{focusedPeer=id;overview=false;keys.clear();$('#teamDialog').close();toast('Acompanhando '+p.name+'. Use Voltar ao meu aluno ou caminhe para voltar.');};li.append(locate);members.append(li);}
 const ranking=$('#teamRanking');ranking.replaceChildren();const scores=new Map(online.scores.map(s=>[s.user_id,s]));if(online.userId&&!scores.has(online.userId))scores.set(online.userId,{user_id:online.userId,name:online.room?.nickname,score:0,solved:0});for(const p of remotePlayers.values())if(!scores.has(p.userId))scores.set(p.userId,{user_id:p.userId,name:p.name,score:0,solved:0});
 let rank=0,previousScore=null;[...scores.values()].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).forEach((entry,index)=>{if(entry.score!==previousScore)rank=index+1;previousScore=entry.score;const li=document.createElement('li');li.textContent=`${rank}º · ${entry.name}${entry.user_id===online.userId?' (você)':''} · ${entry.score} pts · ${entry.solved}/80`;ranking.append(li)});
 const activity=$('#teamActivity');activity.replaceChildren();
 for(const row of onlineRows){if(!row.solvers?.length)continue;const li=document.createElement('li');li.textContent=`PC ${String(row.pc+1).padStart(2,'0')} · ✓ Já resolveram: ${row.solvers.map(s=>s.name).join(', ')}`;activity.append(li);}
}
function syncAvatars(peers){
 const ids=new Set(peers.map(p=>p.instance));for(const [id,remote] of remotePlayers){if(!ids.has(id)){scene.remove(remote.group);remote.group._hairMaterial?.dispose();remote.tag.material.map.dispose();remote.tag.material.dispose();remote.tag.geometry.dispose();remotePlayers.delete(id);}}
 for(const peer of peers){let remote=remotePlayers.get(peer.instance);if(!remote){const group=player.clone(true);const tag=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.4),label(peer.name,512,128,'#ffffff','#006b36'));tag.position.set(0,2.4,0);group.add(tag);scene.add(group);remote={group,tag,name:peer.name,target:new THREE.Vector3(),angle:0,limbs:limbs.map(l=>({side:l.side,arm:group.children[player.children.indexOf(l.arm)],leg:group.children[player.children.indexOf(l.leg)]}))};remotePlayers.set(peer.instance,remote);group.position.set(peer.x??spawn.x,0,peer.z??spawn.z);}
 remote.name=peer.name;remote.userId=peer.userId;remote.pc=Number.isInteger(peer.pc)&&peer.pc>=0&&peer.pc<80?peer.pc:-1;applyAppearance(remote.group,peer.appearance);remote.target.set(Number.isFinite(peer.x)?peer.x:spawn.x,0,Number.isFinite(peer.z)?peer.z:spawn.z);remote.angle=Number.isFinite(peer.angle)?peer.angle:0;
 }updateOccupancy();updateTeam();
}
function setupTeam(){
 let roomParam=new URL(location.href).searchParams.get('sala');
 $('#roomHint').textContent=roomParam?'Você recebeu um convite. Entre para cooperar nesta sala.':'Entre no laboratório aberto ou crie uma sala exclusiva para sua turma.';
 try{$('#nickname').value=localStorage.getItem('hardware.nickname')||''}catch{}
 const button=document.createElement('button');button.id='teamButton';button.textContent='Equipe';$('.stats').append(button);
 button.onclick=()=>{keys.clear();updateTeam();$('#teamDialog').showModal()};
 $('#returnToMe').onclick=()=>{focusedPeer=null};
 $('#followMe').onclick=()=>{focusedPeer=null;overview=false;$('#teamDialog').close()};
 $('#saveAppearance').onclick=async()=>{if(!online){toast('Entre em equipe para salvar seu personagem.');return;}const button=$('#saveAppearance');button.disabled=true;try{const a=await online.setAppearance({style:Number($('#hairStyle').value),color:$('#hairColor').value});applyAppearance(player,a);toast('Seu personagem foi atualizado para a equipe.')}catch(e){toast(e.message)}finally{setTimeout(()=>button.disabled=false,7000)}};
 $('#reconnectTeam').onclick=()=>{if(online)void online.reconnect()};
 $('#closeTeam').onclick=()=>$('#teamDialog').close();
 $('#copyRoom').onclick=async()=>{if(!online?.room)return;const url=new URL(location.href);url.searchParams.set('sala',online.room.id);$('#roomLink').value=url.href;try{await navigator.clipboard.writeText(url.href);toast('Link da sala copiado!')}catch{$('#roomLink').select();toast('Selecione e copie o link da sala.')}};
 const enter=async create=>{
  if(onlineBusy)return;roomParam=new URL(location.href).searchParams.get('sala');const name=cleanName($('#nickname').value||$('#teamNickname').value);if(name.length<2){$('#joinError').textContent='Digite um apelido com pelo menos 2 caracteres.';$('#nickname').focus();return;}
  if(!create&&roomParam&&!validRoom(roomParam)){$('#joinError').textContent='O link da sala é inválido. Confira o endereço recebido.';return;}
  if(online){await online.leave();online=null;}
  localProgress??=structuredClone(progress);onlineRows=[];onlineBusy=true;$('#joinError').textContent='Conectando…';$('#joinTeam').disabled=$('#createTeam').disabled=$('#start').disabled=true;
  const session=new OnlineLab({
   status:(message)=>{onlineMessage=message;$('#teamStatus').textContent=message;$('#save').textContent=message;},
   round:round=>{progress=fresh();onlineRows=[];teamSignature='';if($('#panel').open)$('#panel').close();updateHUD();toast('O professor iniciou a rodada '+round+'. Os 80 desafios estão disponíveis.');},
   tasks:rows=>{if(online?.ready){let announced=false;for(const row of rows){const old=onlineRows.find(r=>r.pc===row.pc);const added=row.solvers?.find(s=>!old?.solvers?.some(p=>p.user_id===s.user_id&&p.name===s.name));if(added&&!announced){toast(added.name+' resolveu o PC '+String(row.pc+1).padStart(2,'0')+'. Você também pode resolver!');announced=true;}}}onlineRows=rows;const next=fresh();rows.forEach(row=>next[row.pc]=row.progress);progress=restoreProgress(JSON.stringify(next));updateHUD();if($('#panel').open&&!onlineBusy)renderCase();if($('#classroom').open)renderClassroom();},
   peers:syncAvatars
  });online=session;
  try{const room=await session.enter(name,create?null:roomParam||OPEN_ROOM,create?$('#roomTitle').value:null);try{localStorage.setItem('hardware.nickname',name)}catch{}const url=new URL(location.href);url.searchParams.set('sala',room.id);history.replaceState(null,'',url);$('#roomLink').value=url.href;$('#teamNickname').value=name;applyAppearance(player,session.appearance);$('#hairStyle').value=String(session.appearance.style);$('#hairColor').value=session.appearance.color;$('#welcome').close();$('#teamDialog').close();started=true;keys.clear();updateHUD();toast('Você entrou em '+room.title+'. Compartilhe o link em Equipe.');}
  catch(e){await session.leave();online=null;progress=localProgress;localProgress=null;$('#joinError').textContent=e.message||'Não foi possível entrar. Tente novamente.';updateHUD();}
  finally{onlineBusy=false;$('#joinTeam').disabled=$('#createTeam').disabled=$('#start').disabled=false;}
 };
 $('#joinTeam').onclick=()=>enter(false);$('#createTeam').onclick=()=>enter(true);
 $('#newTeam').onclick=()=>{$('#teamDialog').close();$('#welcome').showModal();$('#joinError').textContent='Dê um nome à nova sala e clique em Criar sala da turma.'};
 $('#leaveTeam').onclick=async()=>{if(!online||onlineBusy)return;await online.leave();online=null;progress=localProgress||fresh();localProgress=null;onlineRows=[];const url=new URL(location.href);url.searchParams.delete('sala');history.replaceState(null,'',url);$('#teamDialog').close();$('#save').textContent='Progresso individual salvo neste navegador';updateHUD();updateTeam();toast('Você voltou ao modo individual. A sala permanece salva.');};
 $('#panel').addEventListener('close',()=>{if(online)void online.release()});
 addEventListener('offline',()=>{if(online)online.disconnect();});
 addEventListener('online',()=>{if(online)void online.reconnect();});
 setInterval(()=>{if(online){updateOccupancy();updateTeam()}},1000);
 $('#teamStatus').textContent='No modo individual, seu progresso fica neste navegador.';
}

function updateOccupancy(){
 if(!online)return;
 for(const row of onlineRows){const b=beacons[row.pc];const count=row.solvers?.length||0;const busy=[...remotePlayers.values()].filter(p=>p.pc===row.pc).map(p=>p.name);if(online.activePc===row.pc)busy.push(online.room.nickname);const done=sharedSolved(row.pc);const text=done?'✓ PC '+String(row.pc+1).padStart(2,'0')+' · '+count+(count===1?' aluno':' alunos'):busy.length?'PC '+String(row.pc+1).padStart(2,'0')+' · '+busy.join(', '):'';const signature=String(done)+text;
  if(text&&b.busyText!==signature){if(b.busyLabel){b.busyLabel.map.dispose();b.busyLabel.dispose();}b.busyLabel=label(text,1024,128,done?'#103b20':'#573400',done?'#a4f1b7':'#ffdd91');b.busyText=signature;}
  b.marker.material=text?b.busyLabel:b.pendingLabel;b.marker.scale.x=text?3.8:1;
 }
 for(const remote of remotePlayers.values()){const text=remote.name+' · '+online.scoreFor(remote.userId)+' pts'+(remote.pc>=0?' · PC '+String(remote.pc+1).padStart(2,'0'):'');if(remote.tagText!==text){remote.tag.material.map.dispose();remote.tag.material.dispose();remote.tag.material=label(text,1024,128,'#ffffff',remote.pc>=0?'#a35d08':'#006b36');remote.tagText=text;remote.tag.scale.x=remote.pc>=0?2:1.65;}}
}
