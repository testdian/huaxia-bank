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
    { href: 'branch-board.html', label: '数据采集' },
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

/** 演示用客户经理（顶栏切换，用于分别填报多条采集任务） */
const DEMO_MANAGERS = [
  { user: '王磊', branch: '北京分行' },
  { user: '陈静', branch: '北京分行' },
  { user: '刘洋', branch: '北京分行' },
  { user: '赵敏', branch: '上海分行' },
  { user: '周强', branch: '深圳分行' },
  { user: '李娜', branch: '杭州分行' }
];

function getRoleContext(data) {
  const roleKey = data?.currentRole || 'hq';
  const base = ROLES[roleKey] || ROLES.hq;
  if (roleKey !== 'manager') return base;
  const mgr = DEMO_MANAGERS.find(m => m.user === data.currentManagerUser) || DEMO_MANAGERS[0];
  return { ...base, user: mgr.user, branch: mgr.branch };
}

/** 客户经理仅可访问数据采集相关路由 */
const MANAGER_ALLOWED_ROUTES = ['#/branch-board', '#/manager-tasks', '#/supplement-fill'];
const MANAGER_ONLY_ROUTES = MANAGER_ALLOWED_ROUTES;
/** 企业碳账户：仅总行、分行 */
const CARBON_ACCOUNT_ROUTES = ['#/carbon-accounts', '#/carbon-account'];

function canEditCarbonAccount(roleKey) {
  return roleKey === 'hq';
}

function canManageCarbonAccountStatus(roleKey) {
  return roleKey === 'hq' || roleKey === 'branch';
}
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
  const role = getRoleContext(data);
  const task = Store.getCurrentTask();
  const path = location.pathname.split('/').pop() || 'dashboard.html';

  document.body.insertAdjacentHTML('afterbegin', `
    <header class="app-header">
      <div class="logo">华夏银行 · 绿金系统</div>
      <div class="breadcrumb">投融资碳核算 <span>/</span> ${pageTitle}</div>
      <div class="header-actions">
        <button type="button" class="btn-changelog" id="changelogBtn" title="查看页面更新说明">更新说明</button>
        <select id="roleSwitch" title="切换演示角色">
          <option value="hq" ${data.currentRole === 'hq' ? 'selected' : ''}>总行绿金部</option>
          <option value="branch" ${data.currentRole === 'branch' ? 'selected' : ''}>分行负责人</option>
          <option value="manager" ${data.currentRole === 'manager' ? 'selected' : ''}>客户经理</option>
        </select>
        ${data.currentRole === 'manager' ? `<select id="managerSwitch" title="切换客户经理">
          ${DEMO_MANAGERS.map(m => `<option value="${m.user}" ${m.user === (data.currentManagerUser || DEMO_MANAGERS[0].user) ? 'selected' : ''}>${m.user} · ${m.branch}</option>`).join('')}
        </select>` : ''}
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

  const changelogBtn = document.getElementById('changelogBtn');
  if (changelogBtn) changelogBtn.onclick = () => openUpdateChangelogDrawer();

  document.getElementById('roleSwitch').onchange = e => {
    Store.update(d => {
      d.currentRole = e.target.value;
      const r = getRoleContext({ ...d, currentRole: e.target.value });
      d.currentUser = r.user;
      if (e.target.value === 'manager' && !d.currentManagerUser) {
        d.currentManagerUser = DEMO_MANAGERS[0].user;
      }
    });
    toast('已切换为：' + ROLES[e.target.value].label, 'success');
    setTimeout(() => location.reload(), 400);
  };

  const managerSwitch = document.getElementById('managerSwitch');
  if (managerSwitch) {
    managerSwitch.onchange = e => {
      const mgr = DEMO_MANAGERS.find(m => m.user === e.target.value) || DEMO_MANAGERS[0];
      Store.update(d => {
        d.currentManagerUser = mgr.user;
        d.currentUser = mgr.user;
      });
      toast(`已切换客户经理：${mgr.user}（${mgr.branch}）`, 'success');
      setTimeout(() => location.reload(), 400);
    };
  }

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

/** 全局确认弹窗（替代原生 confirm） */
function ensureConfirmDialog() {
  let modal = qs('#confirmDialog');
  if (modal) return modal;
  const root = qs('#modalRoot') || document.body;
  root.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="confirmDialog">
      <div class="modal confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmDialogTitle">
        <div class="modal-header">
          <h4 id="confirmDialogTitle">提示</h4>
          <button type="button" class="modal-close" id="confirmDialogClose" aria-label="关闭">&times;</button>
        </div>
        <div class="modal-body">
          <p class="confirm-dialog-message" id="confirmDialogMessage"></p>
          <div class="confirm-dialog-detail" id="confirmDialogDetail" hidden></div>
        </div>
        <div class="modal-footer confirm-dialog-footer">
          <button type="button" class="btn btn-cancel" id="confirmDialogCancel">取消</button>
          <button type="button" class="btn btn-confirm btn-primary" id="confirmDialogOk">确认</button>
        </div>
      </div>
    </div>`);
  return qs('#confirmDialog');
}

/**
 * 显示统一确认弹窗
 * @param {object|string} options - 配置或主文案
 * @param {string} [options.title='提示']
 * @param {string} options.message - 主问题
 * @param {string} [options.detail] - 补充说明，支持 HTML
 * @param {string} [options.confirmText='确认']
 * @param {string} [options.cancelText='取消']
 * @param {boolean} [options.danger=false] - 危险操作（删除等）使用红色确认按钮
 * @param {object} [options.select] - 可选下拉：{ label, options: [{value,label}], defaultValue }
 * @returns {Promise<boolean|{ok:boolean,value:string}>}
 */
function showConfirmDialog(options) {
  const opts = typeof options === 'string'
    ? { message: options }
    : (options || {});
  const title = opts.title || '提示';
  const message = opts.message || '';
  const detail = opts.detail || '';
  const confirmText = opts.confirmText || '确认';
  const cancelText = opts.cancelText || '取消';
  const danger = !!opts.danger;
  const selectCfg = opts.select || null;

  ensureConfirmDialog();
  const overlay = qs('#confirmDialog');
  const titleEl = qs('#confirmDialogTitle');
  const msgEl = qs('#confirmDialogMessage');
  const detailEl = qs('#confirmDialogDetail');
  const okBtn = qs('#confirmDialogOk');
  const cancelBtn = qs('#confirmDialogCancel');
  const closeBtn = qs('#confirmDialogClose');

  titleEl.textContent = title;
  msgEl.textContent = message;
  let detailHtml = detail || '';
  if (selectCfg?.options?.length) {
    const def = selectCfg.defaultValue ?? selectCfg.options[0]?.value ?? '';
    const optsHtml = selectCfg.options.map(o =>
      `<option value="${escapeHtml(String(o.value))}" ${String(o.value) === String(def) ? 'selected' : ''}>${escapeHtml(o.label || o.value)}</option>`
    ).join('');
    detailHtml += `
      <div class="confirm-dialog-select">
        <label for="confirmDialogSelect">${escapeHtml(selectCfg.label || '请选择')}</label>
        <select id="confirmDialogSelect" class="input">${optsHtml}</select>
      </div>`;
  }
  if (detailHtml) {
    detailEl.innerHTML = detailHtml;
    detailEl.hidden = false;
  } else {
    detailEl.innerHTML = '';
    detailEl.hidden = true;
  }
  okBtn.textContent = confirmText;
  cancelBtn.textContent = cancelText;
  okBtn.classList.toggle('btn-confirm-danger', danger);
  okBtn.classList.toggle('btn-primary', !danger);

  return new Promise(resolve => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      hideModal('confirmDialog');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onOverlay);
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onOk = () => {
      if (selectCfg?.options?.length) {
        const sel = qs('#confirmDialogSelect');
        finish({ ok: true, value: sel?.value ?? selectCfg.defaultValue ?? selectCfg.options[0]?.value ?? '' });
        return;
      }
      finish(true);
    };
    const onCancel = () => {
      if (selectCfg?.options?.length) finish({ ok: false, value: '' });
      else finish(false);
    };
    const onOverlay = (e) => {
      if (e.target === overlay) onCancel();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onOk();
    };
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onOverlay);
    document.addEventListener('keydown', onKey);
    showModal('confirmDialog');
    setTimeout(() => okBtn.focus(), 0);
  });
}

/** 兼容旧代码：禁止原生 confirm，引导使用 showConfirmDialog */
window.confirm = function confirmDeprecated() {
  console.warn('[confirm] 请改用 showConfirmDialog()，原生 confirm 已禁用');
  return false;
};
window.showConfirmDialog = showConfirmDialog;

/** 批量导入弹窗 — 统一样式：下载模板 → 上传文件 → 导入历史 */
window.BatchImportModal = {
  _state: { file: null, options: null },

  ensureModal() {
    let modal = qs('#batchImportModal');
    if (modal) return modal;
    const root = qs('#modalRoot');
    if (!root) return null;
    root.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="batchImportModal">
        <div class="modal modal-xl batch-import-modal">
          <div class="modal-header">
            <h4 id="batchImportModalTitle">导入</h4>
            <button type="button" class="modal-close" id="batchImportModalClose">&times;</button>
          </div>
          <div class="modal-body" id="batchImportModalBody"></div>
          <div class="modal-footer" id="batchImportModalFooter"></div>
        </div>
      </div>`);
    modal = qs('#batchImportModal');
    qs('#batchImportModalClose').onclick = () => this.close();
    return modal;
  },

  importStatusBadge(status) {
    if (status === 'success') return '<span class="badge badge-success">导入成功</span>';
    if (status === 'processing') return '<span class="badge badge-warning">导入中</span>';
    if (status === 'partial') return '<span class="badge badge-warning">部分成功</span>';
    return '<span class="badge badge-danger">导入失败</span>';
  },

  renderHistoryTable(history, options = {}) {
    const rows = history || [];
    if (!rows.length) {
      return `<div class="batch-import-empty">
        <div class="batch-import-empty-icon">📋</div>
        <p>暂无数据</p>
      </div>`;
    }
    const showOps = options.showOps !== false;
    return `<div class="table-wrap batch-import-history-wrap"><table class="data-table batch-import-history-table">
      <thead><tr>
        <th>文件名称</th><th>文件总条数</th><th>成功条数</th><th>异常条数</th>
        <th>导入状态</th><th>原因描述</th><th>数据状态</th><th>操作人</th><th>导入时间</th>
        ${showOps ? '<th>操作</th>' : ''}
      </tr></thead>
      <tbody>${rows.map(row => {
        const ops = [];
        if (showOps && row.errorCount > 0 && row.errorReport) {
          ops.push(`<button type="button" class="btn-link batch-import-err-btn" data-id="${escapeHtml(row.id || '')}">异常数据</button>`);
        }
        return `<tr>
          <td>${escapeHtml(row.fileName || '—')}</td>
          <td>${row.total ?? '—'}</td>
          <td>${row.imported ?? '—'}</td>
          <td>${row.errorCount ?? '—'}</td>
          <td>${this.importStatusBadge(row.status)}</td>
          <td class="batch-import-reason">${escapeHtml((row.reason || row.errorReport || '—').slice(0, 40))}${(row.reason || row.errorReport || '').length > 40 ? '…' : ''}</td>
          <td>${escapeHtml(row.dataStatus || (row.status === 'success' ? '已入库' : '—'))}</td>
          <td>${escapeHtml(row.operator || '—')}</td>
          <td>${escapeHtml(row.importTime || '—')}</td>
          ${showOps ? `<td>${ops.join(' · ') || '—'}</td>` : ''}
        </tr>`;
      }).join('')}</tbody>
    </table></div>`;
  },

  renderBody(options) {
    const step1 = options.step1Text || '1、请下载导入模板，按模板格式填写';
    const step2 = options.step2Text || BATCH_IMPORT_STEP2_TEXT;
    const fileName = this._state.file?.name || '';
    const history = typeof options.getHistory === 'function' ? options.getHistory() : [];
    return `
      <div class="batch-import-steps">
        <div class="batch-import-step-box">
          <p class="batch-import-step-text">${escapeHtml(step1)}</p>
          <button type="button" class="btn" id="batchImportDownloadBtn">下载模板</button>
        </div>
        <div class="batch-import-step-box">
          <p class="batch-import-step-text">${escapeHtml(step2)}</p>
          <button type="button" class="btn" id="batchImportUploadBtn">上传文件</button>
          <input type="file" id="batchImportFileInput" accept="${escapeHtml(options.accept || BATCH_IMPORT_ACCEPT)}" hidden>
          ${fileName ? `<p class="batch-import-file-name">已选择：${escapeHtml(fileName)}</p>` : ''}
        </div>
      </div>
      <div class="batch-import-history-section">
        <div class="batch-import-history-head">
          <h4>导入历史</h4>
          <button type="button" class="btn btn-primary btn-sm" id="batchImportRefreshBtn">刷新</button>
        </div>
        <div id="batchImportHistoryHost">${this.renderHistoryTable(history, options)}</div>
      </div>`;
  },

  refreshHistory() {
    const options = this._state.options;
    if (!options) return;
    const host = qs('#batchImportHistoryHost');
    if (!host) return;
    const history = typeof options.getHistory === 'function' ? options.getHistory() : [];
    host.innerHTML = this.renderHistoryTable(history, options);
    this.bindHistoryEvents(options);
  },

  bindHistoryEvents(options) {
    qsa('.batch-import-err-btn', qs('#batchImportModalBody')).forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.id;
        const record = typeof options.getRecord === 'function' ? options.getRecord(id) : null;
        if (!record?.errorReport) return;
        if (!ensureReviewModal()) return;
        qs('#reviewModal')?.querySelector('.modal')?.classList.add('modal-lg');
        qs('#reviewModalTitle').textContent = '异常数据 · ' + (record.fileName || '');
        qs('#reviewModalBody').innerHTML = `<pre class="factor-import-error-report">${escapeHtml(record.errorReport)}</pre>`;
        qs('#reviewModalFooter').innerHTML = `<button type="button" class="btn" onclick="hideModal('reviewModal')">关闭</button>`;
        showModal('reviewModal');
      };
    });
  },

  bindEvents(options) {
    const body = qs('#batchImportModalBody');
    if (!body) return;
    qs('#batchImportDownloadBtn', body)?.addEventListener('click', () => {
      if (typeof options.onDownloadTemplate === 'function') options.onDownloadTemplate();
    });
    qs('#batchImportUploadBtn', body)?.addEventListener('click', () => {
      qs('#batchImportFileInput', body)?.click();
    });
    qs('#batchImportFileInput', body)?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      this._state.file = file || null;
      body.innerHTML = this.renderBody(options);
      this.bindEvents(options);
      this.bindHistoryEvents(options);
    });
    qs('#batchImportRefreshBtn', body)?.addEventListener('click', () => this.refreshHistory());
    this.bindHistoryEvents(options);
  },

  open(options) {
    if (!this.ensureModal()) return;
    this._state = { file: null, options };
    const title = options.title || '导入';
    qs('#batchImportModalTitle').textContent = title;
    qs('#batchImportModalBody').innerHTML = this.renderBody(options);
    qs('#batchImportModalFooter').innerHTML = `
      <button type="button" class="btn" id="batchImportCancelBtn">取消</button>
      <button type="button" class="btn btn-primary" id="batchImportConfirmBtn">确认</button>`;
    qs('#batchImportCancelBtn').onclick = () => this.close();
    qs('#batchImportConfirmBtn').onclick = async () => {
      const file = this._state.file;
      if (!file) {
        toast('请先上传文件', 'warning');
        return;
      }
      const maxMb = options.maxSizeMb || 200;
      if (file.size > maxMb * 1024 * 1024) {
        toast(`文件大小不能超过 ${maxMb}M`, 'warning');
        return;
      }
      if (typeof options.onConfirm === 'function') {
        const btn = qs('#batchImportConfirmBtn');
        if (btn) { btn.disabled = true; btn.textContent = '导入中…'; }
        try {
          await options.onConfirm(file, () => {
            this._state.file = null;
            this.refreshHistory();
            const body = qs('#batchImportModalBody');
            if (body) {
              body.innerHTML = this.renderBody(options);
              this.bindEvents(options);
            }
          });
        } finally {
          if (btn) { btn.disabled = false; btn.textContent = '确认'; }
        }
      }
    };
    this.bindEvents(options);
    showModal('batchImportModal');
  },

  close() {
    this._state = { file: null, options: null };
    hideModal('batchImportModal');
  }
};

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

function getCollectEmissionEligibleFormals(taskId, data) {
  const d = data || (typeof Store !== 'undefined' ? Store.get() : null);
  if (!d) return [];
  return (d.formalList || []).filter(f =>
    f.taskId === taskId
    && f.status === 'confirmed'
    && typeof getEffectiveEntityEmission === 'function'
    && getEffectiveEntityEmission(taskId, f.id) != null
  );
}

/** 数据采集 / 排放计算清单共用归集单元列表 */
function getDataCollectTableGroups(taskId, data) {
  if (typeof Store === 'undefined') return [];
  return Store.getCollectGroups(taskId);
}

function getWorkflowMaxClickStep(task, progressStep) {
  const maxIdx = WORKFLOW_STEP_NAMES.length - 1;
  if (progressStep >= WORKFLOW_STEP.REPORT) return maxIdx;
  let maxClick = Math.max(0, Math.min(progressStep ?? 0, maxIdx));
  const step = task?.workflowStep ?? WORKFLOW_STEP.CANDIDATES;
  const hasConfirmedFormal = task?.id && typeof Store !== 'undefined'
    ? Store.getFormalList(task.id).some(f => f.status === 'confirmed')
    : false;
  if (hasConfirmedFormal || step >= WORKFLOW_STEP.DATA_COLLECTION) {
    maxClick = Math.max(maxClick, WORKFLOW_STEP.CALCULATION);
  }
  return maxClick;
}

function demoSteps(current, options = {}) {
  const { taskId, clickable = false, maxStep, viewMode = isTaskViewMode(), taskProgressStep, task } = options;
  const maxIdx = WORKFLOW_STEP_NAMES.length - 1;
  const progressStep = maxStep != null ? maxStep : current;
  const maxClickIdx = clickable
    ? getWorkflowMaxClickStep(task || (taskId ? Store.getTask(taskId) : null), progressStep)
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

/** 数据采集模块页面不展示核算六步流程条 */
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
    task,
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

/** 任务「数据行业范围」口径：投向 / 所属（决定候选清单筛选依据） */
function getTaskDataIndustryScopeKind(task) {
  const kind = task?.dataIndustryScopeKind;
  return kind === 'subject' ? 'subject' : 'invest';
}

function getTaskDataIndustryScopeKey(task) {
  normalizeTaskIndustryFields(task);
  return getTaskDataIndustryScopeKind(task) === 'invest'
    ? getTaskInvestIndustryScope(task)
    : getTaskSubjectIndustryScope(task);
}

function getTaskDataIndustryCustomCodes(task) {
  normalizeTaskIndustryFields(task);
  return getTaskDataIndustryScopeKind(task) === 'invest'
    ? (task.investIndustryCustomCodes || [])
    : (task.industryCustomCodes || []);
}

function getTaskDataIndustryCodes(task) {
  normalizeTaskIndustryFields(task);
  const kind = getTaskDataIndustryScopeKind(task);
  if (kind === 'invest') {
    const scope = getTaskInvestIndustryScope(task);
    if (task.investIndustryCodes?.length) return task.investIndustryCodes;
    const custom = scope === '自定义' ? (task.investIndustryCustomCodes || []) : [];
    return IndustryScope.resolveCodes(scope, custom);
  }
  const scope = getTaskSubjectIndustryScope(task);
  if (task.industryCodes?.length) return task.industryCodes;
  const custom = scope === '自定义' ? (task.industryCustomCodes || []) : [];
  return IndustryScope.resolveCodes(scope, custom);
}

function resolveTaskDataIndustryLabels(task) {
  const codes = getTaskDataIndustryCodes(task);
  if (!codes.length) return [];
  const nameMap = typeof IndustryCascade !== 'undefined' ? IndustryCascade.nameMap() : {};
  const table = typeof INDUSTRY_TABLE !== 'undefined' ? INDUSTRY_TABLE : [];
  return codes.map(code => {
    const s = String(code || '').trim();
    if (!s) return '';
    const row = table.find(i => i.code === s || i.code === s.replace(/^[A-Z]/, ''));
    if (row) return IndustryScope.label(row);
    const nm = nameMap[s] || nameMap[s.replace(/^[A-Z]/, '')];
    return nm ? `${s} ${nm}` : s;
  }).filter(Boolean);
}

function formatTaskDataIndustryScopeDisplay(task) {
  normalizeTaskIndustryFields(task);
  const scopeKey = getTaskDataIndustryScopeKey(task);
  const normalized = normalizeIndustryScopeValue(scopeKey);
  if (normalized === INDUSTRY_SCOPE_KEY_EIGHT) return INDUSTRY_SCOPE_LABEL_EIGHT;
  if (normalized === INDUSTRY_SCOPE_KEY_EXTENDED) return INDUSTRY_SCOPE_LABEL_EXTENDED;
  if (normalized === '自定义') return '自定义';
  return normalized || '—';
}

function formatTaskDataIndustryScopeBrief(task) {
  return formatTaskDataIndustryScopeDisplay(task);
}

function renderTaskDataIndustryScopeCell(task) {
  return escapeHtml(formatTaskDataIndustryScopeDisplay(task));
}

function openTaskDataIndustryScopeModal(taskId) {
  const task = typeof Store !== 'undefined' ? Store.getTask(taskId) : null;
  if (!task) return;
  normalizeTaskIndustryFields(task);
  const kindLabel = getTaskDataIndustryScopeKind(task) === 'invest' ? '投向行业范围' : '所属行业范围';
  const scopeLabel = formatSingleIndustryScopeDisplay(
    getTaskDataIndustryScopeKey(task),
    getTaskDataIndustryCustomCodes(task)
  );
  const labels = resolveTaskDataIndustryLabels(task);
  const tagsHtml = labels.length
    ? labels.map(l => `<span class="industry-tag">${escapeHtml(l)}</span>`).join('')
    : '<p style="color:#909399;margin:0">暂无已选行业</p>';

  let modal = qs('#taskDataIndustryModal');
  if (!modal) {
    const root = qs('#modalRoot');
    if (!root) return;
    root.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="taskDataIndustryModal">
        <div class="modal modal-md">
          <div class="modal-header"><h4 id="taskDataIndustryModalTitle">数据行业范围</h4><button type="button" class="modal-close" id="closeTaskDataIndustryModal">&times;</button></div>
          <div class="modal-body">
            <p id="taskDataIndustryModalMeta" style="margin:0 0 12px;font-size:13px;color:#606266"></p>
            <div id="taskDataIndustryModalTags" class="industry-detail-tags"></div>
          </div>
          <div class="modal-footer"><button type="button" class="btn btn-primary" id="closeTaskDataIndustryModalBtn">关闭</button></div>
        </div>
      </div>`);
    modal = qs('#taskDataIndustryModal');
    const close = () => hideModal('taskDataIndustryModal');
    qs('#closeTaskDataIndustryModal').onclick = close;
    qs('#closeTaskDataIndustryModalBtn').onclick = close;
  }
  qs('#taskDataIndustryModalTitle').textContent = `数据行业范围 · ${task.name || taskId}`;
  qs('#taskDataIndustryModalMeta').textContent = `${kindLabel} · ${scopeLabel} · 共 ${labels.length} 项`;
  qs('#taskDataIndustryModalTags').innerHTML = tagsHtml;
  showModal('taskDataIndustryModal');
}

