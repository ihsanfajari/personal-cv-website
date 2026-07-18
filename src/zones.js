// Discovery beacons: light pillar + floating waypoint sign + rotating ring.
// Proximity is checked by main.js each frame.

import * as THREE from 'three';
import { ZONE_POS } from './config.js';
import { terrainHeight } from './heightmap.js';
import { CV_ZONES } from './cv-data.js';

// Rally Roadbook plate: slightly tilted paper card with a hard offset shadow,
// zone-colored accent bar and the title in the print typefaces — no emoji.
function makeLabelTexture(title, accent) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');

  const r = 24, w = 470, h = 140, x = 18, y = 48;
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate(-0.03);
  ctx.translate(-c.width / 2, -c.height / 2);

  // hard offset "print" shadow
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 10, w, h, r);
  ctx.fillStyle = 'rgba(32,20,10,0.9)';
  ctx.fill();

  // paper plate + ink border
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#202e3d';
  ctx.stroke();

  // zone accent bar on the left edge
  ctx.beginPath();
  ctx.roundRect(x + 18, y + 26, 14, h - 52, 7);
  ctx.fillStyle = accent;
  ctx.fill();

  ctx.fillStyle = '#202e3d';
  ctx.textBaseline = 'middle';
  ctx.font = '700 50px Fraunces, Georgia, serif';
  ctx.fillText(title, x + 54, y + h / 2 + 3, w - 90);

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
      map: makeLabelTexture(data.title, data.ui),
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
