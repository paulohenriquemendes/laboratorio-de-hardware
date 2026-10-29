import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {batchComputerBodies} from './src/scene-performance.js';
test('Computer batches preserve world transforms and independent completion colors',()=>{
 const scene=new THREE.Scene(),parent=new THREE.Group();parent.position.set(12,2,5);scene.add(parent);
 const normal=new THREE.MeshStandardMaterial({color:'#243640'}),done=new THREE.MeshStandardMaterial({color:'#3cb769'});
 const a=new THREE.Mesh(new THREE.BoxGeometry(1,2,1),normal),b=new THREE.Mesh(new THREE.BoxGeometry(1,2,1),normal);a.position.x=3;b.position.x=6;parent.add(a,b);
 const bodies=batchComputerBodies(scene,[a,b]),batch=scene.children.find(c=>c.isInstancedMesh),matrix=new THREE.Matrix4(),color=new THREE.Color();
 assert.equal(bodies.instances,2);assert.equal(bodies.batches,1);batch.getMatrixAt(0,matrix);assert.deepEqual(new THREE.Vector3().setFromMatrixPosition(matrix).toArray(),[15,2,5]);
 bodies.paint(a,done);batch.getColorAt(0,color);assert.equal(color.getHexString(),'3cb769');batch.getColorAt(1,color);assert.equal(color.getHexString(),'243640');assert.equal(a.material,done);
 const version=batch.instanceColor.version;bodies.paint(a,done);assert.equal(batch.instanceColor.version,version);bodies.paint(a,normal);batch.getColorAt(0,color);assert.equal(color.getHexString(),'243640');assert.equal(normal.color.getHexString(),'243640');
});
