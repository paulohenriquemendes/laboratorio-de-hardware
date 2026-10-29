# Missão Hardware — guia do professor

## Acesso administrativo

Abra https://paulohenriquemendes.github.io/missao-hardware/admin/ . A administração abre diretamente, sem chave, conforme solicitado. O jogo não mostra um atalho administrativo. Quem descobrir esse endereço também poderá consultar dados e reiniciar turmas. **Sair da administração** retorna ao jogo; abrir o endereço novamente permite entrar de novo. O endereço antigo `admin.html` redireciona para `/admin/`.

## Turmas e convites

No painel, escreva no campo **Nome da turma** e clique em **Criar turma e gerar link**. O campo fica visível desde a abertura, sem precisar selecionar uma turma. Use **Copiar link da turma** para enviar o convite aos alunos. Para rever uma turma existente, abra **Consultar turmas já criadas** e clique no nome. Quem abre o mesmo convite entra na mesma turma; outra turma tem outro endereço e resultados separados. O endereço sem convite orienta o aluno a pedir o link ao professor e não permite iniciar desafios. Para entrar com colegas é necessário abrir um convite de turma criado na administração. A criação de turmas é verificada no servidor e exige sessão administrativa; não há criação automática por alunos.

No jogo, **Minha turma** mostra colegas, localização e placar. O convite fica recolhido em **Convidar colegas**. A aparência fica em **Personalizar meu personagem**. O laboratório é um único ambiente com 80 computadores e placas “Laboratório de Hardware”. Todos podem resolver todos os desafios, inclusive o mesmo computador simultaneamente. Verde significa que alguém já resolveu, e a ficha lista os autores. Recompensas fictícias e respostas são individuais.

## Identificação e participação

Na entrada, o aluno informa apenas **nome completo** e **nome do personagem (apelido)**. A turma vem automaticamente do convite criado pelo professor, sem campo para o aluno preencher. O **apelido no jogo é opcional**: se preenchido, aparece nos personagens e no placar; caso contrário, aparece somente o primeiro nome. Ao entrar na turma, a identificação já é salva no registro administrativo. Em **Minha participação**, o nome já registrado é apenas exibido, sem pedir nome ou turma novamente. Ele pode clicar em **Enviar minha participação ao professor** para marcar a data do envio. Não é solicitado e-mail nem login Google. Nome completo e turma não são incluídos na presença pública ou no placar. A prática individual foi desabilitada.

Os resultados da turma são salvos no servidor a cada ação. O envio identifica esses resultados, e o aluno pode continuar praticando. No painel, **Participação dos alunos** mostra, por rodada:

- Nome completo, turma e apelido; participantes ainda não identificados também aparecem após iniciarem uma atividade.
- Desafios iniciados (pelo menos uma evidência consultada), desafios concluídos, questões conceituais concluídas e pontos.
- Data de envio da participação.
- **Ver respostas**, com as alternativas marcadas, acertos, erros e horários.
- **Baixar planilha CSV**, para apoiar o registro de participação, e download das respostas de um aluno.

As alternativas específicas passam a ser registradas nesta atualização. Para atividades anteriores, as etapas, conclusões e contagens de erros existentes são preservadas, sem inventar respostas antigas. A identificação é declarada pelo aluno; não é uma verificação de identidade. Use a turma e a supervisão em aula para relacionar o registro à pessoa. A pontuação do jogo é um dado de apoio; a avaliação e a nota final ficam a seu critério.

## Anotações dos alunos

No mesmo bloco, o aluno pode escrever uma sugestão e usar **Enviar ao professor**. O rascunho fica no navegador até o envio. Na administração, **Anotações recebidas** mostra nome, turma, apelido, mensagem, data e rodada. É possível filtrar pela turma selecionada e marcar como lida. As mensagens são lidas no painel administrativo, que está acessível por URL sem chave. Reiniciar a rodada não apaga anotações.

