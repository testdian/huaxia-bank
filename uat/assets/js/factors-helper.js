/** 排放因子库：筛选、展示、表单辅助 */
const FACTOR_FILTER_KEY = 'factor_library_filters';
const FACTOR_METHOD_TABS = [
  { id: 'energy', label: '能源法' },
  { id: 'product', label: '产品法' },
  { id: 'economy', label: '经济活动法' }
];
const FACTOR_ENERGY_CATEGORIES = ['固体燃料', '液体燃料', '气体燃料', '购入电力', '购入热力', '脱硫试剂', '工艺排放', '其他'];
/** 能源法 / 产品法 — 计量单位下拉（仅可选择，不可手输） */
const FACTOR_ENERGY_UNIT_OPTIONS = [
  { value: 'tCO2e/t', label: 'tCO2e/t' },
  { value: 'tCO2e/MWh', label: 'tCO2e/MWh' },
  { value: 'tCO2e/万kWh', label: 'tCO2e/万kWh' },
  { value: 'tCO2e/万m³', label: 'tCO2e/万m³' },
  { value: 'tCO2e/GJ', label: 'tCO2e/GJ（吉焦）' }
];
const FACTOR_PRODUCT_UNIT_OPTIONS = [
  { value: 'tCO2e/t', label: 'tCO2e/t' },
  { value: 'tCO2e/MWh', label: 'tCO2e/MWh' },
  { value: 'tCO2e/GJ', label: 'tCO2e/GJ（吉焦）' }
];
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
    caliberTags: Array.isArray(f.caliberTags) ? f.caliberTags : []
  };
}

function isFactorFilterChecked(selected, value) {
  if (!selected?.length) return true;
  return selected.includes(value);
}

function factorMethodLabel(methodId) {
  return FACTOR_METHOD_TABS.find(t => t.id === methodId)?.label || methodId;
}

