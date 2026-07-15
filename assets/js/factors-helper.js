/** 排放因子库：筛选、展示、表单辅助 */
const FACTOR_FILTER_KEY = 'factor_library_filters';
const FACTOR_LIST_VERSION_RANK_KEY = 'factor_list_version_rank';
const FACTOR_LIST_CATEGORY_KEY = 'factor_list_category_key';
const FACTOR_FILTER_COLLAPSED_KEY = 'factor_filter_collapsed';
const FACTOR_CATEGORY_SIDEBAR_COLLAPSED_KEY = 'factor_category_sidebar_collapsed';

function getGuideMethods() {
  return (typeof GUIDE !== 'undefined' && Array.isArray(GUIDE.METHODS)) ? GUIDE.METHODS : [];
}

function getFactorMethodCatalog() {
  return getGuideMethods().map(m => ({ id: m.id, label: m.name || m.id }));
}

function factorMethodLabel(methodId) {
  const m = getGuideMethods().find(x => x.id === methodId);
  return m?.name || methodId || '-';
}

function factorMethodPriority(methodId) {
  const m = getGuideMethods().find(x => x.id === methodId);
  return m?.priority ?? 99;
}
const FACTOR_ENERGY_CATEGORIES = ['固体燃料', '液体燃料', '气体燃料', '购入电力', '购入热力', '脱硫试剂', '工艺排放', '其他'];
/** 能源法 / 产品法 — 因子单位预设选项（可下拉选择或手动输入） */
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
const FACTOR_ECONOMY_UNIT_OPTIONS = [
  { value: 'tCO2e/万元', label: 'tCO2e/万元' },
  { value: 'tCO2e/万元人民币', label: 'tCO2e/万元人民币' }
];
const FACTORS_GUIDE_VERSION = 'guide-2026-annex2';

function getAllFactorUnitOptions() {
  const seen = new Set();
  const out = [];
  [...FACTOR_ENERGY_UNIT_OPTIONS, ...FACTOR_PRODUCT_UNIT_OPTIONS, ...FACTOR_ECONOMY_UNIT_OPTIONS].forEach(o => {
    if (seen.has(o.value)) return;
    seen.add(o.value);
    out.push(o);
  });
  return out;
}

function getFactorFormDefaultUnit(methodId, factor) {
  if (factor?.unit) return factor.unit;
  if (methodId === 'economy') return 'tCO2e/万元';
  return 'tCO2e/t';
}

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
  return {
    methodIds: Array.isArray(f.methodIds) ? f.methodIds : [],
    industries: Array.isArray(f.industries) ? f.industries : [],
    sourceKeyword: typeof f.sourceKeyword === 'string' ? f.sourceKeyword : '',
    caliberTags: Array.isArray(f.caliberTags) ? f.caliberTags : []
  };
}

function isFactorFilterChecked(selected, value) {
  if (!selected?.length) return true;
  return selected.includes(value);
}

function renderFactorFormMethodOptions(selectedId) {
  return getFactorMethodCatalog().map(t =>
    `<option value="${escapeHtml(t.id)}" ${selectedId === t.id ? 'selected' : ''}>${escapeHtml(t.label)}</option>`
  ).join('');
}

function renderFactorUnitCombo(name, options, selected, disabled, comboId, required) {
  const list = [...(options || [])];
  const val = selected || list[0]?.value || '';
  if (val && !list.some(o => o.value === val)) {
    list.push({ value: val, label: val });
  }
  const dis = disabled ? ' disabled readonly' : '';
  const req = required && !disabled ? ' required' : '';
  const opts = list.map(o =>
    `<div class="param-units-option factor-unit-option" data-value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</div>`
  ).join('');
  const id = comboId || `factorUnit_${name}`;
  return `
    <div class="factor-unit-combo-wrap param-units-combo" id="${escapeHtml(id)}Wrap" data-combo-id="${escapeHtml(id)}">
      <div class="factor-unit-combo-field param-units-combo-field" tabindex="0">
        <input type="text" name="${name}" class="factor-unit-combo-input" value="${escapeHtml(val)}"
          autocomplete="off" placeholder="选择或输入因子单位"${dis}${req}>
        <span class="param-units-drop-arrow">▼</span>
      </div>
      <div class="factor-unit-combo-dropdown param-units-dropdown" style="display:none">
        <div class="factor-units-options param-units-options">${opts}</div>
      </div>
    </div>`;
}

function bindFactorUnitCombo(rootEl) {
  const root = rootEl || document;
  qsa('.factor-unit-combo-wrap', root).forEach(wrap => {
    if (wrap.dataset.bound === '1') return;
    wrap.dataset.bound = '1';
    const input = wrap.querySelector('.factor-unit-combo-input');
    const dropdown = wrap.querySelector('.factor-unit-combo-dropdown');
    const arrow = wrap.querySelector('.param-units-drop-arrow');
    if (!input || !dropdown || input.disabled || input.readOnly) return;
    let open = false;
    const openDrop = () => { open = true; dropdown.style.display = 'block'; if (arrow) arrow.textContent = '▲'; };
    const closeDrop = () => { open = false; dropdown.style.display = 'none'; if (arrow) arrow.textContent = '▼'; };
    wrap.querySelector('.factor-unit-combo-field')?.addEventListener('click', (e) => {
      if (e.target === input) return;
      if (open) closeDrop(); else openDrop();
      input.focus();
    });
    input.addEventListener('focus', () => { if (!open) openDrop(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrop(); });
    wrap.querySelectorAll('.factor-unit-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = opt.dataset.value || opt.textContent.trim();
        closeDrop();
      });
    });
    document.addEventListener('click', function onOutside(e) {
      if (!wrap.isConnected) { document.removeEventListener('click', onOutside); return; }
      if (!wrap.contains(e.target)) closeDrop();
    });
  });
}

function renderFactorUnitSelect(name, options, selected, disabled) {
  return renderFactorUnitCombo(name, options, selected, disabled, `factorUnit_${name}`);
}

/** 建材/有色：subIndustry 用于因子名称细分，行业列改展示国标代码 */
const FACTOR_SUB_INDUSTRY_MAJOR_SET = new Set(['建材', '有色']);

const FACTOR_SUB_INDUSTRY_CODE_MAP = {
  水泥: 'C3011',
  平板玻璃: 'C3041',
  铝冶炼: 'C3216',
  铜冶炼: 'C3211'
};

const FACTOR_GB_CODE_TO_SUB_INDUSTRY = Object.fromEntries(
  Object.entries(FACTOR_SUB_INDUSTRY_CODE_MAP).map(([k, v]) => [v, k])
);

function getIndustryMajorCodesMap() {
  if (getIndustryMajorCodesMap._cache) return getIndustryMajorCodesMap._cache;
  const map = new Map();
  const table = typeof INDUSTRY_TABLE !== 'undefined' ? INDUSTRY_TABLE : [];
  table.forEach(r => {
    if (!r.major || !r.code) return;
    if (!map.has(r.major)) map.set(r.major, []);
    map.get(r.major).push(r.code);
  });
  getIndustryMajorCodesMap._cache = map;
  return map;
}

/** 解析因子对应的 GB/T 4754 行业代码（参照人行八大高碳行业表） */
function resolveFactorIndustryCode(f) {
  if (!f) return '';
  const direct = String(f.gbCode || f.gbIndustryCode || '').trim();
  if (direct) return direct;

  const sub = f.subIndustry && String(f.subIndustry).trim();
  if (sub) {
    if (FACTOR_SUB_INDUSTRY_CODE_MAP[sub]) return FACTOR_SUB_INDUSTRY_CODE_MAP[sub];
    const major = f.industryMajor || '';
    const row = (typeof INDUSTRY_TABLE !== 'undefined' ? INDUSTRY_TABLE : []).find(r =>
      r.major === major && (r.name === sub || r.name.includes(sub) || sub.includes(r.name.replace(/制造.*/, '')))
    );
    if (row?.code) return row.code;
  }

  const major = f.industryMajor || '';
  const codes = getIndustryMajorCodesMap().get(major);
  if (codes?.length) return codes.join('、');

  return '';
}

function resolveFactorIndustryCodeList(f) {
  const raw = resolveFactorIndustryCode(f);
  if (!raw) return [];
  return raw.split('、').map(s => s.trim()).filter(Boolean);
}

