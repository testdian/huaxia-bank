/**
 * 演示环境专用：批量导入「开发说明」标识（上线版本不包含此脚本即可移除）
 * 与业务字段 ? 气泡区分：橙色虚线徽章 + 点击打开侧栏，非 hover 提示
 */
(function () {
  const ENABLED = window.__DEMO_BATCH_IMPORT_DEV_SPEC__ !== false;

  const IMPORT_BTN_MAP = [
    { btnId: 'paramBatchImportBtn', key: 'param' },
    { btnId: 'factorBatchImportBtn', key: 'factor' }
  ];

  function getSpecs() {
    const paramHeaders = (typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.PARAM_IMPORT_HEADERS)
      ? METHOD_CONFIG.PARAM_IMPORT_HEADERS
      : ['参数名称', '参数分类', '参数类型', '单位', '适用行业', '小数位数', '枚举值'];
    const industryHeaders = (typeof IndustryConfig !== 'undefined' && IndustryConfig.IMPORT_HEADERS)
      ? IndustryConfig.IMPORT_HEADERS
      : ['一级行业代码', '一级行业名称', '二级行业代码', '二级行业名称', '三级行业代码', '三级行业名称', '四级行业代码', '四级行业名称', '完整代码', '标识'];
    const factorHeaders = (typeof FACTOR_IMPORT_HEADERS !== 'undefined')
      ? FACTOR_IMPORT_HEADERS
      : ['因子口径', '计算方法', '行业', '适用年度', '因子名称', '因子数值', '因子单位', '因子来源'];

    return {
      param: {
        title: '参数批量导入 · 开发说明',
        headers: paramHeaders,
        fields: [
          { name: '参数名称', required: '是', note: '不能为空；同名参数跳过' },
          { name: '参数分类', required: '否', note: '默认「活动水平类」；不可填「结果计算类」' },
          { name: '参数类型', required: '否', note: '数值型 / 文本型 / 选项型 / 日期型 / 附件型，默认数值型' },
          { name: '单位', required: '视类型', note: '数值型需单位；选项型/文本型等可填 — 或 无单位' },
          { name: '适用行业', required: '否', note: '多行业用 ,、/| 分隔；空=全行业' },
          { name: '小数位数', required: '否', note: '默认 4' },
          { name: '枚举值', required: '选项型', note: '分号或逗号分隔，如 烟煤;褐煤;天然气' }
        ],
        logic: [
          '文件为空或无数据行时整份导入失败',
          '「参数名称」为空则该行校验失败，记入异常报告',
          '「参数分类」为「结果计算类」则该行拒绝导入',
          '选项型须填写「枚举值」至少一项；数值型/选项型须填写「单位」（可填 — 表示无单位）',
          '其余非必填列可空；同名参数跳过不计入新增'
        ]
      },
      industry: {
        title: '行业配置批量导入 · 开发说明',
        headers: industryHeaders,
        fields: [
          { name: '一级行业代码', required: '是', note: '如 C、D' },
          { name: '一级行业名称', required: '是', note: '' },
          { name: '二级行业代码', required: '是', note: '' },
          { name: '二级行业名称', required: '是', note: '' },
          { name: '三级行业代码', required: '是', note: '' },
          { name: '三级行业名称', required: '是', note: '' },
          { name: '四级行业代码', required: '是', note: '与完整代码至少填一项' },
          { name: '四级行业名称', required: '是', note: '' },
          { name: '完整代码', required: '否', note: '可空，系统按四级代码生成' },
          { name: '标识', required: '否', note: '人行八大高碳 / 我行主要行业，多值用 ;、，分隔' }
        ],
        logic: [
          '文件为空或无数据行时整份导入失败',
          '「四级行业代码」与「完整代码」至少填一项，否则该行校验失败',
          '「一级」至「四级」行业名称任一为空则该行校验失败',
          '「标识」可空；重复行跳过不计入新增'
        ]
      },
      factor: {
        title: '排放因子批量导入 · 开发说明',
        headers: factorHeaders,
        fields: [
          { name: '因子口径', required: '否', note: '人行口径 / 我行/项目组自定义，默认后者' },
          { name: '计算方法', required: '是', note: '报告法 / 能源法 / 产品法 / 经济活动法-营收 / 经济活动法-资产总额 / 其他计算法 / 自定义名称' },
          { name: '行业', required: '是', note: '行业名称，如 电力、钢铁' },
          { name: '适用年度', required: '否', note: '默认当前年，对应因子版本' },
          { name: '因子名称', required: '是', note: '' },
          { name: '因子数值', required: '是', note: '须为数字' },
          { name: '因子单位', required: '是', note: '如 tCO2e/t' },
          { name: '因子来源', required: '否', note: '可空' }
        ],
        logic: [
          '表头须含「计算方法」「因子名称」，否则整份文件校验失败',
          '必填列「计算方法」「行业」「因子名称」「因子数值」「因子单位」任一为空则该行校验失败',
          '计算方法须为系统可识别值（如能源法、产品法、经济活动法-营收、经济活动法-资产总额、其他计算法）；也可填写自定义名称；因子数值须为有效数字',
          '非必填列「因子口径」「适用年度」「因子来源」可空；适用年度缺省为当前年度',
          '校验失败行记入异常报告，不写入因子库；通过校验的行方可导入'
        ]
      }
    };
  }

  function esc(s) {
    return typeof escapeHtml === 'function' ? escapeHtml(s) : String(s || '');
  }

  function renderBadge(key) {
    return `<button type="button" class="dev-import-spec-trigger" data-import-spec-key="${esc(key)}" title="演示专用：点击查看导入模板与逻辑（上线版无此标识）">
      <span class="dev-import-spec-tag">DEV</span><span class="dev-import-spec-label">导入说明</span>
    </button>`;
  }

  function renderSpecHtml(spec) {
    const fieldRows = (spec.fields || []).map(f =>
      `<tr><td><code>${esc(f.name)}</code></td><td>${esc(f.required)}</td><td>${esc(f.note || '—')}</td></tr>`
    ).join('');
    const logicList = (spec.logic || []).map(l => `<li>${esc(l)}</li>`).join('');
    const headerLine = (spec.headers || []).join(', ');
    return `
      <p class="dev-import-spec-banner">演示环境专用标识，正式系统不包含此说明入口。</p>
      <h5 class="dev-import-spec-section-title">模板表头（${(spec.headers || []).length} 列）</h5>
      <p class="dev-import-spec-headers"><code>${esc(headerLine)}</code></p>
      <div class="table-wrap dev-import-spec-table-wrap">
        <table class="data-table dev-import-spec-table">
          <thead><tr><th>字段</th><th>必填</th><th>说明</th></tr></thead>
          <tbody>${fieldRows}</tbody>
        </table>
      </div>
      <h5 class="dev-import-spec-section-title">导入校验</h5>
      <ul class="dev-import-spec-logic">${logicList}</ul>`;
  }

  function ensureDrawer() {
    let root = document.getElementById('devImportSpecDrawerRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'devImportSpecDrawerRoot';
      document.body.appendChild(root);
    }
    if (document.getElementById('devImportSpecDrawer')) return document.getElementById('devImportSpecDrawer');
    root.innerHTML = `
      <div class="drawer-overlay dev-import-spec-drawer" id="devImportSpecDrawer">
        <div class="drawer-panel dev-import-spec-drawer-panel" role="dialog" aria-labelledby="devImportSpecTitle">
          <div class="drawer-header dev-import-spec-drawer-header">
            <h4 id="devImportSpecTitle">批量导入说明</h4>
            <button type="button" class="drawer-close" id="closeDevImportSpecDrawer" aria-label="关闭">&times;</button>
          </div>
          <div class="drawer-body dev-import-spec-drawer-body" id="devImportSpecContent"></div>
        </div>
      </div>`;
    const overlay = document.getElementById('devImportSpecDrawer');
    document.getElementById('closeDevImportSpecDrawer').onclick = () => hideDevImportSpecDrawer();
    overlay.onclick = (e) => { if (e.target === overlay) hideDevImportSpecDrawer(); };
    return overlay;
  }

  function openDevImportSpecDrawer(key) {
    const specs = getSpecs();
    const spec = specs[key];
    if (!spec) return;
    ensureDrawer();
    const title = document.getElementById('devImportSpecTitle');
    const content = document.getElementById('devImportSpecContent');
    if (title) title.textContent = spec.title;
    if (content) content.innerHTML = renderSpecHtml(spec);
    document.getElementById('devImportSpecDrawer').classList.add('show');
    document.body.classList.add('drawer-open');
  }

  function hideDevImportSpecDrawer() {
    document.getElementById('devImportSpecDrawer')?.classList.remove('show');
    document.body.classList.remove('drawer-open');
  }

  function bindBatchImportDevHints(rootEl) {
    if (!ENABLED) return;
    const root = rootEl || document;
    IMPORT_BTN_MAP.forEach(({ btnId, key }) => {
      const btn = root.querySelector(`#${btnId}`);
      if (!btn || btn.dataset.devImportSpecBound === '1') return;
      btn.dataset.devImportSpecBound = '1';
      let wrap = btn.closest('.batch-import-btn-wrap');
      if (!wrap) {
        wrap = document.createElement('span');
        wrap.className = 'batch-import-btn-wrap';
        btn.parentNode.insertBefore(wrap, btn);
        wrap.appendChild(btn);
      }
      if (!wrap.querySelector('.dev-import-spec-trigger')) {
        wrap.insertAdjacentHTML('beforeend', renderBadge(key));
        wrap.querySelector('.dev-import-spec-trigger')?.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          openDevImportSpecDrawer(key);
        });
      }
    });
  }

  window.BatchImportDevSpec = {
    ENABLED,
    bindBatchImportDevHints,
    openDevImportSpecDrawer,
    hideDevImportSpecDrawer,
    getSpecs
  };
})();
