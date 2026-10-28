import {money} from './economy.js';
import * as THREE from 'three';
import {applyAppearance,normalizeAppearance} from './avatar.js';
import {styleNames,stylePoints,accessories,unlockedAppearance,selectCosmetic} from './cosmetics.js';
export function setupWardrobe({player,getSession,getScore,getSolved,notify}){
 const $=s=>document.querySelector(s);let draft=normalizeAppearance(player.userData.appearance),renderer,previewScene,previewModel,previewCamera;const previewCache=new Map();
 const host=document.createElement('div');host.id='wardrobeCatalog';document.querySelector('.avatar-fields').before(host);
 const styles=$('#hairStyle');for(let i=4;i<styleNames.length;i++){const o=document.createElement('option');o.value=i;o.textContent=styleNames[i];styles.append(o);}
 function preview(value,detail=false){
  const normalized=normalizeAppearance(value),key=JSON.stringify([normalized,detail]);
  if(previewCache.has(key))return previewCache.get(key);
  if(!renderer){
   renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(144,170);renderer.setPixelRatio(1);
   previewScene=new THREE.Scene();previewScene.add(new THREE.HemisphereLight(0xffffff,0x668877,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-2,4,-4);previewScene.add(light);
   previewModel=player.clone(true);previewModel.position.set(0,0,0);previewModel.rotation.set(0,0,0);previewModel.traverse(part=>{if(part.userData.avatarLimb)part.rotation.set(0,0,0)});previewScene.add(previewModel);
   previewCamera=new THREE.PerspectiveCamera(34,144/170,.1,30);
  }
  applyAppearance(previewModel,normalized);previewCamera.position.set(2.1,1.8,-4);previewCamera.lookAt(0,1.1,0);
  if(detail==='feet'){previewCamera.position.set(.8,.5,-1.4);previewCamera.lookAt(0,.16,-.05);}else if(detail==='face'){previewCamera.position.set(.65,1.8,-1.4);previewCamera.lookAt(0,1.7,0);}else if(detail){previewCamera.position.set(1.25,1.3,-1.9);previewCamera.lookAt(.12,1.03,0);}
  renderer.render(previewScene,previewCamera);const image=renderer.domElement.toDataURL();if(previewCache.size>=48)previewCache.delete(previewCache.keys().next().value);previewCache.set(key,image);return image;
 }
 function render(){const score=getScore();host.replaceChildren();const intro=document.createElement('p');intro.className='wardrobe-score';intro.textContent=money(score)+' fictícios acumulados · '+getSolved()+' desafios concluídos. Os visuais são liberados pelas conquistas: não descontam o valor acumulado. Sem dinheiro real.';host.append(intro);
  for(const [title,items] of [['Cabelos',styleNames.map((name,style)=>({name,key:'style',value:style,points:stylePoints[style]}))],['Acessórios sobre o fardamento',accessories.map(a=>({...a,value:true}))]]){
   const h=document.createElement('h3');h.textContent=title;const grid=document.createElement('div');grid.className='wardrobe-grid';host.append(h,grid);
   for(const item of items){const selected=draft[item.key]===item.value,locked=score<item.points||getSolved()<(item.solved||0);const button=document.createElement('button');button.type='button';button.className='wardrobe-card';button.disabled=locked;button.setAttribute('aria-pressed',String(selected));button.dataset.item=item.key==='style'?'hair-'+item.value:item.key;
    const next=selectCosmetic(draft,item.key,item.value);const img=document.createElement('img');img.src=preview(next,item.key==='sandals'?'feet':item.key==='beard'?'face':['gloves','tattoo','tattooBolt','tattooStar','nails','bracelets','phone','tablet'].includes(item.key));img.alt=item.name+' no personagem com fardamento';img.width=144;img.height=170;const name=document.createElement('strong');name.textContent=item.name;const requirement=document.createElement('span');requirement.textContent=locked?'Requer '+money(item.points)+(item.solved?' e '+item.solved+' desafios':''):selected?'Selecionado':item.points?money(item.points)+' · liberado':'Livre';button.append(img,name,requirement);button.onclick=()=>{draft={...next,[item.key]:item.key==='style'?item.value:!selected};styles.value=draft.style;render();};grid.append(button);
   }
  }
  for(const o of styles.options)o.disabled=score<(stylePoints[Number(o.value)]||0);
  styles.value=draft.style;$('#hairColor').value=draft.color;
 }
 styles.onchange=()=>{draft.style=Number(styles.value);render()};$('#hairColor').onchange=()=>{draft.color=$('#hairColor').value;render()};
 $('#saveAppearance').onclick=async()=>{const session=getSession();if(!session?.connected){notify('Reconecte à turma para salvar seu visual.');return;}const b=$('#saveAppearance');b.disabled=true;try{const a=await session.setAppearance(draft);applyAppearance(player,a);draft=normalizeAppearance(a);render();notify('Visual salvo. Seu valor acumulado foi mantido.')}catch(e){notify(e.message)}finally{b.disabled=false}};
 return {open(){draft=normalizeAppearance(unlockedAppearance(getSession()?.appearance||player.userData.appearance,getScore(),getSolved()));render();}};
}

