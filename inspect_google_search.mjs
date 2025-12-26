import fs from 'fs';
import { chromium } from 'playwright';

const QUERY = 'YOUR SEARCH QUERY';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, locale: 'en-US' });
  const page = await ctx.newPage();
  try {
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
    // Add human-like behavior: random mouse movement
    await page.mouse.move(Math.random() * 1280, Math.random() * 800);
    await page.waitForTimeout(Math.random() * 1000 + 500);
    try { await page.getByRole('button', { name: /accept|agree/i }).click({ timeout: 3000 }); } catch {}
    const input = page.locator("textarea[name='q'], input[name='q']");
    await input.click();
    // Add random delay to mimic human typing
    await page.waitForTimeout(Math.random() * 1000 + 500);
    await input.type(QUERY, { delay: 80 + Math.random() * 50 });
    // Random wait before pressing Enter
    await page.waitForTimeout(Math.random() * 2000 + 1000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'inspect_google_search.png', fullPage: true });
    fs.writeFileSync('inspect_google_search.html', await page.content(), 'utf8');
    console.log('saved', page.url());
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
