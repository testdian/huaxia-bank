/**
 * 捕获 v1.1 更新说明截图（需先启动：python3 -m http.server 8765）
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

    // 1. 数据审核 — 单行状态流转
    await go(page, '#/approvals?taskId=T2025001', 'branch');
    await shotSelector(page, '#viewRoot .card', 'approvals-status-flow', {
      fallback: '#viewRoot .table-wrap',
      scroll: true
    });

    // 2. 企业碳账户 — 按年度去重（搜索鞍钢）
    await go(page, '#/carbon-accounts', 'hq');
    await page.evaluate(() => {
      sessionStorage.setItem('ca_list_filters', JSON.stringify({
        viewMode: 'year',
        accountingYear: '2025',
        keyword: '鞍钢'
      }));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await waitStable(page, 800);
    await page.evaluate(() => {
      document.getElementById('caFilterBtn')?.click();
    });
    await waitStable(page, 500);
    await shotSelector(page, '#caAccountsRoot', 'carbon-accounts-year-dedupe');

    // 3. 企业碳账户 — 按企业汇总去重
    await page.evaluate(() => {
      sessionStorage.setItem('ca_list_filters', JSON.stringify({
        viewMode: 'enterprise',
        keyword: '鞍钢'
      }));
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await waitStable(page, 800);
    await page.evaluate(() => {
      document.querySelector('[data-ca-view-mode="enterprise"]')?.click();
      document.getElementById('caFilterBtn')?.click();
    });
    await waitStable(page, 500);
    await shotSelector(page, '#caAccountsRoot', 'carbon-accounts-enterprise-dedupe');

    // 4. 模板 — 行业×方法唯一（重复校验 toast）
    await go(page, '#/method-config/templates/new', 'hq');
    await page.waitForSelector('#tplCreateForm', { timeout: 15000 });
    await page.evaluate(() => {
      const form = document.getElementById('tplCreateForm');
      form.querySelector('[name="templateName"]').value = '电力-能源法（重复测试）';
      form.querySelector('[name="industryCombined"]').value = JSON.stringify(['电力']);
      form.querySelector('[name="methodId"]').value = '物理活动法-能源法';
      const fd = new FormData(form);
      const result = METHOD_CONFIG.createTemplate({
        templateName: (fd.get('templateName') || '').toString().trim(),
        industries: METHOD_CONFIG.parseIndustriesCombined(fd.get('industryCombined')),
        subCategory: '',
        methodId: resolveMethodIdFromName((fd.get('methodId') || '').toString().trim()),
        priority: fd.get('priority'),
        applyScene: fd.getAll('applyScene').filter(Boolean),
        description: '',
        factorVersionRank: fd.get('factorVersionRank')
      });
      if (!result.ok) toast(result.message, result.id ? 'warning' : 'error');
    });
    await page.waitForSelector('#toastContainer .toast.warning', { timeout: 8000 });
    await waitStable(page, 350);
    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
      const style = document.createElement('style');
      style.id = 'changelog-shot-style';
      style.textContent = `
        .app-header, .app-sidebar, h1.page-title, .form-actions { display: none !important; }
        .app-main { margin: 0 !important; padding: 20px 24px !important; }
        .toast-container { position: absolute !important; top: 16px !important; right: 24px !important; z-index: 999 !important; }
        .toast { max-width: 520px !important; line-height: 1.5 !important; }
      `;
      document.head.appendChild(style);
    });
    await waitStable(page, 200);
    const uniqueClip = await page.evaluate(() => {
      const toast = document.querySelector('#toastContainer .toast.warning');
      const card = document.querySelector('#tplCreateForm')?.closest('.card');
      if (!toast || !card) return null;
      const tr = toast.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const left = Math.min(tr.left, cr.left);
      const top = Math.min(tr.top, cr.top);
      const right = Math.max(tr.right, cr.right);
      const bottom = Math.max(tr.bottom, Math.min(cr.bottom, cr.top + 420));
      return {
        x: Math.max(0, Math.floor(left - 16)),
        y: Math.max(0, Math.floor(top - 12)),
        width: Math.min(Math.ceil(right - left + 32), window.innerWidth - 20),
        height: Math.min(Math.ceil(bottom - top + 24), 520)
      };
    });
    const uniqueFile = path.join(OUT_DIR, 'template-industry-method-unique.png');
    if (uniqueClip?.width > 0 && uniqueClip?.height > 0) {
      await page.screenshot({ path: uniqueFile, clip: uniqueClip });
    } else {
      await shotSelector(page, '#toastContainer', 'template-industry-method-unique');
    }
    await page.evaluate(() => document.getElementById('changelog-shot-style')?.remove());
    console.log('  ✓', 'template-industry-method-unique');

    // 5. 模板编辑 — 因子搜索展示行业
    const tplId = await page.evaluate(() => {
      const t = (METHOD_CONFIG?.templates || []).find(
        (x) => x.methodId === 'energy' && x.status === 'published'
      );
      return t?.id || 'tpl_np_电力_energy';
    });
    await go(page, `#/method-config/templates/edit?id=${encodeURIComponent(tplId)}&step=2`, 'hq');
    await page.waitForSelector('.inline-factor-search', { timeout: 15000 });
    await page.click('.inline-factor-search');
    await page.evaluate(() => {
      const search = document.querySelector('.inline-factor-search');
      const picker = search?.closest('.inline-factor-picker');
      if (!picker) return;
      search.value = '';
      search.dispatchEvent(new Event('input', { bubbles: true }));
      picker.classList.add('open');
      picker.querySelector('.inline-factor-dropdown')?.removeAttribute('hidden');
    });
    await waitStable(page, 800);
    const factorClip = await page.evaluate(() => {
      const picker = document.querySelector('.inline-factor-picker');
      const dropdown = picker?.querySelector('.inline-factor-dropdown');
      if (!picker || !dropdown) return null;
      const r1 = picker.getBoundingClientRect();
      const r2 = dropdown.getBoundingClientRect();
      const top = Math.min(r1.top, r2.top);
      const left = Math.min(r1.left, r2.left);
      const bottom = Math.max(r1.bottom, r2.bottom);
      const right = Math.max(r1.right, r2.right);
      return {
        x: Math.max(0, Math.floor(left - 12)),
        y: Math.max(0, Math.floor(top - 12)),
        width: Math.min(Math.ceil(right - left + 24), window.innerWidth),
        height: Math.min(Math.ceil(bottom - top + 24), 480)
      };
    });
    const factorFile = path.join(OUT_DIR, 'template-factor-industry-search.png');
    if (factorClip?.width > 80 && factorClip?.height > 80) {
      await page.screenshot({ path: factorFile, clip: factorClip });
    } else {
      await shotSelector(page, '.method-config-structure-table', 'template-factor-industry-search', {
        fallback: '#viewRoot .card-body',
        scroll: true
      });
    }
    console.log('  ✓', 'template-factor-industry-search');

    // 6. 核算任务 — 因子版本字段（仅因子版本，保留 v1.1 原截图）
    await enableBasicConfigMenus(page);
    await page.evaluate(() => {
      if (typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.collectTemplateLibraryVersionRanks(METHOD_CONFIG.templates).length < 2) {
        METHOD_CONFIG.createTemplateLibraryNextVersion({ sourceRank: 1 });
      }
    });
    await go(page, '#/task-create', 'hq');
    await page.waitForSelector('[name="factorVersionRank"]', { timeout: 15000 });
    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
      const style = document.createElement('style');
      style.id = 'changelog-shot-style';
      style.textContent = `
        .app-header, .app-sidebar, .demo-steps, h1.page-title, .card > div[style*="border-top"] { display: none !important; }
        .app-main { margin: 0 !important; padding: 24px !important; min-height: auto !important; }
        body { background: #f5f7fa !important; }
        #taskForm .form-item,
        #taskForm .task-industry-scope-block,
        #taskForm #investIndustryScopeBlock,
        #taskForm #subjectIndustryScopeBlock { display: none !important; }
        #taskForm .form-item:has([name="deadline"]),
        #taskForm .form-item:has([name="branchDeadline"]),
        #taskForm .form-item:has([name="factorVersionRank"]) { display: block !important; }
      `;
      document.head.appendChild(style);
    });
    await waitStable(page, 400);
    const taskForm = await page.$('#taskForm');
    const taskFile = path.join(OUT_DIR, 'task-factor-version-field.png');
    if (taskForm) {
      await taskForm.screenshot({ path: taskFile });
    } else {
      await shotSelector(page, '#taskForm', 'task-factor-version-field');
    }
    await page.evaluate(() => document.getElementById('changelog-shot-style')?.remove());
    console.log('  ✓', 'task-factor-version-field');

    // 6b. 核算任务 — 因子版本 + 模板版本字段
    await go(page, '#/task-create', 'hq');
    await page.waitForSelector('[name="templateVersionRank"]', { timeout: 15000 });
    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
      const style = document.createElement('style');
      style.id = 'changelog-shot-style';
      style.textContent = `
        .app-header, .app-sidebar, .demo-steps, h1.page-title, .card > div[style*="border-top"] { display: none !important; }
        .app-main { margin: 0 !important; padding: 24px !important; min-height: auto !important; }
        body { background: #f5f7fa !important; }
        #taskForm .form-item,
        #taskForm .task-industry-scope-block,
        #taskForm #investIndustryScopeBlock,
        #taskForm #subjectIndustryScopeBlock { display: none !important; }
        #taskForm .form-item:has([name="deadline"]),
        #taskForm .form-item:has([name="branchDeadline"]),
        #taskForm .form-item:has([name="factorVersionRank"]),
        #taskForm .form-item:has([name="templateVersionRank"]) { display: block !important; }
      `;
      document.head.appendChild(style);
    });
    await waitStable(page, 400);
    const taskForm2 = await page.$('#taskForm');
    const taskTplFile = path.join(OUT_DIR, 'task-template-version-field.png');
    if (taskForm2) {
      await taskForm2.screenshot({ path: taskTplFile });
    } else {
      await shotSelector(page, '#taskForm', 'task-template-version-field');
    }
    await page.evaluate(() => document.getElementById('changelog-shot-style')?.remove());
    console.log('  ✓', 'task-template-version-field');

    // 7. 模板配置 — 版本 Tab
    await go(page, '#/method-config/templates', 'hq');
    await page.evaluate(() => {
      if (typeof setTemplateListVersionRank === 'function') setTemplateListVersionRank(2);
    });
    await page.evaluate(() => {
      document.getElementById('changelog-shot-style')?.remove();
      const style = document.createElement('style');
      style.id = 'changelog-shot-style';
      style.textContent = `
        .app-header, .app-sidebar, .demo-steps, h1.page-title { display: none !important; }
        .app-main { margin: 0 !important; padding: 24px !important; min-height: auto !important; }
        body { background: #f5f7fa !important; }
        .factor-library-card > .card { display: none !important; }
        .factor-library-main-toolbar .factor-library-version-ops { display: none !important; }
      `;
      document.head.appendChild(style);
    });
    await waitStable(page, 500);
    const tabBar = await page.$('.factor-library-card');
    const tabFile = path.join(OUT_DIR, 'template-version-tabs.png');
    if (tabBar) {
      await tabBar.screenshot({ path: tabFile });
    } else {
      await shotSelector(page, '.factor-version-tabs', 'template-version-tabs');
    }
    await page.evaluate(() => document.getElementById('changelog-shot-style')?.remove());
    console.log('  ✓', 'template-version-tabs');

    console.log('\n完成 v1.1 截图，输出目录:', OUT_DIR);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
