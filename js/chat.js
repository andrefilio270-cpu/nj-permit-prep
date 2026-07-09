// js/chat.js — "Ask Bubbles" (R11.4): offline Q&A over the question bank.
// No API, no backend: fuzzy keyword search across question/choices/explanation
// in BOTH languages, plus the road-sign library. Loaded by index.html; global Chat.

const Chat = {
  isOpen: false, greeted: false,

  init() {
    document.getElementById('chat-fab').addEventListener('click', () => this.toggle());
    document.getElementById('chat-close').addEventListener('click', () => this.toggle(false));
    document.getElementById('chat-send').addEventListener('click', () => this.submit());
    document.getElementById('chat-input').addEventListener('keydown', e => { if (e.key === 'Enter') this.submit(); });
    this.applyLang();
  },

  applyLang() {
    document.getElementById('chat-title').textContent = I18N.t('chat_title');
    document.getElementById('chat-input').placeholder = I18N.t('chat_ph');
    document.getElementById('chat-send').textContent = I18N.t('chat_send');
  },

  toggle(force) {
    this.isOpen = force !== undefined ? force : !this.isOpen;
    document.getElementById('chat-panel').classList.toggle('hidden', !this.isOpen);
    if (this.isOpen) {
      if (!this.greeted) { this.greeted = true; this.bot(esc(I18N.t('chat_hello'))); }
      document.getElementById('chat-input').focus();
    }
  },

  msg(html, who) {
    const box = document.getElementById('chat-msgs');
    const div = document.createElement('div');
    div.className = 'chat-msg ' + who;
    div.innerHTML = html;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  },
  bot(html) { this.msg(html, 'bot'); },

  submit() {
    const inp = document.getElementById('chat-input');
    const text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    this.msg(esc(text), 'user');
    setTimeout(() => this.bot(this.answer(text)), 250);
  },

  // --- search engine -------------------------------------------------------
  norm(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ');
  },

  STOP: new Set(('o a os as de da do das dos que qual quais como quando onde por para pra pode posso devo deve ' +
    'e ou um uma uns umas no na nos nas em com se eu voce ele ela sobre tem ter fazer faz ser sao esta estao foi ' +
    'the an of to in on is are was what which how when where can could i you my your it its for and or with at be ' +
    'do does must should there this that').split(' ')),

  tokens(s) {
    return this.norm(s).split(/\s+/).filter(w => w.length > 2 && !this.STOP.has(w));
  },

  scoreText(toks, text, weight) {
    if (!text) return 0;
    // whole-word matching (with prefix for plurals/inflections) — substring matching
    // caused false hits like "bolo" inside "simbolo"
    const words = this.norm(text).split(/\s+/);
    let sc = 0;
    toks.forEach(tok => {
      if (words.some(w => w === tok || (tok.length >= 4 && w.startsWith(tok)))) sc += weight;
    });
    return sc;
  },

  answer(query) {
    const toks = this.tokens(query);
    if (!toks.length) return esc(I18N.t('chat_nores'));

    // score every question in BOTH languages (question > explanation > choices)
    const scored = Store.bank().map(q => {
      let s = 0;
      s += this.scoreText(toks, q.question, 3) + this.scoreText(toks, q.question_pt, 3);
      s += this.scoreText(toks, q.explanation, 2) + this.scoreText(toks, q.explanation_pt, 2);
      s += this.scoreText(toks, (q.choices || []).join(' '), 1) + this.scoreText(toks, (q.choices_pt || []).join(' '), 1);
      return { q, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s);

    // score signs (name + meaning, both languages)
    const sign = (window.SIGNS_META || []).map(m => ({
      m,
      s: this.scoreText(toks, m.name + ' ' + m.meaning, 3) +
         this.scoreText(toks, (m.name_pt || '') + ' ' + (m.meaning_pt || ''), 3)
    })).filter(x => x.s > 0).sort((a, b) => b.s - a.s)[0];

    const topScore = scored.length ? scored[0].s : 0;
    if ((!scored.length || topScore < 3) && !sign) return esc(I18N.t('chat_nores'));

    let html = '';
    let relStart = 0;

    if (sign && sign.s >= topScore) {
      // best match is a road sign — show it
      html += '<div class="chat-sign">' + (SIGN_SVGS[sign.m.key] || '') + '</div>' +
        '<b>' + esc(I18N.signName(sign.m)) + '</b><br>' + esc(I18N.signMeaning(sign.m));
    } else {
      // best match is a question — answer with the correct choice + explanation
      const top = scored[0].q;
      html += '<b>✅ ' + esc(I18N.qChoices(top)[top.answerIndex]) + '</b><br>' + esc(I18N.qExpl(top));
      if (top.sign && window.SIGN_SVGS && SIGN_SVGS[top.sign]) {
        html += '<div class="chat-sign">' + SIGN_SVGS[top.sign] + '</div>';
      }
      relStart = 1;
    }

    const rel = scored.slice(relStart, relStart + 2).filter(x => x.s >= 3);
    if (rel.length) {
      html += '<div class="chat-rel"><b>' + esc(I18N.t('chat_related')) + '</b>';
      rel.forEach(r => {
        html += '<div class="chat-rel-item">• ' + esc(I18N.qText(r.q)) +
          '<br><span class="chat-rel-ans">→ ' + esc(I18N.qChoices(r.q)[r.q.answerIndex]) + '</span></div>';
      });
      html += '</div>';
    }
    return html;
  }
};
