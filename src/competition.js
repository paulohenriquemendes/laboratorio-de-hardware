export const competitionModes={ranking:'Placar completo',individual:'Apenas a própria evolução',hidden:'Placar oculto'};
export function competitionMode(room){return Object.hasOwn(competitionModes,room?.competition_mode)?room.competition_mode:'ranking';}
export function publicScoreSuffix(room,score,format){return competitionMode(room)==='ranking'?' · '+format(score):'';}
export function setupCompetitionSettings({client,getRoom}){
 const mode=document.querySelector('#competitionMode'),status=document.querySelector('#competitionStatus'),button=document.querySelector('#saveCompetition');let room=null,serial=0;
 button.onclick=async()=>{const selectedRoom=getRoom(),selectedMode=mode.value,token=++serial;button.disabled=true;status.textContent='Salvando configuração…';try{const {data,error}=await client.rpc('lab_competition',{p_room:selectedRoom,p_mode:selectedMode});if(error)throw error;if(token!==serial||selectedRoom!==getRoom())return;mode.value=data.mode;status.textContent='Configuração salva para esta turma: '+competitionModes[data.mode]+'. Os alunos recebem a alteração automaticamente.';}catch(e){if(token===serial)status.textContent=e.message;}finally{if(token===serial)button.disabled=false;}};
 return {show(data){serial++;button.disabled=false;room=data.room.id;mode.value=competitionMode(data.room);status.textContent='Turma: '+data.room.title+'. A carteira pessoal e os registros do professor permanecem disponíveis.';},clear(){serial++;room=null;button.disabled=true;status.textContent='';}};
}