function renderFactorUnitSelect(name, options, selected, disabled) {
  const dis = disabled ? ' disabled' : '';
  const list = [...(options || [])];
  const val = selected || list[0]?.value || '';
  if (val && !list.some(o => o.value === val)) {
    list.push({ value: val, label: val });
  }
  const opts = list.map(o =>
    `<option value="${o.value}" ${val === o.value ? 'selected' : ''}>${o.label}</option>`
  ).join('');
  return `<select name="${name}"${dis}>${opts}</select>`;
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

/** Excel tab 如 2-1BB/2-1CC 为「表号+方法字母」连写，规范为人行附2表号 */
function normalizeFactorSourceSheet(code) {
  if (!code) return '';
  const s = String(code).trim();
  const m = s.match(/^(2-\d+)([BC])\2$/);
  return m ? m[1] + m[2] : s;
}

/** 列表/详情展示：内置因子显示「人行2-1C」等人行附2表号 */
function formatFactorSourceLabel(f) {
  if (!f) return '-';
  if (!f.isBuiltin) return f.sourceNote || '自定义';
  const sheet = normalizeFactorSourceSheet(f.sourceSheet || '附2');
  if (sheet === '附2') return '人行附2';
  if (sheet === '2-9') return '人行2-9';
  return '人行' + sheet;
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
  if (f.caliberTags.length) {
    out = out.filter(x => f.caliberTags.includes(normalizeFactorCaliber(x)));
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
    custom: groups.filter(x => x.isCustom).length
  };
}

const FACTOR_CALIBER_OPTIONS = [
  { value: 'pbo', label: '人行口径' },
  { value: 'bank', label: '我行/项目组自定义' }
];

function getFactorIndustryTableRows() {
  const pbo = typeof INDUSTRY_TABLE !== 'undefined' ? INDUSTRY_TABLE : [];
  const bank = typeof INDUSTRY_BANK_MAJOR_TABLE !== 'undefined' ? INDUSTRY_BANK_MAJOR_TABLE : [];
  const seen = new Set();
  const out = [];
  pbo.forEach(row => {
    if (!row?.code || seen.has(row.code)) return;
    seen.add(row.code);
    out.push(row);
  });
  bank.forEach(row => {
    if (!row?.code || seen.has(row.code)) return;
    seen.add(row.code);
    out.push(row);
  });
  if (typeof IndustryConfig !== 'undefined' && IndustryConfig.isImported()) {
    IndustryConfig.getRows()
      .filter(r => IndustryConfig.hasTag(r, IndustryConfig.TAG_BANK_MAJOR))
      .forEach(r => {
        const code = r.code || r.scopedCode;
        if (!code || seen.has(code)) return;
        seen.add(code);
        out.push({
          code,
          name: r.level4Name || r.name,
          major: r.major || r.level2Name || (typeof inferIndustryMajor === 'function' ? inferIndustryMajor(code) : '')
        });
      });
  }
  return out;
}

function getFactorIndustryMajorGroups() {
  const pboEight = (typeof GUIDE !== 'undefined' ? GUIDE.INDUSTRIES : []).map(i => i.major);
  const bankSet = new Set();
  getFactorIndustryTableRows().forEach(row => {
    if (pboEight.includes(row.major)) return;
    if (row.major) bankSet.add(row.major);
  });
  return {
    pboEight,
    bankMajor: [...bankSet].sort((a, b) => a.localeCompare(b, 'zh-CN'))
  };
}

function getFactorIndustryMajorOptions() {
  const { pboEight, bankMajor } = getFactorIndustryMajorGroups();
  return [...pboEight, ...bankMajor];
}

function renderFactorIndustryMajorOptions(selectedMajor) {
  const sel = selectedMajor || '';
  const { pboEight, bankMajor } = getFactorIndustryMajorGroups();
  const opt = major =>
    `<option value="${escapeHtml(major)}" ${sel === major ? 'selected' : ''}>${escapeHtml(major)}</option>`;
  return `
    <optgroup label="人行八大高碳">${pboEight.map(opt).join('')}</optgroup>
    <optgroup label="我行主要行业">${bankMajor.map(opt).join('')}</optgroup>`;
}

function inferIndustryMajorFromGbCode(code) {
  if (!code) return '';
  const cascade = typeof toCascadeIndustryCode === 'function' ? toCascadeIndustryCode(code) : code;
  const table = getFactorIndustryTableRows();
  const row = table.find(r =>
    r.code === code
    || r.code === cascade
    || (typeof toCascadeIndustryCode === 'function' && toCascadeIndustryCode(r.code) === cascade)
  );
  if (row?.major) return row.major;
  if (typeof inferIndustryMajor === 'function') return inferIndustryMajor(code);
  return '';
}

function searchFactorGbIndustries(keyword, industryMajor, limit = 60) {
  const kw = String(keyword || '').trim().toLowerCase();
  const nameMap = typeof IndustryCascade !== 'undefined' ? IndustryCascade.nameMap() : {};
  let codes = typeof IndustryCascade !== 'undefined' ? IndustryCascade.allLeafCodes() : [];
  if (!codes.length && typeof INDUSTRY_TABLE !== 'undefined') {
    codes = INDUSTRY_TABLE.map(i => i.code);
  }
  if (industryMajor) {
    const tableRows = getFactorIndustryTableRows().filter(r => r.major === industryMajor);
    const tableCodes = new Set(tableRows.flatMap(r => [r.code, typeof toCascadeIndustryCode === 'function' ? toCascadeIndustryCode(r.code) : r.code]));
    if (tableCodes.size) codes = codes.filter(c => tableCodes.has(c) || tableCodes.has(typeof toScopedIndustryCode === 'function' ? toScopedIndustryCode(c) : c));
  }
  const rows = codes.map(code => ({
    code,
    name: nameMap[code] || getFactorIndustryTableRows().find(r => r.code === code || (typeof toCascadeIndustryCode === 'function' && toCascadeIndustryCode(r.code) === code))?.name || (INDUSTRY_TABLE || []).find(r => r.code === code)?.name || '',
    major: inferIndustryMajorFromGbCode(code)
  }));
  if (!kw) return rows.slice(0, limit);
  return rows.filter(r =>
    r.code.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw)
  ).slice(0, limit);
}

function normalizeFactorCaliber(f) {
  if (!f) return 'bank';
  if (f.caliberTag === 'bank' || f.caliberTag === '我行自定义') return 'bank';
  if (f.caliberTag === 'pbo' || f.caliberTag === '人行口径') return 'pbo';
  return f.isBuiltin ? 'pbo' : 'bank';
}

