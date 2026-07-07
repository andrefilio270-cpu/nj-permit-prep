# Spec — NJ Permit Prep (nj-permit-prep)

## 1. Objetivo
Site de estudo **para uso pessoal** (a esposa do André) para passar no **NJ MVC Knowledge Test** (exame teórico da driver's license de New Jersey). Todo o conteúdo e interface **em inglês**. Foco: preparar de verdade para o exame real (50 questões, mínimo 40 acertos = 80%).

## 2. Restrições técnicas
- **R2.1** — Site 100% estático: HTML + CSS + JavaScript puro (vanilla). **Sem** framework, sem build step, sem backend, sem login.
- **R2.2** — Funciona abrindo `index.html` direto no navegador (protocolo `file://`) — nenhuma dependência de servidor ou CDN externo. Tudo self-contained na pasta do projeto.
- **R2.3** — Todo progresso (pontos, estatísticas, recompensas, erros, tour visto) salvo em `localStorage`.
- **R2.4** — Estrutura de pastas: `/Users/andreferreira/nj-permit-prep/` com `index.html`, `css/`, `js/`, `data/` (banco de questões em JS), `specs/`.
- **R2.5** — Responsivo: usável em desktop e celular.

## 3. Visual e animações
- **R3.1** — Tema **roxo e preto**: fundo preto/quase-preto, roxos vibrantes (gradientes), acentos em rosa para o mascote. Texto claro com bom contraste.
- **R3.2** — Site "vivo": animações em toda interação relevante — transições de página/vista, hover em cards e botões, entrada de elementos (fade/slide), barras de progresso animadas, contador de pontos animado (count-up), feedback animado de acerto/erro nas questões.
- **R3.3** — **Confete/celebração** ao: passar num simulado (≥80%), atingir uma recompensa, completar um tópico.
- **R3.4** — Tipografia e layout caprichados: cards com glow roxo, gradientes, cantos arredondados — estética moderna de app.

## 4. Banco de questões (conteúdo)
- **R4.1** — Banco **original**, escrito pela IA com base nos fatos/regras do **manual oficial do NJ MVC (NJ Driver Manual)**. Nenhum texto copiado de sites de terceiros.
- **R4.2** — Mínimo de **200 questões** de múltipla escolha (4 opções, 1 correta).
- **R4.3** — Cada questão tem: `id`, `topic`, `difficulty` (easy/medium/hard), `question`, `choices[4]`, `answerIndex`, `explanation` (explicação da resposta correta, exibida após responder).
- **R4.4** — Tópicos cobertos (mínimo): Road Signs; Traffic Laws & Rules of the Road; Speed Limits & Parking; Alcohol, Drugs & DUI (regras específicas de NJ, ex.: limite 0.08%, zero tolerance p/ menores de 21, Implied Consent); Safe Driving & Defensive Driving; Sharing the Road (pedestres, ciclistas, caminhões, motos, school buses); Licenses, Permits & Penalties (regras do GDL de NJ, pontos na carteira); Emergencies & Special Conditions (clima, derrapagem, aquaplanagem).
- **R4.5** — Distribuição de dificuldade aproximada: ~40% easy, ~40% medium, ~20% hard.
- **R4.6** — Questões sobre placas (Road Signs) mostram a placa **desenhada em SVG/CSS** (formas e cores corretas: octógono vermelho, losango amarelo, triângulo de yield etc.) — sem imagens externas.

## 5. Modos de estudo (mínimo 5)
- **R5.1 — Practice by Topic**: escolhe um tópico, responde questões com feedback imediato (mostra certo/errado + explicação após cada resposta).
- **R5.2 — Exam Simulation**: simulado no formato real do NJ MVC — **50 questões, passa com 40+ (80%)**, com timer visível, sem feedback durante a prova; resultado completo no final (nota, pass/fail, revisão das erradas).
- **R5.3 — Flashcards**: cartões pergunta→resposta (flip animado), navegação anterior/próximo, marcar "I knew it / I didn't".
- **R5.4 — Mistake Review**: modo que reapresenta **somente as questões já erradas** pela usuária; questão sai da lista quando acertada de novo.
- **R5.5 — Quick Quiz**: rodada rápida de 10 questões aleatórias com feedback imediato.
- **R5.6 — Road Signs Gallery**: página de estudo visual com as placas (SVG) organizadas por categoria (regulatory / warning / guide), cada uma com nome e significado.

## 6. Pontos (gamificação)
- **R6.1** — Acertos valem pontos **por dificuldade**: easy = **10**, medium = **20**, hard = **30**. Erros valem 0 (sem punição negativa).
- **R6.2** — Bônus: **+50%** de pontos por questão durante o **Exam Simulation** (mais difícil/realista); bônus de **streak**: a cada 5 acertos consecutivos, +25 pontos extras.
- **R6.3** — Bônus de conclusão: passar num simulado (≥80%) = **+500**; nota perfeita no simulado = **+1000**; completar todas as questões de um tópico com ≥80% de acerto = **+300**.
- **R6.4** — Total de pontos sempre visível no header, com animação quando aumenta.
- **R6.5** — Pontos são cumulativos e persistem (localStorage). Flashcards não dão pontos (autoavaliação) — pontos só em modos com correção objetiva.

## 7. Recompensas customizáveis
- **R7.1** — Página **Rewards**: a usuária cria recompensas próprias — escreve **o que vai ganhar** (texto livre, ex.: "Jantar no meu restaurante favorito") e **quantos pontos custa**.
- **R7.2** — Cada recompensa mostra barra de progresso animada (pontos atuais / meta).
- **R7.3** — Ao atingir a meta, a recompensa fica **desbloqueada** com celebração (confete + destaque visual) e um botão "Claim" para marcá-la como resgatada.
- **R7.4** — Recompensas podem ser editadas e excluídas. Lista persiste em localStorage.
- **R7.5** — Recompensas desbloqueadas **não descontam** pontos (pontos são medida de progresso, não moeda gasta) — a meta é um marco a atingir.

## 8. Mascote (suporte guiado)
- **R8.1** — Mascote **rosa e fofo** ("Bubbles"): personagem desenhado em **SVG/CSS** (blob arredondado com olhos grandes, bochechas, expressões), com animação idle (flutuando/piscando).
- **R8.2** — **Tour guiado na primeira visita**: o mascote aparece, se apresenta e conduz um passo a passo destacando cada área do site (o que é cada modo de estudo, pontos, recompensas, progresso), com balão de fala, botões Next/Skip e destaque (spotlight) do elemento explicado.
- **R8.3** — O tour marca-se como visto (localStorage) e **pode ser reassistido** por um botão ("Tour" / clicar no mascote).
- **R8.4** — Mascote presente em cada página com **dica contextual** da página atual (scriptado, sem IA), e reações: comemora acertos, encoraja após erros.

## 9. Páginas / navegação
- **R9.1** — SPA com vistas: **Home/Dashboard**, **Study** (hub dos modos), **Exam**, **Signs Gallery**, **Rewards**, **Progress**.
- **R9.2** — **Home/Dashboard**: saudação, pontos totais, progresso geral, atalhos para os modos, próxima recompensa mais perto de desbloquear.
- **R9.3** — **Progress**: estatísticas — questões respondidas, taxa de acerto geral e por tópico, histórico de simulados (data, nota, pass/fail), streak atual/recorde.
- **R9.4** — **Seletor de estado** no header: dropdown com estados dos EUA, apenas **New Jersey habilitado** ("mais estados em breve" nos demais) — deixa a estrutura pronta para expansão.
- **R9.5** — Botão de **reset de progresso** (com confirmação dupla) na página Progress.

## 10. Definição de "concluído"
- Todos os requisitos R2–R9 implementados e verificáveis.
- Abrir `index.html` no navegador funciona sem erros no console.
- Fluxo completo testável: tour → estudar → ganhar pontos → criar recompensa → desbloquear (via progresso) → ver estatísticas.
- Banco com ≥200 questões válidas (4 opções, 1 correta, explicação) distribuídas pelos tópicos do R4.4.

## Fora de escopo (explícito)
- Login, backend, banco de dados, hospedagem.
- Outros estados além de NJ (só a estrutura do seletor).
- Mascote com IA/chat livre (só scriptado; arquitetura permite evoluir depois).
- Cópia literal de conteúdo de sites de terceiros.
