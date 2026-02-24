/**
 * Screenshot with light mode applied directly via JS eval
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

// Apply light class directly
await page.evaluate(() => document.documentElement.classList.add('light'));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: `${dir}/screenshot-6-light-mode.png` });
console.log('Light mode screenshot saved');

// Check html class was applied
const cls = await page.evaluate(() => document.documentElement.className);
console.log('html class:', cls);

await browser.close();
