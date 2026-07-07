// js/exam.js — Exam Simulation (R5.2): 50 questions, pass with 40+ (80%), visible timer,
// no feedback during the test, full results + wrong-answer review at the end.
// Loaded by index.html; used via the global Exam.

const Exam = {
  SIZE: 50,
  PASS: 40,
  session: null,
  timerInt: null,

  // Landing screen with the real-test rules
  renderIntro() {
    const host = document.getElementById('view-exam');
    const hist = Store.state.examHistory;
    const last = hist.length ? hist[hist.length - 1] : null;
    host.innerHTML =
      '<div class="card exam-intro pop-in">' +
      '<div class="exam-badge">📝</div>' +
      '<h1>Exam Simulation</h1>' +
      '<p class="sub">The real New Jersey MVC Knowledge Test format</p>' +
      '<div class="exam-rules">' +
      '<div class="rule"><b>50</b><span>questions</span></div>' +
      '<div class="rule"><b>40+</b><span>to pass (80%)</span></div>' +
      '<div class="rule"><b>×1.5</b><span>points per answer</span></div>' +
      '<div class="rule"><b>+500</b><span>bonus if you pass</span></div>' +
      '</div>' +
      '<p class="exam-note">No feedback during the exam — just like the real thing. Your time is tracked. Perfect score = <b>+1000</b> bonus! 🏆</p>' +
      (last ? '<p class="exam-last">Last attempt: <b>' + last.score + '/' + last.total + '</b> — ' + (last.passed ? '<span class="pass">PASSED ✅</span>' : '<span class="fail">not yet</span>') + '</p>' : '') +
      '<button class="btn primary big" onclick="Exam.start()">Start Exam</button>' +
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

    host.innerHTML =
      '<div class="quiz-head pop-in">' +
      '<button class="btn ghost" onclick="Exam.quit()">← Quit</button>' +
      '<div class="exam-timer-box">⏱ <span id="exam-timer">--:--</span></div>' +
      '<div class="quiz-count">Question ' + (s.idx + 1) + ' / ' + s.qs.length + '</div></div>' +
      '<div class="bar"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="card question-card pop-in">' +
      (q.sign && window.SIGN_SVGS && SIGN_SVGS[q.sign] ? '<div class="sign-box">' + SIGN_SVGS[q.sign] + '</div>' : '') +
      '<h2 class="question-text">' + esc(q.question) + '</h2>' +
      '<div class="choices">' +
      q.choices.map((c, i) =>
        '<button class="choice ' + (s.answers[s.idx] === i ? 'selected' : '') + '" onclick="Exam.select(' + i + ')">' +
        '<span class="choice-letter">' + 'ABCD'[i] + '</span>' + esc(c) + '</button>').join('') +
      '</div>' +
      '<div class="exam-nav">' +
      (s.idx > 0 ? '<button class="btn ghost" onclick="Exam.prev()">← Previous</button>' : '<span></span>') +
      (s.idx < s.qs.length - 1
        ? '<button class="btn primary" onclick="Exam.next()">Next →</button>'
        : '<button class="btn primary big" onclick="Exam.finish()">Finish Exam ✔</button>') +
      '</div>' +
      '<p class="exam-answered">' + answered + ' of ' + s.qs.length + ' answered</p>' +
      '</div>';
    this.tickTimer();
  },

  select(i) {
    this.session.answers[this.session.idx] = i;
    // auto-advance except on the last question
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
    if (missing > 0 && !confirm('You still have ' + missing + ' unanswered question(s). Unanswered questions count as wrong. Finish anyway?')) return;

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
    Mascot.say(passed ? 'YOU PASSED!!! I knew it! 🎉🚗' : "So close! Review the misses below — next time it's yours! 💜", 5000);

    host.innerHTML =
      '<div class="card summary-card pop-in">' +
      '<div class="summary-ring big-ring ' + (passed ? 'good' : 'low') + '"><span>' + score + '/' + this.SIZE + '</span></div>' +
      '<h1 class="' + (passed ? 'pass' : 'fail') + '">' + (passed ? 'PASSED! 🎉' : 'Not yet — keep going!') + '</h1>' +
      '<p class="summary-line">Time: <b>' + time + '</b> · Earned: <b class="accent">+' + earned + ' points</b>' +
      (bonus ? ' (includes <b>+' + bonus + '</b> ' + (bonus === BONUS_PERFECT ? 'PERFECT SCORE' : 'passing') + ' bonus!)' : '') + '</p>' +
      '<div class="summary-actions">' +
      '<button class="btn primary" onclick="Exam.renderIntro()">Try Again</button>' +
      '<button class="btn ghost" onclick="App.show(\'home\')">Home</button></div>' +
      (wrong.length ?
        '<div class="wrong-review"><h3>Review your ' + wrong.length + ' miss' + (wrong.length > 1 ? 'es' : '') + '</h3>' +
        wrong.map(w =>
          '<div class="wrong-item">' +
          (w.q.sign && window.SIGN_SVGS && SIGN_SVGS[w.q.sign] ? '<div class="sign-box small">' + SIGN_SVGS[w.q.sign] + '</div>' : '') +
          '<p class="wq">' + esc(w.q.question) + '</p>' +
          '<p class="wa">Your answer: <span class="fail">' + (w.given === null ? '(blank)' : esc(w.q.choices[w.given])) + '</span></p>' +
          '<p class="wc">Correct: <span class="pass">' + esc(w.q.choices[w.q.answerIndex]) + '</span></p>' +
          '<p class="we">' + esc(w.q.explanation) + '</p></div>').join('') +
        '</div>' : '<p class="exam-note">A perfect exam. Incredible! 🏆</p>') +
      '</div>';
    this.session = null;
  },

  quit() {
    if (this.session && !this.session.done && !confirm('Quit the exam? This attempt will not be saved.')) return;
    clearInterval(this.timerInt);
    this.session = null;
    App.show('home');
  }
};
