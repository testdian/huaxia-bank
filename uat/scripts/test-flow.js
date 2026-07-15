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
load('assets/js/industry-gb4754-tree.js');
load('assets/js/industry-table.js');
load('assets/js/industry-cascade.js');
load('assets/js/factors-guide-data.js');
load('assets/js/supplement-templates-data.js');
load('assets/js/candidate-sync.js');
load('assets/js/demo-seed.js');
load('assets/js/supplement-fields.js');
global.MOCK_SEED = DemoSeed.build();
load('assets/js/common.js');
load('assets/js/store.js');
load('assets/js/carbon-account.js');

const taskId = 'T2025001';

function assert(cond, msg) {
  if (!cond) throw new Error('FAIL: ' + msg);
  console.log('  ✓', msg);
}

console.log('=== 流程自测 v6 ===\n');

Store.reset();
const task = Store.getTask(taskId);
assert(task.initiatorOrg === 'hq', '任务为总行发起，须经分行初审');

const mandatory = Store.getFormalList(taskId).filter(f => f.collectMode === 'mandatory');
const economy = Store.getFormalList(taskId).filter(f => f.collectMode === 'economy_direct');
assert(mandatory.length > 0, '存在必收数（贴现/保理）记录');
assert(economy.length > 0, '存在经济法直算记录');

console.log('\n--- 企业碳账户项目子账户 ---');
const dSeed = Store.get();
const taskYear = String(task.year);
const projectFormals = Store.getFormalList(taskId).filter(f =>
  f.status === 'confirmed' && Array.isArray(f.projectDetails) && f.projectDetails.length
);
assert(projectFormals.length > 0, '演示数据：项目贷款正式清单含 projectDetails');
const caWithProject = dSeed.carbonAccounts.filter(a =>
  Array.isArray(a.projectDetails) && a.projectDetails.length
);
assert(caWithProject.length > 0, '演示数据：碳账户含项目明细');
const subRows = CarbonAccount.buildAccountListRows(dSeed, caWithProject, taskYear)
  .filter(r => r.isSubAccount);
assert(subRows.length > 0, '企业碳账户列表可展示项目子账户行');

