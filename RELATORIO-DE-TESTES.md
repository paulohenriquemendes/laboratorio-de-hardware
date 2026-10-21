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
