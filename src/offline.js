import '../offline.css';
export function setupOffline({getSession,isBusy,hasInvite,practice,onOpen}){
 const info=document.createElement('section');info.id='offlineInfo';info.className='offline-info';
 info.innerHTML='<h2>Leve o laboratório para a escola</h2><p id="offlineStatus" role="status">Preparando os arquivos para uso sem internet…</p><p>Antes da aula, abra este link com internet e espere a confirmação “Pronto para usar sem internet”. Na escola, abra o mesmo link no mesmo navegador e escolha praticar individualmente.</p><p>Na prática offline, os 80 desafios e suas recompensas fictícias ficam neste aparelho. Colegas, placar da turma e envios ao professor precisam de conexão. O progresso individual não é enviado automaticamente: em <b>Desafios</b>, baixe o resumo para entregar ao professor.</p><p>Evite navegação anônima e não limpe os dados do site. O navegador pode remover arquivos se faltar espaço. Teste abrindo o jogo em modo avião antes de sair de casa.</p><button id="prepareOffline" type="button">Verificar arquivos / tentar novamente</button>';
 document.querySelector('#start').before(info);
 const open=document.createElement('button');open.id='offlineHelp';open.textContent='Uso sem internet';document.querySelector('.stats').append(open);open.onclick=()=>{onOpen();document.querySelector('#welcome').showModal();info.scrollIntoView({block:'start'})};
 const banner=document.createElement('div');banner.id='offlineBanner';banner.hidden=true;banner.setAttribute('role','status');banner.innerHTML='<span></span><button type="button">Praticar neste aparelho</button>';banner.querySelector('button').onclick=practice;document.body.append(banner);
 let registration=null,checking=false;
 const status=info.querySelector('#offlineStatus');
 function update(){
  const session=getSession(),interrupted=session&&!session.connected;
  banner.hidden=navigator.onLine&&!interrupted;
  banner.querySelector('span').textContent=session?'Turma sem sincronização. Continue na prática individual salva neste aparelho.':'Sem internet · prática individual salva neste aparelho.';
  banner.querySelector('button').hidden=!session;
  document.querySelector('#joinTeam').disabled=!navigator.onLine||isBusy()||!hasInvite();
  document.querySelector('#start').textContent=navigator.onLine?'Praticar individualmente →':'Praticar offline →';
 }
 async function verify(worker){
  const data=await new Promise((resolve,reject)=>{const channel=new MessageChannel(),timer=setTimeout(()=>reject(new Error('Não foi possível verificar os arquivos.')),5000);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();resolve(e.data)};worker.postMessage({type:'OFFLINE_STATUS'},[channel.port2]);});
  if(!data.ready)throw new Error('Os arquivos ainda não estão completos.');
  status.textContent='✓ Pronto para usar sem internet neste navegador. Se houver uma atualização, recarregue quando estiver conectado.';info.dataset.ready='true';
 }
 function watch(worker){
  if(!worker)return;
  const check=()=>{if(worker.state==='activated')void verify(worker).catch(error=>{status.textContent=error.message+' Conecte à internet e tente novamente.';info.dataset.ready='false';});else if(worker.state==='redundant')status.textContent=info.dataset.ready==='true'?'✓ A versão anterior continua pronta para usar sem internet. A atualização não foi concluída.':'Não foi possível preparar esta atualização. Conecte à internet e tente novamente.';};
  worker.addEventListener('statechange',check);check();
 }
 async function prepare(){
  if(checking)return;checking=true;
  try{
   if(!('serviceWorker' in navigator)||!window.isSecureContext)throw new Error('Este navegador não permite preparar o uso offline neste endereço.');
   if(import.meta.env.DEV)throw new Error('O uso offline está disponível na versão publicada.');
   registration=await navigator.serviceWorker.register(new URL('./sw.js',document.baseURI),{scope:new URL('.',document.baseURI).pathname,updateViaCache:'none'});
   registration.addEventListener('updatefound',()=>watch(registration.installing));
   if(registration.active)await verify(registration.active);
   watch(registration.installing||registration.waiting);
   if(navigator.onLine)await registration.update();
  }catch(error){status.textContent=info.dataset.ready==='true'?'✓ Pronto para usar sem internet. Não foi possível verificar atualizações agora.':error.message+' Se já tiver preparado o jogo, tente abrir o link salvo.';}
  finally{checking=false;}
 }
 info.querySelector('#prepareOffline').onclick=()=>void prepare();
 addEventListener('online',()=>{update();void prepare()});addEventListener('offline',update);
 navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(navigator.serviceWorker.controller)void verify(navigator.serviceWorker.controller).catch(()=>{});});
 update();void prepare();return {update};
}
