import * as THREE from 'three';
import {applyAppearance,normalizeAppearance} from './avatar.js';
import {styleNames,stylePoints,accessories,unlockedAppearance} from './cosmetics.js';
export function setupWardrobe({player,getSession,getScore,notify}){
 const $=s=>document.querySelector(s);let draft=normalizeAppearance(player.userData.appearance),renderer;
 const host=document.createElement('div');host.id='wardrobeCatalog';document.querySelector('.avatar-fields').before(host);
 const styles=$('#hairStyle');for(let i=4;i<styleNames.length;i++){const o=document.createElement('option');o.value=i;o.textContent=styleNames[i];styles.append(o);}
 function preview(value,detail=false){
  renderer??=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(144,170);renderer.setPixelRatio(1);
  const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x668877,3));const light=new THREE.DirectionalLight(0xffffff,3);light.position.set(-2,4,-4);scene.add(light);
  const model=player.clone(true);model.position.set(0,0,0);model.rotation.set(0,0,0);applyAppearance(model,value);scene.add(model);
  const camera=new THREE.PerspectiveCamera(34,144/170,.1,30);camera.position.set(2.1,1.8,-4);camera.lookAt(0,1.1,0);if(detail){camera.position.set(1.25,1.3,-1.9);camera.lookAt(.12,1.03,0);}renderer.render(scene,camera);const image=renderer.domElement.toDataURL();model._hairMaterial?.dispose();return image;
 }
 function render(){const score=getScore();host.replaceChildren();const intro=document.createElement('p');intro.className='wardrobe-score';intro.textContent=score+' pontos nesta rodada · os pontos não são gastos. Ao reiniciar a rodada, os itens voltam a exigir pontuação.';host.append(intro);
  for(const [title,items] of [['Cabelos',styleNames.map((name,style)=>({name,key:'style',value:style,points:stylePoints[style]}))],['Acessórios sobre o fardamento',accessories.map(a=>({...a,value:true}))]]){
   const h=document.createElement('h3');h.textContent=title;const grid=document.createElement('div');grid.className='wardrobe-grid';host.append(h,grid);
   for(const item of items){const selected=draft[item.key]===item.value,locked=score<item.points;const button=document.createElement('button');button.type='button';button.className='wardrobe-card';button.disabled=locked;button.setAttribute('aria-pressed',String(selected));button.dataset.item=item.key==='style'?'hair-'+item.value:item.key;
    const img=document.createElement('img');img.src=preview({...draft,[item.key]:item.value},item.key==='gloves'||item.key==='tattoo');img.alt=item.name+' no personagem com fardamento';img.width=144;img.height=170;const name=document.createElement('strong');name.textContent=item.name;const requirement=document.createElement('span');requirement.textContent=locked?'Faltam '+(item.points-score)+' pts':selected?'Selecionado':item.points?item.points+' pts · liberado':'Livre';button.append(img,name,requirement);button.onclick=()=>{draft[item.key]=item.key==='style'?item.value:!selected;styles.value=draft.style;render();};grid.append(button);
   }
  }
  for(const o of styles.options)o.disabled=score<(stylePoints[Number(o.value)]||0);
  styles.value=draft.style;$('#hairColor').value=draft.color;
 }
 styles.onchange=()=>{draft.style=Number(styles.value);render()};$('#hairColor').onchange=()=>{draft.color=$('#hairColor').value;render()};
 $('#saveAppearance').onclick=async()=>{const session=getSession();if(!session){notify('Entre na turma para salvar seu personagem.');return;}const b=$('#saveAppearance');b.disabled=true;try{const a=await session.setAppearance(draft);applyAppearance(player,a);draft=normalizeAppearance(a);render();notify('Visual salvo. Sua pontuação foi mantida.')}catch(e){notify(e.message)}finally{b.disabled=false}};
 return {open(){draft=normalizeAppearance(unlockedAppearance(getSession()?.appearance||player.userData.appearance,getScore()));render();}};
}

