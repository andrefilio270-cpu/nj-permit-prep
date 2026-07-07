// js/mascot.js — Bubbles, the pink support buddy (R8): idle SVG mascot, speech bubble,
// contextual tips per page, reactions, and the first-visit guided tour with spotlight.
// Loaded by index.html; used via the globals Mascot and Tour.

const Mascot = {
  el: null, bubble: null, hideTimer: null,

  SVG:
    '<svg viewBox="0 0 200 200" class="bubbles-svg" id="bubbles-svg" title="Click me for a tour!">' +
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

  // R8.4 — scripted contextual tip for each page
  TIPS: {
    home: 'This is your dashboard! See your points, your progress, and jump into any study mode. 💜',
    study: 'Pick how you want to study: by topic, quick quiz, flashcards, or reviewing your mistakes!',
    quiz: "Read each question carefully — I'll cheer for every right answer! ✨",
    exam: 'This is just like the real NJ test: 50 questions, you need 40 right. Deep breath — you got this!',
    signs: 'Shapes and colors have meaning! Octagon = stop, diamond = warning, blue = services.',
    rewards: 'Write a treat for yourself and how many points it takes. Then go earn it! 🎁',
    progress: "Here's how you're doing: accuracy per topic, your streaks, and every exam you took.",
    flashcards: 'Flip the card to see the answer — and be honest about what you really knew! 😊'
  },

  PRAISE: ['Yes! Nailed it! 🎉', "Correct! You're on fire! 🔥", 'Amazing! Keep going! 💜', "That's right! So proud of you!", 'Woohoo! Another one! ⭐'],
  COMFORT: ['Almost! Read the explanation — it helps!', 'No worries, mistakes are how we learn! 💗', "You'll get it next time, I believe in you!", 'Tricky one! It will come back in Mistake Review.'],

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

  tip(view) {
    if (Tour.active) return;
    if (this.TIPS[view]) this.say(this.TIPS[view], 4200);
  },

  react(good) {
    const list = good ? this.PRAISE : this.COMFORT;
    this.say(list[(Math.random() * list.length) | 0], 2400);
    const svg = document.getElementById('bubbles-svg');
    svg.classList.remove('happy', 'sad');
    void svg.getBoundingClientRect();
    svg.classList.add(good ? 'happy' : 'sad');
    setTimeout(() => svg.classList.remove('happy', 'sad'), 1600);
  }
};

// R8.2 — first-visit guided tour: spotlight each area with Next/Back/Skip.
const Tour = {
  active: false,
  idx: 0,

  steps: [
    { target: null, text: "Hi! I'm <b>Bubbles</b> 💗 your study buddy! I'll show you around so you can start earning your New Jersey license. Ready?" },
    { target: '#points-pill', text: 'These are your <b>points</b>! Every correct answer earns points — harder questions are worth more (10/20/30), and the exam pays +50%!' },
    { target: '[data-view="study"]', text: 'The <b>Study</b> hub! Practice by topic, take a 10-question Quick Quiz, flip Flashcards, or re-try your past mistakes.' },
    { target: '[data-view="exam"]', text: 'The <b>Exam Simulation</b> — exactly like the real NJ MVC test: 50 questions, you pass with 40 correct (80%). Passing earns +500 points!' },
    { target: '[data-view="signs"]', text: 'The <b>Road Signs gallery</b> — every sign drawn with its real shape and color, organized by category. Great for visual review!' },
    { target: '[data-view="rewards"]', text: 'My favorite: <b>Rewards</b>! Write what YOU will treat yourself with (a dinner, a gift...) and how many points it costs. Reach it and celebrate! 🎉' },
    { target: '[data-view="progress"]', text: '<b>Progress</b> shows your accuracy per topic, your best streak, and the history of every exam simulation you took.' },
    { target: '#state-select', text: 'This site is set to <b>New Jersey</b> rules. Other states are coming later — everything you study here matches the NJ Driver Manual.' },
    { target: null, text: "That's everything! Click me anytime to see this tour again. Now let's go get that license! 🚗💨" }
  ],

  start() {
    this.active = true;
    this.idx = 0;
    document.getElementById('tour-overlay').classList.remove('hidden');
    this.show();
  },

  show() {
    const step = this.steps[this.idx];
    const spot = document.getElementById('tour-spotlight');
    const panel = document.getElementById('tour-panel');
    const tgt = step.target ? document.querySelector(step.target) : null;

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

    const last = this.idx === this.steps.length - 1;
    panel.innerHTML =
      '<div class="tour-mascot">' + Mascot.SVG.replace('id="bubbles-svg"', 'id="bubbles-tour"') + '</div>' +
      '<div class="tour-text">' + step.text + '</div>' +
      '<div class="tour-controls">' +
      '<span class="tour-dots">' + this.steps.map((s, i) => '<i class="' + (i === this.idx ? 'on' : '') + '"></i>').join('') + '</span>' +
      '<span class="tour-btns">' +
      (this.idx > 0 ? '<button class="btn ghost" onclick="Tour.back()">Back</button>' : '') +
      '<button class="btn ghost" onclick="Tour.end()">Skip</button>' +
      '<button class="btn primary" onclick="Tour.next()">' + (last ? "Let's go! 🚀" : 'Next') + '</button>' +
      '</span></div>';

    // place the panel: below the spotlight if there is room, else above / centered
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
    if (this.idx >= this.steps.length - 1) return this.end(true);
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
      Mascot.say("You're all set! Pick a study mode and let's go! 💜", 4000);
    }
  }
};
