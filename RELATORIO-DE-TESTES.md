# Verificação para uso em aula

Data: 16/10/2026. Ambiente: Windows, Microsoft Edge 155.0.4283.45, Playwright. Renderização automatizada com SwiftShader (software). Servidor local: http://127.0.0.1:4180.

## Resultado

- 30 testes automatizados de regras e integridade: aprovados.
- Percurso completo pelas seis bancadas usando teclado: aprovado.
- Todas as alternativas de diagnóstico, reparo e desafios conceituais: exercitadas. Por caso, foram testadas duas respostas incorretas e uma correta em cada uma das três categorias.
- O turno com quatro erros práticos em cada caso terminou com 540/900 pontos, exatamente o esperado. Erros conceituais não alteraram a pontuação prática.
- O teste de regras confirmou máximo de 900 e mínimo de 30 por caso, sem creditar pontos antes da validação.
- Oito grupos adicionais de verificação no navegador: aprovados.
- Nenhum erro de execução, console ou requisição nas execuções aprovadas.
- Compilação de produção aprovada.

## Cobertura

| Área | Evidência verificada |
|---|---|
| Personagem | WASD, setas, animação ao andar, teclas opostas, parada após perder foco |
| Câmera | Teclas Q/R, arraste e limite junto à parede |
| Colisão | Mesa e limite da sala durante a navegação; todas as seis mesas, quatro limites e armários nos testes de geometria |
| Interação | E e botão; bloqueio à distância; pausa do movimento com painel ou desafios abertos |
| Investigação | Diagnóstico bloqueado antes dos dois testes; teste concluído não pode ser repetido |
| Reparos | Todas as alternativas; feedback de erro; pontuação somente após teste final; revisão sem duplicar pontos |
| Conceitos | Seis perguntas com tentativas, explicações, conclusão persistida e pontuação prática preservada |
| Salvamento | Recarga após uma pista, após diagnóstico, após reparo, após entrega e após desafio |
| Recuperação | JSON inválido, registros nulos/inconsistentes, dados antigos e armazenamento bloqueado |
| Reinício | Cancelar mantém progresso; confirmar limpa e persiste; disponível também no celular |
| Teclado nos menus | Botão ativado por Espaço; Esc fecha; retorno à caminhada sem ignorar a primeira tecla |
| Resumo | Download do arquivo e conferência da pontuação; metas atualizadas |
| Telas | 1366×768, 1024×768, 1920×1080, 390×844 e 844×390; capturas sem transbordamento horizontal |
| Toque | Emulação pelo protocolo do navegador: pressionar, segurar, soltar, interagir, testar e reiniciar |

## Correções realizadas

- Um evento de fechamento de diálogo podia apagar uma tecla recém-pressionada. A limpeza foi movida para o cancelamento síncrono, e o percurso completo foi repetido com sucesso.
- As teclas de navegação e Espaço deixaram de ser interceptadas pelo jogo enquanto um diálogo está aberto.
- Progresso salvo passou a validar coerência entre etapas, descartar índices inválidos e duplicados e recuperar cada caso independentemente.
- Armários passaram a integrar as colisões.
- Materiais de status passaram a ser compartilhados, evitando novas alocações a cada atualização.
- A indisponibilidade do armazenamento passa a ser informada desde a abertura.
- O botão de reinício também ficou acessível pelo painel Desafios em telas de toque.

## Reproduzir

Com o servidor ativo na porta 4180, execute nesta pasta:

```powershell
npm test
npm run build
```

Também é possível executar separadamente `npm run test:unit`, `npm run test:e2e` e `npm run test:robustness`. Os testes de navegador usam contextos isolados e não apagam o progresso do perfil normal do usuário. Capturas e relatórios JSON ficam em `test-results/`.

## Limites da verificação

