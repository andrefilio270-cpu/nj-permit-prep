// js/storage.js — global state, persistence (localStorage) and the points engine.
// Loaded by index.html before every other js/ module; consumed via the globals TOPICS, Store, shuffle, esc.

const TOPICS = [
  { id: 'signs', name: 'Road Signs', icon: '🛑' },
  { id: 'laws', name: 'Traffic Laws & Rules', icon: '🚦' },
  { id: 'speed', name: 'Speed Limits & Parking', icon: '🅿️' },
  { id: 'alcohol', name: 'Alcohol, Drugs & DUI', icon: '🚫' },
  { id: 'safe', name: 'Safe & Defensive Driving', icon: '🛡️' },
  { id: 'sharing', name: 'Sharing the Road', icon: '🚌' },
  { id: 'license', name: 'Licenses & Penalties', icon: '🪪' },
  { id: 'emergency', name: 'Emergencies & Conditions', icon: '⚠️' }
];

const POINTS = { easy: 10, medium: 20, hard: 30 };
const EXAM_MULTIPLIER = 1.5;      // R6.2 — +50% during Exam Simulation
const STREAK_EVERY = 5;           // R6.2 — every 5 consecutive correct answers...
const STREAK_BONUS = 25;          // ...+25 bonus points
const BONUS_PASS = 500;           // R6.3 — pass a simulation (>= 80%)
const BONUS_PERFECT = 1000;       // R6.3 — perfect simulation score
const BONUS_MASTERY = 300;        // R6.3 — complete a topic with >= 80% accuracy

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const Store = {
  KEY: 'njpp_state_v1',
  state: null,

  defaults() {
    return {
      points: 0,
      answered: {},      // qid -> { seen, correct }
      perTopic: {},      // topicId -> { answered, correct }
      mistakes: [],      // qids currently wrong (cleared when re-answered right) — R5.4
      rewards: [],       // { id, title, cost, claimed, celebrated } — R7
      examHistory: [],   // { date, score, total, passed } — R9.3
      streak: 0,
      bestStreak: 0,
      tourSeen: false,   // R8.3
      mastery: {}        // topicId -> true once the +300 bonus was granted
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this.state = raw ? Object.assign(this.defaults(), JSON.parse(raw)) : this.defaults();
    } catch (e) {
      this.state = this.defaults();
    }
    return this.state;
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.state)); } catch (e) { /* private mode */ }
  },

  reset() { this.state = this.defaults(); this.save(); },

  bank() { return window.QUESTION_BANK || []; },
  questionsByTopic(topicId) { return this.bank().filter(q => q.topic === topicId); },

  // Flat point grants (exam pass/perfect bonuses etc.)
  addPoints(n) {
    if (!n || n <= 0) return;
    this.state.points += n;
    this.save();
    if (window.App) App.onPointsChanged(n);
  },

  // Record an objectively-graded answer (R6.1/R6.2). Returns { gained, streakBonus, masteryBonus }.
  recordAnswer(q, correct, inExam) {
    const s = this.state;
    const rec = s.answered[q.id] || (s.answered[q.id] = { seen: 0, correct: 0 });
    rec.seen++;
    const t = s.perTopic[q.topic] || (s.perTopic[q.topic] = { answered: 0, correct: 0 });
    t.answered++;

    let gained = 0, streakBonus = 0, masteryBonus = 0;
    if (correct) {
      rec.correct++;
      t.correct++;
      s.streak++;
      if (s.streak > s.bestStreak) s.bestStreak = s.streak;
      gained = POINTS[q.difficulty] || POINTS.easy;
      if (inExam) gained = Math.round(gained * EXAM_MULTIPLIER);
      if (s.streak % STREAK_EVERY === 0) streakBonus = STREAK_BONUS;
      const i = s.mistakes.indexOf(q.id);
      if (i >= 0) s.mistakes.splice(i, 1);            // R5.4 — leaves the list when re-answered right
      masteryBonus = this.checkMastery(q.topic);
    } else {
      s.streak = 0;
      if (s.mistakes.indexOf(q.id) < 0) s.mistakes.push(q.id);
    }

    const total = gained + streakBonus + masteryBonus;
    if (total > 0) s.points += total;
    this.save();
    if (window.App && total > 0) App.onPointsChanged(total);
    return { gained, streakBonus, masteryBonus };
  },

  // R6.3 — topic mastery: every question of the topic seen at least once AND accuracy >= 80%
  checkMastery(topicId) {
    const s = this.state;
    if (s.mastery[topicId]) return 0;
    const qs = this.questionsByTopic(topicId);
    if (!qs.length) return 0;
    const allSeen = qs.every(q => s.answered[q.id] && s.answered[q.id].seen > 0);
    if (!allSeen) return 0;
    const t = s.perTopic[topicId];
    const acc = t && t.answered ? t.correct / t.answered : 0;
    if (acc < 0.8) return 0;
    s.mastery[topicId] = true;
    if (window.Confetti) Confetti.burst(140);        // R3.3 — celebrate completing a topic
    if (window.Mascot) Mascot.say('Topic mastered! +' + BONUS_MASTERY + ' bonus points! 🎉', 5000);
    return BONUS_MASTERY;
  },

  totals() {
    let a = 0, c = 0;
    Object.keys(this.state.perTopic).forEach(k => {
      a += this.state.perTopic[k].answered;
      c += this.state.perTopic[k].correct;
    });
    return { answered: a, correct: c };
  },

  accuracy() {
    const t = this.totals();
    return t.answered ? Math.round((t.correct / t.answered) * 100) : 0;
  },

  uniqueSeen() {
    return Object.keys(this.state.answered).length;
  }
};
