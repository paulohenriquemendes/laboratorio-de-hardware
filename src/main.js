import {setupCustomers} from './customers.js';
import {customerCases} from './customer-cases.js';
import {setupCelebration,setupCelebrationShop} from './celebrations.js';
import '../celebrations.css';
import {setupHazardRecovery} from './hazard-recovery.js';
import {createFloorHazards,setupHazardContact,floorHazards,hazardAt} from './floor-hazards.js';
import {setupTutorial} from './tutorial.js';
import '../tutorial.css';
import {competitionMode,publicScoreSuffix} from './competition.js';
import {educationalFeedback,showEducationalFeedback} from './educational-feedback.js';
import {createFaultScreens} from './fault-screens.js';
import {showSymptomAnimation} from './symptom-animation.js';
import '../symptom-animation.css';
import {batchStaticBoxes} from './scene-performance.js';
import {money,baseReward,caseReward,MAX_EARNINGS} from './economy.js';
import {setupStudentRegistration} from './student-registration.js';
import {setupOffline} from './offline.js';
import {mountPractice} from './practice-widgets.js';
import '../practice.css';
import {setupMobileControls} from './mobile-controls.js';
import {setupWardrobe} from './wardrobe.js';
import {unlockedAppearance} from './cosmetics.js';
import {separatePlayer,movePlayer,freeSpawn} from './player-physics.js';
import {challengeOrder,pcNumber,pcLabel,byPcNumber} from './challenge-order.js';
import {setupNotes} from './notes.js';
import {createHair,createAccessories,applyAppearance,normalizeAppearance,hairColors,hairStyles} from './avatar.js';
function locationOf(s){return s.zone==='wall'?s.bench.replace('Fundamentos · ',''):'Bancada '+s.bench+' · Lado '+(s.side<0?'A':'B')}
import {OnlineLab,OPEN_ROOM,validRoom,cleanName} from './online.js';
import '../online.css';
import '../mobile.css';
import {phaseMarkup,evidenceMarkup,glossaryMarkup} from './reading.js';
import * as THREE from 'three';
import {cases,fresh,restoreProgress,scoreOf,blocked} from './cases.js';
import {benches,stations,room,spawn,nearestStation} from './layout.js';
import {challenges,goals} from './challenges.js';
const registration=setupStudentRegistration();
const $=s=>document.querySelector(s);
let progress=fresh();
let current=-1,near=-1,started=false,angle=0,walk=0,drag=null,overview=false;
let teamSignature='';let focusedPeer=null;let online=null,onlineBusy=false,onlineRows=[],onlineMessage='';const remotePlayers=new Map(),announcedCustomers=new Set();
const keys=new Set(),scene=new THREE.Scene();scene.background=new THREE.Color('#142d25');scene.fog=new THREE.Fog('#142d25',100,220);
const renderer=new THREE.WebGLRenderer({canvas:$('#world'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,220);
scene.add(new THREE.HemisphereLight(0xc8f4ff,0x31403c,2.4));const sun=new THREE.DirectionalLight(0xffe6bb,3);sun.position.set(-7,13,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-36,right:60,top:40,bottom:-40});sun.shadow.bias=-.001;scene.add(sun);
const materialPool=new Map(),geometryPool=new Map();const mat=c=>{if(!materialPool.has(c))materialPool.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.7}));return materialPool.get(c)};const materials={floor:mat('#667b83'),wall:mat('#456559'),wood:mat('#c9d4d8'),dark:mat('#243640'),metal:mat('#53636b'),mint:mat('#008241'),orange:mat('#ed8b23'),screen: new THREE.MeshStandardMaterial({color:'#63cdbb',emissive:'#1e7b71',emissiveIntensity:.55})};
function box(w,h,d,m,x,y,z,parent=scene){const key=[w,h,d].join(':');if(!geometryPool.has(key))geometryPool.set(key,new THREE.BoxGeometry(w,h,d));const mesh=new THREE.Mesh(geometryPool.get(key),typeof m==='string'?mat(m):m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
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
box(10,1,.06,label('LABORATÓRIO DE HARDWARE',1024,128),28,3.6,-19.84);
const beacons=[];const finishedBody=mat('#3cb769'),finishedFront=mat('#84dc9f'),finishedRing=mat('#7fea9c'),chairMat=mat('#2a7050');
for(const b of benches){
 box(b.width,.16,b.depth,materials.wood,b.x,1.1,b.z);
 for(const x of [-1.65,1.65])for(const z of [-2.35,2.35])box(.1,1,.1,materials.dark,b.x+x,.5,b.z+z);
 box(.14,.28,4.8,materials.dark,b.x,1.3,b.z);
 box(1,.3,.02,label('BANCADA '+b.id,256,80),b.x,.85,b.z+2.72);
}
const faultScreens=createFaultScreens(cases);
for(const [caseId,s] of stations.entries()){const g=new THREE.Group();g.position.set(s.x,0,s.z);g.rotation.y=s.facing*Math.PI/2;scene.add(g);
 const monitorFrame=box(.95,.65,.12,materials.dark,-.25,1.65,-.3,g);const screen=new THREE.Mesh(faultScreens.geometry(caseId),faultScreens.material);screen.position.set(-.25,1.66,-.22);g.add(screen);
 box(.08,.3,.08,materials.metal,-.25,1.28,-.3,g);box(.5,.04,.3,materials.dark,-.25,1.19,-.3,g);
 box(.75,.04,.28,materials.dark,-.25,1.21,.3,g);box(.13,.06,.2,materials.mint,.32,1.23,.32,g);
 const tower=box(.38,.78,.6,materials.dark,.8,1.55,-.13,g);const towerFront=box(.28,.6,.02,materials.metal,.8,1.55,.18,g);box(.05,.05,.03,materials.mint,.85,1.8,.2,g);
 for(let n=0;n<4;n++)box(.2,.02,.02,'#1c2d38',.8,1.4+n*.07,.2,g);
 box(.55,.22,.02,label('PC '+String(s.id).padStart(2,'0'),256,80),-.25,.88,.77,g);
 const chair=new THREE.Group();chair.position.set(s.chairX,0,s.z);chair.rotation.y=s.facing*Math.PI/2;scene.add(chair);
 box(.7,.13,.7,chairMat,0,.65,0,chair);box(.7,.7,.1,chairMat,0,1.03,.36,chair);box(.08,.58,.08,materials.metal,0,.3,0,chair);box(.8,.06,.08,materials.dark,0,.08,0,chair);box(.08,.06,.8,materials.dark,0,.08,0,chair);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.32,.025,8,24),materials.mint);ring.rotation.x=-Math.PI/2;ring.position.set(s.useX,.03,s.z);scene.add(ring);
 const marker=new THREE.Mesh(new THREE.PlaneGeometry(.7,.3),label('PC '+String(s.id).padStart(2,'0'),256,96));marker.position.set(s.x,2.55,s.z);scene.add(marker);beacons.push({ring,marker,screen,tower,towerFront,monitorFrame,pendingLabel:marker.material,faultMaterial:faultScreens.material,doneLabel:label('✓ '+String(s.id).padStart(2,'0')+' REVISADO',512,128,'#103b20','#a4f1b7')});
}
const hazardVisuals=createFloorHazards(scene,{label});
const batching=batchStaticBoxes(scene,new Set(beacons.flatMap(b=>[b.screen,b.tower,b.towerFront,b.monitorFrame])));
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
 const arm=new THREE.Group();arm.name='arm'+side;arm.userData.avatarLimb=true;arm.position.set(side*.39,1.41,0);player.add(arm);
 box(.2,.31,.23,uniform.shirt,0,-.13,0,arm);box(.205,.045,.235,uniform.trim,0,-.28,0,arm);box(.205,.06,.235,uniform.green,0,-.33,0,arm);box(.17,.26,.18,'#c48c68',0,-.49,0,arm);
 const leg=new THREE.Group();leg.name='leg'+side;leg.userData.avatarLimb=true;leg.position.set(side*.17,.8,0);player.add(leg);box(.23,.62,.27,uniform.green,0,-.3,0,leg).userData.uniformPants=true;box(.018,.59,.035,uniform.trim,side*.12,-.3,0,leg).userData.uniformPants=true;box(.25,.16,.4,uniform.shoes,0,-.69,-.05,leg).userData.uniformShoe=true;
 limbs.push({arm,leg,side});
}
createAccessories(player,limbs.map(l=>l.arm),limbs.map(l=>l.leg));
const rig=new THREE.Group();rig.name='celebrationRig';for(const child of [...player.children])rig.add(child);player.add(rig);
const wardrobe=setupWardrobe({player,getSession:()=>online,getScore:()=>scoreOf(progress)+(online?.bonus||0),getSolved:()=>progress.filter(p=>p.validated).length,notify:s=>toast(s)});
function wallet(){return Math.max(0,scoreOf(progress)+(online?.bonus||0)-(online?.expenses||0));}
function toast(s,danger=false){$('#toast').classList.toggle('incident-alert',danger);$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.display='none',danger?7000:3500)}

