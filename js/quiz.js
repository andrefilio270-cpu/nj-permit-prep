// js/quiz.js — shared quiz engine with instant feedback (R5.1 Practice by Topic,
// R5.5 Quick Quiz, R5.4 Mistake Review). Bilingual via I18N (R11.2/R11.3).
// Loaded by index.html; used via the global Quiz.

const Quiz = {
  session: null,

  modeTitle(mode) { return I18N.t('mode_title_' + mode); },

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
        '<h2>' + I18N.t('empty_mistakes_title') + '</h2>' +
        '<p>' + I18N.t('empty_mistakes_text') + '</p>' +
        '<button class="btn primary" onclick="App.show(\'study\')">' + I18N.t('back_study') + '</button></div>';
      return;
    }

    this.session = { mode, topicId, qs, idx: 0, correct: 0, earned: 0, answered: false };
    this.render();
  },

  topicOf(q) {
    const t = TOPICS.filter(t => t.id === q.topic)[0];
    return t ? t : { name: q.topic, name_pt: q.topic, icon: '📘' };
  },

  render() {
    const s = this.session;
    const q = s.qs[s.idx];
    const t = this.topicOf(q);
    const host = document.getElementById('view-quiz');
    const pct = Math.round((s.idx / s.qs.length) * 100);
    const choices = I18N.qChoices(q);

    host.innerHTML =
      '<div class="quiz-head pop-in">' +
      '<button class="btn ghost" onclick="Quiz.quit()">' + I18N.t('quit') + '</button>' +
      '<div class="quiz-meta"><span class="chip">' + t.icon + ' ' + esc(I18N.topicName(t)) + '</span>' +
      '<span class="chip diff-' + q.difficulty + '">' + I18N.diff(q.difficulty) + ' · ' + (POINTS[q.difficulty] || 10) + ' pts</span></div>' +
      '<div class="quiz-count">' + (s.idx + 1) + ' / ' + s.qs.length + '</div></div>' +
      '<div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="card question-card pop-in" id="qcard">' +
      (q.sign && window.SIGN_SVGS && SIGN_SVGS[q.sign] ? '<div class="sign-box">' + SIGN_SVGS[q.sign] + '</div>' : '') +
      '<h2 class="question-text">' + esc(I18N.qText(q)) + '</h2>' +
      '<div class="choices">' +
      choices.map((c, i) =>
        '<button class="choice" data-i="' + i + '" onclick="Quiz.answer(' + i + ')">' +
        '<span class="choice-letter">' + 'ABCD'[i] + '</span>' + esc(c) + '</button>').join('') +
      '</div>' +
      '<div class="explanation hidden" id="explanation"></div>' +
      '<div class="quiz-actions hidden" id="quiz-actions">' +
      '<button class="btn primary big" onclick="Quiz.next()">' + (s.idx + 1 === s.qs.length ? I18N.t('see_results') : I18N.t('next_question')) + '</button>' +
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
      if (res.streakBonus) Mascot.say(I18N.t('streak_msg', { n: Store.state.streak, b: res.streakBonus }), 2600);
      else Mascot.react(true);
    } else {
      Mascot.react(false);
    }

    const ex = document.getElementById('explanation');
    ex.innerHTML = '<b>' + (correct ? I18N.t('correct_excl') : I18N.t('right_answer') + esc(I18N.qChoices(q)[q.answerIndex])) + '</b><br>' + esc(I18N.qExpl(q));
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
      '<h2>' + I18N.t('quiz_complete', { mode: this.modeTitle(s.mode) }) + '</h2>' +
      '<p class="summary-line">' + I18N.t('summary_line', { c: s.correct, n: s.qs.length, p: s.earned }) + '</p>' +
      '<div class="summary-actions">' +
      '<button class="btn primary" onclick="Quiz.start(\'' + s.mode + '\'' + (s.topicId ? ', \'' + s.topicId + '\'' : '') + ')">' + I18N.t('play_again') + '</button>' +
      '<button class="btn ghost" onclick="App.show(\'study\')">' + I18N.t('back_study') + '</button>' +
      '<button class="btn ghost" onclick="App.show(\'home\')">' + I18N.t('btn_home') + '</button>' +
      '</div></div>';
    Mascot.say(pct >= 80 ? I18N.t('good_score') : I18N.t('keep_trying'), 3800);
  },

  quit() {
    this.session = null;
    App.show('study');
  }
};
