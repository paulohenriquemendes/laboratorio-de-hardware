# Missão Hardware

Jogo educativo 3D para aulas de arquitetura e manutenção de computadores. Feito com Three.js e Vite. O site fica no GitHub Pages; o modo colaborativo usa Supabase Auth, Postgres e Realtime, em projeto gratuito separado. Não exige e-mail ou senha dos alunos.

**Jogar:** https://paulohenriquemendes.github.io/missao-hardware/

**Repositório:** https://github.com/paulohenriquemendes/missao-hardware

## Laboratório

- PCs 01–20: cinco bancadas centrais, com quatro computadores em cada.
- PCs 21–30: voltados para a parede A.
- PCs 31–40: voltados para a parede B.
- PCs 41–80: continuação do mesmo laboratório, com mais cinco bancadas centrais e duas fileiras laterais.
- Todos os 80 computadores têm sintomas, dois testes, diagnóstico, reparo e desafio conceitual próprios.
- Após validar o reparo, gabinete e monitor ficam verdes, com etiqueta ✓ REVISADO.
- O uniforme do aluno e a paleta verde seguem as referências descritas em REFERENCIAS-VISUAIS.md.

## Controles

WASD/setas para caminhar; Q/R ou arraste para girar a câmera; E ou botão para interagir; Esc para fechar. Há controles por toque. Ver laboratório exibe a sala inteira e pausa o movimento.

As fichas têm fonte ampliável, caderno de evidências e glossário. Desafios mostra as metas e permite baixar o resumo da prática.

## Pontuação e progresso

Até 150 pontos por computador, menos 15 por erro de diagnóstico/reparo, com mínimo de 30. Pontos entram após validação. Total possível: 12000. Questões conceituais registram tentativas separadamente, sem reduzir a pontuação prática.

A chave atual é `laboratorioHardware80.v1`. O progresso anterior de 40 PCs é ampliado para 80 sem perder resultados. Os 20 registros da versão `oficina3d.unique20.v1` são migrados sem apagar a chave antiga. Alunos não possuem botão para reiniciar o turno. O progresso fica no perfil do navegador e não é enviado automaticamente ao professor.

## Desenvolvimento

Nesta pasta, com Node.js instalado:

```powershell
npm install
npm run dev
```

Servidor de desenvolvimento na porta 4180. O projeto pc-lab e sua porta 4174 são independentes.

## Testes da versão compilada

```powershell
npm run build
npx vite preview --host 127.0.0.1 --port 4181 --strictPort
```

Em outro terminal, nesta pasta:

```powershell
$env:GAME_URL="http://127.0.0.1:4181/"
npm test
npm run test:expansion
npm run test:production
```

A suíte usa Playwright e Microsoft Edge instalado. `npm run test:unit` dispensa navegador e servidor. Os testes usam perfis isolados e não apagam o progresso normal do usuário. Capturas e resultados ficam em `test-results/`.

Para testar a publicação, use o endereço público em `GAME_URL`. O workflow do GitHub verifica as regras, compila e publica `dist/` a cada push em main.

Consulte GUIA-DO-PROFESSOR.md, CASOS-DO-LABORATORIO.md e RELATORIO-DE-TESTES.md para conteúdo, uso em aula e histórico de validação.


## Modo colaborativo

No painel `admin.html`, o professor cria ou seleciona uma turma e copia seu convite. Os alunos abrem o mesmo convite, informam um apelido e escolhem **Entrar na turma**. Sem `?sala=`, o jogo usa o laboratório aberto.

- Personagens e apelidos aparecem para os demais participantes.
- Cada aluno possui respostas, progresso e pontuação individuais, persistidos no servidor. Conclusões e placar ficam visíveis à sala.
- O mesmo PC pode ser resolvido por vários alunos simultaneamente. Cada ficha individual renova sua sessão a cada 20 segundos; não há reserva exclusiva do computador.
- A validação de etapas e respostas ocorre no servidor. Identificadores de ação evitam cobrar duas vezes uma resposta reenviada.
- Recarregar mantém a identidade anônima neste navegador. Limpar os dados do navegador cria outra identidade, mas a sala conserva os reparos. O link dá acesso à sala: compartilhe somente com a turma.
- Voltar ao individual recupera a partida local anterior. Somente o professor pode reiniciar a sala pela página administrativa protegida.
- O painel Minha turma mostra quem está online e quem entregou cada computador. Sem internet, respostas ficam pausadas; a conexão é refeita ao voltar, com botão Reconectar disponível.