function sharedSolved(i){return online?!!onlineRows.find(r=>r.pc===i)?.shared_solved||progress[i].validated:progress[i].validated;}
function solversFor(i){return onlineRows.find(r=>r.pc===i)?.solvers||[];}
function updateHUD(){if(online)$('#save').textContent=onlineMessage;const done=progress.filter(p=>p.validated).length;$('#progress').textContent=`${done} / 80 desafios${online?' seus':''}`;$('#score').textContent=money(wallet());$('#score').title='Carteira fictícia: recompensas obtidas menos custos de incidentes e compras. Desafios e desbloqueios conquistados são preservados.';$('#joblist').innerHTML=challengeOrder.map(i=>{const c=cases[i];return `<div class="job ${progress[i].validated?'done':''}"><span class="num">${progress[i].validated?'✓':pcLabel(i)}</span><div>${c.title}<small>${progress[i].validated?'✓ Você resolveu':online&&sharedSolved(i)?'Já resolvido na turma · sua vez!':locationOf(stations[i])}</small></div></div>`}).join('');beacons.forEach((b,i)=>{const done=sharedSolved(i);b.ring.material=done?finishedRing:materials.mint;b.screen.material=done?materials.screen:b.faultMaterial;b.tower.material=done?finishedBody:materials.dark;b.towerFront.material=done?finishedFront:materials.metal;b.monitorFrame.material=done?finishedBody:materials.dark;b.marker.material=done?b.doneLabel:b.pendingLabel;b.marker.scale.x=done?1.6:1});if(online){for(const remote of remotePlayers.values())if(remote.sourceAppearance)applyAppearance(remote.group,competitionMode(online.room)==='ranking'?unlockedAppearance(remote.sourceAppearance,online.earnedFor(remote.userId),online.scores.find(s=>s.user_id===remote.userId)?.solved||0):remote.sourceAppearance);applyAppearance(player,unlockedAppearance(normalizeAppearance(online.appearance),scoreOf(progress)+(online?.bonus||0),progress.filter(p=>p.validated).length));updateOccupancy();updateTeam();}}
function renderCase(){const c=cases[current],p=progress[current];$('#caseTag').textContent=`${locationOf(stations[current]).toUpperCase()} / PC ${pcLabel(current)}`;$('#caseTitle').textContent=c.title;$('#symptom').textContent=c.symptom;showSymptomAnimation(current);let html='';
if(p.validated){html=`<h3 class="result">✓ Reparo validado e entregue</h3><p>${c.explain}</p><div class="clue">${c.validation}</div><h3>+${money(caseReward(current,p.errors))} fictícios nesta bancada</h3>`;if(progress.every(v=>v.validated))html+=`<div class="clue"><b>Turno concluído! ${money(scoreOf(progress))} / ${money(MAX_EARNINGS)} fictícios</b><br>Oitenta computadores recuperados. ${scoreOf(progress)>=4000?'Excelente investigação, técnico!':'Bom trabalho! Você pode repetir o turno para aprimorar o diagnóstico.'}</div>`;}
else if(p.repaired){html=`<h3 class="result">Reparo aplicado</h3><p>${c.explain}</p><button class="primary" data-action="validate">Verificar solução e concluir →</button>`;}
else if(p.diagnosed){html=`<h3 class="result">✓ Diagnóstico confirmado: ${c.options[c.answer]}</h3><p class="hint">${c.category?'Confira as unidades e as definições para corrigir a informação.':'Procedimento simulado: desligue e desconecte a alimentação antes de trabalhar nos componentes. Não abra a fonte.'}</p><h3>Selecione a solução</h3><div class="options">${c.repairs.map((r,i)=>`<button data-repair="${i}">${r}</button>`).join('')}</div>`;}
else{html=`<h3>01 / Reúna evidências <small>(${p.tests.length}/2)</small></h3><div class="tests">${c.tests.map((t,i)=>`<button data-test="${i}" ${p.tests.includes(i)?'disabled':''}>${p.tests.includes(i)?'✓':'＋'} ${t[0]}</button>`).join('')}</div>${evidenceMarkup(c,p)}<h3>02 / Qual é o diagnóstico?</h3><p class="hint">${p.tests.length<2?'Complete os dois testes para liberar o diagnóstico.':'Use as evidências. Um erro prático reduz R$ 5 da recompensa, até o mínimo de R$ 20.'}</p><div class="options">${c.options.map((o,i)=>`<button data-diagnosis="${i}" ${p.tests.length<2?'disabled':''}>${o}</button>`).join('')}</div>`;}
if(p.validated){const q=challenges[current];html+=`<section class="challenge"><span class="eyebrow">DESAFIO DE CONCEITO / ${q.topic}</span><h3>${q.question}</h3>${p.challenge?`<div class="clue"><b>✓ Conceito concluído</b><br>${q.explanation}</div>`:`<p class="hint">Sem desconto na recompensa fictícia. Leia, responda e discuta em aula.</p><div class="options">${q.options.map((o,i)=>`<button data-challenge="${i}">${o}</button>`).join('')}</div>`}</section>`;}
$('#caseContent').innerHTML=`<p class="clue">Recompensa: até <b>${money(baseReward(current))}</b> fictícios · desconto de R$ 5 por erro prático, mínimo de R$ 20.</p>`+phaseMarkup(p)+(p.diagnosed?evidenceMarkup(c,p):'')+html+glossaryMarkup(c)+'<section id="feedback" class="error" role="status" aria-live="polite"></section>';mountPractice($('#caseContent'),current);if(online){const authors=document.createElement('section');authors.className='clue completion-list';const title=document.createElement('b');title.textContent=solversFor(current).length?'Já resolveram este computador':'Seja o primeiro a resolver este computador';authors.append(title);const list=document.createElement('ul');for(const solver of solversFor(current)){const li=document.createElement('li');li.textContent=solver.name+(competitionMode(online.room)!=='ranking'?'':solver.score===null?' · registro anterior':` · ${money(solver.score)} fictícios neste PC`);list.append(li)}authors.append(list);const hint=document.createElement('p');hint.textContent=p.validated?'Sua conclusão e suas recompensas fictícias já estão registradas.':'Sua ficha é individual. Você pode resolver mesmo que outros alunos já tenham concluído.';authors.append(hint);$('#caseContent').prepend(authors);}}

