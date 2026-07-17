// Biome scenery (pines, palms, cacti, rocks, bushes) as instanced meshes,
// plus a spatial hash of circle colliders for the car.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { terrainInfo } from './heightmap.js';
import { ZONE_POS, SPAWN, WORLD, NPC_POS } from './config.js';

function colored(geo, hex) {
  const g = geo.toNonIndexed();
  geo.dispose();
  const c = new THREE.Color(hex);
  const arr = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < g.attributes.position.count; i++) {
    arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g;
}

function move(geo, x, y, z) { geo.translate(x, y, z); return geo; }

// ---- prop geometries (origin at ground level) ----

function pineGeo(snowy) {
  const foliage = snowy ? '#dfe9ef' : '#3e7d36';
  const foliage2 = snowy ? '#c9d9e2' : '#356d2e';
  return mergeGeometries([
    move(colored(new THREE.CylinderGeometry(0.22, 0.3, 1.6, 5), '#7a5236'), 0, 0.8, 0),
    move(colored(new THREE.ConeGeometry(1.5, 2.2, 6), foliage2), 0, 2.3, 0),
    move(colored(new THREE.ConeGeometry(1.1, 1.9, 6), foliage), 0, 3.6, 0),
    move(colored(new THREE.ConeGeometry(0.7, 1.5, 6), foliage), 0, 4.7, 0),
  ]);
}

function roundTreeGeo() {
  return mergeGeometries([
    move(colored(new THREE.CylinderGeometry(0.25, 0.35, 1.8, 5), '#8a5f3d'), 0, 0.9, 0),
    move(colored(new THREE.IcosahedronGeometry(1.6, 0), '#63a844'), 0, 3.0, 0),
    move(colored(new THREE.IcosahedronGeometry(1.0, 0), '#71b94f'), 0.9, 2.4, 0.4),
  ]);
}

function palmGeo() {
  const parts = [];
  // slightly leaning segmented trunk
  for (let i = 0; i < 4; i++) {
    parts.push(move(colored(new THREE.CylinderGeometry(0.18, 0.24, 1.1, 5), '#9b7247'),
      i * 0.28, 0.5 + i * 1.0, 0));
  }
  // fronds
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const frond = colored(new THREE.ConeGeometry(0.32, 2.6, 4), '#4fae4a');
    frond.rotateZ(Math.PI / 2.4);
    frond.rotateY(a);
    frond.translate(0.28 * 3 + Math.cos(a) * 1.0, 4.35, Math.sin(a) * 1.0);
    parts.push(frond);
  }
  return mergeGeometries(parts);
}

function cactusGeo() {
  return mergeGeometries([
    move(colored(new THREE.CylinderGeometry(0.45, 0.55, 3.0, 7), '#3f9c4d'), 0, 1.5, 0),
    move(colored(new THREE.CylinderGeometry(0.3, 0.3, 1.3, 6), '#48ab57'), 0.85, 2.1, 0),
    move(colored(new THREE.CylinderGeometry(0.3, 0.3, 1.0, 6), '#48ab57'), -0.8, 1.8, 0),
  ]);
}

function rockGeo() {
  const g = colored(new THREE.IcosahedronGeometry(1, 0), '#8d9299');
  g.scale(1, 0.75, 1);
  return g;
}

function bushGeo() {
  return colored(new THREE.IcosahedronGeometry(0.7, 0), '#549b3f');
}

function flowerGeo() {
  const petals = ['#e2554d', '#f2c14e', '#fdf6ec'];
  const parts = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const px = Math.cos(a) * 0.35, pz = Math.sin(a) * 0.35;
    parts.push(move(colored(new THREE.CylinderGeometry(0.04, 0.05, 0.55, 4), '#4c8a3c'), px, 0.27, pz));
    parts.push(move(colored(new THREE.IcosahedronGeometry(0.17, 0), petals[i]), px, 0.6, pz));
  }
  return mergeGeometries(parts);
}

function tuftGeo() {
  const parts = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    const blade = colored(new THREE.ConeGeometry(0.09, 0.75, 3), i % 2 ? '#5da84a' : '#4c9440');
    blade.rotateX(0.25);
    blade.rotateY(a);
    blade.translate(Math.cos(a) * 0.18, 0.36, Math.sin(a) * 0.18);
    parts.push(blade);
  }
  return mergeGeometries(parts);
}

function deadTreeGeo() {
  const wood = '#8d7358';
  const b1 = colored(new THREE.CylinderGeometry(0.1, 0.14, 1.4, 4), wood);
  b1.rotateZ(0.7);
  b1.translate(0.5, 2.6, 0);
  const b2 = colored(new THREE.CylinderGeometry(0.08, 0.12, 1.1, 4), wood);
  b2.rotateZ(-0.8);
  b2.rotateY(1.2);
  b2.translate(-0.35, 2.2, 0.3);
  return mergeGeometries([
    move(colored(new THREE.CylinderGeometry(0.18, 0.32, 2.8, 5), wood), 0, 1.4, 0),
    b1, b2,
  ]);
}

function driftwoodGeo() {
  const g = colored(new THREE.CylinderGeometry(0.22, 0.35, 3.4, 5), '#a98d6f');
  g.rotateZ(Math.PI / 2);
  g.rotateY(0.3);
  g.translate(0, 0.3, 0);
  return g;
}

function snowmanGeo() {
  const snow = '#f4f9fc';
  const carrot = colored(new THREE.ConeGeometry(0.07, 0.32, 5), '#e8853a');
  carrot.rotateX(Math.PI / 2);
  carrot.translate(0, 1.82, 0.3);
  return mergeGeometries([
    move(colored(new THREE.IcosahedronGeometry(0.55, 1), snow), 0, 0.5, 0),
    move(colored(new THREE.IcosahedronGeometry(0.4, 1), snow), 0, 1.25, 0),
    move(colored(new THREE.IcosahedronGeometry(0.28, 1), snow), 0, 1.8, 0),
    carrot,
  ]);
}

