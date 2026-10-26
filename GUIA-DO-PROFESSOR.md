# Laboratório de Hardware — guia do professor

## Acesso administrativo

Abra https://paulohenriquemendes.github.io/laboratorio-de-hardware/admin/ . A administração abre diretamente, sem chave, conforme solicitado. O jogo não mostra um atalho administrativo. Quem descobrir esse endereço também poderá consultar dados e reiniciar turmas. **Sair da administração** retorna ao jogo; abrir o endereço novamente permite entrar de novo. O endereço antigo `admin.html` redireciona para `/admin/`.

## Turmas e convites

Selecione a turma no painel ou use **Criar uma nova turma**. Copie o convite e envie aos alunos. Quem abre o mesmo convite entra na mesma turma; outra turma tem outro endereço e resultados separados. O endereço do jogo sem convite entra no laboratório aberto.

No jogo, **Minha turma** mostra colegas, localização e placar. O convite fica recolhido em **Convidar colegas**. A aparência fica em **Personalizar meu personagem**. O laboratório é um único ambiente com 80 computadores e placas “Laboratório de Hardware”. Todos podem resolver todos os desafios, inclusive o mesmo computador simultaneamente. Verde significa que alguém já resolveu, e a ficha lista os autores. Pontos e respostas são individuais.

## Identificação e participação

Peça ao aluno para abrir **Participação e anotações**, informar **nome completo e turma**, e clicar em **Enviar minha participação ao professor**. Não é solicitado e-mail. O nome completo e a turma não aparecem no cenário; no jogo continua o apelido.

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

Os desafios cobrem manutenção, arquitetura, bits, bytes, unidades e lógica. Cada PC vale até 150 pontos, descontando 15 por erro prático, com mínimo de 30. Questões conceituais registram erros separadamente e não retiram pontos práticos. Máximo: 12000 pontos. O mesmo PC não concede pontos repetidos ao mesmo aluno na mesma rodada.

Use perfis de navegador distintos para alunos diferentes. A sessão fica no navegador; trocar de dispositivo ou apagar os dados pode criar outra identidade. O modo de prática individual continua local e não gera registros na turma: para acompanhamento pelo professor, os alunos devem entrar pelo convite da turma.

A experiência é testada funcionalmente com dois alunos e um administrador. Não é um ensaio de carga de uma turma inteira. Nenhum plano pago foi ativado. Verifique os computadores e a conexão da escola antes da aula.
