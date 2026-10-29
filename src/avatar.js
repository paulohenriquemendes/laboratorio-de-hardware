import {accessories,styleNames} from './cosmetics.js';
import * as THREE from 'three';
export const hairColors=['#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b','#808080','#d4d7d9','#3f704b','#a13f69'];
export const hairStyles=styleNames;
export function defaultAppearance(id){let n=0;for(const c of id)n=(n*31+c.charCodeAt(0))>>>0;return {style:n%4,color:hairColors[Math.floor(n/4)%hairColors.length]}}
export function normalizeAppearance(a){return {style:Number.isInteger(a?.style)&&a.style>=0&&a.style<styleNames.length?a.style:0,color:hairColors.includes(a?.color)?a.color:hairColors[1],...Object.fromEntries(accessories.map(item=>[item.key,a?.[item.key]===true]))}}
export function createHair(parent){
 const hair=new THREE.Group();hair.name='studentHair';parent.add(hair);
 const material=new THREE.MeshStandardMaterial({color:hairColors[1],roughness:.9});
 const part=(style,geometry,x,y,z)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.userData.hairStyle=style;m.castShadow=true;hair.add(m)};
 part(0,new THREE.BoxGeometry(.43,.14,.42),0,1.96,0);part(0,new THREE.BoxGeometry(.43,.2,.09),0,1.82,.17);
 for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)part(1,new THREE.SphereGeometry(.125,10,8),x*.15,2.01+(x===0&&z===0?.04:0),z*.15);
 part(1,new THREE.BoxGeometry(.43,.13,.1),0,1.86,.17);
 part(2,new THREE.BoxGeometry(.45,.16,.44),0,1.96,0);part(2,new THREE.BoxGeometry(.46,.62,.16),0,1.62,.19);for(const side of [-1,1])part(2,new THREE.BoxGeometry(.1,.4,.25),side*.21,1.75,.06);
 part(3,new THREE.BoxGeometry(.42,.14,.41),0,1.96,0);part(3,new THREE.SphereGeometry(.17,12,10),0,2.11,.16);part(3,new THREE.BoxGeometry(.43,.2,.09),0,1.82,.17);
 part(4,new THREE.BoxGeometry(.13,.34,.45),0,2.04,0);
 for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)part(5,new THREE.SphereGeometry(.19,10,8),x*.17,2.08,z*.17);
 part(6,new THREE.BoxGeometry(.43,.13,.42),0,1.96,0);for(const side of [-1,1])part(6,new THREE.CylinderGeometry(.07,.055,.65,10),side*.24,1.68,.18);
 const quiff=new THREE.BoxGeometry(.43,.26,.3);part(7,quiff,0,2.02,-.07);part(7,new THREE.BoxGeometry(.43,.15,.2),0,1.93,.13);
 // Generic rock styles: broad silhouettes remain legible on small screens.
 part(9,new THREE.BoxGeometry(.42,.19,.43),0,2.0,0);for(let i=-1;i<=1;i++)part(9,new THREE.BoxGeometry(.13,.62,.16),i*.13,1.66,.23);
 part(10,new THREE.BoxGeometry(.43,.17,.4),0,1.96,0);part(10,new THREE.BoxGeometry(.42,.2,.25),0,2.08,-.08);part(10,new THREE.BoxGeometry(.36,.15,.2),0,2.18,-.14);
 part(11,new THREE.BoxGeometry(.42,.1,.4),0,1.96,0);for(let i=0;i<5;i++)part(11,new THREE.ConeGeometry(.08,.32,5),(i-2)*.09,2.15,(i%2?-.09:.08));
 part(12,new THREE.BoxGeometry(.43,.16,.44),0,1.98,0);for(let i=0;i<4;i++)part(12,new THREE.BoxGeometry(.12,.18+i*.04,.07),-.16+i*.09,1.89-i*.025,-.22);part(12,new THREE.BoxGeometry(.1,.45,.3),.23,1.75,.07);
 part(13,new THREE.BoxGeometry(.46,.16,.44),0,1.99,.01);part(13,new THREE.BoxGeometry(.49,1.0,.16),0,1.47,.23);for(const side of [-1,1]){part(13,new THREE.BoxGeometry(.12,.92,.29),side*.25,1.5,.08);part(13,new THREE.BoxGeometry(.09,.78,.07),side*.20,1.52,-.22);}

 parent._hairMaterial=material;applyAppearance(parent,{style:0,color:hairColors[1]});return hair;
}
export function applyAppearance(parent,value){const a=normalizeAppearance(value);const hair=parent.getObjectByName('studentHair');if(!hair)return;parent._hairMaterial??=new THREE.MeshStandardMaterial({roughness:.9});parent._hairMaterial.color.set(a.color);for(const child of hair.children){child.material=parent._hairMaterial;child.visible=child.userData.hairStyle===a.style;}parent.traverse(child=>{if(child.userData.cosmetic)child.visible=!!a[child.userData.cosmetic];if(child.userData.cosmetic==='bracelets')child.scale.set(a.strong?1.2:1,1,a.strong?1.2:1);if(child.userData.uniformPants)child.visible=!a.greenSkirt&&!a.bluePants;if(child.userData.uniformShoe)child.visible=!a.sandals;if(['tattoo','tattooBolt','tattooStar','nails','bracelets'].includes(child.userData.cosmetic)){child.userData.baseZ??=child.position.z;child.position.z=child.userData.baseZ+(a.strong?Math.sign(child.userData.baseZ)*.035:0)}});parent.userData.appearance=a;}

