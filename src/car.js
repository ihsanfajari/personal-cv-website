// Procedural low-poly red off-road pickup (modeled after the reference art)
// with arcade driving physics on the analytic heightfield.

import * as THREE from 'three';
import { terrainHeight, terrainNormal } from './heightmap.js';
import { SPAWN, WORLD } from './config.js';

const UP_VEC = new THREE.Vector3(0, 1, 0);

const BODY_RED = '#d9402e';
const TRIM = '#d8d8d8';
const DARK = '#232323';
const GLASS = '#3a4a8a';

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85 })
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function buildWheel() {
  const wheel = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.46, 0.46, 0.38, 10),
    new THREE.MeshStandardMaterial({ color: '#1c1c1c', flatShading: true, roughness: 1 })
  );
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wheel.add(tire);
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.24, 0.4, 8),
    new THREE.MeshStandardMaterial({ color: '#b9b9b9', flatShading: true, roughness: 0.6 })
  );
  hub.rotation.z = Math.PI / 2;
  wheel.add(hub);
  return wheel;
}

function buildCarMesh() {
  const car = new THREE.Group();

  // repaintable panels (garage skins): main body color + darker bed tone
  const paintMain = [];
  const paintDark = [];
  const painted = (m) => { paintMain.push(m); return m; };

  // chassis + cab, front facing +z
  const body = new THREE.Group();
  body.add(painted(box(1.9, 0.55, 4.3, BODY_RED, 0, 0.95, 0)));          // main tub
  body.add(painted(box(1.8, 0.42, 1.5, BODY_RED, 0, 1.4, 1.35)));        // hood block
  const cabin = painted(box(1.7, 0.75, 1.35, BODY_RED, 0, 1.72, 0.25));  // cab
  body.add(cabin);
  body.add(box(1.75, 0.1, 1.4, '#e8e8e8', 0, 2.14, 0.25));      // white roof

  // windows
  body.add(box(1.55, 0.5, 0.06, GLASS, 0, 1.75, 0.95));         // windshield
  body.add(box(1.55, 0.45, 0.06, GLASS, 0, 1.72, -0.44));       // rear window
  body.add(box(0.06, 0.45, 1.1, GLASS, 0.83, 1.72, 0.25));
  body.add(box(0.06, 0.45, 1.1, GLASS, -0.83, 1.72, 0.25));

  // pickup bed
  const bed = box(1.7, 0.35, 1.5, '#b53525', 0, 1.28, -1.35);
  paintDark.push(bed);
  body.add(bed);
  body.add(painted(box(1.7, 0.12, 0.1, BODY_RED, 0, 1.5, -2.1)));

  // bumpers + grille
  body.add(box(2.0, 0.32, 0.35, TRIM, 0, 0.78, 2.2));
  body.add(box(2.0, 0.32, 0.3, TRIM, 0, 0.78, -2.25));
  body.add(box(1.2, 0.28, 0.08, '#9a9a9a', 0, 1.32, 2.12));

  // headlights + taillights
  const lightMat = new THREE.MeshStandardMaterial({ color: '#fff6d8', emissive: '#fff2b0', emissiveIntensity: 0.7 });
  for (const sx of [-0.72, 0.72]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.08), lightMat);
    h.position.set(sx, 1.36, 2.13);
    body.add(h);
    body.add(box(0.24, 0.16, 0.06, '#c22a1a', sx, 1.1, -2.42));
  }

  // roll bar + light bar with two round spotlights
  body.add(box(0.12, 0.7, 0.12, DARK, 0.75, 2.0, -0.6));
  body.add(box(0.12, 0.7, 0.12, DARK, -0.75, 2.0, -0.6));
  body.add(box(1.7, 0.12, 0.12, DARK, 0, 2.38, -0.6));
  for (const sx of [-0.45, 0.45]) {
    const spot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: '#f2f2f2', flatShading: true })
    );
    spot.rotation.x = Math.PI / 2;
    spot.position.set(sx, 2.52, -0.58);
    body.add(spot);
  }

  // spare tire on the bed
  const spare = buildWheel();
  spare.scale.setScalar(0.9);
  spare.rotation.z = Math.PI / 2;
  spare.position.set(0, 1.5, -1.5);
  body.add(spare);

  // side mirrors
  body.add(box(0.08, 0.18, 0.22, DARK, 0.98, 1.62, 0.85));
  body.add(box(0.08, 0.18, 0.22, DARK, -0.98, 1.62, 0.85));

  car.add(body);

  // wheels: front pair inside steering pivots
  const wheels = { spin: [], steerPivots: [] };
  const positions = [
    { x: 0.95, z: 1.45, front: true }, { x: -0.95, z: 1.45, front: true },
    { x: 0.95, z: -1.35, front: false }, { x: -0.95, z: -1.35, front: false },
  ];
  for (const p of positions) {
    const w = buildWheel();
    wheels.spin.push(w);
    if (p.front) {
      const pivot = new THREE.Group();
      pivot.position.set(p.x, 0.46, p.z);
      pivot.add(w);
      car.add(pivot);
      wheels.steerPivots.push(pivot);
    } else {
      w.position.set(p.x, 0.46, p.z);
      car.add(w);
    }
  }

  car.userData.wheels = wheels;
  car.userData.body = body;
  car.userData.paint = { main: paintMain, dark: paintDark };
  return car;
}

