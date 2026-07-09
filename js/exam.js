// js/exam.js — Exam Simulation (R5.2): 50 questions, pass with 40+ (80%), visible timer,
// no feedback during the test, full results + wrong-answer review. Bilingual via I18N (R11.2/R11.3).
// Loaded by index.html; used via the global Exam.

const Exam = {
  SIZE: 50,
  PASS: 40,
  session: null,
  timerInt: null,

  renderIntro() {
    const host = document.getElementById('view-exam');
    const hist = Store.state.examHistory;
    const last = hist.length ? hist[hist.length - 1] : null;
    host.innerHTML =
      '<div class="card exam-intro pop-in">' +
      '<div class="exam-badge">📝</div>' +
      '<h1>' + I18N.t('exam_title') + '</h1>' +
      '<p class="sub">' + I18N.t('exam_sub') + '</p>' +
      '<div class="exam-rules">' +
      '<div class="rule"><b>50</b><span>' + I18N.t('rule_questions') + '</span></div>' +
      '<div class="rule"><b>40+</b><span>' + I18N.t('rule_pass') + '</span></div>' +
      '<div class="rule"><b>×1.5</b><span>' + I18N.t('rule_points') + '</span></div>' +
      '<div class="rule"><b>+500</b><span>' + I18N.t('rule_bonus') + '</span></div>' +
      '</div>' +
      '<p class="exam-note">' + I18N.t('exam_note') + '</p>' +
      (last ? '<p class="exam-last">' + I18N.t('exam_last') + ' <b>' + last.score + '/' + last.total + '</b> — ' +
        (last.passed ? '<span class="pass">' + I18N.t('passed_label') + '</span>' : '<span class="fail">' + I18N.t('failed_label') + '</span>') + '</p>' : '') +
      '<button class="btn primary big" onclick="Exam.start()">' + I18N.t('start_exam') + '</button>' +
      '</div>';
  },

  start() {
    const qs = shuffle(Store.bank().slice()).slice(0, this.SIZE);
    this.session = { qs, idx: 0, answers: new Array(qs.length).fill(null), start: Date.now(), done: false };
    clearInterval(this.timerInt);
    this.timerInt = setInterval(() => this.tickTimer(), 1000);
    this.render();
  },

  tickTimer() {
    const el = document.getElementById('exam-timer');
    if (!el || !this.session || this.session.done) return;
    const sec = Math.floor((Date.now() - this.session.start) / 1000);
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    el.textContent = m + ':' + s;
  },

  render() {
    const s = this.session;
    const q = s.qs[s.idx];
    const host = document.getElementById('view-exam');
    const answered = s.answers.filter(a => a !== null).length;
    const pct = Math.round((answered / s.qs.length) * 100);
    const choices = I18N.qChoices(q);

    host.innerHTML =
      '<div class="quiz-head pop-in">' +
      '<button class="btn ghost" onclick="Exam.quit()">' + I18N.t('quit') + '</button>' +
      '<div class="exam-timer-box">⏱ <span id="exam-timer">--:--</span></div>' +
      '<div class="quiz-count">' + (s.idx + 1) + ' / ' + s.qs.length + '</div></div>' +
      '<div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="card question-card pop-in">' +
      (q.sign && window.SIGN_SVGS && SIGN_SVGS[q.sign] ? '<div class="sign-box">' + SIGN_SVGS[q.sign] + '</div>' : '') +
      '<h2 class="question-text">' + esc(I18N.qText(q)) + '</h2>' +
      '<div class="choices">' +
      choices.map((c, i) =>
        '<button class="choice ' + (s.answers[s.idx] === i ? 'selected' : '') + '" onclick="Exam.select(' + i + ')">' +
        '<span class="choice-letter">' + 'ABCD'[i] + '</span>' + esc(c) + '</button>').join('') +
      '</div>' +
      '<div class="exam-nav">' +
      (s.idx > 0 ? '<button class="btn ghost" onclick="Exam.prev()">' + I18N.t('prev') + '</button>' : '<span></span>') +
      (s.idx < s.qs.length - 1
        ? '<button class="btn primary" onclick="Exam.next()">' + I18N.t('next') + '</button>'
        : '<button class="btn primary big" onclick="Exam.finish()">' + I18N.t('finish_exam') + '</button>') +
      '</div>' +
      '<p class="exam-answered">' + I18N.t('answered_line', { a: answered, n: s.qs.length }) + '</p>' +
      '</div>';
    this.tickTimer();
  },

  select(i) {
    this.session.answers[this.session.idx] = i;
    if (this.session.idx < this.session.qs.length - 1) {
      this.session.idx++;
    }
    this.render();
  },

  prev() { if (this.session.idx > 0) { this.session.idx--; this.render(); } },
  next() { if (this.session.idx < this.session.qs.length - 1) { this.session.idx++; this.render(); } },

  finish() {
    const s = this.session;
    const missing = s.answers.filter(a => a === null).length;
    if (missing > 0 && !confirm(I18N.t('unanswered_confirm', { n: missing }))) return;

    s.done = true;
    clearInterval(this.timerInt);

    let score = 0, earned = 0;
    const wrong = [];
    s.qs.forEach((q, i) => {
      const ok = s.answers[i] === q.answerIndex;
      if (ok) score++;
      else wrong.push({ q, given: s.answers[i] });
      const res = Store.recordAnswer(q, ok, true);      // R6.2 — exam multiplier
      earned += res.gained + res.streakBonus + res.masteryBonus;
    });

    const passed = score >= this.PASS;
    let bonus = 0;
    if (score === s.qs.length) { bonus = BONUS_PERFECT; }   // R6.3
    else if (passed) { bonus = BONUS_PASS; }
    if (bonus) { Store.addPoints(bonus); earned += bonus; }

    const now = new Date();
    Store.state.examHistory.push({
      date: now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      score, total: s.qs.length, passed
    });
    Store.save();

    const sec = Math.floor((Date.now() - s.start) / 1000);
    const time = Math.floor(sec / 60) + 'm ' + (sec % 60) + 's';
    this.results(score, passed, earned, bonus, time, wrong);
  },

  results(score, passed, earned, bonus, time, wrong) {
    const host = document.getElementById('view-exam');
    if (passed) Confetti.burst(200);                          // R3.3
    Mascot.say(passed ? I18N.t('exam_pass_mascot') : I18N.t('exam_fail_mascot'), 5000);

    host.innerHTML =
      '<div class="card summary-card pop-in">' +
      '<div class="summary-ring big-ring ' + (passed ? 'good' : 'low') + '"><span>' + score + '/' + this.SIZE + '</span></div>' +
      '<h1 class="' + (passed ? 'pass' : 'fail') + '">' + (passed ? I18N.t('exam_passed_title') : I18N.t('exam_failed_title')) + '</h1>' +
      '<p class="summary-line">' + I18N.t('time_label') + ': <b>' + time + '</b> · ' + I18N.t('earned_label') + ': <b class="accent">+' + earned + ' ' + I18N.t('pts') + '</b>' +
      (bonus ? I18N.t('includes_bonus', { b: bonus, kind: I18N.t(bonus === BONUS_PERFECT ? 'kind_perfect' : 'kind_pass') }) : '') + '</p>' +
      '<div class="summary-actions">' +
      '<button class="btn primary" onclick="Exam.renderIntro()">' + I18N.t('try_again') + '</button>' +
      '<button class="btn ghost" onclick="App.show(\'home\')">' + I18N.t('btn_home') + '</button></div>' +
      (wrong.length ?
        '<div class="wrong-review"><h3>' + I18N.t('review_misses', { n: wrong.length }) + '</h3>' +
        wrong.map(w =>
          '<div class="wrong-item">' +
          (w.q.sign && window.SIGN_SVGS && SIGN_SVGS[w.q.sign] ? '<div class="sign-box small">' + SIGN_SVGS[w.q.sign] + '</div>' : '') +
          '<p class="wq">' + esc(I18N.qText(w.q)) + '</p>' +
          '<p class="wa">' + I18N.t('your_answer') + ' <span class="fail">' + (w.given === null ? I18N.t('blank') : esc(I18N.qChoices(w.q)[w.given])) + '</span></p>' +
          '<p class="wc">' + I18N.t('correct_label') + ' <span class="pass">' + esc(I18N.qChoices(w.q)[w.q.answerIndex]) + '</span></p>' +
          '<p class="we">' + esc(I18N.qExpl(w.q)) + '</p></div>').join('') +
        '</div>' : '<p class="exam-note">' + I18N.t('perfect_note') + '</p>') +
      '</div>';
    this.session = null;
  },

  quit() {
    if (this.session && !this.session.done && !confirm(I18N.t('quit_exam_confirm'))) return;
    clearInterval(this.timerInt);
    this.session = null;
    App.show('home');
  }
};