function factorCaliberLabel(f) {
  if (!f) return '-';
  return normalizeFactorCaliber(f) === 'bank' ? '我行/项目组自定义' : '人行口径';
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

function pickFactorRecord(candidates) {
  const sorted = [...(candidates || [])].sort((a, b) => {
    if (!a.isBuiltin && b.isBuiltin) return -1;
    if (a.isBuiltin && !b.isBuiltin) return 1;
    return (Number(b.versionYear) || 0) - (Number(a.versionYear) || 0);
  });
  return sorted[0] || null;
}

function pickFactorVersion(versions) {
  return pickFactorRecord(versions);
}

function groupFactorRecords(list) {
  const map = new Map();
  (list || []).forEach(f => {
    const key = factorGroupKey(f);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  });
  const groups = [];
  map.forEach((raw, groupKey) => {
    const picked = pickFactorRecord(raw);
    if (!picked) return;
    groups.push({
      groupKey,
      methodId: picked.methodId,
      industryMajor: picked.industryMajor,
      caliberTag: normalizeFactorCaliber(picked),
      factor: picked,
      versions: [picked],
      latest: picked,
      versionCount: 1,
      isBuiltin: picked.isBuiltin,
      isCustom: !picked.isBuiltin
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
    return '<tr><th>计算方法</th><th>行业</th><th>名称/细分项</th><th>因子值</th><th>单位</th><th>口径</th><th>来源</th><th>操作</th></tr>';
  }
  if (methodId === 'energy') {
    return '<tr><th>行业</th><th>排放源类型</th><th>细分项</th><th>子行业</th><th>因子值</th><th>单位</th><th>来源</th><th>操作</th></tr>';
  }
  if (methodId === 'product') {
    return '<tr><th>行业</th><th>主要产品</th><th>细分项</th><th>因子值</th><th>单位</th><th>数据来源</th><th>操作</th></tr>';
  }
  return '<tr><th>行业大类</th><th>国标代码</th><th>行业名称</th><th>因子值</th><th>单位</th><th>来源</th><th>操作</th></tr>';
}

function renderFactorRowActions(f, options = {}) {
  const id = f?.id;
  const groupKey = options.groupKey;
  const editHref = `#/factors/edit?id=${encodeURIComponent(id)}`;
  const viewBtn = groupKey != null
    ? `<button type="button" class="btn-link factor-view-btn" data-group-key="${encodeURIComponent(groupKey)}">查看</button>`
    : `<button type="button" class="btn-link factor-view-btn" data-id="${id}">查看</button>`;
  const delBtn = groupKey != null
    ? `<button type="button" class="btn-link btn-link-danger factor-del-group-btn" data-group-key="${encodeURIComponent(groupKey)}">删除</button>`
    : `<button type="button" class="btn-link btn-link-danger factor-del-btn" data-id="${id}">删除</button>`;
  return `<td class="actions">
    <a href="${editHref}" class="btn-link">编辑</a>
    ${viewBtn}
    <button type="button" class="btn-link factor-copy-btn" data-id="${id}">复制</button>
    ${delBtn}
  </td>`;
}

function renderFactorGroupTableRow(g) {
  const f = g.latest;
  const val = formatFactorValue(f);
  const src = g.isCustom
    ? (f.sourceNote || '自定义')
    : formatFactorSourceLabel(f);
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
    <td><span title="${(f.sourceNote || '').replace(/"/g, '&quot;')}">${src}</span> ${badge}</td>
    ${renderFactorRowActions(f, { groupKey: g.groupKey })}
  </tr>`;
}

function renderFactorTableRow(f, options = {}) {
  const unified = options.unified;
  const val = formatFactorValue(f);
  const src = f.isBuiltin ? formatFactorSourceLabel(f) : (f.sourceNote || '自定义');
  const actionCell = renderFactorRowActions(f);
  if (unified) {
    return `<tr>
      <td>${factorMethodLabel(f.methodId)}</td>
      <td>${f.industryMajor || '-'}</td>
      <td>${factorItemDetailLabel(f)}</td>
      <td>${val}</td>
      <td>${f.unit || '-'}</td>
      <td>${factorCaliberLabel(f)}</td>
      <td><span title="${(f.sourceNote || '').replace(/"/g, '&quot;')}">${src}</span> ${factorSourceBadge(f)}</td>
      ${actionCell}
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
      ${actionCell}
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
      ${actionCell}
    </tr>`;
  }
  return `<tr>
    <td>${f.industryMajor || '-'}</td>
    <td>${f.gbCode || '-'}</td>
    <td>${f.gbIndustryName || '-'}</td>
    <td>${val}</td>
    <td>${f.unit || '-'}</td>
    <td>${src} ${factorSourceBadge(f)}</td>
    ${actionCell}
  </tr>`;
}

function renderFactorFilterCheckboxes(name, options, selected) {
  return `<div class="filter-checkbox-group">${options.map(o => `
    <label class="filter-check">
      <input type="checkbox" name="${name}" value="${o.value}" ${isFactorFilterChecked(selected, o.value) ? 'checked' : ''}>
      <span>${o.label}</span>
    </label>`).join('')}</div>`;
}

function renderFactorFilterPanel(filters, allFactors) {
  const f = normalizeFactorFilters(filters);
  const methodOpts = FACTOR_METHOD_TABS.map(t => ({ value: t.id, label: t.label }));
  const industryOpts = getFactorIndustryMajorOptions().map(major => ({ value: major, label: major }));
  const sourceOpts = [
    { value: 'builtin', label: '指引内置' },
    { value: 'custom', label: '自定义' }
  ];
  const caliberOpts = FACTOR_CALIBER_OPTIONS.map(o => ({ value: o.value, label: o.label }));
  return `
    <div class="filter-panel factor-filter-panel">
      <p class="candidate-filter-hint">行业筛选覆盖人行八大高碳与我行主要行业大类。未勾选时表示包含全部。</p>
      <div class="filter-extra factor-filter-grid">
        <div class="form-item full">
          <label>计算方法</label>
          ${renderFactorFilterCheckboxes('ff_method', methodOpts, f.methodIds)}
        </div>
        <div class="form-item full">
          <label>行业大类</label>
          ${renderFactorFilterCheckboxes('ff_industry', industryOpts, f.industries)}
        </div>
        <div class="form-item full">
          <label>因子口径</label>
          ${renderFactorFilterCheckboxes('ff_caliber', caliberOpts, f.caliberTags)}
        </div>
        <div class="form-item full">
          <label>来源</label>
          ${renderFactorFilterCheckboxes('ff_source', sourceOpts, f.sources)}
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
  const caliberTags = qsa('input[name="ff_caliber"]:checked').map(el => el.value);
  const allMethods = FACTOR_METHOD_TABS.map(t => t.id);
  const allIndustries = getFactorIndustryMajorOptions();
  return normalizeFactorFilters({
    methodIds: methodIds.length && methodIds.length < allMethods.length ? methodIds : [],
    industries: industries.length && industries.length < allIndustries.length ? industries : [],
    sources: sources.length && sources.length < 2 ? sources : [],
    caliberTags: caliberTags.length && caliberTags.length < FACTOR_CALIBER_OPTIONS.length ? caliberTags : []
  });
}