console.log('\n--- 碳账户档案编辑（隔离核算任务）---');
{
  const dCa = Store.get();
  const caAcc = dCa.carbonAccounts.find(a => a.status === 'active' && a.formalId);
  if (caAcc) {
    const taskRef = dCa.tasks.find(t => t.id === caAcc.taskId);
    const year = String(taskRef?.year || taskYear);
    const formalBefore = JSON.stringify(dCa.formalList.find(f => f.id === caAcc.formalId));
    const calcBefore = JSON.stringify(dCa.calculations.find(c => c.formalId === caAcc.formalId && c.taskId === caAcc.taskId));
    const suppBefore = JSON.stringify(dCa.supplements.find(s => s.formalId === caAcc.formalId && s.taskId === caAcc.taskId));
    Store.saveCarbonAccountProfile(caAcc.id, year, '', {
      customerName: caAcc.customerName,
      creditCode: caAcc.creditCode,
      customerNo: 'CAEDIT001',
      methodLabel: CarbonAccount.METHOD_LABEL.ENERGY,
      entityEmission: 777777,
      methodId: 'energy',
      supplementSnapshot: {
        customerName: caAcc.customerName,
        methodId: 'energy',
        activeMethodTab: 'energy',
        energyTotalEmission: 777777,
        fieldData: { energy: { attachments: [] } }
      }
    }, 'hq');
    const dAfter = Store.get();
    const formalAfter = JSON.stringify(dAfter.formalList.find(f => f.id === caAcc.formalId));
    const calcAfter = JSON.stringify(dAfter.calculations.find(c => c.formalId === caAcc.formalId && c.taskId === caAcc.taskId));
    const suppAfter = JSON.stringify(dAfter.supplements.find(s => s.formalId === caAcc.formalId && s.taskId === caAcc.taskId));
    assert(formalBefore === formalAfter, '碳账户编辑不改正式清单');
    assert(calcBefore === calcAfter, '碳账户编辑不改核算计算');
    assert(suppBefore === suppAfter, '碳账户编辑不改收集任务');
    const rowAfter = CarbonAccount.buildAccountListRows(
      dAfter,
      [dAfter.carbonAccounts.find(a => a.id === caAcc.id)],
      year
    ).find(r => !r.isSubAccount);
    assert(rowAfter?.entityEmission === 777777, '碳账户编辑后列表主体排放更新');
    assert(rowAfter?.method === CarbonAccount.METHOD_LABEL.ENERGY, '碳账户编辑后列表核算方法更新');
    assert(!CarbonAccount._isInvalidDemoCustomerName(rowAfter?.customerName), '碳账户列表企业名称为规范企业名');
  }
}

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
const lockR = Store.confirmFormalItems(newId, formalIds);
assert(lockR.locked === formalIds.length, '锁定全部正式清单');
assert(lockR.provisioned > 0, '确认锁定后生成企业碳账户');
const gelanR = Store.fetchGelanEntityEmissions(newId);
assert(gelanR.withData > 0, '格澜调取返回部分主体排放');
Store.getFormalList(newId).forEach(f => {
  const type = resolveAccountingType(formalLedgerRow(f, newId));
  if (type === 'project_as_project') {
    assert(f.gelanEntityEmission == null, '项目（以项目方式计算）不调取格澜主体排放');
    assert(!isFormalEconomyDirectEligible(f, newId), '项目（以项目方式计算）不适用经济法直算');
  }
});
Store.submitAllCollectData(newId);
Store.getFormalList(newId).forEach(f => {
  const label = candidateAccountingTypeLabel(formalLedgerRow(f, newId), { finalizeAccountingType: true });
  assert(label !== '项目（计算方法待定）', '排放计算阶段不出现计算方法待定');
  assert(
    ['非项目', '项目（以项目方式计算）', '项目（以非项目方式计算）'].includes(label),
    '排放计算阶段核算类型仅为三档终态'
  );
});
const gelanFormal = Store.getFormalList(newId).find(f => f.gelanEntityEmission != null);
if (gelanFormal) {
  assert(
    resolveFormalAccountingMethodLabel(gelanFormal, newId) === CarbonAccount.METHOD_LABEL.REPORT_OTHER,
    '格澜调取后数据采集列表展示报告法其他数据'
  );
  assert(
    typeof resolveGelanInterfacePlatformLabel === 'function'
      && resolveGelanInterfacePlatformLabel(gelanFormal) === '格澜数据-各地区企业环境信息披露平台',
    '格澜接口数据展示平台来源'
  );
}
const gelanCa = Store.getCarbonAccounts().find(a => a.taskId === newId && a.annualProfiles?.['2026']);
assert(gelanCa?.annualProfiles?.['2026']?.entityEmission != null, '格澜调取同步至企业碳账户主体排放');
assert(gelanCa?.annualProfiles?.['2026']?.reportDetail?.scope1Emission != null, '格澜报告法范围一排放同步至碳账户');
assert(
  gelanCa?.annualProfiles?.['2026']?.methodLabel === '报告法其他数据',
  '格澜数据对应报告法其他数据'
);
const provisionedAccounts = Store.getCarbonAccounts().filter(a =>
  a.taskId === newId && a.provisionSource === 'formal_lock'
);
assert(provisionedAccounts.length === lockR.provisioned, '碳账户数量与 provisioned 一致');
const afterLock = Store.getTask(newId);
assert(afterLock.workflowStep === WORKFLOW_STEP.DATA_COLLECTION, '锁定后 workflowStep=3（第4步数据采集）');
assert(afterLock.milestone?.formalLocked, 'milestone.formalLocked');
const ecoPending = Store.getFormalList(newId).filter(f => isFormalEconomyDirectEligible(f, newId));
if (ecoPending.length) {
  const n = Store.runEconomyDirectCalc(newId, ecoPending.map(f => f.id));
  assert(n === ecoPending.length, '经济法直算处理尚无主体排放的待直算记录');
  const ecoDone = Store.getFormalList(newId).find(f => f.economyDirectStatus === 'done');
  if (ecoDone) {
    const d = Store.dispatchSupplements(newId, [ecoDone.id]);
    assert(d === 1, '经济法直算后仍可下发收集任务');
  }
}

