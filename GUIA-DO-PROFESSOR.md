# Laboratório de Hardware — guia do professor

## Acesso administrativo

Abra https://paulohenriquemendes.github.io/laboratorio-de-hardware/admin/ . A administração abre diretamente, sem chave, conforme solicitado. O jogo não mostra um atalho administrativo. Quem descobrir esse endereço também poderá consultar dados e reiniciar turmas. **Sair da administração** retorna ao jogo; abrir o endereço novamente permite entrar de novo. O endereço antigo `admin.html` redireciona para `/admin/`.

## Turmas e convites

Selecione a turma no painel ou use **Criar uma nova turma**. Copie o convite e envie aos alunos. Quem abre o mesmo convite entra na mesma turma; outra turma tem outro endereço e resultados separados. O endereço do jogo sem convite oferece a prática individual. Para entrar com colegas é necessário abrir um convite de turma criado na administração. A criação de turmas é verificada no servidor e exige sessão administrativa; não há criação automática por alunos.

No jogo, **Minha turma** mostra colegas, localização e placar. O convite fica recolhido em **Convidar colegas**. A aparência fica em **Personalizar meu personagem**. O laboratório é um único ambiente com 80 computadores e placas “Laboratório de Hardware”. Todos podem resolver todos os desafios, inclusive o mesmo computador simultaneamente. Verde significa que alguém já resolveu, e a ficha lista os autores. Recompensas fictícias e respostas são individuais.

## Identificação e participação

Na entrada, o aluno informa **nome completo e turma**, usados para registrar a atividade. O **apelido no jogo é opcional**: se preenchido, aparece nos personagens e no placar; caso contrário, aparece somente o primeiro nome. Ao entrar na turma, a identificação já é salva no registro administrativo. Em **Participação e anotações**, ele pode conferir os dados e clicar em **Enviar minha participação ao professor** para marcar a data do envio. Não é solicitado e-mail nem login Google. Nome completo e turma não são incluídos na presença pública ou no placar. Na prática individual, a identificação fica no aparelho e acompanha o resumo baixado.

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

Use perfis de navegador distintos para alunos diferentes. A sessão fica no navegador; trocar de dispositivo ou apagar os dados pode criar outra identidade. O modo de prática individual continua local e não gera registros na turma: para acompanhamento pelo professor, os alunos devem entrar pelo convite da turma.

A experiência é testada funcionalmente com dois alunos e um administrador. Não é um ensaio de carga de uma turma inteira. Nenhum plano pago foi ativado. Verifique os computadores e a conexão da escola antes da aula.

## Meu visual e contato entre alunos
O botão **Meu visual** abre 17 opções com miniaturas. Os quatro cabelos básicos e as cores continuam livres. Moicano exige R$ 100 fictícios; afro, R$ 240; tranças, R$ 480; topete, R$ 720. Casaco aberto: R$ 600; luvas: R$ 960; tatuagens de circuito, raio e estrela: R$ 2.400, R$ 3.000 e R$ 3.600; barba: R$ 400; unhas coloridas: R$ 200; porte atlético: R$ 1.600. **Chinelo com um dedo avermelhado exige R$ 800 e 20 desafios concluídos.** É uma representação visual fictícia. O uniforme é preservado, com a troca do calçado nesta opção. Os valores são requisitos de desbloqueio e não são gastos. O servidor valida dinheiro acumulado e quantidade de conclusões; no modo individual, os visuais também podem ser salvos localmente. Ao reiniciar a rodada, os itens acima dos novos requisitos deixam de ser usados.
Personagens entram em posições livres, colidem e recebem pequenos empurrões ao contato. Paredes e móveis continuam bloqueando o movimento. A sincronização depende da conexão; foram verificados dois navegadores simultâneos, sem teste de carga com uma turma completa.

## Uso pelo celular
Arraste o controle circular para caminhar e a parte direita do cenário para girar a câmera, inclusive com dois dedos simultâneos. Use **Abrir PC** perto de uma bancada e **↺ Câmera** para voltar à visão inicial. **Usar setas** troca o controle circular por botões direcionais. O **Menu** reúne desafios, turma, anotações e visual. As fichas ocupam a tela para facilitar a leitura; o modo de gráficos leves vem ativado no celular e pode ser alterado pelo menu.

## Experimentação nos desafios
Algumas fichas possuem a seção **Experimentar**. Nos dez desafios iniciais sobre bits e representação (IDs internos 40–49), o aluno alterna chaves para comparar binário, decimal e hexadecimal. No desafio de tempo ideal de cópia, modifica tamanho e taxa para observar a duração. Esses controles são uma área livre de apoio: não concedem pontos nem enviam respostas. A avaliação continua nas etapas de evidências, diagnóstico, solução e conceito; o professor recebe os mesmos registros de participação.

## Preparar o jogo para uma aula sem internet
1. Em casa ou em uma rede com internet, abra o link habitual do jogo no navegador que será usado na escola. Também funciona com o convite da turma.
2. Aguarde a mensagem **Pronto para usar sem internet neste navegador**, na seção **Leve o laboratório para a escola**. O primeiro acesso precisa baixar todos os arquivos; apenas ver a página não garante que terminou. A opção **Uso sem internet** no menu abre essa seção novamente.
3. Salve o link nos favoritos. Teste em modo avião: feche e abra o jogo pelo link e escolha **Praticar offline**. Não é necessário baixar um HTML ou instalar firmware.
4. Na escola, os 80 desafios, controles de celular, leituras e recompensas individuais funcionam sem rede. O progresso fica no mesmo navegador/aparelho.
5. Para registrar a atividade para o professor, abra **Desafios → Baixar resumo da prática**. O arquivo pode ser entregue quando houver conexão. A prática individual não é enviada automaticamente nem somada ao placar da turma.

Se a conexão cair durante a turma online, o aviso **Praticar neste aparelho** permite sair para a prática individual sem esperar pela rede. Essa ficha é separada da turma: os resultados já confirmados no servidor continuam lá e reaparecem ao entrar novamente. O progresso individual anterior é retomado. Personagens dos colegas, envios de participação/anotações e relatórios administrativos precisam de internet. Com a conexão restabelecida, o aluno decide quando voltar à turma; não há mistura automática de notas locais e registros do servidor.

Evite modo anônimo e não apague dados do site. Navegadores podem remover o armazenamento por falta de espaço; confira a mensagem e o modo avião antes da aula. A preparação é por navegador, perfil e aparelho. Um primeiro acesso completamente sem rede não consegue baixar o jogo. O navegador verifica atualizações quando há internet; somente uma versão com todos os arquivos baixados substitui a anterior. Recarregue conectado para usar a atualização.
