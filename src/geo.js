// Small helpers shared by the island and race prop builders: baking a flat
// colour into a geometry, a deterministic PRNG so scatter is stable between
// visits, and the spatial hash the car queries for collisions.

import * as THREE from 'three';

export function colored(geo, hex) {
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

export function move(geo, x, y, z) {
  geo.translate(x, y, z);
  return geo;
}

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CELL = 16;

export function makeColliderGrid(list) {
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
