import * as THREE from 'three';
export const hairColors=['#171717','#613b22','#d4a84b','#a34324','#294b78','#70499b','#808080','#d4d7d9','#3f704b','#a13f69'];
export const hairStyles=['Curto','Cacheado','Comprido','Coque'];
export function defaultAppearance(id){let n=0;for(const c of id)n=(n*31+c.charCodeAt(0))>>>0;return {style:n%4,color:hairColors[Math.floor(n/4)%hairColors.length]}}
export function normalizeAppearance(a){return {style:Number.isInteger(a?.style)&&a.style>=0&&a.style<4?a.style:0,color:hairColors.includes(a?.color)?a.color:hairColors[1]}}
export function createHair(parent){
 const hair=new THREE.Group();hair.name='studentHair';parent.add(hair);
 const material=new THREE.MeshStandardMaterial({color:hairColors[1],roughness:.9});
 const part=(style,geometry,x,y,z)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.userData.hairStyle=style;m.castShadow=true;hair.add(m)};
 part(0,new THREE.BoxGeometry(.43,.14,.42),0,1.96,0);part(0,new THREE.BoxGeometry(.43,.2,.09),0,1.82,.17);
 for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)part(1,new THREE.SphereGeometry(.125,10,8),x*.15,2.01+(x===0&&z===0?.04:0),z*.15);
 part(1,new THREE.BoxGeometry(.43,.13,.1),0,1.86,.17);
 part(2,new THREE.BoxGeometry(.45,.16,.44),0,1.96,0);part(2,new THREE.BoxGeometry(.46,.62,.16),0,1.62,.19);for(const side of [-1,1])part(2,new THREE.BoxGeometry(.1,.4,.25),side*.21,1.75,.06);
 part(3,new THREE.BoxGeometry(.42,.14,.41),0,1.96,0);part(3,new THREE.SphereGeometry(.17,12,10),0,2.11,.16);part(3,new THREE.BoxGeometry(.43,.2,.09),0,1.82,.17);
 parent._hairMaterial=material;applyAppearance(parent,{style:0,color:hairColors[1]});return hair;
}
export function applyAppearance(parent,value){const a=normalizeAppearance(value);const hair=parent.getObjectByName('studentHair');if(!hair)return;parent._hairMaterial??=new THREE.MeshStandardMaterial({roughness:.9});parent._hairMaterial.color.set(a.color);for(const child of hair.children){child.material=parent._hairMaterial;child.visible=child.userData.hairStyle===a.style;}parent.userData.appearance=a;}
