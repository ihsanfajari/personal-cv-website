// Rusty: a retired delivery van parked off the coastal trail. Pure flavor —
// drive up close and it cycles through its life story in a speech bubble.
// Its solid collider is registered in props.js so the truck can't clip it.

import * as THREE from 'three';
import { terrainHeight, terrainNormal } from './heightmap.js';
import { NPC_POS } from './config.js';

const TALK_RANGE = 16;   // bubble appears inside this distance
const LINE_TIME = 4.5;   // seconds per line while the player sticks around

const LINES = [
  "Oh! A visitor! Haven't seen headlights out here since 2019.",
  "Name's Rusty. I hauled every one of Ihsan's deadlines. Never dropped one.",
  "Six years of projects in my cargo bay — games, dashboards, a whole metaverse once.",
  "The secret to shipping on time? Good brakes, better planning.",
  "Five glowing waypoints hold his story. Me? I mostly hold rust together.",
  "If you find my missing hubcap out there, keep it. Souvenir.",
];

const RUST_BODY = '#b06a3a';
const RUST_DARK = '#7d4a26';
const GLASS = '#4a5a6a';

function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 1 })
  );
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function buildVanMesh() {
  const van = new THREE.Group();

  // boxy delivery van, front facing +z, sitting a bit saggy on old suspension
  van.add(box(2.0, 1.5, 3.2, RUST_BODY, 0, 1.35, -0.5));        // cargo box
  van.add(box(1.9, 0.9, 1.4, RUST_BODY, 0, 1.05, 1.55));        // cab / hood
  van.add(box(1.95, 0.1, 3.1, RUST_DARK, 0, 2.15, -0.5));       // roof
  van.add(box(1.7, 0.5, 0.06, GLASS, 0, 1.45, 2.26));           // windshield
  van.add(box(0.06, 0.4, 0.9, GLASS, 0.98, 1.45, 1.45));
  van.add(box(0.06, 0.4, 0.9, GLASS, -0.98, 1.45, 1.45));
  van.add(box(2.1, 0.28, 0.3, '#8a8a8a', 0, 0.62, 2.3));        // bumpers
  van.add(box(2.1, 0.28, 0.3, '#8a8a8a', 0, 0.62, -2.2));

  // rust patches
  for (const [px, py, pz, s] of [[1.01, 1.2, -0.9, 0.7], [-1.01, 1.5, 0.1, 0.5], [0.7, 1.9, -1.9, 0.6]]) {
    van.add(box(0.06, 0.5 * s, 0.8 * s, RUST_DARK, px, py, pz));
  }

  // headlights (one dim — it's been a while)
  const bright = new THREE.MeshStandardMaterial({ color: '#fff6d8', emissive: '#fff2b0', emissiveIntensity: 0.5 });
  const dead = new THREE.MeshStandardMaterial({ color: '#9a9483', flatShading: true });
  const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), bright);
  h1.position.set(0.65, 1.05, 2.28);
  const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), dead);
  h2.position.set(-0.65, 1.05, 2.28);
  van.add(h1, h2);

  // wheels — the front-left one is missing its hubcap (see dialog)
  const tireMat = new THREE.MeshStandardMaterial({ color: '#1c1c1c', flatShading: true, roughness: 1 });
  const hubMat = new THREE.MeshStandardMaterial({ color: '#b9b9b9', flatShading: true, roughness: 0.6 });
  const positions = [
    { x: 1.0, z: 1.45, hub: false }, { x: -1.0, z: 1.45, hub: true },
    { x: 1.0, z: -1.45, hub: true }, { x: -1.0, z: -1.45, hub: true },
  ];
  for (const p of positions) {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.36, 10), tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(p.x, 0.44, p.z);
    tire.castShadow = true;
    van.add(tire);
    if (p.hub) {
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.38, 8), hubMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(p.x, 0.44, p.z);
      van.add(hub);
    }
  }

  return van;
}

function makeBubbleTexture(text) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 224;
  const ctx = c.getContext('2d');

  const r = 34, w = 1000, h = 150, x = 12, y = 16;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = 'rgba(255,253,246,0.97)';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(29,43,58,0.9)';
  ctx.stroke();

  // tail pointing down at the van
  ctx.beginPath();
  ctx.moveTo(x + w / 2 - 26, y + h - 4);
  ctx.lineTo(x + w / 2, y + h + 44);
  ctx.lineTo(x + w / 2 + 26, y + h - 4);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,253,246,0.97)';
  ctx.fill();

  ctx.fillStyle = '#1d2b3a';
  ctx.font = 'italic 700 40px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 2, w - 70);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

export function buildNpc(scene) {
  const group = new THREE.Group();
  const y = terrainHeight(NPC_POS.x, NPC_POS.z);
  group.position.set(NPC_POS.x, y, NPC_POS.z);

  // settle onto the local slope
  const n = terrainNormal(NPC_POS.x, NPC_POS.z, new THREE.Vector3());
  const fwd = new THREE.Vector3(Math.sin(NPC_POS.heading), 0, Math.cos(NPC_POS.heading));
  fwd.addScaledVector(n, -fwd.dot(n)).normalize();
  const right = new THREE.Vector3().crossVectors(n, fwd).normalize();
  group.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, n, fwd));

  group.add(buildVanMesh());

  // name plate, always faintly visible up close
  const bubbleMat = new THREE.SpriteMaterial({ map: makeBubbleTexture(LINES[0]), transparent: true, opacity: 0, depthTest: false });
  const bubble = new THREE.Sprite(bubbleMat);
  bubble.scale.set(13, 2.85, 1);
  bubble.position.y = 4.6;
  bubble.renderOrder = 6;
  group.add(bubble);

  scene.add(group);

  const state = {
    line: 0,
    timer: 0,
    inRange: false,
  };

  return {
    group,
    pos: group.position,
    update(dt, carPos) {
      const d = carPos.distanceTo(group.position);
      const inRange = d < TALK_RANGE;

      if (inRange) {
        state.timer += dt;
        if (!state.inRange || state.timer > LINE_TIME) {
          // advance on (re-)entry and every few seconds while parked nearby
          if (state.inRange) state.line = (state.line + 1) % LINES.length;
          state.timer = 0;
          bubbleMat.map?.dispose();
          bubbleMat.map = makeBubbleTexture(LINES[state.line]);
        }
      }
      state.inRange = inRange;

      const target = inRange ? 1 : 0;
      bubbleMat.opacity += (target - bubbleMat.opacity) * Math.min(1, dt * 5);
      bubble.position.y = 4.6 + Math.sin(performance.now() / 700) * 0.12;
    },
  };
}
