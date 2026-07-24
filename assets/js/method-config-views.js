/** 碳核算模板配置中心 — 页面视图（须在 spa-views.js 之后加载） */
if (typeof SPA_VIEWS === 'undefined') {
  console.error('method-config-views.js 必须在 spa-views.js 之后加载');
}

/** 从行业配置取已标识行业，生成带 optgroup 的 option 列表（筛选用） */
function methodConfigIndustryOptions(selected, includeBlank) {
  const groups = typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.getIndustryOptionGroups
    ? METHOD_CONFIG.getIndustryOptionGroups()
    : [];
  const pboRows = groups[0]?.rows?.map(r => ({ value: r.code, label: r.label })) || [];
  const bankRows = groups[1]?.rows?.map(r => ({ value: r.code, label: r.label })) || [];
  const blank = includeBlank !== false ? `<option value="">全部行业</option>` : '';
  const otherAll = typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.INDUSTRY_OTHER_ALL
    ? `<option value="${METHOD_CONFIG.INDUSTRY_OTHER_ALL}" ${selected === METHOD_CONFIG.INDUSTRY_OTHER_ALL ? 'selected' : ''}>${METHOD_CONFIG.INDUSTRY_OTHER_ALL_LABEL}</option>`
    : '';
  const pboGroup = pboRows.length
    ? `<optgroup label="人行八大高碳行业">${pboRows.map(o => `<option value="${escapeHtml(o.value)}" ${o.value === selected ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}</optgroup>`
    : '';
  const bankGroup = bankRows.length
    ? `<optgroup label="我行主要行业">${bankRows.map(o => `<option value="${escapeHtml(o.value)}" ${o.value === selected ? 'selected' : ''}>${escapeHtml(o.label)}</option>`).join('')}</optgroup>`
    : '';
  const allCodes = pboRows.concat(bankRows).map(o => o.value);
  const isLegacy = selected && !allCodes.includes(selected) && selected !== METHOD_CONFIG?.INDUSTRY_OTHER_ALL;
  const legacyOpt = isLegacy ? `<option value="${escapeHtml(selected)}" selected>${escapeHtml(selected)}</option>` : '';
  return blank + otherAll + legacyOpt + pboGroup + bankGroup;
}

/** 模板适用行业多选下拉（含「其他全部行业通用」） */
function renderTemplateIndustryCombo(meta, options = {}) {
  const prefix = options.prefix || 'tplMeta';
  const hiddenName = options.hiddenName || 'meta_industryCombined';
  const selected = typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.normalizeTemplateIndustries
    ? METHOD_CONFIG.normalizeTemplateIndustries(meta || {})
    : (meta?.industries || (meta?.industry ? [meta.industry] : []));
  return renderIndustryCombo({
    prefix,
    hiddenName,
    selected,
    multiple: true,
    includeOtherAll: true,
    placeholder: '点击选择适用行业（可多选）',
    hint: `可多选四级国标行业；选择「${METHOD_CONFIG?.INDUSTRY_OTHER_ALL_LABEL || '其他全部行业通用'}」后，除人行八大高碳与我行主要行业外的行业采集均默认使用本模板。`
  });
}

/** 模板库版本 Tab 当前选中序号（sessionStorage） */
const TEMPLATE_LIST_VERSION_RANK_KEY = 'demo_template_list_version_rank';

function getTemplateListVersionRank() {
  const n = parseInt(sessionStorage.getItem(TEMPLATE_LIST_VERSION_RANK_KEY) || '1', 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

function setTemplateListVersionRank(rank) {
  sessionStorage.setItem(TEMPLATE_LIST_VERSION_RANK_KEY, String(Math.max(1, Number(rank) || 1)));
}

function renderTemplateVersionTabBar(templates, activeRank) {
  const ranks = METHOD_CONFIG.collectTemplateLibraryVersionRanks(templates);
  const latestRank = ranks.length ? ranks[ranks.length - 1] : 1;
  const active = Math.min(Math.max(1, activeRank || 1), ranks.length || 1);
  const tabs = [...ranks].reverse().map(rank => {
    let label = METHOD_CONFIG.formatTemplateLibraryVersionNo(rank);
    if (rank === latestRank) label += '（最新版本）';
    const cls = rank === active ? 'factor-version-tab active' : 'factor-version-tab';
    return `<button type="button" class="${cls}" data-template-version-rank="${rank}" title="${rank === latestRank ? '最新版本' : ''}">${escapeHtml(label)}</button>`;
  }).join('');
  return `
    <div class="factor-version-tabs" role="tablist" aria-label="模板版本">
      ${tabs}
      <button type="button" class="factor-version-tab-add" id="templateVersionTabAdd" title="新增版本">+</button>
    </div>`;
}

function getTemplateVersionCopyCount(templates, sourceRank) {
  const all = templates || METHOD_CONFIG.templates || [];
  return METHOD_CONFIG.applyTemplateListVersionRank(
    METHOD_CONFIG.groupTemplateRecords(all),
    sourceRank
  ).length;
}

function renderTemplateVersionCopyHint(sourceRank, nextRank, copyCount) {
  const sourceLabel = METHOD_CONFIG.formatTemplateLibraryVersionNo(sourceRank);
  const nextLabel = METHOD_CONFIG.formatTemplateLibraryVersionNo(nextRank);
  if (!copyCount) {
    return `<p class="candidate-filter-hint" style="margin:8px 0 0">所选${escapeHtml(sourceLabel)}暂无可复制的模板。</p>`;
  }
  return `<p class="candidate-filter-hint" style="margin:8px 0 0">将从${escapeHtml(sourceLabel)}全量复制 ${copyCount} 套模板至${escapeHtml(nextLabel)}（新建为草稿）。</p>`;
}

function openTemplateVersionAddDialog(templates) {
  if (typeof ensureConfirmDialog !== 'function') return Promise.resolve({ ok: false });
  ensureConfirmDialog();
  const all = templates || METHOD_CONFIG.templates || [];
  const ranks = METHOD_CONFIG.collectTemplateLibraryVersionRanks(all);
  const nextRank = ranks.length + 1;
  const latestRank = ranks[ranks.length - 1] || 1;
  const defaultSourceRank = latestRank;
  const nextLabel = METHOD_CONFIG.formatTemplateLibraryVersionNo(nextRank);
  const initialCount = getTemplateVersionCopyCount(all, defaultSourceRank);
  const sourceOptions = [...ranks].reverse().map(rank => {
    let label = METHOD_CONFIG.formatTemplateLibraryVersionNo(rank);
    if (rank === latestRank) label += '（最新版本）';
    return `<option value="${rank}"${rank === defaultSourceRank ? ' selected' : ''}>${escapeHtml(label)}</option>`;
  }).join('');

  const overlay = qs('#confirmDialog');
  const titleEl = qs('#confirmDialogTitle');
  const msgEl = qs('#confirmDialogMessage');
  const detailEl = qs('#confirmDialogDetail');
  const okBtn = qs('#confirmDialogOk');
  const cancelBtn = qs('#confirmDialogCancel');
  const closeBtn = qs('#confirmDialogClose');

  titleEl.textContent = '提示';
  msgEl.textContent = `是否确认新增模板版本${nextLabel}？`;
  detailEl.innerHTML = `
    <div class="factor-version-add-dialog">
      <div class="factor-version-add-copy-panel" id="templateVersionCopyPanel">
        <div class="factor-version-add-copy-label">选择复制来源版本</div>
        <select class="template-version-source-select" id="templateVersionSourceSelect" name="templateVersionSourceRank">${sourceOptions}</select>
        <div id="templateVersionCopyHint">${renderTemplateVersionCopyHint(defaultSourceRank, nextRank, initialCount)}</div>
      </div>
    </div>`;
  detailEl.hidden = false;
  okBtn.textContent = '确认';
  cancelBtn.textContent = '取消';
  okBtn.classList.remove('btn-confirm-danger');
  okBtn.classList.add('btn-primary');
  okBtn.disabled = !initialCount;

  const sourceSelect = qs('#templateVersionSourceSelect', detailEl);
  const hintEl = qs('#templateVersionCopyHint', detailEl);
  const syncHint = () => {
    const sourceRank = Number(sourceSelect?.value) || defaultSourceRank;
    const count = getTemplateVersionCopyCount(all, sourceRank);
    if (hintEl) hintEl.innerHTML = renderTemplateVersionCopyHint(sourceRank, nextRank, count);
    okBtn.disabled = !count;
  };

  return new Promise(resolve => {
    const finish = (result) => {
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onOverlay);
      document.removeEventListener('keydown', onKey);
      sourceSelect?.removeEventListener('change', syncHint);
      okBtn.disabled = false;
      hideModal('confirmDialog');
      resolve(result);
    };
    const onOk = () => {
      const sourceRank = Number(sourceSelect?.value) || defaultSourceRank;
      const count = getTemplateVersionCopyCount(all, sourceRank);
      if (!count) {
        if (typeof toast === 'function') toast('所选版本暂无可复制的模板', 'warning');
        return;
      }
      finish({ ok: true, mode: 'copy', nextRank, sourceRank, nextLabel });
    };
    const onCancel = () => finish({ ok: false });
    const onOverlay = (e) => { if (e.target === overlay) onCancel(); };
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onOverlay);
    document.addEventListener('keydown', onKey);
    sourceSelect?.addEventListener('change', syncHint);
    showModal('confirmDialog');
    setTimeout(() => okBtn.focus(), 0);
  });
}

function resolveTaskTemplateVersionRank(value) {
  return typeof METHOD_CONFIG !== 'undefined'
    ? METHOD_CONFIG.resolveTaskTemplateVersionRank(value)
    : (Number(value) || 1);
}

function renderTaskTemplateVersionField(name, selectedRank, options = {}) {
  const { readonly = false, required = true } = options;
  const opts = METHOD_CONFIG.getTemplateLibraryVersionSelectOptions();
  const latestRank = opts[opts.length - 1]?.rank || 1;
  const selected = METHOD_CONFIG.resolveTaskTemplateVersionRank(selectedRank ?? latestRank);
  if (readonly) {
    return `<input readonly value="${escapeHtml(METHOD_CONFIG.formatTaskTemplateVersionDisplay(selected))}">`;
  }
  const optionsHtml = opts.map(o =>
    `<option value="${o.rank}"${o.rank === selected ? ' selected' : ''}>${escapeHtml(o.label)}</option>`
  ).join('');
  return `<select name="${escapeHtml(name)}" ${required ? 'required' : ''}>${optionsHtml}</select>`;
}

/** 模板因子版本下拉（选项与排放因子库版本 Tab 一致） */
function renderTemplateFactorVersionSelect(name, selectedRank) {
  const opts = typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.getFactorLibraryVersionOptions
    ? METHOD_CONFIG.getFactorLibraryVersionOptions()
    : [{ rank: 1, label: 'v1.0' }];
  const latestRank = opts.length ? opts[opts.length - 1].rank : 1;
  const selected = typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.resolveTemplateFactorVersionRank
    ? METHOD_CONFIG.resolveTemplateFactorVersionRank(selectedRank ?? latestRank)
    : Math.max(1, Number(selectedRank) || latestRank);
  const optionsHtml = opts.map(o => {
    let label = o.label;
    if (o.rank === latestRank) label += '（最新版本）';
    return `<option value="${o.rank}"${o.rank === selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;
  }).join('');
  return `<select name="${escapeHtml(name)}" required>${optionsHtml}</select>`;
}

