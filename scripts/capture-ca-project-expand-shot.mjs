/**
 * 单独捕获「企业碳账户 · 项目可展开列表」更新说明截图
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'changelog', 'screenshots');
const BASE = 'http://127.0.0.1:8765/';
const OUT_FILE = path.join(OUT_DIR, 'carbon-accounts-project-expand.png');

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

    await page.select('#roleSwitch', 'hq');
    await page.goto(`${BASE}#/carbon-accounts`, { waitUntil: 'networkidle0' });
    await waitStable(page, 800);

    const found = await page.evaluate(() => {
      const d = Store.get();
      const years = [...new Set((d.tasks || []).map(t => String(t.year)).filter(Boolean))].sort();
      for (const year of years.reverse()) {
        const rows = CarbonAccount.buildAccountListRows(d, d.carbonAccounts, year);
        const parents = rows.filter(r => !r.isSubAccount && r.hasExpandableProjects);
        const parent = parents.find(p => {
          const subs = rows.filter(r => r.isSubAccount && r.parentExpandKey === p.expandKey);
          return (p.account?.status || 'active') === 'active'
            && subs.some(s => Number(s.entityEmission) > 0 && s.method && s.method !== '-');
        }) || parents.find(p => (p.account?.status || 'active') === 'active') || parents[0];
        if (parent) {
          sessionStorage.setItem('ca_list_filters', JSON.stringify({
            accountingYear: year,
            viewMode: 'year',
            keyword: parent.creditCode
          }));
          sessionStorage.setItem('ca_project_expanded', JSON.stringify([parent.expandKey]));
          sessionStorage.setItem('list_page_carbon_accounts', '1');
          return { year, expandKey: parent.expandKey, name: parent.customerName, credit: parent.creditCode };
        }
      }
      return null;
    });

    if (!found) {
      throw new Error('未找到含可展开项目的碳账户演示数据');
    }

    await page.reload({ waitUntil: 'networkidle0' });
    await waitStable(page, 900);

    const toggled = await page.evaluate(() => {
      const btn = document.querySelector('[data-ca-expand]');
      if (!btn) return false;
      if (btn.getAttribute('aria-expanded') !== 'true') btn.click();
      return true;
    });
    if (!toggled) {
      throw new Error('列表未渲染可展开按钮');
    }
    await waitStable(page, 500);

    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
      const style = document.createElement('style');
      style.id = 'changelog-shot-style';
      style.textContent = '.app-header{display:none!important}';
      document.head.appendChild(style);
      document.querySelector('.page-title')?.remove();
      document.querySelector('.stats-row')?.remove();
      document.querySelector('.filter-panel')?.remove();
      document.querySelector('.pagination')?.remove();
    });
    await waitStable(page, 400);

    const clip = await page.evaluate(() => {
      const table = document.querySelector('#caAccountsRoot .data-table');
      const card = table?.closest('.card');
      if (!table || !card) return null;
      const header = card.querySelector('.card-header');
      const r1 = (header || card).getBoundingClientRect();
      const r2 = table.getBoundingClientRect();
      const rows = [...table.querySelectorAll('tbody tr')];
      const parentIdx = rows.findIndex(tr => tr.classList.contains('ca-parent-account-row'));
      const endRow = parentIdx >= 0
        ? rows.slice(parentIdx).find((tr, i, arr) => i > 0 && !tr.classList.contains('ca-sub-account-row')) || rows[rows.length - 1]
        : rows[Math.min(3, rows.length - 1)];
      const bottom = (endRow?.getBoundingClientRect().bottom ?? r2.bottom) + 8;
      const x = Math.max(0, Math.floor(r1.left - 8));
      const y = Math.max(0, Math.floor(r1.top - 4));
      const right = Math.ceil(Math.max(r1.right, r2.right) + 8);
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
      const el = await page.waitForSelector('#caAccountsRoot .table-wrap', { timeout: 8000 });
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
