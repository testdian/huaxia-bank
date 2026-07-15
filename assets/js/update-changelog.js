/** 页面更新说明 — 内容来源于需求沟通记录，按版本归档；展示时按更新时间倒序 */
const CHANGELOG_SCREENSHOT_BASE = 'assets/changelog/screenshots';

const UPDATE_CHANGELOG = [
  {
    version: 'v1.0',
    date: '2026-07-15',
    summary: '投融资碳核算 UAT 首发版本',
    items: [
      {
        menu: '数据采集填报',
        feature: '排放数据 DEV 填报说明',
        type: 'feature',
        date: '2026-07-15 21:15',
        text: '在线收集填报页「排放数据（可同时填写多种方法）」卡片标题旁新增橙色 DEV「填报说明」入口（样式与批量导入说明一致）。侧栏说明各方法 Tab 的字段必填校验、主体排放计算条件、方法匹配与审核预览逻辑，并注明各行业各方法的采集字段、必填规则与排放量计算公式均以「碳核算模板配置中心」已发布模板为准。仅供 UAT/演示环境使用，正式系统不包含此入口。',
        route: '#/supplement-fill',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/supplement-emission-dev-spec.png?v=20260715k`
      },
      {
        menu: '碳排放计算',
        feature: '项目总投资金额筛选与提交锁定',
        type: 'feature',
        date: '2026-07-15 21:00',
        text: '排放计算页「排放计算清单」上方新增筛选：项目总投资金额（元）起、项目总投资金额（元）止。筛选项仅针对业务种类为「项目类」的归集单元；非项目类数据不参与筛选，默认全部纳入清单、统计与一键提交范围。设置区间并查询后，仅项目类按项目总投资过滤，非项目类始终保留；顶部总归因排放量、DQR/质量评级、已计算笔数及「投融资碳排放强度」均随当前可见清单实时重算。点击「一键提交数据」时，系统按当前清单（项目类筛选结果 + 非项目类全量）锁定数据；后续核算结果查询、报告导出与企业碳账户归集仅包含锁定范围内的记录。',
        route: '#/calculation',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/calculation-invest-filter.png?v=20260715l`
      },
      {
        menu: '演示环境',
        feature: '角色与客户经理切换',
        type: 'feature',
        date: '2026-07-15 20:10',
        text: '顶栏新增演示角色切换：总行绿金部、分行负责人、客户经理三类视角可一键切换，菜单与数据范围随角色联动。切换为「客户经理」后，额外展示客户经理下拉（王磊/陈静/刘洋/赵敏/周强/李娜，含所属分行），便于分别登录不同主办客户经理视角填报与验收任务清单、收集填报、审核流转等流程。该切换器仅供 UAT/演示测试使用，正式系统以宿主绿金系统统一认证与授权为准，不提供此演示下拉。',
        route: '#/manager-tasks',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/demo-role-manager-switch.png?v=20260715g`
      },
      {
        menu: '批量导入',
        feature: 'DEV 导入说明（演示专用）',
        type: 'feature',
        date: '2026-07-15 20:00',
        text: '参数管理、行业配置、排放因子库的「批量导入」按钮旁新增橙色「DEV 导入说明」入口，点击侧栏可查看导入模板表头、各字段必填规则与导入校验逻辑，便于开发与测试对照验收。该标识仅供 UAT/演示环境使用，正式系统上线不包含此入口及说明侧栏。',
        route: '#/factors',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/dev-import-spec-factor.png?v=20260715f`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '模板状态简化为草稿与已发布',
        type: 'feature',
        date: '2026-07-15 19:45',
        text: '取消模板「已停用」状态，仅保留「草稿」「已发布」两种。列表筛选与状态标签同步调整；草稿与已发布模板操作统一为「编辑」「复制」「删除」「查看」。删除已发布模板将直接移除配置，历史数据采集仍绑定原发布版本快照，不受影响。',
        route: '#/method-config/templates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-list.png?v=20260715d`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '经济活动法/其他计算法采集说明',
        type: 'feature',
        date: '2026-07-15 19:30',
        text: '新建与编辑模板时，核算方法选择「经济活动法」或「其他计算法」后，下方展示数据采集特殊说明：经济法直算路径下营业收入、因子与主体排放由系统预填且只读；其他计算法下行业因子由系统按行业自动匹配且只读。模板仍用于定义 Tab 展示结构，与能源法/产品法的手工填报+因子绑定模式区分。',
        route: '#/method-config/templates/new',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-method-collect-hint.png?v=20260715e`
      },
      {
        menu: '企业碳账户',
        feature: '注销账户处理规则',
        type: 'feature',
        date: '2026-07-15 19:10',
        text: '账户状态为「注销」时，列表操作列不再展示「编辑」入口（含项目子账户）；主体排放显示为 0，且不计入列表顶部「主体排放合计」。执行注销时，系统自动清零该账户及项目子账户各年度主体排放数据。',
        route: '#/carbon-accounts',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/carbon-accounts-cancelled.png?v=20260715c`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '附件型参数上传限制',
        type: 'field',
        date: '2026-07-15 18:45',
        text: '参数类型为「附件型」时，可在参数库配置「允许格式」「最多文件数」「单文件上限（MB）」；模板预览与数据采集提示文案（如「最多 3 个，单文件 ≤ 20MB」）均读取该参数配置，默认分别为 pdf/doc/xls/png 等、3 个、20MB。新增示例参数「报告佐证材料」便于查看与调整。',
        route: '#/method-config/params/edit?id=P_report_attach',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/param-attachment-config.png?v=20260715b`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '参数分类三类说明',
        type: 'field',
        date: '2026-07-15 18:30',
        text: '参数管理统一展示三类参数分类：① 基础信息类——说明性、佐证性字段，不参与排放公式；② 活动水平类——生产/消耗活动数据，可参与因子绑定与公式计算；③ 结果计算类——公式输出的核算结果，系统内置不可新建。新增/编辑页下拉展示全部三类，结果计算类置灰标注「系统内置，不可新建」；列表筛选与页脚同步三类说明。',
        route: '#/method-config/params/new',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/param-category-form.png`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '模板列表操作与查看',
        type: 'feature',
        date: '2026-07-15 18:00',
        text: '模板列表按状态区分操作：已停用模板为「启用」「删除」「查看」；草稿为「编辑」「复制」「删除」「查看」；已发布为「编辑」「复制」「删除」「查看」。删除已发布模板将停用该模板，历史数据采集仍绑定原发布版本；已停用模板再次删除则永久移除。',
        route: '#/method-config/templates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-list.png`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '已发布模板编辑隔离',
        type: 'feature',
        date: '2026-07-15 18:00',
        text: '已发布模板支持直接编辑；修改后需重新发布方对新数据采集生效。历史数据采集任务仍使用发布时的模板版本快照，不受后续编辑影响。编辑页与「查看」只读模式均提供说明提示。',
        route: '#/method-config/templates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-view-mode.png`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '模板因子版本',
        type: 'field',
        date: '2026-07-15 17:00',
        text: '新建与编辑模板时新增「因子版本」字段，选项与排放因子库版本 Tab 一致；在表单与核算中匹配排放因子时，下拉仅展示该版本因子库数据。',
        route: '#/method-config/templates/new',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-factor-version.png`
      },
      {
        menu: '数据审核',
        feature: '同主体排放冲突处理',
        type: 'feature',
        date: '2026-07-15 16:20',
        text: '分行审核时，若同一统一社会信用代码已有其他已通过记录且主体排放不一致，弹窗列举客户名称、业务种类、下发分行、主办客户经理、手动核算方法、手动主体排放，供审核员选择采用哪条主体排放；确认后统一同主体各条数据，被覆盖记录在数据采集与排放计算页手动主体排放后标识「（数据已覆盖）」，悬停可查看覆盖来源分行与客户经理。分行一键提交总行后，总行终审时若同主体各条数据已一致，不再重复弹窗；仅当仍存在不一致数据时才再次提示选择。',
        route: '#/approvals',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/emission-conflict-modal.png`
      },
      {
        menu: '数据审核',
        feature: '分行一键提交数据',
        type: 'feature',
        date: '2026-07-15 14:00',
        text: '分行负责人数据审核页新增「一键提交数据」：列表无「已通过」记录时按钮置灰；分行初审通过后勾选记录并提交，审核状态变为待审核，审核环节变为总行终审。',
        route: '#/approvals',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/approvals-batch-toolbar.png`
      },
      {
        menu: '排放因子库',
        feature: '因子编辑与字段统一',
        type: 'feature',
        date: '2026-07-14 18:00',
        text: '恢复因子编辑入口；新增、编辑、查看页字段统一为：因子口径、计算方法、行业名称、适用年度、因子名称、因子数值、因子单位、因子来源（非必填）。',
        route: '#/factors',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/factors-edit-fields.png`
      },
      {
        menu: '排放因子库',
        feature: '因子多版本管理',
        type: 'feature',
        date: '2026-07-14 17:30',
        text: '支持按适用年度维护多版本因子（如 2026、2027 各一版），列表可查看版本历史。',
        route: '#/factors',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/factors-version-tabs.png`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '一键更新全部因子版本',
        type: 'feature',
        date: '2026-07-14 17:00',
        text: '模板编辑页右上角新增「一键更新全部因子版本」，二次确认后将模板内因子引用批量切换至所选版本。',
        route: '#/method-config/templates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-update-factors.png`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '模板行业多选',
        type: 'feature',
        date: '2026-07-14 16:30',
        text: '模板「所属行业」改为多选；新增「其他全部行业通用」枚举，匹配非人行八大高碳、非我行主要行业的默认模板。',
        route: '#/method-config/templates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-industry-multi.png`
      },
      {
        menu: '核算任务管理',
        feature: '新建任务筛选条件',
        type: 'field',
        date: '2026-07-14 15:00',
        text: '移除固定门槛说明文案；新增「项目月均贷款余额（元）起/止」筛选（无默认值，由用户自行填写）。',
        route: '#/candidates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/task-create-filters.png`
      },
      {
        menu: '核算任务管理',
        feature: '新建任务纳入规则',
        type: 'feature',
        date: '2026-07-14 14:30',
        text: '项目类默认全部纳入；非项目按客户维度汇总月均余额达 500 万门槛时整组纳入。',
        route: '#/candidates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/task-create-inclusion.png`
      },
      {
        menu: '行业配置',
        feature: '行业标签筛选',
        type: 'feature',
        date: '2026-07-14 12:00',
        text: '「人行八大高碳」与「我行主要行业」标签同时勾选时，列表取并集展示。',
        route: '#/industry-config',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/industry-config-tags.png`
      },
      {
        menu: '核算任务管理',
        feature: '正式清单字段调整',
        type: 'field',
        date: '2026-07-14 10:00',
        text: '全局清单「贷款行号」拆分为「授信参考编号」「授信编号」两列。',
        route: '#/formal',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/formal-credit-columns.png`
      },
      {
        menu: '数据采集',
        feature: '核算方法独立校验',
        type: 'feature',
        date: '2026-07-14 09:30',
        text: '移除报告法页签顶部统一提示；各核算方法 Tab 独立校验必填项。',
        route: '#/data-collect',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/data-collect-method-tabs.png`
      },
      {
        menu: '数据采集',
        feature: '报告法附件校验',
        type: 'feature',
        date: '2026-07-14 09:00',
        text: '报告法「权威数据」「其他」两个页签均要求上传佐证材料。',
        route: '#/data-collect',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/data-collect-report-attach.png`
      },
      {
        menu: '数据采集',
        feature: '经济活动法字段标签',
        type: 'field',
        date: '2026-07-14 08:30',
        text: '经济活动法页签字段标签由「基数值(万元)」改为「营业收入（元）」。',
        route: '#/data-collect',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/data-collect-economy-label.png`
      },
      {
        menu: '全局',
        feature: '碳排放强度单位',
        type: 'field',
        date: '2026-07-13 18:00',
        text: '碳排放强度相关单位由「元」统一调整为「万元」。',
        route: '#/calculation',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/calculation-intensity-unit.png`
      },
      {
        menu: '核算任务管理',
        feature: '分行业碳排放强度表',
        type: 'field',
        date: '2026-07-13 17:00',
        text: '分行业碳排放强度表末列新增「质量评级」，按行业加权 DQR 展示 A/B+/B/B-/C 等次。',
        route: '#/calculation',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/calculation-quality-grade.png`
      },
      {
        menu: '台账管理',
        feature: '分行数据权限',
        type: 'feature',
        date: '2026-07-13 15:00',
        text: '分行负责人角色仅展示本分行（默认北京分行）下发数据，数据范围按角色隔离。',
        route: '#/ledger',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/ledger-branch-scope.png`
      },
      {
        menu: '企业碳账户',
        feature: '趋势分析择优规则',
        type: 'feature',
        date: '2026-07-13 14:00',
        text: '趋势分析同年多条记录时，优先取数据质量等级更高的方法；等级相同则取最新更新数据。',
        route: '#/carbon-accounts',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/carbon-trend-priority.png`
      },
      {
        menu: '企业碳账户',
        feature: '编辑权限控制',
        type: 'feature',
        date: '2026-07-13 12:00',
        text: '编辑入口仅总行绿金部可见，分行负责人只读查看。',
        route: '#/carbon-accounts',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/carbon-accounts-edit-perm.png`
      }
    ]
  }
];

