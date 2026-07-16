/**
 * 捕获「行业配置 · 精简为标识配置能力」更新说明截图
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'changelog', 'screenshots');
const BASE = 'http://127.0.0.1:8765/';
const OUT_FILE = path.join(OUT_DIR, 'industry-config-tag-only.png');

fs.mkdirSync(OUT_DIR, { recursive: true });

async function waitStable(page, ms = 700) {
  await page.waitForSelector('#viewRoot', { timeout: 20000 });
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const chromePath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: chromePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await page.waitForFunction(
      () => typeof Store !== 'undefined' && typeof IndustryConfig !== 'undefined' && window.GB4754_FLAT?.length,
      { timeout: 20000 }
    );
    await page.evaluate(() => {
      const cfg = Store.getIndustryConfig();
      if (!(cfg.rows || []).length) Store.importIndustryConfigFromGb4754();
    });
    await page.goto(`${BASE}#/industry-config`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.industry-config-table tbody tr .ic-edit-btn', { timeout: 20000 });
    await waitStable(page, 500);

    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
      const style = document.createElement('style');
      style.id = 'changelog-shot-style';
      style.textContent = '.app-header{display:none!important}';
      document.head.appendChild(style);
      document.querySelector('.page-title')?.remove();
      const firstEdit = document.querySelector('.ic-edit-btn');
      firstEdit?.closest('tr')?.scrollIntoView({ block: 'center' });
    });
    await waitStable(page, 400);

    const clip = await page.evaluate(() => {
      const card = document.querySelector('#viewRoot .card');
      if (!card) return null;
      const r = card.getBoundingClientRect();
      const x = Math.max(0, Math.floor(r.left - 8));
      const y = Math.max(0, Math.floor(r.top - 8));
      const right = Math.ceil(r.right + 8);
      const bottom = Math.min(Math.ceil(r.bottom + 8), window.innerHeight - 8);
      return {
        x,
        y,
        width: Math.min(Math.ceil(right - x), window.innerWidth - x),
        height: Math.min(Math.ceil(bottom - y), 720)
      };
    });

    if (clip?.width > 0 && clip?.height > 0) {
      await page.screenshot({ path: OUT_FILE, clip });
    } else {
      const el = await page.waitForSelector('#viewRoot .card', { timeout: 8000 });
      await el.screenshot({ path: OUT_FILE });
    }
    console.log('✓', OUT_FILE);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
