import * as THREE from 'three';
import './style.css';
import { buildTerrain, buildSea, buildClouds } from './terrain.js';
import { buildProps } from './props.js';
import { Car } from './car.js';
import { Controls } from './controls.js';
import { buildZones, animateZones } from './zones.js';
import { buildSigns, animateSigns } from './signs.js';
import { UI } from './ui.js';
import { CV_ZONES } from './cv-data.js';
import { GameAudio } from './audio.js';
import { terrainInfo } from './heightmap.js';
import { DynamicProps } from './debris.js';
import { Achievements, ACH_DEFS, SKINS } from './achievements.js';
import { capturePostcard } from './photo.js';
import { buildNpc } from './npc.js';
import { buildRaceGate, updateRaceGate } from './racegate.js';
import { icon } from './icons.js';

// ---------- renderer / scene ----------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#9fd9f0');
scene.fog = new THREE.Fog('#9fd9f0', 120, 340);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 900);
const CAM_OFFSET = new THREE.Vector3(24, 27, 24);
camera.position.copy(CAM_OFFSET);
camera.lookAt(0, 0, 0);

// ---------- lights ----------
scene.add(new THREE.HemisphereLight('#cfeaff', '#7a9a5a', 0.85));
const sun = new THREE.DirectionalLight('#fff4dd', 1.6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -70;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 70;
sun.shadow.camera.bottom = -70;
sun.shadow.camera.far = 260;
sun.shadow.bias = -0.0008;
scene.add(sun, sun.target);

// ---------- UI + controls first (cheap) ----------
const ui = new UI();
const controls = new Controls();
const audio = new GameAudio();

// ---------- achievements ----------
const ach = new Achievements((def) => {
  if (ach.allUnlocked) {
    ui.toast(`Achievement — ${def.name}! All done: contact info unlocked at the beach waypoint!`, 7000);
  } else {
    ui.toast(`Achievement — ${def.name}! New paint in the garage`, 4500);
  }
  audio.fanfare();
  renderAchievements();
  ui.refreshOpenPanel();
});
ui.contactStatus = () => ({
  allUnlocked: ach.allUnlocked,
  unlocked: ach.unlockedCount,
  total: ACH_DEFS.length,
});

const trophyBtn = document.getElementById('trophyBtn');
const achMenu = document.getElementById('ach-menu');
const achList = document.getElementById('ach-list');

function renderAchievements() {
  document.getElementById('ach-count').textContent = `${ach.unlockedCount}/${ACH_DEFS.length}`;
  achList.innerHTML = '';
  for (const def of ACH_DEFS) {
    const done = ach.unlocked.has(def.id);
    const row = document.createElement('div');
    row.className = `ach-row${done ? ' done' : ''}`;
    row.innerHTML = done
      ? `<div class="ach-icon">${icon(def.icon)}</div><div><b>${def.name}</b><p>${def.desc}</p></div>`
      : `<div class="ach-icon">${icon('lock')}</div><div><b>? ? ?</b><p>Secret — keep exploring…</p></div>`;
    achList.appendChild(row);
  }
  renderGarage();
}

// ---------- garage: paint skins unlocked by achievements ----------
const SKIN_KEY = 'cv-skin';
let currentSkin = localStorage.getItem(SKIN_KEY) || 'classic';

function skinUnlocked(skin) {
  return !skin.ach || ach.unlocked.has(skin.ach);
}

function applySkin(id) {
  const skin = SKINS.find((s) => s.id === id);
  if (!skin || !skinUnlocked(skin)) return;
  currentSkin = skin.id;
  localStorage.setItem(SKIN_KEY, skin.id);
  car?.setPaint(skin.color);
}

function renderGarage() {
  const list = document.getElementById('skin-list');
  list.innerHTML = '';
  for (const skin of SKINS) {
    const open = skinUnlocked(skin);
    const sw = document.createElement('button');
    sw.className = `skin-swatch${open ? '' : ' locked'}${skin.id === currentSkin ? ' active' : ''}`;
    sw.style.background = skin.color;
    sw.title = open ? skin.name : 'Locked — earn the matching achievement';
    sw.innerHTML = open ? '' : icon('lock');
    sw.addEventListener('click', () => {
      if (!open) { ui.toast('Locked — earn the matching achievement first'); return; }
      applySkin(skin.id);
      renderGarage();
      ui.toast(`${skin.name} applied!`);
    });
    list.appendChild(sw);
  }
}

trophyBtn.addEventListener('click', () => {
  const open = achMenu.style.display !== 'none';
  achMenu.style.display = open ? 'none' : 'block';
  if (!open) {
    renderAchievements();
    document.getElementById('sound-menu').style.display = 'none';
  }
});
document.getElementById('ach-close').addEventListener('click', () => {
  achMenu.style.display = 'none';
});

// ---------- photo / postcard mode ----------
document.getElementById('photoBtn').addEventListener('click', () => {
  capturePostcard(renderer, scene, camera);
  ui.toast('Postcard saved — share the ride!');
});

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
  if (!open) achMenu.style.display = 'none';
  syncSoundUI();
});
document.getElementById('sound-close').addEventListener('click', () => {
  soundMenu.style.display = 'none';
});
muteToggle.addEventListener('click', () => {
  audio.setMuted(!audio.muted);
  syncSoundUI();
});
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