function renderFactorGbIndustryField(f, options = {}) {
  const dis = options.disabled ? 'disabled' : '';
  const code = f.gbCode || f.gbIndustryCode || '';
  const name = f.gbIndustryName || '';
  const display = code ? `${code} ${name}`.trim() : '';
  return `
    <div class="form-item full-width factor-gb-industry-field">
      <label>GB/T 4754 四级行业 *</label>
      <input type="search" id="factorGbIndustrySearch" value="${display.replace(/"/g, '&quot;')}" placeholder="输入代码或名称搜索全量行业" autocomplete="off" ${dis}>
      <input type="hidden" name="gbCode" id="factorGbIndustryCode" value="${code}">
      <input type="hidden" name="gbIndustryName" id="factorGbIndustryName" value="${name.replace(/"/g, '&quot;')}">
      <div class="factor-gb-search-results" id="factorGbIndustryResults"></div>
      <small style="color:#909399">覆盖 GB/T 4754-2017 全量四级行业；选定后自动回填行业大类</small>
    </div>`;
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
  let industryMajor = form.querySelector('[name=industryMajor]')?.value || '';
  const gbCode = form.querySelector('[name=gbCode]')?.value
    || form.querySelector('#factorGbIndustryCode')?.value
    || '';
  const gbName = form.querySelector('[name=gbIndustryName]')?.value
    || form.querySelector('#factorGbIndustryName')?.value
    || '';
  if (!industryMajor && gbCode) industryMajor = inferIndustryMajorFromGbCode(gbCode);
  const payload = {
    methodId,
    methodName: (GUIDE.METHODS.find(m => m.id === methodId) || {}).name || methodId,
    industryMajor,
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
    if (gbCode) {
      payload.gbCode = gbCode;
      payload.gbIndustryName = gbName;
    }
  } else if (methodId === 'product') {
    payload.productMajor = form.querySelector('[name=productMajor]')?.value?.trim() || '';
    payload.productSub = form.querySelector('[name=productSub]')?.value?.trim() || '';
    payload.unit = form.querySelector('[name=unit]')?.value || 'tCO2e/t';
    payload.unitRaw = payload.unit;
    if (gbCode) {
      payload.gbCode = gbCode;
      payload.gbIndustryName = gbName;
    }
  } else {
    payload.gbCode = gbCode;
    payload.gbIndustryName = gbName;
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
  const { identityReadonly = false, formMode = 'create' } = options;
  const selectedMajor = f.industryMajor || industryMajor || '';
  const methodOpts = FACTOR_METHOD_TABS.map(t =>
    `<option value="${t.id}" ${(f.methodId || methodId || 'energy') === t.id ? 'selected' : ''}>${t.label}</option>`).join('');
  const subIndRequired = ['建材', '有色'].includes(f.industryMajor || industryMajor);
  const idDis = identityReadonly ? ' disabled' : '';

  let dynamic = '';
  const m = f.methodId || methodId || 'energy';
  const gbField = !identityReadonly || f.gbCode
    ? renderFactorGbIndustryField(f, { disabled: identityReadonly })
    : '';
  if (m === 'energy') {
    const catOpts = FACTOR_ENERGY_CATEGORIES.map(c =>
      `<option value="${c}" ${f.energyCategory === c ? 'selected' : ''}>${c}</option>`).join('');
    dynamic = `
      ${gbField}
      <div class="form-item"><label>排放源类型 *</label>
        <select name="energyCategory" required${idDis}><option value="">请选择</option>${catOpts}</select></div>
      <div class="form-item"><label>细分项 *</label><input name="itemName" required value="${f.itemName || ''}" placeholder="如无烟煤、华北电网"${idDis ? ' readonly' : ''}></div>
      <div class="form-item"><label>子行业${subIndRequired ? ' *' : ''}</label>
        <input name="subIndustry" ${subIndRequired ? 'required' : ''} value="${f.subIndustry || ''}" placeholder="建材填水泥/平板玻璃；有色填铝冶炼/铜冶炼"${idDis ? ' readonly' : ''}></div>
      <div class="form-item"><label>计量单位</label>
        ${renderFactorUnitSelect('unit', FACTOR_ENERGY_UNIT_OPTIONS, f.unit || 'tCO2e/t', identityReadonly)}</div>`;
  } else if (m === 'product') {
    dynamic = `
      ${gbField}
      <div class="form-item full-width">
        <div class="demo-tip factor-product-caliber-tip">产品法须分别维护<strong>人行口径</strong>与<strong>我行/项目组自定义</strong>两套因子；同一产品在不同口径下视为不同因子组。</div>
      </div>
      <div class="form-item"><label>主要产品 *</label><input name="productMajor" required value="${f.productMajor || ''}"${idDis ? ' readonly' : ''}></div>
      <div class="form-item"><label>细分项 *</label><input name="productSub" required value="${f.productSub || ''}"${idDis ? ' readonly' : ''}></div>
      <div class="form-item"><label>计量单位</label>
        ${renderFactorUnitSelect('unit', FACTOR_PRODUCT_UNIT_OPTIONS, f.unit || 'tCO2e/t', identityReadonly)}</div>`;
  } else {
    dynamic = `
      ${renderFactorGbIndustryField(f, { disabled: identityReadonly })}
      <input type="hidden" name="unit" value="tCO2e/万元">`;
  }

  const caliberVal = normalizeFactorCaliber(f) || (f.isBuiltin ? 'pbo' : 'bank');
  const caliberOpts = FACTOR_CALIBER_OPTIONS.map(o =>
    `<option value="${o.value}" ${caliberVal === o.value ? 'selected' : ''}>${o.label}</option>`).join('');

  const modeHint = formMode === 'edit'
    ? '<p class="candidate-filter-hint" style="margin-bottom:12px">编辑自定义因子；因子身份（方法、行业、名称与口径）不可变更，如需调整维度请新建因子。</p>'
    : '<p class="candidate-filter-hint" style="margin-bottom:12px">支持新增、编辑、删除、复制；行业大类含人行八大高碳与我行主要行业；同一计算方法、行业、名称与口径视为一条因子。</p>';

  return `${modeHint}
    <div class="form-grid">
      <div class="form-item"><label>因子口径 *</label>
        <select name="caliberTag" required${idDis}>${caliberOpts}</select></div>
      <div class="form-item"><label>计算方法 *</label>
        <select name="methodId" id="factorMethodSelect" required${idDis}>${methodOpts}</select></div>
      <div class="form-item"><label>行业大类 *</label>
        <select name="industryMajor" id="factorIndustrySelect" required${idDis}>
          <option value="">请选择</option>${renderFactorIndustryMajorOptions(selectedMajor)}
          <option value="其他" ${selectedMajor === '其他' ? 'selected' : ''}>其他</option>
        </select></div>
      ${dynamic}
      <div class="form-item"><label>因子值</label>
        <input name="value" type="number" step="any" value="${f.value != null ? f.value : ''}" placeholder="留空表示需自行核算"></div>
      <div class="form-item full-width"><label>来源说明 *</label>
        <input name="sourceNote" required value="${escapeHtml(f.sourceNote || (f.isBuiltin ? formatFactorSourceLabel(f) + ' 指引内置因子' : ''))}" placeholder="请说明因子来源，如人行附2、联合赤道采集表、内部测算等"></div>
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
    ['因子值', formatFactorValue(f)],
    ['单位', f.unit || '-'],
    ['来源', f.isBuiltin ? formatFactorSourceLabel(f) : (f.sourceNote || '自定义')],
    ['类型', f.isBuiltin ? '指引内置' : '自定义']
  ];
  qs('#reviewModalBody').innerHTML = `
    <table class="data-table"><tbody>
      ${identityRows.map(r => `<tr><td style="width:120px;color:#909399">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}
    </tbody></table>
    <p style="margin-top:12px;font-size:13px;color:#909399">同一计算方法、行业、名称与口径视为一条因子；产品法人行口径与我行/项目组自定义口径分别维护。</p>`;
  qs('#reviewModalFooter').innerHTML = `
    <button type="button" class="btn" onclick="hideModal('reviewModal')">关闭</button>
    <a href="#/factors/edit?id=${encodeURIComponent(f.id)}" class="btn btn-primary">编辑</a>
    <button type="button" class="btn btn-danger factor-modal-del-btn" data-id="${encodeURIComponent(f.id)}" data-group-key="${encodeURIComponent(g.groupKey)}">删除</button>
    <button type="button" class="btn" id="factorModalCopyBtn">复制</button>`;
  qs('#factorModalCopyBtn')?.addEventListener('click', () => {
    hideModal('reviewModal');
    location.hash = '#/factors/new?copy=' + encodeURIComponent(f.id);
  });
  qs('.factor-modal-del-btn')?.addEventListener('click', () => {
    const tip = f.isBuiltin ? '\n\n该因子为人行/指引内置，删除后不可恢复。' : '';
    if (!confirm(`确定删除因子「${factorDisplayName(f)}」？${tip}`)) return;
    hideModal('reviewModal');
    if (Store.deleteFactor(f.id)) {
      toast('已删除', 'success');
      location.hash = '#/factors';
      if (typeof route === 'function') route();
    }
  });
  showModal('reviewModal');
}

function openFactorViewModal(f) {
  openFactorGroupViewModal(factorGroupKey(f), Store.get().factors);
}

function bindFactorGbIndustrySearch(rootEl) {
  const root = rootEl || document;
  const search = qs('#factorGbIndustrySearch', root);
  const results = qs('#factorGbIndustryResults', root);
  const codeInput = qs('#factorGbIndustryCode', root);
  const nameInput = qs('#factorGbIndustryName', root);
  const majorSel = qs('#factorIndustrySelect', root);
  if (!search || !results) return;

  const renderResults = (keyword) => {
    const major = majorSel?.value || '';
    const rows = searchFactorGbIndustries(keyword, major);
    if (!rows.length) {
      results.innerHTML = keyword
        ? '<div class="factor-gb-search-empty">无匹配行业，请调整关键词</div>'
        : '';
      return;
    }
    results.innerHTML = rows.map(r =>
      `<button type="button" class="factor-gb-search-item" data-code="${r.code}" data-name="${String(r.name).replace(/"/g, '&quot;')}" data-major="${r.major || ''}">
        <strong>${r.code}</strong> ${r.name}${r.major ? ` <span style="color:#909399">· ${r.major}</span>` : ''}
      </button>`
    ).join('');
  };

  search.addEventListener('input', () => renderResults(search.value));
  search.addEventListener('focus', () => renderResults(search.value));
  results.addEventListener('click', (e) => {
    const btn = e.target.closest('.factor-gb-search-item');
    if (!btn) return;
    const code = btn.dataset.code || '';
    const name = btn.dataset.name || '';
    const major = btn.dataset.major || '';
    if (codeInput) codeInput.value = code;
    if (nameInput) nameInput.value = name;
    search.value = `${code} ${name}`.trim();
    if (major && majorSel && !majorSel.disabled) {
      const hasOpt = [...majorSel.options].some(o => o.value === major);
      if (hasOpt) majorSel.value = major;
      else if (majorSel.querySelector('option[value="其他"]')) majorSel.value = '其他';
    }
    results.innerHTML = '';
  });
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) results.innerHTML = '';
  });
}