// Sludge: at mud = 1 the truck tops out around half its normal speed and the
// front end washes out, which is what makes the mud basin cost real time.
const MUD_DRAG = 1.2;
const MUD_SLIP = 0.35;

export class Car {
  // opts: { spawn, maxSpeed, maxReverse, accel, mud } — defaults are the island's.
  constructor(scene, colliderGrid, opts = {}) {
    this.mesh = buildCarMesh();
    scene.add(this.mesh);
    this.grid = colliderGrid;

    this.spawn = opts.spawn ?? SPAWN;
    this.mudAt = opts.mud ?? null;   // (x, z) => 0..1, set by worlds that have mud
    this.mud = 0;

    this.pos = new THREE.Vector3(this.spawn.x, terrainHeight(this.spawn.x, this.spawn.z), this.spawn.z);
    this.heading = this.spawn.heading;
    this.speed = 0;
    this.steerVisual = 0;
    this.vy = 0;             // vertical velocity (jumps)
    this.airborne = false;
    this._landGrace = 0;     // brief settle after touchdown, see update()
    this.onLand = null;      // (impact 0..1) => void, set by main.js for SFX

    this.lastSafe = new THREE.Vector3(this.spawn.x, 0, this.spawn.z);
    this._safeTimer = 0;

    this._normal = new THREE.Vector3(0, 1, 0);
    this._smoothNormal = new THREE.Vector3(0, 1, 0);
    this._quat = new THREE.Quaternion();
    this._targetQuat = new THREE.Quaternion();
    this._qPitch = new THREE.Quaternion();
    this._mat = new THREE.Matrix4();
    this._colOut = [];

    this.maxSpeed = opts.maxSpeed ?? 26;   // m/s forward
    this.maxReverse = opts.maxReverse ?? 9;
    this.accel = opts.accel ?? 15;
    this.sunk = false;
    this.inWater = false;
    this.onImpact = null;    // (intensity 0..1) => void, set by main.js for SFX
    this.onKnock = null;     // (collider, speed, dirX, dirZ) => void, tree knocked over

    this.syncMesh(0);
  }

  // repaint the body panels (garage skins); bed gets a darker shade
  setPaint(hex) {
    const c = new THREE.Color(hex);
    for (const m of this.mesh.userData.paint.main) m.material.color.copy(c);
    const dark = c.clone().multiplyScalar(0.8);
    for (const m of this.mesh.userData.paint.dark) m.material.color.copy(dark);
  }

  reset(toSpawn = false) {
    const p = toSpawn ? new THREE.Vector3(this.spawn.x, 0, this.spawn.z) : this.lastSafe;
    this.pos.copy(p);
    this.pos.y = terrainHeight(p.x, p.z);
    if (toSpawn) this.heading = this.spawn.heading;
    this.speed = 0;
    this.vy = 0;
    this.airborne = false;
    this.sunk = false;
  }

  get forward() {
    return new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
  }

