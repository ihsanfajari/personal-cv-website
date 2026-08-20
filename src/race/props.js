// Autumn scenery for the race world plus the physical boundary dressing:
// rally fencing and tyre stacks along the corridor edge.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { colored, move, mulberry32, makeColliderGrid } from '../geo.js';
import { fbm } from '../noise.js';
import { info, track, wallSteepness, RACE_BOUNDS, WALL_MAX, EDGE } from './world.js';

// ---- geometries ----

function broadleafGeo(canopy, canopy2, trunk = '#6b4a30') {
  return mergeGeometries([
    move(colored(new THREE.CylinderGeometry(0.24, 0.36, 2.2, 5), trunk), 0, 1.1, 0),
    move(colored(new THREE.IcosahedronGeometry(1.9, 0), canopy), 0, 3.6, 0),
    move(colored(new THREE.IcosahedronGeometry(1.25, 0), canopy2), 1.1, 3.0, 0.5),
    move(colored(new THREE.IcosahedronGeometry(1.05, 0), canopy2), -0.9, 3.2, -0.6),
  ]);
}

function aspenGeo() {
  return mergeGeometries([
    move(colored(new THREE.CylinderGeometry(0.16, 0.22, 3.4, 5), '#d8cfbe'), 0, 1.7, 0),
    move(colored(new THREE.IcosahedronGeometry(1.25, 0), '#e0b53c'), 0, 4.3, 0),
    move(colored(new THREE.IcosahedronGeometry(0.85, 0), '#c99a2d'), 0.7, 3.7, 0.3),
  ]);
}

function pineGeo() {
  return mergeGeometries([
    move(colored(new THREE.CylinderGeometry(0.22, 0.3, 1.6, 5), '#5c4028'), 0, 0.8, 0),
    move(colored(new THREE.ConeGeometry(1.5, 2.2, 6), '#2f5c30'), 0, 2.3, 0),
    move(colored(new THREE.ConeGeometry(1.1, 1.9, 6), '#3a6b37'), 0, 3.6, 0),
    move(colored(new THREE.ConeGeometry(0.7, 1.5, 6), '#3a6b37'), 0, 4.7, 0),
  ]);
}

function bareGeo() {
  const wood = '#7a6047';
  const b1 = colored(new THREE.CylinderGeometry(0.1, 0.15, 1.7, 4), wood);
  b1.rotateZ(0.75); b1.translate(0.6, 2.8, 0);
  const b2 = colored(new THREE.CylinderGeometry(0.09, 0.13, 1.4, 4), wood);
  b2.rotateZ(-0.85); b2.rotateY(1.1); b2.translate(-0.45, 2.4, 0.35);
  return mergeGeometries([
    move(colored(new THREE.CylinderGeometry(0.19, 0.34, 3.2, 5), wood), 0, 1.6, 0),
    b1, b2,
  ]);
}

function stumpGeo() {
  return mergeGeometries([
    move(colored(new THREE.CylinderGeometry(0.45, 0.55, 0.8, 6), '#6b4a30'), 0, 0.4, 0),
    move(colored(new THREE.CylinderGeometry(0.4, 0.4, 0.08, 6), '#9a7a55'), 0, 0.82, 0),
  ]);
}

function rockGeo(hex) {
  const g = colored(new THREE.IcosahedronGeometry(1, 0), hex);
  g.scale(1, 0.72, 1);
  return g;
}

function boulderGeo() {
  return mergeGeometries([
    move(colored(new THREE.IcosahedronGeometry(1.8, 0), '#7b7168'), 0, 1.2, 0),
    move(colored(new THREE.IcosahedronGeometry(1.1, 0), '#6a6159'), 1.3, 0.7, 0.6),
  ]);
}

function shrubGeo() {
  return mergeGeometries([
    move(colored(new THREE.IcosahedronGeometry(0.75, 0), '#8a5a2c'), 0, 0.6, 0),
    move(colored(new THREE.IcosahedronGeometry(0.5, 0), '#a06a2f'), 0.5, 0.5, 0.3),
  ]);
}

function fernGeo() {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const blade = colored(new THREE.ConeGeometry(0.1, 0.8, 3), i % 2 ? '#8d7a33' : '#a08a3a');
    blade.rotateX(0.3);
    blade.rotateY(a);
    blade.translate(Math.cos(a) * 0.2, 0.38, Math.sin(a) * 0.2);
    parts.push(blade);
  }
  return mergeGeometries(parts);
}

