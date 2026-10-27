// Each client owns its player's position. Contact corrections are bounded and never bypass furniture.
export const PLAYER_DISTANCE=0.86;
export function separatePlayer(position,peers,selfId,blocked,dt=.016){
 let moved=false;const maxStep=Math.min(Math.max(dt,0),.05)*2.6;
 let remaining=maxStep;
 for(const peer of [...peers].sort((a,b)=>a.id.localeCompare(b.id))){
  if(remaining<=0)break;
  if(peer.id===selfId||!Number.isFinite(peer.x)||!Number.isFinite(peer.z))continue;
  let dx=position.x-peer.x,dz=position.z-peer.z,d=Math.hypot(dx,dz);
  if(d>=PLAYER_DISTANCE)continue;
  if(d<.0001){dx=selfId.localeCompare(peer.id)<0?-1:1;dz=0;d=1;}
  const overlap=PLAYER_DISTANCE-Math.hypot(position.x-peer.x,position.z-peer.z);
  const step=Math.min(overlap+.002,remaining),nx=dx/d,nz=dz/d;
  for(const [x,z] of [[nx,nz],[-nz,nx],[nz,-nx]]){
   const next={x:position.x+x*step,z:position.z+z*step};
   if(!blocked(next.x,next.z)&&Math.hypot(next.x-peer.x,next.z-peer.z)>Math.hypot(position.x-peer.x,position.z-peer.z)){
    position.x=next.x;position.z=next.z;remaining-=step;moved=true;break;
   }
  }
 }
 return moved;
}
// Reject walking into a visible body; the peer receives a gentle contact push from the approach.
export function movePlayer(position,dx,dz,peers,blocked){
 for(const [x,z] of [[dx,0],[0,dz]]){const nx=position.x+x,nz=position.z+z;
  if(!blocked(nx,nz)&&peers.every(p=>Math.hypot(nx-p.x,nz-p.z)>=PLAYER_DISTANCE-.06||Math.hypot(nx-p.x,nz-p.z)>Math.hypot(position.x-p.x,position.z-p.z))){position.x=nx;position.z=nz;}
 }
}

export function freeSpawn(origin,peers,blocked){
 for(let radius=0;radius<30;radius++)for(let x=-radius;x<=radius;x++)for(const z of [0,...Array.from({length:radius*2+1},(_,i)=>i-radius).filter(n=>n!==0)]){
  if(Math.max(Math.abs(x),Math.abs(z))!==radius)continue;
  const p={x:origin.x+x*1.05,z:origin.z+z*1.05};
  if(!blocked(p.x,p.z)&&peers.every(other=>Math.hypot(p.x-other.x,p.z-other.z)>PLAYER_DISTANCE+.1))return p;
 }
 return {...origin};
}
