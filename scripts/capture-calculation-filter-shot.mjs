/**
 * 单独捕获「排放计算 · 项目总投资筛选」更新说明截图
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'changelog', 'screenshots');
const BASE = 'http://127.0.0.1:8765/';
const OUT_FILE = path.join(OUT_DIR, 'calculation-invest-filter.png');

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
      if (typeof MenuPermissions !== 'undefined') {
        Store.update((d) => {
          d.menuVisibility = {
            ...MenuPermissions.DEFAULT_VISIBILITY,
            'method-params': true,
            'method-templates': true,
            'industry-config': true,
            'permission-mgmt': true
          };
        });
      }
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await waitStable(page, 900);

    await page.select('#roleSwitch', 'hq');
    await page.goto(`${BASE}#/calculation?taskId=T2025001`, { waitUntil: 'networkidle0' });
    await waitStable(page, 600);

    await page.evaluate(() => {
      Store.update((d) => {
        const t = d.tasks.find((x) => x.id === 'T2025001');
        if (t) {
          t.resultsConfirmed = false;
          delete t.resultsConfirmedAt;
          delete t.calculationScopeLock;
          t.workflowStep = 4;
        }
      });
      if (typeof Store.rebuildCollectGroups === 'function') {
        Store.rebuildCollectGroups('T2025001');
      }
      sessionStorage.setItem('calculation_filters_T2025001', JSON.stringify({
        investMin: '3000000000',
        investMax: '50000000000'
      }));
      const style = document.createElement('style');
      style.id = 'changelog-shot-style';
      style.textContent = '.app-header{display:none!important}';
      document.getElementById('changelog-shot-style')?.remove();
      document.head.appendChild(style);
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await waitStable(page, 800);
    await page.evaluate(() => {
      document.getElementById('calculationFilterBtn')?.click();
    });
    await waitStable(page, 500);
    await page.evaluate(() => {
      ['.page-title', '.steps', '.toolbar', '.stats-row', '.calculation-intensity-card', '.demo-tip'].forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => { el.style.display = 'none'; });
      });
      const filterCard = document.getElementById('calc_invest_min')?.closest('.card');
      filterCard?.scrollIntoView({ block: 'start' });
      window.scrollTo(0, 0);
    });
    await waitStable(page, 450);

    const clip = await page.evaluate(() => {
      const filterCard = document.getElementById('calc_invest_min')?.closest('.card');
      const listCard = [...document.querySelectorAll('#viewRoot .card')].find((c) =>
        c.querySelector('h3')?.textContent?.trim() === '排放计算清单'
      );
      if (!filterCard || !listCard) return null;
      const r1 = filterCard.getBoundingClientRect();
      const r2 = listCard.getBoundingClientRect();
      const thead = listCard.querySelector('thead');
      const bottom = (thead?.getBoundingClientRect().bottom ?? r2.bottom) + 12;
      const x = Math.max(0, Math.floor(Math.min(r1.left, r2.left) - 16));
      const y = Math.max(0, Math.floor(r1.top - 12));
      const right = Math.ceil(Math.max(r1.right, r2.right) + 16);
      return {
        x,
        y,
        width: Math.min(Math.ceil(right - x), window.innerWidth - x),
        height: Math.min(Math.ceil(bottom - y), 520)
      };
    });

    if (clip?.width > 0 && clip?.height > 0) {
      await page.screenshot({ path: OUT_FILE, clip });
    } else {
      const el = await page.waitForSelector('#calc_invest_min', { timeout: 8000 });
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
