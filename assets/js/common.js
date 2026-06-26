/** 公共布局、工具、导航 */
const NAV = [
  { group: '工作台', items: [
    { href: 'dashboard.html', label: '首页工作台' },
    { href: 'progress.html', label: '任务进度总览' }
  ]},
  { group: '核算任务', items: [
    { href: 'tasks.html', label: '核算任务列表' },
    { href: 'task-create.html', label: '新建核算任务' }
  ]},
  { group: '业务识别与清单', items: [
    { href: 'candidate-list.html', label: '候选业务清单' },
    { href: 'formal-list.html', label: '正式清单确认' },
    { href: 'boundary.html', label: '核算对象与边界' }
  ]},
  { group: '补数协同', items: [
    { href: 'branch-board.html', label: '数据收集' },
    { href: 'manager-tasks.html', label: '客户经理任务' },
    { href: 'supplement-fill.html', label: '在线收集填报' }
  ]},
  { group: '方法与计算', items: [
    { href: 'factors.html', label: '排放因子库' },
    { href: 'calculation.html', label: '碳排放计算' },
    { href: 'results.html', label: '核算结果查询' }
  ]},
  { group: '结果输出', items: [
    { href: 'reports.html', label: '报告与导出' }
  ]},
  { group: '数据接入', items: [
    { href: 'mapping-field.html', label: '字段映射管理' },
    { href: 'interface-monitor.html', label: '接口执行监控' }
  ]}
];

const ROLES = {
  hq: { label: '总行绿金部', user: '张明', branch: null },
  branch: { label: '分行绿金负责人', user: '王丽', branch: '北京分行' },
  manager: { label: '客户经理', user: '王磊', branch: '北京分行' }
};

/** 客户经理仅可访问数据收集相关路由 */
const MANAGER_ALLOWED_ROUTES = ['#/branch-board', '#/manager-tasks', '#/supplement-fill'];
const MANAGER_ONLY_ROUTES = MANAGER_ALLOWED_ROUTES;
/** 企业碳账户：仅总行、分行 */
const CARBON_ACCOUNT_ROUTES = ['#/carbon-accounts', '#/carbon-account'];
const LEDGER_ROUTES = ['#/ledger', '#/ledger/detail'];
/** 计算方法配置：仅总行 */
const METHOD_CONFIG_ROUTE_PREFIXES = ['#/method-config'];
/** 行业配置：仅总行 */
const INDUSTRY_CONFIG_ROUTES = ['#/industry-config'];

function isIndustryConfigRoute(routeBase) {
  return INDUSTRY_CONFIG_ROUTES.includes(routeBase);
}

function isMethodConfigRoute(routeBase) {
  return routeBase.startsWith('#/method-config');
}

/** 权限管理：仅总行 */
function isPermissionMgmtRoute(routeBase) {
  return routeBase === '#/permission-mgmt';
}

function isRouteAllowedForRole(routeBase, roleKey) {
  if (roleKey === 'manager') return MANAGER_ALLOWED_ROUTES.includes(routeBase);
  if (isPermissionMgmtRoute(routeBase)) return roleKey === 'hq';
  if (isMethodConfigRoute(routeBase)) return roleKey === 'hq';
  if (isIndustryConfigRoute(routeBase)) return roleKey === 'hq';
  if (CARBON_ACCOUNT_ROUTES.includes(routeBase)) {
    return roleKey === 'hq' || roleKey === 'branch';
  }
  if (LEDGER_ROUTES.includes(routeBase)) {
    return roleKey === 'hq' || roleKey === 'branch';
  }
  if (MANAGER_ONLY_ROUTES.includes(routeBase)) return false;
  return true;
}

/** 侧栏可见菜单中的首个默认入口（权限仅控制展示，不拦截路由） */
function getDefaultRouteForRole(roleKey) {
  if (roleKey === 'manager') return '#/manager-tasks';
  if (typeof SPA_NAV !== 'undefined' && typeof MenuPermissions !== 'undefined') {
    const items = typeof getNavItemsForRole === 'function'
      ? getNavItemsForRole(roleKey)
      : SPA_NAV.filter(i => i.hash !== '#/branch-board');
    const first = items.find(i => i?.hash && MenuPermissions.isVisible(i.id, roleKey));
    if (first) return first.hash;
    if (roleKey === 'hq' && MenuPermissions.isVisible('permission-mgmt', roleKey)) {
      return '#/permission-mgmt';
    }
  }
  return '#/tasks';
}

