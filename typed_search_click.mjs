import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const ENGINE = process.env.ENGINE || "google"; // google | bing
const QUERY = process.env.QUERY || "YOUR SEARCH QUERY";
const TARGET_DOMAIN = process.env.DOMAIN || "example.com";
const ITERATIONS = Number(process.env.ITERATIONS || 50);
const COOLDOWN_MS = Number(process.env.COOLDOWN_MS || 800);
const HEADLESS = process.env.HEADLESS ? process.env.HEADLESS === 'true' : false; // set to 'true' to run headless

function normalizeDomain(d) {
  return d.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
}

function matchesDomain(url, domain) {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === domain || h.endsWith("." + domain);
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  const domain = normalizeDomain(TARGET_DOMAIN);
  const browser = await chromium.launch({ headless: HEADLESS });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "en-US",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", // Add a common user agent
  });

  for (let i = 1; i <= ITERATIONS; i++) {
    const page = await context.newPage();

    console.log(`[${ENGINE}] Iteration ${i}`);

    try {
      if (ENGINE === "google") {
        await page.goto("https://www.google.com", { waitUntil: "domcontentloaded" });

        // Add random mouse movements and scrolling to mimic human behavior
        await page.mouse.move(Math.random() * 1280, Math.random() * 800);
        await page.mouse.wheel(0, Math.random() * 300);
        await page.waitForTimeout(Math.random() * 2000 + 1000);

        // Accept consent if present
        try {
          await page.getByRole("button", { name: /accept|agree/i }).click({ timeout: 3000 });
        } catch {}

        const input = page.locator("textarea[name='q'], input[name='q']");
        await input.click();
        // Add random delay before typing
        await page.waitForTimeout(Math.random() * 1500 + 500);
        await input.type(QUERY, { delay: 80 + Math.random() * 100 });
        // Random wait before pressing Enter
        await page.waitForTimeout(Math.random() * 3000 + 2000);
        await page.keyboard.press("Enter");

        await page.waitForSelector("#search", { timeout: 20000 });

        const links = page.locator("#search a[href]");
        const count = await links.count();

        let clicked = false;
        for (let j = 0; j < count; j++) {
          const href = await links.nth(j).getAttribute("href");
          if (matchesDomain(href, domain)) {
            await Promise.all([
              page.waitForNavigation({ waitUntil: "domcontentloaded" }),
              links.nth(j).click()
            ]);
            clicked = true;
            break;
          }
        }

        if (!clicked) throw new Error("Target domain not found in Google results");

      } else if (ENGINE === "bing") {
        await page.goto("https://www.bing.com", { waitUntil: "domcontentloaded" });

        const input = page.locator("input[name='q']");
        await input.click();
        await input.type(QUERY, { delay: 80 });
        await page.keyboard.press("Enter");

        await page.waitForSelector("li.b_algo", { timeout: 20000 });

        const links = page.locator("li.b_algo h2 a");
        const count = await links.count();

        let clicked = false;
        for (let j = 0; j < count; j++) {
          const href = await links.nth(j).getAttribute("href");
          if (matchesDomain(href, domain)) {
            await Promise.all([
              page.waitForNavigation({ waitUntil: "domcontentloaded" }),
              links.nth(j).click()
            ]);
            clicked = true;
            break;
          }
        }

        if (!clicked) throw new Error("Target domain not found in Bing results");
      }

      console.log(`✓ Landed on: ${page.url()}`);

    } catch (err) {
      console.error(`✗ Failure on iteration ${i}:`, err.message);
      await page.screenshot({ path: `fail_${ENGINE}_${i}.png`, fullPage: true });
      break;
    } finally {
      await page.close();
      await sleep(COOLDOWN_MS);
    }
  }

  await context.close();
  await browser.close();
})();
