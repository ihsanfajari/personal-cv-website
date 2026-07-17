// Low-poly faceted terrain mesh + sea + sky decor (clouds, birds).

import * as THREE from 'three';
import { WORLD } from './config.js';
import { terrainInfo } from './heightmap.js';
import { noise2 } from './noise.js';

const C = {
  grass: new THREE.Color('#7cc24f'),
  grassDark: new THREE.Color('#5fa23f'),
  forest: new THREE.Color('#4d9440'),
  desert: new THREE.Color('#ecc57a'),
  snow: new THREE.Color('#f2f6fa'),
  beach: new THREE.Color('#f0dca4'),
  path: new THREE.Color('#b08356'),
  rock: new THREE.Color('#8d9299'),
  seabed: new THREE.Color('#3f8f96'),
};

export function buildTerrain() {
  const { size, segments } = WORLD;
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const vertexData = []; // cached info per vertex for face coloring

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const info = terrainInfo(x, z);
    pos.setY(i, info.height);
    vertexData.push(info);
  }

  // non-indexed -> crisp per-face colors (classic low-poly look)
  const flat = geo.toNonIndexed();
  geo.dispose();
  const fpos = flat.attributes.position;
  const colors = new Float32Array(fpos.count * 3);
  const col = new THREE.Color(), tmp = new THREE.Color();

  for (let f = 0; f < fpos.count; f += 3) {
    // face centroid
    const cx = (fpos.getX(f) + fpos.getX(f + 1) + fpos.getX(f + 2)) / 3;
    const cy = (fpos.getY(f) + fpos.getY(f + 1) + fpos.getY(f + 2)) / 3;
    const cz = (fpos.getZ(f) + fpos.getZ(f + 1) + fpos.getZ(f + 2)) / 3;
    const info = terrainInfo(cx, cz);
    const b = info.biomes;

    col.set(0, 0, 0);
    col.add(tmp.copy(C.grass).lerp(C.grassDark, noise2(cx * 0.06, cz * 0.06)).multiplyScalar(b.grass));
    col.add(tmp.copy(C.forest).multiplyScalar(b.forest));
    col.add(tmp.copy(C.desert).multiplyScalar(b.desert));
    col.add(tmp.copy(C.beach).multiplyScalar(b.beach));
    // snow: rock below the snow line, white above
    const snowLine = 7 + noise2(cx * 0.05, cz * 0.05) * 4;
    if (b.snow > 0.001) {
      const snowCol = tmp.copy(C.rock).lerp(C.snow, cy > snowLine ? 1 : 0.25 + b.snow * 0.2);
      col.add(snowCol.multiplyScalar(b.snow));
    }

    // steep faces show rock
    const e1x = fpos.getX(f + 1) - fpos.getX(f), e1y = fpos.getY(f + 1) - fpos.getY(f), e1z = fpos.getZ(f + 1) - fpos.getZ(f);
    const e2x = fpos.getX(f + 2) - fpos.getX(f), e2y = fpos.getY(f + 2) - fpos.getY(f), e2z = fpos.getZ(f + 2) - fpos.getZ(f);
    const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
    const slope = 1 - Math.abs(ny) / (Math.hypot(nx, ny, nz) || 1);
    if (slope > 0.45) col.lerp(C.rock, Math.min(1, (slope - 0.45) * 2.2));

    // dirt path tint
    if (info.path > 0.02) col.lerp(C.path, info.path * 0.85);

    // shore & seabed
    if (cy < 1.1) col.lerp(C.beach, Math.min(1, (1.1 - cy) * 0.9));
    if (cy < 0.15) col.lerp(C.seabed, Math.min(1, (0.15 - cy) * 0.35));

    // subtle per-face jitter sells the low-poly style
    const jitter = 0.94 + noise2(cx * 3.7, cz * 3.7) * 0.12;
    col.multiplyScalar(jitter);

    for (let v = 0; v < 3; v++) {
      colors[(f + v) * 3] = col.r;
      colors[(f + v) * 3 + 1] = col.g;
      colors[(f + v) * 3 + 2] = col.b;
    }
  }

  flat.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  flat.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness: 1,
    metalness: 0,
  });
  const mesh = new THREE.Mesh(flat, mat);
  mesh.receiveShadow = true;
  return mesh;
}

export function buildSea() {
  const group = new THREE.Group();

  const geo = new THREE.PlaneGeometry(WORLD.size * 3.4, WORLD.size * 3.4, 56, 56);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({
    color: '#2f9ec4',
    transparent: true,
    opacity: 0.88,
    roughness: 0.55,
    metalness: 0,
    flatShading: true,
  });
  const sea = new THREE.Mesh(geo, mat);
  sea.position.y = WORLD.waterLevel;
  sea.receiveShadow = true;
  group.add(sea);

  // store base positions for gentle wave animation
  const base = geo.attributes.position.array.slice();
  group.userData.update = (t) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      p.setY(i, Math.sin(x * 0.06 + t * 1.1) * 0.22 + Math.cos(z * 0.05 + t * 0.8) * 0.22);
    }
    p.needsUpdate = true;
  };
  return group;
}

export function buildClouds() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1 });
  const puff = new THREE.IcosahedronGeometry(1, 0);

  for (let i = 0; i < 14; i++) {
    const cloud = new THREE.Group();
    const n = 3 + Math.floor(Math.random() * 3);
    for (let j = 0; j < n; j++) {
      const m = new THREE.Mesh(puff, mat);
      m.position.set((j - n / 2) * 3.2 + Math.random() * 2, Math.random() * 1.4, Math.random() * 2.5);
      const s = 2.2 + Math.random() * 2.6;
      m.scale.set(s * 1.5, s * 0.6, s);
      cloud.add(m);
    }
    const a = Math.random() * Math.PI * 2;
    const r = 60 + Math.random() * 200;
    cloud.position.set(Math.cos(a) * r, 46 + Math.random() * 22, Math.sin(a) * r);
    cloud.userData.speed = 0.4 + Math.random() * 0.7;
    group.add(cloud);
  }

  group.userData.update = (dt) => {
    for (const c of group.children) {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 420) c.position.x = -420;
    }
  };
  return group;
}