function formatFactorIndustryCodeWithName(code) {
  const c = String(code || '').trim();
  if (!c) return '';
  const row = getFactorIndustryRowByCode(c);
  return row ? formatFactorIndustryOptionLabel(row) : c;
}

/**
 * 行业列展示：GB/T 4754 行业代码 + 名称
 * - 有 gbCode → 单条，如 D4411 火力发电
 * - 有 subIndustry → 对应四级码 + 名称
 * - 仅行业大类 → 该大类下全部（如 电力 → D4411 火力发电、D4412 热电联产…）
 */
function factorIndustryDisplayLabel(f) {
  if (!f) return '-';
  const codes = resolveFactorIndustryCodeList(f);
  if (codes.length) {
    return codes.map(formatFactorIndustryCodeWithName).join('、');
  }
  return f.industryMajor || '-';
}

function normalizeEconomyFactorDisplayName(f) {
  if (!f) return '';
  if (f.gbIndustryName && String(f.gbIndustryName).trim()) return String(f.gbIndustryName).trim();
  const raw = f.factorName && String(f.factorName).trim();
  if (!raw) return '';
  const m = raw.match(/^[A-Z]\d{4}\s+(.+)$/);
  return m ? m[1] : raw;
}

function factorItemDetailLabel(f) {
  if (!f) return '-';
  const name = getFactorName(f);
  if (name) return name;
  if (f.methodId === 'energy') {
    const parts = [f.energyCategory, f.itemName].filter(Boolean);
    if (f.subIndustry && !FACTOR_SUB_INDUSTRY_MAJOR_SET.has(f.industryMajor)) {
      parts.push(f.subIndustry);
    }
    return parts.join(' · ') || '-';
  }
  if (f.methodId === 'product') {
    return [f.productMajor, f.productSub].filter(Boolean).join(' · ') || '-';
  }
  return f.gbIndustryName || '-';
}

function saveFactorFilters(filters) {
  sessionStorage.setItem(FACTOR_FILTER_KEY, JSON.stringify(filters || {}));
}

function getFactorName(f) {
  if (!f) return '';
  if (f.methodId === 'economy') {
    return normalizeEconomyFactorDisplayName(f);
  }
  if (f.factorName && String(f.factorName).trim()) return String(f.factorName).trim();
  if (f.methodId === 'energy') {
    return [f.energyCategory, f.itemName].filter(Boolean).join(' · ');
  }
  if (f.methodId === 'product') {
    return [f.productMajor, f.productSub].filter(Boolean).join(' · ');
  }
  return f.name || '';
}

function factorDisplayName(f) {
  if (!f) return '-';
  const name = getFactorName(f);
  return name || '-';
}

function syncFactorLegacyFields(payload) {
  const name = payload.factorName || '';
  if (payload.methodId === 'energy') {
    const parts = name.split(' · ').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      payload.energyCategory = parts[0];
      payload.itemName = parts.slice(1).join(' · ');
    } else {
      payload.energyCategory = payload.energyCategory || '';
      payload.itemName = name;
    }
    payload.subIndustry = payload.subIndustry || null;
  } else if (payload.methodId === 'product') {
    const parts = name.split(' · ').map(s => s.trim()).filter(Boolean);
    payload.productMajor = parts[0] || name;
    payload.productSub = parts.slice(1).join(' · ') || '';
  } else if (payload.methodId === 'economy') {
    if (!payload.gbCode) {
      const m = name.match(/^([A-Z]\d{4})\s+(.+)$/);
      if (m) {
        payload.gbCode = m[1];
        payload.gbIndustryName = m[2];
      } else if (name && !payload.gbIndustryName) {
        payload.gbIndustryName = name;
      }
    }
  }
}

function formatFactorValue(f) {
  if (!f) return '-';
  if (f.valueType === 'custom') return '需自行核算';
  if (f.valueType === 'na') return '不适用';
  if (f.value == null || Number.isNaN(Number(f.value))) return '-';
  const n = Number(f.value);
  return n >= 100 ? n.toFixed(2) : n.toFixed(4).replace(/\.?0+$/, '');
}

/** Excel tab 如 2-1BB/2-1CC 为「表号+方法字母」连写，规范为人行附2表号 */
function normalizeFactorSourceSheet(code) {
  if (!code) return '';
  const s = String(code).trim();
  const m = s.match(/^(2-\d+)([BC])\2$/);
  return m ? m[1] + m[2] : s;
}

/** 列表/详情展示：内置因子统一显示「银办发〔2026〕48号-附件2」 */
function formatFactorSourceLabel(f) {
  if (!f) return '-';
  if (!f.isBuiltin) return f.sourceNote || '自定义';
  return '银办发〔2026〕48号-附件2';
}

function factorSourceSearchText(f) {
  if (!f) return '';
  return [
    formatFactorSourceLabel(f),
    f.sourceNote,
    f.sourceSheet,
    f.isBuiltin ? '指引内置' : '自定义'
  ].filter(Boolean).join(' ');
}

