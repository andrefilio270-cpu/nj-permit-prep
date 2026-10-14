// js/mascot.js — Bubbles, the pink support buddy (R8): idle SVG mascot, speech bubble,
// contextual tips per page (via I18N — R11.2), reactions, and the guided tour with spotlight.
// Loaded by index.html; used via the globals Mascot and Tour.

const Mascot = {
  el: null, bubble: null, hideTimer: null,

  SVG:
    '<svg viewBox="0 0 200 200" class="bubbles-svg" id="bubbles-svg" title="Tour!">' +
    '<defs><radialGradient id="bubblesBody" cx="50%" cy="38%" r="70%">' +
    '<stop offset="0%" stop-color="#ffc9ea"/><stop offset="65%" stop-color="#ff8fd8"/><stop offset="100%" stop-color="#ef6bbd"/>' +
    '</radialGradient></defs>' +
    '<ellipse cx="66" cy="46" rx="17" ry="22" fill="#ff8fd8"/>' +
    '<ellipse cx="134" cy="46" rx="17" ry="22" fill="#ff8fd8"/>' +
    '<ellipse cx="100" cy="112" rx="74" ry="68" fill="url(#bubblesBody)"/>' +
    '<ellipse class="bubbles-arm" cx="34" cy="124" rx="13" ry="9" fill="#ff8fd8"/>' +
    '<ellipse class="bubbles-arm" cx="166" cy="124" rx="13" ry="9" fill="#ff8fd8"/>' +
    '<g class="bubbles-eyes">' +
    '<circle cx="74" cy="102" r="15" fill="#ffffff"/><circle cx="126" cy="102" r="15" fill="#ffffff"/>' +
    '<circle cx="77" cy="105" r="8" fill="#3b0764"/><circle cx="123" cy="105" r="8" fill="#3b0764"/>' +
    '<circle cx="80" cy="101" r="3" fill="#ffffff"/><circle cx="126" cy="101" r="3" fill="#ffffff"/>' +
    '</g>' +
    '<circle cx="56" cy="128" r="9" fill="#ff5db1" opacity="0.5"/>' +
    '<circle cx="144" cy="128" r="9" fill="#ff5db1" opacity="0.5"/>' +
    '<path class="mouth-happy" d="M84 134 Q100 150 116 134" stroke="#3b0764" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '<path class="mouth-sad" d="M86 146 Q100 132 114 146" stroke="#3b0764" stroke-width="5" fill="none" stroke-linecap="round"/>' +
    '</svg>',

  init() {
    this.el = document.getElementById('mascot');
    this.el.innerHTML = this.SVG + '<div class="mascot-bubble hidden" id="mascot-bubble"></div>';
    this.bubble = document.getElementById('mascot-bubble');
    // R8.3 — clicking the mascot replays the tour
    document.getElementById('bubbles-svg').addEventListener('click', () => Tour.start());
  },

  say(text, ms) {
    clearTimeout(this.hideTimer);
    this.bubble.innerHTML = text;
    this.bubble.classList.remove('hidden');
    this.bubble.classList.remove('pop');
    void this.bubble.offsetWidth;
    this.bubble.classList.add('pop');
    this.hideTimer = setTimeout(() => this.bubble.classList.add('hidden'), ms || 3600);
  },

  // R8.4 / R11.2 — scripted contextual tip per page, in the active language
  tip(view) {
    if (Tour.active) return;
    const key = 'tip_' + view;
    const s = I18N.t(key);
    if (s !== key) this.say(s, 4200);
  },

  react(good) {
    const list = I18N.t(good ? 'praise' : 'comfort');
    this.say(list[(Math.random() * list.length) | 0], 2400);
    const svg = document.getElementById('bubbles-svg');
    svg.classList.remove('happy', 'sad');
    void svg.getBoundingClientRect();
    svg.classList.add(good ? 'happy' : 'sad');
    setTimeout(() => svg.classList.remove('happy', 'sad'), 1600);
  }
};

// R8.2 / R11.2 — first-visit guided tour, fully bilingual (texts come from I18N at render time).
const Tour = {
  active: false,
  idx: 0,

  // targets only — the text of step i is I18N.t('tour_' + i)
  targets: [null, '#points-pill', '[data-view="study"]', '[data-view="exam"]', '[data-view="signs"]',
    '[data-view="rewards"]', '[data-view="progress"]', '#state-select', null],

  start() {
    this.active = true;
    this.idx = 0;
    document.getElementById('tour-overlay').classList.remove('hidden');
    this.show();
  },

  show() {
    const spot = document.getElementById('tour-spotlight');
    const panel = document.getElementById('tour-panel');
    const sel = this.targets[this.idx];
    const tgt = sel ? document.querySelector(sel) : null;

    if (tgt) {
      const r = tgt.getBoundingClientRect();
      spot.style.display = 'block';
      spot.style.left = (r.left - 10) + 'px';
      spot.style.top = (r.top - 10) + 'px';
      spot.style.width = (r.width + 20) + 'px';
      spot.style.height = (r.height + 20) + 'px';
    } else {
      spot.style.display = 'block';
      spot.style.left = '50%';
      spot.style.top = '38%';
      spot.style.width = '0px';
      spot.style.height = '0px';
    }

    const last = this.idx === this.targets.length - 1;
    panel.innerHTML =
      '<div class="tour-mascot">' + Mascot.SVG.replace('id="bubbles-svg"', 'id="bubbles-tour"') + '</div>' +
      '<div class="tour-text">' + I18N.t('tour_' + this.idx) + '</div>' +
      '<div class="tour-controls">' +
      '<span class="tour-dots">' + this.targets.map((s, i) => '<i class="' + (i === this.idx ? 'on' : '') + '"></i>').join('') + '</span>' +
      '<span class="tour-btns">' +
      (this.idx > 0 ? '<button class="btn ghost" onclick="Tour.back()">' + I18N.t('back') + '</button>' : '') +
      '<button class="btn ghost" onclick="Tour.end()">' + I18N.t('skip') + '</button>' +
      '<button class="btn primary" onclick="Tour.next()">' + (last ? I18N.t('lets_go') : I18N.t('next_btn')) + '</button>' +
      '</span></div>';

    const ph = 230;
    let top;
    if (tgt) {
      const r = tgt.getBoundingClientRect();
      top = r.bottom + 24 + ph < window.innerHeight ? r.bottom + 24 : Math.max(16, r.top - ph - 24);
    } else {
      top = window.innerHeight * 0.32;
    }
    panel.style.top = top + 'px';
  },

  next() {
    if (this.idx >= this.targets.length - 1) return this.end(true);
    this.idx++;
    this.show();
  },

  back() {
    if (this.idx > 0) { this.idx--; this.show(); }
  },

  end(finished) {
    this.active = false;
    document.getElementById('tour-overlay').classList.add('hidden');
    Store.state.tourSeen = true;   // R8.3
    Store.save();
    if (finished) {
      Confetti.burst(70);
      Mascot.say(I18N.t('tour_done'), 4000);
    }
  }
};
