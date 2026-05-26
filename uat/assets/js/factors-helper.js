/** 排放因子库：筛选、展示、表单辅助 */
const FACTOR_FILTER_KEY = 'factor_library_filters';
const FACTOR_METHOD_TABS = [
  { id: 'energy', label: '能源法' },
  { id: 'product', label: '产品法' },
  { id: 'economy', label: '经济活动法' }
];
const FACTOR_ENERGY_CATEGORIES = ['固体燃料', '液体燃料', '气体燃料', '购入电力', '购入热力', '脱硫试剂', '工艺排放', '其他'];
const FACTORS_GUIDE_VERSION = 'guide-2026-annex2';

function getFactorFilters() {
  try {
    return normalizeFactorFilters(JSON.parse(sessionStorage.getItem(FACTOR_FILTER_KEY) || '{}'));
  } catch {
    return normalizeFactorFilters({});
  }
}

function normalizeFactorFilters(raw) {
  const f = { ...(raw || {}) };
  if (f.methodId && !f.methodIds?.length) f.methodIds = [f.methodId];
  if (f.industryMajor && !f.industries?.length) f.industries = [f.industryMajor];
  if (f.source && !f.sources?.length) f.sources = [f.source];
  return {
    methodIds: Array.isArray(f.methodIds) ? f.methodIds : [],
    industries: Array.isArray(f.industries) ? f.industries : [],
    sources: Array.isArray(f.sources) ? f.sources : [],
    keyword: f.keyword || ''
  };
}

function isFactorFilterChecked(selected, value) {
  if (!selected?.length) return true;
  return selected.includes(value);
}

function factorMethodLabel(methodId) {
  return FACTOR_METHOD_TABS.find(t => t.id === methodId)?.label || methodId;
}

function factorItemDetailLabel(f) {
  if (!f) return '-';
  if (f.methodId === 'energy') {
    const parts = [f.energyCategory, f.itemName].filter(Boolean);
    if (f.subIndustry) parts.push(f.subIndustry);
    return parts.join(' · ') || '-';
  }
  if (f.methodId === 'product') {
    return [f.productMajor, f.productSub].filter(Boolean).join(' · ') || '-';
  }
  return [f.gbCode, f.gbIndustryName].filter(Boolean).join(' ') || '-';
}

function saveFactorFilters(filters) {
  sessionStorage.setItem(FACTOR_FILTER_KEY, JSON.stringify(filters || {}));
}

function factorDisplayName(f) {
  if (!f) return '-';
  if (f.methodId === 'energy') {
    return [f.energyCategory, f.itemName].filter(Boolean).join(' · ');
  }
  if (f.methodId === 'product') {
    return [f.productMajor, f.productSub].filter(Boolean).join(' · ');
  }
  if (f.methodId === 'economy') {
    return [f.gbCode, f.gbIndustryName].filter(Boolean).join(' ');
  }
  return f.name || '-';
}

function formatFactorValue(f) {
  if (!f) return '-';
  if (f.valueType === 'custom') return '需自行核算';
  if (f.valueType === 'na') return '不适用';
  if (f.value == null || Number.isNaN(Number(f.value))) return '-';
  const n = Number(f.value);
  return n >= 100 ? n.toFixed(2) : n.toFixed(4).replace(/\.?0+$/, '');
}

function factorSourceBadge(f) {
  if (!f) return '';
  if (f.isBuiltin) return '<span class="badge badge-draft">指引内置</span>';
  return '<span class="badge badge-primary">自定义</span>';
}

