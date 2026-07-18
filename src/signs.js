// Roadside joke signs at path junctions: wooden post + billboard sprite,
// built like the zone label sprites. Pure decoration, no colliders.

import * as THREE from 'three';
import { terrainHeight } from './heightmap.js';

// Placed just off the dirt paths defined in config.js PATH_SEGMENTS.
const SIGN_DEFS = [
  { x: 5, z: 27, text: 'You are here. So is the truck.' },
  { x: 7, z: -17, text: 'Last gas station: none. Enjoy!' },
  { x: -75, z: -4, text: 'Trees have right of way' },
  { x: 78, z: 2, text: 'Free cactus hugs — 500 m' },
  { x: -14, z: -64, text: 'Snow tires? Never heard of ’em' },
  { x: -6, z: 90, text: 'Reminder: trucks can’t swim' },
  { x: 98, z: 64, text: 'Scenic coastal shortcut. Probably.' },
  { x: -72, z: -63, text: 'Peaks shortcut — bring a jacket' },
];

function makeSignTexture(text) {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 160;
  const ctx = c.getContext('2d');

  // wooden plank
  const r = 18, w = 616, h = 116, x = 12, y = 22;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = '#b3814a';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#7a5230';
  ctx.stroke();

  // nails in the corners
  ctx.fillStyle = '#5c3d1f';
  for (const [nx, ny] of [[x + 22, y + 22], [x + w - 22, y + 22], [x + 22, y + h - 22], [x + w - 22, y + h - 22]]) {
    ctx.beginPath();
    ctx.arc(nx, ny, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#2e1d0e';
  ctx.font = '800 44px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 2, w - 80);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

export function buildSigns(scene) {
  const signs = [];
  const postMat = new THREE.MeshStandardMaterial({ color: '#7a5230', flatShading: true, roughness: 1 });
  const postGeo = new THREE.BoxGeometry(0.22, 2.8, 0.22);

  for (const def of SIGN_DEFS) {
    const y = terrainHeight(def.x, def.z);
    const group = new THREE.Group();
    group.position.set(def.x, y, def.z);

    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 1.4;
    post.castShadow = true;
    group.add(post);

    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeSignTexture(def.text),
      transparent: true,
    }));
    sprite.scale.set(8.5, 2.1, 1);
    sprite.position.y = 3.4;
    sprite.renderOrder = 4;
    group.add(sprite);

    scene.add(group);
    signs.push({ pos: group.position, sprite });
  }

  return signs;
}

// Plates fade in as the car approaches, same trick as the zone labels.
export function animateSigns(signs, carPos) {
  for (const s of signs) {
    const d = carPos.distanceTo(s.pos);
    s.sprite.material.opacity = THREE.MathUtils.clamp((75 - d) / 30, 0, 1);
  }
}
