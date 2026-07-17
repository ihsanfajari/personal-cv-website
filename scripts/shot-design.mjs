// Temporary helper: screenshot the design exploration pages for review.
import puppeteer from 'puppeteer-core';
import path from 'path';

const ROOT = 'd:/Project/Personal CV/Website/design';
const SHOT_DIR = process.env.SHOT_DIR || '.';

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
  args: ['--window-size=1280,900'],
  defaultViewport: { width: 1280, height: 900 },
});

const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

async function shots(file, prefix, stops) {
  await page.goto('file:///' + path.join(ROOT, file), { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400)); // let webfonts settle
  for (const [name, frac] of stops) {
    await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), frac);
    await new Promise((r) => setTimeout(r, 150));
    await page.screenshot({ path: `${SHOT_DIR}/${prefix}-${name}.png` });
  }
}

await shots('design-system.html', 'a-ds', [['top', 0], ['mid', 0.35], ['low', 0.7]]);
await shots('ui-preview.html', 'a-ui', [['intro', 0], ['hud', 0.32], ['ach', 0.58], ['cv', 0.84]]);
await shots('design-system-b.html', 'b-ds', [['top', 0], ['mid', 0.4], ['low', 0.75]]);
await shots('ui-preview-b.html', 'b-ui', [['intro', 0.06], ['hud', 0.32], ['ach', 0.58], ['cv', 0.84]]);

console.log('ERRORS:', JSON.stringify(errors));
await browser.close();
