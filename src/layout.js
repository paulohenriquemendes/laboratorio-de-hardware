import {pcNumber} from './challenge-order.js';
// Physical positions stay fixed; array indices remain immutable challenge IDs.
const makeWing=(offset,idOffset)=>{
 const benches=[-14,-7,0,7,14].map((z,i)=>({id:idOffset/8+i+1,x:offset,z,width:3.8,depth:5.4}));
 const central=[-1,1].flatMap((side,k)=>benches.flatMap((b,i)=>[-1.35,1.35].map((d,j)=>({id:idOffset+k*10+i*2+j+1,bench:b.id,zone:'central',wing:offset?2:1,side,facing:side,x:offset+side*1.15,z:b.z+d,chairX:offset+side*2.8,useX:offset+side*3.9,useZ:b.z+d}))));
 const lateral=[-1,1].flatMap((side,k)=>Array.from({length:10},(_,j)=>({id:idOffset+21+k*10+j,bench:(offset?'Fundamentos · ':'')+(side<0?'Parede A':'Parede B'),zone:'wall',wing:offset?2:1,side,facing:-side,x:offset+side*11.5,z:-15.3+j*3.4,chairX:offset+side*9.7,useX:offset+side*8.6,useZ:-15.3+j*3.4})));
 return {benches,stations:[...central,...lateral]};
};
const first=makeWing(0,0),second=makeWing(28,40);
export const benches=[...first.benches,...second.benches];
const positions=[...first.stations,...second.stations];
export const stations=positions.map((_,caseId)=>({...positions[pcNumber(caseId)-1]}));
export const room={minX:-12.6,maxX:40.6,z:19.2};
export const spawn={x:3.9,z:18.4};
export function blocked(x,z){return x<room.minX||x>room.maxX||Math.abs(z)>room.z||benches.some(b=>Math.abs(x-b.x)<b.width/2+.3&&Math.abs(z-b.z)<b.depth/2+.3)||[0,28].some(offset=>Math.abs(Math.abs(x-offset)-11.5)<1.1&&Math.abs(z)<17.4)||stations.some(s=>Math.abs(x-s.chairX)<.65&&Math.abs(z-s.z)<.65);}
export function nearestStation(x,z){let index=-1,distance=1.1;stations.forEach((s,i)=>{const d=Math.hypot(s.useX-x,s.useZ-z);if(d<distance){distance=d;index=i}});return index;}