  update(dt, input) {
    const { throttle, steer } = input; // throttle [-1..1], steer [-1..1]

    const groundH = terrainHeight(this.pos.x, this.pos.z);
    const inWater = groundH < WORLD.waterLevel + 0.35;
    const deepWater = groundH < WORLD.waterLevel - 1.2;
    this.inWater = inWater;
    const mud = this.mudAt ? this.mudAt(this.pos.x, this.pos.z) : 0;
    this.mud = mud;

    // --- longitudinal (wheels only bite on the ground) ---
    const accel = this.accel, brakeDecel = 30, drag = 0.9, rollRes = 2.2;
    if (this.airborne) {
      this.speed *= Math.max(0, 1 - 0.06 * dt); // tiny air drag only
    } else {
    if (throttle > 0.01) {
      if (this.speed < -0.4) this.speed = Math.min(0, this.speed + brakeDecel * dt);
      else this.speed += accel * throttle * dt;
    } else if (throttle < -0.01) {
      if (this.speed > 0.4) this.speed = Math.max(0, this.speed - brakeDecel * dt);
      else this.speed += accel * 0.7 * throttle * dt; // reverse
    }
    // slope gravity along heading
    const f = this.forward;
    const hAhead = terrainHeight(this.pos.x + f.x * 2.2, this.pos.z + f.z * 2.2);
    const hBehind = terrainHeight(this.pos.x - f.x * 2.2, this.pos.z - f.z * 2.2);
    this.speed -= ((hAhead - hBehind) / 4.4) * 9.8 * dt * 0.55;

    // resistance
    const sign = Math.sign(this.speed);
    this.speed -= sign * Math.min(Math.abs(this.speed), (rollRes + drag * Math.abs(this.speed) * 0.14) * dt * 10) * 0.1;
    if (inWater) this.speed *= Math.max(0, 1 - 2.5 * dt);
    if (mud > 0.01) this.speed *= Math.max(0, 1 - MUD_DRAG * mud * dt);
    this.speed = Math.min(this.maxSpeed, Math.max(-this.maxReverse, this.speed));
    if (Math.abs(this.speed) < 0.02 && Math.abs(throttle) < 0.01) this.speed = 0;
    }

    // --- steering (no grip mid-air) ---
    const grip = this.airborne ? 0
      : Math.min(1, Math.abs(this.speed) / 5) * (1 - MUD_SLIP * mud);
    const agility = 1.9 * (1 - Math.min(1, Math.abs(this.speed) / this.maxSpeed) * 0.45);
    this.heading -= steer * agility * grip * dt * Math.sign(this.speed || 1);
    this.steerVisual += ((-steer * 0.45) - this.steerVisual) * Math.min(1, dt * 10);

    // --- integrate ---
    const fx = Math.sin(this.heading), fz = Math.cos(this.heading);
    this.pos.x += fx * this.speed * dt;
    this.pos.z += fz * this.speed * dt;

    // --- prop collisions (skipped while flying) ---
    const cols = this.airborne ? [] : this.grid.query(this.pos.x, this.pos.z, this._colOut);
    for (const c of cols) {
      if (c.alive === false) continue; // already knocked over -> handled by debris system
      const dx = this.pos.x - c.x, dz = this.pos.z - c.z;
      const d = Math.hypot(dx, dz);
      const minD = c.r + 1.25;
      if (d >= minD || d <= 0.001) continue;

      const speedBefore = Math.abs(this.speed);

      // fast hit on a tree/cactus: knock it over and plow through
      if (c.knockable && speedBefore > 5.5) {
        c.alive = false;
        this.onKnock?.(c, this.speed, -dx / d, -dz / d);
        this.speed *= 0.86;
        continue;
      }

      // solid contact (rock, or a gentle nudge on a standing tree)
      const push = (minD - d);
      this.pos.x += (dx / d) * push;
      this.pos.z += (dz / d) * push;
      this.speed *= Math.max(0.2, 1 - push * 1.6);
      if (push > 0.06 && speedBefore > 3) {
        this.onImpact?.(Math.min(1, push * 1.5 + speedBefore / 26));
      }
    }

    // keep the car inside the world bounds
    const r = Math.hypot(this.pos.x, this.pos.z);
    const maxR = WORLD.islandFade + 12;
    if (r > maxR) {
      this.pos.x *= maxR / r;
      this.pos.z *= maxR / r;
      this.speed *= 0.5;
    }

    // --- vertical physics: launch off crests & cliffs, ballistic flight, landing ---
    const G = 17;
    const hNow = terrainHeight(this.pos.x, this.pos.z);
    if (this.airborne) {
      this.vy -= G * dt;
      this.pos.y += this.vy * dt;
      if (this.pos.y <= hNow) {
        const impact = -this.vy;
        this.pos.y = Math.max(hNow, WORLD.waterLevel - 1.4);
        this.airborne = false;
        this.vy = 0;
        // Landing zeroes vy, but the ground under a landing is often still
        // falling away fast. Without this settle the very next frame reads
        // that as another take-off and the truck jackhammers down the slope.
        this._landGrace = 0.18;
        if (impact > 4.5) {
          this.speed *= Math.max(0.72, 1 - impact * 0.012); // landing scrubs speed
          this.onLand?.(Math.min(1, impact / 16));
        }
      }
    } else {
      this._landGrace = Math.max(0, this._landGrace - dt);
      const vyFollow = dt > 0 ? (hNow - this.pos.y) / dt : 0;
      // ground falls away faster than gravity can pull us down -> take off
      if (this._landGrace === 0 && vyFollow < this.vy - G * dt - 1.5 && Math.abs(this.speed) > 7) {
        this.airborne = true;
        this.vy = Math.max(this.vy - G * dt, -2);
        this.pos.y += this.vy * dt;
      } else {
        this.pos.y = Math.max(hNow, WORLD.waterLevel - 1.4);
        this.vy = Math.max(-25, Math.min(25, vyFollow)); // slope climb/descend rate
      }
    }

    // deep water -> mark sunk (main loop triggers reset+fade)
    if (deepWater) this.sunk = true;

    // remember last safe spot
    this._safeTimer += dt;
    if (this._safeTimer > 1.5 && groundH > 1.0 && !inWater) {
      this._safeTimer = 0;
      this.lastSafe.set(this.pos.x, 0, this.pos.z);
    }

    this.syncMesh(dt);
  }