const UPDATE_TYPE_META = {
  field: { label: '字段更新', cls: 'changelog-type-field' },
  feature: { label: '功能更新', cls: 'changelog-type-feature' },
  style: { label: '样式调整', cls: 'changelog-type-style' },
  fix: { label: '问题修复', cls: 'changelog-type-fix' }
};

function renderChangelogItem(it) {
  const meta = UPDATE_TYPE_META[it.type] || UPDATE_TYPE_META.feature;
  const routeBtn = it.route
    ? `<button type="button" class="btn btn-sm btn-changelog-view" data-changelog-route="${it.route}">查看具体页面</button>`
    : '';
  const shot = it.screenshot
    ? `<div class="changelog-shot-wrap">
        <img class="changelog-shot" src="${it.screenshot}" alt="${it.menu} · ${it.feature}" loading="lazy" data-changelog-preview="1" />
        <span class="changelog-shot-hint">点击截图可放大查看</span>
      </div>`
    : '';
  return `<li class="changelog-item">
    <div class="changelog-item-top">
      <div class="changelog-item-tags">
        <span class="changelog-menu">${it.menu}</span>
        <span class="changelog-type ${meta.cls}">${meta.label}</span>
      </div>
      ${routeBtn}
    </div>
    <dl class="changelog-fields">
      <div class="changelog-field-row">
        <dt>菜单名称</dt>
        <dd>${it.menu}</dd>
      </div>
      <div class="changelog-field-row">
        <dt>功能点名称</dt>
        <dd>${it.feature}</dd>
      </div>
      <div class="changelog-field-row">
        <dt>修改内容</dt>
        <dd>${it.text}</dd>
      </div>
    </dl>
    ${shot}
  </li>`;
}

