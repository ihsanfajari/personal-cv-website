// The way into the time trial: a checkered archway standing in the grass east
// of the trailhead. Drive up to it and the HUD offers the link across to
// /off-road-racing. Pure scenery otherwise — no collider, drive straight through.

import * as THREE from 'three';
import { terrainHeight } from './heightmap.js';

export const RACE_GATE_POS = { x: 96, z: 46 };
const NEAR = 22;

function bannerTexture() {
  const c = document.createElement('canvas');
  c.width = 768; c.height = 160;
  const ctx = c.getContext('2d');

  const sq = 20;
  for (let y = 0; y < c.height; y += sq) {
    for (let x = 0; x < c.width; x += sq) {
      ctx.fillStyle = ((x / sq + y / sq) % 2) ? '#f5f2ea' : '#1d1d1d';
      ctx.fillRect(x, y, sq, sq);
    }
  }
  ctx.fillStyle = 'rgba(200,73,46,0.94)';
  ctx.fillRect(0, 40, c.width, 80);
  ctx.fillStyle = '#fff8e8';
  ctx.font = '800 54px "Work Sans", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AUTUMN RIDGE  ·  TIME TRIAL', c.width / 2, c.height / 2 + 2, c.width - 40);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

function signTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 160;
  const ctx = c.getContext('2d');
  ctx.beginPath();
  ctx.roundRect(10, 20, 492, 120, 16);
  ctx.fillStyle = '#b3814a';
  ctx.fill();
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#7a5230';
  ctx.stroke();
  ctx.fillStyle = '#2e1d0e';
  ctx.font = '800 46px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RACE TRACK  →', c.width / 2, 82, 440);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  return tex;
}

// Turned so the span crosses the natural approach from the trailhead: you
// drive through it heading east, not past it side-on.
const FACING = Math.PI / 2;

export function buildRaceGate(scene) {
  const { x, z } = RACE_GATE_POS;
  const y = terrainHeight(x, z);
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = FACING;
  group.updateMatrixWorld();

  // ground height under a local offset, relative to the arch's own origin
  const _v = new THREE.Vector3();
  const drop = (lx) => {
    _v.set(lx, 0, 0);
    group.localToWorld(_v);
    return terrainHeight(_v.x, _v.z) - y;
  };

  const wood = new THREE.MeshStandardMaterial({ color: '#7a5230', flatShading: true, roughness: 1 });
  const postGeo = new THREE.BoxGeometry(0.5, 7, 0.5);
  for (const lx of [-6.5, 6.5]) {
    const post = new THREE.Mesh(postGeo, wood);
    post.position.set(lx, drop(lx) + 3.5, 0);
    post.castShadow = true;
    group.add(post);
  }

  const beam = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.42, 0.42), wood);
  beam.position.y = 7.1;
  beam.castShadow = true;
  group.add(beam);

  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 2.7),
    new THREE.MeshBasicMaterial({ map: bannerTexture(), side: THREE.DoubleSide, transparent: true })
  );
  banner.position.y = 5.6;
  group.add(banner);

  // little roadside sign beside the arch
  const signDrop = drop(-9.5);
  const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3, 0.22), wood);
  signPost.position.set(-9.5, signDrop + 1.5, 0);
  signPost.castShadow = true;
  group.add(signPost);

  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: signTexture(), transparent: true }));
  sign.scale.set(7, 2.2, 1);
  sign.position.set(-9.5, signDrop + 3.6, 0);
  sign.renderOrder = 4;
  group.add(sign);

  scene.add(group);
  return { pos: new THREE.Vector3(x, y, z), group };
}

// Shows the HUD prompt whenever the truck is parked near the arch.
export function updateRaceGate(gate, carPos, promptEl) {
  const near = carPos.distanceTo(gate.pos) < NEAR;
  promptEl.classList.toggle('show', near);
  return near;
}