### Serviço e manutenção

Projeto Supabase: `gcbmdkpplsduccibsqev` (laboratorio-de-hardware). `src/online-config.js` contém somente URL e chave publicável, sem segredo administrativo. `backend/schema.sql` registra a estrutura aplicada. As tabelas públicas permitem apenas leitura por membros; alterações passam por RPCs com identidade, associação à sala e etapas verificadas. Gabaritos e deduplicação ficam no esquema privado.

A auditoria de segurança sinaliza o acesso de usuários anônimos autenticados, intencional para alunos sem cadastro; as políticas restringem cada sessão às próprias salas. Referência: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins

O projeto foi criado com cotação US$ 0/mês; nenhum plano pago foi contratado. O plano gratuito tem cotas de mensagens e conexões e pode pausar por inatividade. A transmissão de movimento é adaptativa (até 2 atualizações/s, reduzidas em salas maiores), enquanto os avatares interpolam as posições. Isso não equivale a um teste de carga para 40 alunos: a experiência funcional foi verificada com duas sessões simultâneas e uma sala isolada. Muitas salas/participantes podem atingir cotas e reduzir a fluidez. Consulte https://supabase.com/docs/guides/realtime/limits.

Novas entradas anônimas também têm limite por IP; em redes escolares compartilhadas, confira **Authentication → Rate Limits → Anonymous sign-ins** antes de receber uma turma inteira. Sessões já criadas são reaproveitadas. Referência: https://supabase.com/docs/guides/auth/rate-limits.

### Testes colaborativos

`npm run test:coop:backend` testa os 80 casos no serviço real, tentativas simultâneas e independentes, múltiplos autores, pontuação individual, deduplicação, reinício e isolamento de permissões. `npm run test:coop` usa navegadores independentes contra o preview (ou `GAME_URL`), verificando avatares, reparos simultâneos, persistência, reconexão, saída e isolamento entre salas. Esses testes criam sessões e salas de QA no projeto gratuito e consomem cotas; não executá-los continuamente em CI.


### Personagens e localização

Em **Minha turma → Personalizar meu personagem**, escolha entre quatro penteados e dez cores de cabelo. O perfil fica salvo por aluno e sala. Novos participantes recebem uma combinação disponível entre as 40 possibilidades; escolhas manuais podem repetir combinações. Os uniformes continuam iguais.

Cada participante pode clicar em **Localizar** ao lado de um colega. A câmera acompanha o personagem e mostra o PC em atendimento; **Voltar ao meu aluno** ou caminhar encerra o acompanhamento. O apelido e a pontuação individual aparecem sobre o personagem. O painel Minha turma mostra o placar da rodada e todos os autores por PC. O gabinete continua verde quando já foi reparado.

As mudanças de perfil estão registradas em `backend/appearance.sql` e `backend/distinct-avatars.sql`, aplicadas depois de `backend/schema.sql`.


## Professor e rodadas (80 computadores)

Abra **Administração (admin.html)** e informe a chave privada gerada para o responsável. A chave está no arquivo local `.private/ACESSO-PROFESSOR.txt`, ignorado pelo Git; não faz parte do site, de URLs ou do código publicado. O banco armazena somente seu digest SHA-256. A autorização fica associada à sessão anônima atual por 8 horas, com limite de tentativas. Use **Bloquear acesso** ao terminar, especialmente em um computador compartilhado.

O painel informa status, autoria e data de cada conclusão. Em **Iniciar nova rodada**, digite **ZERAR** e confirme. A sala mantém o link, cria 80 tarefas vazias e fecha fichas dos alunos conectados. O histórico anterior permanece consultável e pode ser baixado em texto. Reiniciar a sala não reinicia outras salas nem partidas individuais. A capacidade de novos participantes é contabilizada na rodada atual.

Cada ação envia o número da rodada; respostas atrasadas de uma rodada antiga são recusadas. A criação de rodadas é atômica e protege contra clique duplo concorrente. Os testes usam somente salas de QA criadas para esse fim; nenhuma rodada real da turma foi zerada durante a implementação.

O modo de turma compartilha presença, localização e status; não contém chat ou mensagens entre alunos. Ao concluir um desafio, os colegas recebem o aviso e o PC fica verde com o apelido do responsável. Os registros de conclusão são feitos no servidor, com horário e identidade da sessão. Registros anteriores à atualização podem não ter horário, exibido como “—”.