function renderMethodCollectHintElement(methodId) {
  const hint = METHOD_CONFIG.getMethodCollectHint(methodId);
  const hidden = hint ? '' : ' hidden';
  const inner = hint
    ? `<strong>${escapeHtml(hint.title)}</strong><p>${escapeHtml(hint.text)}</p>`
    : '';
  return `<div class="method-config-method-collect-hint" data-method-collect-hint${hidden}>${inner}</div>`;
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
    <ul class="text-muted method-config-param-category-legend">
      ${METHOD_CONFIG.PARAM_CATEGORIES.map(c =>
        `<li><strong>${c}</strong>：${METHOD_CONFIG.PARAM_CATEGORY_HINTS[c]}</li>`
      ).join('')}
    </ul>`;
};

SPA_VIEWS['#/method-config/params/new'] = function() {
  return renderMethodConfigParamForm(null);
};

SPA_VIEWS['#/method-config/params/edit'] = function() {
  const id = new URLSearchParams((location.hash.split('?')[1] || '')).get('id');
  const param = METHOD_CONFIG.getParam(id);
  return renderMethodConfigParamForm(param);
};

function renderParamCategoryFormLabel() {
  const tipList = METHOD_CONFIG.PARAM_CATEGORIES.map(c =>
    `<li><strong>${escapeHtml(c)}</strong>：${METHOD_CONFIG.PARAM_CATEGORY_HINTS[c]}</li>`
  ).join('');
  return renderFormLabel('参数分类', {
    required: true,
    tipContent: `<ul class="field-tip-list">${tipList}</ul>`,
    tipAria: '参数分类说明'
  });
}

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
  const industryMultiSelect = renderIndustryCombo({
    prefix: 'param',
    hiddenName: 'applyIndustryCombined',
    selected: applySet,
    multiple: true,
    placeholder: '点击选择行业',
    hint: '从人行八大高碳行业或我行主要行业中多选，不选表示全行业通用'
  });

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
        <div class="form-item"><label class="field-label">参数编码</label>
          <input name="paramCode" readonly value="${escapeHtml(param?.paramCode || (isEdit ? '' : '保存后自动生成'))}" placeholder="PARAM_XXXX">
        </div>
        <div class="form-item">${renderFormLabel('参数名称', { required: true })}
          <input name="name" required maxlength="50" value="${escapeHtml(param?.name || '')}" placeholder="如：煤炭消耗量">
        </div>
        <div class="form-item">${renderFormLabel('参数类型', { required: true })}
          <select name="paramType" id="paramTypeSelect" ${isBuiltin ? 'disabled' : ''}>
            ${['数值型', '文本型', '选项型', '日期型', '附件型'].map(t =>
              `<option value="${t}" ${paramType === t ? 'selected' : ''}>${t}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-item">${renderParamCategoryFormLabel()}
          <select name="category" ${isBuiltin ? 'disabled' : ''}>
            ${METHOD_CONFIG.PARAM_CATEGORIES.map(c => {
              const isResult = c === '结果计算类';
              const disabled = isResult && !isBuiltin;
              const selected = (param?.category || '活动水平类') === c;
              const label = isResult && !isBuiltin ? `${c}（系统内置，不可新建）` : c;
              return `<option value="${c}" ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}>${label}</option>`;
            }).join('')}
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
          ${renderFormLabel('枚举值', { required: true })}
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
          ${renderFormLabel('单位', { required: true })}
          ${unitMultiSelect}
        </div>

        <div class="form-item full param-format-panel" data-format-panel="date">
          <p class="method-config-step-hint" style="margin:0">日期型在采集端以日期选择器展示。</p>
        </div>

        <div class="form-item full param-format-panel" data-format-panel="attachment">
          <p class="method-config-step-hint" style="margin:0 0 8px"><strong>附件上传限制</strong>（参数类型为「附件型」时生效，模板预览与数据采集按此处配置展示）</p>
        </div>
        <div class="form-item full param-format-panel" data-format-panel="attachment">
          <label>允许格式</label>
          <input name="attachAccept" value="${escapeHtml(param?.attachAccept || METHOD_CONFIG.DEFAULT_ATTACH_ACCEPT)}" placeholder="${METHOD_CONFIG.DEFAULT_ATTACH_ACCEPT}">
          <small class="text-muted">逗号分隔扩展名，采集端据此限制上传类型</small>
        </div>
        <div class="form-item param-format-panel" data-format-panel="attachment">
          <label>最多文件数</label>
          <input type="number" name="attachMaxCount" min="1" max="20" value="${param?.attachMaxCount ?? METHOD_CONFIG.DEFAULT_ATTACH_MAX_COUNT}">
        </div>
        <div class="form-item param-format-panel" data-format-panel="attachment">
          <label>单文件上限（MB）</label>
          <input type="number" name="attachMaxMb" min="1" max="2048" value="${param?.attachMaxMb ?? METHOD_CONFIG.DEFAULT_ATTACH_MAX_MB}">
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
  const versionRanks = METHOD_CONFIG.collectTemplateLibraryVersionRanks(METHOD_CONFIG.templates);
  let activeRank = Math.min(getTemplateListVersionRank(), versionRanks.length || 1);
  if (activeRank !== getTemplateListVersionRank()) setTemplateListVersionRank(activeRank);
  const filtered = METHOD_CONFIG.listTemplates(filters);
  const versionGroups = METHOD_CONFIG.groupTemplateRecords(filtered);
  const templates = METHOD_CONFIG.applyTemplateListVersionRank(versionGroups, activeRank);
  const renderTemplateActions = t => {
    const viewLink = `<a href="#/method-config/templates/edit?id=${encodeURIComponent(t.id)}&step=1&mode=view" class="btn-link">查看</a>`;
    return [
      `<a href="#/method-config/templates/edit?id=${encodeURIComponent(t.id)}&step=1" class="btn-link">编辑</a>`,
      `<button type="button" class="btn-link" data-tpl-copy="${escapeHtml(t.id)}">复制</button>`,
      `<button type="button" class="btn-link btn-link-danger" data-tpl-delete="${escapeHtml(t.id)}">删除</button>`,
      viewLink
    ].join('');
  };
  const tableRows = templates.map(t => `
    <tr class="${t.highlight ? 'method-config-highlight-row' : ''}">
      <td>${escapeHtml(t.templateName || METHOD_CONFIG.formatTemplateLabel(t, t.id))}</td>
      <td>${escapeHtml(METHOD_CONFIG.formatTemplateIndustriesDisplay(t))}</td>
      <td>${escapeHtml(t.subCategory || '—')}</td>
      <td>${METHOD_CONFIG.methodLabel(t.methodId)}</td>
      <td>${t.priority ?? '—'}</td>
      <td>${METHOD_CONFIG.templateStatusBadge(t)}</td>
      <td>${escapeHtml(t.updatedBy || '—')}</td>
      <td>${escapeHtml(t.updatedAt || '—')}</td>
      <td class="actions">${renderTemplateActions(t)}</td>
    </tr>`).join('');

  const industryOpts = methodConfigIndustryOptions(filters.industry, true);
  const methodOpts = ['', ...( (GUIDE.METHODS || []).map(m => m.id) )].map(mid =>
    `<option value="${mid}" ${filters.methodId === mid ? 'selected' : ''}>${mid ? METHOD_CONFIG.methodLabel(mid) : '全部方法'}</option>`
  ).join('');
  const statusOpts = [
    ['', '全部状态'],
    ['draft', '草稿'],
    ['published', '已发布']
  ].map(([v, l]) => `<option value="${v}" ${filters.status === v ? 'selected' : ''}>${l}</option>`).join('');

  return `
    <h1 class="page-title">模版配置</h1>
    <div class="card factor-library-card">
      ${renderTemplateVersionTabBar(METHOD_CONFIG.templates, activeRank)}
      <div class="factor-library-main" style="padding:0 16px 16px">
        <div class="factor-library-main-toolbar">
          <div class="factor-library-version-ops">
            <a href="#/method-config/templates/new" class="btn btn-primary">+ 新建模板</a>
          </div>
        </div>
    <div class="card" style="margin-top:12px">
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
          <tbody>${tableRows || '<tr><td colspan="9" class="text-muted">当前版本暂无模板</td></tr>'}</tbody>
        </table>
      </div>
    </div>
      </div>
    </div>`;
};