async function interact(){if(focusedPeer)return;if(customers.near>=0&&started&&online?.connected&&!modalOpen()&&!overview&&!hazardRecovery.active&&!celebration.active){keys.clear();await customers.open();return;}if(near<0||!started||!online?.connected||hazardRecovery.active||celebration.active||overview||$('#welcome').open||$('#classroom').open||$('#panel').open)return;if(onlineBusy)return;const selected=near;keys.clear();if(online){onlineBusy=true;try{await online.claim(selected)}catch(e){toast(e.message);return}finally{onlineBusy=false}}current=selected;renderCase();$('#panel').showModal();}
$('#caseContent').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b||b.disabled||onlineBusy||!online?.connected)return;if(online){const kind=['test','diagnosis','repair','challenge'].find(k=>b.dataset[k]!==undefined)||b.dataset.action;if(!kind)return;const before={errors:progress[current].errors,challengeErrors:progress[current].challengeErrors,challenge:progress[current].challenge};const choice=b.dataset[kind]!==undefined?Number(b.dataset[kind]):null;onlineBusy=true;$('#caseContent').setAttribute('aria-busy','true');$('#caseContent').querySelectorAll('button').forEach(x=>x.disabled=true);try{const result=await online.action(current,kind,choice);renderCase();showEducationalFeedback($('#feedback'),educationalFeedback(current,kind,choice,before,result.task.progress),result.feedback);if(kind==='validate')toast('Você resolveu! Recompensa fictícia adicionada ao seu placar.');if(kind==='challenge'&&!before.challenge&&result.task.progress.challenge){$('#panel').close();celebrate();}}catch(e){renderCase();$('#feedback').textContent=e.message;}finally{onlineBusy=false;$('#caseContent').setAttribute('aria-busy','false')}return;}});
document.querySelectorAll('[data-reading-size]').forEach(button=>button.onclick=()=>{const large=!$('#panel').classList.contains('large-text');document.querySelectorAll('dialog').forEach(d=>d.classList.toggle('large-text',large));document.querySelectorAll('[data-reading-size]').forEach(b=>{b.textContent=large?'A− Texto padrão':'A+ Ampliar texto';b.setAttribute('aria-pressed',String(large))})});
$('#close').onclick=()=>$('#panel').close();$('#interact').onclick=interact;$('#help').onclick=()=>{keys.clear();$('#welcome').showModal()};$('#welcome').addEventListener('cancel',e=>{if(!started)e.preventDefault()});
function modalOpen(){return mobileControls.menuOpen||!!document.querySelector('dialog[open]')}
addEventListener('keydown',e=>{if(modalOpen())return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','q','r','e'].includes(k)){e.preventDefault();if(k==='e'){if(!e.repeat)interact();return;}keys.add(k)}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();drag=null});document.addEventListener('visibilitychange',()=>keys.clear());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',()=>keys.clear()));
const mobileControls=setupMobileControls({keys,isModal:()=>modalOpen(),turnCamera:value=>{angle-=value},resetCamera:()=>{angle=0;focusedPeer=null;overview=false;$('#mapButton').textContent='Ver laboratório';$('#mapButton').setAttribute('aria-pressed','false')},setQuality:light=>{renderer.setPixelRatio(Math.min(devicePixelRatio,light?1:1.7));renderer.shadowMap.enabled=!light;renderer.shadowMap.needsUpdate=true;}});
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key)};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.key)});
let lastUpdate=0,framesRendered=0,framesUpdated=0;const clock=new THREE.Clock(),target=new THREE.Vector3(),desired=new THREE.Vector3();camera.position.set(0,6,14);
function frame(){requestAnimationFrame(frame);if(document.hidden){clock.getDelta();lastUpdate=0;return;}const now=performance.now();if(now-lastUpdate<(modalOpen()&&!celebration.active?250:mobileControls.mobile?32:16))return;lastUpdate=now;framesUpdated++;tutorial.update();hazardVisuals.update(clock.elapsedTime,camera);const dt=Math.min(clock.getDelta(),.05);customers.update(dt,camera,started);let moving=false;if(started&&!modalOpen()&&!overview&&!hazardRecovery.active&&!celebration.active){if(keys.has('q'))angle+=dt*1.6;if(keys.has('r'))angle-=dt*1.6;let x=mobileControls.x+Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),z=mobileControls.z+Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(x||z){focusedPeer=null;const l=Math.max(1,Math.hypot(x,z));x/=l;z/=l;const dx=(x*Math.cos(angle)+z*Math.sin(angle))*dt*3.4,dz=(-x*Math.sin(angle)+z*Math.cos(angle))*dt*3.4;movePlayer(player.position,dx,dz,[...[...remotePlayers.values()].map(p=>p.group.position),...customers.positions],blocked);if(online?.connected)for(const [id,p] of remotePlayers){const ox=p.group.position.x-player.position.x,oz=p.group.position.z-player.position.z;if(Math.hypot(ox,oz)<1.08&&dx*ox+dz*oz>0)online.push(id);}player.rotation.y=Math.atan2(-dx,-dz);walk+=dt*10;moving=true;}}
if(!celebration.active)limbs.forEach(({arm,leg,side})=>{arm.rotation.x=moving?Math.sin(walk)*.55*side:0;leg.rotation.x=moving?-Math.sin(walk)*.65*side:0});head.position.y=1.72+(moving?Math.abs(Math.sin(walk))*.025:0);
if(online?.connected){separatePlayer(player.position,[...remotePlayers.entries()].map(([id,p])=>({id,x:p.target.x,z:p.target.z})),online.instance,blocked,dt);separatePlayer(player.position,customers.positions.map((p,i)=>({id:'npc-'+i,x:p.x,z:p.z})),online.instance,blocked,dt);}
 if(started&&!modalOpen()&&!overview){const hazard=hazardAt(player.position.x,player.position.z);if(hazard&&!hazardRecovery.active)hazardRecovery.start(hazard);hazardContact.update(player.position.x,player.position.z,!!online?.connected);}
 hazardRecovery.update(dt);celebration.update(dt);
 target.set(player.position.x,1.1,player.position.z);
