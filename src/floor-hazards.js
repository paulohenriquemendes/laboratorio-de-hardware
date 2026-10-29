import * as THREE from 'three';
export const INCIDENT_COST=5;
export const floorHazards=[0,28].flatMap((offset,wing)=>[
 {x:offset+3.9,z:10.5,kind:'electric',name:'fio com faíscas elétricas'},
 {x:offset-3.9,z:-10.5,kind:'fire',name:'foco de fogo simulado'},
 {x:offset+8.6,z:-6.8,kind:'parts',name:'peças pequenas espalhadas'},
 {x:offset-8.6,z:6.8,kind:'tool',name:'chave de fenda fora do lugar'}
].map((h,i)=>({...h,id:wing*4+i,radius:[0,1].includes(i)?.65:.46})));
export function hazardAt(x,z){return floorHazards.find(h=>Math.hypot(h.x-x,h.z-z)<=h.radius)||null;}
export function createFloorHazards(scene,{label}={}){
 const effects=[],markers=[];const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const yellow=new THREE.MeshStandardMaterial({color:'#e8ad32',roughness:.9}),dark=new THREE.MeshStandardMaterial({color:'#243034',roughness:.8}),metal=new THREE.MeshStandardMaterial({color:'#a6b7ba',roughness:.55});
 const largeDisk=new THREE.CylinderGeometry(.8,.8,.015,24),disk=new THREE.CylinderGeometry(.58,.58,.015,20),shaft=new THREE.BoxGeometry(.06,.06,.5),handle=new THREE.BoxGeometry(.13,.1,.22),nut=new THREE.TorusGeometry(.08,.025,5,8);
 for(const hazard of floorHazards){const group=new THREE.Group();group.position.set(hazard.x,.02,hazard.z);scene.add(group);const warning=new THREE.Mesh(['electric','fire'].includes(hazard.kind)?largeDisk:disk,yellow);group.add(warning);
  if(hazard.kind==='electric'){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.66,.06,-.2),new THREE.Vector3(-.15,.1,.12),new THREE.Vector3(.17,.07,-.1),new THREE.Vector3(.66,.06,.2)]);group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,12,.055,6,false),new THREE.MeshStandardMaterial({color:'#bd421f',roughness:.75})));
   const arcMaterial=new THREE.MeshBasicMaterial({color:'#91ecff',transparent:true,opacity:.85,toneMapped:false});
   for(let i=0;i<3;i++){const x=(i-1)*.53,points=[new THREE.Vector3(x,.08,0),new THREE.Vector3(x+.12,.5,-.02),new THREE.Vector3(x-.06,.75,.02),new THREE.Vector3(x+.1,1.35,.03)],path=new THREE.CurvePath();for(let j=1;j<points.length;j++)path.add(new THREE.LineCurve3(points[j-1],points[j]));const arc=new THREE.Mesh(new THREE.TubeGeometry(path,12,.025,5,false),arcMaterial);group.add(arc);effects.push({mesh:arc,kind:'electric',phase:i*1.8+hazard.id});}
  }
  else if(hazard.kind==='fire'){
   const orange=new THREE.MeshBasicMaterial({color:'#ed6f21',transparent:true,opacity:.88,toneMapped:false}),gold=new THREE.MeshBasicMaterial({color:'#ffc459',toneMapped:false});
   for(let i=0;i<3;i++){const flame=new THREE.Mesh(new THREE.ConeGeometry(.25,1.4,7),orange);flame.position.set((i-1)*.4,.72,(i%2)*.12-.06);group.add(flame);effects.push({mesh:flame,kind:'fire',phase:i*1.5+hazard.id});}
   const core=new THREE.Mesh(new THREE.ConeGeometry(.22,.9,7),gold);core.position.y=.47;group.add(core);effects.push({mesh:core,kind:'fire',phase:hazard.id+.8});
  }
  else if(hazard.kind==='parts'){for(let i=0;i<3;i++){const mesh=new THREE.Mesh(nut,metal);mesh.rotation.x=Math.PI/2;mesh.position.set((i-1)*.2,.06,i%2*.2-.1);group.add(mesh);}}
  else{const tool=new THREE.Mesh(shaft,metal);tool.position.y=.08;tool.rotation.y=.6;group.add(tool);const grip=new THREE.Mesh(handle,dark);grip.position.set(-.14,.1,-.2);grip.rotation.y=.6;group.add(grip);}
  if(label&&['electric','fire'].includes(hazard.kind)){const marker=new THREE.Mesh(new THREE.PlaneGeometry(1.9,.42),label(hazard.kind==='fire'?'PERIGO: FOGO':'RISCO ELÉTRICO',512,128,'#ffffff',hazard.kind==='fire'?'#a53c16':'#164c79'));marker.position.set(hazard.x,2.15,hazard.z);marker.userData.hazardId=hazard.id;scene.add(marker);markers.push(marker);}
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(.07,.02,.24),dark);stripe.position.set(0,.025,.35);group.add(stripe);
 }
 let phase=0;return {update(time,camera){if(camera)for(const marker of markers)marker.quaternion.copy(camera.quaternion);phase=reduced.matches?0:time;for(const {mesh,kind,phase:offset} of effects){const wave=reduced.matches?0:Math.sin(time*2.8+offset);if(kind==='fire'){mesh.scale.set(1-wave*.08,1+wave*.18,1+wave*.08);mesh.rotation.z=wave*.08;}else{mesh.scale.y=1+wave*.2;mesh.rotation.y=wave*.2;mesh.material.opacity=reduced.matches?.85:.72+Math.sin(time*2)*.14;}}},get state(){return {labels:markers.length,animatedObjects:effects.length,phase,reduced:reduced.matches};}};
}
export function setupHazardContact(onHit){
 let occupied=null,busy=false,last=-Infinity;
 return {update(x,z,enabled=true){const hazard=enabled?hazardAt(x,z):null,next=hazard?.id??null;if(next===occupied)return;occupied=next;if(!hazard||busy||performance.now()-last<8000)return;last=performance.now();busy=true;Promise.resolve(onHit(hazard)).finally(()=>{busy=false;});},reset(){occupied=null;last=-Infinity;}};
}
