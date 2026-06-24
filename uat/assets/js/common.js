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

function isRouteAllowedForRole(routeBase, roleKey) {
  if (roleKey === 'manager') return MANAGER_ALLOWED_ROUTES.includes(routeBase);
  if (CARBON_ACCOUNT_ROUTES.includes(routeBase)) {
    return roleKey === 'hq' || roleKey === 'branch';
  }
  return !MANAGER_ONLY_ROUTES.includes(routeBase);
}

function getDefaultRouteForRole(roleKey) {
  return roleKey === 'manager' ? '#/manager-tasks' : '#/tasks';
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

function renderTaskYearFilterField(selected) {
  const val = selected != null && selected !== '' ? selected : '';
  return `<div class="year-filter-field"><input type="number" id="tf_year" class="year-filter-input" list="taskYearFilterList"
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
        <input type="radio" name="${name}" value="${o.value}" ${scope === o.value ? 'checked' : ''} ${dis} ${!readonly && i === 0 ? 'required' : ''}>
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

function renderTaskFormFields(task, options = {}) {
  const { readonly = false, showRequired = true } = options;
  const t = task || {};
  const ro = readonly ? 'readonly' : '';
  const dis = readonly ? 'disabled' : '';
  const label = showRequired && !readonly ? fieldLabel : (text) => text;
  normalizeTaskIndustryFields(t);
  const subjectScope = getTaskSubjectIndustryScope(t);
  const investScope = getTaskInvestIndustryScope(t);
  const subjectCustomCodes = t.industryCustomCodes || [];
  const investCustomCodes = t.investIndustryCustomCodes || [];
  return `
    <div class="form-item"><label>${label('任务名称')}</label><input name="name" ${readonly ? '' : 'required'} value="${t.name || ''}" ${ro}></div>
    <div class="form-item"><label>${label('核算年度')}</label>
      ${renderTaskYearField(t.year || TASK_YEAR_MIN, {
        readonly,
        legacyReadonly: !readonly && isLegacyTaskYear(t.year)
      })}
    </div>
    <div class="form-item full"><label>${label('投向行业范围')}</label>
      ${renderIndustryScopeRadios('investIndustryScope', investScope, { readonly, dis, groupId: 'investIndustryScopeGroup' })}
    </div>
    <div class="form-item full" id="investIndustryCascadeWrap">
      ${IndustryCascade.renderPanel(investCustomCodes, readonly || investScope !== '自定义', {
        wrapId: 'investIndustryCascadePanel',
        countId: 'investIndustrySelectedCount'
      })}
    </div>
    <div class="form-item full"><label>${label('所属行业范围')}</label>
      ${renderIndustryScopeRadios('subjectIndustryScope', subjectScope, { readonly, dis, groupId: 'subjectIndustryScopeGroup' })}
    </div>
    <div class="form-item full" id="subjectIndustryCascadeWrap">
      ${IndustryCascade.renderPanel(subjectCustomCodes, readonly || subjectScope !== '自定义', {
        wrapId: 'subjectIndustryCascadePanel',
        countId: 'subjectIndustrySelectedCount'
      })}
    </div>
    <div class="form-item"><label>${label('余额口径')}</label>
      <select name="balanceRule" ${readonly ? '' : 'required'} ${dis}>
        <option ${t.balanceRule === '月均余额' || !t.balanceRule ? 'selected' : ''}>月均余额</option>
        <option ${t.balanceRule === '日均余额' ? 'selected' : ''}>日均余额</option>
      </select>
    </div>
    <div class="form-item"><label>${label('组织范围')}</label>
      <select name="orgScope" ${readonly ? '' : 'required'} ${dis}>
        <option ${t.orgScope === '全行' || !t.orgScope ? 'selected' : ''}>全行</option>
        <option ${t.orgScope === '北京分行' ? 'selected' : ''}>北京分行</option>
        <option ${t.orgScope === '上海分行' ? 'selected' : ''}>上海分行</option>
      </select>
    </div>
    <div class="form-item"><label>${label('输出目标')}</label>
      <select name="goal" ${readonly ? '' : 'required'} ${dis}>
        <option ${t.goal === '监管报送' || !t.goal ? 'selected' : ''}>监管报送</option>
        <option ${t.goal === '内部分析' ? 'selected' : ''}>内部分析</option>
      </select>
    </div>
    <div class="form-item"><label>${label('数据收集截止日期')}</label>
      <input type="date" name="deadline" ${readonly ? '' : 'required'} value="${t.deadline || ''}" ${ro}>
    </div>
    <div class="form-item"><label>${label('分行审批截止日期')}</label>
      <input type="date" name="branchDeadline" value="${t.branchDeadline || ''}" ${ro}>
    </div>
    <div class="form-item"><label>${label('任务发起')}</label>
      <select name="initiatorOrg" id="initiatorOrgSelect" ${dis}>
        <option value="hq" ${(t.initiatorOrg || 'hq') === 'hq' ? 'selected' : ''}>总行发起</option>
        <option value="branch" ${t.initiatorOrg === 'branch' ? 'selected' : ''}>分行发起</option>
      </select>
    </div>
    <div class="form-item" id="initiatorBranchWrap" style="display:${t.initiatorOrg === 'branch' ? '' : 'none'}">
      <label>${label('发起分行')}</label>
      <select name="initiatorBranch" ${dis}>
        <option value="北京分行" ${(t.initiatorBranch || t.orgScope) === '北京分行' ? 'selected' : ''}>北京分行</option>
        <option value="上海分行" ${(t.initiatorBranch || t.orgScope) === '上海分行' ? 'selected' : ''}>上海分行</option>
        <option value="深圳分行" ${t.initiatorBranch === '深圳分行' ? 'selected' : ''}>深圳分行</option>
      </select>
    </div>
    `;
}

function readTaskFormPayload(form) {
  const subjectIndustryScope = form.subjectIndustryScope.value;
  const investIndustryScope = form.investIndustryScope.value;
  const industryCustomCodes = subjectIndustryScope === '自定义'
    ? IndustryCascade.getSelectedCodes(qs('#subjectIndustryCascadeWrap'))
    : [];
  const investIndustryCustomCodes = investIndustryScope === '自定义'
    ? IndustryCascade.getSelectedCodes(qs('#investIndustryCascadeWrap'))
    : [];
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
    orgScope: form.orgScope.value,
    balanceRule: form.balanceRule?.value || '月均余额',
    goal: form.goal.value,
    deadline: form.deadline.value,
    branchDeadline: form.branchDeadline?.value || '',
    initiatorOrg: form.initiatorOrg?.value || 'hq',
    initiatorBranch: form.initiatorBranch?.value || form.orgScope?.value || '北京分行'
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
  IndustryCascade.bindPanel(subjectWrap, subjectGroup);
  IndustryCascade.bindPanel(investWrap, investGroup);
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
    const src = formal.gelanPrefill?.reportSource || GELAN_REPORT_DATA_SOURCE;
    const at = formal.gelanFetchedAt || '';
    const sourceHtml = `<div style="font-size:11px;color:#909399;margin-top:2px">来源：格澜接口${at ? ' · ' + at : ''} · ${src}</div>`;
    return `${formatNum(formal.gelanEntityEmission)}${sourceHtml}`;
  }
  if (formal?.economyDirectStatus === 'done' || calc?.source === 'economy_direct') {
    if (calc?.entityEmission != null) {
      const sourceHtml = '<div style="font-size:11px;color:#909399;margin-top:2px">来源：经济活动法（不可编辑）</div>';
      return `${formatNum(calc.entityEmission)}${sourceHtml}`;
    }
  }
  if (calc?.source === 'credit_fallback' && calc.entityEmission != null) {
    const sourceHtml = '<div style="font-size:11px;color:#909399;margin-top:2px">来源：信贷数据兜底法</div>';
    return `${formatNum(calc.entityEmission)}${sourceHtml}`;
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

/** @deprecated 列表展示请用 formatSystemEntityEmission / formatManualEntityEmission */
function formatFormalEntityEmission(taskId, formalId) {
  const sys = formatSystemEntityEmission(taskId, formalId);
  if (sys !== '—') return sys;
  return formatManualEntityEmission(taskId, formalId);
}

/** 格澜接口预填时，报告法数据来源固定为「报告法-其他数据来源」 */
const GELAN_REPORT_DATA_SOURCE = '报告法-其他数据来源';

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
  if (typeof Store !== 'undefined' && Store.getFormalEntityEmission?.(taskId, formal.id) != null) return false;
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
  const isPower = String(row?.industryMajor || '').includes('电力');
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

function renderReportMethodSummaryReadonly(fields) {
  const f = fields || {};
  return `
    <div class="form-item"><label>碳数据年份</label><input value="${f.carbonDataYear || '—'}" readonly></div>
    <div class="form-item"><label>核算周期内碳排放量（温室气体排放总量，tCO2e）</label><input value="${formatReportFieldNum(f.ghgTotalEmission)}" readonly></div>
    <div class="form-item"><label>范围一的排放总量（tCO2e）</label><input value="${formatReportFieldNum(f.scope1Emission)}" readonly></div>
    <div class="form-item"><label>范围二的排放总量（tCO2e）</label><input value="${formatReportFieldNum(f.scope2Emission)}" readonly></div>
    <div class="form-item"><label>全部机组二氧化碳排放总量（tCO2e）</label><input value="${formatReportFieldNum(f.unitTotalCo2Emission)}" readonly></div>`;
}

function renderReportMethodSummaryEditable(fields, year) {
  const f = fields || {};
  const numVal = (v) => (v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : '');
  return `
    <div class="form-item"><label>碳数据年份</label><input name="reportCarbonDataYear" type="number" value="${f.carbonDataYear || year || ''}"></div>
    <div class="form-item"><label>核算周期内碳排放量（温室气体排放总量，tCO2e）</label><input name="reportGhgTotalEmission" type="number" step="0.01" value="${numVal(f.ghgTotalEmission)}"></div>
    <div class="form-item"><label>范围一的排放总量（tCO2e）</label><input name="reportScope1Emission" type="number" step="0.01" value="${numVal(f.scope1Emission)}"></div>
    <div class="form-item"><label>范围二的排放总量（tCO2e）</label><input name="reportScope2Emission" type="number" step="0.01" value="${numVal(f.scope2Emission)}"></div>
    <div class="form-item"><label>全部机组二氧化碳排放总量（tCO2e）</label><input name="reportUnitTotalCo2Emission" type="number" step="0.01" value="${numVal(f.unitTotalCo2Emission)}"></div>`;
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
  const rawTotal = calc?.entityEmission != null
    ? calc.entityEmission
    : Store.getFormalEntityEmission?.(taskId, f?.id);

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
    ${renderCandidateListCells(formalLedgerRow(f, taskId), { finalizeAccountingType: true })}
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

/** 数据采集列表「核算方法」展示名（系统优先，其次手动；筛选/测试兼容） */
function resolveFormalAccountingMethodLabel(formal, taskId, d) {
  const sys = resolveSystemAccountingMethodLabel(formal, taskId, d);
  if (sys !== '—') return sys;
  return resolveManualAccountingMethodLabel(formal, taskId, d);
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
  return accountingMethodBadge(resolveSystemAccountingMethodLabel(formal, taskId, d));
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

const DATA_COLLECT_STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'pending_lock', label: '待锁定' },
  { value: 'pending_dispatch', label: '未派发' },
  { value: 'need_supplement', label: '须收集' },
  { value: 'pending_economy', label: '待直算' },
  { value: 'entity_collected', label: '已有排放' },
  { value: 'economy_done', label: '已直算' },
  { value: 'pending_fill', label: '待填报' },
  { value: 'in_progress', label: '填报中' },
  { value: 'pending_submit', label: '待提交' },
  { value: 'branch_review', label: '分行初审' },
  { value: 'hq_review', label: '总行终审' },
  { value: 'approved', label: '已完成' },
  { value: 'returned', label: '已退回' }
];

/** 数据采集行统一采集状态（筛选与列表共用，不再拆分派发/直算与填报） */
function getDataCollectRowStatus(formal, supplement, taskId) {
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
  if (taskId && typeof Store !== 'undefined' && Store.getFormalEntityEmission?.(taskId, formal.id) != null) {
    return 'entity_collected';
  }
  if (taskId && typeof isFormalEconomyDirectEligible === 'function' && isFormalEconomyDirectEligible(formal, taskId, null)) {
    return 'pending_economy';
  }
  return 'need_supplement';
}

function dataCollectStatusBadge(formal, supplement, taskId) {
  const status = getDataCollectRowStatus(formal, supplement, taskId);
  const map = {
    pending_lock: ['待锁定', 'badge-draft'],
    pending_dispatch: ['未派发', 'badge-warning'],
    need_supplement: ['须收集', 'badge-warning'],
    pending_economy: ['待直算', 'badge-warning'],
    entity_collected: ['已有排放', 'badge-success'],
    economy_done: ['已直算', 'badge-success'],
    pending_fill: ['待填报', 'badge-warning'],
    in_progress: ['填报中', 'badge-running'],
    pending_submit: ['待提交', 'badge-warning'],
    branch_review: ['分行初审', 'badge-warning'],
    hq_review: ['总行终审', 'badge-warning'],
    approved: ['已完成', 'badge-success'],
    returned: ['已退回', 'badge-danger']
  };
  const [text, cls] = map[status] || [status, 'badge-draft'];
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

function filterDataCollectList(list, filters, taskId) {
  const f = filters || {};
  const supplements = Store.get().supplements.filter(s => s.taskId === taskId);
  return list.filter(formal => {
    const supp = supplements.find(s => s.formalId === formal.id);
    if (f.keyword && !(formal.customerName || '').toLowerCase().includes(f.keyword.trim().toLowerCase())) return false;
    if (f.accountingMethod) {
      const d = Store.get();
      const sys = resolveSystemAccountingMethodLabel(formal, taskId, d);
      const man = resolveManualAccountingMethodLabel(formal, taskId, d);
      if (sys !== f.accountingMethod && man !== f.accountingMethod) return false;
    } else if (f.collectMode) {
      const mode = formal.collectMode || resolveCollectMode(formal.loanType);
      if (mode !== f.collectMode) return false;
    }
    if (f.status && getDataCollectRowStatus(formal, supp, taskId) !== f.status) return false;
    return true;
  });
}

function renderDataCollectStatusOptions(selected) {
  return DATA_COLLECT_STATUS_OPTIONS.map(o =>
    `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
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

/** 数据采集为经济法直算路径时，收集页经济活动法 Tab 预填直算/接口数值（仍可编辑） */
function getEconomyDirectPrefill(s) {
  if (!s?.formalId || !s.dispatchedAt) return null;
  const formal = getFormalForSupplement(s);
  if (!formal) return null;
  const mode = formal.collectMode || resolveCollectMode(formal.loanType || s.loanType);
  if (mode !== 'economy_direct') return null;
  return getEconomyDirectViewData(s);
}

function getEconomyDirectViewData(s) {
  const formal = getFormalForSupplement(s);
  if (!formal) return null;
  const calc = Store.getCalculations(s.taskId).find(c => c.formalId === s.formalId);
  const entityEmission = calc?.entityEmission ?? Store.getFormalEntityEmission?.(s.taskId, s.formalId);
  return {
    entityEmission,
    economyDirectStatus: formal.economyDirectStatus,
    economyDirectAt: formal.economyDirectAt,
    economyValue: s.economyValue ?? s.revenue ?? formal.operatingRevenue ?? '',
    economyFactor: calc?.industryFactor ?? s.economyFactor ?? 2.35,
    economyBasis: s.economyBasis || 'revenue'
  };
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
  const fallbackFactor = s.fallbackFactor ?? s.economyFactor ?? 2.46;
  const methodTabs = getSupplementMethodTabs(s);
  const economyPrefillTip = economyPrefill
    ? `<div class="demo-tip">系统已从生产接口或数据采集直算预填以下数值，请核实并按需修改。${economyPrefill.economyDirectStatus === 'done' ? `直算时间：${economyPrefill.economyDirectAt || '—'}。` : ''}${economyPrefill.entityEmission != null ? ` 当前主体排放参考：${formatNum(economyPrefill.entityEmission)} tCO₂e。` : ''}</div>`
    : '';

  return `
    <div class="card"><div class="card-header"><h3>企业基本信息</h3></div>
    <div class="card-body form-grid">
      ${SUPPLEMENT_FIELDS.renderBasicInfo(s, dis, !!options.editableBasicInfo && !readonly)}
    </div></div>
    <div class="card"><div class="card-header"><h3>排放数据（可同时填写多种方法）</h3></div>
    <div class="demo-tip method-priority-tip">客户经理可同时填写多种方法的数值；审核通过时由分行管理员选定最终采用的核算方法（见指引第七章方法优先级）</div>
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
        <div class="form-item"><label>测算基数</label><select id="f_economy_basis" ${dis}>
          <option value="revenue" ${basis === 'revenue' ? 'selected' : ''}>营业收入</option>
          <option value="assets" ${basis === 'assets' ? 'selected' : ''}>资产规模</option>
        </select></div>
        <div class="form-item"><label>基数值(万元)</label><input id="f_economy_value" type="number" value="${economyValue}" ${dis}></div>
        <div class="form-item"><label>行业因子</label><input id="f_economy_factor" type="number" step="0.01" value="${economyFactor}" ${dis}></div>
      </div></div>
      <div class="${panelCls('other')}" data-panel="other"><div class="form-grid">
        <div class="form-item"><label>行业排放因子</label><input id="f_fallback_factor" type="number" step="0.01" value="${fallbackFactor}" ${dis}></div>
        <div class="form-item full"><small style="color:#909399">${GUIDE.FORMULAS.attribution_fallback}（无法获取主体排放数据时使用）</small></div>
        ${SUPPLEMENT_FIELDS.renderAttachmentSection('other', s.fieldData?.other?.attachments || [], dis)}
      </div></div>
    </div></div>`;
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

function canUserReviewApproval(approval, roleKey) {
  if (!approval || approval.status !== 'pending') return false;
  if (approval.docType !== 'supplement') return false;
  if (approval.reviewLevel === 'branch') return roleKey === 'branch';
  if (approval.reviewLevel === 'hq') return roleKey === 'hq';
  return false;
}

/** 审核页底部操作栏（审核模式） */
function renderApprovalReviewActions(canReview) {
  if (!canReview) {
    return `<div style="padding:12px 20px;border-top:1px solid #eee;text-align:right">
      <button class="btn" onclick="location.hash='#/approvals'">返回列表</button>
    </div>`;
  }
  return `<div style="padding:16px 20px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:10px;background:#fff;margin-top:16px">
    <button type="button" class="btn btn-success" id="approvalApproveBtn">审核通过</button>
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
              <th>项目所属行业</th><th>项目均贷款余额（万元）</th><th>项目收入（万元）</th>
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
    : `<div class="form-grid">
      <div class="form-item"><label>企业名称</label><input value="${profile.customerName}" readonly></div>
      <div class="form-item"><label>统一社会信用代码</label><input value="${profile.creditCode}" readonly></div>
      <div class="form-item"><label>客户号</label><input value="${profile.customerNo}" readonly></div>
      <div class="form-item"><label>核算方法</label><input value="${profile.method}" readonly></div>
      <div class="form-item"><label>主体排放(tCO2e)</label><input value="${profile.entityEmission != null ? formatNum(profile.entityEmission) : '—'}" readonly></div>
      <div class="form-item"><label>碳数据年份</label><input value="${carbonDataYear || '—'}" readonly></div>
    </div>`;
  const supplementHint = editable
    ? '可编辑；保存后仅更新本碳账户及列表展示，不影响核算任务中的收集与计算数据'
    : '按核算方法展示对应填报内容（只读）';
  return `${subHint}
    <div class="card"><div class="card-header"><h3>账户档案</h3></div><div class="card-body">${profileFields}</div></div>
    <div class="card" style="margin-top:16px"><div class="card-header"><h3>客户经理收集数据</h3>
      <span style="font-size:12px;color:#909399">${supplementHint}</span></div>
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
              <th>项目均贷款余额（万元）</th><th>项目收入（万元）</th><th>项目总投资（万元）</th>
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
  const scopeCodes = IndustryScope.resolveCodes(investScope, t.investIndustryCustomCodes);
  const eightCodes = IndustryScope.getEightCodes();
  let industries;
  if (investScope === '自定义') {
    industries = eightCodes.filter(c => scopeCodes.includes(c));
    if (!industries.length) industries = scopeCodes.slice();
  } else {
    industries = eightCodes.slice();
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
  if (Number(c.avgMonthlyBalance) < minBal) return false;
  if (c.isSme || c.isIndividual || c.isOverseas) return false;
  const bt = candidateBorrowerType(c);
  if (['个体工商户', '农户', '境外主体', '小微企业'].includes(bt)) return false;
  const code = c.gbIndustryCode;
  if (!code || !IndustryScope.getEightCodes().includes(code)) return false;
  const pt = candidateProductType(c);
  if (pt === '个人经营性贷款') return false;
  return true;
}

function getCandidateInvestIndustryFilterOptions(task) {
  const t = normalizeTaskIndustryFields({ ...(task || {}) });
  const codes = IndustryScope.resolveCodes(getTaskInvestIndustryScope(t), t.investIndustryCustomCodes);
  return INDUSTRY_TABLE.filter(i => codes.includes(i.code));
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

function candidateAvgTotalAssets(c) {
  if (c?.avgTotalAssets != null) return formatLedgerAmountYuan(c.avgTotalAssets);
  const cur = Number(c?.totalAssets);
  const prev = Number(c?.prevYearTotalAssets);
  if (!cur && !prev) return '-';
  const avgWan = prev ? (cur + prev) / 2 : cur;
  return formatLedgerAmountYuan(avgWan);
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
    <td>${formatLedgerAmountYuan(c.avgMonthlyBalance)}</td>
    <td>${formatLedgerAmountYuan(c.operatingRevenue ?? c.revenue)}</td>
    <td>${candidateAvgTotalAssets(c)}</td>
    <td>${c.manager || '-'}</td>`;
}

const CANDIDATE_LIST_TABLE_HEAD = `
  <th>一级分行</th><th>经办行</th><th>客户名称</th><th>客户规模</th><th>信贷品种</th><th>业务种类</th><th>贷款账号</th>
  <th>投放日</th><th>贷款主体类型</th><th>企业所属行业</th><th>贷款投向所属行业</th>
  <th>月均贷款余额（元）</th><th>年报营业收入（元）</th><th>平均资产总额（元）</th><th>主办客户经理</th>`;

const CALCULATION_LIST_TABLE_HEAD = `
  ${CANDIDATE_LIST_TABLE_HEAD}
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
