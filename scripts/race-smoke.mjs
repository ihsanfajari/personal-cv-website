// Headless run of the Autumn Ridge time trial.
//
// Overrides the input layer with a look-ahead autopilot and drives the whole
// course, so the report answers the questions that matter: is the track
// completable, how long does a clean lap take, do the three jumps actually
// launch the truck, does the mud cost time, and does the corridor ever leak.

import puppeteer from 'puppeteer-core';

const SHOT_DIR = process.env.SHOT_DIR || '.';
const URL = 'http://localhost:5173/off-road-racing/';
const MAX_SECONDS = Number(process.env.MAX_SECONDS || 260);

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--use-gl=angle', '--enable-webgl', '--window-size=1280,720'],
  defaultViewport: { width: 1280, height: 720 },
});

const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForSelector('#startBtn', { timeout: 20000 });
await page.screenshot({ path: `${SHOT_DIR}/race-1-intro.png` });

const buildStart = Date.now();
await page.click('#startBtn');
await page.waitForFunction(() => !!window.__race, { timeout: 90000 });
console.log('world build ms:', Date.now() - buildStart);

// ---- install the autopilot ----
await page.evaluate(() => {
  const g = window.__race;
  const stats = {
    airborne: [], respawns: 0, clamps: 0, maxD: 0,
    minSpeedMud: 99, samples: [], topSpeed: 0, wrongWay: 0,
  };
  window.__stats = stats;

  let wasAir = false;
  const q = {};
  window.__auto = { throttle: 0, steer: 0 };
  g.controls.read = () => window.__auto;

  const norm = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  const tick = () => {
    requestAnimationFrame(tick);
    const car = g.car, track = g.track;
    g.track.query(car.pos.x, car.pos.z, q);

    // aim at a point down the course, closer when going slowly
    const la = 11 + Math.min(1, Math.abs(car.speed) / 16) * 13;
    const t = track.sampleAt(Math.min(track.length, q.s + la));
    const want = Math.atan2(t.x - car.pos.x, t.z - car.pos.z);
    const err = norm(want - car.heading);
    window.__auto.steer = Math.max(-1, Math.min(1, -err * 2.4));

    // brake for the corner ahead: the truck can only hold about 1.05 rad/s,
    // so the safe speed through a bend is roughly its radius
    let tightest = 9999;
    for (let d = 10; d <= 55; d += 5) {
      const a = track.sampleAt(Math.min(track.length, q.s + d));
      const b = track.sampleAt(Math.min(track.length, q.s + d + 10));
      const dh = Math.abs(norm(Math.atan2(b.tx, b.tz) - Math.atan2(a.tx, a.tz)));
      if (dh > 1e-3) tightest = Math.min(tightest, 10 / dh);
    }
    const target = Math.max(7, Math.min(16.7, tightest * 1.05));
    window.__auto.throttle = car.speed > target + 0.8 ? -1 : 1;

    if (car.airborne && !wasAir) stats.airborne.push({ s: Math.round(q.s), speed: +car.speed.toFixed(1) });
    wasAir = car.airborne;
    stats.topSpeed = Math.max(stats.topSpeed, car.speed);
    stats.maxD = Math.max(stats.maxD, q.d - q.w);
    if (q.mud > 0.6) stats.minSpeedMud = Math.min(stats.minSpeedMud, Math.abs(car.speed));
    if (document.getElementById('wrongway').classList.contains('show')) stats.wrongWay++;
  };
  tick();
});

// ---- drive until the result card appears ----
const t0 = Date.now();
let finished = false;
while ((Date.now() - t0) / 1000 < MAX_SECONDS) {
  await new Promise((r) => setTimeout(r, 2000));
  const snap = await page.evaluate(() => {
    const g = window.__race;
    const q = g.track.query(g.car.pos.x, g.car.pos.z, {});
    return {
      state: g.state(),
      s: Math.round(q.s),
      len: Math.round(g.track.length),
      speed: +g.car.speed.toFixed(1),
      mud: +q.mud.toFixed(2),
      timer: document.getElementById('timer').textContent,
      done: document.getElementById('result').style.display === 'flex',
    };
  });
  process.stdout.write(`  ${snap.state} s=${snap.s}/${snap.len} v=${snap.speed} mud=${snap.mud} t=${snap.timer}\n`);
  if (snap.s > 300 && snap.s < 340) await page.screenshot({ path: `${SHOT_DIR}/race-2-jump.png` });
  if (snap.mud > 0.6) await page.screenshot({ path: `${SHOT_DIR}/race-3-mud.png` });
  if (snap.done) { finished = true; break; }
}

await page.screenshot({ path: `${SHOT_DIR}/race-4-end.png` });

// ---- the finish card is the whole point of the run, so prove it renders ----
let card = null;
if (finished) {
  await page.evaluate(() => {
    window.__card = null;
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download) { window.__card = { href: this.href, name: this.download }; return; }
      return orig.call(this);
    };
  });
  await page.click('#cardBtn');
  await new Promise((r) => setTimeout(r, 1600));
  card = await page.evaluate(() => window.__card && {
    name: window.__card.name,
    png: window.__card.href.startsWith('data:image/png'),
    kb: Math.round(window.__card.href.length / 1024),
  });
}

const out = await page.evaluate(() => ({
  stats: window.__stats,
  result: document.getElementById('result-time')?.textContent,
  best: document.getElementById('result-best')?.textContent,
  splits: [...document.querySelectorAll('.split')].map((d) => d.textContent),
}));

console.log('FINISHED:', finished);
console.log('RESULT TIME:', out.result, '| best:', out.best);
console.log('SPLITS:', out.splits.join('  '));
console.log('AIRBORNE EVENTS:', JSON.stringify(out.stats.airborne));
console.log('TOP SPEED m/s:', out.stats.topSpeed.toFixed(1), '=', (out.stats.topSpeed * 3.6).toFixed(0), 'km/h');
console.log('SLOWEST IN MUD m/s:', out.stats.minSpeedMud === 99 ? 'n/a' : out.stats.minSpeedMud.toFixed(1));
console.log('MAX DIST PAST CORRIDOR EDGE m:', out.stats.maxD.toFixed(1));
console.log('WRONG-WAY FRAMES:', out.stats.wrongWay);
console.log('FINISH CARD:', card ? `${card.name} · png=${card.png} · ${card.kb} KB` : 'not tested');
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');

await browser.close();
