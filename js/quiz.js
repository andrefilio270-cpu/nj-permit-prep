// js/quiz.js — shared quiz engine with instant feedback (R5.1 Practice by Topic,
// R5.5 Quick Quiz, R5.4 Mistake Review). Loaded by index.html; used via the global Quiz.

const Quiz = {
  session: null,

  MODE_TITLES: {
    topic: 'Practice by Topic',
    quick: 'Quick Quiz',
    mistakes: 'Mistake Review'
  },

  start(mode, topicId) {
    let qs;
    if (mode === 'topic') {
      qs = shuffle(Store.questionsByTopic(topicId).slice());
    } else if (mode === 'quick') {
      qs = shuffle(Store.bank().slice()).slice(0, 10);            // R5.5 — 10 random questions
    } else { // mistakes
      qs = shuffle(Store.bank().filter(q => Store.state.mistakes.indexOf(q.id) >= 0)); // R5.4
    }

    App.show('quiz');
    const host = document.getElementById('view-quiz');

    if (!qs.length) {
      host.innerHTML =
        '<div class="card empty-state pop-in">' +
        '<div class="empty-emoji">🌟</div>' +
        '<h2>No mistakes to review!</h2>' +
        '<p>Your mistake list is empty — either you haven\'t missed anything yet, or you already fixed them all. Amazing!</p>' +
        '<button class="btn primary" onclick="App.show(\'study\')">Back to Study</button></div>';
      return;
    }

    this.session = { mode, topicId, qs, idx: 0, correct: 0, earned: 0, answered: false };
    this.render();
  },

  topicOf(q) {
    const t = TOPICS.filter(t => t.id === q.topic)[0];
    return t ? t : { name: q.topic, icon: '📘' };
  },

  render() {
    const s = this.session;
    const q = s.qs[s.idx];
    const t = this.topicOf(q);
    const host = document.getElementById('view-quiz');
    const pct = Math.round((s.idx / s.qs.length) * 100);

    host.innerHTML =
      '<div class="quiz-head pop-in">' +
      '<button class="btn ghost" onclick="Quiz.quit()">← Quit</button>' +
      '<div class="quiz-meta"><span class="chip">' + t.icon + ' ' + esc(t.name) + '</span>' +
      '<span class="chip diff-' + q.difficulty + '">' + q.difficulty.toUpperCase() + ' · ' + (POINTS[q.difficulty] || 10) + ' pts</span></div>' +
      '<div class="quiz-count">' + (s.idx + 1) + ' / ' + s.qs.length + '</div></div>' +
      '<div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="card question-card pop-in" id="qcard">' +
      (q.sign && window.SIGN_SVGS && SIGN_SVGS[q.sign] ? '<div class="sign-box">' + SIGN_SVGS[q.sign] + '</div>' : '') +
      '<h2 class="question-text">' + esc(q.question) + '</h2>' +
      '<div class="choices">' +
      q.choices.map((c, i) =>
        '<button class="choice" data-i="' + i + '" onclick="Quiz.answer(' + i + ')">' +
        '<span class="choice-letter">' + 'ABCD'[i] + '</span>' + esc(c) + '</button>').join('') +
      '</div>' +
      '<div class="explanation hidden" id="explanation"></div>' +
      '<div class="quiz-actions hidden" id="quiz-actions">' +
      '<button class="btn primary big" onclick="Quiz.next()">' + (s.idx + 1 === s.qs.length ? 'See Results' : 'Next Question →') + '</button>' +
      '</div></div>';
  },

  answer(i) {
    const s = this.session;
    if (s.answered) return;
    s.answered = true;
    const q = s.qs[s.idx];
    const correct = i === q.answerIndex;
    if (correct) s.correct++;

    const res = Store.recordAnswer(q, correct, false);
    s.earned += res.gained + res.streakBonus + res.masteryBonus;

    const btns = document.querySelectorAll('#qcard .choice');
    btns.forEach(b => { b.disabled = true; b.classList.add('locked'); });
    btns[q.answerIndex].classList.add('correct');
    if (!correct) btns[i].classList.add('wrong');

    // floating +points animation (R3.2)
    if (correct) {
      const f = document.createElement('div');
      f.className = 'float-pts';
      f.textContent = '+' + (res.gained + res.streakBonus + res.masteryBonus);
      btns[q.answerIndex].appendChild(f);
      if (res.streakBonus) Mascot.say('🔥 ' + Store.state.streak + ' in a row! +' + res.streakBonus + ' streak bonus!', 2600);
      else Mascot.react(true);
    } else {
      Mascot.react(false);
    }

    const ex = document.getElementById('explanation');
    ex.innerHTML = '<b>' + (correct ? '✅ Correct!' : '❌ The right answer is: ' + esc(q.choices[q.answerIndex])) + '</b><br>' + esc(q.explanation);
    ex.classList.remove('hidden');
    document.getElementById('quiz-actions').classList.remove('hidden');
  },

  next() {
    const s = this.session;
    s.idx++;
    s.answered = false;
    if (s.idx >= s.qs.length) return this.summary();
    this.render();
  },

  summary() {
    const s = this.session;
    const pct = Math.round((s.correct / s.qs.length) * 100);
    const host = document.getElementById('view-quiz');
    if (pct >= 80) Confetti.burst(80);
    host.innerHTML =
      '<div class="card summary-card pop-in">' +
      '<div class="summary-ring ' + (pct >= 80 ? 'good' : pct >= 50 ? 'mid' : 'low') + '"><span>' + pct + '%</span></div>' +
      '<h2>' + this.MODE_TITLES[s.mode] + ' complete!</h2>' +
      '<p class="summary-line">You got <b>' + s.correct + ' of ' + s.qs.length + '</b> right and earned <b class="accent">+' + s.earned + ' points</b> ⭐</p>' +
      '<div class="summary-actions">' +
      '<button class="btn primary" onclick="Quiz.start(\'' + s.mode + '\'' + (s.topicId ? ', \'' + s.topicId + '\'' : '') + ')">Play Again</button>' +
      '<button class="btn ghost" onclick="App.show(\'study\')">Back to Study</button>' +
      '<button class="btn ghost" onclick="App.show(\'home\')">Home</button>' +
      '</div></div>';
    Mascot.say(pct >= 80 ? 'Wonderful score! 🎉' : 'Good practice! Review the misses and try again — I know you can beat it!', 3800);
  },

  quit() {
    this.session = null;
    App.show('study');
  }
};