  syncMesh(dt) {
    if (this.airborne) {
      // level out, pitch with the flight arc (nose up on launch, dips on descent)
      this._smoothNormal.lerp(UP_VEC, dt > 0 ? Math.min(1, dt * 2.5) : 1).normalize();
      const up = this._smoothNormal;
      const fwd = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
      fwd.addScaledVector(up, -fwd.dot(up)).normalize();
      const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
      this._mat.makeBasis(right, up, fwd);
      this._targetQuat.setFromRotationMatrix(this._mat);
      const pitch = Math.max(-0.45, Math.min(0.45,
        Math.atan2(this.vy, Math.abs(this.speed) + 5) * 0.55));
      this._qPitch.setFromAxisAngle(right, -pitch);
      this._targetQuat.premultiply(this._qPitch);
      this._quat.slerp(this._targetQuat, dt > 0 ? Math.min(1, dt * 4) : 1);
    } else {
      terrainNormal(this.pos.x, this.pos.z, this._normal);
      this._smoothNormal.lerp(this._normal, dt > 0 ? Math.min(1, dt * 7) : 1).normalize();

      // basis: y = smoothed ground normal, z = heading projected on ground plane
      const up = this._smoothNormal;
      const fwd = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
      fwd.addScaledVector(up, -fwd.dot(up)).normalize();
      const right = new THREE.Vector3().crossVectors(up, fwd).normalize();
      this._mat.makeBasis(right, up, fwd);
      this._targetQuat.setFromRotationMatrix(this._mat);
      this._quat.slerp(this._targetQuat, dt > 0 ? Math.min(1, dt * 8) : 1);
    }

    this.mesh.position.copy(this.pos);
    this.mesh.quaternion.copy(this._quat);

    // wheels
    const w = this.mesh.userData.wheels;
    const spin = this.speed * (dt || 0) / 0.46;
    for (const wheel of w.spin) wheel.rotation.x += spin;
    for (const p of w.steerPivots) p.rotation.y = this.steerVisual;

    // body lean from acceleration feel
    const body = this.mesh.userData.body;
    body.rotation.x += ((-this.speed * 0.0016) - body.rotation.x) * Math.min(1, (dt || 0) * 4);
  }
}