const FACTOR_IMPORT_HEADERS = [
  '计算方法', '行业大类', '因子口径', '因子值', '单位', '来源说明',
  '排放源类型', '细分项', '子行业', '主要产品', '产品细分', '国标代码', '国标行业名称'
];

const FACTOR_IMPORT_HEADER_ALIASES = {
  methodid: 'methodId', method_id: 'methodId', '计算方法': 'methodId',
  industrymajor: 'industryMajor', '行业大类': 'industryMajor',
  calibertag: 'caliberTag', '因子口径': 'caliberTag',
  value: 'value', '因子值': 'value',
  unit: 'unit', '单位': 'unit',
  sourcenote: 'sourceNote', '来源说明': 'sourceNote',
  energycategory: 'energyCategory', '排放源类型': 'energyCategory',
  itemname: 'itemName', '细分项': 'itemName',
  subindustry: 'subIndustry', '子行业': 'subIndustry',
  productmajor: 'productMajor', '主要产品': 'productMajor',
  productsub: 'productSub', '产品细分': 'productSub',
  gbcode: 'gbCode', '国标代码': 'gbCode',
  gbindustryname: 'gbIndustryName', '国标行业名称': 'gbIndustryName'
};

const FACTOR_IMPORT_METHOD_MAP = {
  energy: 'energy', product: 'product', economy: 'economy',
  '能源法': 'energy', '产品法': 'product', '经济活动法': 'economy'
};

