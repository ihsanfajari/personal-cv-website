// Autumn Ridge — a start-to-finish time trial that runs on the same truck
// physics as the CV island, with the race world profile swapped in underneath.

import * as THREE from 'three';
import '../style.css';
import './race.css';
import { setWorld } from '../heightmap.js';
import { raceWorld, track, EDGE } from './world.js';
import { buildRaceTerrain, buildCreek, buildSky } from './terrain.js';
import { buildRaceProps } from './props.js';
import { buildGates, START_S, CHECKPOINT_S } from './gates.js';
import { Car } from '../car.js';
import { Controls } from '../controls.js';
import { GameAudio } from '../audio.js';
import { DynamicProps } from '../debris.js';
import { capturePostcard } from '../photo.js';
import { RaceUI, formatTime, loadBest, saveBest } from './ui.js';
import { icon } from '../icons.js';

// The race map replaces the island for every module that samples the terrain.
setWorld(raceWorld);

const TOP_SPEED = 16.7;      // m/s = 60 km/h
const CLAMP_MARGIN = 7;      // hard corridor limit past the shoulder
const OFF_COURSE_GRACE = 2.0; // seconds outside the corridor before a respawn
const STUCK_GRACE = 4;

// ---------- renderer / scene ----------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const SKY = '#c3cfd6';
const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 150, 430);

const BASE_FOV = 42;
const camera = new THREE.PerspectiveCamera(BASE_FOV, window.innerWidth / window.innerHeight, 0.5, 1200);
const CAM_OFFSET = new THREE.Vector3(23, 26, 23);
camera.position.copy(CAM_OFFSET);
camera.lookAt(0, 0, 0);

scene.add(new THREE.HemisphereLight('#e6edf3', '#8a6738', 1.0));
const sun = new THREE.DirectionalLight('#ffeccd', 1.65);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
sun.shadow.camera.far = 280;
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);

// ---------- UI / input / audio ----------
const ui = new RaceUI(track);
const controls = new Controls();
const audio = new GameAudio();
ui.setIntroBest(loadBest());

// ---------- sound settings menu ----------
const muteBtn = document.getElementById('muteBtn');
const soundMenu = document.getElementById('sound-menu');
const muteToggle = document.getElementById('muteToggle');
const bgmSlider = document.getElementById('bgmSlider');
const sfxSlider = document.getElementById('sfxSlider');
const bgmPct = document.getElementById('bgmPct');
const sfxPct = document.getElementById('sfxPct');

function syncSoundUI() {
  muteBtn.innerHTML = icon(audio.muted ? 'speaker-mute' : 'speaker');
  muteToggle.textContent = audio.muted ? 'Unmute' : 'Mute all';
  muteToggle.classList.toggle('muted', audio.muted);
  bgmSlider.value = Math.round(audio.bgmVol * 100);
  sfxSlider.value = Math.round(audio.sfxVol * 100);
  bgmPct.textContent = `${bgmSlider.value}%`;
  sfxPct.textContent = `${sfxSlider.value}%`;
}
muteBtn.addEventListener('click', () => {
  const open = soundMenu.style.display !== 'none';
  soundMenu.style.display = open ? 'none' : 'block';
  syncSoundUI();
});
document.getElementById('sound-close').addEventListener('click', () => {
  soundMenu.style.display = 'none';
});
muteToggle.addEventListener('click', () => { audio.setMuted(!audio.muted); syncSoundUI(); });
bgmSlider.addEventListener('input', () => {
  audio.setBgmVolume(bgmSlider.value / 100);
  bgmPct.textContent = `${bgmSlider.value}%`;
});
sfxSlider.addEventListener('input', () => {
  audio.setSfxVolume(sfxSlider.value / 100);
  sfxPct.textContent = `${sfxSlider.value}%`;
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') { audio.setMuted(!audio.muted); syncSoundUI(); }
});
syncSoundUI();

// ---------- world ----------
let worldReady = false;
let car = null;
let gates = null;
let debris = null;
let sky = null;

function buildWorld() {
  scene.add(buildRaceTerrain());

  const creek = buildCreek();
  if (creek) scene.add(creek);

  sky = buildSky();
  scene.add(sky);

  const props = buildRaceProps();
  scene.add(props.group);

  gates = buildGates(scene);

  const startPoint = track.sampleAt(START_S);
  car = new Car(scene, props.colliders, {
    spawn: { x: startPoint.x, z: startPoint.z, heading: startPoint.heading },
    maxSpeed: TOP_SPEED,
    maxReverse: 6,
    accel: 12,
    mud: raceWorld.mud,
  });
  car.onImpact = (i) => audio.collision(i);
  car.onLand = (i) => audio.landThud(i);

  debris = new DynamicProps();
  debris.onShove = (i) => audio.collision(0.25 * i + 0.1);
  car.onKnock = (c, speed, dx, dz) => {
    debris.knock(c, speed, dx, dz);
    audio.treeCrack(Math.min(1, Math.abs(speed) / 20));
  };

  controls.onReset = () => respawn();
  document.getElementById('resetBtn').addEventListener('click', () => respawn());

  worldReady = true;
  window.__race = { car, controls, track, gates, audio, state: () => state };
}