let started = false;
let worldReady = false;
let car = null;
let zones = [];
let signs = [];
let sea = null;
let clouds = null;
let debris = null;
let npc = null;
let raceGate = null;
const racePrompt = document.getElementById('race-prompt');

// ---------- deferred world build (keeps first paint fast) ----------
function buildWorld() {
  scene.add(buildTerrain());

  const props = buildProps();
  scene.add(props.group);

  sea = buildSea();
  scene.add(sea);

  clouds = buildClouds();
  scene.add(clouds);

  car = new Car(scene, props.colliders);
  car.onImpact = (i) => audio.collision(i);
  car.onLand = (i) => audio.landThud(i);
  applySkin(currentSkin); // restore the saved garage paint

  debris = new DynamicProps();
  debris.onShove = (i) => audio.collision(0.25 * i + 0.1);
  car.onKnock = (c, speed, dx, dz) => {
    debris.knock(c, speed, dx, dz);
    audio.treeCrack(Math.min(1, Math.abs(speed) / 20));
    ach.treeKnocked();
  };

  controls.onReset = () => resetCar(true);
  document.getElementById('resetBtn').addEventListener('click', () => resetCar(false));

  zones = buildZones(scene);
  signs = buildSigns(scene);
  npc = buildNpc(scene);
  raceGate = buildRaceGate(scene);
  worldReady = true;
  window.__game = { car, controls, zones, audio, debris, ach, npc }; // debug/testing hook
}

function resetCar(hard) {
  car.reset(hard);
  ui.toast(hard ? 'Back to the trailhead' : 'Truck recovered');
}

// ---------- intro flow ----------
document.getElementById('startBtn').addEventListener('click', () => {
  audio.start(); // must happen inside the user gesture
  document.getElementById('intro').style.display = 'none';
  const loading = document.getElementById('loading');
  loading.style.display = 'flex';

  // let the loading screen paint before the heavy terrain build
  setTimeout(() => {
    buildWorld();
    loading.style.display = 'none';
    ui.showHUD();
    started = true;
    ui.toast('Find the 5 glowing waypoints!', 4200);
  }, 60);
});

// rotate-to-landscape nudge on phones
function checkOrientation() {
  const isPhone = controls.isTouch && Math.min(window.innerWidth, window.innerHeight) < 560;
  const portrait = window.innerHeight > window.innerWidth;
  document.getElementById('rotate').style.display = isPhone && portrait && started ? 'flex' : 'none';
}
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  checkOrientation();
});
window.addEventListener('orientationchange', checkOrientation);

// ---------- zone discovery ----------
const discovered = new Set();

function checkZones() {
  for (const z of zones) {
    const d = Math.hypot(car.pos.x - z.pos.x, car.pos.z - z.pos.z);
    const inside = d < z.radius;

    if (inside && !z.inside) {
      z.inside = true;
      if (!z.discovered) {
        z.discovered = true;
        discovered.add(z.data.id);
        ui.markDiscovered(z, discovered.size, CV_ZONES.length);
      }
      ui.openPanel(z);
    } else if (!inside && z.inside) {
      z.inside = false;
      if (ui.openZoneId === z.data.id) ui.closePanel();
    }
  }
}

// ---------- camera follow ----------
const camTarget = new THREE.Vector3();
const lookTarget = new THREE.Vector3();

function updateCamera(dt) {
  const speedZoom = 1 + Math.min(1, Math.abs(car.speed) / car.maxSpeed) * 0.22;
  camTarget.copy(car.pos).addScaledVector(CAM_OFFSET, speedZoom);
  camera.position.lerp(camTarget, Math.min(1, dt * 3.2));

  lookTarget.lerp(car.pos, Math.min(1, dt * 4.5));
  camera.lookAt(lookTarget);

  // shadow camera follows the car
  sun.position.set(car.pos.x + 60, car.pos.y + 90, car.pos.z + 30);
  sun.target.position.copy(car.pos);
}

// ---------- sunk-in-water recovery ----------
let sinkFade = 0;
let wasSunk = false;

function handleSinking(dt) {
  if (car.sunk && !wasSunk) { audio.splash(); ach.submerged(); }
  wasSunk = car.sunk;
  if (car.sunk) {
    sinkFade += dt;
    if (sinkFade > 0.8) {
      car.reset(false);
      sinkFade = 0;
      ui.toast('Fished the truck out of the sea!');
    }
  }
}

// ---------- main loop ----------
const clock = new THREE.Clock();

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (worldReady && started) {
    const input = controls.read();
    car.update(dt, input);
    debris.update(dt, car);
    checkZones();
    handleSinking(dt);
    updateCamera(dt);
    animateZones(zones, t, dt, car.pos);
    animateSigns(signs, car.pos);
    updateRaceGate(raceGate, car.pos, racePrompt);
    npc.update(dt, car.pos);
    sea.userData.update(t);
    clouds.userData.update(dt);
    ach.update(dt, car);
    ui.setSpeed(car.speed * 3.6);
    ui.setOdometer(ach.distanceKm);
    ui.updateEdgeMarkers(zones, camera);
    ui.updateQuest(zones, car.pos, camera);

    const ground = terrainInfo(car.pos.x, car.pos.z);
    audio.update(dt, {
      speed: car.speed,
      maxSpeed: car.maxSpeed,
      throttle: input.throttle,
      biomes: ground.biomes,
      path: ground.path,
      inWater: car.inWater,
      airborne: car.airborne,
    });
  }

  renderer.render(scene, camera);
}
loop();
checkOrientation();
