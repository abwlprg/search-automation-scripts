import fs from 'fs';
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'en-US' });
  const page = await context.newPage();
  try {
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.screenshot({ path: 'inspect_google.png', fullPage: true });
    const html = await page.content();
    fs.writeFileSync('inspect_google.html', html, 'utf8');
    console.log('saved', page.url());
  } catch (e) {
    console.error('error:', e.message);
    try { await page.screenshot({ path: 'inspect_google_error.png', fullPage: true }); } catch {}
  } finally {
    await browser.close();
  }
})();
