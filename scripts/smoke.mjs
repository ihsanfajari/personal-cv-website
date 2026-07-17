import puppeteer from 'puppeteer-core';

const SHOT_DIR = process.env.SHOT_DIR || '.';
const URL = 'http://localhost:5173';

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

await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
await page.waitForSelector('#startBtn', { timeout: 15000 });
await page.screenshot({ path: `${SHOT_DIR}/1-intro.png` });

await page.click('#startBtn');
await page.waitForFunction(() => document.getElementById('hud').style.display === 'block', { timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: `${SHOT_DIR}/2-world.png` });

// hold W and probe the game state each second
await page.keyboard.down('KeyW');
for (let i = 0; i < 5; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  const state = await page.evaluate(() => {
    const g = window.__game;
    return {
      keys: [...g.controls.keys],
      input: g.controls.read(),
      speed: g.car.speed.toFixed(2),
      pos: { x: g.car.pos.x.toFixed(1), z: g.car.pos.z.toFixed(1) },
    };
  });
  console.log(`t=${i + 1}s`, JSON.stringify(state));
}
await page.keyboard.up('KeyW');
await new Promise((r) => setTimeout(r, 1000));
await page.screenshot({ path: `${SHOT_DIR}/3-drive.png` });

const panelOpen = await page.evaluate(() => document.getElementById('panel').style.display !== 'none');
console.log('PANEL_OPEN:', panelOpen);
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');

await browser.close();
