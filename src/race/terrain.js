// Faceted terrain for the autumn race world, plus the water sheet that sits in
// the creek crossing. Same low-poly recipe as the island, different palette and
// a colour rule keyed off the track corridor instead of biomes.

import * as THREE from 'three';
import { noise2 } from '../noise.js';
import { info, track, wallSteepness, RACE_BOUNDS, WALL_MAX } from './world.js';

const C = {
  dirt: new THREE.Color('#ad6a40'),
  dirtDark: new THREE.Color('#945732'),
  mud: new THREE.Color('#55412c'),
  water: new THREE.Color('#3d7480'),
  shoulder: new THREE.Color('#b39c4e'),
  shoulderDry: new THREE.Color('#9a8540'),
  scrub: new THREE.Color('#a2642c'),
  scrubHot: new THREE.Color('#b8762e'),
  rock: new THREE.Color('#7b7168'),
  rockDark: new THREE.Color('#5f574f'),
  floor: new THREE.Color('#6f5a35'),
};

export function buildRaceTerrain() {
  const { size, segments } = RACE_BOUNDS;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, info(pos.getX(i), pos.getZ(i)).height);
  }

  const flat = geo.toNonIndexed();
  geo.dispose();
  const fpos = flat.attributes.position;
  const colors = new Float32Array(fpos.count * 3);
  const col = new THREE.Color(), tmp = new THREE.Color();

  for (let f = 0; f < fpos.count; f += 3) {
    const cx = (fpos.getX(f) + fpos.getX(f + 1) + fpos.getX(f + 2)) / 3;
    const cz = (fpos.getZ(f) + fpos.getZ(f + 1) + fpos.getZ(f + 2)) / 3;
    const it = info(cx, cz);
    const grain = noise2(cx * 0.09, cz * 0.09);

    if (it.inside > 0.45) {
      // rutted dirt, darkening into mud and water
      col.copy(C.dirt).lerp(C.dirtDark, grain);
      if (it.mud > 0.02) col.lerp(C.mud, Math.min(1, it.mud * 0.95));
      if (it.water > 0.02) col.lerp(C.water, Math.min(1, it.water * 0.9));
      // dusty edge where the corridor meets the shoulder
      col.lerp(tmp.copy(C.shoulder), (1 - it.inside) * 0.55);
    } else if (it.over < 3.2) {
      col.copy(C.shoulder).lerp(C.shoulderDry, grain);
    } else {
      const steep = wallSteepness(it.over, WALL_MAX * it.wall);
      if (steep > 0.95) {
        col.copy(C.rock).lerp(C.rockDark, grain);
      } else {
        col.copy(C.scrub).lerp(C.scrubHot, grain);
        col.lerp(tmp.copy(C.floor), noise2(cx * 0.03 + 7, cz * 0.03 + 4));
      }
    }

    for (let k = 0; k < 3; k++) {
      colors[(f + k) * 3] = col.r;
      colors[(f + k) * 3 + 1] = col.g;
      colors[(f + k) * 3 + 2] = col.b;
    }
  }

  flat.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  flat.computeVertexNormals();

  const mesh = new THREE.Mesh(flat, new THREE.MeshStandardMaterial({
    vertexColors: true, flatShading: true, roughness: 1,
  }));
  mesh.receiveShadow = true;
  return mesh;
}

// A translucent sheet across every stretch of the course flagged as water.
export function buildCreek() {
  const verts = [];
  const runs = [];
  let start = -1;
  for (let i = 0; i < track.count; i++) {
    const wet = track.water[i] > 0.18;
    if (wet && start < 0) start = i;
    if (!wet && start >= 0) { runs.push([start, i - 1]); start = -1; }
  }
  if (start >= 0) runs.push([start, track.count - 1]);

  for (const [a, b] of runs) {
    for (let i = a; i < b; i++) {
      const halfW = track.w[i] + 4;
      const nx = -track.tz[i], nz = track.tx[i];
      const y = track.y[i] - track.water[i] * 1.15 + 0.55;
      const nx2 = -track.tz[i + 1], nz2 = track.tx[i + 1];
      const halfW2 = track.w[i + 1] + 4;
      const y2 = track.y[i + 1] - track.water[i + 1] * 1.15 + 0.55;

      const l1 = [track.x[i] + nx * halfW, y, track.z[i] + nz * halfW];
      const r1 = [track.x[i] - nx * halfW, y, track.z[i] - nz * halfW];
      const l2 = [track.x[i + 1] + nx2 * halfW2, y2, track.z[i + 1] + nz2 * halfW2];
      const r2 = [track.x[i + 1] - nx2 * halfW2, y2, track.z[i + 1] - nz2 * halfW2];
      verts.push(...l1, ...r1, ...l2, ...r1, ...r2, ...l2);
    }
  }
  if (!verts.length) return null;

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  g.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: '#5fa8b8', transparent: true, opacity: 0.72,
    roughness: 0.15, metalness: 0.1, flatShading: true,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.renderOrder = 2;
  return mesh;
}

// Hazy autumn sky dome + a few drifting clouds, kept cheap.
export function buildSky() {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshBasicMaterial({
    color: '#fdf3e4', transparent: true, opacity: 0.75, depthWrite: false,
  });
  const clouds = [];
  for (let i = 0; i < 16; i++) {
    const c = new THREE.Group();
    const lumps = 3 + (i % 3);
    for (let k = 0; k < lumps; k++) {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(9 + (k % 3) * 4, 0), cloudMat);
      m.position.set(k * 13 - lumps * 5, (k % 2) * 3, (k % 2) * 6);
      m.scale.set(1.5, 0.55, 1);
      c.add(m);
    }
    c.position.set((Math.random() * 2 - 1) * 420, 120 + Math.random() * 55, (Math.random() * 2 - 1) * 420);
    group.add(c);
    clouds.push(c);
  }
  group.userData.update = (dt) => {
    for (const c of clouds) {
      c.position.x += dt * 1.6;
      if (c.position.x > 440) c.position.x = -440;
    }
  };
  return group;
}
