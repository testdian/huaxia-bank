/** SPA 导航配置 - 一级菜单 */
const SPA_NAV = [
  {
    id: 'tasks',
    hash: '#/tasks',
    label: '核算任务管理',
    match: ['#/tasks', '#/task-create', '#/task-detail', '#/task-view', '#/task-edit', '#/candidates', '#/formal', '#/boundary', '#/data-collect', '#/calculation', '#/results', '#/reports']
  },
  {
    id: 'branch-board',
    hash: '#/branch-board',
    label: '数据采集',
    match: ['#/branch-board', '#/manager-tasks', '#/supplement-fill']
  },
  { id: 'approvals', hash: '#/approvals', label: '数据审核', match: ['#/approvals', '#/approval-review'] },
  { id: 'ledger', hash: '#/ledger', label: '台账管理', match: ['#/ledger', '#/ledger/detail'] },
  { id: 'carbon-accounts', hash: '#/carbon-accounts', label: '企业碳账户', match: ['#/carbon-accounts', '#/carbon-account'] },
  { id: 'factors', hash: '#/factors', label: '排放因子库', match: ['#/factors', '#/factors/new', '#/factors/edit', '#/factors/import'] }
];

/** 基础配置 — 碳核算模板配置中心（二级菜单） */
const SPA_METHOD_CONFIG_NAV = {
  title: '碳核算模板配置中心',
  match: [
    '#/method-config/params', '#/method-config/params/new', '#/method-config/params/edit',
    '#/method-config/templates', '#/method-config/templates/new', '#/method-config/templates/edit',
    '#/industry-config'
  ],
  items: [
    { id: 'method-params', hash: '#/method-config/params', label: '参数管理', match: ['#/method-config/params', '#/method-config/params/new', '#/method-config/params/edit'] },
    { id: 'method-templates', hash: '#/method-config/templates', label: '模版配置', match: ['#/method-config/templates', '#/method-config/templates/new', '#/method-config/templates/edit'] },
    { id: 'industry-config', hash: '#/industry-config', label: '行业配置', match: ['#/industry-config'] }
  ]
};

const SPA_ADMIN_NAV = [
  { id: 'permission-mgmt', hash: '#/permission-mgmt', label: '权限管理', match: ['#/permission-mgmt'], roles: ['hq'] }
];

const METHOD_CONFIG_ROUTES = SPA_METHOD_CONFIG_NAV.match;

function navIsMethodConfigActive(hash) {
  const base = (hash || '').split('?')[0];
  return METHOD_CONFIG_ROUTES.includes(base);
}

function renderMethodConfigNavGroup(hash, roleKey) {
  const items = SPA_METHOD_CONFIG_NAV.items.filter(i =>
    (!roleKey || roleKey === 'hq') &&
    (!i.id || typeof MenuPermissions === 'undefined' || MenuPermissions.isVisible(i.id, roleKey))
  );
  if (!items.length) return '';
  const overviewItem = items.find(i => i.id === 'method-templates') || items[0];
  const overviewHref = overviewItem.hash;
  const overviewMatch = items.flatMap(i => i.match || [i.hash]);
  return `<div class="nav-group">
    <a href="${overviewHref}" class="nav-group-title nav-group-title-link ${navIsActive({ hash: overviewHref, match: overviewMatch }, hash) ? 'active' : ''}">${SPA_METHOD_CONFIG_NAV.title}</a>
    ${items.map(i => `
      <a href="${i.hash}" class="nav-item nav-item-sub ${navIsActive(i, hash) ? 'active' : ''}">${i.label}</a>
    `).join('')}
  </div>`;
}

function isNavItemVisible(item, roleKey) {
  if (!item?.id) return true;
  if (typeof MenuPermissions === 'undefined') return true;
  return MenuPermissions.isVisible(item.id, roleKey);
}

/** 接口管理：顶栏入口，不参与侧栏菜单 */
const SPA_INTERFACES_ENTRY = { hash: '#/interfaces', label: '接口管理' };

function getNavItemsForRole(roleKey) {
  if (roleKey === 'manager') {
    return SPA_NAV.filter(i => i.hash === '#/branch-board');
  }
  return SPA_NAV.filter(i => i.hash !== '#/branch-board' && !(i.hqOnly && roleKey !== 'hq'));
}

function navIsActive(item, hash) {
  const base = (hash || '').split('?')[0];
  if (item.match) return item.match.includes(base);
  return base === item.hash;
}

const SIDEBAR_COLLAPSED_KEY = 'sidebar_collapsed';

function isSidebarCollapsed() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
}