export function createAccessories(parent,arms,legs=[]){
 const add=(root,key,w,h,d,x,y,z,color)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.8}));mesh.position.set(x,y,z);mesh.userData.cosmetic=key;mesh.visible=false;root.add(mesh);return mesh;};
 add(parent,'beard',.34,.15,.035,0,1.58,-.211,'#613b22');
 const skirt=new THREE.Mesh(new THREE.CylinderGeometry(.31,.48,.55,10),new THREE.MeshStandardMaterial({color:'#008241',roughness:.8}));skirt.position.set(0,.57,0);skirt.userData.cosmetic='greenSkirt';skirt.visible=false;parent.add(skirt);
 // Open jacket keeps the white shirt, green collar and orange uniform trim visible.
 add(parent,'jacket',.62,.61,.08,0,1.13,.2,'#075b38');
 for(const side of [-1,1]){add(parent,'jacket',.14,.61,.08,side*.25,1.13,-.2,'#075b38');add(parent,'jacket',.025,.6,.09,side*.17,1.13,-.205,'#ed8b23');}
 for(const arm of arms){
 add(arm,'bracelets',.205,.045,.215,0,-.5,0,'#1e262b');add(arm,'bracelets',.21,.025,.22,0,-.54,0,'#ed8b23');
 if(arm===arms[0]){add(arm,'phone',.18,.32,.045,0,-.61,-.14,'#17252b');add(arm,'phone',.145,.25,.01,0,-.6,-.167,'#71d1bc');add(arm,'tablet',.36,.46,.045,0,-.6,-.15,'#17252b');add(arm,'tablet',.31,.38,.01,0,-.59,-.177,'#71d1bc');}
 add(arm,'strong',.25,.27,.26,0,-.14,0,'#ffffff');add(arm,'strong',.23,.23,.24,0,-.48,0,'#c48c68');
 for(const x of [-.055,0,.055])for(const z of [-.095,.095])add(arm,'nails',.035,.05,.012,x,-.59,z,'#c02d78');
 for(const z of [-.101,.101]){for(const [x,y,rotation] of [[0,-.4,-.55],[.025,-.46,-.55]]){const bolt=add(arm,'tattooBolt',.028,.09,.008,x,y,z,'#152a31');bolt.rotation.z=rotation;}for(const rotation of [0,Math.PI/4]){const star=add(arm,'tattooStar',.09,.025,.008,0,-.43,z,'#152a31');star.rotation.z=rotation;}}
 add(arm,'gloves',.2,.17,.21,0,-.59,0,'#253e48');add(arm,'gloves',.205,.035,.215,0,-.51,0,'#ed8b23');
 // Circuit motif on both sides of the forearm; no change to the uniform.
 for(const z of [-.096,.096]){add(arm,'tattoo',.025,.12,.008,-.035,-.43,z,'#153c35');add(arm,'tattoo',.09,.018,.008,0,-.4,z,'#153c35');add(arm,'tattoo',.025,.07,.008,.035,-.43,z,'#153c35');}}
 for(const leg of legs){add(leg,'bluePants',.235,.62,.275,0,-.3,0,'#245c97');add(leg,'greenSkirt',.17,.44,.2,0,-.4,0,'#c48c68');add(leg,'sandals',.26,.045,.42,0,-.75,-.05,'#102e3b');add(leg,'sandals',.22,.09,.35,0,-.69,-.065,'#c48c68');for(const side of [-1,1]){const strap=add(leg,'sandals',.025,.035,.2,side*.04,-.63,-.08,'#217a5b');strap.rotation.y=side*.45;}if(leg===legs[0])add(leg,'sandals',.07,.07,.055,-.065,-.675,-.24,'#cd4d4b');}
}
