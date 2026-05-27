/**
 * 捕获用户手册截图（需先启动 prototype 静态服务：python3 -m http.server 8765）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'manual', 'screenshots');
const BASE = 'http://127.0.0.1:8765/app.html';

fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT = { width: 1440, height: 900 };

async function waitStable(page, ms = 700) {
  await page.waitForSelector('#viewRoot', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, ms));
}

async function resetDemo(page) {
  await page.goto(`${BASE}#/tasks`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.removeItem('hxb_carbon_demo_v13');
    if (typeof Store !== 'undefined') Store.reset();
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await waitStable(page, 900);
}

async function setRole(page, roleKey) {
  await page.select('#roleSwitch', roleKey);
  await waitStable(page, 600);
}

async function go(page, hash, roleKey) {
  if (roleKey) await setRole(page, roleKey);
  await page.goto(`${BASE}${hash}`, { waitUntil: 'networkidle0' });
  await waitStable(page);
}

async function shot(page, name, opts = {}) {
  const file = path.join(OUT_DIR, `${name}.png`);
  if (opts.fullPage) {
    await page.screenshot({ path: file, fullPage: true });
  } else {
    await page.screenshot({ path: file });
  }
  console.log('  ✓', name);
  return file;
}

async function findApprovalId(page, reviewLevel) {
  return page.evaluate((level) => {
    const list = (Store.get().approvals || []).filter(
      (a) => a.docType === 'supplement' && a.reviewLevel === level && a.status === 'pending'
    );
    return list[0]?.id || null;
  }, reviewLevel);
}

async function findSupplementId(page, predicate) {
  return page.evaluate((pred) => {
    const list = Store.get().supplements.filter((s) => s.taskId === Store.get().currentTaskId);
    const fn = new Function('s', `return (${pred})`);
    const hit = list.find((s) => fn(s));
    return hit?.id || list[0]?.id;
  }, predicate.toString());
}

const CAPTURES = [];

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
  await page.setViewport(VIEWPORT);

  try {
    await resetDemo(page);

    // —— 总行 ——
    await go(page, '#/tasks', 'hq');
    await shot(page, 'HQ-01-任务列表');
    await page.type('#tf_name', '2024', { delay: 20 });
    await shot(page, 'HQ-02-任务筛选');
    await page.click('#taskFilterResetBtn');
    await waitStable(page, 300);

    await go(page, '#/task-create', 'hq');
    await shot(page, 'HQ-03-新建任务');

    await go(page, '#/tasks', 'hq');
    await shot(page, 'HQ-04-任务操作');

    await go(page, '#/candidates?taskId=T2025001', 'hq');
    await shot(page, 'HQ-05-流程条-清单识别');
    await shot(page, 'HQ-06-同步台账');
    await shot(page, 'HQ-07-候选筛选');
    await shot(page, 'HQ-08-生成正式清单');

    await go(page, '#/formal?taskId=T2025001', 'hq');
    await shot(page, 'HQ-09-正式清单');
    await shot(page, 'HQ-10-确认锁定');

    await go(page, '#/boundary?taskId=T2025001', 'hq');
    await shot(page, 'HQ-11-对象边界');

    await go(page, '#/data-collect?taskId=T2025001', 'hq');
    await shot(page, 'HQ-12-数据采集总览');
    await page.evaluate(() => {
      document.querySelectorAll('.dispatch-row-check').forEach((cb, i) => {
        if (i < 2) cb.checked = true;
      });
    });
    await shot(page, 'HQ-13-发放补录');
    await shot(page, 'HQ-14-经济法直算');
    await page.evaluate(() => {
      document.querySelectorAll('.dispatch-row-check').forEach((cb) => { cb.checked = false; });
    });
    await shot(page, 'HQ-15-数据采集筛选与操作');
    await shot(page, 'HQ-16-一键提交数据');

    await go(page, '#/approvals', 'hq');
    await shot(page, 'HQ-17-审核列表');
    const hqApr = await findApprovalId(page, 'hq');
    if (hqApr) {
      await go(page, `#/approval-review?approvalId=${hqApr}&mode=review`, 'hq');
      await shot(page, 'HQ-18-总行审核');
      await go(page, `#/approval-review?approvalId=${hqApr}&mode=view`, 'hq');
      await shot(page, 'HQ-19-审核查看');
    } else {
      await go(page, '#/approvals', 'hq');
      await shot(page, 'HQ-18-总行审核');
      await shot(page, 'HQ-19-审核查看');
    }

    await go(page, '#/calculation?taskId=T2025001&view=1', 'hq');
    await shot(page, 'HQ-20-排放计算');
    await shot(page, 'HQ-21-确认结果');

    await go(page, '#/results?taskId=T2025001&view=1', 'hq');
    await shot(page, 'HQ-22-核算结果');

    await go(page, '#/reports?taskId=T2025001&view=1', 'hq');
    await shot(page, 'HQ-23-报告配置');
    await shot(page, 'HQ-24-报告导出与下载');
    await shot(page, 'HQ-25-返回任务列表');

    await go(page, '#/factors', 'hq');
    await shot(page, 'HQ-26-因子列表');
    await go(page, '#/factors/new', 'hq');
    await shot(page, 'HQ-27-因子维护');

    await go(page, '#/interfaces', 'hq');
    await shot(page, 'HQ-28-接口列表');
    await shot(page, 'HQ-29-接口重试');

    // —— 分行 ——
    await resetDemo(page);
    await go(page, '#/branch-board', 'branch');
    await shot(page, 'BR-01-分行补录看板');
    await shot(page, 'BR-02-分行统计卡片');
    await shot(page, 'BR-03-分行列表操作');

    await go(page, '#/approvals', 'branch');
    await shot(page, 'BR-04-分行审核列表');
    const brApr = await findApprovalId(page, 'branch');
    if (brApr) {
      await go(page, `#/approval-review?approvalId=${brApr}&mode=review`, 'branch');
      await shot(page, 'BR-05-分行初审');
      await go(page, `#/approval-review?approvalId=${brApr}&mode=view`, 'branch');
      await shot(page, 'BR-06-审核进度');
    } else {
      await go(page, '#/approvals', 'branch');
      await shot(page, 'BR-05-分行初审');
      await shot(page, 'BR-06-审核进度');
    }

    await go(page, '#/task-view?id=T2025001', 'branch');
    await shot(page, 'BR-07-分行查看任务');
    await go(page, '#/data-collect?taskId=T2025001&view=1', 'branch');
    await shot(page, 'BR-08-分行数据采集');

    // —— 客户经理 ——
    await resetDemo(page);
    await go(page, '#/manager-tasks', 'manager');
    await shot(page, 'MGR-01-客户经理任务');
    await shot(page, 'MGR-02-任务列表操作');

    const suppId = await page.evaluate(() => {
      const list = Store.get().supplements.filter(
        (s) => s.taskId === 'T2025001' && s.manager === '王磊' && ['pending', 'in_progress'].includes(s.status)
      );
      return (list.find((s) => s.status === 'in_progress') || list[0])?.id || 'S002';
    });
    await go(page, `#/supplement-fill?id=${suppId}`, 'manager');
    await shot(page, 'MGR-03-填报页概览');
    await shot(page, 'MGR-04-基本信息');
    await page.evaluate(() => {
      const tab = document.querySelector('#methodTabs .tab[data-tab="report"]')
        || document.querySelector('#methodTabs .tab');
      tab?.click();
    });
    await waitStable(page, 400);
    await shot(page, 'MGR-05-方法填报');
    await shot(page, 'MGR-06-暂存与提交数据');

    await go(page, '#/manager-tasks', 'manager');
    await page.evaluate(() => {
      const btn = document.querySelector('.submit-review-btn');
      if (btn) btn.scrollIntoView({ block: 'center' });
    });
    await waitStable(page, 300);
    await shot(page, 'MGR-07-提交审核与流程');

    const returnedId = await page.evaluate(() => {
      const s = Store.get().supplements.find(
        (x) => x.taskId === 'T2025001' && x.status === 'returned'
      );
      return s?.id;
    });
    if (returnedId) {
      await go(page, `#/supplement-fill?id=${returnedId}`, 'manager');
      await shot(page, 'MGR-08-驳回重填');
    } else {
      await go(page, `#/supplement-fill?id=${suppId}`, 'manager');
      await shot(page, 'MGR-08-驳回重填');
    }

    await go(page, '#/manager-tasks', 'manager');
    await shot(page, 'MGR-09-返回列表');

    console.log('\n完成，共输出目录:', OUT_DIR);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
