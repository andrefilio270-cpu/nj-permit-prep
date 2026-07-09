// js/flashcards.js — Flashcards mode (R5.3): flip animation, prev/next,
// self-assessment. No points (R6.5). Bilingual via I18N (R11.2/R11.3).
// Loaded by index.html; used via the global Cards.

const Cards = {
  deck: null, idx: 0, knew: 0, didnt: 0,

  renderPicker() {
    const host = document.getElementById('view-flashcards');
    host.innerHTML =
      '<div class="pop-in"><h1>' + I18N.t('flash_title') + '</h1><p class="sub">' + I18N.t('flash_sub') + '</p>' +
      '<div class="grid topics-grid">' +
      '<button class="card topic-card" onclick="Cards.start(null)"><span class="topic-icon">✨</span><b>' + I18N.t('all_topics') + '</b><span class="topic-sub">' + I18N.t('cards_count', { n: Store.bank().length }) + '</span></button>' +
      TOPICS.map(t =>
        '<button class="card topic-card" onclick="Cards.start(\'' + t.id + '\')">' +
        '<span class="topic-icon">' + t.icon + '</span><b>' + esc(I18N.topicName(t)) + '</b>' +
        '<span class="topic-sub">' + I18N.t('cards_count', { n: Store.questionsByTopic(t.id).length }) + '</span></button>').join('') +
      '</div></div>';
  },

  start(topicId) {
    const src = topicId ? Store.questionsByTopic(topicId) : Store.bank();
    this.deck = shuffle(src.slice());
    this.idx = 0; this.knew = 0; this.didnt = 0;
    this.render(false);
  },

  render(flipped) {
    const host = document.getElementById('view-flashcards');
    const q = this.deck[this.idx];
    host.innerHTML =
      '<div class="quiz-head pop-in">' +
      '<button class="btn ghost" onclick="Cards.renderPicker()">' + I18N.t('decks') + '</button>' +
      '<div class="quiz-meta"><span class="chip">🃏 Flashcards</span></div>' +
      '<div class="quiz-count">' + (this.idx + 1) + ' / ' + this.deck.length + '</div></div>' +
      '<div class="bar"><div class="bar-fill" style="width:' + Math.round((this.idx / this.deck.length) * 100) + '%"></div></div>' +
      '<div class="flash-wrap pop-in">' +
      '<div class="flashcard ' + (flipped ? 'flipped' : '') + '" id="flashcard" onclick="Cards.flip()">' +
      '<div class="flash-face flash-front">' +
      (q.sign && window.SIGN_SVGS && SIGN_SVGS[q.sign] ? '<div class="sign-box small">' + SIGN_SVGS[q.sign] + '</div>' : '') +
      '<p>' + esc(I18N.qText(q)) + '</p><span class="flash-hint">' + I18N.t('flip_hint') + '</span></div>' +
      '<div class="flash-face flash-back"><p class="flash-answer">' + esc(I18N.qChoices(q)[q.answerIndex]) + '</p>' +
      '<p class="flash-expl">' + esc(I18N.qExpl(q)) + '</p><span class="flash-hint">' + I18N.t('flip_hint') + '</span></div>' +
      '</div></div>' +
      '<div class="flash-controls pop-in">' +
      '<button class="btn ghost" ' + (this.idx === 0 ? 'disabled' : '') + ' onclick="Cards.prevCard()">' + I18N.t('prev') + '</button>' +
      '<button class="btn knew" onclick="Cards.mark(true)">' + I18N.t('knew') + '</button>' +
      '<button class="btn didnt" onclick="Cards.mark(false)">' + I18N.t('didnt') + '</button>' +
      '<button class="btn ghost" ' + (this.idx >= this.deck.length - 1 ? 'disabled' : '') + ' onclick="Cards.nextCard()">' + I18N.t('next') + '</button>' +
      '</div>';
  },

  flip() { document.getElementById('flashcard').classList.toggle('flipped'); },

  mark(knew) {
    if (knew) this.knew++; else this.didnt++;
    if (this.idx >= this.deck.length - 1) return this.summary();
    this.idx++;
    this.render(false);
  },

  prevCard() { if (this.idx > 0) { this.idx--; this.render(false); } },
  nextCard() { if (this.idx < this.deck.length - 1) { this.idx++; this.render(false); } },

  summary() {
    const host = document.getElementById('view-flashcards');
    const total = this.knew + this.didnt;
    const pct = total ? Math.round((this.knew / total) * 100) : 0;
    if (pct >= 80) Confetti.burst(60);
    host.innerHTML =
      '<div class="card summary-card pop-in">' +
      '<div class="summary-ring ' + (pct >= 80 ? 'good' : pct >= 50 ? 'mid' : 'low') + '"><span>' + pct + '%</span></div>' +
      '<h2>' + I18N.t('deck_done') + '</h2>' +
      '<p class="summary-line">' + I18N.t('deck_line', { k: this.knew, d: this.didnt, n: total }) + '</p>' +
      '<p class="exam-note">' + I18N.t('no_points_note') + '</p>' +
      '<div class="summary-actions">' +
      '<button class="btn primary" onclick="Cards.renderPicker()">' + I18N.t('another_deck') + '</button>' +
      '<button class="btn ghost" onclick="Quiz.start(\'quick\')">' + I18N.t('quick_quiz_btn') + '</button>' +
      '</div></div>';
    Mascot.say(I18N.t('flash_mascot'), 3800);
  }
};
