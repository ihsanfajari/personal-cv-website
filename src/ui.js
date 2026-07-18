// DOM UI: intro, HUD chips, toast, résumé panel, off-screen zone arrows.

import * as THREE from 'three';
import { CV_ZONES, CONTACT_LOCKED_HTML, CONTACT_UNLOCKED_HTML } from './cv-data.js';
import { icon } from './icons.js';

export class UI {
  constructor() {
    this.panel = document.getElementById('panel');
    this.panelContent = document.getElementById('panel-content');
    this.toastEl = document.getElementById('toast');
    this.hintEl = document.getElementById('hint');
    this.speedEl = document.getElementById('speedVal');
    this.progressEl = document.getElementById('hud-progress');
    this.edgeEl = document.getElementById('edge-markers');
    this.questEl = document.getElementById('quest');
    this.questArrow = document.getElementById('quest-arrow');
    this.questText = document.getElementById('quest-text');
    this.openZoneId = null;
    this.contactStatus = null; // () => ({ allUnlocked, unlocked, total }) — wired in main.js
    this._toastTimer = null;
    this._questMsg = '';
    this._questAng = null;

    // progress chips
    this.chips = {};
    for (const z of CV_ZONES) {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = `${icon(z.icon)} ${z.short}`;
      chip.title = z.hint;
      this.progressEl.appendChild(chip);
      this.chips[z.id] = chip;
    }

    // edge markers
    this.edgeMarkers = {};
    for (const z of CV_ZONES) {
      const m = document.createElement('div');
      m.className = 'edge-marker';
      m.innerHTML = `${icon(z.icon)}<span class="arrow">${icon('chevron-up')}</span>`;
      m.style.display = 'none';
      this.edgeEl.appendChild(m);
      this.edgeMarkers[z.id] = m;
    }

    document.getElementById('panel-close').addEventListener('click', () => this.closePanel());
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') this.closePanel();
    });
  }

  showHUD() {
    document.getElementById('hud').style.display = 'block';
  }

  setSpeed(kmh) {
    this.speedEl.textContent = Math.round(Math.abs(kmh));
  }

  setOdometer(km) {
    const txt = km < 10 ? km.toFixed(2) : km.toFixed(1);
    const el = document.getElementById('odo');
    if (el.textContent !== `${txt} km`) el.textContent = `${txt} km`;
  }

  openPanel(zone) {
    if (this.openZoneId === zone.data.id) return;
    this.openZoneId = zone.data.id;
    this.panelContent.innerHTML = zone.data.html;
    this._fillContactSlot();
    this.panel.style.display = 'flex';
    document.getElementById('panel-card').scrollTop = 0;
  }

  // Direct contact details are an achievement reward — see cv-data.js.
  _fillContactSlot() {
    const slot = this.panelContent.querySelector('[data-contact-slot]');
    if (!slot) return;
    const s = this.contactStatus?.() || { allUnlocked: false, unlocked: 0, total: 5 };
    slot.innerHTML = s.allUnlocked
      ? CONTACT_UNLOCKED_HTML
      : CONTACT_LOCKED_HTML(s.unlocked, s.total);
  }

  // re-render the open panel (e.g. when the last achievement unlocks mid-view)
  refreshOpenPanel() {
    if (this.openZoneId) this._fillContactSlot();
  }

  closePanel() {
    this.openZoneId = null;
    this.panel.style.display = 'none';
  }

  markDiscovered(zone, count, total) {
    this.chips[zone.data.id].classList.add('found');
    if (count >= total) {
      this.toast(`All ${total} areas discovered — thanks for the ride!`);
    } else {
      this.toast(`${zone.data.title} discovered! (${count}/${total})`);
    }
  }

  toast(msg, ms = 3200) {
    this.toastEl.textContent = msg;
    this.toastEl.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }

  hint(msg) {
    if (msg) {
      this.hintEl.textContent = msg;
      this.hintEl.classList.add('show');
    } else {
      this.hintEl.classList.remove('show');
    }
  }

  // Quest chip: beacon count + a rough compass arrow toward the nearest
  // undiscovered beacon (quantized to 45° so it hints without spoiling).
  updateQuest(zones, carPos, camera) {
    let found = 0, nearest = null, nearestD = Infinity;
    for (const z of zones) {
      if (z.discovered) { found++; continue; }
      const d = Math.hypot(carPos.x - z.pos.x, carPos.z - z.pos.z);
      if (d < nearestD) { nearestD = d; nearest = z; }
    }

    let msg, ang = null;
    if (!nearest) {
      msg = `All ${zones.length} waypoints found!`;
    } else {
      const range = nearestD < 45 ? 'very close!' : nearestD < 130 ? 'getting close' : 'far off';
      msg = `${found}/${zones.length} waypoints · next: ${range}`;

      // screen-space bearing toward the beacon, snapped to 45° steps
      const a = new THREE.Vector3(carPos.x, carPos.y, carPos.z).project(camera);
      const b = new THREE.Vector3(nearest.pos.x, nearest.pos.y, nearest.pos.z).project(camera);
      const raw = Math.atan2(-(b.y - a.y), b.x - a.x) * 180 / Math.PI;
      ang = Math.round(raw / 45) * 45;
    }

    if (msg !== this._questMsg) {
      this._questMsg = msg;
      this.questText.textContent = msg;
      this.questEl.classList.toggle('complete', !nearest);
    }
    if (ang !== this._questAng) {
      this._questAng = ang;
      if (ang !== null) this.questArrow.style.transform = `rotate(${ang}deg)`;
    }
  }

  // Screen-edge indicators pointing to undiscovered zones.
  updateEdgeMarkers(zones, camera) {
    const w = window.innerWidth, h = window.innerHeight;
    const margin = 44;
    const v = new THREE.Vector3();

    for (const z of zones) {
      const m = this.edgeMarkers[z.data.id];
      if (z.discovered) { m.style.display = 'none'; continue; }

      v.copy(z.pos).setY(z.pos.y + 6);
      v.project(camera);
      const behind = v.z > 1;
      let x = (v.x * 0.5 + 0.5) * w;
      let y = (-v.y * 0.5 + 0.5) * h;
      if (behind) { x = w - x; y = h + 100; } // flip when behind the camera

      const onScreen = !behind && x > margin && x < w - margin && y > margin && y < h - margin;
      if (onScreen) { m.style.display = 'none'; continue; }

      // clamp to the screen edge and aim the little arrow outward
      const cx = w / 2, cy = h / 2;
      let dx = x - cx, dy = y - cy;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const tx = Math.abs(dx) > 0.0001 ? (w / 2 - margin) / Math.abs(dx) : Infinity;
      const ty = Math.abs(dy) > 0.0001 ? (h / 2 - margin) / Math.abs(dy) : Infinity;
      const t = Math.min(tx, ty);
      const ex = cx + dx * t, ey = cy + dy * t;
      const ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;

      m.style.display = 'flex';
      m.style.left = `${ex}px`;
      m.style.top = `${ey}px`;
      m.querySelector('.arrow').style.transform = `rotate(${ang}deg)`;
    }
  }
}
