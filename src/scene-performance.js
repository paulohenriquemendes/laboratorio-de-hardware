import * as THREE from 'three';
// Fixed furniture shares geometry and materials; mutable computer surfaces use instance colors below.
export function batchStaticBoxes(scene,excluded=new Set()){
 scene.updateMatrixWorld(true);const groups=new Map();
 scene.traverse(mesh=>{
  if(!mesh.isMesh||mesh.geometry.type!=='BoxGeometry'||mesh.material.map||excluded.has(mesh))return;
  const key=mesh.geometry.uuid+':'+mesh.material.uuid;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
 });
 let instances=0,batches=0;
 for(const meshes of groups.values()){
  if(meshes.length<3)continue;
  const first=meshes[0],batch=new THREE.InstancedMesh(first.geometry,first.material,meshes.length);
  batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
  meshes.forEach((mesh,i)=>{batch.setMatrixAt(i,mesh.matrixWorld);mesh.removeFromParent();});
  batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();scene.add(batch);instances+=meshes.length;batches++;
 }
 return {instances,batches};
}

// Keep logical meshes for gameplay while drawing their fixed transforms in shared batches.
export function batchComputerBodies(scene,meshes){
 scene.updateMatrixWorld(true);const groups=new Map(),entries=new Map();
 for(const mesh of meshes){const key=mesh.geometry.type+JSON.stringify(mesh.geometry.parameters)+(mesh.geometry.type==='TorusGeometry'?':'+Math.floor(mesh.matrixWorld.elements[12]/12)+':'+Math.floor(mesh.matrixWorld.elements[14]/12):'');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);}
 for(const group of groups.values()){
  const first=group[0],material=first.material.clone();material.color.set(0xffffff);
  const batch=new THREE.InstancedMesh(first.geometry,material,group.length);batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;
  group.forEach((mesh,index)=>{batch.setMatrixAt(index,mesh.matrixWorld);batch.setColorAt(index,mesh.material.color);entries.set(mesh,{batch,index,color:mesh.material.color.getHex()});mesh.removeFromParent();});
  batch.computeBoundingSphere();scene.add(batch);
 }
 return {instances:meshes.length,batches:groups.size,paint(mesh,material){mesh.material=material;const entry=entries.get(mesh),color=material.color.getHex();if(entry.color===color)return;entry.color=color;entry.batch.setColorAt(entry.index,material.color);entry.batch.instanceColor.needsUpdate=true;}};
}