## Nova rodada

Selecione a turma correta, abra **Iniciar nova rodada**, digite **ZERAR** e confirme. Isso zera a rodada atual para todos daquela turma e fecha suas fichas abertas. O convite continua o mesmo. As rodadas anteriores continuam disponíveis pelo seletor **Rodada para consultar**, incluindo participação, respostas registradas, autoria e placar. Alunos não têm controle para reiniciar a turma. A identificação é por rodada; novos alunos informam seus próprios dados.

## Orientação para a aula

Os desafios cobrem manutenção, arquitetura, bits, bytes, unidades e lógica. Cada PC concede dinheiro fictício, sem valor monetário: PCs 01–16 rendem até R$ 20; 17–32, R$ 40; 33–48, R$ 60; 49–64, R$ 80; 65–80, R$ 100. Cada erro prático reduz R$ 5, com recompensa mínima de R$ 20. Questões conceituais não alteram o valor. Máximo por rodada: R$ 4.800 fictícios. O mesmo PC não concede recompensa repetida ao mesmo aluno na mesma rodada. Atividades existentes foram preservadas e seus valores recalculados; a pontuação original do servidor foi arquivada em legacy_points.

Use perfis de navegador distintos para alunos diferentes. A sessão fica no navegador; trocar de dispositivo ou apagar os dados pode criar outra identidade. Todos os alunos entram pelo convite da turma. **Sair da turma** retorna à identificação, sem oferecer prática separada.

A experiência é testada funcionalmente com dois alunos e um administrador. Não é um ensaio de carga de uma turma inteira. Nenhum plano pago foi ativado. Verifique os computadores e a conexão da escola antes da aula.

## Meu visual e contato entre alunos
O botão **Meu visual** abre 28 opções com miniaturas (14 cabelos e 14 acessórios). Os quatro cabelos básicos e as cores continuam livres. Moicano exige R$ 100 fictícios; afro, R$ 240; tranças, R$ 480; topete, R$ 720. Casaco aberto: R$ 600; luvas: R$ 960; tatuagens de circuito, raio e estrela: R$ 2.400, R$ 3.000 e R$ 3.600; barba: R$ 400; unhas coloridas: R$ 200; porte atlético: R$ 1.600. **Chinelo com um dedo avermelhado exige R$ 800 e 20 desafios concluídos.** É uma representação visual fictícia. A camisa branca, gola verde e detalhes laranja permanecem visíveis; agora também há calça azul e saia verde como alternativas. Os valores são requisitos de desbloqueio e não são gastos. O servidor valida dinheiro acumulado e quantidade de conclusões. Ao reiniciar a rodada, os itens acima dos novos requisitos deixam de ser usados.
Novos cabelos: ondulado rock (R$ 1.000), mullet rock (R$ 1.200), topete rockabilly (R$ 1.400), espigado punk (R$ 1.800), franja alternativa (R$ 2.100) e cachos metal (R$ 2.600). Pulseiras: R$ 150; celular: R$ 1.000; tablet: R$ 1.800; calça azul e saia verde: R$ 300 cada. Celular/tablet e calça/saia são escolhas exclusivas, verificadas também no servidor.

Personagens entram em posições livres, colidem e recebem pequenos empurrões ao contato. Paredes e móveis continuam bloqueando o movimento. A sincronização depende da conexão; foram verificados dois navegadores simultâneos, sem teste de carga com uma turma completa.

## Uso pelo celular
Arraste o controle circular para caminhar e a parte direita do cenário para girar a câmera, inclusive com dois dedos simultâneos. Use **Abrir PC** perto de uma bancada e **↺ Câmera** para voltar à visão inicial. **Usar setas** troca o controle circular por botões direcionais. O **Menu** reúne desafios, turma, anotações e visual. As fichas ocupam a tela para facilitar a leitura; o modo de gráficos leves vem ativado no celular e pode ser alterado pelo menu.