const FACTOR_IMPORT_CALIBER_MAP = {
  pbo: 'pbo', bank: 'bank',
  '人行口径': 'pbo', '我行/项目组自定义': 'bank', '我行自定义': 'bank'
};

function normalizeFactorImportHeader(name) {
  const raw = String(name || '').trim().replace(/^\ufeff/, '');
  if (!raw) return '';
  const key = raw.toLowerCase().replace(/\s+/g, '');
  return FACTOR_IMPORT_HEADER_ALIASES[key] || FACTOR_IMPORT_HEADER_ALIASES[raw] || raw;
}

function parseFactorImportCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map(c => c.trim());
}

function parseFactorImportCsv(text) {
  const raw = String(text || '').replace(/^\ufeff/, '').trim();
  if (!raw) return { rows: [], errors: ['文件内容为空'] };
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return { rows: [], errors: ['文件内容为空'] };
  const headers = parseFactorImportCsvLine(lines[0]).map(normalizeFactorImportHeader);
  if (!headers.some(h => h === 'methodId' || h === 'industryMajor')) {
    return { rows: [], errors: ['表头不正确，请使用「下载导入模板」获取标准格式'] };
  }
  const rows = [];
  const errors = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseFactorImportCsvLine(lines[i]);
    if (cells.every(c => !c)) continue;
    const row = {};
    headers.forEach((h, idx) => {
      if (h) row[h] = cells[idx] ?? '';
    });
    rows.push(row);
  }
  return { rows, errors };
}

