/**
 * Inspect what CSS Tailwind actually compiled for navy colors
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let puppeteer;
try { puppeteer = require('C:/Users/itsme/AppData/Local/npm-cache/_npx/7d92d9a2d2ccc630/node_modules/puppeteer'); } catch(e) {}

const executablePath = 'C:/Users/itsme/.cache/puppeteer/chrome/win64-145.0.7632.77/chrome-win64/chrome.exe';

const browser = await puppeteer.launch({
  headless: 'new', executablePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1500));

// Check body background (uses inline CSS var)
const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
console.log('body background (CSS var):', bodyBg);

// Check the main app div (bg-navy-900 Tailwind class)
const appDivBg = await page.evaluate(() => {
  const el = document.querySelector('.bg-navy-900');
  if (!el) return 'element not found';
  return getComputedStyle(el).backgroundColor;
});
console.log('bg-navy-900 div background:', appDivBg);

// Find all stylesheets and search for navy-900 CSS rule
const cssRules = await page.evaluate(() => {
  const results = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        const text = rule.cssText || '';
        if (text.includes('navy-900') || (text.includes('--navy') && text.includes('900'))) {
          results.push(text.slice(0, 200));
        }
      }
    } catch(e) {} // CORS
  }
  return results;
});
console.log('\nCSS rules referencing navy-900:');
cssRules.forEach(r => console.log(' ', r));

// Check --navy-900 custom property value
const navyVar = await page.evaluate(() =>
  getComputedStyle(document.documentElement).getPropertyValue('--navy-900').trim()
);
console.log('\n--navy-900 value:', navyVar);

// Now apply light class and check again
await page.evaluate(() => document.documentElement.classList.add('light'));
await new Promise(r => setTimeout(r, 200));

const navyVarLight = await page.evaluate(() =>
  getComputedStyle(document.documentElement).getPropertyValue('--navy-900').trim()
);
const appDivBgLight = await page.evaluate(() => {
  const el = document.querySelector('.bg-navy-900');
  if (!el) return 'not found';
  return getComputedStyle(el).backgroundColor;
});
console.log('\nAfter html.light:');
console.log('--navy-900:', navyVarLight);
console.log('bg-navy-900 div background:', appDivBgLight);

await browser.close();
