// Temporary helper: screenshot menu/panel states of the running game.
import puppeteer from 'puppeteer-core';

const SHOT_DIR = process.env.SHOT_DIR || '.';

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

await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForSelector('#startBtn', { timeout: 15000 });
await page.click('#startBtn');
await page.waitForFunction(() => document.getElementById('hud').style.display === 'block', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200));

// achievements menu (fake one unlock so a done-row is visible)
await page.evaluate(() => { window.__game.ach._unlock('trees'); });
await page.click('#trophyBtn');
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${SHOT_DIR}/3-ach.png` });
await page.click('#ach-close');

// sound menu
await page.click('#muteBtn');
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${SHOT_DIR}/4-sound.png` });
await page.click('#sound-close');

// drive into the About zone to open the CV panel
await page.evaluate(() => {
  const g = window.__game;
  const z = g.zones[0];
  g.car.pos.set(z.pos.x + 2, z.pos.y + 1, z.pos.z + 2);
});
await new Promise((r) => setTimeout(r, 1000));
await page.screenshot({ path: `${SHOT_DIR}/5-panel-about.png` });

// education zone → contact slot (locked state)
await page.evaluate(() => {
  const g = window.__game;
  const z = g.zones.find((zz) => zz.data.id === 'education');
  g.car.pos.set(z.pos.x + 2, z.pos.y + 1, z.pos.z + 2);
});
await new Promise((r) => setTimeout(r, 1000));
await page.evaluate(() => { document.getElementById('panel-card').scrollTop = 99999; });
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: `${SHOT_DIR}/6-panel-contact.png` });

console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();
