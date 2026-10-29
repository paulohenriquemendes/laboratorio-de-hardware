import {notebookScenes} from './notebook-cases.js';
import {beginnerScenes} from './beginner-cases.js';
import {hardwareSvg} from './hardware-art.js';
// Stable case IDs, not the displayed PC numbers. Illustrate observations without revealing repairs.
export const symptomScenes = [
 ['power','Botão pressionado','Sem luz • sem giro','O botão é pressionado, mas o gabinete não apresenta atividade.'],
 ['post','Ventoinha girando','Tela sem imagem • DRAM aceso','A ventoinha gira enquanto a tela permanece escura e o indicador DRAM fica aceso.'],
 ['heat','Tarefa prolongada','Desligamento','Durante uma tarefa, a atividade aumenta e o computador desliga.'],
 ['disk','Abrindo arquivo…','Espera • falha','A abertura de um arquivo demora e termina em falha.'],
 ['clock','Após retirar da tomada','Data volta ao padrão','O relógio muda para uma data padrão depois da interrupção da alimentação.'],
 ['network','PC → rede por cabo','Sem conexão','O computador tenta enviar dados pela rede, mas a conexão não se estabelece.'],
 ['glitch','Aplicativo em execução','Imagem com pontos','A tela apresenta pontos coloridos e interrupções na imagem.'],
 ['boot','Ligando o computador','Tentativa de boot pela rede','A sequência de partida chega à tentativa de inicialização pela rede.'],
 ['disk','Sistema iniciado','Disco de dados não aparece','O sistema abre, mas a segunda unidade não aparece na lista.'],
 ['keyboard','Digitando: A B C D','Na tela: A _ C _','Algumas teclas são pressionadas sem que seus caracteres apareçam na tela.'],
 ['usb','USB frontal','Dispositivo não reconhecido','Um dispositivo é conectado à porta frontal sem aparecer na tela.'],
 ['network','Link ativo','Configuração de rede inválida','Há sinal de link, mas o computador não consegue usar a rede.'],
 ['network','Acesso pelo endereço IP','Nome não encontrado','Uma tentativa por IP funciona; a tentativa pelo nome falha.'],
 ['conflict','PC A: mesmo IP de B','PC B: mesmo IP de A','Dois computadores tentam usar o mesmo endereço e a comunicação fica intermitente.'],
 ['storage','Atualização em andamento','Pouco espaço','A barra de armazenamento está quase cheia e a atualização não termina.'],
 ['audio','Áudio em reprodução','Caixas sem som','O aplicativo reproduz áudio, mas as caixas não mostram atividade.'],
 ['slow','Aplicativo gráfico','Imagem lenta • resolução baixa','A janela gráfica avança aos poucos, com uma imagem de baixa resolução.'],
 ['post','Após adicionar memória','POST não termina','A partida para antes de chegar ao sistema após a expansão de memória.'],
 ['fan','Sistema funcionando','Gabinete vibra','A ventoinha gira e o gabinete apresenta vibração repetitiva.'],
 ['startup','Entrando no sistema','Muitos aplicativos abrindo','Várias janelas aparecem durante o início e a máquina demora a ficar disponível.'],
 ['power','Botão frontal pressionado','Computador não inicia','O botão frontal é pressionado sem iniciar a sequência de partida.'],
 ['monitor','Computador ligado','Monitor: sem sinal','O gabinete apresenta atividade, mas o monitor permanece sem sinal.'],
 ['dim','Sistema funcionando','Imagem muito fraca','Uma imagem permanece na tela, porém com luminosidade muito baixa.'],
 ['glitch','Tela do firmware','Linhas e blocos','Blocos e linhas surgem antes da entrada no sistema operacional.'],
 ['fanStop','Ligando o computador','Aviso: CPU FAN','A ventoinha da CPU não gira e um aviso aparece durante a partida.'],
 ['post','Após a limpeza','Acende, mas não inicia','O gabinete acende, mas a sequência de partida não chega ao sistema.'],
 ['slots','Teste em dois slots','Partida diferente em cada slot','A partida funciona em um slot e falha ao usar o outro.'],
 ['restart','Após ajuste de memória','Erros • reinício','A atividade é interrompida por erros e a sequência de partida recomeça.'],
 ['memory','Abrindo aplicativos','Máquina lenta','Mais janelas são abertas e a resposta dos aplicativos fica lenta.'],
 ['boot','SSD aparece no firmware','Gerenciador de boot ausente','A unidade aparece na lista, mas a opção do gerenciador de inicialização está ausente.'],
 ['usb','Unidade USB conectada','Não aparece no explorador','A unidade é conectada, mas o explorador não apresenta o volume.'],
 ['usbReset','Vários acessórios no hub','Conecta → desconecta','Novos acessórios são conectados e o hub perde a conexão repetidamente.'],
 ['mouse','Mouse sobre superfície brilhante','Ponteiro salta','O mouse se move de forma contínua sobre a mesa, mas o ponteiro salta entre posições.'],
 ['network','Comunicação local funciona','Outra rede não responde','A comunicação entre computadores locais funciona, mas a tentativa para outra rede falha.'],
 ['wifi','Procurando redes Wi-Fi','Lista de redes vazia','O computador procura redes sem fio, mas a lista permanece vazia.'],
 ['network','Testes de rede respondem','Navegador não abre sites','Os testes de conectividade respondem, mas a navegação apresenta falha.'],
 ['microphone','Teste do sistema: atividade','Aplicativo: sem entrada','O medidor do sistema registra o microfone, mas o aplicativo não recebe sinal.'],
 ['post','Placa acende','POST não inicia','A placa apresenta luz, mas a partida não avança para o POST.'],
 ['heat','Após trocar o dissipador','Temperatura sobe rápido','Mesmo com a ventoinha girando, o indicador de temperatura sobe rapidamente.'],
 ['printer','Enviando trabalhos','Fila parada','Os trabalhos entram na fila, mas nenhuma folha é impressa.'],
 ['bits','Um bit','Painel afirma: dez estados','O painel do exercício associa um único bit a dez estados.'],
 ['bits','Um byte','Cadastro afirma: quatro bits','O cadastro agrupa apenas quatro posições como se fossem um byte.'],
 ['bits','1010₂','Visor mostra: 16₁₀','O visor recebe 1010 em binário e mostra a conversão descrita no relato.'],
 ['bits','13₁₀','Exercício mostra: 1011₂','O exercício exibe a conversão de treze para a sequência indicada no relato.'],
 ['bits','Bit mais à esquerda','Peso anotado: 64','O destaque percorre oito posições e para no bit da esquerda com o peso anotado.'],
 ['bits','Quatro bits','Formulário afirma: 4 combinações','Quatro posições são destacadas e o formulário apresenta a contagem do relato.'],
 ['overflow','Registro de 8 bits sem sinal','Tentativa: 256','Um valor é colocado em um registro de oito posições, e o painel acusa que não cabe.'],
 ['overflow','255 + 1','Resultado em apenas 8 bits','A operação chega ao limite do espaço reservado para o resultado.'],
 ['hex','A₁₆','Manual mostra: 11₁₀','O manual exibe a equivalência numérica descrita no relato.'],
 ['hex','FF₁₆','Relatório mostra: 256₁₀','O relatório exibe a interpretação de FF descrita no relato.'],
 ['units','Etiqueta: 1 kB','Inventário: 1024 bytes','Uma etiqueta é copiada para o inventário com a conversão descrita no relato.'],
 ['units','Exercício: 2 KiB','Anotação: 2000 bytes','O exercício liga a capacidade em KiB à anotação indicada no relato.'],
 ['units','Tabela: 1 MiB','Anotação: 1000000 bytes','A tabela apresenta a conversão de MiB descrita no relato.'],
 ['transfer','Anúncio: 80 Mb/s','Registro: 80 MB/s','Uma taxa é copiada para o plano da aula com a mudança de letra descrita no relato.'],
 ['units','Inventário: 1 GiB','Anotação: 1000000000 bytes','O inventário apresenta a conversão de GiB descrita no relato.'],
 ['transfer','100 MB a 20 MB/s','Roteiro prevê: 10 segundos','Um arquivo avança em direção ao destino; o roteiro mostra a previsão de tempo a conferir.'],
 ['pixel','Pixel RGB: 24 bits','Anotação: 24 bytes','As três cores de um pixel aparecem junto ao tamanho anotado no exercício.'],
 ['pixel','Imagem: 10 × 10 pixels','Orçamento: 100 bytes','Uma grade de pixels é preenchida enquanto aparece o tamanho estimado no relato.'],
 ['text','Caractere: é • UTF-8','Hipótese: sempre 1 byte','Um caractere acentuado é colocado ao lado da hipótese de tamanho a conferir.'],
 ['text','HARDWARE','Ficha informa: 64 bytes','As letras da palavra são destacadas ao lado da estimativa registrada na ficha.'],
 ['volatile','Dado guardado só na RAM','Desligamento total','Um dado aparece na RAM e desaparece quando a alimentação é desligada.'],
 ['ssd','Arquivo no SSD','Descrição: precisa de energia','Um arquivo e a alimentação são destacados para examinar a afirmação do relato.'],
 ['cpu','Instrução do programa','Diagrama atribui execução à RAM','Uma instrução percorre o desenho até o componente indicado pelo diagrama do exercício.'],
 ['clockRate','Clock: 3 GHz','Quadro: 3 milhões de ciclos/s','Pulsos de relógio ilustram o sinal; a anotação do quadro é apresentada para análise.'],
 ['cores','CPU: 4 núcleos • 8 threads','Relatório: 8 núcleos físicos','Quatro blocos de núcleo e oito tarefas aparecem ao lado da interpretação do relatório.'],
 ['cache','Cache no desenho','Disco externo lento e grande','O cartaz representa o cache como uma unidade externa, como descrito no relato.'],
 ['bus','Barramento: 8 bits','Descrição: 8 bytes por envio','Oito linhas carregam sinais enquanto aparece a descrição de capacidade a conferir.'],
 ['address','Endereço com 10 bits','Exercício: só 10 posições','Um endereço muda e destaca posições no desenho de memória junto à contagem do relato.'],
 ['bits','Palavra de 32 bits','Roteiro: 32 bytes','Grupos de posições são destacados ao lado da interpretação descrita no roteiro.'],
 ['cycle','Roteiro do ciclo básico','Executar → buscar → decodificar','O fluxo segue a ordem descrita no cartaz, que deve ser analisada pelo aluno.'],
 ['and','Condição: A e B iguais a 1','Controle usa OR','As duas entradas mudam; o bloco mostra a operação que foi usada no controle.'],
 ['or','Condição: ao menos um 1','Indicador usa AND','As entradas mudam e o bloco mostra a operação descrita no relato.'],
 ['xor','Condição: entradas diferentes','Também liga com ambas em 1','O par 1 e 1 é destacado e o detector acende, reproduzindo o comportamento relatado.'],
 ['not','NOT de 00001111','Largura fixa: oito bits','Oito posições são destacadas para acompanhar a inversão solicitada pelo exercício.'],
 ['parity','Dados: 1011','Paridade par anotada: 0','Os bits de dados e o bit adicional são destacados para conferir a paridade.'],
 ['mirror','Arquivo em discos espelhados','Excluir → esperando cópia antiga','O arquivo é excluído e desaparece das duas unidades do espelho.'],
 ['compress','Texto precisa voltar igual','Método escolhido: com perdas','Um texto passa pela compactação e retorna com caracteres faltando.'],
 ['output','Monitor sem toque','Inventário: entrada','Uma imagem chega à tela junto à classificação anotada no inventário.'],
 ['driver','Definição no cartaz','Driver = peça que alimenta CPU','O cartaz liga a palavra driver à definição física descrita no relato.'],
 ['firmware','Roteiro de inicialização','Sistema → firmware','O fluxo segue a sequência anotada no roteiro, para o aluno conferir.']
].map(([kind,label,status,description],id)=>Object.freeze({id,kind,label,status,description}));