console.log('\n--- 经济法直算 ---');
const ecoId = economy.find(f => f.status === 'confirmed' && f.economyDirectStatus !== 'done'
  && Store.getFormalEntityEmission(taskId, f.id) == null)?.id;
if (ecoId) {
  Store.runEconomyDirectCalc(taskId, [ecoId]);
  const f = Store.getFormalList(taskId).find(x => x.id === ecoId);
  assert(f.economyDirectStatus === 'done', '经济法直算完成');
  assert(
    resolveFormalAccountingMethodLabel(f, taskId) === CarbonAccount.METHOD_LABEL.ECONOMY_REVENUE,
    '经济法直算路径展示经济活动法'
  );
}
const ecoPendingRow = economy.find(f => f.status === 'confirmed' && f.economyDirectStatus !== 'done'
  && Store.getFormalEntityEmission(taskId, f.id) == null);
if (ecoPendingRow) {
  assert(
    resolveFormalAccountingMethodLabel(ecoPendingRow, taskId) === '—',
    '待直算记录初始核算方法为空'
  );
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
  Store.resolveApproval(branchApr.id, true, '', { selectedMethodId: 'report' });
  assert(Store.get().supplements.find(s => s.id === supp.id).approvedMethodId === 'report', '分行审核可选定核算方法');
  assert(Store.get().supplements.find(s => s.id === supp.id).auditStage === 'branch_approved', '分行通过后待提交总行');
  const hqBefore = Store.get().approvals.find(a => a.docId === supp.id && a.reviewLevel === 'hq' && a.status === 'pending');
  assert(!hqBefore, '分行通过后不立即生成总行待审');
  const submitted = Store.bulkSubmitBranchApprovedToHq(taskId, [branchApr.id]);
  assert(submitted === 1, '分行一键提交总行');
  const hqApr = Store.get().approvals.find(a => a.docId === supp.id && a.reviewLevel === 'hq' && a.status === 'pending');
  assert(hqApr, '提交后进入总行终审');
  assert(hqApr.id === branchApr.id, '一键提交沿用同一条审核记录');
  Store.resolveApproval(hqApr.id, true);
  assert(Store.get().supplements.find(s => s.id === supp.id).auditStage === 'approved', '必收数审核完成');
  const submitNode = Store.get().approvals.find(a => a.docId === supp.id && a.reviewLevel === 'submit');
  assert(submitNode && submitNode.round >= 1, '提交审核生成轮次节点');
}

console.log('\n--- 多方法收集 ---');
{
  const draftSupp = Store.get().supplements.find(s => s.dispatchedAt && s.status !== 'completed');
  if (draftSupp) {
    Store.saveSupplement(draftSupp.id, {
      reportedEmission: 500000,
      energyTotalEmission: 600000,
      economyValue: 10000,
      economyFactor: 2.35
    });
    const m = Store.get().supplements.find(s => s.id === draftSupp.id);
    assert(m.reportedEmission === 500000 && m.energyTotalEmission === 600000, '多方法数据可并存');
    assert(Store.matchMethod(m).id === 'report', '未定档前按优先级预览匹配方法');
  }
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
    assert(Store.get().supplements.find(s => s.id === supp2.id).status === 'returned', '驳回后收集退回');
  }
}

