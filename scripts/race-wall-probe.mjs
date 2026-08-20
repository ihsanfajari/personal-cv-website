// Boundary probe: park the truck on the centreline, point it straight at the
// edge of the course and hold full throttle. Reports how far past the corridor
// it gets at four different boundary types — the answer must stay inside the
// hard clamp (corridor half-width + shoulder + 10 m) at every site.

import puppeteer from 'puppeteer-core';

const URL = 'http://localhost:5173/off-road-racing/';
const SITES = [
  { s: 200, name: 'fenced start straight' },
  { s: 700, name: 'forest esses (tall cliff)' },
  { s: 1100, name: 'fast open run (low bank)' },
  { s: 1300, name: 'mud basin' },
];

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--use-gl=angle', '--enable-webgl', '--window-size=1280,720'],
  defaultViewport: { width: 1280, height: 720 },
});

const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(URL, { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForSelector('#startBtn', { timeout: 20000 });
await page.click('#startBtn');
await page.waitForFunction(() => !!window.__race, { timeout: 90000 });
await page.waitForFunction(() => window.__race.state() === 'running', { timeout: 20000 });

await page.evaluate(() => {
  window.__auto = { throttle: 0, steer: 0 };
  window.__race.controls.read = () => window.__auto;
});

for (const site of SITES) {
  for (const side of [1, -1]) {
    await page.evaluate(({ s, side }) => {
      const g = window.__race;
      const p = g.track.sampleAt(s);
      g.car.pos.set(p.x, p.y, p.z);            // designed centreline elevation
      g.car.speed = 16.7;                      // hitting the boundary flat out
      g.car.vy = 0;
      g.car.airborne = false;
      // aim square at the boundary
      g.car.heading = Math.atan2(-p.tz * side, p.tx * side);
      window.__probe = { max: -99, nan: false };
      window.__auto = { throttle: 1, steer: 0 };

      const q = {};
      const watch = () => {
        const c = g.car;
        if (!isFinite(c.pos.x) || !isFinite(c.pos.y) || !isFinite(c.pos.z)) window.__probe.nan = true;
        g.track.query(c.pos.x, c.pos.z, q);
        window.__probe.max = Math.max(window.__probe.max, q.d - q.w);
        window.__probe.limit = 3 + 7;   // EDGE + CLAMP_MARGIN from race/main.js
        if (window.__probe.on !== false) requestAnimationFrame(watch);
      };
      window.__probe.on = true;
      watch();
    }, { s: site.s, side });

    await new Promise((r) => setTimeout(r, 7000));

    const res = await page.evaluate(() => {
      window.__probe.on = false;
      window.__auto = { throttle: 0, steer: 0 };
      return window.__probe;
    });
    const label = `${site.name} (${side > 0 ? 'left' : 'right'})`;
    console.log(`${label.padEnd(38)} max ${res.max.toFixed(1)} m past edge  | clamp ${res.limit.toFixed(0)} m | NaN: ${res.nan}`);
  }
}

console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();
