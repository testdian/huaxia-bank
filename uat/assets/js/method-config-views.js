/** 计算方法配置 — 页面视图（须在 spa-views.js 之后加载） */
if (typeof SPA_VIEWS === 'undefined') {
  console.error('method-config-views.js 必须在 spa-views.js 之后加载');
}

SPA_VIEWS['#/method-config/params'] = function() {
  const rows = METHOD_CONFIG.listParams().map(p => `
    <tr>
      <td><code>${p.id}</code></td>
      <td>${p.name}</td>
      <td>${METHOD_CONFIG.formatLabel(p.format)}${p.format === 'number' ? ` · ${p.decimalPlaces ?? 4} 位小数` : ''}${p.format === 'text' && p.textMode === 'multiline' ? ' · 多行' : ''}${p.enumCount ? ` · ${p.enumCount} 项枚举` : ''}</td>
      <td>${p.unit || '—'}</td>
      <td>${p.showInTemplate ? '展示' : '隐藏'}</td>
      <td class="table-actions">
        <a href="#/method-config/params/edit?id=${encodeURIComponent(p.id)}" class="btn-link">编辑</a>
        <button type="button" class="btn-link btn-link-danger" data-param-delete="${escapeHtml(p.id)}" title="删除参数">删除</button>
      </td>
    </tr>`).join('');
  return `
    <h1 class="page-title">参数字段库</h1>
    <div class="toolbar">
      <a href="#/method-config/params/new" class="btn btn-primary">+ 新增参数</a>
    </div>
    <div class="card">
      <div class="card-header"><h3>参数列表</h3></div>
      <div class="card-body table-wrap">
        <table class="data-table">
          <thead><tr><th>参数 ID</th><th>参数名称</th><th>格式</th><th>单位</th><th>模板展示</th><th>操作</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
};

SPA_VIEWS['#/method-config/params/new'] = function() {
  return renderMethodConfigParamForm(null);
};

SPA_VIEWS['#/method-config/params/edit'] = function() {
  const id = new URLSearchParams((location.hash.split('?')[1] || '')).get('id');
  const param = METHOD_CONFIG.getParam(id);
  return renderMethodConfigParamForm(param);
};

function renderMethodConfigParamForm(param) {
  const isEdit = !!param;
  const fmt = param?.format || 'number';
  const enumText = param?.enumValues ? param.enumValues.join('\n') : '';
  const unitType = param?.unitType || 'common';
  const textMode = param?.textMode || 'single';
  const unitTypeRadios = (name, selected) => `
    <div class="radio-row param-unit-type-row">
      ${[
        ['common', '普通单位'],
        ['composite', '复合单位'],
        ['none', '无单位']
      ].map(([v, l]) => `
        <label class="radio-chip"><input type="radio" name="${name}" value="${v}" ${selected === v ? 'checked' : ''}> ${l}</label>
      `).join('')}
    </div>`;
  return `
    <h1 class="page-title">${isEdit ? '编辑参数' : '新增参数'}</h1>
    <div class="card"><div class="card-body">
      <form class="form-grid method-config-param-form" id="paramForm">
        <div class="form-item"><label>参数名称 <span class="req">*</span></label><input name="name" required value="${escapeHtml(param?.name || '')}" placeholder="如：煤炭消耗量"></div>
        <div class="form-item"><label>参数 ID <span class="req">*</span></label><input name="id" required value="${escapeHtml(param?.id || '')}" placeholder="如：P_coal" ${isEdit ? 'readonly' : ''}></div>
        <div class="form-item full"><label>参数格式 <span class="req">*</span></label>
          <div class="radio-row">
            ${['text', 'number', 'option', 'date'].map(f => `
              <label class="radio-chip"><input type="radio" name="format" value="${f}" ${(!param && f === 'number') || fmt === f ? 'checked' : ''}> ${METHOD_CONFIG.formatLabel(f)}</label>
            `).join('')}
          </div>
        </div>

        <div class="form-item full param-format-panel" data-format-panel="text">
          <label>文本样式</label>
          <div class="radio-row">
            <label class="radio-chip"><input type="radio" name="textMode" value="single" ${textMode !== 'multiline' ? 'checked' : ''}> 单行文本</label>
            <label class="radio-chip"><input type="radio" name="textMode" value="multiline" ${textMode === 'multiline' ? 'checked' : ''}> 多行文本</label>
          </div>
        </div>
        <div class="form-item param-format-panel" data-format-panel="text">
          <label>最大字符长度</label>
          <input type="number" name="maxLength" min="1" max="9999" value="${param?.maxLength ?? 200}">
        </div>

        <div class="form-item param-format-panel" data-format-panel="number">
          <label>最大小数位数</label>
          <input type="number" name="decimalPlaces" min="0" max="10" value="${param?.decimalPlaces ?? 4}">
        </div>
        <div class="form-item full param-format-panel" data-format-panel="number">
          <label>单位类型</label>
          ${unitTypeRadios('numberUnitType', unitType)}
        </div>
        <div class="form-item param-format-panel" data-format-panel="number" data-unit-field="number">
          <label>单位</label>
          <input name="numberUnit" value="${escapeHtml(param?.unit && param.unit !== '无单位' ? param.unit : 't')}" placeholder="t / 万m³ / tCO₂e">
        </div>

        <div class="form-item full param-format-panel" data-format-panel="option">
          <label>枚举值 <span class="req">*</span></label>
          <textarea name="enumValues" rows="4" placeholder="每行一个选项">${escapeHtml(enumText)}</textarea>
        </div>
        <div class="form-item param-format-panel" data-format-panel="option">
          <label>有无默认值</label>
          <div class="radio-row">
            <label class="radio-chip"><input type="radio" name="hasDefault" value="1" ${param?.hasDefault !== false && param?.defaultValue ? 'checked' : ''}> 有</label>
            <label class="radio-chip"><input type="radio" name="hasDefault" value="0" ${!param?.defaultValue && param?.hasDefault === false ? 'checked' : ''}> 无</label>
          </div>
        </div>
        <div class="form-item param-format-panel" data-format-panel="option">
          <label>默认值</label>
          <input name="defaultValue" value="${escapeHtml(param?.defaultValue || '')}" placeholder="与枚举值之一一致">
        </div>
        <div class="form-item full param-format-panel" data-format-panel="option">
          <label>单位类型</label>
          ${unitTypeRadios('optionUnitType', unitType)}
        </div>
        <div class="form-item param-format-panel" data-format-panel="option" data-unit-field="option">
          <label>单位</label>
          <input name="optionUnit" value="${escapeHtml(param?.unit && param.unit !== '无单位' ? param.unit : '—')}" placeholder="无单位可留空">
        </div>

        <div class="form-item full param-format-panel" data-format-panel="date">
          <p class="method-config-step-hint" style="margin:0">日期格式在数据采集页以日期选择器展示，无需额外配置。</p>
        </div>

        <div class="form-item"><label>模板中展示</label>
          <select name="showInTemplate"><option value="1" ${param?.showInTemplate !== false ? 'selected' : ''}>是</option><option value="0" ${param?.showInTemplate === false ? 'selected' : ''}>否（仅公式/因子引用）</option></select>
        </div>
        <div class="form-item full"><label>参数描述</label><textarea name="description" rows="2" placeholder="字段说明、填报口径">${escapeHtml(param?.description || '')}</textarea></div>
      </form>
    </div></div>
    <div class="form-actions">
      <a href="#/method-config/params" class="btn">取消</a>
      <button type="button" class="btn btn-primary" id="paramSaveBtn">保存</button>
    </div>`;
}

SPA_VIEWS['#/method-config/templates'] = function() {
  const industries = METHOD_CONFIG.industries;
  const templates = METHOD_CONFIG.templates;
  const tree = industries.map(ind => {
    const rows = ind.bizTypes.map(bt => {
      const items = ind.methods.map(mid => {
        const tpl = templates.find(t => t.industry === ind.key && t.bizType === bt && t.methodId === mid);
        const status = tpl ? METHOD_CONFIG.statusBadge(tpl.status) : '<span class="tag tag-info">未配置</span>';
        const href = tpl
          ? `#/method-config/templates/edit?id=${encodeURIComponent(tpl.id)}`
          : `#/method-config/templates/edit?industry=${encodeURIComponent(ind.key)}&bizType=${bt}&methodId=${mid}`;
        return `<a class="method-config-tree-leaf" href="${href}">${METHOD_CONFIG.methodLabel(mid)} ${status}</a>`;
      }).join('');
      return `<div class="method-config-tree-branch"><div class="branch-label">${METHOD_CONFIG.bizLabel(bt)}</div>${items}</div>`;
    }).join('');
    return `<div class="method-config-tree-node"><div class="node-label">${ind.key}</div>${rows}</div>`;
  }).join('');

  const tableRows = templates.map(t => `
    <tr class="${t.highlight ? 'method-config-highlight-row' : ''}">
      <td>${t.industry}</td>
      <td>${METHOD_CONFIG.bizLabel(t.bizType)}</td>
      <td>${METHOD_CONFIG.methodLabel(t.methodId)}</td>
      <td>${METHOD_CONFIG.statusBadge(t.status)}</td>
      <td>${t.version}</td>
      <td>${t.fieldCount}</td>
      <td>${t.formulaCount}</td>
      <td>${t.updatedAt}</td>
      <td><a href="#/method-config/templates/edit?id=${encodeURIComponent(t.id)}" class="btn-link">编辑</a></td>
    </tr>`).join('');

  return `
    <h1 class="page-title">方法模板配置</h1>
    <div class="toolbar" style="margin-bottom:16px">
      <a href="#/method-config/templates/new" class="btn btn-primary">+ 新增模板</a>
    </div>
    <div class="method-config-layout">
      <aside class="method-config-sidebar card">
        <div class="card-header"><h3>行业导航</h3></div>
        <div class="card-body method-config-tree">${tree}</div>
      </aside>
      <div class="method-config-main">
        <div class="card">
          <div class="card-header"><h3>模板列表</h3></div>
          <div class="card-body table-wrap">
            <table class="data-table">
              <thead><tr><th>行业</th><th>业务类型</th><th>核算方法</th><th>状态</th><th>版本</th><th>字段数</th><th>公式数</th><th>更新</th><th>操作</th></tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
};

SPA_VIEWS['#/method-config/templates/new'] = function() {
  const industries = METHOD_CONFIG.industries;
  const defaultInd = industries[0];
  const defaultMethods = METHOD_CONFIG.DEFAULT_INDUSTRY_METHODS || ['report', 'energy', 'product'];
  const methodOpts = (defaultInd?.methods || defaultMethods).map(mid =>
    `<option value="${mid}">${METHOD_CONFIG.methodLabel(mid)}</option>`
  ).join('');
  const industryOpts = industries.map(ind =>
    `<option value="${escapeHtml(ind.key)}" data-methods="${ind.methods.join(',')}">${escapeHtml(ind.key)}</option>`
  ).join('');
  const copyOpts = METHOD_CONFIG.templates.map(t =>
    `<option value="${encodeURIComponent(t.id)}">${t.industry} · ${METHOD_CONFIG.bizLabel(t.bizType)} · ${METHOD_CONFIG.methodLabel(t.methodId)}</option>`
  ).join('');
  return `
    <h1 class="page-title">新增方法模板</h1>
    <div class="card"><div class="card-body">
      <form class="form-grid" id="tplCreateForm">
        <div class="form-item"><label>行业 <span class="req">*</span></label>
          <select name="industry" id="tplCreateIndustry" required>
            ${industryOpts}
            <option value="__new__">+ 新增行业…</option>
          </select>
        </div>
        <div class="form-item" id="tplCreateIndustryNewWrap" hidden>
          <label>新行业名称 <span class="req">*</span></label>
          <input type="text" id="tplCreateIndustryNew" name="industryNew" placeholder="如：造纸、船舶" maxlength="32">
        </div>
        <div class="form-item"><label>业务类型 <span class="req">*</span></label>
          <select name="bizType" required>
            <option value="non_project">非项目</option>
            <option value="project">项目</option>
          </select>
        </div>
        <div class="form-item"><label>核算方法 <span class="req">*</span></label>
          <select name="methodId" id="tplCreateMethod" required>${methodOpts}</select>
        </div>
        <div class="form-item full"><label>初始内容</label>
          <select name="copyFromId">
            <option value="">空白模板（仅含默认合计公式）</option>
            <option value="tpl_np_平板玻璃_energy">从平板玻璃·能源法样例复制</option>
            ${copyOpts}
          </select>
          <small style="color:#909399;display:block;margin-top:6px">同一行业 + 业务类型 + 核算方法仅允许一份模板；若已存在将提示前往编辑。新增行业将自动加入左侧行业导航。</small>
        </div>
      </form>
    </div></div>
    <div class="form-actions">
      <a href="#/method-config/templates" class="btn">取消</a>
      <button type="button" class="btn btn-primary" id="tplCreateBtn">创建并编辑</button>
    </div>`;
};

function renderTemplateMetaFields(detail) {
  const m = detail.meta || {};
  return `<div class="form-grid method-config-meta-form">
    <div class="form-item"><label>采集表来源</label><input name="meta_dataSourceCollect" value="${escapeHtml(m.dataSourceCollect || '')}" placeholder="如：联合赤道采集表"></div>
    <div class="form-item"><label>因子表来源</label><input name="meta_dataSourceFactor" value="${escapeHtml(m.dataSourceFactor || '')}" placeholder="如：赤道因子表"></div>
    <div class="form-item"><label>国标代码</label><input name="meta_gbCodes" value="${escapeHtml((m.gbCodes || []).join('、'))}" placeholder="C3041"></div>
    <div class="form-item full"><label>主体排放说明</label><input name="meta_entityFormulaSummary" value="${escapeHtml(m.entityFormulaSummary || '')}" placeholder="主体A排放 = 燃料 + 购电 + ..."></div>
  </div>`;
}

function renderTemplateStep1Edit(detail) {
  const selectedIds = new Set((detail.params || []).map(p => p.id));
  const overrides = Object.fromEntries((detail.params || []).map(p => [p.id, p]));
  const rows = METHOD_CONFIG.listParams().map(p => {
    const sel = overrides[p.id] || p;
    const checked = selectedIds.has(p.id);
    return `<tr>
      <td><input type="checkbox" class="tpl-param-check" value="${escapeHtml(p.id)}" ${checked ? 'checked' : ''}></td>
      <td><code>${escapeHtml(p.id)}</code></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${METHOD_CONFIG.formatLabel(p.format)} · ${escapeHtml(p.unit || '')}</td>
      <td><input name="param_section_${escapeHtml(p.id)}" value="${escapeHtml(sel.section || '默认分区')}" placeholder="如：固定燃料" title="同一分区名的字段在采集页合并为一块"></td>
      <td style="text-align:center"><input type="checkbox" name="param_required_${escapeHtml(p.id)}" ${sel.required ? 'checked' : ''}></td>
      <td style="text-align:center" title="勾选后客户经理可在采集页对该分区增删行（如多种燃料）"><input type="checkbox" name="param_multirow_${escapeHtml(p.id)}" ${sel.allowMultiRow ? 'checked' : ''}></td>
    </tr>`;
  }).join('');

  const layoutPreview = (detail.layout || []).map(sec =>
    `<li><strong>${escapeHtml(sec.title)}</strong>：${(sec.fields || []).map(f => `<code>${f}</code>`).join('、') || '—'}</li>`
  ).join('');

  return `
    ${renderTemplateMetaFields(detail)}
    <div class="toolbar" style="margin:16px 0">
      <input type="search" id="tplParamFilter" placeholder="搜索参数名称或 ID…" style="max-width:240px">
      <button type="button" class="btn btn-sm" id="tplSelectAllParams">全选</button>
      <button type="button" class="btn btn-sm" id="tplClearAllParams">清空勾选</button>
      <a href="#/method-config/params/new" class="btn btn-sm">+ 新增参数字段</a>
    </div>
    <div class="method-config-step-hint" style="margin-bottom:12px">
      <span class="hint-label">采集分区</span>指客户经理填报时的<strong>表区块名称</strong>（如「固定燃料」「购电」）。同一分区名下的字段会并排展示；保存后自动生成分区布局。
    </div>
    <div class="table-wrap">
      <table class="data-table method-config-param-pick-table">
        <thead><tr><th width="40">选用</th><th>参数 ID</th><th>名称</th><th>格式</th><th>采集分区</th><th width="56">必填</th><th width="72" title="可增行">可增行</th></tr></thead>
        <tbody id="tplParamBody">${rows}</tbody>
      </table>
    </div>
    <p class="text-muted" style="font-size:13px;margin-top:12px">已选 ${selectedIds.size} 个字段。勾选「可增行」的分区在数据采集页支持客户经理自行增添多行（如多种燃料品种）。</p>
    ${layoutPreview ? `<div class="method-config-layout-preview"><span class="text-muted">当前分区预览：</span><ul>${layoutPreview}</ul></div>` : ''}`;
}

function renderFormulaBuilderToolbar(detail) {
  const params = detail.params || [];
  const paramChips = params.length
    ? params.map(p => `<button type="button" class="formula-insert-chip" data-insert="{${escapeHtml(p.id)}}" title="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button>`).join('')
    : '<span class="text-muted">请先在 Step1 勾选采集参数</span>';
  const ops = ['+', '-', '*', '/', '(', ')', 'SUM(', ','].map(op =>
    `<button type="button" class="formula-insert-op" data-insert="${escapeHtml(op)}">${escapeHtml(op)}</button>`
  ).join('');
  const factorHints = ['factor_coal', 'factor_gas', 'factor_grid', 'factor_electric'].map(k =>
    `<button type="button" class="formula-insert-factor" data-insert="{${k}}">${k.replace('factor_', '')}</button>`
  ).join('');
  return `
    <div class="formula-builder-bar">
      <div class="formula-builder-row">
        <span class="formula-builder-label">点选插入参数</span>
        <div class="formula-builder-chips">${paramChips}</div>
      </div>
      <div class="formula-builder-row">
        <span class="formula-builder-label">运算符</span>
        <div class="formula-builder-ops">${ops}</div>
      </div>
      <div class="formula-builder-row">
        <span class="formula-builder-label">因子占位</span>
        <div class="formula-builder-chips formula-builder-factors">${factorHints}</div>
        <span class="text-muted" style="font-size:12px;margin-left:8px">Step3 再绑定具体排放因子</span>
      </div>
      <p class="text-muted" style="font-size:12px;margin:8px 0 0">先点击某行「表达式」输入框，再点上方按钮即可插入；也可直接键盘输入。</p>
    </div>`;
}

