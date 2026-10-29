let context=null,current=null;
export function stopBeeps(){current?.abort();current=null;}
export async function playBeeps(pattern,onState=()=>{}){
 stopBeeps();const controller=new AbortController();current=controller;
 const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)throw new Error('Áudio indisponível neste navegador. Use a transcrição do padrão.');
 context??=new Audio();await context.resume();if(controller.signal.aborted)return;
 const nodes=[],start=context.currentTime+.06;let cursor=start;
 for(const duration of pattern){const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=660;gain.gain.setValueAtTime(0,cursor);gain.gain.linearRampToValueAtTime(.055,cursor+.015);gain.gain.setValueAtTime(.055,cursor+duration-.025);gain.gain.linearRampToValueAtTime(0,cursor+duration);oscillator.connect(gain);gain.connect(context.destination);oscillator.start(cursor);oscillator.stop(cursor+duration+.02);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};nodes.push(oscillator);cursor+=duration+.18;}
 onState(true);const end=setTimeout(()=>{if(current===controller){current=null;onState(false);}},(cursor-context.currentTime)*1000);
 controller.signal.addEventListener('abort',()=>{clearTimeout(end);for(const oscillator of nodes)try{oscillator.stop();}catch{/* Already ended. */}onState(false);},{once:true});
}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',()=>{if(document.hidden)stopBeeps();});
