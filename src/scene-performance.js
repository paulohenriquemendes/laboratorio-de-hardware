import * as THREE from 'three';
// Only batch fixed furniture. Interactive computers keep independent materials and state.
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
