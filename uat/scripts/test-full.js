#!/usr/bin/env node
/**
 * 全功能自测：种子数据 + 流程 + 页面渲染 + 接口隔离 + 计算公式
 * 运行：node scripts/test-full.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

globalThis.window = globalThis;
globalThis.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = v; },
  removeItem(k) { delete this._d[k]; }
};
globalThis.location = { hash: '#/tasks' };
globalThis.sessionStorage = {
  _d: {},
  getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = v; },
  removeItem(k) { delete this._d[k]; }
};

const root = path.join(__dirname, '..');
function load(file) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

load('assets/js/guide-constants.js');
load('assets/js/industry-table.js');
load('assets/js/factors-guide-data.js');
load('assets/js/supplement-templates-data.js');
load('assets/js/candidate-sync.js');
load('assets/js/demo-seed.js');
load('assets/js/supplement-fields.js');
load('assets/js/factors-helper.js');
global.MOCK_SEED = DemoSeed.build();
load('assets/js/common.js');
load('assets/js/store.js');
load('assets/js/spa-nav.js');
load('assets/js/spa-views.js');

const taskId = 'T2025001';
let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error('  ✗', msg);
    failed++;
    return;
  }
  console.log('  ✓', msg);
}

console.log('=== 全功能自测 ===\n');

console.log('--- 1. 接口数据隔离（重置不清空）---');
Store.reset();
const if1 = JSON.stringify(Store.get().interfaces);
Store.update(d => {
  d.interfaces[0].recordCount = 99999;
  d.interfaces[0]._testMarker = true;
});
const if2count = Store.get().interfaces[0].recordCount;
Store.reset();
const if3 = Store.get().interfaces[0];
assert(if2count === 99999, '接口批次可更新');
assert(if3.recordCount === 99999, 'Store.reset 后接口数据保留');
assert(if3._testMarker === true, '接口自定义字段保留');
Store.reset();

console.log('\n--- 2. 种子数据覆盖 ---');
const seed = Store.get();
assert(seed.tasks.length >= 5, '任务 ≥5（含主任务/已完成/分行/待同步/2026）');
assert(seed.tasks.some(t => t.id === 'T2025003' && !t.syncedFromInterface), '有待同步台账任务');
assert(seed.tasks.some(t => t.initiatorOrg === 'branch'), '有分行发起任务');
assert(seed.supplements.filter(s => s.taskId === taskId).length >= 98, '主任务补录矩阵 ≥98');
assert(seed.approvals.length >= 8, '审批单 ≥8');
assert(seed.approvals.some(a => a.status === 'pending'), '有待审审批');
assert((seed.approvals.filter(a => a.docType === 'supplement' && a.status === 'pending').length) >= 2, '补录待审 ≥2');

console.log('\n--- 3. 页面视图渲染 ---');
const ctx = { data: seed, task: Store.getTask(taskId), role: ROLES.hq };
const routes = [
  '#/tasks', '#/task-create', '#/task-view?id=' + taskId, '#/task-detail?id=' + taskId,
  '#/candidates', '#/formal', '#/boundary', '#/data-collect', '#/calculation', '#/results', '#/reports',
  '#/branch-board', '#/manager-tasks', '#/supplement-fill?id=S001', '#/approvals',
  '#/factors', '#/factors/new', '#/factors/edit?id=CF001', '#/interfaces'
];
routes.forEach(route => {
  const base = route.split('?')[0];
  const fn = SPA_VIEWS[base];
  if (!fn) {
    assert(false, '缺少视图 ' + base);
    return;
  }
  location.hash = route;
  try {
    const html = fn(ctx);
    assert(typeof html === 'string' && html.length > 20, '渲染 ' + route);
  } catch (e) {
    assert(false, '渲染失败 ' + route + ': ' + e.message);
  }
});

console.log('\n--- 3b. 总行数据审核详情（补录内容）---');
const hqPending = Store.get().approvals.find(a => a.reviewLevel === 'hq' && a.docType === 'supplement' && a.status === 'pending');
assert(hqPending, '存在待总行终审的补录审核单');
['review', 'view'].forEach(mode => {
  location.hash = `#/approval-review?approvalId=${hqPending.id}&mode=${mode}`;
  const html = SPA_VIEWS['#/approval-review'](ctx);
  assert(html.includes('碳排放信息采集'), mode + ' 模式标题为补录页');
  assert(html.includes('supplement-page-tabs'), mode + ' 模式含填报/审批 Tab');
  assert(html.includes('method-tabs-bar'), mode + ' 模式含核算方法 Tab');
  assert(html.includes('企业基本信息'), mode + ' 模式含企业基本信息');
});
location.hash = '#/approval-review?approvalId=APR002&mode=view';
const viewApproved = SPA_VIEWS['#/approval-review'](ctx);
assert(viewApproved.includes('supplement-page-tabs') && viewApproved.includes('method-tabs-bar'), '已审记录查看仍为补录详情');

console.log('\n--- 4. 角色路由 ---');
['hq', 'branch', 'manager'].forEach(r => {
  assert(isRouteAllowedForRole('#/tasks', r) || r === 'manager', r + ' 路由策略');
});
assert(!isRouteAllowedForRole('#/data-collect', 'manager'), '客户经理不可进数据采集');
assert(isRouteAllowedForRole('#/supplement-fill', 'manager'), '客户经理可补录');

console.log('\n--- 5. 因子库 CRUD ---');
const added = Store.addFactor({
  methodId: 'energy', industryMajor: '钢铁', energyCategory: '固体燃料',
  itemName: '自测因子', unit: 'tCO2e/t', value: 1.23, sourceNote: '自测'
});
assert(added && added.id, '新增自定义因子');
assert(Store.updateFactor(added.id, { value: 1.25, sourceNote: '自测更新' }), '更新自定义因子');
assert(Store.deleteFactor(added.id), '删除自定义因子');
assert(!Store.getFactor(added.id), '删除后不可见');
assert(Store.getFactor('CF001'), '种子自定义因子 CF001 存在');

console.log('\n--- 6. 补录保存与审核 ---');
Store.reset();
const supp = Store.get().supplements.find(s => s.id === 'S002' && s.status === 'in_progress');
if (supp) {
  Store.saveSupplement(supp.id, { complete: false, fieldsDone: 12, energyTotalEmission: 450000 });
  const saved = Store.get().supplements.find(s => s.id === supp.id);
  assert(saved.fieldsDone >= 12 || saved.energyTotalEmission === 450000, '补录保存');
}
const branchPending = Store.get().approvals.find(a => a.reviewLevel === 'branch' && a.status === 'pending');
if (branchPending) {
  Store.resolveApproval(branchPending.id, true);
  assert(Store.get().approvals.find(a => a.id === branchPending.id).status === 'approved', '分行审核通过');
}

console.log('\n--- 7. 排放量计算公式（演示口径）---');
const sReport = { reportedEmission: 1000000, avgLoanBalance: 50000, totalAssets: 800000, bizType: 'non_project' };
const sEnergy = { energyTotalEmission: 800000, avgLoanBalance: 50000, totalAssets: 800000, bizType: 'non_project' };
const sEconomy = { economyValue: 5000000, economyFactor: 2.35, avgLoanBalance: 50000, totalAssets: 800000, bizType: 'non_project' };
const sFallback = { fallbackFactor: 2.46, avgLoanBalance: 50000, bizType: 'non_project' };
const sProject = { reportedEmission: 1000000, avgLoanBalance: 50000, bizType: 'project' };

assert(Store.calcEntityEmission(sReport) === 1000000, '报告法主体=披露值');
assert(Store.calcEntityEmission(sEnergy) === 800000, '能源法主体=汇总值');
assert(Store.calcEntityEmission(sEconomy) === 11750000, '经济法主体=活动值×因子');
assert(Store.calcEntityEmission(sFallback) === 0, '其他法主体排放为0（仅算归因）');

const calcNp = { entityEmission: 1000000, avgBalance: 50000, totalAssets: 800000, bizType: 'non_project', industryFactor: 2.46 };
assert(Store.calcAttributedEmission(calcNp, sReport) === Math.round(1000000 * 50000 / 800000), '非项目归因=主体×余额/资产');

const calcProj = { entityEmission: 1000000, avgBalance: 50000, totalInvestment: 500000, bizType: 'project', industryFactor: 2.46 };
assert(Store.calcAttributedEmission(calcProj, sProject) === Math.round(1000000 * 50000 / 500000), '项目归因=主体×余额/总投资');

const calcFb = { avgBalance: 50000, industryFactor: 2.46, bizType: 'non_project', entityEmission: 0 };
assert(Store.calcAttributedEmission(calcFb, sFallback) === Math.round(50000 * 2.46), '其他法归因=余额×行业因子');

console.log('\n--- 8. 能源/产品法填报估算（演示简化）---');
const energyData = { coal: 1000, gas: 10, purchasedElectricity: 50000, purchasedHeat: 1000 };
const tplPower = SUPPLEMENT_FIELDS.resolveTemplate({ methodId: 'energy', industryMajor: '电力', bizType: 'project', gbIndustryCode: 'D4411' });
const estEnergy = SUPPLEMENT_FIELDS.estimateEnergyEmission(energyData, tplPower);
assert(typeof estEnergy === 'number' && estEnergy > 0, '能源法演示估算有值（非指引精确公式）');

const estProduct = SUPPLEMENT_FIELDS.estimateProductEmission({ clinker: 100000, cement: 120000 }, { sheetName: '水泥', methods: { product: { fields: [] } } });
assert(typeof estProduct === 'number' && estProduct > 0, '产品法演示估算有值（非指引精确公式）');

console.log('\n--- 9. 接口批次重试 ---');
const failedBatch = Store.get().interfaces.find(b => b.status === 'failed');
if (failedBatch) {
  assert(Store.retryInterfaceBatch(failedBatch.id), '失败批次可重试');
  assert(Store.getInterfaceBatch(failedBatch.id).status === 'success', '重试后状态 success');
}

console.log('\n--- 10. 台账同步 ---');
Store.reset();
const sync = Store.syncCandidates('T2025003');
assert(sync.ok, '待同步任务可从接口拉台账: ' + (sync.message || sync.count));

if (failed) {
  console.error('\n=== 失败 ' + failed + ' 项 ===');
  process.exit(1);
}
console.log('\n=== 全部通过 ===');