## Experimentação nos desafios
Algumas fichas possuem a seção **Experimentar**. Nos dez desafios iniciais sobre bits e representação (IDs internos 40–49), o aluno alterna chaves para comparar binário, decimal e hexadecimal. No desafio de tempo ideal de cópia, modifica tamanho e taxa para observar a duração. Esses controles são uma área livre de apoio: não concedem pontos nem enviam respostas. A avaliação continua nas etapas de evidências, diagnóstico, solução e conceito; o professor recebe os mesmos registros de participação.

## Preparação dos arquivos e conexão

Em **Carregamento**, aguarde **Arquivos preparados neste navegador**. O cache inclui cenário, catálogo e animações, reduzindo downloads em redes lentas. A prática individual foi removida: para entrar na turma, responder desafios e enviar participação, é necessário manter a conexão. Se ela cair, as respostas são pausadas até reconectar; use **Reconectar** em **Minha turma**. Não há troca para uma ficha local separada. Os resultados já confirmados no servidor são preservados.

A preparação depende do navegador e aparelho. Não apague os dados do site; o navegador pode remover arquivos se faltar espaço. Atualizações só substituem a versão anterior depois que todos os arquivos forem preparados.

## Ilustrações dos sintomas

Ao inspecionar qualquer um dos 80 computadores, a ficha mostra uma animação curta do sintoma ou um diagrama animado do enunciado. Use **Pausar / Reproduzir** e **Rever** para observar o comportamento com a turma. As ilustrações reproduzem o relato antes do reparo; valores e classificações apresentados no enunciado podem estar errados e precisam ser investigados. Elas não substituem as evidências nem apresentam o diagnóstico.

As animações não têm áudio, usam desenhos locais e ficam guardadas no cache depois de preparar os arquivos com internet. Param após poucos segundos. Com a preferência de movimento reduzido do aparelho, começam pausadas e podem ser reproduzidas pelo aluno.

## Sinais dos problemas no cenário

As 80 telas mostram sinais discretos do respectivo relato: cursor irregular, falha de conexão, aquecimento, artefatos de vídeo ou o tema do exercício de arquitetura. A ilustração não indica a resposta. Quando alguém resolve, o computador mantém o visual verde e a lista de autores. Ele continua disponível para os colegas resolverem. Ao reiniciar a rodada, os sinais dos desafios voltam.

## Orientação ao errar

Após um diagnóstico ou reparo incorreto, a ficha retoma a alternativa escolhida e um resultado dos testes, com uma pergunta para orientar a nova tentativa. O botão **Rever evidências na ficha** abre o caderno. Nas questões conceituais, a orientação retoma a relação ou unidade em discussão. As regras de recompensa permanecem: erro prático reduz R$ 5 até o mínimo de R$ 20; erro conceitual não desconta.

## Configurar a competição por turma

Na administração, abra a turma e expanda **Competição e placar dos alunos**. Escolha **Placar completo**, **Apenas a própria evolução** ou **Placar oculto**, depois use **Salvar configuração da turma**. A mudança vale para aquela turma e é recebida pelos alunos conectados. Nomes, localizações e autores das conclusões continuam visíveis. A carteira pessoal permanece disponível; o professor continua consultando todos os resultados. As turmas existentes começam com o placar completo, preservando o comportamento anterior.

## Avaliação por período

Em **Participação dos alunos → Avaliação por período**, informe as datas e clique em **Aplicar período**. O dia final é incluído; os horários seguem Fortaleza (UTC−3), independentemente do fuso do navegador. Use **Rodada inteira** para remover o filtro.

