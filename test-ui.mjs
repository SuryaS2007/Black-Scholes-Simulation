/**
 * Quick UI test: verifies presets dropdown opens + light mode toggle works
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let puppeteer;
try { puppeteer = require('C:/Users/itsme/AppData/Local/npm-cache/_npx/7d92d9a2d2ccc630/node_modules/puppeteer'); } catch(e) {}

const executablePath = 'C:/Users/itsme/.cache/puppeteer/chrome/win64-145.0.7632.77/chrome-win64/chrome.exe';
const dir = 'C:/Black Scholes Model/temporary screenshots';

const browser = await puppeteer.launch({
  headless: 'new', executablePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));

// ── Test 1: Open Presets dropdown ──────────────────────────────
const buttons = await page.$$('button');
let presetsBtn = null;
for (const btn of buttons) {
  const text = await page.evaluate(el => el.textContent?.trim(), btn);
  if (text && text.includes('Presets')) { presetsBtn = btn; break; }
}

if (!presetsBtn) {
  console.error('FAIL: Presets button not found');
} else {
  await presetsBtn.click();
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: `${dir}/screenshot-2-presets-open.png` });
  console.log('OK: Presets dropdown opened — screenshot-2-presets-open.png');

  // Click the first preset item in the dropdown
  const dropItems = await page.$$('button');
  for (const btn of dropItems) {
    const text = await page.evaluate(el => el.textContent?.trim(), btn);
    const box = await btn.boundingBox();
    // Preset items appear below header (y > 60), not the Presets toggle button itself
    if (box && box.y > 60 && text && text.length > 3 && !text.includes('Presets') && !text.includes('Collapse')) {
      await btn.click();
      console.log(`OK: Clicked preset — "${text.slice(0, 40)}"`);
      break;
    }
  }
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: `${dir}/screenshot-3-after-preset.png` });
  console.log('OK: After preset applied — screenshot-3-after-preset.png');
}

// ── Test 2: Toggle light mode ──────────────────────────────────
// The sun/moon icon button is in the top-right. Find it by its small size.
const allBtns = await page.$$('header button');
// Last button in header should be the dark mode toggle
const darkToggle = allBtns[allBtns.length - 1];
if (darkToggle) {
  await darkToggle.click();
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: `${dir}/screenshot-4-light-mode.png` });
  console.log('OK: Light mode toggled — screenshot-4-light-mode.png');

  // Toggle back to dark
  await darkToggle.click();
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: `${dir}/screenshot-5-dark-mode-restored.png` });
  console.log('OK: Dark mode restored — screenshot-5-dark-mode-restored.png');
} else {
  console.error('FAIL: Dark mode toggle button not found');
}

await browser.close();
console.log('\nAll tests complete.');