if(overview){desired.set(66,64,60);target.set(14,0,0)}else{desired.set(player.position.x+Math.sin(angle)*8,6.8,player.position.z+Math.cos(angle)*8);desired.x=THREE.MathUtils.clamp(desired.x,-12.7,40.7);desired.z=THREE.MathUtils.clamp(desired.z,-19.2,27.5)}
if(focusedPeer&&remotePlayers.has(focusedPeer)){const remote=remotePlayers.get(focusedPeer);target.copy(remote.group.position).y=1.1;desired.set(target.x+5,6.8,target.z+7);}
camera.position.lerp(desired,1-Math.exp(-6*dt));camera.lookAt(target);
near=nearestStation(player.position.x,player.position.z);
beacons.forEach((b,i)=>{b.marker.quaternion.copy(camera.quaternion);b.ring.scale.setScalar(1+Math.sin(clock.elapsedTime*2+i)*.05)});
$('#followBanner').hidden=!focusedPeer;if(focusedPeer){const watched=remotePlayers.get(focusedPeer);if(watched)$('#followBanner span').textContent='Observando '+watched.name+publicScoreSuffix(online?.room,online?.scoreFor(watched.userId)||0,money)+(watched.pc>=0?' · PC '+pcLabel(watched.pc):'');else focusedPeer=null;}
$('#prompt').hidden=!!focusedPeer||(near<0&&customers.near<0)||!started||modalOpen()||overview||celebration.active;
if(near>=0){const text=(progress[near].validated?'Revisar PC ':'Abrir PC ')+pcLabel(near);if($('#interact').dataset.mobileLabel!==text)$('#interact').dataset.mobileLabel=text;}
if(near>=0){const text=`${progress[near].validated?'Revisar':'Inspecionar'} PC ${pcLabel(near)} · ${locationOf(stations[near])}`;if($('#prompt span').textContent!==text)$('#prompt span').textContent=text;}
if(customers.near>=0){$('#interact').dataset.mobileLabel='Atender '+customerCases[customers.near].name;$('#prompt span').textContent=customers.prompt;}
if(online){online.pose({x:player.position.x,z:player.position.z,angle:player.rotation.y});for(const remote of remotePlayers.values()){const d=remote.group.position.distanceTo(remote.target);remote.group.position.lerp(remote.target,1-Math.exp(-8*dt));remote.group.rotation.y=remote.angle;remote.tag.quaternion.copy(remote.group.quaternion).invert().multiply(camera.quaternion);if(!remote.celebration.active)for(const limb of remote.limbs){limb.arm.rotation.x=d>.03?Math.sin(clock.elapsedTime*10)*.5*limb.side:0;limb.leg.rotation.x=d>.03?-Math.sin(clock.elapsedTime*10)*.6*limb.side:0;}remote.celebration.update(dt);}}
renderer.render(scene,camera);framesRendered++;}

