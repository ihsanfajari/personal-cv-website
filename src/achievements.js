// Hidden achievements: the list shows 5 locked slots ("???") until earned.
// Progress (tree count, odometer) persists in localStorage.

// `icon` is a Rally Roadbook sprite id (src/icons.js).
export const ACH_DEFS = [
  {
    id: 'trees',
    icon: 'tree',
    name: 'The Timber Car',
    desc: 'Send 15 trees to the sawmill. The island forgives you. Probably.',
  },
  {
    id: 'swim',
    icon: 'wave',
    name: 'This Is Not a Boat',
    desc: 'Discover, experimentally, that the truck cannot swim.',
  },
  {
    id: 'air',
    icon: 'plane',
    name: 'Fajari Airlines',
    desc: 'Enjoy 3 full seconds of uninterrupted flight. Snacks not included.',
  },
  {
    id: 'speed',
    icon: 'rocket',
    name: 'Full Send',
    desc: 'Pin the throttle and hit the truck’s absolute top speed.',
  },
  {
    id: 'dist',
    icon: 'map',
    name: 'Island Odyssey',
    desc: 'Put 5 km on the odometer. The scenic route counts double.',
  },
];

// Paint colors for the garage: one unlocks with each achievement.
export const SKINS = [
  { id: 'classic', name: 'Rally Red', color: '#d9402e', ach: null },
  { id: 'lumber', name: 'Lumber Green', color: '#3e7d36', ach: 'trees' },
  { id: 'deepsea', name: 'Deep-Sea Blue', color: '#2456c9', ach: 'swim' },
  { id: 'sky', name: 'Skyliner', color: '#7ec8e3', ach: 'air' },
  { id: 'sunburst', name: 'Sunburst', color: '#f7a325', ach: 'speed' },
  { id: 'odyssey', name: 'Odyssey Purple', color: '#8a4fd0', ach: 'dist' },
];

const TREES_TARGET = 15;
const AIR_TARGET = 3;      // seconds
const DIST_TARGET = 5000;  // meters
const SAVE_KEY = 'cv-achievements';

export class Achievements {
  constructor(onUnlock) {
    this.onUnlock = onUnlock; // (def) => void
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { /* fresh start */ }
    this.unlocked = new Set(saved.unlocked || []);
    this.trees = saved.trees || 0;
    this.distM = saved.distM || 0;
    this._airTime = 0;
    this._saveTimer = 0;
  }

  get distanceKm() { return this.distM / 1000; }
  get unlockedCount() { return this.unlocked.size; }
  get allUnlocked() { return this.unlocked.size >= ACH_DEFS.length; }

  _save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      unlocked: [...this.unlocked],
      trees: this.trees,
      distM: Math.round(this.distM),
    }));
  }

  _unlock(id) {
    if (this.unlocked.has(id)) return;
    this.unlocked.add(id);
    this._save();
    const def = ACH_DEFS.find((d) => d.id === id);
    this.onUnlock?.(def);
  }

  // ---- event hooks ----

  treeKnocked() {
    this.trees++;
    if (this.trees >= TREES_TARGET) this._unlock('trees');
  }

  submerged() {
    this._unlock('swim');
  }

  // called every frame
  update(dt, car) {
    // flight time
    if (car.airborne) {
      this._airTime += dt;
      if (this._airTime >= AIR_TARGET) this._unlock('air');
    } else {
      this._airTime = 0;
    }

    // top speed
    if (Math.abs(car.speed) >= car.maxSpeed - 0.05) this._unlock('speed');

    // odometer
    this.distM += Math.abs(car.speed) * dt;
    if (this.distM >= DIST_TARGET) this._unlock('dist');

    // periodic persistence so progress survives a tab close
    this._saveTimer += dt;
    if (this._saveTimer > 5) {
      this._saveTimer = 0;
      this._save();
    }
  }
}
