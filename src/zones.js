// Discovery beacons: light pillar + floating emoji sign + rotating ring.
// Proximity is checked by main.js each frame.

import * as THREE from 'three';
import { ZONE_POS } from './config.js';
import { terrainHeight } from './heightmap.js';
import { CV_ZONES } from './cv-data.js';

function makeLabelTexture(emoji, title) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');

  // rounded plate
  const r = 40, w = 500, h = 150, x = 6, y = 40;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = 'rgba(255,253,246,0.96)';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(29,43,58,0.9)';
  ctx.stroke();

  ctx.font = '84px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, 34, y + h / 2 + 6);

  ctx.fillStyle = '#1d2b3a';
  ctx.font = '800 52px "Segoe UI", Arial, sans-serif';
  ctx.fillText(title, 150, y + h / 2 + 4, 340);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

export function buildZones(scene) {
  const zones = [];

  for (const data of CV_ZONES) {
    const p = ZONE_POS[data.id];
    const y = terrainHeight(p.x, p.z);
    const group = new THREE.Group();
    group.position.set(p.x, y, p.z);

    const color = new THREE.Color(data.color);

    // light pillar
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.5, 26, 10, 1, true),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.32,
        side: THREE.DoubleSide, depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    pillar.position.y = 13;
    group.add(pillar);

    // ground ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(5.5, 0.3, 8, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.55;
    group.add(ring);

    // floating gem
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.1, 0),
      new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 0.55,
        flatShading: true, roughness: 0.4,
      })
    );
    gem.position.y = 6.2;
    gem.castShadow = true;
    group.add(gem);

    // label sprite
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeLabelTexture(data.emoji, data.title),
      depthTest: false,
      transparent: true,
    }));
    sprite.scale.set(11, 5.5, 1);
    sprite.position.y = 10.5;
    sprite.renderOrder = 5;
    group.add(sprite);

    scene.add(group);
    zones.push({
      data,
      pos: new THREE.Vector3(p.x, y, p.z),
      group, pillar, ring, gem, sprite,
      radius: 10,
      discovered: false,
      inside: false,
    });
  }

  return zones;
}

export function animateZones(zones, t, dt, carPos) {
  for (const z of zones) {
    z.gem.rotation.y += dt * 1.4;
    z.gem.position.y = 6.2 + Math.sin(t * 2 + z.pos.x) * 0.5;
    z.ring.rotation.z += dt * 0.5;
    const pulse = 0.9 + Math.sin(t * 3) * 0.12;
    z.ring.scale.setScalar(pulse);

    // labels fade in with distance, pillars dim once discovered
    const d = carPos.distanceTo(z.pos);
    z.sprite.material.opacity = THREE.MathUtils.clamp((90 - d) / 45, 0, 1);
    const targetOp = z.discovered ? 0.10 : 0.32;
    z.pillar.material.opacity += (targetOp - z.pillar.material.opacity) * Math.min(1, dt * 3);
  }
}