function renderTemplateStep2Edit(detail) {
  const rows = (detail.formulas || []).map(f => MethodConfigEditor.formulaRowHtml(f)).join('') ||
    MethodConfigEditor.formulaRowHtml({ id: 'F1', sort: 1, name: '主体排放合计', isEntityTotal: true });
  return `
    ${renderFormulaBuilderToolbar(detail)}
    <div class="method-config-step-hint" style="margin:12px 0">
      <span class="hint-label">分项 / 合计</span>
      <strong>分项</strong>：一条公式对应一类排放（如燃料燃烧、购电）；<strong>合计</strong>：用 SUM 汇总各分项为主体总排放（每模板仅勾选一个合计行）。
      分项勾选「可增行」时，对应采集分区支持多种品种逐行填报。
    </div>
    <div class="table-wrap">
      <table class="data-table method-config-formula-edit-table">
        <thead><tr><th>序</th><th>ID</th><th>名称</th><th>表达式</th><th>单位</th><th>活动数据</th><th>标记</th><th></th></tr></thead>
        <tbody id="tplFormulaBody">${rows}</tbody>
      </table>
    </div>
    <div class="toolbar" style="margin-top:12px">
      <button type="button" class="btn btn-sm" id="tplAddFormulaBtn">+ 添加公式</button>
      <button type="button" class="btn btn-sm" id="formulaValidateBtn">公式校验</button>
    </div>`;
}

