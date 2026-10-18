import {phaseMarkup,evidenceMarkup,glossaryMarkup} from './reading.js';
import * as THREE from 'three';
import {cases,fresh,restoreProgress,scoreOf,blocked} from './cases.js';
import {benches,stations,room,spawn,nearestStation} from './layout.js';
import {challenges,goals} from './challenges.js';
const $=s=>document.querySelector(s),key='oficina3d.unique20.v1';
let progress=fresh(),storageAvailable=true;try{const saved=localStorage.getItem(key);if(saved!==null)progress=restoreProgress(saved);else{const previous=restoreProgress(localStorage.getItem('oficina3d.lab20.v1') ?? localStorage.getItem('oficina3d.progress.v1'));progress=previous.map((p,i)=>i<6?p:fresh()[i])}}catch{storageAvailable=false}
let current=-1,near=-1,started=false,angle=0,walk=0,drag=null,overview=false;
const keys=new Set(),scene=new THREE.Scene();scene.background=new THREE.Color('#152937');scene.fog=new THREE.Fog('#152937',40,80);
const renderer=new THREE.WebGLRenderer({canvas:$('#world'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,80);
scene.add(new THREE.HemisphereLight(0xc8f4ff,0x31403c,2.4));const sun=new THREE.DirectionalLight(0xffe6bb,3);sun.position.set(-7,13,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-23,right:23,top:23,bottom:-23});sun.shadow.bias=-.001;scene.add(sun);
const mat=c=>new THREE.MeshStandardMaterial({color:c,roughness:.7});const materials={floor:mat('#667b83'),wall:mat('#405963'),wood:mat('#c9d4d8'),dark:mat('#243640'),metal:mat('#53636b'),mint:mat('#66dac1'),orange:mat('#efa65c'),screen: new THREE.MeshStandardMaterial({color:'#63cdbb',emissive:'#1e7b71',emissiveIntensity:.55})};
function box(w,h,d,m,x,y,z,parent=scene){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof m==='string'?mat(m):m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function label(text,w=512,h=128,color='#bbefe4',bg='#203943'){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.fillStyle=color;ctx.font=`600 ${Math.floor(h*.43)}px Segoe UI`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,w/2,h/2);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t});}
// Five shared benches; two workstations on each face, ten on each side.
box(16.5,.25,40,materials.floor,0,-.14,0);
for(let x=-8;x<=8;x++)box(.018,.008,40,'#788c93',x,.003,0);
for(let z=-20;z<=20;z++)box(16,.008,.018,'#788c93',0,.004,z);
box(16.5,4.5,.25,materials.wall,0,2.1,-20);
box(.25,4.5,40,materials.wall,-8.25,2.1,0);
box(.25,.4,40,materials.wall,8.25,.2,0);box(16.5,.4,.25,materials.wall,0,.2,20);
box(9,1,.06,label('LABORATÓRIO DE INFORMÁTICA',1024,128),0,3.6,-19.84);
box(7,1.7,.1,'#e4eeeb',0,1.9,-19.8);
box(6.5,.8,.03,label('ARQUITETURA + MANUTENÇÃO',1024,128,'#23454c','#e4eeeb'),0,2,-19.72);
for(const z of [-15,-7,1,9,16]){box(.06,1.6,3.2,'#a2cfda',-8.08,2.4,z);box(.1,1.6,.06,materials.dark,-8.04,2.4,z);box(.1,.06,3.2,materials.dark,-8.04,2.4,z);}
for(const x of [-5.8,5.8])box(.07,.012,36,materials.mint,x,.01,0);
const beacons=[];const finishedRing=mat('#55948a'),inactiveScreen=mat('#263f4f'),chairMat=mat('#3f7791');
for(const b of benches){
 box(b.width,.16,b.depth,materials.wood,0,1.1,b.z);
 for(const x of [-1.65,1.65])for(const z of [-2.35,2.35])box(.1,1,.1,materials.dark,x,.5,b.z+z);
 box(.14,.28,4.8,materials.dark,0,1.3,b.z);
 box(1,.3,.02,label('BANCADA '+b.id,256,80),0,.85,b.z+2.72);
}
for(const s of stations){const g=new THREE.Group();g.position.set(s.x,0,s.z);g.rotation.y=s.side*Math.PI/2;scene.add(g);
 box(.95,.65,.12,materials.dark,-.25,1.65,-.3,g);const screen=box(.84,.52,.015,materials.screen,-.25,1.66,-.23,g);
 box(.08,.3,.08,materials.metal,-.25,1.28,-.3,g);box(.5,.04,.3,materials.dark,-.25,1.19,-.3,g);
 box(.75,.04,.28,materials.dark,-.25,1.21,.3,g);box(.13,.06,.2,materials.mint,.32,1.23,.32,g);
 box(.38,.78,.6,materials.dark,.8,1.55,-.13,g);box(.28,.6,.02,materials.metal,.8,1.55,.18,g);box(.05,.05,.03,materials.mint,.85,1.8,.2,g);
 for(let n=0;n<4;n++)box(.2,.02,.02,'#1c2d38',.8,1.4+n*.07,.2,g);
 box(.55,.22,.02,label('PC '+String(s.id).padStart(2,'0'),256,80),-.25,.88,.77,g);
 const chair=new THREE.Group();chair.position.set(s.side*2.8,0,s.z);chair.rotation.y=s.side*Math.PI/2;scene.add(chair);
 box(.7,.13,.7,chairMat,0,.65,0,chair);box(.7,.7,.1,chairMat,0,1.03,.36,chair);box(.08,.58,.08,materials.metal,0,.3,0,chair);box(.8,.06,.08,materials.dark,0,.08,0,chair);box(.08,.06,.8,materials.dark,0,.08,0,chair);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.32,.025,8,24),materials.mint);ring.rotation.x=-Math.PI/2;ring.position.set(s.useX,.03,s.z);scene.add(ring);
 const marker=new THREE.Mesh(new THREE.PlaneGeometry(.7,.3),label('PC '+String(s.id).padStart(2,'0'),256,96));marker.position.set(s.x,2.55,s.z);scene.add(marker);beacons.push({ring,marker,screen});
}
// Visible technician, with independently animated limbs.
const player=new THREE.Group();player.position.set(spawn.x,0,spawn.z);scene.add(player);
box(.57,.66,.32,materials.mint,0,1.14,0,player);box(.59,.15,.35,materials.dark,0,.83,0,player);box(.2,.19,.03,'#f0cb79',.15,1.18,-.18,player);
const head=box(.4,.43,.39,'#c48c68',0,1.72,0,player);box(.44,.14,.43,materials.dark,0,1.96,0,player);box(.46,.05,.18,materials.dark,0,1.91,-.23,player);for(const x of [-.11,.11])box(.05,.05,.02,'#17252b',x,1.77,-.2,player);
const limbs=[];for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.39,1.41,0);player.add(arm);box(.2,.45,.23,materials.mint,0,-.19,0,arm);box(.17,.23,.18,'#c48c68',0,-.5,0,arm);const leg=new THREE.Group();leg.position.set(side*.17,.8,0);player.add(leg);box(.23,.62,.27,materials.dark,0,-.3,0,leg);box(.25,.16,.4,'#13242c',0,-.69,-.05,leg);limbs.push({arm,leg,side});}
function toast(s){$('#toast').textContent=s;$('#toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.display='none',3500)}
function save(){try{localStorage.setItem(key,JSON.stringify(progress))}catch{storageAvailable=false}updateHUD()}
function updateHUD(){if(!storageAvailable)$('#save').textContent='Armazenamento indisponível: progresso só nesta sessão';const done=progress.filter(p=>p.validated).length;$('#progress').textContent=`${done} / 20 reparos`;$('#score').textContent=`${scoreOf(progress)} pts`;$('#joblist').innerHTML=cases.map((c,i)=>`<div class="job ${progress[i].validated?'done':''}"><span class="num">${progress[i].validated?'✓':String(i+1).padStart(2,'0')}</span><div>${c.title}<small>${progress[i].validated?'✓ Validado':'Bancada '+stations[i].bench+' · Lado '+(stations[i].side<0?'A':'B')}</small></div></div>`).join('');beacons.forEach((b,i)=>{b.ring.material=progress[i].validated?finishedRing:materials.mint;b.screen.material=progress[i].validated?materials.screen:inactiveScreen});}
function renderCase(){const c=cases[current],p=progress[current];$('#caseTag').textContent=`BANCADA ${stations[current].bench} / PC ${String(current+1).padStart(2,'0')} / LADO ${stations[current].side<0?'A':'B'}`;$('#caseTitle').textContent=c.title;$('#symptom').textContent=c.symptom;let html='';
if(p.validated){html=`<h3 class="result">✓ Reparo validado e entregue</h3><p>${c.explain}</p><div class="clue">${c.validation}</div><h3>+${Math.max(30,150-p.errors*15)} pontos nesta bancada</h3>`;if(progress.every(v=>v.validated))html+=`<div class="clue"><b>Turno concluído! ${scoreOf(progress)} / 3000 pontos</b><br>Vinte computadores recuperados. ${scoreOf(progress)>=2500?'Excelente investigação, técnico!':'Bom trabalho! Você pode repetir o turno para aprimorar o diagnóstico.'}</div>`;}
else if(p.repaired){html=`<h3 class="result">Reparo aplicado</h3><p>${c.explain}</p><button class="primary" data-action="validate">Executar teste final e entregar →</button>`;}
else if(p.diagnosed){html=`<h3 class="result">✓ Diagnóstico confirmado: ${c.options[c.answer]}</h3><p class="hint">Procedimento simulado: desligue e desconecte a alimentação antes de trabalhar nos componentes. Não abra a fonte.</p><h3>Selecione o reparo</h3><div class="options">${c.repairs.map((r,i)=>`<button data-repair="${i}">${r}</button>`).join('')}</div>`;}
else{html=`<h3>01 / Reúna evidências <small>(${p.tests.length}/2)</small></h3><div class="tests">${c.tests.map((t,i)=>`<button data-test="${i}" ${p.tests.includes(i)?'disabled':''}>${p.tests.includes(i)?'✓':'＋'} ${t[0]}</button>`).join('')}</div>${evidenceMarkup(c,p)}<h3>02 / Qual é o diagnóstico?</h3><p class="hint">${p.tests.length<2?'Complete os dois testes para liberar o diagnóstico.':'Use as evidências. Uma tentativa incorreta desconta 15 pontos.'}</p><div class="options">${c.options.map((o,i)=>`<button data-diagnosis="${i}" ${p.tests.length<2?'disabled':''}>${o}</button>`).join('')}</div>`;}
if(p.validated){const q=challenges[current];html+=`<section class="challenge"><span class="eyebrow">DESAFIO DE CONCEITO / ${q.topic}</span><h3>${q.question}</h3>${p.challenge?`<div class="clue"><b>✓ Conceito concluído</b><br>${q.explanation}</div>`:`<p class="hint">Sem desconto na pontuação prática. Leia, responda e discuta em aula.</p><div class="options">${q.options.map((o,i)=>`<button data-challenge="${i}">${o}</button>`).join('')}</div>`}</section>`;}
$('#caseContent').innerHTML=phaseMarkup(p)+(p.diagnosed?evidenceMarkup(c,p):'')+html+glossaryMarkup(c)+'<p id="feedback" class="error" role="status"></p>';}
function interact(){if(near<0||!started||overview||$('#welcome').open||$('#classroom').open||$('#panel').open)return;current=near;keys.clear();renderCase();$('#panel').showModal();}
$('#caseContent').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const p=progress[current],c=cases[current];let error='';if(b.dataset.challenge!==undefined&&p.validated&&!p.challenge){const q=challenges[current];if(+b.dataset.challenge===q.answer)p.challenge=true;else{p.challengeErrors++;error=q.hint+' Tente novamente; sua pontuação prática foi mantida.'}}else if(b.dataset.test!==undefined){const i=+b.dataset.test;if(!p.tests.includes(i))p.tests.push(i)}else if(b.dataset.diagnosis!==undefined){if(+b.dataset.diagnosis===c.answer)p.diagnosed=true;else{p.errors++;error='As evidências não sustentam essa hipótese. Releia os resultados. −15 pontos.'}}else if(b.dataset.repair!==undefined){if(+b.dataset.repair===c.repair)p.repaired=true;else{p.errors++;error='Esse procedimento não resolve o defeito identificado. Escolha novamente. −15 pontos.'}}else if(b.dataset.action==='validate'){p.validated=true;toast('Computador recuperado! Pontos adicionados.')}save();renderCase();$('#feedback').textContent=error;if(error)$('#feedback').scrollIntoView({block:'nearest'});const next=$('#caseContent button:not(:disabled)');if(next)next.focus({preventScroll:true});else $('#close').focus({preventScroll:true});});
document.querySelectorAll('[data-reading-size]').forEach(button=>button.onclick=()=>{const large=!$('#panel').classList.contains('large-text');document.querySelectorAll('dialog').forEach(d=>d.classList.toggle('large-text',large));document.querySelectorAll('[data-reading-size]').forEach(b=>{b.textContent=large?'A− Texto padrão':'A+ Ampliar texto';b.setAttribute('aria-pressed',String(large))})});
$('#close').onclick=()=>$('#panel').close();$('#interact').onclick=interact;$('#start').onclick=()=>{$('#welcome').close();started=true;keys.clear()};$('#help').onclick=()=>{keys.clear();$('#welcome').showModal()};$('#welcome').addEventListener('cancel',()=>{started=true});$('#reset').onclick=()=>{keys.clear();if(confirm('Reiniciar os 20 computadores e zerar a pontuação deste turno?')){progress=fresh();save();if($('#classroom').open)renderClassroom();toast('Novo turno iniciado.')}};
function modalOpen(){return $('#panel').open||$('#welcome').open||$('#classroom').open}
addEventListener('keydown',e=>{if(modalOpen())return;const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','q','r','e'].includes(k)){e.preventDefault();if(k==='e'){if(!e.repeat)interact();return;}keys.add(k)}});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();drag=null});document.addEventListener('visibilitychange',()=>keys.clear());
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('cancel',()=>keys.clear()));
$('#world').addEventListener('pointerdown',e=>{drag=e.clientX;$('#world').setPointerCapture(e.pointerId)});$('#world').addEventListener('pointermove',e=>{if(drag!==null){angle-=(e.clientX-drag)*.006;drag=e.clientX}});$('#world').addEventListener('pointerup',()=>drag=null);$('#world').addEventListener('pointercancel',()=>drag=null);
document.querySelectorAll('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key)};b.onpointerup=b.onpointercancel=()=>keys.delete(b.dataset.key)});
const clock=new THREE.Clock(),target=new THREE.Vector3(),desired=new THREE.Vector3();camera.position.set(0,6,14);
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);let moving=false;if(started&&!modalOpen()&&!overview){if(keys.has('q'))angle+=dt*1.6;if(keys.has('r'))angle-=dt*1.6;let x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),z=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));if(x||z){const l=Math.hypot(x,z);x/=l;z/=l;const dx=(x*Math.cos(angle)+z*Math.sin(angle))*dt*3.4,dz=(-x*Math.sin(angle)+z*Math.cos(angle))*dt*3.4;if(!blocked(player.position.x+dx,player.position.z))player.position.x+=dx;if(!blocked(player.position.x,player.position.z+dz))player.position.z+=dz;player.rotation.y=Math.atan2(-dx,-dz);walk+=dt*10;moving=true;}}
limbs.forEach(({arm,leg,side})=>{arm.rotation.x=moving?Math.sin(walk)*.55*side:0;leg.rotation.x=moving?-Math.sin(walk)*.65*side:0});head.position.y=1.72+(moving?Math.abs(Math.sin(walk))*.025:0);
target.set(player.position.x,1.1,player.position.z);
if(overview){desired.set(28,36,31);target.set(0,0,0)}else{desired.set(player.position.x+Math.sin(angle)*8,6.8,player.position.z+Math.cos(angle)*8);desired.x=THREE.MathUtils.clamp(desired.x,-7.7,7.7);desired.z=THREE.MathUtils.clamp(desired.z,-19.2,27.5)}
camera.position.lerp(desired,1-Math.exp(-6*dt));camera.lookAt(target);
near=nearestStation(player.position.x,player.position.z);
beacons.forEach((b,i)=>{b.marker.quaternion.copy(camera.quaternion);b.ring.scale.setScalar(1+Math.sin(clock.elapsedTime*2+i)*.05)});
$('#prompt').hidden=near<0||!started||modalOpen()||overview;
if(near>=0)$('#prompt span').textContent=`${progress[near].validated?'Revisar':'Inspecionar'} PC ${String(near+1).padStart(2,'0')} · bancada ${stations[near].bench}`;
renderer.render(scene,camera);}
function renderClassroom(){
 const list=goals(progress);$('#classContent').innerHTML=list.map(g=>`<div class="clue"><b>${g.value===g.total?'✓ ':''}${g.name} · ${g.value}/${g.total}</b><p>${g.description}</p><progress value="${g.value}" max="${g.total}" aria-label="${g.name}"></progress></div>`).join('')+`<p>Prática: <b>${scoreOf(progress)} / 3000 pontos</b>. Desafios conceituais não alteram essa pontuação.</p><p class="hint">Converse com um colega: qual evidência descartou cada hipótese? Qual teste confirmou o reparo? Este resumo é local e não é enviado ao professor automaticamente.</p>`;
}
$('#mapButton').onclick=()=>{keys.clear();overview=!overview;$('#mapButton').textContent=overview?'Voltar ao técnico':'Ver laboratório';$('#mapButton').setAttribute('aria-pressed',String(overview))};
$('#classroomButton').onclick=()=>{keys.clear();renderClassroom();$('#classroom').showModal()};
$('#closeClass').onclick=()=>$('#classroom').close();
$('#restartClass').onclick=()=>$('#reset').click();
$('#downloadReport').onclick=()=>{
 const report=['OFICINA 3D — REGISTRO DE PRÁTICA','Data: '+new Date().toLocaleString('pt-BR'),'Pontuação prática: '+scoreOf(progress)+' / 3000',...goals(progress).map(g=>g.name+': '+g.value+'/'+g.total),'',...cases.map((c,i)=>{const p=progress[i];return [(i+1)+'. '+c.title,'Testes: '+p.tests.length+'/2; diagnóstico: '+(p.diagnosed?'confirmado':'pendente')+'; reparo: '+(p.repaired?'aplicado':'pendente')+'; validação: '+(p.validated?'concluída':'pendente'),'Tentativas incorretas na prática: '+p.errors,'Desafio conceitual: '+(p.challenge?'concluído':'pendente')+'; tentativas incorretas: '+p.challengeErrors].join('\n')}),'','Registro local para discussão em aula; não é uma avaliação supervisionada.'].join('\n');
 const url=URL.createObjectURL(new Blob([report],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='oficina-3d-relatorio.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});updateHUD();$('#welcome').showModal();frame();
// Read-only diagnostics for reproducible browser verification.
window.oficina={get state(){return {position:{x:player.position.x,z:player.position.z},camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z},angle,near,overview,stations:stations.map(s=>({...s})),benchCount:benches.length,moving:limbs[0].leg.rotation.x,progress:structuredClone(progress),score:scoreOf(progress)}}};

