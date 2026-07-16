/**
 * 捕获「排放计算步骤 DEV 进入规则 / 强制结束」更新说明截图
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'changelog', 'screenshots');
const BASE = 'http://127.0.0.1:8765/';
const OUT_FILE = path.join(OUT_DIR, 'calculation-step-dev-forced-end.png');
const TASK_ID = 'T2026002';
const REF_DATE = '2027-10-15';

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
  await page.setViewport({ width: 1680, height: 960 });

  await page.evaluateOnNewDocument((refDate) => {
    window.__DEMO_CALC_STEP_REF_DATE__ = refDate;
  }, REF_DATE);

  try {
    await page.goto(BASE, { waitUntil: 'networkidle0' });
    await page.evaluate((refDate, taskId) => {
      window.__DEMO_CALC_STEP_REF_DATE__ = refDate;
      const key = 'hxb_carbon_demo_v19';
      try {
        const d = JSON.parse(localStorage.getItem(key) || '{}');
        delete d._dataCollectDemoSuppsPatched;
        const t = (d.tasks || []).find(x => x.id === taskId);
        if (t) {
          delete t.calculationForcedByDeadline;
          t.workflowStep = 3;
        }
        (d.supplements || []).filter(s => s.taskId === taskId).forEach(s => {
          if (s.forcedEnd || s.auditStage === 'forced_end') {
            if (s.id === 'SDC01') { s.auditStage = 'approved'; s.forcedEnd = false; }
            else if (s.id === 'SDC02') { s.auditStage = 'branch_review'; s.branchReviewStatus = 'pending'; s.forcedEnd = false; }
            else if (s.id === 'SDC03') { s.auditStage = 'pending_fill'; s.status = 'in_progress'; s.forcedEnd = false; }
            else if (s.id === 'SDC04') { s.auditStage = 'hq_review'; s.hqReviewStatus = 'pending'; s.branchReviewStatus = 'approved'; s.forcedEnd = false; }
          }
        });
        (d.approvals || []).filter(a => a.taskId === taskId && a.docType === 'supplement').forEach(a => {
          if (a.status === 'forced_end') a.status = 'pending';
        });
        localStorage.setItem(key, JSON.stringify(d));
      } catch { /* ignore */ }
    }, REF_DATE, TASK_ID);

    await page.goto(`${BASE}#/data-collect?taskId=${TASK_ID}`, { waitUntil: 'networkidle0' });
    await waitStable(page, 900);
    await page.evaluate((taskId) => {
      if (typeof Store === 'undefined') return;
      Store.update((d) => {
        if (typeof Store._rebuildCollectGroupsInPlace === 'function') {
          Store._rebuildCollectGroupsInPlace(d, taskId);
        }
      });
      Store.ensureCalculationStepDeadlinePolicy(taskId);
    }, TASK_ID);
    await page.reload({ waitUntil: 'networkidle0' });
    await waitStable(page, 1000);

    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
      const style = document.createElement('style');
      style.id = 'changelog-shot-style';
      style.textContent = `
        .app-header{display:none!important}
        .page-title{display:none!important}
        .toolbar{display:none!important}
        .filter-panel{display:none!important}
        .card-header{display:none!important}
        .table-wrap{overflow:visible!important}
        .data-table th:nth-child(n+3):nth-child(-n+12),
        .data-table td:nth-child(n+3):nth-child(-n+12){display:none!important}
      `;
      document.head.appendChild(style);
      const wrap = document.querySelector('#viewRoot .table-wrap');
      if (wrap) wrap.scrollLeft = 0;
    });
    await waitStable(page, 500);

    const clip = await page.evaluate(() => {
      const steps = document.querySelector('#viewRoot .steps');
      const tip = document.querySelector('#viewRoot .calc-step-deadline-tip');
      const table = document.querySelector('#viewRoot .data-table');
      const nodes = [steps, tip, table].filter(Boolean);
      if (!nodes.length) return null;
      let top = Infinity;
      let left = Infinity;
      let right = 0;
      let bottom = 0;
      nodes.forEach((el) => {
        const r = el.getBoundingClientRect();
        top = Math.min(top, r.top);
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      });
      const x = Math.max(0, Math.floor(left - 8));
      const y = Math.max(0, Math.floor(top - 8));
      const w = Math.min(Math.ceil(right - left + 16), window.innerWidth - x);
      const h = Math.min(Math.ceil(bottom - top + 16), 760);
      return { x, y, width: w, height: h };
    });

    if (clip?.width > 0 && clip?.height > 0) {
      await page.screenshot({ path: OUT_FILE, clip });
    } else {
      const el = await page.waitForSelector('#viewRoot', { timeout: 8000 });
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
