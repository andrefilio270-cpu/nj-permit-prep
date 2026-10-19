// js/cloud.js — keeps progress in the signed-in person's PRIVATE space of the artifact database
// (claude.ai viewer capabilities "db" + "user"), so points survive closing the app and sync across
// devices. localStorage stays the instant local copy. Opened as a plain file (no window.claude) this
// does nothing. Loaded by index.html after storage.js; used by Store (save) and App (boot).

const Cloud = {
  DOC: 'nc',          // one document per state site: data/users/<id>/nc
  ref: null,
  status: 'local',     // 'local' (browser only) | 'cloud' (synced) | 'readonly' (no write access)
  timer: null, writing: false, dirty: false,

  // Merges the cloud copy into Store; resolves when done, or after 4 s at most.
  init() {
    return Promise.race([this.connect().catch(() => {}), new Promise(r => setTimeout(r, 4000))]);
  },

  async connect() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
    if (!db || !user) return;
    const uid = await user.id();
    if (!uid) return;                                   // signed out: no private space
    this.ref = db.collection('data/users/' + uid).doc(this.DOC);
    this.status = 'cloud';
    await this.pull(true);
    // save right away when the app goes to the background; refresh when it comes back
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
      else this.pull(false);
    });
    window.addEventListener('pagehide', () => this.flush());
  },

  // Newest copy wins (compared by updatedAt). Local edits still waiting to upload are never overwritten.
  async pull(first) {
    if (!this.ref || this.writing || this.dirty) return;
    let snap;
    try { snap = await this.ref.get(); } catch (e) { return; }
    const body = snap.exists ? snap.data() : null;
    const remote = body && body.state;
    const localAt = Store.state.updatedAt || 0, remoteAt = (remote && remote.updatedAt) || 0;
    if (remote && remoteAt > localAt) {
      Store.adopt(JSON.parse(JSON.stringify(remote)));  // snapshots are frozen: clone
      if (typeof App !== 'undefined' && App.onCloudState) App.onCloudState();
    } else if (first && localAt > remoteAt) {
      this.schedule(0);                                  // this device has newer progress: upload it
    }
  },

  // Called by Store.save(): coalesce bursts of answers into one write.
  schedule(ms) {
    if (!this.ref || this.status !== 'cloud') return;
    this.dirty = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), ms === undefined ? 1200 : ms);
  },

  // One write at a time; a write that fails transiently is retried on the next save or app switch.
  async flush() {
    clearTimeout(this.timer);
    if (!this.ref || !this.dirty || this.writing || this.status !== 'cloud') return;
    this.writing = true;
    this.dirty = false;
    let failed = false;
    try {
      await this.ref.set({ state: JSON.parse(JSON.stringify(Store.state)) });
    } catch (e) {
      failed = true;
      const code = e && e.code;
      if (code === 'invalid_argument' || code === 'not_granted' || code === 'revoked' ||
          code === 'capability_disabled' || code === 'capability_removed') this.status = 'readonly';
      else this.dirty = true;
    }
    this.writing = false;
    if (this.dirty && !failed) this.schedule();
  }
};