function tyreStackGeo() {
  const parts = [];
  for (let i = 0; i < 3; i++) {
    parts.push(move(colored(new THREE.CylinderGeometry(0.62, 0.62, 0.34, 10), i === 2 ? '#2a2a2a' : '#1e1e1e'),
      (i % 2) * 0.06, 0.18 + i * 0.34, 0));
  }
  parts.push(move(colored(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 10), '#d8452e'), 0, 1.24, 0));
  return mergeGeometries(parts);
}

const KINDS = {
  maple: { geo: () => broadleafGeo('#d2662a', '#b8511f'), r: 1.0, knock: true },
  mapleRed: { geo: () => broadleafGeo('#b23a2c', '#8f2c22'), r: 1.0, knock: true },
  aspen: { geo: aspenGeo, r: 0.8, knock: true },
  pine: { geo: pineGeo, r: 0.9, knock: true },
  bare: { geo: bareGeo, r: 0.7, knock: true },
  stump: { geo: stumpGeo, r: 0.6, knock: false },
  rock: { geo: () => rockGeo('#7b7168'), r: 1.0, knock: false },
  rockDark: { geo: () => rockGeo('#63594f'), r: 1.0, knock: false },
  boulder: { geo: boulderGeo, r: 2.0, knock: false },
  shrub: { geo: shrubGeo, r: 0, knock: false },
  fern: { geo: fernGeo, r: 0, knock: false },
  tyre: { geo: tyreStackGeo, r: 0.75, knock: false },
};

const COLLIDE_BAND = 16; // only props this close to the corridor get colliders

export function buildRaceProps() {
  const group = new THREE.Group();
  const colliders = [];
  const buckets = {};
  for (const name of Object.keys(KINDS)) buckets[name] = [];

  const rnd = mulberry32(90210);
  const half = RACE_BOUNDS.size / 2 - 8;

  // --- 1. scattered woodland outside the corridor ---
  for (let i = 0; i < 42000; i++) {
    const x = (rnd() * 2 - 1) * half;
    const z = (rnd() * 2 - 1) * half;
    const it = info(x, z);
    if (it.inside > 0.02) continue;       // corridor stays clear
    if (it.over < 1.6) continue;          // shoulder stays clear
    if (it.over > 150) continue;          // beyond the fog, not worth drawing

    const steep = wallSteepness(it.over, WALL_MAX * it.wall);
    if (steep > 1.6) continue;            // nothing clings to the bank face

    const clump = fbm(x * 0.011 + 4, z * 0.011 + 9, 3);
    const roll = rnd();
    let kind = null;
    let scale = 0.85 + rnd() * 0.6;

    if (steep > 0.35) {
      // rocky berm: stone and scrub only
      if (roll < 0.05) kind = 'rock';
      else if (roll < 0.075) kind = 'rockDark';
      else if (roll < 0.085) kind = 'boulder';
      else if (roll < 0.12) kind = 'shrub';
    } else {
      // open ground and plateau: autumn woodland, clumped by noise
      const density = 0.22 + clump * 0.62;
      if (roll < density * 0.42) {
        const r2 = rnd();
        kind = r2 < 0.42 ? 'maple' : r2 < 0.68 ? 'mapleRed' : r2 < 0.86 ? 'aspen' : 'pine';
      } else if (roll < density * 0.52) kind = 'bare';
      else if (roll < density * 0.6) kind = 'stump';
      else if (roll < density * 0.74) kind = 'shrub';
      else if (roll < density * 0.9) kind = 'fern';
      else if (roll < density * 0.95) kind = 'rock';
    }
    if (!kind) continue;

    if (kind === 'rock' || kind === 'rockDark') scale = 0.5 + rnd() * 1.5;
    if (kind === 'boulder') scale = 0.7 + rnd() * 0.8;

    push(buckets, colliders, kind, x, z, it.height - 0.15, rnd() * Math.PI * 2, scale, it.over);
  }

  // --- 2. rally fencing along the fenced sections, tyre stacks on tight corners ---
  buildBarriers(buckets, colliders, group);

  // --- 3. bake the buckets into instanced meshes ---
  const dummy = new THREE.Object3D();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 });
  const meshByKind = {};

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length) continue;
    const im = new THREE.InstancedMesh(KINDS[name].geo(), mat, list.length);
    if (KINDS[name].knock) im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    list.forEach((tr, idx) => {
      dummy.position.set(tr.x, tr.y, tr.z);
      dummy.rotation.set(0, tr.rot, 0);
      dummy.scale.setScalar(tr.scale);
      dummy.updateMatrix();
      im.setMatrixAt(idx, dummy.matrix);
    });
    im.castShadow = true;
    im.receiveShadow = true;
    group.add(im);
    meshByKind[name] = im;
  }
  for (const c of colliders) c.mesh = meshByKind[c.kind] ?? null;

  return { group, colliders: makeColliderGrid(colliders) };
}