// ---------- race state ----------
const CP_TOTAL = CHECKPOINT_S.length;
let state = 'idle';          // idle | countdown | running | finished
let startStamp = 0;
let raceMs = 0;
let nextCp = 0;
let splits = [];
let lastAnchor = null;       // { x, z, heading } — start line or last checkpoint
let offCourse = 0;
let stuck = 0;
let wasInWater = false;

const q = {};

function beginCountdown() {
  state = 'countdown';
  nextCp = 0;
  splits = [];
  raceMs = 0;
  ui.setTime(0);
  ui.stopTimer(false);
  ui.setCheckpoint(0, CP_TOTAL);
  for (const g of gates.checkpoints) { g.passed = false; g.lineMat.color.set('#e8a33d'); }

  const startPoint = track.sampleAt(START_S);
  lastAnchor = { x: startPoint.x, z: startPoint.z, heading: startPoint.heading };
  car.reset(true);
  car.speed = 0;
  offCourse = 0;
  stuck = 0;
  wasInWater = false;

  const steps = ['3', '2', '1', 'GO!'];
  steps.forEach((label, i) => {
    setTimeout(() => {
      ui.countdown(label);
      audio.beep(i === 3 ? 990 : 620, i === 3 ? 0.4 : 0.16, i === 3 ? 0.26 : 0.18);
      if (i === 3) {
        state = 'running';
        startStamp = performance.now();
        setTimeout(() => ui.countdown(null), 700);
      }
    }, i * 900);
  });
}

function respawn() {
  if (!worldReady || !lastAnchor) return;
  car.pos.set(lastAnchor.x, 0, lastAnchor.z);
  car.pos.y = raceWorld.info(lastAnchor.x, lastAnchor.z).height;
  car.heading = lastAnchor.heading;
  car.speed = 0;
  car.vy = 0;
  car.airborne = false;
  offCourse = 0;
  stuck = 0;
  car.syncMesh(0);
  if (state === 'running') ui.toast('Back on course — the clock never stopped');
}

function passCheckpoint(i) {
  const g = gates.checkpoints[i];
  g.markPassed();
  splits.push(raceMs);
  nextCp = i + 1;
  lastAnchor = { x: g.pos.x, z: g.pos.z, heading: g.heading };
  ui.setCheckpoint(nextCp, CP_TOTAL);
  audio.beep(880, 0.12, 0.16);
  ui.toast(`Checkpoint ${nextCp}/${CP_TOTAL} — ${formatTime(raceMs)}`, 1800);
}

function finishRun() {
  state = 'finished';
  splits.push(raceMs);
  ui.stopTimer(true);
  audio.fanfare();

  const best = loadBest();
  const isPB = best == null || raceMs < best;
  if (isPB) saveBest(raceMs);
  ui.setIntroBest(isPB ? raceMs : best);
  ui.showResult({ timeMs: raceMs, bestMs: isPB ? raceMs : best, isPB, splits });
}

// ---------- intro flow ----------
document.getElementById('startBtn').addEventListener('click', () => {
  audio.start();
  document.getElementById('intro').style.display = 'none';
  const loading = document.getElementById('loading');
  loading.style.display = 'flex';

  setTimeout(() => {
    buildWorld();
    loading.style.display = 'none';
    ui.showHUD();
    beginCountdown();
  }, 60);
});

document.getElementById('againBtn').addEventListener('click', () => {
  ui.hideResult();
  beginCountdown();
});

document.getElementById('cardBtn').addEventListener('click', () => {
  ui.hideResult();
  // let the overlay clear before grabbing the frame
  requestAnimationFrame(() => {
    capturePostcard(renderer, scene, camera, {
      bigLine: formatTime(raceMs),
      nameLine: 'AUTUMN RIDGE TIME TRIAL',
      linkLine: 'ihsanfajari.my.id/off-road-racing',
      fileName: 'autumn-ridge-time.png',
    });
    ui.toast('Finish card saved — screenshot-ready');
    setTimeout(() => document.getElementById('result').style.display = 'flex', 400);
  });
});

document.getElementById('photoBtn').addEventListener('click', () => {
  capturePostcard(renderer, scene, camera, {
    bigLine: state === 'running' ? formatTime(raceMs) : undefined,
    nameLine: 'AUTUMN RIDGE TIME TRIAL',
    linkLine: 'ihsanfajari.my.id/off-road-racing',
    fileName: 'autumn-ridge.png',
  });
  ui.toast('Photo saved');
});

