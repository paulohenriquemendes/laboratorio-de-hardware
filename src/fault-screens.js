import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {symptomScenes} from './symptom-animation.js';
// One small atlas for all monitors: no extra images, videos or animation loop.
export function createFaultScreens(cases){
 const width=128,height=80,cols=8,rows=Math.ceil((cases.length+1)/cols),canvas=document.createElement('canvas');canvas.width=cols*width;canvas.height=rows*height;
 const ctx=canvas.getContext('2d');
 function line(value,y,maxLines=2){const words=value.split(' ');let current='',row=0;for(const word of words){const next=current?current+' '+word:word;if(ctx.measureText(next).width>112&&current){ctx.fillText(current,8,y+row*9);current=word;if(++row>=maxLines)return;}else current=next;}if(row<maxLines)ctx.fillText(current,8,y+row*9);}
 cases.forEach((c,id)=>{
  const {kind,status}=symptomScenes[id];ctx.save();ctx.translate(id%cols*width,Math.floor(id/cols)*height);ctx.fillStyle='#102a25';ctx.fillRect(0,0,width,height);ctx.fillStyle='#e4a953';ctx.fillRect(0,0,4,height);ctx.font='bold 8px sans-serif';ctx.fillStyle='#d9eee5';line(c.title,11,2);
  ctx.strokeStyle='#efb35f';ctx.fillStyle='#efb35f';ctx.lineWidth=2;
  if(kind==='mouse'){ctx.beginPath();ctx.moveTo(27,40);ctx.lineTo(49,52);ctx.lineTo(37,29);ctx.lineTo(77,42);ctx.lineTo(101,28);ctx.stroke();ctx.fillRect(98,27,5,5);}
  else if(['glitch','dim','monitor','power','post'].includes(kind)){ctx.fillStyle=kind==='dim'?'#254138':'#0a1714';ctx.fillRect(20,26,88,29);if(kind==='glitch')for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#cd8cbe':'#78d4ab';ctx.fillRect(22+(i*17)%76,28+(i*7)%24,13,3);}else if(kind!=='dim'){ctx.fillStyle='#dfab62';ctx.font='bold 12px monospace';ctx.fillText(kind==='power'?'⏻':kind==='monitor'?'—':kind==='post'?'POST…':'',45,46);}}
  else if(['network','conflict','wifi','usb','usbReset'].includes(kind)){ctx.strokeRect(20,30,22,18);ctx.strokeRect(87,30,22,18);ctx.beginPath();ctx.moveTo(42,39);ctx.lineTo(87,39);ctx.moveTo(60,32);ctx.lineTo(70,46);ctx.moveTo(70,32);ctx.lineTo(60,46);ctx.stroke();}
  else if(['heat','fan','fanStop'].includes(kind)){ctx.strokeRect(30,30,68,14);ctx.fillRect(33,33,kind==='heat'?61:20,8);ctx.font='10px monospace';ctx.fillText(kind==='heat'?'↑ °C':kind==='fanStop'?'FAN !':'FAN ~',47,56);}
  else if(kind.startsWith('notebook-')){ctx.strokeRect(23,25,82,32);ctx.beginPath();ctx.moveTo(23,57);ctx.lineTo(14,63);ctx.lineTo(114,63);ctx.lineTo(105,57);ctx.stroke();ctx.font='10px monospace';ctx.fillText(kind==='notebook-touchpad'?'PAD ×':kind==='notebook-heat'?'↑ °C':kind==='notebook-battery'?'BAT ↓':'VÍDEO ~',40,45);}
  else if(id>=40){ctx.font='bold 15px monospace';ctx.fillText(['and','or','xor','not','parity'].includes(kind)?'A · B → ?':kind==='pixel'?'RGB · ?':kind==='text'?'Aa · ?':'01 · ?',25,46);}
  else{ctx.strokeRect(22,28,84,25);ctx.fillRect(27,44,kind==='storage'?72:25,4);ctx.font='bold 12px monospace';ctx.fillText(kind==='keyboard'?'A _ C _':kind==='audio'?'♪ ×':kind==='microphone'?'MIC ×':kind==='clock'?'RTC ?':'!',kind==='keyboard'?34:49,40);}
  ctx.font='7px sans-serif';ctx.fillStyle='#e7eee9';line(status,66);ctx.restore();
 });
 ctx.fillStyle='#3cce75';ctx.fillRect(cases.length%cols*width,Math.floor(cases.length/cols)*height,width,height);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
 function coordinates(id){const col=id%cols,row=Math.floor(id/cols);return [0,1,1,1,0,0,1,0].map((value,index)=>index%2?1-(row+((1-value)*(height-2)+1)/height)/rows:(col+(value*(width-2)+1)/width)/cols);}
 return {material,geometry(id){const geometry=new THREE.PlaneGeometry(.84,.52);geometry.attributes.uv.array.set(coordinates(id));return geometry;},count:cases.length,
  batch(scene,screens){scene.updateMatrixWorld(true);const parts=screens.map(mesh=>mesh.geometry.clone().applyMatrix4(mesh.matrixWorld)),geometry=mergeGeometries(parts),batch=new THREE.Mesh(geometry,material),states=new Map();parts.forEach(part=>part.dispose());screens.forEach((mesh,id)=>{states.set(mesh,{id,done:false});mesh.removeFromParent();});scene.add(batch);
   return {paint(mesh,next){mesh.material=next;const state=states.get(mesh),done=next!==material;if(done===state.done)return;state.done=done;geometry.attributes.uv.array.set(coordinates(done?cases.length:state.id),state.id*8);geometry.attributes.uv.needsUpdate=true;}};
  }
 };
}