const KNOCKABLE = new Set(['pine', 'snowPine', 'roundTree', 'palm', 'cactus', 'deadTree', 'snowman']);

// ---- placement ----

export function buildProps() {
  const group = new THREE.Group();
  const colliders = [];
  const zones = Object.values(ZONE_POS);

  const kinds = {
    pine: { geo: pineGeo(false), t: [], collideR: 0.9 },
    snowPine: { geo: pineGeo(true), t: [], collideR: 0.9 },
    roundTree: { geo: roundTreeGeo(), t: [], collideR: 0.9 },
    palm: { geo: palmGeo(), t: [], collideR: 0.7 },
    cactus: { geo: cactusGeo(), t: [], collideR: 0.9 },
    rock: { geo: rockGeo(), t: [], collideR: 1.0 },
    bush: { geo: bushGeo(), t: [], collideR: 0 },
    flower: { geo: flowerGeo(), t: [], collideR: 0 },
    tuft: { geo: tuftGeo(), t: [], collideR: 0 },
    deadTree: { geo: deadTreeGeo(), t: [], collideR: 0.7 },
    driftwood: { geo: driftwoodGeo(), t: [], collideR: 0.9 },
    snowman: { geo: snowmanGeo(), t: [], collideR: 0.7 },
  };

  const rnd = mulberry32(1337);
  const R = WORLD.islandFade;
  const attempts = 24000;

  for (let i = 0; i < attempts; i++) {
    const x = (rnd() * 2 - 1) * R;
    const z = (rnd() * 2 - 1) * R;
    if (Math.hypot(x, z) > R) continue;

    const info = terrainInfo(x, z);
    if (info.height < 1.0) continue;              // underwater / shoreline
    if (info.path > 0.12) continue;               // keep the road clear
    if (Math.hypot(x - SPAWN.x, z - SPAWN.z) < 14) continue;
    if (Math.hypot(x - NPC_POS.x, z - NPC_POS.z) < 10) continue; // Rusty's parking spot
    if (zones.some((p) => Math.hypot(x - p.x, z - p.z) < 15)) continue;

    const b = info.biomes;
    const roll = rnd();
    let kind = null, scale = 0.8 + rnd() * 0.7;

    if (b.forest > 0.45 && roll < b.forest * 0.75) {
      const r2 = rnd();
      kind = r2 < 0.72 ? 'pine' : r2 < 0.86 ? 'roundTree' : r2 < 0.95 ? 'tuft' : 'flower';
    } else if (b.snow > 0.45) {
      if (info.height > 22) { if (roll < 0.1) kind = 'rock'; }
      else if (roll < 0.28) kind = rnd() < 0.8 ? 'snowPine' : 'rock';
      else if (roll < 0.295) kind = 'snowman';
    } else if (b.desert > 0.5) {
      if (roll < 0.05) kind = 'cactus';
      else if (roll < 0.08) kind = 'rock';
      else if (roll < 0.105) kind = 'deadTree';
    } else if (b.beach > 0.45) {
      if (info.height < 3.2 && roll < 0.14) kind = 'palm';
      else if (roll < 0.17) kind = 'bush';
      else if (info.height < 2.6 && roll < 0.22) kind = 'driftwood';
    } else if (b.grass > 0.5) {
      if (roll < 0.035) kind = 'roundTree';
      else if (roll < 0.06) kind = 'pine';
      else if (roll < 0.11) kind = 'bush';
      else if (roll < 0.13) kind = 'rock';
      else if (roll < 0.17) kind = 'flower';
      else if (roll < 0.22) kind = 'tuft';
    }
    if (!kind) continue;

    if (kind === 'rock') scale = 0.5 + rnd() * 1.6;
    const rot = rnd() * Math.PI * 2;
    kinds[kind].t.push({ x, y: info.height - 0.15, z, rot, scale });

    const cr = kinds[kind].collideR;
    if (cr > 0) {
      colliders.push({
        x, z, r: cr * Math.max(0.6, scale),
        alive: true,
        knockable: KNOCKABLE.has(kind),      // trees & cacti topple; rocks stay put
        kind, index: kinds[kind].t.length - 1,
        rot, scale,
        mesh: null,                          // filled in below once meshes exist
      });
    }
  }

  const dummy = new THREE.Object3D();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 });

  const meshByKind = {};
  for (const name of Object.keys(kinds)) {
    const k = kinds[name];
    if (k.t.length === 0) continue;
    const im = new THREE.InstancedMesh(k.geo, mat, k.t.length);
    if (KNOCKABLE.has(name)) im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    k.t.forEach((tr, idx) => {
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

  // Rusty the NPC van parks here — solid and immovable (visuals in npc.js)
  colliders.push({
    x: NPC_POS.x, z: NPC_POS.z, r: 2.3,
    alive: true, knockable: false, kind: 'npc', index: -1, rot: 0, scale: 1, mesh: null,
  });

  return { group, colliders: makeColliderGrid(colliders) };
}

// deterministic PRNG so the island looks the same every visit
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- spatial hash for collision queries ----

const CELL = 16;

function makeColliderGrid(list) {
  const grid = new Map();
  for (const c of list) {
    const key = `${Math.floor(c.x / CELL)},${Math.floor(c.z / CELL)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(c);
  }
  return {
    query(x, z, out) {
      out.length = 0;
      const cx = Math.floor(x / CELL), cz = Math.floor(z / CELL);
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const cell = grid.get(`${cx + i},${cz + j}`);
          if (cell) out.push(...cell);
        }
      }
      return out;
    },
  };
}
