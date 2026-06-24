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
  const groups = groupFactorRecords(list || []);
  return {
    total: groups.length,
    energy: groups.filter(x => x.methodId === 'energy').length,
    product: groups.filter(x => x.methodId === 'product').length,
    economy: groups.filter(x => x.methodId === 'economy').length,
    custom: groups.filter(x => x.isCustom).length,
    versionRecords: (list || []).length
  };
}

const FACTOR_CALIBER_OPTIONS = [
  { value: 'pbo', label: '人行口径' },
  { value: 'bank', label: '我行自定义' }
];

function normalizeFactorCaliber(f) {
  if (!f) return 'bank';
  if (f.caliberTag === 'bank' || f.caliberTag === '我行自定义') return 'bank';
  if (f.caliberTag === 'pbo' || f.caliberTag === '人行口径') return 'pbo';
  return f.isBuiltin ? 'pbo' : 'bank';
}

function factorCaliberLabel(f) {
  if (!f) return '-';
  return normalizeFactorCaliber(f) === 'bank' ? '我行自定义' : '人行口径';
}

/** 同一计算方法 + 行业 + 名称/细分 + 口径 视为同一因子 */
function factorGroupKey(f) {
  if (!f) return '';
  const caliber = normalizeFactorCaliber(f);
  if (f.methodId === 'energy') {
    return ['energy', f.industryMajor || '', f.energyCategory || '', f.itemName || '', f.subIndustry || '', caliber].join('\u001f');
  }
  if (f.methodId === 'product') {
    return ['product', f.industryMajor || '', f.productMajor || '', f.productSub || '', caliber].join('\u001f');
  }
  return ['economy', f.industryMajor || '', f.gbCode || '', caliber].join('\u001f');
}

function factorVersionKey(f) {
  return `${factorGroupKey(f)}|${String(f?.versionYear || '')}`;
}

function pickFactorVersion(versions, preferredYear) {
  const sorted = [...(versions || [])].sort((a, b) => (Number(b.versionYear) || 0) - (Number(a.versionYear) || 0));
  if (!sorted.length) return null;
  if (preferredYear != null && preferredYear !== '') {
    const y = Number(preferredYear);
    const exact = sorted.find(v => Number(v.versionYear) === y);
    if (exact) return exact;
    const notAfter = sorted.filter(v => Number(v.versionYear) <= y);
    if (notAfter.length) return notAfter[0];
  }
  return sorted[0];
}

function groupFactorRecords(list) {
  const map = new Map();
  (list || []).forEach(f => {
    const key = factorGroupKey(f);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  });
  const groups = [];
  map.forEach((versions, groupKey) => {
    versions.sort((a, b) => (Number(b.versionYear) || 0) - (Number(a.versionYear) || 0));
    const latest = versions[0];
    groups.push({
      groupKey,
      methodId: latest.methodId,
      industryMajor: latest.industryMajor,
      caliberTag: normalizeFactorCaliber(latest),
      versions,
      latest,
      versionCount: versions.length,
      isBuiltin: versions.every(v => v.isBuiltin),
      isCustom: versions.some(v => !v.isBuiltin)
    });
  });
  groups.sort((a, b) => {
    const ma = factorMethodLabel(a.methodId).localeCompare(factorMethodLabel(b.methodId), 'zh-CN');
    if (ma) return ma;
    return (a.industryMajor || '').localeCompare(b.industryMajor || '', 'zh-CN');
  });
  return groups;
}

function filterFactorGroups(list, filters) {
  return groupFactorRecords(filterFactors(list, filters));
}

function findFactorGroup(list, groupKey) {
  return groupFactorRecords(list).find(g => g.groupKey === groupKey) || null;
}

function renderFactorTableHead(methodId) {
  if (methodId === 'unified') {
    return '<tr><th>计算方法</th><th>行业</th><th>名称/细分项</th><th>最新因子值</th><th>单位</th><th>口径</th><th>版本</th><th>来源</th><th>操作</th></tr>';
  }
  if (methodId === 'energy') {
    return '<tr><th>行业</th><th>排放源类型</th><th>细分项</th><th>子行业</th><th>因子值</th><th>单位</th><th>来源</th><th>操作</th></tr>';
  }
  if (methodId === 'product') {
    return '<tr><th>行业</th><th>主要产品</th><th>细分项</th><th>因子值</th><th>单位</th><th>数据来源</th><th>操作</th></tr>';
  }
  return '<tr><th>行业大类</th><th>国标代码</th><th>行业名称</th><th>因子值</th><th>单位</th><th>来源</th><th>操作</th></tr>';
}

