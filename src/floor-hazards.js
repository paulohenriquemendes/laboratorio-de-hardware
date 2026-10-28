import * as THREE from 'three';
export const INCIDENT_COST=10;
export const floorHazards=[0,28].flatMap((offset,wing)=>[
 {x:offset+3.9,z:10,kind:'cable',name:'cabo atravessando a passagem'},
 {x:offset-3.9,z:-10,kind:'tool',name:'ferramenta esquecida no chão'},
 {x:offset+8.6,z:-6.8,kind:'parts',name:'peças pequenas espalhadas'},
 {x:offset-8.6,z:6.8,kind:'tool',name:'chave de fenda fora do lugar'}
].map((h,i)=>({...h,id:wing*4+i,radius:.46})));
export function hazardAt(x,z){return floorHazards.find(h=>Math.hypot(h.x-x,h.z-z)<=h.radius)||null;}
export function createFloorHazards(scene){
 const yellow=new THREE.MeshStandardMaterial({color:'#e8ad32',roughness:.9}),dark=new THREE.MeshStandardMaterial({color:'#243034',roughness:.8}),metal=new THREE.MeshStandardMaterial({color:'#a6b7ba',roughness:.55});
 const disk=new THREE.CylinderGeometry(.58,.58,.015,20),shaft=new THREE.BoxGeometry(.06,.06,.5),handle=new THREE.BoxGeometry(.13,.1,.22),nut=new THREE.TorusGeometry(.08,.025,5,8);
 for(const hazard of floorHazards){const group=new THREE.Group();group.position.set(hazard.x,.02,hazard.z);scene.add(group);const warning=new THREE.Mesh(disk,yellow);group.add(warning);
  if(hazard.kind==='cable'){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.42,.06,-.2),new THREE.Vector3(-.15,.1,.12),new THREE.Vector3(.17,.07,-.1),new THREE.Vector3(.42,.06,.2)]);group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,.035,5,false),dark));}
  else if(hazard.kind==='parts'){for(let i=0;i<3;i++){const mesh=new THREE.Mesh(nut,metal);mesh.rotation.x=Math.PI/2;mesh.position.set((i-1)*.2,.06,i%2*.2-.1);group.add(mesh);}}
  else{const tool=new THREE.Mesh(shaft,metal);tool.position.y=.08;tool.rotation.y=.6;group.add(tool);const grip=new THREE.Mesh(handle,dark);grip.position.set(-.14,.1,-.2);grip.rotation.y=.6;group.add(grip);}
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(.07,.02,.24),dark);stripe.position.set(0,.025,.35);group.add(stripe);
 }
}
export function setupHazardContact(onHit){
 let occupied=null,busy=false,last=-Infinity;
 return {update(x,z,enabled=true){const hazard=enabled?hazardAt(x,z):null,next=hazard?.id??null;if(next===occupied)return;occupied=next;if(!hazard||busy||performance.now()-last<8000)return;last=performance.now();busy=true;Promise.resolve(onHit(hazard)).finally(()=>{busy=false;});},reset(){occupied=null;last=-Infinity;}};
}