function normalizeTaskIndustryFields(task) {
  if (!task) return task;
  if (!task.subjectIndustryScope) task.subjectIndustryScope = task.industryScope || INDUSTRY_SCOPE_KEY_EIGHT;
  if (!task.investIndustryScope) task.investIndustryScope = task.industryScope || INDUSTRY_SCOPE_KEY_EIGHT;
  task.subjectIndustryScope = normalizeIndustryScopeValue(task.subjectIndustryScope);
  task.investIndustryScope = normalizeIndustryScopeValue(task.investIndustryScope);
  task.industryScope = task.subjectIndustryScope;
  if (!task.dataIndustryScopeKind) task.dataIndustryScopeKind = 'invest';
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
  const required = showRequired && !readonly;
  const t = normalizeTaskOrgScopeFields({ ...(task || {}) });
  const whole = isTaskOrgScopeWholeBank(t);
  const selected = new Set(t.branches || []);
  if (readonly) {
    return `<div class="form-item full"><label class="field-label"><span class="field-label-text">组织范围</span></label>
      <input readonly value="${formatTaskOrgScopeDisplay(t)}"></div>`;
  }
  return `<div class="form-item full">${taskFormLabel('组织范围', required)}
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
    toast('请填写数据采集截止日期', 'warning');
    form.deadline?.focus();
    return false;
  }
  if (!form.branchDeadline?.value) {
    toast('请填写分行审批截止日期', 'warning');
    form.branchDeadline?.focus();
    return false;
  }
  if (form.deadline.value >= form.branchDeadline.value) {
    toast('数据采集截止日期须早于分行审批截止日期', 'warning');
    form.deadline?.focus();
    return false;
  }
  if (!form.balanceRule?.value) {
    toast('请选择余额口径', 'warning');
    return false;
  }
  return true;
}

function addCalendarDays(dateStr, days) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 数据采集截止须早于分行审批截止：联动 date 控件可选范围 */
function bindTaskDeadlineValidation(rootEl) {
  const root = rootEl || document;
  const collect = qs('[name="deadline"]', root);
  const branch = qs('[name="branchDeadline"]', root);
  if (!collect || !branch || collect.disabled || branch.disabled) return;
  const sync = () => {
    const collectVal = collect.value;
    const branchVal = branch.value;
    collect.max = branchVal ? addCalendarDays(branchVal, -1) : '';
    branch.min = collectVal ? addCalendarDays(collectVal, 1) : '';
    if (collectVal && branchVal && collectVal >= branchVal) {
      collect.setCustomValidity('数据采集截止日期须早于分行审批截止日期');
      branch.setCustomValidity('分行审批截止日期须晚于数据采集截止日期');
    } else {
      collect.setCustomValidity('');
      branch.setCustomValidity('');
    }
  };
  collect.addEventListener('change', sync);
  branch.addEventListener('change', sync);
  collect.addEventListener('input', sync);
  branch.addEventListener('input', sync);
  sync();
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
  const dataScopeFilter = f.dataIndustryScope
    || f.investIndustryScope
    || f.industryScope
    || '';
  return tasks.filter(t => {
    normalizeTaskIndustryFields(t);
    if (f.name && !(t.name || '').toLowerCase().includes(f.name.trim().toLowerCase())) return false;
    if (f.year && String(t.year) !== String(f.year)) return false;
    if (dataScopeFilter && getTaskDataIndustryScopeKey(t) !== dataScopeFilter) return false;
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

function renderLedgerBranchFilterSelect(selectId, selected, disabled = false) {
  const val = selected || '';
  const opts = getLedgerBranchOptions().map(b =>
    `<option value="${escapeHtml(b)}" ${val === b ? 'selected' : ''}>${escapeHtml(b)}</option>`
  ).join('');
  return `<select id="${selectId}"${disabled ? ' disabled' : ''}><option value="">全部</option>${opts}</select>`;
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

function getRoleScopedLedgerFilters(filters, roleKey) {
  const scoped = { ...(filters || {}) };
  const currentRole = roleKey || (typeof Store !== 'undefined' ? Store.get().currentRole : '');
  if (currentRole === 'branch') {
    scoped.branch = ROLES.branch?.branch || '北京分行';
  }
  return scoped;
}

function filterLedgerDetailGroups(groups, filters, taskId, data) {
  const f = getRoleScopedLedgerFilters(filters);
  const d = data || (typeof Store !== 'undefined' ? Store.get() : null);
  return (groups || []).filter(group => {
    if (f.branch) {
      const b = f.branch.trim();
      if (!(group.dispatchBranch || '').includes(b)) return false;
    }
    if (f.handlingBranch) {
      const h = f.handlingBranch.trim();
      const formals = (group.memberFormalIds || [])
        .map(fid => d?.formalList?.find(x => x.id === fid))
        .filter(Boolean);
      const matched = formals.some(formal => {
        const row = typeof formalLedgerRow === 'function' ? formalLedgerRow(formal, taskId) : formal;
        return (row.handlingBranch || '').includes(h);
      });
      if (!matched) return false;
    }
    if (f.customer) {
      const kw = f.customer.trim().toLowerCase();
      if (!(group.customerName || '').toLowerCase().includes(kw)) return false;
    }
    return true;
  });
}

function getLedgerDetailGroups(taskId, filters) {
  const d = typeof Store !== 'undefined' ? Store.get() : null;
  const groups = getDataCollectTableGroups(taskId, d);
  return filterLedgerDetailGroups(groups, filters, taskId, d);
}

function splitLedgerDetailGroupsByBucket(groups) {
  const nonProject = [];
  const project = [];
  (groups || []).forEach(g => {
    if (g.bucket && g.bucket !== 'non_project') project.push(g);
    else nonProject.push(g);
  });
  return { nonProject, project };
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
  return getLedgerDetailGroups(taskId, filters);
}

function ledgerGroupExportRowValues(group, taskId, data, sectionLabel) {
  const d = data || Store.get();
  const supp = supplementForCollectGroup(d, taskId, group.id);
  const summary = summarizeCollectGroupCalculations(group, taskId, d);
  const primary = summary.primary;
  const calc = primary
    ? (d.calculations || []).find(c => c.taskId === taskId && c.formalId === primary.id)
    : null;
  const emissions = primary
    ? formatDataCollectEmissionCells(primary, supp, calc)
    : { systemHtml: '—', manualHtml: '—', effectiveHtml: '—' };
  const strip = (html) => String(html || '—').replace(/<[^>]+>/g, '').trim() || '—';
  return [
    sectionLabel,
    group.customerName || '—',
    group.creditCode || '—',
    collectGroupBucketDisplay(group),
    group.memberCount || summary.members.length || 0,
    group.dispatchBranch || '—',
    group.assignedManager || '—',
    group.accountingIndustryLabel || group.accountingIndustryCode || '—',
    strip(primary ? systemAccountingMethodBadge(primary, taskId, d) : '—'),
    strip(emissions.systemHtml),
    strip(primary ? manualAccountingMethodBadge(primary, taskId, d, supp) : '—'),
    strip(emissions.manualHtml),
    strip(emissions.effectiveHtml),
    summary.attributedEmission != null ? formatNum(summary.attributedEmission) : '—',
    summary.qualityGrade || '—'
  ];
}

const LEDGER_GROUP_EXPORT_HEADERS = [
  '板块', '客户', '信用代码', '业务种类', '归并笔数', '下发分行', '主办客户经理', '归集核算行业',
  '系统核算方法', '系统主体排放（tCO₂e）', '手动核算方法', '手动主体排放（tCO₂e）',
  '排放结果（tCO₂e）', '归因排放（tCO₂e）', '质量等级'
];

function exportLedgerDetailGroupCsv(task, filters, options = {}) {
  const taskId = task?.id;
  if (!taskId) return;
  const bucket = options.bucket || 'all';
  const d = Store.get();
  const groups = getLedgerDetailGroups(taskId, filters);
  const { nonProject, project } = splitLedgerDetailGroupsByBucket(groups);
  let exportGroups = [];
  if (bucket === 'non_project') exportGroups = nonProject.map(g => ({ g, section: '非项目' }));
  else if (bucket === 'project') exportGroups = project.map(g => ({ g, section: '项目' }));
  else {
    exportGroups = [
      ...nonProject.map(g => ({ g, section: '非项目' })),
      ...project.map(g => ({ g, section: '项目' }))
    ];
  }
  if (!exportGroups.length) return false;
  const rows = exportGroups.map(({ g, section }) => ledgerGroupExportRowValues(g, taskId, d, section));
  const suffix = bucket === 'non_project' ? '-非项目' : bucket === 'project' ? '-项目' : '';
  const name = task?.name ? `${task.name}-排放计算清单${suffix}` : `排放计算清单${suffix}`;
  downloadCsvFile(name, ['任务名称', '核算年度', ...LEDGER_GROUP_EXPORT_HEADERS],
    rows.map(r => [task.name, task.year, ...r]));
  return true;
}

function renderLedgerDetailGroupTableSection(title, groups, taskId, data, options = {}) {
  const colCount = calculationGroupTableColCount();
  const rowOptions = { showExpand: true, hideLoanAccount: true, ...options };
  const rowsHtml = groups.length
    ? groups.map(g => renderCalculationGroupTableRow(g, taskId, data, rowOptions)).join('')
    : `<tr><td colspan="${colCount}" style="text-align:center;padding:32px;color:#909399">暂无数据</td></tr>`;
  return `
    <div class="card ledger-detail-section">
      <div class="card-header"><h3>${escapeHtml(title)}</h3></div>
      <div class="card-body table-wrap">
        <table class="data-table">
          <thead><tr>${renderCalculationGroupTableHead()}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    </div>`;
}

function renderLedgerDetailGroupSections(taskId, filters, data) {
  const d = data || Store.get();
  const groups = getLedgerDetailGroups(taskId, filters);
  const { nonProject, project } = splitLedgerDetailGroupsByBucket(groups);
  return {
    groups,
    html: `
      ${renderLedgerDetailGroupTableSection('非项目', nonProject, taskId, d)}
      ${renderLedgerDetailGroupTableSection('项目', project, taskId, d)}`
  };
}

function filterLedgerTasks(tasks, filters, roleKey) {
  const f = getRoleScopedLedgerFilters(filters, roleKey);
  return (tasks || []).filter(t => {
    normalizeTaskIndustryFields(t);
    if (!taskHasLedgerData(t.id)) return false;
    if (f.year && String(t.year) !== String(f.year)) return false;
    if (f.taskName && !(t.name || '').toLowerCase().includes(f.taskName.trim().toLowerCase())) return false;
    const dataScopeFilter = f.dataIndustryScope || f.investIndustryScope || f.industryScope || '';
    if (dataScopeFilter && getTaskDataIndustryScopeKey(t) !== dataScopeFilter) return false;
    if (f.branch) {
      const rows = getLedgerDetailRows(t.id, { branch: f.branch });
      if (!rows.length) return false;
    }
    return true;
  });
}

function ledgerCalculationRowValues(f, calc, taskId) {
  const c = typeof formalLedgerRow === 'function' ? formalLedgerRow(f, taskId) : f;
  const task = typeof Store !== 'undefined' ? Store.getTask(taskId) : null;
  const year = c?.accountingYear || task?.year;
  const monthVals = resolveCandidateMonthEndBalancesWan(c, year).map(v =>
    v != null ? formatLedgerAmountYuan(v) : '—'
  );
  return [
    candidateTier1Branch(c),
    c.handlingBranch || '-',
    c.customerName || '-',
    candidateCustomerScale(c),
    candidateProductType(c),
    candidateAccountingTypeLabel(c, { finalizeAccountingType: true }),
    candidateCreditReferenceNo(c),
    candidateCreditNo(c),
    c.disbursementDate || '-',
    candidateBorrowerType(c),
    candidateIndustryLabel(c),
    candidateInvestIndustryLabel(c),
    ...monthVals,
    formatLedgerAmountYuan(c.operatingRevenue ?? c.revenue),
    formatCandidatePrevYearTotalAssets(c),
    formatCandidateCurrentYearTotalAssets(c),
    c.manager || '-',
    calc?.attributedEmission != null ? formatNum(calc.attributedEmission) : '—',
    calc?.qualityGrade || '—'
  ];
}

const LEDGER_SUMMARY_EXPORT_HEADERS = ['任务名称', '核算年度', '数据行业范围', '台账笔数'];
const LEDGER_DETAIL_EXPORT_HEADERS = [
  '任务名称', '核算年度',
  '一级分行', '经办行', '客户名称', '企业规模', '信贷品种', '业务种类', '授信参考编号', '授信编号',
  '投放日', '贷款主体类型', '企业所属行业', '贷款投向所属行业',
  '月均贷款余额（元）',
  '营业收入（元）', '平均资产总额（元）', '主办客户经理',
  '归因排放(tCO₂e)', '质量等级'
];

function calculationListTableColCount() {
  return ledgerListTableColCount({ tailExtra: 2 });
}

function csvEscapeCell(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function readUploadFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsArrayBuffer(file);
  });
}

function readUploadFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file, 'UTF-8');
  });
}

function isBatchImportXlsxFile(file) {
  const name = (file?.name || '').toLowerCase();
  const type = (file?.type || '').toLowerCase();
  return name.endsWith('.xlsx') || name.endsWith('.xls')
    || type.includes('spreadsheetml') || type.includes('ms-excel');
}

function isBatchImportCsvFile(file) {
  const name = (file?.name || '').toLowerCase();
  const type = (file?.type || '').toLowerCase();
  return name.endsWith('.csv') || type.includes('csv') || type === 'text/plain';
}

/** 批量导入：统一读取 csv / xlsx，返回与 CSV 模板一致的文本供各 importFromCsv 解析 */
async function readBatchImportFileAsText(file) {
  if (!file) throw new Error('未选择文件');
  if (isBatchImportXlsxFile(file)) {
    if (typeof XLSX === 'undefined') throw new Error('Excel 解析组件未加载，请刷新页面后重试');
    const buf = await readUploadFileAsArrayBuffer(file);
    const wb = XLSX.read(buf, { type: 'array' });
    const sheetName = wb.SheetNames?.[0];
    if (!sheetName) throw new Error('Excel 文件中没有工作表');
    const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName], { FS: ',', RS: '\n', blankrows: false });
    if (!String(csv || '').trim()) throw new Error('Excel 工作表为空');
    return csv;
  }
  if (isBatchImportCsvFile(file)) return readUploadFileAsText(file);
  throw new Error('仅支持 csv、xlsx 格式');
}

const BATCH_IMPORT_ACCEPT = '.xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const BATCH_IMPORT_STEP2_TEXT = '2、上传文件，支持格式为：csv、xlsx，单个文件最大不超过 200M';

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
      formatTaskDataIndustryScopeBrief(t),
      count
    ];
  });
  downloadCsvFile('投融资碳核算台账-任务汇总', LEDGER_SUMMARY_EXPORT_HEADERS, rows);
}

function exportLedgerDetailCsv(tasks, filters) {
  (tasks || []).forEach(t => exportLedgerDetailGroupCsv(t, filters));
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

function taskFormLabel(text, required = false) {
  if (required) return renderFormLabel(text, { required: true });
  return `<label class="field-label"><span class="field-label-text">${escapeHtml(text)}</span></label>`;
}

function renderTaskIndustryScopeBlock(kind, task, options) {
  const { readonly = false, showRequired = true } = options;
  const required = showRequired && !readonly;
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
    <div class="form-item full">${taskFormLabel('行业范围', required)}
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
  const required = showRequired && !readonly;
  const t = task || {};
  const ro = readonly ? 'readonly' : '';
  const dis = readonly ? 'disabled' : '';
  normalizeTaskIndustryFields(t);
  normalizeTaskOrgScopeFields(t);
  const industryScopeFields = readonly
    ? `
    <div class="form-item full"><label class="field-label"><span class="field-label-text">投向行业范围</span></label>
      ${renderIndustryScopeRadios('investIndustryScope', getTaskInvestIndustryScope(t), { readonly, dis, groupId: 'investIndustryScopeGroup' })}
    </div>
    <div class="form-item full" id="investIndustryCascadeWrap">
      ${IndustryCascade.renderPanel(
        (t.investIndustryCustomCodes?.length ? t.investIndustryCustomCodes : IndustryCascade.presetCodes(getTaskInvestIndustryScope(t))),
        true,
        { wrapId: 'investIndustryCascadePanel', countId: 'investIndustrySelectedCount', summaryId: 'investIndustrySelectedSummary' }
      )}
    </div>
    <div class="form-item full"><label class="field-label"><span class="field-label-text">所属行业范围</span></label>
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
    <div class="form-item full">${taskFormLabel('数据行业范围', required)}
      ${renderIndustryScopeKindRadios(t.dataIndustryScopeKind || 'invest', false)}
    </div>
    <div id="investIndustryScopeBlock" class="task-industry-scope-block">
      ${renderTaskIndustryScopeBlock('invest', t, { readonly, showRequired })}
    </div>
    <div id="subjectIndustryScopeBlock" class="task-industry-scope-block" style="display:none">
      ${renderTaskIndustryScopeBlock('subject', t, { readonly, showRequired })}
    </div>`;
  return `
    <div class="form-item">${taskFormLabel('任务名称', required)}<input name="name" ${readonly ? '' : 'required'} value="${t.name || ''}" ${ro}></div>
    <div class="form-item">${taskFormLabel('核算年度', required)}
      ${renderTaskYearField(t.year || TASK_YEAR_MIN, {
        readonly,
        legacyReadonly: !readonly && isLegacyTaskYear(t.year)
      })}
    </div>
    ${industryScopeFields}
    ${renderTaskOrgScopeField(t, { readonly, dis, showRequired })}
    <div class="form-item">${taskFormLabel('余额口径', required)}
      <select name="balanceRule" ${readonly ? '' : 'required'} ${dis}>
        <option ${t.balanceRule === '月均余额' || !t.balanceRule ? 'selected' : ''}>月均余额</option>
        <option ${t.balanceRule === '年末余额' ? 'selected' : ''}>年末余额</option>
      </select>
    </div>
    <div class="form-item">${taskFormLabel('数据采集截止日期', required)}
      <input type="date" name="deadline" ${readonly ? '' : 'required'} value="${t.deadline || ''}" ${ro}>
      ${readonly ? '' : '<div class="field-hint">须早于分行审批截止日期</div>'}
    </div>
    <div class="form-item">${taskFormLabel('分行审批截止日期', required)}
      <input type="date" name="branchDeadline" ${readonly ? '' : 'required'} value="${t.branchDeadline || ''}" ${ro}>
      ${readonly ? '' : '<div class="field-hint">须晚于数据采集截止日期</div>'}
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
  const dataIndustryScopeKind = document.querySelector('input[name="industryScopeKind"]:checked')?.value === 'subject'
    ? 'subject'
    : 'invest';
  const org = readTaskOrgScopeFromForm(form);
  return {
    name: form.name.value,
    year: clampTaskYear(form.year.value),
    dataIndustryScopeKind,
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

async function confirmDeleteTask(taskId, taskName) {
  const ok = await showConfirmDialog({
    message: '是否确认删除当前核算任务？',
    detail: `任务：<strong>${escapeHtml(taskName || '')}</strong>`,
    danger: true
  });
  if (!ok) return;
  Store.deleteTask(taskId);
  toast('已删除核算任务', 'success');
  setListPage('tasks', 1);
  location.hash = '#/tasks';
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

function getSupplementForFormal(taskId, formalId, d) {
  d = d || (typeof Store !== 'undefined' ? Store.get() : null);
  if (!d) return null;
  if (typeof supplementForFormalInTask === 'function') {
    return supplementForFormalInTask(d, taskId, formalId);
  }
  if (typeof Store !== 'undefined' && Store.findSupplementForFormal) {
    return Store.findSupplementForFormal(d, taskId, formalId);
  }
  return (d.supplements || []).find(s => s.formalId === formalId && s.taskId === taskId) || null;
}

function isSupplementManualVisible(supp) {
  if (!supp?.dispatchedAt) return false;
  if (supp.status === 'completed') return true;
  return ['branch_review', 'hq_review', 'approved'].includes(supp.auditStage || '');
}

function isSupplementCollectEmissionVisible(supp) {
  // 只有客户经理已提交（completed）或进入审核阶段，才显示手动主体排放
  // 草稿/填报中状态下禁止用预填数据提前展示
  return isSupplementManualVisible(supp);
}

function isSupplementCollectMethodVisible(supp) {
  return isSupplementManualVisible(supp);
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
  const d = Store.get();
  const supp = typeof supplementForFormalInTask === 'function'
    ? supplementForFormalInTask(d, taskId, formalId)
    : d.supplements.find(s => s.formalId === formalId && s.taskId === taskId);
  if (!isSupplementManualVisible(supp)) return '—';
  const e = Store.calcEntityEmission(supp);
  if (e == null || Number.isNaN(Number(e))) return '—';
  return formatNum(e) + renderEmissionOverwriteSuffix(supp);
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
  const supp = getSupplementForFormal(taskId, formalId);
  if (!isSupplementCollectEmissionVisible(supp)) return null;
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
  if (isSupplementCollectEmissionVisible(supp)) {
    const e = Store.calcEntityEmission(supp);
    if (e != null && !Number.isNaN(Number(e))) {
      manualVal = Number(e);
      manualHtml = formatNum(manualVal) + renderEmissionOverwriteSuffix(supp);
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
  const overwriteSuffix = renderEmissionOverwriteSuffix(supp);
  const effectiveHtml = effective != null ? formatNum(effective) + (manualVal != null ? overwriteSuffix : '') : '—';
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
    } else if (payload.legalEntityEmission == null) {
      payload.legalEntityEmission = Math.max(1, Math.round(Number(entityEmission) * 0.12));
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
  const task = typeof Store !== 'undefined' ? Store.getTask(taskId) : null;
  return `
    ${renderCandidateListCells(formalLedgerRow(f, taskId), { finalizeAccountingType: true, listKind: 'formal', task })}
    <td>${calc?.attributedEmission != null ? formatNum(calc.attributedEmission) : '—'}</td>
    <td>${calc?.qualityGrade ? qualityGradeBadge(calc.qualityGrade) : '—'}</td>`;
}

const CALCULATION_GROUP_TABLE_COL_COUNT = 14;

function calculationGroupTableColCount() {
  return CALCULATION_GROUP_TABLE_COL_COUNT;
}

function renderCalculationGroupTableHead() {
  return `<th>客户</th><th>信用代码</th><th>业务种类</th><th>归并笔数</th><th>下发分行</th><th>主办客户经理</th><th>归集核算行业</th><th>系统核算方法</th><th>系统主体排放（tCO₂e）</th><th>手动核算方法</th><th>手动主体排放（tCO₂e）</th><th>排放结果（tCO₂e）</th><th>归因排放（tCO₂e）</th><th>质量等级</th>`;
}

function getCalculationEligibleGroups(taskId, data) {
  return getDataCollectTableGroups(taskId, data);
}

function summarizeCollectGroupCalculations(group, taskId, data) {
  const d = data || (typeof Store !== 'undefined' ? Store.get() : null);
  if (!d || !group) {
    return { members: [], primary: null, memberCalcs: [], attributedEmission: null, qualityGrade: null };
  }
  const formals = (d.formalList || []).filter(f => f.taskId === taskId);
  const calcsByFormal = new Map();
  (d.calculations || []).filter(c => c.taskId === taskId).forEach(c => calcsByFormal.set(c.formalId, c));
  const eligibleIds = new Set(getCollectEmissionEligibleFormals(taskId, d).map(f => f.id));
  const members = (group.memberFormalIds || [])
    .map(fid => formals.find(f => f.id === fid))
    .filter(f => f && eligibleIds.has(f.id));
  const memberCalcs = members.map(f => calcsByFormal.get(f.id)).filter(Boolean);
  const withAttr = memberCalcs.filter(c => c.attributedEmission != null);
  const attributedEmission = withAttr.reduce((s, c) => s + (Number(c.attributedEmission) || 0), 0);
  let qualityGrade = null;
  if (withAttr.length && attributedEmission > 0) {
    const weighted = withAttr.reduce((s, c) =>
      s + (Number(c.attributedEmission) || 0) * (c.qualityGrade || 5), 0) / attributedEmission;
    qualityGrade = Math.min(5, Math.max(1, Math.round(weighted)));
  }
  return {
    members,
    primary: members[0] || null,
    memberCalcs,
    attributedEmission: withAttr.length ? attributedEmission : null,
    qualityGrade
  };
}

function renderCalculationGroupTableCells(group, taskId, data, options = {}) {
  const d = data || (typeof Store !== 'undefined' ? Store.get() : null);
  const { showExpand = true } = options;
  const supp = supplementForCollectGroup(d, taskId, group.id);
  const summary = summarizeCollectGroupCalculations(group, taskId, d);
  const primary = summary.primary;
  const calc = primary
    ? (d?.calculations || []).find(c => c.taskId === taskId && c.formalId === primary.id)
    : null;
  const { systemHtml, manualHtml, effectiveHtml } = primary
    ? formatDataCollectEmissionCells(primary, supp, calc)
    : { systemHtml: '—', manualHtml: '—', effectiveHtml: '—' };
  const industryNote = group.accountingIndustrySource === 'customer'
    ? '<span class="text-muted" style="font-size:12px">（多投向归客户行业）</span>'
    : '';
  const customerCell = showExpand
    ? `<span class="candidate-branch-cell">
        <button type="button" class="candidate-expand-toggle collect-group-expand" data-group-id="${group.id}" aria-expanded="false" title="展开逐笔明细"><span class="candidate-expand-icon"></span></button>
        <span>${group.customerName || '—'}</span>
      </span>`
    : (group.customerName || '—');
  return `
    <td>${customerCell}</td>
    <td>${group.creditCode || '—'}</td>
    <td>${collectGroupBucketDisplay(group, d)}</td>
    <td>${group.memberCount || summary.members.length || 0}</td>
    <td>${group.dispatchBranch || '—'}</td>
    <td>${group.assignedManager || '—'}</td>
    <td>${group.accountingIndustryLabel || group.accountingIndustryCode || '—'}${industryNote}</td>
    <td>${primary ? systemAccountingMethodBadge(primary, taskId, d) : '—'}</td>
    <td>${systemHtml}</td>
    <td>${primary ? manualAccountingMethodBadge(primary, taskId, d, supp) : '—'}</td>
    <td>${manualHtml}</td>
    <td>${effectiveHtml}</td>
    <td>${summary.attributedEmission != null ? formatNum(summary.attributedEmission) : '—'}</td>
    <td>${summary.qualityGrade ? qualityGradeBadge(summary.qualityGrade) : '—'}</td>`;
}

function renderCalculationGroupTableRow(group, taskId, data, options = {}) {
  const d = data || (typeof Store !== 'undefined' ? Store.get() : null);
  const formals = (d?.formalList || []).filter(f => f.taskId === taskId);
  const candidatesById = new Map();
  (d?.candidates || []).filter(c => c.taskId === taskId).forEach(c => candidatesById.set(c.id, c));
  const viewOnly = options.viewOnly ?? isTaskViewMode();
  const memberTable = renderCollectGroupMemberTable(group, formals, candidatesById, taskId, d, viewOnly, options);
  return `<tr class="collect-group-row" data-group-id="${group.id}">
    ${renderCalculationGroupTableCells(group, taskId, d, options)}
  </tr>
  <tr class="collect-group-detail-row" data-detail-for="${group.id}" hidden>
    <td colspan="${calculationGroupTableColCount()}">${memberTable}</td>
  </tr>`;
}

function bindCollectGroupExpandRows(root) {
  const scope = root || document;
  scope.querySelectorAll('.collect-group-expand').forEach(btn => {
    btn.addEventListener('click', () => {
      const gid = btn.dataset.groupId;
      const detail = scope.querySelector(`tr.collect-group-detail-row[data-detail-for="${gid}"]`);
      if (!detail) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      btn.classList.toggle('is-expanded', !expanded);
      detail.hidden = expanded;
    });
  });
}

function dispatchStatusBadge(formal, supplement) {
  if (formal.status !== 'confirmed') return '<span class="badge badge-draft">待锁定</span>';
  if (!supplement) return '<span class="badge badge-warning">未派发</span>';
  return '<span class="badge badge-success">已派发</span>';
}

function fillStatusBadge(supplement) {
  if (!supplement) return '<span class="badge badge-draft">—</span>';
  const map = {
    pending: ['待填报', 'badge-draft'],
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
  if (supplement.status === 'pending') return '<span class="badge badge-draft">待填报</span>';
  if (supplement.status === 'in_progress') return '<span class="badge badge-running">填报中</span>';
  if (supplement.status === 'completed') {
    const stage = supplement.auditStage || 'pending_fill';
    if (stage === 'approved') return '<span class="badge badge-success">已通过</span>';
    if (stage === 'branch_review' || stage === 'hq_review') {
      return '<span class="badge badge-running">待审核</span>';
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
  const supp = getSupplementForFormal(taskId, formal.id, d);
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
  const systemEmission = typeof getSystemEntityEmissionValue === 'function'
    ? getSystemEntityEmissionValue(taskId, formal.id)
    : null;

  if (formal.gelanEntityEmission != null || calc?.source === 'gelan') {
    if (systemEmission == null && formal.gelanEntityEmission == null) return '—';
    return CarbonAccount.resolveAccountMethodLabel(d, ctx) || CarbonAccount.METHOD_LABEL.REPORT_OTHER;
  }
  if (formal.economyDirectStatus === 'done' || calc?.source === 'economy_direct') {
    if (systemEmission == null && formal.economyDirectStatus !== 'done') return '—';
    return CarbonAccount.resolveAccountMethodLabel(d, ctx) || CarbonAccount.METHOD_LABEL.ECONOMY_REVENUE;
  }
  if (calc?.source === 'credit_fallback' && systemEmission != null) {
    return calc?.method || '其他计算法';
  }
  return '—';
}

function supplementHasManualMethodData(supp) {
  if (!supp) return false;
  if (supp.approvedMethodId) return true;
  return supp.reportedEmission != null
    || supp.energyTotalEmission != null
    || supp.productTotalEmission != null
    || supp.economyValue != null
    || supp.fallbackFactor != null;
}

/** 手动核算方法：收集任务提交后的客户经理填报口径
 * @param {object|null|undefined} supplement 归集单元级 supplement；传 null 表示未派发，不再回查 formalId
 */
function resolveManualAccountingMethodLabel(formal, taskId, d, supplement) {
  d = d || (typeof Store !== 'undefined' ? Store.get() : null);
  if (!formal || !d || typeof CarbonAccount === 'undefined') return '—';

  const supp = supplement !== undefined
    ? supplement
    : getSupplementForFormal(taskId, formal.id, d);
  if (!isSupplementCollectMethodVisible(supp)) return '—';
  if (!supplementHasManualMethodData(supp)) return '—';

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

function manualAccountingMethodBadge(formal, taskId, d, supplement) {
  return accountingMethodBadge(resolveManualAccountingMethodLabel(formal, taskId, d, supplement));
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

/** 收集状态五档（筛选项与列表展示，保留供内部逻辑兼容使用） */
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

const DATA_COLLECT_AUDIT_STATUS_LABELS = {
  none: ['未进入审核', 'badge-draft'],
  branch_review: ['分行初审', 'badge-warning'],
  hq_review: ['总行终审', 'badge-warning'],
  approved: ['已完成', 'badge-success'],
  returned: ['已退回', 'badge-danger']
};

/** @deprecated 兼容旧引用 */
const DATA_COLLECT_STATUS_OPTIONS = DATA_COLLECT_COLLECTION_STATUS_OPTIONS.concat(
  DATA_COLLECT_AUDIT_STATUS_OPTIONS.filter(o => o.value && !['none', 'returned'].includes(o.value))
);

/**
 * 统一「数据状态」筛选项（替代旧的收集状态+审核状态双字段）
 * 未派发显示 —；派发后：待填报 / 填报中 / 系统计算完成 / 待分行初审 / 待总行终审 / 填报完成
 */
const DATA_STATUS_OPTIONS = [
  { value: '',              label: '全部' },
  { value: 'none',          label: '—' },
  { value: 'pending_fill',  label: '待填报' },
  { value: 'in_progress',   label: '填报中' },
  { value: 'system_done',   label: '系统计算完成' },
  { value: 'branch_review', label: '待分行初审' },
  { value: 'hq_review',     label: '待总行终审' },
  { value: 'done',          label: '填报完成' },
];

const DATA_STATUS_LABELS = {
  none:          ['—',            ''],
  pending_fill:  ['待填报',       'badge-draft'],
  in_progress:   ['填报中',       'badge-running'],
  system_done:   ['系统计算完成', 'badge-info'],
  branch_review: ['待分行初审',   'badge-warning'],
  hq_review:     ['待总行终审',   'badge-warning'],
  done:          ['填报完成',     'badge-success'],
};

/** 采集任务是否已发放（客户经理可见） */
function isCollectTaskDispatched(supplement) {
  return !!(supplement && supplement.dispatchedAt);
}

/** 从 formal + supplement 推导统一数据状态
 *  - 未发放采集任务 → none（列表显示 —）
 *  - 已发放、仅有系统数据 → system_done（系统计算完成）
 *  - 已发放、客户经理已提交并通过 → done（填报完成）
 */
function getDataStatus(formal, supplement, taskId, d) {
  if (!formal) return 'none';
  if (!isCollectTaskDispatched(supplement)) return 'none';

  if (supplement.status === 'returned') return 'pending_fill';
  if (supplement.status === 'pending') {
    if (formal.economyDirectStatus === 'done') return 'system_done';
    if (typeof formalHasSystemEntityEmission === 'function' &&
        formalHasSystemEntityEmission(formal, taskId, d)) return 'system_done';
    return 'pending_fill';
  }
  if (supplement.status === 'in_progress') return 'in_progress';
  if (supplement.status === 'completed') {
    const stage = supplement.auditStage || '';
    if (stage === 'approved')      return 'done';
    if (stage === 'hq_review')     return 'hq_review';
    if (stage === 'branch_review') return 'branch_review';
    return 'in_progress';
  }
  return 'none';
}

/** 数据状态 badge */
function dataStatusBadge(formal, supplement, taskId, d) {
  const status = getDataStatus(formal, supplement, taskId, d);
  if (status === 'none') return '—';
  const [text, cls] = DATA_STATUS_LABELS[status] || ['待填报', 'badge-draft'];
  return `<span class="badge ${cls}">${text}</span>`;
}

/** 数据状态筛选下拉 */
function renderDataStatusOptions(selected) {
  return DATA_STATUS_OPTIONS.map(o =>
    `<option value="${o.value}" ${selected === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
}

/** 是否已有系统侧主体排放（与列表「系统主体排放」列口径一致） */
function formalHasSystemEntityEmission(formal, taskId, d) {
  if (!formal || !taskId) return false;
  if (formal.gelanEntityEmission != null && !Number.isNaN(Number(formal.gelanEntityEmission))) return true;
  if (formal.economyDirectStatus === 'done') return true;
  if (typeof getSystemEntityEmissionValue === 'function') {
    return getSystemEntityEmissionValue(taskId, formal.id) != null;
  }
  if (typeof Store !== 'undefined') {
    if (d && Store._formalHasEntityEmission) return Store._formalHasEntityEmission(d, taskId, formal);
    return Store.getFormalEntityEmission?.(taskId, formal.id) != null;
  }
  return false;
}

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

  if (formal.economyDirectStatus === 'done') return 'economy_done';
  if (formalHasSystemEntityEmission(formal, taskId, d)) return 'entity_collected';

  const mode = formal.collectMode || resolveCollectMode(formal.loanType);
  if (mode === 'mandatory') return 'pending_dispatch';
  const row = typeof formalLedgerRow === 'function' && taskId ? formalLedgerRow(formal, taskId) : formal;
  if (resolveAccountingType(row) === 'project_as_project' || isProjectAccountingPending(row)) {
    return 'need_supplement';
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

function dataCollectAuditStatusBadge(formal, supplement) {
  const status = getDataCollectAuditStatus(formal, supplement);
  const [text, cls] = DATA_COLLECT_AUDIT_STATUS_LABELS[status] || ['—', 'badge-draft'];
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

function getCalculationFilters(taskId) {
  try {
    return JSON.parse(sessionStorage.getItem(`calculation_filters_${taskId}`) || '{}');
  } catch {
    return {};
  }
}

function saveCalculationFilters(taskId, filters) {
  sessionStorage.setItem(`calculation_filters_${taskId}`, JSON.stringify(filters || {}));
}

function getActiveCalculationFilters(taskId, task) {
  const t = task || (typeof Store !== 'undefined' ? Store.getTask(taskId) : null);
  const lock = t?.calculationScopeLock;
  if (t?.resultsConfirmed && lock) {
    return {
      investMin: lock.investMin ?? '',
      investMax: lock.investMax ?? '',
      locked: true
    };
  }
  const f = getCalculationFilters(taskId);
  return { investMin: f.investMin ?? '', investMax: f.investMax ?? '', locked: false };
}

function parseCalculationInvestmentYuanFilter(value) {
  if (value == null || value === '') return null;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function hasCalculationInvestmentFilter(filters) {
  const f = filters || {};
  return parseCalculationInvestmentYuanFilter(f.investMin) != null
    || parseCalculationInvestmentYuanFilter(f.investMax) != null;
}

/** 项目总投资筛选仅作用于业务种类为项目类的归集单元（非项目类、项目按非项目计算不参与筛选） */
function isCalculationInvestmentFilterTargetGroup(group, taskId, data) {
  if (!group) return false;
  if (group.bucket === 'non_project' || group.bucket === 'project_as_non_project') return false;
  const d = data || (typeof Store !== 'undefined' ? Store.get() : null);
  const primaryId = group.memberFormalIds?.[0];
  if (!primaryId || !d) {
    return group.bucket === 'project' || group.bucket === 'project_as_project';
  }
  const primary = (d.formalList || []).find(f => f.id === primaryId && f.taskId === taskId);
  const cand = primary ? (d.candidates || []).find(c => c.id === primary.customerId) : null;
  const row = { ...(cand || {}), ...(primary || {}) };
  const accountingType = typeof resolveAccountingType === 'function'
    ? resolveAccountingType(row)
    : (primary?.accountingType || row.accountingType);
  if (accountingType === 'non_project' || accountingType === 'project_as_non_project') return false;
  if (group.bucket === 'project' || group.bucket === 'project_as_project') return true;
  const supp = supplementForCollectGroup(d, taskId, group.id);
  const bucket = typeof resolveCollectedProjectBucket === 'function'
    ? resolveCollectedProjectBucket(primary, cand, supp)
    : null;
  return bucket === 'project_as_project';
}

/** 归集单元项目总投资（元）：汇总组内项目明细，无项目投资额时返回 null */
function getCollectGroupProjectTotalInvestmentYuan(group, taskId, data) {
  const d = data || (typeof Store !== 'undefined' ? Store.get() : null);
  if (!d || !group) return null;
  const formals = (d.formalList || []).filter(f => f.taskId === taskId);
  const candidatesById = new Map(
    (d.candidates || []).filter(c => c.taskId === taskId).map(c => [c.id, c])
  );
  const supp = supplementForCollectGroup(d, taskId, group.id);
  const members = (group.memberFormalIds || [])
    .map(fid => formals.find(f => f.id === fid))
    .filter(Boolean);
  let totalWan = 0;
  let hasValue = false;
  members.forEach(f => {
    const cand = candidatesById.get(f.customerId);
    let details = Array.isArray(supp?.projectDetails) && supp.projectDetails.length
      ? supp.projectDetails
      : resolveFormalProjectDetails(f, cand);
    if (details.length) {
      details.forEach(p => {
        const wan = Number(p.projectTotalInvestmentWan);
        if (Number.isFinite(wan) && wan > 0) {
          totalWan += wan;
          hasValue = true;
        }
      });
      return;
    }
    const fallbackWan = Number(f.totalInvestment) || Number(supp?.totalInvestment);
    if (Number.isFinite(fallbackWan) && fallbackWan > 0) {
      totalWan += fallbackWan;
      hasValue = true;
    }
  });
  if (!hasValue) return null;
  return totalWan * 10000;
}

function filterCalculationGroupsByInvestment(groups, filters, taskId, data) {
  const minYuan = parseCalculationInvestmentYuanFilter(filters?.investMin);
  const maxYuan = parseCalculationInvestmentYuanFilter(filters?.investMax);
  if (minYuan == null && maxYuan == null) return groups || [];
  const d = data || (typeof Store !== 'undefined' ? Store.get() : null);
  return (groups || []).filter(group => {
    if (!isCalculationInvestmentFilterTargetGroup(group, taskId, d)) return true;
    const yuan = getCollectGroupProjectTotalInvestmentYuan(group, taskId, d);
    if (yuan == null) return false;
    if (minYuan != null && yuan < minYuan) return false;
    if (maxYuan != null && yuan > maxYuan) return false;
    return true;
  });
}

function getFormalIdsFromCalculationGroups(groups) {
  const ids = new Set();
  (groups || []).forEach(g => (g.memberFormalIds || []).forEach(id => ids.add(id)));
  return ids;
}

function getCalculationDisplayGroups(taskId, data) {
  const d = data || (typeof Store !== 'undefined' ? Store.get() : null);
  const task = typeof Store !== 'undefined' ? Store.getTask(taskId) : null;
  const all = getDataCollectTableGroups(taskId, d);
  if (task?.resultsConfirmed && task.calculationScopeLock?.formalIds?.length) {
    const idSet = new Set(task.calculationScopeLock.formalIds);
    return all.filter(g => (g.memberFormalIds || []).some(id => idSet.has(id)));
  }
  const filters = getCalculationFilters(taskId);
  if (!hasCalculationInvestmentFilter(filters)) return all;
  return filterCalculationGroupsByInvestment(all, filters, taskId, d);
}

function getCalculationScopedCalcs(taskId, data, groupsOverride) {
  const d = data || (typeof Store !== 'undefined' ? Store.get() : null);
  const task = typeof Store !== 'undefined' ? Store.getTask(taskId) : null;
  const eligibleIds = new Set(getCollectEmissionEligibleFormals(taskId, d).map(f => f.id));
  const calcs = (typeof Store !== 'undefined' ? Store.getCalculations(taskId) : [])
    .filter(c => eligibleIds.has(c.formalId));
  const scopedByLock = task?.resultsConfirmed && task.calculationScopeLock?.formalIds?.length;
  if (scopedByLock) {
    const lockIds = new Set(task.calculationScopeLock.formalIds);
    return calcs.filter(c => lockIds.has(c.formalId));
  }
  const groups = groupsOverride || getCalculationDisplayGroups(taskId, d);
  const filters = getCalculationFilters(taskId);
  if (!hasCalculationInvestmentFilter(filters)) return calcs;
  const scopedFormalIds = getFormalIdsFromCalculationGroups(groups);
  return calcs.filter(c => scopedFormalIds.has(c.formalId));
}

function calcDQRFromCalcs(calcs) {
  const list = (calcs || []).filter(c => c.attributedEmission > 0);
  if (!list.length) return null;
  const sum = list.reduce((s, c) => s + c.attributedEmission, 0);
  const dqr = list.reduce((s, c) => s + c.attributedEmission * (c.qualityGrade || 5), 0) / sum;
  const level = (typeof GUIDE !== 'undefined' && GUIDE.QUALITY_LEVELS)
    ? (GUIDE.QUALITY_LEVELS.find(l => dqr <= l.max)?.label || '一般')
    : '一般';
  const grade = typeof resolveDqrGrade === 'function' ? resolveDqrGrade(dqr) : null;
  return { dqr: dqr.toFixed(2), level, grade, count: list.length };
}

function formatCalculationScopeLockHint(task) {
  const lock = task?.calculationScopeLock;
  if (!lock) return '';
  const parts = [];
  if (lock.investMin != null && lock.investMin !== '') {
    parts.push(`起 ${Number(lock.investMin).toLocaleString('zh-CN', { maximumFractionDigits: 2 })} 元`);
  }
  if (lock.investMax != null && lock.investMax !== '') {
    parts.push(`止 ${Number(lock.investMax).toLocaleString('zh-CN', { maximumFractionDigits: 2 })} 元`);
  }
  const range = parts.length
    ? `项目类 · 项目总投资 ${parts.join('，')}（非项目类全量包含）`
    : '全量清单';
  const count = lock.groupCount != null ? `${lock.groupCount} 个归集单元` : '';
  return `${range}${count ? ` · ${count}` : ''}${lock.lockedAt ? ` · 锁定于 ${lock.lockedAt}` : ''}`;
}

function supplementForFormalInTask(d, taskId, formalId) {
  if (typeof Store !== 'undefined' && Store.findSupplementForFormal) {
    return Store.findSupplementForFormal(d, taskId, formalId);
  }
  const direct = (d?.supplements || []).find(s => s.taskId === taskId && s.formalId === formalId);
  if (direct) return direct;
  const formal = (d?.formalList || []).find(f => f.id === formalId && f.taskId === taskId);
  if (formal?.collectGroupId) {
    return (d?.supplements || []).find(s => s.taskId === taskId && s.collectGroupId === formal.collectGroupId) || null;
  }
  return null;
}

function supplementForCollectGroup(d, taskId, groupId) {
  if (typeof Store !== 'undefined' && Store.findSupplementForGroup) {
    return Store.findSupplementForGroup(d, taskId, groupId);
  }
  return (d?.supplements || []).find(s => s.taskId === taskId && s.collectGroupId === groupId) || null;
}

/** 项目类归集单元：收集填报完成后再按项目财务数据定档 */
function resolveCollectedProjectBucket(formal, candidate, supplement) {
  const row = {
    ...(candidate || {}),
    ...(formal || {}),
    projectDetails: supplement?.projectDetails ?? formal?.projectDetails ?? candidate?.projectDetails,
    projectInfoAvailable: supplement?.projectInfoAvailable ?? formal?.projectInfoAvailable ?? candidate?.projectInfoAvailable
  };
  if (!candidateIsProjectType(row)) return 'non_project';
  if (row.projectInfoAvailable === false) return 'project_as_non_project';
  const hasDetails = Array.isArray(row.projectDetails) && row.projectDetails.length > 0;
  if (hasDetails && !candidateProjectFinancialMissing(row)) return 'project_as_project';
  return 'project_as_non_project';
}

function collectGroupBucketDisplay(group, data) {
  if (!group) return '—';
  const CG = typeof CollectGroups !== 'undefined' ? CollectGroups : null;
  if (!CG) return group.bucket || '—';
  if (group.bucket === 'non_project') return CG.bucketLabel('non_project');
  const d = data || (typeof Store !== 'undefined' ? Store.get() : null);
  const taskId = group.taskId;
  const supp = supplementForCollectGroup(d, taskId, group.id);
  if (!supp || supp.status !== 'completed') {
    return CG.bucketLabel('project');
  }
  const primaryId = group.memberFormalIds?.[0];
  const primary = primaryId && d ? (d.formalList || []).find(f => f.id === primaryId) : null;
  const cand = primary ? (d.candidates || []).find(c => c.id === primary.customerId) : null;
  const bucket = resolveCollectedProjectBucket(primary, cand, supp);
  return CG.bucketLabel(bucket) || bucket || '—';
}

function collectGroupStatusBadge(group, supplement, taskId, d) {
  if (!group) return '—';
  const primaryId = group.memberFormalIds?.[0];
  const primary = (d?.formalList || []).find(f => f.id === primaryId);
  if (!primary) return '—';
  return dataCollectStatusBadge(primary, supplement, taskId, d);
}

function collectGroupAuditBadge(group, supplement, task, d) {
  if (!group) return '—';
  const data = d || (typeof Store !== 'undefined' ? Store.get() : null);
  const primaryId = group.memberFormalIds?.[0];
  const primary = (data?.formalList || []).find(f => f.id === primaryId);
  return dataCollectAuditStatusBadge(primary, supplement);
}

function filterCollectGroupsList(groups, filters, taskId, data) {
  const f = filters || {};
  const d = data || Store.get();
  return (groups || []).filter(group => {
    const supp = supplementForCollectGroup(d, taskId, group.id);
    if (f.keyword) {
      const kw = f.keyword.trim().toLowerCase();
      const hay = [
        group.customerName,
        group.creditCode,
        group.creditRefNo || group.projectNo,
        group.loanType,
        group.projectName,
        group.dispatchBranch,
        group.assignedManager,
        group.accountingIndustryLabel,
        group.accountingIndustryCode
      ].join(' ').toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    const dataStatus = f.dataStatus ?? '';
    if (dataStatus) {
      const primary = (d.formalList || []).find(x => x.id === group.memberFormalIds?.[0]);
      if (getDataStatus(primary, supp, taskId, d) !== dataStatus) return false;
    }
    // 兼容旧筛选字段（collectStatus / auditStatus）
    if (!dataStatus) {
      const collectStatus = normalizeDataCollectCollectFilter(f.collectStatus ?? f.status ?? '');
      const auditStatus = f.auditStatus ?? '';
      if (collectStatus) {
        const primary = (d.formalList || []).find(x => x.id === group.memberFormalIds?.[0]);
        if (getDataCollectCollectionTier(primary, supp, taskId, d) !== collectStatus) return false;
      }
      if (auditStatus) {
        const primary = (d.formalList || []).find(x => x.id === group.memberFormalIds?.[0]);
        if (getDataCollectAuditStatus(primary, supp) !== auditStatus) return false;
      }
    }
    return true;
  });
}

function renderCollectGroupMemberTable(group, formals, candidatesById, taskId, d, viewOnly, options = {}) {
  const hideLoanAccount = !!options.hideLoanAccount;
  const members = (group?.memberFormalIds || [])
    .map(fid => formals.find(f => f.id === fid))
    .filter(Boolean);
  if (!members.length) {
    return '<div style="padding:8px 12px;color:#909399">无关联逐笔记录</div>';
  }
  const task = typeof Store !== 'undefined' ? Store.getTask(taskId) : null;
  const isProjectGroup = group?.bucket && group.bucket !== 'non_project';

  if (isProjectGroup) {
    let seq = 0;
    const projectRows = members.flatMap(f => {
      const cand = candidatesById?.get(f.customerId);
      const details = resolveFormalProjectDetails(f, cand);
      if (details.length) {
        return details.map(p => {
          seq += 1;
          return `<tr>
            <td>${seq}</td>
            <td>${p.projectNo || f.creditRefNo || '—'}</td>
            <td>${p.projectName || f.projectName || '—'}</td>
            <td>${p.projectProvince || '—'}</td>
            <td>${p.projectIndustry || f.investIndustryCode || f.gbIndustryCode || cand?.gbIndustryCode || '—'}</td>
            <td>${p.customerNo || f.creditCode || cand?.creditCode || '—'}</td>
            <td>${p.customerName || f.customerName || '—'}</td>
            <td>${p.creditCode || f.creditCode || cand?.creditCode || '—'}</td>
            <td>${p.nationalIndustryCodeLv4 || f.gbIndustryCode || cand?.gbIndustryCode || '—'}</td>
            <td>${formatProjectWanAsYuan(p.projectAvgLoanBalanceWan)}</td>
            <td>${formatProjectWanAsYuan(p.projectRevenueWan)}</td>
            <td>${formatProjectWanAsYuan(p.projectTotalInvestmentWan)}</td>
          </tr>`;
        });
      }
      seq += 1;
      const balanceWan = candidateBalanceAmountWan(f, task?.year, task);
      return [`<tr>
        <td>${seq}</td>
        <td>${f.creditRefNo || f.projectNo || '—'}</td>
        <td>${f.projectName || '—'}</td>
        <td>—</td>
        <td>${f.investIndustryCode || f.gbIndustryCode || cand?.gbIndustryCode || '—'}</td>
        <td>${f.creditCode || cand?.creditCode || '—'}</td>
        <td>${f.customerName || '—'}</td>
        <td>${f.creditCode || cand?.creditCode || '—'}</td>
        <td>${f.gbIndustryCode || cand?.gbIndustryCode || '—'}</td>
        <td>${balanceWan ? formatLedgerAmountYuan(balanceWan) : '—'}</td>
        <td>—</td>
        <td>—</td>
      </tr>`];
    });
    return `<div class="collect-group-member-wrap">
      <div class="project-detail-title">项目明细</div>
      <div class="table-wrap"><table class="data-table project-detail-table">
        <thead><tr>
          <th>序号</th><th>授信编号</th><th>项目名称</th><th>项目所在地区域（省）</th><th>项目所属行业</th>
          <th>客户号</th><th>客户名称</th><th>统一社会信用代码</th><th>国民经济行业代码（4级）</th>
          <th>项目月均贷款余额（元）</th><th>项目收入（元）</th><th>项目总投资（元）</th>
        </tr></thead>
        <tbody>${projectRows.join('')}</tbody>
      </table></div>
    </div>`;
  }

  const rows = members.map(f => {
    const cand = candidatesById?.get(f.customerId);
    const ledgerRow = { ...(cand || {}), ...f };
    const invest = f.investIndustryCode || f.gbIndustryCode || cand?.investIndustryCode || cand?.gbIndustryCode || '—';
    const customerInd = f.customerIndustryCode || cand?.customerIndustryCode || cand?.gbIndustryCode || '—';
    const balanceWan = candidateBalanceAmountWan(f, task?.year, task);
    return `<tr>
      ${hideLoanAccount ? '' : `<td>${candidateCreditReferenceNo(ledgerRow)}</td><td>${candidateCreditNo(ledgerRow)}</td>`}
      <td>${f.loanType || cand?.loanType || '—'}</td>
      <td>${f.tier1Branch || f.branch || cand?.branch || '—'}</td>
      <td>${invest}</td>
      <td>${customerInd}</td>
      <td>${balanceWan ? formatLedgerAmountYuan(balanceWan) : '—'}</td>
      <td>${f.manager || cand?.manager || '—'}</td>
    </tr>`;
  }).join('');
  return `<div class="collect-group-member-wrap">
    <table class="data-table collect-group-member-table">
      <thead><tr>
        ${hideLoanAccount ? '' : '<th>授信参考编号</th><th>授信编号</th>'}<th>信贷品种</th><th>一级分行</th><th>投向行业</th><th>客户所属行业</th><th>月均余额（元）</th><th>客户经理</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

function filterDataCollectList(list, filters, taskId, data) {
  const f = filters || {};
  const d = data || Store.get();
  return list.filter(formal => {
    const supp = supplementForFormalInTask(d, taskId, formal.id);
    if (f.keyword && !(formal.customerName || '').toLowerCase().includes(f.keyword.trim().toLowerCase())) return false;
    if (f.collectMode) {
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
  if (level === 'submit') return '客户经理填报';
  return '审核';
}

function supplementApprovalFlowSteps(task) {
  const hqInitiated = task?.initiatorOrg !== 'branch';
  const steps = [
    { key: 'dispatch', title: hqInitiated ? '总行派发' : '分行派发' },
    { key: 'manager_fill', title: '客户经理填报' },
    { key: 'branch', title: '分行初审' }
  ];
  if (hqInitiated) steps.push({ key: 'hq', title: '总行终审' });
  return steps;
}

/** 当前流程所处节点（用于渐进展示步骤条） */
function resolveSupplementFlowActiveStepKey(s, task, approvals) {
  if (!s) return 'dispatch';
  const stage = s.auditStage || 'pending_fill';
  const hqInitiated = task?.initiatorOrg !== 'branch';

  if (!s.dispatchedAt) return 'dispatch';

  if (s.status === 'returned' || (stage === 'pending_fill' && s.rejectReason)) return 'manager_fill';
  if (s.status === 'pending' || s.status === 'in_progress') return 'manager_fill';
  if (stage === 'pending_fill' && s.status === 'completed') return 'manager_fill';

  if (stage === 'branch_review') return 'branch';
  if (stage === 'hq_review') return 'hq';
  if (stage === 'approved') return hqInitiated ? 'hq' : 'branch';

  return 'manager_fill';
}

/** 按进度返回应展示的流程步骤（仅到当前节点，不含后续未到达环节） */
function getVisibleSupplementFlowSteps(s, task, approvals) {
  const steps = supplementApprovalFlowSteps(task);
  const activeKey = resolveSupplementFlowActiveStepKey(s, task, approvals);
  const idx = steps.findIndex(st => st.key === activeKey);
  if (idx < 0) return steps.slice(0, 1);
  return steps.slice(0, idx + 1);
}

function pickLatestSupplementApproval(approvals, level) {
  const list = (approvals || []).filter(a => a.reviewLevel === level);
  if (!list.length) return null;
  return list.slice().sort((a, b) => {
    const ra = a.round || 0;
    const rb = b.round || 0;
    if (ra !== rb) return rb - ra;
    const ta = Date.parse(String(a.submitTime || '').replace(/-/g, '/')) || 0;
    const tb = Date.parse(String(b.submitTime || '').replace(/-/g, '/')) || 0;
    return tb - ta;
  })[0];
}

function resolveSupplementRejectSource(s, approvals) {
  if (!s?.rejectReason) return null;
  const hq = pickLatestSupplementApproval(approvals, 'hq');
  const branch = pickLatestSupplementApproval(approvals, 'branch');
  const admin = pickLatestSupplementApproval(approvals, 'admin');
  if (hq?.status === 'rejected') return 'hq';
  if (branch?.status === 'rejected') return 'branch';
  if (admin?.status === 'rejected') return 'admin';
  return null;
}

function supplementBranchReviewPassed(s, branchApproval) {
  return s?.branchReviewStatus === 'approved' || branchApproval?.status === 'approved';
}

function resolveSupplementFlowStep(step, s, task, approvals) {
  const stage = s?.auditStage || 'pending_fill';
  const round = s?.reviewRound || 1;
  const branchApproval = pickLatestSupplementApproval(approvals, 'branch');
  const hqApproval = pickLatestSupplementApproval(approvals, 'hq');
  const submitApproval = pickLatestSupplementApproval(approvals, 'submit');
  const adminApproval = pickLatestSupplementApproval(approvals, 'admin');

  if (step.key === 'dispatch') {
    const dispatched = !!(s?.dispatchedAt || (s?.status && s.status !== 'pending'));
    if (!dispatched) {
      return { state: 'pending', badge: '待派发', meta: [{ label: '说明', value: '任务尚未派发至客户经理' }] };
    }
    return {
      state: 'done',
      badge: '已派发',
      meta: [
        { label: '派发人', value: s.dispatchedBy || (task?.initiatorOrg === 'branch' ? '分行绿金部' : '总行绿金部') },
        { label: '派发时间', value: s.dispatchedAt || '—' },
        { label: '截止日期', value: s.deadline || '—' }
      ]
    };
  }

  if (step.key === 'manager_fill') {
    if (!s?.dispatchedAt) {
      return { state: 'pending', badge: '待填报', meta: [{ label: '客户经理', value: s?.manager || '—' }] };
    }
    const rejectSource = resolveSupplementRejectSource(s, approvals);
    if (s.status === 'returned' || (stage === 'pending_fill' && s.rejectReason)) {
      const meta = [
        { label: '客户经理', value: s.manager || submitApproval?.submitter || '—' },
        { label: '填报状态', value: '需重新填报' },
        { label: '退回原因', value: s.rejectReason || adminApproval?.rejectReason || '—', reason: true }
      ];
      if (rejectSource === 'hq') meta.splice(2, 0, { label: '退回环节', value: '总行终审' });
      else if (rejectSource === 'branch') meta.splice(2, 0, { label: '退回环节', value: '分行初审' });
      else if (rejectSource === 'admin') meta.splice(2, 0, { label: '退回环节', value: '管理员退回' });
      return {
        state: 'current',
        badge: '已退回',
        meta
      };
    }
    if (s.status === 'pending') {
      return {
        state: 'pending',
        badge: '待填报',
        meta: [{ label: '客户经理', value: s.manager || '—' }, { label: '填报状态', value: '待开始' }]
      };
    }
    if (s.status === 'in_progress') {
      return {
        state: 'current',
        badge: '填报中',
        meta: [
          { label: '客户经理', value: s.manager || '—' },
          { label: '填报状态', value: `进行中（${s.fieldsDone || 0}/${s.fieldsTotal || '—'}）` }
        ]
      };
    }
    const submitTime = submitApproval?.submitTime || s.submittedAt || '—';
    const isCurrent = stage === 'pending_fill' && s.status === 'completed' && canSubmitSupplementForReview(s);
    return {
      state: isCurrent ? 'current' : 'done',
      badge: isCurrent ? '待提交审核' : '已完成',
      meta: [
        { label: '客户经理', value: s.manager || submitApproval?.submitter || '—' },
        { label: '提交时间', value: submitTime },
        { label: '填报状态', value: isCurrent ? '已填报，待提交审核' : '已提交审核' }
      ]
    };
  }

  if (step.key === 'branch') {
    const notReached = !s?.dispatchedAt || s.status === 'pending' || s.status === 'in_progress'
      || (s.status === 'completed' && stage === 'pending_fill' && !branchApproval);
    if (notReached) {
      return {
        state: 'pending',
        badge: '待审核',
        meta: [{ label: '审批人', value: `分行绿金负责人（${s?.branch || '—'}）` }]
      };
    }
    const approval = branchApproval;
    const branchStatus = s.branchReviewStatus || approval?.status;
    if (branchStatus === 'rejected' || approval?.status === 'rejected') {
      return {
        state: 'rejected',
        badge: '不通过',
        meta: buildReviewStepMeta(approval, s, task, 'branch', s.rejectReason)
      };
    }
    if (stage === 'branch_review' && branchStatus === 'pending') {
      return {
        state: 'current',
        badge: '审核中',
        meta: buildReviewStepMeta(approval, s, task, 'branch')
      };
    }
    if (branchStatus === 'approved' || approval?.status === 'approved' || ['hq_review', 'approved'].includes(stage)) {
      const meta = buildReviewStepMeta(approval, s, task, 'branch');
      if (s.status === 'returned' && s.rejectReason && resolveSupplementRejectSource(s, approvals) === 'hq') {
        meta.push({ label: '说明', value: '本轮初审已通过，后由总行终审退回客户经理' });
      }
      return {
        state: 'done',
        badge: '已通过',
        meta
      };
    }
    return {
      state: 'pending',
      badge: '待审核',
      meta: buildReviewStepMeta(approval, s, task, 'branch')
    };
  }

  if (step.key === 'hq') {
    if (task?.initiatorOrg === 'branch') return null;
    const approval = hqApproval;
    const hqStatus = s.hqReviewStatus || approval?.status;
    const branchPassed = supplementBranchReviewPassed(s, branchApproval);

    if (hqStatus === 'rejected' || approval?.status === 'rejected') {
      return {
        state: 'rejected',
        badge: '不通过',
        meta: buildReviewStepMeta(approval, s, task, 'hq', s.rejectReason)
      };
    }

    if (hqStatus === 'approved' || approval?.status === 'approved' || stage === 'approved') {
      return {
        state: 'done',
        badge: '已通过',
        meta: buildReviewStepMeta(approval, s, task, 'hq')
      };
    }

    if (stage === 'hq_review' && (hqStatus === 'pending' || approval?.status === 'pending')) {
      return {
        state: 'current',
        badge: '审核中',
        meta: buildReviewStepMeta(approval, s, task, 'hq')
      };
    }

    if (branchApproval?.status === 'rejected' || s.branchReviewStatus === 'rejected') {
      return {
        state: 'pending',
        badge: '未到达',
        meta: [
          { label: '审批人', value: '总行绿金部' },
          { label: '说明', value: '分行初审未通过，待客户经理重新提交后再进入' }
        ]
      };
    }

    if (!branchPassed) {
      return {
        state: 'pending',
        badge: '待审核',
        meta: [
          { label: '审批人', value: '总行绿金部' },
          { label: '说明', value: '待分行初审通过后进入' }
        ]
      };
    }

    return {
      state: 'pending',
      badge: '待审核',
      meta: buildReviewStepMeta(approval, s, task, 'hq').length
        ? buildReviewStepMeta(approval, s, task, 'hq')
        : [
          { label: '审批人', value: '总行绿金部' },
          { label: '说明', value: '分行初审已通过，待进入总行终审' }
        ]
    };
  }

  return { state: 'pending', badge: '待处理', meta: [] };
}

function buildReviewStepMeta(approval, s, task, level, fallbackReason) {
  const approver = approval?.status === 'pending'
    ? (level === 'branch'
      ? `分行绿金负责人（${s?.branch || task?.initiatorBranch || '所属分行'}）`
      : '总行绿金部')
    : (approval?.approver || '—');
  const rows = [
    { label: '提交人', value: `${approval?.submitter || s?.manager || '—'} · ${approval?.submitTime || s?.submittedAt || '—'}` },
    { label: '审批人', value: approver },
    { label: '审批状态', value: approval ? approvalStatusLabel(approval.status) : '待创建' },
    { label: '审批结果', value: approval ? approvalResultLabel(approval.status) : '—' }
  ];
  if (approval?.approveTime) rows.push({ label: '审批时间', value: approval.approveTime });
  const reason = (approval?.rejectReason || fallbackReason || '').trim();
  if (reason) rows.push({ label: '审批原因', value: reason, reason: true });
  if (approval?.round) rows.unshift({ label: '审核轮次', value: `第 ${approval.round} 轮` });
  return rows;
}

function resolveFlowStepBadgeClass(snapshot) {
  const badge = snapshot?.badge || '';
  const state = snapshot?.state || 'pending';
  if (state === 'done') return 'badge-success';
  if (state === 'rejected') return 'badge-danger';
  if (state === 'current') {
    if (badge === '填报中' || badge === '审核中') return 'badge-running';
    return 'badge-warning';
  }
  const pendingMap = {
    待派发: 'badge-draft',
    待填报: 'badge-draft',
    待审核: 'badge-running',
    待提交审核: 'badge-warning',
    待处理: 'badge-draft',
    未到达: 'badge-draft'
  };
  return pendingMap[badge] || 'badge-draft';
}

function renderSupplementFlowTimelineNode(step, snapshot) {
  if (!snapshot) return '';
  const stateCls = {
    done: 'is-done',
    current: 'is-current',
    pending: 'is-pending',
    rejected: 'is-rejected'
  }[snapshot.state] || 'is-pending';
  const extraCls = step.key === 'dispatch' ? ' is-dispatch' : (step.key === 'manager_fill' ? ' is-manager-fill' : '');
  const currentTag = snapshot.state === 'current' ? '<span class="badge badge-warning approval-current-tag">当前节点</span>' : '';
  const badgeCls = resolveFlowStepBadgeClass(snapshot);
  const metaHtml = (snapshot.meta || []).map(row =>
    row.reason
      ? `<div class="approval-timeline-reason"><span class="label">${row.label}</span>${escapeHtml(row.value)}</div>`
      : `<div><span class="label">${row.label}</span>${escapeHtml(row.value)}</div>`
  ).join('');
  return `<div class="approval-timeline-item ${stateCls}${extraCls}">
    <div class="approval-timeline-head">
      <strong>${step.title}</strong>${currentTag}
      <span class="badge ${badgeCls}">${snapshot.badge}</span>
    </div>
    <div class="approval-timeline-meta">${metaHtml}</div>
  </div>`;
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
      const order = { submit: 0, branch: 1, branch_edit: 2, hq: 3, hq_edit: 4, admin: 5 };
      return (order[a.reviewLevel] ?? 50) - (order[b.reviewLevel] ?? 50);
    });
}

function reviewLevelTimelineTitle(level) {
  if (level === 'branch_edit') return '分行修改数据';
  if (level === 'hq_edit') return '总行修改数据';
  return reviewLevelLabel(level);
}

function renderSupplementAuditEditTimelineNode(a) {
  const title = reviewLevelTimelineTitle(a.reviewLevel);
  return `<div class="approval-timeline-item is-done is-audit-edit">
    <div class="approval-timeline-head">
      <strong>${escapeHtml(title)}</strong>
      <span class="badge badge-success">已完成</span>
    </div>
    <div class="approval-timeline-meta">
      <div><span class="label">操作人</span>${escapeHtml(a.approver || a.submitter || '—')}</div>
      <div><span class="label">操作时间</span>${escapeHtml(a.approveTime || a.submitTime || '—')}</div>
      ${a.round ? `<div><span class="label">审核轮次</span>第 ${a.round} 轮</div>` : ''}
    </div>
  </div>`;
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

function renderSupplementDispatchTimelineNode(s, task) {
  const snapshot = resolveSupplementFlowStep({ key: 'dispatch', title: '派发' }, s, task, getSupplementApprovals(s));
  return renderSupplementFlowTimelineNode({ key: 'dispatch', title: supplementApprovalFlowSteps(task)[0]?.title || '任务派发' }, snapshot);
}

function renderSupplementApprovalTimeline(s, task) {
  const approvals = getSupplementApprovals(s);
  const steps = getVisibleSupplementFlowSteps(s, task, approvals);
  const round = s?.reviewRound || 1;
  const editNodes = approvals.filter(a =>
    ['branch_edit', 'hq_edit'].includes(a.reviewLevel) && (a.round || 1) === round
  );
  const items = steps.map(step => {
    const snapshot = resolveSupplementFlowStep(step, s, task, approvals);
    let html = renderSupplementFlowTimelineNode(step, snapshot);
    if (step.key === 'branch') {
      html += editNodes.filter(a => a.reviewLevel === 'branch_edit').map(renderSupplementAuditEditTimelineNode).join('');
    }
    if (step.key === 'hq') {
      html += editNodes.filter(a => a.reviewLevel === 'hq_edit').map(renderSupplementAuditEditTimelineNode).join('');
    }
    return html;
  }).join('');

  const activeKey = resolveSupplementFlowActiveStepKey(s, task, approvals);
  const showAdminNodes = activeKey === 'manager_fill'
    && resolveSupplementRejectSource(s, approvals) === 'admin';
  const adminNodes = showAdminNodes
    ? approvals.filter(a => a.reviewLevel === 'admin').map(a => {
      const stateCls = a.status === 'rejected' ? 'is-rejected' : 'is-done';
      return `<div class="approval-timeline-item ${stateCls} is-admin">
      <div class="approval-timeline-head">
        <strong>${reviewLevelLabel('admin')}</strong>
        ${approvalStatusBadge(a.status)}
      </div>
      <div class="approval-timeline-meta">
        <div><span class="label">操作人</span>${escapeHtml(a.approver || '总行管理员')}</div>
        <div><span class="label">操作时间</span>${a.approveTime || a.submitTime || '—'}</div>
        ${a.rejectReason ? `<div class="approval-timeline-reason"><span class="label">退回原因</span>${escapeHtml(a.rejectReason)}</div>` : ''}
      </div>
    </div>`;
    }).join('')
    : '';

  const timelineContent = items
    ? `<div class="approval-timeline">${items}${adminNodes}</div>`
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
    <div class="supplement-page-panel ${approvalActive ? 'active' : ''}" data-page-panel="approval" data-supplement-id="${s.id}">
      ${renderSupplementApprovalTimeline(s, task)}
    </div>`;
}

function refreshSupplementApprovalTimeline(rootEl, supplementId) {
  const root = rootEl || document;
  const panel = qs('.supplement-page-panel[data-page-panel="approval"]', root);
  if (!panel) return;
  const sid = supplementId || panel.dataset.supplementId;
  const s = Store.get().supplements.find(x => x.id === sid);
  if (!s) return;
  const task = Store.getTask(s.taskId);
  panel.innerHTML = renderSupplementApprovalTimeline(s, task);
  panel.dataset.supplementId = sid;
}

function bindSupplementPageTabs(rootEl) {
  const root = rootEl || document;
  qsa('#supplementPageTabs .tab', root).forEach(tab => {
    tab.onclick = () => {
      qsa('#supplementPageTabs .tab', root).forEach(x => x.classList.remove('active'));
      qsa('.supplement-page-panel', root).forEach(x => x.classList.remove('active'));
      tab.classList.add('active');
      qs(`.supplement-page-panel[data-page-panel="${tab.dataset.pageTab}"]`, root)?.classList.add('active');
      if (tab.dataset.pageTab === 'approval') {
        refreshSupplementApprovalTimeline(root);
      }
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
    <div class="card"><div class="card-header card-header--with-dev-hint"><h3>排放数据（可同时填写多种方法）</h3>${typeof SupplementEmissionDevSpec !== 'undefined' && SupplementEmissionDevSpec.renderBadge ? SupplementEmissionDevSpec.renderBadge() : ''}</div>
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
        <div class="form-item"><label>营业收入（元）</label><input id="f_economy_value" type="number" value="${economyValue}" ${economyDis}></div>
        <div class="form-item"><label>行业因子</label><input id="f_economy_factor" type="number" step="0.01" value="${economyFactor}" ${economyDis}></div>
        ${economyLocked && economyEntityDisplay != null ? `<div class="form-item"><label>主体排放(tCO₂e)</label><input type="text" value="${formatNum(economyEntityDisplay)}" disabled></div>` : ''}
      </div></div>
      <div class="${panelCls('other')}" data-panel="other">
        ${otherCalcTip}
        <div class="form-grid">
        <div class="form-item"><label>行业排放因子</label><input id="f_fallback_factor" type="number" step="0.01" value="${fallbackFactor}" ${otherDis}></div>
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

/** 数据审核列表：收集单据对应的一级分行（下发分行） */
function approvalTier1Branch(approval) {
  const s = getSupplementForApproval(approval);
  if (s) return s.dispatchBranch || s.branch || s.tier1Branch || '—';
  const d = Store.get();
  const formal = (d.formalList || []).find(f => f.id === approval?.docId);
  if (formal) return formal.tier1Branch || formal.branch || '—';
  return '—';
}

function renderTier1BranchFilterSelect(selectId, selected) {
  const val = selected || '';
  const opts = TIER1_BRANCH_NAMES.map(b =>
    `<option value="${escapeHtml(b)}" ${val === b ? 'selected' : ''}>${escapeHtml(b)}</option>`
  ).join('');
  return `<select id="${selectId}"><option value="">全部</option>${opts}</select>`;
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

function getSupplementCreditCode(supp, data) {
  if (!supp) return '';
  if (supp.creditCode) return String(supp.creditCode).trim();
  const d = data || Store.get();
  const formal = (d.formalList || []).find(f => f.id === supp.formalId);
  if (formal?.creditCode) return String(formal.creditCode).trim();
  const cand = (d.candidates || []).find(c => c.id === (formal?.customerId || supp.customerId));
  return String(cand?.creditCode || '').trim();
}

/** 同一信用代码对应同一客户名称（冲突弹窗等场景统一展示） */
function resolveCustomerNameForCreditCode(taskId, creditCode, d, fallback) {
  const code = String(creditCode || '').trim();
  if (!code) return fallback || '—';
  const data = d || Store.get();
  const fromFormal = (data.formalList || []).find(f =>
    f.taskId === taskId && String(f.creditCode || '').trim() === code && f.customerName
  );
  if (fromFormal?.customerName) return fromFormal.customerName;
  const fromCand = (data.candidates || []).find(c =>
    c.taskId === taskId && String(c.creditCode || '').trim() === code && c.customerName
  );
  if (fromCand?.customerName) return fromCand.customerName;
  const fromSupp = (data.supplements || []).find(s =>
    s.taskId === taskId && getSupplementCreditCode(s, data) === code && s.customerName
  );
  return fromSupp?.customerName || fallback || '—';
}

function isSupplementAuditApproved(supp, reviewLevel) {
  if (!supp?.dispatchedAt) return false;
  if (reviewLevel === 'hq') {
    if (supp.branchReviewStatus !== 'approved') return false;
    return supp.auditStage === 'approved' || supp.auditStage === 'hq_review';
  }
  return supp.branchReviewStatus === 'approved';
}

function emissionSnapshotsEqual(a, b) {
  if (!a || !b) return false;
  const ea = Number(a.entityEmission);
  const eb = Number(b.entityEmission);
  if (!Number.isNaN(ea) && !Number.isNaN(eb)) {
    return Math.abs(ea - eb) < 0.0001 && (a.methodId || '') === (b.methodId || '');
  }
  return (a.methodId || '') === (b.methodId || '')
    && a.reportedEmission === b.reportedEmission
    && a.energyTotalEmission === b.energyTotalEmission
    && a.productTotalEmission === b.productTotalEmission
    && a.economyValue === b.economyValue;
}

/** 同信用代码、同审核环节下已通过的 peer 记录 */
function findConflictApprovedSupplements(taskId, currentSupplementId, reviewLevel, data) {
  const d = data || Store.get();
  const current = (d.supplements || []).find(s => s.id === currentSupplementId);
  if (!current) return [];
  const creditCode = getSupplementCreditCode(current, d);
  if (!creditCode) return [];
  return (d.supplements || []).filter(s => {
    if (s.taskId !== taskId || s.id === currentSupplementId) return false;
    if (getSupplementCreditCode(s, d) !== creditCode) return false;
    return isSupplementAuditApproved(s, reviewLevel);
  });
}

/** 主体排放数据仍不一致的冲突记录（分行已统一的数据总行不再弹窗） */
function findEmissionConflictSupplements(taskId, currentSupplementId, reviewLevel, data, methodExtra) {
  const d = data || Store.get();
  const current = (d.supplements || []).find(s => s.id === currentSupplementId);
  if (!current) return [];
  const peers = findConflictApprovedSupplements(taskId, currentSupplementId, reviewLevel, d);
  if (!peers.length) return [];
  const currentSnap = buildSupplementEmissionSnapshot(current, taskId, d, methodExtra);
  return peers.filter(p => !emissionSnapshotsEqual(
    currentSnap,
    buildSupplementEmissionSnapshot(p, taskId, d)
  ));
}

function supplementBizTypeDisplay(supp, taskId, data) {
  const d = data || Store.get();
  const formal = (d.formalList || []).find(f => f.id === supp.formalId);
  const cand = formal && (d.candidates || []).find(c => c.id === formal.customerId);
  const CG = typeof CollectGroups !== 'undefined' ? CollectGroups : null;
  const bucket = resolveCollectedProjectBucket(formal, cand, supp);
  if (CG?.bucketLabel) return CG.bucketLabel(bucket) || '—';
  return formal?.bizType === 'project' ? '项目' : '非项目';
}

function buildSupplementEmissionSnapshot(supp, taskId, data, methodExtra) {
  const d = data || Store.get();
  const clone = { ...supp };
  if (methodExtra?.selectedMethodId && typeof Store !== 'undefined') {
    Store.applySupplementApprovedMethod(clone, methodExtra.selectedMethodId, methodExtra.activeMethodTab);
  }
  const methodId = clone.approvedMethodId || Store.matchMethod(clone).id;
  const formal = (d.formalList || []).find(f => f.id === supp.formalId);
  const methodLabel = stripHtmlTags(
    resolveManualAccountingMethodLabel(formal, taskId, d, clone)
  );
  return {
    methodId,
    activeMethodTab: clone.activeMethodTab,
    reportedEmission: clone.reportedEmission,
    energyTotalEmission: clone.energyTotalEmission,
    productTotalEmission: clone.productTotalEmission,
    economyValue: clone.economyValue,
    economyFactor: clone.economyFactor,
    entityEmission: Store.calcEntityEmission(clone),
    methodLabel
  };
}

function applySupplementEmissionSnapshot(supp, snapshot) {
  if (!supp || !snapshot) return;
  supp.approvedMethodId = snapshot.methodId;
  if (snapshot.activeMethodTab) supp.activeMethodTab = snapshot.activeMethodTab;
  if (snapshot.reportedEmission != null) supp.reportedEmission = snapshot.reportedEmission;
  if (snapshot.energyTotalEmission != null) supp.energyTotalEmission = snapshot.energyTotalEmission;
  if (snapshot.productTotalEmission != null) supp.productTotalEmission = snapshot.productTotalEmission;
  if (snapshot.economyValue != null) supp.economyValue = snapshot.economyValue;
  if (snapshot.economyFactor != null) supp.economyFactor = snapshot.economyFactor;
}

function stripHtmlTags(html) {
  return String(html || '').replace(/<[^>]+>/g, '').trim() || '—';
}

function renderEmissionOverwriteSuffix(supp) {
  if (!supp?.emissionOverwritten || !supp.emissionOverwriteMeta) return '';
  const m = supp.emissionOverwriteMeta;
  const tip = `覆盖来源：${m.branch || '—'} · ${m.manager || '—'}`;
  return `<span class="emission-overwrite-bubble emission-overwritten-tag">（数据已覆盖）<span class="emission-overwrite-popover" role="tooltip">${escapeHtml(tip)}</span></span>`;
}

function buildSupplementEmissionConflictRow(supp, taskId, data, options = {}) {
  const d = data || Store.get();
  const formal = (d.formalList || []).find(f => f.id === supp.formalId);
  const snapshot = options.snapshot || buildSupplementEmissionSnapshot(supp, taskId, d, options.methodExtra);
  const creditCode = getSupplementCreditCode(supp, d);
  const customerName = resolveCustomerNameForCreditCode(taskId, creditCode, d, supp.customerName);
  return {
    supplementId: supp.id,
    label: options.label || customerName || '—',
    customerName: customerName || '—',
    bizType: supplementBizTypeDisplay(supp, taskId, d),
    branch: supp.branch || '—',
    manager: supp.manager || '—',
    methodLabel: snapshot.methodLabel || stripHtmlTags(resolveManualAccountingMethodLabel(formal, taskId, d, supp)),
    entityEmission: snapshot.entityEmission,
    entityEmissionText: snapshot.entityEmission != null ? formatNum(snapshot.entityEmission) : '—'
  };
}

function ensureEmissionConflictModal() {
  if (qs('#emissionConflictModal')) return qs('#emissionConflictModal');
  const root = qs('#modalRoot');
  if (!root) return null;
  root.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="emissionConflictModal">
      <div class="modal modal-wide">
        <div class="modal-header">
          <h4>选择主体排放</h4>
          <button type="button" class="modal-close" id="closeEmissionConflict">&times;</button>
        </div>
        <div class="modal-body">
          <p id="emissionConflictIntro" class="emission-conflict-intro"></p>
          <div class="table-wrap emission-conflict-table-wrap">
            <table class="data-table emission-conflict-table">
              <thead>
                <tr>
                  <th class="col-select col-no-resize">选择</th>
                  <th>客户名称</th><th>业务种类</th><th>下发分行</th><th>主办客户经理</th>
                  <th>手动核算方法</th><th>手动主体排放（tCO₂e）</th>
                </tr>
              </thead>
              <tbody id="emissionConflictTbody"></tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn" id="emissionConflictCancelBtn">取消</button>
          <button type="button" class="btn btn-primary" id="emissionConflictOkBtn">确认使用</button>
        </div>
      </div>
    </div>`);
  qs('#closeEmissionConflict').onclick = () => hideModal('emissionConflictModal');
  qs('#emissionConflictCancelBtn').onclick = () => hideModal('emissionConflictModal');
  return qs('#emissionConflictModal');
}

function openSupplementEmissionConflictModal(options) {
  const modal = ensureEmissionConflictModal();
  if (!modal) {
    toast('弹窗加载失败，请刷新页面后重试', 'warning');
    return;
  }
  const {
    creditCode,
    currentSupplement,
    currentPreview,
    conflicts,
    taskId,
    onConfirm
  } = options;
  const d = Store.get();
  const rows = [
    ...conflicts.map(s => buildSupplementEmissionConflictRow(s, taskId, d)),
    buildSupplementEmissionConflictRow(currentSupplement, taskId, d, {
      label: '当前审核数据',
      snapshot: currentPreview
    })
  ];
  qs('#emissionConflictIntro').textContent =
    `统一社会信用代码 ${creditCode} 下已存在审核通过的数据，请选择要使用的主体排放。确认后将覆盖其他已通过记录的手动主体排放，并更新当前审核数据。`;
  qs('#emissionConflictTbody').innerHTML = rows.map((row, idx) => `
    <tr>
      <td class="col-select">
        <input type="radio" name="emissionConflictPick" value="${escapeHtml(row.supplementId)}" ${idx === rows.length - 1 ? 'checked' : ''}>
      </td>
      <td>${escapeHtml(row.label === '当前审核数据' ? `${row.customerName}（当前审核数据）` : row.customerName)}</td>
      <td>${escapeHtml(row.bizType)}</td>
      <td>${escapeHtml(row.branch)}</td>
      <td>${escapeHtml(row.manager)}</td>
      <td>${escapeHtml(row.methodLabel)}</td>
      <td>${escapeHtml(row.entityEmissionText)}</td>
    </tr>
  `).join('');
  qs('#emissionConflictOkBtn').onclick = () => {
    const chosenId = qs('input[name="emissionConflictPick"]:checked')?.value;
    if (!chosenId) {
      toast('请选择要使用的主体排放', 'warning');
      return;
    }
    hideModal('emissionConflictModal');
    onConfirm(chosenId);
  };
  showModal('emissionConflictModal');
}

function beginSupplementApprovalPass(approval, extra, onApprove) {
  if (!approval || approval.docType !== 'supplement') {
    onApprove(true, undefined, extra);
    return;
  }
  const reviewLevel = approval.reviewLevel === 'hq' ? 'hq' : 'branch';
  const d = Store.get();
  const current = getSupplementForApproval(approval);
  if (!current) {
    onApprove(true, undefined, extra);
    return;
  }
  const conflicts = findEmissionConflictSupplements(approval.taskId, current.id, reviewLevel, d, extra);
  if (!conflicts.length) {
    onApprove(true, undefined, extra);
    return;
  }
  const currentPreview = buildSupplementEmissionSnapshot(current, approval.taskId, d, extra);
  openSupplementEmissionConflictModal({
    creditCode: getSupplementCreditCode(current, d),
    currentSupplement: current,
    currentPreview,
    conflicts,
    taskId: approval.taskId,
    reviewLevel,
    onConfirm: (chosenSupplementId) => {
      Store.applyCreditCodeEmissionResolution({
        taskId: approval.taskId,
        currentSupplementId: current.id,
        chosenSupplementId,
        reviewLevel,
        methodExtra: extra
      });
      onApprove(true, undefined, extra);
    }
  });
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

/** 分行初审已通过、尚未提交总行终审的采集审核记录 */
function isBranchApprovedReadyForHqSubmit(approval, data) {
  const d = data || Store.get();
  if (!approval || approval.docType !== 'supplement' || approval.reviewLevel !== 'branch' || approval.status !== 'approved') {
    return false;
  }
  const s = (d.supplements || []).find(x => x.id === approval.docId);
  if (!s || s.branchReviewStatus !== 'approved') return false;
  if (s.auditStage !== 'branch_approved') return false;
  return approval.reviewLevel === 'branch' && approval.status === 'approved';
}

function filterApprovalsForRole(approvals, roleKey, role, taskId) {
  let list = approvals.filter(a => !taskId || a.taskId === taskId);
  list = list.filter(a => !['submit', 'branch_edit', 'hq_edit'].includes(a.reviewLevel));
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
    tier1Branch: qs('#apf_tier1Branch')?.value || '',
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
    const y = String(f.year).trim();
    if (y) out = out.filter(a => String(approvalTaskYear(a)) === y);
  }
  if (f.tier1Branch) {
    const branch = String(f.tier1Branch).trim();
    if (branch) out = out.filter(a => approvalTier1Branch(a) === branch);
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

function renderApprovalFilterPanel(filters, options = {}) {
  const f = filters || {};
  const { showTier1Branch = false } = options;
  const customerName = f.customerName || f.docName || '';
  return `
    <div class="filter-panel approval-filter-panel">
      <div class="filter-extra approval-filter-grid">
        <div class="form-item"><label>任务名称</label>
          <input id="apf_taskName" type="search" value="${escapeHtml(f.taskName || '')}" placeholder="模糊搜索"></div>
        <div class="form-item"><label>核算年度</label>
          ${renderTaskYearFilterField(f.year, 'apf_year')}</div>
        <div class="form-item"><label>客户名称</label>
          <input id="apf_customerName" type="search" value="${escapeHtml(customerName)}" placeholder="模糊搜索"></div>
        ${showTier1Branch ? `<div class="form-item"><label>一级分行</label>${renderTier1BranchFilterSelect('apf_tier1Branch', f.tier1Branch || '')}</div>` : ''}
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

function isPboBuiltinAuditFactor(f) {
  if (!f?.isBuiltin) return false;
  return typeof normalizeFactorCaliber === 'function'
    ? normalizeFactorCaliber(f) === 'pbo'
    : (f.caliberTag === 'pbo' || !f.caliberTag);
}

function sortAuditFactorCandidates(factors) {
  return [...(factors || [])].sort((a, b) => {
    const ap = isPboBuiltinAuditFactor(a) ? 0 : 1;
    const bp = isPboBuiltinAuditFactor(b) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return String(a.id || '').localeCompare(String(b.id || ''), 'zh-CN');
  });
}

function resolveDefaultAuditFactor(s, task, methodId, factors) {
  const pool = sortAuditFactorCandidates(factors);
  if (s.auditFactorId && s.auditFactorMethodId === methodId) {
    const picked = Store.getFactor(s.auditFactorId);
    if (picked && pool.some(f => f.id === picked.id)) return picked;
  }
  const ctx = getSupplementIndustryContext(s);
  const pboPool = pool.filter(isPboBuiltinAuditFactor);
  const searchPool = pboPool.length ? pboPool : pool.filter(f => f.isBuiltin);
  const finalPool = searchPool.length ? searchPool : pool;
  if (ctx.gbIndustryCode) {
    const byCode = finalPool.find(f => f.gbCode === ctx.gbIndustryCode);
    if (byCode) return byCode;
  }
  if (ctx.industryMajor && ctx.industryMajor !== '-') {
    const byMajor = finalPool.find(f => f.industryMajor === ctx.industryMajor);
    if (byMajor) return byMajor;
  }
  return finalPool[0] || null;
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
    out[methodId] = sortAuditFactorCandidates(groups.map(g =>
      typeof pickFactorVersion === 'function' ? pickFactorVersion(g.versions, taskYear) : g.latest
    ).filter(Boolean));
  });
  return out;
}

function resolveSupplementAuditFactorValue(s, task, methodId, factors) {
  if (s.auditFactorValue != null && s.auditFactorValue !== '') return Number(s.auditFactorValue);
  const mid = methodId || s.auditFactorMethodId || 'economy';
  if (s.auditFactorId && s.auditFactorMethodId === mid) {
    const f = Store.getFactor(s.auditFactorId);
    if (f?.value != null) return Number(f.value);
  }
  const defaultFactor = resolveDefaultAuditFactor(s, task, mid, factors);
  if (defaultFactor?.value != null) return Number(defaultFactor.value);
  const ctx = getSupplementIndustryContext(s);
  return Store._getIndustryFactor(Store.get(), ctx.industryMajor, ctx.gbIndustryCode, task?.year);
}

function renderAuditFactorSelectOptions(factors, selectedId, defaultId) {
  const pbo = (factors || []).filter(isPboBuiltinAuditFactor);
  const custom = (factors || []).filter(f => !isPboBuiltinAuditFactor(f));
  const renderOpt = f => {
    const caliberLabel = isPboBuiltinAuditFactor(f) ? '人行口径' : '我行自定义';
    const defaultTag = f.id === defaultId ? '（默认）' : '';
    const name = typeof factorDisplayName === 'function' ? factorDisplayName(f) : f.id;
    const val = typeof formatFactorValue === 'function' ? formatFactorValue(f) : f.value;
    const year = typeof normalizeFactorVersionYear === 'function' ? normalizeFactorVersionYear(f) : f.versionYear;
    const versionLabel = typeof formatFactorVersionLabelForRecord === 'function'
      ? formatFactorVersionLabelForRecord(f)
      : `v1.0`;
    return `<option value="${f.id}" ${selectedId === f.id ? 'selected' : ''}>${escapeHtml(caliberLabel)} · ${escapeHtml(name)} · ${val} ${f.unit || ''} · ${versionLabel}（${year}年）${defaultTag}</option>`;
  };
  let html = '';
  if (pbo.length) {
    html += `<optgroup label="人行口径（系统默认）">${pbo.map(renderOpt).join('')}</optgroup>`;
  }
  if (custom.length) {
    html += `<optgroup label="我行自定义（可选覆盖）">${custom.map(renderOpt).join('')}</optgroup>`;
  }
  return html || '<option value="">暂无匹配因子</option>';
}

function renderAuditFactorMethodSection(methodId, factors, s, task, editable) {
  const dis = editable ? '' : 'disabled';
  const label = typeof factorMethodLabel === 'function' ? factorMethodLabel(methodId) : methodId;
  const sorted = sortAuditFactorCandidates(factors);
  const defaultFactor = resolveDefaultAuditFactor(s, task, methodId, sorted);
  const selectedId = (s.auditFactorMethodId === methodId && s.auditFactorId)
    ? s.auditFactorId
    : (defaultFactor?.id || '');
  const selectedFactor = selectedId ? Store.getFactor(selectedId) : defaultFactor;
  const resolvedVal = resolveSupplementAuditFactorValue(s, task, methodId, sorted);
  const currentVal = methodId === 'economy'
    ? (s.auditFactorValue ?? s.economyFactor ?? selectedFactor?.value ?? resolvedVal)
    : (s.auditFactorValue ?? s.fallbackFactor ?? s.economyFactor ?? selectedFactor?.value ?? resolvedVal);
  const opts = renderAuditFactorSelectOptions(sorted, selectedId, defaultFactor?.id);
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
        <p class="candidate-filter-hint audit-factor-hint">选用因子：指定本条记录引用的因子库条目，<strong>默认匹配人行口径内置因子</strong>。因子数值：核算实际采用的因子值，默认取自所选因子，审核人员可按需手工覆写。</p>
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
    } else if (sel?.value) {
      const f = Store.getFactor(sel.value);
      if (f?.value != null) factorValue = Number(f.value);
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
  qs('#auditClearIndustryBtn', root)?.addEventListener('click', async () => {
    const ok = await showConfirmDialog({
      message: '是否确认删除当前归属行业设置？',
      detail: '删除后需重新选择行业与因子。',
      danger: true
    });
    if (!ok) return;
    Store.applyApprovalAuditAdjustments(supplementId, { clearIndustry: true, clearFactor: true });
    toast('已删除归属行业并恢复默认因子', 'success');
    route();
  });
  qs('#auditResetFactorBtn', root)?.addEventListener('click', () => {
    Store.applyApprovalAuditAdjustments(supplementId, { clearFactor: true });
    toast('已恢复人行默认因子匹配', 'success');
    route();
  });
  qsa('.audit-factor-select', root).forEach(sel => {
    sel.addEventListener('change', () => {
      const block = sel.closest('.audit-factor-method-block');
      const valInput = qs('.audit-factor-value', block);
      const factorId = sel.value;
      if (!factorId || !valInput) return;
      const f = Store.getFactor(factorId);
      if (f?.value != null) valInput.value = f.value;
    });
  });
  qs('#auditSaveAdjustBtn', root)?.addEventListener('click', () => {
    const data = readApprovalAuditAdjustForm(root);
    Store.applyApprovalAuditAdjustments(supplementId, data);
    toast('审核调整已保存', 'success');
    route();
  });
}

/** 审核页底部操作栏（审核模式 / 审核人修改模式） */
function renderApprovalReviewActions(canReview, approval, task, options = {}) {
  const auditEditing = !!options.auditEditing;
  if (!canReview && !auditEditing) {
    return `<div style="padding:12px 20px;border-top:1px solid #eee;text-align:right">
      <button class="btn" onclick="location.hash='#/approvals'">返回列表</button>
    </div>`;
  }
  if (auditEditing) {
    return `<div style="padding:16px 20px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:10px;background:#fff;margin-top:16px">
      <button type="button" class="btn" id="auditEditSaveBtn">暂存</button>
      <button type="button" class="btn btn-primary" id="auditEditSubmitBtn">提交数据</button>
      <button type="button" class="btn" id="auditEditCancelBtn">取消修改</button>
    </div>`;
  }
  return `<div style="padding:16px 20px;border-top:1px solid #eee;display:flex;justify-content:flex-end;gap:10px;background:#fff;margin-top:16px">
    <button type="button" class="btn btn-success" id="approvalApproveBtn">审核通过</button>
    <button type="button" class="btn btn-danger" id="approvalRejectBtn">审核不通过</button>
    <button type="button" class="btn" id="approvalModifyBtn">修改</button>
    <button type="button" class="btn" id="approvalCancelBtn">取消</button>
  </div>`;
}

/** 退回对象候选：任务下全部客户经理姓名 */
function listApprovalRejectManagers(approval, supplement) {
  const taskId = approval?.taskId || supplement?.taskId;
  const names = new Set();
  if (typeof CandidateSync !== 'undefined' && CandidateSync.MANAGERS) {
    CandidateSync.MANAGERS.forEach(n => names.add(n));
  }
  if (taskId) {
    Store.getSupplements(taskId).forEach(s => { if (s.manager) names.add(s.manager); });
    (Store.getCandidates(taskId) || []).forEach(c => { if (c.manager) names.add(c.manager); });
  }
  if (supplement?.manager) names.add(supplement.manager);
  return [...names].sort((a, b) => a.localeCompare(b, 'zh-CN')).map(name => ({
    value: `manager:${name}`,
    label: name
  }));
}

/** 任务下所有客户经理姓名列表（改派专用） */
function listTaskManagers(taskId) {
  const names = new Set();
  if (typeof CandidateSync !== 'undefined' && CandidateSync.MANAGERS) {
    CandidateSync.MANAGERS.forEach(n => names.add(n));
  }
  if (taskId) {
    (Store.getSupplements(taskId) || []).forEach(s => { if (s.manager) names.add(s.manager); });
    (Store.getCandidates(taskId) || []).forEach(c => { if (c.manager) names.add(c.manager); });
    (Store.getCollectGroups(taskId) || []).forEach(g => { if (g.assignedManager) names.add(g.assignedManager); });
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

/** 改派前是否需二次确认（已发放采集/审核任务） */
function collectGroupNeedsWipeConfirm(d, taskId, groupId) {
  d = d || (typeof Store !== 'undefined' ? Store.get() : null);
  if (!d || !groupId) return false;
  const supp = supplementForCollectGroup(d, taskId, groupId);
  if (isCollectTaskDispatched(supp)) return true;
  const g = (d.collectGroups || []).find(x => x.id === groupId && x.taskId === taskId);
  if (!g?.supplementId) return false;
  const raw = typeof Store !== 'undefined' && Store.findSupplementForGroupRaw
    ? Store.findSupplementForGroupRaw(d, taskId, groupId)
    : (d.supplements || []).find(s => s.id === g.supplementId);
  return isCollectTaskDispatched(raw);
}

/** 改派收集人弹窗
 * @param {object} [options]
 * @param {boolean} [options.needsWipeConfirm] 打开时预判；最终以点击「确认改派」时实时状态为准
 */
function openReassignManagerModal(taskId, groupId, currentManager, onConfirm, options = {}) {
  qs('#reassignWipeConfirmModal')?.remove();
  let modal = qs('#reassignManagerModal');
  if (modal && !qs('#reassignStepConfirm')) modal.remove();
  modal = qs('#reassignManagerModal');
  const allManagers = listTaskManagers(taskId);
  if (!modal) {
    const root = qs('#modalRoot');
    if (!root) return;
    root.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="reassignManagerModal">
        <div class="modal" style="max-width:440px">
          <div class="modal-header">
            <h4 id="reassignModalTitle">改派收集人</h4>
            <button type="button" class="modal-close" id="closeReassignModal">&times;</button>
          </div>
          <div class="modal-body" id="reassignModalBody" style="overflow:visible">
            <div id="reassignStepSelect">
              <div class="form-item" style="margin-bottom:0;position:relative">
                <label>选择客户经理</label>
                <div id="reassignComboWrap" style="position:relative">
                  <input type="text" id="reassignManagerSearch" autocomplete="off" placeholder="请选择或搜索客户经理"
                    style="width:100%;padding-right:32px;cursor:pointer;box-sizing:border-box" readonly>
                  <span id="reassignDropArrow" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:#909399;font-size:12px">▼</span>
                  <div id="reassignManagerList" style="display:none;position:absolute;top:100%;left:0;right:0;z-index:9999;background:#fff;border:1px solid #dcdfe6;border-radius:4px;box-shadow:0 4px 12px rgba(0,0,0,.1);max-height:220px;overflow-y:auto">
                    <div style="padding:6px 8px;border-bottom:1px solid #f0f0f0">
                      <input type="text" id="reassignManagerKeyword" autocomplete="off" placeholder="输入姓名搜索…"
                        style="width:100%;box-sizing:border-box;border:1px solid #dcdfe6;border-radius:4px;padding:5px 8px;font-size:13px">
                    </div>
                    <div id="reassignManagerOptions"></div>
                  </div>
                </div>
              </div>
            </div>
            <div id="reassignStepConfirm" style="display:none">
              <p style="margin:0;line-height:1.7;color:#606266">当前任务已有数据，改派收集人后会将数据清空，请确认是否改派？</p>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn" id="reassignCancelBtn">取消</button>
            <button type="button" class="btn btn-primary" id="reassignConfirmBtn">确认改派</button>
          </div>
        </div>
      </div>`);
    modal = qs('#reassignManagerModal');
  }

  const stepSelect = qs('#reassignStepSelect');
  const stepConfirm = qs('#reassignStepConfirm');
  const modalTitle = qs('#reassignModalTitle');
  const cancelBtn = qs('#reassignCancelBtn');
  const confirmBtn = qs('#reassignConfirmBtn');
  let confirmStep = false;

  function showSelectStep() {
    confirmStep = false;
    if (stepSelect) stepSelect.style.display = '';
    if (stepConfirm) stepConfirm.style.display = 'none';
    if (modalTitle) modalTitle.textContent = '改派收集人';
    if (cancelBtn) {
      cancelBtn.textContent = '取消';
      cancelBtn.onclick = () => hideModal('reassignManagerModal');
    }
    if (confirmBtn) {
      confirmBtn.textContent = '确认改派';
      confirmBtn.className = 'btn btn-primary';
    }
  }

  function showConfirmStep() {
    confirmStep = true;
    closeDropdown();
    if (stepSelect) stepSelect.style.display = 'none';
    if (stepConfirm) stepConfirm.style.display = '';
    if (modalTitle) modalTitle.textContent = '确认改派';
    if (cancelBtn) {
      cancelBtn.textContent = '取消';
      cancelBtn.onclick = () => showSelectStep();
    }
    if (confirmBtn) {
      confirmBtn.textContent = '确认改派';
      confirmBtn.className = 'btn btn-danger';
    }
  }

  showSelectStep();

  qs('#closeReassignModal').onclick = () => {
    showSelectStep();
    hideModal('reassignManagerModal');
  };

  let selected = currentManager || '';
  let dropOpen = false;

  const searchEl = qs('#reassignManagerSearch');
  const listEl = qs('#reassignManagerList');
  const optionsEl = qs('#reassignManagerOptions');
  const kwEl = qs('#reassignManagerKeyword');

  function closeDropdown() {
    dropOpen = false;
    if (listEl) listEl.style.display = 'none';
    if (qs('#reassignDropArrow')) qs('#reassignDropArrow').textContent = '▼';
    const body = qs('#reassignModalBody');
    if (body) body.style.paddingBottom = '';
  }

  function renderOptions(keyword) {
    const kw = (keyword || '').trim().toLowerCase();
    const filtered = kw ? allManagers.filter(n => n.toLowerCase().includes(kw)) : allManagers;
    if (!filtered.length) {
      optionsEl.innerHTML = `<div style="padding:10px 16px;color:#909399;font-size:13px">${kw ? '无匹配结果' : '暂无可选客户经理'}</div>`;
      return;
    }
    optionsEl.innerHTML = filtered.map(name => {
      const isSel = name === selected;
      return `<div class="reassign-manager-option" data-name="${escapeHtml(name)}"
        style="padding:9px 16px;cursor:pointer;font-size:14px;${isSel ? 'background:#e6f7f1;color:#00796b;font-weight:600' : ''}">${escapeHtml(name)}</div>`;
    }).join('');
    qsa('.reassign-manager-option', optionsEl).forEach(opt => {
      opt.onmouseenter = () => { if (opt.dataset.name !== selected) opt.style.background = '#f5f7fa'; };
      opt.onmouseleave = () => { if (opt.dataset.name !== selected) opt.style.background = ''; };
      opt.onclick = () => {
        selected = opt.dataset.name;
        searchEl.value = selected;
        closeDropdown();
      };
    });
  }

  function openDropdown() {
    if (confirmStep) return;
    dropOpen = true;
    kwEl.value = '';
    renderOptions('');
    listEl.style.display = 'block';
    qs('#reassignDropArrow').textContent = '▲';
    const body = qs('#reassignModalBody');
    if (body) body.style.paddingBottom = '260px';
    setTimeout(() => kwEl.focus(), 30);
  }

  searchEl.value = selected;
  searchEl.onclick = () => (dropOpen ? closeDropdown() : openDropdown());
  kwEl.oninput = () => renderOptions(kwEl.value);

  document.addEventListener('click', function onOutside(e) {
    const wrap = qs('#reassignComboWrap');
    if (wrap && !wrap.contains(e.target)) closeDropdown();
    if (!qs('#reassignManagerModal')?.classList.contains('show')) {
      document.removeEventListener('click', onOutside);
    }
  });

  confirmBtn.onclick = () => {
    if (confirmStep) {
      hideModal('reassignManagerModal');
      onConfirm(selected);
      return;
    }
    if (!selected) {
      toast('请选择客户经理', 'warning');
      return;
    }
    const needsConfirm = collectGroupNeedsWipeConfirm(Store.get(), taskId, groupId)
      || !!options.needsWipeConfirm;
    if (needsConfirm) {
      showConfirmStep();
      return;
    }
    hideModal('reassignManagerModal');
    onConfirm(selected);
  };

  closeDropdown();
  showModal('reassignManagerModal');
}

/** 审核不通过 — 退回路径选项 */
function listApprovalRejectRouteOptions(approval) {
  const isBranch = approval?.reviewLevel === 'branch';
  if (isBranch) {
    return [
      { value: 'original_manager', label: '退回至原客户经理' },
      { value: 'other_manager', label: '退回至其他客户经理' }
    ];
  }
  return [
    { value: 'original_manager', label: '退回至原客户经理' },
    { value: 'original_branch_manager', label: '退回至原分行客户经理' },
    { value: 'other_manager', label: '退回至其他客户经理' }
  ];
}

function resolveApprovalRejectRouteExtra(route, supplement, task, otherManagerName) {
  const mgr = supplement?.manager || ROLES.manager?.user || '王磊';
  const branchRole = ROLES.branch || {};
  const branchLabel = `${branchRole.user || '王丽'} · ${branchRole.label || '分行绿金负责人'}${branchRole.branch ? `（${branchRole.branch}）` : ''}`;
  if (route === 'original_manager') {
    return { rejectTarget: 'manager', rejectAssignee: `manager:${mgr}`, rejectAssigneeLabel: mgr, rejectRoute: route, rejectRouteLabel: '退回' };
  }
  if (route === 'original_branch_manager') {
    return { rejectTarget: 'branch', rejectAssignee: 'role:branch', rejectAssigneeLabel: branchLabel, rejectRoute: route, rejectRouteLabel: '退回' };
  }
  if (route === 'other_manager') {
    const name = (otherManagerName || '').trim();
    return { rejectTarget: 'manager', rejectAssignee: `manager:${name}`, rejectAssigneeLabel: name, rejectRoute: route, rejectRouteLabel: '退回' };
  }
  return { rejectTarget: 'manager', rejectAssignee: `manager:${mgr}`, rejectAssigneeLabel: mgr, rejectRoute: 'original_manager', rejectRouteLabel: '退回' };
}

function hideApprovalRejectModalFields() {
  ['approvalConfirmRejectTypeWrap', 'approvalConfirmReasonWrap', 'approvalConfirmIndustryWrap',
    'approvalConfirmRejectRouteWrap', 'approvalConfirmOtherManagerWrap'].forEach(id => {
    const el = qs('#' + id);
    if (el) el.style.display = 'none';
  });
}

function approvalConfirmModalIsComplete(modal) {
  if (!modal) return false;
  return [
    '#approvalConfirmRejectRoute',
    '#approvalConfirmMethodWrap',
    '#approvalConfirmRejectTypeWrap'
  ].every(sel => qs(sel, modal));
}

function ensureApprovalConfirmModal() {
  const stale = qs('#approvalConfirmModal');
  if (stale && !approvalConfirmModalIsComplete(stale)) stale.remove();
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
          <div class="form-item" id="approvalConfirmRejectTypeWrap" style="margin-top:12px;display:none">
            <div class="method-select-list" id="approvalConfirmRejectTypeList">
              <label class="method-select-option"><input type="radio" name="approvalRejectReasonType" value="data_error" checked> 数据有误</label>
              <label class="method-select-option"><input type="radio" name="approvalRejectReasonType" value="industry_error"> 行业有误</label>
            </div>
          </div>
          <div class="form-item" id="approvalConfirmReasonWrap" style="margin-top:12px;display:none">
            <label>审核原因</label>
            <textarea id="approvalConfirmReason" rows="3" placeholder="请填写审核原因" style="width:100%"></textarea>
          </div>
          <div class="form-item" id="approvalConfirmIndustryWrap" style="margin-top:12px;display:none">
            <label>行业应为</label>
            <div id="approvalConfirmIndustryPickerHost"></div>
            <p class="approval-reject-industry-hint">请注意，修改行业后，由于行业收资表变更，所有数据需重新填写，请谨慎退回。</p>
          </div>
          <div class="form-item" id="approvalConfirmRejectRouteWrap" style="margin-top:12px;display:none">
            <label>退回至</label>
            <select id="approvalConfirmRejectRoute" style="width:100%"></select>
          </div>
          <div class="form-item" id="approvalConfirmOtherManagerWrap" style="margin-top:12px;display:none">
            <label>客户经理</label>
            <select id="approvalConfirmOtherManager" style="width:100%"></select>
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
  qs('#approvalConfirmTitle').textContent = options.title || (isApprove ? '审核通过' : '审核不通过');
  qs('#approvalConfirmMessage').textContent = options.message || (isApprove ? '是否确认审核通过？' : '是否确认审核不通过？');
  hideApprovalRejectModalFields();
  const methodWrap = qs('#approvalConfirmMethodWrap');
  if (methodWrap) methodWrap.style.display = 'none';
  const reasonInput = qs('#approvalConfirmReason');
  if (reasonInput) reasonInput.value = '';
  const okBtn = qs('#approvalConfirmOkBtn');
  okBtn.className = isApprove ? 'btn btn-success' : 'btn btn-danger';
  okBtn.textContent = '确认';
  okBtn.onclick = () => {
    if (!isApprove) {
      const reason = (reasonInput?.value || '').trim();
      if (!reason) {
        toast('请填写审核原因', 'warning');
        reasonInput?.focus();
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
  if (!isApprove) setTimeout(() => reasonInput?.focus(), 100);
}

function syncApprovalRejectModalFields() {
  const reasonType = qs('input[name="approvalRejectReasonType"]:checked')?.value || 'data_error';
  const route = qs('#approvalConfirmRejectRoute')?.value || 'original_manager';
  const reasonWrap = qs('#approvalConfirmReasonWrap');
  const industryWrap = qs('#approvalConfirmIndustryWrap');
  const routeWrap = qs('#approvalConfirmRejectRouteWrap');
  const otherWrap = qs('#approvalConfirmOtherManagerWrap');
  if (reasonWrap) reasonWrap.style.display = reasonType === 'data_error' ? 'block' : 'none';
  if (industryWrap) industryWrap.style.display = reasonType === 'industry_error' ? 'block' : 'none';
  if (routeWrap) routeWrap.style.display = 'block';
  if (otherWrap) otherWrap.style.display = route === 'other_manager' ? 'block' : 'none';
}

function openApprovalRejectConfirm(approval, supplement, onConfirm, task) {
  if (!ensureApprovalConfirmModal()) return;
  const managers = listApprovalRejectManagers(approval, supplement);
  const routes = listApprovalRejectRouteOptions(approval);
  const ctx = typeof getSupplementIndustryContext === 'function'
    ? getSupplementIndustryContext(supplement)
    : { gbIndustryCode: supplement?.gbIndustryCode, gbIndustryName: supplement?.gbIndustryName };
  const currentLabel = ctx.gbIndustryCode
    ? formatGbIndustryFilterLabel(ctx.gbIndustryCode, ctx.gbIndustryName)
    : (supplement?.industryLabel || '');

  qs('#approvalConfirmTitle').textContent = '审核不通过';
  qs('#approvalConfirmMessage').textContent = '请选择审核不通过原因：';
  hideApprovalRejectModalFields();
  qs('#approvalConfirmRejectTypeWrap').style.display = 'block';
  qs('#approvalConfirmMethodWrap').style.display = 'none';

  qsa('input[name="approvalRejectReasonType"]').forEach(r => {
    r.checked = r.value === 'data_error';
  });

  const industryHost = qs('#approvalConfirmIndustryPickerHost');
  if (industryHost) {
    industryHost.innerHTML = renderFormalIndustryPicker('approval-reject', 'correct', ctx.gbIndustryCode, currentLabel);
    qsa('.formal-industry-input', industryHost).forEach(input => { input.dataset.bound = ''; });
  }

  const routeSelect = qs('#approvalConfirmRejectRoute');
  routeSelect.innerHTML = routes.map(r =>
    `<option value="${escapeHtml(r.value)}">${escapeHtml(r.label)}</option>`
  ).join('');

  const otherSelect = qs('#approvalConfirmOtherManager');
  otherSelect.innerHTML = managers.map(m =>
    `<option value="${escapeHtml(m.label)}">${escapeHtml(m.label)}</option>`
  ).join('');

  const reasonInput = qs('#approvalConfirmReason');
  reasonInput.value = '';

  qsa('input[name="approvalRejectReasonType"]').forEach(r => {
    r.onchange = syncApprovalRejectModalFields;
  });
  routeSelect.onchange = syncApprovalRejectModalFields;
  syncApprovalRejectModalFields();
  bindFormalIndustryPickers(qs('#approvalConfirmModal'));

  const okBtn = qs('#approvalConfirmOkBtn');
  okBtn.className = 'btn btn-danger';
  okBtn.textContent = '确认';
  okBtn.onclick = () => {
    const reasonType = qs('input[name="approvalRejectReasonType"]:checked')?.value || 'data_error';
    const route = routeSelect?.value || 'original_manager';
    const otherManager = otherSelect?.value || '';
    let reason = '';
    const extra = resolveApprovalRejectRouteExtra(route, supplement, task, otherManager);
    extra.rejectReasonType = reasonType;

    if (reasonType === 'data_error') {
      reason = (reasonInput.value || '').trim();
      if (!reason) {
        toast('请填写审核原因', 'warning');
        reasonInput.focus();
        return;
      }
    } else {
      const industryInput = qs('#approvalConfirmIndustryPickerHost .formal-industry-input');
      const parsed = parseFormalIndustryInput(industryInput);
      if (!parsed.code) {
        toast('请选择正确的行业', 'warning');
        industryInput?.focus();
        return;
      }
      extra.correctedIndustryCode = parsed.code;
      extra.correctedIndustryName = parsed.name;
      extra.correctedIndustryLabel = parsed.label;
      extra.correctedIndustryMajor = typeof inferIndustryMajor === 'function'
        ? (inferIndustryMajor(parsed.code) || '')
        : '';
      reason = `行业有误，应为：${parsed.label}`;
    }

    if (route === 'other_manager' && !otherManager) {
      toast('请选择客户经理', 'warning');
      return;
    }

    hideModal('approvalConfirmModal');
    onConfirm(false, reason, extra);
  };
  showModal('approvalConfirmModal');
  setTimeout(() => reasonInput?.focus(), 100);
}

/** 分行审核收集单据通过：须单选核算方法 */
function openSupplementMethodApprovalConfirm(approval, onConfirm) {
  if (!ensureApprovalConfirmModal()) {
    toast('审核弹窗加载失败，请刷新页面后重试', 'warning');
    return;
  }
  const supplement = getSupplementForApproval(approval);
  const tabs = getSupplementMethodTabs(supplement || {});
  const defaultTabId = supplement?.activeMethodTab || supplementActiveTab(supplement || {});
  qs('#approvalConfirmTitle').textContent = '审核通过';
  qs('#approvalConfirmMessage').textContent = '请选择要使用的核算方法（括号内为主体排放预览，供审核参考）：';
  qs('#approvalConfirmReasonWrap').style.display = 'none';
  hideApprovalRejectModalFields();
  const methodWrap = qs('#approvalConfirmMethodWrap');
  const methodList = qs('#approvalConfirmMethodList');
  if (!methodWrap || !methodList) {
    toast('核算方法选择弹窗异常，请硬刷新页面（Cmd+Shift+R）后重试', 'warning');
    return;
  }
  methodWrap.style.display = 'block';
  methodList.innerHTML = tabs.map(t => {
    const checked = defaultTabId === t.id ? ' checked' : '';
    const preview = typeof SUPPLEMENT_FIELDS !== 'undefined'
      ? SUPPLEMENT_FIELDS.resolveMethodTabEmissionPreview(supplement, t.id)
      : { ok: false };
    const emissionHint = typeof SUPPLEMENT_FIELDS !== 'undefined'
      ? SUPPLEMENT_FIELDS.formatMethodEmissionPreview(preview)
      : '缺少数据';
    const hintCls = preview.ok ? 'method-emission-val' : 'method-emission-missing';
    return `<label class="method-select-option">
      <input type="radio" name="approvalMethodTab" value="${t.id}"${checked}>
      <span class="method-select-main">${escapeHtml(t.label)}</span>
      <span class="${hintCls}">${escapeHtml(emissionHint)}</span>
    </label>`;
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
  return candidateLoanSubjectType(c);
}

const LOAN_SUBJECT_TYPE_LEGACY_MAP = {
  股份有限公司: '股份制有限公司（非上市）',
  国有企业: '企贷',
  集体企业: '联营、合作企业',
  外商投资企业: '其他',
  私营企业: '有限责任公司',
  事业单位: '其他',
  个体工商户: '个贷',
  农户: '个贷',
  个人独资企业: '合伙企业',
  小微企业: '小微客户',
  境外主体: '其他'
};

function normalizeLoanSubjectType(value) {
  const v = String(value || '').trim();
  if (!v) return v;
  const labels = GUIDE.CANDIDATE_BORROWER_TYPES || [];
  if (labels.includes(v)) return v;
  return LOAN_SUBJECT_TYPE_LEGACY_MAP[v] || v;
}

/** 贷款主体类型：优先信贷大表「公司类型 / 公司性质」 */
function candidateLoanSubjectType(c) {
  if (c?.companyType) return normalizeLoanSubjectType(c.companyType);
  if (c?.companyNature) return normalizeLoanSubjectType(c.companyNature);
  if (c.borrowerType) return normalizeLoanSubjectType(c.borrowerType);
  if (c.isIndividual) return '个贷';
  if (c.isOverseas) return '其他';
  if (c.isSme) return '小微客户';
  return '有限责任公司';
}

function candidateProductType(c) {
  if (!c) return '-';
  return c.productType || c.loanType || '-';
}

function isGbIndustryNameOnlyDisplay(code) {
  const cascade = toCascadeIndustryCode(code);
  return cascade === '4411' || cascade === '4417';
}

/** D4411/D4417 等：UI 仅展示简短中文行业名 */
function resolveGbIndustryShortName(code, name) {
  const scoped = normalizeIndustryFilterCode(code);
  const cascade = toCascadeIndustryCode(scoped || code);
  const map = GUIDE.GB_INDUSTRY_SHORT_DISPLAY || {};
  if (scoped && map[scoped]) return map[scoped];
  if (cascade === '4411') return '火力发电';
  if (cascade === '4417') return '生物质能发电';
  const raw = String(name || '').trim();
  if (!raw) return '';
  if (cascade === '4411' || /^D4411\b/.test(raw)) return '火力发电';
  if (cascade === '4417' || /^D4417\b/.test(raw)) return '生物质能发电';
  return raw.replace(/\s+不包括.+$/u, '').replace(/\s*[（(][^）)]*[）)]\s*$/u, '').trim() || raw;
}

function formatGbIndustryFilterLabel(code, name) {
  const scoped = normalizeIndustryFilterCode(code) || String(code || '').trim();
  const shortName = resolveGbIndustryShortName(scoped, name);
  return scoped && shortName ? `${scoped} ${shortName}` : (shortName || scoped || '-');
}

function candidateIndustryLabel(c) {
  const code = c?.gbIndustryCode;
  if (isGbIndustryNameOnlyDisplay(code)) {
    return resolveGbIndustryShortName(code, c?.gbIndustryName || c?.industryLabel);
  }
  if (c.industryLabel) return c.industryLabel;
  if (code && c.gbIndustryName) return formatGbIndustryFilterLabel(code, c.gbIndustryName);
  return c.industryMajor || '-';
}

/** 投向行业：优先正式清单手工调整，其次项目明细国标代码 */
function candidateInvestIndustryCode(c) {
  if (c?.investIndustryCode) return c.investIndustryCode;
  const details = getCandidateProjectDetails(c);
  if (details.length) {
    const p = details[0];
    if (p.nationalIndustryCodeLv4) return p.nationalIndustryCodeLv4;
  }
  return c.gbIndustryCode || '';
}

/** 投向行业展示：与列表项目所属行业一致 */
function candidateInvestIndustryLabel(c) {
  if (c?.investIndustryCode || c?.investIndustryEdited) {
    const code = scopedIndustryCode(c.investIndustryCode || '');
    const name = c.investIndustryName || '';
    if (code && name) return `${code} ${resolveGbIndustryShortName(code, name)}`;
    if (code) return formatIndustryPickerLabel(code);
    if (name) return name;
  }
  const details = getCandidateProjectDetails(c);
  if (details.length) {
    const p = details[0];
    const code = p.nationalIndustryCodeLv4 || c.gbIndustryCode;
    const name = p.projectIndustry || c.gbIndustryName || c.industryMajor;
    if (isGbIndustryNameOnlyDisplay(code)) {
      return resolveGbIndustryShortName(code, name);
    }
    if (code && name) return `${code} ${name}`;
    return p.projectIndustry || candidateIndustryLabel(c);
  }
  return candidateIndustryLabel(c);
}

/** 项目类是否缺少项目口径的余额/收入（无法确定是否按项目法核算） */
function candidateProjectFinancialMissing(c) {
  if (!candidateIsProjectType(c)) return false;
  const details = Array.isArray(c.projectDetails) && c.projectDetails.length ? c.projectDetails[0] : null;
  const avgLoan = details?.projectAvgLoanBalanceWan ?? c.projectAvgLoanBalanceWan;
  const revenue = details?.projectRevenueWan ?? c.projectRevenueWan;
  const empty = v => v == null || v === '' || v === '-';
  return empty(avgLoan) || empty(revenue);
}

/** 解析核算类型 id（采集中项目类且无项目信息时返回 null，待收集定档） */
function resolveAccountingType(c) {
  if (!c) return null;
  const explicit = c.accountingType;
  if (explicit === 'project_pending') {
    /* 兼容旧数据：按当前字段重新解析 */
  } else if (explicit === 'non_project') {
    return 'non_project';
  } else if (explicit === 'project_as_non_project') {
    return 'project_as_non_project';
  }
  const isProject = candidateIsProjectType(c);
  if (!isProject) return 'non_project';
  const hasProjectDetails = Array.isArray(c.projectDetails) && c.projectDetails.length > 0;
  const hasProjectInfo = hasProjectDetails || c.projectInfoAvailable === true || !!c.projectInfo;
  if (hasProjectInfo && !candidateProjectFinancialMissing(c)) return 'project_as_project';
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
  if (!id) return options.pendingLabel ?? '项目（计算方法待定）';
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

function caProjectExpandKey(accountId, year) {
  return year != null && year !== '' ? `${accountId}|${year}` : String(accountId || '');
}

function getCaProjectExpandedSet() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(CA_PROJECT_EXPANDED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function toggleCaProjectExpanded(expandKey) {
  const key = String(expandKey || '');
  if (!key) return;
  const set = getCaProjectExpandedSet();
  if (set.has(key)) set.delete(key);
  else set.add(key);
  sessionStorage.setItem(CA_PROJECT_EXPANDED_KEY, JSON.stringify(Array.from(set)));
}

function filterVisibleCaListRows(listRows, expandedSet) {
  const out = [];
  (listRows || []).forEach(r => {
    if (!r.isSubAccount) {
      out.push(r);
      return;
    }
    const parentKey = r.parentExpandKey || caProjectExpandKey(r.accountId, r.year);
    if (expandedSet.has(parentKey)) out.push(r);
  });
  return out;
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
              <th>序号</th><th>授信编号</th><th>项目名称</th><th>客户名称</th><th>统一社会信用代码</th>
              <th>项目所属行业</th><th>项目月均贷款余额（元）</th><th>项目收入（元）</th>
            </tr></thead>
            <tbody>${details.map((p, i) => `<tr>
              <td>${i + 1}</td>
              <td>${p.projectNo || '-'}</td>
              <td>${p.projectName || '-'}</td>
              <td>${p.customerName || '-'}</td>
              <td>${p.creditCode || '-'}</td>
              <td>${p.projectIndustry || '-'}</td>
              <td>${formatProjectWanAsYuan(p.projectAvgLoanBalanceWan)}</td>
              <td>${formatProjectWanAsYuan(p.projectRevenueWan)}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      </div>
    </td>
  </tr>`;
}

function renderCarbonAccountNameCell(acc, expandedSet, year) {
  const hasProjects = Array.isArray(acc.projectDetails) && acc.projectDetails.length > 0;
  if (!hasProjects) return acc.customerName || '-';
  const expanded = expandedSet.has(caProjectExpandKey(acc.id, year));
  return `<span class="ca-name-cell">
    <button type="button" class="candidate-expand-toggle ${expanded ? 'is-expanded' : ''}" data-ca-expand="${caProjectExpandKey(acc.id, year)}" aria-expanded="${expanded ? 'true' : 'false'}" title="${expanded ? '收起项目明细' : '展开项目明细'}"><span class="candidate-expand-icon" aria-hidden="true"></span></button>
    ${acc.customerName || '-'}
  </span>`;
}

function renderCaListIndexCell(r, expandedSet, displayIndex) {
  if (r.isSubAccount) {
    return `<span class="ca-sub-index-indent" aria-hidden="true"></span>`;
  }
  if (r.hasExpandableProjects) {
    const key = r.expandKey || caProjectExpandKey(r.accountId, r.year);
    const expanded = expandedSet.has(key);
    return `<span class="ca-index-cell">
      <button type="button" class="candidate-expand-toggle ${expanded ? 'is-expanded' : ''}" data-ca-expand="${key}" aria-expanded="${expanded ? 'true' : 'false'}" title="${expanded ? '收起项目' : '展开项目'}"><span class="candidate-expand-icon" aria-hidden="true"></span></button>
      <span>${displayIndex}</span>
    </span>`;
  }
  return String(displayIndex);
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
    const projMetrics = typeof CarbonAccount !== 'undefined'
      ? CarbonAccount.resolveProjectYearMetrics(d, acc, subProjectNo, yearStr)
      : {};
    metrics = {
      ...metrics,
      customerNo: project?.customerNo || sub?.customerNo || metrics.customerNo,
      customerName: project?.customerName || project?.projectName || acc.customerName,
      creditCode: project?.creditCode || acc.creditCode,
      entityEmission: projMetrics.entityEmission ?? subProfile.entityEmission ?? null,
      method: projMetrics.method || subProfile.methodLabel || subProfile.method || metrics.methodLabel || metrics.method,
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
    ? `<div class="demo-tip" style="margin-bottom:12px">当前为项目子账户 · 授信编号 ${subProjectNo}</div>`
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
              <th>序号</th><th>授信编号</th><th>项目名称</th><th>项目所在地区域（省）</th><th>项目所属行业</th>
              <th>客户号</th><th>客户名称</th><th>统一社会信用代码</th><th>国民经济行业代码（4级）</th>
              <th>项目月均贷款余额（元）</th><th>项目收入（元）</th><th>项目总投资（元）</th>
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
              <td>${formatProjectWanAsYuan(p.projectAvgLoanBalanceWan)}</td>
              <td>${formatProjectWanAsYuan(p.projectRevenueWan)}</td>
              <td>${formatProjectWanAsYuan(p.projectTotalInvestmentWan)}</td>
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
    regionScope: GUIDE.SCOPE_DEFAULT_REGION_SCOPE || 'domestic',
    balanceMin: String(GUIDE.BALANCE_THRESHOLD_WAN || 500),
    balanceMax: '',
    projectBalanceMin: '',
    projectBalanceMax: '',
    customized: false
  };
}

function normalizeCandidateFilterRules(rules, task) {
  if (!rules || rules.productTypes == null) {
    const legacy = rules || {};
    const defaults = getDefaultCandidateFilterRules(task);
    if (legacy.productType) defaults.productTypes = [legacy.productType];
    if (legacy.borrowerType) defaults.borrowerTypes = [normalizeLoanSubjectType(legacy.borrowerType)];
    if (legacy.customerScale) defaults.customerScales = [legacy.customerScale];
    if (legacy.industry) {
      const code = String(legacy.industry).trim().split(/\s+/)[0];
      defaults.industries = [code];
    }
    defaults.balanceMin = legacy.balanceMin ?? defaults.balanceMin;
    defaults.balanceMax = legacy.balanceMax ?? '';
    defaults.projectBalanceMin = legacy.projectBalanceMin ?? '';
    defaults.projectBalanceMax = legacy.projectBalanceMax ?? '';
    defaults.customized = !!(legacy.productType || legacy.borrowerType || legacy.customerScale || legacy.industry || legacy.tier1Branch || legacy.manager);
    return defaults;
  }
  const validBorrowerTypes = new Set(GUIDE.CANDIDATE_BORROWER_TYPES || []);
  const borrowerTypes = (rules.borrowerTypes || [])
    .map(normalizeLoanSubjectType)
    .filter(t => validBorrowerTypes.has(t));
  return {
    productTypes: rules.productTypes || [],
    borrowerTypes,
    customerScales: rules.customerScales || [],
    industries: rules.industries || [],
    regionScope: rules.regionScope || GUIDE.SCOPE_DEFAULT_REGION_SCOPE || 'domestic',
    balanceMin: rules.balanceMin ?? '',
    balanceMax: rules.balanceMax ?? '',
    projectBalanceMin: rules.projectBalanceMin ?? '',
    projectBalanceMax: rules.projectBalanceMax ?? '',
    customized: rules.customized === true
  };
}

function isCandidateInGuideAccountingScope(c, task) {
  if (c.isSme || c.isIndividual || c.isOverseas) return false;
  const bt = candidateBorrowerType(c);
  if (['个贷', '小微客户', '境外主体'].includes(bt)) return false;
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
  if (tableRow) {
    return {
      ...tableRow,
      name: resolveGbIndustryShortName(tableRow.code, tableRow.name)
    };
  }
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

function isCandidateOverseas(c) {
  return !!c?.isOverseas;
}

function candidateMatchesRegionScope(c, regionScope) {
  const scope = regionScope || 'domestic';
  if (scope === 'all') return true;
  if (scope === 'overseas') return isCandidateOverseas(c);
  return !isCandidateOverseas(c);
}

function renderCandidateRegionScopeRadios(selected, readonly) {
  const dis = readonly ? ' disabled' : '';
  const value = selected || GUIDE.SCOPE_DEFAULT_REGION_SCOPE || 'domestic';
  const options = GUIDE.CANDIDATE_REGION_SCOPE_OPTIONS || [
    { value: 'domestic', label: '仅境内' },
    { value: 'overseas', label: '仅境外' },
    { value: 'all', label: '全部' }
  ];
  return `<div class="industry-scope-radios">${options.map(o =>
    `<label class="industry-scope-radio">
      <input type="radio" name="f_region_scope" value="${o.value}" ${value === o.value ? 'checked' : ''}${dis}>
      <span>${o.label}</span>
    </label>`
  ).join('')}</div>`;
}

function renderCandidateFilterCheckboxes(name, options, selected, labelFn) {
  const selectedSet = new Set(selected || []);
  return `<div class="filter-checkbox-group">${options.map(opt => {
    const value = typeof opt === 'string' ? opt : opt.value;
    const text = labelFn ? labelFn(opt) : (typeof opt === 'string' ? opt : opt.label);
    return `<label class="filter-check"><input type="checkbox" name="${name}" value="${value}" ${selectedSet.has(value) ? 'checked' : ''}> ${text}</label>`;
  }).join('')}</div>`;
}

/** 任务余额口径（默认月均余额） */
function resolveTaskBalanceRule(task) {
  return task?.balanceRule === '年末余额' ? '年末余额' : '月均余额';
}

function isYearEndBalanceRule(task) {
  return resolveTaskBalanceRule(task) === '年末余额';
}

/** 候选清单金额门槛：非项目按客户汇总月均贷款余额 */
function balanceScopeFilterLabel(_task, suffix) {
  return `非项目月均贷款余额（元）${suffix}`;
}

/** 项目类候选的项目月均贷款余额（万元）；无项目口径数据时返回 null */
function computeCandidateProjectAvgLoanBalanceWan(c, accountingYear) {
  normalizeCandidateLedgerFields(c, accountingYear);
  const details = Array.isArray(c.projectDetails) && c.projectDetails.length ? c.projectDetails[0] : null;
  const raw = details?.projectAvgLoanBalanceWan ?? c.projectAvgLoanBalanceWan;
  if (raw == null || raw === '' || raw === '-') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** 表格列标题，如「月均贷款余额（元）」 */
function balanceScopeColumnLabel(task) {
  return isYearEndBalanceRule(task) ? '年末余额（元）' : '月均贷款余额（元）';
}

/** 年末余额（万元）：取 12 月末时点余额（无则退回月均） */
function computeCandidateYearEndBalance(c, accountingYear) {
  normalizeCandidateLedgerFields(c, accountingYear);
  const balances = resolveCandidateMonthEndBalancesWan(c, accountingYear);
  const dec = balances[11];
  if (dec != null) return dec;
  return Number(c?.avgMonthlyBalance) || 0;
}

/** 按任务余额口径取金额（万元） */
function candidateBalanceAmountWan(c, accountingYear, task) {
  if (isYearEndBalanceRule(task)) {
    return computeCandidateYearEndBalance(c, accountingYear);
  }
  return computeCandidateAvgMonthlyBalance(c, accountingYear);
}

function formatCandidateBalanceByRule(c, accountingYear, task) {
  return formatLedgerAmountYuan(candidateBalanceAmountWan(c, accountingYear, task));
}

function renderCandidateFilterPanel(rules, task, options = {}) {
  const viewOnly = !!options.viewOnly;
  const dis = viewOnly ? ' disabled' : '';
  const productOptions = GUIDE.CANDIDATE_PRODUCT_TYPES || [];
  const borrowerOptions = GUIDE.CANDIDATE_BORROWER_TYPES || [];
  const customerScaleOptions = (GUIDE.CUSTOMER_SCALES || []).map(v => ({ value: v, label: v }));
  const industryOptions = getCandidateInvestIndustryFilterOptions(task).map(i => ({
    value: i.code,
    label: formatGbIndustryFilterLabel(i.code, i.name)
  }));
  return `
    <fieldset class="view-mode-fieldset"${viewOnly ? ' disabled' : ''}>
    <div class="filter-panel">
      <div class="filter-extra candidate-filter-grid">
        <div class="form-item full">
          <label>境内外业务</label>
          ${renderCandidateRegionScopeRadios(rules.regionScope, viewOnly)}
        </div>
        <div class="form-item full">
          <label>信贷品种</label>
          ${renderCandidateFilterCheckboxes('f_product', productOptions, rules.productTypes)}
        </div>
        <div class="form-item full">
          <label>贷款主体类型</label>
          ${renderCandidateFilterCheckboxes('f_borrower', borrowerOptions, rules.borrowerTypes)}
        </div>
        <div class="form-item full">
          <label>企业规模</label>
          ${renderCandidateFilterCheckboxes('f_customer_scale', customerScaleOptions, rules.customerScales)}
        </div>
        <div class="form-item full">
          <label>投向行业</label>
          ${renderCandidateFilterCheckboxes('f_industry', industryOptions, rules.industries)}
        </div>
        <div class="candidate-filter-row-2">
          <div class="form-item"><label>${balanceScopeFilterLabel(task, '起')}</label>
            <input id="f_bal_min" type="number" placeholder="最小值" value="${balanceWanToYuanInput(rules.balanceMin)}"${dis}>
          </div>
          <div class="form-item"><label>${balanceScopeFilterLabel(task, '止')}</label>
            <input id="f_bal_max" type="number" placeholder="最大值" value="${balanceWanToYuanInput(rules.balanceMax)}"${dis}>
          </div>
        </div>
        <div class="candidate-filter-row-2">
          <div class="form-item"><label>项目月均贷款余额（元）起</label>
            <input id="f_proj_bal_min" type="number" placeholder="最小值" value="${balanceWanToYuanInput(rules.projectBalanceMin)}"${dis}>
          </div>
          <div class="form-item"><label>项目月均贷款余额（元）止</label>
            <input id="f_proj_bal_max" type="number" placeholder="最大值" value="${balanceWanToYuanInput(rules.projectBalanceMax)}"${dis}>
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
    regionScope: 'all',
    balanceMin: '',
    balanceMax: '',
    projectBalanceMin: '',
    projectBalanceMax: '',
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
    regionScope: document.querySelector('input[name="f_region_scope"]:checked')?.value
      || GUIDE.SCOPE_DEFAULT_REGION_SCOPE
      || 'domestic',
    balanceMin: balanceYuanToWan(qs('#f_bal_min')?.value ?? ''),
    balanceMax: balanceYuanToWan(qs('#f_bal_max')?.value ?? ''),
    projectBalanceMin: balanceYuanToWan(qs('#f_proj_bal_min')?.value ?? ''),
    projectBalanceMax: balanceYuanToWan(qs('#f_proj_bal_max')?.value ?? ''),
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

/** 项目明细金额（内部万元）→ 展示元，保留两位小数 */
function formatProjectWanAsYuan(wanValue) {
  if (wanValue == null || wanValue === '' || wanValue === '-') return '—';
  const formatted = formatLedgerAmountYuan(wanValue);
  return formatted === '-' ? '—' : formatted;
}

/** 项目明细表单：内部万元 → 输入框元值（两位小数） */
function projectWanToYuanFormValue(wanValue) {
  if (wanValue === '' || wanValue == null || wanValue === '-') return '';
  const n = Number(wanValue);
  if (Number.isNaN(n)) return '';
  return (n * 10000).toFixed(2);
}

/** 项目明细表单：输入框元值 → 内部万元 */
function projectYuanFormToWan(yuan) {
  if (yuan == null || yuan === '') return null;
  const wan = balanceYuanToWan(yuan);
  return wan === '' ? null : wan;
}

const LEDGER_MONTH_BALANCE_COL_COUNT = 12;

/** 台账列表基础列数：12 个业务字段 + 余额 + 营收 + 资产 + 经理 */
function ledgerListTableColCount(options = {}) {
  const { headCheckbox = false, tailExtra = 0 } = options;
  // 所有清单均使用汇总口径：月均/年末余额（1列） + 平均资产总额（1列）
  return (headCheckbox ? 1 : 0) + 12 + 4 + tailExtra;
}

function renderConsolidatedAssetsTableHead() {
  return `<th>上年末合并报表资产总额（元）</th><th>本年末合并报表资产总额（元）</th>`;
}

function formatCandidatePrevYearTotalAssets(c) {
  normalizeCandidateLedgerFields(c, c?.accountingYear);
  const prev = c?.prevYearTotalAssets;
  if (prev == null || prev === '') return '—';
  return formatLedgerAmountYuan(prev);
}

function formatCandidateCurrentYearTotalAssets(c) {
  normalizeCandidateLedgerFields(c, c?.accountingYear);
  const cur = c?.totalAssets;
  if (cur == null || cur === '') return '—';
  return formatLedgerAmountYuan(cur);
}

function renderConsolidatedAssetsCells(c) {
  return `<td>${formatCandidatePrevYearTotalAssets(c)}</td><td>${formatCandidateCurrentYearTotalAssets(c)}</td>`;
}

function renderMonthEndBalanceTableHead() {
  return Array.from({ length: LEDGER_MONTH_BALANCE_COL_COUNT }, (_, i) =>
    `<th class="month-balance-col">${i + 1}月末余额（元）</th>`
  ).join('');
}

function resolveCandidateMonthEndBalanceStartMonth(c, accountingYear) {
  const year = Number(accountingYear || c?.accountingYear) || new Date().getFullYear();
  const disb = c?.disbursementDate;
  if (!disb) return 1;
  const m = String(disb).match(/^(\d{4})-(\d{1,2})/);
  if (!m) return 1;
  const dy = parseInt(m[1], 10);
  const dm = parseInt(m[2], 10);
  if (dy > year) return 13;
  if (dy < year) return 1;
  return dm;
}

/** 返回 12 个月末余额（万元）；无存续月份为 null */
function resolveCandidateMonthEndBalancesWan(c, accountingYear) {
  normalizeCandidateLedgerFields(c, accountingYear);
  if (Array.isArray(c?.monthEndBalances) && c.monthEndBalances.length >= LEDGER_MONTH_BALANCE_COL_COUNT) {
    return c.monthEndBalances.slice(0, LEDGER_MONTH_BALANCE_COL_COUNT).map(v =>
      (v == null || v === '') ? null : Number(v)
    );
  }
  const startMonth = resolveCandidateMonthEndBalanceStartMonth(c, accountingYear);
  const avg = Number(c?.avgMonthlyBalance) || 0;
  return Array.from({ length: LEDGER_MONTH_BALANCE_COL_COUNT }, (_, i) => {
    const month = i + 1;
    if (month < startMonth) return null;
    return avg;
  });
}

function renderMonthEndBalanceCells(c, accountingYear, task) {
  const year = accountingYear || c?.accountingYear || task?.year;
  return resolveCandidateMonthEndBalancesWan(c, year).map(v =>
    `<td class="month-balance-col">${v != null ? formatLedgerAmountYuan(v) : '—'}</td>`
  ).join('');
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

/** 月末余额均值（万元）= 1–12 月有余额月份的算术平均 */
function computeCandidateMonthEndBalanceMean(c, accountingYear, task) {
  normalizeCandidateLedgerFields(c, accountingYear);
  const year = accountingYear || c?.accountingYear || task?.year;
  const balances = resolveCandidateMonthEndBalancesWan(c, year);
  const valid = balances.filter(v => v != null && !Number.isNaN(Number(v)));
  if (valid.length) {
    return valid.reduce((s, v) => s + Number(v), 0) / valid.length;
  }
  const fallback = Number(c?.avgMonthlyBalance);
  return Number.isFinite(fallback) && fallback ? fallback : null;
}

function formatCandidateMonthEndBalanceMeanYuan(c, accountingYear, task) {
  const mean = computeCandidateMonthEndBalanceMean(c, accountingYear, task);
  return mean != null ? formatLedgerAmountYuan(mean) : '—';
}

function formatCandidateAvgTotalAssetsYuan(c) {
  const avg = computeCandidateAvgTotalAssets(c);
  return avg != null ? formatLedgerAmountYuan(avg) : '—';
}

function renderFormalSummaryBalanceHead(task) {
  return `<th>${balanceScopeColumnLabel(task)}</th>`;
}

function renderFormalSummaryAssetsHead() {
  return '<th>平均资产总额（元）</th>';
}

function renderFormalSummaryBalanceCell(c, accountingYear, task) {
  return `<td>${formatCandidateBalanceByRule(c, accountingYear, task)}</td>`;
}

function renderFormalSummaryAssetsCell(c) {
  return `<td>${formatCandidateAvgTotalAssetsYuan(c)}</td>`;
}

const FORMAL_LIST_EXPORT_HEADERS = [
  '一级分行', '经办行', '客户名称', '企业规模', '信贷品种', '业务种类', '授信参考编号', '授信编号',
  '投放日', '贷款主体类型', '企业所属行业', '贷款投向所属行业',
  '月均贷款余额（元）', '营业收入（元）', '平均资产总额（元）', '主办客户经理', '状态'
];

function formalListExportRowValues(f, taskId, task) {
  const c = formalLedgerRow(f, taskId);
  const year = c?.accountingYear || task?.year;
  return [
    candidateTier1Branch(c),
    c.handlingBranch || '-',
    c.customerName || '-',
    candidateEnterpriseScale(c),
    candidateProductType(c),
    candidateAccountingTypeLabel(c, { finalizeAccountingType: true, listKind: 'formal', task }),
    candidateCreditReferenceNo(c),
    candidateCreditNo(c),
    c.disbursementDate || '-',
    candidateLoanSubjectType(c),
    candidateIndustryLabel(c),
    candidateInvestIndustryLabel(c),
    formatCandidateMonthEndBalanceMeanYuan(c, year, task),
    formatLedgerAmountYuan(c.operatingRevenue ?? c.revenue),
    formatCandidateAvgTotalAssetsYuan(c),
    c.manager || '-',
    f.status === 'confirmed' ? '已锁定' : '待锁定'
  ];
}

function exportFormalListCsv(taskId) {
  const task = Store.getTask(taskId);
  const list = Store.getFormalList(taskId);
  const rows = list.map(f => formalListExportRowValues(f, taskId, task));
  const name = task?.name ? `${task.name}-正式清单` : '正式清单';
  downloadCsvFile(name, FORMAL_LIST_EXPORT_HEADERS, rows);
}

function scopedIndustryCode(code) {
  const raw = String(code || '').trim();
  if (!raw) return '';
  const cascade = toCascadeIndustryCode(raw);
  if (/^[A-Z]\d/.test(raw)) return raw;
  if (typeof toScopedIndustryCode === 'function') {
    const scoped = toScopedIndustryCode(cascade || raw);
    if (scoped) return scoped;
  }
  return normalizeIndustryFilterCode(raw) || cascade || raw;
}

function formatIndustryPickerLabel(code) {
  const cascade = toCascadeIndustryCode(code);
  const scoped = scopedIndustryCode(code);
  if (typeof IndustryCascade === 'undefined') return scoped || code || '';
  const map = IndustryCascade.nameMap();
  const name = map[cascade] || map[scoped] || map[code] || '';
  const shortName = resolveGbIndustryShortName(scoped, name);
  return scoped && shortName ? `${scoped} ${shortName}` : (scoped || IndustryCascade.label(cascade));
}

function industryPickerOptionFromCode(cascadeCode) {
  const scoped = scopedIndustryCode(cascadeCode);
  return {
    code: scoped,
    label: formatIndustryPickerLabel(cascadeCode)
  };
}

function resolveIndustryPickerCode(code, label) {
  const fromCode = normalizeIndustryFilterCode(code);
  if (fromCode && typeof IndustryCascade !== 'undefined') {
    const cascade = toCascadeIndustryCode(fromCode);
    const hit = IndustryCascade.allLeafCodes().find(c =>
      c === fromCode || c === cascade || scopedIndustryCode(c) === fromCode || toCascadeIndustryCode(c) === cascade
    );
    if (hit) return scopedIndustryCode(hit);
    return scopedIndustryCode(fromCode);
  }
  const text = String(label || '').trim();
  const matched = text.match(/^([A-Za-z]\d+)\b/);
  if (matched) return scopedIndustryCode(matched[1]);
  const numeric = text.match(/^(\d{3,5})\b/);
  if (numeric) return scopedIndustryCode(numeric[1]);
  return fromCode ? scopedIndustryCode(fromCode) : '';
}

function industryCascadeLabelForCode(code) {
  return formatIndustryPickerLabel(code);
}

function searchFormalIndustryOptions(keyword, limit = 50) {
  if (typeof IndustryCascade === 'undefined') return [];
  const map = IndustryCascade.nameMap();
  const codes = IndustryCascade.allLeafCodes();
  const raw = String(keyword || '').trim();
  if (!raw) {
    return codes.slice(0, limit).map(code => industryPickerOptionFromCode(code));
  }
  const codeToken = (raw.match(/([A-Za-z]?\d{3,5})/) || [])[1] || '';
  const scopedToken = codeToken ? scopedIndustryCode(codeToken) : '';
  const cascadeToken = scopedToken ? toCascadeIndustryCode(scopedToken) : '';
  const terms = raw.toLowerCase().split(/\s+/).filter(Boolean);
  return codes
    .filter(code => {
      const scoped = scopedIndustryCode(code);
      const cascade = toCascadeIndustryCode(scoped) || code;
      const name = (map[code] || map[cascade] || '').toLowerCase();
      const label = formatIndustryPickerLabel(code).toLowerCase();
      if (cascadeToken && (cascade === cascadeToken || scoped === scopedToken || code === cascadeToken)) {
        return true;
      }
      return terms.every(term =>
        code.toLowerCase().includes(term) ||
        cascade.toLowerCase().includes(term) ||
        scoped.toLowerCase().includes(term) ||
        name.includes(term) ||
        label.includes(term)
      );
    })
    .slice(0, limit)
    .map(code => industryPickerOptionFromCode(code));
}

function parseFormalIndustryInput(inputEl) {
  if (!inputEl) return { code: '', name: '', label: '' };
  const code = String(inputEl.dataset.code || '').trim();
  const text = String(inputEl.value || '').trim();
  if (code) {
    const scoped = scopedIndustryCode(code);
    const map = typeof IndustryCascade !== 'undefined' ? IndustryCascade.nameMap() : {};
    const cascade = toCascadeIndustryCode(scoped);
    const name = map[cascade] || map[scoped] || map[code] || '';
    const shortName = resolveGbIndustryShortName(scoped, name);
    const label = scoped && shortName ? `${scoped} ${shortName}` : (text || scoped);
    return { code: scoped, name: name || shortName, label };
  }
  const matched = text.match(/^([A-Za-z]\d+)\s*(.*)$/);
  if (matched) {
    const parsedCode = scopedIndustryCode(matched[1]);
    const rest = matched[2] || '';
    const map = typeof IndustryCascade !== 'undefined' ? IndustryCascade.nameMap() : {};
    const cascade = toCascadeIndustryCode(parsedCode);
    const name = rest || map[cascade] || map[parsedCode] || '';
    const shortName = resolveGbIndustryShortName(parsedCode, name);
    return {
      code: parsedCode,
      name: name || shortName,
      label: shortName ? `${parsedCode} ${shortName}` : text
    };
  }
  const exact = searchFormalIndustryOptions(text, 20).find(item =>
    item.label === text || item.code === text || item.label.toLowerCase() === text.toLowerCase()
  );
  if (exact) {
    const scoped = scopedIndustryCode(exact.code);
    const map = typeof IndustryCascade !== 'undefined' ? IndustryCascade.nameMap() : {};
    const cascade = toCascadeIndustryCode(scoped);
    const name = map[cascade] || map[scoped] || '';
    const shortName = resolveGbIndustryShortName(scoped, name);
    return {
      code: scoped,
      name: name || shortName,
      label: exact.label || (shortName ? `${scoped} ${shortName}` : text)
    };
  }
  return { code: '', name: text, label: text };
}

function renderFormalIndustryDisplay(label, edited) {
  const cls = edited ? 'formal-industry-edited' : '';
  return `<span class="${cls}">${escapeHtml(label || '-')}</span>`;
}

function renderFormalIndustryPicker(formalId, field, currentCode, currentLabel) {
  const code = resolveIndustryPickerCode(currentCode, currentLabel);
  const display = code ? formatIndustryPickerLabel(code) : (currentLabel || '');
  return `<div class="formal-industry-picker" data-formal-id="${escapeHtml(formalId)}" data-field="${field}">
    <input type="text" class="formal-industry-input" value="${escapeHtml(display)}" data-code="${escapeHtml(code)}" data-initial-code="${escapeHtml(code)}" autocomplete="off" placeholder="搜索行业代码或名称">
    <div class="formal-industry-dropdown" hidden></div>
  </div>`;
}

function renderFormalIndustryDropdownItems(items) {
  if (!items.length) {
    return '<p class="formal-industry-dropdown-empty">无匹配行业</p>';
  }
  return items.map(item =>
    `<button type="button" class="formal-industry-option" data-code="${escapeHtml(item.code)}" data-label="${escapeHtml(item.label)}">${escapeHtml(item.label)}</button>`
  ).join('');
}

function bindFormalIndustryPickers(rootEl) {
  const root = rootEl || document;
  qsa('.formal-industry-picker', root).forEach(picker => {
    const input = qs('.formal-industry-input', picker);
    const dropdown = qs('.formal-industry-dropdown', picker);
    if (!input || !dropdown || input.dataset.bound === '1') return;
    input.dataset.bound = '1';

    const positionDropdown = () => {
      const rect = input.getBoundingClientRect();
      dropdown.style.position = 'fixed';
      dropdown.style.left = `${rect.left}px`;
      dropdown.style.top = `${rect.bottom + 4}px`;
      dropdown.style.width = `${Math.max(rect.width, 240)}px`;
      dropdown.style.zIndex = '3000';
    };

    const showDropdown = () => {
      const items = searchFormalIndustryOptions(input.value, 50);
      dropdown.innerHTML = renderFormalIndustryDropdownItems(items);
      if (!items.length) {
        dropdown.hidden = true;
        return;
      }
      positionDropdown();
      dropdown.hidden = false;
    };

    const hideDropdown = () => {
      setTimeout(() => { dropdown.hidden = true; }, 150);
    };

    const onScrollOrResize = () => {
      if (!dropdown.hidden) positionDropdown();
    };

    input.addEventListener('focus', () => {
      showDropdown();
      window.addEventListener('scroll', onScrollOrResize, true);
      window.addEventListener('resize', onScrollOrResize);
    });
    input.addEventListener('input', () => {
      input.dataset.code = '';
      showDropdown();
    });
    input.addEventListener('blur', () => {
      hideDropdown();
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      if (!input.dataset.code && input.value.trim()) {
        const parsed = parseFormalIndustryInput(input);
        if (parsed.code) {
          input.dataset.code = parsed.code;
          if (parsed.label) input.value = parsed.label;
        }
      }
    });
    dropdown.addEventListener('mousedown', e => {
      const btn = e.target.closest('.formal-industry-option');
      if (!btn) return;
      e.preventDefault();
      input.value = btn.dataset.label || '';
      input.dataset.code = btn.dataset.code || '';
      dropdown.hidden = true;
    });
  });
}

function collectFormalIndustryEdits() {
  const byFormal = new Map();
  qsa('.formal-industry-picker').forEach(picker => {
    const formalId = picker.dataset.formalId;
    const field = picker.dataset.field;
    const input = qs('.formal-industry-input', picker);
    const parsed = parseFormalIndustryInput(input);
    const initialCode = scopedIndustryCode(input?.dataset.initialCode || '');
    const code = scopedIndustryCode(parsed.code || '');
    if (!formalId || !code || code === initialCode) return;
    if (!byFormal.has(formalId)) byFormal.set(formalId, { formalId });
    const edit = byFormal.get(formalId);
    if (field === 'subject') {
      edit.subjectIndustryEdited = true;
      edit.gbIndustryCode = code;
      edit.gbIndustryName = parsed.name;
      edit.industryLabel = parsed.label;
      edit.industryMajor = typeof inferIndustryMajor === 'function'
        ? (inferIndustryMajor(code) || '')
        : '';
    } else if (field === 'invest') {
      edit.investIndustryEdited = true;
      edit.investIndustryCode = code;
      edit.investIndustryName = parsed.name;
    }
  });
  return [...byFormal.values()].filter(e => e.subjectIndustryEdited || e.investIndustryEdited);
}

/** 同步/展示前归一化候选台账金额字段 */
function normalizeCandidateLedgerFields(c, accountingYear) {
  if (!c) return c;
  if (!c.creditRefNo) c.creditRefNo = candidateCreditReferenceNo(c);
  if (!c.creditNo) c.creditNo = candidateCreditNo(c);
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

function candidateCreditIdentifierSeed(c) {
  const raw = c?.loanAccount || c?.id || '';
  const compact = String(raw).replace(/[^0-9A-Za-z]/g, '');
  return compact.slice(-13) || 'UNKNOWN';
}

function candidateCreditReferenceNo(c) {
  return c?.creditRefNo
    || c?.creditReferenceNo
    || c?.projectNo
    || c?.projectDetails?.[0]?.projectNo
    || `CREF${candidateCreditIdentifierSeed(c)}`;
}

function candidateCreditNo(c) {
  return c?.creditNo
    || c?.creditNumber
    || `CREDIT${candidateCreditIdentifierSeed(c)}`;
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
  return candidateEnterpriseScale(c);
}

/** 企业规模：优先信贷大表 enterpriseScale 字段 */
function candidateEnterpriseScale(c) {
  const scales = GUIDE.ENTERPRISE_SCALES || GUIDE.CUSTOMER_SCALES || [];
  if (c?.enterpriseScale && scales.includes(c.enterpriseScale)) return c.enterpriseScale;
  if (c?.customerScale === '小微企业') {
    const bal = Number(c?.avgMonthlyBalance) || 0;
    return bal < 800 ? '微型企业' : '小型企业';
  }
  if (c?.customerScale && scales.includes(c.customerScale)) return c.customerScale;
  if (c?.isSme) {
    const bal = Number(c?.avgMonthlyBalance) || 0;
    return bal < 800 ? '微型企业' : '小型企业';
  }
  const bal = Number(c?.avgMonthlyBalance) || 0;
  if (bal >= 5000) return '大型企业';
  if (bal >= 1500) return '中型企业';
  if (bal >= 500) return '小型企业';
  return '微型企业';
}

function renderFormalIndustryCells(c, options = {}) {
  const subjectLabel = candidateIndustryLabel(c);
  const investLabel = candidateInvestIndustryLabel(c);
  const formalId = options.formalId;
  const isFormal = options.listKind === 'formal';
  const industryEditMode = !!options.industryEditMode && formalId;
  if (industryEditMode) {
    return `
    <td>${renderFormalIndustryPicker(formalId, 'subject', c.gbIndustryCode, subjectLabel)}</td>
    <td>${renderFormalIndustryPicker(formalId, 'invest', candidateInvestIndustryCode(c), investLabel)}</td>`;
  }
  if (isFormal) {
    return `
    <td>${renderFormalIndustryDisplay(subjectLabel, c.subjectIndustryEdited)}</td>
    <td>${renderFormalIndustryDisplay(investLabel, c.investIndustryEdited)}</td>`;
  }
  return `
    <td>${subjectLabel}</td>
    <td>${investLabel}</td>`;
}

/** 候选清单表格数据列（含核算类型、客户规模） */
function renderCandidateListCells(c, options = {}) {
  const listKind = options.listKind === 'formal' ? 'formal' : 'candidate';
  const task = options.task || null;
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
    <td>${candidateEnterpriseScale(c)}</td>
    <td>${candidateProductType(c)}</td>
    <td>${candidateAccountingTypeLabel(c, options)}</td>
    <td>${candidateCreditReferenceNo(c)}</td>
    <td>${candidateCreditNo(c)}</td>
    <td>${c.disbursementDate || '-'}</td>
    <td>${candidateLoanSubjectType(c)}</td>
    ${renderFormalIndustryCells(c, options)}
    ${renderFormalSummaryBalanceCell(c, c.accountingYear, task)}
    <td>${formatLedgerAmountYuan(c.operatingRevenue ?? c.revenue)}</td>
    ${renderFormalSummaryAssetsCell(c)}
    <td>${c.manager || '-'}</td>`;
}

const _LEDGER_COMMON_HEAD_INNER = `<th>一级分行</th><th>经办行</th><th>客户名称</th><th>企业规模</th><th>信贷品种</th><th>业务种类</th><th>授信参考编号</th><th>授信编号</th>
  <th>投放日</th><th>贷款主体类型</th><th>企业所属行业</th><th>贷款投向所属行业</th>`;
const _LEDGER_REVENUE_HEAD = `<th><span class="th-tip-bubble">营业收入（元）<span class="th-tip-icon">?</span><span class="th-tip-popover">优先经审计合并报表年报&gt;未审计合并报表年报&gt;经审计本部报表年报&gt;未审计本部报表年报</span></span></th>`;

const CANDIDATE_LIST_TABLE_HEAD = `
  ${_LEDGER_COMMON_HEAD_INNER}
  <th>月均贷款余额（元）</th>${_LEDGER_REVENUE_HEAD}${renderFormalSummaryAssetsHead()}<th>主办客户经理</th>`;

function renderCandidateListTableHead(task) {
  return `
  ${_LEDGER_COMMON_HEAD_INNER}
  ${renderFormalSummaryBalanceHead(task)}${_LEDGER_REVENUE_HEAD}${renderFormalSummaryAssetsHead()}<th>主办客户经理</th>`;
}

const FORMAL_LIST_TABLE_HEAD = `
  ${_LEDGER_COMMON_HEAD_INNER}
  <th>月均贷款余额（元）</th>${_LEDGER_REVENUE_HEAD}${renderFormalSummaryAssetsHead()}<th>主办客户经理</th>`;

function renderFormalListTableHead(task) {
  return `
  ${_LEDGER_COMMON_HEAD_INNER}
  ${renderFormalSummaryBalanceHead(task)}${_LEDGER_REVENUE_HEAD}${renderFormalSummaryAssetsHead()}<th>主办客户经理</th>`;
}

function renderCalculationListTableHead(task) {
  return `${renderCandidateListTableHead(task)}
  <th>归因排放(tCO₂e)</th><th>质量等级</th>`;
}

const CALCULATION_LIST_TABLE_HEAD = `
  ${FORMAL_LIST_TABLE_HEAD}
  <th>归因排放(tCO₂e)</th><th>质量等级</th>`;

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
    customerScale: r.customerScale || r.enterpriseScale,
    enterpriseScale: r.enterpriseScale || r.customerScale,
    companyNature: r.companyNature,
    companyType: r.companyType,
    productType: r.productType || r.loanType,
    loanType: r.loanType,
    accountingType: r.accountingType,
    creditRefNo: r.creditRefNo,
    creditNo: r.creditNo,
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

function computeIndustryStatsFromCalcs(taskId, calcsOverride) {
  const eligibleIds = new Set(getCollectEmissionEligibleFormals(taskId).map(f => f.id));
  const calcs = (calcsOverride || Store.getCalculations(taskId)).filter(c =>
    c.attributedEmission != null && eligibleIds.has(c.formalId)
  );
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

/** 投融资碳排放强度：tCO₂e / 万元余额（余额原始值为万元） */
function calcFinancingCarbonIntensity(emissionTon, balanceWan) {
  const em = Number(emissionTon);
  const bal = Number(balanceWan);
  if (!Number.isFinite(em) || !bal || bal <= 0) return null;
  return +(em / bal).toFixed(4);
}

function formatFinancingCarbonIntensity(n) {
  if (typeof CarbonAccount !== 'undefined' && CarbonAccount.formatIntensity) {
    return CarbonAccount.formatIntensity(n);
  }
  if (n == null || Number.isNaN(n)) return '—';
  return Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 4 });
}

/** 全行及人行八大行业大类 — 投融资碳排放强度（碳排放计算页） */
function computePboEightFinancingIntensityStats(taskId, calcsOverride) {
  const task = Store.getTask(taskId);
  const eligibleIds = new Set(getCollectEmissionEligibleFormals(taskId).map(f => f.id));
  const calcs = (calcsOverride || Store.getCalculations(taskId)).filter(c =>
    c.attributedEmission != null && eligibleIds.has(c.formalId)
  );
  const formals = Store.getFormalList(taskId);
  const eightMajors = (GUIDE.INDUSTRIES || []).map(i => i.major);
  const majorMap = Object.fromEntries(eightMajors.map(m => [m, {
    industry: m,
    count: 0,
    emission: 0,
    balance: 0,
    qualityWeightedEmission: 0,
    qualityEmission: 0
  }]));
  let totalEmission = 0;
  let totalBalance = 0;
  let totalCount = 0;

  calcs.forEach(c => {
    const f = formals.find(x => x.id === c.formalId);
    const row = f ? formalLedgerRow(f, taskId) : null;
    const emission = Number(c.attributedEmission) || 0;
    const balance = row ? candidateBalanceAmountWan(row, task?.year, task) : 0;
    totalEmission += emission;
    totalBalance += balance;
    totalCount += 1;
    const major = f?.industryMajor || c.industryMajor || '';
    if (major && majorMap[major]) {
      majorMap[major].count += 1;
      majorMap[major].emission += emission;
      majorMap[major].balance += balance;
      if (c.qualityGrade != null && emission > 0) {
        majorMap[major].qualityWeightedEmission += emission * Number(c.qualityGrade);
        majorMap[major].qualityEmission += emission;
      }
    }
  });

  const industries = eightMajors.map(major => {
    const item = majorMap[major];
    const dqr = item.qualityEmission > 0
      ? item.qualityWeightedEmission / item.qualityEmission
      : null;
    return {
      industry: major,
      count: item.count,
      emission: item.emission,
      balance: item.balance,
      intensity: calcFinancingCarbonIntensity(item.emission, item.balance),
      share: totalEmission ? +(100 * item.emission / totalEmission).toFixed(1) : 0,
      dqr: dqr != null ? +dqr.toFixed(2) : null,
      qualityRating: dqr != null ? resolveDqrGrade(dqr) : null
    };
  });

  return {
    totalEmission,
    totalBalance,
    totalCount,
    bankIntensity: calcFinancingCarbonIntensity(totalEmission, totalBalance),
    industries
  };
}

function renderCalculationIntensitySection(task, intensityStats) {
  const stats = intensityStats || { bankIntensity: null, totalCount: 0, totalBalance: 0, industries: [] };
  const balanceLabel = balanceScopeColumnLabel(task);
  const rowsHtml = (stats.industries || []).map(i => `<tr>
      <td>${escapeHtml(i.industry)}</td>
      <td>${i.count || 0}</td>
      <td>${i.balance ? formatNum(i.balance) : '—'}</td>
      <td>${formatNum(i.emission)}</td>
      <td>${formatFinancingCarbonIntensity(i.intensity)}</td>
      <td>${i.share}%</td>
      <td>${i.qualityRating
        ? `<span class="badge badge-primary" title="DQR ${i.dqr}">${i.qualityRating}</span>`
        : '—'}</td>
    </tr>`).join('');
  return `
    <div class="card calculation-intensity-card">
      <div class="card-header">
        <h3>投融资碳排放强度</h3>
      </div>
      <div class="card-body">
        <div class="intensity-bank-highlight">
          <div class="intensity-bank-label">全行投融资碳排放强度</div>
          <div class="intensity-bank-value">${formatFinancingCarbonIntensity(stats.bankIntensity)}</div>
          <div class="intensity-bank-sub">tCO₂e / 万元 · ${stats.totalCount || 0} 笔 · 余额合计 ${stats.totalBalance ? formatNum(stats.totalBalance) : '—'} 万元</div>
        </div>
        <h4 class="intensity-section-subtitle">分行业（人行八大行业大类）</h4>
        <div class="table-wrap"><table class="data-table">
          <thead><tr>
            <th>行业大类</th><th>笔数</th><th>${balanceLabel}</th><th>归因排放（tCO₂e）</th><th>碳排放强度（tCO₂e/万元）</th><th>排放占比</th><th>质量评级</th>
          </tr></thead>
          <tbody>${rowsHtml || '<tr><td colspan="7" style="text-align:center;padding:24px;color:#909399">暂无强度数据</td></tr>'}</tbody>
        </table></div>
      </div>
    </div>`;
}

function formalLedgerRow(f, taskId) {
  const c = Store.getCandidates(taskId).find(x => x.id === f.customerId);
  const base = c ? { ...c } : {
    id: f.customerId || f.id,
    customerName: f.customerName,
    customerScale: f.customerScale,
    enterpriseScale: f.enterpriseScale ?? f.customerScale,
    companyNature: f.companyNature,
    companyType: f.companyType,
    tier1Branch: f.tier1Branch || f.branch,
    handlingBranch: f.handlingBranch,
    productType: f.productType || f.loanType,
    loanType: f.loanType,
    accountingType: f.accountingType,
    bizType: f.bizType,
    creditRefNo: f.creditRefNo,
    creditNo: f.creditNo,
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
  const row = { ...base, formalId: f.id };
  if (f.subjectIndustryEdited || f.gbIndustryCode) {
    row.gbIndustryCode = f.gbIndustryCode ?? base.gbIndustryCode;
    row.gbIndustryName = f.gbIndustryName ?? base.gbIndustryName;
    row.industryLabel = f.industryLabel ?? base.industryLabel;
    row.industryMajor = f.industryMajor ?? base.industryMajor;
    row.subjectIndustryEdited = !!f.subjectIndustryEdited;
  }
  if (f.investIndustryEdited || f.investIndustryCode) {
    row.investIndustryCode = f.investIndustryCode ?? base.investIndustryCode;
    row.investIndustryName = f.investIndustryName ?? base.investIndustryName;
    const details = Array.isArray(f.projectDetails)
      ? f.projectDetails.map(p => ({ ...p }))
      : (Array.isArray(base.projectDetails) ? base.projectDetails.map(p => ({ ...p })) : []);
    if (!details.length) details.push({});
    details[0] = {
      ...details[0],
      nationalIndustryCodeLv4: f.investIndustryCode ?? details[0].nationalIndustryCodeLv4,
      projectIndustry: f.investIndustryName ?? details[0].projectIndustry
    };
    row.projectDetails = details;
    row.investIndustryEdited = !!f.investIndustryEdited;
  }
  return row;
}

function excludeLabel(code) {
  if (!code) return '-';
  return (GUIDE.EXCLUSIONS.find(e => e.code === code) || {}).label || code;
}

/** 必填标识：小红点（置于字段名称前） */
function renderRequiredDot() {
  return '<span class="field-required-dot" aria-hidden="true"></span>';
}

/** 表单项标签旁气泡提示 */
function renderFieldTipBubble(contentHtml, ariaLabel = '说明') {
  return `<span class="field-tip-bubble">
    <button type="button" class="field-tip-icon" aria-label="${escapeHtml(ariaLabel)}">?</button>
    <span class="field-tip-popover field-tip-popover--wide" role="tooltip">${contentHtml}</span>
  </span>`;
}

/** 表单字段标签；required 为 true 时前置红点，可选 tipContent 气泡说明 */
function renderFormLabel(text, options = {}) {
  const { required = false, tipContent = '', tipAria = '' } = options;
  const cls = `field-label${required ? ' field-label--required' : ''}`;
  const dot = required ? renderRequiredDot() : '';
  const tip = tipContent
    ? renderFieldTipBubble(tipContent, tipAria || `${text}说明`)
    : '';
  return `<label class="${cls}">${dot}<span class="field-label-text">${escapeHtml(text)}</span>${tip}</label>`;
}

/** 必填字段标签片段（红点 + 名称，不含 label 标签） */
function fieldLabel(text) {
  return `${renderRequiredDot()}<span class="field-label-text">${escapeHtml(text)}</span>`;
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

function formatDqrBandRange(bands, index) {
  const band = bands[index];
  if (!band) return '—';
  if (index === 0) return `DQR ≤ ${band.max}`;
  if (band.max === Infinity) return `DQR > ${bands[index - 1].max}`;
  return `${bands[index - 1].max} < DQR ≤ ${band.max}`;
}

function qualityGradeText(grade) {
  const labels = ['', '一级(优)', '二级', '三级', '四级', '五级(兜底)'];
  const n = Number(grade);
  if (!n) return '—';
  return `等级${n} ${labels[n] || ''}`.trim();
}

function renderDqrQualityStatCards(dqr, dqrGrade) {
  const dqrValue = dqr ? dqr.dqr : '—';
  const gradeValue = dqrGrade || '—';
  const subGrade = dqr ? '表3划分标准 · 点击查看对照' : '待计算 · 点击查看对照';
  const helpBtn = '<button type="button" class="stat-card-help" aria-label="查看数据质量评分与对应等次对照">?</button>';
  const cardAttrs = 'class="stat-card stat-card--interactive" role="button" tabindex="0" title="点击查看数据质量评分与对应等次对照"';
  return `
    <div ${cardAttrs} id="dqrScoreStatCard">
      <div class="stat-card-head"><div class="label">数据质量评级</div>${helpBtn}</div>
      <div class="value">${dqrValue}</div>
      <div class="sub">DQR（加权平均）</div>
    </div>
    <div ${cardAttrs} id="dqrGradeStatCard">
      <div class="stat-card-head"><div class="label">对应等次</div>${helpBtn}</div>
      <div class="value">${gradeValue}</div>
      <div class="sub">${subGrade}</div>
    </div>`;
}

function buildDqrGradeGuideHtml(dqr) {
  const bands = GUIDE.DQR_GRADE_BANDS || [];
  const levels = GUIDE.QUALITY_LEVELS || [];
  const current = dqr?.dqr != null && dqr.dqr !== '' ? Number(dqr.dqr) : null;
  const currentGrade = dqr?.grade || (current != null && !Number.isNaN(current) ? resolveDqrGrade(current) : null);
  const bandRows = bands.map((band, i) => {
    const isCurrent = currentGrade === band.grade;
    return `<tr class="${isCurrent ? 'is-current' : ''}">
      <td>${formatDqrBandRange(bands, i)}</td>
      <td><strong>${band.grade}</strong></td>
      <td>${levels[i]?.label || '—'}</td>
    </tr>`;
  }).join('');
  const methodRows = (GUIDE.DQR_METHOD_TABLE || []).map(m => `<tr>
      <td>${escapeHtml(m.method)}</td>
      <td>${escapeHtml(m.subject)}</td>
      <td style="font-size:12px;line-height:1.5">${escapeHtml(m.basis)}</td>
      <td style="text-align:center">${m.grade}</td>
    </tr>`).join('');
  const currentHtml = current != null && !Number.isNaN(current)
    ? `<p class="dqr-guide-current">当前任务 DQR = <strong>${dqr.dqr}</strong>，对应等次 <strong>${currentGrade || '—'}</strong></p>`
    : '';
  return `
    <p class="candidate-filter-hint">DQR 为各笔业务质量得分的归因排放量加权平均；单笔质量得分由所采用的核算方法确定（见下表）。</p>
    <p class="dqr-guide-formula"><strong>计算公式：</strong>${escapeHtml(GUIDE.FORMULAS?.dqr || '—')}</p>
    ${currentHtml}
    <h5 class="dqr-guide-section-title">表1 数据质量评级结果划分标准</h5>
    <div class="table-wrap"><table class="data-table dqr-guide-table">
      <thead><tr><th>DQR 区间</th><th>对应等次</th><th>评级描述</th></tr></thead>
      <tbody>${bandRows}</tbody>
    </table></div>
    <h5 class="dqr-guide-section-title">表2 数据质量等级赋值标准</h5>
    <div class="table-wrap"><table class="data-table dqr-guide-table">
      <thead><tr><th>核算方法</th><th>适用主体</th><th>基础数据</th><th style="white-space:nowrap">数据质量等级</th></tr></thead>
      <tbody>${methodRows}</tbody>
    </table></div>`;
}

function openDqrGradeGuideModal(dqr) {
  let modal = qs('#dqrGradeGuideModal');
  if (!modal) {
    const root = qs('#modalRoot');
    if (!root) return;
    root.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="dqrGradeGuideModal">
        <div class="modal modal-md">
          <div class="modal-header">
            <h4>数据质量评分与对应等次</h4>
            <button type="button" class="modal-close" id="closeDqrGradeGuideModal" aria-label="关闭">&times;</button>
          </div>
          <div class="modal-body" id="dqrGradeGuideModalBody"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" id="closeDqrGradeGuideModalBtn">关闭</button>
          </div>
        </div>
      </div>`);
    modal = qs('#dqrGradeGuideModal');
    const close = () => hideModal('dqrGradeGuideModal');
    qs('#closeDqrGradeGuideModal').onclick = close;
    qs('#closeDqrGradeGuideModalBtn').onclick = close;
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
  }
  qs('#dqrGradeGuideModalBody').innerHTML = buildDqrGradeGuideHtml(dqr);
  showModal('dqrGradeGuideModal');
}

function bindDqrGradeGuideStatCards(taskId) {
  const open = () => {
    const task = Store.getTask(taskId);
    const dqr = Store.calcDQR(taskId) || task?.dqr || null;
    openDqrGradeGuideModal(dqr);
  };
  ['#dqrScoreStatCard', '#dqrGradeStatCard'].forEach(sel => {
    const el = qs(sel);
    if (!el || el.dataset.bound === '1') return;
    el.dataset.bound = '1';
    el.addEventListener('click', open);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
    el.querySelector('.stat-card-help')?.addEventListener('click', e => {
      e.stopPropagation();
      open();
    });
  });
}

function qualityGradeBadge(grade) {
  if (grade == null) return '-';
  const labels = ['', '一级(优)', '二级', '三级', '四级', '五级(兜底)'];
  return `<span class="badge badge-primary">等级${grade} ${labels[grade] || ''}</span>`;
}
