// js/rewards.js — user-defined rewards (R7): animated progress bars, unlock celebration,
// claim/edit/delete. Points are never spent (R7.5). Bilingual via I18N (R11.2).
// Loaded by index.html; used via the global Rewards.

const Rewards = {
  editingId: null,

  render() {
    const host = document.getElementById('view-rewards');
    const list = Store.state.rewards;
    const pts = Store.state.points;

    host.innerHTML =
      '<div class="pop-in"><h1>' + I18N.t('rewards_title') + '</h1>' +
      '<p class="sub">' + I18N.t('rewards_sub') + '</p>' +
      '<div class="card reward-form">' +
      '<input type="text" id="reward-title" maxlength="80" placeholder="' + I18N.t('ph_title') + '">' +
      '<input type="number" id="reward-cost" min="1" placeholder="' + I18N.t('ph_cost') + '">' +
      '<button class="btn primary" onclick="Rewards.add()">' + I18N.t('add_reward') + '</button>' +
      '</div>' +
      (list.length === 0
        ? '<div class="card empty-state"><div class="empty-emoji">🎀</div><p>' + I18N.t('rewards_empty') + '</p></div>'
        : '<div class="rewards-list">' + list.map(r => this.cardHTML(r, pts)).join('') + '</div>') +
      '</div>';
  },

  cardHTML(r, pts) {
    const pct = Math.min(100, Math.round((pts / r.cost) * 100));
    const unlocked = pts >= r.cost;

    if (this.editingId === r.id) {
      return '<div class="card reward-card editing" id="rw-' + r.id + '">' +
        '<input type="text" id="edit-title-' + r.id + '" maxlength="80" value="' + esc(r.title) + '">' +
        '<input type="number" id="edit-cost-' + r.id + '" min="1" value="' + r.cost + '">' +
        '<div class="reward-actions">' +
        '<button class="btn primary" onclick="Rewards.saveEdit(' + r.id + ')">' + I18N.t('save') + '</button>' +
        '<button class="btn ghost" onclick="Rewards.cancelEdit()">' + I18N.t('cancel') + '</button></div></div>';
    }

    return '<div class="card reward-card ' + (r.claimed ? 'claimed' : unlocked ? 'unlocked' : '') + '" id="rw-' + r.id + '">' +
      '<div class="reward-top"><span class="reward-emoji">' + (r.claimed ? '🏆' : unlocked ? '🎉' : '🎁') + '</span>' +
      '<div class="reward-info"><b>' + esc(r.title) + '</b>' +
      '<span class="reward-goal">' + Math.min(pts, r.cost) + ' / ' + r.cost + ' ' + I18N.t('pts') + '</span></div></div>' +
      '<div class="bar reward-bar"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="reward-actions">' +
      (r.claimed
        ? '<span class="claimed-label">' + I18N.t('claimed_label') + '</span>'
        : unlocked
          ? '<button class="btn primary" onclick="Rewards.claim(' + r.id + ')">' + I18N.t('claim') + '</button>'
          : '<span class="reward-remaining">' + I18N.t('to_go', { n: r.cost - pts }) + '</span>') +
      '<span class="reward-mini-actions">' +
      '<button class="mini-btn" onclick="Rewards.edit(' + r.id + ')">✏️</button>' +
      '<button class="mini-btn" onclick="Rewards.remove(' + r.id + ')">🗑</button></span>' +
      '</div></div>';
  },

  add() {
    const titleEl = document.getElementById('reward-title');
    const costEl = document.getElementById('reward-cost');
    const title = titleEl.value.trim();
    const cost = parseInt(costEl.value, 10);
    if (!title) { Mascot.say(I18N.t('reward_need_title'), 2800); titleEl.focus(); return; }
    if (!cost || cost < 1) { Mascot.say(I18N.t('reward_need_cost'), 2800); costEl.focus(); return; }
    Store.state.rewards.push({ id: Date.now(), title, cost, claimed: false, celebrated: Store.state.points >= cost });
    Store.save();
    this.render();
    Mascot.say(I18N.t('reward_added', { title: esc(title) }), 3200);
  },

  edit(id) { this.editingId = id; this.render(); },
  cancelEdit() { this.editingId = null; this.render(); },

  saveEdit(id) {
    const r = Store.state.rewards.filter(x => x.id === id)[0];
    if (!r) return;
    const title = document.getElementById('edit-title-' + id).value.trim();
    const cost = parseInt(document.getElementById('edit-cost-' + id).value, 10);
    if (title) r.title = title;
    if (cost && cost >= 1) { r.cost = cost; r.celebrated = Store.state.points >= cost; }
    this.editingId = null;
    Store.save();
    this.render();
  },

  remove(id) {
    if (!confirm(I18N.t('delete_confirm'))) return;
    Store.state.rewards = Store.state.rewards.filter(r => r.id !== id);
    Store.save();
    this.render();
  },

  claim(id) {
    const r = Store.state.rewards.filter(x => x.id === id)[0];
    if (!r || Store.state.points < r.cost) return;
    r.claimed = true;                                  // R7.5 — points are NOT deducted
    Store.save();
    Confetti.burst(160);
    Mascot.say(I18N.t('claim_msg', { title: esc(r.title) }), 5000);
    this.render();
  },

  // Called whenever points change (R7.3) — celebrate rewards that just became reachable.
  checkUnlocks() {
    const pts = Store.state.points;
    let changed = false;
    Store.state.rewards.forEach(r => {
      if (!r.claimed && !r.celebrated && pts >= r.cost) {
        r.celebrated = true;
        changed = true;
        Confetti.burst(150);
        Mascot.say(I18N.t('unlock_msg', { title: esc(r.title) }), 5000);
      }
    });
    if (changed) {
      Store.save();
      if (App.current === 'rewards') this.render();
    }
  }
};