console.log('\n--- 角色可见性 ---');
Store.reset();
const role = { user: '王磊', branch: '北京分行' };
const hqList = filterApprovalsForRole(Store.get().approvals, 'hq', role, taskId);
const brList = filterApprovalsForRole(Store.get().approvals, 'branch', role, taskId);
const mgList = filterApprovalsForRole(Store.get().approvals, 'manager', role, taskId);
assert(hqList.length >= brList.length, '总行可见范围 ≥ 分行');
assert(hqList.every(a => a.docType === 'supplement'), '总行数据审核仅展示收集单据');
assert(brList.every(a => a.docType === 'supplement'), '分行数据审核仅展示收集单据');
assert(!canUserReviewApproval(Store.get().approvals.find(a => a.id === 'APR004'), 'hq'), '总行不可审核非收集单据');
assert(mgList.every(a => {
  const s = Store.get().supplements.find(x => x.id === a.docId);
  return !s || s.manager === '王磊';
}), '客户经理仅见本人提交');

console.log('\n--- 客户经理路由限制 ---');
assert(isRouteAllowedForRole('#/manager-tasks', 'manager'), '客户经理可访问任务清单');
assert(isRouteAllowedForRole('#/supplement-fill', 'manager'), '客户经理可访问收集填报');
assert(!isRouteAllowedForRole('#/data-collect', 'manager'), '客户经理不可访问数据采集');
assert(!isRouteAllowedForRole('#/approvals', 'manager'), '客户经理不可访问数据审核');
assert(getDefaultRouteForRole('manager') === '#/manager-tasks', '客户经理默认首页');

console.log('\n--- 管理员不可访问数据采集 ---');
assert(!isRouteAllowedForRole('#/branch-board', 'hq'), '总行不可访问数据采集');
assert(!isRouteAllowedForRole('#/branch-board', 'branch'), '分行不可访问数据采集');
assert(!isRouteAllowedForRole('#/manager-tasks', 'hq'), '总行不可访问客户经理任务');
assert(isRouteAllowedForRole('#/data-collect', 'hq'), '总行可访问数据采集');
assert(isRouteAllowedForRole('#/approvals', 'branch'), '分行可访问数据审核');

console.log('\n--- 管理员驳回与作废 ---');
Store.reset();
const rejectFormalId = mandatory.find(f =>
  f.status === 'confirmed' && !Store.get().supplements.some(s => s.formalId === f.id)
)?.id || mandatory.find(f => f.status === 'confirmed')?.id;
assert(rejectFormalId, '存在可测正式清单');
if (!Store.get().supplements.some(s => s.formalId === rejectFormalId)) {
  Store.dispatchSupplements(taskId, [rejectFormalId]);
}
const rejectSupp = Store.get().supplements.find(s => s.formalId === rejectFormalId);
Store.saveSupplement(rejectSupp.id, { complete: true, fieldsDone: 12, reportedEmission: 500000 });
Store.submitSupplementForReview(rejectSupp.id);
const bApr = Store.get().approvals.find(a => a.docId === rejectSupp.id && a.reviewLevel === 'branch' && a.status === 'pending');
Store.resolveApproval(bApr.id, true);
const hApr = Store.get().approvals.find(a => a.docId === rejectSupp.id && a.reviewLevel === 'hq' && a.status === 'pending');
Store.resolveApproval(hApr.id, true);
const approvedForReject = Store.get().supplements.find(s => s.id === rejectSupp.id);
assert(approvedForReject.auditStage === 'approved', '测试数据审核已通过');
assert(!canHqAdminRejectSupplement(approvedForReject, 'branch'), '总行发起任务分行不可管理员驳回');
assert(canHqAdminRejectSupplement(approvedForReject, 'branch', { initiatorOrg: 'branch' }), '分行发起任务分行可管理员驳回');
assert(canHqAdminRejectSupplement(approvedForReject, 'hq'), '总行可管理员驳回');
const n = Store.adminRejectSupplements(approvedForReject.taskId, [approvedForReject.id], '复核发现数据有误');
assert(n === 1, '管理员驳回成功');
assert(Store.get().supplements.find(s => s.id === approvedForReject.id).status === 'returned', '驳回后收集退回');
const voided = Store.get().approvals.filter(a => a.docId === approvedForReject.id && a.status === 'voided');
assert(voided.length >= 1, '已通过审核记录标记已作废');
const adminApr = Store.get().approvals.find(a => a.docId === approvedForReject.id && a.reviewLevel === 'admin');
assert(adminApr && adminApr.status === 'rejected', '追加管理员驳回节点');

