/**
 * 单独捕获「排放因子 · 计算方法组合框」更新说明截图
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'changelog', 'screenshots');
const BASE = 'http://127.0.0.1:8765/';
const OUT_FILE = path.join(OUT_DIR, 'factors-method-select.png');

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
    await page.goto(`${BASE}#/factors/new`, { waitUntil: 'networkidle0' });
    await waitStable(page, 800);

    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
      const style = document.createElement('style');
      style.id = 'changelog-shot-style';
      style.textContent = '.app-header{display:none!important}';
      document.head.appendChild(style);
      document.querySelector('.page-title')?.remove();
      document.querySelector('.page-desc')?.remove();
      document.querySelector('.toolbar')?.remove();

      const wrap = document.querySelector('.factor-method-combo-wrap');
      const input = document.getElementById('factorMethodComboInput');
      const dropdown = wrap?.querySelector('.method-combo-dropdown');
      const arrow = wrap?.querySelector('.param-units-drop-arrow');
      if (input) {
        input.value = '行业专项测算法';
        input.focus();
      }
      if (dropdown) dropdown.style.display = 'block';
      if (arrow) arrow.textContent = '▲';
    });
    await waitStable(page, 400);

    const clip = await page.evaluate(() => {
      const grid = document.querySelector('#factorForm .form-grid');
      const combo = document.querySelector('.factor-method-combo-wrap');
      if (!grid) return null;
      const r1 = grid.getBoundingClientRect();
      const r2 = combo?.getBoundingClientRect();
      const bottom = Math.max(r1.bottom, r2?.bottom || 0) + 8;
      const x = Math.max(0, Math.floor(r1.left - 8));
      const y = Math.max(0, Math.floor(r1.top - 8));
      const right = Math.ceil(Math.max(r1.right, r2?.right || 0) + 8);
      return {
        x,
        y,
        width: Math.min(Math.ceil(right - x), window.innerWidth - x),
        height: Math.min(Math.ceil(bottom - y), 420)
      };
    });

    if (clip?.width > 0 && clip?.height > 0) {
      await page.screenshot({ path: OUT_FILE, clip });
    } else {
      const el = await page.waitForSelector('#factorForm', { timeout: 8000 });
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
