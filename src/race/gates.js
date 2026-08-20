// Start banner, five checkpoint gates and the finish line. Each gate straddles
// the corridor so it is impossible to miss without leaving the course.

import * as THREE from 'three';
import { info, track, EDGE } from './world.js';

// Chosen so every gate lands just after a feature: jump 1, the creek, the
// switchbacks, the big drop, the mud basin.
export const START_S = 6;
export const CHECKPOINT_S = [350, 620, 920, 1180, 1450];

const AMBER = '#e8a33d';
const GREEN = '#54b45a';

function bannerTexture(label, style) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 192;
  const ctx = c.getContext('2d');

  if (style === 'finish') {
    const sq = 24;
    for (let y = 0; y < c.height; y += sq) {
      for (let x = 0; x < c.width; x += sq) {
        ctx.fillStyle = ((x / sq + y / sq) % 2) ? '#f5f5f5' : '#1d1d1d';
        ctx.fillRect(x, y, sq, sq);
      }
    }
    ctx.fillStyle = 'rgba(20,20,20,0.82)';
    ctx.fillRect(0, 52, c.width, 88);
    ctx.fillStyle = '#fff8e8';
  } else {
    ctx.fillStyle = style === 'start' ? '#2c3f52' : '#4a3524';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = style === 'start' ? '#d8452e' : AMBER;
    ctx.fillRect(0, 0, c.width, 14);
    ctx.fillRect(0, c.height - 14, c.width, 14);
    ctx.fillStyle = '#fff8e8';
  }

  ctx.font = '800 92px "Work Sans", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, c.width / 2, c.height / 2 + 4, c.width - 60);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function buildGate(s, label, style) {
  const p = track.sampleAt(s);
  const group = new THREE.Group();
  const halfSpan = p.w + EDGE + 1.2;
  const nx = -p.tz, nz = p.tx;

  const woodMat = new THREE.MeshStandardMaterial({
    color: style === 'finish' ? '#3a3a3a' : '#6d4c2f', flatShading: true, roughness: 1,
  });
  const postGeo = new THREE.BoxGeometry(0.42, 6.4, 0.42);

  const feet = [];
  for (const side of [1, -1]) {
    const x = p.x + nx * halfSpan * side;
    const z = p.z + nz * halfSpan * side;
    const y = info(x, z).height;
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.set(x, y + 3.2, z);
    post.castShadow = true;
    group.add(post);
    feet.push({ x, y, z });
  }

  const topY = Math.max(feet[0].y, feet[1].y) + 6.1;
  const span = halfSpan * 2;

  const beam = new THREE.Mesh(new THREE.BoxGeometry(span, 0.3, 0.3), woodMat);
  beam.position.set(p.x, topY + 0.35, p.z);
  beam.rotation.y = Math.atan2(nx, nz);
  group.add(beam);

  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(span * 0.92, 1.9),
    new THREE.MeshBasicMaterial({ map: bannerTexture(label, style), side: THREE.DoubleSide, transparent: true })
  );
  banner.position.set(p.x, topY - 0.75, p.z);
  banner.rotation.y = Math.atan2(p.tx, p.tz);
  group.add(banner);

  // painted line across the corridor
  const lineMat = new THREE.MeshStandardMaterial({
    color: style === 'checkpoint' ? AMBER : '#f2efe6', flatShading: true, roughness: 0.9,
  });
  const line = new THREE.Mesh(new THREE.BoxGeometry(span, 0.5, 1.4), lineMat);
  const groundY = info(p.x, p.z).height;
  line.position.set(p.x, groundY + 0.1, p.z);
  line.rotation.y = Math.atan2(nx, nz);
  group.add(line);

  return {
    s, group, line, lineMat, passed: false,
    pos: new THREE.Vector3(p.x, groundY, p.z),
    heading: p.heading,
    markPassed() {
      if (this.passed) return;
      this.passed = true;
      this.lineMat.color.set(GREEN);
    },
  };
}

export function buildGates(scene) {
  const start = buildGate(START_S, 'START', 'start');
  const finish = buildGate(track.length - 6, 'FINISH', 'finish');
  const checkpoints = CHECKPOINT_S.map((s, i) =>
    buildGate(s, `CHECKPOINT ${i + 1}`, 'checkpoint'));

  scene.add(start.group, finish.group);
  for (const c of checkpoints) scene.add(c.group);

  return { start, finish, checkpoints };
}
