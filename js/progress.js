// js/progress.js — Progress page (R9.3): overall stats, accuracy per topic,
// exam history, current/best streak, and double-confirm progress reset (R9.5).
// Loaded by index.html; used via the global Progress.

const Progress = {
  render() {
    const host = document.getElementById('view-progress');
    const s = Store.state;
    const totals = Store.totals();
    const acc = Store.accuracy();
    const bankSize = Store.bank().length;
    const seen = Store.uniqueSeen();
    const coverage = bankSize ? Math.round((seen / bankSize) * 100) : 0;

    const topicRows = TOPICS.map(t => {
      const pt = s.perTopic[t.id];
      const answered = pt ? pt.answered : 0;
      const tAcc = pt && pt.answered ? Math.round((pt.correct / pt.answered) * 100) : 0;
      const qCount = Store.questionsByTopic(t.id).length;
      const tSeen = Store.questionsByTopic(t.id).filter(q => s.answered[q.id]).length;
      return '<div class="topic-row">' +
        '<span class="topic-row-name">' + t.icon + ' ' + esc(t.name) + (s.mastery[t.id] ? ' <span class="mastered">★ mastered</span>' : '') + '</span>' +
        '<div class="topic-row-bars">' +
        '<div class="bar mini"><div class="bar-fill" style="width:' + tAcc + '%"></div></div>' +
        '<span class="topic-row-stats">' + (answered ? tAcc + '% accuracy' : 'not started') + ' · ' + tSeen + '/' + qCount + ' seen</span>' +
        '</div></div>';
    }).join('');

    const hist = s.examHistory.slice().reverse();
    const histRows = hist.length
      ? '<table class="exam-table"><tr><th>Date</th><th>Score</th><th>Result</th></tr>' +
        hist.map(h => '<tr><td>' + esc(h.date) + '</td><td>' + h.score + '/' + h.total + '</td>' +
          '<td class="' + (h.passed ? 'pass' : 'fail') + '">' + (h.passed ? 'PASSED ✅' : 'failed') + '</td></tr>').join('') +
        '</table>'
      : '<p class="empty-note">No exam simulations yet — take one from the Exam tab!</p>';

    host.innerHTML =
      '<div class="pop-in"><h1>Your Progress 📈</h1>' +
      '<div class="stats-grid">' +
      '<div class="card stat"><b>' + s.points + '</b><span>total points</span></div>' +
      '<div class="card stat"><b>' + totals.answered + '</b><span>answers given</span></div>' +
      '<div class="card stat"><b>' + acc + '%</b><span>overall accuracy</span></div>' +
      '<div class="card stat"><b>' + coverage + '%</b><span>of the ' + bankSize + '-question bank seen</span></div>' +
      '<div class="card stat"><b>' + s.streak + '</b><span>current streak 🔥</span></div>' +
      '<div class="card stat"><b>' + s.bestStreak + '</b><span>best streak 🏅</span></div>' +
      '</div>' +
      '<div class="card"><h3>Accuracy by topic</h3>' + topicRows + '</div>' +
      '<div class="card"><h3>Exam history</h3>' + histRows + '</div>' +
      '<div class="card danger-zone"><h3>Reset</h3>' +
      '<p>Erases all points, stats, rewards and history. This cannot be undone.</p>' +
      '<button class="btn danger" onclick="Progress.reset()">Reset all progress</button></div>' +
      '</div>';
  },

  // R9.5 — double confirmation
  reset() {
    if (!confirm('Reset ALL progress? Points, stats, rewards and exam history will be erased.')) return;
    if (!confirm('Are you REALLY sure? There is no undo.')) return;
    Store.reset();
    App.refreshPointsPill();
    this.render();
    Mascot.say('Fresh start! Sometimes that\'s exactly what we need. Let\'s go! 💜', 3600);
  }
};