function changelogItemSortKey(item, releaseDate) {
  return String(item.date || releaseDate || '');
}

function getSortedChangelogReleases() {
  return UPDATE_CHANGELOG
    .slice()
    .sort((a, b) => changelogItemSortKey({ date: b.date }, '').localeCompare(changelogItemSortKey({ date: a.date }, '')))
    .map(rel => ({
      ...rel,
      items: rel.items
        .slice()
        .sort((a, b) => changelogItemSortKey(b, rel.date).localeCompare(changelogItemSortKey(a, rel.date)))
    }));
}

function renderUpdateChangelogHtml() {
  return getSortedChangelogReleases().map(rel => `
    <section class="changelog-release">
      <div class="changelog-release-head">
        <span class="changelog-version">${rel.version}</span>
        <time class="changelog-date">${rel.date}</time>
      </div>
      ${rel.summary ? `<p class="changelog-summary">${rel.summary}</p>` : ''}
      <ul class="changelog-items">
        ${rel.items.map(renderChangelogItem).join('')}
      </ul>
    </section>
  `).join('');
}

function bindUpdateChangelogEvents() {
  document.querySelectorAll('[data-changelog-route]').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.onclick = () => {
      const route = btn.dataset.changelogRoute;
      hideUpdateChangelogDrawer();
      if (route) location.hash = route;
    };
  });
  document.querySelectorAll('[data-changelog-preview]').forEach(img => {
    if (img.dataset.bound) return;
    img.dataset.bound = '1';
    img.onclick = () => openChangelogImagePreview(img.src, img.alt);
  });
}

