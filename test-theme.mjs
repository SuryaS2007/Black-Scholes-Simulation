/**
 * Diagnose light mode: check if html.light class is set and CSS vars change
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

// Check initial state
const initialClass = await page.evaluate(() => document.documentElement.className);
const initialBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--navy-900').trim());
console.log('Initial html class:', JSON.stringify(initialClass));
console.log('Initial --navy-900:', JSON.stringify(initialBg));

// Manually add 'light' class via JS and check
await page.evaluate(() => document.documentElement.classList.add('light'));
await new Promise(r => setTimeout(r, 300));
const lightBg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--navy-900').trim());
const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
console.log('After adding .light — --navy-900:', JSON.stringify(lightBg));
console.log('After adding .light — body backgroundColor:', bodyBg);
await page.screenshot({ path: `${dir}/screenshot-6-manual-light.png` });
console.log('Manual light mode screenshot saved');

// Remove light class
await page.evaluate(() => document.documentElement.classList.remove('light'));
await new Promise(r => setTimeout(r, 300));

// Now find the actual toggle button and click it
const headerBtns = await page.$$('header button');
console.log(`Found ${headerBtns.length} buttons in header`);
for (let i = 0; i < headerBtns.length; i++) {
  const text = await page.evaluate(el => el.textContent?.trim(), headerBtns[i]);
  const box = await headerBtns[i].boundingBox();
  console.log(`  Button ${i}: "${text}" at x=${box?.x?.toFixed(0)} y=${box?.y?.toFixed(0)} w=${box?.width?.toFixed(0)}`);
}

// Click the last header button (should be dark mode toggle)
const lastBtn = headerBtns[headerBtns.length - 1];
await lastBtn.click();
await new Promise(r => setTimeout(r, 1000));
const afterToggleClass = await page.evaluate(() => document.documentElement.className);
console.log('After toggle click — html class:', JSON.stringify(afterToggleClass));
await page.screenshot({ path: `${dir}/screenshot-7-after-toggle.png` });
console.log('After toggle screenshot saved');

await browser.close();
