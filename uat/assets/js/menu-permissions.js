/** 左侧菜单可见性配置 */
window.MenuPermissions = {
  DEFAULT_VISIBILITY: {
    tasks: true,
    'branch-board': true,
    approvals: true,
    ledger: true,
    'carbon-accounts': true,
    factors: true,
    'method-params': false,
    'method-templates': false,
    'industry-config': false,
    'permission-mgmt': true
  },

  CATALOG: [
    { id: 'tasks', label: '核算任务管理', section: 'main', roles: ['hq', 'branch'] },
    { id: 'branch-board', label: '数据收集', section: 'main', roles: ['hq', 'branch', 'manager'] },
    { id: 'approvals', label: '数据审核', section: 'main', roles: ['hq', 'branch'] },
    { id: 'ledger', label: '台账管理', section: 'main', roles: ['hq', 'branch'] },
    { id: 'carbon-accounts', label: '企业碳账户', section: 'main', roles: ['hq', 'branch'] },
    { id: 'factors', label: '排放因子库', section: 'main', roles: ['hq', 'branch'] },
    { id: 'method-params', label: '参数字段库', section: 'basic', group: '基础配置', roles: ['hq'] },
    { id: 'method-templates', label: '方法模板', section: 'basic', group: '基础配置', roles: ['hq'] },
    { id: 'industry-config', label: '行业配置', section: 'basic', group: '基础配置', roles: ['hq'] },
    { id: 'permission-mgmt', label: '权限管理', section: 'admin', roles: ['hq'] }
  ],

  ROUTE_RULES: [
    { id: 'permission-mgmt', routes: ['#/permission-mgmt'] },
    { id: 'method-params', routes: ['#/method-config/params', '#/method-config/params/new', '#/method-config/params/edit'] },
    { id: 'method-templates', routes: ['#/method-config/templates', '#/method-config/templates/new', '#/method-config/templates/edit', '#/method-config', '#/method-config/guide', '#/methods'] },
    { id: 'industry-config', routes: ['#/industry-config'] }
  ],

  getVisibility() {
    const saved = Store.get().menuVisibility || {};
    return { ...this.DEFAULT_VISIBILITY, ...saved };
  },

  saveVisibility(next) {
    Store.update(d => {
      d.menuVisibility = { ...this.DEFAULT_VISIBILITY, ...(next || {}) };
    });
  },

  resetVisibility() {
    Store.update(d => {
      d.menuVisibility = { ...this.DEFAULT_VISIBILITY };
    });
  },

  isVisible(menuId, roleKey) {
    const item = this.CATALOG.find(x => x.id === menuId);
    if (item?.roles && roleKey && !item.roles.includes(roleKey)) return false;
    const vis = this.getVisibility();
    return vis[menuId] !== false;
  },

  routeToMenuId(routeBase) {
    const base = (routeBase || '').split('?')[0];
    const rule = this.ROUTE_RULES.find(r => r.routes.includes(base));
    if (rule) return rule.id;
    if (typeof SPA_NAV !== 'undefined') {
      const nav = SPA_NAV.find(i => i.id && (i.match?.includes(base) || i.hash === base));
      if (nav?.id) return nav.id;
    }
    return null;
  },

  isRouteVisible(routeBase, roleKey) {
    const menuId = this.routeToMenuId(routeBase);
    if (!menuId) return true;
    return this.isVisible(menuId, roleKey);
  },

  getCatalogForRole(roleKey) {
    return this.CATALOG.filter(item => !item.roles || item.roles.includes(roleKey));
  },

  renderSettingsPanel(roleKey) {
    const vis = this.getVisibility();
    const catalog = this.getCatalogForRole(roleKey);
    const sections = [
      { key: 'main', title: '一级菜单' },
      { key: 'basic', title: '基础配置' },
      { key: 'admin', title: '系统管理' }
    ];
    return sections.map(sec => {
      const items = catalog.filter(i => i.section === sec.key);
      if (!items.length) return '';
      return `<div class="menu-perm-section">
        <div class="menu-perm-section-title">${sec.title}</div>
        <div class="menu-perm-list">${items.map(item => `
          <label class="menu-perm-item">
            <input type="checkbox" class="menu-perm-check" data-menu-id="${item.id}" ${vis[item.id] !== false ? 'checked' : ''}>
            <span>${item.label}</span>
          </label>`).join('')}
        </div>
      </div>`;
    }).join('');
  },

  readPanelSelections(rootEl) {
    const root = rootEl || document;
    const next = { ...this.getVisibility() };
    qsa('.menu-perm-check', root).forEach(cb => {
      if (cb.dataset.menuId) next[cb.dataset.menuId] = cb.checked;
    });
    return next;
  }
};
