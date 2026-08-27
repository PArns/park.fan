import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, colorScheme: 'dark', locale: 'de-DE', extraHTTPHeaders: { 'x-forwarded-for': '85.214.132.117' } });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/de/parks/europe/germany/bruehl/phantasialand/andrangskalender',{waitUntil:'networkidle',timeout:120000});
await page.waitForTimeout(6000);
// click the tile the way a person does: find the cell whose visible label is "Wetter"
const cell = page.locator('a', { hasText: /^Wetter/ }).filter({ hasNot: page.locator('svg.lucide-chevron-right') }).first();
console.log('tile text =', JSON.stringify((await cell.innerText()).replace(/\s+/g,' ')));
console.log('tile href =', await cell.getAttribute('href'));
await cell.click();
await page.waitForTimeout(6000);
console.log('url =', page.url());
console.log('visible chapter =', await page.evaluate(() => {
  const h = [...document.querySelectorAll('h2')].map(x=>x.innerText.trim()).filter(Boolean);
  const a = document.querySelector('[role="tab"][data-state="active"]');
  return { headings: h.slice(0,4), activeTab: a?a.innerText.split('\n')[0]:null, scrollY: Math.round(scrollY) };
}));
await page.screenshot({ path: '/tmp/claude-0/-home-user/6284b9a8-3b46-5f5c-b4da-d3f4cf4e0c31/scratchpad/shots/after-wetter.png' });
await browser.close();
