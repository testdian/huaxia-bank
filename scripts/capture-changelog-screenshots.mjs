/**
 * 捕获更新说明抽屉用真实页面截图（需先启动：python3 -m http.server 8765）
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'assets', 'changelog', 'screenshots');
const BASE = 'http://127.0.0.1:8765/';

fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT = { width: 1440, height: 900 };

async function waitStable(page, ms = 700) {
  await page.waitForSelector('#viewRoot', { timeout: 20000 });
  await new Promise((r) => setTimeout(r, ms));
}

async function resetDemo(page) {
  await page.goto(`${BASE}#/tasks`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
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

async function shotSelector(page, selector, name, opts = {}) {
  const file = path.join(OUT_DIR, `${name}.png`);
  let el;
  try {
    el = await page.waitForSelector(selector, { timeout: opts.timeout || 12000 });
  } catch (err) {
    if (opts.fallback) {
      el = await page.waitForSelector(opts.fallback, { timeout: 8000 });
    } else {
      throw err;
    }
  }
  if (opts.scroll) {
    await page.evaluate((sel) => {
      const node = typeof sel === 'string' ? document.querySelector(sel) : null;
      (node || document.querySelector('#viewRoot'))?.scrollIntoView({ block: 'center' });
    }, selector);
    await new Promise((r) => setTimeout(r, 350));
  }
  await el.screenshot({ path: file });
  console.log('  ✓', name);
  return file;
}

async function shotViewport(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path: file });
  console.log('  ✓', name);
  return file;
}

async function enableBasicConfigMenus(page) {
  await page.evaluate(() => {
    Store.update((d) => {
      d.menuVisibility = {
        ...MenuPermissions.DEFAULT_VISIBILITY,
        'method-params': true,
        'method-templates': true,
        'industry-config': true,
        'permission-mgmt': true
      };
    });
  });
  await waitStable(page, 400);
}

async function clickTab(page, selector) {
  await page.evaluate((sel) => {
    document.querySelector(sel)?.click();
  }, selector);
  await waitStable(page, 450);
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
  await page.setViewport(VIEWPORT);

  try {
    await resetDemo(page);
    await enableBasicConfigMenus(page);

    // v0.7.15 顶栏
    await go(page, '#/tasks', 'hq');
    await shotSelector(page, '.app-header', 'header-changelog-btn');

    // v0.7.14-pm 排放因子库
    await go(page, '#/factors', 'hq');
    const factorId = await page.evaluate(() => {
      const f = (Store.get().factors || []).find((x) => !x.isBuiltin) || Store.get().factors?.[0];
      return f?.id || null;
    });
    if (factorId) {
      await go(page, `#/factors/edit?id=${encodeURIComponent(factorId)}`, 'hq');
    } else {
      await go(page, '#/factors/new', 'hq');
    }
    await shotSelector(page, '#factorForm', 'factors-edit-fields');

    await go(page, '#/factors', 'hq');
    await shotSelector(page, '.factor-version-tabs', 'factors-version-tabs');

    await go(page, '#/factors', 'hq');
    await shotSelector(page, '#viewRoot .card', 'factors-list');

    const tplId = await page.evaluate(() => {
      const t = (METHOD_CONFIG?.templates || []).find((x) => x.status === 'published') || METHOD_CONFIG?.templates?.[0];
      return t?.id || 'tpl_np_平板玻璃_energy';
    });

    // 模板
    await go(page, `#/method-config/templates/edit?id=${encodeURIComponent(tplId)}&step=2`, 'hq');
    await page.evaluate(() => {
      document.getElementById('tplUpdateAllFactorVersionsBtn')?.scrollIntoView({ block: 'center' });
    });
    await waitStable(page, 300);
    await shotSelector(page, '#tplEditForm .card:first-of-type', 'template-update-factors');

    await go(page, '#/method-config/templates', 'hq');
    await page.evaluate(() => {
      const table = document.querySelector('#viewRoot .data-table');
      table?.scrollIntoView({ block: 'start' });
      const actionCell = table?.querySelector('tbody tr td.actions');
      actionCell?.scrollIntoView({ inline: 'end', block: 'nearest' });
    });
    await waitStable(page, 400);
    await shotSelector(page, '#viewRoot .card:last-of-type', 'template-list');

    await go(page, `#/method-config/templates/edit?id=${encodeURIComponent(tplId)}&step=1&mode=view`, 'hq');
    await shotSelector(page, '#tplEditForm', 'template-view-mode');

    await go(page, '#/method-config/templates/new', 'hq');
    await page.evaluate(() => {
      const input = document.querySelector('#tplCreateMethodDatalistWrap .method-combo-input');
      if (input) {
        input.value = '经济活动法';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await waitStable(page, 400);
    await shotSelector(page, '#tplCreateForm', 'template-method-collect-hint');

    await go(page, '#/method-config/templates/new', 'hq');
    await shotSelector(page, '#tplCreateForm', 'template-factor-version');

    await go(page, '#/method-config/params/new', 'hq');
    await page.evaluate(() => {
      const sel = document.querySelector('#paramForm select[name="category"]');
      sel?.closest('.form-item')?.scrollIntoView({ block: 'center' });
    });
    await waitStable(page, 350);
    await shotSelector(page, '#paramForm', 'param-category-form');

    await go(page, '#/method-config/params/edit?id=P_report_attach', 'hq');
    await page.evaluate(() => {
      document.querySelector('#paramForm [data-format-panel="attachment"]')?.scrollIntoView({ block: 'center' });
    });
    await waitStable(page, 350);
    await shotSelector(page, '#paramForm', 'param-attachment-config');

    await go(page, '#/method-config/params', 'hq');
    await shotSelector(page, '#viewRoot .card:last-of-type', 'param-list');

    // 候选清单
    await go(page, '#/candidates?taskId=T2025001', 'hq');
    await page.evaluate(() => {
      const row = [...document.querySelectorAll('#candidateTbody tr')].find((tr) =>
        tr.textContent.includes('项目（计算方法待定）')
      );
      row?.scrollIntoView({ block: 'center' });
    });
    await waitStable(page, 400);
    await shotSelector(page, '#viewRoot .card:last-of-type', 'candidates-project-pending');

    // 新建任务筛选（候选清单步骤）
    await go(page, '#/candidates?taskId=T2025001', 'hq');
    await page.waitForFunction(() => !!document.getElementById('f_proj_bal_min'), { timeout: 15000 });
    await page.evaluate(() => {
      document.getElementById('f_proj_bal_min')?.closest('.filter-panel')?.scrollIntoView({ block: 'center' });
    });
    await waitStable(page, 400);
    await shotSelector(page, '.filter-panel', 'task-create-filters', { fallback: '#viewRoot .card' });

    // 企业碳账户 - 项目可展开列表
    await go(page, '#/carbon-accounts', 'hq');
    const caExpandMeta = await page.evaluate(() => {
      const d = Store.get();
      const years = [...new Set((d.tasks || []).map(t => String(t.year)).filter(Boolean))].sort();
      for (const year of years.reverse()) {
        const rows = CarbonAccount.buildAccountListRows(d, d.carbonAccounts, year);
        const parent = rows.find(r => !r.isSubAccount && r.hasExpandableProjects);
        if (parent) {
          sessionStorage.setItem('ca_list_filters', JSON.stringify({
            accountingYear: year,
            viewMode: 'year',
            keyword: parent.customerName
          }));
          sessionStorage.setItem('ca_project_expanded', JSON.stringify([parent.expandKey]));
          return true;
        }
      }
      return false;
    });
    if (caExpandMeta) {
      await page.reload({ waitUntil: 'networkidle0' });
      await waitStable(page, 700);
      await page.evaluate(() => {
        const btn = document.querySelector('[data-ca-expand]');
        if (btn && btn.getAttribute('aria-expanded') !== 'true') btn.click();
      });
      await waitStable(page, 400);
      await shotSelector(page, '#caAccountsRoot .card', 'carbon-accounts-project-expand', {
        fallback: '#caAccountsRoot .table-wrap'
      });
    }

    // 企业碳账户 - 注销无编辑、主体排放为 0
    await go(page, '#/carbon-accounts', 'hq');
    await page.evaluate(() => {
      const sel = document.getElementById('ca_status');
      if (sel) sel.value = 'cancelled';
      document.getElementById('caFilterBtn')?.click();
    });
    await waitStable(page, 500);
    await page.evaluate(() => {
      const row = document.querySelector('.badge-danger')?.closest('tr');
      row?.scrollIntoView({ block: 'center' });
    });
    await waitStable(page, 300);
    await shotSelector(page, '#caAccountsRoot .table-wrap', 'carbon-accounts-cancelled');

    // 企业碳账户 - 停用注销
    await go(page, '#/carbon-accounts', 'hq');
    await page.evaluate(() => {
      const btn = document.querySelector('.ca-account-status-btn');
      btn?.closest('tr')?.scrollIntoView({ block: 'center' });
    });
    await waitStable(page, 400);
    await shotSelector(page, '#caAccountsRoot .table-wrap', 'carbon-accounts-status');

    // 行业配置
    await go(page, '#/industry-config', 'hq');
    await page.evaluate(() => {
      document.querySelectorAll('.ic-tag-filter-chip input').forEach((cb) => { cb.checked = true; });
      document.getElementById('icFilterBtn')?.click();
    });
    await waitStable(page, 500);
    await shotSelector(page, '.industry-config-filter', 'industry-config-tags');

    // v0.7.14-am 数据审核（分行角色才展示批量审核工具栏）
    await go(page, '#/approvals', 'branch');
    await shotSelector(page, '.approval-batch-toolbar', 'approvals-batch-toolbar', { scroll: true, fallback: '.approval-table-body' });

    // v0.7.15 同主体排放冲突弹窗（使用专用演示数据 SEC001–SEC003，客户名称一致）
    await go(page, '#/approvals', 'branch');
    await page.evaluate(() => {
      const d = Store.get();
      const taskId = 'T2025001';
      const current = (d.supplements || []).find((s) => s.id === 'SEC002');
      if (!current) return;
      const creditCode = getSupplementCreditCode(current, d);
      const methodExtra = { selectedMethodId: current.approvedMethodId || 'report' };
      const conflicts = findConflictApprovedSupplements(taskId, current.id, 'branch', d);
      const currentPreview = buildSupplementEmissionSnapshot(current, taskId, d, methodExtra);
      openSupplementEmissionConflictModal({
        creditCode,
        currentSupplement: current,
        currentPreview,
        conflicts,
        taskId,
        reviewLevel: 'branch',
        onConfirm: () => {}
      });
    });
    await page.waitForSelector('#emissionConflictModal.show', { timeout: 12000 });
    await waitStable(page, 400);
    await shotSelector(page, '#emissionConflictModal .modal', 'emission-conflict-modal');

    // 正式清单
    await go(page, '#/formal?taskId=T2025001', 'hq');
    await shotSelector(page, '#viewRoot table.data-table thead', 'formal-credit-columns');

    // 数据采集 - 客户经理填报
    const suppId = await page.evaluate(() => {
      const list = Store.get().supplements.filter((s) => s.taskId === 'T2025001');
      return (list.find((s) => s.status === 'in_progress') || list[0])?.id || 'S002';
    });
    await resetDemo(page);
    await go(page, `#/supplement-fill?id=${suppId}`, 'manager');
    await shotSelector(page, '#methodTabs', 'data-collect-method-tabs');

    await clickTab(page, '#methodTabs .tab[data-tab="report_authority"]');
    await shotSelector(page, '.tab-panel.active .form-grid', 'data-collect-report-attach');

    await clickTab(page, '#methodTabs .tab[data-tab="economy"]');
    await shotSelector(page, '.tab-panel.active .form-grid', 'data-collect-economy-label');

    // 排放数据 DEV 填报说明（卡片标题 + 侧栏）
    await go(page, `#/supplement-fill?id=${suppId}`, 'manager');
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
    const emissionSpecClip = await page.evaluate(() => {
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
    const emissionSpecFile = path.join(OUT_DIR, 'supplement-emission-dev-spec.png');
    if (emissionSpecClip?.width > 0 && emissionSpecClip?.height > 0) {
      await page.screenshot({ path: emissionSpecFile, clip: emissionSpecClip });
    } else {
      await shotSelector(page, '#devEmissionSpecDrawer .drawer-panel', 'supplement-emission-dev-spec', {
        fallback: '.card-header--with-dev-hint'
      });
    }
    console.log('  ✓', 'supplement-emission-dev-spec');
    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
      document.getElementById('devEmissionSpecDrawer')?.classList.remove('show');
      document.body.classList.remove('drawer-open');
    });

    // 排放计算
    await resetDemo(page);
    await enableBasicConfigMenus(page);
    await go(page, '#/calculation?taskId=T2025001&view=1', 'hq');
    await page.evaluate(() => {
      document.querySelector('.calculation-intensity-card')?.scrollIntoView({ block: 'start' });
    });
    await waitStable(page, 350);
    await shotSelector(page, '.calculation-intensity-card', 'calculation-intensity-unit');

    await go(page, '#/calculation?taskId=T2025001&view=1', 'hq');
    await page.evaluate(() => {
      const th = [...document.querySelectorAll('th')].find((el) => el.textContent.trim() === '质量评级');
      th?.closest('table')?.scrollIntoView({ block: 'center' });
    });
    await waitStable(page, 350);
    await shotSelector(page, '.calculation-intensity-card table', 'calculation-quality-grade');

    // 排放计算 - 项目总投资筛选
    await go(page, '#/calculation?taskId=T2025001', 'hq');
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
    const calcFilterClip = await page.evaluate(() => {
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
        height: Math.min(Math.ceil(bottom - y), 480)
      };
    });
    const calcFilterFile = path.join(OUT_DIR, 'calculation-invest-filter.png');
    if (calcFilterClip?.width > 0 && calcFilterClip?.height > 0) {
      await page.screenshot({ path: calcFilterFile, clip: calcFilterClip });
    } else {
      await shotSelector(page, '#calc_invest_min', 'calculation-invest-filter', {
        fallback: '#viewRoot .card .filter-panel'
      });
    }
    console.log('  ✓', 'calculation-invest-filter');
    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
    });

    // 台账 - 分行
    await go(page, '#/ledger', 'branch');
    await shotSelector(page, '#viewRoot .table-wrap', 'ledger-branch-scope');

    // 企业碳账户 - 趋势
    const accountId = await page.evaluate(() => {
      const acc = (Store.get().carbonAccounts || [])[0];
      return acc?.id || null;
    });
    if (accountId) {
      await go(page, `#/carbon-account?id=${encodeURIComponent(accountId)}&tab=trend`, 'hq');
      await shotSelector(page, '#viewRoot .card', 'carbon-trend-priority');
    } else {
      await go(page, '#/carbon-accounts', 'hq');
      await shotViewport(page, 'carbon-trend-priority');
    }

    // 新建任务纳入规则（非项目月均门槛筛选）
    await go(page, '#/candidates?taskId=T2025001', 'hq');
    await page.waitForFunction(() => !!document.getElementById('f_bal_min'), { timeout: 15000 });
    await page.evaluate(() => {
      document.getElementById('f_bal_min')?.closest('.candidate-filter-row-2')?.scrollIntoView({ block: 'center' });
    });
    await waitStable(page, 400);
    await shotSelector(page, '#f_bal_min', 'task-create-inclusion', { fallback: '.filter-panel' });

    // 企业碳账户 - 分行无编辑
    await go(page, '#/carbon-accounts', 'branch');
    await shotSelector(page, '#caAccountsRoot .table-wrap', 'carbon-accounts-edit-perm');

    // 模板行业多选
    await go(page, `#/method-config/templates/edit?id=${encodeURIComponent(tplId)}&step=1`, 'hq');
    await shotSelector(page, '.method-config-meta-form', 'template-industry-multi');

    console.log('\n完成，输出目录:', OUT_DIR);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
