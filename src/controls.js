// Input: WASD/arrows + Space (brake/reverse) on desktop,
// spawn-anywhere virtual joystick on the left half for touch devices.

export class Controls {
  constructor() {
    this.keys = new Set();
    this.joy = { active: false, x: 0, y: 0 };
    this.onReset = null;

    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      if (e.code === 'KeyR' && this.onReset) this.onReset();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    this.isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (this.isTouch) {
      document.body.classList.add('touch');
      this.initJoystick();
    }
  }

  initJoystick() {
    const zone = document.getElementById('joystick-zone');
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    const R = 52; // knob travel radius in px
    let origin = null, pointerId = null;

    const setKnob = (dx, dy) => {
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    zone.addEventListener('pointerdown', (e) => {
      if (pointerId !== null) return;
      pointerId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      origin = { x: e.clientX, y: e.clientY };
      base.style.display = 'block';
      base.style.left = `${e.clientX}px`;
      base.style.top = `${e.clientY}px`;
      this.joy.active = true;
      setKnob(0, 0);
    });

    zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== pointerId || !origin) return;
      let dx = e.clientX - origin.x;
      let dy = e.clientY - origin.y;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
      setKnob(dx, dy);
      this.joy.x = dx / R;
      this.joy.y = -dy / R; // up = forward
    });

    const end = (e) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      origin = null;
      base.style.display = 'none';
      this.joy.active = false;
      this.joy.x = 0;
      this.joy.y = 0;
    };
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
  }

  // -> { throttle: [-1..1], steer: [-1..1] }
  read() {
    let throttle = 0, steer = 0;
    const k = this.keys;

    if (k.has('KeyW') || k.has('ArrowUp')) throttle += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) throttle -= 1;
    if (k.has('Space')) throttle -= 1; // brake, then reverse
    if (k.has('KeyA') || k.has('ArrowLeft')) steer -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) steer += 1;

    if (this.joy.active) {
      steer += this.joy.x;
      throttle += this.joy.y;
    }

    return {
      throttle: Math.max(-1, Math.min(1, throttle)),
      steer: Math.max(-1, Math.min(1, steer)),
    };
  }
}
