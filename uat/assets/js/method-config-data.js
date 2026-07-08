/** 碳核算模板配置中心 — 数据与持久化（对齐开发版需规） */
window.METHOD_CONFIG = {
  EIGHT_INDUSTRIES: ['电力', '建材', '钢铁', '有色', '石化', '化工', '造纸', '民航'],
  PARAM_CATEGORIES: ['基础信息类', '活动水平类', '结果计算类'],
  APPLY_SCENES: [
    { value: 'entity', label: '企业核算' },
    { value: 'project_loan', label: '项目贷款核算' }
  ],
  BUILTIN_RESULT_PARAM_IDS: ['P_ghg_total'],
  PARAM_UNIT_OPTIONS: ['t', 'kg', '万m³', 'm³', 'MWh', 'kWh', 'GJ', 'tCO₂e', 'tCO₂/t', 'tCO₂/万m³', '万元'],
  FACTOR_CATEGORIES: [
    { code: 'flat_glass_fossil', label: '平板玻璃-化石燃料' },
    { code: 'flat_glass_grid', label: '平板玻璃-区域电网' },
    { code: 'flat_glass_carbonate', label: '平板玻璃-碳酸盐/脱硫' },
    { code: 'mining_fossil', label: '采矿-化石燃料' },
    { code: 'mining_fugitive', label: '采矿-CH4/CO2逃逸' },
    { code: 'generic_fuel', label: '通用-化石燃料' },
    { code: 'generic_grid', label: '通用-电网因子' }
  ],

  params: [
    { id: 'P_coal', paramCode: 'PARAM_0001', name: '煤炭消耗量', format: 'number', paramType: '数值型', category: '活动水平类', unit: 't', decimalPlaces: 4, scope: 'global', showInTemplate: true, status: 'active', applyIndustry: [] },
    { id: 'P_gas', paramCode: 'PARAM_0002', name: '天然气消耗量', format: 'number', paramType: '数值型', category: '活动水平类', unit: '万m³', decimalPlaces: 4, scope: 'global', showInTemplate: true, status: 'active', applyIndustry: [] },
    { id: 'P_fixed_source_type', paramCode: 'PARAM_0003', name: '固定源排放类型', format: 'option', paramType: '选项型', category: '活动水平类', unit: '—', scope: 'global', showInTemplate: true, enumCount: 12, status: 'active', applyIndustry: [] },
    { id: 'P_ghg_total', paramCode: 'PARAM_0004', name: '温室气体排放总量', format: 'number', paramType: '数值型', category: '结果计算类', unit: 'tCO₂e', decimalPlaces: 4, scope: 'global', showInTemplate: true, status: 'active', applyIndustry: [], builtin: true },
    { id: 'P_disclosure_source', paramCode: 'PARAM_0005', name: '数据来源及佐证材料名称', format: 'text', paramType: '文本型', category: '基础信息类', unit: '—', scope: 'global', showInTemplate: true, status: 'active', applyIndustry: [] },
    { id: 'P_grid_region', paramCode: 'PARAM_0006', name: '企业所属电网', format: 'option', paramType: '选项型', category: '活动水平类', unit: '—', scope: 'global', showInTemplate: true, enumCount: 8, status: 'active', applyIndustry: [] },
    { id: 'P_stationary_factor', paramCode: 'PARAM_0007', name: '固定源的因子', format: 'number', paramType: '数值型', category: '活动水平类', unit: 'tCO₂e/t', decimalPlaces: 6, scope: 'global', showInTemplate: false, status: 'active', applyIndustry: [] },
    { id: 'P_clinker_output', paramCode: 'PARAM_0008', name: '水泥熟料产量', format: 'number', paramType: '数值型', category: '活动水平类', unit: 't', decimalPlaces: 2, scope: 'custom', showInTemplate: true, status: 'active', applyIndustry: ['建材'] },
    { id: 'P_carbon_data_year', paramCode: 'PARAM_0009', name: '碳数据年份', format: 'date', paramType: '日期型', category: '基础信息类', unit: '—', scope: 'global', showInTemplate: true, status: 'active', applyIndustry: [] },
    { id: 'P_fuel_variety', paramCode: 'PARAM_0010', name: '燃料品种', format: 'option', paramType: '选项型', category: '活动水平类', unit: '—', scope: 'global', showInTemplate: true, status: 'active', enumValues: ['烟煤', '褐煤', '无烟煤', '焦炭', '原油', '燃料油', '汽油', '柴油', '天然气', '液化石油气'], applyIndustry: [] },
    { id: 'P_fuel_amount', paramCode: 'PARAM_0011', name: '燃料消耗量', format: 'number', paramType: '数值型', category: '活动水平类', unit: 't', decimalPlaces: 4, scope: 'global', showInTemplate: true, status: 'active', applyIndustry: [] }
  ],

  templateVersions: [],

  templateDetails: {},
  _seedTemplateDetails: {},

  DEFAULT_INDUSTRY_METHODS: ['report', 'energy', 'product'],

  industries: [
    { key: '电力', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '水泥', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '平板玻璃', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '铜铅锌原煤开采', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '钢铁', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '石化', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '化工', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '民航', bizTypes: ['non_project', 'project'], methods: ['report', 'energy'] }
  ],

  templates: [
    { id: 'tpl_np_平板玻璃_energy', templateName: '建材-平板玻璃-能源法', industry: '建材', subCategory: '平板玻璃', bizType: 'non_project', methodId: 'energy', priority: 1, applyScene: ['entity', 'project_loan'], status: 'published', enabled: true, version: 'V1.0', fieldCount: 19, formulaCount: 5, updatedAt: '2026-06-24', updatedBy: '张明' },
    { id: 'tpl_np_铜铅锌原煤_energy', templateName: '有色-铜铅锌原煤开采-能源法', industry: '有色', subCategory: '铜铅锌原煤开采和洗选', bizType: 'non_project', methodId: 'energy', priority: 1, applyScene: ['entity'], status: 'published', enabled: true, version: 'V1.0', fieldCount: 21, formulaCount: 6, updatedAt: '2026-06-29', updatedBy: '张明', highlight: true },
    { id: 'tpl_np_电力_energy', templateName: '电力-能源法', industry: '电力', subCategory: '', bizType: 'non_project', methodId: 'energy', priority: 1, applyScene: ['entity'], status: 'published', enabled: true, version: 'V1.0', fieldCount: 18, formulaCount: 4, updatedAt: '2026-06-20', updatedBy: '王丽' },
    { id: 'tpl_np_电力_product', templateName: '电力-产品法', industry: '电力', subCategory: '', bizType: 'non_project', methodId: 'product', priority: 2, applyScene: ['entity'], status: 'published', enabled: true, version: 'V1.0', fieldCount: 12, formulaCount: 2, updatedAt: '2026-06-18', updatedBy: '王丽' },
    { id: 'tpl_np_水泥_energy', templateName: '建材-水泥-能源法', industry: '建材', subCategory: '水泥', bizType: 'non_project', methodId: 'energy', priority: 1, applyScene: ['entity'], status: 'published', enabled: false, version: 'V1.0', fieldCount: 16, formulaCount: 3, updatedAt: '2026-06-15', updatedBy: '李强' },
    { id: 'tpl_p_电力_energy', templateName: '电力-能源法（项目贷款）', industry: '电力', subCategory: '', bizType: 'project', methodId: 'energy', priority: 1, applyScene: ['project_loan'], status: 'draft', enabled: true, version: '—', fieldCount: 17, formulaCount: 4, updatedAt: '2026-06-24', updatedBy: '张明' },
    { id: 'tpl_np_钢铁_energy', templateName: '钢铁-能源法', industry: '钢铁', subCategory: '', bizType: 'non_project', methodId: 'energy', priority: 1, applyScene: ['entity'], status: 'draft', enabled: true, version: '—', fieldCount: 8, formulaCount: 0, updatedAt: '2026-06-22', updatedBy: '陈静' }
  ],

  STORAGE_KEY: 'huaxia_method_config_demo',

  init() {
    this._registerSeedTemplate(window.METHOD_CONFIG_FLAT_GLASS);
    this._registerSeedTemplate(window.METHOD_CONFIG_MINING_ENERGY);
    this.loadPersisted();
  },

  _registerSeedTemplate(seed) {
    if (!seed?.templateId) return;
    const detail = JSON.parse(JSON.stringify(seed));
    this._seedTemplateDetails[detail.templateId] = detail;
    this.templateDetails[detail.templateId] = JSON.parse(JSON.stringify(detail));
    (detail.params || []).forEach(p => {
      if (!this.params.some(x => x.id === p.id)) {
        this.params.push({ ...p, enumCount: p.enumValues?.length || p.enumCount });
      }
    });
  },

  _readStorage() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : { customParams: [], paramOverrides: {}, templateDetails: {}, templates: [] };
    } catch {
      return { customParams: [], paramOverrides: {}, templateDetails: {}, templates: [] };
    }
  },

  _writeStorage(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  _today() {
    return new Date().toISOString().slice(0, 10);
  },

  _currentOperator() {
    if (typeof Store === 'undefined') return '—';
    const u = Store.get()?.currentUser;
    return (typeof u === 'string' ? u : u?.name) || '—';
  },

  loadPersisted() {
    const data = this._readStorage();
    Object.entries(data.paramOverrides || {}).forEach(([id, patch]) => {
      const i = this.params.findIndex(p => p.id === id);
      if (i >= 0) this.params[i] = { ...this.params[i], ...patch, id };
    });
    (data.customParams || []).forEach(p => {
      if (!this.params.some(x => x.id === p.id)) {
        this.params.push(this.normalizeParam({ ...p, enumCount: p.enumValues?.length || p.enumCount }));
      }
    });
    Object.entries(data.templateDetails || {}).forEach(([id, detail]) => {
      this.templateDetails[id] = detail;
    });
    (data.templates || []).forEach(t => {
      const i = this.templates.findIndex(x => x.id === t.id);
      if (i >= 0) this.templates[i] = { ...this.templates[i], ...t };
      else this.templates.push(t);
    });
    this.templateVersions = data.templateVersions || this.templateVersions || [];
    this.params = this.params.map(p => this.normalizeParam(p));
    (data.customParams || []).forEach(p => {
      const i = this.params.findIndex(x => x.id === p.id);
      const norm = this.normalizeParam({ ...p, enumCount: p.enumValues?.length || p.enumCount });
      if (i >= 0) this.params[i] = { ...this.params[i], ...norm };
    });
    (data.customIndustries || []).forEach(ind => {
      if (!this.industries.some(i => i.key === ind.key)) {
        this.industries.push({
          key: ind.key,
          bizTypes: ind.bizTypes || ['non_project', 'project'],
          methods: ind.methods || this.DEFAULT_INDUSTRY_METHODS.slice(),
          custom: true
        });
      }
    });
    const deleted = new Set(data.deletedParamIds || []);
    if (deleted.size) {
      this.params = this.params.filter(p => !deleted.has(p.id));
    }
  },

  paramTypeFromFormat(format) {
    return { number: '数值型', text: '文本型', option: '选项型', date: '日期型', attachment: '附件型' }[format] || '数值型';
  },

  formatFromParamType(paramType) {
    return { '数值型': 'number', '文本型': 'text', '选项型': 'option', '日期型': 'date', '附件型': 'attachment' }[paramType] || 'number';
  },

  normalizeParam(p) {
    if (!p) return p;
    const format = p.format || this.formatFromParamType(p.paramType);
    const paramType = p.paramType || this.paramTypeFromFormat(format);
    const category = p.category || (p.id === 'P_ghg_total' ? '结果计算类' : '活动水平类');
    const units = this.normalizeUnitsList(p.units ?? p.unit);
    return {
      ...p,
      format,
      paramType,
      category,
      paramCode: p.paramCode || p.id,
      status: p.status || 'active',
      applyIndustry: Array.isArray(p.applyIndustry) ? p.applyIndustry : (p.applyIndustry ? [p.applyIndustry] : []),
      remark: p.remark ?? p.description ?? '',
      validateRule: p.validateRule || { min: 0, decimalPlaces: p.decimalPlaces ?? 4 },
      units,
      unit: units.length ? units[0] : (p.unit || '—')
    };
  },

  parseUnitsInput(raw) {
    if (raw == null || raw === '') return [];
    if (Array.isArray(raw)) return raw.map(u => String(u).trim()).filter(Boolean);
    return String(raw).split(/[,，、/|]/).map(s => s.trim()).filter(Boolean);
  },

  normalizeUnitsList(raw) {
    if (raw === '无单位') return [];
    if (raw === '—') return ['—'];
    const list = this.parseUnitsInput(raw);
    return [...new Set(list)];
  },

  getParamUnits(param) {
    if (!param) return [];
    if (Array.isArray(param.units) && param.units.length) return param.units.filter(Boolean);
    return this.normalizeUnitsList(param.unit);
  },

  paramUnitsDisplay(param) {
    if (!param) return '—';
    if (param.unitType === 'none' || param.unit === '无单位') return '无单位';
    const units = this.getParamUnits(param);
    if (!units.length) return param.unit || '—';
    return units.join(' / ');
  },

  paramPrimaryUnit(param) {
    const units = this.getParamUnits(param);
    return units[0] || param?.unit || '';
  },

  readParamUnitsFromForm(fd, unitType) {
    if (unitType === 'none') return [];
    const checked = fd.getAll('paramUnits').map(v => String(v).trim()).filter(Boolean);
    const extra = this.parseUnitsInput(fd.get('paramUnitsExtra'));
    return [...new Set([...checked, ...extra])];
  },

  applyParamUnits(payload, units, unitType) {
    if (unitType === 'none') {
      payload.units = [];
      payload.unit = '无单位';
      return;
    }
    const cleaned = [...new Set((units || []).map(u => String(u).trim()).filter(Boolean))];
    payload.units = cleaned;
    payload.unit = cleaned[0] || '—';
  },

  assessParamUnitConversion(param, factorUnitFull) {
    const units = this.getParamUnits(param);
    if (!units.length) return this.assessUnitConversion(param?.unit, factorUnitFull);
    let best = null;
    units.forEach(u => {
      const assess = this.assessUnitConversion(u, factorUnitFull);
      if (assess.match) best = assess;
      else if (!best) best = assess;
      else if (!best.match && assess.match) best = assess;
    });
    return best || this.assessUnitConversion(units[0], factorUnitFull);
  },

  generateParamCode() {
    const codes = new Set(this.params.map(p => p.paramCode || p.id));
    let n = 1;
    while (codes.has(`PARAM_${String(n).padStart(4, '0')}`)) n += 1;
    return `PARAM_${String(n).padStart(4, '0')}`;
  },

  isBuiltinResultParam(id) {
    return this.BUILTIN_RESULT_PARAM_IDS.includes(id) || this.getParam(id)?.builtin || this.getParam(id)?.category === '结果计算类' && this.getParam(id)?.scope !== 'custom';
  },

  filterParams(filters = {}) {
    const kw = (filters.keyword || '').trim().toLowerCase();
    const category = filters.category || '';
    const industry = filters.industry || '';
    const status = filters.status || '';
    return this.listParams().filter(p => {
      if (kw && !(`${p.paramCode || ''} ${p.id} ${p.name}`).toLowerCase().includes(kw)) return false;
      if (category && p.category !== category) return false;
      if (status && p.status !== status) return false;
      if (industry && (p.applyIndustry || []).length && !(p.applyIndustry || []).includes(industry)) return false;
      return true;
    });
  },

  listParams() {
    return this.params.slice().sort((a, b) => a.id.localeCompare(b.id));
  },

  readParamForm(form) {
    const fd = new FormData(form);
    const paramType = (fd.get('paramType') || '数值型').toString();
    const format = this.formatFromParamType(paramType);
    const enumRaw = (fd.get('enumValues') || '').toString().trim();
    const enumValues = enumRaw ? enumRaw.split(/\n/).map(s => s.trim()).filter(Boolean) : undefined;
    const applyRaw = fd.getAll('applyIndustry');
    const applyIndustry = applyRaw.filter(Boolean);
    const minVal = fd.get('validateMin');
    const payload = {
      id: (fd.get('id') || '').toString().trim(),
      paramCode: (fd.get('paramCode') || '').toString().trim(),
      name: (fd.get('name') || '').toString().trim(),
      paramType,
      format,
      category: (fd.get('category') || '活动水平类').toString(),
      status: (fd.get('status') || 'active').toString(),
      applyIndustry,
      remark: (fd.get('remark') || '').toString().trim(),
      description: (fd.get('remark') || '').toString().trim(),
      scope: 'custom',
      showInTemplate: fd.get('showInTemplate') !== '0',
      validateRule: {
        min: minVal === '' || minVal == null ? 0 : Number(minVal),
        decimalPlaces: Number(fd.get('decimalPlaces')) || 4
      }
    };
    if (format === 'text') {
      payload.textMode = fd.get('textMode') || 'single';
      payload.maxLength = Number(fd.get('maxLength')) || 200;
      payload.unit = '—';
    } else if (format === 'number') {
      const unitType = fd.get('numberUnitType') || 'common';
      const units = this.readParamUnitsFromForm(fd, unitType);
      payload.decimalPlaces = Number(fd.get('decimalPlaces')) || 4;
      payload.unitType = unitType;
      this.applyParamUnits(payload, units, unitType);
    } else if (format === 'option') {
      const unitType = fd.get('optionUnitType') || 'common';
      const units = this.readParamUnitsFromForm(fd, unitType);
      payload.enumValues = enumValues;
      payload.enumCount = enumValues?.length;
      payload.hasDefault = fd.get('hasDefault') === '1';
      payload.defaultValue = (fd.get('defaultValue') || '').toString().trim();
      payload.unitType = unitType;
      this.applyParamUnits(payload, units, unitType);
    } else if (format === 'date') {
      payload.unit = '—';
    } else if (format === 'attachment') {
      payload.unit = '—';
      payload.attachAccept = (fd.get('attachAccept') || '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpeg,.jpg').toString().trim();
      payload.attachMaxCount = Math.min(20, Math.max(1, Number(fd.get('attachMaxCount')) || 3));
      payload.attachMaxMb = Math.min(2048, Math.max(1, Number(fd.get('attachMaxMb')) || 20));
    }
    return payload;
  },

  formatFactorLibraryOption(f) {
    if (!f) {
      return { detailLabel: '-', valueText: '-', unit: '', displayLabel: '-', searchText: '' };
    }
    const detailLabel = typeof factorItemDetailLabel === 'function'
      ? factorItemDetailLabel(f)
      : (f.name || f.paramName || f.id || '-');
    const valueText = typeof formatFactorValue === 'function'
      ? formatFactorValue(f)
      : String(f.value ?? f.factorValue ?? '-');
    const unit = (f.unit || f.factorUnit || '').trim();
    const valueUnit = unit && unit !== '—' ? `${valueText} · ${unit}` : valueText;
    const displayLabel = `${detailLabel} · ${valueUnit}`.replace(/\s·\s-$/, '').trim();
    const searchText = `${detailLabel} ${f.id || ''} ${valueText} ${unit}`.toLowerCase();
    return { detailLabel, valueText, unit, displayLabel, searchText };
  },

  getFactorLibraryOptions() {
    if (typeof Store === 'undefined') return [];
    return (Store.get()?.factors || []).map(f => {
      const fmt = this.formatFactorLibraryOption(f);
      return {
        id: f.id,
        name: fmt.detailLabel,
        detailLabel: fmt.detailLabel,
        value: f.value ?? f.factorValue ?? '',
        valueText: fmt.valueText,
        unit: fmt.unit,
        displayLabel: fmt.displayLabel,
        searchText: fmt.searchText
      };
    });
  },

  UNIT_ALIAS_MAP: {
    '吨': 't', t: 't', T: 't',
    '千克': 'kg', '公斤': 'kg', kg: 'kg', KG: 'kg',
    '万m³': '万m³', '万m3': '万m³', '104nm³': '万m³', '104nm3': '万m³',
    'm³': 'm³', m3: 'm³',
    '兆瓦时': 'MWh', MWh: 'MWh', mwh: 'MWh', 'kWh': 'kWh', kwh: 'kWh',
    GJ: 'GJ', gj: 'GJ',
    '万元': '万元'
  },

  UNIT_CONVERSION_PRESETS: [
    { from: 't', to: 'kg', factor: 1000, label: '1 t = 1000 kg' },
    { from: 'kg', to: 't', factor: 0.001, label: '1 kg = 0.001 t' },
    { from: '万m³', to: 'm³', factor: 10000, label: '1 万m³ = 10000 m³' },
    { from: 'm³', to: '万m³', factor: 0.0001, label: '1 m³ = 0.0001 万m³' },
    { from: 'MWh', to: 'kWh', factor: 1000, label: '1 MWh = 1000 kWh' },
    { from: 'kWh', to: 'MWh', factor: 0.001, label: '1 kWh = 0.001 MWh' }
  ],

  normalizeUnit(unit) {
    const raw = (unit || '').toString().trim();
    if (!raw || raw === '—' || raw === '-') return '';
    return this.UNIT_ALIAS_MAP[raw] || raw;
  },

  parseFactorDenominatorUnit(factorUnit) {
    const s = (factorUnit || '').toString().trim();
    if (!s) return '';
    const idx = s.lastIndexOf('/');
    const denom = idx >= 0 ? s.slice(idx + 1).trim() : s;
    return this.normalizeUnit(denom) || denom;
  },

  getFactorUnitFromLibrary(factorId) {
    if (!factorId || typeof Store === 'undefined') return '';
    const f = Store.getFactor(factorId);
    return f?.unit || f?.factorUnit || '';
  },

  findUnitConversionPreset(fromUnit, toUnit) {
    const from = this.normalizeUnit(fromUnit);
    const to = this.normalizeUnit(toUnit);
    if (!from || !to) return null;
    if (from === to) return { factor: 1, label: '单位一致，无需换算' };
    return this.UNIT_CONVERSION_PRESETS.find(p => p.from === from && p.to === to) || null;
  },

  assessUnitConversion(activityUnit, factorUnitFull) {
    const activity = this.normalizeUnit(activityUnit) || (activityUnit || '').trim();
    const factorDenom = this.parseFactorDenominatorUnit(factorUnitFull);
    const match = !!(activity && factorDenom && activity === factorDenom);
    const preset = !match && activity && factorDenom
      ? this.findUnitConversionPreset(activity, factorDenom)
      : null;
    const presets = this.UNIT_CONVERSION_PRESETS.filter(p =>
      p.from === activity || p.to === factorDenom
    );
    return {
      activityUnit: activity || activityUnit || '—',
      factorUnitFull: factorUnitFull || '—',
      factorDenominator: factorDenom || '—',
      match,
      needsConversion: !!(activity && factorDenom && !match),
      suggestedFactor: preset?.factor ?? '',
      suggestedLabel: preset?.label ?? '',
      presets: preset ? [preset, ...presets.filter(p => p.label !== preset.label)] : presets
    };
  },

  stripConversionFromExpr(expr, fieldId) {
    if (!expr || !fieldId) return expr || '';
    const paramRef = `{${fieldId}}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return String(expr).replace(new RegExp(`${paramRef}\\*([\\d.]+(?:e[-+]?\\d+)?)(?=\\*)`, 'i'), `{${fieldId}}`);
  },

  applyConversionFactorToExpr(expr, fieldId, conversionFactor) {
    const cf = Number(conversionFactor);
    let s = this.stripConversionFromExpr(expr || '', fieldId);
    if (!fieldId || !s || !cf || cf === 1) return s;
    const paramRef = `{${fieldId}}`;
    if (!s.includes(paramRef)) return s;
    return s.replace(paramRef, `${paramRef}*${cf}`);
  },

  formulasUsingFactorRef(formulas, refKey) {
    if (!refKey) return [];
    const key = refKey.replace(/^\{|\}$/g, '');
    return (formulas || []).filter(f => (f.expression || '').includes(`{${key}}`));
  },

  saveParam(payload, isNew) {
    if (!payload.name) return { ok: false, message: '参数名称必填' };
    if (payload.category === '结果计算类' && isNew) {
      return { ok: false, message: '结果计算类为系统内置，不支持手动新增' };
    }
    if (payload.format === 'option' && !(payload.enumValues || []).length) {
      return { ok: false, message: '选项型请填写至少一个枚举值' };
    }
    if (payload.format === 'number' && payload.unitType !== 'none' && !(payload.units || []).length) {
      return { ok: false, message: '数值型参数请至少选择一个单位' };
    }
    if (payload.format === 'option' && payload.unitType !== 'none' && !(payload.units || []).length) {
      return { ok: false, message: '选项型参数请至少选择一个单位' };
    }
    if (payload.format === 'attachment' && !(payload.attachAccept || '').trim()) {
      return { ok: false, message: '附件型请填写允许的文件格式' };
    }
    const dupName = this.params.find(p => p.name === payload.name && p.id !== payload.id);
    if (dupName) return { ok: false, message: '已存在同名参数，请避免重复创建同义参数' };
    if (isNew) {
      payload.paramCode = payload.paramCode || this.generateParamCode();
      payload.id = payload.id || `P_${payload.paramCode.replace(/^PARAM_/, '')}`;
      if (this.params.some(p => p.id === payload.id || p.paramCode === payload.paramCode)) {
        return { ok: false, message: '参数编码已存在' };
      }
    } else if (!payload.id) {
      return { ok: false, message: '参数编码缺失' };
    }
    if (isNew && this.params.some(p => p.id === payload.id)) {
      return { ok: false, message: '参数 ID 已存在' };
    }
    const existing = !isNew ? this.params.find(p => p.id === payload.id) : null;
    if (existing?.builtin) {
      payload.category = existing.category;
      payload.status = existing.status;
      payload.paramType = existing.paramType;
      payload.format = existing.format;
      payload.builtin = true;
    }
    const data = this._readStorage();
    if (isNew) {
      data.customParams = data.customParams || [];
      data.customParams.push(payload);
      this.params.push(payload);
    } else {
      data.paramOverrides = data.paramOverrides || {};
      data.paramOverrides[payload.id] = payload;
      const i = this.params.findIndex(p => p.id === payload.id);
      if (i >= 0) this.params[i] = { ...this.params[i], ...payload };
    }
    this._writeStorage(data);
    return { ok: true, message: isNew ? '已新增参数' : '已保存参数' };
  },

  /** CSV 列：参数名称, 参数分类, 参数类型, 单位, 适用行业, 小数位数, 枚举值（选项型） */
  importParamsFromCsv(text) {
    let added = 0;
    let skipped = 0;
    const errors = [];
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { added, skipped, errors: ['未解析到可导入数据'] };
    const parseLine = typeof parseFactorImportCsvLine === 'function'
      ? parseFactorImportCsvLine
      : (line) => {
        const out = [];
        let cur = '';
        let quoted = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') { quoted = !quoted; continue; }
          if (ch === ',' && !quoted) { out.push(cur); cur = ''; continue; }
          cur += ch;
        }
        out.push(cur);
        return out.map(s => s.trim());
      };
    for (let li = 1; li < lines.length; li++) {
      const cells = parseLine(lines[li]);
      if (!cells.some(c => c)) continue;
      const name = (cells[0] || '').trim();
      if (!name) {
        errors.push(`第 ${li + 1} 行：参数名称不能为空`);
        continue;
      }
      const category = (cells[1] || '活动水平类').trim();
      if (category === '结果计算类') {
        errors.push(`第 ${li + 1} 行：不支持导入结果计算类参数`);
        continue;
      }
      const paramType = (cells[2] || '数值型').trim();
      const format = this.formatFromParamType(paramType);
      const unitRaw = (cells[3] || '').trim();
      const applyIndustry = this.parseUnitsInput(cells[4] || '');
      const decimalPlaces = Number(cells[5]) || 4;
      const enumValues = format === 'option' ? this.parseUnitsInput(cells[6] || '') : [];
      const needsUnit = format === 'number' || format === 'option';
      const unitType = !needsUnit || !unitRaw || unitRaw === '无单位' || unitRaw === '—'
        ? (needsUnit ? 'common' : 'none')
        : 'common';
      const units = unitType === 'none' ? [] : (unitRaw ? [unitRaw] : (needsUnit ? ['t'] : []));
      const payload = {
        name,
        category,
        paramType,
        format,
        unitType,
        decimalPlaces,
        validateRule: { min: 0, decimalPlaces },
        scope: 'custom',
        showInTemplate: true,
        status: 'active',
        applyIndustry,
        enumValues: format === 'option' ? enumValues : undefined,
        attachAccept: format === 'attachment' ? '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg' : undefined
      };
      this.applyParamUnits(payload, units, unitType);
      const result = this.saveParam(payload, true);
      if (result.ok) added += 1;
      else if ((result.message || '').includes('同名') || (result.message || '').includes('已存在')) skipped += 1;
      else errors.push(`第 ${li + 1} 行：${result.message}`);
    }
    return { added, skipped, errors };
  },

  toggleParamStatus(paramId) {
    const p = this.params.find(x => x.id === paramId);
    if (!p) return { ok: false, message: '参数不存在' };
    if (p.builtin || this.BUILTIN_RESULT_PARAM_IDS.includes(p.id)) {
      return { ok: false, message: '系统内置参数不可停用' };
    }
    p.status = p.status === 'inactive' ? 'active' : 'inactive';
    const data = this._readStorage();
    if ((data.customParams || []).some(x => x.id === paramId)) {
      data.customParams = (data.customParams || []).map(x => x.id === paramId ? { ...x, status: p.status } : x);
    } else {
      data.paramOverrides = data.paramOverrides || {};
      data.paramOverrides[paramId] = { ...(data.paramOverrides[paramId] || {}), status: p.status };
    }
    this._writeStorage(data);
    return { ok: true, message: p.status === 'active' ? '已启用参数' : '已停用参数' };
  },

  formatTemplateLabel(meta, tplId) {
    const m = meta || {};
    if (m.templateName) return m.templateName;
    const industry = m.industry || tplId || '—';
    const sub = m.subCategory ? `-${m.subCategory}` : '';
    const method = this.methodLabel(m.methodId || '');
    const status = m.status === 'published' ? '已发布' : '草稿';
    return `${industry}${sub}-${method}（${status}）`;
  },

  /** 查找引用某参数的方法模板（Step1 选用 / 公式 / 因子依赖 / 布局） */
  getParamReferences(paramId) {
    if (!paramId) return [];
    const refs = [];
    const seen = new Set();
    const tplMetas = this.templates.slice();
    Object.keys(this.templateDetails || {}).forEach(id => {
      if (!tplMetas.some(t => t.id === id)) tplMetas.push({ id });
    });

    tplMetas.forEach(tplMeta => {
      const tplId = tplMeta.id;
      if (!tplId || seen.has(tplId)) return;
      const detail = this.getTemplateDetail(tplId);
      if (!detail) return;
      seen.add(tplId);

      const reasons = [];
      if ((detail.params || []).some(p => p.id === paramId)) {
        reasons.push('Step1 已选用');
      }
      if ((detail.layout || []).some(sec => (sec.fields || []).includes(paramId))) {
        reasons.push('采集分区布局');
      }
      (detail.formulas || []).forEach(f => {
        const expr = f.expression || '';
        if (expr.includes(`{${paramId}}`) || expr.includes(`LOOKUP({${paramId}}`)) {
          reasons.push(`公式 ${f.id}${f.name ? `「${f.name}」` : ''}`);
        }
      });
      (detail.factorBindings || []).forEach(b => {
        const dep = b.dependsOn || '';
        if (dep === paramId || dep.split(/[,，\s]+/).includes(paramId)) {
          reasons.push(`因子 {${b.refKey || b.label || '—'}} 依赖`);
        }
      });

      if (reasons.length) {
        refs.push({
          id: tplId,
          label: this.formatTemplateLabel({ ...detail.meta, ...tplMeta }, tplId),
          reasons: [...new Set(reasons)]
        });
      }
    });
    return refs;
  },

  deleteParam(paramId) {
    const id = String(paramId || '').trim();
    if (!id) return { ok: false, message: '参数 ID 无效' };
    if (!this.params.some(p => p.id === id)) {
      return { ok: false, message: '参数不存在或已删除' };
    }

    const references = this.getParamReferences(id);
    if (references.length) {
      const lines = references.map(r => `· ${r.label}：${r.reasons.join('、')}`);
      return {
        ok: false,
        message: `无法删除：参数 ${id} 正在被以下方法模板引用：\n\n${lines.join('\n')}\n\n请先从对应模板中移除该参数后再删除。`,
        references
      };
    }

    const data = this._readStorage();
    const isCustom = (data.customParams || []).some(p => p.id === id);
    if (isCustom) {
      data.customParams = (data.customParams || []).filter(p => p.id !== id);
    } else {
      data.deletedParamIds = data.deletedParamIds || [];
      if (!data.deletedParamIds.includes(id)) data.deletedParamIds.push(id);
    }
    if (data.paramOverrides?.[id]) delete data.paramOverrides[id];
    this.params = this.params.filter(p => p.id !== id);
    this._writeStorage(data);
    return { ok: true, message: `已删除参数 ${id}` };
  },

  resetDemoConfig() {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  getTemplateDetail(id) {
    if (this.templateDetails[id]) return this.templateDetails[id];
    if (this._seedTemplateDetails[id]) return JSON.parse(JSON.stringify(this._seedTemplateDetails[id]));
    return null;
  },

  makeTemplateId(industry, bizType, methodId) {
    const prefix = bizType === 'project' ? 'p' : 'np';
    return `tpl_${prefix}_${industry}_${methodId}`;
  },

  getIndustryConfig(industryKey) {
    return this.industries.find(i => i.key === industryKey) || null;
  },

  ensureIndustry(name) {
    const key = String(name || '').trim();
    if (!key) return { ok: false, message: '行业名称不能为空' };
    const existing = this.getIndustryConfig(key);
    if (existing) return { ok: true, industry: existing };
    const industry = {
      key,
      bizTypes: ['non_project', 'project'],
      methods: this.DEFAULT_INDUSTRY_METHODS.slice(),
      custom: true
    };
    this.industries.push(industry);
    const data = this._readStorage();
    data.customIndustries = data.customIndustries || [];
    if (!data.customIndustries.some(i => i.key === key)) {
      data.customIndustries.push(industry);
      this._writeStorage(data);
    }
    return { ok: true, industry };
  },

  findTemplateMeta(industry, bizType, methodId) {
    const id = this.makeTemplateId(industry, bizType, methodId);
    return this.templates.find(t => t.id === id) || null;
  },

  /** 新建核算模板（对齐需规 Tab1 基础信息） */
  createTemplate({ templateName, industry, subCategory, methodId, priority, applyScene, description, copyFromId, isNewIndustry, bizType }) {
    const ensured = isNewIndustry ? this.ensureIndustry(industry) : { ok: true, industry: this.getIndustryConfig(industry) || { key: industry, methods: this.DEFAULT_INDUSTRY_METHODS.slice() } };
    if (!ensured.ok) return ensured;
    const ind = ensured.industry;
    if (!industry) return { ok: false, message: '请选择有效行业' };
    const scenes = Array.isArray(applyScene) ? applyScene : ['entity', 'project_loan'];
    if (!scenes.length) return { ok: false, message: '请至少选择一个适用场景' };
    const resolvedBiz = bizType || (scenes.includes('project_loan') && !scenes.includes('entity') ? 'project' : 'non_project');
    if (!ind.methods.includes(methodId)) {
      return { ok: false, message: `${industry} 不支持该核算方法` };
    }
    const id = this.makeTemplateId(industry, resolvedBiz, methodId);
    const meta = this.templates.find(t => t.id === id);
    if (meta) {
      return { ok: false, message: '该行业·核算方法·适用场景组合已有模板，请直接编辑', id };
    }

    let detail;
    if (copyFromId) {
      detail = this.copyTemplateDetail(copyFromId, id, industry, resolvedBiz, methodId);
      if (!detail) return { ok: false, message: '复制来源模板不存在' };
    } else {
      detail = this.createEmptyTemplate(id, industry, resolvedBiz, methodId);
    }
    detail.meta.templateName = templateName || detail.meta.templateName;
    detail.meta.subCategory = subCategory || '';
    detail.meta.priority = Number(priority) || 3;
    detail.meta.applyScene = scenes;
    detail.meta.description = (description || '').trim();
    return this.saveTemplateDetail(detail);
  },

  createEmptyTemplate(id, industry, bizType, methodId) {
    const methodName = this.methodLabel(methodId);
    const sub = '';
    return {
      templateId: id,
      meta: {
        id,
        templateName: `${industry}${sub ? `-${sub}` : ''}-${methodName}`,
        industry,
        subCategory: sub,
        bizType,
        methodId,
        priority: 3,
        applyScene: bizType === 'project' ? ['project_loan'] : ['entity'],
        description: '',
        status: 'draft',
        enabled: true,
        version: '—',
        fieldCount: 0,
        formulaCount: 0,
        updatedAt: this._today(),
        gbCodes: [],
        dataSourceCollect: '',
        dataSourceFactor: '',
        entityFormulaSummary: ''
      },
      params: [],
      layout: [{ title: '默认分区', fields: [] }],
      formulas: [
        { id: 'F1', sort: 1, name: '主体排放合计', expression: '', emissionUnit: 'tCO₂e', isEntityTotal: true }
      ],
      factorBindings: []
    };
  },

  normalizeTemplateEditStep(step) {
    const s = String(step || '1');
    if (s === '3' || s === '4' || s === '5') return '3';
    return s === '2' ? '2' : '1';
  },

  resolveTemplateForEdit(query) {
    const q = query || new URLSearchParams((location.hash.split('?')[1] || ''));
    let id = q.get('id');
    const industry = q.get('industry') || '电力';
    const bizType = q.get('bizType') || 'non_project';
    const methodId = q.get('methodId') || 'energy';

    if (!id) {
      id = this.makeTemplateId(industry, bizType, methodId);
    }

    let detail = this.getTemplateDetail(id);
    if (!detail) {
      const tplMeta = this.templates.find(t => t.id === id);
      detail = this.createEmptyTemplate(
        id,
        tplMeta?.industry || industry,
        tplMeta?.bizType || bizType,
        tplMeta?.methodId || methodId
      );
    } else {
      detail = JSON.parse(JSON.stringify(detail));
    }

    let tpl = this.templates.find(t => t.id === id);
    if (!tpl) {
      tpl = {
        id,
        industry: detail.meta.industry,
        bizType: detail.meta.bizType,
        methodId: detail.meta.methodId,
        status: detail.meta.status || 'draft',
        version: detail.meta.version || '—',
        fieldCount: detail.params?.length || 0,
        formulaCount: detail.formulas?.length || 0,
        updatedAt: detail.meta.updatedAt || this._today()
      };
    } else {
      detail.meta = {
        ...detail.meta,
        templateName: detail.meta.templateName || tpl.templateName,
        subCategory: detail.meta.subCategory ?? tpl.subCategory,
        priority: detail.meta.priority ?? tpl.priority,
        applyScene: detail.meta.applyScene || tpl.applyScene,
        enabled: detail.meta.enabled ?? tpl.enabled
      };
    }

    return { id, tpl, detail };
  },

  copyTemplateDetail(fromId, toId, industry, bizType, methodId) {
    const src = this.getTemplateDetail(fromId);
    if (!src) return null;
    const copy = JSON.parse(JSON.stringify(src));
    copy.templateId = toId;
    copy.meta = {
      ...copy.meta,
      id: toId,
      industry,
      bizType,
      methodId,
      status: 'draft',
      version: '—',
      updatedAt: this._today()
    };
    if (copy.designGaps) delete copy.designGaps;
    return copy;
  },

  buildLayoutFromParams(params) {
    const sections = new Map();
    (params || []).forEach(p => {
      const sec = p.section || '默认分区';
      if (!sections.has(sec)) sections.set(sec, []);
      sections.get(sec).push(p.id);
    });
    return [...sections.entries()].map(([title, fields]) => ({ type: 'fixed', title, fields }));
  },

  ensureDetailLayout(detail) {
    let layout;
    if ((detail?.layout || []).length) layout = detail.layout;
    else if ((detail?.params || []).length) layout = this.buildLayoutFromParams(detail.params);
    else layout = [{ type: 'partition', title: '默认分区', sections: [{ type: 'fixed', fields: [] }] }];
    return this.normalizeLayoutBlocks(layout);
  },

  normalizeSection(section) {
    if (!section) return { type: 'fixed', fields: [] };
    if (section.type === 'dynamic_row') {
      return this.normalizeDynamicBlock({ ...section, type: 'dynamic_row' });
    }
    return {
      type: 'fixed',
      fields: section.fields || [],
      emissionSources: section.emissionSources
    };
  },

  legacyBlockToPartition(block) {
    const type = block?.type || (block?.pairs ? 'repeatable_pair' : 'fixed');
    if (type === 'repeatable_pair') {
      const fields = [];
      (block.pairs || []).forEach(pair => {
        if (pair.typeField) fields.push(pair.typeField);
        if (pair.amountField) fields.push(pair.amountField);
      });
      return {
        type: 'partition',
        title: block.title || '未命名分区',
        requiredGroup: !!block.requiredGroup,
        sections: [{ type: 'fixed', fields }]
      };
    }
    if (type === 'dynamic_row') {
      const { title, requiredGroup, ...rest } = block;
      return {
        type: 'partition',
        title: title || '未命名分区',
        requiredGroup: !!requiredGroup,
        sections: [this.normalizeDynamicBlock({ ...rest, type: 'dynamic_row' })]
      };
    }
    return {
      type: 'partition',
      title: block.title || '未命名分区',
      requiredGroup: !!block.requiredGroup,
      sections: [{
        type: 'fixed',
        fields: block.fields || [],
        emissionSources: block.emissionSources
      }]
    };
  },

  /** 将历史 flat block 统一为 partition；partition 内可含 fixed + dynamic_row 多个 section */
  normalizeLayoutBlocks(layout) {
    return (layout || []).map(item => {
      if (item?.type === 'partition') {
        return {
          type: 'partition',
          title: item.title || '未命名分区',
          requiredGroup: !!item.requiredGroup,
          sections: (item.sections || []).map(s => this.normalizeSection(s))
        };
      }
      return this.legacyBlockToPartition(item);
    });
  },

  iterLayoutSections(layout, fn) {
    (layout || []).forEach((item, pIndex) => {
      if (item?.type === 'partition') {
        (item.sections || []).forEach((section, sIndex) => fn(section, item, pIndex, sIndex));
      } else {
        fn(item, item, pIndex, 0);
      }
    });
  },

  humanizePartitionFormula(partition, detail, pIndex = 0) {
    const parts = (partition.sections || []).map((s, sIndex) =>
      this.humanizeSectionFormula(s, detail, pIndex, sIndex)
    );
    return parts.filter(p => p && p !== '—').join(' + ') || '—';
  },

  humanizeSectionFormula(section, detail, pIndex, sIndex) {
    if (section.type === 'dynamic_row') {
      const rowCount = (section.presetRows || []).length;
      if (!rowCount) return '动态行：请先同步品种行';
      const formulaRefKey = `dyn_formula_${pIndex}-${sIndex}`;
      const amountId = section.amountParamId || '';
      const varietyId = section.varietyParamId || '';
      const fb = this.getBindingByRefKey(detail, formulaRefKey);
      let rowFormula = '消耗量 × 因子';
      if (fb?.formulaExpression && amountId) {
        const ctx = this.patchDynamicFormulaContext(this.buildInlineFormulaContext(
          amountId,
          [amountId, varietyId].filter(Boolean),
          formulaRefKey,
          detail,
          [amountId]
        ));
        rowFormula = this.expressionToDisplayFormula(fb.formulaExpression, ctx) || rowFormula;
      }
      return `Σ${rowCount}行（${rowFormula}）`;
    }
    return this.humanizeBlockFormula(section, detail);
  },

  buildPartitionFormulaParts(partition, detail) {
    const parts = [];
    (partition.sections || []).forEach(section => {
      if (section.type === 'dynamic_row') {
        const blockKey = (partition.title || 'dynamic').replace(/\s+/g, '_');
        parts.push(`SUM_ROWS({{block_${blockKey}_dynamic}})`);
        return;
      }
      parts.push(...this.buildFixedBlockFormulaParts(section, detail));
    });
    return parts;
  },

  ensureEmissionSources(block) {
    const blockFields = block?.fields || [];
    if (block?.emissionSources?.length) {
      return block.emissionSources
        .map(s => ({
          id: s.id || `es_${(s.fields || [])[0] || 'x'}`,
          fields: (s.fields || []).filter(fid => blockFields.includes(fid)),
          saved: s.saved !== false
        }))
        .filter(s => s.fields.length);
    }
    const sources = [];
    const used = new Set();
    blockFields.forEach(fid => {
      if (used.has(fid)) return;
      const p = this.getParam(fid);
      if (!this.fieldNeedsFactorBinding(fid, blockFields, p)) return;
      if (blockFields.includes('P_grid_region') && fid === 'P_purchased_electricity') {
        used.add(fid);
        used.add('P_grid_region');
        sources.push({ id: `es_${fid}`, fields: [fid] });
        return;
      }
      if (fid === 'P_grid_region') return;
      if (p && this.fieldIsOptionType(p)) {
        const amountId = this.matchAmountFieldForType(fid, blockFields);
        if (amountId) {
          used.add(fid);
          used.add(amountId);
          sources.push({ id: `es_${amountId}`, fields: [amountId] });
          return;
        }
      }
      used.add(fid);
      sources.push({ id: `es_${fid}`, fields: [fid] });
    });
    return sources;
  },

  primaryFieldForSource(source, blockFields) {
    const fields = source?.fields || [];
    for (const fid of fields) {
      const p = this.getParam(fid);
      if (this.fieldNeedsFactorBinding(fid, blockFields || fields, p)) return fid;
    }
    return fields[0];
  },

  refKeyForEmissionSource(source, blockFields) {
    const fields = source?.fields || [];
    if (fields.length === 1) return this.factorRefKeyForField(fields[0], blockFields || fields);
    const primary = this.primaryFieldForSource(source, blockFields || fields);
    if (fields.length === 1) return this.factorRefKeyForField(primary, blockFields || fields);
    return `factor_${source.id}`;
  },

  defaultSourceFormulaExpression(source, blockFields) {
    const fields = source?.fields || [];
    const refKey = this.refKeyForEmissionSource(source, blockFields || fields);
    const primary = this.primaryFieldForSource(source, blockFields || fields);
    const scope = blockFields || fields;
    if (scope.includes('P_grid_region') && fields.includes('P_purchased_electricity')) {
      return '{P_purchased_electricity} * LOOKUP({P_grid_region}, factor_grid)';
    }
    if (fields.length === 1) return this.defaultFormulaExpression(primary, scope);
    const parts = fields
      .filter(fid => {
        const p = this.getParam(fid);
        return p && (this.fieldIsNumberType(p) || this.fieldIsOptionType(p));
      })
      .map(fid => `{${fid}}`);
    if (!parts.length) return `{${primary}}*{${refKey}}`;
    return `${parts.join('*')}*{${refKey}}`;
  },

  defaultSourceFormulaDisplay(source, blockFields) {
    const fields = source?.fields || [];
    const refKey = this.refKeyForEmissionSource(source, blockFields || fields);
    const primary = this.primaryFieldForSource(source, blockFields || fields);
    const ctx = this.buildInlineFormulaContext(primary, blockFields || fields, refKey, {}, fields);
    return ctx.defaultDisplay || '';
  },

  fieldsInEmissionSources(block) {
    return new Set(this.ensureEmissionSources(block).flatMap(s => s.fields));
  },

  getSimpleBlockFields(block) {
    const inSource = this.fieldsInEmissionSources(block);
    return (block?.fields || []).filter(fid => !inSource.has(fid));
  },

  listOptionParams() {
    return this.listParams().filter(p => p.status !== 'inactive' && this.fieldIsOptionType(p));
  },

  listNumberParams() {
    return this.listParams().filter(p => p.status !== 'inactive' && this.fieldIsNumberType(p));
  },

  slugifyEnumValue(value) {
    return String(value || 'x').replace(/[^\w\u4e00-\u9fff]+/g, '_').replace(/^_|_$/g, '') || 'x';
  },

  dynamicRowRefKey(block, row) {
    const varietyId = block?.varietyParamId || 'variety';
    const slug = this.slugifyEnumValue(row?.enumValue || row?.label);
    const raw = row?.refKey || row?.factorCode || `factor_${varietyId.replace(/^P_/, '')}_${slug}`;
    return raw.startsWith('factor_') ? raw : `factor_${raw}`;
  },

  buildDynamicPresetRows(varietyParamId, existingRows, amountParam) {
    const p = this.getParam(varietyParamId);
    const enums = p?.enumValues || [];
    if (!enums.length) return (existingRows || []).map(r => this.normalizeDynamicPresetRow(r, varietyParamId, amountParam));
    const unit = amountParam?.unit && amountParam.unit !== '—' ? amountParam.unit : '';
    const existingMap = Object.fromEntries((existingRows || []).map(r => [r.enumValue || r.label, r]));
    return enums.map(ev => this.normalizeDynamicPresetRow(existingMap[ev] || { label: ev, enumValue: ev }, varietyParamId, amountParam, ev, unit));
  },

  normalizeDynamicPresetRow(row, varietyParamId, amountParam, enumValue, defaultUnit) {
    const label = row?.label || enumValue || '';
    const ev = row?.enumValue || enumValue || label;
    const unit = row?.unit || defaultUnit || (amountParam?.unit !== '—' ? amountParam?.unit : '') || '';
    const refKey = row?.refKey
      ? (row.refKey.startsWith('factor_') ? row.refKey : `factor_${row.refKey}`)
      : this.dynamicRowRefKey({ varietyParamId }, { label: ev, enumValue: ev, factorCode: row?.factorCode });
    return {
      label,
      enumValue: ev,
      refKey,
      factorSource: row?.factorSource || '',
      unit
    };
  },

  normalizeDynamicBlock(block) {
    if ((block?.type || '') !== 'dynamic_row') return block;
    const next = { ...block };
    if (!next.varietyParamId && (next.presetRows || []).length) {
      next.presetRows = (next.presetRows || []).map(r =>
        this.normalizeDynamicPresetRow(r, next.varietyParamId, this.getParam(next.amountParamId))
      );
      return next;
    }
    if (next.varietyParamId) {
      next.presetRows = this.buildDynamicPresetRows(
        next.varietyParamId,
        next.presetRows,
        this.getParam(next.amountParamId)
      );
    }
    return next;
  },

  patchDynamicFormulaContext(ctx) {
    if (!ctx) return ctx;
    const factorToken = (ctx.tokens || []).find(t => t.display === '因子');
    if (factorToken) factorToken.technical = '{factor}';
    return ctx;
  },

  expandDynamicRowFormula(sectionExpr, rowRefKey, amountId) {
    if (!sectionExpr) return amountId ? `{${amountId}}*{${rowRefKey}}` : `{${rowRefKey}}`;
    return String(sectionExpr)
      .replace(/\{factor\}/gi, `{${rowRefKey}}`)
      .replace(/\*factor\b/gi, `*{${rowRefKey}}`);
  },

  readDynamicRowFactorBindings(form, layout, existingBindings) {
    const existing = Object.fromEntries((existingBindings || []).map(b => [b.refKey, b]));
    const bindings = [];
    const seen = new Set();

    const readSection = (sectionEl, pIndex, sIndex, section) => {
      const sectionKey = `${pIndex}-${sIndex}`;
      const formulaRefKey = `dyn_formula_${sectionKey}`;
      const amountId = sectionEl?.querySelector('[name="block_amountParam"]')?.value?.trim()
        || section?.amountParamId
        || '';
      const varietyId = sectionEl?.querySelector('[name="block_varietyParam"]')?.value?.trim()
        || section?.varietyParamId
        || '';
      const amountP = this.getParam(amountId);
      const displayEl = form?.querySelector(`[name="inline_formula_display_${formulaRefKey}"]`);
      const hiddenExpr = form?.querySelector(`[name="inline_formula_expr_${formulaRefKey}"]`)?.value?.trim();
      let sectionFormulaExpr = hiddenExpr || existing[formulaRefKey]?.formulaExpression || '';
      if (displayEl && amountId) {
        const ctx = this.patchDynamicFormulaContext(this.buildInlineFormulaContext(
          amountId,
          [amountId, varietyId].filter(Boolean),
          formulaRefKey,
          { factorBindings: existingBindings },
          [amountId]
        ));
        sectionFormulaExpr = this.displayFormulaToExpression(displayEl.value, ctx) || sectionFormulaExpr;
      }
      if (!sectionFormulaExpr && amountId) sectionFormulaExpr = `{${amountId}}*{factor}`;
      if (sectionFormulaExpr && !seen.has(formulaRefKey)) {
        seen.add(formulaRefKey);
        bindings.push({
          refKey: formulaRefKey,
          label: section?.sectionLabel || '动态行公式',
          matchType: 'fixed',
          factorSource: '',
          formulaExpression: sectionFormulaExpr,
          caliberTag: existing[formulaRefKey]?.caliberTag || 'bank'
        });
      }

      const presetEls = sectionEl
        ? [...sectionEl.querySelectorAll('[data-preset-row]')]
        : (section?.presetRows || []).map((row, ri) => ({ dataset: { presetIndex: ri }, _row: row }));

      presetEls.forEach((pr, rowIndex) => {
        const row = pr._row || section?.presetRows?.[rowIndex];
        const label = pr.querySelector?.('[name="preset_label"]')?.value?.trim() || row?.label;
        if (!label) return;
        const refKey = pr.querySelector?.('[name="preset_refKey"]')?.value?.trim()
          || row?.refKey
          || this.dynamicRowRefKey({ varietyParamId: varietyId }, row || { label });
        if (seen.has(refKey)) return;
        seen.add(refKey);
        const prev = existing[refKey] || {};
        const libId = form?.querySelector(`[name="inline_factor_lib_${refKey}"]`)?.value?.trim()
          || row?.factorSource
          || prev.factorSource
          || '';
        let defVal = prev.defaultValue || '';
        if (libId && typeof Store !== 'undefined') {
          const lib = Store.getFactor(libId);
          if (lib) defVal = String(lib.value ?? lib.factorValue ?? defVal);
        }
        const factorUnitFull = libId ? this.getFactorUnitFromLibrary(libId) : (prev.unitFactor || '');
        const unitAssess = this.assessParamUnitConversion(amountP, factorUnitFull);
        const convInput = form?.querySelector(`[name="inline_unit_factor_${refKey}"]`);
        const convNote = form?.querySelector(`[name="inline_unit_note_${refKey}"]`)?.value?.trim() || '';
        let conversionFactor = 1;
        if (unitAssess.needsConversion) {
          const raw = convInput?.value?.trim();
          conversionFactor = raw !== '' && raw != null ? Number(raw) : (prev.conversionFactor ?? unitAssess.suggestedFactor ?? 1);
          if (!Number.isFinite(conversionFactor)) conversionFactor = 1;
        }
        let formulaExpr = this.expandDynamicRowFormula(sectionFormulaExpr, refKey, amountId);
        if (unitAssess.needsConversion && conversionFactor !== 1 && amountId) {
          formulaExpr = this.applyConversionFactorToExpr(formulaExpr, amountId, conversionFactor);
        }
        bindings.push({
          refKey,
          label: prev.label || label || refKey.replace(/^factor_/, ''),
          matchType: 'lookup',
          dependsOn: varietyId || '',
          defaultValue: defVal,
          factorSource: libId,
          unitActivity: amountP?.unit && amountP.unit !== '—' ? amountP.unit : '',
          unitFactor: factorUnitFull,
          unitConversion: convNote || prev.unitConversion || unitAssess.suggestedLabel || '',
          conversionFactor: unitAssess.needsConversion ? conversionFactor : 1,
          caliberTag: prev.caliberTag || 'bank',
          formulaExpression: formulaExpr
        });
      });
    };

    if (form) {
      form.querySelectorAll('[data-partition-row]').forEach((partitionEl, pIndex) => {
        partitionEl.querySelectorAll('[data-section-row][data-section-type="dynamic_row"]').forEach((sectionEl, sIndex) => {
          readSection(sectionEl, pIndex, sIndex, null);
        });
      });
      return bindings;
    }

    (layout || []).forEach(item => {
      const partitions = item?.type === 'partition' ? [item] : [this.legacyBlockToPartition(item)];
      partitions.forEach((partition, pIndex) => {
        (partition.sections || []).forEach((section, sIndex) => {
          if ((section.type || '') !== 'dynamic_row') return;
          readSection(null, pIndex, sIndex, section);
        });
      });
    });
    return bindings;
  },

  matchAmountFieldForType(typeFieldId, fieldIds) {
    if (!typeFieldId || !fieldIds?.length) return null;
    const candidates = [
      typeFieldId.replace('_type_', '_amount_'),
      typeFieldId.replace(/_type(_\d+)$/, '_amount$1'),
      typeFieldId.replace(/type/, 'amount')
    ];
    return candidates.find(id => fieldIds.includes(id)) || null;
  },

  resolveLookupFactorKey(typeFieldId, amountFieldId) {
    if (/other_fuel/i.test(amountFieldId || '')) {
      const n = amountFieldId.match(/_(\d+)$/)?.[1] || '1';
      return `factor_other_${n}`;
    }
    if (/carbonate|desulfur/i.test(`${typeFieldId}${amountFieldId}`)) {
      return 'factor_carbonate';
    }
    return `factor_${(amountFieldId || '').replace(/^P_/, '')}`;
  },

  resolveSourceFormulaExpression(source, blockFields, detail) {
    const fields = blockFields || source?.fields || [];
    const refKey = this.refKeyForEmissionSource(source, fields);
    const binding = this.getBindingByRefKey(detail, refKey);
    const custom = (binding.formulaExpression || '').trim();
    if (custom) return custom;
    return this.defaultSourceFormulaExpression(source, fields);
  },

  buildFixedBlockFormulaParts(block, detail) {
    const fieldIds = block.fields || [];
    return this.ensureEmissionSources(block).map(source =>
      this.resolveSourceFormulaExpression(source, fieldIds, detail)
    );
  },

  paramsFromLayout(layout, form, existingParams) {
    const existing = Object.fromEntries((existingParams || []).map(p => [p.id, p]));
    const selected = [];
    const seen = new Set();
    const mark = (id, patch) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      const base = existing[id] || this.getParam(id) || {};
      selected.push({
        ...base,
        id,
        showInTemplate: base.showInTemplate !== false,
        ...patch
      });
    };

    (layout || []).forEach((item, pIndex) => {
      const partition = item?.type === 'partition' ? item : this.legacyBlockToPartition(item);
      const title = partition.title || '默认分区';
      (partition.sections || []).forEach(section => {
        if (section.type === 'dynamic_row') {
          if (section.varietyParamId) {
            const required = form
              ? !!form.querySelector(`[name="field_required_${section.varietyParamId}"][data-partition-index="${pIndex}"]`)?.checked
              : !!existing[section.varietyParamId]?.required;
            mark(section.varietyParamId, { section: title, allowMultiRow: true, blockType: 'dynamic_row', required });
          }
          if (section.amountParamId) {
            const required = form
              ? !!form.querySelector(`[name="field_required_${section.amountParamId}"][data-partition-index="${pIndex}"]`)?.checked
              : !!existing[section.amountParamId]?.required;
            mark(section.amountParamId, { section: title, allowMultiRow: true, blockType: 'dynamic_row', required });
          }
          return;
        }
        (section.fields || []).forEach(fid => {
          const required = form
            ? !!form.querySelector(`[name="field_required_${fid}"][data-partition-index="${pIndex}"]`)?.checked
            : !!existing[fid]?.required;
          mark(fid, { section: title, required, blockType: 'fixed' });
        });
      });
    });
    return selected;
  },

  readFixedSectionFromForm(sectionEl) {
    const emissionSources = [];
    sectionEl.querySelectorAll('[data-emission-source]').forEach(esEl => {
      const id = esEl.dataset.emissionSourceId
        || esEl.querySelector('[name="emission_source_id"]')?.value
        || '';
      const fields = [...esEl.querySelectorAll('[name="source_field"]')].map(i => i.value).filter(Boolean);
      if (fields.length) {
        emissionSources.push({
          id: id || `es_${fields[0]}`,
          fields,
          saved: esEl.dataset.emissionSaved === '1'
        });
      }
    });
    const simpleFields = [...sectionEl.querySelectorAll('.structure-field-row:not(.structure-field-row--emission) [name="block_field"]')]
      .map(i => i.value).filter(Boolean);
    const fields = [...simpleFields];
    emissionSources.forEach(s => {
      s.fields.forEach(fid => { if (!fields.includes(fid)) fields.push(fid); });
    });
    const section = { type: 'fixed', fields };
    if (emissionSources.length) section.emissionSources = emissionSources;
    return section;
  },

  filterLayoutForPreview(layout) {
    const partitions = [];
    (layout || []).forEach(partition => {
      if (partition?.type !== 'partition') return;
      const sections = [];
      (partition.sections || []).forEach(section => {
        if (section.type === 'dynamic_row') {
          if (section.saved === false) return;
          if (section.saved !== true) {
            const norm = this.normalizeDynamicBlock(section);
            if (!norm.varietyParamId || !norm.amountParamId || !(norm.presetRows || []).length) return;
          }
          sections.push(section);
          return;
        }
        const savedSources = (section.emissionSources || []).filter(s => s.saved !== false);
        const draftFieldIds = new Set(
          (section.emissionSources || []).filter(s => s.saved === false).flatMap(s => s.fields || [])
        );
        const fields = (section.fields || []).filter(fid => !draftFieldIds.has(fid));
        if (!fields.length) return;
        const next = { type: 'fixed', fields: [...fields] };
        if (savedSources.length) next.emissionSources = savedSources;
        sections.push(next);
      });
      if (sections.length) partitions.push({ ...partition, sections });
    });
    return partitions;
  },

  readPreviewStructure(form) {
    const full = this.readTemplateStructure(form);
    const layout = this.filterLayoutForPreview(full.layout);
    return {
      layout,
      params: this.paramsFromLayout(layout, form, full.params)
    };
  },

  readDynamicSectionFromForm(sectionEl) {
    const varietyParamId = sectionEl.querySelector('[name="block_varietyParam"]')?.value?.trim() || '';
    const amountParamId = sectionEl.querySelector('[name="block_amountParam"]')?.value?.trim() || '';
    const amountUnit = this.getParam(amountParamId)?.unit || '';
    const presetRows = [];
    sectionEl.querySelectorAll('[data-preset-row]').forEach(pr => {
      const label = pr.querySelector('[name="preset_label"]')?.value?.trim();
      if (!label) return;
      const refKey = pr.querySelector('[name="preset_refKey"]')?.value?.trim() || '';
      presetRows.push({
        label,
        enumValue: pr.querySelector('[name="preset_enum"]')?.value?.trim() || label,
        refKey,
        factorSource: refKey ? (sectionEl.querySelector(`[name="inline_factor_lib_${refKey}"]`)?.value?.trim() || '') : '',
        unit: amountUnit && amountUnit !== '—' ? amountUnit : ''
      });
    });
    return {
      type: 'dynamic_row',
      sectionLabel: sectionEl.querySelector('[name="section_label"]')?.value?.trim() || '',
      varietyParamId,
      amountParamId,
      presetRows,
      saved: sectionEl.dataset.dynamicSaved === '1'
    };
  },

  readTemplateStructure(form) {
    const layout = [];
    form.querySelectorAll('[data-partition-row]').forEach(row => {
      const title = row.querySelector('[name="partition_title"]')?.value?.trim() || '未命名分区';
      const requiredGroup = !!row.querySelector('[name="partition_requiredGroup"]')?.checked;
      const sections = [];
      row.querySelectorAll('[data-section-row]').forEach(sectionEl => {
        const sectionType = sectionEl.dataset.sectionType || 'fixed';
        sections.push(sectionType === 'dynamic_row'
          ? this.readDynamicSectionFromForm(sectionEl)
          : this.readFixedSectionFromForm(sectionEl));
      });
      layout.push({ type: 'partition', title, requiredGroup, sections });
    });
    const params = this.paramsFromLayout(layout, form);
    return { layout, params };
  },

  fieldIsOptionType(p) {
    return p?.format === 'option' || p?.paramType === '选项型';
  },

  fieldIsNumberType(p) {
    return p?.format === 'number' || p?.paramType === '数值型';
  },

  fieldIsAttachmentType(p) {
    return p?.format === 'attachment' || p?.paramType === '附件型';
  },

  fieldNeedsFactorBinding(fieldId, fieldIds, param) {
    if (!param || !this.fieldIsNumberType(param)) return false;
    if (fieldId === 'P_grid_region') return false;
    return true;
  },

  factorRefKeyForField(fieldId, fieldIds) {
    if (fieldIds.includes('P_grid_region') && fieldId === 'P_purchased_electricity') return 'factor_grid';
    const typeField = fieldIds.find(tid => this.matchAmountFieldForType(tid, fieldIds) === fieldId);
    if (typeField) return this.resolveLookupFactorKey(typeField, fieldId);
    return `factor_${fieldId.replace(/^P_/, '')}`;
  },

  inferFactorMatchType(fieldId, fieldIds) {
    if (fieldIds.includes('P_grid_region') && fieldId === 'P_purchased_electricity') return 'lookup';
    if (fieldIds.some(tid => this.matchAmountFieldForType(tid, fieldIds) === fieldId)) return 'lookup';
    return 'fixed';
  },

  inferFactorDependsOn(fieldId, fieldIds) {
    if (fieldIds.includes('P_grid_region') && fieldId === 'P_purchased_electricity') return 'P_grid_region';
    return fieldIds.find(tid => this.matchAmountFieldForType(tid, fieldIds) === fieldId) || '';
  },

  defaultFormulaExpression(fieldId, fieldIds) {
    const fieldIdsArr = fieldIds || [];
    const hasGrid = fieldIdsArr.includes('P_grid_region') && fieldIdsArr.includes('P_purchased_electricity');
    if (hasGrid && fieldId === 'P_purchased_electricity') {
      return '{P_purchased_electricity} * LOOKUP({P_grid_region}, factor_grid)';
    }
    const typeField = fieldIdsArr.find(tid => this.matchAmountFieldForType(tid, fieldIdsArr) === fieldId);
    if (typeField) {
      const refKey = this.resolveLookupFactorKey(typeField, fieldId);
      return `{${fieldId}}*LOOKUP({${typeField}}, ${refKey})`;
    }
    const p = this.getParam(fieldId);
    if (p && (p.format === 'option' || p.paramType === '选项型')) {
      const amountId = this.matchAmountFieldForType(fieldId, fieldIdsArr);
      if (amountId) {
        const refKey = this.resolveLookupFactorKey(fieldId, amountId);
        return `{${amountId}}*LOOKUP({${fieldId}}, ${refKey})`;
      }
    }
    const refKey = this.factorRefKeyForField(fieldId, fieldIdsArr);
    return `{${fieldId}}*{${refKey}}`;
  },

  getBindingByRefKey(detail, refKey) {
    return (detail?.factorBindings || []).find(b => b.refKey === refKey) || {};
  },

  resolveFormulaExpression(fieldId, fieldIds, detail) {
    const refKey = this.factorRefKeyForField(fieldId, fieldIds || []);
    const binding = this.getBindingByRefKey(detail, refKey);
    const custom = (binding.formulaExpression || '').trim();
    if (custom) return custom;
    return this.defaultFormulaExpression(fieldId, fieldIds);
  },

  buildInlineFormulaContext(fieldId, fieldIds, refKey, detail, sourceFieldIds) {
    const scope = fieldIds || [];
    const tokenFieldIds = (sourceFieldIds && sourceFieldIds.length ? sourceFieldIds : [fieldId]).filter(Boolean);
    const p = this.getParam(fieldId);
    const paramName = p?.name || fieldId;
    const matchType = this.inferFactorMatchType(fieldId, scope);
    const typeField = scope.find(tid => this.matchAmountFieldForType(tid, scope) === fieldId);
    let factorTechnical = `{${refKey}}`;
    if (scope.includes('P_grid_region') && fieldId === 'P_purchased_electricity') {
      factorTechnical = `LOOKUP({P_grid_region}, ${refKey})`;
    } else if (matchType === 'lookup' && typeField) {
      factorTechnical = `LOOKUP({${typeField}}, ${refKey})`;
    }
    const tokens = [];
    tokenFieldIds.forEach(fid => {
      const tp = this.getParam(fid);
      if (!tp) return;
      if (this.fieldIsOptionType(tp) && !this.fieldNeedsFactorBinding(fid, scope, tp)) {
        tokens.push({ display: tp.name || fid, technical: `{${fid}}` });
        return;
      }
      if (this.fieldIsNumberType(tp) || this.fieldNeedsFactorBinding(fid, scope, tp)) {
        if (!tokens.some(t => t.technical === `{${fid}}`)) {
          tokens.push({ display: tp.name || fid, technical: `{${fid}}` });
        }
      }
    });
    if (!tokens.some(t => t.technical === `{${fieldId}}`)) {
      tokens.unshift({ display: paramName, technical: `{${fieldId}}` });
    }
    if (!tokens.some(t => t.display === '因子')) {
      tokens.push({ display: '因子', technical: factorTechnical });
    }
    if (typeField) {
      const typeName = this.getParam(typeField)?.name;
      if (typeName && !tokens.some(t => t.technical === `{${typeField}}`)) {
        tokens.push({ display: typeName, technical: `{${typeField}}` });
      }
    }
    if (scope.includes('P_grid_region') && fieldId === 'P_purchased_electricity') {
      const gridName = this.getParam('P_grid_region')?.name || '企业所属电网';
      if (!tokens.some(t => t.technical === '{P_grid_region}')) {
        tokens.push({ display: gridName, technical: '{P_grid_region}' });
      }
    }
    const paramLabels = tokens.filter(t => t.display !== '因子').map(t => t.display);
    const defaultDisplay = paramLabels.length
      ? `${paramLabels.join(' × ')} × 因子`
      : `${paramName} × 因子`;
    const factorLabel = this.factorDisplayLabel(refKey, detail);
    return {
      fieldId,
      refKey,
      factorLabel,
      tokens,
      defaultExpression: this.defaultSourceFormulaExpression({ id: 'tmp', fields: tokenFieldIds }, scope),
      defaultDisplay
    };
  },

  normalizeDisplayFormulaInput(display) {
    return String(display || '')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/[＋]/g, '+')
      .replace(/[－−]/g, '-')
      .replace(/｛/g, '(')
      .replace(/｝/g, ')')
      .replace(/求和\s*\(/g, 'SUM(')
      .replace(/Σ\s*\(/g, 'SUM(');
  },

  finalizeDisplayFormulaExpression(expr) {
    return String(expr || '')
      .replace(/\s*\*\s*/g, '*')
      .replace(/\s*\/\s*/g, '/')
      .replace(/\s*\+\s*/g, '+')
      .replace(/\s*-\s*/g, '-')
      .replace(/(\d+(?:\.\d+)?)\s*%/g, '($1/100)')
      .replace(/\s+/g, '');
  },

  escapeRegExp(str) {
    return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  factorDisplayLabel(refKey, detail) {
    const fb = this.getBindingByRefKey(detail, refKey);
    return fb?.label || '因子';
  },

  normalizeFormulaFactorRef(expr, refKey) {
    if (!expr || !refKey) return expr || '';
    return String(expr).replace(/\{factor_[^}]+\}/gi, `{${refKey}}`);
  },

  expressionToDisplayFormula(expr, ctx) {
    if (!ctx) return '';
    if (!expr?.trim()) return ctx.defaultDisplay || '';
    let s = this.normalizeFormulaFactorRef(String(expr), ctx.refKey);
    s = s.replace(/\bSUM\s*\(/gi, 'Σ(');
    s = s.replace(/\((\d+(?:\.\d+)?)\/100\)/g, '$1%');
    const factorDisplay = '因子';
    const sorted = [...(ctx.tokens || [])].sort((a, b) => b.technical.length - a.technical.length);
    sorted.forEach(t => {
      if (t.technical.includes('LOOKUP')) {
        const pattern = t.technical
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\s+/g, '\\s*');
        s = s.replace(new RegExp(pattern, 'gi'), t.display);
        return;
      }
      const key = t.technical.replace(/^\{|\}$/g, '');
      s = s.replace(new RegExp(`\\{${this.escapeRegExp(key)}\\}`, 'g'), t.display);
    });
    if (ctx.refKey) {
      s = s.replace(new RegExp(`\\{${this.escapeRegExp(ctx.refKey)}\\}`, 'g'), factorDisplay);
    }
    s = s.replace(/\{factor\}/gi, factorDisplay);
    s = s.replace(/\{factor_[^}]+\}/gi, factorDisplay);
    return s.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\s+/g, ' ').trim();
  },

  displayFormulaToExpression(display, ctx) {
    if (!ctx) return '';
    const raw = (display || '').trim();
    if (!raw) return ctx.defaultExpression || '';
    let s = this.normalizeDisplayFormulaInput(raw);
    if (ctx.refKey) {
      s = s.replace(/\{factor_[^}]+\}/gi, `{${ctx.refKey}}`);
    }
    const factorLabel = ctx.factorLabel || '因子';
    if (String(ctx.refKey || '').startsWith('dyn_formula_')) {
      s = s.split(factorLabel).join('{factor}');
      s = s.split('因子').join('{factor}');
    } else if (factorLabel !== '因子') {
      s = s.split(factorLabel).join(`{${ctx.refKey}}`);
    } else {
      s = s.split('因子').join(`{${ctx.refKey}}`);
    }
    const sorted = [...(ctx.tokens || [])].sort((a, b) => b.display.length - a.display.length);
    sorted.forEach(t => {
      if (!t.display) return;
      s = s.split(t.display).join(t.technical);
    });
    return this.finalizeDisplayFormulaExpression(s);
  },

  humanizeExpression(expr, detail) {
    if (!expr) return '—';
    let s = String(expr);
    s = s.replace(/LOOKUP\s*\(\s*\{([^}]+)\}\s*,\s*([^)]+)\)/gi, (_, fieldKey, factorKey) => {
      const depName = this.getParam(fieldKey.trim())?.name || fieldKey.trim();
      const fk = factorKey.trim().replace(/^\{|\}$/g, '');
      const fb = this.getBindingByRefKey(detail, fk);
      const factorLabel = fb.label || '对应因子';
      return `${depName}对应因子（${factorLabel}）`;
    });
    s = s.replace(/\{([^}]+)\}/g, (_, key) => {
      const k = key.trim();
      if (k.startsWith('factor_')) {
        const fb = this.getBindingByRefKey(detail, k);
        return fb.label || '因子';
      }
      if (/^F\d+$|^F_total$/i.test(k)) return k;
      return this.getParam(k)?.name || k;
    });
    return s.replace(/\s*\*\s*/g, ' × ').replace(/\s*\+\s*/g, ' + ').trim();
  },

  humanizeFormulaPart(fieldId, fieldIds, detail) {
    if (detail) {
      return this.humanizeExpression(this.resolveFormulaExpression(fieldId, fieldIds, detail), detail);
    }
    const name = this.getParam(fieldId)?.name || fieldId;
    if (this.inferFactorMatchType(fieldId, fieldIds) === 'lookup') {
      const dep = this.inferFactorDependsOn(fieldId, fieldIds);
      const depName = this.getParam(dep)?.name || '选项';
      return `${name} × ${depName}对应因子`;
    }
    return `${name} × 排放因子`;
  },

  humanizeBlockFormula(block, detail) {
    const fieldIds = block.fields || [];
    const parts = this.ensureEmissionSources(block).map(source => {
      const primary = this.primaryFieldForSource(source, fieldIds);
      const refKey = this.refKeyForEmissionSource(source, fieldIds);
      const ctx = this.buildInlineFormulaContext(primary, fieldIds, refKey, detail, source.fields);
      const expr = detail
        ? this.resolveSourceFormulaExpression(source, fieldIds, detail)
        : ctx.defaultExpression;
      let display = this.expressionToDisplayFormula(expr, ctx);
      if (!display || /^[\s×*÷]+$/.test(display)) display = ctx.defaultDisplay || '—';
      return display;
    });
    return parts.filter(p => p && p !== '—').join(' + ') || '—';
  },

  readInlineFactorBindings(form, layout, existingBindings) {
    const existing = Object.fromEntries((existingBindings || []).map(b => [b.refKey, b]));
    const bindings = [];
    const seen = new Set();
    (layout || []).forEach(item => {
      const partitions = item?.type === 'partition' ? [item] : [this.legacyBlockToPartition(item)];
      partitions.forEach(partition => {
        (partition.sections || []).forEach(section => {
          if ((section.type || 'fixed') !== 'fixed') return;
          const fieldIds = section.fields || [];
          this.ensureEmissionSources(section).forEach(source => {
        const primary = this.primaryFieldForSource(source, fieldIds);
        const refKey = this.refKeyForEmissionSource(source, fieldIds);
        if (seen.has(refKey)) return;
        seen.add(refKey);
        const p = this.getParam(primary);
        const prev = existing[refKey] || {};
        const libId = form?.querySelector(`[name="inline_factor_lib_${refKey}"]`)?.value?.trim() || '';
        const factorUnitFull = libId ? this.getFactorUnitFromLibrary(libId) : (prev.unitFactor || '');
        let defVal = prev.defaultValue || '';
        if (libId && typeof Store !== 'undefined') {
          const lib = Store.getFactor(libId);
          if (lib) defVal = String(lib.value ?? lib.factorValue ?? defVal);
        }
        const unitAssess = this.assessParamUnitConversion(p, factorUnitFull);
        const convInput = form?.querySelector(`[name="inline_unit_factor_${refKey}"]`);
        const convNote = form?.querySelector(`[name="inline_unit_note_${refKey}"]`)?.value?.trim() || '';
        let conversionFactor = 1;
        if (unitAssess.needsConversion) {
          const raw = convInput?.value?.trim();
          conversionFactor = raw !== '' && raw != null ? Number(raw) : (prev.conversionFactor ?? unitAssess.suggestedFactor ?? 1);
          if (!Number.isFinite(conversionFactor)) conversionFactor = 1;
        }
        const ctx = this.buildInlineFormulaContext(
          primary,
          fieldIds,
          refKey,
          { factorBindings: existingBindings },
          source.fields
        );
        const displayEl = form?.querySelector(`[name="inline_formula_display_${refKey}"]`);
        const hiddenExpr = form?.querySelector(`[name="inline_formula_expr_${refKey}"]`)?.value?.trim();
        let formulaExpr = prev.formulaExpression || this.defaultSourceFormulaExpression(source, fieldIds);
        if (displayEl) {
          formulaExpr = this.displayFormulaToExpression(displayEl.value, ctx) || formulaExpr;
        } else if (hiddenExpr) {
          formulaExpr = hiddenExpr;
        }
        formulaExpr = this.applyConversionFactorToExpr(
          this.stripConversionFromExpr(formulaExpr, primary),
          primary,
          conversionFactor
        );
        bindings.push({
          refKey,
          label: prev.label || p?.name || refKey.replace(/^factor_/, ''),
          matchType: this.inferFactorMatchType(primary, fieldIds),
          dependsOn: this.inferFactorDependsOn(primary, fieldIds),
          defaultValue: defVal || prev.defaultValue || '',
          factorSource: libId || prev.factorSource || '',
          unitActivity: unitAssess.activityUnit || p?.unit || '',
          unitFactor: factorUnitFull || prev.unitFactor || '',
          unitConversion: convNote || prev.unitConversion || unitAssess.suggestedLabel || '',
          conversionFactor: unitAssess.needsConversion ? conversionFactor : 1,
          caliberTag: prev.caliberTag || 'bank',
          formulaExpression: formulaExpr
        });
          });
        });
      });
    });
    (existingBindings || []).forEach(b => {
      if (b.refKey && !seen.has(b.refKey)) bindings.push(b);
    });
    return bindings.filter(b => b.refKey);
  },

  generateFormulasFromLayout(detail) {
    const layout = this.ensureDetailLayout(detail);
    const formulas = [];
    const subtotalIds = [];
    let sort = 1;

    layout.forEach(partition => {
      if (partition.type !== 'partition') return;
      const title = partition.title || `分项${sort}`;
      const parts = this.buildPartitionFormulaParts(partition, detail);
      if (!parts.length) return;
      const id = `F${sort}`;
      formulas.push({
        id, sort, name: title, emissionUnit: 'tCO₂e',
        expression: parts.join(' + '),
        activityData: (partition.sections || []).map(s =>
          s.type === 'dynamic_row' ? '动态行' : (s.fields || []).join('/')
        ).join(' + '),
        isSubtotal: true
      });
      subtotalIds.push(`{${id}}`);
      sort += 1;
    });

    if (!subtotalIds.length) return null;
    formulas.push({
      id: 'F_total',
      sort: 99,
      name: '主体排放合计',
      emissionUnit: 'tCO₂e',
      expression: `SUM(${subtotalIds.join(', ')})`,
      activityData: '主体A排放',
      isEntityTotal: true,
      summary: detail.meta?.entityFormulaSummary || '各分组合计之和'
    });
    return formulas;
  },

  readTemplateBasicInfo(form) {
    const applyScene = [];
    form.querySelectorAll('[name="applyScene"]:checked').forEach(cb => applyScene.push(cb.value));
    const bizType = applyScene.includes('project_loan') && !applyScene.includes('entity') ? 'project' : 'non_project';
    return {
      meta: {
        templateName: form.querySelector('[name="meta_templateName"]')?.value?.trim() || '',
        industry: form.querySelector('[name="meta_industry"]')?.value?.trim() || '',
        subCategory: form.querySelector('[name="meta_subCategory"]')?.value?.trim() || '',
        methodId: form.querySelector('[name="meta_methodId"]')?.value?.trim() || '',
        priority: Number(form.querySelector('[name="meta_priority"]')?.value) || 3,
        applyScene: applyScene.length ? applyScene : ['entity'],
        bizType,
        description: form.querySelector('[name="meta_description"]')?.value?.trim() || ''
      }
    };
  },

  readTemplateStep1(form) {
    const selected = [];
    form.querySelectorAll('.tpl-param-check:checked').forEach(cb => {
      const id = cb.value;
      const base = this.getParam(id) || {};
      const section = form.querySelector(`[name="param_section_${id}"]`)?.value?.trim() || '默认分区';
      const blockType = form.querySelector(`[name="param_blockType_${id}"]`)?.value || 'fixed';
      const required = !!form.querySelector(`[name="param_required_${id}"]`)?.checked;
      const allowMultiRow = !!form.querySelector(`[name="param_multirow_${id}"]`)?.checked;
      selected.push({
        ...base,
        id,
        section,
        blockType,
        required,
        allowMultiRow,
        showInTemplate: base.showInTemplate !== false
      });
    });
    const meta = {
      dataSourceCollect: form.querySelector('[name="meta_dataSourceCollect"]')?.value?.trim() || '',
      dataSourceFactor: form.querySelector('[name="meta_dataSourceFactor"]')?.value?.trim() || '',
      entityFormulaSummary: form.querySelector('[name="meta_entityFormulaSummary"]')?.value?.trim() || '',
      gbCodes: (form.querySelector('[name="meta_gbCodes"]')?.value || '')
        .split(/[,，、\s]+/).map(s => s.trim()).filter(Boolean)
    };
    return {
      params: selected,
      layout: this.buildLayoutFromParams(selected),
      meta
    };
  },

  readTemplateStep2(form) {
    const formulas = [];
    form.querySelectorAll('#tplFormulaBody tr[data-formula-row]').forEach((row, idx) => {
      const id = row.querySelector('[name="formula_id"]')?.value?.trim() || `F${idx + 1}`;
      formulas.push({
        id,
        sort: Number(row.querySelector('[name="formula_sort"]')?.value) || idx + 1,
        name: row.querySelector('[name="formula_name"]')?.value?.trim() || '',
        expression: row.querySelector('[name="formula_expression"]')?.value?.trim() || '',
        emissionUnit: row.querySelector('[name="formula_unit"]')?.value?.trim() || 'tCO₂e',
        activityData: row.querySelector('[name="formula_activity"]')?.value?.trim() || '',
        note: row.querySelector('[name="formula_note"]')?.value?.trim() || '',
        summary: row.querySelector('[name="formula_summary"]')?.value?.trim() || '',
        isSubtotal: !!row.querySelector('[name="formula_subtotal"]')?.checked,
        isEntityTotal: !!row.querySelector('[name="formula_total"]')?.checked,
        allowMultiRow: !!row.querySelector('[name="formula_multirow"]')?.checked
      });
    });
    return { formulas };
  },

  readTemplateStep3(form) {
    const factorBindings = [];
    const rows = form.querySelectorAll('#tplFactorBody [data-factor-row]');
    rows.forEach(row => {
      const libraryId = row.querySelector('[name="factor_libraryId"]')?.value?.trim() || '';
      let defaultValue = row.querySelector('[name="factor_defaultValue"]')?.value?.trim() || '';
      if (libraryId && typeof Store !== 'undefined') {
        const lib = Store.getFactor(libraryId);
        if (lib && !defaultValue) defaultValue = String(lib.value ?? lib.factorValue ?? '');
      }
      factorBindings.push({
        refKey: row.querySelector('[name="factor_refKey"]')?.value?.trim() || '',
        label: row.querySelector('[name="factor_label"]')?.value?.trim() || '',
        matchType: row.querySelector('[name="factor_matchType"]')?.value || 'fixed',
        dependsOn: row.querySelector('[name="factor_dependsOn"]')?.value?.trim() || '',
        defaultValue,
        unitActivity: row.querySelector('[name="factor_unitActivity"]')?.value?.trim() || '',
        unitFactor: row.querySelector('[name="factor_unitFactor"]')?.value?.trim() || '',
        unitConversion: row.querySelector('[name="factor_unitConversion"]')?.value?.trim() || '',
        caliberTag: row.querySelector('[name="factor_caliberTag"]')?.value || 'bank',
        factorSource: libraryId || row.querySelector('[name="factor_source"]')?.value?.trim() || '',
        lookupExamples: row.querySelector('[name="factor_lookupExamples"]')?.value?.trim() || '',
        note: row.querySelector('[name="factor_note"]')?.value?.trim() || ''
      });
    });
    return { factorBindings: factorBindings.filter(b => b.refKey) };
  },

  mergeTemplateStep(detail, step, form) {
    const next = JSON.parse(JSON.stringify(detail));
    if (step === '1') {
      const basic = this.readTemplateBasicInfo(form);
      next.meta = { ...next.meta, ...basic.meta };
    } else if (step === '2') {
      const structure = this.readTemplateStructure(form);
      next.layout = structure.layout;
      next.params = structure.params;
      const inlineBindings = this.readInlineFactorBindings(form, structure.layout, detail.factorBindings);
      const dynamicBindings = this.readDynamicRowFactorBindings(form, structure.layout, detail.factorBindings);
      const seen = new Set(inlineBindings.map(b => b.refKey));
      next.factorBindings = inlineBindings.concat(dynamicBindings.filter(b => b.refKey && !seen.has(b.refKey)));
      const generated = this.generateFormulasFromLayout({
        ...next,
        layout: structure.layout,
        params: structure.params,
        factorBindings: next.factorBindings
      });
      if (generated) next.formulas = generated;
    }
    next.meta.fieldCount = next.params?.length || 0;
    next.meta.formulaCount = next.formulas?.length || 0;
    next.meta.updatedAt = this._today();
    next.meta.updatedBy = this._currentOperator();
    return next;
  },

  mergeAllTemplateSteps(detail, form) {
    let next = JSON.parse(JSON.stringify(detail));
    ['1', '2'].forEach(step => {
      next = this.mergeTemplateStep(next, step, form);
    });
    return next;
  },

  saveTemplateDetail(detail) {
    const id = detail.templateId || detail.meta?.id;
    if (!id) return { ok: false, message: '模板 ID 缺失' };
    detail.templateId = id;
    detail.meta.id = id;
    this.templateDetails[id] = detail;

    const tplIdx = this.templates.findIndex(t => t.id === id);
    const tplPatch = {
      id,
      templateName: detail.meta.templateName,
      industry: detail.meta.industry,
      subCategory: detail.meta.subCategory || '',
      bizType: detail.meta.bizType,
      methodId: detail.meta.methodId,
      priority: detail.meta.priority ?? 3,
      applyScene: detail.meta.applyScene || ['entity'],
      status: detail.meta.status || 'draft',
      enabled: detail.meta.enabled !== false,
      version: detail.meta.version || '—',
      fieldCount: detail.params?.length || 0,
      formulaCount: detail.formulas?.length || 0,
      updatedAt: detail.meta.updatedAt || this._today(),
      updatedBy: detail.meta.updatedBy || this._currentOperator()
    };
    if (tplIdx >= 0) this.templates[tplIdx] = { ...this.templates[tplIdx], ...tplPatch };
    else this.templates.push(tplPatch);

    const data = this._readStorage();
    data.templateDetails = data.templateDetails || {};
    data.templateDetails[id] = detail;
    data.templates = this.templates.map(t => ({ ...t }));
    data.templateVersions = this.templateVersions;
    this._writeStorage(data);
    return { ok: true, message: '草稿已保存', id };
  },

  extractRefsFromFormulas(formulas) {
    const params = new Set();
    const factors = new Set();
    (formulas || []).forEach(f => {
      const expr = f.expression || '';
      [...expr.matchAll(/\{([P][A-Za-z0-9_]+)\}/g)].forEach(m => params.add(m[1]));
      [...expr.matchAll(/\{([Ff]\d+|factor_[A-Za-z0-9_]+)\}/g)].forEach(m => factors.add(m[1]));
      [...expr.matchAll(/LOOKUP\(\{([P][A-Za-z0-9_]+)\}/g)].forEach(m => params.add(m[1]));
    });
    return { params: [...params], factors: [...factors] };
  },

  validateFormulas(detail) {
    const errors = [];
    const paramIds = new Set((detail.params || []).map(p => p.id));
    const factorKeys = new Set((detail.factorBindings || []).map(b => b.refKey));
    (detail.formulas || []).forEach(f => {
      if (!f.name) errors.push(`公式 ${f.id} 缺少名称`);
      if (!f.expression) errors.push(`公式「${f.name || f.id}」缺少表达式`);
      const refs = this.extractRefsFromFormulas([f]);
      refs.params.forEach(p => {
        if (!paramIds.has(p)) errors.push(`公式「${f.name}」引用了未选参数 ${p}`);
      });
      refs.factors.forEach(k => {
        if (!/^F\d+$/.test(k) && !factorKeys.has(k)) {
          errors.push(`公式「${f.name}」引用了未配置因子 {${k}}`);
        }
      });
    });
    return { ok: !errors.length, errors };
  },

  validateTemplate(detail) {
    const errors = [];
    const m = detail.meta || {};
    if (!m.templateName) errors.push('基础信息：模板名称未填写');
    if (!m.industry) errors.push('基础信息：所属行业未选择');
    if (!m.methodId) errors.push('基础信息：核算方法未选择');
    if (!(m.applyScene || []).length) errors.push('基础信息：适用场景未选择');
    const isReport = m.methodId === 'report';
    if (!(detail.params || []).length) errors.push('表单结构：请至少配置一个区块并挂载参数');
    const layout = this.ensureDetailLayout(detail);
    layout.forEach(partition => {
      if (partition.type !== 'partition') return;
      (partition.sections || []).forEach(section => {
        if (section.type === 'dynamic_row') {
          if (!section.varietyParamId) {
            errors.push(`表单结构：分区「${partition.title}」动态行需选择品种参数（选项型）`);
          }
          if (!section.amountParamId) {
            errors.push(`表单结构：分区「${partition.title}」动态行需选择消耗量参数（数值型）`);
          }
          if (!(section.presetRows || []).length) {
            errors.push(`表单结构：分区「${partition.title}」动态行需至少有一个品种行（请同步枚举）`);
          }
        }
      });
    });
    if (!isReport) {
      if (!(detail.formulas || []).some(f => f.expression)) errors.push('公式配置：请配置总排放公式');
      const v = this.validateFormulas(detail);
      if (!v.ok) errors.push(...v.errors);
      const activityParams = (detail.params || []).filter(p => {
        const base = this.getParam(p.id);
        return (base?.category || '活动水平类') === '活动水平类';
      });
      if (activityParams.length && !(detail.factorBindings || []).length) {
        errors.push('因子绑定：活动水平类参数尚未完成因子绑定');
      }
    }
    return { ok: !errors.length, errors };
  },

  publishTemplate(detail) {
    const validation = this.validateTemplate(detail);
    if (!validation.ok) {
      return { ok: false, message: validation.errors[0], errors: validation.errors };
    }
    const prev = detail.meta.version;
    let version = 'V1.0';
    if (prev && prev !== '—') {
      const m = prev.match(/^V(\d+)\.(\d+)$/i);
      version = m ? `V${m[1]}.${Number(m[2]) + 1}` : 'V1.0';
    }
    const now = this._today();
    const publisher = this._currentOperator();
    if (prev && prev !== '—') {
      this.templateVersions.forEach(v => {
        if (v.templateId === detail.meta.id && v.status === 'current') v.status = 'history';
      });
    }
    this.templateVersions.unshift({
      id: `${detail.meta.id}_${version}_${Date.now()}`,
      templateId: detail.meta.id,
      templateName: detail.meta.templateName,
      industry: detail.meta.industry,
      version,
      status: 'current',
      publishedAt: now,
      publishedBy: publisher,
      snapshot: JSON.parse(JSON.stringify(detail))
    });
    detail.meta.status = 'published';
    detail.meta.version = version;
    detail.meta.updatedAt = now;
    detail.meta.updatedBy = publisher;
    return this.saveTemplateDetail(detail);
  },

  listTemplates(filters = {}) {
    const kw = (filters.keyword || '').trim().toLowerCase();
    const industry = filters.industry || '';
    const methodId = filters.methodId || '';
    const status = filters.status || '';
    return this.templates.filter(t => {
      if (kw && !(`${t.templateName || ''} ${t.industry || ''}`).toLowerCase().includes(kw)) return false;
      if (industry && t.industry !== industry) return false;
      if (methodId && t.methodId !== methodId) return false;
      if (status === 'draft' && t.status !== 'draft') return false;
      if (status === 'published' && !(t.status === 'published' && t.enabled !== false)) return false;
      if (status === 'disabled' && !(t.status === 'published' && t.enabled === false)) return false;
      return true;
    });
  },

  listVersions(filters = {}) {
    const kw = (filters.keyword || '').trim().toLowerCase();
    const industry = filters.industry || '';
    const status = filters.versionStatus || '';
    return (this.templateVersions || []).filter(v => {
      if (kw && !(`${v.templateName || ''} ${v.version || ''}`).toLowerCase().includes(kw)) return false;
      if (industry && v.industry !== industry) return false;
      if (status && v.status !== status) return false;
      return true;
    });
  },

  copyTemplateAsDraft(sourceId) {
    const src = this.getTemplateDetail(sourceId);
    const meta = this.templates.find(t => t.id === sourceId);
    if (!src || !meta) return { ok: false, message: '源模板不存在' };
    const newId = `${sourceId}_copy_${Date.now()}`;
    const copy = this.copyTemplateDetail(sourceId, newId, meta.industry, meta.bizType, meta.methodId);
    copy.meta.templateName = `${meta.templateName || src.meta.templateName || '模板'}（副本）`;
    copy.meta.status = 'draft';
    copy.meta.version = '—';
    return this.saveTemplateDetail(copy);
  },

  deleteTemplate(templateId) {
    const tpl = this.templates.find(t => t.id === templateId);
    if (!tpl) return { ok: false, message: '模板不存在' };
    if (tpl.status !== 'draft') return { ok: false, message: '仅草稿态模板可删除' };
    this.templates = this.templates.filter(t => t.id !== templateId);
    delete this.templateDetails[templateId];
    const data = this._readStorage();
    data.templates = this.templates.map(t => ({ ...t }));
    if (data.templateDetails?.[templateId]) delete data.templateDetails[templateId];
    this._writeStorage(data);
    return { ok: true, message: '模板已删除' };
  },

  toggleTemplateEnabled(templateId) {
    const tpl = this.templates.find(t => t.id === templateId);
    if (!tpl || tpl.status !== 'published') return { ok: false, message: '仅已发布模板可停用/启用' };
    tpl.enabled = tpl.enabled === false;
    const detail = this.getTemplateDetail(templateId);
    if (detail) {
      detail.meta.enabled = tpl.enabled;
      this.saveTemplateDetail(detail);
    } else {
      const data = this._readStorage();
      data.templates = this.templates.map(t => ({ ...t }));
      this._writeStorage(data);
    }
    return { ok: true, message: tpl.enabled ? '模板已启用' : '模板已停用' };
  },

  getParam(id) {
    const detail = Object.values(this.templateDetails).find(d => d.params?.some(p => p.id === id));
    const fromDetail = detail?.params?.find(p => p.id === id);
    return fromDetail || this.params.find(p => p.id === id);
  },

  methodLabel(id) {
    return (GUIDE.METHODS || []).find(m => m.id === id)?.name || id;
  },

  bizLabel(bizType) {
    return bizType === 'project' ? '项目' : '非项目';
  },

  formatLabel(format) {
    return { text: '文本型', number: '数值型', option: '选项型', date: '日期型', attachment: '附件型' }[format] || format;
  },

  paramTypeLabel(paramType) {
    return paramType || '数值型';
  },

  paramStatusBadge(status) {
    return status === 'inactive'
      ? '<span class="tag tag-info">停用</span>'
      : '<span class="tag tag-success">启用</span>';
  },

  statusBadge(status) {
    return status === 'published'
      ? '<span class="tag tag-success">已发布</span>'
      : '<span class="tag tag-warning">草稿</span>';
  },

  templateStatusBadge(t) {
    if (!t || t.status !== 'published') return this.statusBadge(t?.status || 'draft');
    if (t.enabled === false) return '<span class="tag tag-info">已停用</span>';
    return '<span class="tag tag-success">已发布</span>';
  },

  templateStatusLabel(t) {
    if (!t || t.status !== 'published') return t?.status === 'published' ? '已发布' : '草稿';
    return t.enabled === false ? '已停用' : '已发布';
  },

  versionStatusBadge(status) {
    return {
      current: '<span class="tag tag-success">当前生效</span>',
      history: '<span class="tag tag-info">历史版本</span>',
      draft: '<span class="tag tag-warning">草稿版本</span>'
    }[status] || escapeHtml(status || '—');
  },

  applySceneLabel(scenes) {
    const map = Object.fromEntries(this.APPLY_SCENES.map(s => [s.value, s.label]));
    return (scenes || []).map(s => map[s] || s).join('、') || '—';
  },

  gapLevelLabel(level) {
    return { ok: '满足', warn: '需增强', gap: '未覆盖' }[level] || level;
  },

  gapLevelClass(level) {
    return { ok: 'tag-success', warn: 'tag-warning', gap: 'tag-danger' }[level] || 'tag-info';
  }
};

METHOD_CONFIG.init();
