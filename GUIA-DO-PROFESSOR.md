> Versão atual: 40 computadores, 40 casos e máximo de 6000 pontos. Cinco bancadas centrais (20 PCs) e dez PCs voltados para cada parede lateral. O endereço público e o nome técnico do repositório permanecem os mesmos.

# Roteiro para a aula — Laboratório de Hardware

Público: alunos de arquitetura e manutenção de computadores. Duração sugerida: 30–45 minutos, em duplas ou individualmente.

## Objetivos

- Distinguir sintomas de causas e sustentar o diagnóstico com evidências.
- Isolar uma variável por vez, evitando trocas sem justificativa.
- Associar alimentação, memória, armazenamento, refrigeração, firmware e rede aos sintomas observados.
- Planejar o reparo e validar nas condições em que a falha ocorria.
- Priorizar preservação dos dados e procedimentos adequados ao equipamento.

## Preparação

Para acesso pela internet em computadores diferentes, use https://paulohenriquemendes.github.io/oficina-3d/.

Para desenvolvimento local, no computador com o servidor ativo, abra http://127.0.0.1:4180. Este endereço é local: não funciona nos outros computadores do laboratório. Para usar em outras máquinas sem publicar, copie a pasta do projeto (sem node_modules), instale Node.js, execute `npm install` e `npm run dev` em cada máquina. O GitHub Pages hospeda apenas os arquivos do jogo. Não há login nem envio automático das respostas dos alunos.

Use Edge ou outro navegador com WebGL disponível. Os testes automatizados foram executados no Edge; faça uma verificação no hardware do laboratório antes da aula. O progresso é compartilhado pelas pessoas que usam o mesmo perfil do navegador: reinicie o turno entre alunos ou use perfis distintos.

## Atividade

1. Exploração (5 min): experimentar WASD/setas, Q/R, câmera por arraste e interação E.
2. Investigação (15–20 min): realizar os 20 atendimentos, explicando a hipótese antes de selecionar a resposta. Os dois testes são necessários para liberar o diagnóstico.
3. Conceitos (5–10 min): após cada entrega, responder ao desafio conceitual. O retorno explica o raciocínio e permite tentar novamente, sem reduzir a pontuação prática.
4. Discussão (5–10 min): abrir **Desafios**, conferir metas e baixar o resumo. Cada aluno pode apresentar o arquivo e justificar suas decisões.

## Metas

- **Oficina recuperada:** 20 reparos com validação final.
- **Diagnóstico de primeira:** 20 computadores sem erro de diagnóstico ou reparo. Esta meta requer uma nova partida se o aluno quiser recuperar um caso em que errou.
- **Conceitos na prática:** 20 desafios conceituais respondidos corretamente.

Pontuação prática: até 150 por caso, menos 15 por tentativa incorreta de diagnóstico/reparo, com mínimo de 30. Só é creditada na validação final. Total: 3000. Desafios conceituais registram tentativas separadamente. O resumo local não constitui avaliação supervisionada nem é enviado automaticamente ao professor.

## Perguntas para discussão

1. Fonte: o que foi descartado antes de condenar a fonte? Quais compatibilidades verificar na substituição?
2. RAM: o que mudaria na hipótese se ambos os módulos falhassem apenas no mesmo slot?
3. Temperatura: por que testar apenas em repouso seria insuficiente? Os limites variam conforme o processador.
4. Disco: por que formatar não resolve falha física? Qual é a prioridade quando existem arquivos importantes?
5. CMOS/RTC: o que a bateria mantém sem energia externa? Compare a implementação em placas diferentes.
6. Rede: por que o LED apagado sozinho não prova defeito no cabo? O que a troca controlada demonstrou?

## Limites da simulação

Os testes são escolhas com resultados simulados; não medem hardware real. O jogo não representa desmontagem manual, manuseio de instrumentos ou todos os defeitos possíveis. Os cenários são deliberadamente delimitados para ensinar diagnóstico. Procedimentos reais devem seguir instruções do fabricante e orientação do professor; nunca abrir fontes de alimentação durante a atividade.

## Disposição do laboratório

São cinco bancadas compartilhadas, com quatro computadores por bancada: dois de cada lado. O lado A tem PCs 01–10 e o lado B tem PCs 11–20. Todos são interativos. Cada um dos 20 computadores possui sintomas, testes, diagnóstico, reparo e desafio conceitual próprios. A pontuação máxima é 3000. O botão **Ver laboratório** mostra a disposição completa e pausa a caminhada. Use **Voltar ao técnico** para retomar.

O progresso usa a chave `oficina3d.unique20.v1`. Na migração, os seis casos originais são preservados e os PCs 07–20, cujo conteúdo mudou, começam pendentes. As chaves anteriores não são apagadas. Cada computador mantém seu progresso independente.

## Leitura das informações

As fichas usam fundo claro e opaco, texto de 16 px, opção **A+ Ampliar texto**, etapas do atendimento e caderno de evidências consultável durante o reparo. O glossário explica as siglas presentes no caso. As respostas são identificadas por letras e o retorno de erro aparece em um bloco próprio. A ampliação vale para os painéis durante a sessão.

## Expansão de 21/10/2026

Os 20 casos anteriores foram mantidos e mais 20 casos foram adicionados. O teto de pontuação agora é 6000. Os PCs validados passam a ter gabinete e moldura do monitor verdes, além de etiqueta ✓ REVISADO. Essa indicação aparece após o teste final de reparo; a pergunta conceitual continua disponível. A cor é restaurada ao recarregar e volta ao estado pendente ao reiniciar o turno.

O salvamento atual usa `laboratorioHardware40.v1`; os 20 registros da versão anterior são migrados sem apagar sua chave. A marca em SVG combina monitor, circuito, letra H e verificação.