Esta é uma bateria ampla, não uma prova de ausência de todos os defeitos possíveis. Não foram realizados testes em Firefox, Safari, celulares físicos, leitores de tela, GPUs antigas, WebGL indisponível ou em todos os computadores do laboratório. Resoluções de projetor foram simuladas; não houve teste em projetor físico. O cenário 3D requer WebGL. Antes da aula, abra o jogo no equipamento que será utilizado para confirmar desempenho e compatibilidade.

A publicação no GitHub Pages usa um repositório independente. O projeto pc-lab não foi modificado.

## Verificação adicional para publicação — 16/10/2026

A suíte completa foi repetida sobre os arquivos compilados, servidos no caminho `/oficina-3d/`, equivalente ao GitHub Pages. Foram adicionadas sete verificações: recursos relativos corretos; ausência de requisições a dependências externas; cliques duplos sem duplicação; piso de 30 pontos após 12 erros; revisão sem nova pontuação; download de resumo parcial; carregamento de turno perfeito com 900 pontos e três metas concluídas. A verificação de turno perfeito usa dados preparados para testar a integração entre salvamento, pontuação e interface. O percurso das seis bancadas é exercitado separadamente pela suíte completa.

## Laboratório com 20 computadores — atualização de 16/10/2026

A disposição foi substituída por cinco bancadas compartilhadas, com quatro computadores por bancada (dois por face). São dez PCs no lado A e dez no lado B, com cadeiras, corredores, janelas, quadro de aula e vista geral. Todas as 20 máquinas são interativas, com seis tipos de defeito distribuídos entre elas.

A suíte de regras agora contém 46 testes, incluindo contagem de bancadas, PCs por lado, corredores livres, colisões, seleção por ponto de acesso e migração dos seis registros anteriores. O teste de percurso passou a visitar os 20 PCs pelos dois corredores, executar todas as opções de diagnóstico/reparo/conceito e verificar persistência, resumo, metas e a pontuação esperada de 1800/3000 para quatro erros práticos por máquina. O modo de vista geral pausa a movimentação e o progresso antigo é migrado para uma chave própria, preservando o original.

As seções anteriores documentam a versão inicial de seis computadores. Para a versão atual, a quantidade é 20 e a pontuação máxima é 3000.

## Leitura e casos exclusivos — 18/10/2026

Foram adicionados painéis claros e opacos, fonte base de 16 px, ampliação para 18,88 px nos textos principais, passos do atendimento, respostas identificadas por letras, evidências com título e glossário contextual. O caderno permanece acessível após confirmar o diagnóstico. A ampliação é uma preferência da sessão.

Os PCs 07–20 agora têm conteúdos próprios, incluindo vídeo, boot, conexão SATA, teclado, USB frontal, DHCP, DNS, conflito de IP, espaço em disco, saída de áudio, driver gráfico, compatibilidade de RAM, obstrução de ventoinha e aplicativos de inicialização. A tabela completa está em CASOS-DO-LABORATORIO.md. A suíte de regras tem 47 testes e verifica a unicidade de títulos, sintomas, testes, diagnósticos, validações e perguntas.

O teste específico de leitura verifica ampliação, etapa atual, permanência de evidências, ausência de transbordamento horizontal no celular, separação dos botões de ampliar/fechar e migração. Na migração, somente os seis casos cujo conteúdo permaneceu igual mantêm seus resultados. As chaves antigas não são apagadas; os novos casos iniciam pendentes.

## Laboratório de Hardware — expansão de 21/10/2026

Novo nome e logotipo SVG original. A sala mantém os 20 computadores centrais e acrescenta 10 voltados para a parede A e 10 voltados para a parede B. Todos os 40 casos e questões conceituais são distintos. Pontuação máxima: 6000.

A suíte de regras agora tem 68 testes e inclui posicionamento, orientação das fileiras laterais, colisões, corredores, unicidade dos casos e migração dos 20 registros anteriores. O percurso automatizado foi ampliado para as 40 estações, utilizando os quatro corredores e testando as alternativas certas e erradas. O resultado esperado com quatro erros práticos por computador é 3600/6000.