function setSidebarCollapsed(collapsed) {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  const btn = document.getElementById('sidebarToggle');
  if (btn) {
    btn.title = collapsed ? '展开菜单' : '收起菜单';
    btn.innerHTML = collapsed ? '›' : '‹';
  }
}

function initSidebarToggle() {
  setSidebarCollapsed(isSidebarCollapsed());
  const btn = document.getElementById('sidebarToggle');
  if (btn) {
    btn.onclick = () => setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed'));
  }
}

let _spaShellMounted = false;

function invalidateSpaLayout() {
  _spaShellMounted = false;
}

function buildSpaContext() {
  const data = Store.get();
  return { data, role: getRoleContext(data), task: Store.getCurrentTask() };
}

function bindSpaShellEvents() {
  const changelogBtn = document.getElementById('changelogBtn');
  if (changelogBtn && !changelogBtn.dataset.bound) {
    changelogBtn.dataset.bound = '1';
    changelogBtn.onclick = () => openUpdateChangelogDrawer();
  }

  const roleSwitch = document.getElementById('roleSwitch');
  if (roleSwitch && !roleSwitch.dataset.bound) {
    roleSwitch.dataset.bound = '1';
    roleSwitch.onchange = e => {
      const roleKey = e.target.value;
      Store.update(d => {
        d.currentRole = roleKey;
        const r = getRoleContext({ ...d, currentRole: roleKey });
        d.currentUser = r.user;
        if (roleKey === 'manager' && !d.currentManagerUser) {
          d.currentManagerUser = DEMO_MANAGERS[0].user;
        }
      });
      toast('已切换角色', 'success');
      invalidateSpaLayout();
      const base = (location.hash || '').split('?')[0];
      if (!isRouteAllowedForRole(base, roleKey)) {
        location.hash = getDefaultRouteForRole(roleKey);
      } else {
        route();
      }
    };
  }

  const managerSwitch = document.getElementById('managerSwitch');
  if (managerSwitch && !managerSwitch.dataset.bound) {
    managerSwitch.dataset.bound = '1';
    managerSwitch.onchange = e => {
      const mgr = DEMO_MANAGERS.find(m => m.user === e.target.value) || DEMO_MANAGERS[0];
      Store.update(d => {
        d.currentManagerUser = mgr.user;
        d.currentUser = mgr.user;
      });
      toast(`已切换客户经理：${mgr.user}（${mgr.branch}）`, 'success');
      route();
    };
  }

  const taskSwitch = document.getElementById('taskSwitch');
  if (taskSwitch && !taskSwitch.dataset.bound) {
    taskSwitch.dataset.bound = '1';
    taskSwitch.onchange = e => {
      Store.update(d => { d.currentTaskId = e.target.value; });
      toast('已切换任务', 'success');
      route();
    };
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = '1';
    resetBtn.onclick = () => {
      Store.reset();
      toast('已重置', 'success');
      route();
    };
  }

  initSidebarToggle();
}

function renderSideNav(data, hash) {
  const navEl = document.getElementById('sideNav');
  if (!navEl) return;
  const mainItems = getNavItemsForRole(data.currentRole).filter(i => isNavItemVisible(i, data.currentRole));
  const adminItems = (SPA_ADMIN_NAV || []).filter(i =>
    (!i.roles || i.roles.includes(data.currentRole)) && isNavItemVisible(i, data.currentRole)
  );
  navEl.innerHTML = mainItems.map(i => `
    <a href="${i.hash}" class="nav-item ${navIsActive(i, hash) ? 'active' : ''}">${i.label}</a>
  `).join('')
    + (data.currentRole === 'hq' ? renderMethodConfigNavGroup(hash, data.currentRole) : '')
    + (adminItems.length ? `<div class="nav-group nav-group-admin">${adminItems.map(i => `
      <a href="${i.hash}" class="nav-item ${navIsActive(i, hash) ? 'active' : ''}">${i.label}</a>
    `).join('')}</div>` : '');
}