symptomScenes.push(...beginnerScenes.map(Object.freeze),...notebookScenes.map(Object.freeze));

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(x,y,value,cls='')=>`<text x="${x}" y="${y}" class="${cls}">${esc(value)}</text>`;
const box=(x,y,w,h,cls='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" class="${cls}"/>`;
const monitor=(content='',cls='')=>`<g class="${cls}">${box(88,15,284,132,'sa-monitor')}${box(99,26,262,108,'sa-screen')}${content}<path d="M215 147v12h-30m30 0h60" class="sa-wire"/></g>`;
const fan=(x=410,y=72,cls='')=>`<g transform="translate(${x} ${y})"><circle r="24" class="sa-device"/><g class="sa-fan ${cls}"><path d="M0 0C-30-30 22-32 0 0C30-30 32 22 0 0C30 30-22 32 0 0C-30 30-32-22 0 0"/></g><circle r="4" class="sa-dot"/></g>`;
const file=(x,y,cls='')=>`<g class="${cls}">${box(x,y,44,48,'sa-file')}<path d="M${x+9} ${y+16}h26m-26 9h26m-26 9h18" class="sa-wire"/></g>`;
function diagram(scene){if(scene.kind.startsWith('notebook-')){const base=`${box(100,16,270,133,'sa-monitor')}${box(111,27,248,109,'sa-screen')}<path d="M100 149 65 179H407L370 149Z" class="sa-device"/><path d="M199 169h80" class="sa-wire"/>`;const kind=scene.kind.slice(9);return base+(kind==='touchpad'?'<path d="M219 58v39l12-12 10 18 9-5-10-18h18Z" class="sa-device"/><path d="m211 159 17 15m0-15-17 15" class="sa-break"/>':kind==='heat'?'<path d="M140 173q-12-12 0-24m98 24q-12-12 0-24m88 24q-12-12 0-24" class="sa-wire sa-temperature"/>'+text(237,88,'↓ desempenho','sa-center'):kind==='battery'?box(165,59,130,44,'sa-device')+box(171,65,18,32,'sa-bit sa-disappear')+text(237,124,'Autonomia curta','sa-center'):'<rect x="111" y="27" width="248" height="109" class="sa-screen sa-disappear"/>'+text(237,90,'Imagem intermitente','sa-center'));}
if(scene.kind==='recognition')return '<g transform="translate(60 0)">'+hardwareSvg(scene.picture).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')+'</g>';
 const k=scene.kind;
 if(k==='mouse')return monitor('<path d="M140 60l0 23 7-7 7 13 6-4-7-12 10-1z" class="sa-cursor"/>')+`<rect x="390" y="30" width="62" height="120" rx="16" class="sa-shiny"/><g class="sa-mouse"><rect x="404" y="55" width="32" height="49" rx="16" class="sa-device"/><path d="M420 55v18" class="sa-wire"/></g>`;
 if(k==='keyboard')return monitor(text(230,86,'A _ C _','sa-center sa-reveal'))+`<g transform="translate(100 164)">${box(0,0,260,32,'sa-device')}${['A','B','C','D'].map((v,i)=>`<g class="sa-key" style="--i:${i}">${box(i*62+8,4,52,23)}${text(i*62+34,21,v,'sa-center')}</g>`).join('')}</g>`;
 if(['network','conflict','wifi'].includes(k))return `${box(40,55,128,80,'sa-device')}${text(104,103,k==='conflict'?'PC A':'PC','sa-center')}<path d="M168 95h140" class="sa-link"/><circle cx="238" cy="95" r="9" class="sa-packet"/>${box(308,55,128,80,'sa-device')}${text(372,103,k==='conflict'?'PC B':k==='wifi'?'Wi-Fi':'REDE','sa-center')}<path d="M226 82l24 26m0-26-24 26" class="sa-break sa-reveal"/>`;
 if(['usb','usbReset'].includes(k))return monitor(text(230,87,'Dispositivos: —','sa-center'))+`<g class="sa-connect">${box(403,54,37,62,'sa-device')}<path d="M410 54V40h23v14m-12 62v40H372" class="sa-wire"/></g><circle cx="422" cy="84" r="5" class="sa-dot sa-reveal"/>`;
 if(['fan','fanStop','heat'].includes(k))return monitor(`<g class="sa-${k==='heat'?'shutdown':'reveal'}">${text(230,76,k==='heat'?'Tarefa em execução':k==='fanStop'?'CPU FAN':'Sistema ativo','sa-center')}</g>${k==='heat'?'<rect x="130" y="99" width="200" height="12" rx="6" class="sa-track"/><rect x="130" y="99" width="200" height="12" rx="6" class="sa-temperature"/>':''}`)+`<g class="${k==='fan'?'sa-vibrate':''}">${fan(416,80,k==='fanStop'?'sa-still':'')}</g>`;
 if(['audio','microphone'].includes(k))return monitor(`<g>${Array.from({length:9},(_,i)=>`<rect x="${145+i*19}" y="64" width="9" height="40" rx="3" class="sa-meter" style="--i:${i}"/>`).join('')}</g>`)+`${box(400,50,47,90,'sa-device')}${text(423,100,k==='audio'?'♪':'MIC','sa-center')}<path d="M372 95h23" class="sa-link"/><path d="M390 80l12 25m0-25-12 25" class="sa-break"/>`;
 if(k==='printer')return `${monitor(text(230,70,'Fila: 01 → 02 → 03','sa-center')+text(230,103,'Aguardando…','sa-center'))}<g>${box(397,70,66,60,'sa-device')}${box(410,37,40,51,'sa-file')}<path d="M409 110h40" class="sa-wire"/></g>`;
 if(['glitch','dim','slow','monitor','power','post','restart','boot','startup','storage','disk','clock','slots','memory'].includes(k)){
  let content='';
  if(k==='glitch')content=`<g class="sa-artifacts">${Array.from({length:10},(_,i)=>`<rect x="${113+(i*37)%230}" y="${35+(i*19)%85}" width="${12+i*3}" height="7" class="sa-artifact"/>`).join('')}</g>`;
  else if(k==='dim')content=`<g opacity=".13">${box(125,45,205,65,'sa-file')}${text(230,85,'Área de trabalho','sa-center')}</g>`;
  else if(k==='power'||k==='monitor'||k==='post')content=text(230,87,k==='monitor'?'SEM SINAL':k==='post'?'POST…':'—','sa-center');
  else if(k==='clock')content=`<g class="sa-before">${text(230,85,'Data configurada','sa-center')}</g><g class="sa-after">${text(230,85,'Data padrão • aviso','sa-center')}</g>`;
  else if(k==='slots')content=`${box(126,48,208,20,'sa-device')}${box(126,88,208,20,'sa-device')}<circle cx="319" cy="58" r="5" class="sa-dot"/><circle cx="319" cy="98" r="5" class="sa-break sa-reveal"/>`;
  else if(k==='startup'||k==='memory')content=Array.from({length:4},(_,i)=>`<g class="sa-window" style="--i:${i}">${box(118+i*28,38+i*16,125,43,'sa-file')}${text(180+i*28,65+i*16,'Aplicativo '+(i+1),'sa-center')}</g>`).join('');
  else if(k==='storage')content=text(230,65,'Espaço utilizado','sa-center')+'<rect x="120" y="86" width="220" height="18" rx="5" class="sa-track"/><rect x="120" y="86" width="212" height="18" rx="5" class="sa-temperature"/>';
  else if(k==='restart')content=`<g class="sa-before">${text(230,85,'Aplicativo → erro','sa-center')}</g><g class="sa-after">${text(230,85,'Iniciando novamente…','sa-center')}</g>`;
  else if(k==='boot')content=text(230,69,'Firmware → tentativa de boot','sa-center')+text(230,104,'Sistema não iniciou','sa-center sa-reveal');
  else content=text(230,65,k==='disk'?'Abrindo unidade / arquivo…':'Aplicativo gráfico','sa-center')+'<rect x="130" y="91" width="200" height="12" rx="6" class="sa-track"/><rect x="130" y="91" width="200" height="12" rx="6" class="sa-progress"/>';
  return monitor(content)+(k==='post'?fan()+text(415,129,scene.id===1?'DRAM':'Atividade','sa-center sa-small'):k==='power'?'<circle cx="420" cy="82" r="22" class="sa-device sa-press"/><path d="M420 67v16m-9-11a15 15 0 1 0 18 0" class="sa-wire"/>':'');
 }
 // Conceptual cases use diagrams of the statement, not a demonstration of the correct answer.
 if(['and','or','xor','not','parity'].includes(k)){
  const input=k==='not'?'00001111':k==='parity'?'1011 | 0':'A: 1   B: 1';
  const gate=k==='and'?'OR':k==='or'?'AND':k==='xor'?'Detector':k==='not'?'NOT':'Paridade';
  return `${text(100,100,input,'sa-center')}<path d="M170 95h35m100 0h70" class="sa-link"/>${box(205,56,100,78,'sa-device')}${text(255,101,gate,'sa-center')}<circle cx="404" cy="95" r="24" class="sa-lamp ${k==='xor'?'sa-reveal':''}"/>`;
 }
 if(k==='hex')return `${box(35,48,170,95,'sa-device')}${text(120,103,scene.id===48?'A':'FF','sa-center')}<path d="M215 95h50" class="sa-link"/>${box(275,48,170,95,'sa-device')}${text(360,103,scene.id===48?'11':'256','sa-center')}`;
 if(['bits','overflow','address','bus'].includes(k)){
  const n=scene.id===40?1:[41,42,43,45].includes(scene.id)?4:scene.id===68?32:k==='address'?10:8,columns=Math.min(n,16),width=Math.min(44,420/columns),start=(480-columns*width)/2;
  const values=scene.id===42?'1010':scene.id===43?'1011':scene.id===47?'11111111':null;
  return `${Array.from({length:n},(_,i)=>{const x=start+(i%columns)*width,y=46+Math.floor(i/columns)*48;return `<g class="sa-bit" style="--i:${i%8}">${box(x,y,width-5,38,'sa-device')}${text(x+(width-5)/2,y+25,values?.[i]||String(i%2),'sa-center')}${k==='bus'?`<path d="M${x+17} 88v45" class="sa-link"/>`:''}</g>`;}).join('')}${text(240,165,k==='overflow'?'Espaço reservado • limite excedido':k==='address'?'Posições endereçadas':'Posições do exercício','sa-center')}`;
 }
 if(['units','transfer','text','pixel'].includes(k)){
  const visual=k==='pixel'?Array.from({length:30},(_,i)=>`<rect x="${55+(i%10)*14}" y="${57+Math.floor(i/10)*18}" width="12" height="16" fill="${['#e7a369','#56bba0','#78aede'][i%3]}" class="sa-bit" style="--i:${i%8}"/>`).join(''):text(125,103,k==='text'?(scene.label.includes('HARDWARE')?'HARDWARE':'é'):'DADOS','sa-center');
  return `${box(25,40,200,104,'sa-device')}${visual}<path d="M232 94h43" class="sa-link"/><circle cx="248" cy="94" r="7" class="sa-packet"/>${box(285,40,170,104,'sa-device')}${text(370,88,'Anotação','sa-center')}${text(370,115,'a conferir','sa-center')}`;
 }
 if(k==='cores')return `${Array.from({length:4},(_,i)=>`${box(45+i*102,42,82,61,'sa-device sa-node')}${text(86+i*102,79,'C'+(i+1),'sa-center')}`).join('')}${Array.from({length:8},(_,i)=>`<circle cx="${58+i*52}" cy="138" r="11" class="sa-dot sa-bit" style="--i:${i}"/>`).join('')}${text(240,182,'4 núcleos • 8 threads','sa-center')}`;
 if(k==='clockRate')return `${box(25,42,430,104,'sa-device')}<path d="M45 118h30V68h40v50h40V68h40v50h40V68h40v50h40V68h40v50h40V68h40" class="sa-wire sa-link"/>${text(240,182,'Pulsos ilustrativos • sem escala de tempo','sa-center')}`;
 if(k==='compress')return `${box(30,50,170,95,'sa-device')}${text(115,105,'TEXTO','sa-center')}<path d="M210 95h60" class="sa-link"/>${box(280,50,170,95,'sa-device')}${text(365,105,'T_X_O','sa-center sa-reveal')}`;
 if(k==='ssd')return `${box(40,40,150,110,'sa-device')}${file(93,68)}${text(115,177,'Arquivo no SSD','sa-center')}${box(290,40,150,110,'sa-device')}<path d="M370 60l-22 35h24l-12 35 30-46h-26z" class="sa-dot sa-reveal"/>${text(365,177,'Precisa de energia?','sa-center')}`;
 if(['cycle','firmware','driver','cpu','cache','cores','clockRate','output'].includes(k)){
  const names=k==='cycle'?['Executar','Buscar','Decodificar']:k==='firmware'?['Sistema','Firmware','…']:k==='cpu'?['Instrução','RAM','Execução?']:k==='driver'?['Driver','Alimentação','CPU']:k==='cache'?['CPU','Cabo','Cache externo?']:k==='cores'?['Núcleos: 4','Threads: 8','Relatório?']:k==='output'?['Imagem','→','Monitor']:['Clock','Pulsos','3 GHz'];
  return names.map((v,i)=>`${box(18+i*156,50,135,85,'sa-device sa-node')}${text(85+i*156,100,v,'sa-center')}${i<2?`<path d="M${155+i*156} 93h16" class="sa-link"/>`:''}`).join('');
 }
 const lost=['volatile','mirror','compress'].includes(k);
 return `${box(40,40,150,110,'sa-device')}${box(290,40,150,110,'sa-device')}${text(115,177,k==='volatile'?'RAM':k==='mirror'?'Disco A':k==='ssd'?'SSD':'Original','sa-center')}${text(365,177,k==='volatile'?'Após desligar':k==='mirror'?'Disco B':k==='ssd'?'Alimentação':'Restaurado','sa-center')}${file(93,68,lost?'sa-disappear':'')}${file(343,68,lost?'sa-disappear':'')}<path d="M198 95h83" class="sa-link"/>`;
}

export function symptomMarkup(caseId){
 const scene=symptomScenes[caseId];
 if(!scene)throw new RangeError('Desafio sem ilustração: '+caseId);
 return `<figure class="symptom-animation sa-playing" data-scene="${caseId}"><div class="sa-heading"><strong>Veja o sintoma</strong><div><button type="button" data-motion="pause" aria-pressed="false">Pausar</button><button type="button" data-motion="replay">Rever</button></div></div><div class="sa-label">${esc(scene.label)}</div><svg viewBox="0 0 480 210" role="img" aria-label="${esc(scene.description)}">${diagram(scene)}</svg><div class="sa-status">${esc(scene.status)}</div><figcaption>${esc(scene.description)} <span>Ilustração do relato antes do reparo. Investigue as evidências para descobrir a causa.</span></figcaption></figure>`;
}

export function showSymptomAnimation(caseId){
 let host=document.querySelector('#symptomAnimation');
 if(!host){host=document.createElement('section');host.id='symptomAnimation';document.querySelector('#symptom').after(host);}
 if(host.dataset.caseId===String(caseId))return;
 host.dataset.caseId=String(caseId);host.innerHTML=symptomMarkup(caseId);
 const figure=host.firstElementChild,pause=figure.querySelector('[data-motion="pause"]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function setPaused(value){figure.classList.toggle('sa-paused',value);pause.setAttribute('aria-pressed',String(value));pause.textContent=value?'Reproduzir':'Pausar';}
 setPaused(reduced.matches);
 figure.addEventListener('click',e=>{const action=e.target.closest('[data-motion]')?.dataset.motion;if(action==='pause')setPaused(!figure.classList.contains('sa-paused'));if(action==='replay'){figure.classList.remove('sa-playing');void figure.offsetWidth;figure.classList.add('sa-playing');setPaused(false);}});
}
