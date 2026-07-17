// Knocked-over props: tip-over animation + sliding bodies the car can shove.
// Works directly on InstancedMesh matrices — no physics engine needed.

import * as THREE from 'three';
import { terrainHeight } from './heightmap.js';

const HALF = Math.PI / 2;
const _m = new THREE.Matrix4();
const _qTilt = new THREE.Quaternion();
const _qYaw = new THREE.Quaternion();
const _axis = new THREE.Vector3();
const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export class DynamicProps {
  constructor() {
    this.bodies = [];
    this.onShove = null; // (intensity) => void, for SFX when car pushes a resting log
  }

  // c: collider entry from props.js (has mesh/index/scale/rot/y); dx,dz: knock direction (unit)
  knock(c, impactSpeed, dx, dz) {
    const k = Math.min(1, Math.abs(impactSpeed) / 26);
    // a heavy trunk absorbs most of the hit: short skid, not a launch
    const v0 = Math.min(6, Math.abs(impactSpeed) * 0.3);
    this.bodies.push({
      c,
      x: c.x, z: c.z,
      vx: dx * v0,
      vz: dz * v0,
      fallX: dx, fallZ: dz,          // world direction the trunk falls toward
      tilt: 0.06,
      tiltVel: 1.4 + k * 3.2,        // initial topple speed from the hit
      grounded: false,
      yawSpin: (Math.random() - 0.5) * (1.5 + k * 2),
      restTimer: 0,
    });
  }

  update(dt, car) {
    if (this.bodies.length === 0) return;
    const dirty = new Set();
    const carR = 1.5;

    for (const b of this.bodies) {
      let active = false;

      // --- tip over around the base, with a small bounce on landing ---
      if (!b.grounded) {
        b.tiltVel += 5.0 * dt; // gravity torque grows as it leans
        b.tilt += b.tiltVel * dt;
        if (b.tilt >= HALF) {
          b.tilt = HALF;
          b.tiltVel *= -0.22; // bounce
          if (Math.abs(b.tiltVel) < 0.45) { b.tiltVel = 0; b.grounded = true; }
        }
        active = true;
      }

      // --- car shoves fallen (and falling) trunks ---
      const cdx = b.x - car.pos.x, cdz = b.z - car.pos.z;
      const cd = Math.hypot(cdx, cdz);
      const minD = b.c.r + carR;
      const carSp = Math.abs(car.speed);
      let inContact = false;
      if (cd < minD && cd > 0.001) {
        const nx = cdx / cd, nz = cdz / cd;
        // separate so the trunk doesn't tunnel under the car
        b.x += nx * (minD - cd);
        b.z += nz * (minD - cd);
        // bulldoze: while touching, the trunk moves just under car speed —
        // it never outruns the bumper, so it stops as soon as the car does
        const pushV = Math.max(0, carSp * 0.92);
        const curSp = Math.hypot(b.vx, b.vz);
        if (pushV > curSp) {
          if (curSp < 0.5 && carSp > 2) this.onShove?.(Math.min(1, carSp / 20));
          b.vx = nx * pushV;
          b.vz = nz * pushV;
          b.yawSpin = (Math.random() - 0.5) * 2;
        }
        inContact = true;
        active = true;
      }

      // --- sliding with ground friction ---
      const sp = Math.hypot(b.vx, b.vz);
      if (sp > 0.02) {
        // heavy log on dirt: strong kinetic friction, near-static grip at low
        // speed, and only mild drag while it is still mid-fall (momentum carries)
        let decelRate;
        if (!b.grounded) decelRate = 4;
        else if (sp < 2) decelRate = 20;   // digs in and stops
        else decelRate = 11;               // hard skid
        if (inContact) decelRate = 2;      // the bumper overrides friction
        let decel = Math.min(sp, decelRate * dt);
        b.vx -= (b.vx / sp) * decel;
        b.vz -= (b.vz / sp) * decel;
        // extra exponential damping once grounded, so it settles fast
        if (b.grounded && !inContact) {
          const damp = Math.max(0, 1 - 3 * dt);
          b.vx *= damp; b.vz *= damp;
        }
        b.x += b.vx * dt;
        b.z += b.vz * dt;
        // lying trunk slowly rotates while sliding
        if (b.grounded && Math.abs(b.yawSpin) > 0.01) {
          const a = b.yawSpin * dt;
          const cos = Math.cos(a), sin = Math.sin(a);
          const fx = b.fallX * cos - b.fallZ * sin;
          b.fallZ = b.fallX * sin + b.fallZ * cos;
          b.fallX = fx;
        }
        b.yawSpin *= Math.max(0, 1 - 3 * dt);
        active = true;
      } else {
        b.vx = 0; b.vz = 0;
      }

      if (!active) continue;

      // --- write the instance matrix ---
      const y = terrainHeight(b.x, b.z) - 0.12;
      _axis.set(-b.fallZ, 0, b.fallX).normalize(); // horizontal axis perpendicular to fall dir
      _qTilt.setFromAxisAngle(_axis, b.tilt);
      _qYaw.setFromAxisAngle(UP, b.c.rot);
      _qTilt.multiply(_qYaw);
      _pos.set(b.x, y, b.z);
      _scl.setScalar(b.c.scale);
      _m.compose(_pos, _qTilt, _scl);
      b.c.mesh.setMatrixAt(b.c.index, _m);
      dirty.add(b.c.mesh);
    }

    for (const mesh of dirty) mesh.instanceMatrix.needsUpdate = true;
  }
}