Cabelos automáticos variam ao entrar, procurando combinações disponíveis. Uma personalização escolhida pelo aluno permanece salva. Os 40 novos conteúdos estão em `src/fundamentals.js`: bits/bytes, bases numéricas, unidades, taxas, portas lógicas, hierarquia de memória, CPU e inicialização.

As novas estruturas estão em `backend/expand-80.sql`, `backend/teacher.sql` e `backend/random-hair.sql`, posteriores às migrações anteriores. Para outro projeto, gere outra chave de professor e altere seu digest; não copie a configuração de acesso desta publicação.

## Progresso individual na sala

Aplique, após os scripts de backend anteriores, `supabase/migrations/20261025150810_individual_progress.sql`. A atualização cria tentativas por aluno/rodada/PC e conclusões com pontuação calculada no servidor. Migra resultados anteriores com autoria identificada; registros antigos sem identificação de sessão continuam no histórico, sem atribuir pontos arbitrariamente.

Um PC verde continua disponível para outros alunos. A ficha lista todos os autores. Resolver o mesmo PC novamente na mesma sessão e rodada não duplica pontos. O professor reinicia a rodada de todos, preservando os placares e as conclusões anteriores. A chave de acesso permanece a mesma.

## Participação identificada e anotações

O professor acessa `admin.html`, uma entrada separada do jogo. O aluno informa nome completo e turma em **Participação e anotações**; não há coleta de e-mail. O painel permite consultar iniciados, concluídos, conceitos, pontos, envio e alternativas marcadas por aluno e rodada, além de exportar CSV e respostas em texto. Dados de identificação e respostas detalhadas são restritos ao professor. No cenário permanece o apelido.

Aplique as migrações `20261025154550_student_notes.sql` e `20261026153045_student_participation.sql` após as anteriores. Anotações têm limite de 2000 caracteres e 10 envios por hora por sessão, com repetição de requisições deduplicada. O histórico de respostas começa nesta atualização; resultados anteriores mantêm suas etapas sem reconstruir alternativas desconhecidas. O professor vê até 2000 eventos mais recentes por aluno no detalhe, com aviso caso o limite seja atingido.

`node participation-backend.test.mjs` verifica identificação, contagens, eventos, privacidade, anotações e autorização. `npm run test:coop` inclui o painel administrativo em outra página, participação e exportação. Consulte GUIA-DO-PROFESSOR.md para o fluxo atualizado.

## Acesso administrativo por URL — 26/10/2026

Por solicitação expressa do responsável, `/admin/` abre o painel sem chave. A rota antiga `admin.html` redireciona para ela e o jogo não exibe atalho de administração. A migração `20261026160455_url_admin_access.sql` permite que uma sessão anônima autenticada obtenha acesso administrativo automaticamente. Portanto, conhecer a URL permite consultar identificação, respostas e anotações e reiniciar turmas. As referências anteriores a acesso exclusivo por chave descrevem a versão anterior. Nenhuma chave privada foi incorporada ao código.

## Marca e endereços anteriores

A aplicação se chama **Missão Hardware**. O ambiente 3D continua identificado nas placas como **Laboratório de Hardware**. Os repositórios anteriores são mantidos para redirecionar convites antigos, preservando o caminho de administração, os parâmetros de turma e os fragmentos da URL. Nenhum identificador de turma, resposta ou chave de armazenamento foi renomeado. Como os três endereços estão na mesma origem do GitHub Pages, a sessão do aluno é compartilhada; cada caminho prepara seu próprio cache de arquivos.

## Publicação automática

O repositório principal `missao-hardware` valida o código, compila os arquivos e atualiza a branch `gh-pages`. O GitHub Pages publica essa branch com `.nojekyll`. O workflow solicita a compilação nativa do Pages após o push; o resultado aparece também na execução `pages build and deployment`. `version.json` identifica o commit de origem. Os repositórios anteriores executam as verificações de código e mantêm os sites de compatibilidade já publicados, que redirecionam ao endereço principal.

Esse fluxo substitui a criação direta de deployments por artefato, que ficou bloqueada pelo GitHub mesmo após o deployment anterior constar como concluído. O endereço público e o banco de dados foram preservados.

## Clientes itinerantes e comemorações

