/** 碳核算模板配置中心 — 页面视图（须在 spa-views.js 之后加载） */
if (typeof SPA_VIEWS === 'undefined') {
  console.error('method-config-views.js 必须在 spa-views.js 之后加载');
}

/** 从行业配置取已标识行业，生成带 optgroup 的 option 列表 */
function methodConfigIndustryOptions(selected, includeBlank) {
  const pboRows = [];
  const bankRows = [];
  const hasCfg = typeof IndustryConfig !== 'undefined' && IndustryConfig.getRows().length > 0;
  if (hasCfg) {
    IndustryConfig.getRows().forEach(r => {
      const code = r.code || r.cascadeCode || '';
      const name = r.level4Name || r.name || '';
      if (!code) return;
      const label = `${code} ${name}`;
      if (IndustryConfig.hasTag(r, IndustryConfig.TAG_PBO_EIGHT)) pboRows.push({ value: code, label });
      if (IndustryConfig.hasTag(r, IndustryConfig.TAG_BANK_MAJOR)) bankRows.push({ value: code, label });
    });
  }
  if (!pboRows.length && typeof INDUSTRY_TABLE !== 'undefined') {
    INDUSTRY_TABLE.forEach(r => pboRows.push({ value: r.code, label: `${r.code} ${r.name}` }));
  }
  if (!bankRows.length && typeof INDUSTRY_BANK_MAJOR_TABLE !== 'undefined') {
    INDUSTRY_BANK_MAJOR_TABLE.forEach(r => bankRows.push({ value: r.code, label: `${r.code} ${r.name}` }));
  }
  const blank = includeBlank !== false ? `<option value="">全部行业</option>` : '';
  const pboGroup = pboRows.length
    ? `<optgroup label="人行八大高碳行业">${pboRows.map(o => `<option value="${escapeHtml(o.value)}" ${o.value === selected ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}</optgroup>`
    : '';
  const bankGroup = bankRows.length
    ? `<optgroup label="我行主要行业">${bankRows.map(o => `<option value="${escapeHtml(o.value)}" ${o.value === selected ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}</optgroup>`
    : '';
  // 兼容旧数据：selected 若是旧大类名（如"电力"），补一个隐式选项保持已选状态
  const allCodes = pboRows.concat(bankRows).map(o => o.value);
  const isLegacy = selected && !allCodes.includes(selected);
  const legacyOpt = isLegacy ? `<option value="${escapeHtml(selected)}" selected>${escapeHtml(selected)}</option>` : '';
  return blank + legacyOpt + pboGroup + bankGroup;
}

/** 核算方法 combobox：样式与其他下拉统一，支持选择预设或手动输入 */
function methodConfigMethodCombo(fieldName, selected, comboId) {
  const methods = (typeof GUIDE !== 'undefined' && GUIDE.METHODS) ? GUIDE.METHODS : [];
  const displayVal = methods.find(m => m.id === selected)?.name || selected || '';
  const options = methods.map(m =>
    `<div class="param-units-option method-combo-option" data-value="${escapeHtml(m.name)}">${escapeHtml(m.name)}</div>`
  ).join('');
  return `
    <div class="method-combo-wrap param-units-combo" id="${escapeHtml(comboId)}Wrap" data-combo-id="${escapeHtml(comboId)}">
      <div class="method-combo-field param-units-combo-field" tabindex="0">
        <input type="text" name="${escapeHtml(fieldName)}" class="method-combo-input" autocomplete="off"
          value="${escapeHtml(displayVal)}" required placeholder="请选择或输入核算方法名称">
        <span class="param-units-drop-arrow">▼</span>
      </div>
      <div class="method-combo-dropdown param-units-dropdown" style="display:none">
        <div class="method-combo-options param-units-options">${options}</div>
      </div>
    </div>`;
}

function methodConfigMethodOptions(selected, methods) {
  const list = methods || METHOD_CONFIG.DEFAULT_INDUSTRY_METHODS || ['report', 'energy', 'product', 'economy', 'other'];
  return list.map(mid =>
    `<option value="${mid}" ${mid === selected ? 'selected' : ''}>${METHOD_CONFIG.methodLabel(mid)}</option>`
  ).join('');
}

SPA_VIEWS['#/method-config/params'] = function() {
  const q = new URLSearchParams((location.hash.split('?')[1] || ''));
  const filters = {
    keyword: q.get('kw') || '',
    category: q.get('category') || '',
    industry: q.get('industry') || '',
    status: q.get('status') || ''
  };
  const rows = METHOD_CONFIG.filterParams(filters).map(p => `
    <tr class="${p.status === 'inactive' ? 'row-muted' : ''}">
      <td><code>${escapeHtml(p.paramCode || p.id)}</code></td>
      <td>${escapeHtml(p.name)}</td>
      <td>${METHOD_CONFIG.paramTypeLabel(p.paramType || METHOD_CONFIG.paramTypeFromFormat(p.format))}</td>
      <td>${escapeHtml(p.category || '—')}</td>
      <td>${escapeHtml(METHOD_CONFIG.paramUnitsDisplay(p))}</td>
      <td>${(p.applyIndustry || []).length ? escapeHtml(p.applyIndustry.join('、')) : '全行业通用'}</td>
      <td>${METHOD_CONFIG.paramStatusBadge(p.status)}</td>
      <td class="actions">
        <a href="#/method-config/params/edit?id=${encodeURIComponent(p.id)}" class="btn-link">编辑</a>
        <button type="button" class="btn-link" data-param-copy="${escapeHtml(p.id)}">复制</button>
        ${p.builtin ? '' : `<button type="button" class="btn-link" data-param-toggle="${escapeHtml(p.id)}">${p.status === 'inactive' ? '启用' : '停用'}</button>`}
        ${p.builtin ? '' : `<button type="button" class="btn-link btn-link-danger" data-param-delete="${escapeHtml(p.id)}">删除</button>`}
      </td>
    </tr>`).join('');

  const categoryOpts = ['', ...METHOD_CONFIG.PARAM_CATEGORIES].map(c =>
    `<option value="${c}" ${filters.category === c ? 'selected' : ''}>${c || '全部分类'}</option>`
  ).join('');
  const industryOpts = ['', ...METHOD_CONFIG.EIGHT_INDUSTRIES].map(c =>
    `<option value="${c}" ${filters.industry === c ? 'selected' : ''}>${c || '全部行业'}</option>`
  ).join('');
  const statusOpts = [
    ['', '全部状态'],
    ['active', '启用'],
    ['inactive', '停用']
  ].map(([v, l]) => `<option value="${v}" ${filters.status === v ? 'selected' : ''}>${l}</option>`).join('');

  return `
    <h1 class="page-title">参数管理</h1>
    <div class="toolbar method-config-filter-bar">
      <a href="#/method-config/params/new" class="btn btn-primary">+ 新增参数</a>
      <button type="button" class="btn" id="paramBatchImportBtn">批量导入</button>
    </div>
    <div class="card">
      <div class="card-header"><h3>查询筛选</h3></div>
      <div class="filter-panel method-config-filter-panel">
        <form class="filter-extra method-config-filter-grid method-config-filter-grid--5" id="paramFilterForm">
          <div class="form-item"><label>关键词</label><input name="kw" value="${escapeHtml(filters.keyword)}" placeholder="参数名称 / 编码"></div>
          <div class="form-item"><label>参数分类</label><select name="category">${categoryOpts}</select></div>
          <div class="form-item"><label>适用行业</label><select name="industry">${industryOpts}</select></div>
          <div class="form-item"><label>状态</label><select name="status">${statusOpts}</select></div>
          <div class="form-item filter-actions"><label>&nbsp;</label>
            <div class="filter-action-btns">
              <button type="submit" class="btn btn-primary">查询</button>
              <button type="button" class="btn" id="paramFilterResetBtn">重置</button>
            </div>
          </div>
        </form>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>参数列表</h3></div>
      <div class="card-body table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>参数编码</th><th>参数名称</th><th>参数类型</th><th>参数分类</th><th>单位</th><th>适用行业</th><th>状态</th><th>操作</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="8" class="text-muted">暂无参数</td></tr>'}</tbody>
        </table>
      </div>
    </div>
    <p class="text-muted" style="font-size:12px;margin-top:8px">结果计算类参数为系统内置；停用后不可被新模板引用，已引用历史模板不受影响。</p>`;
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
  const isBuiltin = param?.builtin || METHOD_CONFIG.BUILTIN_RESULT_PARAM_IDS.includes(param?.id);
  const paramType = param?.paramType || METHOD_CONFIG.paramTypeFromFormat(param?.format || 'number');
  const enumList = param?.enumValues || [];
  const enumText = enumList.join('\n');
  const textMode = param?.textMode || 'single';
  const applySet = new Set(param?.applyIndustry || []);
  const validateMin = param?.validateRule?.min ?? 0;
  const decimalPlaces = param?.validateRule?.decimalPlaces ?? param?.decimalPlaces ?? 4;

  // 从行业配置中取已标识的行业选项，按标识分组；fallback 到内置 INDUSTRY_TABLE
  function getIndustryOptionGroups() {
    const pboRows = [];
    const bankRows = [];
    const hasCfg = typeof IndustryConfig !== 'undefined' && IndustryConfig.getRows().length > 0;
    if (hasCfg) {
      IndustryConfig.getRows().forEach(r => {
        const code = r.code || r.cascadeCode || '';
        const name = r.level4Name || r.name || '';
        if (!code) return;
        const label = `${code} ${name}`;
        const isPbo = IndustryConfig.hasTag(r, IndustryConfig.TAG_PBO_EIGHT);
        const isBank = IndustryConfig.hasTag(r, IndustryConfig.TAG_BANK_MAJOR);
        if (isPbo) pboRows.push({ code, label });
        if (isBank) bankRows.push({ code, label });
      });
    }
    if (!pboRows.length && typeof INDUSTRY_TABLE !== 'undefined') {
      INDUSTRY_TABLE.forEach(r => pboRows.push({ code: r.code, label: `${r.code} ${r.name}` }));
    }
    if (!bankRows.length && typeof INDUSTRY_BANK_MAJOR_TABLE !== 'undefined') {
      INDUSTRY_BANK_MAJOR_TABLE.forEach(r => bankRows.push({ code: r.code, label: `${r.code} ${r.name}` }));
    }
    return [
      { groupLabel: '人行八大高碳行业', rows: pboRows },
      { groupLabel: '我行主要行业', rows: bankRows }
    ];
  }
  const industryGroups = getIndustryOptionGroups();
  // 用隐藏字段存已选代码列表（JSON），渲染时兼容旧大类名称
  const industryComboSelected = JSON.stringify([...applySet]);
  const industryMultiSelect = `
    <div id="paramIndustryComboWrap" class="param-units-combo">
      <div id="paramIndustryComboField" class="param-units-combo-field" tabindex="0">
        <div id="paramIndustryTags" class="param-units-tags"></div>
        <input type="text" id="paramIndustryInlineInput" autocomplete="off" placeholder="点击选择行业">
        <span id="paramIndustryDropArrow" class="param-units-drop-arrow">▼</span>
      </div>
      <div id="paramIndustryDropdown" class="param-units-dropdown" style="display:none;max-height:320px;overflow-y:auto">
        <div id="paramIndustryOptions" class="param-units-options"></div>
      </div>
      <input type="hidden" name="applyIndustryCombined" id="applyIndustryCombined" value="${escapeHtml(industryComboSelected)}">
    </div>
    <small class="text-muted">从人行八大高碳行业或我行主要行业中多选，不选表示全行业通用</small>`;

  const selectedUnits = [...new Set(METHOD_CONFIG.getParamUnits(param))];
  const unitMultiSelect = `
    <div id="paramUnitsComboWrap" class="param-units-combo">
      <div id="paramUnitsComboField" class="param-units-combo-field" tabindex="0">
        <div id="paramUnitsTags" class="param-units-tags"></div>
        <input type="text" id="paramUnitsInlineInput" autocomplete="off" placeholder="选择或输入单位，回车添加">
        <span id="paramUnitsDropArrow" class="param-units-drop-arrow">▼</span>
      </div>
      <div id="paramUnitsDropdown" class="param-units-dropdown" style="display:none">
        <div id="paramUnitsOptions" class="param-units-options"></div>
        <div class="param-units-custom-row">
          <input type="text" id="paramUnitsCustomInput" autocomplete="off" placeholder="自定义单位，回车添加">
        </div>
      </div>
      <input type="hidden" name="paramUnitsCombined" id="paramUnitsCombined" value="${escapeHtml(JSON.stringify(selectedUnits))}">
    </div>
    <small class="text-muted">可多选预设单位，也支持自定义录入；至少选择一项</small>`;

  return `
    <h1 class="page-title">${isEdit ? '编辑参数' : '新增参数'}</h1>
    <div class="card"><div class="card-body">
      <form class="form-grid method-config-param-form" id="paramForm">
        <input type="hidden" name="id" value="${escapeHtml(param?.id || '')}">
        <div class="form-item"><label>参数编码</label>
          <input name="paramCode" readonly value="${escapeHtml(param?.paramCode || (isEdit ? '' : '保存后自动生成'))}" placeholder="PARAM_XXXX">
        </div>
        <div class="form-item"><label>参数名称 <span class="req">*</span></label>
          <input name="name" required maxlength="50" value="${escapeHtml(param?.name || '')}" placeholder="如：煤炭消耗量">
        </div>
        <div class="form-item"><label>参数类型 <span class="req">*</span></label>
          <select name="paramType" id="paramTypeSelect" ${isBuiltin ? 'disabled' : ''}>
            ${['数值型', '文本型', '选项型', '日期型', '附件型'].map(t =>
              `<option value="${t}" ${paramType === t ? 'selected' : ''}>${t}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-item"><label>参数分类 <span class="req">*</span></label>
          <select name="category" ${isBuiltin ? 'disabled' : ''}>
            ${METHOD_CONFIG.PARAM_CATEGORIES.filter(c => c !== '结果计算类' || isBuiltin).map(c =>
              `<option value="${c}" ${(param?.category || '活动水平类') === c ? 'selected' : ''}>${c}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-item param-format-panel" data-format-panel="text">
          <label>最大字符长度</label><input type="number" name="maxLength" min="1" max="9999" value="${param?.maxLength ?? 200}">
        </div>

        <div class="form-item param-format-panel" data-format-panel="number">
          <label>小数位数</label><input type="number" name="decimalPlaces" min="0" max="10" value="${decimalPlaces}">
        </div>
        <div class="form-item param-format-panel" data-format-panel="number">
          <label>最小值</label><input type="number" name="validateMin" step="any" value="${validateMin}">
        </div>

        <div class="form-item full param-format-panel" data-format-panel="option">
          <label>枚举值 <span class="req">*</span></label>
          <div id="enumTagsWrap" class="enum-tags-wrap">
            <div id="enumTagsList" class="enum-tags-list">
              ${enumList.map((v, i) => `<span class="enum-tag" data-idx="${i}">${escapeHtml(v)}<button type="button" class="enum-tag-remove" data-idx="${i}" aria-label="删除">×</button></span>`).join('')}
              <input type="text" id="enumTagInput" class="enum-tag-input" autocomplete="off" placeholder="输入选项，按回车或分号添加">
            </div>
          </div>
          <input type="hidden" name="enumValues" id="enumValuesCombined" value="${escapeHtml(enumList.join(';'))}">
          <small class="text-muted">每项按回车或输入分号（；）确认，可拖拽排序</small>
        </div>
        <div class="form-item param-format-panel" data-format-panel="option">
          <label>默认值</label><input name="defaultValue" value="${escapeHtml(param?.defaultValue || '')}">
        </div>

        <div class="form-item full param-units-panel" id="paramUnitsPanel">
          <label>单位 <span class="req">*</span></label>
          ${unitMultiSelect}
        </div>

        <div class="form-item full param-format-panel" data-format-panel="date">
          <p class="method-config-step-hint" style="margin:0">日期型在采集端以日期选择器展示。</p>
        </div>

        <div class="form-item full param-format-panel" data-format-panel="attachment">
          <label>允许格式</label>
          <input name="attachAccept" value="${escapeHtml(param?.attachAccept || '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpeg,.jpg')}" placeholder=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpeg,.jpg">
          <small class="text-muted">逗号分隔扩展名，采集端据此限制上传类型</small>
        </div>
        <div class="form-item param-format-panel" data-format-panel="attachment">
          <label>最多文件数</label>
          <input type="number" name="attachMaxCount" min="1" max="20" value="${param?.attachMaxCount ?? 3}">
        </div>
        <div class="form-item param-format-panel" data-format-panel="attachment">
          <label>单文件上限（MB）</label>
          <input type="number" name="attachMaxMb" min="1" max="2048" value="${param?.attachMaxMb ?? 20}">
        </div>
        <div class="form-item full param-format-panel" data-format-panel="attachment">
          <p class="method-config-step-hint" style="margin:0">附件型在采集端展示为文件上传控件，不参与排放公式计算；可在模板中勾选「必填」要求用户上传佐证材料。</p>
        </div>

        <div class="form-item full"><label>适用行业</label>
          ${industryMultiSelect}
        </div>
      </form>
    </div></div>
    <div class="form-actions">
      <a href="#/method-config/params" class="btn">取消</a>
      <button type="button" class="btn btn-primary" id="paramSaveBtn">保存</button>
    </div>`;
}

SPA_VIEWS['#/method-config/templates'] = function() {
  const q = new URLSearchParams((location.hash.split('?')[1] || ''));
  const filters = {
    keyword: q.get('kw') || '',
    industry: q.get('industry') || '',
    methodId: q.get('method') || '',
    status: q.get('status') || ''
  };
  const templates = METHOD_CONFIG.listTemplates(filters);
  const tableRows = templates.map(t => `
    <tr class="${t.highlight ? 'method-config-highlight-row' : ''}">
      <td>${escapeHtml(t.templateName || METHOD_CONFIG.formatTemplateLabel(t, t.id))}</td>
      <td>${escapeHtml(t.industry)}</td>
      <td>${escapeHtml(t.subCategory || '—')}</td>
      <td>${METHOD_CONFIG.methodLabel(t.methodId)}</td>
      <td>${t.priority ?? '—'}</td>
      <td>${METHOD_CONFIG.templateStatusBadge(t)}</td>
      <td>${escapeHtml(t.updatedBy || '—')}</td>
      <td>${escapeHtml(t.updatedAt || '—')}</td>
      <td class="actions">
        <a href="#/method-config/templates/edit?id=${encodeURIComponent(t.id)}&step=1" class="btn-link">编辑</a>
        <button type="button" class="btn-link" data-tpl-copy="${escapeHtml(t.id)}">复制</button>
        ${t.status === 'published' ? `<button type="button" class="btn-link" data-tpl-toggle="${escapeHtml(t.id)}">${t.enabled === false ? '启用' : '停用'}</button>` : ''}
        ${t.status === 'draft' ? `<button type="button" class="btn-link btn-link-danger" data-tpl-delete="${escapeHtml(t.id)}">删除</button>` : ''}
      </td>
    </tr>`).join('');

  const industryOpts = methodConfigIndustryOptions(filters.industry, true);
  const methodOpts = ['', ...( (GUIDE.METHODS || []).map(m => m.id) )].map(mid =>
    `<option value="${mid}" ${filters.methodId === mid ? 'selected' : ''}>${mid ? METHOD_CONFIG.methodLabel(mid) : '全部方法'}</option>`
  ).join('');
  const statusOpts = [
    ['', '全部状态'],
    ['draft', '草稿'],
    ['published', '已发布'],
    ['disabled', '已停用']
  ].map(([v, l]) => `<option value="${v}" ${filters.status === v ? 'selected' : ''}>${l}</option>`).join('');

  return `
    <h1 class="page-title">模版配置</h1>
    <div class="toolbar">
      <a href="#/method-config/templates/new" class="btn btn-primary">+ 新建模板</a>
    </div>
    <div class="card">
      <div class="card-header"><h3>查询筛选</h3></div>
      <div class="filter-panel method-config-filter-panel">
        <form class="filter-extra method-config-filter-grid method-config-filter-grid--5" id="tplFilterForm">
          <div class="form-item"><label>模板名称</label><input name="kw" value="${escapeHtml(filters.keyword)}" placeholder="模糊搜索"></div>
          <div class="form-item"><label>所属行业</label><select name="industry">${industryOpts}</select></div>
          <div class="form-item"><label>核算方法</label><select name="method">${methodOpts}</select></div>
          <div class="form-item"><label>状态</label><select name="status">${statusOpts}</select></div>
          <div class="form-item filter-actions"><label>&nbsp;</label>
            <div class="filter-action-btns">
              <button type="submit" class="btn btn-primary">查询</button>
              <button type="button" class="btn" id="tplFilterResetBtn">重置</button>
            </div>
          </div>
        </form>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>模板列表</h3></div>
      <div class="card-body table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>模板名称</th><th>所属行业</th><th>细分品类</th><th>核算方法</th><th>方法优先级</th><th>状态</th><th>更新人</th><th>更新时间</th><th>操作</th>
          </tr></thead>
          <tbody>${tableRows || '<tr><td colspan="9" class="text-muted">暂无模板</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
};

SPA_VIEWS['#/method-config/templates/new'] = function() {
  const industryOpts = methodConfigIndustryOptions('', false);
  const sceneChecks = METHOD_CONFIG.APPLY_SCENES.map(s => `
    <label class="checkbox-chip"><input type="checkbox" name="applyScene" value="${s.value}" checked> ${s.label}</label>
  `).join('');

  return `
    <h1 class="page-title">新建核算模板</h1>
    <div class="card"><div class="card-body">
      <form class="form-grid" id="tplCreateForm">
        <div class="form-item full"><label>模板名称 <span class="req">*</span></label>
          <input name="templateName" required maxlength="100" placeholder="行业-细分品类-核算方法，如：建材-平板玻璃-能源法">
        </div>
        <div class="form-item"><label>所属行业 <span class="req">*</span></label>
          <select name="industry" id="tplCreateIndustry" required>${industryOpts}</select>
        </div>
        <div class="form-item"><label>细分品类</label>
          <input name="subCategory" maxlength="50" placeholder="如：水泥、平板玻璃">
        </div>
        <div class="form-item"><label>核算方法 <span class="req">*</span></label>
          ${methodConfigMethodCombo('methodId', '', 'tplCreateMethodDatalist')}
        </div>
        <div class="form-item"><label>方法优先级 <span class="req">*</span></label>
          <input type="number" name="priority" min="1" max="99" value="3">
          <small class="text-muted">决定同一行业下全部核算方法的排列顺序，数字越小排名越靠前</small>
        </div>
        <div class="form-item full"><label>适用场景 <span class="req">*</span></label>
          <div class="checkbox-row">${sceneChecks}</div>
        </div>
        <div class="form-item full"><label>模板描述</label>
          <textarea name="description" rows="3" maxlength="500" placeholder="业务说明"></textarea>
        </div>
      </form>
    </div></div>
    <div class="form-actions">
      <a href="#/method-config/templates" class="btn">取消</a>
      <button type="button" class="btn btn-primary" id="tplCreateBtn">创建并编辑</button>
    </div>`;
};

function renderTemplateBasicInfoTab(detail) {
  const m = detail.meta || {};
  const scenes = new Set(m.applyScene || ['entity']);
  const sceneChecks = METHOD_CONFIG.APPLY_SCENES.map(s => `
    <label class="checkbox-chip"><input type="checkbox" name="applyScene" value="${s.value}" ${scenes.has(s.value) ? 'checked' : ''}> ${s.label}</label>
  `).join('');
  return `<div class="form-grid method-config-meta-form">
    <div class="form-item full"><label>模板名称 <span class="req">*</span></label>
      <input name="meta_templateName" required maxlength="100" value="${escapeHtml(m.templateName || '')}">
    </div>
    <div class="form-item"><label>所属行业 <span class="req">*</span></label>
      <select name="meta_industry" required>${methodConfigIndustryOptions(m.industry, false)}</select>
    </div>
    <div class="form-item"><label>细分品类</label>
      <input name="meta_subCategory" maxlength="50" value="${escapeHtml(m.subCategory || '')}">
    </div>
    <div class="form-item"><label>核算方法 <span class="req">*</span></label>
      ${methodConfigMethodCombo('meta_methodId', m.methodId, 'tplEditMethodDatalist')}
    </div>
    <div class="form-item"><label>方法优先级 <span class="req">*</span></label>
      <input type="number" name="meta_priority" min="1" max="99" value="${m.priority ?? 3}">
      <small class="text-muted">决定同一行业下全部核算方法的排列顺序，数字越小排名越靠前</small>
    </div>
    <div class="form-item full"><label>适用场景 <span class="req">*</span></label>
      <div class="checkbox-row">${sceneChecks}</div>
    </div>
    <div class="form-item full"><label>模板描述</label>
      <textarea name="meta_description" rows="3" maxlength="500" placeholder="业务说明">${escapeHtml(m.description || '')}</textarea>
    </div>
  </div>
  ${m.methodId === 'report' ? '<p class="method-config-step-hint">报告法模板无需配置因子与公式，仅需基础信息与表单结构。</p>' : ''}`;
}

function renderTemplateStructureTab(detail) {
  return MethodConfigEditor.renderStructureTab(detail);
}

function renderFormulaBuilderToolbar(detail) {
  const params = detail.params || [];
  const paramChips = params.length
    ? params.map(p => `<button type="button" class="formula-insert-chip" data-insert="{${escapeHtml(p.id)}}">${escapeHtml(p.name)}</button>`).join('')
    : '<span class="text-muted">请先在「表单结构」Tab 挂载参数</span>';
  const ops = ['+', '-', '*', '/', '(', ')', 'SUM(', ','].map(op =>
    `<button type="button" class="formula-insert-op" data-insert="${escapeHtml(op)}">${escapeHtml(op)}</button>`
  ).join('');
  return `
    <div class="formula-builder-bar">
      <div class="formula-builder-row"><span class="formula-builder-label">参数</span><div class="formula-builder-chips">${paramChips}</div></div>
      <div class="formula-builder-row"><span class="formula-builder-label">运算符</span><div class="formula-builder-ops">${ops}</div></div>
      <p class="text-muted" style="font-size:12px;margin:8px 0 0">保存「表单与核算」Tab 时会自动生成公式；此处可微调表达式。</p>
    </div>`;
}

function renderTemplateFormulaTab(detail) {
  const rows = (detail.formulas || []).map(f => MethodConfigEditor.formulaRowHtml(f)).join('') ||
    MethodConfigEditor.formulaRowHtml({ id: 'F1', sort: 1, name: '总排放合计', isEntityTotal: true });
  return `
    ${renderFormulaBuilderToolbar(detail)}
    <div class="table-wrap" style="margin-top:12px">
      <table class="data-table method-config-formula-edit-table">
        <thead><tr><th>序</th><th>ID</th><th>名称</th><th>表达式</th><th>单位</th><th>活动数据</th><th>标记</th><th></th></tr></thead>
        <tbody id="tplFormulaBody">${rows}</tbody>
      </table>
    </div>
    <div class="toolbar" style="margin-top:12px">
      <button type="button" class="btn btn-sm btn-primary" id="tplGenFormulasBtn">从结构生成分项公式</button>
      <button type="button" class="btn btn-sm" id="tplAddFormulaBtn">+ 添加公式</button>
      <button type="button" class="btn btn-sm" id="formulaValidateBtn">公式校验</button>
    </div>`;
}

function renderTemplateFactorTab(detail) {
  const rows = (detail.factorBindings || []).map(b => MethodConfigEditor.factorCardHtml(b, detail)).join('');
  const isReport = detail.meta?.methodId === 'report';
  const dynamicBlocks = METHOD_CONFIG.ensureDetailLayout(detail).filter(b => b.type === 'dynamic_row');
  const dynamicSummary = dynamicBlocks.map(b => {
    const norm = METHOD_CONFIG.normalizeDynamicBlock(b);
    const ok = !!(norm.varietyParamId && norm.amountParamId && (norm.presetRows || []).length);
    const variety = METHOD_CONFIG.getParam(norm.varietyParamId)?.name || norm.varietyParamId || '—';
    const amount = METHOD_CONFIG.getParam(norm.amountParamId)?.name || norm.amountParamId || '—';
    return `<tr class="${ok ? '' : 'row-warn'}"><td>${escapeHtml(b.title)}</td><td>动态行区块</td><td>${ok ? '<span class="tag tag-success">已配置</span>' : '<span class="tag tag-danger">未完成</span>'}</td><td>${escapeHtml(variety)} / ${escapeHtml(amount)} · ${(norm.presetRows || []).length} 行</td></tr>`;
  }).join('');
  if (isReport) {
    return '<p class="method-config-step-hint">报告法模板无需绑定因子。</p>';
  }
  return `
    <div class="method-config-step-hint" style="margin-bottom:12px">
      固定/下拉绑定已在「表单与核算」Tab 行内配置；此处可查看汇总或做高级调整。
    </div>
    ${dynamicSummary ? `<div class="table-wrap" style="margin-bottom:16px"><table class="data-table"><thead><tr><th>区块名称</th><th>类型</th><th>绑定状态</th><th>因子分类</th></tr></thead><tbody>${dynamicSummary}</tbody></table></div>` : ''}
    <div class="factor-binding-cards" id="tplFactorBody">${rows || '<p class="text-muted">暂无因子配置，请点击「从公式提取」</p>'}</div>
    <div class="toolbar" style="margin-top:12px">
      <button type="button" class="btn btn-sm" id="tplAddFactorBtn">+ 添加因子</button>
      <button type="button" class="btn btn-sm btn-primary" id="tplExtractFactorsBtn">从公式提取因子引用</button>
    </div>`;
}

function renderMethodConfigFormPreview(detail, form) {
  let previewDetail = { ...detail };
  if (form) {
    const structure = METHOD_CONFIG.readPreviewStructure(form);
    previewDetail = { ...detail, layout: structure.layout, params: structure.params };
  } else {
    previewDetail.layout = METHOD_CONFIG.filterLayoutForPreview(
      METHOD_CONFIG.normalizeLayoutBlocks(METHOD_CONFIG.ensureDetailLayout(detail))
    );
  }
  const layout = METHOD_CONFIG.normalizeLayoutBlocks(previewDetail.layout || []);
  if (!layout.length) {
    return '<p class="text-muted">保存排放源或动态行后，将在此预览采集表单</p>';
  }
  return layout.map(sec => renderPreviewPartition(sec, previewDetail)).join('');
}

function renderPreviewFieldLabel(p, fid) {
  const name = escapeHtml(p?.name || fid);
  const unit = p?.unit && p.unit !== '—'
    ? `<span class="preview-field-unit">(${escapeHtml(p.unit)})</span>`
    : '';
  const req = p?.required ? '<span class="req">*</span>' : '';
  return `${req}${name}${unit}`;
}

function renderPreviewFieldControl(p) {
  if (!p) return '<input type="text" disabled class="preview-input" placeholder="请输入">';
  if (METHOD_CONFIG.fieldIsAttachmentType(p)) {
    const accept = p.attachAccept || '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpeg,.jpg';
    const maxCount = p.attachMaxCount ?? 3;
    const maxMb = p.attachMaxMb ?? 20;
    return `<div class="preview-attach-field">
      <button type="button" class="btn btn-sm" disabled>选择文件</button>
      <p class="text-muted preview-attach-meta">支持 ${escapeHtml(accept.replace(/\./g, '').replace(/,/g, '、'))}；最多 ${maxCount} 个，单文件 ≤ ${maxMb}MB</p>
    </div>`;
  }
  if (METHOD_CONFIG.fieldIsOptionType(p)) {
    const opts = (p.enumValues || []).map(v => `<option>${escapeHtml(v)}</option>`).join('');
    return `<select disabled class="preview-input"><option value="">请选择</option>${opts}</select>`;
  }
  if (METHOD_CONFIG.fieldIsNumberType(p)) {
    return '<input type="number" step="any" disabled class="preview-input" placeholder="请输入">';
  }
  return '<input type="text" disabled class="preview-input" placeholder="请输入">';
}

function renderPreviewFixedFields(section, detail) {
  const paramMap = Object.fromEntries((detail?.params || []).map(p => [p.id, p]));
  const blockNorm = { ...section, fields: section.fields || [] };
  const sources = METHOD_CONFIG.ensureEmissionSources(blockNorm);
  const inSource = METHOD_CONFIG.fieldsInEmissionSources(blockNorm);
  const simpleFields = (blockNorm.fields || []).filter(fid => !inSource.has(fid));
  const cells = [];

  simpleFields.forEach(fid => {
    const p = paramMap[fid] || METHOD_CONFIG.getParam(fid);
    cells.push(`<th>${renderPreviewFieldLabel(p, fid)}</th>`);
  });
  sources.forEach(source => {
    (source.fields || []).forEach(fid => {
      const p = paramMap[fid] || METHOD_CONFIG.getParam(fid);
      cells.push(`<th>${renderPreviewFieldLabel(p, fid)}</th>`);
    });
  });

  const inputs = [];
  simpleFields.forEach(fid => {
    const p = paramMap[fid] || METHOD_CONFIG.getParam(fid);
    inputs.push(`<td>${renderPreviewFieldControl(p)}</td>`);
  });
  sources.forEach(source => {
    (source.fields || []).forEach(fid => {
      const p = paramMap[fid] || METHOD_CONFIG.getParam(fid);
      inputs.push(`<td>${renderPreviewFieldControl(p)}</td>`);
    });
  });

  if (!cells.length) return '';
  return `<table class="data-table preview-mini-table preview-partition-fixed-table">
    <thead><tr>${cells.join('')}</tr></thead>
    <tbody><tr>${inputs.join('')}</tr></tbody>
  </table>`;
}

function renderPreviewDynamicSection(section, detail) {
  const blockNorm = METHOD_CONFIG.normalizeDynamicBlock(section);
  const paramMap = Object.fromEntries((detail?.params || []).map(p => [p.id, p]));
  const varietyP = paramMap[blockNorm.varietyParamId] || METHOD_CONFIG.getParam(blockNorm.varietyParamId);
  const amountP = paramMap[blockNorm.amountParamId] || METHOD_CONFIG.getParam(blockNorm.amountParamId);

  return `<div class="preview-partition-section preview-partition-section--dynamic">
    <table class="data-table preview-mini-table preview-dynamic-row-table">
      <thead><tr>
        <th>${renderPreviewFieldLabel(varietyP, blockNorm.varietyParamId)}</th>
        <th>${renderPreviewFieldLabel(amountP, blockNorm.amountParamId)}</th>
        <th class="preview-dynamic-row-actions" aria-label="行操作"></th>
      </tr></thead>
      <tbody>
        <tr>
          <td><select disabled class="preview-input"><option value="">请选择</option></select></td>
          <td><input type="number" step="any" disabled class="preview-input" placeholder="请输入"></td>
          <td class="preview-dynamic-row-actions">
            <button type="button" class="btn btn-sm preview-dynamic-row-add" disabled title="新增一行">+</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>`;
}

function renderPreviewFixedSection(section, detail) {
  const tableHtml = renderPreviewFixedFields(section, detail);
  if (!tableHtml) return '';
  return `<div class="preview-partition-section preview-partition-section--fixed">${tableHtml}</div>`;
}

function renderPreviewPartition(partition, detail) {
  if (partition?.type !== 'partition') {
    return renderPreviewBlockLegacy(partition, detail);
  }
  const title = partition.title || '未命名分区';
  const sectionsHtml = (partition.sections || [])
    .map(s => s.type === 'dynamic_row'
      ? renderPreviewDynamicSection(s, detail)
      : renderPreviewFixedSection(s, detail))
    .filter(Boolean)
    .join('');

  if (!sectionsHtml) {
    return `<div class="method-config-preview-block method-config-preview-partition">
      <h4 class="preview-partition-title">${escapeHtml(title)}</h4>
      <p class="text-muted">暂无字段</p>
    </div>`;
  }

  return `<div class="method-config-preview-block method-config-preview-partition">
    <h4 class="preview-partition-title">${escapeHtml(title)}</h4>
    <div class="preview-partition-sections">${sectionsHtml}</div>
  </div>`;
}

function renderPreviewBlockLegacy(sec, detail) {
  const paramMap = Object.fromEntries((detail?.params || []).map(p => [p.id, p]));
  const type = sec.type === 'dynamic_row' ? 'dynamic_row' : 'fixed';
  if (type === 'dynamic_row') {
    const blockNorm = METHOD_CONFIG.normalizeDynamicBlock(sec);
    const varietyP = METHOD_CONFIG.getParam(blockNorm.varietyParamId);
    const amountP = METHOD_CONFIG.getParam(blockNorm.amountParamId);
    const varietyLabel = varietyP?.name || '品种';
    const amountLabel = amountP?.name || '消耗量';
    const amountUnit = amountP?.unit && amountP.unit !== '—' ? amountP.unit : '';
    const rows = (blockNorm.presetRows || []).length ? blockNorm.presetRows : [{ label: '—' }];
    const tbody = rows.map(r => `
      <tr>
        <td><select disabled class="preview-input"><option>${escapeHtml(r.label || '—')}</option></select></td>
        <td><input disabled class="preview-input" placeholder="请输入"></td>
        ${blockNorm.showUnitCol !== false ? `<td>${escapeHtml(r.unit || amountUnit || '—')}</td>` : ''}
        ${blockNorm.showEmissionCol !== false ? '<td class="text-muted">自动计算</td>' : ''}
      </tr>`).join('');
    return `<div class="method-config-preview-block">
      <h4>${escapeHtml(sec.title)} <span class="tag tag-info">动态行</span></h4>
      <p class="text-muted" style="font-size:12px;margin-bottom:8px">
        ${escapeHtml(varietyLabel)} × ${escapeHtml(amountLabel)}${blockNorm.allowAddRow !== false ? ' · 可新增行' : ''}
      </p>
      <table class="data-table preview-mini-table">
        <thead><tr>
          <th>${escapeHtml(varietyLabel)}</th>
          <th>${escapeHtml(amountLabel)}</th>
          ${blockNorm.showUnitCol !== false ? '<th>单位</th>' : ''}
          ${blockNorm.showEmissionCol !== false ? '<th>排放量</th>' : ''}
        </tr></thead>
        <tbody>${tbody}${blockNorm.allowAddRow !== false ? '<tr><td colspan="4" class="text-muted">采集端可继续新增品种行…</td></tr>' : ''}</tbody>
      </table>
    </div>`;
  }
  return `<div class="method-config-preview-block">
    <h4>${escapeHtml(sec.title)}</h4>
    <div class="form-grid preview-fields">
      ${(sec.fields || []).map(fid => {
        const p = paramMap[fid] || METHOD_CONFIG.getParam(fid);
        return `<div class="form-item">
          <label>${renderPreviewFieldLabel(p, fid)}</label>
          ${renderPreviewFieldControl(p)}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderTemplatePreviewTab(detail) {
  const previewDetail = {
    ...detail,
    layout: METHOD_CONFIG.filterLayoutForPreview(
      METHOD_CONFIG.normalizeLayoutBlocks(METHOD_CONFIG.ensureDetailLayout(detail))
    )
  };
  const validation = METHOD_CONFIG.validateTemplate({ ...detail, layout: previewDetail.layout });
  const checklist = [
    ['基础信息完整性', !!(detail.meta?.templateName && detail.meta?.industry && detail.meta?.methodId)],
    ['表单结构配置', !!(detail.params || []).length],
    ['因子绑定完整性', detail.meta?.methodId === 'report' || !!(detail.factorBindings || []).length],
    ['总排放公式', detail.meta?.methodId === 'report' || (detail.formulas || []).some(f => f.expression && f.isEntityTotal)],
    ['公式语法校验', METHOD_CONFIG.validateFormulas(detail).ok]
  ].map(([label, ok]) =>
    `<li class="${ok ? 'check-ok' : 'check-fail'}">${ok ? '✓' : '✗'} ${label}</li>`
  ).join('');

  const previewSections = renderMethodConfigFormPreview(previewDetail, null);

  return `
    <div class="method-config-preview-layout">
      <div class="card"><div class="card-header"><h3>一键校验</h3></div>
        <div class="card-body">
          <ul class="method-config-checklist">${checklist}</ul>
          ${validation.ok
            ? '<p class="tag tag-success" style="display:inline-block">校验通过，可发布</p>'
            : `<p class="tag tag-danger" style="display:inline-block">校验未通过</p><ul class="text-danger">${validation.errors.map(e => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`}
          <div class="toolbar" style="margin-top:12px">
            <button type="button" class="btn btn-sm" id="tplRunValidateBtn">重新校验</button>
          </div>
        </div>
      </div>
      <div class="card"><div class="card-header"><h3>表单预览</h3></div>
        <div class="card-body method-config-form-preview">${previewSections || '<p class="text-muted">暂无表单结构</p>'}</div>
      </div>
    </div>`;
}

SPA_VIEWS['#/method-config/templates/edit'] = function() {
  const q = new URLSearchParams((location.hash.split('?')[1] || ''));
  const { id, tpl, detail } = METHOD_CONFIG.resolveTemplateForEdit(q);
  const step = METHOD_CONFIG.normalizeTemplateEditStep(q.get('step') || '1');
  const title = detail.meta.templateName || METHOD_CONFIG.formatTemplateLabel(detail.meta, id);

  const steps = [
    { id: '1', label: '基础信息' },
    { id: '2', label: '表单与核算' },
    { id: '3', label: '预览发布' }
  ];

  const stepNav = steps.map(s => {
    const params = new URLSearchParams(q);
    params.set('step', s.id);
    params.set('id', id);
    return `<a href="#/method-config/templates/edit?${params}" class="method-config-step-tab ${step === s.id ? 'active' : ''}">${s.label}</a>`;
  }).join('');

  let body;
  if (step === '2') body = renderTemplateStructureTab(detail);
  else if (step === '3') body = renderTemplatePreviewTab(detail);
  else body = renderTemplateBasicInfoTab(detail);

  const prevStep = String(Math.max(1, Number(step) - 1));
  const nextStep = String(Math.min(3, Number(step) + 1));
  const prevParams = new URLSearchParams(q); prevParams.set('step', prevStep); prevParams.set('id', id);
  const nextParams = new URLSearchParams(q); nextParams.set('step', nextStep); nextParams.set('id', id);
  const previewValidation = step === '3'
    ? METHOD_CONFIG.validateTemplate({
      ...detail,
      layout: METHOD_CONFIG.normalizeLayoutBlocks(METHOD_CONFIG.ensureDetailLayout(detail))
    })
    : null;

  return `
    <div class="method-config-edit-head">
      <div>
        <h1 class="page-title" style="margin-bottom:4px">${escapeHtml(title)}</h1>
        <p class="text-muted" style="margin:0;font-size:13px">
          ${METHOD_CONFIG.templateStatusBadge(tpl)}
        </p>
      </div>
    </div>
    <div class="method-config-step-tabs">${stepNav}</div>
    <form id="tplEditForm">
      <div class="card"><div class="card-body">${body}</div></div>
      <div class="form-actions method-config-edit-actions">
        <a href="#/method-config/templates" class="btn">取消</a>
        ${Number(step) > 1 ? `<a href="#/method-config/templates/edit?${prevParams}" class="btn" id="tplPrevBtn">上一步</a>` : ''}
        ${step === '1' ? '<button type="button" class="btn btn-primary" id="tplSaveDraftBtn">保存草稿</button>' : ''}
        ${Number(step) < 3 ? `<a href="#/method-config/templates/edit?${nextParams}" class="btn btn-primary" id="tplNextBtn">下一步</a>` : ''}
        ${Number(step) === 3 ? `<button type="button" class="btn btn-primary" id="tplPublishBtn" ${previewValidation?.ok ? '' : 'disabled'}>发布模板</button>` : ''}
      </div>
    </form>`;
};

window.renderMethodConfigFormPreview = renderMethodConfigFormPreview;