function filterFactors(list, filters) {
  const f = normalizeFactorFilters(filters);
  let out = list || [];
  if (f.methodIds.length) out = out.filter(x => f.methodIds.includes(x.methodId));
  if (f.industries.length) out = out.filter(x => f.industries.includes(x.industryMajor));
  const kw = f.sourceKeyword.trim().toLowerCase();
  if (kw) {
    out = out.filter(x => factorSourceSearchText(x).toLowerCase().includes(kw));
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

function getFactorIndustryRowByCode(code) {
  const c = String(code || '').trim();
  if (!c) return null;
  return getFactorIndustryTableRows().find(r => r.code === c) || null;
}

function formatFactorIndustryOptionLabel(row) {
  if (!row) return '';
  return `${row.code} ${row.name}`.trim();
}

function resolveFactorIndustrySelectCode(f, fallbackMajor) {
  const direct = String(f?.gbCode || f?.gbIndustryCode || '').trim();
  if (direct) return direct;
  const sub = f?.subIndustry && String(f.subIndustry).trim();
  if (sub && FACTOR_SUB_INDUSTRY_CODE_MAP[sub]) return FACTOR_SUB_INDUSTRY_CODE_MAP[sub];
  const major = f?.industryMajor || fallbackMajor || '';
  if (major && major !== '其他') {
    const rows = getFactorIndustryTableRows().filter(r => r.major === major);
    if (rows.length === 1) return rows[0].code;
  }
  return '';
}

function formatFactorIndustryFieldDisplay(f, selectedCode, fallbackMajor) {
  const code = selectedCode || resolveFactorIndustrySelectCode(f, fallbackMajor);
  if (code) {
    const row = getFactorIndustryRowByCode(code);
    if (row) return formatFactorIndustryOptionLabel(row);
    return code;
  }
  const codes = resolveFactorIndustryCode(f);
  if (codes) return codes;
  const major = f?.industryMajor || fallbackMajor || '';
  return major || '-';
}

function applyGbCodeToFactorPayload(payload, gbCode) {
  const code = String(gbCode || '').trim();
  if (!code || code === '__other__') {
    payload.industryMajor = code === '__other__' ? '其他' : (payload.industryMajor || '');
    payload.gbCode = null;
    payload.gbIndustryName = null;
    payload.subIndustry = null;
    return;
  }
  const row = getFactorIndustryRowByCode(code);
  payload.gbCode = code;
  payload.gbIndustryCode = code;
  payload.gbIndustryName = row?.name || '';
  payload.industryMajor = row?.major || inferIndustryMajorFromGbCode(code) || payload.industryMajor || '';
  payload.subIndustry = FACTOR_GB_CODE_TO_SUB_INDUSTRY[code] || null;
}

function renderFactorIndustrySelectOptions(selectedCode) {
  const sel = selectedCode || '';
  const pboEightMajors = new Set((typeof GUIDE !== 'undefined' ? GUIDE.INDUSTRIES : []).map(i => i.major));
  const rows = getFactorIndustryTableRows();
  const pboRows = rows.filter(r => pboEightMajors.has(r.major));
  const bankRows = rows.filter(r => !pboEightMajors.has(r.major));
  const opt = r =>
    `<option value="${escapeHtml(r.code)}" ${sel === r.code ? 'selected' : ''}>${escapeHtml(formatFactorIndustryOptionLabel(r))}</option>`;
  return `
    <optgroup label="人行八大高碳">${pboRows.map(opt).join('')}</optgroup>
    <optgroup label="我行主要行业">${bankRows.map(opt).join('')}</optgroup>`;
}

function renderFactorIndustryMajorOptions(selectedMajor) {
  return renderFactorIndustrySelectOptions(resolveFactorIndustrySelectCode({ industryMajor: selectedMajor }, selectedMajor));
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

/** 同一计算方法 + 行业名称 + 因子名称 + 口径 视为同一因子 */
function factorGroupKey(f) {
  if (!f) return '';
  const caliber = normalizeFactorCaliber(f);
  return [f.methodId || '', f.industryMajor || '', f.methodId === 'economy'
    ? (f.gbCode || f.gbIndustryCode || normalizeEconomyFactorDisplayName(f))
    : getFactorName(f), caliber].join('\u001f');
}

function normalizeFactorVersionYear(f, fallback) {
  const y = Number(f?.versionYear);
  if (y >= 2000 && y <= 2100) return y;
  if (f?.isBuiltin) return fallback || 2026;
  return fallback || new Date().getFullYear();
}

function sortFactorVersions(versions) {
  return [...(versions || [])].sort((a, b) => {
    const ya = normalizeFactorVersionYear(a);
    const yb = normalizeFactorVersionYear(b);
    if (yb !== ya) return yb - ya;
    if (!a.isBuiltin && b.isBuiltin) return -1;
    if (a.isBuiltin && !b.isBuiltin) return 1;
    return String(b.updatedAt || b.id || '').localeCompare(String(a.updatedAt || a.id || ''));
  });
}

function pickFactorRecord(candidates) {
  return sortFactorVersions(candidates)[0] || null;
}

/** 按核算任务年度选取因子版本：精确匹配 > 最近可用历史版本 > 最早版本 */
function pickFactorVersion(versions, taskYear) {
  const sorted = sortFactorVersions(versions);
  if (!sorted.length) return null;
  const year = Number(taskYear);
  if (!year || Number.isNaN(year)) return sorted[0];
  const exact = sorted.find(v => normalizeFactorVersionYear(v) === year);
  if (exact) return exact;
  const usable = sorted.filter(v => normalizeFactorVersionYear(v) <= year);
  if (usable.length) return usable[0];
  return sorted[sorted.length - 1];
}

function formatFactorVersionNo(versionIndex) {
  const n = Math.max(1, Number(versionIndex) || 1);
  return `v${n}.0`;
}

function sortFactorVersionsAsc(versions) {
  return [...(versions || [])].sort((a, b) => {
    const ya = normalizeFactorVersionYear(a);
    const yb = normalizeFactorVersionYear(b);
    if (ya !== yb) return ya - yb;
    if (!a.isBuiltin && b.isBuiltin) return -1;
    if (a.isBuiltin && !b.isBuiltin) return 1;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

function getFactorVersionRank(versions, record) {
  if (!record) return 1;
  const asc = sortFactorVersionsAsc(versions);
  const idx = asc.findIndex(v => v.id === record.id);
  return idx >= 0 ? idx + 1 : asc.length || 1;
}

function formatFactorRecordVersionLabel(versions, record) {
  return formatFactorVersionNo(getFactorVersionRank(versions, record));
}

function getFactorListVersionRank() {
  const n = parseInt(sessionStorage.getItem(FACTOR_LIST_VERSION_RANK_KEY) || '1', 10);
  return Number.isNaN(n) || n < 1 ? 1 : n;
}

function setFactorListVersionRank(rank) {
  sessionStorage.setItem(FACTOR_LIST_VERSION_RANK_KEY, String(Math.max(1, Number(rank) || 1)));
}

function getFactorListCategoryKey() {
  return sessionStorage.getItem(FACTOR_LIST_CATEGORY_KEY) || 'all';
}

function setFactorListCategoryKey(key) {
  sessionStorage.setItem(FACTOR_LIST_CATEGORY_KEY, key || 'all');
}

function factorCategoryKey(methodId) {
  return methodId || '';
}

function parseFactorCategoryKey(key) {
  if (!key || key === 'all') return null;
  const sep = key.indexOf('\u001f');
  const methodId = sep < 0 ? key : key.slice(0, sep);
  return methodId ? { methodId } : null;
}

function collectFactorCategoryTabs(groups) {
  const map = new Map();
  (groups || []).forEach(g => {
    const k = factorCategoryKey(g.methodId);
    if (!k) return;
    if (!map.has(k)) {
      map.set(k, {
        key: k,
        methodId: g.methodId,
        label: factorMethodLabel(g.methodId),
        count: 0
      });
    }
    map.get(k).count += 1;
  });
  return [...map.values()].sort((a, b) => factorMethodPriority(a.methodId) - factorMethodPriority(b.methodId));
}

function filterFactorGroupsByCategory(groups, key) {
  if (!key || key === 'all') return groups || [];
  const parsed = parseFactorCategoryKey(key);
  if (!parsed) return groups || [];
  return (groups || []).filter(g => g.methodId === parsed.methodId);
}

function renderFactorCategoryTabBar(groups, activeKey) {
  const tabs = collectFactorCategoryTabs(groups);
  if (!tabs.length) return '';
  const active = activeKey === 'all' || tabs.some(t => t.key === activeKey)
    ? (activeKey || 'all')
    : 'all';
  const collapsed = isFactorCategorySidebarCollapsed();
  const allTab = `<button type="button" class="factor-category-tab${active === 'all' ? ' active' : ''}" data-factor-category-key="all">全部</button>`;
  const items = tabs.map(t =>
    `<button type="button" class="factor-category-tab${t.key === active ? ' active' : ''}" data-factor-category-key="${escapeHtml(t.key)}" title="${t.count} 项">${escapeHtml(t.label)}</button>`
  ).join('');
  const toggle = `<button type="button" class="factor-category-sidebar-toggle" id="factorCategorySidebarToggle"
    aria-expanded="${!collapsed}" aria-controls="factorCategoryTabs"
    title="${collapsed ? '展开计算方法' : '收起计算方法'}">${collapsed ? '›' : '‹'}</button>`;
  return `
    <div class="factor-category-sidebar-wrap${collapsed ? ' is-collapsed' : ''}" id="factorCategorySidebarWrap">
      <aside class="factor-category-sidebar" id="factorCategorySidebar">
        <div class="factor-category-sidebar-head">
          <span class="factor-category-sidebar-title">计算方法</span>
        </div>
        <div class="factor-category-tabs" id="factorCategoryTabs" role="tablist" aria-label="计算方法">
          ${allTab}${items}
        </div>
      </aside>
      ${toggle}
    </div>`;
}

function isFactorCategorySidebarCollapsed() {
  return sessionStorage.getItem(FACTOR_CATEGORY_SIDEBAR_COLLAPSED_KEY) === '1';
}

function setFactorCategorySidebarCollapsed(collapsed) {
  sessionStorage.setItem(FACTOR_CATEGORY_SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
}

function bindFactorCategorySidebarToggle(rootEl) {
  const root = rootEl || document;
  const body = qs('#factorLibraryBody', root) || qs('.factor-library-body', root);
  const wrap = qs('#factorCategorySidebarWrap', root);
  const toggle = qs('#factorCategorySidebarToggle', root);
  if (!body || !wrap || !toggle || toggle._factorSidebarBound) return;
  toggle._factorSidebarBound = true;
  const sync = (collapsed) => {
    wrap.classList.toggle('is-collapsed', collapsed);
    body.classList.toggle('is-category-sidebar-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    toggle.title = collapsed ? '展开计算方法' : '收起计算方法';
    toggle.innerHTML = collapsed ? '›' : '‹';
  };
  sync(wrap.classList.contains('is-collapsed'));
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const collapsed = !wrap.classList.contains('is-collapsed');
    setFactorCategorySidebarCollapsed(collapsed);
    sync(collapsed);
  });
}

function isFactorFilterCollapsed() {
  return sessionStorage.getItem(FACTOR_FILTER_COLLAPSED_KEY) !== '0';
}

function setFactorFilterCollapsed(collapsed) {
  sessionStorage.setItem(FACTOR_FILTER_COLLAPSED_KEY, collapsed ? '1' : '0');
}

function collectFactorLibraryVersionRanks(allFactors) {
  const groups = groupFactorRecords(allFactors || []);
  let max = 1;
  groups.forEach(g => { max = Math.max(max, g.versionCount || 1); });
  return Array.from({ length: max }, (_, i) => i + 1);
}

function pickFactorGroupVersionAtRank(versions, rank) {
  const asc = sortFactorVersionsAsc(versions);
  return asc[(Number(rank) || 1) - 1] || null;
}

function applyFactorListVersionRank(groups, rank) {
  const r = Math.max(1, Number(rank) || 1);
  return (groups || []).map(g => {
    const v = pickFactorGroupVersionAtRank(g.versions, r);
    if (!v) return null;
    return { ...g, factor: v, listVersion: v, displayVersionRank: r };
  }).filter(Boolean);
}

function createFactorLibraryNextVersion(allFactors, options = {}) {
  const { methodIds = null, sourceRank = null } = options || {};
  const methodSet = methodIds?.length ? new Set(methodIds) : null;
  const groups = groupFactorRecords(allFactors || []);
  const ranks = collectFactorLibraryVersionRanks(allFactors);
  const nextRank = ranks.length + 1;
  const fromRank = sourceRank != null ? Number(sourceRank) : ranks.length;
  let added = 0;
  let skipped = 0;
  groups.forEach(g => {
    if (methodSet && !methodSet.has(g.methodId)) return;
    if ((g.versions?.length || 0) >= nextRank) {
      skipped++;
      return;
    }
    const asc = sortFactorVersionsAsc(g.versions);
    const src = pickFactorGroupVersionAtRank(g.versions, fromRank) || asc[asc.length - 1];
    if (!src) {
      skipped++;
      return;
    }
    const years = asc.map(v => normalizeFactorVersionYear(v));
    const nextYear = Math.max(...years, new Date().getFullYear()) + 1;
    if (asc.some(v => normalizeFactorVersionYear(v) === nextYear)) {
      skipped++;
      return;
    }
    if (src.isBuiltin) {
      const newId = Store.copyFactorAsCustom(src.id);
      if (newId && Store.updateFactor(newId, { versionYear: nextYear })) {
        added++;
      } else {
        skipped++;
      }
      return;
    }
    const payload = {
      methodId: src.methodId,
      methodName: src.methodName,
      industryMajor: src.industryMajor,
      factorName: getFactorName(src),
      caliberTag: src.caliberTag,
      sourceNote: src.sourceNote || '',
      versionYear: nextYear,
      unit: src.unit,
      unitRaw: src.unitRaw || src.unit,
      value: src.value,
      valueType: src.valueType,
      energyCategory: src.energyCategory,
      itemName: src.itemName,
      subIndustry: src.subIndustry,
      productMajor: src.productMajor,
      productSub: src.productSub,
      gbCode: src.gbCode,
      gbIndustryName: src.gbIndustryName
    };
    syncFactorLegacyFields(payload);
    const item = Store.addFactor(payload);
    if (item) added++;
    else skipped++;
  });
  return { added, skipped, nextRank, prevRank: fromRank };
}

function collectFactorMethodsAtVersionRank(allFactors, rank) {
  const groups = applyFactorListVersionRank(groupFactorRecords(allFactors || []), rank);
  const map = new Map();
  groups.forEach(g => {
    if (!g.methodId) return;
    if (!map.has(g.methodId)) {
      map.set(g.methodId, { id: g.methodId, label: factorMethodLabel(g.methodId), count: 0 });
    }
    map.get(g.methodId).count += 1;
  });
  return [...map.values()].sort((a, b) => factorMethodPriority(a.id) - factorMethodPriority(b.id));
}

function openFactorVersionAddDialog(allFactors) {
  if (typeof ensureConfirmDialog !== 'function') return Promise.resolve({ ok: false });
  ensureConfirmDialog();
  const factors = allFactors || [];
  const nextRank = collectFactorLibraryVersionRanks(factors).length + 1;
  const prevRank = Math.max(1, nextRank - 1);
  const nextLabel = formatFactorVersionNo(nextRank);
  const methods = collectFactorMethodsAtVersionRank(factors, prevRank);
  const methodRows = methods.length
    ? methods.map(m => `
      <label class="factor-version-add-method-item">
        <input type="checkbox" name="factorVersionCopyMethod" value="${escapeHtml(m.id)}" checked>
        <span>${escapeHtml(m.label)}</span>
        <span class="factor-version-add-method-count">（${m.count} 项）</span>
      </label>`).join('')
    : '<p class="candidate-filter-hint" style="margin:0">上一版本暂无可复制的计算方法。</p>';

  const overlay = qs('#confirmDialog');
  const titleEl = qs('#confirmDialogTitle');
  const msgEl = qs('#confirmDialogMessage');
  const detailEl = qs('#confirmDialogDetail');
  const okBtn = qs('#confirmDialogOk');
  const cancelBtn = qs('#confirmDialogCancel');
  const closeBtn = qs('#confirmDialogClose');

  titleEl.textContent = '提示';
  msgEl.textContent = `是否确认新增因子版本${nextLabel}？`;
  detailEl.innerHTML = `
    <div class="factor-version-add-dialog">
      <div class="factor-version-add-mode">
        <div class="factor-version-add-mode-label">新增方式</div>
        <label class="factor-version-add-mode-item">
          <input type="radio" name="factorVersionAddMode" value="import" checked>
          <span>批量导入</span>
        </label>
        <label class="factor-version-add-mode-item">
          <input type="radio" name="factorVersionAddMode" value="copy"${methods.length ? '' : ' disabled'}>
          <span>从上一个版本复制</span>
        </label>
      </div>
      <div class="factor-version-add-copy-panel" id="factorVersionCopyPanel" hidden>
        <div class="factor-version-add-copy-label">选择计算方法（可多选）</div>
        <div class="factor-version-add-method-list">${methodRows}</div>
      </div>
    </div>`;
  detailEl.hidden = false;
  okBtn.textContent = '确认';
  cancelBtn.textContent = '取消';
  okBtn.classList.remove('btn-confirm-danger');
  okBtn.classList.add('btn-primary');

  const syncCopyPanel = () => {
    const mode = qs('input[name="factorVersionAddMode"]:checked', detailEl)?.value || 'import';
    const panel = qs('#factorVersionCopyPanel', detailEl);
    if (panel) panel.hidden = mode !== 'copy';
  };
  detailEl.querySelectorAll('input[name="factorVersionAddMode"]').forEach(radio => {
    radio.addEventListener('change', syncCopyPanel);
  });
  syncCopyPanel();

  return new Promise(resolve => {
    let settled = false;
    const cleanup = () => {
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      closeBtn.removeEventListener('click', onCancel);
      overlay.removeEventListener('click', onOverlay);
      document.removeEventListener('keydown', onKey);
    };
    const finish = (result) => {
      if (settled) return;
      settled = true;
      cleanup();
      hideModal('confirmDialog');
      resolve(result);
    };
    const onOk = () => {
      const mode = qs('input[name="factorVersionAddMode"]:checked', detailEl)?.value || 'import';
      if (mode === 'copy') {
        const methodIds = qsa('input[name="factorVersionCopyMethod"]:checked', detailEl).map(el => el.value);
        if (!methodIds.length) {
          if (typeof toast === 'function') toast('请至少选择一种计算方法', 'warning');
          return;
        }
        finish({ ok: true, mode: 'copy', methodIds, nextRank, prevRank, nextLabel });
        return;
      }
      finish({ ok: true, mode: 'import', nextRank, prevRank, nextLabel });
    };
    const onCancel = () => finish({ ok: false });
    const onOverlay = (e) => { if (e.target === overlay) onCancel(); };
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    closeBtn.addEventListener('click', onCancel);
    overlay.addEventListener('click', onOverlay);
    document.addEventListener('keydown', onKey);
    showModal('confirmDialog');
    setTimeout(() => okBtn.focus(), 0);
  });
}

function renderFactorVersionTabBar(allFactors, activeRank) {
  const ranks = collectFactorLibraryVersionRanks(allFactors);
  const latestRank = ranks.length ? ranks[ranks.length - 1] : 1;
  const active = Math.min(Math.max(1, activeRank || 1), ranks.length || 1);
  const tabs = [...ranks].reverse().map(rank => {
    let label = formatFactorVersionNo(rank);
    if (rank === latestRank) label += '（最新版本）';
    const cls = rank === active ? 'factor-version-tab active' : 'factor-version-tab';
    return `<button type="button" class="${cls}" data-factor-version-rank="${rank}" title="${rank === latestRank ? '最新版本' : ''}">${escapeHtml(label)}</button>`;
  }).join('');
  return `
    <div class="factor-version-tabs" role="tablist" aria-label="因子版本">
      ${tabs}
      <button type="button" class="factor-version-tab-add" id="factorVersionTabAdd" title="新增版本">+</button>
    </div>`;
}

function formatFactorGroupVersionSummary(g, displayRecord) {
  const f = displayRecord || pickFactorGroupListVersion(g?.versions) || g?.latest;
  if (!f) return '—';
  const label = formatFactorRecordVersionLabel(g?.versions || [f], f);
  const count = g?.versionCount || g?.versions?.length || 1;
  if (count <= 1) {
    return `<span class="factor-version-tag">${label}</span>`;
  }
  const all = formatFactorGroupVersionText(g);
  return `<span class="factor-version-tag factor-version-tag--multi" title="全部版本：${all}">${label}</span>`;
}

function formatFactorGroupVersionText(g) {
  if (!g?.versions?.length) return 'v1.0';
  const sorted = sortFactorVersionsAsc(g.versions);
  return sorted.map((v, i) => formatFactorVersionNo(i + 1)).join('、');
}

function formatFactorVersionLabelForRecord(f, allFactors) {
  if (!f) return 'v1.0';
  const factors = allFactors || (typeof Store !== 'undefined' ? Store.get()?.factors : []) || [];
  const gk = typeof factorGroupKey === 'function' ? factorGroupKey(f) : '';
  const versions = gk ? factors.filter(x => factorGroupKey(x) === gk) : [f];
  return formatFactorRecordVersionLabel(versions, f);
}

function formatFactorVersionYears(g) {
  if (!g?.versions?.length) return '—';
  const years = [...new Set(g.versions.map(v => normalizeFactorVersionYear(v)))].sort((a, b) => b - a);
  if (years.length === 1) return String(years[0]);
  return years.map(y => `${y}年`).join('、');
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
    const versions = sortFactorVersions(raw);
    const latest = versions[0] || null;
    const listVersion = pickFactorGroupListVersion(versions);
    if (!latest) return;
    groups.push({
      groupKey,
      methodId: latest.methodId,
      industryMajor: latest.industryMajor,
      caliberTag: normalizeFactorCaliber(latest),
      factor: listVersion || latest,
      listVersion: listVersion || latest,
      versions,
      latest,
      versionCount: versions.length,
      versionYears: [...new Set(versions.map(v => normalizeFactorVersionYear(v)))].sort((a, b) => b - a),
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

function findFactorGroup(allFactors, groupKey) {
  if (!groupKey) return null;
  return groupFactorRecords(allFactors || []).find(g => g.groupKey === groupKey) || null;
}

function filterFactorGroups(list, filters) {
  return groupFactorRecords(filterFactors(list, filters));
}

function encodeFactorGroupKeyAttr(groupKey) {
  if (!groupKey) return '';
  try {
    return btoa(unescape(encodeURIComponent(groupKey)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch {
    return encodeURIComponent(groupKey);
  }
}

function decodeFactorGroupKeyAttr(raw) {
  if (!raw) return '';
  try {
    let s = String(raw).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  } catch {
    try { return decodeURIComponent(raw); } catch { return raw; }
  }
}

function refreshFactorFormDynamic(form) {
  // 统一表单字段后无需按计算方法切换动态区块；保留空实现兼容旧缓存脚本
  if (!form) return;
  bindFactorUnitCombo(form.closest('.card-body') || form);
}

function renderFactorTableHead(methodId) {
  if (methodId === 'unified') {
    return '<tr><th>计算方法</th><th>行业</th><th>因子名称</th><th>因子值</th><th>单位</th><th>适用年度</th><th>口径</th><th>来源</th><th>操作</th></tr>';
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
    ? `<button type="button" class="btn-link factor-view-btn" data-group-key="${encodeFactorGroupKeyAttr(groupKey)}">查看</button>`
    : `<button type="button" class="btn-link factor-view-btn" data-id="${id}">查看</button>`;
  const delBtn = groupKey != null
    ? `<button type="button" class="btn-link btn-link-danger factor-del-group-btn" data-group-key="${encodeFactorGroupKeyAttr(groupKey)}">删除</button>`
    : `<button type="button" class="btn-link btn-link-danger factor-del-btn" data-id="${id}">删除</button>`;
  const editLink = `<a href="${editHref}" class="btn-link">编辑</a>`;
  return `<td class="actions">
    ${editLink}
    ${viewBtn}
    <button type="button" class="btn-link factor-copy-btn" data-id="${id}">复制</button>
    ${delBtn}
  </td>`;
}

function renderFactorGroupTableRow(g) {
  const f = g.listVersion || g.factor || pickFactorGroupListVersion(g.versions) || g.latest;
  const val = formatFactorValue(f);
  const src = g.isCustom
    ? (f.sourceNote || '自定义')
    : formatFactorSourceLabel(f);
  const listYear = normalizeFactorVersionYear(f);
  return `<tr>
    <td>${factorMethodLabel(f.methodId)}</td>
    <td>${factorIndustryDisplayLabel(f)}</td>
    <td>${factorItemDetailLabel(f)}</td>
    <td>${val}</td>
    <td>${f.unit || '-'}</td>
    <td>${listYear}</td>
    <td>${factorCaliberLabel(f)}</td>
    <td><span title="${(f.sourceNote || '').replace(/"/g, '&quot;')}">${src}</span></td>
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
      <td>${factorIndustryDisplayLabel(f)}</td>
      <td>${factorItemDetailLabel(f)}</td>
      <td>${val}</td>
      <td>${f.unit || '-'}</td>
      <td>${factorCaliberLabel(f)}</td>
      <td><span title="${(f.sourceNote || '').replace(/"/g, '&quot;')}">${src}</span></td>
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
      <td><span title="${(f.sourceNote || '').replace(/"/g, '&quot;')}">${src}</span></td>
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
      <td><span title="${(f.sourceNote || '').replace(/"/g, '&quot;')}">${(f.sourceNote || '指引附2').slice(0, 24)}</span></td>
      ${actionCell}
    </tr>`;
  }
  return `<tr>
    <td>${f.industryMajor || '-'}</td>
    <td>${f.gbCode || '-'}</td>
    <td>${f.gbIndustryName || '-'}</td>
    <td>${val}</td>
    <td>${f.unit || '-'}</td>
    <td>${src}</td>
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

function pickFactorGroupListVersion(versions) {
  const asc = sortFactorVersionsAsc(versions);
  return asc[0] || pickFactorRecord(versions) || null;
}

function renderFactorFilterHeader(collapsed) {
  const isCollapsed = collapsed ?? isFactorFilterCollapsed();
  return `
    <div class="card-header factor-filter-header${isCollapsed ? ' is-collapsed' : ''}" id="factorFilterToggle" role="button" tabindex="0" aria-expanded="${!isCollapsed}">
      <h3>筛选条件</h3>
      <span class="filter-collapse-chevron" aria-hidden="true">${isCollapsed ? '▶' : '▼'}</span>
    </div>`;
}
function renderFactorFilterPanel(filters, allFactors, options = {}) {
  const collapsed = options.collapsed !== undefined ? options.collapsed : isFactorFilterCollapsed();
  const f = normalizeFactorFilters(filters);
  const methodOpts = getFactorMethodCatalog().map(t => ({ value: t.id, label: t.label }));
  const industryOpts = getFactorIndustryMajorOptions().map(major => ({ value: major, label: major }));
  const caliberOpts = FACTOR_CALIBER_OPTIONS.map(o => ({ value: o.value, label: o.label }));
  return `
    <div class="filter-panel factor-filter-panel${collapsed ? ' is-collapsed' : ''}" id="factorFilterBody"${collapsed ? ' hidden' : ''}>
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
          <input type="search" name="ff_source_keyword" id="ff_source_keyword" class="input"
            value="${escapeHtml(f.sourceKeyword || '')}" placeholder="输入来源关键词模糊搜索" autocomplete="off">
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
  const sourceKeyword = qs('#ff_source_keyword')?.value?.trim() || '';
  const caliberTags = qsa('input[name="ff_caliber"]:checked').map(el => el.value);
  const allMethods = getFactorMethodCatalog().map(t => t.id);
  const allIndustries = getFactorIndustryMajorOptions();
  return normalizeFactorFilters({
    methodIds: methodIds.length && methodIds.length < allMethods.length ? methodIds : [],
    industries: industries.length && industries.length < allIndustries.length ? industries : [],
    sourceKeyword,
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
      ${renderFormLabel('GB/T 4754 四级行业', { required: true })}
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
  const gbCode = form.querySelector('[name=gbIndustryCode]')?.value?.trim() || '';
  const factorName = form.querySelector('[name=factorName]')?.value?.trim() || '';
  const unit = form.querySelector('[name=unit]')?.value?.trim() || getFactorFormDefaultUnit(methodId);
  const payload = {
    methodId,
    methodName: (GUIDE.METHODS.find(m => m.id === methodId) || {}).name || methodId,
    industryMajor: '',
    factorName,
    caliberTag: form.querySelector('[name=caliberTag]')?.value || 'bank',
    sourceNote: form.querySelector('[name=sourceNote]')?.value?.trim() || '',
    versionYear: normalizeFactorVersionYear({
      versionYear: form.querySelector('[name=versionYear]')?.value
    }),
    unit,
    unitRaw: unit,
    isBuiltin: false,
    status: 'active',
    sourceSheet: '自定义'
  };
  applyGbCodeToFactorPayload(payload, gbCode);
  syncFactorLegacyFields(payload);
  const valRaw = form.querySelector('[name=value]')?.value;
  payload.value = valRaw === '' || valRaw == null ? null : Number(valRaw);
  payload.valueType = payload.value == null || Number.isNaN(payload.value) ? 'custom' : 'default';
  return payload;
}

function renderFactorFormFields(methodId, industryMajor, factor, options = {}) {
  const f = factor || {};
  const { formMode = 'create' } = options;
  const isView = formMode === 'view';
  const selectedMajor = f.industryMajor || industryMajor || '';
  const selectedCode = resolveFactorIndustrySelectCode(f, selectedMajor);
  const industryOther = selectedMajor === '其他' && !selectedCode;
  const industryViewVal = formatFactorIndustryFieldDisplay(f, selectedCode, selectedMajor);
  const m = f.methodId || methodId || 'energy';
  const methodOpts = renderFactorFormMethodOptions(m);

  const caliberVal = normalizeFactorCaliber(f) || (f.isBuiltin ? 'pbo' : 'bank');
  const caliberOpts = FACTOR_CALIBER_OPTIONS.map(o =>
    `<option value="${o.value}" ${caliberVal === o.value ? 'selected' : ''}>${o.label}</option>`).join('');

  const modeHint = isView
    ? ''
    : formMode === 'edit'
      ? '<p class="candidate-filter-hint" style="margin-bottom:12px">可修改全部字段；若适用年度与已有版本不同，将保存为新版本。</p>'
      : '';

  const versionYearVal = normalizeFactorVersionYear(f, new Date().getFullYear());
  const factorNameVal = getFactorName(f);
  const unitVal = f.unit || getFactorFormDefaultUnit(m, f);
  const valueDisplay = isView
    ? formatFactorValue(f)
    : (f.value != null && f.valueType !== 'custom' && f.valueType !== 'na' ? f.value : '');
  const sourceVal = f.sourceNote || (f.isBuiltin ? formatFactorSourceLabel(f) : '');
  const valueInputType = isView ? '' : ' type="number" step="any"';
  const valueRequired = isView ? '' : ' required';
  const unitRequired = !isView;
  const fieldDis = isView ? ' disabled' : '';
  const fieldRo = isView ? ' readonly' : '';

  return `${modeHint}
    <div class="form-grid factor-form-unified${isView ? ' factor-form-view' : ''}">
      <div class="form-item">${renderFormLabel('因子口径', { required: true })}
        <select name="caliberTag" required${fieldDis}>${caliberOpts}</select></div>
      <div class="form-item">${renderFormLabel('计算方法', { required: true })}
        <select name="methodId" id="factorMethodSelect" required${fieldDis}>${methodOpts}</select></div>
      <div class="form-item">${renderFormLabel('行业', { required: true })}
        ${isView
    ? `<div class="industry-combo param-units-combo industry-combo-disabled">
          <div class="param-units-combo-field factor-form-view">
            <div class="param-units-tags"><span class="param-units-tag param-units-tag-readonly">${escapeHtml(industryViewVal)}</span></div>
          </div>
        </div>`
    : renderIndustryCombo({
      prefix: 'factor',
      hiddenName: 'gbIndustryCode',
      selected: industryOther ? '__other__' : selectedCode,
      multiple: false,
      required: true,
      includeOther: true,
      placeholder: '点击选择行业',
      hint: ''
    })}
      </div>
      <div class="form-item">${renderFormLabel('适用年度', { required: true })}
        <input name="versionYear" type="number" min="2000" max="2100" step="1" required
          value="${versionYearVal}" placeholder="如 2026、2027"${fieldRo}${fieldDis}></div>
      <div class="form-item full-width">${renderFormLabel('因子名称', { required: true })}
        <input name="factorName" required value="${escapeHtml(factorNameVal)}" placeholder="如：固体燃料 · 无烟煤、电力生产 · 燃煤发电"${fieldRo}${fieldDis}></div>
      <div class="form-item">${renderFormLabel('因子数值', { required: true })}
        <input name="value"${valueInputType}${valueRequired} value="${isView ? escapeHtml(String(valueDisplay)) : valueDisplay}" placeholder="请输入因子数值"${fieldRo}${fieldDis}></div>
      <div class="form-item">${renderFormLabel('因子单位', { required: true })}
        ${renderFactorUnitCombo('unit', getAllFactorUnitOptions(), unitVal, isView, 'factorUnitUnified', unitRequired)}</div>
      <div class="form-item full-width"><label class="field-label"><span class="field-label-text">因子来源</span></label>
        <input name="sourceNote" value="${escapeHtml(sourceVal)}" placeholder="选填，如人行附2、联合赤道采集表、内部测算等"${fieldRo}${fieldDis}></div>
    </div>`;
}

function renderFactorVersionTable(g, options = {}) {
  const { showActions = true } = options;
  const sorted = sortFactorVersions(g.versions);
  const rows = sorted.map(v => {
    const versionLabel = formatFactorRecordVersionLabel(g.versions, v);
    const ops = showActions
      ? `<td class="actions">
          <a href="#/factors/edit?id=${encodeURIComponent(v.id)}" class="btn-link">编辑</a>
          ${v.isBuiltin
            ? `<a href="#/factors/new?copy=${encodeURIComponent(v.id)}" class="btn-link">复制为新版本</a>`
            : `<button type="button" class="btn-link btn-link-danger factor-version-del-btn" data-id="${encodeURIComponent(v.id)}">删除</button>`}
        </td>`
      : '';
    return `<tr>
      <td><span class="factor-version-tag">${versionLabel}</span></td>
      <td>${normalizeFactorVersionYear(v)}</td>
      <td>${formatFactorValue(v)}</td>
      <td>${v.unit || '—'}</td>
      <td>${v.isBuiltin ? formatFactorSourceLabel(v) : (v.sourceNote || '自定义')}</td>
      <td>${v.updatedAt || v.createdAt || '—'}</td>
      ${ops}
    </tr>`;
  }).join('');
  const actionHead = showActions ? '<th>操作</th>' : '';
  return `<div class="table-wrap" style="margin-top:12px">
    <table class="data-table factor-version-table">
      <thead><tr>
        <th>版本</th><th>适用年度</th><th>因子值</th><th>单位</th><th>来源</th><th>更新时间</th>${actionHead}
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#909399;padding:16px">暂无版本</td></tr>'}</tbody>
    </table>
  </div>`;
}

function openFactorVersionManageModal(groupKey, allFactors) {
  const g = findFactorGroup(allFactors || Store.get().factors || [], groupKey);
  if (!g) return;
  const f = g.latest;
  if (!ensureReviewModal()) return;
  qs('#reviewModal')?.querySelector('.modal')?.classList.add('modal-lg');
  qs('#reviewModalTitle').textContent = '版本管理 · ' + factorDisplayName(f);
  qs('#reviewModalBody').innerHTML = `
    <p class="candidate-filter-hint">同一因子可按适用年度维护多个版本。核算任务创建时将按任务年度自动匹配对应版本（无精确匹配时使用最近可用历史版本）。</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px">
      <span><strong>计算方法：</strong>${factorMethodLabel(f.methodId)}</span>
      <span><strong>行业：</strong>${factorIndustryDisplayLabel(f)}</span>
      <span><strong>因子：</strong>${factorItemDetailLabel(f)}</span>
      <span><strong>口径：</strong>${factorCaliberLabel(f)}</span>
    </div>
    ${renderFactorVersionTable(g)}
  `;
  qs('#reviewModalFooter').innerHTML = `
    <button type="button" class="btn" onclick="hideModal('reviewModal')">关闭</button>
    <a href="#/factors/new?copy=${encodeURIComponent(f.id)}" class="btn btn-primary" onclick="hideModal('reviewModal')">新增版本</a>`;
  qs('#reviewModalFooter').style.display = '';
  qs('#reviewModalBody').querySelectorAll('.factor-version-del-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = decodeURIComponent(btn.dataset.id || '');
      const vf = Store.getFactor(id);
      const ok = await showConfirmDialog({
        message: `是否确认删除 ${formatFactorRecordVersionLabel(g.versions, vf)}（${normalizeFactorVersionYear(vf)} 年）版本？`,
        danger: true
      });
      if (!ok) return;
      if (Store.deleteFactor(id)) {
        toast('已删除该版本', 'success');
        hideModal('reviewModal');
        if (typeof route === 'function') route();
      }
    };
  });
  showModal('reviewModal');
}

function openFactorGroupViewModal(groupKey, allFactors) {
  const g = findFactorGroup(allFactors || Store.get().factors || [], groupKey);
  if (!g) {
    if (typeof toast === 'function') toast('未找到该因子，请刷新列表后重试', 'warning');
    return;
  }
  const f = g.listVersion || g.latest;
  if (!f) return;
  if (!ensureReviewModal()) return;
  qs('#reviewModal')?.querySelector('.modal')?.classList.add('modal-lg');
  qs('#reviewModalTitle').textContent = '因子详情 · ' + factorDisplayName(f);
  qs('#reviewModalBody').innerHTML = `
    ${renderFactorFormFields(f.methodId, f.industryMajor, f, { formMode: 'view' })}
    <h4 style="margin:16px 0 8px;font-size:14px">历史版本（${formatFactorGroupVersionText(g)}）</h4>
    ${renderFactorVersionTable(g, { showActions: false })}
  `;
  const footer = qs('#reviewModalFooter');
  if (footer) {
    footer.innerHTML = '';
    footer.style.display = 'none';
  }
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
  '因子口径', '计算方法', '行业', '适用年度', '因子名称', '因子数值', '因子单位', '因子来源'
];

const FACTOR_IMPORT_HEADER_ALIASES = {
  methodid: 'methodId', method_id: 'methodId', '计算方法': 'methodId',
  industrymajor: 'industryMajor', '行业大类': 'industryMajor', '行业名称': 'industryMajor',
  calibertag: 'caliberTag', '因子口径': 'caliberTag',
  versionyear: 'versionYear', '适用年度': 'versionYear',
  factorname: 'factorName', '因子名称': 'factorName',
  value: 'value', '因子值': 'value', '因子数值': 'value',
  unit: 'unit', '单位': 'unit', '因子单位': 'unit',
  sourcenote: 'sourceNote', '来源说明': 'sourceNote', '因子来源': 'sourceNote'
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
  if (!headers.includes('methodId') || !headers.includes('factorName')) {
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
  if (!industryMajor) return { error: `第 ${rowNum} 行：行业不能为空` };
  const caliberRaw = String(row.caliberTag || 'bank').trim();
  const caliberTag = FACTOR_IMPORT_CALIBER_MAP[caliberRaw] || FACTOR_IMPORT_CALIBER_MAP[caliberRaw.toLowerCase()] || 'bank';
  const factorName = String(row.factorName || '').trim();
  if (!factorName) return { error: `第 ${rowNum} 行：因子名称不能为空` };
  const unit = String(row.unit || '').trim();
  if (!unit) return { error: `第 ${rowNum} 行：因子单位不能为空` };
  const sourceNote = String(row.sourceNote || '').trim();

  const payload = {
    methodId,
    methodName: factorMethodLabel(methodId),
    industryMajor,
    factorName,
    caliberTag,
    sourceNote,
    versionYear: normalizeFactorVersionYear({ versionYear: String(row.versionYear || '').trim() || new Date().getFullYear() }),
    unit,
    unitRaw: unit,
    isBuiltin: false,
    status: 'active',
    sourceSheet: '导入'
  };
  syncFactorLegacyFields(payload);

  const valRaw = String(row.value ?? '').trim();
  if (!valRaw) return { error: `第 ${rowNum} 行：因子数值不能为空` };
  const num = Number(valRaw);
  if (Number.isNaN(num)) return { error: `第 ${rowNum} 行：因子数值须为数字` };
  payload.value = num;
  payload.valueType = 'default';
  return { payload };
}

function downloadFactorImportTemplate() {
  downloadCsvFile('排放因子导入模板', FACTOR_IMPORT_HEADERS, [
    ['我行/项目组自定义', '能源法', '电力', '2026', '固体燃料 · 无烟煤', '2.493', 'tCO2e/t', '内部测算'],
    ['人行口径', '产品法', '钢铁', '2026', '生铁 · 普通', '1.850', 'tCO2e/t', '人行附2'],
    ['我行/项目组自定义', '经济活动法', '化工', '2027', 'C2614 有机化学产品制造', '0.012', 'tCO2e/万元', '']
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
          <h3 class="factor-import-step-title">2、上传文件，支持格式：csv、xlsx，文件最大 200M</h3>
          <button type="button" class="btn btn-primary" id="factorImportUploadBtn">上传文件</button>
          <input type="file" id="factorImportFile" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
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
  return (async () => {
    try {
      const text = await readBatchImportFileAsText(file);
      const parsed = parseFactorImportCsv(text);
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
        return { ok: false };
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
      return { ok: true, result };
    } catch (err) {
      toast(err.message || '读取文件失败', 'warning');
      return { ok: false };
    }
  })();
}

function getIndustryComboOptionGroups(options = {}) {
  const { includeOtherAll = false, includeOther = false } = options;
  const groups = [];
  if (includeOtherAll && typeof METHOD_CONFIG !== 'undefined') {
    groups.push({
      groupLabel: '通用',
      rows: [{ code: METHOD_CONFIG.INDUSTRY_OTHER_ALL, label: METHOD_CONFIG.INDUSTRY_OTHER_ALL_LABEL }]
    });
  }
  if (typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.getIndustryOptionGroups) {
    const cfgGroups = METHOD_CONFIG.getIndustryOptionGroups();
    if (cfgGroups.some(g => g.rows?.length)) {
      groups.push(...cfgGroups);
      if (includeOther) {
        groups.push({ groupLabel: '其他', rows: [{ code: '__other__', label: '其他' }] });
      }
      return groups;
    }
  }
  const pboEightMajors = new Set((typeof GUIDE !== 'undefined' ? GUIDE.INDUSTRIES : []).map(i => i.major));
  const rows = getFactorIndustryTableRows();
  groups.push(
    {
      groupLabel: '人行八大高碳',
      rows: rows.filter(r => pboEightMajors.has(r.major)).map(r => ({
        code: r.code,
        label: formatFactorIndustryOptionLabel(r)
      }))
    },
    {
      groupLabel: '我行主要行业',
      rows: rows.filter(r => !pboEightMajors.has(r.major)).map(r => ({
        code: r.code,
        label: formatFactorIndustryOptionLabel(r)
      }))
    }
  );
  if (includeOther) {
    groups.push({ groupLabel: '其他', rows: [{ code: '__other__', label: '其他' }] });
  }
  return groups;
}

function industryComboLabelForCode(code, groups) {
  const c = String(code || '').trim();
  if (!c) return '';
  if (typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.formatIndustryCodeLabel) {
    const label = METHOD_CONFIG.formatIndustryCodeLabel(c);
    if (label && label !== c) return label;
  }
  for (const g of groups || getIndustryComboOptionGroups()) {
    const row = g.rows?.find(r => r.code === c);
    if (row) return row.label;
  }
  const row = getFactorIndustryRowByCode(c);
  return row ? formatFactorIndustryOptionLabel(row) : c;
}

function renderIndustryCombo(options = {}) {
  const {
    prefix = 'industry',
    hiddenName = 'industryCombined',
    selected = [],
    multiple = true,
    disabled = false,
    required = false,
    placeholder = multiple ? '点击选择适用行业（可多选）' : '点击选择行业',
    hint = '',
    includeOtherAll = false,
    includeOther = false,
    searchPlaceholder = '输入行业代码或名称筛选'
  } = options;
  const selArr = Array.isArray(selected)
    ? selected.map(v => String(v).trim()).filter(Boolean)
    : (selected ? [String(selected).trim()] : []);
  const normalized = multiple ? selArr : selArr.slice(0, 1);
  const hiddenVal = multiple
    ? escapeHtml(JSON.stringify(normalized))
    : escapeHtml(normalized[0] || '');
  const reqAttr = required ? ' required' : '';
  const disClass = disabled ? ' industry-combo-disabled' : '';
  return `
    <div id="${prefix}IndustryComboWrap" class="industry-combo param-units-combo template-industry-combo${disClass}" data-industry-combo-prefix="${escapeHtml(prefix)}" data-industry-multiple="${multiple ? '1' : '0'}"${disabled ? ' data-disabled="1"' : ''}>
      <div id="${prefix}IndustryComboField" class="param-units-combo-field" tabindex="${disabled ? '-1' : '0'}">
        <div id="${prefix}IndustryTags" class="param-units-tags"></div>
        <input type="text" id="${prefix}IndustryInlineInput" autocomplete="off" placeholder="${escapeHtml(placeholder)}"${disabled ? ' disabled readonly' : ''}>
        <span id="${prefix}IndustryDropArrow" class="param-units-drop-arrow">▼</span>
      </div>
      <div id="${prefix}IndustryDropdown" class="param-units-dropdown industry-combo-dropdown" style="display:none">
        <div class="industry-combo-search-wrap">
          <input type="search" id="${prefix}IndustrySearchInput" class="industry-combo-search-input" placeholder="${escapeHtml(searchPlaceholder)}" autocomplete="off"${disabled ? ' disabled' : ''}>
        </div>
        <div id="${prefix}IndustryOptions" class="param-units-options"></div>
      </div>
      <input type="hidden" name="${escapeHtml(hiddenName)}" id="${prefix}IndustryCombined" value="${hiddenVal}"${reqAttr}>
    </div>
    ${hint ? `<small class="text-muted industry-combo-hint">${hint}</small>` : ''}`;
}

function bindIndustryCombo(config = {}) {
  const {
    prefix = 'industry',
    multiple = true,
    includeOtherAll = false,
    includeOther = false,
    disabled = false,
    onChange = null
  } = config;
  const wrap = qs(`#${prefix}IndustryComboWrap`);
  const hidden = qs(`#${prefix}IndustryCombined`);
  const field = qs(`#${prefix}IndustryComboField`);
  const tagsEl = qs(`#${prefix}IndustryTags`);
  const dropdown = qs(`#${prefix}IndustryDropdown`);
  const optionsEl = qs(`#${prefix}IndustryOptions`);
  const inlineInput = qs(`#${prefix}IndustryInlineInput`);
  const searchInput = qs(`#${prefix}IndustrySearchInput`);
  const arrow = qs(`#${prefix}IndustryDropArrow`);
  if (!wrap || !hidden || !field || !tagsEl || !dropdown || !optionsEl) return;

  const isDisabled = disabled || wrap.dataset.disabled === '1';
  let selected = [];
  const raw = hidden.value || '';
  if (multiple) {
    if (typeof METHOD_CONFIG !== 'undefined' && METHOD_CONFIG.parseIndustriesCombined && includeOtherAll) {
      selected = METHOD_CONFIG.parseIndustriesCombined(raw || '[]');
    } else {
      try {
        const parsed = JSON.parse(raw || '[]');
        selected = Array.isArray(parsed) ? parsed.map(v => String(v).trim()).filter(Boolean) : [];
      } catch {
        selected = raw ? [String(raw).trim()] : [];
      }
    }
  } else {
    selected = raw ? [String(raw).trim()] : [];
  }
  let dropOpen = false;

  function getGroups() {
    return getIndustryComboOptionGroups({ includeOtherAll, includeOther });
  }

  function syncHidden(notifyChange) {
    hidden.value = multiple ? JSON.stringify(selected) : (selected[0] || '');
    if (notifyChange && typeof onChange === 'function') onChange(hidden.value, selected);
  }

  function removeItem(code) {
    selected = selected.filter(c => c !== code);
    syncHidden(true);
    renderTags();
    renderOptions(searchInput?.value || '');
  }

  function addItem(code) {
    const v = String(code || '').trim();
    if (!v) return;
    if (!multiple) {
      selected = [v];
      syncHidden(true);
      renderTags();
      renderOptions(searchInput?.value || '');
      closeDropdown();
      return;
    }
    if (selected.includes(v)) return;
    selected.push(v);
    syncHidden(true);
    renderTags();
    renderOptions(searchInput?.value || '');
  }

  function renderTags() {
    const groups = getGroups();
    tagsEl.innerHTML = selected.map(code => {
      const label = industryComboLabelForCode(code, groups);
      if (isDisabled) {
        return `<span class="param-units-tag param-units-tag-readonly">${escapeHtml(label)}</span>`;
      }
      return `<span class="param-units-tag">
        ${escapeHtml(label)}
        <button type="button" class="param-units-tag-remove" data-code="${escapeHtml(code)}" aria-label="移除">×</button>
      </span>`;
    }).join('');
    if (!isDisabled) {
      qsa('.param-units-tag-remove', tagsEl).forEach(btn => {
        btn.onclick = (e) => { e.stopPropagation(); removeItem(btn.dataset.code); };
      });
    }
    if (selected.length && isDisabled) {
      inlineInput.style.display = 'none';
    } else {
      inlineInput.style.display = '';
    }
  }

  function renderOptions(keyword) {
    const kw = String(keyword || '').trim().toLowerCase();
    const groups = getGroups();
    let html = '';
    groups.forEach(g => {
      const rows = (g.rows || []).filter(({ code, label }) => {
        if (!kw) return true;
        const text = `${code} ${label}`.toLowerCase();
        return text.includes(kw);
      });
      if (!rows.length) return;
      html += `<div class="param-units-group-label">${escapeHtml(g.groupLabel)}</div>`;
      rows.forEach(({ code, label }) => {
        const isSel = selected.includes(code);
        html += `<div class="param-units-option${isSel ? ' is-selected' : ''}" data-code="${escapeHtml(code)}">
          <span class="param-units-option-check">${isSel ? '✓' : ''}</span>
          <span>${escapeHtml(label)}</span>
        </div>`;
      });
    });
    optionsEl.innerHTML = html || `<div class="param-units-empty">${kw ? '无匹配行业' : '暂无行业数据'}</div>`;
    if (!isDisabled) {
      qsa('.param-units-option', optionsEl).forEach(opt => {
        opt.onclick = (e) => {
          e.stopPropagation();
          const code = opt.dataset.code;
          if (multiple) {
            if (selected.includes(code)) removeItem(code);
            else addItem(code);
          } else {
            addItem(code);
          }
        };
      });
    }
  }

  function openDropdown() {
    if (isDisabled) return;
    dropOpen = true;
    dropdown.style.display = 'block';
    if (arrow) arrow.textContent = '▲';
    renderOptions(searchInput?.value || '');
    searchInput?.focus();
  }

  function closeDropdown() {
    dropOpen = false;
    dropdown.style.display = 'none';
    if (arrow) arrow.textContent = '▼';
    if (searchInput) searchInput.value = '';
    if (inlineInput) inlineInput.value = '';
  }

  if (!isDisabled) {
    const onOutside = (e) => {
      if (!wrap.isConnected) {
        document.removeEventListener('mousedown', onOutside);
        return;
      }
      if (!wrap.contains(e.target)) closeDropdown();
    };

    wrap.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    document.addEventListener('mousedown', onOutside);

    const openOnly = (e) => {
      if (e?.target?.closest?.('.param-units-tag-remove')) return;
      if (e?.target?.closest?.('.industry-combo-dropdown')) return;
      if (!dropOpen) openDropdown();
    };

    field.addEventListener('click', openOnly);
    inlineInput?.addEventListener('click', (e) => {
      e.stopPropagation();
      openOnly(e);
    });
    inlineInput?.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDropdown(); });
    searchInput?.addEventListener('input', () => renderOptions(searchInput.value));
    searchInput?.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') closeDropdown();
    });
  }

  renderTags();
  syncHidden(false);
  renderOptions('');
}
