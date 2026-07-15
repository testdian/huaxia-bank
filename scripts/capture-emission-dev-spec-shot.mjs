/**
 * 单独捕获「排放数据 DEV 填报说明」更新说明截图
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'changelog', 'screenshots');
const BASE = 'http://127.0.0.1:8765/';
const OUT_FILE = path.join(OUT_DIR, 'supplement-emission-dev-spec.png');

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
    await page.goto(`${BASE}#/tasks`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      if (typeof Store !== 'undefined') Store.reset();
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await waitStable(page, 900);

    await page.select('#roleSwitch', 'manager');
    await waitStable(page, 500);

    const suppId = await page.evaluate(() => {
      const list = Store.get().supplements.filter((s) => s.taskId === 'T2025001');
      return (list.find((s) => s.status === 'in_progress') || list[0])?.id || 'S002';
    });

    await page.goto(`${BASE}#/supplement-fill?id=${suppId}`, { waitUntil: 'networkidle0' });
    await waitStable(page, 800);

    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
      const style = document.createElement('style');
      style.id = 'changelog-shot-style';
      style.textContent = '.app-header{display:none!important}';
      document.head.appendChild(style);
      document.querySelector('.dev-emission-spec-trigger')?.click();
    });
    await page.waitForSelector('#devEmissionSpecDrawer.show', { timeout: 12000 });
    await waitStable(page, 500);

    const clip = await page.evaluate(() => {
      const header = document.querySelector('.card-header--with-dev-hint');
      const drawer = document.querySelector('#devEmissionSpecDrawer .drawer-panel');
      if (!header || !drawer) return null;
      const r1 = header.getBoundingClientRect();
      const r2 = drawer.getBoundingClientRect();
      const x = Math.max(0, Math.floor(Math.min(r1.left, r2.left) - 12));
      const y = Math.max(0, Math.floor(r1.top - 8));
      const right = Math.ceil(Math.max(r1.right, r2.right) + 12);
      const bottom = Math.ceil(Math.min(window.innerHeight - 8, Math.max(r2.bottom, r1.bottom + 120) + 8));
      return {
        x,
        y,
        width: Math.min(Math.ceil(right - x), window.innerWidth - x),
        height: Math.min(Math.ceil(bottom - y), 560)
      };
    });

    if (clip?.width > 0 && clip?.height > 0) {
      await page.screenshot({ path: OUT_FILE, clip });
    } else {
      const el = await page.waitForSelector('#devEmissionSpecDrawer .drawer-panel', { timeout: 8000 });
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