function renderLayout(pageTitle, activeHref) {
  const data = Store.get();
  const role = ROLES[data.currentRole] || ROLES.hq;
  const task = Store.getCurrentTask();
  const path = location.pathname.split('/').pop() || 'dashboard.html';

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="app-header">
      <div class="logo">华夏银行 · 绿金系统</div>
      <div class="breadcrumb">投融资碳核算 <span>/</span> ${pageTitle}</div>
      <div class="header-actions">
        <select id="roleSwitch" title="切换演示角色">
          <option value="hq" ${data.currentRole === 'hq' ? 'selected' : ''}>总行绿金部</option>
          <option value="branch" ${data.currentRole === 'branch' ? 'selected' : ''}>分行负责人</option>
          <option value="manager" ${data.currentRole === 'manager' ? 'selected' : ''}>客户经理</option>
        </select>
        <select id="taskSwitch" title="当前核算任务">
          ${data.tasks.map(t => `<option value="${t.id}" ${t.id === data.currentTaskId ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
        <button class="btn-ghost btn-sm" onclick="Store.reset(); toast('已重置演示数据','success'); setTimeout(()=>location.reload(),800)">重置数据</button>
        <span class="user">${role.user} · ${role.label}</span>
      </div>
    </header>
    <aside class="app-sidebar">
      <nav>${NAV.map(g => `
        <div class="nav-group">
          <div class="nav-group-title">${g.group}</div>
          ${g.items.map(i => `
            <a href="${i.href}" class="nav-item ${(activeHref || path) === i.href ? 'active' : ''}">${i.label}</a>
          `).join('')}
        </div>
      `).join('')}</nav>
    </aside>
    <main class="app-main" id="mainContent"></main>
    <div class="toast-container" id="toastContainer"></div>
  `);

  document.getElementById('roleSwitch').onchange = e => {
    Store.update(d => {
      d.currentRole = e.target.value;
      const r = ROLES[e.target.value];
      d.currentUser = r.user;
    });
    toast('已切换为：' + ROLES[e.target.value].label, 'success');
    setTimeout(() => location.reload(), 400);
  };

  document.getElementById('taskSwitch').onchange = e => {
    Store.update(d => { d.currentTaskId = e.target.value; });
    toast('已切换核算任务', 'success');
    setTimeout(() => location.reload(), 400);
  };

  return { role, task, data };
}

function qs(sel, root) { return (root || document).querySelector(sel); }
function qsa(sel, root) { return [...(root || document).querySelectorAll(sel)]; }

function toast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  if (!c) return alert(msg);
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function statusBadge(status) {
  const map = {
    draft: ['草稿', 'badge-draft'],
    running: ['进行中', 'badge-running'],
    closed: ['已关闭', 'badge-draft'],
    pending: ['待处理', 'badge-warning'],
    in_progress: ['填报中', 'badge-running'],
    completed: ['已完成', 'badge-success'],
    returned: ['已退回', 'badge-danger'],
    confirmed: ['已确认', 'badge-success'],
    done: ['已计算', 'badge-success'],
    warning: ['异常', 'badge-danger'],
    none: ['未提交', 'badge-draft'],
    approved: ['已通过', 'badge-success'],
    rejected: ['已退回', 'badge-danger']
  };
  const [text, cls] = map[status] || [status, 'badge-draft'];
  return `<span class="badge ${cls}">${text}</span>`;
}

function approvalBadge(s) { return statusBadge(s || 'none'); }

function reportStatusBadge(status) {
  const legacy = { generated: 'success', draft: 'generating' };
  const key = legacy[status] || status;
  const map = {
    generating: ['生成中', 'badge-running'],
    success: ['生成成功', 'badge-success'],
    failed: ['生成失败', 'badge-danger']
  };
  const [text, cls] = map[key] || [status || '-', 'badge-draft'];
  return `<span class="badge ${cls}">${text}</span>`;
}

function downloadReportFile(report) {
  if (!report || report.status !== 'success') return false;
  const fmt = (report.format || 'Excel').toLowerCase();
  const ext = fmt.includes('word') ? 'doc' : 'xlsx';
  const mime = fmt.includes('word')
    ? 'application/msword'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const lines = [
    '华夏银行 · 投融资碳排放核算报告（演示导出）',
    '',
    `报告名称：${report.name || '-'}`,
    `导出范围：${report.scope || '-'}`,
    `报表模板：${report.template || '-'}`,
    `导出格式：${report.format || '-'}`,
    `记录笔数：${report.recordCount ?? '-'}`,
    `归因排放量(tCO₂e)：${report.totalEmission != null ? report.totalEmission : '-'}`,
    `生成时间：${report.generatedAt || '-'}`,
    `操作人：${report.generatedBy || report.operator || '-'}`,
    '',
    '（演示文件，非真实监管报送内容）'
  ];
  const blob = new Blob([lines.join('\n')], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (report.name || 'export').replace(/[\\/:*?"<>|]/g, '_');
  a.href = url;
  a.download = `${safeName}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

function interfaceBatchStatusBadge(status) {
  if (status === 'success') {
    return '<span class="badge badge-success">获取成功</span>';
  }
  return '<span class="badge badge-danger">获取失败</span>';
}

function interfaceYearRecordTotal(batches, year) {
  return (batches || [])
    .filter(b => b.dataYear === year && b.status === 'success')
    .reduce((sum, b) => sum + (b.recordCount || 0), 0);
}

function showModal(id) { qs('#' + id)?.classList.add('show'); }
function hideModal(id) { qs('#' + id)?.classList.remove('show'); }

function ensureSupplementDrawer() {
  let root = qs('#drawerRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'drawerRoot';
    document.body.appendChild(root);
  }
  if (qs('#supplementDrawer')) return qs('#supplementDrawer');
  root.innerHTML = `
    <div class="drawer-overlay" id="supplementDrawer">
      <div class="drawer-panel" role="dialog" aria-labelledby="supplementDrawerTitle">
        <div class="drawer-header">
          <h4 id="supplementDrawerTitle">查看填报</h4>
          <button type="button" class="drawer-close" id="closeSupplementDrawer" aria-label="关闭">&times;</button>
        </div>
        <div class="drawer-body" id="supplementDrawerBody"></div>
      </div>
    </div>`;
  const overlay = qs('#supplementDrawer');
  qs('#closeSupplementDrawer').onclick = () => hideSupplementFillDrawer();
  overlay.onclick = (e) => { if (e.target === overlay) hideSupplementFillDrawer(); };
  return overlay;
}

function openSupplementFillDrawer(supplementId) {
  const s = Store.get().supplements.find(x => x.id === supplementId);
  if (!s) {
    toast('未找到收集记录', 'warning');
    return;
  }
  ensureSupplementDrawer();
  const body = qs('#supplementDrawerBody');
  qs('#supplementDrawerTitle').textContent = '查看填报 · ' + s.customerName;
  body.innerHTML = renderSupplementPageWithTabs(s, Store.getTask(s.taskId), { readonly: true });
  bindSupplementPageTabs(body);
  bindSupplementMethodTabs(true, body);
  SUPPLEMENT_FIELDS.bindFileUpload(body, supplementId, true);
  qs('#supplementDrawer').classList.add('show');
  document.body.classList.add('drawer-open');
}

function hideSupplementFillDrawer() {
  qs('#supplementDrawer')?.classList.remove('show');
  document.body.classList.remove('drawer-open');
}

function submitApprovalModal(docType, docId, docName) {
  Store.submitApproval(docType, docId, docName);
  toast('已提交审核！请前往绿金系统「待办事项」处理（演示：状态已更新为待审核）', 'success');
  hideModal('approvalModal');
  setTimeout(() => location.reload(), 600);
}

function renderApprovalModal() {
  return `
    <div class="modal-overlay" id="approvalModal">
      <div class="modal">
        <div class="modal-header"><h4>提交审核</h4><button class="modal-close" onclick="hideModal('approvalModal')">&times;</button></div>
        <div class="modal-body">
          <p style="margin-bottom:12px">确认将 <strong id="approvalDocName"></strong> 提交至<strong>绿金系统既有审批模块</strong>？</p>
          <p style="font-size:13px;color:#909399">审批流转、待办提醒由宿主系统处理，碳核算模块仅提供提交入口与状态回写。</p>
        </div>
        <div class="modal-footer">
          <button class="btn" onclick="hideModal('approvalModal')">取消</button>
          <button class="btn btn-primary" id="approvalConfirmBtn">确认提交</button>
        </div>
      </div>
    </div>`;
}

function openApproval(docType, docId, docName) {
  if (!qs('#approvalModal')) {
    document.body.insertAdjacentHTML('beforeend', renderApprovalModal());
  }
  qs('#approvalDocName').textContent = docName;
  qs('#approvalConfirmBtn').onclick = () => submitApprovalModal(docType, docId, docName);
  showModal('approvalModal');
}

function formatNum(n) {
  if (n == null || n === '') return '-';
  return Number(n).toLocaleString('zh-CN');
}

const WORKFLOW_STEP = {
  TASK_CREATE: 0,
  CANDIDATES: 1,
  FORMAL: 2,
  DATA_COLLECTION: 3,
  CALCULATION: 4,
  REPORT: 5
};

if (typeof window !== 'undefined') window.WORKFLOW_STEP = WORKFLOW_STEP;

const WORKFLOW_STEP_NAMES = ['范畴确定', '清单识别', '对象边界', '数据采集', '排放计算', '生成报告'];

function getWorkflowStepRoute(stepIndex, taskId, options = {}) {
  const tid = taskId || Store.get().currentTaskId;
  const view = options.view ?? isTaskViewMode();
  if (stepIndex === 0) {
    const p = new URLSearchParams();
    if (tid) p.set('id', tid);
    if (view) p.set('view', '1');
    const qs = p.toString();
    return view ? `#/task-view${qs ? '?' + qs : ''}` : `#/task-edit${qs ? '?' + qs : ''}`;
  }
  const paths = ['#/task-edit', '#/candidates', '#/formal', '#/data-collect', '#/calculation', '#/reports'];
  const path = paths[stepIndex] || paths[0];
  const p = new URLSearchParams();
  if (tid) p.set('taskId', tid);
  if (view) p.set('view', '1');
  return `${path}?${p.toString()}`;
}

function isTaskViewMode() {
  const hash = typeof location !== 'undefined' ? location.hash : '';
  const base = hash.split('?')[0];
  const params = new URLSearchParams(hash.split('?')[1] || '');
  return base === '#/task-view' || params.get('view') === '1';
}

function viewModeDisabledAttr(title) {
  if (!isTaskViewMode()) return '';
  return ` disabled title="${title || '查看模式下不可操作'}"`;
}


function getWorkflowStepFromRoute() {
  const base = (typeof location !== 'undefined' ? location.hash : '').split('?')[0];
  const map = {
    '#/task-view': WORKFLOW_STEP.TASK_CREATE,
    '#/task-create': WORKFLOW_STEP.TASK_CREATE,
    '#/task-edit': WORKFLOW_STEP.TASK_CREATE,
    '#/candidates': WORKFLOW_STEP.CANDIDATES,
    '#/formal': WORKFLOW_STEP.FORMAL,
    '#/boundary': WORKFLOW_STEP.FORMAL,
    '#/data-collect': WORKFLOW_STEP.DATA_COLLECTION,
    '#/calculation': WORKFLOW_STEP.CALCULATION,
    '#/reports': WORKFLOW_STEP.REPORT
  };
  return map[base];
}

function workflowStepIsDone(i, ctx) {
  const { progressStep, taskProgressStep } = ctx;
  const doneThrough = taskProgressStep != null ? taskProgressStep : progressStep;
  if (doneThrough >= WORKFLOW_STEP.REPORT) return true;
  return i <= doneThrough;
}

function workflowStepState(i, ctx) {
  if (workflowStepIsDone(i, ctx)) return 'done';
  if (!ctx.viewMode && i === ctx.activeIdx) return 'active';
  return 'wait';
}

function demoSteps(current, options = {}) {
  const { taskId, clickable = false, maxStep, viewMode = isTaskViewMode(), taskProgressStep } = options;
  const maxIdx = WORKFLOW_STEP_NAMES.length - 1;
  const progressStep = maxStep != null ? maxStep : current;
  const maxClickIdx = progressStep >= WORKFLOW_STEP.REPORT
    ? maxIdx
    : Math.max(0, Math.min(progressStep, maxIdx));
  const activeIdx = Math.max(0, Math.min(current, maxIdx));
  const stepCtx = { activeIdx, progressStep, viewMode, maxIdx, taskProgressStep };

  return `<div class="steps">${WORKFLOW_STEP_NAMES.map((s, i) => {
    const state = workflowStepState(i, stepCtx);
    const tail = i < WORKFLOW_STEP_NAMES.length - 1
      ? `<div class="step-tail ${workflowStepIsDone(i, stepCtx) ? 'done' : ''}"></div>` : '';
    const canClick = clickable && i <= maxClickIdx;
    const inner = `
      <div class="step-content">
        <span class="step-icon">${i + 1}</span>
        <span class="step-title">${s}</span>
      </div>
      ${tail}`;
    if (canClick) {
      const href = getWorkflowStepRoute(i, taskId, { view: viewMode });
      return `<a href="${href}" class="step-item ${state} clickable">${inner}</a>`;
    }
    return `<div class="step-item ${state}">${inner}</div>`;
  }).join('')}</div>`;
}

function getTaskMaxWorkflowStep(task) {
  if (!task) return WORKFLOW_STEP.TASK_CREATE;
  if (getTaskListStatus(task) === 'completed') return WORKFLOW_STEP.REPORT;
  return Math.max(task.workflowStep ?? WORKFLOW_STEP.CANDIDATES, WORKFLOW_STEP.TASK_CREATE);
}

/** 数据收集模块页面不展示核算六步流程条 */
function shouldShowWorkflowSteps() {
  const base = (typeof location !== 'undefined' ? location.hash : '').split('?')[0];
  const hideOn = ['#/branch-board', '#/manager-tasks', '#/supplement-fill', '#/approval-review'];
  return !hideOn.includes(base);
}

function workflowStepsBar(task, stepOverride) {
  if (!shouldShowWorkflowSteps()) return '';
  const step = stepOverride ?? getWorkflowStepFromRoute() ?? task?.workflowStep ?? WORKFLOW_STEP.CANDIDATES;
  const taskProgress = getTaskMaxWorkflowStep(task);
  const maxStep = getTaskListStatus(task) === 'completed'
    ? WORKFLOW_STEP.REPORT
    : Math.max(taskProgress, step, WORKFLOW_STEP.TASK_CREATE);
  return demoSteps(step, {
    taskId: task?.id,
    clickable: !!task?.id,
    maxStep,
    taskProgressStep: taskProgress,
    viewMode: isTaskViewMode()
  });
}

/** 任务当前所在步骤名称（6 步流程） */
function getTaskStepLabel(task) {
  const step = task?.workflowStep ?? WORKFLOW_STEP.CANDIDATES;
  const idx = Math.max(0, Math.min(step, WORKFLOW_STEP_NAMES.length - 1));
  return WORKFLOW_STEP_NAMES[idx];
}

/** 任务列表状态：核算中 / 已完成 */
function getTaskListStatus(task) {
  if (task.status === 'closed' || task.status === 'completed' || (task.workflowStep ?? 0) >= WORKFLOW_STEP.REPORT) {
    return 'completed';
  }
  return 'accounting';
}

function taskListStatusBadge(task) {
  if (getTaskListStatus(task) === 'completed') {
    return '<span class="badge badge-success">已完成</span>';
  }
  return '<span class="badge badge-running">核算中</span>';
}

function taskListStatusText(task) {
  return getTaskListStatus(task) === 'completed' ? '已完成' : '核算中';
}

const TASK_YEAR_MIN = 2026;
const TASK_YEAR_MAX = 2099;

function clampTaskYear(year) {
  const y = Number(year);
  if (!Number.isFinite(y)) return TASK_YEAR_MIN;
  return Math.min(TASK_YEAR_MAX, Math.max(TASK_YEAR_MIN, y));
}

function renderTaskYearDatalist(id = 'taskYearList') {
  let opts = '';
  for (let y = TASK_YEAR_MIN; y <= TASK_YEAR_MAX; y++) {
    opts += `<option value="${y}"></option>`;
  }
  return `<datalist id="${id}">${opts}</datalist>`;
}

/** @deprecated 使用 renderTaskYearField / renderTaskYearFilterField */
function renderYearSelectOptions(selected, includeAll) {
  let html = includeAll ? '<option value="">全部</option>' : '';
  for (let y = TASK_YEAR_MIN; y <= TASK_YEAR_MAX; y++) {
    html += `<option value="${y}" ${String(selected) === String(y) ? 'selected' : ''}>${y}</option>`;
  }
  return html;
}

function renderTaskYearField(value, options = {}) {
  const { readonly = false, name = 'year', id = '', required = true, legacyReadonly = false } = options;
  const raw = value != null && value !== '' ? Number(value) : TASK_YEAR_MIN;
  if (readonly || legacyReadonly) {
    return `<input name="${name}" id="${id || name}" value="${raw}" readonly class="year-input-readonly">`;
  }
  const display = clampTaskYear(raw);
  const idAttr = id || name;
  return `<div class="year-field">
    <button type="button" class="year-step-btn" data-year-step="-1" aria-label="上一年">−</button>
    <input type="number" name="${name}" id="${idAttr}" class="year-input" list="taskYearFormList"
      min="${TASK_YEAR_MIN}" max="${TASK_YEAR_MAX}" step="1" value="${display}" ${required ? 'required' : ''}>
    <button type="button" class="year-step-btn" data-year-step="1" aria-label="下一年">+</button>
    <span class="year-unit">年</span>
  </div>${renderTaskYearDatalist('taskYearFormList')}`;
}

function renderTaskYearFilterField(selected, inputId) {
  const id = inputId || 'tf_year';
  const val = selected != null && selected !== '' ? selected : '';
  return `<div class="year-filter-field"><input type="number" id="${id}" class="year-filter-input" list="taskYearFilterList"
    min="${TASK_YEAR_MIN}" max="${TASK_YEAR_MAX}" step="1" placeholder="全部" value="${val}">${renderTaskYearDatalist('taskYearFilterList')}</div>`;
}

function bindTaskYearStepper(root) {
  const scope = root || document;
  qsa('.year-field', scope).forEach(wrap => {
    const input = wrap.querySelector('.year-input');
    if (!input) return;
    qsa('.year-step-btn', wrap).forEach(btn => {
      btn.onclick = () => {
        const step = Number(btn.dataset.yearStep) || 0;
        const cur = Number(input.value) || TASK_YEAR_MIN;
        input.value = clampTaskYear(cur + step);
      };
    });
  });
}

function isLegacyTaskYear(year) {
  const y = Number(year);
  return Number.isFinite(y) && (y < TASK_YEAR_MIN || y > TASK_YEAR_MAX);
}

const TASK_FILTER_KEY = 'task_list_filters';

function getTaskFilters() {
  try {
    return JSON.parse(sessionStorage.getItem(TASK_FILTER_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveTaskFilters(filters) {
  sessionStorage.setItem(TASK_FILTER_KEY, JSON.stringify(filters));
}

const INDUSTRY_SCOPE_KEY_EIGHT = '八大高碳行业';
const INDUSTRY_SCOPE_LABEL_EIGHT = '人行投融资碳核算八大高碳行业';
const INDUSTRY_SCOPE_KEY_EXTENDED = '八大高碳+重点行业';
const INDUSTRY_SCOPE_LABEL_EXTENDED = '人行八大高碳 + 我行主要行业';

function getTaskSubjectIndustryScope(task) {
  return task?.subjectIndustryScope || task?.industryScope || INDUSTRY_SCOPE_KEY_EIGHT;
}

function getTaskInvestIndustryScope(task) {
  return task?.investIndustryScope || task?.industryScope || INDUSTRY_SCOPE_KEY_EIGHT;
}

function normalizeTaskIndustryFields(task) {
  if (!task) return task;
  if (!task.subjectIndustryScope) task.subjectIndustryScope = task.industryScope || INDUSTRY_SCOPE_KEY_EIGHT;
  if (!task.investIndustryScope) task.investIndustryScope = task.industryScope || INDUSTRY_SCOPE_KEY_EIGHT;
  task.subjectIndustryScope = normalizeIndustryScopeValue(task.subjectIndustryScope);
  task.investIndustryScope = normalizeIndustryScopeValue(task.investIndustryScope);
  task.industryScope = task.subjectIndustryScope;
  return task;
}

/** 一级分行名称（组织范围多选） */
const TIER1_BRANCH_NAMES = [
  '北京分行', '上海分行', '深圳分行', '杭州分行', '南京分行', '成都分行', '广州分行', '武汉分行',
  '西安分行', '重庆分行', '天津分行', '苏州分行', '青岛分行', '大连分行', '厦门分行', '宁波分行',
  '长沙分行', '郑州分行', '济南分行', '合肥分行', '福州分行', '石家庄分行', '哈尔滨分行', '长春分行',
  '南昌分行', '昆明分行', '贵阳分行', '南宁分行', '海口分行', '兰州分行'
];

function normalizeTaskOrgScopeFields(task) {
  if (!task) return task;
  const all = TIER1_BRANCH_NAMES;
  if (task.branches?.length) {
    const uniq = [...new Set(task.branches)].filter(b => all.includes(b));
    task.branches = uniq.length ? uniq : [...all];
    if (!task.orgScope) {
      task.orgScope = task.branches.length >= all.length ? '全行' : task.branches.join('、');
    }
    return task;
  }
  if (!task.orgScope || task.orgScope === '全行') {
    task.orgScope = '全行';
    task.branches = [...all];
  } else if (String(task.orgScope).includes('、')) {
    task.branches = String(task.orgScope).split('、').filter(b => all.includes(b));
    if (!task.branches.length) task.branches = [...all];
  } else if (all.includes(task.orgScope)) {
    task.branches = [task.orgScope];
  } else {
    task.orgScope = '全行';
    task.branches = [...all];
  }
  return task;
}

function isTaskOrgScopeWholeBank(task) {
  normalizeTaskOrgScopeFields(task);
  return task.orgScope === '全行' || (task.branches?.length || 0) >= TIER1_BRANCH_NAMES.length;
}

function formatTaskOrgScopeDisplay(task) {
  normalizeTaskOrgScopeFields(task);
  if (isTaskOrgScopeWholeBank(task)) return '全行';
  return (task.branches || []).join('、') || '全行';
}

function renderTaskOrgScopeField(task, options = {}) {
  const { readonly = false, dis = '', showRequired = true } = options;
  const labelFn = showRequired && !readonly ? fieldLabel : (text) => text;
  const t = normalizeTaskOrgScopeFields({ ...(task || {}) });
  const whole = isTaskOrgScopeWholeBank(t);
  const selected = new Set(t.branches || []);
  if (readonly) {
    return `<div class="form-item full"><label>组织范围</label>
      <input readonly value="${formatTaskOrgScopeDisplay(t)}"></div>`;
  }
  return `<div class="form-item full"><label>${labelFn('组织范围')}</label>
    <div class="filter-checkbox-group task-org-scope-group" id="taskOrgScopeGroup">
      <label class="filter-check task-org-scope-whole">
        <input type="checkbox" name="orgScopeWhole" value="1" ${whole ? 'checked' : ''} ${dis}>
        <span>全行</span>
      </label>
      ${TIER1_BRANCH_NAMES.map(b => `
      <label class="filter-check">
        <input type="checkbox" name="orgScopeBranch" value="${b}"
          ${selected.has(b) || whole ? 'checked' : ''}
          ${dis || whole ? 'disabled' : ''}>
        <span>${b}</span>
      </label>`).join('')}
    </div></div>`;
}

function readTaskOrgScopeFromForm(form) {
  const whole = form.querySelector('[name="orgScopeWhole"]')?.checked;
  const all = TIER1_BRANCH_NAMES;
  if (whole) return { orgScope: '全行', branches: [...all] };
  const branches = qsa('input[name="orgScopeBranch"]', form)
    .filter(el => !el.disabled && el.checked)
    .map(el => el.value);
  return { orgScope: branches.length ? branches.join('、') : '', branches };
}

function bindTaskOrgScopeToggle() {
  const group = qs('#taskOrgScopeGroup');
  if (!group || group.dataset.bound === '1') return;
  group.dataset.bound = '1';
  const wholeCb = qs('[name="orgScopeWhole"]', group);
  const branchCbs = qsa('[name="orgScopeBranch"]', group);
  if (!wholeCb || !branchCbs.length) return;

  const setWholeMode = (on) => {
    wholeCb.checked = !!on;
    branchCbs.forEach(cb => {
      cb.checked = !!on;
      cb.disabled = !!on;
    });
  };

  const selectExclusiveBranch = (targetCb) => {
    wholeCb.checked = false;
    branchCbs.forEach(b => {
      b.disabled = false;
      b.checked = b === targetCb;
    });
  };

  wholeCb.addEventListener('change', () => {
    if (wholeCb.checked) setWholeMode(true);
    else branchCbs.forEach(cb => { cb.disabled = false; cb.checked = false; });
  });

  branchCbs.forEach(cb => cb.addEventListener('change', () => {
    if (wholeCb.checked) {
      selectExclusiveBranch(cb);
      return;
    }
    if (branchCbs.every(b => b.checked)) setWholeMode(true);
    else wholeCb.checked = false;
  }));

  // 全行模式下分行复选框为 disabled，点击标签无反应；改为切换为仅选该分行
  group.addEventListener('click', (e) => {
    const label = e.target.closest('.filter-check:not(.task-org-scope-whole)');
    if (!label) return;
    const cb = label.querySelector('input[name="orgScopeBranch"]');
    if (!cb || !cb.disabled) return;
    e.preventDefault();
    selectExclusiveBranch(cb);
  });
}

function validateTaskForm(form) {
  if (!form) return false;
  const name = form.name?.value?.trim();
  if (!name) {
    toast('请填写任务名称', 'warning');
    form.name?.focus();
    return false;
  }
  const year = clampTaskYear(form.year?.value);
  if (!form.year?.value && form.year?.readOnly !== true) {
    toast('请填写核算年度', 'warning');
    form.year?.focus();
    return false;
  }
  if (!form.deadline?.value) {
    toast('请填写数据收集截止日期', 'warning');
    form.deadline?.focus();
    return false;
  }
  if (!form.balanceRule?.value) {
    toast('请选择余额口径', 'warning');
    return false;
  }
  return true;
}

function normalizeIndustryScopeValue(scope) {
  if (scope === '八大+扩展') return INDUSTRY_SCOPE_KEY_EXTENDED;
  return scope;
}

function renderIndustryScopeOptions(selected) {
  const scope = normalizeIndustryScopeValue(selected || INDUSTRY_SCOPE_KEY_EIGHT);
  return `
    <option value="${INDUSTRY_SCOPE_KEY_EIGHT}" ${scope === INDUSTRY_SCOPE_KEY_EIGHT ? 'selected' : ''}>${INDUSTRY_SCOPE_LABEL_EIGHT}</option>
    <option value="${INDUSTRY_SCOPE_KEY_EXTENDED}" ${scope === INDUSTRY_SCOPE_KEY_EXTENDED ? 'selected' : ''}>${INDUSTRY_SCOPE_LABEL_EXTENDED}</option>
    <option value="自定义" ${scope === '自定义' ? 'selected' : ''}>自定义</option>`;
}

function renderIndustryScopeRadios(name, selected, options = {}) {
  const { readonly = false, dis = '', groupId = '' } = options;
  const scope = normalizeIndustryScopeValue(selected || INDUSTRY_SCOPE_KEY_EIGHT);
  const opts = [
    { value: INDUSTRY_SCOPE_KEY_EIGHT, label: INDUSTRY_SCOPE_LABEL_EIGHT },
    { value: INDUSTRY_SCOPE_KEY_EXTENDED, label: INDUSTRY_SCOPE_LABEL_EXTENDED },
    { value: '自定义', label: '自定义' }
  ];
  return `<div class="industry-scope-radios" id="${groupId}" data-scope-name="${name}">
    ${opts.map((o, i) => `
      <label class="industry-scope-radio">
        <input type="radio" name="${name}" value="${o.value}" ${scope === o.value ? 'checked' : ''} ${dis}>
        <span>${o.label}</span>
      </label>`).join('')}
  </div>`;
}

function renderTaskIndustryScopeFilterSelect(selectId, selected) {
  const val = selected || '';
  return `
    <select id="${selectId}">
      <option value="">全部</option>
      <option value="${INDUSTRY_SCOPE_KEY_EIGHT}" ${val === INDUSTRY_SCOPE_KEY_EIGHT ? 'selected' : ''}>${INDUSTRY_SCOPE_LABEL_EIGHT}</option>
      <option value="${INDUSTRY_SCOPE_KEY_EXTENDED}" ${val === INDUSTRY_SCOPE_KEY_EXTENDED || val === '八大+扩展' ? 'selected' : ''}>${INDUSTRY_SCOPE_LABEL_EXTENDED}</option>
      <option value="自定义" ${val === '自定义' ? 'selected' : ''}>自定义</option>
    </select>`;
}

function filterTasks(tasks, filters) {
  const f = filters || {};
  return tasks.filter(t => {
    normalizeTaskIndustryFields(t);
    if (f.name && !(t.name || '').toLowerCase().includes(f.name.trim().toLowerCase())) return false;
    if (f.year && String(t.year) !== String(f.year)) return false;
    if (f.investIndustryScope && getTaskInvestIndustryScope(t) !== f.investIndustryScope) return false;
    if (f.industryScope && getTaskSubjectIndustryScope(t) !== f.industryScope) return false;
    if (f.progress !== '' && f.progress != null) {
      const step = Math.max(0, Math.min(t.workflowStep ?? WORKFLOW_STEP.CANDIDATES, WORKFLOW_STEP_NAMES.length - 1));
      if (String(step) !== String(f.progress)) return false;
    }
    if (f.status) {
      if (getTaskListStatus(t) !== f.status) return false;
    }
    return true;
  });
}

const LEDGER_FILTER_KEY = 'ledger_list_filters';

function getLedgerFilters() {
  try {
    return JSON.parse(sessionStorage.getItem(LEDGER_FILTER_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLedgerFilters(filters) {
  sessionStorage.setItem(LEDGER_FILTER_KEY, JSON.stringify(filters || {}));
}

function getLedgerBranchOptions() {
  const set = new Set(['北京分行', '上海分行', '深圳分行', '南京分行', '杭州分行', '成都分行', '广州分行', '武汉分行']);
  (Store.get().formalList || []).forEach(f => {
    if (f.tier1Branch) set.add(f.tier1Branch);
    if (f.branch) set.add(f.branch);
  });
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function renderLedgerBranchFilterSelect(selectId, selected) {
  const val = selected || '';
  const opts = getLedgerBranchOptions().map(b =>
    `<option value="${escapeHtml(b)}" ${val === b ? 'selected' : ''}>${escapeHtml(b)}</option>`
  ).join('');
  return `<select id="${selectId}"><option value="">全部</option>${opts}</select>`;
}

function getLedgerHandlingBranchOptions() {
  const set = new Set();
  const d = Store.get();
  (d.formalList || []).forEach(f => {
    if (f.handlingBranch) set.add(f.handlingBranch);
  });
  (d.candidates || []).forEach(c => {
    if (c.handlingBranch) set.add(c.handlingBranch);
  });
  return [...set].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function renderLedgerHandlingBranchFilterSelect(selectId, selected) {
  const val = selected || '';
  const opts = getLedgerHandlingBranchOptions().map(b =>
    `<option value="${escapeHtml(b)}" ${val === b ? 'selected' : ''}>${escapeHtml(b)}</option>`
  ).join('');
  return `<select id="${selectId}"><option value="">全部</option>${opts}</select>`;
}

function taskHasLedgerData(taskId) {
  const formals = Store.getFormalList(taskId).filter(f => f.status === 'confirmed');
  if (formals.length) return true;
  return Store.getCalculations(taskId).some(c => c.entityEmission != null || c.attributedEmission != null);
}

function filterLedgerDetailRows(rows, filters, taskId) {
  const f = filters || {};
  return rows.filter(({ f: formal }) => {
    const row = typeof formalLedgerRow === 'function' ? formalLedgerRow(formal, taskId) : formal;
    if (f.branch) {
      const b = f.branch.trim();
      const tier1 = row.tier1Branch || row.branch || '';
      if (!tier1.includes(b)) return false;
    }
    if (f.handlingBranch) {
      const h = f.handlingBranch.trim();
      if (!(row.handlingBranch || '').includes(h)) return false;
    }
    if (f.customer) {
      const kw = f.customer.trim().toLowerCase();
      if (!(row.customerName || '').toLowerCase().includes(kw)) return false;
    }
    return true;
  });
}

function getLedgerDetailRows(taskId, filters) {
  const calcs = Store.getCalculations(taskId);
  const rows = Store.getFormalList(taskId)
    .filter(f => f.status === 'confirmed')
    .map(f => ({ f, calc: calcs.find(c => c.formalId === f.id) }));
  return filterLedgerDetailRows(rows, filters, taskId);
}

function filterLedgerTasks(tasks, filters, roleKey) {
  const f = { ...(filters || {}) };
  if (roleKey === 'branch' && !f.branch) {
    f.branch = ROLES.branch?.branch || '';
  }
  return (tasks || []).filter(t => {
    normalizeTaskIndustryFields(t);
    if (!taskHasLedgerData(t.id)) return false;
    if (f.year && String(t.year) !== String(f.year)) return false;
    if (f.taskName && !(t.name || '').toLowerCase().includes(f.taskName.trim().toLowerCase())) return false;
    if (f.branch) {
      const rows = getLedgerDetailRows(t.id, { branch: f.branch });
      if (!rows.length) return false;
    }
    return true;
  });
}

function ledgerCalculationRowValues(f, calc, taskId) {
  const c = typeof formalLedgerRow === 'function' ? formalLedgerRow(f, taskId) : f;
  const emissions = resolveCalculationEmissionDisplay(f, calc, taskId);
  return [
    candidateTier1Branch(c),
    c.handlingBranch || '-',
    c.customerName || '-',
    candidateCustomerScale(c),
    candidateProductType(c),
    candidateAccountingTypeLabel(c, { finalizeAccountingType: true }),
    c.loanAccount || '-',
    c.disbursementDate || '-',
    candidateBorrowerType(c),
    candidateIndustryLabel(c),
    candidateInvestIndustryLabel(c),
    formatLedgerAmountYuan(c.avgMonthlyBalance),
    formatLedgerAmountYuan(c.operatingRevenue ?? c.revenue),
    candidateAvgTotalAssets(c),
    c.manager || '-',
    formatCalculationEmissionCell(emissions.legalEntityEmission),
    formatCalculationEmissionCell(emissions.projectEntityEmission),
    calc?.attributedEmission != null ? formatNum(calc.attributedEmission) : '—',
    calc?.qualityGrade || '—'
  ];
}

const LEDGER_SUMMARY_EXPORT_HEADERS = ['任务名称', '核算年度', '投向行业范围', '所属行业范围', '台账笔数'];
const LEDGER_DETAIL_EXPORT_HEADERS = [
  '任务名称', '核算年度',
  '一级分行', '经办行', '客户名称', '客户规模', '信贷品种', '业务种类', '贷款账号',
  '投放日', '贷款主体类型', '企业所属行业', '贷款投向所属行业',
  '月均贷款余额（元）', '年报营业收入（元）', '平均资产总额（元）', '主办客户经理',
  '法人主体排放(tCO₂e)', '项目主体排放(tCO₂e)', '归因排放(tCO₂e)', '质量等级'
];

function csvEscapeCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadCsvFile(filename, headers, rowArrays) {
  const lines = [headers.map(csvEscapeCell).join(',')];
  rowArrays.forEach(r => lines.push(r.map(csvEscapeCell).join(',')));
  const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/[\\/:*?"<>|]/g, '_') + '.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportLedgerSummaryCsv(tasks) {
  const rows = (tasks || []).map(t => {
    normalizeTaskIndustryFields(t);
    const count = getLedgerDetailRows(t.id, getLedgerFilters()).length;
    return [
      t.name,
      t.year,
      formatSingleIndustryScopeDisplay(getTaskInvestIndustryScope(t), t.investIndustryCustomCodes),
      formatSingleIndustryScopeDisplay(getTaskSubjectIndustryScope(t), t.industryCustomCodes),
      count
    ];
  });
  downloadCsvFile('投融资碳核算台账-任务汇总', LEDGER_SUMMARY_EXPORT_HEADERS, rows);
}

function exportLedgerDetailCsv(tasks, filters) {
  const rows = [];
  (tasks || []).forEach(t => {
    getLedgerDetailRows(t.id, filters).forEach(({ f, calc }) => {
      rows.push([t.name, t.year, ...ledgerCalculationRowValues(f, calc, t.id)]);
    });
  });
  downloadCsvFile('投融资碳核算台账-排放计算清单', LEDGER_DETAIL_EXPORT_HEADERS, rows);
}

function renderIndustryScopeKindRadios(activeKind, readonly) {
  const dis = readonly ? 'disabled' : '';
  const kind = activeKind === 'subject' ? 'subject' : 'invest';
  return `<div class="industry-scope-kind-radios" id="industryScopeKindGroup">
    <label class="industry-scope-radio">
      <input type="radio" name="industryScopeKind" value="invest" ${kind === 'invest' ? 'checked' : ''} ${dis}>
      <span>投向行业范围</span>
    </label>
    <label class="industry-scope-radio">
      <input type="radio" name="industryScopeKind" value="subject" ${kind === 'subject' ? 'checked' : ''} ${dis}>
      <span>所属行业范围</span>
    </label>
  </div>`;
}

function renderTaskIndustryScopeBlock(kind, task, options) {
  const { readonly = false, showRequired = true } = options;
  const label = showRequired && !readonly ? fieldLabel : (text) => text;
  const dis = readonly ? 'disabled' : '';
  const isInvest = kind === 'invest';
  const scope = isInvest ? getTaskInvestIndustryScope(task) : getTaskSubjectIndustryScope(task);
  const customCodes = isInvest ? (task.investIndustryCustomCodes || []) : (task.industryCustomCodes || []);
  const selected = customCodes.length ? customCodes : IndustryCascade.presetCodes(scope);
  const scopeName = isInvest ? 'investIndustryScope' : 'subjectIndustryScope';
  const groupId = isInvest ? 'investIndustryScopeGroup' : 'subjectIndustryScopeGroup';
  const wrapId = isInvest ? 'investIndustryCascadeWrap' : 'subjectIndustryCascadeWrap';
  const panelId = isInvest ? 'investIndustryCascadePanel' : 'subjectIndustryCascadePanel';
  const countId = isInvest ? 'investIndustrySelectedCount' : 'subjectIndustrySelectedCount';
  const summaryId = isInvest ? 'investIndustrySelectedSummary' : 'subjectIndustrySelectedSummary';
  return `
    <div class="form-item full"><label>${label('行业范围')}</label>
      ${renderIndustryScopeRadios(scopeName, scope, { readonly, dis, groupId })}
    </div>
    <div class="form-item full" id="${wrapId}">
      ${IndustryCascade.renderPanel(selected, readonly, {
        wrapId: panelId,
        countId,
        summaryId
      })}
    </div>`;
}

function renderTaskFormFields(task, options = {}) {
  const { readonly = false, showRequired = true } = options;
  const t = task || {};
  const ro = readonly ? 'readonly' : '';
  const dis = readonly ? 'disabled' : '';
  const label = showRequired && !readonly ? fieldLabel : (text) => text;
  normalizeTaskIndustryFields(t);
  normalizeTaskOrgScopeFields(t);
  const industryScopeFields = readonly
    ? `
    <div class="form-item full"><label>投向行业范围</label>
      ${renderIndustryScopeRadios('investIndustryScope', getTaskInvestIndustryScope(t), { readonly, dis, groupId: 'investIndustryScopeGroup' })}
    </div>
    <div class="form-item full" id="investIndustryCascadeWrap">
      ${IndustryCascade.renderPanel(
        (t.investIndustryCustomCodes?.length ? t.investIndustryCustomCodes : IndustryCascade.presetCodes(getTaskInvestIndustryScope(t))),
        true,
        { wrapId: 'investIndustryCascadePanel', countId: 'investIndustrySelectedCount', summaryId: 'investIndustrySelectedSummary' }
      )}
    </div>
    <div class="form-item full"><label>所属行业范围</label>
      ${renderIndustryScopeRadios('subjectIndustryScope', getTaskSubjectIndustryScope(t), { readonly, dis, groupId: 'subjectIndustryScopeGroup' })}
    </div>
    <div class="form-item full" id="subjectIndustryCascadeWrap">
      ${IndustryCascade.renderPanel(
        (t.industryCustomCodes?.length ? t.industryCustomCodes : IndustryCascade.presetCodes(getTaskSubjectIndustryScope(t))),
        true,
        { wrapId: 'subjectIndustryCascadePanel', countId: 'subjectIndustrySelectedCount', summaryId: 'subjectIndustrySelectedSummary' }
      )}
    </div>`
    : `
    <div class="form-item full"><label>${label('数据行业范围')}</label>
      ${renderIndustryScopeKindRadios('invest', false)}
    </div>
    <div id="investIndustryScopeBlock" class="task-industry-scope-block">
      ${renderTaskIndustryScopeBlock('invest', t, { readonly, showRequired })}
    </div>
    <div id="subjectIndustryScopeBlock" class="task-industry-scope-block" style="display:none">
      ${renderTaskIndustryScopeBlock('subject', t, { readonly, showRequired })}
    </div>`;
  return `
    <div class="form-item"><label>${label('任务名称')}</label><input name="name" ${readonly ? '' : 'required'} value="${t.name || ''}" ${ro}></div>
    <div class="form-item"><label>${label('核算年度')}</label>
      ${renderTaskYearField(t.year || TASK_YEAR_MIN, {
        readonly,
        legacyReadonly: !readonly && isLegacyTaskYear(t.year)
      })}
    </div>
    ${industryScopeFields}
    ${renderTaskOrgScopeField(t, { readonly, dis, showRequired })}
    <div class="form-item"><label>${label('余额口径')}</label>
      <select name="balanceRule" ${readonly ? '' : 'required'} ${dis}>
        <option ${t.balanceRule === '月均余额' || !t.balanceRule ? 'selected' : ''}>月均余额</option>
        <option ${t.balanceRule === '日均余额' ? 'selected' : ''}>日均余额</option>
      </select>
    </div>
    <div class="form-item"><label>${label('数据收集截止日期')}</label>
      <input type="date" name="deadline" ${readonly ? '' : 'required'} value="${t.deadline || ''}" ${ro}>
    </div>
    <div class="form-item"><label>${label('分行审批截止日期')}</label>
      <input type="date" name="branchDeadline" value="${t.branchDeadline || ''}" ${ro}>
    </div>
    ${readonly ? '' : `
    <input type="hidden" name="goal" value="${t.goal || '监管报送'}">
    <input type="hidden" name="initiatorOrg" value="${t.initiatorOrg || 'hq'}">
    <input type="hidden" name="initiatorBranch" value="${t.initiatorBranch || t.branches?.[0] || '北京分行'}">
    `}
    `;
}

function readTaskFormPayload(form) {
  const subjectIndustryScope = form.subjectIndustryScope?.value
    || document.querySelector('input[name="subjectIndustryScope"]:checked')?.value
    || INDUSTRY_SCOPE_KEY_EIGHT;
  const investIndustryScope = form.investIndustryScope?.value
    || document.querySelector('input[name="investIndustryScope"]:checked')?.value
    || INDUSTRY_SCOPE_KEY_EIGHT;
  const industryCustomCodes = subjectIndustryScope === '自定义'
    ? IndustryCascade.getSelectedCodes(qs('#subjectIndustryCascadeWrap'))
    : [];
  const investIndustryCustomCodes = investIndustryScope === '自定义'
    ? IndustryCascade.getSelectedCodes(qs('#investIndustryCascadeWrap'))
    : [];
  const org = readTaskOrgScopeFromForm(form);
  return {
    name: form.name.value,
    year: clampTaskYear(form.year.value),
    subjectIndustryScope,
    investIndustryScope,
    industryScope: subjectIndustryScope,
    industryCustomCodes,
    investIndustryCustomCodes,
    industryCodes: IndustryScope.resolveCodes(subjectIndustryScope, industryCustomCodes),
    investIndustryCodes: IndustryScope.resolveCodes(investIndustryScope, investIndustryCustomCodes),
    orgScope: org.orgScope,
    branches: org.branches,
    balanceRule: form.balanceRule?.value || '月均余额',
    goal: form.goal?.value || '监管报送',
    deadline: form.deadline.value,
    branchDeadline: form.branchDeadline?.value || '',
    initiatorOrg: form.initiatorOrg?.value || 'hq',
    initiatorBranch: form.initiatorBranch?.value || org.branches[0] || '北京分行'
  };
}

function bindTaskInitiatorToggle() {
  const orgSel = qs('#initiatorOrgSelect');
  const branchWrap = qs('#initiatorBranchWrap');
  if (!orgSel) return;
  const toggle = () => {
    const isBranch = orgSel.value === 'branch';
    if (branchWrap) branchWrap.style.display = isBranch ? '' : 'none';
  };
  orgSel.addEventListener('change', toggle);
  toggle();
}

function bindTaskIndustryScopeToggle() {
  const subjectGroup = qs('#subjectIndustryScopeGroup');
  const investGroup = qs('#investIndustryScopeGroup');
  const subjectWrap = qs('#subjectIndustryCascadeWrap');
  const investWrap = qs('#investIndustryCascadeWrap');
  if (!subjectGroup || !investGroup) return;
  try {
    IndustryCascade.bindPanel(investWrap, investGroup);
    IndustryCascade.bindPanel(subjectWrap, subjectGroup);
  } catch (err) {
    console.error('行业级联绑定失败', err);
  }

  const kindGroup = qs('#industryScopeKindGroup');
  const investBlock = qs('#investIndustryScopeBlock');
  const subjectBlock = qs('#subjectIndustryScopeBlock');
  if (kindGroup && investBlock && subjectBlock) {
    const applyKind = () => {
      const kind = document.querySelector('input[name="industryScopeKind"]:checked')?.value || 'invest';
      investBlock.style.display = kind === 'invest' ? '' : 'none';
      subjectBlock.style.display = kind === 'subject' ? '' : 'none';
    };
    qsa('input[name="industryScopeKind"]', kindGroup).forEach(r => r.addEventListener('change', applyKind));
    applyKind();
  }
}

function confirmDeleteTask(taskId, taskName) {
  let modal = qs('#deleteTaskModal');
  if (!modal) {
    const root = qs('#modalRoot');
    if (root) {
      root.innerHTML = `
        <div class="modal-overlay" id="deleteTaskModal">
          <div class="modal">
            <div class="modal-header"><h4>删除确认</h4><button class="modal-close" id="closeDeleteTask">&times;</button></div>
            <div class="modal-body"><p>是否确认删除当前核算任务？</p>
            <p style="margin-top:8px;font-size:13px;color:#909399">任务：<strong id="deleteTaskName"></strong></p></div>
            <div class="modal-footer"><button class="btn" id="cancelDeleteTask">取消</button><button class="btn btn-primary" id="deleteTaskConfirmBtn">确认删除</button></div>
          </div>
        </div>`;
      modal = qs('#deleteTaskModal');
      qs('#closeDeleteTask').onclick = () => hideModal('deleteTaskModal');
      qs('#cancelDeleteTask').onclick = () => hideModal('deleteTaskModal');
    }
  }
  if (!modal) return;
  qs('#deleteTaskName').textContent = taskName;
  qs('#deleteTaskConfirmBtn').onclick = () => {
    Store.deleteTask(taskId);
    toast('已删除核算任务', 'success');
    hideModal('deleteTaskModal');
    setListPage('tasks', 1);
    location.hash = '#/tasks';
  };
  showModal('deleteTaskModal');
}

function getQuery(name) {
  const q = location.hash.includes('?') ? location.hash.split('?')[1] : location.search.slice(1);
  return new URLSearchParams(q).get(name);
}

function taskWorkflowSteps(task) {
  return workflowStepsBar(task);
}

function getSupplementByFormalId(formalId) {
  return Store.get().supplements.find(s => s.formalId === formalId);
}

function isSupplementManualVisible(supp) {
  if (!supp?.dispatchedAt) return false;
  if (supp.status === 'completed') return true;
  return ['branch_review', 'hq_review', 'approved'].includes(supp.auditStage || '');
}

function formatSystemEntityEmission(taskId, formalId) {
  const formal = Store.getFormalList(taskId).find(f => f.id === formalId);
  const calc = Store.getCalculations?.(taskId)?.find(c => c.formalId === formalId);
  if (formal?.gelanEntityEmission != null) {
    return formatNum(formal.gelanEntityEmission);
  }
  if (formal?.economyDirectStatus === 'done' || calc?.source === 'economy_direct') {
    if (calc?.entityEmission != null) {
      return formatNum(calc.entityEmission);
    }
  }
  if (calc?.source === 'credit_fallback' && calc.entityEmission != null) {
    return formatNum(calc.entityEmission);
  }
  return '—';
}

function formatManualEntityEmission(taskId, formalId) {
  const supp = Store.get().supplements.find(s => s.formalId === formalId && s.taskId === taskId);
  if (!isSupplementManualVisible(supp)) return '—';
  const e = Store.calcEntityEmission(supp);
  if (e == null || Number.isNaN(Number(e))) return '—';
  return formatNum(e);
}

/** 系统核算主体排放数值（格澜 / 经济法直算 / 信贷兜底） */
function getSystemEntityEmissionValue(taskId, formalId) {
  const formal = Store.getFormalList(taskId).find(f => f.id === formalId);
  if (!formal) return null;
  if (formal.gelanEntityEmission != null && !Number.isNaN(Number(formal.gelanEntityEmission))) {
    return Number(formal.gelanEntityEmission);
  }
  const calc = Store.getCalculations?.(taskId)?.find(c => c.formalId === formalId);
  if (!calc || calc.entityEmission == null || Number.isNaN(Number(calc.entityEmission))) return null;
  const systemSources = ['gelan', 'economy_direct', 'credit_fallback'];
  if (systemSources.includes(calc.source)) return Number(calc.entityEmission);
  if (formal.economyDirectStatus === 'done') return Number(calc.entityEmission);
  return null;
}

/** 手动核算主体排放数值（客户经理收集填报） */
function getManualEntityEmissionValue(taskId, formalId) {
  const supp = Store.get().supplements.find(s => s.formalId === formalId && s.taskId === taskId);
  if (!isSupplementManualVisible(supp)) return null;
  const e = Store.calcEntityEmission(supp);
  if (e == null || Number.isNaN(Number(e))) return null;
  return Number(e);
}

/** 排放结果：手动有值取手动，否则取系统 */
function getEffectiveEntityEmission(taskId, formalId) {
  const manual = getManualEntityEmissionValue(taskId, formalId);
  if (manual != null) return manual;
  return getSystemEntityEmissionValue(taskId, formalId);
}

function formatEffectiveEntityEmission(taskId, formalId) {
  const effective = getEffectiveEntityEmission(taskId, formalId);
  if (effective == null) return '—';
  return formatNum(effective);
}

/** 数据采集列表行：基于预索引 formal/supp/calc，避免逐行 Store.get */
function formatDataCollectEmissionCells(formal, supp, calc) {
  let systemHtml = '—';
  if (formal.gelanEntityEmission != null) {
    systemHtml = formatNum(formal.gelanEntityEmission);
  } else if (formal.economyDirectStatus === 'done' || calc?.source === 'economy_direct') {
    if (calc?.entityEmission != null) systemHtml = formatNum(calc.entityEmission);
  } else if (calc?.source === 'credit_fallback' && calc?.entityEmission != null) {
    systemHtml = formatNum(calc.entityEmission);
  }

  let manualVal = null;
  let manualHtml = '—';
  if (isSupplementManualVisible(supp)) {
    const e = Store.calcEntityEmission(supp);
    if (e != null && !Number.isNaN(Number(e))) {
      manualVal = Number(e);
      manualHtml = formatNum(manualVal);
    }
  }

  let systemVal = null;
  if (formal.gelanEntityEmission != null && !Number.isNaN(Number(formal.gelanEntityEmission))) {
    systemVal = Number(formal.gelanEntityEmission);
  } else if (calc?.entityEmission != null && !Number.isNaN(Number(calc.entityEmission))) {
    const systemSources = ['gelan', 'economy_direct', 'credit_fallback'];
    if (systemSources.includes(calc.source) || formal.economyDirectStatus === 'done') {
      systemVal = Number(calc.entityEmission);
    }
  }

  const effective = manualVal != null ? manualVal : systemVal;
  const effectiveHtml = effective != null ? formatNum(effective) : '—';
  return { systemHtml, manualHtml, effectiveHtml };
}

/** @deprecated 列表展示请用 formatSystemEntityEmission / formatManualEntityEmission / formatEffectiveEntityEmission */
function formatFormalEntityEmission(taskId, formalId) {
  return formatEffectiveEntityEmission(taskId, formalId);
}

/** 格澜接口预填时，报告法数据来源固定为「报告法-其他数据来源」 */
const GELAN_REPORT_DATA_SOURCE = '报告法-其他数据来源';

/** 格澜接口平台来源（数据采集列表、填报页展示） */
const GELAN_INTERFACE_PLATFORM = '格澜数据-各地区企业环境信息披露平台';

function resolveGelanInterfacePlatformLabel(formal) {
  if (!formal || formal.gelanEntityEmission == null) return null;
  const gelan = formal.gelanPrefill || {};
  return gelan.platformSource || GELAN_INTERFACE_PLATFORM;
}

function renderInterfaceSourceSubline(label) {
  if (!label) return '';
  return `<div class="interface-source-subline" style="font-size:11px;color:#909399;margin-top:3px;line-height:1.4">来源：${escapeHtml(label)}</div>`;
}

/** 格澜主体排放调取：仅适用于主体碳排放；「项目（以项目方式计算）」不适用 */
function isFormalGelanEligible(formal, taskId, d) {
  if (!formal) return false;
  d = d || (typeof Store !== 'undefined' ? Store.get() : null);
  const row = typeof formalLedgerRow === 'function' ? formalLedgerRow(formal, taskId, d) : formal;
  return resolveAccountingType(row) !== 'project_as_project';
}

/** 经济活动法直算：非必收数路径、主体尚无排放，且非项目法（以项目方式计算）/项目待收集 */
function isFormalEconomyDirectEligible(formal, taskId, d) {
  if (!formal || formal.status !== 'confirmed') return false;
  if (formal.economyDirectStatus === 'done') return false;
  const mode = formal.collectMode || resolveCollectMode(formal.loanType);
  if (mode !== 'economy_direct') return false;
  if (typeof Store !== 'undefined') {
    if (d && Store._formalHasEntityEmission?.(d, taskId, formal)) return false;
    if (!d && Store.getFormalEntityEmission?.(taskId, formal.id) != null) return false;
  }
  d = d || (typeof Store !== 'undefined' ? Store.get() : null);
  const row = typeof formalLedgerRow === 'function' ? formalLedgerRow(formal, taskId, d) : formal;
  const type = resolveAccountingType(row);
  return type !== 'project_as_project' && !isProjectAccountingPending(row);
}

/** 经济法直算按钮无待处理记录时的提示（区分格澜已覆盖、项目法须收集等正常流程） */
function describeEconomyDirectEmptyOutcome(taskId) {
  const list = Store.getFormalList(taskId).filter(f => f.status === 'confirmed');
  const ecoPath = list.filter(f => (f.collectMode || resolveCollectMode(f.loanType)) === 'economy_direct');
  const withEntity = ecoPath.filter(f => Store.getFormalEntityEmission(taskId, f.id) != null);
  const needSupplement = ecoPath.filter(f => {
    const type = resolveAccountingType(formalLedgerRow(f, taskId));
    return type === 'project_as_project' || isProjectAccountingPending(formalLedgerRow(f, taskId));
  });
  const pendingEligible = ecoPath.filter(f => isFormalEconomyDirectEligible(f, taskId));

  if (pendingEligible.length) return null;
  if (withEntity.length && needSupplement.length) {
    return {
      type: 'info',
      msg: '当前无待经济法直算记录：格澜等方式已填充主体排放；项目法/待收集项目请通过「发放收集任务」采集'
    };
  }
  if (withEntity.length) {
    return { type: 'info', msg: '当前无待经济法直算记录，主体排放已由格澜等方式填充' };
  }
  if (needSupplement.length) {
    return { type: 'info', msg: '项目法（以项目方式计算）及项目待收集不适用经济法直算，请发放收集任务' };
  }
  if (ecoPath.every(f => f.economyDirectStatus === 'done')) {
    return { type: 'info', msg: '经济法直算已全部完成' };
  }
  return {
    type: 'warning',
    msg: '当前没有待直算的经济法记录（需已锁定、尚无主体排放，且非项目法以项目方式计算）'
  };
}

/** 模拟调用格澜数据接口，返回报告法主体排放（部分客户有数据） */
function fetchGelanEntityDataMock(row, task) {
  const code = String(row?.creditCode || '');
  if (!code || code.length < 4) return { ok: false, reason: 'invalid' };
  const tail = parseInt(code.replace(/\D/g, '').slice(-2) || '0', 10);
  if (tail % 5 === 0) return { ok: false, reason: 'no_data' };
  const year = task?.year || new Date().getFullYear();
  const ghgTotalEmission = Math.round(8500 + tail * 163);
  const scope1Emission = Math.round(ghgTotalEmission * 0.58);
  const scope2Emission = Math.round(ghgTotalEmission * 0.42);
  const isPower = isPowerIndustryMajor(row?.industryMajor);
  return {
    ok: true,
    data: {
      entityEmission: ghgTotalEmission,
      ghgTotalEmission,
      carbonDataYear: year - 1,
      scope1Emission,
      scope2Emission,
      unitTotalCo2Emission: isPower ? Math.round(ghgTotalEmission * 0.15) : null,
      disclosureChannel: 'ESG报告',
      reportYear: year - 1,
      thirdPartyVerified: true,
      reportSource: GELAN_REPORT_DATA_SOURCE,
      apiSource: '格澜数据',
      platformSource: GELAN_INTERFACE_PLATFORM,
      fetchedAt: new Date().toLocaleString('zh-CN')
    }
  };
}

/** 归集报告法扩展字段（收集 / 格澜 / 碳账户年度快照） */
function getReportMethodFields(source) {
  if (typeof SUPPLEMENT_FIELDS !== 'undefined' && source && !source.gelanPrefill && !source.reportDetail) {
    return SUPPLEMENT_FIELDS.reportFieldValues(source);
  }
  const r = source?.fieldData?.report || source?.reportDetail || source?.gelanPrefill || source?.annualProfiles || {};
  const yearKey = source?.year ? String(source.year) : null;
  const profile = yearKey && source?.annualProfiles?.[yearKey]?.reportDetail
    ? source.annualProfiles[yearKey].reportDetail
    : null;
  const merged = profile || r;
  return {
    carbonDataYear: merged.carbonDataYear ?? source?.reportCarbonDataYear ?? merged.reportYear ?? '',
    ghgTotalEmission: merged.ghgTotalEmission ?? merged.emission ?? source?.reportedEmission ?? source?.entityEmission ?? '',
    scope1Emission: merged.scope1Emission ?? source?.reportScope1Emission ?? '',
    scope2Emission: merged.scope2Emission ?? source?.reportScope2Emission ?? '',
    unitTotalCo2Emission: merged.unitTotalCo2Emission ?? source?.reportUnitTotalCo2Emission ?? ''
  };
}

function formatReportFieldNum(v) {
  return v != null && v !== '' && !Number.isNaN(Number(v)) ? formatNum(v) : '—';
}

function isPowerIndustryMajor(major) {
  return String(major || '').includes('电力');
}

function renderReportMethodSummaryReadonly(fields, options = {}) {
  const f = fields || {};
  const showPowerUnit = options.isPowerIndustry ?? isPowerIndustryMajor(options.industryMajor);
  const powerField = showPowerUnit
    ? `<div class="form-item"><label>全部机组二氧化碳排放总量（tCO2e）</label><input value="${formatReportFieldNum(f.unitTotalCo2Emission)}" readonly></div>`
    : '';
  return `
    <div class="form-item"><label>碳数据年份</label><input value="${f.carbonDataYear || '—'}" readonly></div>
    <div class="form-item"><label>核算周期内碳排放量（温室气体排放总量，tCO2e）</label><input value="${formatReportFieldNum(f.ghgTotalEmission)}" readonly></div>
    <div class="form-item"><label>范围一的排放总量（tCO2e）</label><input value="${formatReportFieldNum(f.scope1Emission)}" readonly></div>
    <div class="form-item"><label>范围二的排放总量（tCO2e）</label><input value="${formatReportFieldNum(f.scope2Emission)}" readonly></div>
    ${powerField}`;
}

function renderReportMethodSummaryEditable(fields, year, options = {}) {
  const f = fields || {};
  const numVal = (v) => (v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : '');
  const showPowerUnit = options.isPowerIndustry ?? isPowerIndustryMajor(options.industryMajor);
  const powerField = showPowerUnit
    ? `<div class="form-item"><label>全部机组二氧化碳排放总量（tCO2e）</label><input name="reportUnitTotalCo2Emission" type="number" step="0.01" value="${numVal(f.unitTotalCo2Emission)}"></div>`
    : '';
  return `
    <div class="form-item"><label>碳数据年份</label><input name="reportCarbonDataYear" type="number" value="${f.carbonDataYear || year || ''}"></div>
    <div class="form-item"><label>核算周期内碳排放量（温室气体排放总量，tCO2e）</label><input name="reportGhgTotalEmission" type="number" step="0.01" value="${numVal(f.ghgTotalEmission)}"></div>
    <div class="form-item"><label>范围一的排放总量（tCO2e）</label><input name="reportScope1Emission" type="number" step="0.01" value="${numVal(f.scope1Emission)}"></div>
    <div class="form-item"><label>范围二的排放总量（tCO2e）</label><input name="reportScope2Emission" type="number" step="0.01" value="${numVal(f.scope2Emission)}"></div>
    ${powerField}`;
}

function collectCarbonAccountProfileForm(form) {
  if (!form) return null;
  const txt = (name) => form.querySelector(`[name="${name}"]`)?.value?.trim() ?? '';
  const num = (name) => {
    const raw = form.querySelector(`[name="${name}"]`)?.value;
    if (raw == null || raw === '') return null;
    const n = Number(String(raw).replace(/,/g, ''));
    return Number.isNaN(n) ? null : n;
  };
  return {
    customerName: txt('customerName'),
    creditCode: txt('creditCode'),
    customerNo: txt('customerNo'),
    methodLabel: txt('methodLabel'),
    entityEmission: num('entityEmission'),
    reportDetail: {
      carbonDataYear: txt('reportCarbonDataYear') || null,
      ghgTotalEmission: num('reportGhgTotalEmission'),
      emission: num('reportGhgTotalEmission'),
      scope1Emission: num('reportScope1Emission'),
      scope2Emission: num('reportScope2Emission'),
      unitTotalCo2Emission: num('reportUnitTotalCo2Emission')
    }
  };
}

const CA_SUPPLEMENT_TAB_METHOD_IDS = {
  report_authority: 'report',
  report_other: 'report',
  report: 'report',
  energy: 'energy',
  product: 'product',
  economy: 'economy',
  other: 'economy_fallback'
};

/** 碳账户编辑：合并客户经理收集表单，推导主体排放与核算方法（不写回核算任务） */
function mergeCarbonAccountSupplementIntoPayload(profilePayload, supplementRoot, supplementView) {
  if (!supplementRoot || !supplementView || typeof SUPPLEMENT_FIELDS === 'undefined') {
    return profilePayload;
  }
  const collected = SUPPLEMENT_FIELDS.collectAllFormData(supplementRoot, supplementView);
  const merged = {
    ...supplementView,
    ...collected,
    methodId: CA_SUPPLEMENT_TAB_METHOD_IDS[collected.activeMethodTab]
      || supplementView.methodId
      || 'report',
    activeMethodTab: collected.activeMethodTab
  };
  if (supplementView.approvedMethodId) {
    merged.methodId = supplementView.approvedMethodId;
  } else {
    merged.methodId = Store.matchMethod({ ...supplementView, ...collected })?.id
      || merged.methodId;
  }
  const entityFromSupplement = Store.calcEntityEmission(merged);
  const reportDetail = (collected.activeMethodTab === 'report_authority' || collected.activeMethodTab === 'report_other' || collected.activeMethodTab === 'report')
    ? {
      ...(profilePayload.reportDetail || {}),
      ...(merged.fieldData?.reportAuthority || merged.fieldData?.reportOther || merged.fieldData?.report || {}),
      source: merged.fieldData?.reportAuthority?.source
        || merged.fieldData?.reportOther?.source
        || merged.fieldData?.report?.source
        || merged.disclosureChannel
        || profilePayload.reportDetail?.source
    }
    : profilePayload.reportDetail;
  const methodLabel = typeof CarbonAccount !== 'undefined'
    ? CarbonAccount.resolveAccountMethodLabel(Store.get(), {
      methodId: merged.methodId,
      supplement: merged,
      reportDetail,
      source: 'manual'
    })
    : profilePayload.methodLabel;
  const entityEmission = entityFromSupplement > 0
    ? entityFromSupplement
    : profilePayload.entityEmission;
  return {
    ...profilePayload,
    customerName: profilePayload.customerName || merged.customerName,
    creditCode: merged.creditCode || profilePayload.creditCode,
    entityEmission,
    methodLabel: methodLabel || profilePayload.methodLabel,
    methodId: merged.methodId,
    reportDetail,
    supplementSnapshot: merged
  };
}

function renderCarbonAccountMethodOptions(selected) {
  const labels = typeof CarbonAccount !== 'undefined'
    ? Object.values(CarbonAccount.METHOD_LABEL)
    : ['报告法其他数据', '经济活动法'];
  const cur = selected || labels[0];
  return labels.map(label =>
    `<option value="${label}" ${label === cur ? 'selected' : ''}>${label}</option>`
  ).join('');
}

function formatCalculationEmissionCell(val) {
  return val != null && val !== '' && !Number.isNaN(Number(val)) ? formatNum(val) : '—';
}

/** 排放计算清单：按核算类型拆分法人主体排放 / 项目主体排放 */
function resolveCalculationEmissionDisplay(f, calc, taskId) {
  const row = typeof formalLedgerRow === 'function' ? formalLedgerRow(f, taskId) : f;
  const accountingType = typeof finalizeAccountingType === 'function'
    ? finalizeAccountingType(row)
    : resolveAccountingType(row);
  const rawTotal = typeof getEffectiveEntityEmission === 'function'
    ? getEffectiveEntityEmission(taskId, f?.id)
    : (calc?.entityEmission != null
      ? calc.entityEmission
      : Store.getFormalEntityEmission?.(taskId, f?.id));

  if (accountingType === 'project_as_project') {
    return {
      legalEntityEmission: calc?.legalEntityEmission ?? null,
      projectEntityEmission: calc?.projectEntityEmission ?? rawTotal
    };
  }
  const legal = calc?.legalEntityEmission ?? calc?.entityEmission ?? rawTotal;
  return { legalEntityEmission: legal, projectEntityEmission: null };
}

/** 写入计算记录时按核算类型拆分主体排放字段 */
function applyCalculationEmissionSplit(payload, f, taskId, entityEmission, d) {
  if (entityEmission == null || Number.isNaN(Number(entityEmission))) return payload;
  const cand = d?.candidates?.find(c => c.id === f.customerId);
  const row = { ...(cand || {}), ...f, projectDetails: f.projectDetails ?? cand?.projectDetails };
  const type = typeof finalizeAccountingType === 'function' ? finalizeAccountingType(row) : resolveAccountingType(row);
  if (type === 'project_as_project') {
    payload.projectEntityEmission = Number(entityEmission);
    if (payload.legalEntityEmission == null && f.gelanEntityEmission != null) {
      payload.legalEntityEmission = Number(f.gelanEntityEmission);
    }
    payload.entityEmission = Number(entityEmission);
  } else {
    payload.legalEntityEmission = Number(entityEmission);
    payload.projectEntityEmission = null;
    payload.entityEmission = Number(entityEmission);
  }
  return payload;
}

function renderCalculationListCells(f, calc, taskId) {
  const emissions = resolveCalculationEmissionDisplay(f, calc, taskId);
  return `
    ${renderCandidateListCells(formalLedgerRow(f, taskId), { finalizeAccountingType: true, listKind: 'formal' })}
    <td>${formatCalculationEmissionCell(emissions.legalEntityEmission)}</td>
    <td>${formatCalculationEmissionCell(emissions.projectEntityEmission)}</td>
    <td>${calc?.attributedEmission != null ? formatNum(calc.attributedEmission) : '—'}</td>
    <td>${calc?.qualityGrade ? qualityGradeBadge(calc.qualityGrade) : '—'}</td>`;
}

function dispatchStatusBadge(formal, supplement) {
  if (formal.status !== 'confirmed') return '<span class="badge badge-draft">待锁定</span>';
  if (!supplement) return '<span class="badge badge-warning">未派发</span>';
  return '<span class="badge badge-success">已派发</span>';
}

function fillStatusBadge(supplement) {
  if (!supplement) return '<span class="badge badge-draft">—</span>';
  const map = {
    pending: ['待填报', 'badge-warning'],
    in_progress: ['填报中', 'badge-running'],
    completed: ['已填报', 'badge-success'],
    returned: ['已退回', 'badge-danger']
  };
  const [text, cls] = map[supplement.status] || [supplement.status, 'badge-draft'];
  return `<span class="badge ${cls}">${text}</span>`;
}

/** 收集任务状态（用于客户经理/收集清单） */
function supplementTaskStatusBadge(supplement) {
  if (!supplement) return '<span class="badge badge-draft">—</span>';
  if (supplement.status === 'returned' || supplement.auditStage === 'rejected') {
    return '<span class="badge badge-danger">已退回</span>';
  }
  if (supplement.status === 'pending') return '<span class="badge badge-warning">待填报</span>';
  if (supplement.status === 'in_progress') return '<span class="badge badge-running">填报中</span>';
  if (supplement.status === 'completed') {
    const stage = supplement.auditStage || 'pending_fill';
    if (stage === 'approved') return '<span class="badge badge-success">已通过</span>';
    if (stage === 'branch_review' || stage === 'hq_review') {
      return '<span class="badge badge-warning">待审核</span>';
    }
    return '<span class="badge badge-warning">待提交</span>';
  }
  return statusBadge(supplement.status);
}

function auditStatusBadge(supplement) {
  if (!supplement) return '<span class="badge badge-draft">—</span>';
  if (supplement.status !== 'completed') return '<span class="badge badge-draft">待填报</span>';
  return approvalBadge(supplement.approvalStatus);
}

function requiresMandatoryCollect(loanType) {
  if (!loanType) return false;
  return (GUIDE.MANDATORY_COLLECT_LOAN_TYPES || []).some(t => loanType.includes(t));
}

function resolveCollectMode(loanType) {
  return requiresMandatoryCollect(loanType) ? 'mandatory' : 'economy_direct';
}

/** 数据采集行核算方法上下文（与碳账户 resolveAccountMethodLabel 对齐） */
function resolveFormalAccountingMethodContext(d, formal, taskId) {
  const supp = (d.supplements || []).find(s => s.formalId === formal.id && s.taskId === taskId);
  const calc = (d.calculations || []).find(c => c.formalId === formal.id && c.taskId === taskId);
  return {
    formal,
    supplement: supp,
    calc,
    methodId: calc?.methodId,
    source: calc?.source || (formal.gelanEntityEmission != null ? 'gelan' : null),
    reportDetail: calc?.reportDetail || formal.gelanPrefill || null
  };
}

/** 系统核算方法：格澜调取、经济法直算、信贷兜底等接口/直算路径 */
function resolveSystemAccountingMethodLabel(formal, taskId, d) {
  d = d || (typeof Store !== 'undefined' ? Store.get() : null);
  if (!formal || !d || typeof CarbonAccount === 'undefined') return '—';

  const ctx = resolveFormalAccountingMethodContext(d, formal, taskId);
  const calc = ctx.calc;

  if (formal.gelanEntityEmission != null || calc?.source === 'gelan') {
    return CarbonAccount.resolveAccountMethodLabel(d, ctx) || CarbonAccount.METHOD_LABEL.REPORT_OTHER;
  }
  if (formal.economyDirectStatus === 'done' || calc?.source === 'economy_direct') {
    return CarbonAccount.resolveAccountMethodLabel(d, ctx) || CarbonAccount.METHOD_LABEL.ECONOMY_REVENUE;
  }
  if (calc?.source === 'credit_fallback') {
    return CarbonAccount.METHOD_LABEL.ECONOMY_LOAN;
  }
  return '—';
}

/** 手动核算方法：收集任务提交后的客户经理填报口径 */
function resolveManualAccountingMethodLabel(formal, taskId, d) {
  d = d || (typeof Store !== 'undefined' ? Store.get() : null);
  if (!formal || !d || typeof CarbonAccount === 'undefined') return '—';

  const supp = (d.supplements || []).find(s => s.formalId === formal.id && s.taskId === taskId);
  if (!isSupplementManualVisible(supp)) return '—';

  const methodId = supp.approvedMethodId || (typeof Store !== 'undefined' ? Store.matchMethod(supp)?.id : null);
  if (!methodId) return '—';

  const manualCtx = {
    formal: { ...formal, gelanEntityEmission: null, gelanPrefill: null },
    supplement: supp,
    calc: null,
    methodId,
    reportDetail: supp.fieldData?.report || null,
    source: 'manual_collect'
  };
  const label = CarbonAccount.resolveAccountMethodLabel(d, manualCtx);
  return label && label !== '-' ? label : '—';
}

/** 数据采集列表「核算方法」展示名（排放结果：手动优先，其次系统） */
function resolveFormalAccountingMethodLabel(formal, taskId, d) {
  d = d || (typeof Store !== 'undefined' ? Store.get() : null);
  if (getManualEntityEmissionValue(taskId, formal?.id) != null) {
    return resolveManualAccountingMethodLabel(formal, taskId, d);
  }
  return resolveSystemAccountingMethodLabel(formal, taskId, d);
}

function resolveEffectiveAccountingMethodLabel(formal, taskId, d) {
  return resolveFormalAccountingMethodLabel(formal, taskId, d);
}

function accountingMethodBadge(label) {
  if (label === '—') return '<span class="badge badge-draft">—</span>';
  if (label.includes('报告法')) return `<span class="badge badge-success">${label}</span>`;
  if (label.includes('能源')) return `<span class="badge badge-warning">${label}</span>`;
  if (label.includes('产品') || label.includes('经济活动')) {
    return `<span class="badge badge-primary">${label}</span>`;
  }
  return `<span class="badge">${label}</span>`;
}

function systemAccountingMethodBadge(formal, taskId, d) {
  const label = resolveSystemAccountingMethodLabel(formal, taskId, d);
  let html = accountingMethodBadge(label);
  const platform = resolveGelanInterfacePlatformLabel(formal);
  if (platform) html += renderInterfaceSourceSubline(platform);
  return html;
}

function manualAccountingMethodBadge(formal, taskId, d) {
  return accountingMethodBadge(resolveManualAccountingMethodLabel(formal, taskId, d));
}

function formalAccountingMethodBadge(formal, taskId, d) {
  return accountingMethodBadge(resolveFormalAccountingMethodLabel(formal, taskId, d));
}

function renderFormalAccountingMethodFilterOptions(selected) {
  const opts = [{ value: '', label: '全部' }];
  if (typeof CarbonAccount !== 'undefined') {
    Object.values(CarbonAccount.METHOD_LABEL).forEach(label => opts.push({ value: label, label }));
  }
  return opts.map(o =>
    `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
}

/** @deprecated 内部收数路径仍用 collectMode；界面展示请用 resolveFormalAccountingMethodLabel */
function collectModeLabel(mode) {
  if (typeof CarbonAccount !== 'undefined' && mode === 'economy_direct') {
    return CarbonAccount.METHOD_LABEL.ECONOMY_REVENUE;
  }
  return mode === 'mandatory' ? '—' : '经济活动法';
}

function collectModeBadge(mode) {
  return mode === 'mandatory'
    ? '<span class="badge badge-warning">—</span>'
    : `<span class="badge badge-primary">${typeof CarbonAccount !== 'undefined' ? CarbonAccount.METHOD_LABEL.ECONOMY_REVENUE : '经济活动法'}</span>`;
}

/** 收集状态五档（筛选项与列表展示） */
const DATA_COLLECT_COLLECTION_STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待处理' },
  { value: 'collecting', label: '收集中' },
  { value: 'done', label: '已完成' },
  { value: 'returned', label: '已退回' }
];

/** 细粒度状态 → 五档映射（内部逻辑仍用细状态） */
const DATA_COLLECT_COLLECT_TIER_BY_DETAIL = {
  pending_lock: 'pending',
  pending_dispatch: 'pending',
  need_supplement: 'pending',
  pending_economy: 'pending',
  pending_fill: 'collecting',
  in_progress: 'collecting',
  pending_submit: 'collecting',
  entity_collected: 'done',
  economy_done: 'done',
  submitted: 'done',
  returned: 'returned'
};

const DATA_COLLECT_COLLECT_TIER_LABELS = {
  pending: ['待处理', 'badge-warning'],
  collecting: ['收集中', 'badge-running'],
  done: ['已完成', 'badge-success'],
  returned: ['已退回', 'badge-danger']
};

const DATA_COLLECT_AUDIT_STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'none', label: '未进入审核' },
  { value: 'branch_review', label: '分行初审' },
  { value: 'hq_review', label: '总行终审' },
  { value: 'approved', label: '已完成' },
  { value: 'returned', label: '已退回' }
];

/** @deprecated 兼容旧引用 */
const DATA_COLLECT_STATUS_OPTIONS = DATA_COLLECT_COLLECTION_STATUS_OPTIONS.concat(
  DATA_COLLECT_AUDIT_STATUS_OPTIONS.filter(o => o.value && !['none', 'returned'].includes(o.value))
);

/** 数据采集行统一采集状态（筛选与列表共用，不再拆分派发/直算与填报） */
function getDataCollectRowStatus(formal, supplement, taskId, d) {
  if (formal.status !== 'confirmed') return 'pending_lock';
  if (supplement) {
    if (supplement.status === 'returned') return 'returned';
    if (supplement.status === 'pending') return 'pending_fill';
    if (supplement.status === 'in_progress') return 'in_progress';
    if (supplement.status === 'completed') {
      const stage = supplement.auditStage || 'pending_fill';
      if (stage === 'approved') return 'approved';
      if (stage === 'pending_fill') return 'pending_submit';
      if (stage === 'branch_review') return 'branch_review';
      if (stage === 'hq_review') return 'hq_review';
      return 'branch_review';
    }
    return 'pending_fill';
  }
  const mode = formal.collectMode || resolveCollectMode(formal.loanType);
  if (mode === 'mandatory') return 'pending_dispatch';
  const row = typeof formalLedgerRow === 'function' && taskId ? formalLedgerRow(formal, taskId) : formal;
  if (resolveAccountingType(row) === 'project_as_project' || isProjectAccountingPending(row)) {
    return 'need_supplement';
  }
  if (formal.economyDirectStatus === 'done') return 'economy_done';
  if (taskId && typeof Store !== 'undefined') {
    const hasEntity = d && Store._formalHasEntityEmission
      ? Store._formalHasEntityEmission(d, taskId, formal)
      : Store.getFormalEntityEmission?.(taskId, formal.id) != null;
    if (hasEntity) return 'entity_collected';
  }
  if (taskId && typeof isFormalEconomyDirectEligible === 'function' && isFormalEconomyDirectEligible(formal, taskId, d)) {
    return 'pending_economy';
  }
  return 'need_supplement';
}

/** 收集状态（不含审核环节） */
function getDataCollectCollectionStatus(formal, supplement, taskId, d) {
  const full = getDataCollectRowStatus(formal, supplement, taskId, d);
  if (['branch_review', 'hq_review', 'approved'].includes(full)) return 'submitted';
  return full;
}

/** 收集状态五档（筛选项 / 列表展示） */
function getDataCollectCollectionTier(formal, supplement, taskId, d) {
  const detail = getDataCollectCollectionStatus(formal, supplement, taskId, d);
  return DATA_COLLECT_COLLECT_TIER_BY_DETAIL[detail] || 'pending';
}

function normalizeDataCollectCollectFilter(value) {
  if (!value) return '';
  const tiers = new Set(DATA_COLLECT_COLLECTION_STATUS_OPTIONS.map(o => o.value).filter(Boolean));
  if (tiers.has(value)) return value;
  return DATA_COLLECT_COLLECT_TIER_BY_DETAIL[value] || '';
}

/** 审核状态（无 supplement 或未提交时为 none） */
function getDataCollectAuditStatus(formal, supplement) {
  if (!supplement) return 'none';
  if (supplement.status === 'returned') return 'returned';
  if (supplement.status !== 'completed') return 'none';
  const stage = supplement.auditStage || 'pending_fill';
  if (stage === 'pending_fill') return 'none';
  if (stage === 'approved') return 'approved';
  if (stage === 'branch_review') return 'branch_review';
  if (stage === 'hq_review') return 'hq_review';
  return 'none';
}

function dataCollectStatusBadge(formal, supplement, taskId, d) {
  const tier = getDataCollectCollectionTier(formal, supplement, taskId, d);
  const [text, cls] = DATA_COLLECT_COLLECT_TIER_LABELS[tier] || [tier, 'badge-draft'];
  return `<span class="badge ${cls}">${text}</span>`;
}

function getDataCollectFilters(taskId) {
  try {
    return JSON.parse(sessionStorage.getItem(`data_collect_filters_${taskId}`) || '{}');
  } catch {
    return {};
  }
}

function saveDataCollectFilters(taskId, filters) {
  sessionStorage.setItem(`data_collect_filters_${taskId}`, JSON.stringify(filters || {}));
}

function filterDataCollectList(list, filters, taskId, data) {
  const f = filters || {};
  const d = data || Store.get();
  const supplementsByFormal = new Map();
  d.supplements.filter(s => s.taskId === taskId).forEach(s => supplementsByFormal.set(s.formalId, s));
  return list.filter(formal => {
    const supp = supplementsByFormal.get(formal.id);
    if (f.keyword && !(formal.customerName || '').toLowerCase().includes(f.keyword.trim().toLowerCase())) return false;
    if (f.accountingMethod) {
      const sys = resolveSystemAccountingMethodLabel(formal, taskId, d);
      const man = resolveManualAccountingMethodLabel(formal, taskId, d);
      if (sys !== f.accountingMethod && man !== f.accountingMethod) return false;
    } else if (f.collectMode) {
      const mode = formal.collectMode || resolveCollectMode(formal.loanType);
      if (mode !== f.collectMode) return false;
    }
    const collectStatus = normalizeDataCollectCollectFilter(f.collectStatus ?? f.status ?? '');
    const auditStatus = f.auditStatus ?? '';
    if (collectStatus && getDataCollectCollectionTier(formal, supp, taskId, d) !== collectStatus) return false;
    if (auditStatus && getDataCollectAuditStatus(formal, supp) !== auditStatus) return false;
    return true;
  });
}

function renderDataCollectCollectionStatusOptions(selected) {
  const normalized = normalizeDataCollectCollectFilter(selected);
  return DATA_COLLECT_COLLECTION_STATUS_OPTIONS.map(o =>
    `<option value="${o.value}" ${normalized === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
}

function renderDataCollectAuditStatusOptions(selected) {
  return DATA_COLLECT_AUDIT_STATUS_OPTIONS.map(o =>
    `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
}

function renderDataCollectStatusOptions(selected) {
  return renderDataCollectCollectionStatusOptions(selected);
}

function auditStageLabel(supp, task) {
  if (!supp) return '—';
  const stage = supp.auditStage || 'pending_fill';
  const map = {
    pending_fill: '待提交',
    branch_review: '分行初审',
    hq_review: '总行终审',
    approved: '已通过',
    rejected: '已退回'
  };
  return map[stage] || stage;
}

function auditStageBadge(supp, task) {
  if (!supp) return '<span class="badge badge-draft">—</span>';
  const stage = supp.auditStage || (supp.status === 'completed' ? 'branch_review' : 'pending_fill');
  const cls = {
    pending_fill: 'badge-draft',
    branch_review: 'badge-warning',
    hq_review: 'badge-warning',
    approved: 'badge-success',
    rejected: 'badge-danger'
  };
  return `<span class="badge ${cls[stage] || 'badge-draft'}">${auditStageLabel(supp, task)}</span>`;
}

function economyDirectStatusBadge(formal, taskId) {
  const mode = formal.collectMode || resolveCollectMode(formal.loanType);
  if (mode !== 'economy_direct') return '<span class="badge badge-draft">—</span>';
  if (formal.economyDirectStatus === 'done') return '<span class="badge badge-success">已直算</span>';
  if (formal.status !== 'confirmed') return '<span class="badge badge-draft">待锁定</span>';
  const row = typeof formalLedgerRow === 'function' ? formalLedgerRow(formal, taskId) : formal;
  const type = resolveAccountingType(row);
  if (type === 'project_as_project' || isProjectAccountingPending(row)) {
    return '<span class="badge badge-warning">须收集</span>';
  }
  if (typeof Store !== 'undefined' && Store.getFormalEntityEmission?.(taskId, formal.id) != null) {
    return '<span class="badge badge-success">已有排放</span>';
  }
  return '<span class="badge badge-warning">待直算</span>';
}

function isDataCollectAdmin(roleKey) {
  return roleKey === 'hq' || roleKey === 'branch';
}

function canAdminRejectSupplement(supp) {
  return !!supp && supp.auditStage === 'approved';
}

function canHqAdminRejectSupplement(supp, roleKey, task) {
  if (!canAdminRejectSupplement(supp)) return false;
  if (roleKey === 'hq') return true;
  if (roleKey === 'branch' && task?.initiatorOrg === 'branch') return true;
  return false;
}

function isSupplementEditableByManager(s) {
  if (!s) return false;
  if (['pending', 'in_progress', 'returned'].includes(s.status)) return true;
  if (s.status === 'completed') {
    const stage = s.auditStage || 'pending_fill';
    return stage === 'pending_fill';
  }
  return false;
}

function wasAdminRejected(s) {
  if (!s?.id) return false;
  return getSupplementApprovals(s).some(a => a.reviewLevel === 'admin' && a.status === 'rejected');
}

function renderSupplementRejectBanner(s) {
  if (!s || (s.status !== 'returned' && !s.rejectReason)) return '';
  if (wasAdminRejected(s)) {
    const reason = s.rejectReason ? `原因：${escapeHtml(s.rejectReason)}` : '';
    return `<div class="demo-tip" style="border-color:#f56c6c;background:#fef0f0;color:#c45656;margin-bottom:12px">
      该笔数据已由管理员退回，请重新填报。${reason}
    </div>`;
  }
  return `<div class="demo-tip" style="border-color:#f56c6c;background:#fef0f0;color:#c45656;margin-bottom:12px">
    该笔数据已被退回或未通过审核，请修改后重新提交。${s.rejectReason ? `原因：${escapeHtml(s.rejectReason)}` : '可在「审批流程」查看完整记录。'}
  </div>`;
}

function managerSupplementActionLabel(s) {
  if (!s) return '查看';
  if (s.status === 'returned') return '重新填报';
  if (s.status === 'pending' || s.status === 'in_progress') return '去填报';
  if (s.status === 'completed' && (s.auditStage || 'pending_fill') === 'pending_fill') return '去填报';
  if (['branch_review', 'hq_review'].includes(s.auditStage)) return '查看进度';
  if (s.auditStage === 'approved') return '查看';
  return '查看';
}

function renderManagerSupplementOp(s, opts = {}) {
  const label = managerSupplementActionLabel(s);
  const href = `#/supplement-fill?id=${s.id}`;
  const showSubmit = opts.showSubmit !== false;
  let html = `<a href="${href}" class="btn-link">${label}</a>`;
  if (showSubmit && canSubmitSupplementForReview(s)) {
    html += ` <button type="button" class="btn-link submit-review-btn" data-id="${s.id}">提交审核</button>`;
  } else if (showSubmit && ['branch_review', 'hq_review'].includes(s.auditStage)) {
    html += ` <span style="color:#909399;font-size:13px">审核中</span>`;
  }
  return html;
}

function canSubmitSupplementForReview(supp) {
  if (!supp || supp.status !== 'completed') return false;
  const stage = supp.auditStage || 'pending_fill';
  return !['approved', 'branch_review', 'hq_review'].includes(stage);
}

function reviewLevelLabel(level) {
  if (level === 'branch') return '分行初审';
  if (level === 'hq') return '总行终审';
  if (level === 'admin') return '管理员退回';
  if (level === 'submit') return '提交审核';
  return '审核';
}

function supplementActiveTab(s) {
  if (s?.activeMethodTab) {
    if (s.activeMethodTab === 'report') {
      return typeof SUPPLEMENT_FIELDS !== 'undefined'
        ? SUPPLEMENT_FIELDS.resolveReportActiveTab(s)
        : 'report_other';
    }
    return s.activeMethodTab;
  }
  const id = s?.methodId;
  if (id === 'energy') return 'energy';
  if (id === 'product') {
    if (typeof SUPPLEMENT_FIELDS !== 'undefined' && !SUPPLEMENT_FIELDS.productSupported(s)) return 'report_authority';
    return 'product';
  }
  if (id === 'economy_fallback') return 'other';
  if (id === 'economy') return 'economy';
  if (id === 'report') {
    return typeof SUPPLEMENT_FIELDS !== 'undefined'
      ? SUPPLEMENT_FIELDS.resolveReportActiveTab(s)
      : 'report_authority';
  }
  return 'report_authority';
}

function getFormalForSupplement(s) {
  if (!s?.formalId) return null;
  return Store.get().formalList.find(f => f.id === s.formalId);
}

/** 数据采集为经济法直算路径时，收集页经济活动法 Tab 展示系统预填/直算数值（只读） */
function getEconomyDirectPrefill(s) {
  if (!s?.formalId || !s.dispatchedAt) return null;
  const formal = getFormalForSupplement(s);
  if (!formal) return null;
  const mode = formal.collectMode || resolveCollectMode(formal.loanType || s.loanType);
  if (mode !== 'economy_direct') return null;
  return getEconomyDirectViewData(s);
}

function getEconomyDirectCalc(s) {
  if (!s?.formalId || !s?.taskId) return null;
  return (Store.getCalculations(s.taskId) || []).find(c => c.formalId === s.formalId && c.source === 'economy_direct') || null;
}

function getEconomyDirectViewData(s) {
  const formal = getFormalForSupplement(s);
  if (!formal) return null;
  const ecoCalc = getEconomyDirectCalc(s);
  const economyValue = s.economyValue ?? s.revenue ?? formal.operatingRevenue ?? '';
  const economyFactor = ecoCalc?.industryFactor ?? s.economyFactor ?? 2.35;
  let entityEmission = ecoCalc?.entityEmission ?? s.economyEntityEmission ?? null;
  if (entityEmission == null) {
    const v = Number(economyValue);
    const f = Number(economyFactor);
    if (v > 0 && f > 0) entityEmission = Math.round(v * f);
  }
  return {
    entityEmission,
    economyDirectStatus: formal.economyDirectStatus,
    economyDirectAt: formal.economyDirectAt || ecoCalc?.calculatedAt,
    economyValue,
    economyFactor,
    economyBasis: s.economyBasis || 'revenue',
    interfaceEconomyLocked: true,
    interfaceEconomySource: s.interfaceEconomySource
      || (ecoCalc || formal.economyDirectStatus === 'done' ? '经济活动法（系统直算）' : '经济活动法（系统预填）')
  };
}

/** 派发/同步：将正式清单上的接口数据写入收集任务（报告法可编辑预填，经济法只读） */
function applyInterfacePrefillToSupplement(s, formal, taskId) {
  if (!s || !formal) return s;
  s.fieldData = s.fieldData || {};

  if (formal.gelanPrefill || formal.gelanEntityEmission != null) {
    const gelan = formal.gelanPrefill || {};
    const ghg = gelan.ghgTotalEmission ?? formal.gelanEntityEmission;
    const source = gelan.reportSource || GELAN_REPORT_DATA_SOURCE;
    s.gelanPrefill = { ...gelan };
    s.interfaceReportSource = source;
    s.interfaceReportApi = gelan.apiSource || '格澜数据';
    s.interfaceReportPlatform = gelan.platformSource || GELAN_INTERFACE_PLATFORM;
    s.reportedEmission = ghg;
    s.disclosureChannel = source;
    s.activeMethodTab = s.activeMethodTab || 'report_other';
    s.methodId = 'report';
    s.fieldData.reportOther = {
      ...(s.fieldData.reportOther || {}),
      carbonDataYear: gelan.carbonDataYear ?? gelan.reportYear ?? '',
      ghgTotalEmission: ghg,
      emission: ghg,
      scope1Emission: gelan.scope1Emission ?? '',
      scope2Emission: gelan.scope2Emission ?? '',
      unitTotalCo2Emission: gelan.unitTotalCo2Emission ?? '',
      source,
      verified: gelan.thirdPartyVerified !== false ? 'yes' : 'no',
      attachments: s.fieldData.reportOther?.attachments || []
    };
    s.reportCarbonDataYear = s.fieldData.reportOther.carbonDataYear;
    s.reportScope1Emission = s.fieldData.reportOther.scope1Emission;
    s.reportScope2Emission = s.fieldData.reportOther.scope2Emission;
    s.reportUnitTotalCo2Emission = s.fieldData.reportOther.unitTotalCo2Emission;
  }

  const mode = formal.collectMode || resolveCollectMode(formal.loanType || s.loanType);
  if (mode === 'economy_direct') {
    const ecoCalc = Store.getCalculations(taskId).find(c => c.formalId === formal.id && c.source === 'economy_direct');
    s.interfaceEconomyLocked = true;
    s.interfaceEconomySource = ecoCalc || formal.economyDirectStatus === 'done'
      ? '经济活动法（系统直算）'
      : '经济活动法（系统预填）';
    s.economyDirectStatus = formal.economyDirectStatus;
    s.economyDirectAt = formal.economyDirectAt || ecoCalc?.calculatedAt;
    s.economyValue = s.economyValue ?? s.revenue ?? formal.operatingRevenue ?? '';
    s.economyFactor = ecoCalc?.industryFactor ?? s.economyFactor ?? 2.35;
    s.economyBasis = s.economyBasis || 'revenue';
    if (ecoCalc?.entityEmission != null) {
      s.economyEntityEmission = ecoCalc.entityEmission;
    }
  }
  ensureOtherCalcPrefill(s, formal, taskId);
  return s;
}

function getGelanReportPrefillView(s) {
  if (!s?.formalId) return null;
  const formal = getFormalForSupplement(s);
  const gelan = s.gelanPrefill || formal?.gelanPrefill;
  if (!gelan && formal?.gelanEntityEmission == null) return null;
  return {
    gelan: gelan || {},
    source: s.interfaceReportSource || gelan?.reportSource || GELAN_REPORT_DATA_SOURCE,
    api: s.interfaceReportApi || gelan?.apiSource || '格澜数据',
    platform: s.interfaceReportPlatform || gelan?.platformSource || GELAN_INTERFACE_PLATFORM,
    fetchedAt: formal?.gelanFetchedAt || gelan?.fetchedAt || ''
  };
}

function isEconomyInterfaceReadonly(s) {
  if (!s?.formalId || !s.dispatchedAt) return false;
  const formal = getFormalForSupplement(s);
  if (!formal) return false;
  const mode = formal.collectMode || resolveCollectMode(formal.loanType || s.loanType);
  return mode === 'economy_direct';
}

/** 客户经理收集：其他计算法由系统行业因子预填，不可编辑 */
function isOtherCalcReadonly(s) {
  return !!s?.dispatchedAt;
}

function resolveOtherCalcFactor(s, opts = {}) {
  if (!opts.forceLookup && s?.fallbackFactor != null && s.fallbackFactor !== '') {
    return Number(s.fallbackFactor);
  }
  if (!opts.forceLookup && s?.economyFactor != null && s.economyFactor !== '') {
    return Number(s.economyFactor);
  }
  const formal = getFormalForSupplement(s);
  const task = typeof Store !== 'undefined' ? Store.getTask(s?.taskId) : null;
  const d = typeof Store !== 'undefined' ? Store.get() : null;
  if (d && typeof Store._getIndustryFactor === 'function') {
    return Store._getIndustryFactor(
      d,
      s?.industryMajor || formal?.industryMajor,
      s?.gbIndustryCode || formal?.gbIndustryCode,
      task?.year
    );
  }
  return 2.46;
}

function ensureOtherCalcPrefill(s, formal, taskId) {
  if (!s) return s;
  if (s.fallbackFactor == null || s.fallbackFactor === '') {
    const factor = resolveOtherCalcFactor(s, { forceLookup: true });
    if (factor != null && !Number.isNaN(Number(factor))) {
      s.fallbackFactor = Number(factor);
    }
  }
  s.interfaceOtherCalcSource = s.interfaceOtherCalcSource || '行业排放因子库（系统预填）';
  return s;
}

const SUPPLEMENT_METHOD_TABS = [
  { id: 'report_authority', label: '报告法-权威数据' },
  { id: 'report_other', label: '报告法-其他' },
  { id: 'energy', label: '物理活动法-能源法' },
  { id: 'product', label: '物理活动法-产品法' },
  { id: 'economy', label: '经济活动法' },
  { id: 'other', label: '其他计算法' }
];

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function approvalStatusBadge(status) {
  const map = {
    pending: ['待审核', 'badge-warning'],
    approved: ['已通过', 'badge-success'],
    rejected: ['已退回', 'badge-danger'],
    voided: ['已作废', 'badge-draft']
  };
  const [text, cls] = map[status] || [status, 'badge-draft'];
  return `<span class="badge ${cls}">${text}</span>`;
}

function approvalStatusLabel(status) {
  return {
    pending: '待审核',
    approved: '已通过',
    rejected: '已退回',
    voided: '已作废'
  }[status] || status || '—';
}

function getSupplementApprovals(s) {
  if (!s?.id) return [];
  return (Store.get().approvals || [])
    .filter(a => a.docType === 'supplement' && a.docId === s.id)
    .sort((a, b) => {
      const ra = a.round || 0;
      const rb = b.round || 0;
      if (ra !== rb) return ra - rb;
      const ta = Date.parse(String(a.submitTime || '').replace(/-/g, '/')) || 0;
      const tb = Date.parse(String(b.submitTime || '').replace(/-/g, '/')) || 0;
      if (ta !== tb) return ta - tb;
      const order = { submit: 0, branch: 1, hq: 2, admin: 3 };
      return (order[a.reviewLevel] ?? 50) - (order[b.reviewLevel] ?? 50);
    });
}

function supplementFillDefaultTab(s) {
  if (!s) return 'fill';
  if (s.status === 'returned' || s.rejectReason) return 'approval';
  return 'fill';
}

function approvalResultLabel(status) {
  if (status === 'approved') return '通过';
  if (status === 'rejected') return '不通过';
  if (status === 'voided') return '已作废';
  return '—';
}

function renderSupplementDispatchTimelineNode(s) {
  if (!s?.dispatchedAt) return '';
  return `<div class="approval-timeline-item is-done is-dispatch">
    <div class="approval-timeline-head">
      <strong>任务派发</strong>
      <span class="badge badge-success">已完成</span>
    </div>
    <div class="approval-timeline-meta">
      <div><span class="label">派发人</span>${escapeHtml(s.dispatchedBy || '总行绿金部')}</div>
      <div><span class="label">派发时间</span>${s.dispatchedAt}</div>
      <div><span class="label">截止日期</span>${s.deadline || '—'}</div>
    </div>
  </div>`;
}

function renderSupplementApprovalTimeline(s, task) {
  const approvals = getSupplementApprovals(s);
  const dispatchNode = renderSupplementDispatchTimelineNode(s);

  const approvalItems = approvals.map(a => {
    if (a.reviewLevel === 'submit') {
      const round = a.round || 1;
      return `<div class="approval-timeline-item is-done">
        <div class="approval-timeline-head">
          <strong>提交审核（第${round}轮）</strong>
          <span class="badge badge-success">已完成</span>
        </div>
        <div class="approval-timeline-meta">
          <div><span class="label">提交人</span>${escapeHtml(a.submitter || '—')}</div>
          <div><span class="label">提交时间</span>${a.submitTime || '—'}</div>
        </div>
      </div>`;
    }
    const isCurrent = a.status === 'pending';
    const stateCls = a.status === 'voided' ? 'is-voided'
      : a.status === 'rejected' ? 'is-rejected'
      : a.status === 'approved' ? 'is-done'
      : isCurrent ? 'is-current' : '';
    const nodeTitle = reviewLevelLabel(a.reviewLevel);
    const approver = a.reviewLevel === 'admin'
      ? (a.approver || '总行管理员')
      : a.status === 'pending'
        ? approvalCurrentApproverLabel(a, task)
        : (a.approver || '—');
    const reason = (a.rejectReason || '').trim()
      || (a.status === 'rejected' && a.reviewLevel === 'admin' && s.rejectReason ? String(s.rejectReason).trim() : '');
    const currentTag = isCurrent ? '<span class="badge badge-warning approval-current-tag">当前节点</span>' : '';
    const voidTag = a.status === 'voided' ? '<span class="badge badge-draft">已作废</span>' : '';
    return `<div class="approval-timeline-item ${stateCls}">
      <div class="approval-timeline-head">
        <strong>${nodeTitle}</strong>${currentTag}${voidTag}
        ${approvalStatusBadge(a.status)}
      </div>
      <div class="approval-timeline-meta">
        ${a.reviewLevel !== 'admin' ? `<div><span class="label">提交人</span>${escapeHtml(a.submitter || '—')} · ${a.submitTime || '—'}</div>` : ''}
        <div><span class="label">${a.reviewLevel === 'admin' ? '操作人' : '审批人'}</span>${escapeHtml(approver)}</div>
        <div><span class="label">${a.reviewLevel === 'admin' ? '操作状态' : '审批状态'}</span>${approvalStatusLabel(a.status)}</div>
        <div><span class="label">${a.reviewLevel === 'admin' ? '操作结果' : '审批结果'}</span>${approvalResultLabel(a.status)}</div>
        ${a.approveTime ? `<div><span class="label">${a.reviewLevel === 'admin' ? '操作时间' : '审批时间'}</span>${a.approveTime}</div>` : ''}
        ${reason ? `<div class="approval-timeline-reason"><span class="label">${a.reviewLevel === 'admin' ? '退回原因' : '审批原因'}</span>${escapeHtml(reason)}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  const reviewApprovals = approvals.filter(a => a.reviewLevel !== 'submit');
  const items = dispatchNode + approvalItems;
  const followHint = !reviewApprovals.some(a => a.status === 'pending') && dispatchNode && !reviewApprovals.length
    ? '<p style="color:#909399;text-align:center;padding:16px 0 4px;font-size:13px">提交审核后可查看后续审批节点</p>'
    : '';
  const timelineContent = items
    ? `<div class="approval-timeline">${items}</div>${followHint}`
    : '<p style="color:#909399;text-align:center;padding:24px 0">暂无审批记录，任务派发后可在此查看流程进度</p>';
  const extra = s.rejectReason && !approvals.some(a => a.status === 'rejected')
    ? `<div class="demo-tip" style="border-color:#f56c6c;background:#fef0f0;color:#c45656;margin-top:12px">退回原因：${escapeHtml(s.rejectReason)}</div>`
    : '';

  return `<div class="card"><div class="card-header"><h3>审批流程</h3></div><div class="card-body">${timelineContent}${extra}</div></div>`;
}

function renderSupplementPageWithTabs(s, task, options = {}) {
  const defaultTab = options.defaultTab || supplementFillDefaultTab(s);
  const fillActive = defaultTab === 'fill';
  const approvalActive = defaultTab === 'approval';
  const rejectBanner = renderSupplementRejectBanner(s);
  return `
    ${rejectBanner}
    <div class="tabs tabs-segment supplement-page-tabs" id="supplementPageTabs">
      <div class="tab ${fillActive ? 'active' : ''}" data-page-tab="fill">填报内容</div>
      <div class="tab ${approvalActive ? 'active' : ''}" data-page-tab="approval">审批流程</div>
    </div>
    <div class="supplement-page-panel ${fillActive ? 'active' : ''}" data-page-panel="fill">
      ${renderSupplementFillBody(s, options)}
    </div>
    <div class="supplement-page-panel ${approvalActive ? 'active' : ''}" data-page-panel="approval">
      ${renderSupplementApprovalTimeline(s, task)}
    </div>`;
}

function bindSupplementPageTabs(rootEl) {
  const root = rootEl || document;
  qsa('#supplementPageTabs .tab', root).forEach(tab => {
    tab.onclick = () => {
      qsa('#supplementPageTabs .tab', root).forEach(x => x.classList.remove('active'));
      qsa('.supplement-page-panel', root).forEach(x => x.classList.remove('active'));
      tab.classList.add('active');
      qs(`.supplement-page-panel[data-page-panel="${tab.dataset.pageTab}"]`, root)?.classList.add('active');
    };
  });
}

/** 与收集填报页一致的表单区域（支持只读） */
function renderSupplementFillBody(s, options = {}) {
  const readonly = !!options.readonly;
  const dis = readonly ? 'disabled' : '';
  const economyPrefill = getEconomyDirectPrefill(s);
  const economyLocked = isEconomyInterfaceReadonly(s);
  const economyDis = readonly || economyLocked ? 'disabled' : dis;
  const otherCalcLocked = isOtherCalcReadonly(s);
  const otherDis = readonly || otherCalcLocked ? 'disabled' : dis;
  const gelanView = getGelanReportPrefillView(s);
  const gelanInterfaceTip = gelanView
    ? `<div class="demo-tip interface-prefill-tip report-interface-tip">
      <strong>报告法（外部接口）</strong> · 数据来源：${escapeHtml(gelanView.platform)}${gelanView.fetchedAt ? ` · 调取：${escapeHtml(gelanView.fetchedAt)}` : ''}
      ${readonly ? '' : '<br>数值与来源已预填，客户经理可核实并修改。'}
    </div>`
    : '';
  const activeTab = supplementActiveTab(s);
  const tabCls = (t) => {
    let cls = 'tab';
    if (activeTab === t) cls += ' active';
    return cls;
  };
  const panelCls = (t) => {
    let cls = 'tab-panel';
    if (activeTab === t) cls += ' active';
    return cls;
  };
  const basis = economyPrefill?.economyBasis || s.economyBasis || 'revenue';
  const economyValue = economyPrefill?.economyValue ?? s.economyValue ?? s.revenue ?? '';
  const economyFactor = economyPrefill?.economyFactor ?? s.economyFactor ?? 2.35;
  const fallbackFactor = resolveOtherCalcFactor(s);
  const otherCalcTip = otherCalcLocked
    ? `<div class="demo-tip interface-prefill-tip other-calc-interface-tip">
      <strong>其他计算法（系统数据）</strong> · ${escapeHtml(s.interfaceOtherCalcSource || '行业排放因子库（系统预填）')}
      <br>由系统按行业自动匹配排放因子，客户经理仅可查看，不可编辑。
    </div>`
    : '';
  const methodTabs = getSupplementMethodTabs(s);
  const economyEntityDisplay = economyPrefill?.entityEmission != null
    ? economyPrefill.entityEmission
    : (Number(economyValue) > 0 && Number(economyFactor) > 0 ? Math.round(Number(economyValue) * Number(economyFactor)) : null);
  const economyPrefillTip = economyPrefill
    ? `<div class="demo-tip interface-prefill-tip economy-interface-tip">
      <strong>经济活动法（系统数据）</strong> · ${escapeHtml(economyPrefill.interfaceEconomySource || '经济活动法（不可编辑）')}
      ${economyPrefill.economyDirectAt ? ` · 直算：${escapeHtml(economyPrefill.economyDirectAt)}` : ''}
      ${economyEntityDisplay != null ? ` · 主体排放：${formatNum(economyEntityDisplay)} tCO₂e` : ''}
      <br>由系统接口/直算生成，客户经理仅可查看，不可编辑。
    </div>`
    : '';

  return `
    <div class="card"><div class="card-header"><h3>企业基本信息</h3></div>
    <div class="card-body form-grid">
      ${SUPPLEMENT_FIELDS.renderBasicInfo(s, dis, !!options.editableBasicInfo && !readonly)}
    </div></div>
    <div class="card"><div class="card-header"><h3>排放数据（可同时填写多种方法）</h3></div>
    ${gelanInterfaceTip}
    <div class="tabs method-tabs-bar" id="methodTabs">
      ${methodTabs.map(t => `<div class="${tabCls(t.id)}" data-tab="${t.id}">${t.label}</div>`).join('')}
    </div>
    <div class="card-body">
      ${SUPPLEMENT_FIELDS.renderReportKindPanel(s, dis, panelCls('report_authority'), 'report_authority', 'authority')}
      ${SUPPLEMENT_FIELDS.renderReportKindPanel(s, dis, panelCls('report_other'), 'report_other', 'other')}
      ${SUPPLEMENT_FIELDS.renderEnergyPanel(s, dis, panelCls('energy'), 'energy')}
      ${SUPPLEMENT_FIELDS.renderProductPanel(s, dis, panelCls('product'), 'product')}
      <div class="${panelCls('economy')}" data-panel="economy">
        ${economyPrefillTip}
        <div class="form-grid">
        <div class="form-item"><label>测算基数</label><select id="f_economy_basis" ${economyDis}>
          <option value="revenue" ${basis === 'revenue' ? 'selected' : ''}>营业收入</option>
          <option value="assets" ${basis === 'assets' ? 'selected' : ''}>资产规模</option>
        </select></div>
        <div class="form-item"><label>基数值(万元)</label><input id="f_economy_value" type="number" value="${economyValue}" ${economyDis}></div>
        <div class="form-item"><label>行业因子</label><input id="f_economy_factor" type="number" step="0.01" value="${economyFactor}" ${economyDis}></div>
        ${economyLocked && economyEntityDisplay != null ? `<div class="form-item"><label>主体排放(tCO₂e)</label><input type="text" value="${formatNum(economyEntityDisplay)}" disabled></div>` : ''}
      </div></div>
      <div class="${panelCls('other')}" data-panel="other">
        ${otherCalcTip}
        <div class="form-grid">
        <div class="form-item"><label>行业排放因子</label><input id="f_fallback_factor" type="number" step="0.01" value="${fallbackFactor}" ${otherDis}></div>
        <div class="form-item full"><small style="color:#909399">${GUIDE.FORMULAS.attribution_fallback}（无法获取主体排放数据时使用）</small></div>
        ${SUPPLEMENT_FIELDS.renderAttachmentSection('other', s.fieldData?.other?.attachments || [], otherDis)}
      </div></div>
    </div></div>`;
}

function approvalCustomerName(approval) {
  const s = getSupplementForApproval(approval);
  if (s?.customerName) return s.customerName;
  const name = approval?.docName || '';
  return name.replace(/^数据采集-/, '') || name || '—';
}

function approvalTaskName(approval) {
  return Store.getTask(approval?.taskId)?.name || '—';
}

function approvalTaskYear(approval) {
  return Store.getTask(approval?.taskId)?.year || '—';
}

function getSupplementForApproval(approval) {
  if (!approval || approval.docType !== 'supplement') return null;
  return Store.get().supplements.find(x => x.id === approval.docId);
}

function approvalCurrentApproverLabel(approval, task) {
  if (approval.status === 'approved' || approval.status === 'rejected') {
    return approval.approver || '—';
  }
  if (approval.reviewLevel === 'branch') {
    const s = getSupplementForApproval(approval);
    return `分行绿金负责人（${s?.branch || task?.initiatorBranch || '所属分行'}）`;
  }
  if (approval.reviewLevel === 'hq') return '总行绿金部';
  return '—';
}

function approvalNextApproverLabel(approval, task) {
  if (approval.status !== 'pending') return '—';
  if (approval.reviewLevel === 'branch') {
    if (task?.initiatorOrg === 'branch') return '—（分行终审）';
    return '总行绿金部（终审）';
  }
  return '—';
}

function filterApprovalsForRole(approvals, roleKey, role, taskId) {
  let list = approvals.filter(a => !taskId || a.taskId === taskId);
  list = list.filter(a => a.reviewLevel !== 'submit');
  const d = Store.get();
  if (roleKey === 'manager') {
    return list.filter(a => {
      if (a.docType !== 'supplement') return false;
      const s = d.supplements.find(x => x.id === a.docId);
      return s && s.manager === role.user;
    });
  }
  if (roleKey === 'branch') {
    return list.filter(a => {
      if (a.docType !== 'supplement') return false;
      const s = d.supplements.find(x => x.id === a.docId);
      return s && s.branch === role.branch;
    });
  }
  if (roleKey === 'hq') {
    return list.filter(a => a.docType === 'supplement');
  }
  return list.filter(a => a.docType === 'supplement');
}

const APPROVAL_FILTER_KEY_PREFIX = 'approval_filters_';

const APPROVAL_REVIEW_LEVEL_OPTIONS = [
  { value: '', label: '全部环节' },
  { value: 'branch', label: '分行初审' },
  { value: 'hq', label: '总行终审' }
];

const APPROVAL_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已退回' }
];

function getApprovalFilters(taskId) {
  try {
    return JSON.parse(sessionStorage.getItem(`${APPROVAL_FILTER_KEY_PREFIX}${taskId}`) || '{}');
  } catch {
    return {};
  }
}

function saveApprovalFilters(taskId, filters) {
  sessionStorage.setItem(`${APPROVAL_FILTER_KEY_PREFIX}${taskId}`, JSON.stringify(filters || {}));
}

function readApprovalFilterInputs() {
  return {
    taskName: qs('#apf_taskName')?.value || '',
    year: qs('#apf_year')?.value || '',
    customerName: qs('#apf_customerName')?.value || '',
    submitter: qs('#apf_submitter')?.value || '',
    reviewLevel: qs('#apf_reviewLevel')?.value || '',
    status: qs('#apf_status')?.value || ''
  };
}

function filterApprovalList(list, filters) {
  const f = filters || {};
  let out = list || [];
  const customerKw = (f.customerName || f.docName || '').trim().toLowerCase();
  if (customerKw) {
    out = out.filter(a => approvalCustomerName(a).toLowerCase().includes(customerKw));
  }
  if (f.taskName) {
    const kw = f.taskName.trim().toLowerCase();
    if (kw) out = out.filter(a => String(approvalTaskName(a)).toLowerCase().includes(kw));
  }
  if (f.year) {
    const kw = f.year.trim();
    if (kw) out = out.filter(a => String(approvalTaskYear(a)).includes(kw));
  }
  if (f.submitter) {
    const kw = f.submitter.trim().toLowerCase();
    if (kw) out = out.filter(a => (a.submitter || '').toLowerCase().includes(kw));
  }
  if (f.reviewLevel) out = out.filter(a => a.reviewLevel === f.reviewLevel);
  if (f.status) out = out.filter(a => a.status === f.status);
  return out;
}

function renderApprovalFilterOptions(options, selected) {
  return options.map(o =>
    `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
}

function renderApprovalFilterPanel(filters) {
  const f = filters || {};
  const customerName = f.customerName || f.docName || '';
  return `
    <div class="filter-panel approval-filter-panel">
      <div class="filter-extra approval-filter-grid">
        <div class="form-item"><label>任务名称</label>
          <input id="apf_taskName" type="search" value="${escapeHtml(f.taskName || '')}" placeholder="模糊搜索"></div>
        <div class="form-item"><label>核算年度</label>
          <input id="apf_year" type="search" value="${escapeHtml(f.year || '')}" placeholder="如 2025"></div>
        <div class="form-item"><label>客户名称</label>
          <input id="apf_customerName" type="search" value="${escapeHtml(customerName)}" placeholder="模糊搜索"></div>
        <div class="form-item"><label>提交人</label>
          <input id="apf_submitter" type="search" value="${escapeHtml(f.submitter || '')}" placeholder="提交人姓名"></div>
        <div class="form-item"><label>审核环节</label>
          <select id="apf_reviewLevel">${renderApprovalFilterOptions(APPROVAL_REVIEW_LEVEL_OPTIONS, f.reviewLevel || '')}</select></div>
        <div class="form-item"><label>审核状态</label>
          <select id="apf_status">${renderApprovalFilterOptions(APPROVAL_STATUS_OPTIONS, f.status || '')}</select></div>
        <div class="form-item filter-actions">
          <label>&nbsp;</label>
          <div class="filter-action-btns">
            <button type="button" class="btn btn-primary" id="approvalFilterBtn">查询</button>
            <button type="button" class="btn" id="approvalFilterResetBtn">重置</button>
          </div>
        </div>
      </div>
    </div>`;
}

const MANAGER_TASK_FILTER_KEY_PREFIX = 'manager_task_filters_';

const MANAGER_TASK_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待填报' },
  { value: 'in_progress', label: '填报中' },
  { value: 'pending_submit', label: '待提交' },
  { value: 'reviewing', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'returned', label: '已退回' }
];

function getManagerTaskDisplayStatus(s) {
  if (!s) return '';
  if (s.status === 'returned' || s.auditStage === 'rejected') return 'returned';
  if (s.status === 'pending') return 'pending';
  if (s.status === 'in_progress') return 'in_progress';
  if (s.status === 'completed') {
    const stage = s.auditStage || 'pending_fill';
    if (stage === 'approved') return 'approved';
    if (stage === 'branch_review' || stage === 'hq_review') return 'reviewing';
    return 'pending_submit';
  }
  return s.status || '';
}

function getManagerTaskFilters(taskId) {
  try {
    return JSON.parse(sessionStorage.getItem(`${MANAGER_TASK_FILTER_KEY_PREFIX}${taskId}`) || '{}');
  } catch {
    return {};
  }
}

function saveManagerTaskFilters(taskId, filters) {
  sessionStorage.setItem(`${MANAGER_TASK_FILTER_KEY_PREFIX}${taskId}`, JSON.stringify(filters || {}));
}

function readManagerTaskFilterInputs() {
  return {
    customerName: qs('#mtf_customer')?.value || '',
    status: qs('#mtf_status')?.value || ''
  };
}

function filterManagerTaskList(list, filters) {
  const f = filters || {};
  let out = list || [];
  if (f.customerName) {
    const kw = f.customerName.trim().toLowerCase();
    if (kw) out = out.filter(s => (s.customerName || '').toLowerCase().includes(kw));
  }
  if (f.status) out = out.filter(s => getManagerTaskDisplayStatus(s) === f.status);
  return out;
}

function renderManagerTaskFilterOptions(options, selected) {
  return options.map(o =>
    `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
}

function renderManagerTaskFilterPanel(filters) {
  const f = filters || {};
  return `
    <div class="filter-panel">
      <div class="filter-extra task-filter-grid">
        <div class="form-item"><label>客户名称</label>
          <input id="mtf_customer" type="search" value="${escapeHtml(f.customerName || '')}" placeholder="模糊搜索"></div>
        <div class="form-item"><label>状态</label>
          <select id="mtf_status">${renderManagerTaskFilterOptions(MANAGER_TASK_STATUS_OPTIONS, f.status || '')}</select></div>
        <div class="form-item"><label>&nbsp;</label>
          <div style="display:flex;gap:8px">
            <button type="button" class="btn btn-primary" id="managerTaskFilterBtn">查询</button>
            <button type="button" class="btn" id="managerTaskFilterResetBtn">重置</button>
          </div>
        </div>
      </div>
    </div>`;
}

function canUserReviewApproval(approval, roleKey) {
  if (!approval || approval.status !== 'pending') return false;
  if (approval.docType !== 'supplement') return false;
  if (approval.reviewLevel === 'branch') return roleKey === 'branch';
  if (approval.reviewLevel === 'hq') return roleKey === 'hq';
  return false;
}

function getSupplementIndustryContext(s) {
  const formal = getFormalForSupplement(s);
  const candidate = Store.get().candidates.find(c => c.id === (s.customerId || formal?.customerId));
  return {
    industryMajor: s.industryMajor || formal?.industryMajor || candidate?.industryMajor || '-',
    gbIndustryCode: s.gbIndustryCode || formal?.gbIndustryCode || candidate?.gbIndustryCode || '',
    gbIndustryName: s.gbIndustryName || formal?.gbIndustryName || candidate?.gbIndustryName || '',
    formal,
    candidate
  };
}

function renderGbIndustrySelectOptions(industryMajor, selectedCode) {
  const list = (typeof INDUSTRY_TABLE !== 'undefined' ? INDUSTRY_TABLE : [])
    .filter(row => !industryMajor || industryMajor === '-' || row.major === industryMajor);
  const opts = ['<option value="">请选择 GB/T 4754 四级行业</option>']
    .concat(list.map(row =>
      `<option value="${row.code}" data-name="${escapeHtml(row.name)}" data-major="${row.major}" ${selectedCode === row.code ? 'selected' : ''}>${row.code} ${row.name}</option>`
    ));
  return opts.join('');
}

function listAuditFactorOptions(s, task) {
  const ctx = getSupplementIndustryContext(s);
  const factors = Store.get().factors || [];
  const taskYear = task?.year;
  const methodIds = [];
  if (s.economyValue || s.fieldData?.economy || s.methodId === 'economy' || s.economyFactor) methodIds.push('economy');
  if (s.fallbackFactor || s.fieldData?.other || s.methodId === 'economy_fallback') methodIds.push('economy');
  if (s.energyTotalEmission || s.fieldData?.energy || s.methodId === 'energy') methodIds.push('energy');
  if (s.productTotalEmission || s.fieldData?.product || s.methodId === 'product') methodIds.push('product');
  if (!methodIds.length) methodIds.push('economy');
  const unique = [...new Set(methodIds)];
  const out = {};
  unique.forEach(methodId => {
    let pool = typeof filterFactors === 'function'
      ? filterFactors(factors, {
        methodIds: [methodId],
        industries: ctx.industryMajor && ctx.industryMajor !== '-' ? [ctx.industryMajor] : []
      })
      : factors.filter(x => x.methodId === methodId);
    if (ctx.gbIndustryCode) {
      const byCode = pool.filter(x => x.gbCode === ctx.gbIndustryCode);
      if (byCode.length) pool = byCode;
    }
    pool = pool.filter(x => x.value != null && x.valueType !== 'custom');
    const groups = typeof groupFactorRecords === 'function' ? groupFactorRecords(pool) : [];
    out[methodId] = groups.map(g =>
      typeof pickFactorVersion === 'function' ? pickFactorVersion(g.versions, taskYear) : g.latest
    ).filter(Boolean);
  });
  return out;
}

function resolveSupplementAuditFactorValue(s, task) {
  if (s.auditFactorValue != null && s.auditFactorValue !== '') return Number(s.auditFactorValue);
  if (s.auditFactorId) {
    const f = Store.getFactor(s.auditFactorId);
    if (f?.value != null) return Number(f.value);
  }
  const ctx = getSupplementIndustryContext(s);
  return Store._getIndustryFactor(Store.get(), ctx.industryMajor, ctx.gbIndustryCode, task?.year);
}

function renderAuditFactorMethodSection(methodId, factors, s, task, editable) {
  const dis = editable ? '' : 'disabled';
  const label = typeof factorMethodLabel === 'function' ? factorMethodLabel(methodId) : methodId;
  const currentId = s.auditFactorMethodId === methodId ? (s.auditFactorId || '') : '';
  const currentVal = methodId === 'economy'
    ? (s.economyFactor ?? resolveSupplementAuditFactorValue(s, task))
    : (s.fallbackFactor ?? s.economyFactor ?? resolveSupplementAuditFactorValue(s, task));
  const opts = ['<option value="">系统默认匹配</option>'].concat(
    (factors || []).map(f =>
      `<option value="${f.id}" ${currentId === f.id ? 'selected' : ''}>${escapeHtml(typeof factorDisplayName === 'function' ? factorDisplayName(f) : f.id)} · ${formatFactorValue(f)} ${f.unit || ''}</option>`
    )
  ).join('');
  return `
    <div class="audit-factor-method-block" data-method="${methodId}">
      <div class="form-item"><label>${label} · 选用因子</label>
        <select class="audit-factor-select" data-method="${methodId}" ${dis}>${opts}</select></div>
      <div class="form-item"><label>因子数值</label>
        <input class="audit-factor-value" data-method="${methodId}" type="number" step="0.000001" value="${currentVal ?? ''}" ${dis}></div>
    </div>`;
}

/** 审核页：归属行业与排放因子调整（总行/分行审核可用） */
function renderApprovalAuditAdjustPanel(s, task, options = {}) {
  const editable = !!options.editable;
  const ctx = getSupplementIndustryContext(s);
  const dis = editable ? '' : 'disabled';
  const majorOpts = GUIDE.INDUSTRIES.map(i =>
    `<option value="${i.major}" ${ctx.industryMajor === i.major ? 'selected' : ''}>${i.major}</option>`
  ).join('');
  const factorOptions = listAuditFactorOptions(s, task);
  const factorSections = Object.keys(factorOptions).map(methodId =>
    renderAuditFactorMethodSection(methodId, factorOptions[methodId], s, task, editable)
  ).join('');
  const industryDisplay = ctx.gbIndustryCode
    ? `${ctx.industryMajor} · ${ctx.gbIndustryCode} ${ctx.gbIndustryName}`
    : (ctx.industryMajor && ctx.industryMajor !== '-' ? ctx.industryMajor : '未设置');
  const adjustMeta = s.auditAdjustedAt
    ? `<div class="demo-tip" style="margin-top:8px;font-size:12px">最近调整：${escapeHtml(s.auditAdjustedBy || '—')} · ${escapeHtml(s.auditAdjustedAt)}</div>`
    : '';
  const actionBar = editable
    ? `<div class="audit-adjust-actions">
      <button type="button" class="btn btn-sm btn-danger" id="auditClearIndustryBtn">删除归属行业</button>
      <button type="button" class="btn btn-sm" id="auditResetFactorBtn">恢复默认因子</button>
      <button type="button" class="btn btn-sm btn-primary" id="auditSaveAdjustBtn">保存调整</button>
    </div>`
    : '';
  return `
    <div class="card audit-adjust-panel" id="approvalAuditAdjustPanel" data-supplement-id="${s.id}">
      <div class="card-header"><h3>审核调整</h3>
        <span style="font-size:12px;color:#909399">${editable ? '可删除/调整归属行业及适用排放因子' : '审核调整记录（只读）'}</span></div>
      <div class="card-body">
        <div class="demo-tip audit-adjust-tip">总行、分行审核时可修正企业<strong>归属行业</strong>及<strong>适用碳排放因子</strong>，保存后同步至正式清单与收集任务。</div>
        ${!editable ? `<p style="margin:0 0 12px;color:#606266">当前归属行业：<strong>${escapeHtml(industryDisplay)}</strong></p>` : ''}
        <div class="form-grid audit-adjust-grid">
          <div class="form-item"><label>八大高碳行业</label>
            <select id="auditIndustryMajor" ${dis}>
              <option value="" ${!ctx.industryMajor || ctx.industryMajor === '-' ? 'selected' : ''}>未设置</option>
              ${majorOpts}
            </select></div>
          <div class="form-item"><label>GB/T 4754 四级行业</label>
            <select id="auditGbIndustryCode" ${dis}>${renderGbIndustrySelectOptions(ctx.industryMajor, ctx.gbIndustryCode)}</select></div>
        </div>
        <div class="form-section-title" style="margin-top:16px">适用碳排放因子</div>
        <div class="form-grid audit-factor-grid">${factorSections || '<p style="color:#909399">暂无匹配因子，请先设置归属行业</p>'}</div>
        ${actionBar}
        ${adjustMeta}
      </div>
    </div>`;
}

function readApprovalAuditAdjustForm(rootEl) {
  const root = rootEl || document;
  const major = qs('#auditIndustryMajor', root)?.value || '';
  const gbSel = qs('#auditGbIndustryCode', root);
  const gbCode = gbSel?.value || '';
  const gbName = gbSel?.selectedOptions?.[0]?.dataset?.name || '';
  const factorBlocks = qsa('.audit-factor-method-block', root);
  let factorId = '';
  let factorMethodId = '';
  let factorValue = null;
  factorBlocks.forEach(block => {
    const methodId = block.dataset.method;
    const sel = qs('.audit-factor-select', block);
    const valInput = qs('.audit-factor-value', block);
    if (sel?.value) {
      factorId = sel.value;
      factorMethodId = methodId;
    }
    if (valInput?.value !== '' && valInput?.value != null) {
      factorValue = Number(valInput.value);
      if (!factorMethodId) factorMethodId = methodId;
    }
  });
  return {
    industryMajor: major || '-',
    gbIndustryCode: gbCode,
    gbIndustryName: gbName,
    factorId,
    factorMethodId,
    factorValue
  };
}

function bindApprovalAuditAdjustPanel(rootEl, supplementId) {
  const root = rootEl || qs('#viewRoot');
  const majorSel = qs('#auditIndustryMajor', root);
  const gbSel = qs('#auditGbIndustryCode', root);
  if (majorSel && gbSel) {
    majorSel.addEventListener('change', () => {
      const major = majorSel.value || '-';
      gbSel.innerHTML = renderGbIndustrySelectOptions(major, '');
    });
  }
  qs('#auditClearIndustryBtn', root)?.addEventListener('click', () => {
    if (!confirm('确认删除当前归属行业设置？删除后需重新选择行业与因子。')) return;
    Store.applyApprovalAuditAdjustments(supplementId, { clearIndustry: true, clearFactor: true });
    toast('已删除归属行业并恢复默认因子', 'success');
    route();
  });
  qs('#auditResetFactorBtn', root)?.addEventListener('click', () => {
    Store.applyApprovalAuditAdjustments(supplementId, { clearFactor: true });
    toast('已恢复系统默认因子匹配', 'success');
    route();
  });
  qs('#auditSaveAdjustBtn', root)?.addEventListener('click', () => {
    const data = readApprovalAuditAdjustForm(root);
    Store.applyApprovalAuditAdjustments(supplementId, data);
    toast('审核调整已保存', 'success');
    route();
  });
}

/** 审核页底部操作栏（审核模式） */
function renderApprovalReviewActions(canReview, approval, task) {
  if (!canReview) {
    return `<div style="padding:12px 20px;border-top:1px solid #eee;text-align:right">
      <button class="btn" onclick="location.hash='#/approvals'">返回列表</button>
    </div>`;
  }
  const showRejectToBranch = approval?.reviewLevel === 'hq'
    && task?.initiatorOrg !== 'branch'
    && approval?.docType === 'supplement';
  const rejectToBranchBtn = showRejectToBranch
    ? `<button type="button" class="btn" id="approvalRejectToBranchBtn">退回到分行</button>`
    : '';
  return `<div style="padding:16px 20px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:10px;background:#fff;margin-top:16px">
    <button type="button" class="btn btn-success" id="approvalApproveBtn">审核通过</button>
    ${rejectToBranchBtn}
    <button type="button" class="btn btn-danger" id="approvalRejectBtn">退回至客户经理</button>
    <button type="button" class="btn" id="approvalLocalFixBtn">本级修正</button>
    <button type="button" class="btn" id="approvalCancelBtn">取消</button>
  </div>`;
}

function ensureApprovalConfirmModal() {
  if (qs('#approvalConfirmModal')) return qs('#approvalConfirmModal');
  const root = qs('#modalRoot');
  if (!root) return null;
  root.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="approvalConfirmModal">
      <div class="modal">
        <div class="modal-header"><h4 id="approvalConfirmTitle">确认审核</h4>
          <button type="button" class="modal-close" id="closeApprovalConfirm">&times;</button></div>
        <div class="modal-body">
          <p id="approvalConfirmMessage"></p>
          <div class="form-item" id="approvalConfirmReasonWrap" style="margin-top:12px;display:none">
            <label>审核原因</label>
            <textarea id="approvalConfirmReason" rows="3" placeholder="请填写退回原因" style="width:100%"></textarea>
          </div>
          <div id="approvalConfirmMethodWrap" style="margin-top:12px;display:none">
            <div id="approvalConfirmMethodList" class="method-select-list"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn" id="approvalConfirmCancelBtn">取消</button>
          <button type="button" class="btn btn-primary" id="approvalConfirmOkBtn">确认</button>
        </div>
      </div>
    </div>`);
  qs('#closeApprovalConfirm').onclick = () => hideModal('approvalConfirmModal');
  qs('#approvalConfirmCancelBtn').onclick = () => hideModal('approvalConfirmModal');
  return qs('#approvalConfirmModal');
}

function openApprovalActionConfirm(type, onConfirm, options = {}) {
  if (!ensureApprovalConfirmModal()) return;
  const isApprove = type === 'approve';
  qs('#approvalConfirmTitle').textContent = options.title || (isApprove ? '审核通过' : '退回至客户经理');
  qs('#approvalConfirmMessage').textContent = options.message || (isApprove ? '是否确认审核通过？' : '是否确认退回至客户经理？');
  const reasonWrap = qs('#approvalConfirmReasonWrap');
  const methodWrap = qs('#approvalConfirmMethodWrap');
  const reasonInput = qs('#approvalConfirmReason');
  reasonWrap.style.display = isApprove ? 'none' : 'block';
  if (methodWrap) methodWrap.style.display = 'none';
  reasonInput.value = '';
  const okBtn = qs('#approvalConfirmOkBtn');
  okBtn.className = isApprove ? 'btn btn-success' : 'btn btn-danger';
  okBtn.textContent = '确认';
  okBtn.onclick = () => {
    if (!isApprove) {
      const reason = (reasonInput.value || '').trim();
      if (!reason) {
        toast('请填写退回原因', 'warning');
        reasonInput.focus();
        return;
      }
      hideModal('approvalConfirmModal');
      onConfirm(false, reason);
      return;
    }
    hideModal('approvalConfirmModal');
    onConfirm(true);
  };
  showModal('approvalConfirmModal');
  if (!isApprove) setTimeout(() => reasonInput.focus(), 100);
}

/** 分行审核收集单据通过：须单选核算方法 */
function openSupplementMethodApprovalConfirm(approval, onConfirm) {
  if (!ensureApprovalConfirmModal()) return;
  const supplement = getSupplementForApproval(approval);
  const tabs = getSupplementMethodTabs(supplement || {});
  const defaultTabId = supplement?.activeMethodTab || supplementActiveTab(supplement || {});
  qs('#approvalConfirmTitle').textContent = '审核通过';
  qs('#approvalConfirmMessage').textContent = '请您选择要使用的核算方法：';
  qs('#approvalConfirmReasonWrap').style.display = 'none';
  const methodWrap = qs('#approvalConfirmMethodWrap');
  const methodList = qs('#approvalConfirmMethodList');
  methodWrap.style.display = 'block';
  methodList.innerHTML = tabs.map(t => {
    const checked = defaultTabId === t.id ? ' checked' : '';
    return `<label class="method-select-option"><input type="radio" name="approvalMethodTab" value="${t.id}"${checked}> ${t.label}</label>`;
  }).join('');
  const okBtn = qs('#approvalConfirmOkBtn');
  okBtn.className = 'btn btn-success';
  okBtn.textContent = '确认通过';
  okBtn.onclick = () => {
    const tabId = qs('input[name="approvalMethodTab"]:checked')?.value;
    if (!tabId) {
      toast('请选择核算方法', 'warning');
      return;
    }
    hideModal('approvalConfirmModal');
    onConfirm(true, undefined, {
      selectedMethodId: supplementTabToMethodId(tabId),
      activeMethodTab: tabId
    });
  };
  showModal('approvalConfirmModal');
}

function bindSupplementMethodTabs(readonly, rootEl) {
  const root = rootEl || document;
  qsa('#methodTabs .tab', root).forEach(tab => {
    tab.onclick = () => {
      qsa('#methodTabs .tab', root).forEach(x => x.classList.remove('active'));
      qsa('.tab-panel', root).forEach(x => x.classList.remove('active'));
      tab.classList.add('active');
      qs(`.tab-panel[data-panel="${tab.dataset.tab}"]`, root)?.classList.add('active');
    };
  });
  if (typeof SUPPLEMENT_FIELDS !== 'undefined' && SUPPLEMENT_FIELDS.bindRepeatableLists) {
    SUPPLEMENT_FIELDS.bindRepeatableLists(root, readonly);
  }
}

function candidateBorrowerType(c) {
  if (c.borrowerType) return c.borrowerType;
  if (c.isIndividual) return '个体工商户';
  if (c.isOverseas) return '境外主体';
  if (c.isSme) return '小微企业';
  return '有限责任公司';
}

function candidateProductType(c) {
  if (!c) return '-';
  return c.productType || c.loanType || '-';
}

function candidateIndustryLabel(c) {
  if (c.industryLabel) return c.industryLabel;
  if (c.gbIndustryCode && c.gbIndustryName) return `${c.gbIndustryCode} ${c.gbIndustryName}`;
  return c.industryMajor || '-';
}

/** 投向行业：优先取项目明细中的项目所属行业（国标代码） */
function candidateInvestIndustryCode(c) {
  const details = getCandidateProjectDetails(c);
  if (details.length) {
    const p = details[0];
    if (p.nationalIndustryCodeLv4) return p.nationalIndustryCodeLv4;
  }
  return c.gbIndustryCode || '';
}

/** 投向行业展示：与列表项目所属行业一致 */
function candidateInvestIndustryLabel(c) {
  const details = getCandidateProjectDetails(c);
  if (details.length) {
    const p = details[0];
    const code = p.nationalIndustryCodeLv4 || c.gbIndustryCode;
    const name = p.projectIndustry || c.gbIndustryName || c.industryMajor;
    if (code && name) return `${code} ${name}`;
    return p.projectIndustry || candidateIndustryLabel(c);
  }
  return candidateIndustryLabel(c);
}

/** 解析核算类型 id（采集中项目类且无项目信息时返回 null，待收集定档） */
function resolveAccountingType(c) {
  if (!c) return null;
  const explicit = c.accountingType;
  if (explicit === 'project_pending') {
    /* 兼容旧数据：按当前字段重新解析 */
  } else if (explicit && GUIDE.ACCOUNTING_TYPES.some(t => t.id === explicit)) {
    return explicit;
  }
  const isProject = candidateIsProjectType(c);
  if (!isProject) return 'non_project';
  const hasProjectDetails = Array.isArray(c.projectDetails) && c.projectDetails.length > 0;
  const hasProjectInfo = hasProjectDetails || c.projectInfoAvailable === true || !!c.projectInfo;
  if (hasProjectInfo) return 'project_as_project';
  if (c.projectInfoAvailable === false) return 'project_as_non_project';
  return null;
}

/** 项目类业务尚未确定核算路径（无项目信息且未声明不可提供） */
function isProjectAccountingPending(c) {
  return candidateIsProjectType(c) && resolveAccountingType(c) == null;
}

/** 核算类型终态：排放计算及以后仅三档（待定项归并为「以非项目方式计算」） */
function finalizeAccountingType(c) {
  const resolved = resolveAccountingType(c);
  if (resolved) return resolved;
  if (candidateIsProjectType(c)) return 'project_as_non_project';
  return 'non_project';
}

function candidateAccountingTypeLabel(c, options = {}) {
  const id = options.finalizeAccountingType ? finalizeAccountingType(c) : resolveAccountingType(c);
  if (!id) return options.pendingLabel ?? '—';
  const item = GUIDE.ACCOUNTING_TYPES.find(t => t.id === id);
  return item ? item.label : '—';
}

function candidateIsProjectType(c) {
  if (!c) return false;
  return c.bizType === 'project'
    || ['项目贷款', '一般性固定资产贷款', '出口退税账户托管贷款'].includes(candidateProductType(c));
}

function normalizeProjectDetailFromCandidate(c, index = 0) {
  const idSeed = `${(c.id || 'P').replace(/\W/g, '').slice(-6)}${String(index + 1).padStart(2, '0')}`;
  return {
    projectNo: c.projectNo || ('PRJ' + idSeed),
    projectName: c.projectName || `${c.customerName || '项目'}-${candidateProductType(c)}`,
    projectProvince: c.projectProvince || c.projectRegion || candidateTier1Branch(c).replace('分行', '') || '-',
    projectIndustry: c.projectIndustry || c.industryMajor || '-',
    customerNo: c.customerNo || ('CUST' + String(c.id || idSeed).replace(/\W/g, '').slice(-8)),
    customerName: c.customerName || '-',
    creditCode: c.creditCode || '-',
    nationalIndustryCodeLv4: c.nationalIndustryCodeLv4 || c.gbIndustryCode || '-',
    projectAvgLoanBalanceWan: c.projectAvgLoanBalanceWan ?? c.avgMonthlyBalance ?? '-',
    projectRevenueWan: c.projectRevenueWan ?? c.operatingRevenue ?? c.revenue ?? '-',
    projectTotalInvestmentWan: c.projectTotalInvestmentWan ?? c.totalInvestmentWan ?? '-'
  };
}

function getCandidateProjectDetails(c) {
  if (!candidateIsProjectType(c)) return [];
  if (Array.isArray(c.projectDetails) && c.projectDetails.length) {
    return c.projectDetails.map((p, i) => ({ ...normalizeProjectDetailFromCandidate(c, i), ...p }));
  }
  return [normalizeProjectDetailFromCandidate(c)];
}

/** 正式清单/碳账户：解析项目明细（优先 formal → 候选 → 由 projectName 合成） */
function resolveFormalProjectDetails(formal, cand) {
  if (Array.isArray(formal?.projectDetails) && formal.projectDetails.length) {
    return formal.projectDetails.map((p, i) => ({
      ...normalizeProjectDetailFromCandidate({ ...formal, ...(cand || {}), customerName: p.customerName || formal.customerName }, i),
      ...p
    }));
  }
  if (Array.isArray(cand?.projectDetails) && cand.projectDetails.length) {
    return cand.projectDetails.map((p, i) => ({
      ...normalizeProjectDetailFromCandidate(cand, i),
      ...p
    }));
  }
  const isProject = formal?.bizType === 'project' || formal?.objectType === '项目' ||
    cand?.bizType === 'project' || candidateIsProjectType(formal) || candidateIsProjectType(cand);
  if (!isProject) return [];
  const projectName = formal?.projectName || cand?.projectName;
  if (!projectName) return [];
  const base = { ...cand, ...formal, projectName, customerName: formal?.customerName || cand?.customerName };
  return [normalizeProjectDetailFromCandidate(base, 0)];
}

function getCandidateProjectExpandedSet(taskId) {
  try {
    const raw = sessionStorage.getItem(`candidate_project_expanded_${taskId}`) || '[]';
    const ids = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

function toggleCandidateProjectExpanded(taskId, candidateId) {
  const set = getCandidateProjectExpandedSet(taskId);
  if (set.has(candidateId)) set.delete(candidateId);
  else set.add(candidateId);
  sessionStorage.setItem(`candidate_project_expanded_${taskId}`, JSON.stringify(Array.from(set)));
}

const CA_PROJECT_EXPANDED_KEY = 'ca_project_expanded';

function getCaProjectExpandedSet() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(CA_PROJECT_EXPANDED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function toggleCaProjectExpanded(accountId) {
  const set = getCaProjectExpandedSet();
  if (set.has(accountId)) set.delete(accountId);
  else set.add(accountId);
  sessionStorage.setItem(CA_PROJECT_EXPANDED_KEY, JSON.stringify(Array.from(set)));
}

function getCarbonAccountProjectDetails(acc) {
  if (!acc?.projectDetails?.length) return [];
  return acc.projectDetails.map((p, i) => ({
    ...normalizeProjectDetailFromCandidate({ customerName: acc.customerName }, i),
    ...p
  }));
}

function renderCaProjectDetailRow(acc, colspan = 10) {
  const details = getCarbonAccountProjectDetails(acc);
  if (!details.length) return '';
  return `<tr class="project-detail-row">
    <td colspan="${colspan}">
      <div class="project-detail-wrap">
        <div class="project-detail-title">项目明细（项目信息客户名称）</div>
        <div class="table-wrap">
          <table class="data-table project-detail-table">
            <thead><tr>
              <th>序号</th><th>项目号</th><th>项目名称</th><th>客户名称</th><th>统一社会信用代码</th>
              <th>项目所属行业</th><th>项目月均贷款余额（万元）</th><th>项目收入（万元）</th>
            </tr></thead>
            <tbody>${details.map((p, i) => `<tr>
              <td>${i + 1}</td>
              <td>${p.projectNo || '-'}</td>
              <td>${p.projectName || '-'}</td>
              <td>${p.customerName || '-'}</td>
              <td>${p.creditCode || '-'}</td>
              <td>${p.projectIndustry || '-'}</td>
              <td>${p.projectAvgLoanBalanceWan ?? '-'}</td>
              <td>${p.projectRevenueWan ?? '-'}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </td>
  </tr>`;
}

function renderCarbonAccountNameCell(acc, expandedSet) {
  const hasProjects = Array.isArray(acc.projectDetails) && acc.projectDetails.length > 0;
  if (!hasProjects) return acc.customerName || '-';
  const expanded = expandedSet.has(acc.id);
  return `<span class="ca-name-cell">
    <button type="button" class="candidate-expand-toggle ${expanded ? 'is-expanded' : ''}" data-ca-expand="${acc.id}" aria-expanded="${expanded ? 'true' : 'false'}" title="${expanded ? '收起项目明细' : '展开项目明细'}"><span class="candidate-expand-icon" aria-hidden="true"></span></button>
    ${acc.customerName || '-'}
  </span>`;
}

/** 碳账户档案页：解析展示用客户号、方法、主体排放及收集视图 */
function resolveCarbonAccountProfileRow(d, acc, year, subProjectNo) {
  const yearStr = String(year || '');
  let metrics = typeof CarbonAccount !== 'undefined'
    ? CarbonAccount.resolveYearMetrics(d, acc, yearStr)
    : { customerNo: '-', method: '-', entityEmission: null };
  if (subProjectNo) {
    const sub = (acc.projectSubAccounts || []).find(x => String(x.projectNo) === String(subProjectNo));
    const project = (acc.projectDetails || []).find(p => String(p.projectNo) === String(subProjectNo));
    const subProfile = sub?.annualProfiles?.[yearStr] || {};
    metrics = {
      ...metrics,
      customerNo: project?.customerNo || sub?.customerNo || metrics.customerNo,
      customerName: project?.customerName || project?.projectName || acc.customerName,
      creditCode: project?.creditCode || acc.creditCode,
      entityEmission: subProfile.entityEmission ?? metrics.entityEmission,
      method: subProfile.methodLabel || subProfile.method || metrics.methodLabel || metrics.method,
      methodId: subProfile.methodId || metrics.methodId
    };
  }
  return {
    customerName: metrics.customerName || acc.customerName || '-',
    creditCode: metrics.creditCode || acc.creditCode || '-',
    customerNo: metrics.customerNo || '-',
    method: metrics.methodLabel || metrics.method || '-',
    entityEmission: metrics.entityEmission,
    metrics
  };
}

/** 构建碳账户档案页「客户经理收集数据」视图对象（优先碳账户本地快照） */
function buildCarbonAccountSupplementView(d, acc, year, subProjectNo) {
  const yearStr = String(year || '');
  let supplementSnapshot = acc.annualProfiles?.[yearStr]?.supplementSnapshot;
  if (subProjectNo) {
    const sub = (acc.projectSubAccounts || []).find(x => String(x.projectNo) === String(subProjectNo));
    supplementSnapshot = sub?.annualProfiles?.[yearStr]?.supplementSnapshot || supplementSnapshot;
  }
  if (supplementSnapshot) {
    const m = Store.matchMethod(supplementSnapshot);
    const methodId = supplementSnapshot.methodId || m?.id || 'report';
    return {
      ...supplementSnapshot,
      methodId,
      activeMethodTab: supplementSnapshot.activeMethodTab || supplementActiveTab({ ...supplementSnapshot, methodId })
    };
  }
  const formal = (d.formalList || []).find(f => f.id === acc.formalId);
  const profile = resolveCarbonAccountProfileRow(d, acc, year, subProjectNo);
  const supp = (d.supplements || []).find(s => s.formalId === acc.formalId && s.taskId === acc.taskId);
  if (supp) {
    const m = Store.matchMethod(supp);
    return {
      ...supp,
      methodId: supp.methodId || m?.id || profile.metrics?.methodId || 'report',
      activeMethodTab: supplementActiveTab({ ...supp, methodId: supp.methodId || m?.id })
    };
  }
  const calc = profile.metrics?.calc || (d.calculations || []).find(c =>
    c.formalId === acc.formalId && c.taskId === acc.taskId
  );
  const base = {
    formalId: acc.formalId,
    taskId: acc.taskId,
    customerName: profile.customerName,
    creditCode: profile.creditCode,
    loanType: formal?.loanType || acc.loanType,
    bizType: formal?.bizType || acc.bizType,
    industryMajor: acc.industryMajor,
    avgLoanBalance: calc?.avgBalance,
    revenue: calc?.avgBalance,
    totalAssets: calc?.totalAssets
  };
  if (calc?.source === 'gelan' || formal?.gelanEntityEmission != null) {
    const emission = profile.entityEmission ?? formal?.gelanEntityEmission;
    const gelan = formal?.gelanPrefill || {};
    const reportExt = {
      carbonDataYear: gelan.carbonDataYear ?? gelan.reportYear,
      ghgTotalEmission: gelan.ghgTotalEmission ?? emission,
      emission: gelan.ghgTotalEmission ?? emission,
      scope1Emission: gelan.scope1Emission,
      scope2Emission: gelan.scope2Emission,
      unitTotalCo2Emission: gelan.unitTotalCo2Emission,
      source: gelan.reportSource || GELAN_REPORT_DATA_SOURCE,
      verified: 'yes',
      attachments: []
    };
    return {
      ...base,
      methodId: 'report',
      activeMethodTab: 'report_other',
      reportedEmission: emission,
      reportCarbonDataYear: reportExt.carbonDataYear,
      reportScope1Emission: reportExt.scope1Emission,
      reportScope2Emission: reportExt.scope2Emission,
      reportUnitTotalCo2Emission: reportExt.unitTotalCo2Emission,
      disclosureChannel: gelan.reportSource || GELAN_REPORT_DATA_SOURCE,
      thirdPartyVerified: gelan.thirdPartyVerified !== false,
      gelanPrefill: gelan,
      fieldData: { reportOther: reportExt, reportAuthority: {} }
    };
  }
  if (calc?.methodId === 'economy' || formal?.economyDirectStatus === 'done') {
    return {
      ...base,
      methodId: 'economy',
      activeMethodTab: 'economy',
      economyValue: calc?.avgBalance,
      economyFactor: calc?.industryFactor || 2.35,
      economyBasis: 'revenue',
      collectMode: 'economy_direct',
      economyDirectStatus: formal?.economyDirectStatus,
      economyDirectAt: formal?.economyDirectAt,
      entityEmission: profile.entityEmission
    };
  }
  return {
    ...base,
    methodId: profile.metrics?.methodId || 'report',
    activeMethodTab: supplementActiveTab({ methodId: profile.metrics?.methodId || 'report' }),
    reportedEmission: profile.entityEmission
  };
}

function isCarbonAccountReportMethod(methodLabel, methodId) {
  return methodId === 'report' || String(methodLabel || '').startsWith('报告法');
}

function renderCarbonAccountProfilePanel(d, acc, year, subProjectNo, options = {}) {
  const { editable = true } = options;
  const profile = resolveCarbonAccountProfileRow(d, acc, year, subProjectNo);
  const supplementView = buildCarbonAccountSupplementView(d, acc, year, subProjectNo);
  const yearProfile = acc.annualProfiles?.[String(year || '')];
  const carbonDataYear = yearProfile?.reportDetail?.carbonDataYear || year || '';
  const entityVal = profile.entityEmission != null ? profile.entityEmission : '';
  const subHint = subProjectNo
    ? `<div class="demo-tip" style="margin-bottom:12px">当前为项目子账户 · 项目号 ${subProjectNo}</div>`
    : '';
  const profileFields = editable
    ? `<form id="caProfileForm" class="form-grid" data-account-id="${acc.id}" data-year="${year || ''}" data-sub="${subProjectNo || ''}">
      <div class="form-item"><label>企业名称</label><input name="customerName" value="${profile.customerName}"></div>
      <div class="form-item"><label>统一社会信用代码</label><input name="creditCode" value="${profile.creditCode}"></div>
      <div class="form-item"><label>客户号</label><input name="customerNo" value="${profile.customerNo}"></div>
      <div class="form-item"><label>核算方法</label>
        <select name="methodLabel">${renderCarbonAccountMethodOptions(profile.method)}</select>
      </div>
      <div class="form-item"><label>主体排放(tCO2e)</label><input name="entityEmission" type="number" step="0.01" value="${entityVal}"></div>
      <div class="form-item"><label>碳数据年份</label><input name="reportCarbonDataYear" type="number" value="${carbonDataYear}"></div>
    </form>`
    : `<div class="form-grid ca-profile-fields">
      <div class="form-item"><label>企业名称</label><input value="${profile.customerName}" disabled></div>
      <div class="form-item"><label>统一社会信用代码</label><input value="${profile.creditCode}" disabled></div>
      <div class="form-item"><label>客户号</label><input value="${profile.customerNo}" disabled></div>
      <div class="form-item"><label>核算方法</label><input value="${profile.method}" disabled></div>
      <div class="form-item"><label>主体排放(tCO2e)</label><input value="${profile.entityEmission != null ? formatNum(profile.entityEmission) : '—'}" disabled></div>
      <div class="form-item"><label>碳数据年份</label><input value="${carbonDataYear || '—'}" disabled></div>
    </div>`;
  const supplementHint = editable
    ? '可编辑；保存后仅更新本碳账户及列表展示，不影响核算任务中的收集与计算数据'
    : '';
  const readonlyCls = editable ? '' : ' ca-profile-readonly';
  return `${subHint}
    <div class="card"><div class="card-header"><h3>账户档案</h3></div><div class="card-body${readonlyCls}">${profileFields}</div></div>
    <div class="card" style="margin-top:16px"><div class="card-header"><h3>客户经理收集数据</h3>
      ${supplementHint ? `<span style="font-size:12px;color:#909399">${supplementHint}</span>` : ''}</div>
      <div class="card-body ca-profile-supplement${editable ? '' : ' is-readonly'}">${renderSupplementFillBody(supplementView, { readonly: !editable, editableBasicInfo: editable })}</div>
    </div>`;
}

function renderCandidateProjectDetailRow(c, colspan = 16) {
  const details = getCandidateProjectDetails(c);
  if (!details.length) return '';
  return `<tr class="project-detail-row">
    <td colspan="${colspan}">
      <div class="project-detail-wrap">
        <div class="project-detail-title">项目明细</div>
        <div class="table-wrap">
          <table class="data-table project-detail-table">
            <thead><tr>
              <th>序号</th><th>项目号</th><th>项目名称</th><th>项目所在地区域（省）</th><th>项目所属行业</th>
              <th>客户号</th><th>客户名称</th><th>统一社会信用代码</th><th>国民经济行业代码（4级）</th>
              <th>项目月均贷款余额（万元）</th><th>项目收入（万元）</th><th>项目总投资（万元）</th>
            </tr></thead>
            <tbody>${details.map((p, i) => `<tr>
              <td>${i + 1}</td>
              <td>${p.projectNo || '-'}</td>
              <td>${p.projectName || '-'}</td>
              <td>${p.projectProvince || '-'}</td>
              <td>${p.projectIndustry || '-'}</td>
              <td>${p.customerNo || '-'}</td>
              <td>${p.customerName || '-'}</td>
              <td>${p.creditCode || '-'}</td>
              <td>${p.nationalIndustryCodeLv4 || '-'}</td>
              <td>${p.projectAvgLoanBalanceWan ?? '-'}</td>
              <td>${p.projectRevenueWan ?? '-'}</td>
              <td>${p.projectTotalInvestmentWan ?? '-'}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </td>
  </tr>`;
}

function getDefaultCandidateFilterRules(task) {
  const t = normalizeTaskIndustryFields({ ...(task || {}) });
  const investScope = getTaskInvestIndustryScope(t);
  let industries;
  if (investScope === '自定义') {
    industries = (t.investIndustryCustomCodes || []).map(normalizeIndustryFilterCode).filter(Boolean);
    if (!industries.length) industries = getCandidateInvestIndustryFilterOptions(t).map(r => r.code);
  } else if (investScope === INDUSTRY_SCOPE_KEY_EXTENDED) {
    industries = getCandidateInvestIndustryFilterOptions(t).map(r => r.code);
  } else {
    industries = INDUSTRY_TABLE.map(r => r.code);
  }
  return {
    productTypes: (GUIDE.SCOPE_DEFAULT_PRODUCT_TYPES || []).slice(),
    borrowerTypes: (GUIDE.SCOPE_DEFAULT_BORROWER_TYPES || []).slice(),
    customerScales: (GUIDE.SCOPE_DEFAULT_CUSTOMER_SCALES || GUIDE.CUSTOMER_SCALES || []).slice(),
    industries,
    balanceMin: String(GUIDE.BALANCE_THRESHOLD_WAN || 500),
    balanceMax: '',
    customized: false
  };
}

function normalizeCandidateFilterRules(rules, task) {
  if (!rules || rules.productTypes == null) {
    const legacy = rules || {};
    const defaults = getDefaultCandidateFilterRules(task);
    if (legacy.productType) defaults.productTypes = [legacy.productType];
    if (legacy.borrowerType) defaults.borrowerTypes = [legacy.borrowerType];
    if (legacy.customerScale) defaults.customerScales = [legacy.customerScale];
    if (legacy.industry) {
      const code = String(legacy.industry).trim().split(/\s+/)[0];
      defaults.industries = [code];
    }
    defaults.balanceMin = legacy.balanceMin ?? defaults.balanceMin;
    defaults.balanceMax = legacy.balanceMax ?? '';
    defaults.customized = !!(legacy.productType || legacy.borrowerType || legacy.customerScale || legacy.industry || legacy.tier1Branch || legacy.manager);
    return defaults;
  }
  return {
    productTypes: rules.productTypes || [],
    borrowerTypes: rules.borrowerTypes || [],
    customerScales: rules.customerScales || [],
    industries: rules.industries || [],
    balanceMin: rules.balanceMin ?? '',
    balanceMax: rules.balanceMax ?? '',
    customized: rules.customized === true
  };
}

function isCandidateInGuideAccountingScope(c) {
  const minBal = Number(GUIDE.BALANCE_THRESHOLD_WAN || 500);
  const bal = computeCandidateAvgMonthlyBalance(c, c?.accountingYear);
  if (bal < minBal) return false;
  if (c.isSme || c.isIndividual || c.isOverseas) return false;
  const bt = candidateBorrowerType(c);
  if (['个体工商户', '农户', '境外主体', '小微企业'].includes(bt)) return false;
  const code = c.gbIndustryCode;
  if (!code || !IndustryScope.getEightCodes().some(ec => industryFilterCodesMatch(ec, code))) return false;
  const pt = candidateProductType(c);
  if (pt === '个人经营性贷款') return false;
  return true;
}

function normalizeIndustryFilterCode(code) {
  if (code == null || code === '') return '';
  const s = String(code).trim();
  if (/^[A-Z]\d/.test(s)) return s;
  if (typeof toScopedIndustryCode === 'function') {
    const scoped = toScopedIndustryCode(s);
    if (scoped) return scoped;
  }
  return s;
}

function industryFilterCodesMatch(a, b) {
  if (!a || !b) return false;
  const na = normalizeIndustryFilterCode(a);
  const nb = normalizeIndustryFilterCode(b);
  if (na === nb) return true;
  return toCascadeIndustryCode(na) === toCascadeIndustryCode(nb);
}

function lookupCandidateIndustryFilterRow(code) {
  const scoped = normalizeIndustryFilterCode(code);
  if (!scoped) return null;
  const cascade = toCascadeIndustryCode(scoped);
  const tableRow = INDUSTRY_TABLE.find(r => r.code === scoped || toCascadeIndustryCode(r.code) === cascade);
  if (tableRow) return tableRow;
  const nameMap = typeof IndustryCascade !== 'undefined' ? IndustryCascade.nameMap() : {};
  const name = nameMap[cascade] || nameMap[scoped] || '';
  return { code: scoped, name: name || scoped, major: inferIndustryMajor(scoped) || '' };
}

function getCandidateInvestIndustryFilterOptions(task) {
  const t = normalizeTaskIndustryFields({ ...(task || {}) });
  const scope = getTaskInvestIndustryScope(t);
  if (scope === '自定义') {
    const seen = new Set();
    const rows = [];
    (t.investIndustryCustomCodes || []).forEach(raw => {
      const row = lookupCandidateIndustryFilterRow(raw);
      if (row?.code && !seen.has(row.code)) {
        seen.add(row.code);
        rows.push(row);
      }
    });
    return rows.sort((a, b) => a.code.localeCompare(b.code, 'zh-CN'));
  }
  if (scope === INDUSTRY_SCOPE_KEY_EXTENDED) {
    const codes = [...new Set(
      IndustryScope.resolveCodes(scope, []).map(normalizeIndustryFilterCode).filter(Boolean)
    )];
    return codes.map(c => lookupCandidateIndustryFilterRow(c)).filter(r => r?.code)
      .sort((a, b) => a.code.localeCompare(b.code, 'zh-CN'));
  }
  return INDUSTRY_TABLE.slice();
}

function renderCandidateFilterCheckboxes(name, options, selected, labelFn) {
  const selectedSet = new Set(selected || []);
  return `<div class="filter-checkbox-group">${options.map(opt => {
    const value = typeof opt === 'string' ? opt : opt.value;
    const text = labelFn ? labelFn(opt) : (typeof opt === 'string' ? opt : opt.label);
    return `<label class="filter-check"><input type="checkbox" name="${name}" value="${value}" ${selectedSet.has(value) ? 'checked' : ''}> ${text}</label>`;
  }).join('')}</div>`;
}

function renderCandidateFilterPanel(rules, task, options = {}) {
  const viewOnly = !!options.viewOnly;
  const dis = viewOnly ? ' disabled' : '';
  const productOptions = GUIDE.CANDIDATE_PRODUCT_TYPES || [];
  const borrowerOptions = GUIDE.CANDIDATE_BORROWER_TYPES || [];
  const customerScaleOptions = (GUIDE.CUSTOMER_SCALES || []).map(v => ({ value: v, label: v }));
  const industryOptions = getCandidateInvestIndustryFilterOptions(task).map(i => ({
    value: i.code,
    label: `${i.code} ${i.name}`
  }));
  return `
    <fieldset class="view-mode-fieldset"${viewOnly ? ' disabled' : ''}>
    <div class="filter-panel">
      <div class="filter-extra candidate-filter-grid">
        <div class="form-item full">
          <label>信贷品种</label>
          ${renderCandidateFilterCheckboxes('f_product', productOptions, rules.productTypes)}
        </div>
        <div class="form-item full">
          <label>贷款主体类型</label>
          ${renderCandidateFilterCheckboxes('f_borrower', borrowerOptions, rules.borrowerTypes)}
        </div>
        <div class="form-item full">
          <label>客户规模</label>
          ${renderCandidateFilterCheckboxes('f_customer_scale', customerScaleOptions, rules.customerScales)}
        </div>
        <div class="form-item full">
          <label>投向行业</label>
          ${renderCandidateFilterCheckboxes('f_industry', industryOptions, rules.industries)}
        </div>
        <div class="candidate-filter-row-2">
          <div class="form-item"><label>月均贷款余额(元) 起</label>
            <input id="f_bal_min" type="number" placeholder="最小值" value="${balanceWanToYuanInput(rules.balanceMin)}"${dis}>
          </div>
          <div class="form-item"><label>月均贷款余额(元) 止</label>
            <input id="f_bal_max" type="number" placeholder="最大值" value="${balanceWanToYuanInput(rules.balanceMax)}"${dis}>
          </div>
        </div>
        <div class="form-item full">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button class="btn btn-primary" id="candidateFilterBtn"${dis}>查询</button>
            <button class="btn" id="candidateFilterResetBtn"${dis}>恢复默认筛选条件</button>
            <button class="btn" id="candidateFilterClearBtn"${dis}>清除全部筛选条件</button>
          </div>
        </div>
      </div>
    </div>
    </fieldset>`;
}

function getEmptyCandidateFilterRules() {
  return {
    productTypes: [],
    borrowerTypes: [],
    customerScales: [],
    industries: [],
    balanceMin: '',
    balanceMax: '',
    customized: true
  };
}

function readCandidateFilterRulesFromDom() {
  const checked = (name) => qsa(`input[name="${name}"]:checked`).map(el => el.value);
  return {
    productTypes: checked('f_product'),
    borrowerTypes: checked('f_borrower'),
    customerScales: checked('f_customer_scale'),
    industries: checked('f_industry'),
    balanceMin: balanceYuanToWan(qs('#f_bal_min')?.value ?? ''),
    balanceMax: balanceYuanToWan(qs('#f_bal_max')?.value ?? ''),
    customized: true
  };
}

/** 台账金额（内部万元）→ 展示元，保留两位小数 */
function formatLedgerAmountYuan(wanValue) {
  if (wanValue == null || wanValue === '' || wanValue === '-') return '-';
  const n = Number(wanValue);
  if (Number.isNaN(n)) return String(wanValue);
  return (n * 10000).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 核算年度内该笔贷款在华夏银行的存续月份 */
function computeHuaxiaTenureMonths(c, accountingYear) {
  if (c?.huaxiaTenureMonths != null) return Math.max(1, Number(c.huaxiaTenureMonths));
  if (typeof CandidateSync !== 'undefined' && CandidateSync.tenureMonths) {
    return CandidateSync.tenureMonths(c?.disbursementDate, accountingYear || c?.accountingYear);
  }
  const year = Number(accountingYear || c?.accountingYear) || new Date().getFullYear();
  const disb = c?.disbursementDate;
  if (!disb) return 12;
  const m = String(disb).match(/^(\d{4})-(\d{1,2})/);
  if (!m) return 12;
  const dy = parseInt(m[1], 10);
  const dm = parseInt(m[2], 10);
  if (dy > year) return 1;
  if (dy < year) return 12;
  return Math.max(1, 12 - dm + 1);
}

/** 月末余额合计（万元）= 各月月末余额之和 */
function candidateMonthEndBalanceSum(c, accountingYear) {
  if (c?.monthEndBalanceSum != null) return Number(c.monthEndBalanceSum);
  const months = computeHuaxiaTenureMonths(c, accountingYear);
  const avg = Number(c?.avgMonthlyBalance) || 0;
  return avg * months;
}

/** 月均贷款余额（万元）= 月末余额合计 / 华夏存续月份 */
function computeCandidateAvgMonthlyBalance(c, accountingYear) {
  const months = computeHuaxiaTenureMonths(c, accountingYear);
  const sum = candidateMonthEndBalanceSum(c, accountingYear);
  if (!months) return Number(c?.avgMonthlyBalance) || 0;
  return sum / months;
}

/** 平均资产总额（万元）=（上一年末 + 当年末合并报表资产总额）/ 2 */
function computeCandidateAvgTotalAssets(c) {
  if (c?.avgTotalAssets != null) return Number(c.avgTotalAssets);
  const cur = Number(c?.totalAssets);
  const prev = Number(c?.prevYearTotalAssets);
  if (!cur && !prev) return null;
  return prev ? (cur + prev) / 2 : cur;
}

/** 同步/展示前归一化候选台账金额字段 */
function normalizeCandidateLedgerFields(c, accountingYear) {
  if (!c) return c;
  const year = accountingYear || c.accountingYear;
  const months = computeHuaxiaTenureMonths(c, year);
  c.huaxiaTenureMonths = months;
  if (c.monthEndBalanceSum == null && c.avgMonthlyBalance != null) {
    c.monthEndBalanceSum = Number(c.avgMonthlyBalance) * months;
  }
  if (c.monthEndBalanceSum != null && months > 0) {
    c.avgMonthlyBalance = Number(c.monthEndBalanceSum) / months;
  }
  const avgAssets = computeCandidateAvgTotalAssets(c);
  if (avgAssets != null) c.avgTotalAssets = avgAssets;
  return c;
}

function formatCandidateMonthEndBalance(c, accountingYear) {
  return formatLedgerAmountYuan(candidateMonthEndBalanceSum(c, accountingYear));
}

function formatCandidateConsolidatedTotalAssets(c) {
  const cur = Number(c?.totalAssets);
  if (!cur) return '-';
  return formatLedgerAmountYuan(cur);
}

function formatFormalAvgTotalAssets(c) {
  const avg = computeCandidateAvgTotalAssets(c);
  if (avg == null) return '-';
  return formatLedgerAmountYuan(avg);
}

function candidateAvgTotalAssets(c) {
  return formatFormalAvgTotalAssets(c);
}

function balanceYuanToWan(yuan) {
  const n = Number(yuan);
  if (Number.isNaN(n) || yuan === '' || yuan == null) return '';
  return n / 10000;
}

function balanceWanToYuanInput(wan) {
  if (wan === '' || wan == null) return '';
  const n = Number(wan);
  if (Number.isNaN(n)) return '';
  return String(Math.round(n * 10000));
}

function candidateTier1Branch(c) {
  return c.tier1Branch || c.branch || '-';
}

function candidateCustomerScale(c) {
  if (c?.customerScale && (GUIDE.CUSTOMER_SCALES || []).includes(c.customerScale)) return c.customerScale;
  if (c?.isSme) return '小微企业';
  const bal = Number(c?.avgMonthlyBalance) || 0;
  if (bal >= 5000) return '大型企业';
  if (bal >= 1500) return '中型企业';
  return '中型企业';
}

/** 候选清单表格数据列（含核算类型、客户规模） */
function renderCandidateListCells(c, options = {}) {
  const listKind = options.listKind === 'formal' ? 'formal' : 'candidate';
  normalizeCandidateLedgerFields(c, c?.accountingYear);
  const hasProjectDetails = !!options.showProjectToggle && getCandidateProjectDetails(c).length > 0;
  const toggle = hasProjectDetails
    ? `<button type="button" class="candidate-expand-toggle ${options.projectExpanded ? 'is-expanded' : ''}" data-id="${c.id}" aria-expanded="${options.projectExpanded ? 'true' : 'false'}" title="${options.projectExpanded ? '收起项目明细' : '展开项目明细'}"><span class="candidate-expand-icon" aria-hidden="true"></span></button>`
    : (options.showProjectToggle ? '<span class="candidate-expand-placeholder"></span>' : '');
  const branchCell = options.showProjectToggle
    ? `<span class="candidate-branch-cell">${toggle}<span>${candidateTier1Branch(c)}</span></span>`
    : candidateTier1Branch(c);
  return `
    <td>${branchCell}</td>
    <td>${c.handlingBranch || '-'}</td>
    <td>${c.customerName}</td>
    <td>${candidateCustomerScale(c)}</td>
    <td>${candidateProductType(c)}</td>
    <td>${candidateAccountingTypeLabel(c, options)}</td>
    <td>${c.loanAccount || '-'}</td>
    <td>${c.disbursementDate || '-'}</td>
    <td>${candidateBorrowerType(c)}</td>
    <td>${candidateIndustryLabel(c)}</td>
    <td>${candidateInvestIndustryLabel(c)}</td>
    <td>${listKind === 'formal'
      ? formatLedgerAmountYuan(computeCandidateAvgMonthlyBalance(c, c.accountingYear))
      : formatCandidateMonthEndBalance(c, c.accountingYear)}</td>
    <td>${formatLedgerAmountYuan(c.operatingRevenue ?? c.revenue)}</td>
    <td>${listKind === 'formal'
      ? formatFormalAvgTotalAssets(c)
      : formatCandidateConsolidatedTotalAssets(c)}</td>
    <td>${c.manager || '-'}</td>`;
}

const CANDIDATE_LIST_TABLE_HEAD = `
  <th>一级分行</th><th>经办行</th><th>客户名称</th><th>客户规模</th><th>信贷品种</th><th>业务种类</th><th>贷款账号</th>
  <th>投放日</th><th>贷款主体类型</th><th>企业所属行业</th><th>贷款投向所属行业</th>
  <th>月末余额（元）</th><th>年报营业收入（元）</th><th>合并报表资产总额（元）</th><th>主办客户经理</th>`;

const FORMAL_LIST_TABLE_HEAD = `
  <th>一级分行</th><th>经办行</th><th>客户名称</th><th>客户规模</th><th>信贷品种</th><th>业务种类</th><th>贷款账号</th>
  <th>投放日</th><th>贷款主体类型</th><th>企业所属行业</th><th>贷款投向所属行业</th>
  <th>月均贷款余额（元）</th><th>年报营业收入（元）</th><th>平均资产总额（元）</th><th>主办客户经理</th>`;

const CALCULATION_LIST_TABLE_HEAD = `
  ${FORMAL_LIST_TABLE_HEAD}
  <th>法人主体排放(tCO₂e)</th><th>项目主体排放(tCO₂e)</th><th>归因排放(tCO₂e)</th><th>质量等级</th>`;

/** 碳账户排放明细 → 候选清单同款行（复用台账列） */
function caRecordAsCandidateRow(r) {
  const avgMonthly = r.avgMonthlyBalance != null
    ? r.avgMonthlyBalance
    : (r.avgBalance != null ? Math.round(Number(r.avgBalance) / 12) : null);
  return {
    tier1Branch: r.tier1Branch,
    branch: r.tier1Branch,
    handlingBranch: r.handlingBranch,
    customerName: r.customerName,
    customerScale: r.customerScale,
    productType: r.productType || r.loanType,
    loanType: r.loanType,
    accountingType: r.accountingType,
    loanAccount: r.loanAccount,
    disbursementAmount: r.disbursementAmount,
    disbursementDate: r.disbursementDate,
    borrowerType: r.borrowerType,
    industryLabel: r.industryLabel,
    gbIndustryCode: r.gbIndustryCode,
    gbIndustryName: r.gbIndustryName,
    industryMajor: r.industryMajor,
    avgMonthlyBalance: avgMonthly,
    operatingRevenue: r.operatingRevenue,
    revenue: r.operatingRevenue,
    manager: r.manager
  };
}

function renderCaRecordLedgerCells(r) {
  return renderCandidateListCells(caRecordAsCandidateRow(r));
}

function caRecordProductType(r) {
  return candidateProductType(caRecordAsCandidateRow(r));
}

/** 核算方法展示名（五类） */
function calcMethodLabel(item) {
  if (!item) return '待选择';
  const id = item.methodId;
  if (id) {
    const m = GUIDE.METHODS.find(x => x.id === id);
    if (m) return m.name;
  }
  const name = item.method || '';
  if (GUIDE.METHODS.some(m => m.name === name)) return name;
  if (name.includes('能源')) return '物理活动法-能源法';
  if (name.includes('产品')) return '物理活动法-产品法';
  if (name.includes('报告')) return '报告法';
  if (name.includes('经济') && !name.includes('兜底')) return '经济活动法';
  if (name) return '其他计算法';
  return '待选择';
}

function computeIndustryStatsFromCalcs(taskId) {
  const calcs = Store.getCalculations(taskId).filter(c => c.attributedEmission != null);
  const formal = Store.getFormalList(taskId);
  const map = {};
  calcs.forEach(c => {
    const f = formal.find(x => x.id === c.formalId);
    const industry = f?.industryMajor || c.industryMajor || '其他';
    if (!map[industry]) map[industry] = { industry, count: 0, emission: 0 };
    map[industry].count++;
    map[industry].emission += Number(c.attributedEmission) || 0;
  });
  const total = Object.values(map).reduce((s, i) => s + i.emission, 0);
  return Object.values(map)
    .sort((a, b) => b.emission - a.emission)
    .map(i => ({
      industry: i.industry,
      count: i.count,
      emission: i.emission,
      share: total ? +(100 * i.emission / total).toFixed(1) : 0
    }));
}

function formalLedgerRow(f, taskId) {
  const c = Store.getCandidates(taskId).find(x => x.id === f.customerId);
  if (c) return c;
  return {
    id: f.customerId || f.id,
    customerName: f.customerName,
    customerScale: f.customerScale ?? c?.customerScale,
    tier1Branch: f.tier1Branch || f.branch,
    handlingBranch: f.handlingBranch,
    productType: f.productType || f.loanType,
    loanType: f.loanType,
    accountingType: f.accountingType,
    bizType: f.bizType,
    loanAccount: f.loanAccount,
    disbursementAmount: f.disbursementAmount,
    disbursementDate: f.disbursementDate,
    borrowerType: f.borrowerType,
    industryLabel: f.industryLabel,
    gbIndustryCode: f.gbIndustryCode,
    gbIndustryName: f.gbIndustryName,
    industryMajor: f.industryMajor,
    avgMonthlyBalance: f.avgMonthlyBalance,
    monthEndBalanceSum: f.monthEndBalanceSum,
    huaxiaTenureMonths: f.huaxiaTenureMonths,
    totalAssets: f.totalAssets,
    prevYearTotalAssets: f.prevYearTotalAssets,
    avgTotalAssets: f.avgTotalAssets,
    operatingRevenue: f.operatingRevenue,
    manager: f.manager,
    projectDetails: f.projectDetails,
    projectInfoAvailable: f.projectInfoAvailable
  };
}

function excludeLabel(code) {
  if (!code) return '-';
  return (GUIDE.EXCLUSIONS.find(e => e.code === code) || {}).label || code;
}

/** 必填字段标签（红色星号） */
function fieldLabel(text) {
  return `<span class="req">*</span>${text}`;
}

/** 自定义行业多选面板（按行业大类分组） */
function renderCustomIndustryPanel(selectedCodes, readonly, options = {}) {
  const {
    panelId = 'customIndustryPanel',
    countId = 'industrySelectedCount',
    selectAllId = 'selectAllIndustries',
    clearAllId = 'clearAllIndustries'
  } = options;
  const selected = new Set(selectedCodes || []);
  const grouped = IndustryScope.groupByMajor(INDUSTRY_TABLE);
  const majors = Object.keys(grouped);
  const dis = readonly ? 'disabled' : '';
  return `
    <div class="industry-custom-panel" id="${panelId}">
      ${readonly ? '' : `<div class="industry-custom-toolbar">
        <span class="industry-custom-hint">请选择纳入核算的行业（可多选，显示：行业大类 · 行业名称）</span>
        <span class="industry-custom-actions">
          <button type="button" class="btn btn-sm" id="${selectAllId}">全选</button>
          <button type="button" class="btn btn-sm" id="${clearAllId}">清空</button>
          <span class="industry-selected-count">已选 <b id="${countId}">${selected.size}</b> / ${INDUSTRY_TABLE.length}</span>
        </span>
      </div>`}
      <div class="industry-custom-groups">
        ${majors.map(major => `
          <div class="industry-group">
            <div class="industry-group-head">
              <label class="industry-group-check">
                <input type="checkbox" class="industry-major-check" data-major="${major}" ${dis}>
                <strong>${major}</strong>
                <span class="industry-group-meta">${grouped[major].length} 项</span>
              </label>
            </div>
            <div class="industry-group-items">
              ${grouped[major].map(item => `
                <label class="industry-item-check" title="${item.code}">
                  <input type="checkbox" name="customIndustry" value="${item.code}" class="industry-code-check" data-major="${major}" ${selected.has(item.code) ? 'checked' : ''} ${dis}>
                  <span>${IndustryScope.label(item)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function formatSingleIndustryScopeDisplay(scope, customCodes) {
  if (!scope) return '-';
  const normalized = normalizeIndustryScopeValue(scope);
  if (normalized === INDUSTRY_SCOPE_KEY_EIGHT) return INDUSTRY_SCOPE_LABEL_EIGHT;
  if (normalized === INDUSTRY_SCOPE_KEY_EXTENDED) return INDUSTRY_SCOPE_LABEL_EXTENDED;
  if (normalized === '自定义' && customCodes?.length) {
    return '自定义（' + IndustryScope.summarizeCustom(customCodes) + '）';
  }
  return normalized;
}

function formatIndustryScopeDisplay(task) {
  return formatTaskIndustryScopesDisplay(task);
}

function formatTaskIndustryScopesDisplay(task) {
  if (!task) return '-';
  normalizeTaskIndustryFields(task);
  const subject = formatSingleIndustryScopeDisplay(getTaskSubjectIndustryScope(task), task.industryCustomCodes);
  const invest = formatSingleIndustryScopeDisplay(getTaskInvestIndustryScope(task), task.investIndustryCustomCodes);
  return `所属：${subject}；投向：${invest}`;
}

function bindCustomIndustryPanel(rootEl) {
  const panel = rootEl
    ? qs('.industry-custom-panel', rootEl)
    : qs('#customIndustryPanel');
  if (!panel) return;

  const syncMajorChecks = () => {
    qsa('.industry-group', panel).forEach(group => {
      const major = group.querySelector('.industry-major-check')?.dataset.major;
      const items = qsa('.industry-code-check[data-major="' + major + '"]', group);
      const majorCb = group.querySelector('.industry-major-check');
      if (!majorCb || !items.length) return;
      const checked = items.filter(cb => cb.checked).length;
      majorCb.checked = checked === items.length;
      majorCb.indeterminate = checked > 0 && checked < items.length;
    });
    const countEl = panel.querySelector('.industry-selected-count b');
    if (countEl) countEl.textContent = qsa('.industry-code-check:checked', panel).length;
  };

  qsa('.industry-major-check', panel).forEach(cb => {
    cb.addEventListener('change', () => {
      const major = cb.dataset.major;
      qsa('.industry-code-check[data-major="' + major + '"]', panel).forEach(item => { item.checked = cb.checked; });
      syncMajorChecks();
    });
  });

  qsa('.industry-code-check', panel).forEach(cb => {
    cb.addEventListener('change', syncMajorChecks);
  });

  panel.querySelector('.industry-custom-toolbar .btn-sm')?.addEventListener('click', () => {
    qsa('.industry-code-check', panel).forEach(cb => { cb.checked = true; });
    syncMajorChecks();
  });

  panel.querySelectorAll('.industry-custom-toolbar .btn-sm')[1]?.addEventListener('click', () => {
    qsa('.industry-code-check', panel).forEach(cb => { cb.checked = false; });
    syncMajorChecks();
  });

  syncMajorChecks();
}

function getSelectedCustomIndustryCodes(rootEl) {
  const scope = rootEl || document;
  return qsa('.industry-code-check:checked', scope).map(cb => cb.value);
}

const PAGE_SIZE_OPTIONS = [10, 20, 100];

function getListPageState(key, defaultPageSize = 10) {
  const page = parseInt(sessionStorage.getItem('list_page_' + key) || '1', 10);
  let pageSize = parseInt(sessionStorage.getItem('list_size_' + key) || String(defaultPageSize), 10);
  if (!PAGE_SIZE_OPTIONS.includes(pageSize)) pageSize = defaultPageSize;
  return { page: Math.max(1, page), pageSize };
}

function setListPage(key, page) {
  sessionStorage.setItem('list_page_' + key, String(page));
}

function setListPageSize(key, pageSize) {
  sessionStorage.setItem('list_size_' + key, String(pageSize));
  sessionStorage.setItem('list_page_' + key, '1');
}

function paginateList(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    rows: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
    startIndex: start
  };
}

function paginateData(key, items) {
  const { page, pageSize } = getListPageState(key);
  const view = paginateList(items, page, pageSize);
  if (view.page !== page) setListPage(key, view.page);
  return view;
}

function renderPagination(key, view) {
  const { page, pageSize, total } = view;
  const totalPages = view.totalPages ?? Math.max(1, Math.ceil((total || 0) / pageSize) || 1);
  return `
    <div class="pagination" data-list-key="${key}">
      <label class="page-size-label">每页
        <select class="page-size-select" data-list-key="${key}">
          ${PAGE_SIZE_OPTIONS.map(n => `<option value="${n}" ${pageSize === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select> 条
      </label>
      <span class="page-info">第 ${page} / ${totalPages} 页，共 ${total} 条</span>
      <button type="button" class="btn btn-sm page-prev" data-list-key="${key}" data-total-pages="${totalPages}" ${page <= 1 ? 'disabled' : ''}>上一页</button>
      <button type="button" class="btn btn-sm page-next" data-list-key="${key}" data-total-pages="${totalPages}" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
    </div>`;
}

function bindListPagination(onBeforeChange) {
  qsa('.page-size-select').forEach(sel => {
    sel.onchange = () => {
      const key = sel.dataset.listKey;
      setListPageSize(key, parseInt(sel.value, 10));
      if (onBeforeChange) onBeforeChange(key);
      route();
    };
  });
  qsa('.page-prev').forEach(btn => {
    btn.onclick = () => {
      if (btn.disabled) return;
      const key = btn.dataset.listKey;
      const { page } = getListPageState(key);
      setListPage(key, page - 1);
      if (onBeforeChange) onBeforeChange(key);
      route();
    };
  });
  qsa('.page-next').forEach(btn => {
    btn.onclick = () => {
      if (btn.disabled) return;
      const key = btn.dataset.listKey;
      const { page } = getListPageState(key);
      const totalPages = parseInt(btn.dataset.totalPages, 10);
      if (page < totalPages) {
        setListPage(key, page + 1);
        if (onBeforeChange) onBeforeChange(key);
        route();
      }
    };
  });
}

/** 表3：DQR 数值 → 对应等次（A / B+ / B / B- / C） */
function resolveDqrGrade(dqr) {
  const v = Number(dqr);
  if (dqr == null || dqr === '' || Number.isNaN(v)) return null;
  const bands = GUIDE.DQR_GRADE_BANDS || [];
  return bands.find(b => v <= b.max)?.grade || 'C';
}

function qualityGradeBadge(grade) {
  if (grade == null) return '-';
  const labels = ['', '一级(优)', '二级', '三级', '四级', '五级(兜底)'];
  return `<span class="badge badge-primary">等级${grade} ${labels[grade] || ''}</span>`;
}
