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
    { href: 'branch-board.html', label: '数据补录' },
    { href: 'manager-tasks.html', label: '客户经理任务' },
    { href: 'supplement-fill.html', label: '在线补录填报' }
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

/** 客户经理仅可访问数据补录相关路由 */
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
    toast('未找到补录记录', 'warning');
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
  toast('已提交审核！请前往绿金系统「待办事项」处理（演示：状态已更新为审批中）', 'success');
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

/** 数据补录模块页面不展示核算六步流程条 */
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

function filterTasks(tasks, filters) {
  const f = filters || {};
  return tasks.filter(t => {
    if (f.name && !(t.name || '').toLowerCase().includes(f.name.trim().toLowerCase())) return false;
    if (f.year && String(t.year) !== String(f.year)) return false;
    if (f.industryScope && t.industryScope !== f.industryScope) return false;
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
  const scope = t.industryScope || '八大高碳行业';
  const customCodes = t.industryCustomCodes || [];
  return `
    <div class="form-item"><label>${label('任务名称')}</label><input name="name" ${readonly ? '' : 'required'} value="${t.name || ''}" ${ro}></div>
    <div class="form-item"><label>${label('核算年度')}</label>
      ${renderTaskYearField(t.year || TASK_YEAR_MIN, {
        readonly,
        legacyReadonly: !readonly && isLegacyTaskYear(t.year)
      })}
      ${!readonly && !isLegacyTaskYear(t.year) ? `<span class="field-hint">${TASK_YEAR_MIN}–${TASK_YEAR_MAX}，与接口同步台账年度一致</span>` : ''}
    </div>
    <div class="form-item"><label>${label('行业范围')}</label>
      <select name="industryScope" id="industryScopeSelect" ${readonly ? '' : 'required'} ${dis}>
        <option value="八大高碳行业" ${scope === '八大高碳行业' ? 'selected' : ''}>八大高碳行业</option>
        <option value="八大+扩展" ${scope === '八大+扩展' ? 'selected' : ''}>八大+扩展</option>
        <option value="自定义" ${scope === '自定义' ? 'selected' : ''}>自定义</option>
      </select>
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
    <div class="form-item"><label>${label('截止日期')}</label>
      <input type="date" name="deadline" ${readonly ? '' : 'required'} value="${t.deadline || ''}" ${ro}>
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
    <div class="form-item"><label>${label('数据采集截止')}</label>
      <input type="datetime-local" name="dataCutoffAt" value="${t.dataCutoffAt ? t.dataCutoffAt.replace(' ', 'T').slice(0, 16) : ''}" ${ro}>
    </div>
    <div class="form-item full" id="customIndustryWrap" style="display:${scope === '自定义' ? '' : 'none'}">
      <label>${label('自定义行业')}</label>
      ${scope === '自定义' ? renderCustomIndustryPanel(customCodes, readonly) : ''}
    </div>`;
}

function readTaskFormPayload(form) {
  const industryScope = form.industryScope.value;
  const industryCustomCodes = industryScope === '自定义' ? getSelectedCustomIndustryCodes() : [];
  return {
    name: form.name.value,
    year: clampTaskYear(form.year.value),
    industryScope,
    industryCustomCodes,
    industryCodes: IndustryScope.resolveCodes(industryScope, industryCustomCodes),
    orgScope: form.orgScope.value,
    balanceRule: form.balanceRule?.value || '月均余额',
    goal: form.goal.value,
    deadline: form.deadline.value,
    initiatorOrg: form.initiatorOrg?.value || 'hq',
    initiatorBranch: form.initiatorBranch?.value || form.orgScope?.value || '北京分行',
    dataCutoffAt: form.dataCutoffAt?.value ? form.dataCutoffAt.value.replace('T', ' ') + ':00' : null
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
  const scopeSelect = qs('#industryScopeSelect');
  const customWrap = qs('#customIndustryWrap');
  if (!scopeSelect || !customWrap) return;
  const toggle = () => {
    const isCustom = scopeSelect.value === '自定义';
    customWrap.style.display = isCustom ? '' : 'none';
    if (isCustom && !qs('#customIndustryPanel', customWrap) && !scopeSelect.disabled) {
      customWrap.insertAdjacentHTML('beforeend', renderCustomIndustryPanel());
      bindCustomIndustryPanel();
    }
  };
  scopeSelect.addEventListener('change', toggle);
  toggle();
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

function formatFormalEntityEmission(taskId, formalId) {
  const v = Store.getFormalEntityEmission?.(taskId, formalId);
  return v != null ? formatNum(v) : '—';
}

function renderCalculationListCells(f, calc, taskId) {
  return `
    ${renderCandidateListCells(formalLedgerRow(f, taskId))}
    <td>${calc?.entityEmission != null ? formatNum(calc.entityEmission) : formatFormalEntityEmission(taskId, f.id)}</td>
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

function collectModeLabel(mode) {
  return mode === 'mandatory' ? '必收数' : '经济法直算';
}

function collectModeBadge(mode) {
  return mode === 'mandatory'
    ? '<span class="badge badge-warning">必收数</span>'
    : '<span class="badge badge-primary">经济法直算</span>';
}

const DATA_COLLECT_STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'pending_lock', label: '待锁定' },
  { value: 'pending_dispatch', label: '未派发' },
  { value: 'pending_economy', label: '待直算' },
  { value: 'economy_done', label: '已直算' },
  { value: 'pending_fill', label: '待填报/待提交' },
  { value: 'in_progress', label: '填报中' },
  { value: 'branch_review', label: '分行初审' },
  { value: 'hq_review', label: '总行终审' },
  { value: 'approved', label: '已完成' },
  { value: 'returned', label: '已退回' }
];

function getDataCollectRowStatus(formal, supplement) {
  if (formal.status !== 'confirmed') return 'pending_lock';
  if (supplement) {
    if (supplement.status === 'returned') return 'returned';
    if (supplement.status === 'pending') return 'pending_fill';
    if (supplement.status === 'in_progress') return 'in_progress';
    if (supplement.status === 'completed') {
      const stage = supplement.auditStage || 'pending_fill';
      if (stage === 'approved') return 'approved';
      if (stage === 'pending_fill') return 'pending_fill';
      if (stage === 'branch_review') return 'branch_review';
      if (stage === 'hq_review') return 'hq_review';
      return 'branch_review';
    }
    return 'pending_fill';
  }
  const mode = formal.collectMode || resolveCollectMode(formal.loanType);
  if (mode === 'economy_direct') {
    return formal.economyDirectStatus === 'done' ? 'economy_done' : 'pending_economy';
  }
  return 'pending_dispatch';
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
    if (f.collectMode) {
      const mode = formal.collectMode || resolveCollectMode(formal.loanType);
      if (mode !== f.collectMode) return false;
    }
    if (f.status && getDataCollectRowStatus(formal, supp) !== f.status) return false;
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

function economyDirectStatusBadge(formal) {
  if (formal.collectMode !== 'economy_direct') return '<span class="badge badge-draft">—</span>';
  if (formal.economyDirectStatus === 'done') return '<span class="badge badge-success">已直算</span>';
  if (formal.status !== 'confirmed') return '<span class="badge badge-draft">待锁定</span>';
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
      该笔数据已由管理员驳回，请重新填报。${reason}
    </div>`;
  }
  return `<div class="demo-tip" style="border-color:#f56c6c;background:#fef0f0;color:#c45656;margin-bottom:12px">
    该笔数据已被驳回或未通过审核，请修改后重新提交。${s.rejectReason ? `原因：${escapeHtml(s.rejectReason)}` : '可在「审批流程」查看完整记录。'}
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
  if (level === 'admin') return '管理员驳回';
  if (level === 'submit') return '提交审核';
  return '审核';
}

function supplementActiveTab(s) {
  const id = s?.methodId;
  if (id === 'energy') return 'energy';
  if (id === 'product') {
    if (typeof SUPPLEMENT_FIELDS !== 'undefined' && !SUPPLEMENT_FIELDS.productSupported(s)) return 'report';
    return 'product';
  }
  if (id === 'economy_fallback') return 'other';
  if (id === 'economy') {
    if (isEconomyTabLockedForSupplement(s)) return 'report';
    return 'economy';
  }
  return 'report';
}

function getFormalForSupplement(s) {
  if (!s?.formalId) return null;
  return Store.get().formalList.find(f => f.id === s.formalId);
}

/** 数据采集为经济法直算且仍下发补录任务时，经济活动法 Tab 仅可查看 */
function isEconomyTabLockedForSupplement(s) {
  if (!s?.formalId || !s.dispatchedAt) return false;
  const formal = getFormalForSupplement(s);
  if (!formal) return false;
  const mode = formal.collectMode || resolveCollectMode(formal.loanType || s.loanType);
  return mode === 'economy_direct';
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
  { id: 'report', label: '报告法' },
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
    rejected: ['已驳回', 'badge-danger'],
    voided: ['已作废', 'badge-draft']
  };
  const [text, cls] = map[status] || [status, 'badge-draft'];
  return `<span class="badge ${cls}">${text}</span>`;
}

function approvalStatusLabel(status) {
  return {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
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
        ${reason ? `<div class="approval-timeline-reason"><span class="label">${a.reviewLevel === 'admin' ? '驳回原因' : '审批原因'}</span>${escapeHtml(reason)}</div>` : ''}
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
    ? `<div class="demo-tip" style="border-color:#f56c6c;background:#fef0f0;color:#c45656;margin-top:12px">驳回原因：${escapeHtml(s.rejectReason)}</div>`
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

/** 与补录填报页一致的表单区域（支持只读） */
function renderSupplementFillBody(s, options = {}) {
  const readonly = !!options.readonly;
  const dis = readonly ? 'disabled' : '';
  const economyLocked = isEconomyTabLockedForSupplement(s);
  const economyDis = readonly || economyLocked ? 'disabled' : '';
  const activeTab = supplementActiveTab(s);
  const tabCls = (t) => {
    let cls = 'tab';
    if (activeTab === t) cls += ' active';
    if (t === 'economy' && economyLocked) cls += ' tab-locked';
    return cls;
  };
  const panelCls = (t) => {
    let cls = 'tab-panel';
    if (activeTab === t) cls += ' active';
    if (t === 'economy' && economyLocked) cls += ' tab-panel-locked';
    return cls;
  };
  const directView = economyLocked ? getEconomyDirectViewData(s) : null;
  const basis = directView?.economyBasis || s.economyBasis || 'revenue';
  const economyValue = directView?.economyValue ?? s.economyValue ?? s.revenue ?? '';
  const economyFactor = directView?.economyFactor ?? s.economyFactor ?? 2.35;
  const fallbackFactor = s.fallbackFactor ?? s.economyFactor ?? 2.46;
  const methodTabs = getSupplementMethodTabs(s);
  const economyLockTip = economyLocked
    ? `<div class="locked-tip">该笔业务在数据采集环节已选择<strong>经济法直算</strong>，经济活动法数据由系统直算生成，此处<strong>不可编辑</strong>，仅供查看。${directView?.economyDirectStatus === 'done' ? `直算时间：${directView.economyDirectAt || '—'}。` : '（直算尚未完成）'}${directView?.entityEmission != null ? ` 主体排放：${formatNum(directView.entityEmission)} tCO₂e。` : ''}</div>`
    : '';

  return `
    <div class="card"><div class="card-header"><h3>企业基本信息</h3></div>
    <div class="card-body form-grid">
      ${SUPPLEMENT_FIELDS.renderBasicInfo(s, dis)}
    </div></div>
    <div class="card"><div class="card-header"><h3>排放数据（择一填报）</h3></div>
    <div class="demo-tip method-priority-tip">方法优先级：报告法 → 物理活动法-能源法 → 物理活动法-产品法 → 经济活动法 → 其他计算法（见指引第七章）</div>
    <div class="tabs method-tabs-bar" id="methodTabs">
      ${methodTabs.map(t => `<div class="${tabCls(t.id)}" data-tab="${t.id}">${t.label}</div>`).join('')}
    </div>
    <div class="card-body">
      ${SUPPLEMENT_FIELDS.renderReportPanel(s, dis, panelCls('report'), 'report')}
      ${SUPPLEMENT_FIELDS.renderEnergyPanel(s, dis, panelCls('energy'), 'energy')}
      ${SUPPLEMENT_FIELDS.renderProductPanel(s, dis, panelCls('product'), 'product')}
      <div class="${panelCls('economy')}" data-panel="economy">
        ${economyLockTip}
        <div class="form-grid">
        <div class="form-item"><label>测算基数</label><select id="f_economy_basis" ${economyDis}>
          <option value="revenue" ${basis === 'revenue' ? 'selected' : ''}>营业收入</option>
          <option value="assets" ${basis === 'assets' ? 'selected' : ''}>资产规模</option>
        </select></div>
        <div class="form-item"><label>基数值(万元)</label><input id="f_economy_value" type="number" value="${economyValue}" ${economyDis}></div>
        <div class="form-item"><label>行业因子</label><input id="f_economy_factor" type="number" step="0.01" value="${economyFactor}" ${economyDis}></div>
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
    <button type="button" class="btn btn-danger" id="approvalRejectBtn">审核不通过</button>
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
            <textarea id="approvalConfirmReason" rows="3" placeholder="请填写审核不通过原因" style="width:100%"></textarea>
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
  qs('#approvalConfirmTitle').textContent = options.title || (isApprove ? '审核通过' : '审核不通过');
  qs('#approvalConfirmMessage').textContent = options.message || (isApprove ? '是否确认审核通过？' : '是否确认审核不通过？');
  const reasonWrap = qs('#approvalConfirmReasonWrap');
  const reasonInput = qs('#approvalConfirmReason');
  reasonWrap.style.display = isApprove ? 'none' : 'block';
  reasonInput.value = '';
  const okBtn = qs('#approvalConfirmOkBtn');
  okBtn.className = isApprove ? 'btn btn-success' : 'btn btn-danger';
  okBtn.textContent = '确认';
  okBtn.onclick = () => {
    if (!isApprove) {
      const reason = (reasonInput.value || '').trim();
      if (!reason) {
        toast('请填写审核原因', 'warning');
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
  return c.productType || c.loanType || '-';
}

function candidateIndustryLabel(c) {
  if (c.industryLabel) return c.industryLabel;
  if (c.gbIndustryCode && c.gbIndustryName) return `${c.gbIndustryCode} ${c.gbIndustryName}`;
  return c.industryMajor || '-';
}

function getDefaultCandidateFilterRules(task) {
  const t = task || {};
  const scopeCodes = IndustryScope.resolveCodes(t.industryScope, t.industryCustomCodes);
  const eightCodes = IndustryScope.getEightCodes();
  let industries;
  if (t.industryScope === '自定义') {
    industries = eightCodes.filter(c => scopeCodes.includes(c));
    if (!industries.length) industries = scopeCodes.slice();
  } else {
    industries = eightCodes.slice();
  }
  return {
    productTypes: (GUIDE.SCOPE_DEFAULT_PRODUCT_TYPES || []).slice(),
    borrowerTypes: (GUIDE.SCOPE_DEFAULT_BORROWER_TYPES || []).slice(),
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
    if (legacy.industry) {
      const code = String(legacy.industry).trim().split(/\s+/)[0];
      defaults.industries = [code];
    }
    defaults.balanceMin = legacy.balanceMin ?? defaults.balanceMin;
    defaults.balanceMax = legacy.balanceMax ?? '';
    defaults.customized = !!(legacy.productType || legacy.borrowerType || legacy.industry || legacy.tier1Branch || legacy.manager);
    return defaults;
  }
  return {
    productTypes: rules.productTypes || [],
    borrowerTypes: rules.borrowerTypes || [],
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

function getCandidateIndustryFilterOptions(task) {
  const codes = IndustryScope.resolveCodes(task?.industryScope, task?.industryCustomCodes);
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
  const industryOptions = getCandidateIndustryFilterOptions(task).map(i => ({
    value: i.code,
    label: `${i.code} ${i.name}`
  }));
  const scopeHint = task?.industryScope === '八大高碳行业'
    ? '默认按指引核算范畴筛选，仅展示纳入核算的数据'
    : '默认按八大高碳行业核算范畴筛选，可勾选调整后重新查询';
  return `
    <fieldset class="view-mode-fieldset"${viewOnly ? ' disabled' : ''}>
    <div class="filter-panel">
      <p class="candidate-filter-hint">${scopeHint} · 月均余额≥500万元 · 排除小微/个人/境外/非高碳行业</p>
      <div class="filter-extra candidate-filter-grid">
        <div class="form-item full">
          <label>业务品种</label>
          ${renderCandidateFilterCheckboxes('f_product', productOptions, rules.productTypes)}
        </div>
        <div class="form-item full">
          <label>贷款主体类型</label>
          ${renderCandidateFilterCheckboxes('f_borrower', borrowerOptions, rules.borrowerTypes)}
        </div>
        <div class="form-item full">
          <label>所属行业</label>
          ${renderCandidateFilterCheckboxes('f_industry', industryOptions, rules.industries)}
        </div>
        <div class="candidate-filter-row-2">
          <div class="form-item"><label>月均信贷余额(万元) 起</label>
            <input id="f_bal_min" type="number" placeholder="最小值" value="${rules.balanceMin ?? ''}"${dis}>
          </div>
          <div class="form-item"><label>月均信贷余额(万元) 止</label>
            <input id="f_bal_max" type="number" placeholder="最大值" value="${rules.balanceMax ?? ''}"${dis}>
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
    industries: checked('f_industry'),
    balanceMin: qs('#f_bal_min')?.value ?? '',
    balanceMax: qs('#f_bal_max')?.value ?? '',
    customized: true
  };
}

function candidateTier1Branch(c) {
  return c.tier1Branch || c.branch || '-';
}

/** 候选清单表格数据列（12 列） */
function renderCandidateListCells(c) {
  return `
    <td>${candidateTier1Branch(c)}</td>
    <td>${c.handlingBranch || '-'}</td>
    <td>${c.customerName}</td>
    <td>${candidateProductType(c)}</td>
    <td>${c.loanAccount || '-'}</td>
    <td>${c.disbursementAmount != null ? Number(c.disbursementAmount).toLocaleString() : '-'}</td>
    <td>${c.disbursementDate || '-'}</td>
    <td>${candidateBorrowerType(c)}</td>
    <td>${candidateIndustryLabel(c)}</td>
    <td>${c.avgMonthlyBalance ?? '-'}</td>
    <td>${c.operatingRevenue ?? c.revenue ?? '-'}</td>
    <td>${c.manager || '-'}</td>`;
}

const CANDIDATE_LIST_TABLE_HEAD = `
  <th>一级分行</th><th>经办行</th><th>客户名称</th><th>业务品种</th><th>贷款账号</th>
  <th>投放金额（元）</th><th>投放日</th><th>贷款主体类型</th><th>所属行业</th>
  <th>月均信贷余额（万元）</th><th>营业收入（万元）</th><th>业务经理</th>`;

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
    productType: r.productType || r.loanType,
    loanType: r.loanType,
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
    customerName: f.customerName,
    tier1Branch: f.tier1Branch || f.branch,
    handlingBranch: f.handlingBranch,
    productType: f.productType || f.loanType,
    loanType: f.loanType,
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
    manager: f.manager
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
function renderCustomIndustryPanel(selectedCodes, readonly) {
  const selected = new Set(selectedCodes || []);
  const grouped = IndustryScope.groupByMajor(INDUSTRY_TABLE);
  const majors = Object.keys(grouped);
  const dis = readonly ? 'disabled' : '';
  return `
    <div class="industry-custom-panel" id="customIndustryPanel">
      ${readonly ? '' : `<div class="industry-custom-toolbar">
        <span class="industry-custom-hint">请选择纳入核算的行业（可多选，显示：行业大类 · 行业名称）</span>
        <span class="industry-custom-actions">
          <button type="button" class="btn btn-sm" id="selectAllIndustries">全选</button>
          <button type="button" class="btn btn-sm" id="clearAllIndustries">清空</button>
          <span class="industry-selected-count">已选 <b id="industrySelectedCount">${selected.size}</b> / ${INDUSTRY_TABLE.length}</span>
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

function formatIndustryScopeDisplay(task) {
  if (!task) return '-';
  if (task.industryScope === '自定义' && task.industryCustomCodes?.length) {
    return '自定义（' + IndustryScope.summarizeCustom(task.industryCustomCodes) + '）';
  }
  return task.industryScope || '-';
}

function bindCustomIndustryPanel() {
  const panel = qs('#customIndustryPanel');
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
    const countEl = qs('#industrySelectedCount');
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

  qs('#selectAllIndustries')?.addEventListener('click', () => {
    qsa('.industry-code-check', panel).forEach(cb => { cb.checked = true; });
    syncMajorChecks();
  });

  qs('#clearAllIndustries')?.addEventListener('click', () => {
    qsa('.industry-code-check', panel).forEach(cb => { cb.checked = false; });
    syncMajorChecks();
  });

  syncMajorChecks();
}

function getSelectedCustomIndustryCodes() {
  return qsa('.industry-code-check:checked').map(cb => cb.value);
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

function qualityGradeBadge(grade) {
  if (grade == null) return '-';
  const labels = ['', '一级(优)', '二级', '三级', '四级', '五级(兜底)'];
  return `<span class="badge badge-primary">等级${grade} ${labels[grade] || ''}</span>`;
}
