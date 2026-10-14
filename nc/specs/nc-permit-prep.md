# Spec — NC Permit Prep (nc-permit-prep)

Versão para **North Carolina** do site NJ Permit Prep (pasta raiz do repositório). Mesma aplicação,
mesmo visual e mesma gamificação — conteúdo, regras do exame e idiomas adaptados para NC.

## 1. Objetivo
Site de estudo para passar nas provas escritas do **NC DMV** (driver license / learner permit, Classe C).
Interface e conteúdo em **três idiomas: português (padrão), inglês e espanhol**.

## 2. Formato do exame real (fontes)
- O NC DMV aplica, para licença original ou learner permit: **visão**, **prova de placas** (traffic signs) e
  **prova teórica** (knowledge test). **Cada prova precisa ser aprovada separadamente.**
  (NC Driver Handbook, cap. 1; ncdot.gov → Driver License Tests)
- **Prova de placas**: o candidato identifica as placas **pela cor e pela forma** e explica o significado.
  Classe C: precisa identificar corretamente **9 de 12** placas (regra administrativa do NC DMV publicada pelo OAH).
- **Prova teórica**: leis de trânsito e direção segura — **25 questões, aprova com 20 (80%)** (formato
  amplamente reportado; o manual não informa o número).

## 3. Restrições técnicas (iguais ao NJ — R2)
- 100% estático (HTML + CSS + JS puro), funciona via `file://`, sem CDN, sem backend.
- Pasta `nc/` autocontida: `index.html`, `css/`, `js/`, `data/`, `db/`, `specs/`.
- Progresso em `localStorage` na chave `ncpp_state_v1` (separado do NJ, `njpp_state_v1`).
- Seletor de estado: **North Carolina** e **New Jersey** habilitados — trocar de estado navega entre
  `nc/index.html` e `../index.html`. Demais estados: "em breve".

## 4. Banco de questões
- **Original**, escrito a partir do **NC Driver Handbook oficial** (edição atual, ncdot.gov) — EN e a edição
  em espanhol (terminologia). Nenhum texto copiado de sites de terceiros.
- Mesmos 8 tópicos do NJ, com DUI → **DWI** (termo usado em NC).
- Cada questão: `id`, `topic`, `difficulty`, `[sign]`, `question`/`choices[4]`/`explanation` +
  `_pt` + `_es` (escolhas na MESMA ordem; `answerIndex` único).
- Questões **de forma e cor**: `sign` = `shape-*` (placa sem texto, só forma/cor) — alimentam a Prova de Placas.
- Distribuição ≈ 40% fácil / 40% média / 20% difícil.

## 5. Placas (`data/signs.js`)
- SVG puro; `SIGNS_META` com `name`/`meaning` + `_pt` + `_es`; categorias `regulatory`, `warning`, `guide`
  e `shape` (formas sem texto da prova de placas).
- Inclui placas específicas do manual de NC: flâmula (no passing zone), pentágono escolar, advertência
  circular de ferrovia, crossbuck, losango laranja (obras), emblema de veículo lento, marcador de rota NC
  (losango), escudo US, etc.

## 6. Modos de estudo (NJ R5 + NC)
- Prática por Tópico, Quiz Rápido, Flashcards, Revisão de Erros, Galeria de Placas (iguais ao NJ).
- **Prova de Placas (forma & cor)** — novo: 12 placas sem texto, feedback imediato; mostra se "passaria"
  (≥ 9/12).
- **Simulado do Exame** no formato NC: Parte 1 = 12 placas de forma/cor (passa com 9), Parte 2 = 25 questões
  teóricas (passa com 20). **Aprovação exige passar nas duas.** Timer, sem feedback durante, revisão no fim.

## 7. Pontos, recompensas, mascote, progresso
Idênticos ao NJ (R6–R9): 10/20/30 pts, ×1.5 no simulado, streak +25 a cada 5, +500 aprovação,
+1000 nota perfeita, +300 domínio de tópico; recompensas customizáveis; Bubbles com tour e dicas
(textos de NC); chat "Pergunte ao Bubbles" busca nos três idiomas.

## 8. Idiomas (R11 estendido)
- Botão no header alterna **PT → EN → ES**; escolha persistida; padrão PT.
- Toda a interface, tour, dicas, chat, questões e placas nos três idiomas.

## 9. Banco SQLite (`db/permitprep-nc.db`)
Mesmo esquema do NJ + colunas `_es`; gerado a partir de `data/*.js` por `db/build-db.js`.