function push(buckets, colliders, kind, x, z, y, rot, scale, over) {
  const list = buckets[kind];
  list.push({ x, y, z, rot, scale });
  const r = KINDS[kind].r;
  if (r > 0 && over < COLLIDE_BAND) {
    colliders.push({
      x, z, r: r * Math.max(0.6, scale),
      alive: true, knockable: KINDS[kind].knock,
      kind, index: list.length - 1, rot, scale, mesh: null,
    });
  }
}

// Wooden fencing on the fast open sections, tyre stacks on the outside of the
// tightest corners: both read instantly as "the edge of the course".
function buildBarriers(buckets, colliders, group) {
  const postGeo = [];
  const railGeo = [];
  const step = 6;

  for (let i = 0; i < track.count - step; i += step) {
    const fence = track.fence[i];
    const nx = -track.tz[i], nz = track.tx[i];
    const off = track.w[i] + EDGE + 1.6;

    if (fence > 0.5) {
      for (const side of [1, -1]) {
        const x = track.x[i] + nx * off * side;
        const z = track.z[i] + nz * off * side;
        const y = info(x, z).height;
        const x2 = track.x[i + step] + (-track.tz[i + step]) * (track.w[i + step] + EDGE + 1.6) * side;
        const z2 = track.z[i + step] + (track.tx[i + step]) * (track.w[i + step] + EDGE + 1.6) * side;
        const y2 = info(x2, z2).height;

        postGeo.push(move(colored(new THREE.BoxGeometry(0.2, 1.7, 0.2), '#7d5c3a'), x, y + 0.85, z));

        // two rails spanning to the next post
        const dx = x2 - x, dy = y2 - y, dz = z2 - z;
        const len = Math.hypot(dx, dy, dz);
        for (const h of [1.35, 0.8]) {
          const rail = colored(new THREE.BoxGeometry(0.14, 0.2, len), '#c9b79a');
          rail.rotateX(-Math.atan2(dy, Math.hypot(dx, dz)));
          rail.rotateY(Math.atan2(dx, dz));
          rail.translate(x + dx / 2, y + h + dy / 2, z + dz / 2);
          railGeo.push(rail);
        }

        colliders.push({
          x, z, r: 1.1, alive: true, knockable: false,
          kind: 'fence', index: -1, rot: 0, scale: 1, mesh: null,
        });
      }
    }

    // curvature from the tangent swing over the next 20 m
    const j = Math.min(track.count - 1, i + 20);
    const cross = track.tx[i] * track.tz[j] - track.tz[i] * track.tx[j];
    if (Math.abs(cross) > 0.45 && fence <= 0.5) {
      const side = cross > 0 ? 1 : -1;   // stacks go on the outside of the bend
      for (let k = -1; k <= 1; k++) {
        const si = Math.min(track.count - 1, Math.max(0, i + k * 5));
        const ox = -track.tz[si], oz = track.tx[si];
        const d = track.w[si] + EDGE + 1.2;
        const x = track.x[si] + ox * d * side;
        const z = track.z[si] + oz * d * side;
        push(buckets, colliders, 'tyre', x, z, info(x, z).height, 0, 1, 0);
      }
    }
  }

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 });
  for (const parts of [postGeo, railGeo]) {
    if (!parts.length) continue;
    const mesh = new THREE.Mesh(mergeGeometries(parts), mat);
    mesh.castShadow = true;
    group.add(mesh);
  }
}
