/**
 * 捕获「数据审核 · 总行一级分行列与筛选」更新说明截图
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'changelog', 'screenshots');
const BASE = 'http://127.0.0.1:8765/';
const OUT_FILE = path.join(OUT_DIR, 'approvals-tier1-branch.png');

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
    await page.goto(`${BASE}#/approvals`, { waitUntil: 'networkidle0' });
    await waitStable(page, 800);
    await page.select('#roleSwitch', 'hq');
    await page.reload({ waitUntil: 'networkidle0' });
    await waitStable(page, 900);

    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
      const style = document.createElement('style');
      style.id = 'changelog-shot-style';
      style.textContent = '.app-header{display:none!important}';
      document.head.appendChild(style);
      document.querySelector('.page-title')?.remove();
      const sel = document.getElementById('apf_tier1Branch');
      if (sel) {
        sel.value = '北京分行';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
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