`src/customers.js` renderiza quatro NPCs e os chamados de `src/customer-cases.js`, com rotas determinísticas sincronizadas pelo relógio do servidor. O servidor arbitra reserva exclusiva, proximidade, sequência de investigação, renovação, expiração, pagamento e deduplicação. As tabelas privadas e funções estão na migração `20261029015855_celebrations_and_wandering_customers.sql`. Os IDs dos 80 PCs permanecem intactos.

`src/celebrations.js` anima uma camada visual interna do avatar, preservando a posição usada nas colisões. Compras são serializadas com incidentes e atendimentos pelo bloqueio do membro da turma; saldo e desbloqueios utilizam o mesmo livro de registros. O snapshot respeita os modos de competição. Relatórios e CSV incluem pagamentos extras e compras por rodada/período.

`npm run test:customers` verifica clientes, pagamento, compra, comemoração própria e remota, persistência e celular com serviços simulados. `customers-celebrations.unit.test.mjs` verifica rotas, conteúdo, retorno da animação e movimento reduzido. `customer-backend.test.sql` valida o banco em uma transação com `ROLLBACK`, sem deixar turmas, pagamentos ou respostas de teste.

## Bancada prática e análise pedagógica

Oito atividades em `src/workshop-content.js` usam SVGs locais (`src/hardware-art.js`), Pointer Events com alternativa por toque/teclado e Web Audio (`src/beep-audio.js`). A UI está em `src/workshop.js`. O diagnóstico surpresa é uma bancada adicional com três variantes por rodada; os IDs e dados dos 80 computadores permanecem inalterados. O texto identifica os contextos separados, evitando usar uma medição didática como evidência de outro PC.

A migração `20261029173058_interactive_workshop_and_learning_analytics.sql` mantém catálogo, etapas e eventos privados. O servidor valida a sequência, calcula recompensas, deduplica requisições e serializa a carteira com compras e incidentes. Os ganhos são integrados aos snapshots, desbloqueios, relatórios e filtros por período. As conversas acrescentam eventos de perguntas aos clientes, sem pular testes.

`src/reputation.js` calcula títulos por conclusões; gastos não reduzem reputação. `src/learning-map.js` mostra o mapa exclusivo do professor com denominador por resposta, indicação de amostra pequena e CSV. Identificação e histórico continuam na sessão e no modelo administrativo já existentes.

`npm run test:workshop` verifica identificação, montagem por arraste de ponteiro e toque real em viewport móvel, alternativa por teclado, limpeza, jumper, geração de som e transcrição, inspeção, conectores, cenário surpresa, persistência, carteira, reputação e histórico/mapa administrativo com serviços simulados. `workshop-backend.test.sql` valida as funções com o papel authenticated, deduplicação, privacidade, relatórios, intervalos e reinício em transação com ROLLBACK. Não deixa dados de teste em turmas reais.

## Expansão para 100 e revisão de visuais

Os casos novos são acrescentados nos IDs 80–99 em `src/beginner-cases.js`; os IDs anteriores permanecem imutáveis. `src/challenge-order.js` apresenta os novos conteúdos básicos antes da sequência pedagógica anterior. `legacyOrder` mantém a referência dos valores antigos: `src/economy.js` preserva os ganhos dos primeiros 80 IDs e acrescenta R$ 20 por desafio novo, totalizando R$ 5.200. A migração de progresso local aceita arrays de 80 e acrescenta os 20 estados vazios.

O cenário possui três áreas conectadas, quinze bancadas centrais e quarenta posições de parede. Todas as 100 posições são navegáveis, com limites e visão geral adaptados ao novo tamanho. O estilo 8 foi reaproveitado como Careca gratuito, e o 13 como Metal · Headbanger, mantendo os identificadores de visual aceitos pelo servidor. A franja alternativa permanece no estilo 12.

As migrações `20261029182438_expand_100_and_avatar_refresh.sql` e `20261029183359_currency_wording_cleanup.sql` ampliam restrições, catálogo e operações para cem PCs, adicionam tarefas nas rodadas atuais sem tocar nas anteriores e ajustam mensagens e o desbloqueio de Careca. Os pagamentos antigos não são recalculados nem sobrescritos.

`expansion-100-backend.test.sql` verifica criação e reinício de turmas com 100 tarefas, resolução dos 20 exercícios novos, deduplicação, Careca sem saldo e preservação da carteira/histórico em transação com ROLLBACK. `npm run test:expansion:100` verifica cenário, ordenação, prévias, salvamento e mapa em telas de computador e celular sem criar dados reais.