function ensureChangelogImagePreview() {
  let el = document.getElementById('changelogImagePreview');
  if (el) return el;
  const root = document.getElementById('changelogDrawerRoot') || document.body;
  const wrap = document.createElement('div');
  wrap.id = 'changelogImagePreview';
  wrap.className = 'changelog-image-preview';
  wrap.innerHTML = `
    <div class="changelog-image-preview-backdrop"></div>
    <div class="changelog-image-preview-panel" role="dialog" aria-label="截图预览">
      <button type="button" class="changelog-image-preview-close" aria-label="关闭">&times;</button>
      <img class="changelog-image-preview-img" alt="" />
      <p class="changelog-image-preview-caption"></p>
    </div>`;
  root.appendChild(wrap);
  wrap.querySelector('.changelog-image-preview-backdrop').onclick = hideChangelogImagePreview;
  wrap.querySelector('.changelog-image-preview-close').onclick = hideChangelogImagePreview;
  return wrap;
}

function openChangelogImagePreview(src, caption) {
  const el = ensureChangelogImagePreview();
  el.querySelector('.changelog-image-preview-img').src = src;
  el.querySelector('.changelog-image-preview-caption').textContent = caption || '';
  el.classList.add('show');
}

function hideChangelogImagePreview() {
  document.getElementById('changelogImagePreview')?.classList.remove('show');
}

