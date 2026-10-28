import * as THREE from 'three';
import {symptomScenes} from './symptom-animation.js';
// One small atlas for all 80 monitors: no extra images, videos or animation loop.
export function createFaultScreens(cases){
 const width=128,height=80,cols=8,rows=Math.ceil(cases.length/cols),canvas=document.createElement('canvas');canvas.width=cols*width;canvas.height=rows*height;
 const ctx=canvas.getContext('2d');
 function line(value,y,maxLines=2){const words=value.split(' ');let current='',row=0;for(const word of words){const next=current?current+' '+word:word;if(ctx.measureText(next).width>112&&current){ctx.fillText(current,8,y+row*9);current=word;if(++row>=maxLines)return;}else current=next;}if(row<maxLines)ctx.fillText(current,8,y+row*9);}
 cases.forEach((c,id)=>{
  const {kind,status}=symptomScenes[id];ctx.save();ctx.translate(id%cols*width,Math.floor(id/cols)*height);ctx.fillStyle='#102a25';ctx.fillRect(0,0,width,height);ctx.fillStyle='#e4a953';ctx.fillRect(0,0,4,height);ctx.font='bold 8px sans-serif';ctx.fillStyle='#d9eee5';line(c.title,11,2);
  ctx.strokeStyle='#efb35f';ctx.fillStyle='#efb35f';ctx.lineWidth=2;
  if(kind==='mouse'){ctx.beginPath();ctx.moveTo(27,40);ctx.lineTo(49,52);ctx.lineTo(37,29);ctx.lineTo(77,42);ctx.lineTo(101,28);ctx.stroke();ctx.fillRect(98,27,5,5);}
  else if(['glitch','dim','monitor','power','post'].includes(kind)){ctx.fillStyle=kind==='dim'?'#254138':'#0a1714';ctx.fillRect(20,26,88,29);if(kind==='glitch')for(let i=0;i<10;i++){ctx.fillStyle=i%2?'#cd8cbe':'#78d4ab';ctx.fillRect(22+(i*17)%76,28+(i*7)%24,13,3);}else if(kind!=='dim'){ctx.fillStyle='#dfab62';ctx.font='bold 12px monospace';ctx.fillText(kind==='power'?'⏻':kind==='monitor'?'—':kind==='post'?'POST…':'',45,46);}}
  else if(['network','conflict','wifi','usb','usbReset'].includes(kind)){ctx.strokeRect(20,30,22,18);ctx.strokeRect(87,30,22,18);ctx.beginPath();ctx.moveTo(42,39);ctx.lineTo(87,39);ctx.moveTo(60,32);ctx.lineTo(70,46);ctx.moveTo(70,32);ctx.lineTo(60,46);ctx.stroke();}
  else if(['heat','fan','fanStop'].includes(kind)){ctx.strokeRect(30,30,68,14);ctx.fillRect(33,33,kind==='heat'?61:20,8);ctx.font='10px monospace';ctx.fillText(kind==='heat'?'↑ °C':kind==='fanStop'?'FAN !':'FAN ~',47,56);}
  else if(id>=40){ctx.font='bold 15px monospace';ctx.fillText(['and','or','xor','not','parity'].includes(kind)?'A · B → ?':kind==='pixel'?'RGB · ?':kind==='text'?'Aa · ?':'01 · ?',25,46);}
  else{ctx.strokeRect(22,28,84,25);ctx.fillRect(27,44,kind==='storage'?72:25,4);ctx.font='bold 12px monospace';ctx.fillText(kind==='keyboard'?'A _ C _':kind==='audio'?'♪ ×':kind==='microphone'?'MIC ×':kind==='clock'?'RTC ?':'!',kind==='keyboard'?34:49,40);}
  ctx.font='7px sans-serif';ctx.fillStyle='#e7eee9';line(status,66);ctx.restore();
 });
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 const material=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
 return {material,geometry(id){const geometry=new THREE.PlaneGeometry(.84,.52),uv=geometry.attributes.uv,col=id%cols,row=Math.floor(id/cols);for(let i=0;i<uv.count;i++)uv.setXY(i,(col+(uv.getX(i)*126+1)/128)/cols,1-(row+((1-uv.getY(i))*78+1)/80)/rows);return geometry;},count:cases.length};
}
