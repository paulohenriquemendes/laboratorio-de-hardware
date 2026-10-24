# Laboratório de Hardware

Jogo educativo 3D para aulas de arquitetura e manutenção de computadores. Feito com Three.js e Vite. O site fica no GitHub Pages; o modo colaborativo usa Supabase Auth, Postgres e Realtime, em projeto gratuito separado. Não exige e-mail ou senha dos alunos.

**Jogar:** https://paulohenriquemendes.github.io/laboratorio-de-hardware/

**Repositório:** https://github.com/paulohenriquemendes/oficina-3d

## Laboratório

- PCs 01–20: cinco bancadas centrais, com quatro computadores em cada.
- PCs 21–30: voltados para a parede A.
- PCs 31–40: voltados para a parede B.
- Todos os 40 computadores têm sintomas, dois testes, diagnóstico, reparo e desafio conceitual próprios.
- Após validar o reparo, gabinete e monitor ficam verdes, com etiqueta ✓ REVISADO.
- O uniforme do aluno e a paleta verde seguem as referências descritas em REFERENCIAS-VISUAIS.md.

## Controles

WASD/setas para caminhar; Q/R ou arraste para girar a câmera; E ou botão para interagir; Esc para fechar. Há controles por toque. Ver laboratório exibe a sala inteira e pausa o movimento.

As fichas têm fonte ampliável, caderno de evidências e glossário. Desafios mostra as metas e permite baixar o resumo da prática.

## Pontuação e progresso

Até 150 pontos por computador, menos 15 por erro de diagnóstico/reparo, com mínimo de 30. Pontos entram após validação. Total possível: 6000. Questões conceituais registram tentativas separadamente, sem reduzir a pontuação prática.

A chave atual é `laboratorioHardware40.v1`. Os 20 registros da versão `oficina3d.unique20.v1` são migrados sem apagar a chave antiga. Reiniciar turno limpa somente a partida atual. O progresso fica no perfil do navegador e não é enviado automaticamente ao professor.

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
- Reparos, evidências, desafios e pontuação são compartilhados e persistidos no servidor.
- Um PC aberto fica reservado por 60 segundos, renovados a cada 20 segundos. Fechar a ficha libera o PC; sem conexão a reserva expira.
- A validação de etapas e respostas ocorre no servidor. Identificadores de ação evitam cobrar duas vezes uma resposta reenviada.
- Recarregar mantém a identidade anônima neste navegador. Limpar os dados do navegador cria outra identidade, mas a sala conserva os reparos. O link dá acesso à sala: compartilhe somente com a turma.
- Voltar ao individual recupera a partida local anterior. Reiniciar individual não apaga o progresso compartilhado. Para outra atividade, crie outra sala.
- O painel Equipe mostra quem está online e quem entregou cada computador. Sem internet, respostas ficam pausadas; a conexão é refeita ao voltar, com botão Reconectar disponível.

### Serviço e manutenção

Projeto Supabase: `gcbmdkpplsduccibsqev` (laboratorio-de-hardware). `src/online-config.js` contém somente URL e chave publicável, sem segredo administrativo. `backend/schema.sql` registra a estrutura aplicada. As tabelas públicas permitem apenas leitura por membros; alterações passam por RPCs com identidade, associação à sala e etapas verificadas. Gabaritos e deduplicação ficam no esquema privado.

A auditoria de segurança sinaliza o acesso de usuários anônimos autenticados, intencional para alunos sem cadastro; as políticas restringem cada sessão às próprias salas. Referência: https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins

O projeto foi criado com cotação US$ 0/mês; nenhum plano pago foi contratado. O plano gratuito tem cotas de mensagens e conexões e pode pausar por inatividade. A transmissão de movimento é adaptativa (até 2 atualizações/s, reduzidas em salas maiores), enquanto os avatares interpolam as posições. Isso não equivale a um teste de carga para 40 alunos: a experiência funcional foi verificada com duas sessões simultâneas e uma sala isolada. Muitas salas/participantes podem atingir cotas e reduzir a fluidez. Consulte https://supabase.com/docs/guides/realtime/limits.

Novas entradas anônimas também têm limite por IP; em redes escolares compartilhadas, confira **Authentication → Rate Limits → Anonymous sign-ins** antes de receber uma turma inteira. Sessões já criadas são reaproveitadas. Referência: https://supabase.com/docs/guides/auth/rate-limits.

### Testes colaborativos

`npm run test:coop:backend` testa os 40 casos no serviço real, concorrência de reserva, deduplicação e isolamento de permissões. `npm run test:coop` usa navegadores independentes contra o preview (ou `GAME_URL`), verificando avatares, reparos simultâneos, persistência, reconexão, saída e isolamento entre salas. Esses testes criam sessões e salas de QA no projeto gratuito e consomem cotas; não executá-los continuamente em CI.


### Personagens e localização

Em **Equipe → Meu personagem**, escolha entre quatro penteados e dez cores de cabelo. O perfil fica salvo por aluno e sala. Novos participantes recebem uma combinação disponível entre as 40 possibilidades; escolhas manuais podem repetir combinações. Os uniformes continuam iguais.

Cada participante pode clicar em **Localizar** ao lado de um colega. A câmera acompanha o personagem e mostra o PC em atendimento; **Voltar ao meu aluno** ou caminhar encerra o acompanhamento. O apelido aparece sobre o personagem e em uma etiqueta amarela no PC reservado. O gabinete continua verde quando já foi reparado.

As mudanças de perfil estão registradas em `backend/appearance.sql` e `backend/distinct-avatars.sql`, aplicadas depois de `backend/schema.sql`.