// rotate-to-landscape nudge on phones
function checkOrientation() {
  const isPhone = controls.isTouch && Math.min(window.innerWidth, window.innerHeight) < 560;
  const portrait = window.innerHeight > window.innerWidth;
  document.getElementById('rotate').style.display = isPhone && portrait && worldReady ? 'flex' : 'none';
}
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  checkOrientation();
});
window.addEventListener('orientationchange', checkOrientation);

// ---------- camera ----------
const camTarget = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function updateCamera(dt) {
  camTarget.copy(car.pos).add(CAM_OFFSET);
  camera.position.lerp(camTarget, Math.min(1, dt * 3.4));
  lookTarget.lerp(car.pos, Math.min(1, dt * 4.5));
  camera.lookAt(lookTarget);

  // a touch of FOV stretch with speed: the isometric framing stays put, the
  // world just leans in a little when the truck is flying
  const ratio = Math.min(1, Math.abs(car.speed) / car.maxSpeed);
  const fov = BASE_FOV + ratio * 6;
  if (Math.abs(camera.fov - fov) > 0.05) {
    camera.fov = fov;
    camera.updateProjectionMatrix();
  }

  sun.position.set(car.pos.x + 60, car.pos.y + 95, car.pos.z + 30);
  sun.target.position.copy(car.pos);
}

// ---------- keeping the truck on the course ----------
function enforceCorridor(dt) {
  track.query(car.pos.x, car.pos.z, q);
  const limit = q.w + EDGE + CLAMP_MARGIN;

  if (q.d > limit) {
    // last-resort clamp: the cliffs normally do this job, this guarantees it
    const p = track.sampleAt(q.s);
    const dx = car.pos.x - p.x, dz = car.pos.z - p.z;
    const len = Math.hypot(dx, dz) || 1;
    car.pos.x = p.x + (dx / len) * limit;
    car.pos.z = p.z + (dz / len) * limit;
    car.speed *= 0.55;
    // re-seat on the ground: a sideways nudge across a steep berm would
    // otherwise read as the ground falling away and fling the truck skyward
    if (!car.airborne) {
      car.pos.y = raceWorld.info(car.pos.x, car.pos.z).height;
      car.vy = 0;
    }
    offCourse += dt;
  } else if (q.d > q.w + EDGE + 5) {
    offCourse += dt;
  } else {
    offCourse = 0;
  }

  if (offCourse > OFF_COURSE_GRACE) respawn();

  // wedged against something with the throttle down (time in the air does not
  // count — a long drop would otherwise look like being stuck)
  const input = controls.read();
  if (!car.airborne && Math.abs(car.speed) < 0.5 && Math.abs(input.throttle) > 0.2) stuck += dt;
  else stuck = 0;
  if (stuck > STUCK_GRACE) { stuck = 0; respawn(); }

  return q;
}

// ---------- main loop ----------
const clock = new THREE.Clock();
const forward = new THREE.Vector3();

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (worldReady) {
    const raw = controls.read();
    const input = state === 'running' ? raw : { throttle: 0, steer: state === 'countdown' ? 0 : raw.steer };

    car.update(dt, input);
    debris.update(dt, car);
    const surf = enforceCorridor(dt);
    updateCamera(dt);
    sky.userData.update(dt);

    if (state === 'running') {
      raceMs = performance.now() - startStamp;
      ui.setTime(raceMs);

      if (nextCp < CP_TOTAL && surf.s >= gates.checkpoints[nextCp].s) passCheckpoint(nextCp);
      if (nextCp >= CP_TOTAL && surf.s >= gates.finish.s) finishRun();

      forward.set(Math.sin(car.heading), 0, Math.cos(car.heading));
      const along = forward.x * surf.tx + forward.z * surf.tz;
      ui.setWrongWay(along < -0.35 && Math.abs(car.speed) > 3);
    } else {
      ui.setWrongWay(false);
    }

    // splash when the truck hits the creek
    const wet = surf.water > 0.35 && surf.d < surf.w;
    if (wet && !wasInWater && Math.abs(car.speed) > 4) audio.splash();
    wasInWater = wet;

    ui.setSpeed(car.speed * 3.6);
    ui.setProgress(surf.s, track.length);
    ui.drawMinimap(gates, car.pos, car.heading);

    const ground = raceWorld.info(car.pos.x, car.pos.z);
    audio.update(dt, {
      speed: car.speed,
      maxSpeed: car.maxSpeed,
      throttle: input.throttle,
      biomes: ground.biomes,
      path: ground.path,
      inWater: wet,
      airborne: car.airborne,
    });
  }

  renderer.render(scene, camera);
}
loop();
checkOrientation();
