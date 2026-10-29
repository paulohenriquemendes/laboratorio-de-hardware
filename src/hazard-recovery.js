import {PLAYER_DISTANCE} from './player-physics.js';
import {floorHazards,hazardAt} from './floor-hazards.js';
// Search a clear walking segment; recovery must not cross furniture or another student.
export function findHazardEscape(position,hazard,peers,blocked,lastSafe){
 const clear=target=>{
  if(!target||hazardAt(target.x,target.z)||Math.hypot(target.x-hazard.x,target.z-hazard.z)<hazard.radius+.3)return false;
  const steps=Math.ceil(Math.hypot(target.x-position.x,target.z-position.z)/.06);let previous=position;
  for(let i=1;i<=steps;i++){
   const point={x:position.x+(target.x-position.x)*i/steps,z:position.z+(target.z-position.z)*i/steps};
   if(blocked(point.x,point.z)||peers.some(peer=>Math.hypot(point.x-peer.x,point.z-peer.z)<PLAYER_DISTANCE-.03&&Math.hypot(point.x-peer.x,point.z-peer.z)<=Math.hypot(previous.x-peer.x,previous.z-peer.z)))return false;
   previous=point;
  }
  return true;
 };
 const dx=position.x-hazard.x,dz=position.z-hazard.z,angle=Math.hypot(dx,dz)>.001?Math.atan2(dz,dx):Math.atan2((lastSafe?.z??hazard.z+1)-hazard.z,(lastSafe?.x??hazard.x)-hazard.x);
 for(const distance of [1.12,1.35,1.6])for(const offset of [0,.4,-.4,.8,-.8,1.2,-1.2,1.6,-1.6,2,-2,2.5,-2.5,Math.PI]){const target={x:hazard.x+Math.cos(angle+offset)*distance,z:hazard.z+Math.sin(angle+offset)*distance};if(clear(target))return target;}
 return clear(lastSafe)?{...lastSafe}:null;
}
export function setupHazardRecovery({position,getPeers,blocked,onReact,reducedMotion=()=>false}){
 let active=false,time=0,target=null,origin=null,lastSafe={x:position.x,z:position.z},hazard=null;
 function start(value){if(active)return;hazard=value;origin={x:position.x,z:position.z};target=findHazardEscape(position,hazard,getPeers(),blocked,lastSafe);time=0;active=true;onReact();}
 function update(dt){
  if(!active){if(floorHazards.every(h=>Math.hypot(h.x-position.x,h.z-position.z)>h.radius+.35))lastSafe={x:position.x,z:position.z};return;}
  if(!target){target=findHazardEscape(position,hazard,getPeers(),blocked,lastSafe);origin={x:position.x,z:position.z};if(!target)return;}
  time=Math.min(1,time+Math.max(0,Math.min(dt,.05))/(reducedMotion() ? .28 : .48));const ease=1-(1-time)**2;
  const next={x:origin.x+(target.x-origin.x)*ease,z:origin.z+(target.z-origin.z)*ease};
  if(blocked(next.x,next.z)||getPeers().some(p=>Math.hypot(next.x-p.x,next.z-p.z)<PLAYER_DISTANCE-.03&&Math.hypot(next.x-p.x,next.z-p.z)<=Math.hypot(position.x-p.x,position.z-p.z))){target=null;time=0;position.y=0;return;}
  position.x=next.x;position.z=next.z;position.y=reducedMotion()?0:Math.sin(time*Math.PI)*.3;
  if(time===1){position.y=0;active=false;lastSafe={x:position.x,z:position.z};onReact();}
 }
 return {start,update,reset(){active=false;position.y=0;lastSafe={x:position.x,z:position.z};},get active(){return active;},get state(){return {active,height:position.y,target:target?{...target}:null};}};
}