function renderTemplateStep3Edit(detail) {
  const rows = (detail.factorBindings || []).map(b => MethodConfigEditor.factorCardHtml(b, detail)).join('');
  return `
    <div class="method-config-step-hint" style="margin-bottom:12px">
      <span class="hint-label">如何选择因子</span>
      每条卡片对应公式里的 <code>{factor_xxx}</code>。先看「用于公式」确认对应关系，再从<strong>排放因子库</strong>选用或填写缺省值；匹配方式为「按选项/品种」时需指定依赖的采集字段。
    </div>
    <div class="factor-binding-cards" id="tplFactorBody">${rows || '<p class="text-muted">暂无因子配置，请点击下方「从公式提取」</p>'}</div>
    <div class="toolbar" style="margin-top:12px">
      <button type="button" class="btn btn-sm" id="tplAddFactorBtn">+ 添加因子</button>
      <button type="button" class="btn btn-sm btn-primary" id="tplExtractFactorsBtn">从公式提取因子引用</button>
    </div>`;
}

SPA_VIEWS['#/method-config/templates/edit'] = function() {
  const q = new URLSearchParams((location.hash.split('?')[1] || ''));
  const { id, tpl, detail } = METHOD_CONFIG.resolveTemplateForEdit(q);
  const stepRaw = q.get('step') || '1';
  const step = stepRaw === '4' ? '1' : stepRaw;
  const title = `${detail.meta.industry} · ${METHOD_CONFIG.bizLabel(detail.meta.bizType)} · ${METHOD_CONFIG.methodLabel(detail.meta.methodId)}`;

  const steps = [
    { id: '1', label: 'Step1 选择参数' },
    { id: '2', label: 'Step2 输入公式' },
    { id: '3', label: 'Step3 选择因子' }
  ];

  const stepNav = steps.map(s => {
    const params = new URLSearchParams(q);
    params.set('step', s.id);
    params.set('id', id);
    return `<a href="#/method-config/templates/edit?${params}" class="method-config-step-tab ${step === s.id ? 'active' : ''}">${s.label}</a>`;
  }).join('');

  let body;
  if (step === '2') body = renderTemplateStep2Edit(detail);
  else if (step === '3') body = renderTemplateStep3Edit(detail);
  else body = renderTemplateStep1Edit(detail);

  return `
    <div class="method-config-edit-head">
      <div>
        <h1 class="page-title" style="margin-bottom:4px">${title}</h1>
        <p class="text-muted" style="margin:0;font-size:13px">${METHOD_CONFIG.statusBadge(tpl.status)} · 模板 ID：<code>${id}</code> · 版本 ${tpl.version || '—'}</p>
      </div>
      <div class="toolbar">
        <button type="button" class="btn btn-sm" id="tplCopyFlatGlassBtn">从平板玻璃复制</button>
        <button type="button" class="btn btn-primary" id="tplPublishBtn">发布模板</button>
      </div>
    </div>
    <div class="method-config-step-tabs">${stepNav}</div>
    <form id="tplEditForm">
      <div class="card"><div class="card-body">${body}</div></div>
      <div class="form-actions">
        <a href="#/method-config/templates" class="btn">返回列表</a>
        <button type="button" class="btn btn-primary" id="tplSaveDraftBtn">保存草稿</button>
      </div>
    </form>`;
};