function parseFactorImportRow(row, rowNum) {
  const methodRaw = String(row.methodId || '').trim();
  const methodId = FACTOR_IMPORT_METHOD_MAP[methodRaw] || FACTOR_IMPORT_METHOD_MAP[methodRaw.toLowerCase()];
  if (!methodId) {
    return { error: `第 ${rowNum} 行：计算方法无效（${methodRaw || '空'}）` };
  }
  const industryMajor = String(row.industryMajor || '').trim();
  if (!industryMajor) return { error: `第 ${rowNum} 行：行业大类不能为空` };
  const caliberRaw = String(row.caliberTag || 'bank').trim();
  const caliberTag = FACTOR_IMPORT_CALIBER_MAP[caliberRaw] || FACTOR_IMPORT_CALIBER_MAP[caliberRaw.toLowerCase()] || 'bank';
  const sourceNote = String(row.sourceNote || '').trim();
  if (!sourceNote) return { error: `第 ${rowNum} 行：来源说明不能为空` };

  const payload = {
    methodId,
    methodName: factorMethodLabel(methodId),
    industryMajor,
    caliberTag,
    sourceNote,
    isBuiltin: false,
    status: 'active',
    sourceSheet: '导入'
  };

  const gbCode = String(row.gbCode || '').trim();
  const gbIndustryName = String(row.gbIndustryName || '').trim();
  if (gbCode) {
    payload.gbCode = gbCode;
    payload.gbIndustryName = gbIndustryName;
    if (!payload.industryMajor) payload.industryMajor = inferIndustryMajorFromGbCode(gbCode) || industryMajor;
  }

  if (methodId === 'energy') {
    payload.energyCategory = String(row.energyCategory || '').trim();
    payload.itemName = String(row.itemName || '').trim();
    payload.subIndustry = String(row.subIndustry || '').trim() || null;
    if (!payload.energyCategory || !payload.itemName) {
      return { error: `第 ${rowNum} 行：能源法须填写排放源类型与细分项` };
    }
    payload.unit = String(row.unit || '').trim() || 'tCO2e/t';
    payload.unitRaw = payload.unit;
  } else if (methodId === 'product') {
    payload.productMajor = String(row.productMajor || '').trim();
    payload.productSub = String(row.productSub || '').trim();
    if (!payload.productMajor || !payload.productSub) {
      return { error: `第 ${rowNum} 行：产品法须填写主要产品与产品细分` };
    }
    payload.unit = String(row.unit || '').trim() || 'tCO2e/t';
    payload.unitRaw = payload.unit;
  } else {
    if (!gbCode) return { error: `第 ${rowNum} 行：经济活动法须填写国标代码` };
    payload.unit = 'tCO2e/万元';
    payload.unitRaw = 'tCO2e/万元人民币';
  }

  const valRaw = String(row.value ?? '').trim();
  if (!valRaw) {
    payload.value = null;
    payload.valueType = 'custom';
  } else {
    const num = Number(valRaw);
    if (Number.isNaN(num)) return { error: `第 ${rowNum} 行：因子值须为数字` };
    payload.value = num;
    payload.valueType = 'default';
  }
  return { payload };
}

function downloadFactorImportTemplate() {
  downloadCsvFile('排放因子导入模板', FACTOR_IMPORT_HEADERS, [
    ['能源法', '电力', '我行/项目组自定义', '2.493', 'tCO2e/t', '示例：内部测算', '购入电力', '华北电网', '', '', '', '', ''],
    ['产品法', '钢铁', '人行口径', '1.850', 'tCO2e/t', '示例：人行附2', '', '', '', '生铁', '普通', '', ''],
    ['经济活动法', '化工', '我行/项目组自定义', '0.012', 'tCO2e/万元', '示例：赤道采集', '', '', '', '', '', 'C2614', '有机化学产品制造']
  ]);
}