function ensureUpdateChangelogDrawer() {
  let root = document.getElementById('changelogDrawerRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'changelogDrawerRoot';
    document.body.appendChild(root);
  }
  if (document.getElementById('updateChangelogDrawer')) return document.getElementById('updateChangelogDrawer');
  root.innerHTML = `
    <div class="drawer-overlay" id="updateChangelogDrawer">
      <div class="drawer-panel changelog-drawer-panel" role="dialog" aria-labelledby="updateChangelogTitle">
        <div class="drawer-header">
          <h4 id="updateChangelogTitle">更新说明</h4>
          <button type="button" class="drawer-close" id="closeUpdateChangelogDrawer" aria-label="关闭">&times;</button>
        </div>
        <div class="drawer-body changelog-drawer-body">
          <p class="changelog-intro">以下为近期根据需求沟通完成的页面调整。每条记录包含菜单名称、功能点名称与修改内容，配图均为当前最新页面真实截图，可点击放大或跳转查看。</p>
          <div id="updateChangelogContent">${renderUpdateChangelogHtml()}</div>
        </div>
      </div>
    </div>`;
  const overlay = document.getElementById('updateChangelogDrawer');
  document.getElementById('closeUpdateChangelogDrawer').onclick = () => hideUpdateChangelogDrawer();
  overlay.onclick = (e) => { if (e.target === overlay) hideUpdateChangelogDrawer(); };
  bindUpdateChangelogEvents();
  return overlay;
}

function openUpdateChangelogDrawer() {
  ensureUpdateChangelogDrawer();
  const content = document.getElementById('updateChangelogContent');
  if (content) content.innerHTML = renderUpdateChangelogHtml();
  bindUpdateChangelogEvents();
  document.getElementById('updateChangelogDrawer').classList.add('show');
  document.body.classList.add('drawer-open');
}

function hideUpdateChangelogDrawer() {
  hideChangelogImagePreview();
  document.getElementById('updateChangelogDrawer')?.classList.remove('show');
  document.body.classList.remove('drawer-open');
}
