# Laboratório de Hardware

Jogo educativo 3D para aulas de arquitetura e manutenção de computadores. Sem cadastro ou backend. Feito com Three.js e Vite.

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