function filterFactors(list, filters) {
  const f = normalizeFactorFilters(filters);
  let out = list || [];
  if (f.methodIds.length) out = out.filter(x => f.methodIds.includes(x.methodId));
  if (f.industries.length) out = out.filter(x => f.industries.includes(x.industryMajor));
  if (f.sources.length) {
    out = out.filter(x => {
      if (f.sources.includes('builtin') && x.isBuiltin) return true;
      if (f.sources.includes('custom') && !x.isBuiltin) return true;
      return false;
    });
  }
  if (f.keyword) {
    const kw = f.keyword.trim().toLowerCase();
    if (kw) {
      out = out.filter(x => {
        const hay = [
          x.industryMajor, x.energyCategory, x.itemName, x.subIndustry,
          x.productMajor, x.productSub, x.gbCode, x.gbIndustryName,
          x.sourceSheet, x.sourceNote, factorDisplayName(x)
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(kw);
      });
    }
  }
  return out;
}

function factorStats(list) {
  const all = list || [];
  return {
    total: all.length,
    energy: all.filter(x => x.methodId === 'energy').length,
    product: all.filter(x => x.methodId === 'product').length,
    economy: all.filter(x => x.methodId === 'economy').length,
    custom: all.filter(x => !x.isBuiltin).length
  };
}

function renderFactorTableHead(methodId) {
  if (methodId === 'unified') {
    return '<tr><th>计算方法</th><th>行业</th><th>名称/细分项</th><th>因子值</th><th>单位</th><th>来源</th><th>操作</th></tr>';
  }
  if (methodId === 'energy') {
    return '<tr><th>行业</th><th>排放源类型</th><th>细分项</th><th>子行业</th><th>因子值</th><th>单位</th><th>来源</th><th>操作</th></tr>';
  }
  if (methodId === 'product') {
    return '<tr><th>行业</th><th>主要产品</th><th>细分项</th><th>因子值</th><th>单位</th><th>数据来源</th><th>操作</th></tr>';
  }
  return '<tr><th>行业大类</th><th>国标代码</th><th>行业名称</th><th>因子值</th><th>单位</th><th>来源</th><th>操作</th></tr>';
}

function renderFactorTableRow(f, options = {}) {
  const unified = options.unified;
  const ops = [];
  if (f.isBuiltin) {
    ops.push(`<button type="button" class="btn btn-sm factor-copy-btn" data-id="${f.id}">复制为自定义</button>`);
    ops.push(`<button type="button" class="btn btn-sm factor-view-btn" data-id="${f.id}">查看</button>`);
  } else {
    ops.push(`<a href="#/factors/edit?id=${encodeURIComponent(f.id)}" class="btn btn-sm">编辑</a>`);
    ops.push(`<button type="button" class="btn btn-sm factor-del-btn" data-id="${f.id}">删除</button>`);
  }
  const val = formatFactorValue(f);
  const src = f.isBuiltin ? (f.sourceSheet || '附2') : (f.sourceNote || '自定义');
  if (unified) {
    return `<tr>
      <td>${factorMethodLabel(f.methodId)}</td>
      <td>${f.industryMajor || '-'}</td>
      <td>${factorItemDetailLabel(f)}</td>
      <td>${val}</td>
      <td>${f.unit || '-'}</td>
      <td><span title="${(f.sourceNote || '').replace(/"/g, '&quot;')}">${src}</span> ${factorSourceBadge(f)}</td>
      <td class="table-actions">${ops.join(' ')}</td>
    </tr>`;
  }
  if (f.methodId === 'energy') {
    return `<tr>
      <td>${f.industryMajor || '-'}</td>
      <td>${f.energyCategory || '-'}</td>
      <td>${f.itemName || '-'}</td>
      <td>${f.subIndustry || '—'}</td>
      <td>${val}</td>
      <td>${f.unit || '-'}</td>
      <td><span title="${(f.sourceNote || '').replace(/"/g, '&quot;')}">${src}</span> ${factorSourceBadge(f)}</td>
      <td class="table-actions">${ops.join(' ')}</td>
    </tr>`;
  }
  if (f.methodId === 'product') {
    return `<tr>
      <td>${f.industryMajor || '-'}</td>
      <td>${f.productMajor || '-'}</td>
      <td>${f.productSub || '-'}</td>
      <td>${val}</td>
      <td>${f.unit || '-'}</td>
      <td><span title="${(f.sourceNote || '').replace(/"/g, '&quot;')}">${(f.sourceNote || '指引附2').slice(0, 24)}</span> ${factorSourceBadge(f)}</td>
      <td class="table-actions">${ops.join(' ')}</td>
    </tr>`;
  }
  return `<tr>
    <td>${f.industryMajor || '-'}</td>
    <td>${f.gbCode || '-'}</td>
    <td>${f.gbIndustryName || '-'}</td>
    <td>${val}</td>
    <td>${f.unit || '-'}</td>
    <td>${src} ${factorSourceBadge(f)}</td>
    <td class="table-actions">${ops.join(' ')}</td>
  </tr>`;
}

function renderFactorFilterCheckboxes(name, options, selected) {
  return `<div class="filter-checkbox-group">${options.map(o => `
    <label class="filter-check">
      <input type="checkbox" name="${name}" value="${o.value}" ${isFactorFilterChecked(selected, o.value) ? 'checked' : ''}>
      <span>${o.label}</span>
    </label>`).join('')}</div>`;
}

function renderFactorFilterPanel(filters) {
  const f = normalizeFactorFilters(filters);
  const methodOpts = FACTOR_METHOD_TABS.map(t => ({ value: t.id, label: t.label }));
  const industryOpts = GUIDE.INDUSTRIES.map(i => ({ value: i.major, label: i.major }));
  const sourceOpts = [
    { value: 'builtin', label: '指引内置' },
    { value: 'custom', label: '自定义' }
  ];
  return `
    <div class="filter-panel factor-filter-panel">
      <p class="candidate-filter-hint">未勾选时表示包含全部；可多选组合筛选</p>
      <div class="filter-extra factor-filter-grid">
        <div class="form-item full">
          <label>计算方法</label>
          ${renderFactorFilterCheckboxes('ff_method', methodOpts, f.methodIds)}
        </div>
        <div class="form-item full">
          <label>行业</label>
          ${renderFactorFilterCheckboxes('ff_industry', industryOpts, f.industries)}
        </div>
        <div class="form-item full">
          <label>来源</label>
          ${renderFactorFilterCheckboxes('ff_source', sourceOpts, f.sources)}
        </div>
        <div class="form-item full">
          <label>关键词</label>
          <input id="ff_keyword" type="search" value="${f.keyword || ''}" placeholder="细分项、产品、国标代码等">
        </div>
        <div class="form-item full">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button type="button" class="btn btn-primary" id="ff_search">查询</button>
            <button type="button" class="btn" id="ff_reset">重置</button>
          </div>
        </div>
      </div>
    </div>`;
}

function readFactorFilterInputsFromDom() {
  const methodIds = qsa('input[name="ff_method"]:checked').map(el => el.value);
  const industries = qsa('input[name="ff_industry"]:checked').map(el => el.value);
  const sources = qsa('input[name="ff_source"]:checked').map(el => el.value);
  const allMethods = FACTOR_METHOD_TABS.map(t => t.id);
  const allIndustries = GUIDE.INDUSTRIES.map(i => i.major);
  return normalizeFactorFilters({
    methodIds: methodIds.length && methodIds.length < allMethods.length ? methodIds : [],
    industries: industries.length && industries.length < allIndustries.length ? industries : [],
    sources: sources.length && sources.length < 2 ? sources : [],
    keyword: qs('#ff_keyword')?.value || ''
  });
}

function gbIndustryOptionsForEconomy(industryMajor) {
  const guide = (typeof FACTORS_GUIDE !== 'undefined' ? FACTORS_GUIDE : []).filter(x => x.methodId === 'economy');
  const list = industryMajor ? guide.filter(x => x.industryMajor === industryMajor) : guide;
  return list.map(x => ({ code: x.gbCode, name: x.gbIndustryName, value: x.value }));
}

function nextCustomFactorId(list) {
  const nums = (list || []).filter(x => !x.isBuiltin && x.id && x.id.startsWith('EF-C'))
    .map(x => parseInt(x.id.replace(/\D/g, ''), 10)).filter(n => !Number.isNaN(n));
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return 'EF-C' + String(n).padStart(4, '0');
}

function readFactorFormPayload(form) {
  const methodId = form.querySelector('[name=methodId]')?.value || 'energy';
  const industryMajor = form.querySelector('[name=industryMajor]')?.value || '';
  const payload = {
    methodId,
    methodName: (GUIDE.METHODS.find(m => m.id === methodId) || {}).name || methodId,
    industryMajor,
    sourceNote: form.querySelector('[name=sourceNote]')?.value?.trim() || '',
    isBuiltin: false,
    status: 'active',
    sourceSheet: '自定义'
  };
  if (methodId === 'energy') {
    payload.energyCategory = form.querySelector('[name=energyCategory]')?.value || '';
    payload.itemName = form.querySelector('[name=itemName]')?.value?.trim() || '';
    payload.subIndustry = form.querySelector('[name=subIndustry]')?.value?.trim() || null;
    payload.unit = form.querySelector('[name=unit]')?.value || 'tCO2e/t';
    payload.unitRaw = payload.unit;
  } else if (methodId === 'product') {
    payload.productMajor = form.querySelector('[name=productMajor]')?.value?.trim() || '';
    payload.productSub = form.querySelector('[name=productSub]')?.value?.trim() || '';
    payload.unit = form.querySelector('[name=unit]')?.value || 'tCO2e/t';
    payload.unitRaw = payload.unit;
  } else {
    const gbSel = form.querySelector('[name=gbCode]');
    const opt = gbSel?.selectedOptions?.[0];
    payload.gbCode = gbSel?.value || '';
    payload.gbIndustryName = opt?.dataset?.name || form.querySelector('[name=gbIndustryName]')?.value || '';
    payload.unit = 'tCO2e/万元';
    payload.unitRaw = 'tCO2e/万元人民币';
  }
  const valRaw = form.querySelector('[name=value]')?.value;
  if (valRaw === '' || valRaw == null) {
    payload.value = null;
    payload.valueType = 'custom';
  } else {
    payload.value = Number(valRaw);
    payload.valueType = 'default';
  }
  return payload;
}

function renderFactorFormFields(methodId, industryMajor, factor) {
  const f = factor || {};
  const indOpts = GUIDE.INDUSTRIES.map(i => `<option value="${i.major}" ${(f.industryMajor || industryMajor) === i.major ? 'selected' : ''}>${i.major}</option>`).join('');
  const methodOpts = FACTOR_METHOD_TABS.map(t =>
    `<option value="${t.id}" ${(f.methodId || methodId || 'energy') === t.id ? 'selected' : ''}>${t.label}</option>`).join('');
  const subIndRequired = ['建材', '有色'].includes(f.industryMajor || industryMajor);

  let dynamic = '';
  const m = f.methodId || methodId || 'energy';
  if (m === 'energy') {
    const catOpts = FACTOR_ENERGY_CATEGORIES.map(c =>
      `<option value="${c}" ${f.energyCategory === c ? 'selected' : ''}>${c}</option>`).join('');
    dynamic = `
      <div class="form-item"><label>排放源类型 *</label>
        <select name="energyCategory" required><option value="">请选择</option>${catOpts}</select></div>
      <div class="form-item"><label>细分项 *</label><input name="itemName" required value="${f.itemName || ''}" placeholder="如无烟煤、华北电网"></div>
      <div class="form-item"><label>子行业${subIndRequired ? ' *' : ''}</label>
        <input name="subIndustry" ${subIndRequired ? 'required' : ''} value="${f.subIndustry || ''}" placeholder="建材填水泥/平板玻璃；有色填铝冶炼/铜冶炼"></div>
      <div class="form-item"><label>计量单位</label>
        <select name="unit">
          <option value="tCO2e/t" ${f.unit === 'tCO2e/t' ? 'selected' : ''}>tCO2e/t</option>
          <option value="tCO2e/MWh" ${f.unit === 'tCO2e/MWh' ? 'selected' : ''}>tCO2e/MWh</option>
          <option value="tCO2e/万m³" ${f.unit === 'tCO2e/万m³' ? 'selected' : ''}>tCO2e/万m³</option>
          <option value="tCO2e/万kWh" ${f.unit === 'tCO2e/万kWh' ? 'selected' : ''}>tCO2e/万kWh</option>
        </select></div>`;
  } else if (m === 'product') {
    dynamic = `
      <div class="form-item"><label>主要产品 *</label><input name="productMajor" required value="${f.productMajor || ''}"></div>
      <div class="form-item"><label>细分项 *</label><input name="productSub" required value="${f.productSub || ''}"></div>
      <div class="form-item"><label>计量单位</label>
        <select name="unit">
          <option value="tCO2e/t" ${f.unit === 'tCO2e/t' ? 'selected' : ''}>tCO2e/t</option>
          <option value="tCO2e/MWh" ${f.unit === 'tCO2e/MWh' ? 'selected' : ''}>tCO2e/MWh</option>
        </select></div>`;
  } else {
    const gbOpts = gbIndustryOptionsForEconomy(f.industryMajor || industryMajor).map(o =>
      `<option value="${o.code}" data-name="${o.name}" ${f.gbCode === o.code ? 'selected' : ''}>${o.code} ${o.name}</option>`).join('');
    dynamic = `
      <div class="form-item"><label>国标行业 *</label>
        <select name="gbCode" required><option value="">请选择</option>${gbOpts}
        <option value="__custom__" ${f.gbCode && !gbOpts.includes(f.gbCode) ? 'selected' : ''}>手动输入</option></select></div>
      <div class="form-item"><label>行业名称</label><input name="gbIndustryName" value="${f.gbIndustryName || ''}"></div>
      <input type="hidden" name="unit" value="tCO2e/万元">`;
  }

  return `
    <div class="form-grid">
      <div class="form-item"><label>计算方法 *</label>
        <select name="methodId" id="factorMethodSelect" required>${methodOpts}</select></div>
      <div class="form-item"><label>所属行业 *</label>
        <select name="industryMajor" id="factorIndustrySelect" required><option value="">请选择</option>${indOpts}</select></div>
      ${dynamic}
      <div class="form-item"><label>因子值</label>
        <input name="value" type="number" step="any" value="${f.value != null ? f.value : ''}" placeholder="留空表示需自行核算"></div>
      <div class="form-item full-width"><label>来源说明 *</label>
        <input name="sourceNote" required value="${f.sourceNote && !f.isBuiltin ? f.sourceNote : ''}" placeholder="请说明因子来源，如内部测算、第三方机构等"></div>
    </div>`;
}

function openFactorViewModal(f) {
  if (!ensureReviewModal()) return;
  qs('#reviewModal')?.querySelector('.modal')?.classList.remove('modal-xl');
  qs('#reviewModalTitle').textContent = '查看因子 · ' + factorDisplayName(f);
  const rows = [
    ['计算方法', f.methodName || f.methodId],
    ['行业', f.industryMajor],
    ['因子值', formatFactorValue(f)],
    ['单位', f.unit],
    ['来源附表', f.sourceSheet],
    ['来源说明', f.sourceNote || '-'],
    ['类型', f.isBuiltin ? '指引内置（只读）' : '自定义']
  ];
  if (f.methodId === 'energy') {
    rows.splice(2, 0, ['排放源', f.energyCategory], ['细分项', f.itemName], ['子行业', f.subIndustry || '—']);
  } else if (f.methodId === 'product') {
    rows.splice(2, 0, ['主要产品', f.productMajor], ['细分项', f.productSub]);
  } else {
    rows.splice(2, 0, ['国标代码', f.gbCode], ['行业名称', f.gbIndustryName]);
  }
  qs('#reviewModalBody').innerHTML = `
    <table class="data-table"><tbody>
      ${rows.map(r => `<tr><td style="width:120px;color:#909399">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}
    </tbody></table>
    <p style="margin-top:12px;font-size:13px;color:#909399">内置因子不可直接编辑，可使用「复制为自定义」创建副本后修改。</p>`;
  qs('#reviewModalFooter').innerHTML = `
    <button type="button" class="btn" onclick="hideModal('reviewModal')">关闭</button>
    <button type="button" class="btn btn-primary" id="factorModalCopyBtn">复制为自定义</button>`;
  qs('#factorModalCopyBtn').onclick = () => {
    hideModal('reviewModal');
    const id = Store.copyFactorAsCustom(f.id);
    if (id) {
      toast('已复制为自定义因子', 'success');
      location.hash = '#/factors/edit?id=' + encodeURIComponent(id);
    }
  };
  showModal('reviewModal');
}
