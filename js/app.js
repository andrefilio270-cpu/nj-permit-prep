// js/app.js — SPA router (R9.1), dashboard (R9.2), study hub (R5), state selector (R9.4),
// animated points pill (R6.4) and boot sequence (first-visit tour, R8.2).
// Loaded last by index.html; used via the global App.

const App = {
  current: 'home',

  STATES: ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],

  init() {
    Store.load();
    Confetti.init();
    Mascot.init();

    // R9.4 — state selector: only New Jersey enabled, the rest "coming soon"
    const sel = document.getElementById('state-select');
    sel.innerHTML = this.STATES.map(s =>
      '<option value="' + s + '"' + (s === 'New Jersey' ? ' selected' : ' disabled') + '>' +
      s + (s === 'New Jersey' ? '' : ' — soon') + '</option>').join('');
    sel.addEventListener('change', () => { sel.value = 'New Jersey'; });
    sel.addEventListener('click', () => {
      if (!Tour.active) Mascot.say('Only New Jersey is ready for now — more states coming soon! 🗺', 3000);
    });

    // nav
    document.querySelectorAll('#main-nav [data-view]').forEach(b =>
      b.addEventListener('click', () => this.show(b.getAttribute('data-view'))));
    document.getElementById('tour-btn').addEventListener('click', () => Tour.start());

    this.refreshPointsPill();
    this.show('home');

    // R8.2 — guided tour on first visit
    if (!Store.state.tourSeen) {
      setTimeout(() => Tour.start(), 900);
    } else {
      setTimeout(() => Mascot.say('Welcome back! Ready to study? 💜', 3200), 700);
    }
  },

  show(view) {
    this.current = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById('view-' + view);
    if (el) el.classList.add('active');
    document.querySelectorAll('#main-nav [data-view]').forEach(b =>
      b.classList.toggle('active', b.getAttribute('data-view') === view));

    if (view === 'home') this.renderHome();
    else if (view === 'study') this.renderStudy();
    else if (view === 'exam') Exam.renderIntro();
    else if (view === 'signs') this.renderSigns();
    else if (view === 'rewards') Rewards.render();
    else if (view === 'progress') Progress.render();
    else if (view === 'flashcards') Cards.renderPicker();

    if (view !== 'quiz') Mascot.tip(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // R6.4 — animated count-up on the always-visible points pill
  refreshPointsPill() {
    document.getElementById('points-value').textContent = Store.state.points;
  },

  onPointsChanged(delta) {
    const el = document.getElementById('points-value');
    const target = Store.state.points;
    const from = target - delta;
    const t0 = performance.now(), dur = 650;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    const pill = document.getElementById('points-pill');
    pill.classList.remove('pulse');
    void pill.offsetWidth;
    pill.classList.add('pulse');
    Rewards.checkUnlocks();          // R7.3
    if (this.current === 'home') this.renderHome();
  },

  // R9.2 — dashboard
  renderHome() {
    const host = document.getElementById('view-home');
    const s = Store.state;
    const bankSize = Store.bank().length;
    const seen = Store.uniqueSeen();
    const coverage = bankSize ? Math.round((seen / bankSize) * 100) : 0;
    const acc = Store.accuracy();
    const mistakes = s.mistakes.length;

    // next reward closest to unlocking (R9.2)
    const pending = s.rewards.filter(r => !r.claimed && s.points < r.cost)
      .sort((a, b) => (a.cost - s.points) - (b.cost - s.points))[0];
    const unlocked = s.rewards.filter(r => !r.claimed && s.points >= r.cost)[0];

    host.innerHTML =
      '<div class="hero pop-in">' +
      '<h1>Let\'s get that <span class="grad-text">license</span>! 🚗</h1>' +
      '<p class="sub">Your New Jersey Knowledge Test prep — study, earn points, win your own rewards.</p>' +
      '<div class="hero-stats">' +
      '<div class="hero-stat"><b>' + s.points + '</b><span>points ⭐</span></div>' +
      '<div class="hero-stat"><b>' + acc + '%</b><span>accuracy</span></div>' +
      '<div class="hero-stat"><b>' + s.bestStreak + '</b><span>best streak 🔥</span></div>' +
      '</div>' +
      '<div class="coverage"><span>Question bank explored: ' + seen + '/' + bankSize + '</span>' +
      '<div class="bar"><div class="bar-fill" style="width:' + coverage + '%"></div></div></div>' +
      '</div>' +

      (unlocked
        ? '<div class="card reward-banner pop-in" onclick="App.show(\'rewards\')">🎉 <b>"' + esc(unlocked.title) + '"</b> is unlocked — go claim it!</div>'
        : pending
          ? '<div class="card reward-banner pop-in" onclick="App.show(\'rewards\')">🎁 Next reward: <b>"' + esc(pending.title) + '"</b> — only <b>' + (pending.cost - s.points) + ' pts</b> to go!</div>'
          : '<div class="card reward-banner pop-in" onclick="App.show(\'rewards\')">🎁 Create your first <b>reward</b> — decide what you\'ll win with your points!</div>') +

      '<div class="grid modes-grid">' +
      '<button class="card mode-card pop-in" onclick="App.show(\'study\')"><span class="mode-icon">📚</span><b>Practice by Topic</b><span>Instant feedback + explanations</span></button>' +
      '<button class="card mode-card pop-in" onclick="Quiz.start(\'quick\')"><span class="mode-icon">⚡</span><b>Quick Quiz</b><span>10 random questions, fast</span></button>' +
      '<button class="card mode-card pop-in" onclick="App.show(\'exam\')"><span class="mode-icon">📝</span><b>Exam Simulation</b><span>50 questions — the real deal</span></button>' +
      '<button class="card mode-card pop-in" onclick="App.show(\'flashcards\')"><span class="mode-icon">🃏</span><b>Flashcards</b><span>Flip &amp; memorize</span></button>' +
      '<button class="card mode-card pop-in" onclick="Quiz.start(\'mistakes\')"><span class="mode-icon">🔁</span><b>Mistake Review</b><span>' + (mistakes ? mistakes + ' to fix — beat them!' : 'Nothing to fix — nice!') + '</span></button>' +
      '<button class="card mode-card pop-in" onclick="App.show(\'signs\')"><span class="mode-icon">🛑</span><b>Road Signs</b><span>Visual gallery by category</span></button>' +
      '</div>';
  },

  // R5 — study hub
  renderStudy() {
    const host = document.getElementById('view-study');
    const mistakes = Store.state.mistakes.length;
    host.innerHTML =
      '<div class="pop-in"><h1>Study Modes 📚</h1>' +
      '<div class="grid modes-grid">' +
      '<button class="card mode-card" onclick="Quiz.start(\'quick\')"><span class="mode-icon">⚡</span><b>Quick Quiz</b><span>10 random questions</span></button>' +
      '<button class="card mode-card" onclick="App.show(\'flashcards\')"><span class="mode-icon">🃏</span><b>Flashcards</b><span>Flip &amp; memorize</span></button>' +
      '<button class="card mode-card" onclick="Quiz.start(\'mistakes\')"><span class="mode-icon">🔁</span><b>Mistake Review</b><span>' + (mistakes ? mistakes + ' waiting for revenge' : 'Empty — great job!') + '</span></button>' +
      '<button class="card mode-card" onclick="App.show(\'exam\')"><span class="mode-icon">📝</span><b>Exam Simulation</b><span>The full 50-question test</span></button>' +
      '</div>' +
      '<h2 class="section-title">Practice by Topic</h2>' +
      '<div class="grid topics-grid">' +
      TOPICS.map(t => {
        const qs = Store.questionsByTopic(t.id);
        const pt = Store.state.perTopic[t.id];
        const acc = pt && pt.answered ? Math.round((pt.correct / pt.answered) * 100) : null;
        const seen = qs.filter(q => Store.state.answered[q.id]).length;
        return '<button class="card topic-card" onclick="Quiz.start(\'topic\', \'' + t.id + '\')">' +
          '<span class="topic-icon">' + t.icon + '</span><b>' + esc(t.name) + (Store.state.mastery[t.id] ? ' ★' : '') + '</b>' +
          '<span class="topic-sub">' + qs.length + ' questions · ' + seen + ' seen' + (acc !== null ? ' · ' + acc + '%' : '') + '</span>' +
          '<div class="bar mini"><div class="bar-fill" style="width:' + (qs.length ? Math.round((seen / qs.length) * 100) : 0) + '%"></div></div>' +
          '</button>';
      }).join('') +
      '</div></div>';
  },

  // R5.6 — signs gallery
  renderSigns() {
    const host = document.getElementById('view-signs');
    const cats = [
      { id: 'regulatory', label: 'Regulatory — what you MUST do', emoji: '⛔' },
      { id: 'warning', label: 'Warning — what\'s ahead', emoji: '⚠️' },
      { id: 'guide', label: 'Guide & Services', emoji: '🧭' }
    ];
    host.innerHTML =
      '<div class="pop-in"><h1>Road Signs Gallery 🛑</h1>' +
      '<p class="sub">Every sign drawn with its real shape and color. Shapes and colors are test questions too!</p>' +
      cats.map(c =>
        '<h2 class="section-title">' + c.emoji + ' ' + c.label + '</h2>' +
        '<div class="grid signs-grid">' +
        SIGNS_META.filter(m => m.category === c.id).map(m =>
          '<div class="card sign-card"><div class="sign-box">' + SIGN_SVGS[m.key] + '</div>' +
          '<b>' + esc(m.name) + '</b><p>' + esc(m.meaning) + '</p></div>').join('') +
        '</div>').join('') +
      '</div>';
  }
};

// Top-level const bindings are not window properties; expose the globals other
// modules guard against (window.App, window.Mascot, ...) explicitly.
window.App = App; window.Store = Store; window.TOPICS = TOPICS;
window.Quiz = Quiz; window.Exam = Exam; window.Cards = Cards;
window.Rewards = Rewards; window.Progress = Progress;
window.Mascot = Mascot; window.Tour = Tour; window.Confetti = Confetti;

document.addEventListener('DOMContentLoaded', () => App.init());
