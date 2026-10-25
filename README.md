# Laboratório de Hardware

Jogo educativo 3D para aulas de arquitetura e manutenção de computadores. Feito com Three.js e Vite. O site fica no GitHub Pages; o modo colaborativo usa Supabase Auth, Postgres e Realtime, em projeto gratuito separado. Não exige e-mail ou senha dos alunos.

**Jogar:** https://paulohenriquemendes.github.io/laboratorio-de-hardware/

**Repositório:** https://github.com/paulohenriquemendes/oficina-3d

## Laboratório

- PCs 01–20: cinco bancadas centrais, com quatro computadores em cada.
- PCs 21–30: voltados para a parede A.
- PCs 31–40: voltados para a parede B.
- PCs 41–80: segunda ala, com mais cinco bancadas centrais e duas fileiras laterais, dedicada a fundamentos.
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
npx vite preview --host 127.0.0.1 --port 4181 --strictPort --base /oficina-3d/
```

Em outro terminal, nesta pasta:

```powershell
$env:GAME_URL="http://127.0.0.1:4181/oficina-3d/"
npm test
npm run test:expansion
npm run test:production
```

A suíte usa Playwright e Microsoft Edge instalado. `npm run test:unit` dispensa navegador e servidor. Os testes usam perfis isolados e não apagam o progresso normal do usuário. Capturas e resultados ficam em `test-results/`.

Para testar a publicação, use o endereço público em `GAME_URL`. O workflow do GitHub verifica as regras, compila e publica `dist/` a cada push em main.

Consulte GUIA-DO-PROFESSOR.md, CASOS-DO-LABORATORIO.md e RELATORIO-DE-TESTES.md para conteúdo, uso em aula e histórico de validação.


## Modo colaborativo

Digite um apelido e escolha **Entrar em equipe**. O endereço sem `?sala=` usa o laboratório aberto. Para uma turma, escolha **Criar sala da turma** e compartilhe o link em **Equipe → Copiar link da sala**. Todos precisam abrir o mesmo link e entrar em equipe.

- Personagens e apelidos aparecem para os demais participantes.
- Cada aluno possui respostas, progresso e pontuação individuais, persistidos no servidor. Conclusões e placar ficam visíveis à sala.
- O mesmo PC pode ser resolvido por vários alunos simultaneamente. Cada ficha individual renova sua sessão a cada 20 segundos; não há reserva exclusiva do computador.
- A validação de etapas e respostas ocorre no servidor. Identificadores de ação evitam cobrar duas vezes uma resposta reenviada.
- Recarregar mantém a identidade anônima neste navegador. Limpar os dados do navegador cria outra identidade, mas a sala conserva os reparos. O link dá acesso à sala: compartilhe somente com a turma.
- Voltar ao individual recupera a partida local anterior. Somente o professor pode reiniciar a sala pela área protegida Professor.
- O painel Equipe mostra quem está online e quem entregou cada computador. Sem internet, respostas ficam pausadas; a conexão é refeita ao voltar, com botão Reconectar disponível.

### Serviço e manutenção

Projeto Supabase: `gcbmdkpplsduccibsqev` (laboratorio-de-hardware). `src/online-config.js` contém somente URL e chave publicável, sem segredo administrativo. `backend/schema.sql` registra a estrutura aplicada. As tabelas públicas permitem apenas leitura por membros; alterações passam por RPCs com identidade, associação à sala e etapas verificadas. Gabaritos e deduplicação ficam no esquema privado.

A auditoria de segurança sinaliza o acesso de usuários anônimos autenticados, intencional para alunos sem cadastro; as políticas restringem cada sessão às próprias salas. Referência: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins

O projeto foi criado com cotação US$ 0/mês; nenhum plano pago foi contratado. O plano gratuito tem cotas de mensagens e conexões e pode pausar por inatividade. A transmissão de movimento é adaptativa (até 2 atualizações/s, reduzidas em salas maiores), enquanto os avatares interpolam as posições. Isso não equivale a um teste de carga para 40 alunos: a experiência funcional foi verificada com duas sessões simultâneas e uma sala isolada. Muitas salas/participantes podem atingir cotas e reduzir a fluidez. Consulte https://supabase.com/docs/guides/realtime/limits.

Novas entradas anônimas também têm limite por IP; em redes escolares compartilhadas, confira **Authentication → Rate Limits → Anonymous sign-ins** antes de receber uma turma inteira. Sessões já criadas são reaproveitadas. Referência: https://supabase.com/docs/guides/auth/rate-limits.

### Testes colaborativos

`npm run test:coop:backend` testa os 80 casos no serviço real, tentativas simultâneas e independentes, múltiplos autores, pontuação individual, deduplicação, reinício e isolamento de permissões. `npm run test:coop` usa navegadores independentes contra o preview (ou `GAME_URL`), verificando avatares, reparos simultâneos, persistência, reconexão, saída e isolamento entre salas. Esses testes criam sessões e salas de QA no projeto gratuito e consomem cotas; não executá-los continuamente em CI.


### Personagens e localização

Em **Equipe → Meu personagem**, escolha entre quatro penteados e dez cores de cabelo. O perfil fica salvo por aluno e sala. Novos participantes recebem uma combinação disponível entre as 40 possibilidades; escolhas manuais podem repetir combinações. Os uniformes continuam iguais.

Cada participante pode clicar em **Localizar** ao lado de um colega. A câmera acompanha o personagem e mostra o PC em atendimento; **Voltar ao meu aluno** ou caminhar encerra o acompanhamento. O apelido e a pontuação individual aparecem sobre o personagem. O painel Equipe mostra o placar da rodada e todos os autores por PC. O gabinete continua verde quando já foi reparado.

As mudanças de perfil estão registradas em `backend/appearance.sql` e `backend/distinct-avatars.sql`, aplicadas depois de `backend/schema.sql`.


## Professor e rodadas (80 computadores)

Entre na sala, abra **Equipe → Professor** e informe a chave privada gerada para o responsável. A chave está no arquivo local `.private/ACESSO-PROFESSOR.txt`, ignorado pelo Git; não faz parte do site, de URLs ou do código publicado. O banco armazena somente seu digest SHA-256. A autorização fica associada à sessão anônima atual por 8 horas, com limite de tentativas. Use **Bloquear acesso** ao terminar, especialmente em um computador compartilhado.

O painel informa status, autoria e data de cada conclusão. Em **Iniciar nova rodada**, digite **ZERAR** e confirme. A sala mantém o link, cria 80 tarefas vazias e fecha fichas dos alunos conectados. O histórico anterior permanece consultável e pode ser baixado em texto. Reiniciar a sala não reinicia outras salas nem partidas individuais. A capacidade de novos participantes é contabilizada na rodada atual.

Cada ação envia o número da rodada; respostas atrasadas de uma rodada antiga são recusadas. A criação de rodadas é atômica e protege contra clique duplo concorrente. Os testes usam somente salas de QA criadas para esse fim; nenhuma rodada real da turma foi zerada durante a implementação.

O modo de turma compartilha presença, localização e status; não contém chat ou mensagens entre alunos. Ao concluir um desafio, os colegas recebem o aviso e o PC fica verde com o apelido do responsável. Os registros de conclusão são feitos no servidor, com horário e identidade da sessão. Registros anteriores à atualização podem não ter horário, exibido como “—”.

Cabelos automáticos variam ao entrar, procurando combinações disponíveis. Uma personalização escolhida pelo aluno permanece salva. Os 40 novos conteúdos estão em `src/fundamentals.js`: bits/bytes, bases numéricas, unidades, taxas, portas lógicas, hierarquia de memória, CPU e inicialização.

As novas estruturas estão em `backend/expand-80.sql`, `backend/teacher.sql` e `backend/random-hair.sql`, posteriores às migrações anteriores. Para outro projeto, gere outra chave de professor e altere seu digest; não copie a configuração de acesso desta publicação.

## Progresso individual na sala

Aplique, após os scripts de backend anteriores, `supabase/migrations/20261025150810_individual_progress.sql`. A atualização cria tentativas por aluno/rodada/PC e conclusões com pontuação calculada no servidor. Migra resultados anteriores com autoria identificada; registros antigos sem identificação de sessão continuam no histórico, sem atribuir pontos arbitrariamente.

Um PC verde continua disponível para outros alunos. A ficha lista todos os autores. Resolver o mesmo PC novamente na mesma sessão e rodada não duplica pontos. O professor reinicia a rodada de todos, preservando os placares e as conclusões anteriores. A chave de acesso permanece a mesma.
