// js/progress.js — Progress page (R9.3): overall stats, accuracy per topic, exam history,
// streaks, and double-confirm reset (R9.5). Bilingual via I18N (R11.2).
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
        '<span class="topic-row-name">' + t.icon + ' ' + esc(I18N.topicName(t)) + (s.mastery[t.id] ? ' <span class="mastered">' + I18N.t('mastered') + '</span>' : '') + '</span>' +
        '<div class="topic-row-bars">' +
        '<div class="bar mini"><div class="bar-fill" style="width:' + tAcc + '%"></div></div>' +
        '<span class="topic-row-stats">' + (answered ? I18N.t('acc_label', { p: tAcc }) : I18N.t('not_started')) + ' · ' + I18N.t('seen_label', { s: tSeen, n: qCount }) + '</span>' +
        '</div></div>';
    }).join('');

    const hist = s.examHistory.slice().reverse();
    const histRows = hist.length
      ? '<table class="exam-table"><tr><th>' + I18N.t('th_date') + '</th><th>' + I18N.t('th_score') + '</th><th>' + I18N.t('th_result') + '</th></tr>' +
        hist.map(h => '<tr><td>' + esc(h.date) + '</td><td>' + h.score + '/' + h.total + '</td>' +
          '<td class="' + (h.passed ? 'pass' : 'fail') + '">' + (h.passed ? I18N.t('passed_label') : I18N.t('hist_failed')) + '</td></tr>').join('') +
        '</table>'
      : '<p class="empty-note">' + I18N.t('no_exams') + '</p>';

    host.innerHTML =
      '<div class="pop-in"><h1>' + I18N.t('progress_title') + '</h1>' +
      '<div class="stats-grid">' +
      '<div class="card stat"><b>' + s.points + '</b><span>' + I18N.t('stat_points') + '</span></div>' +
      '<div class="card stat"><b>' + totals.answered + '</b><span>' + I18N.t('stat_answers') + '</span></div>' +
      '<div class="card stat"><b>' + acc + '%</b><span>' + I18N.t('stat_accuracy') + '</span></div>' +
      '<div class="card stat"><b>' + coverage + '%</b><span>' + I18N.t('stat_coverage', { n: bankSize }) + '</span></div>' +
      '<div class="card stat"><b>' + s.streak + '</b><span>' + I18N.t('stat_streak') + '</span></div>' +
      '<div class="card stat"><b>' + s.bestStreak + '</b><span>' + I18N.t('stat_best') + '</span></div>' +
      '</div>' +
      '<div class="card"><h3>' + I18N.t('acc_by_topic') + '</h3>' + topicRows + '</div>' +
      '<div class="card"><h3>' + I18N.t('exam_history') + '</h3>' + histRows + '</div>' +
      '<div class="card danger-zone"><h3>' + I18N.t('reset_title') + '</h3>' +
      '<p>' + I18N.t('reset_text') + '</p>' +
      '<button class="btn danger" onclick="Progress.reset()">' + I18N.t('reset_btn') + '</button></div>' +
      '</div>';
  },

  // R9.5 — double confirmation
  reset() {
    if (!confirm(I18N.t('reset_c1'))) return;
    if (!confirm(I18N.t('reset_c2'))) return;
    const lang = Store.state.lang;      // keep the language choice across resets
    Store.reset();
    Store.state.lang = lang;
    Store.save();
    App.refreshPointsPill();
    this.render();
    Mascot.say(I18N.t('reset_done'), 3600);
  }
};
