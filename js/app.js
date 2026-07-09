// js/app.js — SPA router (R9.1), dashboard (R9.2), study hub (R5), state selector (R9.4),
// animated points pill (R6.4), language toggle (R11.1) and boot sequence.
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
    Chat.init();

    // R9.4 — state selector: only New Jersey enabled
    const sel = document.getElementById('state-select');
    sel.addEventListener('change', () => { sel.value = 'New Jersey'; });
    sel.addEventListener('click', () => {
      if (!Tour.active) Mascot.say(I18N.t('only_nj'), 3000);
    });

    // R11.1 — language toggle
    document.getElementById('lang-btn').addEventListener('click', () => {
      I18N.set(I18N.lang === 'pt' ? 'en' : 'pt');
      this.applyLang();
    });

    // nav
    document.querySelectorAll('#main-nav [data-view]').forEach(b =>
      b.addEventListener('click', () => this.show(b.getAttribute('data-view'))));
    document.getElementById('tour-btn').addEventListener('click', () => Tour.start());

    this.refreshPointsPill();
    this.applyLang();   // translates chrome + renders the current (home) view

    // R8.2 — guided tour on first visit
    if (!Store.state.tourSeen) {
      setTimeout(() => Tour.start(), 900);
    } else {
      setTimeout(() => Mascot.say(I18N.t('welcome_back'), 3200), 700);
    }
  },

  // R11.1/R11.2 — apply the active language to all static chrome and re-render
  applyLang() {
    const views = ['home', 'study', 'exam', 'signs', 'rewards', 'progress'];
    document.querySelectorAll('#main-nav [data-view]').forEach(b =>
      b.textContent = I18N.t('nav_' + b.getAttribute('data-view')));
    document.getElementById('tour-btn').textContent = I18N.t('nav_tour');
    document.getElementById('lang-btn').textContent = I18N.lang === 'pt' ? '🇧🇷 PT' : '🇺🇸 EN';

    const sel = document.getElementById('state-select');
    sel.innerHTML = this.STATES.map(s =>
      '<option value="' + s + '"' + (s === 'New Jersey' ? ' selected' : ' disabled') + '>' +
      s + (s === 'New Jersey' ? '' : I18N.t('soon')) + '</option>').join('');

    Chat.applyLang();
    if (Tour.active) Tour.show();
    // re-render the current view in the new language (quiz/exam sessions keep their state
    // and switch language on the next question render)
    if (views.indexOf(this.current) >= 0) this.show(this.current);
    else if (this.current === 'flashcards') this.show('flashcards');
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
    else if (view === 'exam') { if (!Exam.session || Exam.session.done) Exam.renderIntro(); else Exam.render(); }
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

    const pending = s.rewards.filter(r => !r.claimed && s.points < r.cost)
      .sort((a, b) => (a.cost - s.points) - (b.cost - s.points))[0];
    const unlocked = s.rewards.filter(r => !r.claimed && s.points >= r.cost)[0];

    host.innerHTML =
      '<div class="hero pop-in">' +
      '<h1>' + I18N.t('home_title') + '</h1>' +
      '<p class="sub">' + I18N.t('home_sub') + '</p>' +
      '<div class="hero-stats">' +
      '<div class="hero-stat"><b>' + s.points + '</b><span>' + I18N.t('home_points') + '</span></div>' +
      '<div class="hero-stat"><b>' + acc + '%</b><span>' + I18N.t('home_accuracy') + '</span></div>' +
      '<div class="hero-stat"><b>' + s.bestStreak + '</b><span>' + I18N.t('home_beststreak') + '</span></div>' +
      '</div>' +
      '<div class="coverage"><span>' + I18N.t('home_explored', { seen: seen, n: bankSize }) + '</span>' +
      '<div class="bar"><div class="bar-fill" style="width:' + coverage + '%"></div></div></div>' +
      '</div>' +

      (unlocked
        ? '<div class="card reward-banner pop-in" onclick="App.show(\'rewards\')">' + I18N.t('banner_unlocked', { title: esc(unlocked.title) }) + '</div>'
        : pending
          ? '<div class="card reward-banner pop-in" onclick="App.show(\'rewards\')">' + I18N.t('banner_next', { title: esc(pending.title), pts: pending.cost - s.points }) + '</div>'
          : '<div class="card reward-banner pop-in" onclick="App.show(\'rewards\')">' + I18N.t('banner_create') + '</div>') +

      '<div class="grid modes-grid">' +
      '<button class="card mode-card pop-in" onclick="App.show(\'study\')"><span class="mode-icon">📚</span><b>' + I18N.t('mode_practice') + '</b><span>' + I18N.t('mode_practice_sub') + '</span></button>' +
      '<button class="card mode-card pop-in" onclick="Quiz.start(\'quick\')"><span class="mode-icon">⚡</span><b>' + I18N.t('mode_quick') + '</b><span>' + I18N.t('mode_quick_sub') + '</span></button>' +
      '<button class="card mode-card pop-in" onclick="App.show(\'exam\')"><span class="mode-icon">📝</span><b>' + I18N.t('mode_exam') + '</b><span>' + I18N.t('mode_exam_sub') + '</span></button>' +
      '<button class="card mode-card pop-in" onclick="App.show(\'flashcards\')"><span class="mode-icon">🃏</span><b>' + I18N.t('mode_flash') + '</b><span>' + I18N.t('mode_flash_sub') + '</span></button>' +
      '<button class="card mode-card pop-in" onclick="Quiz.start(\'mistakes\')"><span class="mode-icon">🔁</span><b>' + I18N.t('mode_mistakes') + '</b><span>' + (mistakes ? I18N.t('mistakes_some', { n: mistakes }) : I18N.t('mistakes_none')) + '</span></button>' +
      '<button class="card mode-card pop-in" onclick="App.show(\'signs\')"><span class="mode-icon">🛑</span><b>' + I18N.t('mode_signs') + '</b><span>' + I18N.t('mode_signs_sub') + '</span></button>' +
      '</div>';
  },

  // R5 — study hub
  renderStudy() {
    const host = document.getElementById('view-study');
    const mistakes = Store.state.mistakes.length;
    host.innerHTML =
      '<div class="pop-in"><h1>' + I18N.t('study_title') + '</h1>' +
      '<div class="grid modes-grid">' +
      '<button class="card mode-card" onclick="Quiz.start(\'quick\')"><span class="mode-icon">⚡</span><b>' + I18N.t('mode_quick') + '</b><span>' + I18N.t('mode_quick_sub') + '</span></button>' +
      '<button class="card mode-card" onclick="App.show(\'flashcards\')"><span class="mode-icon">🃏</span><b>' + I18N.t('mode_flash') + '</b><span>' + I18N.t('mode_flash_sub') + '</span></button>' +
      '<button class="card mode-card" onclick="Quiz.start(\'mistakes\')"><span class="mode-icon">🔁</span><b>' + I18N.t('mode_mistakes') + '</b><span>' + (mistakes ? I18N.t('study_mistakes_some', { n: mistakes }) : I18N.t('study_mistakes_none')) + '</span></button>' +
      '<button class="card mode-card" onclick="App.show(\'exam\')"><span class="mode-icon">📝</span><b>' + I18N.t('mode_exam') + '</b><span>' + I18N.t('mode_exam_sub2') + '</span></button>' +
      '</div>' +
      '<h2 class="section-title">' + I18N.t('study_topics') + '</h2>' +
      '<div class="grid topics-grid">' +
      TOPICS.map(t => {
        const qs = Store.questionsByTopic(t.id);
        const pt = Store.state.perTopic[t.id];
        const acc = pt && pt.answered ? Math.round((pt.correct / pt.answered) * 100) : null;
        const seen = qs.filter(q => Store.state.answered[q.id]).length;
        return '<button class="card topic-card" onclick="Quiz.start(\'topic\', \'' + t.id + '\')">' +
          '<span class="topic-icon">' + t.icon + '</span><b>' + esc(I18N.topicName(t)) + (Store.state.mastery[t.id] ? ' ★' : '') + '</b>' +
          '<span class="topic-sub">' + I18N.t('q_count', { n: qs.length }) + ' · ' + I18N.t('seen_count', { s: seen }) + (acc !== null ? ' · ' + acc + '%' : '') + '</span>' +
          '<div class="bar mini"><div class="bar-fill" style="width:' + (qs.length ? Math.round((seen / qs.length) * 100) : 0) + '%"></div></div>' +
          '</button>';
      }).join('') +
      '</div></div>';
  },

  // R5.6 — signs gallery
  renderSigns() {
    const host = document.getElementById('view-signs');
    const cats = [
      { id: 'regulatory', label: I18N.t('cat_regulatory') },
      { id: 'warning', label: I18N.t('cat_warning') },
      { id: 'guide', label: I18N.t('cat_guide') }
    ];
    host.innerHTML =
      '<div class="pop-in"><h1>' + I18N.t('signs_title') + '</h1>' +
      '<p class="sub">' + I18N.t('signs_sub') + '</p>' +
      cats.map(c =>
        '<h2 class="section-title">' + c.label + '</h2>' +
        '<div class="grid signs-grid">' +
        SIGNS_META.filter(m => m.category === c.id).map(m =>
          '<div class="card sign-card"><div class="sign-box">' + SIGN_SVGS[m.key] + '</div>' +
          '<b>' + esc(I18N.signName(m)) + '</b><p>' + esc(I18N.signMeaning(m)) + '</p></div>').join('') +
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
window.I18N = I18N; window.Chat = Chat;

document.addEventListener('DOMContentLoaded', () => App.init());
