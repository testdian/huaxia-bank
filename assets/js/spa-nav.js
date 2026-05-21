/** SPA 导航配置 - 一级菜单 */
const SPA_NAV = [
  {
    hash: '#/tasks',
    label: '核算任务管理',
    match: ['#/tasks', '#/task-create', '#/task-detail', '#/task-view', '#/task-edit', '#/candidates', '#/formal', '#/boundary', '#/data-collect', '#/calculation', '#/results', '#/reports']
  },
  {
    hash: '#/branch-board',
    label: '数据补录',
    match: ['#/branch-board', '#/manager-tasks', '#/supplement-fill']
  },
  { hash: '#/approvals', label: '数据审核', match: ['#/approvals', '#/approval-review'] },
  { hash: '#/factors', label: '排放因子库', match: ['#/factors'] },
  { hash: '#/interfaces', label: '接口管理', match: ['#/interfaces'] }
];

function getNavItemsForRole(roleKey) {
  if (roleKey === 'manager') {
    return SPA_NAV.filter(i => i.hash === '#/branch-board');
  }
  return SPA_NAV;
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

function renderSpaLayout(pageTitle) {
  const data = Store.get();
  const role = ROLES[data.currentRole] || ROLES.hq;
  const hash = location.hash || '#/tasks';
  document.body.classList.toggle('sidebar-collapsed', isSidebarCollapsed());

  document.body.innerHTML = `
    <header class="app-header">
      <div class="logo">华夏银行 · 绿金系统</div>
      <div class="breadcrumb">投融资碳核算 <span>/</span> ${pageTitle}</div>
      <div class="header-actions">
        <select id="roleSwitch">
          <option value="hq" ${data.currentRole==='hq'?'selected':''}>总行绿金部</option>
          <option value="branch" ${data.currentRole==='branch'?'selected':''}>分行负责人</option>
          <option value="manager" ${data.currentRole==='manager'?'selected':''}>客户经理</option>
        </select>
        <select id="taskSwitch">
          ${data.tasks.map(t=>`<option value="${t.id}" ${t.id===data.currentTaskId?'selected':''}>${t.name}</option>`).join('')}
        </select>
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

  const navEl = document.getElementById('sideNav');
  navEl.innerHTML = getNavItemsForRole(data.currentRole).map(i => `
    <a href="${i.hash}" class="nav-item ${navIsActive(i, hash) ? 'active' : ''}">${i.label}</a>
  `).join('');

  document.getElementById('roleSwitch').onchange = e => {
    const roleKey = e.target.value;
    Store.update(d => { d.currentRole = roleKey; d.currentUser = ROLES[roleKey].user; });
    toast('已切换角色', 'success');
    const base = (location.hash || '').split('?')[0];
    if (!isRouteAllowedForRole(base, roleKey)) {
      location.hash = getDefaultRouteForRole(roleKey);
    } else {
      route();
    }
  };
  document.getElementById('taskSwitch').onchange = e => {
    Store.update(d => { d.currentTaskId = e.target.value; });
    toast('已切换任务', 'success'); route();
  };
  document.getElementById('resetBtn').onclick = () => {
    Store.reset(); toast('已重置', 'success'); route();
  };

  initSidebarToggle();

  return { data, role: ROLES[data.currentRole], task: Store.getCurrentTask() };
}
