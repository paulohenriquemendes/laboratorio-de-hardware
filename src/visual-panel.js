export function setupVisualPanel({wardrobe,onOpen}){
 const dialog=document.createElement('dialog');dialog.id='visualDialog';dialog.setAttribute('aria-labelledby','visualTitle');
 dialog.innerHTML='<button id="closeVisual" class="close" aria-label="Fechar meu visual">×</button><h1 id="visualTitle">Meu visual</h1><div class="visual-tabs" role="tablist" aria-label="Personalizar personagem"><button id="appearanceTab" role="tab" aria-controls="visualAppearance">Aparência</button><button id="celebrationButton" role="tab" aria-controls="visualCelebrations">Comemorações</button></div><section id="visualAppearance" role="tabpanel" aria-labelledby="appearanceTab"></section><section id="visualCelebrations" role="tabpanel" aria-labelledby="celebrationButton" hidden></section>';
 document.body.append(dialog);const appearance=document.querySelector('.appearance-details');appearance.open=true;appearance.querySelector('summary').hidden=true;appearance.querySelector('#hairStyle').closest('label').hidden=true;dialog.querySelector('#visualAppearance').append(appearance);
 const tabs=[...dialog.querySelectorAll('[role=tab]')];let shop;
 function select(index){tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=i!==index;});if(index===1)shop?.render();}
 tabs.forEach((tab,i)=>{tab.onclick=()=>select(i);tab.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=(i+1)%2;else if(e.key==='ArrowLeft')next=(i+1)%2;else if(e.key==='Home')next=0;else if(e.key==='End')next=1;else return;e.preventDefault();select(next);tabs[next].focus();};});
 dialog.querySelector('#closeVisual').onclick=()=>dialog.close();
 return {celebrationHost:dialog.querySelector('#visualCelebrations'),attach(value){shop=value;},open(){onOpen();dialog.showModal();wardrobe.open();select(0);},close(){dialog.close();}};
}
export function simplifyMenu(){
 const $=s=>document.querySelector(s),dialog=document.createElement('dialog');dialog.id='settingsDialog';dialog.setAttribute('aria-labelledby','settingsTitle');dialog.innerHTML='<button class="close" aria-label="Fechar ajustes">×</button><h1 id="settingsTitle">Ajustes</h1><p>Escolha os gráficos, confira o carregamento ou reveja como jogar.</p><div class="settings-actions"></div>';document.body.append(dialog);dialog.querySelector('.close').onclick=()=>dialog.close();
 for(const id of ['graphicsQuality','offlineHelp','tutorialButton']){const button=$('#'+id);dialog.querySelector('.settings-actions').append(button);if(id!=='graphicsQuality')button.addEventListener('click',()=>dialog.close(),true);}
 const button=document.createElement('button');button.id='settingsButton';button.textContent='Ajustes';$('.stats').append(button);button.onclick=()=>dialog.showModal();
 $('#classroom').append($('#reputationButton'));$('#reputationButton').addEventListener('click',()=>$('#classroom').close(),true);
}
