// js/confetti.js — lightweight canvas confetti, zero dependencies (R3.3).
// Loaded by index.html; used via the global Confetti (burst on pass/reward/mastery).

const Confetti = {
  canvas: null, ctx: null, parts: [], running: false,
  COLORS: ['#a78bfa', '#8b5cf6', '#c026d3', '#ff8fd8', '#f7c531', '#7c3aed', '#ffffff'],

  init() {
    this.canvas = document.getElementById('confetti-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  },

  burst(n) {
    n = n || 90;
    for (let i = 0; i < n; i++) {
      this.parts.push({
        x: Math.random() * this.canvas.width,
        y: -20 - Math.random() * 100,
        w: 6 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3.5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
        color: this.COLORS[(Math.random() * this.COLORS.length) | 0]
      });
    }
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(() => this.tick());
    }
  },

  tick() {
    const c = this.ctx;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.parts = this.parts.filter(p => p.y < this.canvas.height + 40);
    this.parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += 0.035;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.rot);
      c.fillStyle = p.color;
      c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      c.restore();
    });
    if (this.parts.length) {
      requestAnimationFrame(() => this.tick());
    } else {
      this.running = false;
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
};
