/**
 * 全流程逻辑自测（Node 环境）
 * 运行：node scripts/test-flow.js
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

const root = path.join(__dirname, '..');
function load(file) {
  vm.runInThisContext(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
}

load('assets/js/guide-constants.js');
load('assets/js/industry-table.js');
load('assets/js/candidate-sync.js');
load('assets/js/demo-seed.js');
global.MOCK_SEED = DemoSeed.build();
load('assets/js/common.js');
load('assets/js/store.js');

const taskId = 'T2025001';

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('  ✓', msg);
}

console.log('=== 流程自测 v6 ===\n');

Store.reset();
const task = Store.getTask(taskId);
assert(task.initiatorOrg === 'hq', '任务为总行发起');
assert(task.branchReviewEnabled !== false, '启用分行初审（可选）');

const mandatory = Store.getFormalList(taskId).filter(f => f.collectMode === 'mandatory');
const economy = Store.getFormalList(taskId).filter(f => f.collectMode === 'economy_direct');
assert(mandatory.length > 0, '存在必收数（贴现/保理）记录');
assert(economy.length > 0, '存在经济法直算记录');

console.log('\n--- 新建任务：锁定正式清单 → 第4步（数据采集）---');
Store.reset();
const newId = 'T_NEW_' + Date.now();
Store.addTask({
  id: newId,
  name: '2026年度新建流程自测',
  year: 2026,
  industryScope: '八大高碳行业',
  orgScope: '全行',
  goal: '监管报送',
  status: 'running',
  candidateCount: 0,
  formalCount: 0,
  supplementDone: 0,
  supplementTotal: 0,
  approvalStatus: 'none',
  syncedFromInterface: false,
  createdAt: '2026-05-20',
  createdBy: '自测'
});
const syncR = Store.syncCandidates(newId);
assert(syncR.ok, '新建任务同步台账');
Store.update(d => {
  d.candidates.filter(c => c.taskId === newId).slice(0, 4).forEach(c => { c.included = true; });
});
Store.generateFormalFromCandidates(newId);
assert(Store.getTask(newId).workflowStep === WORKFLOW_STEP.FORMAL, '生成正式清单后处于第3步');
const formalIds = Store.getFormalList(newId).map(f => f.id);
Store.confirmFormalItems(newId, formalIds);
const afterLock = Store.getTask(newId);
assert(afterLock.workflowStep === WORKFLOW_STEP.DATA_COLLECTION, '锁定后 workflowStep=3（第4步数据采集）');
assert(afterLock.milestone?.formalLocked, 'milestone.formalLocked');
const ecoPending = Store.getFormalList(newId).filter(f => {
  const mode = f.collectMode || resolveCollectMode(f.loanType);
  return f.status === 'confirmed' && mode === 'economy_direct' && f.economyDirectStatus !== 'done';
});
if (ecoPending.length) {
  const n = Store.runEconomyDirectCalc(newId, ecoPending.map(f => f.id));
  assert(n === ecoPending.length, '经济法直算一键处理全部待直算记录');
  const ecoDone = Store.getFormalList(newId).find(f => f.economyDirectStatus === 'done');
  if (ecoDone) {
    const d = Store.dispatchSupplements(newId, [ecoDone.id]);
    assert(d === 1, '经济法直算后仍可下发补录任务');
  }
}

console.log('\n--- 经济法直算 ---');
const ecoId = economy.find(f => f.status === 'confirmed' && f.economyDirectStatus !== 'done')?.id
  || economy.find(f => f.status === 'confirmed')?.id;
if (ecoId) {
  Store.runEconomyDirectCalc(taskId, [ecoId]);
  const f = Store.getFormalList(taskId).find(x => x.id === ecoId);
  assert(f.economyDirectStatus === 'done', '经济法直算完成');
}

console.log('\n--- 必收数派发与分级审核 ---');
const manId = mandatory.find(f => f.status === 'confirmed' && !Store.get().supplements.some(s => s.formalId === f.id))?.id;
if (manId) {
  Store.dispatchSupplements(taskId, [manId]);
  const supp = Store.get().supplements.find(s => s.formalId === manId);
  Store.saveSupplement(supp.id, { complete: true, fieldsDone: 12, reportedEmission: 800000 });
  Store.submitSupplementForReview(supp.id);
  const branchApr = Store.get().approvals.find(a => a.docId === supp.id && a.reviewLevel === 'branch');
  assert(branchApr, '总行发起：先进分行初审');
  Store.resolveApproval(branchApr.id, true);
  const hqApr = Store.get().approvals.find(a => a.docId === supp.id && a.reviewLevel === 'hq' && a.status === 'pending');
  assert(hqApr, '分行通过后进入总行终审');
  Store.resolveApproval(hqApr.id, true);
  assert(Store.get().supplements.find(s => s.id === supp.id).auditStage === 'approved', '必收数审核完成');
}

console.log('\n--- 驳回须填原因 ---');
Store.reset();
const supp2 = Store.get().supplements.find(s => s.status === 'completed' && s.approvalStatus !== 'approved');
if (supp2) {
  Store.saveSupplement(supp2.id, { complete: true });
  Store.submitSupplementForReview(supp2.id);
  const apr = Store.get().approvals.find(a => a.docId === supp2.id && a.status === 'pending');
  if (apr) {
    Store.resolveApproval(apr.id, false);
    const stillPending = Store.get().approvals.find(a => a.id === apr.id)?.status === 'pending';
    assert(stillPending, '无驳回原因时不生效');
    Store.resolveApproval(apr.id, false, '排放数据与披露报告不一致');
    assert(Store.get().supplements.find(s => s.id === supp2.id).status === 'returned', '驳回后补录退回');
  }
}

console.log('\n--- 角色可见性 ---');
Store.reset();
const role = { user: '王磊', branch: '北京分行' };
const hqList = filterApprovalsForRole(Store.get().approvals, 'hq', role, taskId);
const brList = filterApprovalsForRole(Store.get().approvals, 'branch', role, taskId);
const mgList = filterApprovalsForRole(Store.get().approvals, 'manager', role, taskId);
assert(hqList.length >= brList.length, '总行可见范围 ≥ 分行');
assert(mgList.every(a => {
  const s = Store.get().supplements.find(x => x.id === a.docId);
  return !s || s.manager === '王磊';
}), '客户经理仅见本人提交');

console.log('\n--- 客户经理路由限制 ---');
assert(isRouteAllowedForRole('#/manager-tasks', 'manager'), '客户经理可访问任务清单');
assert(isRouteAllowedForRole('#/supplement-fill', 'manager'), '客户经理可访问补录填报');
assert(!isRouteAllowedForRole('#/data-collect', 'manager'), '客户经理不可访问数据采集');
assert(!isRouteAllowedForRole('#/approvals', 'manager'), '客户经理不可访问数据审核');
assert(getDefaultRouteForRole('manager') === '#/manager-tasks', '客户经理默认首页');

console.log('\n--- 一键提交 / 数据为0 ---');
Store.reset();
const tid = taskId;
Store.getFormalList(tid).filter(f => f.status === 'confirmed').slice(0, 2).forEach(f => {
  Store.update(d => {
    d.calculations.push({
      id: 'CAL_TEST_' + f.id,
      taskId: tid,
      formalId: f.id,
      customerName: f.customerName,
      entityEmission: 1000,
      attributedEmission: 100,
      qualityGrade: 4,
      status: 'done'
    });
  });
});
assert(!Store.allConfirmedHaveEntityEmission(tid), '未全部有主体排放时不可一键提交');
const z = Store.zeroMissingEntityEmissions(tid);
assert(z > 0, '数据为0可填充缺失记录');
assert(Store.getTask(tid).dataCollectSubmitted, '数据为0后标记采集已提交');

console.log('\n--- 截止提交总行 ---');
const n = Store.submitCutoffToHq(taskId);
assert(n >= 0, '截止提交可执行');

console.log('\n=== 全部通过 ===');