SPA_VIEWS['#/method-config/templates/new'] = function() {
  const sceneChecks = METHOD_CONFIG.APPLY_SCENES.map(s => `
    <label class="checkbox-chip"><input type="checkbox" name="applyScene" value="${s.value}" checked> ${s.label}</label>
  `).join('');

  return `
    <h1 class="page-title">新建核算模板</h1>
    <div class="card"><div class="card-body">
      <form class="form-grid" id="tplCreateForm">
        <div class="form-item full">${renderFormLabel('模板名称', { required: true })}
          <input name="templateName" required maxlength="100" placeholder="行业-细分品类-核算方法，如：建材-平板玻璃-能源法">
        </div>
        <div class="form-item">${renderFormLabel('所属行业', { required: true })}
          ${renderTemplateIndustryCombo({}, { prefix: 'tplCreate', hiddenName: 'industryCombined' })}
        </div>
        <div class="form-item"><label class="field-label"><span class="field-label-text">细分品类</span></label>
          <input name="subCategory" maxlength="50" placeholder="如：水泥、平板玻璃">
        </div>
        <div class="form-item full">${renderFormLabel('核算方法', { required: true })}
          ${methodConfigMethodCombo('methodId', '', 'tplCreateMethodDatalist')}
          ${renderMethodCollectHintElement('')}
        </div>
        <div class="form-item">${renderFormLabel('因子版本', { required: true })}
          ${renderTemplateFactorVersionSelect('factorVersionRank', METHOD_CONFIG.getDefaultFactorVersionRank())}
          <small class="text-muted">匹配排放因子时仅展示该版本因子库数据</small>
        </div>
        <div class="form-item">${renderFormLabel('方法优先级', { required: true })}
          <input type="number" name="priority" min="1" max="99" value="3">
          <small class="text-muted">决定同一行业下全部核算方法的排列顺序，数字越小排名越靠前</small>
        </div>
        <div class="form-item full">${renderFormLabel('适用场景', { required: true })}
          <div class="checkbox-row">${sceneChecks}</div>
        </div>
        <div class="form-item full"><label class="field-label"><span class="field-label-text">模板描述</span></label>
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
    <div class="form-item full">${renderFormLabel('模板名称', { required: true })}
      <input name="meta_templateName" required maxlength="100" value="${escapeHtml(m.templateName || '')}">
    </div>
    <div class="form-item">${renderFormLabel('所属行业', { required: true })}
      ${renderTemplateIndustryCombo(m, { prefix: 'tplMeta', hiddenName: 'meta_industryCombined' })}
    </div>
    <div class="form-item"><label class="field-label"><span class="field-label-text">细分品类</span></label>
      <input name="meta_subCategory" maxlength="50" value="${escapeHtml(m.subCategory || '')}">
    </div>
    <div class="form-item full">${renderFormLabel('核算方法', { required: true })}
      ${methodConfigMethodCombo('meta_methodId', m.methodId, 'tplEditMethodDatalist')}
      ${renderMethodCollectHintElement(m.methodId)}
    </div>
    <div class="form-item">${renderFormLabel('因子版本', { required: true })}
      ${renderTemplateFactorVersionSelect('meta_factorVersionRank', m.factorVersionRank)}
      <small class="text-muted">匹配排放因子时仅展示该版本因子库数据</small>
    </div>
    <div class="form-item">${renderFormLabel('方法优先级', { required: true })}
      <input type="number" name="meta_priority" min="1" max="99" value="${m.priority ?? 3}">
      <small class="text-muted">决定同一行业下全部核算方法的排列顺序，数字越小排名越靠前</small>
    </div>
    <div class="form-item full">${renderFormLabel('适用场景', { required: true })}
      <div class="checkbox-row">${sceneChecks}</div>
    </div>
    <div class="form-item full"><label class="field-label"><span class="field-label-text">模板描述</span></label>
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
  const units = typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.getParamUnits
    ? METHOD_CONFIG.getParamUnits(p)
    : [];
  const hasMultiUnit = units.length > 1;
  const unit = !hasMultiUnit && p?.unit && p.unit !== '—' && p.unit !== '无单位'
    ? `（${escapeHtml(units[0] || p.unit)}）`
    : '';
  const req = p?.required ? renderRequiredDot() : '';
  return `${req}<span class="field-label-text">${name}${unit}</span>`;
}

function renderPreviewUnitSelect(p) {
  const units = typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.getParamUnits
    ? METHOD_CONFIG.getParamUnits(p)
    : [];
  if (units.length <= 1) return '';
  const opts = units.map((u, i) =>
    `<option${i === 0 ? ' selected' : ''}>${escapeHtml(u)}</option>`
  ).join('');
  return `<select disabled class="preview-unit-select" title="采集时可选择单位">${opts}</select>`;
}

function renderPreviewFieldControl(p) {
  if (!p) return '<input type="text" disabled placeholder="请输入">';
  if (METHOD_CONFIG.fieldIsAttachmentType(p)) {
    return `<div class="preview-attach-field">
      <button type="button" class="btn btn-sm" disabled>选择文件</button>
      <p class="text-muted preview-attach-meta">${escapeHtml(METHOD_CONFIG.formatAttachMetaText(p))}</p>
    </div>`;
  }
  if (METHOD_CONFIG.fieldIsOptionType(p)) {
    const opts = (p.enumValues || []).map(v => `<option>${escapeHtml(v)}</option>`).join('');
    return `<select disabled><option value="">请选择</option>${opts}</select>`;
  }
  if (METHOD_CONFIG.fieldIsNumberType(p)) {
    const input = '<input type="number" step="any" disabled placeholder="请输入">';
    const unitSelect = renderPreviewUnitSelect(p);
    if (unitSelect) {
      return `<div class="preview-input-unit-wrap">${input}${unitSelect}</div>`;
    }
    return input;
  }
  return '<input type="text" disabled placeholder="请输入">';
}

function renderPreviewLabelWrapper(p, fid) {
  const reqCls = p?.required ? ' field-label--required' : '';
  return `<label class="field-label${reqCls}">${renderPreviewFieldLabel(p, fid)}</label>`;
}

function renderPreviewFormItem(p, fid) {
  return `<div class="form-item">
    ${renderPreviewLabelWrapper(p, fid)}
    ${renderPreviewFieldControl(p)}
  </div>`;
}

function renderPreviewFixedFields(section, detail) {
  const paramMap = Object.fromEntries((detail?.params || []).map(p => [p.id, p]));
  const blockNorm = { ...section, fields: section.fields || [] };
  const sources = METHOD_CONFIG.ensureEmissionSources(blockNorm);
  const inSource = METHOD_CONFIG.fieldsInEmissionSources(blockNorm);
  const simpleFields = (blockNorm.fields || []).filter(fid => !inSource.has(fid));
  const fieldIds = [];
  simpleFields.forEach(fid => fieldIds.push(fid));
  sources.forEach(source => (source.fields || []).forEach(fid => fieldIds.push(fid)));
  if (!fieldIds.length) return '';
  const gridClass = fieldIds.length >= 3 ? 'form-grid form-grid-3' : 'form-grid';
  const items = fieldIds.map(fid => {
    const p = paramMap[fid] || METHOD_CONFIG.getParam(fid);
    return renderPreviewFormItem(p, fid);
  }).join('');
  return `<div class="${gridClass} preview-collect-grid">${items}</div>`;
}

function renderPreviewDynamicSection(section, detail) {
  const blockNorm = METHOD_CONFIG.normalizeDynamicBlock(section);
  const paramMap = Object.fromEntries((detail?.params || []).map(p => [p.id, p]));
  const varietyP = paramMap[blockNorm.varietyParamId] || METHOD_CONFIG.getParam(blockNorm.varietyParamId);
  const amountP = paramMap[blockNorm.amountParamId] || METHOD_CONFIG.getParam(blockNorm.amountParamId);

  return `<div class="preview-partition-section preview-partition-section--dynamic">
    <div class="form-grid form-grid-2 preview-collect-grid preview-dynamic-grid">
      <div class="form-item">
        ${renderPreviewLabelWrapper(varietyP, blockNorm.varietyParamId)}
        <select disabled><option value="">请选择</option></select>
      </div>
      <div class="form-item">
        ${renderPreviewLabelWrapper(amountP, blockNorm.amountParamId)}
        ${renderPreviewFieldControl(amountP)}
      </div>
    </div>
    <div class="preview-dynamic-add-hint">
      <button type="button" class="btn btn-sm preview-dynamic-row-add" disabled title="新增一行">+ 新增一行</button>
    </div>
  </div>`;
}

function renderPreviewFixedSection(section, detail) {
  const gridHtml = renderPreviewFixedFields(section, detail);
  if (!gridHtml) return '';
  return `<div class="preview-partition-section preview-partition-section--fixed">${gridHtml}</div>`;
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
    return `<div class="method-config-preview-partition">
      <div class="form-section-title">${escapeHtml(title)}</div>
      <p class="text-muted">暂无字段</p>
    </div>`;
  }

  return `<div class="method-config-preview-partition">
    <div class="form-section-title">${escapeHtml(title)}</div>
    ${sectionsHtml}
  </div>`;
}

function renderPreviewBlockLegacy(sec, detail) {
  const paramMap = Object.fromEntries((detail?.params || []).map(p => [p.id, p]));
  const type = sec.type === 'dynamic_row' ? 'dynamic_row' : 'fixed';
  if (type === 'dynamic_row') {
    const blockNorm = METHOD_CONFIG.normalizeDynamicBlock(sec);
    const varietyP = METHOD_CONFIG.getParam(blockNorm.varietyParamId);
    const amountP = METHOD_CONFIG.getParam(blockNorm.amountParamId);
    const rows = (blockNorm.presetRows || []).length ? blockNorm.presetRows : [{ label: '—' }];
    const rowItems = rows.map(r => `
      <div class="form-grid form-grid-2 preview-collect-grid preview-dynamic-grid">
        <div class="form-item">
          ${renderPreviewLabelWrapper(varietyP, blockNorm.varietyParamId)}
          <select disabled><option>${escapeHtml(r.label || '—')}</option></select>
        </div>
        <div class="form-item">
          ${renderPreviewLabelWrapper(amountP, blockNorm.amountParamId)}
          <input type="number" step="any" disabled placeholder="请输入">
        </div>
      </div>`).join('');
    return `<div class="method-config-preview-block">
      <div class="form-section-title">${escapeHtml(sec.title)} <span class="tag tag-info">动态行</span></div>
      ${rowItems}
      ${blockNorm.allowAddRow !== false ? '<p class="text-muted preview-dynamic-add-hint" style="font-size:12px">采集端可继续新增品种行…</p>' : ''}
    </div>`;
  }
  return `<div class="method-config-preview-block">
    <div class="form-section-title">${escapeHtml(sec.title)}</div>
    <div class="form-grid preview-collect-grid">
      ${(sec.fields || []).map(fid => {
        const p = paramMap[fid] || METHOD_CONFIG.getParam(fid);
        return renderPreviewFormItem(p, fid);
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
    ['基础信息完整性', !!(detail.meta?.templateName && METHOD_CONFIG.normalizeTemplateIndustries(detail.meta).length && detail.meta?.methodId)],
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
        <div class="card-body method-config-form-preview collect-form-preview">${previewSections || '<p class="text-muted">暂无表单结构</p>'}</div>
      </div>
    </div>`;
}

SPA_VIEWS['#/method-config/templates/edit'] = function() {
  const q = new URLSearchParams((location.hash.split('?')[1] || ''));
  const isView = q.get('mode') === 'view';
  const { id, tpl, detail } = METHOD_CONFIG.resolveTemplateForEdit(q);
  const step = METHOD_CONFIG.normalizeTemplateEditStep(q.get('step') || '1');
  const title = detail.meta.templateName || METHOD_CONFIG.formatTemplateLabel(detail.meta, id);
  const pageHeading = isView ? '查看核算模板' : '编辑核算模板';
  const publishedHint = !isView && tpl?.status === 'published'
    ? `<p class="method-config-published-hint">已发布模板修改后需重新发布方对新数据采集生效；历史数据采集仍绑定原发布版本，不受影响。</p>`
    : '';
  const viewHint = isView
    ? `<p class="method-config-view-hint">当前为只读查看模式，不可修改配置。</p>`
    : '';

  const steps = [
    { id: '1', label: '基础信息' },
    { id: '2', label: '表单与核算' },
    { id: '3', label: '预览发布' }
  ];

  const stepNav = steps.map(s => {
    const params = new URLSearchParams(q);
    params.set('step', s.id);
    params.set('id', id);
    if (isView) params.set('mode', 'view');
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
  if (isView) {
    prevParams.set('mode', 'view');
    nextParams.set('mode', 'view');
  }
  const previewValidation = step === '3' && !isView
    ? METHOD_CONFIG.validateTemplate({
      ...detail,
      layout: METHOD_CONFIG.normalizeLayoutBlocks(METHOD_CONFIG.ensureDetailLayout(detail))
    })
    : null;

  const formActions = isView
    ? `<div class="form-actions method-config-edit-actions">
        <a href="#/method-config/templates" class="btn btn-primary">返回列表</a>
        ${Number(step) > 1 ? `<a href="#/method-config/templates/edit?${prevParams}" class="btn" id="tplPrevBtn">上一步</a>` : ''}
        ${Number(step) < 3 ? `<a href="#/method-config/templates/edit?${nextParams}" class="btn btn-primary" id="tplNextBtn">下一步</a>` : ''}
      </div>`
    : `<div class="form-actions method-config-edit-actions">
        <a href="#/method-config/templates" class="btn">取消</a>
        ${Number(step) > 1 ? `<a href="#/method-config/templates/edit?${prevParams}" class="btn" id="tplPrevBtn">上一步</a>` : ''}
        ${step === '1' ? '<button type="button" class="btn btn-primary" id="tplSaveDraftBtn">保存草稿</button>' : ''}
        ${Number(step) < 3 ? `<a href="#/method-config/templates/edit?${nextParams}" class="btn btn-primary" id="tplNextBtn">下一步</a>` : ''}
        ${Number(step) === 3 ? `<button type="button" class="btn btn-primary" id="tplPublishBtn" ${previewValidation?.ok ? '' : 'disabled'}>发布模板</button>` : ''}
      </div>`;

  return `
    <div class="method-config-edit-head">
      <div>
        <h1 class="page-title" style="margin-bottom:4px">${escapeHtml(pageHeading)} · ${escapeHtml(title)}</h1>
        <p class="text-muted" style="margin:0;font-size:13px">
          ${METHOD_CONFIG.templateStatusBadge(tpl)}
        </p>
        ${publishedHint}
        ${viewHint}
      </div>
    </div>
    <div class="method-config-step-tabs">${stepNav}</div>
    <form id="tplEditForm"${isView ? ' class="method-config-view-form"' : ''}>
      <input type="hidden" name="tpl_factor_version_rank" value="${METHOD_CONFIG.resolveTemplateFactorVersionRank(detail.meta?.factorVersionRank)}">
      <div class="card">
        <div class="card-body${step === '2' && detail.meta?.methodId !== 'report' ? ' method-config-step2-card-body' : ''}">
          ${!isView && step === '2' && detail.meta?.methodId !== 'report' ? `
            <div class="method-config-factor-version-toolbar">
              <button type="button" class="btn btn-sm" id="tplUpdateAllFactorVersionsBtn">一键更新全部因子版本</button>
            </div>` : ''}
          ${body}
        </div>
      </div>
      ${formActions}
    </form>`;
};

window.renderMethodConfigFormPreview = renderMethodConfigFormPreview;