`npm run test:expansion` verifica nome, migração, gabinete verde após validação, persistência do estado visual, manutenção de vizinhos pendentes e remoção do verde ao reiniciar. O estado de revisão também possui etiqueta textual ✓ REVISADO e não depende só da cor. A câmera geral foi ajustada ao tamanho ampliado da sala.


## Colaboração — 24/10/2026

- Servidor real Supabase: 40 reparos e 40 desafios conceituais concluídos; tentativas repetidas com mesmo identificador debitam somente uma vez.
- Reserva concorrente: apenas um aluno obtém o mesmo PC; liberar permite o colega assumir.
- Segurança: visitante sem sessão não acessa as tabelas; sessão fora da sala não lê tarefas nem executa ações; escrita direta e avanço indevido de etapa são negados; apelidos inválidos rejeitados.
- Navegadores independentes: avatares e movimento, dois reparos simultâneos em PCs diferentes, propagação da cor verde e pontuação 300, persistência após reload, queda de internet e reconexão automática, saída e restauração do modo individual.
- Sala isolada: sem personagens ou progresso de outra sala. Painel móvel de 390 px sem transbordamento horizontal.
- 68 testes unitários aprovados. Testes existentes de produção individual aprovados (7 verificações).
- Evidências em test-results/coop-backend.json, coop-browser.json e capturas coop-equipe.png, coop-laboratorio.png e coop-mobile.png.
- Auditoria: índices das chaves estrangeiras adicionados. Aviso de acesso de sessões anônimas autenticadas é esperado pelo modelo sem e-mail; acesso permanece limitado à associação à sala.
- Limite: validação funcional com duas sessões simultâneas; não é ensaio de carga de 40 alunos. Cotas gratuitas do Supabase continuam aplicáveis.

- Aparência: atribuição inicial distinta, quatro penteados/dez cores, persistência ao retornar, sincronização visual em outro navegador, alteração restrita ao próprio perfil e rejeição de estilos inválidos.
- Localização: botão Localizar acompanha o colega no PC 20, identificação sobre o personagem e na bancada, retorno à câmera do próprio aluno. Captura: test-results/coop-localizar.png.


## Expansão e área do professor — 25/10/2026

- 110 testes unitários aprovados. Percurso completo de 80 computadores aprovado, incluindo respostas certas e erradas, persistência, cor verde e relatório final de 7200/12000 pontos.
- Servidor: 80 atividades, autoria, reservas concorrentes, bloqueio de escrita indevida, reinício autorizado, rejeição de aluno e chave incorreta, preservação do histórico e rejeição de ações de rodadas antigas.
- Dois navegadores: colegas visíveis, autoria, reinício sincronizado pelo professor, fechamento de fichas, histórico, bloqueio do acesso e conclusão na segunda ala.
- Removidos controles de reinício individual dos alunos; reinício da sala exige autorização no servidor.
- Limite: teste funcional com duas sessões simultâneas, sem ensaio de carga de uma turma inteira.


## Progresso por aluno e placar — 25/10/2026

- 110 testes unitários aprovados. Servidor real: os 80 desafios foram resolvidos, com erros idempotentes, progresso individual e isolamento de respostas.
- Dois alunos podem abrir o mesmo PC ao mesmo tempo. A conclusão do segundo preserva a primeira; pontuações por PC são calculadas no servidor e não duplicam ao repetir a requisição.
- Escrita direta em tentativas e pontuações negada, tentativas de outro aluno invisíveis, visitante de outra sala sem acesso ao resumo, reinício exclusivo do professor, rodadas antigas preservadas.
- Migração: os 137 registros antigos de conclusão foram mantidos; nenhuma conclusão com autoria de sessão identificada ficou sem migrar. Registros sem essa identificação permanecem visíveis sem atribuição arbitrária de pontos individuais.
- Auditoria sem novos erros de segurança ou desempenho. O aviso de [sessões anônimas autenticadas](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins) é esperado para entrada por apelido; as políticas restringem sala e autor.

