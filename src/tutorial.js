const steps=[
 ['Caminhe até um computador','No celular, arraste o controle MOVER. No computador, use W A S D ou as setas. Aproxime-se de um círculo no chão e desvie das áreas amarelas de perigo.','#touch'],
 ['Inspecione o computador','Use Abrir PC no celular ou pressione E no teclado para abrir a ficha.','#interact'],
 ['Consulte as duas evidências','Leia o relato e use os dois botões de teste. Os resultados ficam no Caderno de evidências.','[data-test]:not(:disabled)'],
 ['Escolha o diagnóstico','Compare os dois resultados antes de escolher uma hipótese. Se errar, leia a orientação e tente novamente.','[data-diagnosis]:not(:disabled)'],
 ['Escolha a solução','Agora selecione o procedimento que trata a causa confirmada. A atividade é uma simulação.','[data-repair]'],
 ['Valide o reparo','Use Verificar solução e concluir. A recompensa fictícia e a conclusão serão registradas na turma.','[data-action="validate"]'],
 ['Responda ao conceito','A pergunta final ajuda a entender o motivo do reparo. Ela não desconta dinheiro ao errar.','[data-challenge]'],
 ['Envie sua participação','Abra Minha participação para avisar o professor. Seu nome completo e a turma já estão registrados.','#notesButton'],
 ['Confirme o envio ao professor','Clique em Enviar minha participação ao professor. Você pode continuar resolvendo outros computadores depois.','#submitParticipation']
];
export function setupTutorial({getState,notify}){
 const $=s=>document.querySelector(s),card=document.createElement('section');card.id='guidedTutorial';card.hidden=true;card.setAttribute('aria-label','Tutorial guiado');document.body.append(card);
 const menu=document.createElement('button');menu.id='tutorialButton';menu.textContent='Tutorial guiado';$('.stats').append(menu);
 let active=false,step=0,target=-1,key='',submitted=false,last=0,signature='',highlight=null;
 const clearHighlight=()=>{highlight?.classList.remove('tutorial-highlight');highlight=null;};
 function save(status){try{localStorage.setItem(key,status);}catch{}}
 function stop(status){save(status);active=false;card.hidden=true;clearHighlight();}
 function start(force=false){const state=getState();if(!state.connected){notify('Entre na turma para iniciar o tutorial.');return;}key='hardware.tutorial.v1.'+state.userId;let saved='';try{saved=localStorage.getItem(key)||'';}catch{}if(!force&&['completed','skipped'].includes(saved))return;active=true;step=0;target=-1;submitted=false;signature='';last=0;update(true);}
 function update(force=false){
  if(!active)return;const now=performance.now();if(!force&&now-last<250)return;last=now;
  const state=getState();if(!state.connected||!state.started){card.hidden=true;clearHighlight();return;}
  if(step===0&&state.near>=0)step=1;
  if(step===1&&state.panelOpen){target=state.current;step=2;}
  if(step>=2&&step<=6&&state.panelOpen&&state.current!==target){target=state.current;step=2;}
  const progress=state.progress[target];
  if(step===2&&progress?.tests.length===2)step=3;
  if(step===3&&progress?.diagnosed)step=4;
  if(step===4&&progress?.repaired)step=5;
  if(step===5&&progress?.validated)step=6;
  if(step===6&&progress?.challenge)step=7;
  if(step===7&&state.notesOpen)step=8;
  if(step===8&&submitted){stop('completed');notify('Tutorial concluído! Sua participação foi enviada ao professor.');return;}
  const blocked=state.welcomeOpen||state.otherDialog||(state.notesOpen&&step<7);card.hidden=blocked;if(blocked){clearHighlight();return;}
  const host=state.notesOpen?$('#notesDialog'):state.panelOpen?$('#panel'):document.body;
  card.classList.toggle('tutorial-inline',host!==document.body);
  if(card.parentElement!==host){if(host.id==='panel')host.insertBefore(card,$('#caseContent'));else if(host.id==='notesDialog')host.insertBefore(card,$('#notesForm'));else host.append(card);}
  const outside=step>=2&&step<=6&&!state.panelOpen;
  const nextSignature=step+':'+host.id+':'+outside;
  if(nextSignature!==signature){signature=nextSignature;card.replaceChildren();const label=document.createElement('small'),title=document.createElement('strong'),text=document.createElement('p'),actions=document.createElement('div'),skip=document.createElement('button');label.textContent='PRIMEIROS PASSOS · '+(step+1)+' / '+steps.length;title.textContent=outside?'Reabra a ficha para continuar':steps[step][0];text.textContent=outside?'Volte ao computador que estava investigando e use Inspecionar. Seu progresso continua salvo.':steps[step][1];skip.type='button';skip.textContent='Agora não';skip.onclick=()=>stop('skipped');actions.append(skip);
   if(step===7){const open=document.createElement('button');open.type='button';open.className='primary';open.textContent='Abrir Minha participação';open.onclick=()=>{for(const id of ['panel','classroom','teamDialog'])$('#'+id).close();$('#notesButton').click();};actions.prepend(open);}
   card.append(label,title,text,actions);
  }
  const next=outside?$('#interact'):$(steps[step][2]);if(next!==highlight){clearHighlight();highlight=next;highlight?.classList.add('tutorial-highlight');}
 }
 menu.onclick=()=>start(true);
 addEventListener('hardware:participation-submitted',()=>{if(active){submitted=true;update(true);}});
 return {start,update,get state(){return {active,step,target};}};
}
