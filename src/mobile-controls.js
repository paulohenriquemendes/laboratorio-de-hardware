export function setupMobileControls({keys,isModal,turnCamera,resetCamera,setQuality}){
 const media=matchMedia('(pointer: coarse), (max-width: 760px)'),touch=document.querySelector('#touch'),stats=document.querySelector('.stats');
 const state={x:0,z:0,pointer:null,menuOpen:false,mobile:media.matches};
 const pad=document.createElement('div');pad.className='direction-pad';while(touch.firstChild)pad.append(touch.firstChild);touch.append(pad);
 pad.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-label',({w:'Andar para frente',s:'Andar para trás',a:'Andar para a esquerda',d:'Andar para a direita'})[b.dataset.key]);});
 const stick=document.createElement('div');stick.id='joystick';stick.setAttribute('role','group');stick.setAttribute('aria-label','Controle de movimento: arraste em qualquer direção');stick.innerHTML='<span class="stick-hint" aria-hidden="true">MOVER</span><span class="stick-knob" aria-hidden="true"></span>';touch.prepend(stick);
 const mode=document.createElement('button');mode.id='controlMode';mode.textContent='Usar setas';mode.setAttribute('aria-label','Alternar controle virtual e setas');touch.append(mode);
 let arrows=false;try{arrows=localStorage.getItem('hardware.touchArrows')==='true'}catch{}
 function modeUpdate(){touch.classList.toggle('use-arrows',arrows);mode.textContent=arrows?'Usar controle':'Usar setas';}modeUpdate();
 function reset(){state.x=state.z=0;state.pointer=null;keys.clear();stick.querySelector('.stick-knob').style.transform='translate(0px,0px)';touch.classList.remove('active');}
 mode.onclick=()=>{reset();arrows=!arrows;modeUpdate();try{localStorage.setItem('hardware.touchArrows',String(arrows))}catch{}};
 function move(e){if(state.pointer!==e.pointerId)return;const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dz=e.clientY-r.top-r.height/2,length=Math.hypot(dx,dz),radius=43,factor=Math.min(1,radius/Math.max(length,1));const x=dx*factor,z=dz*factor;state.x=length<9?0:x/radius;state.z=length<9?0:z/radius;stick.querySelector('.stick-knob').style.transform=`translate(${x}px,${z}px)`;}
 stick.onpointerdown=e=>{if(isModal()||state.pointer!==null)return;e.preventDefault();state.pointer=e.pointerId;stick.setPointerCapture(e.pointerId);touch.classList.add('active');move(e);};stick.onpointermove=move;stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=reset;
 const menu=document.createElement('button');menu.id='mobileMenuButton';menu.textContent='Menu ☰';menu.setAttribute('aria-expanded','false');stats.append(menu);
 function closeMenu(){state.menuOpen=false;document.body.classList.remove('mobile-menu-open');stats.classList.remove('mobile-expanded');menu.setAttribute('aria-expanded','false');menu.textContent='Menu ☰';reset();}
 menu.onclick=()=>{const open=!state.menuOpen;reset();state.menuOpen=open;document.body.classList.toggle('mobile-menu-open',open);stats.classList.toggle('mobile-expanded',open);menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'Fechar menu ×':'Menu ☰';};
 stats.addEventListener('click',e=>{if(e.target.closest('button')&&e.target.closest('button')!==menu)closeMenu();},true);
 const graphics=document.createElement('button');graphics.id='graphicsQuality';stats.append(graphics);let light=state.mobile;try{const saved=localStorage.getItem('hardware.lightGraphics');if(saved!==null)light=saved==='true'}catch{}
 function quality(){setQuality(light);graphics.textContent=light?'Gráficos: leves':'Gráficos: completos';graphics.setAttribute('aria-pressed',String(light));}graphics.onclick=()=>{light=!light;quality();try{localStorage.setItem('hardware.lightGraphics',String(light))}catch{}};quality();
 const camera=document.createElement('button');camera.id='resetCamera';camera.textContent='↺ Câmera';camera.setAttribute('aria-label','Centralizar câmera');camera.onclick=()=>{resetCamera();reset()};camera.onpointerup=e=>{if(e.pointerType==='touch'){e.preventDefault();resetCamera();reset();}};document.body.append(camera);
 const hint=document.createElement('p');hint.className='mobile-instructions';hint.textContent='No celular: arraste o controle para caminhar. Arraste o cenário à direita para girar a câmera. Perto de um computador, toque em Abrir PC. Use Menu para ver desafios, turma e seu visual.';document.querySelector('#welcome .join-team').before(hint);
 let look=null,lastX=0;const world=document.querySelector('#world');
 world.onpointerdown=e=>{if(isModal()||look!==null||e.pointerType==='touch'&&e.clientX<innerWidth*.43)return;look=e.pointerId;lastX=e.clientX;world.setPointerCapture(e.pointerId)};
 world.onpointermove=e=>{if(look!==e.pointerId||isModal())return;turnCamera(Math.max(-60,Math.min(60,e.clientX-lastX))*.006);lastX=e.clientX;};world.onpointerup=world.onpointercancel=world.onlostpointercapture=()=>{look=null};
 function sync(){state.mobile=media.matches;document.body.classList.toggle('mobile-game',state.mobile);closeMenu();}media.addEventListener('change',sync);sync();
 new MutationObserver(()=>{const open=!!document.querySelector('dialog[open]');document.body.classList.toggle('game-dialog-open',open);if(open){reset();look=null}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 addEventListener('blur',()=>{reset();look=null});document.addEventListener('visibilitychange',()=>{reset();look=null});addEventListener('resize',()=>{reset();look=null});
 return {get x(){return state.x},get z(){return state.z},get mobile(){return state.mobile},get menuOpen(){return state.menuOpen},reset};
}
