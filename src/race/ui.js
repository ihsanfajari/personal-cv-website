// Race HUD: clock, checkpoint counter, minimap, countdown and the result card.

const BEST_KEY = 'cv-race-best';

export function formatTime(ms) {
  if (ms == null || !isFinite(ms)) return '—:—.——';
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

export function loadBest() {
  const raw = localStorage.getItem(BEST_KEY);
  const n = raw == null ? NaN : Number(raw);
  return isFinite(n) && n > 0 ? n : null;
}

export function saveBest(ms) {
  localStorage.setItem(BEST_KEY, String(Math.round(ms)));
}

export class RaceUI {
  constructor(track) {
    this.track = track;
    this.hud = document.getElementById('hud');
    this.timerEl = document.getElementById('timer');
    this.cpEl = document.getElementById('cp-counter');
    this.speedEl = document.getElementById('speedVal');
    this.odoEl = document.getElementById('odo');
    this.toastEl = document.getElementById('toast');
    this.countEl = document.getElementById('countdown');
    this.wrongEl = document.getElementById('wrongway');
    this.canvas = document.getElementById('minimap');
    this.ctx = this.canvas.getContext('2d');
    this._toastTimer = null;
    this._lastCs = -1;

    this._buildMinimapBase();
  }

  showHUD() {
    this.hud.style.display = 'block';
  }

  setSpeed(kmh) {
    this.speedEl.textContent = Math.round(Math.abs(kmh));
  }

  setProgress(metres, total) {
    this.odoEl.textContent = `${Math.round(Math.min(metres, total))} / ${Math.round(total)} m`;
  }

  setTime(ms) {
    const cs = Math.floor(ms / 10);
    if (cs === this._lastCs) return;   // only touch the DOM 100×/s at most
    this._lastCs = cs;
    const t = formatTime(ms);
    const dot = t.indexOf('.');
    this.timerEl.innerHTML = `${t.slice(0, dot)}<small>${t.slice(dot)}</small>`;
  }

  stopTimer(stopped) {
    this.timerEl.classList.toggle('stopped', stopped);
  }

  setCheckpoint(n, total) {
    this.cpEl.innerHTML = `CKPNT <b>${n}/${total}</b>`;
    this.cpEl.classList.add('hit');
    setTimeout(() => this.cpEl.classList.remove('hit'), 900);
  }

  toast(msg, ms = 2600) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }

  countdown(label) {
    if (label == null) { this.countEl.classList.remove('show'); return; }
    this.countEl.classList.add('show');
    this.countEl.innerHTML = `<span>${label}</span>`;
  }

  setWrongWay(on) {
    this.wrongEl.classList.toggle('show', on);
  }

  setIntroBest(ms) {
    const el = document.getElementById('intro-best');
    if (el) el.textContent = formatTime(ms);
  }

  // ---------- minimap ----------

  _buildMinimapBase() {
    const t = this.track;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < t.count; i++) {
      minX = Math.min(minX, t.x[i]); maxX = Math.max(maxX, t.x[i]);
      minZ = Math.min(minZ, t.z[i]); maxZ = Math.max(maxZ, t.z[i]);
    }
    const pad = 26;
    const w = this.canvas.width, h = this.canvas.height;
    const scale = Math.min((w - pad * 2) / (maxX - minX), (h - pad * 2) / (maxZ - minZ));
    const ox = (w - (maxX - minX) * scale) / 2 - minX * scale;
    const oz = (h - (maxZ - minZ) * scale) / 2 - minZ * scale;
    this._map = { scale, ox, oz };

    const base = document.createElement('canvas');
    base.width = w; base.height = h;
    const c = base.getContext('2d');

    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    for (let i = 0; i < t.count; i += 4) {
      const px = t.x[i] * scale + ox, pz = t.z[i] * scale + oz;
      if (i === 0) c.moveTo(px, pz); else c.lineTo(px, pz);
    }
    c.strokeStyle = 'rgba(32,46,61,.20)';
    c.lineWidth = 9;
    c.stroke();
    c.strokeStyle = '#a2603a';
    c.lineWidth = 5;
    c.stroke();

    this._base = base;
  }

  _dot(s, fill, r = 3.5) {
    const p = this.track.sampleAt(s);
    const { scale, ox, oz } = this._map;
    const c = this.ctx;
    c.beginPath();
    c.arc(p.x * scale + ox, p.z * scale + oz, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    c.lineWidth = 1.4;
    c.strokeStyle = '#202e3d';
    c.stroke();
  }

  drawMinimap(gates, carPos, heading) {
    const c = this.ctx;
    const { scale, ox, oz } = this._map;
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.drawImage(this._base, 0, 0);

    for (const g of gates.checkpoints) this._dot(g.s, g.passed ? '#54b45a' : '#e8a33d');
    this._dot(gates.start.s, '#fffaf0', 4);
    this._dot(gates.finish.s, '#202e3d', 4.5);

    // truck: a little arrow pointing where it is heading
    const px = carPos.x * scale + ox, pz = carPos.z * scale + oz;
    c.save();
    c.translate(px, pz);
    c.rotate(-heading);
    c.beginPath();
    c.moveTo(0, -8);
    c.lineTo(5.5, 6);
    c.lineTo(0, 3);
    c.lineTo(-5.5, 6);
    c.closePath();
    c.fillStyle = '#d8452e';
    c.fill();
    c.lineWidth = 1.6;
    c.strokeStyle = '#202e3d';
    c.stroke();
    c.restore();
  }

  // ---------- result ----------

  showResult({ timeMs, bestMs, isPB, splits, aborted }) {
    document.getElementById('result-badge').textContent = aborted ? 'RUN RESET' : 'FINISH';
    document.getElementById('result-time').textContent = formatTime(timeMs);

    const bestEl = document.getElementById('result-best');
    if (isPB) {
      bestEl.innerHTML = `<span class="pb">NEW PERSONAL BEST</span>`;
    } else {
      bestEl.textContent = `YOUR BEST ${formatTime(bestMs)}`;
    }

    const grid = document.getElementById('result-splits');
    grid.innerHTML = '';
    splits.forEach((s, i) => {
      const d = document.createElement('div');
      d.className = 'split';
      d.innerHTML = `<span>${i < splits.length - 1 ? `CP ${i + 1}` : 'FINISH'}</span><b>${formatTime(s)}</b>`;
      grid.appendChild(d);
    });

    document.getElementById('result').style.display = 'flex';
  }

  hideResult() {
    document.getElementById('result').style.display = 'none';
  }
}