A tabela e **Baixar planilha CSV** passam a usar o mesmo período. São contados os computadores com respostas no período, as conclusões realizadas no período, os conceitos acertados, as recompensas obtidas e os horários das atividades. Alunos já identificados sem atividade nesse intervalo aparecem com zero. A planilha inclui erros, quantidade de respostas e custos fictícios de incidentes em colunas separadas. **Ver respostas do período** também limita o histórico às datas escolhidas; quando houver mais de 2000 respostas, o aviso identifica o limite da listagem, enquanto os totais da planilha continuam completos. A planilha apoia a avaliação do professor; não atribui uma nota automaticamente.

## Tutorial guiado

Na primeira entrada de uma sessão de aluno, o tutorial acompanha o movimento, a abertura de uma ficha, as duas evidências, diagnóstico, solução, validação, conceito e envio da participação. O aluno avança realizando as ações; não é necessário resolver um desafio extra fora da turma. Pode usar **Agora não** e reabrir por **Menu → Tutorial guiado**. A conclusão ou dispensa fica neste navegador para aquela sessão de aluno.

## Segurança simulada e carteira fictícia

Há oito áreas amarelas sinalizadas com fios elétricos animados, focos de fogo simulado, ferramentas ou peças no piso, fora da entrada e dos pontos de uso dos computadores. Ao pisar, um aviso vermelho explica o incidente simulado e o custo de uma consulta médica fictícia: **até R$ 5**, limitado ao dinheiro disponível. Não há saldo negativo. Permanecer sobre a área não gera descontos repetidos; existe também um intervalo mínimo de oito segundos entre incidentes aceitos pelo servidor.

Os custos são salvos por aluno, turma e rodada, inclusive após recarregar. A carteira e o placar mostram o saldo após os custos. As recompensas conquistadas em desafios, respostas e conclusões não são apagadas; os desbloqueios por conquistas também são preservados. Na avaliação por período, custos ficam separados das recompensas. Ao iniciar uma nova rodada, a nova carteira começa sem os custos da anterior, cujo histórico permanece guardado. Todo o dinheiro e o atendimento são fictícios; o objetivo é lembrar de manter a circulação do laboratório livre de riscos.

## Nome do jogo e links

O nome da aplicação, logotipo, ícone, administração e relatórios é **Missão Hardware**. As placas do cenário continuam com **Laboratório de Hardware**. O novo endereço é https://paulohenriquemendes.github.io/missao-hardware/ . Os convites já compartilhados pelos endereços anteriores continuam válidos e redirecionam com o mesmo identificador de turma. Não é necessário criar novamente as turmas. Recarregue com internet para receber a marca e preparar o cache do novo caminho.

## Reação aos perigos animados

Ao tocar em qualquer uma das oito áreas de perigo, o aluno dá um salto curto e é afastado automaticamente para uma posição livre. O trajeto é verificado contra móveis, limites e outros personagens. O controle é liberado novamente após a aterrissagem; no celular, o aluno deve tocar novamente no controle para continuar. A reação é imediata e não espera a resposta da rede.

Fios elétricos mostram arcos azuis em movimento, e o fogo usa chamas estilizadas em laranja e amarelo. Com movimento reduzido ativado no aparelho, os efeitos ficam estáticos e o afastamento ocorre sem salto vertical. O custo de novos incidentes caiu para até R$ 5 fictícios; valores históricos já registrados não são alterados. Continua existindo o intervalo de proteção contra descontos repetidos.

## Onde encontrar fogo e fios elétricos

Na primeira parte do laboratório, o risco elétrico fica entre os PCs 18 e 19, no corredor à direita da entrada. O fogo simulado fica entre os PCs 02 e 03, no corredor esquerdo, mais ao fundo. Na segunda parte, os mesmos tipos aparecem entre os PCs 58/59 e 42/43.

As placas **RISCO ELÉTRICO** e **PERIGO: FOGO** ficam acima das áreas para facilitar a identificação. Os raios e as chamas foram ampliados para permanecerem perceptíveis na câmera padrão, inclusive no celular. As áreas amarelas acompanham a dimensão dos efeitos; a entrada e os pontos de uso dos computadores continuam livres.
