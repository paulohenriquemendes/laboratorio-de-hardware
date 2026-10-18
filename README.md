# Oficina 3D

Jogo local em terceira pessoa feito com Three.js e Vite. Sem cadastro, backend ou serviços externos em tempo de execução.

## Jogar

Publicação no GitHub Pages: https://paulohenriquemendes.github.io/oficina-3d/

Repositório independente: https://github.com/paulohenriquemendes/oficina-3d

## Desenvolvimento local

Abra http://127.0.0.1:4180 enquanto o servidor estiver ativo.

Para iniciar novamente nesta pasta:

```powershell
npm install
npm run dev
```

O servidor usa exclusivamente a porta 4180 e falha se ela estiver ocupada. Não interfere no projeto pc-lab nem na porta 4174.

## Controles

- WASD ou setas: movimentação relativa à câmera.
- Q / R ou arrastar o cenário: girar câmera.
- E ou botão na tela: inspecionar bancada próxima.
- Esc: fechar inspeção.
- ?: reabrir instruções.
- Telas de toque: botões direcionais e botão de interação.

## Objetivo

Concluir os 20 atendimentos. Em cada bancada, execute os dois testes, interprete as evidências, escolha um diagnóstico, aplique o reparo adequado e execute o teste final para entregar o computador. A pontuação só é creditada na validação final: 150 pontos por caso, menos 15 por tentativa incorreta, com mínimo de 30. O máximo do turno é 3000 pontos. Testes não custam pontos.

Os casos abordam fonte, RAM, refrigeração, armazenamento, bateria CMOS e cabo Ethernet. Os procedimentos são simulações educativas; não há desmontagem real de fontes.

O progresso fica em localStorage com chave própria `oficina3d.progress.v1`. Se o armazenamento estiver indisponível, funciona em memória e avisa na interface. Reiniciar turno exige confirmação.

## Verificação

```powershell
npm run build
npm test
```

O teste usa Playwright com Microsoft Edge instalado. Percorre fisicamente as 20 computadores usando o teclado, verifica bloqueio de interação distante, colisões de mesas e paredes, animação de caminhada, câmera, suspensão da caminhada durante inspeção, desbloqueio por pistas, tentativas erradas, reparos, validação, pontuação, persistência após recarregar, ajuda, reinício e ausência de erros de console/rede. Capturas e relatório são gerados em `test-results/`.

`npm run build` gera os arquivos estáticos em `dist/`. O workflow `.github/workflows/pages.yml` testa as regras, compila e publica o conteúdo de `dist/` no GitHub Pages a cada push em `main`.

## Desafios para a turma

Cada entrega agora libera uma pergunta conceitual com feedback e tentativas separadas, sem desconto na pontuação prática. O botão **Desafios** reúne três metas e permite baixar um resumo local da atividade. O reinício também está disponível nesse painel para telas de toque.

Consulte `GUIA-DO-PROFESSOR.md` para o roteiro da aula e `RELATORIO-DE-TESTES.md` para a cobertura e os limites da verificação. A suíte completa é `npm test`; os testes de regras também podem ser executados sem servidor com `npm run test:unit`.

## Testar uma publicação

Os testes de navegador aceitam a variável `GAME_URL`. No PowerShell:

```powershell
$env:GAME_URL="https://paulohenriquemendes.github.io/oficina-3d/"
npm run test:e2e
npm run test:robustness
npm run test:production
```

Os sete testes adicionais de produção verificam caminhos dos recursos, ausência de dependências externas durante o jogo, cliques duplos, piso de pontuação, revisão, relatório parcial e metas de um turno perfeito.

## Disposição do laboratório

São cinco bancadas compartilhadas, com quatro computadores por bancada: dois de cada lado. O lado A tem PCs 01–10 e o lado B tem PCs 11–20. Todos são interativos. Cada um dos 20 computadores possui sintomas, testes, diagnóstico, reparo e desafio conceitual próprios. A pontuação máxima é 3000. O botão **Ver laboratório** mostra a disposição completa e pausa a caminhada. Use **Voltar ao técnico** para retomar.

O progresso usa a chave `oficina3d.unique20.v1`. Na migração, os seis casos originais são preservados e os PCs 07–20, cujo conteúdo mudou, começam pendentes. As chaves anteriores não são apagadas. Cada computador mantém seu progresso independente.

## Leitura das informações

As fichas usam fundo claro e opaco, texto de 16 px, opção **A+ Ampliar texto**, etapas do atendimento e caderno de evidências consultável durante o reparo. O glossário explica as siglas presentes no caso. As respostas são identificadas por letras e o retorno de erro aparece em um bloco próprio. A ampliação vale para os painéis durante a sessão.
