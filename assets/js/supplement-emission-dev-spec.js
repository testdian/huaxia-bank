/**
 * 演示环境专用：数据采集「排放数据」填报开发说明（上线版本不包含此脚本即可移除）
 */
(function () {
  const ENABLED = window.__DEMO_SUPPLEMENT_EMISSION_DEV_SPEC__ !== false;

  function esc(s) {
    return typeof escapeHtml === 'function' ? escapeHtml(s) : String(s || '');
  }

  function getSpec() {
    return {
      title: '排放数据填报 · 开发说明',
      templateConfig: [
        '各行业、各业务种类（非项目/项目）的采集表单，由「碳核算模板配置中心」中已发布的采集模板驱动（resolveTemplate 按国标行业代码与业务类型匹配）',
        '模板内绑定的参数库字段决定本页展示哪些表单项：字段是否必填、是否只读、附件规则等均读取模板/参数配置，而非写死在填报页',
        '能源法、产品法 Tab 的燃料/产品/过程排放等区块结构，以及活动水平类参数的展示与校验，以模板 methods.energy / methods.product 配置为准',
        '模板中绑定的排放因子版本与公式（参数分类为「结果计算类」）决定排放量如何汇总计算；estimateEnergyEmission / estimateProductEmission 按当前模板与因子配置执行',
        '报告法、经济活动法、其他计算法的特殊说明（如经济法只读、其他计算法因子自动匹配）亦在模板配置步骤中定义，填报页仅按发布版本快照渲染',
        '调整必填规则或计算公式时，应在模板配置中心修改并发布；已派发任务绑定派发时的模板版本，历史填报不受新模板影响'
      ],
      methods: [
        {
          tab: '报告法-权威数据',
          methodId: 'report',
          required: '核算周期内温室气体排放总量（tCO₂e）；报告法佐证材料附件（必填，最多 3 个）',
          emission: '填写排放总量即可作为主体排放；系统取 reportedEmission',
          note: '报告法扩展字段与附件规则跟随模板；仅当当前激活 Tab 为报告法时校验附件'
        },
        {
          tab: '报告法-其他',
          methodId: 'report',
          required: '核算周期内温室气体排放总量（tCO₂e）；报告法佐证材料附件（必填）',
          emission: '同报告法-权威数据，取当前 Tab 填报的排放总量',
          note: '核查状态固定为「否」；字段结构同模板中报告法配置'
        },
        {
          tab: '物理活动法-能源法',
          methodId: 'energy',
          required: '按模板配置的燃料/净购入电量/热力/过程排放等参数展示；各字段必填性以模板参数「是否必填」为准',
          emission: '按模板绑定因子与公式汇总计算 energyTotalEmission；或读取模板允许的手工填报排放总量',
          note: '未在模板中配置的能源项不展示；活动水平校验规则与模板参数类型一致'
        },
        {
          tab: '物理活动法-产品法',
          methodId: 'product',
          required: '按模板配置的产品产量等活动水平参数展示；必填性以模板为准（部分行业模板不支持产品法 Tab）',
          emission: '按模板产品因子与公式估算 productTotalEmission；或手工填写排放总量',
          note: '产品法 Tab 是否出现取决于模板 methods.product.supported'
        },
        {
          tab: '经济活动法',
          methodId: 'economy',
          required: '营业收入、行业因子等字段由模板定义；系统直算/接口预填时按模板说明只读',
          emission: '主体排放 = 营业收入 × 行业因子（economyValue × economyFactor），公式与模板一致',
          note: '模板中经济活动法采集说明控制只读与预填逻辑'
        },
        {
          tab: '其他计算法',
          methodId: 'economy_fallback',
          required: '行业排放因子等字段由模板定义；系统按行业自动匹配因子时为只读',
          emission: '本 Tab 不计算主体排放；归因阶段使用余额 × 行业因子兜底',
          note: '模板说明中标注兜底用途；主体排放不在采集阶段按本 Tab 计算'
        }
      ],
      submitChecks: [
        '提交审核时先校验当前激活 Tab：若为报告法，须已上传佐证材料（附件规则同模板参数配置）',
        '项目类且选择「可提供项目信息」：必填项目收入（元）、项目总投资（元）',
        '非项目类或项目按非项目计算：必填营业收入（元）、平均资产总额（元）',
        '项目类未定时须先选择「是否可提供项目信息」',
        '各方法 Tab 内活动水平/结果类字段：必填与格式校验以当前任务绑定的采集模板为准',
        '除上述公共提交项外，不强制所有方法 Tab 同时填完'
      ],
      matchPriority: [
        '分行审核锁定 approvedMethodId 后，优先采用审核选定方法',
        '未锁定时按数据存在性匹配：报告法 > 能源法 > 产品法 > 经济活动法 > 其他计算法',
        '报告法：reportedEmission 有值；能源法：energyTotalEmission；产品法：productTotalEmission；经济法：economyValue；兜底：fallbackFactor'
      ],
      preview: [
        '审核页「方法排放预览」调用 resolveMethodTabEmissionPreview：逐 Tab 判断能否算出主体排放',
        '有预览值显示 tCO₂e；缺数据时显示「缺少数据」',
        '其他计算法 Tab 预览恒为缺少数据（主体排放不在采集阶段计算）'
      ]
    };
  }

  function renderBadge() {
    return `<button type="button" class="dev-import-spec-trigger dev-emission-spec-trigger" data-emission-spec="1" title="演示专用：点击查看排放数据填报校验与计算逻辑（上线版无此标识）">
      <span class="dev-import-spec-tag">DEV</span><span class="dev-import-spec-label">填报说明</span>
    </button>`;
  }

  function renderSpecHtml(spec) {
    const methodRows = (spec.methods || []).map(m =>
      `<tr>
        <td><strong>${esc(m.tab)}</strong><div class="dev-emission-spec-method-id">${esc(m.methodId)}</div></td>
        <td>${esc(m.required)}</td>
        <td>${esc(m.emission)}</td>
        <td>${esc(m.note || '—')}</td>
      </tr>`
    ).join('');
    const submitList = (spec.submitChecks || []).map(l => `<li>${esc(l)}</li>`).join('');
    const templateList = (spec.templateConfig || []).map(l => `<li>${esc(l)}</li>`).join('');
    const priorityList = (spec.matchPriority || []).map(l => `<li>${esc(l)}</li>`).join('');
    const previewList = (spec.preview || []).map(l => `<li>${esc(l)}</li>`).join('');
    return `
      <p class="dev-import-spec-banner">演示环境专用标识，正式系统不包含此说明入口。</p>
      <p class="dev-emission-spec-intro">本区域支持同时填写多种核算方法 Tab。各行业各方法的<strong>采集字段、必填规则与排放量计算公式</strong>，均以「碳核算模板配置中心」中已发布模板为准；填报页按任务绑定的模板版本渲染并校验。提交时另按<strong>当前激活 Tab</strong>与<strong>业务种类</strong>执行公共校验，最终采用哪种方法计算主体排放见下方「方法匹配」与「排放预览」。</p>
      <h5 class="dev-import-spec-section-title">模板配置驱动（碳核算模板配置中心）</h5>
      <ul class="dev-import-spec-logic dev-emission-spec-template-list">${templateList}</ul>
      <p class="dev-emission-spec-template-link">配置入口：<code>#/method-config/templates</code>（模板列表 → 编辑 → 采集字段与因子绑定）</p>
      <h5 class="dev-import-spec-section-title">各方法 Tab：必填校验与主体排放计算</h5>
      <div class="table-wrap dev-import-spec-table-wrap">
        <table class="data-table dev-import-spec-table dev-emission-spec-table">
          <thead><tr><th>方法 Tab</th><th>字段必填/校验</th><th>主体排放计算</th><th>备注</th></tr></thead>
          <tbody>${methodRows}</tbody>
        </table>
      </div>
      <h5 class="dev-import-spec-section-title">提交审核校验（与 Tab 无关的公共项）</h5>
      <ul class="dev-import-spec-logic">${submitList}</ul>
      <h5 class="dev-import-spec-section-title">方法匹配优先级（matchMethod）</h5>
      <ul class="dev-import-spec-logic">${priorityList}</ul>
      <h5 class="dev-import-spec-section-title">审核排放预览（resolveMethodTabEmissionPreview）</h5>
      <ul class="dev-import-spec-logic">${previewList}</ul>`;
  }

  function ensureDrawer() {
    let root = document.getElementById('devEmissionSpecDrawerRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'devEmissionSpecDrawerRoot';
      document.body.appendChild(root);
    }
    if (document.getElementById('devEmissionSpecDrawer')) return document.getElementById('devEmissionSpecDrawer');
    root.innerHTML = `
      <div class="drawer-overlay dev-import-spec-drawer" id="devEmissionSpecDrawer">
        <div class="drawer-panel dev-import-spec-drawer-panel dev-emission-spec-drawer-panel" role="dialog" aria-labelledby="devEmissionSpecTitle">
          <div class="drawer-header dev-import-spec-drawer-header">
            <h4 id="devEmissionSpecTitle">排放数据填报说明</h4>
            <button type="button" class="drawer-close" id="closeDevEmissionSpecDrawer" aria-label="关闭">&times;</button>
          </div>
          <div class="drawer-body dev-import-spec-drawer-body" id="devEmissionSpecContent"></div>
        </div>
      </div>`;
    const overlay = document.getElementById('devEmissionSpecDrawer');
    document.getElementById('closeDevEmissionSpecDrawer').onclick = () => hideDevEmissionSpecDrawer();
    overlay.onclick = (e) => { if (e.target === overlay) hideDevEmissionSpecDrawer(); };
    return overlay;
  }

  function openDevEmissionSpecDrawer() {
    const spec = getSpec();
    ensureDrawer();
    const title = document.getElementById('devEmissionSpecTitle');
    const content = document.getElementById('devEmissionSpecContent');
    if (title) title.textContent = spec.title;
    if (content) content.innerHTML = renderSpecHtml(spec);
    document.getElementById('devEmissionSpecDrawer').classList.add('show');
    document.body.classList.add('drawer-open');
  }

  function hideDevEmissionSpecDrawer() {
    document.getElementById('devEmissionSpecDrawer')?.classList.remove('show');
    document.body.classList.remove('drawer-open');
  }

  function bindSupplementEmissionDevHint(rootEl) {
    if (!ENABLED) return;
    const root = rootEl || document;
    root.querySelectorAll('.dev-emission-spec-trigger').forEach(btn => {
      if (btn.dataset.devEmissionSpecBound === '1') return;
      btn.dataset.devEmissionSpecBound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openDevEmissionSpecDrawer();
      });
    });
  }

  window.SupplementEmissionDevSpec = {
    ENABLED,
    renderBadge,
    bindSupplementEmissionDevHint,
    openDevEmissionSpecDrawer,
    hideDevEmissionSpecDrawer,
    getSpec
  };
})();