console.log('\n--- 客户经理可编辑态 ---');
assert(isSupplementEditableByManager({ status: 'returned' }), '退回后可编辑');
assert(isSupplementEditableByManager({ status: 'pending' }), '待填报可编辑');
assert(!isSupplementEditableByManager({ status: 'completed', auditStage: 'branch_review' }), '审核中不可编辑');
assert(managerSupplementActionLabel({ status: 'returned' }) === '重新填报', '退回显示重新填报');

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
const cutoffN = Store.submitCutoffToHq(taskId);
assert(cutoffN >= 0, '截止提交可执行');

console.log('\n--- 查看模式步骤条 ---');
function countStepsWithState(html, state) {
  const re = new RegExp(`class="step-item ${state}`, 'g');
  return (html.match(re) || []).length;
}

const progressTask = Store.getTask('T2025001');
const progressStep = getTaskMaxWorkflowStep(progressTask);
globalThis.location = { hash: '#/task-view?id=T2025001' };
const viewHtml = demoSteps(0, {
  taskId: progressTask.id,
  clickable: true,
  maxStep: progressStep,
  taskProgressStep: progressStep,
  viewMode: true
});
assert(progressStep === 4, '演示任务进度为排放计算');
assert(countStepsWithState(viewHtml, 'done') === progressStep + 1, '查看页：已完成步骤均为绿色');
assert(countStepsWithState(viewHtml, 'active') === 0, '查看模式无 active 步骤');
assert(countStepsWithState(viewHtml, 'wait') === WORKFLOW_STEP_NAMES.length - progressStep - 1, '未完成步骤为 wait');

const doneTask = Store.getTask('T2024002');
const doneProgress = getTaskMaxWorkflowStep(doneTask);
const doneHtml = demoSteps(0, {
  taskId: doneTask.id,
  clickable: true,
  maxStep: doneProgress,
  taskProgressStep: doneProgress,
  viewMode: true
});
assert(countStepsWithState(doneHtml, 'done') === 6, '已完成任务查看：六步均为绿色');

globalThis.location = { hash: '#/data-collect?taskId=T2025001&view=1' };
const dcHtml = demoSteps(WORKFLOW_STEP.DATA_COLLECTION, {
  taskId: progressTask.id,
  clickable: true,
  maxStep: progressStep,
  taskProgressStep: progressStep,
  viewMode: true
});
assert(countStepsWithState(dcHtml, 'done') === progressStep + 1, '数据采集查看页：已完成步骤均为绿色');

globalThis.location = { hash: '#/task-edit?id=T2025001' };
const editHtml = workflowStepsBar(progressTask);
assert(countStepsWithState(editHtml, 'done') === progressStep + 1, '编辑页：已完成步骤均为绿色');
assert(editHtml.includes('href="#/task-edit?id=T2025001"'), '编辑模式第1步链接到编辑页');
assert(!editHtml.includes('href="#/task-view'), '编辑模式不链接到查看页');

globalThis.location = { hash: '#/data-collect?taskId=T2025001' };
const editDcHtml = workflowStepsBar(progressTask);
assert(countStepsWithState(editDcHtml, 'done') === progressStep + 1, '编辑数据采集页：已完成步骤均为绿色');
assert(!editDcHtml.includes('view=1'), '编辑模式步骤链接不带 view=1');

console.log('\n=== 全部通过 ===');