function renderClassroom(){
 const list=goals(progress);$('#classContent').innerHTML=list.map(g=>`<div class="clue"><b>${g.value===g.total?'✓ ':''}${g.name} · ${g.value}/${g.total}</b><p>${g.description}</p><progress value="${g.value}" max="${g.total}" aria-label="${g.name}"></progress></div>`).join('')+`<p>Atendimentos extras: <b>${online?.bonusSolved||0} clientes · ${money(online?.bonus||0)} fictícios</b>.</p><p>Recompensas obtidas em desafios: <b>${money(scoreOf(progress))} / ${money(MAX_EARNINGS)} fictícios</b>. Desafios conceituais não alteram esse valor. Dinheiro fictício, sem valor monetário.</p><p>Custos de incidentes e compras: <b>${money(online?.expenses||0)}</b> · Carteira atual: <b>${money(wallet())}</b>. Incidentes não apagam respostas, conclusões ou desbloqueios conquistados.</p><p class="hint">Converse com um colega: qual evidência descartou cada hipótese? Qual teste confirmou o reparo? ${online?'Este resumo mostra somente suas respostas e suas recompensas fictícias nesta rodada.':'Este resumo é local e não é enviado ao professor automaticamente.'}</p>`;
}
$('#mapButton').onclick=()=>{keys.clear();overview=!overview;$('#mapButton').textContent=overview?'Voltar ao aluno':'Ver laboratório';$('#mapButton').setAttribute('aria-pressed',String(overview))};
$('#classroomButton').onclick=()=>{keys.clear();renderClassroom();$('#classroom').showModal()};
$('#closeClass').onclick=()=>$('#classroom').close();

$('#downloadReport').onclick=()=>{
 const report=['MISSÃO HARDWARE — REGISTRO DE PRÁTICA','Data: '+new Date().toLocaleString('pt-BR'),'Aluno: '+(registration.saved.fullName||'Não informado'),'Turma: '+(registration.saved.className||'Não identificada'),...(validRoom(new URL(location.href).searchParams.get('sala'))?['Convite da turma: '+location.origin+location.pathname+'?sala='+new URL(location.href).searchParams.get('sala')]:[]),online?'Sala: '+online.room.title:'Entre na sua turma','Recompensas fictícias obtidas: '+money(scoreOf(progress))+' / '+money(MAX_EARNINGS),'Custos fictícios de incidentes e compras: '+money(online?.expenses||0),'Carteira atual: '+money(wallet()),'Clientes atendidos: '+(online?.bonusSolved||0)+' | Pagamentos extras: '+money(online?.bonus||0),...goals(progress).map(g=>g.name+': '+g.value+'/'+g.total),'',...challengeOrder.map(i=>{const c=cases[i],p=progress[i];return [pcNumber(i)+'. '+c.title,'Testes: '+p.tests.length+'/2; diagnóstico: '+(p.diagnosed?'confirmado':'pendente')+'; reparo: '+(p.repaired?'aplicado':'pendente')+'; validação: '+(p.validated?'concluída':'pendente'),'Resolvido por: '+(solversFor(i).map(s=>s.name).join(', ')||'—'),'Tentativas incorretas na prática: '+p.errors,'Desafio conceitual: '+(p.challenge?'concluído':'pendente')+'; tentativas incorretas: '+p.challengeErrors].join('\n')}),'',online?'Registro individual na sala para discussão em aula; não é uma avaliação supervisionada.':'Registro local para discussão em aula; não é uma avaliação supervisionada.'].join('\n');
 const url=URL.createObjectURL(new Blob([report],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='missao-hardware-relatorio.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
setupTeam();setupNotes({getSession:()=>online,getIdentity:()=>registration.saved,onOpen:()=>keys.clear()});
const offlineUI=setupOffline({getSession:()=>online,isBusy:()=>onlineBusy,hasInvite:()=>validRoom(new URL(location.href).searchParams.get('sala')),onOpen:()=>keys.clear()});
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const celebration=setupCelebration({rig,limbs,reducedMotion:()=>reducedMotion.matches});
function celebrate(style=online?.celebrations?.selected||0){if(!started||hazardRecovery.active)return;keys.clear();mobileControls.reset();celebration.start(style);online?.celebrate(style);}
const celebrationShop=setupCelebrationShop({getSession:()=>online,getWallet:wallet,preview:celebrate,notify:toast});
const customers=setupCustomers({scene,label,getSession:()=>online,getPosition:()=>player.position,onOpen:()=>{keys.clear();mobileControls.reset();},onPaid:()=>celebrate(),notify:toast});
const hazardRecovery=setupHazardRecovery({position:player.position,getPeers:()=>[...remotePlayers.values()].map(p=>p.group.position),blocked,onReact:()=>{keys.clear();mobileControls.reset();},reducedMotion:()=>reducedMotion.matches});
const hazardContact=setupHazardContact(async hazard=>{const session=online;if(!session?.connected)return;try{const result=await session.incident(hazard.id);if(online!==session)return;updateHUD();if(result.cooldown||result.duplicate)return;toast('Incidente simulado: '+hazard.name+'. '+(result.cost?'−'+money(result.cost)+' da carteira para consulta médica fictícia.':'Carteira sem saldo; nenhum desconto aplicado.')+' Observe o piso e desvie das áreas amarelas.',true);}catch(e){toast('Não foi possível confirmar o incidente: '+e.message,true);}});
const tutorial=setupTutorial({notify:toast,getState:()=>({connected:!!online?.connected,userId:online?.userId,started,near,current,progress,panelOpen:$('#panel').open,notesOpen:$('#notesDialog').open,welcomeOpen:$('#welcome').open,otherDialog:$('#teamDialog').open||$('#classroom').open})});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});updateHUD();$('#welcome').showModal();frame();
// Read-only diagnostics for reproducible browser verification.
window.oficina={get state(){return {celebration:celebration.state,customers:customers.state,celebrations:online?.celebrations,hazardRecovery:hazardRecovery.state,hazardAnimations:hazardVisuals.state,wallet:wallet(),expenses:online?.expenses||0,hazards:floorHazards,tutorial:tutorial.state,busy:onlineBusy,performance:{framesRendered,framesUpdated,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,light:!renderer.shadowMap.enabled,batching},appearance:player.userData.appearance,focusedPeer,online:online?{competitionMode:competitionMode(online.room),room:online.room?.id,round:online.room?.round,connected:online.connected,peers:[...remotePlayers.values()].map(p=>({name:p.name,celebration:p.celebration.state,x:p.group.position.x,z:p.group.position.z,appearance:p.group.userData.appearance,pc:p.pc,score:online.scoreFor(p.userId),label:p.tagText})),scores:structuredClone(online.scores),rows:structuredClone(onlineRows)}:null,position:{x:player.position.x,y:player.position.y,z:player.position.z},camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z},angle,near,overview,faultScreens:beacons.map((b,i)=>({caseId:i,pc:pcNumber(i),faultVisible:b.screen.material===b.faultMaterial})),computerColors:beacons.map(b=>b.tower.material.color.getHexString()),stations:stations.map(s=>({...s})),benchCount:benches.length,moving:limbs[0].leg.rotation.x,progress:structuredClone(progress),score:scoreOf(progress)}}};