function renderFactorGroupTableRow(g) {
  const f = g.latest;
  const ops = [];
  if (g.isBuiltin && !g.isCustom) {
    ops.push(`<button type="button" class="btn btn-sm factor-copy-btn" data-id="${f.id}">复制为自定义</button>`);
  } else if (g.isCustom) {
    ops.push(`<a href="#/factors/edit?id=${encodeURIComponent(f.id)}" class="btn btn-sm">编辑最新</a>`);
    ops.push(`<button type="button" class="btn btn-sm factor-add-version-btn" data-id="${f.id}">新增版本</button>`);
    ops.push(`<button type="button" class="btn btn-sm factor-del-group-btn" data-group-key="${encodeURIComponent(g.groupKey)}">删除</button>`);
  }
  ops.push(`<button type="button" class="btn btn-sm factor-view-btn" data-group-key="${encodeURIComponent(g.groupKey)}">查看</button>`);
  const val = formatFactorValue(f);
  const src = g.isCustom
    ? (f.sourceNote || '自定义')
    : (f.sourceSheet || '附2');
  const versionLabel = g.versionCount > 1
    ? `<span title="核算任务默认取最新年度版本">${f.versionYear || '—'} · 共${g.versionCount}版</span>`
    : String(f.versionYear || '—');
  const badge = g.isBuiltin && !g.isCustom
    ? factorSourceBadge(f)
    : (g.isCustom ? '<span class="badge badge-primary">自定义</span>' : factorSourceBadge(f));
  return `<tr>
    <td>${factorMethodLabel(f.methodId)}</td>
    <td>${f.industryMajor || '-'}</td>
    <td>${factorItemDetailLabel(f)}</td>
    <td>${val}</td>
    <td>${f.unit || '-'}</td>
    <td>${factorCaliberLabel(f)}</td>
    <td>${versionLabel}</td>
    <td><span title="${(f.sourceNote || '').replace(/"/g, '&quot;')}">${src}</span> ${badge}</td>
    <td class="table-actions">${ops.join(' ')}</td>
  </tr>`;
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
      <td>${f.versionYear || '—'}</td>
      <td>${factorMethodLabel(f.methodId)}</td>
      <td>${f.industryMajor || '-'}</td>
      <td>${factorItemDetailLabel(f)}</td>
      <td>${val}</td>
      <td>${f.unit || '-'}</td>
      <td>${factorCaliberLabel(f)}</td>
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
    versionYear: Number(form.querySelector('[name=versionYear]')?.value) || new Date().getFullYear(),
    caliberTag: form.querySelector('[name=caliberTag]')?.value || 'bank',
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

function renderFactorFormFields(methodId, industryMajor, factor, options = {}) {
  const f = factor || {};
  const { identityReadonly = false, versionReadonly = false, formMode = 'create' } = options;
  const indOpts = GUIDE.INDUSTRIES.map(i => `<option value="${i.major}" ${(f.industryMajor || industryMajor) === i.major ? 'selected' : ''}>${i.major}</option>`).join('');
  const methodOpts = FACTOR_METHOD_TABS.map(t =>
    `<option value="${t.id}" ${(f.methodId || methodId || 'energy') === t.id ? 'selected' : ''}>${t.label}</option>`).join('');
  const subIndRequired = ['建材', '有色'].includes(f.industryMajor || industryMajor);
  const idDis = identityReadonly ? ' disabled' : '';
  const verDis = versionReadonly ? ' readonly' : '';

  let dynamic = '';
  const m = f.methodId || methodId || 'energy';
  if (m === 'energy') {
    const catOpts = FACTOR_ENERGY_CATEGORIES.map(c =>
      `<option value="${c}" ${f.energyCategory === c ? 'selected' : ''}>${c}</option>`).join('');
    dynamic = `
      <div class="form-item"><label>排放源类型 *</label>
        <select name="energyCategory" required${idDis}><option value="">请选择</option>${catOpts}</select></div>
      <div class="form-item"><label>细分项 *</label><input name="itemName" required value="${f.itemName || ''}" placeholder="如无烟煤、华北电网"${idDis ? ' readonly' : ''}></div>
      <div class="form-item"><label>子行业${subIndRequired ? ' *' : ''}</label>
        <input name="subIndustry" ${subIndRequired ? 'required' : ''} value="${f.subIndustry || ''}" placeholder="建材填水泥/平板玻璃；有色填铝冶炼/铜冶炼"${idDis ? ' readonly' : ''}></div>
      <div class="form-item"><label>计量单位</label>
        <select name="unit"${idDis}>
          <option value="tCO2e/t" ${f.unit === 'tCO2e/t' ? 'selected' : ''}>tCO2e/t</option>
          <option value="tCO2e/MWh" ${f.unit === 'tCO2e/MWh' ? 'selected' : ''}>tCO2e/MWh</option>
          <option value="tCO2e/万m³" ${f.unit === 'tCO2e/万m³' ? 'selected' : ''}>tCO2e/万m³</option>
          <option value="tCO2e/万kWh" ${f.unit === 'tCO2e/万kWh' ? 'selected' : ''}>tCO2e/万kWh</option>
        </select></div>`;
  } else if (m === 'product') {
    dynamic = `
      <div class="form-item"><label>主要产品 *</label><input name="productMajor" required value="${f.productMajor || ''}"${idDis ? ' readonly' : ''}></div>
      <div class="form-item"><label>细分项 *</label><input name="productSub" required value="${f.productSub || ''}"${idDis ? ' readonly' : ''}></div>
      <div class="form-item"><label>计量单位</label>
        <select name="unit"${idDis}>
          <option value="tCO2e/t" ${f.unit === 'tCO2e/t' ? 'selected' : ''}>tCO2e/t</option>
          <option value="tCO2e/MWh" ${f.unit === 'tCO2e/MWh' ? 'selected' : ''}>tCO2e/MWh</option>
        </select></div>`;
  } else {
    const gbOpts = gbIndustryOptionsForEconomy(f.industryMajor || industryMajor).map(o =>
      `<option value="${o.code}" data-name="${o.name}" ${f.gbCode === o.code ? 'selected' : ''}>${o.code} ${o.name}</option>`).join('');
    dynamic = `
      <div class="form-item"><label>国标行业 *</label>
        <select name="gbCode" required${idDis}><option value="">请选择</option>${gbOpts}
        <option value="__custom__" ${f.gbCode && !gbOpts.includes(f.gbCode) ? 'selected' : ''}>手动输入</option></select></div>
      <div class="form-item"><label>行业名称</label><input name="gbIndustryName" value="${f.gbIndustryName || ''}"${idDis ? ' readonly' : ''}></div>
      <input type="hidden" name="unit" value="tCO2e/万元">`;
  }

  const caliberVal = normalizeFactorCaliber(f) || (f.isBuiltin ? 'pbo' : 'bank');
  const caliberOpts = FACTOR_CALIBER_OPTIONS.map(o =>
    `<option value="${o.value}" ${caliberVal === o.value ? 'selected' : ''}>${o.label}</option>`).join('');

  const modeHint = formMode === 'newVersion'
    ? '<p class="candidate-filter-hint" style="margin-bottom:12px">为已有因子新增年度版本；计算方法、行业、名称与口径不可变更。</p>'
    : formMode === 'editVersion'
      ? '<p class="candidate-filter-hint" style="margin-bottom:12px">编辑指定年度版本；因子身份不可变更，如需调整维度请新建因子。</p>'
      : '';

  return `${modeHint}
    <div class="form-grid">
      <div class="form-item"><label>版本年度 *</label>
        <input name="versionYear" type="number" min="2020" max="2035" required value="${f.versionYear || new Date().getFullYear()}"${verDis}></div>
      <div class="form-item"><label>因子口径 *</label>
        <select name="caliberTag" required${idDis}>${caliberOpts}</select></div>
      <div class="form-item"><label>计算方法 *</label>
        <select name="methodId" id="factorMethodSelect" required${idDis}>${methodOpts}</select></div>
      <div class="form-item"><label>所属行业 *</label>
        <select name="industryMajor" id="factorIndustrySelect" required${idDis}><option value="">请选择</option>${indOpts}</select></div>
      ${dynamic}
      <div class="form-item"><label>因子值</label>
        <input name="value" type="number" step="any" value="${f.value != null ? f.value : ''}" placeholder="留空表示需自行核算"></div>
      <div class="form-item full-width"><label>来源说明 *</label>
        <input name="sourceNote" required value="${f.sourceNote && !f.isBuiltin ? f.sourceNote : ''}" placeholder="请说明该版本因子来源，如内部测算、第三方机构等"></div>
    </div>`;
}

function openFactorGroupViewModal(groupKey, allFactors) {
  const g = findFactorGroup(allFactors || Store.get().factors || [], groupKey);
  if (!g) return;
  const f = g.latest;
  if (!ensureReviewModal()) return;
  qs('#reviewModal')?.querySelector('.modal')?.classList.remove('modal-xl');
  qs('#reviewModalTitle').textContent = '因子详情 · ' + factorDisplayName(f);
  const identityRows = [
    ['计算方法', factorMethodLabel(f.methodId)],
    ['行业', f.industryMajor],
    ['名称/细分项', factorItemDetailLabel(f)],
    ['口径', factorCaliberLabel(f)],
    ['单位', f.unit || '-'],
    ['版本数', `${g.versionCount} 个`],
    ['核算默认', `取最新年度版本（当前 ${f.versionYear || '—'}）`]
  ];
  qs('#reviewModalBody').innerHTML = `
    <table class="data-table" style="margin-bottom:16px"><tbody>
      ${identityRows.map(r => `<tr><td style="width:120px;color:#909399">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}
    </tbody></table>
    <h4 style="margin:0 0 8px;font-size:14px">历史版本</h4>
    <div class="table-wrap"><table class="data-table">
      <thead><tr><th>版本年度</th><th>因子值</th><th>来源</th><th>类型</th><th>操作</th></tr></thead>
      <tbody>${g.versions.map(v => `<tr>
        <td>${v.versionYear || '—'}${v.id === f.id ? ' <span class="badge badge-success">最新</span>' : ''}</td>
        <td>${formatFactorValue(v)}</td>
        <td>${v.isBuiltin ? (v.sourceSheet || '附2') : (v.sourceNote || '自定义')}</td>
        <td>${v.isBuiltin ? '指引内置' : '自定义'}</td>
        <td>${v.isBuiltin
          ? '—'
          : `<a href="#/factors/edit?id=${encodeURIComponent(v.id)}" class="btn-link">编辑</a>`}
        </td>
      </tr>`).join('')}
      </tbody>
    </table></div>
    <p style="margin-top:12px;font-size:13px;color:#909399">同一计算方法、行业、名称与口径视为一条因子；核算任务计算时默认采用最新年度版本。</p>`;
  qs('#reviewModalFooter').innerHTML = `
    <button type="button" class="btn" onclick="hideModal('reviewModal')">关闭</button>
    ${g.isCustom ? `<button type="button" class="btn btn-primary" id="factorModalAddVersionBtn">新增版本</button>` : ''}
    ${g.isBuiltin && !g.isCustom ? `<button type="button" class="btn btn-primary" id="factorModalCopyBtn">复制为自定义</button>` : ''}`;
  qs('#factorModalAddVersionBtn')?.addEventListener('click', () => {
    hideModal('reviewModal');
    location.hash = '#/factors/new?copy=' + encodeURIComponent(f.id) + '&mode=version';
  });
  qs('#factorModalCopyBtn')?.addEventListener('click', () => {
    hideModal('reviewModal');
    const id = Store.copyFactorAsCustom(f.id);
    if (id) {
      toast('已复制为自定义因子', 'success');
      location.hash = '#/factors/edit?id=' + encodeURIComponent(id);
    }
  });
  showModal('reviewModal');
}

function openFactorViewModal(f) {
  openFactorGroupViewModal(factorGroupKey(f), Store.get().factors);
}
