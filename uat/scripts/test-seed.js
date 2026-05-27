#!/usr/bin/env node
/** 自测：加载 demo-seed 并校验全流程数据完整性 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..', 'assets', 'js');
global.window = global;
const ctx = global;
const localStorageMock = {
  _data: {},
  getItem(k) { return this._data[k] ?? null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; }
};
global.localStorage = localStorageMock;
globalThis.localStorage = localStorageMock;

function load(name) {
  require(path.join(root, name));
}

load('guide-constants.js');
load('industry-table.js');
load('factors-guide-data.js');
load('supplement-templates-data.js');
load('candidate-sync.js');
load('supplement-fields.js');
load('demo-seed.js');
load('store.js');
load('carbon-account.js');

const seed = global.MOCK_SEED;
const taskId = 'T2025001';
const errors = [];

function assert(cond, msg) {
  if (!cond) errors.push(msg);
}

assert(seed, 'MOCK_SEED exists');
assert(seed.tasks.length >= 5, 'tasks >= 5, got ' + seed.tasks.length);
assert(seed.candidates.length >= 48, 'candidates count >= 48, got ' + seed.candidates.length);
assert(seed.formalList.filter(f => f.taskId === taskId).length >= 130, 'formalList >= 130, got ' + seed.formalList.filter(f => f.taskId === taskId).length);
assert(seed.supplements.filter(s => s.taskId === taskId).length >= 90, 'supplements >= 90, got ' + seed.supplements.filter(s => s.taskId === taskId).length);
const withFieldData = seed.supplements.filter(s => s.taskId === taskId && s.fieldData && Object.keys(s.fieldData).length);
assert(withFieldData.length >= 90, 'supplements with fieldData >= 90, got ' + withFieldData.length);
assert(seed.calculations.filter(c => c.taskId === taskId).length >= 130, 'calculations >= 130, got ' + seed.calculations.filter(c => c.taskId === taskId).length);

const testSupps = seed.supplements.filter(s => s.taskId === taskId && (s.customerName || '').includes('补录测试'));
assert(testSupps.length >= 90, 'matrix test supplements >= 90, got ' + testSupps.length);
const s001 = seed.supplements.find(s => s.id === 'S001');
assert(s001 && s001.testCaseLabel === '电力·项目·报告法', 'S001 is 电力·项目·报告法');
assert(s001.fieldData && s001.fieldData.report, 'S001 has report fieldData');
const matrixMethods = new Set(testSupps.map(s => s.methodId));
['report', 'energy', 'product', 'economy', 'economy_fallback'].forEach(m => assert(matrixMethods.has(m), 'matrix has method ' + m));
const matrixBiz = new Set(testSupps.map(s => s.bizType));
assert(matrixBiz.has('project') && matrixBiz.has('non_project'), 'matrix has both biz types');
const matrixSheets = new Set(testSupps.map(s => (s.testCaseLabel || '').split('·')[0]));
assert(matrixSheets.size >= 10, 'matrix covers >= 10 industry sheets, got ' + matrixSheets.size);
const civilNoProduct = testSupps.filter(s => (s.testCaseLabel || '').startsWith('民航') && s.methodId === 'product');
assert(civilNoProduct.length === 0, '民航无产品法补录');
assert(seed.reports.length >= 20, 'reports >= 20');
assert(seed.approvals.length >= 8, 'approvals >= 8, got ' + seed.approvals.length);
const pendingApr = seed.approvals.filter(a => a.status === 'pending');
assert(pendingApr.length >= 2, 'pending approvals >= 2, got ' + pendingApr.length);
const auditStages = new Set(seed.supplements.filter(s => s.taskId === taskId).map(s => s.auditStage));
['pending_fill', 'branch_review', 'hq_review', 'approved'].forEach(st => assert(auditStages.has(st), 'supplement audit stage ' + st));
const undispatched = seed.supplements.filter(s => s.taskId === taskId && !s.dispatchedAt);
assert(undispatched.length >= 1, 'has undispatched supplements');
assert(seed.factors.some(f => f.id === 'CF001' && !f.isBuiltin), 'has custom demo factor CF001');
assert(seed.industryStats.length >= 15, 'industryStats >= 15');
assert(seed.factors.length >= 400, 'factors >= 400, got ' + seed.factors.length);
assert(typeof global.SUPPLEMENT_TEMPLATES !== 'undefined' && global.SUPPLEMENT_TEMPLATES.length >= 20, 'supplement templates >= 20');
const tplIds = new Set(global.SUPPLEMENT_TEMPLATES.map(t => t.id));
assert(tplIds.has('project_电力') && tplIds.has('non_project_水泥'), 'key supplement templates exist');
const tplPowerProject = global.SUPPLEMENT_TEMPLATES.find(t => t.id === 'project_电力');
const tplPowerNp = global.SUPPLEMENT_TEMPLATES.find(t => t.id === 'non_project_电力');
assert(tplPowerProject?.methods?.product?.supported === true, 'project_电力 supports product method');
assert(tplPowerNp?.methods?.product?.supported === true, 'non_project_电力 supports product method');
assert((tplPowerProject?.methods?.product?.fields?.length || 0) >= 12, 'project_电力 has 12 product fields');
assert(global.SUPPLEMENT_FIELDS.productSupported({ bizType: 'project', industryMajor: '电力', gbIndustryCode: 'D4411' }), '电力项目 productSupported');
assert(global.SUPPLEMENT_FIELDS.productSupported({ bizType: 'non_project', industryMajor: '电力', gbIndustryCode: 'D4411' }), '电力非项目 productSupported');
const tplCivil = global.SUPPLEMENT_TEMPLATES.find(t => t.id === 'project_民航');
assert(tplCivil?.methods?.product?.supported === false, '民航无产品法');
assert(seed.mappings.length >= 25, 'mappings >= 25');
assert(seed.branchStats.length >= 25, 'branchStats >= 25');

const task = seed.tasks.find(t => t.id === taskId);
assert(task.syncedFromInterface, 'task synced');
assert(task.dqr && task.dqr.dqr, 'task dqr');
assert(task.milestone.calculationDone, 'milestone calculation');

const doneCalcs = seed.calculations.filter(c => c.taskId === taskId && c.status === 'done');
assert(doneCalcs.length >= 25, 'done calcs >= 25, got ' + doneCalcs.length);

const withBoundary = seed.formalList.filter(f => f.boundaryNote);
assert(withBoundary.length >= 3, 'formal with boundaryNote');

const methods = new Set(seed.supplements.map(s => s.methodId));
assert(methods.has('report'), 'has report method');
assert(methods.has('energy'), 'has energy method');
assert(methods.has('product'), 'has product method');
assert(methods.has('economy'), 'has economy method');
assert(methods.has('economy_fallback'), 'has economy_fallback method');

assert(seed.carbonAccounts && seed.carbonAccounts.length >= 480,
  'carbonAccounts >= 480, got ' + (seed.carbonAccounts?.length || 0));
assert(seed.carbonAccountRecords && seed.carbonAccountRecords.length >= 1700,
  'carbonAccountRecords >= 1700, got ' + (seed.carbonAccountRecords?.length || 0));
const crossAccs = seed.carbonAccounts.filter(a => a.creditCode === '91310100MA0000CROSS01');
assert(crossAccs.length === 1, 'cross account unique per credit+loan, got ' + crossAccs.length);
const crossAcc = crossAccs[0];
assert(crossAcc, 'demo cross-branch account exists');
const crossRecs = seed.carbonAccountRecords.filter(r => r.accountId === crossAcc.id);
assert(crossRecs.length >= 4, 'cross account has >= 4 records, got ' + crossRecs.length);
const accountKeys = seed.carbonAccounts.map(a => `${a.creditCode}|${a.loanAccount}`);
assert(accountKeys.length === new Set(accountKeys).size,
  'carbonAccounts unique by creditCode+loanAccount');
seed.carbonAccountRecords.forEach(r => {
  const accYear = Number(r.year);
  const confYear = CarbonAccount.parseYearFromDateTime(r.confirmedAt);
  if (accYear && confYear != null) {
    assert(confYear === accYear - 1,
      `record ${r.id}: completion year ${confYear} should be accounting year ${accYear} - 1`);
  }
});
const beijingRecs = seed.carbonAccountRecords.filter(r => r.tier1Branch === '北京分行');
const shanghaiRecs = seed.carbonAccountRecords.filter(r => r.tier1Branch === '上海分行');
assert(beijingRecs.length >= 200, '北京分行 records >= 200, got ' + beijingRecs.length);
assert(shanghaiRecs.length >= 180, '上海分行 records >= 180, got ' + shanghaiRecs.length);
const shenzhenRecs = seed.carbonAccountRecords.filter(r => r.tier1Branch === '深圳分行');
assert(shenzhenRecs.length >= 60, '深圳分行 records >= 60, got ' + shenzhenRecs.length);

if (errors.length) {
  console.error('FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('OK: demo seed validation passed');
console.log('  Task:', task.name);
console.log('  Tasks:', seed.tasks.length, '| Candidates:', seed.candidates.length, '| Formal:', seed.formalList.length);
console.log('  Supplements:', seed.supplements.length, '| Calculations:', seed.calculations.length);
console.log('  Reports:', seed.reports.length, '| DQR:', task.dqr.dqr, task.dqr.level);
console.log('  Total attributed (done):', doneCalcs.reduce((s, c) => s + (c.attributedEmission || 0), 0).toLocaleString(), 'tCO2e');
console.log('  Carbon accounts:', seed.carbonAccounts.length, '| Carbon records:', seed.carbonAccountRecords.length);