function updateTeam(){$('#newTeam').hidden=!!online;$('#leaveTeam').hidden=!online;$('#reconnectTeam').hidden=!online;$('.invite-details').hidden=!online;
 $('#teamSummary').textContent=online?`${online.room?.title||'Sala'} · Rodada ${online.room?.round||1} · ${remotePlayers.size+1} online · Você: ${progress.filter(p=>p.validated).length}/80`:'Entre na sua turma';
 if(!online){teamSignature='';$('#teamMembers').replaceChildren();$('#teamActivity').replaceChildren();$('#teamRanking').replaceChildren();$('#roomLink').value='';$('#teamStatus').textContent='Use o convite enviado pelo professor para entrar na sua turma.';return;}
 const signature=JSON.stringify([online.room?.nickname,competitionMode(online.room),onlineMessage,[...remotePlayers].map(([id,p])=>[id,p.name,p.pc]),online.scores,online.customers,onlineRows.map(r=>[r.pc,r.revision,r.solvers])]);if(signature===teamSignature)return;teamSignature=signature;
 $('#teamStatus').textContent=onlineMessage;
 const members=$('#teamMembers');members.replaceChildren();
 const me=document.createElement('li');me.textContent=(online.room?.nickname||'Você')+' (você)'+(competitionMode(online.room)==='hidden'?'':' · '+money(wallet()));members.append(me);
 for(const [id,p] of remotePlayers){const li=document.createElement('li');const text=document.createElement('span');text.textContent=p.name+publicScoreSuffix(online.room,online.scoreFor(p.userId),money)+(p.pc>=0?' · PC '+pcLabel(p.pc):' · Explorando');li.append(text);const locate=document.createElement('button');locate.textContent='Localizar';locate.setAttribute('aria-label','Localizar '+p.name);locate.onclick=()=>{focusedPeer=id;overview=false;keys.clear();$('#teamDialog').close();toast('Acompanhando '+p.name+'. Use Voltar ao meu aluno ou caminhe para voltar.');};li.append(locate);members.append(li);}
 const mode=competitionMode(online.room);$('#competitionNotice').textContent=mode==='ranking'?'Placar completo ativado pelo professor.':mode==='individual'?'O professor escolheu exibir somente a sua evolução, sem classificação entre colegas.':'O professor desativou o placar. Sua carteira e seus resultados continuam registrados.';$('#teamRanking').hidden=$('#teamRankingTitle').hidden=mode==='hidden';$('#teamRankingTitle').textContent=mode==='individual'?'Sua evolução':'Placar da rodada';const ranking=$('#teamRanking');ranking.replaceChildren();const scores=new Map(online.scores.map(s=>[s.user_id,s]));if(online.userId&&!scores.has(online.userId))scores.set(online.userId,{user_id:online.userId,name:online.room?.nickname,score:0,solved:0});for(const p of remotePlayers.values())if(!scores.has(p.userId))scores.set(p.userId,{user_id:p.userId,name:p.name,score:0,solved:0});
 let rank=0,previousScore=null;[...scores.values()].filter(entry=>mode==='ranking'||entry.user_id===online.userId).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).forEach((entry,index)=>{if(entry.score!==previousScore)rank=index+1;previousScore=entry.score;const li=document.createElement('li');li.textContent=`${mode==='ranking'?rank+'º · ':''}${entry.name}${entry.user_id===online.userId?' (você)':''} · ${money(entry.score)} · ${entry.solved}/80${entry.extra_solved?' · '+entry.extra_solved+' clientes':''}`;ranking.append(li)});
 const activity=$('#teamActivity');activity.replaceChildren();
 for(const job of online.customers||[]){if(job.status==='done'){const li=document.createElement('li');li.textContent='Cliente '+customerCases[job.id].name+' · ✓ Atendido por '+job.completed_name;activity.append(li);}}
 for(const row of [...onlineRows].sort(byPcNumber)){if(!row.solvers?.length)continue;const li=document.createElement('li');li.textContent=`PC ${pcLabel(row.pc)} · ✓ Já resolveram: ${row.solvers.map(s=>s.name).join(', ')}`;activity.append(li);}
}
function syncAvatars(peers){
 const ids=new Set(peers.map(p=>p.instance));for(const [id,remote] of remotePlayers){if(!ids.has(id)){scene.remove(remote.group);remote.group._hairMaterial?.dispose();remote.tag.material.map.dispose();remote.tag.material.dispose();remote.tag.geometry.dispose();remotePlayers.delete(id);}}
 for(const peer of peers){let remote=remotePlayers.get(peer.instance);if(!remote){const group=player.clone(true);const tag=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.4),label(peer.name,512,128,'#ffffff','#006b36'));tag.position.set(0,2.4,0);group.add(tag);scene.add(group);remote={group,tag,name:peer.name,target:new THREE.Vector3(),angle:0,limbs:limbs.map(l=>({side:l.side,arm:group.getObjectByName(l.arm.name),leg:group.getObjectByName(l.leg.name)}))};remote.celebration=setupCelebration({rig:group.getObjectByName('celebrationRig'),limbs:remote.limbs,reducedMotion:()=>reducedMotion.matches});remote.celebration.reset();remotePlayers.set(peer.instance,remote);group.position.set(peer.x??spawn.x,0,peer.z??spawn.z);}
 remote.name=peer.name;remote.userId=peer.userId;remote.pc=Number.isInteger(peer.pc)&&peer.pc>=0&&peer.pc<80?peer.pc:-1;remote.sourceAppearance=normalizeAppearance(peer.appearance);applyAppearance(remote.group,competitionMode(online?.room)==='ranking'?unlockedAppearance(remote.sourceAppearance,online?.earnedFor(peer.userId)||0,online?.scores.find(s=>s.user_id===peer.userId)?.solved||0):remote.sourceAppearance);remote.target.set(Number.isFinite(peer.x)?peer.x:spawn.x,0,Number.isFinite(peer.z)?peer.z:spawn.z);remote.angle=Number.isFinite(peer.angle)?peer.angle:0;
 }updateOccupancy();updateTeam();
}
function setupTeam(){
 let roomParam=new URL(location.href).searchParams.get('sala');
 $('#roomHint').textContent=roomParam?'Este convite leva à turma do seu professor. Informe seu nome e sobrenome para o registro; a turma já está definida neste convite. Escolha um apelido para encontrar seus colegas.':'Para entrar com colegas, abra o link da turma enviado pelo professor. Peça ao professor o link da sua turma.';
 try{$('#nickname').value=localStorage.getItem('hardware.nickname')||''}catch{}
 const button=document.createElement('button');button.id='teamButton';button.textContent='Minha turma';$('.stats').append(button);
 button.onclick=()=>{keys.clear();updateTeam();$('#teamDialog').showModal()};
 $('.appearance-details').addEventListener('toggle',()=>{if($('.appearance-details').open)wardrobe.open()});
 const look=document.createElement('button');look.id='wardrobeButton';look.textContent='Meu visual';$('.stats').append(look);look.onclick=()=>{button.click();$('.appearance-details').open=true;$('.appearance-details').scrollIntoView({block:'start'})};
 $('#returnToMe').onclick=()=>{focusedPeer=null};
 $('#followMe').onclick=()=>{focusedPeer=null;overview=false;$('#teamDialog').close()};
 $('#reconnectTeam').onclick=()=>{if(online)void online.reconnect()};
 $('#closeTeam').onclick=()=>$('#teamDialog').close();
 $('#copyRoom').onclick=async()=>{if(!online?.room)return;const url=new URL(location.href);url.searchParams.set('sala',online.room.id);$('#roomLink').value=url.href;try{await navigator.clipboard.writeText(url.href);toast('Link da sala copiado!')}catch{$('#roomLink').select();toast('Selecione e copie o link da sala.')}};
 const enter=async create=>{
  if(!navigator.onLine){$('#joinError').textContent='Sem conexão. Reconecte para entrar na turma.';return;}if(onlineBusy)return;roomParam=new URL(location.href).searchParams.get('sala');const identity=registration.read();if(!identity)return;const name=identity.nickname;
  if(!validRoom(roomParam)){$('#joinError').textContent='Abra o convite enviado pelo professor para entrar em uma turma. Peça ao professor o link da sua turma.';return;}
  if(online){await online.leave();online=null;}
  started=false;progress=fresh();onlineRows=[];announcedCustomers.clear();onlineBusy=true;$('#joinError').textContent='Conectando…';$('#joinTeam').disabled=true;
  const session=new OnlineLab({
   status:(message)=>{if(online!==session)return;offlineUI.update();onlineMessage=message;$('#teamStatus').textContent=message;$('#save').textContent=message;},
   celebrate:(id,style)=>remotePlayers.get(id)?.celebration.start(style),
   customers:()=>{if(online===session){customers.sync();if(online.ready)for(const job of online.customers){if(job.status==='done'&&!announcedCustomers.has(job.id)){announcedCustomers.add(job.id);toast(job.completed_name+' atendeu '+customerCases[job.id].name+(competitionMode(online.room)==='ranking'||job.completed_user===online.userId?' e recebeu '+money(job.reward)+' fictícios.':'.'));}}else for(const job of online.customers)if(job.status==='done')announcedCustomers.add(job.id);}},
   round:round=>{if(online!==session)return;customers.close();celebration.reset();announcedCustomers.clear();progress=fresh();onlineRows=[];teamSignature='';if($('#panel').open)$('#panel').close();updateHUD();toast('O professor iniciou a rodada '+round+'. Os 80 desafios estão disponíveis.');},
   tasks:rows=>{if(online!==session)return;if(online?.ready){let announced=false;for(const row of rows){const old=onlineRows.find(r=>r.pc===row.pc);const added=row.solvers?.find(s=>!old?.solvers?.some(p=>p.user_id===s.user_id&&p.name===s.name));if(added&&!announced){toast(added.name+' resolveu o PC '+pcLabel(row.pc)+'. Você também pode resolver!');announced=true;}}}onlineRows=rows;const next=fresh();rows.forEach(row=>next[row.pc]=row.progress);progress=restoreProgress(JSON.stringify(next));updateHUD();if($('#panel').open&&!onlineBusy)renderCase();if($('#classroom').open)renderClassroom();},
   push:peer=>{if(online!==session)return;const dx=player.position.x-peer.x,dz=player.position.z-peer.z,d=Math.hypot(dx,dz);if(d>.001&&d<1.3)movePlayer(player.position,dx/d*.12,dz/d*.12,[...remotePlayers.entries()].filter(([id])=>id!==peer.instance).map(([,p])=>p.group.position),blocked);},
   peers:peers=>{if(online===session)syncAvatars(peers)}
  });online=session;
  try{const room=await session.enter(name,roomParam||OPEN_ROOM,null,identity);if(online!==session)return;registration.rememberRoom(room);const entry=freeSpawn(spawn,[...remotePlayers.values()].map(p=>p.target),blocked);player.position.set(entry.x,0,entry.z);try{localStorage.setItem('hardware.nickname',name)}catch{}const url=new URL(location.href);url.searchParams.set('sala',room.id);history.replaceState(null,'',url);$('#roomLink').value=url.href;$('#teamNickname').value=name;applyAppearance(player,session.appearance);$('#hairStyle').value=String(session.appearance.style);$('#hairColor').value=session.appearance.color;$('#welcome').close();$('#teamDialog').close();started=true;keys.clear();updateHUD();toast('Você entrou em '+room.title+'. Veja seus colegas em Minha turma.');hazardContact.reset();hazardRecovery.reset();tutorial.start();}
  catch(e){void session.leave().catch(()=>{});if(online!==session)return;online=null;progress=fresh();started=false;$('#joinError').textContent=e.message||'Não foi possível entrar. Tente novamente.';updateHUD();}
  finally{if(online===session||!online){onlineBusy=false;offlineUI.update();}}
 };
 $('#joinTeam').onclick=()=>enter(false);
 $('#newTeam').onclick=()=>{$('#teamDialog').close();$('#welcome').showModal();$('#joinError').textContent='Confira sua identificação e o apelido para entrar. Para trocar de turma, abra o convite enviado pelo professor.'};
 $('#leaveTeam').onclick=async()=>{if(!online||onlineBusy)return;const previous=online;customers.close();$('#celebrationShop').close();celebration.reset();online=null;started=false;progress=fresh();onlineRows=[];focusedPeer=null;syncAvatars([]);keys.clear();for(const id of ['panel','teamDialog','classroom','notesDialog'])$('#'+id).close();$('#welcome').showModal();updateHUD();updateTeam();offlineUI.update();await previous.leave();};
 $('#panel').addEventListener('close',()=>{if(online)void online.release()});
 addEventListener('offline',()=>{if(online)online.disconnect();});
 addEventListener('online',()=>{if(online)void online.reconnect();});
 setInterval(()=>{if(online){updateOccupancy();updateTeam()}},1000);
 $('#teamStatus').textContent='Use o convite enviado pelo professor para entrar na sua turma.';
}