- Navegadores independentes: mesmo PC aberto simultaneamente, verde mantido com ficha pendente para o segundo aluno, dois nomes na lista, 150/90 pontos individuais nas etiquetas e no placar, histórico com duas conclusões, nova rodada sincronizada, segunda ala, reconexão e layout móvel aprovados.


## Administração separada, participação e anotações — 26/10/2026

- Administração em `admin.html`, sem carregar o cenário 3D. Mesma chave e autorização de professor no servidor.
- Identificação privada por nome completo e turma, sem e-mail; contagens de iniciados, concluídos, conceitos, pontos e envio por aluno/rodada.
- Registro atômico das alternativas marcadas e dos acertos/erros, sem duplicar eventos em tentativas repetidas da mesma requisição. Testes de servidor aprovados para respostas, notas, autorização e preservação após reinício.
- Dados privados não aparecem no resumo público da sala. Anotações de colegas não podem ser lidas nem marcadas como lidas por alunos; o relatório detalhado exige autorização do professor.
- Informações antigas de progresso preservadas. Alternativas específicas não registradas anteriormente não são reconstruídas.
- RLS sem políticas nas tabelas privadas de identificação e eventos é intencional: acesso direto negado, leitura apenas por funções que verificam a autorização. Referência do [aviso informativo](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- 110 testes unitários aprovados. A validação é funcional, com duas sessões de aluno e uma administrativa; não representa teste de carga de uma turma inteira.

- Navegador: envio de participação com nome/turma, alternativas corretas e incorretas no painel, CSV com linhas válidas, mensagem tratada como texto (sem executar HTML), reinício e histórico aprovados. Corrigida sobreposição no menu estreito; controles e rascunho testados em larguras 390, 844 e 1024 px. Leitura e produção individual aprovadas.

## Acesso administrativo por URL — 26/10/2026
A pedido do proprietário, /admin/ abre sem chave e o jogo não exibe atalho administrativo. A URL permite acesso aos relatórios e ao reinício das turmas para qualquer visitante. Teste admin-url.test.mjs aprovado localmente: entrada por /admin, criação e reinício de turma exclusiva de teste, retorno ao jogo, redirecionamento do endereço antigo preservando a turma e recarregamento sem senha. 110 testes unitários aprovados.

## Ordem pedagógica — 27/10/2026
111 testes unitários aprovados. Comparação com a versão anterior confirmou preservação dos 80 conteúdos, respostas e IDs internos. Teste order.test.mjs confirmou lista 01–80, títulos, abertura do computador correto e progresso antigo associado ao novo número. No percurso de navegador, 70 desafios passaram; houve timeout de deslocamento antes da última parede. Os dez restantes foram verificados em execução separada com TEST_LAST_WALL=1, incluindo persistência, cor verde e exportação. Os 80 desafios foram assim concluídos nas duas execuções. A tabela ORDEM-DOS-DESAFIOS.md relaciona números atuais e anteriores.

## Física e catálogo de recompensas — 27/10/2026
116 testes unitários aprovados, incluindo separação no mesmo ponto, impulso limitado, contato junto à parede, distribuição de 40 pontos de entrada e faixas de desbloqueio. rewards.test.mjs aprovado: bloqueio no servidor, tentativa de acesso fora da sala e escrita direta negadas, 6.000 pontos obtidos por 40 desafios em turma QA, pontuação mantida ao equipar, 11 miniaturas, visual sincronizado com colega, catálogo em tela de 390 px, empurrão entre dois navegadores e bloqueio novamente após reinício da turma QA. Não foram alteradas turmas de alunos. Advisors sem novas falhas relativas à alteração: os avisos de acesso anônimo e tabelas privadas sem políticas refletem a arquitetura já existente (RPCs com autorização e tabelas privadas fechadas).
