/**
 * Find where the .bg-navy-900 CSS rule is coming from
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
await new Promise(r => setTimeout(r, 2000));

// Find which stylesheet has bg-navy-900 and its sourceURL
const info = await page.evaluate(() => {
  const results = [];
  for (const sheet of document.styleSheets) {
    try {
      let found = false;
      for (const rule of sheet.cssRules) {
        const text = rule.cssText || '';
        if (text.includes('bg-navy-900') && !text.includes('html.light')) {
          found = true;
          results.push({
            href: sheet.href,
            ownerNode: sheet.ownerNode?.id || sheet.ownerNode?.tagName,
            ruleText: text.slice(0, 150),
          });
          break;
        }
      }
    } catch(e) {}
  }
  return results;
});

console.log('Sources of .bg-navy-900:');
info.forEach(r => {
  console.log('  Stylesheet:', r.href || `inline <${r.ownerNode}>`);
  console.log('  Rule:', r.ruleText);
});

// Also check ALL stylesheets for their href
const allSheets = await page.evaluate(() => {
  return Array.from(document.styleSheets).map(s => ({
    href: s.href || '(inline)',
    ownerTag: s.ownerNode?.tagName,
    ruleCount: (() => { try { return s.cssRules.length; } catch(e) { return 'CORS blocked'; } })(),
  }));
});
console.log('\nAll stylesheets:');
allSheets.forEach(s => console.log(`  ${s.ruleCount} rules — ${s.href}`));

await browser.close();
