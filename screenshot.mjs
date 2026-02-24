/**
 * Screenshot utility for QuantEdge dev workflow.
 * Usage: node screenshot.mjs <url> [label] [navLabel]
 * navLabel: optional sidebar nav button text to click before screenshotting
 * Example: node screenshot.mjs http://localhost:3000 greeks "Greeks"
 */
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] || '';
const navLabel = process.argv[4] || '';

const screenshotsDir = join(__dirname, 'temporary screenshots');
if (!existsSync(screenshotsDir)) mkdirSync(screenshotsDir, { recursive: true });

// Find next available index
let idx = 1;
while (existsSync(join(screenshotsDir, label ? `screenshot-${idx}-${label}.png` : `screenshot-${idx}.png`))) idx++;
const filename = label ? `screenshot-${idx}-${label}.png` : `screenshot-${idx}.png`;
const outPath = join(screenshotsDir, filename);

// Try multiple Puppeteer locations
const PUPPETEER_PATHS = [
  'C:/Users/itsme/AppData/Local/npm-cache/_npx/7d92d9a2d2ccc630/node_modules/puppeteer',
  join(__dirname, 'node_modules/puppeteer'),
];

let puppeteer;
for (const p of PUPPETEER_PATHS) {
  try { puppeteer = require(p); if (puppeteer?.launch) break; } catch {}
  try { puppeteer = require(join(p, 'lib/cjs/puppeteer/puppeteer.js')); if (puppeteer?.launch) break; } catch {}
}

if (!puppeteer?.launch) {
  console.error('Puppeteer not found.');
  process.exit(1);
}

const executablePath = 'C:/Users/itsme/.cache/puppeteer/chrome/win64-145.0.7632.77/chrome-win64/chrome.exe';

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--use-gl=swiftshader', '--ignore-gpu-blocklist'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));

// Click nav button if specified
if (navLabel) {
  const buttons = await page.$$('nav button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent?.trim(), btn);
    if (text && text.toLowerCase().includes(navLabel.toLowerCase())) {
      await btn.click();
      await new Promise(r => setTimeout(r, 800));
      break;
    }
  }
}

await new Promise(r => setTimeout(r, 1000));
await page.screenshot({ path: outPath, fullPage: false });
await browser.close();

console.log(`Screenshot saved: ${outPath}`);