function refreshSpaChrome(pageTitle) {
  const data = Store.get();
  const role = getRoleContext(data);
  const hash = location.hash || '#/tasks';
  document.body.classList.toggle('sidebar-collapsed', isSidebarCollapsed());

  const bc = document.querySelector('.app-header .breadcrumb');
  if (bc) bc.innerHTML = `投融资碳核算 <span>/</span> ${pageTitle}`;

  const roleSel = document.getElementById('roleSwitch');
  if (roleSel) roleSel.value = data.currentRole;

  let managerSel = document.getElementById('managerSwitch');
  if (data.currentRole === 'manager') {
    if (!managerSel) {
      const taskSel = document.getElementById('taskSwitch');
      const html = `<select id="managerSwitch" title="切换客户经理">
        ${DEMO_MANAGERS.map(m => `<option value="${m.user}" ${m.user === (data.currentManagerUser || DEMO_MANAGERS[0].user) ? 'selected' : ''}>${m.user} · ${m.branch}</option>`).join('')}
      </select>`;
      if (taskSel) taskSel.insertAdjacentHTML('beforebegin', html);
      bindSpaShellEvents();
      managerSel = document.getElementById('managerSwitch');
    } else {
      managerSel.value = data.currentManagerUser || DEMO_MANAGERS[0].user;
    }
  } else if (managerSel) {
    managerSel.remove();
  }

  const taskSel = document.getElementById('taskSwitch');
  if (taskSel) {
    const tasks = data.tasks || [];
    if (taskSel.options.length !== tasks.length) {
      taskSel.innerHTML = tasks.map(t =>
        `<option value="${t.id}" ${t.id === data.currentTaskId ? 'selected' : ''}>${t.name}</option>`
      ).join('');
    } else {
      taskSel.value = data.currentTaskId;
    }
  }

  const userEl = document.querySelector('.app-header .user');
  if (userEl) userEl.textContent = `${role.user} · ${role.label}`;

  const ifaceBtn = document.getElementById('interfacesBtn');
  if (ifaceBtn) {
    ifaceBtn.classList.toggle('active', navIsActive(SPA_INTERFACES_ENTRY, hash));
    ifaceBtn.style.display = data.currentRole === 'manager' ? 'none' : '';
  }

  renderSideNav(data, hash);
}

function mountSpaShell(pageTitle) {
  const data = Store.get();
  const role = getRoleContext(data);
  const hash = location.hash || '#/tasks';
  document.body.classList.toggle('sidebar-collapsed', isSidebarCollapsed());

  document.body.innerHTML = `
    <header class="app-header">
      <div class="logo">投融资碳核算系统</div>
      <div class="breadcrumb">投融资碳核算 <span>/</span> ${pageTitle}</div>
      <div class="header-actions">
        <button type="button" class="btn-changelog" id="changelogBtn" title="查看页面更新说明">更新说明</button>
        <select id="roleSwitch">
          <option value="hq" ${data.currentRole === 'hq' ? 'selected' : ''}>总行管理部门</option>
          <option value="branch" ${data.currentRole === 'branch' ? 'selected' : ''}>分行负责人</option>
          <option value="manager" ${data.currentRole === 'manager' ? 'selected' : ''}>客户经理</option>
        </select>
        ${data.currentRole === 'manager' ? `<select id="managerSwitch" title="切换客户经理">
          ${DEMO_MANAGERS.map(m => `<option value="${m.user}" ${m.user === (data.currentManagerUser || DEMO_MANAGERS[0].user) ? 'selected' : ''}>${m.user} · ${m.branch}</option>`).join('')}
        </select>` : ''}
        <select id="taskSwitch">
          ${(data.tasks || []).map(t => `<option value="${t.id}" ${t.id === data.currentTaskId ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
        ${data.currentRole !== 'manager' ? `<a href="${SPA_INTERFACES_ENTRY.hash}" class="btn-ghost btn-sm header-nav-btn ${navIsActive(SPA_INTERFACES_ENTRY, hash) ? 'active' : ''}" id="interfacesBtn">${SPA_INTERFACES_ENTRY.label}</a>` : ''}
        <button class="btn-ghost btn-sm" id="resetBtn">重置数据</button>
        <span class="user">${role.user} · ${role.label}</span>
      </div>
    </header>
    <aside class="app-sidebar">
      <nav id="sideNav"></nav>
      <button type="button" class="sidebar-toggle" id="sidebarToggle" title="收起菜单">‹</button>
    </aside>
    <main class="app-main"><div id="viewRoot" class="view"></div></main>
    <div id="toastContainer" class="toast-container"></div>
    <div id="modalRoot"></div>
  `;

  renderSideNav(data, hash);
  bindSpaShellEvents();
}

function ensureSpaLayout(pageTitle) {
  if (!_spaShellMounted || !document.getElementById('viewRoot')) {
    mountSpaShell(pageTitle);
    _spaShellMounted = true;
  } else {
    refreshSpaChrome(pageTitle);
  }
  return buildSpaContext();
}

function renderSpaLayout(pageTitle) {
  return ensureSpaLayout(pageTitle);
}
