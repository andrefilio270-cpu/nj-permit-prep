// js/flashcards.js — Flashcards mode (R5.3): flip animation, prev/next,
// "I knew it / I didn't" self-assessment. No points (R6.5 — self-graded).
// Loaded by index.html; used via the global Cards.

const Cards = {
  deck: null, idx: 0, knew: 0, didnt: 0,

  renderPicker() {
    const host = document.getElementById('view-flashcards');
    host.innerHTML =
      '<div class="pop-in"><h1>Flashcards 🃏</h1><p class="sub">Pick a deck — flip each card, then be honest: did you know it?</p>' +
      '<div class="grid topics-grid">' +
      '<button class="card topic-card" onclick="Cards.start(null)"><span class="topic-icon">✨</span><b>All Topics</b><span class="topic-sub">' + Store.bank().length + ' cards</span></button>' +
      TOPICS.map(t =>
        '<button class="card topic-card" onclick="Cards.start(\'' + t.id + '\')">' +
        '<span class="topic-icon">' + t.icon + '</span><b>' + esc(t.name) + '</b>' +
        '<span class="topic-sub">' + Store.questionsByTopic(t.id).length + ' cards</span></button>').join('') +
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
      '<button class="btn ghost" onclick="Cards.renderPicker()">← Decks</button>' +
      '<div class="quiz-meta"><span class="chip">🃏 Flashcards</span></div>' +
      '<div class="quiz-count">' + (this.idx + 1) + ' / ' + this.deck.length + '</div></div>' +
      '<div class="bar"><div class="bar-fill" style="width:' + Math.round((this.idx / this.deck.length) * 100) + '%"></div></div>' +
      '<div class="flash-wrap pop-in">' +
      '<div class="flashcard ' + (flipped ? 'flipped' : '') + '" id="flashcard" onclick="Cards.flip()">' +
      '<div class="flash-face flash-front">' +
      (q.sign && window.SIGN_SVGS && SIGN_SVGS[q.sign] ? '<div class="sign-box small">' + SIGN_SVGS[q.sign] + '</div>' : '') +
      '<p>' + esc(q.question) + '</p><span class="flash-hint">tap to flip ↻</span></div>' +
      '<div class="flash-face flash-back"><p class="flash-answer">' + esc(q.choices[q.answerIndex]) + '</p>' +
      '<p class="flash-expl">' + esc(q.explanation) + '</p><span class="flash-hint">tap to flip back ↻</span></div>' +
      '</div></div>' +
      '<div class="flash-controls pop-in">' +
      '<button class="btn ghost" ' + (this.idx === 0 ? 'disabled' : '') + ' onclick="Cards.prevCard()">← Prev</button>' +
      '<button class="btn knew" onclick="Cards.mark(true)">😊 I knew it</button>' +
      '<button class="btn didnt" onclick="Cards.mark(false)">😅 I didn\'t</button>' +
      '<button class="btn ghost" ' + (this.idx >= this.deck.length - 1 ? 'disabled' : '') + ' onclick="Cards.nextCard()">Next →</button>' +
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
      '<h2>Deck finished!</h2>' +
      '<p class="summary-line">You knew <b>' + this.knew + '</b> and are still learning <b>' + this.didnt + '</b> of ' + total + ' cards.</p>' +
      '<p class="exam-note">Flashcards don\'t earn points — quizzes and exams do. Ready to cash in what you learned?</p>' +
      '<div class="summary-actions">' +
      '<button class="btn primary" onclick="Cards.renderPicker()">Another Deck</button>' +
      '<button class="btn ghost" onclick="Quiz.start(\'quick\')">Quick Quiz (earn points!)</button>' +
      '</div></div>';
    Mascot.say('Nice review session! Now turn it into points with a quiz! ⭐', 3800);
  }
};