function factorImportStatusBadge(status) {
  if (status === 'success') return '<span class="badge badge-success">导入成功</span>';
  if (status === 'processing') return '<span class="badge badge-warning">导入中</span>';
  if (status === 'partial') return '<span class="badge badge-warning">部分成功</span>';
  return '<span class="badge badge-danger">导入失败</span>';
}

function renderFactorImportHistoryTable(view) {
  if (!view.rows.length) {
    return '<p style="color:#909399;text-align:center;padding:32px 0">暂无导入记录</p>';
  }
  return `<div class="table-wrap"><table class="data-table factor-import-history-table">
    <thead><tr>
      <th>序号</th><th>文件名称</th><th>总条数</th><th>导入条数</th><th>异常条数</th>
      <th>状态</th><th>操作人</th><th>导入时间</th><th>操作</th>
    </tr></thead>
    <tbody>${view.rows.map((row, i) => {
      const ops = [];
      if (row.fileName) ops.push(`<button type="button" class="btn-link factor-import-src-btn" data-id="${row.id}">源文件</button>`);
      if (row.errorCount > 0 && row.errorReport) {
        ops.push(`<button type="button" class="btn-link factor-import-err-btn" data-id="${row.id}">异常数据</button>`);
      }
      return `<tr>
        <td>${view.startIndex + i + 1}</td>
        <td>${row.fileName || '—'}</td>
        <td>${row.total ?? '—'}</td>
        <td>${row.imported ?? '—'}</td>
        <td>${row.errorCount ?? '—'}</td>
        <td>${factorImportStatusBadge(row.status)}</td>
        <td>${row.operator || '—'}</td>
        <td>${row.importTime || '—'}</td>
        <td>${ops.join(' · ') || '—'}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

function renderFactorImportPage(ctx) {
  const listKey = 'factor_import_history';
  const history = Store.getFactorImportHistory ? Store.getFactorImportHistory() : [];
  const view = paginateData(listKey, history);
  return `
    <h1 class="page-title">导入因子</h1>
    <p class="page-desc">排放因子库 / 导入因子</p>
    <div class="factor-import-steps">
      <div class="card factor-import-step-card">
        <div class="card-body">
          <h3 class="factor-import-step-title">1、下载因子导入模板，按模板填写因子信息</h3>
          <button type="button" class="btn" id="factorImportDownloadBtn">下载模板</button>
        </div>
      </div>
      <div class="card factor-import-step-card">
        <div class="card-body">
          <h3 class="factor-import-step-title">2、上传文件，支持格式：csv，文件最大 5M</h3>
          <button type="button" class="btn btn-primary" id="factorImportUploadBtn">上传文件</button>
          <input type="file" id="factorImportFile" accept=".csv,text/csv" hidden>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-header"><h3>导入历史</h3></div>
      <div class="card-body">
        ${renderFactorImportHistoryTable(view)}
        ${renderPagination(listKey, view)}
      </div>
    </div>
    <div class="toolbar" style="justify-content:center;margin-top:24px">
      <a href="#/factors" class="btn">返回</a>
    </div>`;
}

function resolveFactorImportStatus(result, total) {
  if (result.added === total && !result.errors.length) return 'success';
  if (result.added > 0) return 'partial';
  return 'failed';
}

function handleFactorImportFile(file, options = {}) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseFactorImportCsv(reader.result);
      const total = parsed.rows.length;
      if (!total) {
        const msg = parsed.errors[0] || '未解析到可导入数据';
        if (typeof Store !== 'undefined' && Store.recordFactorImportHistory) {
          Store.recordFactorImportHistory({
            fileName: file.name,
            total: 0,
            imported: 0,
            errorCount: 1,
            status: 'failed',
            errorReport: msg
          });
        }
        toast(msg, 'warning');
        resolve({ ok: false });
        return;
      }
      const result = Store.importFactors(parsed.rows);
      const errorCount = (result.errors?.length || 0) + (result.skipped || 0);
      const status = resolveFactorImportStatus(result, total);
      if (typeof Store !== 'undefined' && Store.recordFactorImportHistory) {
        Store.recordFactorImportHistory({
          fileName: file.name,
          total,
          imported: result.added,
          errorCount,
          status,
          errorReport: result.errors?.length ? result.errors.join('\n') : ''
        });
      }
      const parts = [`成功导入 ${result.added} 条`];
      if (result.skipped) parts.push(`跳过重复 ${result.skipped} 条`);
      if (result.errors.length) parts.push(`${result.errors.length} 条失败`);
      toast(parts.join('，'), result.added ? 'success' : 'warning');
      if (options.stayOnPage) route();
      else if (result.added) location.hash = '#/factors';
      resolve({ ok: true, result });
    };
    reader.onerror = () => {
      toast('读取文件失败', 'warning');
      resolve({ ok: false });
    };
    reader.readAsText(file, 'UTF-8');
  });
}