function updateOccupancy(){
 if(!online)return;
 for(const row of onlineRows){const b=beacons[row.pc];const count=row.solvers?.length||0;const busy=[...remotePlayers.values()].filter(p=>p.pc===row.pc).map(p=>p.name);if(online.activePc===row.pc)busy.push(online.room.nickname);const done=sharedSolved(row.pc);const text=done?'✓ PC '+pcLabel(row.pc)+' · '+count+(count===1?' aluno':' alunos'):busy.length?'PC '+pcLabel(row.pc)+' · '+busy.join(', '):'';const signature=String(done)+text;
  if(text&&b.busyText!==signature){if(b.busyLabel){b.busyLabel.map.dispose();b.busyLabel.dispose();}b.busyLabel=label(text,1024,128,done?'#103b20':'#573400',done?'#a4f1b7':'#ffdd91');b.busyText=signature;}
  b.marker.material=text?b.busyLabel:b.pendingLabel;b.marker.scale.x=text?3.8:1;
 }
 for(const remote of remotePlayers.values()){const text=remote.name+publicScoreSuffix(online.room,online.scoreFor(remote.userId),money)+(remote.pc>=0?' · PC '+pcLabel(remote.pc):'');if(remote.tagText!==text){remote.tag.material.map.dispose();remote.tag.material.dispose();remote.tag.material=label(text,1024,128,'#ffffff',remote.pc>=0?'#a35d08':'#006b36');remote.tagText=text;remote.tag.scale.x=remote.pc>=0?2:1.65;}}
}
