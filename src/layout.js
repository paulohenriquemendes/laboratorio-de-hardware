export const benches = [-14,-7,0,7,14].map((z,i)=>({id:i+1,x:0,z,width:3.8,depth:5.4}));
const central=[-1,1].flatMap((side,sideIndex)=>benches.flatMap(b=>[-1.35,1.35].map((offset,j)=>({id:sideIndex*10+(b.id-1)*2+j+1,bench:b.id,zone:'central',side,facing:side,x:side*1.15,z:b.z+offset,chairX:side*2.8,useX:side*3.9,useZ:b.z+offset}))));
const lateral=[-1,1].flatMap((side,k)=>Array.from({length:10},(_,j)=>({id:21+k*10+j,bench:side<0?'Parede A':'Parede B',zone:'wall',side,facing:-side,x:side*11.5,z:-15.3+j*3.4,chairX:side*9.7,useX:side*8.6,useZ:-15.3+j*3.4})));
export const stations=[...central,...lateral];
export const room={x:12.6,z:19.2};
export const spawn={x:3.9,z:18.4};
export function blocked(x,z){return Math.abs(x)>room.x||Math.abs(z)>room.z||benches.some(b=>Math.abs(x)<b.width/2+.3&&Math.abs(z-b.z)<b.depth/2+.3)||(Math.abs(x)>10.4&&Math.abs(z)<17.4)||stations.some(s=>Math.abs(x-s.chairX)<.65&&Math.abs(z-s.z)<.65);}
export function nearestStation(x,z){let index=-1,distance=1.1;stations.forEach((s,i)=>{const d=Math.hypot(s.useX-x,s.useZ-z);if(d<distance){distance=d;index=i}});return index;}
