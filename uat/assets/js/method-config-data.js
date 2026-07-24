/** 碳核算模板配置中心 — 数据与持久化（对齐开发版需规） */
window.METHOD_CONFIG = {
  EIGHT_INDUSTRIES: ['电力', '建材', '钢铁', '有色', '石化', '化工', '造纸', '民航'],
  PARAM_CATEGORIES: ['基础信息类', '活动水平类', '结果计算类'],
  DEFAULT_ATTACH_ACCEPT: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpeg,.jpg',
  DEFAULT_ATTACH_MAX_COUNT: 3,
  DEFAULT_ATTACH_MAX_MB: 20,
  PARAM_CATEGORY_HINTS: {
    '基础信息类': '说明性、佐证性填报字段（如数据来源、碳数据年份），不参与排放公式计算，可加入模板供客户经理填写。',
    '活动水平类': '反映生产/消耗活动的填报数据（如燃料消耗量、产量），可加入模板并参与因子绑定与排放公式计算。',
    '结果计算类': '由公式或系统直算输出的核算结果（如温室气体排放总量），系统内置、不可手动新增；模板中仅作只读展示。'
  },
  METHOD_COLLECT_HINTS: {
    economy: {
      title: '数据采集特殊说明 · 经济活动法',
      text: '正式清单为经济法直算路径时，营业收入、行业因子与主体排放由系统接口/直算预填，客户经理仅可查看、不可编辑。模板仍用于定义该 Tab 的展示结构与字段说明；与能源法/产品法不同，核心数值不由客户经理手工填报。'
    },
    economy_fallback: {
      title: '数据采集特殊说明 · 其他计算法',
      text: '派发后系统按企业行业自动匹配行业排放因子并预填，客户经理仅可查看、不可编辑。模板用于定义兜底计算 Tab 的展示字段；实际因子取值走因子库匹配逻辑，无需在模板中手工绑定每条因子。'
    }
  },
  APPLY_SCENES: [
    { value: 'entity', label: '企业核算' },
    { value: 'project_loan', label: '项目贷款核算' }
  ],
  BUILTIN_RESULT_PARAM_IDS: ['P_ghg_total'],
  /** 模板适用行业：除人行八大高碳与我行主要行业外的兜底枚举 */
  INDUSTRY_OTHER_ALL: '__OTHER_ALL__',
  INDUSTRY_OTHER_ALL_LABEL: '其他全部行业通用',
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
    { id: 'P_fuel_amount', paramCode: 'PARAM_0011', name: '燃料消耗量', format: 'number', paramType: '数值型', category: '活动水平类', unit: 't', decimalPlaces: 4, scope: 'global', showInTemplate: true, status: 'active', applyIndustry: [] },
    { id: 'P_report_attach', paramCode: 'PARAM_0012', name: '报告佐证材料', format: 'attachment', paramType: '附件型', category: '基础信息类', unit: '—', scope: 'global', showInTemplate: true, status: 'active', applyIndustry: [], attachAccept: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpeg,.jpg', attachMaxCount: 3, attachMaxMb: 20 }
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
    { id: 'tpl_np_水泥_energy', templateName: '建材-水泥-能源法', industry: '建材', subCategory: '水泥', bizType: 'non_project', methodId: 'energy', priority: 1, applyScene: ['entity'], status: 'published', enabled: true, version: 'V1.0', fieldCount: 16, formulaCount: 3, updatedAt: '2026-06-15', updatedBy: '李强' },
    { id: 'tpl_p_电力_energy', templateName: '电力-能源法（项目贷款）', industry: '电力', subCategory: '', bizType: 'project', methodId: 'energy', priority: 1, applyScene: ['project_loan'], status: 'draft', enabled: true, version: '—', fieldCount: 17, formulaCount: 4, updatedAt: '2026-06-24', updatedBy: '张明' },
    { id: 'tpl_np_钢铁_energy', templateName: '钢铁-能源法', industry: '钢铁', subCategory: '', bizType: 'non_project', methodId: 'energy', priority: 1, applyScene: ['entity'], status: 'draft', enabled: true, version: '—', fieldCount: 8, formulaCount: 0, updatedAt: '2026-06-22', updatedBy: '陈静' }
  ],

  STORAGE_KEY: 'method_config_demo',

  init() {
    this._registerSeedTemplate(window.METHOD_CONFIG_FLAT_GLASS);
    this._registerSeedTemplate(window.METHOD_CONFIG_MINING_ENERGY);
    this.loadPersisted();
  },

  _registerSeedTemplate(seed) {
    if (!seed?.templateId) return;
    const detail = JSON.parse(JSON.stringify(seed));
    if (detail.meta) this.syncMetaIndustries(detail.meta);
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
      if (detail?.meta) this.syncMetaIndustries(detail.meta);
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
    this._deduplicateTemplatesByIndustryMethod();
    this._migrateTemplateLibraryVersionRanks();
  },

  _migrateTemplateLibraryVersionRanks() {
    const data = this._readStorage();
    if (data._templateLibraryVersionMigrated) return;
    let changed = false;
    this.templates.forEach(t => {
      if (t.libraryVersionRank == null) {
        t.libraryVersionRank = 1;
        changed = true;
      }
    });
    Object.entries(this.templateDetails || {}).forEach(([id, detail]) => {
      if (detail?.meta && detail.meta.libraryVersionRank == null) {
        detail.meta.libraryVersionRank = 1;
        changed = true;
      }
    });
    if (changed) {
      data.templates = this.templates.map(t => ({ ...t }));
      data.templateDetails = data.templateDetails || {};
      Object.entries(this.templateDetails).forEach(([id, detail]) => {
        data.templateDetails[id] = detail;
      });
    }
    data._templateLibraryVersionMigrated = true;
    this._writeStorage(data);
  },

  getIndustryOptionGroups() {
    const pboRows = [];
    const bankRows = [];
    const hasCfg = typeof IndustryConfig !== 'undefined' && IndustryConfig.getRows().length > 0;
    if (hasCfg) {
      IndustryConfig.getRows().forEach(r => {
        const code = r.code || r.cascadeCode || '';
        const name = r.level4Name || r.name || '';
        if (!code) return;
        const label = `${code} ${name}`;
        if (IndustryConfig.hasTag(r, IndustryConfig.TAG_PBO_EIGHT)) pboRows.push({ code, label });
        if (IndustryConfig.hasTag(r, IndustryConfig.TAG_BANK_MAJOR)) bankRows.push({ code, label });
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
  },

  getTaggedIndustryCodeSet() {
    const set = new Set();
    this.getIndustryOptionGroups().forEach(g => {
      g.rows.forEach(r => set.add(r.code));
    });
    return set;
  },

  parseIndustriesCombined(raw) {
    const text = (raw || '').toString().trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean);
    } catch (_) { /* fall through */ }
    return text.split(/[,，、;；\s]+/).map(s => s.trim()).filter(Boolean);
  },

  normalizeTemplateIndustries(meta) {
    const m = meta || {};
    if (Array.isArray(m.industries) && m.industries.length) {
      return [...new Set(m.industries.map(v => String(v).trim()).filter(Boolean))];
    }
    if (Array.isArray(m.gbCodes) && m.gbCodes.length) {
      return [...new Set(m.gbCodes.map(v => String(v).trim()).filter(Boolean))];
    }
    const legacy = String(m.industry || '').trim();
    if (!legacy) return [];
    if (legacy === this.INDUSTRY_OTHER_ALL_LABEL) return [this.INDUSTRY_OTHER_ALL];
    if (/^[A-Z]\d{4}$/.test(legacy)) return [legacy];
    return [legacy];
  },

  formatIndustryCodeLabel(code, context) {
    const c = String(code || '').trim();
    if (!c) return '';
    if (c === this.INDUSTRY_OTHER_ALL) return this.INDUSTRY_OTHER_ALL_LABEL;
    if (/^[A-Z]\d{4}\s+\S/.test(c)) return c;

    const groups = this.getIndustryOptionGroups();
    if (/^[A-Z]\d{4}$/.test(c)) {
      for (const g of groups) {
        const row = g.rows.find(r => r.code === c);
        if (row) return row.label;
      }
      const row = typeof INDUSTRY_TABLE !== 'undefined' ? INDUSTRY_TABLE.find(r => r.code === c) : null;
      return row ? `${row.code} ${row.name}` : c;
    }

    const sub = String((context && context.subCategory) || '').trim();
    if (sub) {
      const subRow = this._findIndustryRowByNameOrMajor(sub);
      if (subRow) return `${subRow.code} ${subRow.name}`;
    }

    for (const g of groups) {
      const row = g.rows.find(r => r.code === c || r.label === c || r.label.endsWith(` ${c}`));
      if (row) return row.label;
    }

    const row = this._findIndustryRowByNameOrMajor(c);
    if (row) return `${row.code} ${row.name}`;
    return c;
  },

  _findIndustryRowByNameOrMajor(text) {
    const t = String(text || '').trim();
    if (!t || typeof INDUSTRY_TABLE === 'undefined') return null;
    const norm = s => String(s || '').replace(/制造$|业$/, '').trim();
    let row = INDUSTRY_TABLE.find(r =>
      r.name === t || r.name.includes(t) || t.includes(r.name) || norm(r.name) === norm(t)
    );
    if (row) return row;
    row = INDUSTRY_TABLE.find(r => r.major === t);
    if (row) return row;
    if (typeof GUIDE !== 'undefined' && Array.isArray(GUIDE.INDUSTRIES)) {
      const ind = GUIDE.INDUSTRIES.find(x => x.major === t);
      const code = ind?.codes?.[0];
      if (code) {
        return INDUSTRY_TABLE.find(r => r.code === code)
          || { code, name: ind.names?.[0] || t };
      }
    }
    return null;
  },

  formatTemplateIndustriesDisplay(meta) {
    const industries = this.normalizeTemplateIndustries(meta);
    if (!industries.length) {
      const legacy = String(meta?.industry || '').trim();
      return legacy ? this.formatIndustryCodeLabel(legacy, meta) : '—';
    }
    if (industries.length === 1 && industries[0] === this.INDUSTRY_OTHER_ALL) {
      return this.INDUSTRY_OTHER_ALL_LABEL;
    }
    const labels = industries.map(c => this.formatIndustryCodeLabel(c, meta));
    if (labels.length <= 2) return labels.join('、');
    return `${labels.slice(0, 2).join('、')} 等${labels.length}项`;
  },

  syncMetaIndustries(meta) {
    const m = meta || {};
    const industries = this.normalizeTemplateIndustries(m);
    m.industries = industries;
    m.gbCodes = industries.filter(c => c !== this.INDUSTRY_OTHER_ALL);
    if (industries.includes(this.INDUSTRY_OTHER_ALL) && industries.length === 1) {
      m.industry = this.INDUSTRY_OTHER_ALL_LABEL;
    } else if (industries.length === 1) {
      m.industry = this.formatIndustryCodeLabel(industries[0], m) || industries[0];
    } else if (industries.length > 1) {
      const named = industries
        .filter(c => c !== this.INDUSTRY_OTHER_ALL)
        .map(c => this.formatIndustryCodeLabel(c, m));
      if (industries.includes(this.INDUSTRY_OTHER_ALL)) named.unshift(this.INDUSTRY_OTHER_ALL_LABEL);
      m.industry = named.join('、');
    } else {
      m.industry = '';
    }
    return m;
  },

  _industryMajorGbCodes(nameOrMajor) {
    const t = String(nameOrMajor || '').trim();
    if (!t || typeof GUIDE === 'undefined') return [];
    const ind = (GUIDE.INDUSTRIES || []).find(x =>
      x.major === t || t.includes(x.major) || x.major.includes(t)
    );
    return ind?.codes?.length ? ind.codes.slice() : [];
  },

  /** 模板唯一性校验用的行业键（国标代码 / 其他全部行业通用 / legacy） */
  resolveTemplateUniquenessIndustryKeys(meta) {
    const industries = this.normalizeTemplateIndustries(meta);
    const keys = new Set();
    industries.forEach(raw => {
      const item = String(raw || '').trim();
      if (!item) return;
      if (item === this.INDUSTRY_OTHER_ALL) {
        keys.add('__OTHER_ALL__');
        return;
      }
      if (/^[A-Z]\d{4}$/.test(item)) {
        keys.add(item);
        return;
      }
      const majorCodes = this._industryMajorGbCodes(item);
      if (majorCodes.length) {
        majorCodes.forEach(c => keys.add(c));
        return;
      }
      const row = this._findIndustryRowByNameOrMajor(item);
      if (row?.code) keys.add(row.code);
      else keys.add(`legacy:${item}`);
    });
    const sub = String(meta?.subCategory || '').trim();
    if (sub) {
      const subRow = this._findIndustryRowByNameOrMajor(sub);
      if (subRow?.code) keys.add(subRow.code);
    }
    return [...keys];
  },

  formatUniquenessIndustryKey(key, meta) {
    if (key === '__OTHER_ALL__') return this.INDUSTRY_OTHER_ALL_LABEL;
    if (String(key).startsWith('legacy:')) return String(key).slice(7);
    return this.formatIndustryCodeLabel(key, meta);
  },

  getTemplateMetaForUniqueness(templateId) {
    const tpl = this.templates.find(t => t.id === templateId);
    const detail = this.getTemplateDetail(templateId);
    const meta = { ...(tpl || {}), ...(detail?.meta || {}) };
    return this.syncMetaIndustries(meta);
  },

  findTemplateIndustryMethodConflicts(meta, excludeTemplateId = null) {
    const methodId = String(meta?.methodId || '').trim();
    if (!methodId) return [];
    const libraryVersionRank = this.resolveTemplateLibraryVersionRank(meta?.libraryVersionRank);
    const keySet = new Set(this.resolveTemplateUniquenessIndustryKeys(meta));
    if (!keySet.size) return [];
    const conflicts = [];
    this.templates.forEach(t => {
      if (excludeTemplateId && t.id === excludeTemplateId) return;
      if (t.enabled === false) return;
      if (String(t.methodId || '') !== methodId) return;
      const otherMeta = this.getTemplateMetaForUniqueness(t.id);
      if (this.resolveTemplateLibraryVersionRank(otherMeta.libraryVersionRank ?? t.libraryVersionRank) !== libraryVersionRank) return;
      const overlap = this.resolveTemplateUniquenessIndustryKeys(otherMeta).filter(k => keySet.has(k));
      if (!overlap.length) return;
      conflicts.push({
        templateId: t.id,
        templateName: t.templateName || otherMeta.templateName || t.id,
        status: t.status || otherMeta.status || 'draft',
        methodId,
        methodLabel: this.methodLabel(methodId),
        overlap,
        overlapLabels: overlap.map(k => this.formatUniquenessIndustryKey(k, otherMeta))
      });
    });
    return conflicts;
  },

  validateTemplateIndustryMethodUnique(meta, excludeTemplateId = null) {
    const synced = this.syncMetaIndustries({ ...(meta || {}) });
    const conflicts = this.findTemplateIndustryMethodConflicts(synced, excludeTemplateId);
    if (!conflicts.length) return { ok: true };
    const c = conflicts[0];
    const industries = c.overlapLabels.slice(0, 2).join('、');
    const more = c.overlapLabels.length > 2 ? ` 等${c.overlapLabels.length}项` : '';
    const statusLabel = c.status === 'published' ? '已发布' : '草稿';
    return {
      ok: false,
      message: `「${industries}${more}」已存在「${c.methodLabel}」模板「${c.templateName}」（${statusLabel}）。每个行业每种核算方法仅允许一套模板，请直接编辑现有模板，或调整行业/核算方法后再保存。`,
      conflicts,
      id: c.templateId
    };
  },

  _pickTemplateUniquenessLoser(a, b) {
    const score = (t) => {
      let s = 0;
      if (t.status === 'published') s += 100;
      if (t.updatedAt) s += 1;
      return s;
    };
    const sa = score(a);
    const sb = score(b);
    if (sa !== sb) return sa < sb ? a : b;
    return String(a.updatedAt || '') < String(b.updatedAt || '') ? a : b;
  },

  /** 兼容旧数据：移除同一行业·方法重复的模板，保留已发布/较新版本 */
  _deduplicateTemplatesByIndustryMethod() {
    const data = this._readStorage();
    if (data._templateIndustryMethodDedupedV1) return;
    const removeIds = new Set();
    for (let i = 0; i < this.templates.length; i++) {
      for (let j = i + 1; j < this.templates.length; j++) {
        const a = this.templates[i];
        const b = this.templates[j];
        if (removeIds.has(a.id) || removeIds.has(b.id)) continue;
        if (String(a.methodId || '') !== String(b.methodId || '')) continue;
        const rankA = this.resolveTemplateLibraryVersionRank(a.libraryVersionRank ?? this.getTemplateMetaForUniqueness(a.id).libraryVersionRank);
        const rankB = this.resolveTemplateLibraryVersionRank(b.libraryVersionRank ?? this.getTemplateMetaForUniqueness(b.id).libraryVersionRank);
        if (rankA !== rankB) continue;
        const keysA = new Set(this.resolveTemplateUniquenessIndustryKeys(this.getTemplateMetaForUniqueness(a.id)));
        const overlap = this.resolveTemplateUniquenessIndustryKeys(this.getTemplateMetaForUniqueness(b.id))
          .some(k => keysA.has(k));
        if (!overlap) continue;
        const loser = this._pickTemplateUniquenessLoser(a, b);
        removeIds.add(loser.id);
      }
    }
    if (removeIds.size) {
      this.templates = this.templates.filter(t => !removeIds.has(t.id));
      removeIds.forEach(id => delete this.templateDetails[id]);
      data.templates = this.templates.map(t => ({ ...t }));
      if (data.templateDetails) {
        removeIds.forEach(id => delete data.templateDetails[id]);
      }
    }
    data._templateIndustryMethodDedupedV1 = true;
    this._writeStorage(data);
  },

  templateMatchesIndustryFilter(meta, filterCode) {
    const code = String(filterCode || '').trim();
    if (!code) return true;
    const industries = this.normalizeTemplateIndustries(meta);
    if (industries.includes(code)) return true;
    if (code === this.INDUSTRY_OTHER_ALL && industries.includes(this.INDUSTRY_OTHER_ALL)) return true;
    return industries.some(c => this.formatIndustryCodeLabel(c) === code || c === code);
  },

  isOtherAllIndustryGbCode(gbCode) {
    const code = String(gbCode || '').trim();
    if (!code) return false;
    return !this.getTaggedIndustryCodeSet().has(code);
  },

  resolveTemplateForSubject({ gbCode, bizType, methodId, applyScene, templateVersionRank } = {}) {
    const code = String(gbCode || '').trim();
    const tagged = this.getTaggedIndustryCodeSet();
    const libraryRank = templateVersionRank != null
      ? this.resolveTemplateLibraryVersionRank(templateVersionRank)
      : this.getDefaultTemplateLibraryVersionRank();
    const candidates = this.templates
      .filter(t => this.resolveTemplateLibraryVersionRank(t.libraryVersionRank) === libraryRank)
      .filter(t => t.status === 'published')
      .filter(t => !bizType || t.bizType === bizType)
      .filter(t => !methodId || t.methodId === methodId)
      .filter(t => !applyScene || (t.applyScene || []).includes(applyScene))
      .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

    const matchByIndustries = (tpl) => {
      const detail = this.getTemplateDetail(tpl.id);
      const meta = { ...(detail?.meta || {}), ...tpl };
      const industries = this.normalizeTemplateIndustries(meta);
      if (code && industries.includes(code)) return detail || tpl;
      if (code && (meta.gbCodes || []).includes(code)) return detail || tpl;
      return null;
    };

    for (const tpl of candidates) {
      const hit = matchByIndustries(tpl);
      if (hit) return hit;
    }

    if (code && !tagged.has(code)) {
      for (const tpl of candidates) {
        const detail = this.getTemplateDetail(tpl.id);
        const meta = { ...(detail?.meta || {}), ...tpl };
        const industries = this.normalizeTemplateIndustries(meta);
        if (industries.includes(this.INDUSTRY_OTHER_ALL)) return detail || tpl;
      }
    }
    return null;
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
    const normalized = {
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
    if (format === 'attachment') {
      normalized.attachAccept = (p.attachAccept || this.DEFAULT_ATTACH_ACCEPT).trim();
      normalized.attachMaxCount = Math.min(20, Math.max(1, Number(p.attachMaxCount) || this.DEFAULT_ATTACH_MAX_COUNT));
      normalized.attachMaxMb = Math.min(2048, Math.max(1, Number(p.attachMaxMb) || this.DEFAULT_ATTACH_MAX_MB));
    }
    return normalized;
  },

  resolveAttachConstraints(p) {
    return {
      accept: (p?.attachAccept || this.DEFAULT_ATTACH_ACCEPT).trim(),
      maxCount: Math.min(20, Math.max(1, Number(p?.attachMaxCount) || this.DEFAULT_ATTACH_MAX_COUNT)),
      maxMb: Math.min(2048, Math.max(1, Number(p?.attachMaxMb) || this.DEFAULT_ATTACH_MAX_MB))
    };
  },

  formatAttachAcceptDisplay(accept) {
    return String(accept || this.DEFAULT_ATTACH_ACCEPT).replace(/\./g, '').replace(/,/g, '、');
  },

  formatAttachMetaText(p) {
    const { accept, maxCount, maxMb } = this.resolveAttachConstraints(p);
    return `支持 ${this.formatAttachAcceptDisplay(accept)}；最多 ${maxCount} 个，单文件 ≤ ${maxMb}MB`;
  },

  getMethodCollectHint(methodId) {
    const id = String(methodId || '').trim();
    return this.METHOD_COLLECT_HINTS[id] || null;
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
    const combined = (fd.get('paramUnitsCombined') || '').toString().trim();
    if (combined) {
      try {
        const parsed = JSON.parse(combined);
        if (Array.isArray(parsed)) {
          return [...new Set(parsed.map(u => String(u).trim()).filter(Boolean))];
        }
      } catch (_) { /* fall through */ }
      return this.parseUnitsInput(combined);
    }
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
    if (units.length > 1) {
      const assessments = units.map(u => this.assessUnitConversion(u, factorUnitFull));
      if (assessments.every(a => a.match)) return assessments[0];
      const needConv = assessments.find(a => a.needsConversion) || assessments[0];
      return { ...needConv, match: false, needsConversion: true };
    }
    return this.assessUnitConversion(units[0], factorUnitFull);
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
    // 支持分号分隔（新 tag 输入）和换行分隔（旧 textarea）两种格式
    const enumValues = enumRaw
      ? enumRaw.split(/[;\n；]/).map(s => s.trim()).filter(Boolean)
      : undefined;
    // 优先读新的多选下拉（applyIndustryCombined JSON），兼容旧 checkbox（applyIndustry）
    const industryCombined = (fd.get('applyIndustryCombined') || '').toString().trim();
    let applyIndustry;
    if (industryCombined) {
      try {
        const parsed = JSON.parse(industryCombined);
        applyIndustry = Array.isArray(parsed)
          ? parsed.map(v => String(v).trim()).filter(Boolean)
          : [];
      } catch (_) {
        applyIndustry = industryCombined.split(/[,，、;；\s]+/).map(s => s.trim()).filter(Boolean);
      }
    } else {
      applyIndustry = fd.getAll('applyIndustry').filter(Boolean);
    }
    const minVal = fd.get('validateMin');
    const paramId = (fd.get('id') || '').toString().trim();
    const existingParam = paramId ? this.getParam(paramId) : null;
    const unitType = existingParam?.unitType || 'common';
    const payload = {
      id: paramId,
      paramCode: (fd.get('paramCode') || '').toString().trim(),
      name: (fd.get('name') || '').toString().trim(),
      paramType,
      format,
      category: (fd.get('category') || '活动水平类').toString(),
      status: existingParam?.status || 'active',
      applyIndustry,
      remark: existingParam?.remark ?? existingParam?.description ?? '',
      description: existingParam?.description ?? existingParam?.remark ?? '',
      scope: 'custom',
      showInTemplate: existingParam ? existingParam.showInTemplate !== false : true,
      validateRule: {
        min: minVal === '' || minVal == null ? 0 : Number(minVal),
        decimalPlaces: Number(fd.get('decimalPlaces')) || 4
      }
    };
    if (format === 'text') {
      payload.textMode = existingParam?.textMode || 'single';
      payload.maxLength = Number(fd.get('maxLength')) || 200;
      payload.unit = '—';
    } else if (format === 'number') {
      const units = this.readParamUnitsFromForm(fd, unitType);
      payload.decimalPlaces = Number(fd.get('decimalPlaces')) || 4;
      payload.unitType = unitType;
      this.applyParamUnits(payload, units, unitType);
    } else if (format === 'option') {
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
    const industryLabel = typeof factorIndustryDisplayLabel === 'function'
      ? factorIndustryDisplayLabel(f)
      : (f.gbIndustryName || f.industryMajor || '');
    const industryText = industryLabel && industryLabel !== '-' ? String(industryLabel).trim() : '';
    const displayLabel = `${detailLabel} · ${valueUnit}`.replace(/\s·\s-$/, '').trim();
    const searchText = `${detailLabel} ${industryText} ${f.id || ''} ${valueText} ${unit}`.toLowerCase();
    return { detailLabel, valueText, unit, industryLabel: industryText, displayLabel, searchText };
  },

  formatFactorLibraryOptionWithYear(f) {
    const fmt = this.formatFactorLibraryOption(f);
    const year = typeof normalizeFactorVersionYear === 'function'
      ? normalizeFactorVersionYear(f)
      : f.versionYear;
    const versionLabel = typeof formatFactorVersionLabelForRecord === 'function'
      ? formatFactorVersionLabelForRecord(f)
      : 'v1.0';
    return {
      ...fmt,
      versionYear: year,
      versionLabel,
      displayLabel: `${fmt.displayLabel} · ${versionLabel}`
    };
  },

  getFactorLibraryOptions(versionRank) {
    if (typeof Store === 'undefined') return [];
    const factors = Store.get()?.factors || [];
    if (!factors.length) return [];
    const rank = this.resolveTemplateFactorVersionRank(versionRank);
    let list = factors;
    if (typeof factorGroupKey === 'function'
      && typeof groupFactorRecords === 'function'
      && typeof applyFactorListVersionRank === 'function') {
      const groups = groupFactorRecords(factors);
      list = applyFactorListVersionRank(groups, rank).map(g => g.factor).filter(Boolean);
    }
    return list.map(f => {
      const fmt = this.formatFactorLibraryOptionWithYear(f);
      return {
        id: f.id,
        name: fmt.detailLabel,
        detailLabel: fmt.detailLabel,
        value: f.value ?? f.factorValue ?? '',
        valueText: fmt.valueText,
        unit: fmt.unit,
        industryLabel: fmt.industryLabel,
        displayLabel: fmt.displayLabel,
        searchText: `${fmt.searchText} ${fmt.industryLabel || ''} ${fmt.versionYear} ${fmt.versionLabel || ''}`.toLowerCase(),
        versionYear: fmt.versionYear
      };
    });
  },

  getDefaultFactorVersionRank() {
    const opts = this.getFactorLibraryVersionOptions();
    return opts.length ? opts[opts.length - 1].rank : 1;
  },

  resolveTemplateFactorVersionRank(metaOrRank) {
    let rank;
    if (typeof metaOrRank === 'number' || typeof metaOrRank === 'string') {
      rank = Number(metaOrRank);
    } else {
      rank = Number(metaOrRank?.factorVersionRank);
    }
    if (!Number.isNaN(rank) && rank >= 1) return Math.floor(rank);
    return this.getDefaultFactorVersionRank();
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

  /** 因子库中当前最高适用年度（用于模板一键更新默认值等） */
  getLatestFactorLibraryYear() {
    if (typeof Store === 'undefined') return new Date().getFullYear();
    const factors = Store.get()?.factors || [];
    const years = factors.map(f =>
      typeof normalizeFactorVersionYear === 'function'
        ? normalizeFactorVersionYear(f)
        : (Number(f.versionYear) || 0)
    ).filter(y => y >= 2000 && y <= 2100);
    return years.length ? Math.max(...years) : new Date().getFullYear();
  },

  /** 因子库可选版本号列表（v1.0、v2.0…，取各因子组最大版本数） */
  getFactorLibraryVersionOptions() {
    if (typeof Store === 'undefined') {
      return [{ rank: 1, label: 'v1.0' }];
    }
    const factors = Store.get()?.factors || [];
    if (!factors.length || typeof factorGroupKey !== 'function') {
      return [{ rank: 1, label: 'v1.0' }];
    }
    const map = new Map();
    factors.forEach(f => {
      const gk = factorGroupKey(f);
      if (!map.has(gk)) map.set(gk, []);
      map.get(gk).push(f);
    });
    let maxRank = 1;
    map.forEach(list => { maxRank = Math.max(maxRank, list.length); });
    return Array.from({ length: maxRank }, (_, i) => {
      const rank = i + 1;
      const label = typeof formatFactorVersionNo === 'function'
        ? formatFactorVersionNo(rank)
        : `v${rank}.0`;
      return { rank, label };
    });
  },

  /** 将因子 ID 解析为指定年度的版本 ID；无匹配时返回原 ID */
  resolveFactorVersionUpgrade(factorId, taskYear) {
    if (!factorId || typeof Store === 'undefined') return factorId || '';
    const factors = Store.get()?.factors || [];
    const current = factors.find(f => f.id === factorId);
    if (!current || typeof factorGroupKey !== 'function' || typeof pickFactorVersion !== 'function') {
      return factorId;
    }
    const gk = factorGroupKey(current);
    const versions = factors.filter(f => factorGroupKey(f) === gk);
    const picked = pickFactorVersion(versions, taskYear);
    return picked?.id || factorId;
  },

  /** 按版本序号（1=v1.0）解析因子 ID；组内不足该序号时取该组最新可用版本 */
  resolveFactorVersionUpgradeByRank(factorId, versionRank) {
    if (!factorId || typeof Store === 'undefined') return factorId || '';
    const rank = Math.max(1, Number(versionRank) || 1);
    const factors = Store.get()?.factors || [];
    const current = factors.find(f => f.id === factorId);
    if (!current || typeof factorGroupKey !== 'function') return factorId;
    const versions = factors.filter(f => factorGroupKey(f) === factorGroupKey(current));
    if (typeof sortFactorVersionsAsc === 'function') {
      const asc = sortFactorVersionsAsc(versions);
      const idx = Math.min(rank - 1, asc.length - 1);
      return asc[idx]?.id || factorId;
    }
    if (typeof pickFactorVersion === 'function') {
      const sorted = [...versions].sort((a, b) =>
        (Number(a.versionYear) || 0) - (Number(b.versionYear) || 0)
      );
      const idx = Math.min(rank - 1, sorted.length - 1);
      return sorted[idx]?.id || factorId;
    }
    return factorId;
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
  PARAM_IMPORT_HEADERS: ['参数名称', '参数分类', '参数类型', '单位', '适用行业', '小数位数', '枚举值'],

  downloadParamImportTemplate() {
    if (typeof downloadCsvFile !== 'function') return;
    downloadCsvFile('参数导入模板', this.PARAM_IMPORT_HEADERS, [
      ['煤炭消耗量', '活动水平类', '数值型', 't', '', '4', ''],
      ['燃料品种', '活动水平类', '选项型', '—', '', '', '烟煤;褐煤;天然气']
    ]);
  },

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
        attachAccept: format === 'attachment' ? this.DEFAULT_ATTACH_ACCEPT : undefined,
        attachMaxCount: format === 'attachment' ? this.DEFAULT_ATTACH_MAX_COUNT : undefined,
        attachMaxMb: format === 'attachment' ? this.DEFAULT_ATTACH_MAX_MB : undefined
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

  copyParam(paramId) {
    const src = this.getParam(String(paramId || '').trim());
    if (!src) return { ok: false, message: '参数不存在' };
    const newCode = this.generateParamCode();
    const newId = `P_${newCode.replace(/^PARAM_/, '')}`;
    // 名称加"副本"后缀，若已有则继续叠加
    let newName = src.name + '副本';
    let suffix = 1;
    while (this.params.some(p => p.name === newName)) {
      newName = src.name + '副本' + (++suffix);
    }
    const copy = {
      ...src,
      id: newId,
      paramCode: newCode,
      name: newName,
      scope: 'custom',
      builtin: false,
      status: 'active'
    };
    delete copy.builtinKey;
    const result = this.saveParam(copy, true);
    if (result.ok) result.param = this.getParam(newId) || copy;
    return result;
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
  createTemplate({ templateName, industry, industries, subCategory, methodId, priority, applyScene, description, copyFromId, isNewIndustry, bizType, factorVersionRank, libraryVersionRank }) {
    const resolvedIndustries = this.parseIndustriesCombined(
      Array.isArray(industries) ? JSON.stringify(industries) : industries
    );
    if (!resolvedIndustries.length && industry) resolvedIndustries.push(String(industry).trim());
    if (!resolvedIndustries.length) return { ok: false, message: '请选择适用行业' };

    const primaryIndustry = resolvedIndustries.find(c => c !== this.INDUSTRY_OTHER_ALL)
      || (resolvedIndustries.includes(this.INDUSTRY_OTHER_ALL) ? 'other_all' : '');
    const industryKey = primaryIndustry === 'other_all' ? 'other_all' : primaryIndustry;

    if (isNewIndustry && industryKey !== 'other_all') {
      const ensured = this.ensureIndustry(industryKey);
      if (!ensured.ok) return ensured;
    }
    const scenes = Array.isArray(applyScene) ? applyScene : ['entity', 'project_loan'];
    if (!scenes.length) return { ok: false, message: '请至少选择一个适用场景' };
    const resolvedBiz = bizType || (scenes.includes('project_loan') && !scenes.includes('entity') ? 'project' : 'non_project');
    const draftMeta = {
      industries: resolvedIndustries,
      subCategory: subCategory || '',
      methodId,
      bizType: resolvedBiz,
      applyScene: scenes,
      libraryVersionRank: this.resolveTemplateLibraryVersionRank(libraryVersionRank)
    };
    this.syncMetaIndustries(draftMeta);
    const unique = this.validateTemplateIndustryMethodUnique(draftMeta, null);
    if (!unique.ok) return unique;

    const id = this.makeTemplateId(industryKey, resolvedBiz, methodId);
    const meta = this.templates.find(t => t.id === id);
    if (meta) {
      return { ok: false, message: '该行业·核算方法已有模板，请直接编辑', id: meta.id };
    }

    let detail;
    if (copyFromId) {
      detail = this.copyTemplateDetail(copyFromId, id, industryKey, resolvedBiz, methodId);
      if (!detail) return { ok: false, message: '复制来源模板不存在' };
    } else {
      detail = this.createEmptyTemplate(id, industryKey, resolvedBiz, methodId);
    }
    detail.meta.templateName = templateName || detail.meta.templateName;
    detail.meta.subCategory = subCategory || '';
    detail.meta.priority = Number(priority) || 3;
    detail.meta.applyScene = scenes;
    detail.meta.description = (description || '').trim();
    detail.meta.industries = resolvedIndustries;
    detail.meta.factorVersionRank = this.resolveTemplateFactorVersionRank(factorVersionRank);
    detail.meta.libraryVersionRank = this.resolveTemplateLibraryVersionRank(libraryVersionRank);
    this.syncMetaIndustries(detail.meta);
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
        entityFormulaSummary: '',
        factorVersionRank: this.getDefaultFactorVersionRank()
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
    if (detail.meta) {
      detail.meta.factorVersionRank = this.resolveTemplateFactorVersionRank(detail.meta);
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
        enabled: detail.meta.enabled ?? tpl.enabled,
        industries: detail.meta.industries?.length ? detail.meta.industries : (tpl.industries || [])
      };
      this.syncMetaIndustries(detail.meta);
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
    copy.meta.industries = this.normalizeTemplateIndustries(src.meta);
    this.syncMetaIndustries(copy.meta);
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
        const amountUnits = this.getParamUnits(amountP);
        const unitAssess = this.assessParamUnitConversion(amountP, factorUnitFull);
        let dynUnitConversions = prev.unitConversions || [];
        let conversionFactor = 1;
        let convNote = '';
        if (amountUnits.length > 1 && form) {
          dynUnitConversions = amountUnits.map((u, i) => {
            const cfEl = form.querySelector(`[name="inline_unit_factor_${refKey}_u${i}"]`);
            const noteEl = form.querySelector(`[name="inline_unit_note_${refKey}_u${i}"]`);
            const assess = this.assessUnitConversion(u, factorUnitFull);
            const cfRaw = cfEl?.value?.trim();
            const cf = cfRaw !== '' && cfRaw != null ? Number(cfRaw) : (assess.match ? 1 : (assess.suggestedFactor ?? 1));
            return {
              unit: u,
              conversionFactor: Number.isFinite(cf) ? cf : 1,
              conversionNote: noteEl?.value?.trim() || assess.suggestedLabel || '',
              match: assess.match
            };
          });
          const best = dynUnitConversions.find(c => c.match) || dynUnitConversions[0];
          conversionFactor = best?.conversionFactor ?? 1;
          convNote = best?.conversionNote || '';
        } else {
          const convInput = form?.querySelector(`[name="inline_unit_factor_${refKey}"]`);
          convNote = form?.querySelector(`[name="inline_unit_note_${refKey}"]`)?.value?.trim() || '';
          if (unitAssess.needsConversion) {
            const raw = convInput?.value?.trim();
            conversionFactor = raw !== '' && raw != null ? Number(raw) : (prev.conversionFactor ?? unitAssess.suggestedFactor ?? 1);
            if (!Number.isFinite(conversionFactor)) conversionFactor = 1;
          }
        }
        let formulaExpr = this.expandDynamicRowFormula(sectionFormulaExpr, refKey, amountId);
        if ((unitAssess.needsConversion || amountUnits.length > 1) && conversionFactor !== 1 && amountId) {
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
          conversionFactor: (unitAssess.needsConversion || amountUnits.length > 1) ? conversionFactor : 1,
          unitConversions: dynUnitConversions.length ? dynUnitConversions : prev.unitConversions || [],
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
        const paramUnits = this.getParamUnits(p);
        const unitAssess = this.assessParamUnitConversion(p, factorUnitFull);
        // 多单位：逐单位收集换算系数
        let unitConversions = prev.unitConversions || [];
        let conversionFactor = 1;
        let convNote = '';
        if (paramUnits.length > 1 && form) {
          unitConversions = paramUnits.map((u, i) => {
            const cfEl = form.querySelector(`[name="inline_unit_factor_${refKey}_u${i}"]`);
            const noteEl = form.querySelector(`[name="inline_unit_note_${refKey}_u${i}"]`);
            const assess = this.assessUnitConversion(u, factorUnitFull);
            const cfRaw = cfEl?.value?.trim();
            const cf = cfRaw !== '' && cfRaw != null ? Number(cfRaw) : (assess.match ? 1 : (assess.suggestedFactor ?? 1));
            return {
              unit: u,
              conversionFactor: Number.isFinite(cf) ? cf : 1,
              conversionNote: noteEl?.value?.trim() || assess.suggestedLabel || '',
              match: assess.match
            };
          });
          // 主 conversionFactor 取最优（单位匹配的那个）
          const best = unitConversions.find(c => c.match) || unitConversions[0];
          conversionFactor = best?.conversionFactor ?? 1;
          convNote = best?.conversionNote || '';
        } else {
          const convInput = form?.querySelector(`[name="inline_unit_factor_${refKey}"]`);
          convNote = form?.querySelector(`[name="inline_unit_note_${refKey}"]`)?.value?.trim() || '';
          if (unitAssess.needsConversion) {
            const raw = convInput?.value?.trim();
            conversionFactor = raw !== '' && raw != null ? Number(raw) : (prev.conversionFactor ?? unitAssess.suggestedFactor ?? 1);
            if (!Number.isFinite(conversionFactor)) conversionFactor = 1;
          }
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
          conversionFactor: (unitAssess.needsConversion || paramUnits.length > 1) ? conversionFactor : 1,
          unitConversions: unitConversions.length ? unitConversions : prev.unitConversions || [],
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
    const industries = this.parseIndustriesCombined(
      form.querySelector('[name="meta_industryCombined"]')?.value || ''
    );
    if (!industries.length) {
      const legacy = form.querySelector('[name="meta_industry"]')?.value?.trim() || '';
      if (legacy) industries.push(legacy);
    }
    const meta = {
      templateName: form.querySelector('[name="meta_templateName"]')?.value?.trim() || '',
      industries,
      subCategory: form.querySelector('[name="meta_subCategory"]')?.value?.trim() || '',
      methodId: (typeof resolveMethodIdFromName === 'function'
        ? resolveMethodIdFromName(form.querySelector('[name="meta_methodId"]')?.value?.trim() || '')
        : form.querySelector('[name="meta_methodId"]')?.value?.trim()) || '',
      priority: Number(form.querySelector('[name="meta_priority"]')?.value) || 3,
      applyScene: applyScene.length ? applyScene : ['entity'],
      bizType,
      description: form.querySelector('[name="meta_description"]')?.value?.trim() || '',
      factorVersionRank: this.resolveTemplateFactorVersionRank(
        form.querySelector('[name="meta_factorVersionRank"]')?.value
      )
    };
    this.syncMetaIndustries(meta);
    return { meta };
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
      if (!form?.querySelector('[name="meta_templateName"]')) return next;
      const basic = this.readTemplateBasicInfo(form);
      next.meta = { ...next.meta, ...basic.meta };
    } else if (step === '2') {
      if (!form?.querySelector('[data-partition-row]')) return next;
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
    if (detail.meta) this.syncMetaIndustries(detail.meta);
    const unique = this.validateTemplateIndustryMethodUnique(detail.meta, id);
    if (!unique.ok) return unique;
    this.templateDetails[id] = detail;

    const tplIdx = this.templates.findIndex(t => t.id === id);
    const tplPatch = {
      id,
      templateName: detail.meta.templateName,
      industry: detail.meta.industry,
      industries: detail.meta.industries || [],
      gbCodes: detail.meta.gbCodes || [],
      subCategory: detail.meta.subCategory || '',
      bizType: detail.meta.bizType,
      methodId: detail.meta.methodId,
      priority: detail.meta.priority ?? 3,
      applyScene: detail.meta.applyScene || ['entity'],
      status: detail.meta.status || 'draft',
      enabled: detail.meta.enabled !== false,
      version: detail.meta.version || '—',
      libraryVersionRank: this.resolveTemplateLibraryVersionRank(detail.meta.libraryVersionRank),
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
    if (!this.normalizeTemplateIndustries(m).length) errors.push('基础信息：所属行业未选择');
    if (!m.methodId) errors.push('基础信息：核算方法未选择');
    if (!(m.applyScene || []).length) errors.push('基础信息：适用场景未选择');
    const unique = this.validateTemplateIndustryMethodUnique(m, detail.meta?.id || detail.templateId);
    if (!unique.ok) errors.push(unique.message);
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
      const detail = this.getTemplateDetail(t.id);
      const meta = { ...(detail?.meta || {}), ...t };
      const industryText = `${t.templateName || ''} ${t.industry || ''} ${this.formatTemplateIndustriesDisplay(meta)}`.toLowerCase();
      if (kw && !industryText.includes(kw)) return false;
      if (industry && !this.templateMatchesIndustryFilter(meta, industry)) return false;
      if (methodId && t.methodId !== methodId) return false;
      if (status === 'draft' && t.status !== 'draft') return false;
      if (status === 'published' && t.status !== 'published') return false;
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
    const unique = this.validateTemplateIndustryMethodUnique(copy.meta, newId);
    if (!unique.ok) return unique;
    return this.saveTemplateDetail(copy);
  },

  deleteTemplate(templateId) {
    const tpl = this.templates.find(t => t.id === templateId);
    if (!tpl) return { ok: false, message: '模板不存在' };
    const isDraft = tpl.status === 'draft';
    const isPublished = tpl.status === 'published';
    if (!isDraft && !isPublished) return { ok: false, message: '无法删除该模板' };
    this.templates = this.templates.filter(t => t.id !== templateId);
    delete this.templateDetails[templateId];
    const data = this._readStorage();
    data.templates = this.templates.map(t => ({ ...t }));
    if (data.templateDetails?.[templateId]) delete data.templateDetails[templateId];
    this._writeStorage(data);
    if (isPublished) {
      return { ok: true, message: '模板已删除，历史数据采集仍绑定原发布版本，不受影响' };
    }
    return { ok: true, message: '草稿模板已删除' };
  },

  getParam(id) {
    const sid = String(id || '').trim();
    if (!sid) return undefined;
    const global = this.params.find(p => p.id === sid);
    const detail = Object.values(this.templateDetails).find(d => d.params?.some(p => p.id === sid));
    const fromDetail = detail?.params?.find(p => p.id === sid);
    if (!fromDetail) return global ? this.normalizeParam(global) : undefined;
    if (!global) return this.normalizeParam(fromDetail);
    // 模板内 params 为快照；单位、名称等主数据以参数库（含 overrides）为准
    const masterFields = [
      'name', 'units', 'unit', 'unitType', 'paramType', 'format', 'category',
      'enumValues', 'enumCount', 'decimalPlaces', 'validateRule', 'applyIndustry',
      'paramCode', 'status', 'remark', 'description', 'attachAccept', 'attachMaxCount',
      'attachMaxMb', 'maxLength', 'textMode', 'defaultValue', 'hasDefault', 'scope', 'showInTemplate'
    ];
    const merged = { ...fromDetail };
    masterFields.forEach(key => {
      if (global[key] !== undefined) merged[key] = global[key];
    });
    return this.normalizeParam(merged);
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
    return this.statusBadge(t?.status || 'draft');
  },

  templateStatusLabel(t) {
    return t?.status === 'published' ? '已发布' : '草稿';
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
  },

  formatTemplateLibraryVersionNo(rank) {
    const n = Math.max(1, Number(rank) || 1);
    return typeof formatFactorVersionNo === 'function' ? formatFactorVersionNo(n) : `v${n}.0`;
  },

  resolveTemplateLibraryVersionRank(value) {
    if (value == null || value === '') return 1;
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1) return Math.floor(n);
    return 1;
  },

  getDefaultTemplateLibraryVersionRank() {
    const ranks = this.collectTemplateLibraryVersionRanks(this.templates);
    return ranks.length ? ranks[ranks.length - 1] : 1;
  },

  getTemplateLibraryVersionSelectOptions() {
    const ranks = this.collectTemplateLibraryVersionRanks(this.templates);
    if (!ranks.length) return [{ rank: 1, label: this.formatTemplateLibraryVersionNo(1) }];
    const latest = ranks[ranks.length - 1];
    return ranks.map(rank => ({
      rank,
      label: this.formatTemplateLibraryVersionNo(rank) + (rank === latest ? '（最新版本）' : '')
    }));
  },

  resolveTaskTemplateVersionRank(value) {
    const opts = this.getTemplateLibraryVersionSelectOptions();
    const latest = opts[opts.length - 1]?.rank || 1;
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1 && opts.some(o => o.rank === n)) return n;
    return latest;
  },

  formatTaskTemplateVersionDisplay(rank) {
    const opts = this.getTemplateLibraryVersionSelectOptions();
    const latest = opts[opts.length - 1]?.rank || 1;
    const r = this.resolveTaskTemplateVersionRank(rank);
    let label = this.formatTemplateLibraryVersionNo(r);
    if (r === latest) label += '（最新版本）';
    return label;
  },

  collectTemplateLibraryVersionRanks(templates) {
    const groups = this.groupTemplateRecords(templates || this.templates);
    let max = 1;
    groups.forEach(g => { max = Math.max(max, g.versionCount || 1); });
    return Array.from({ length: max }, (_, i) => i + 1);
  },

  templateLibraryGroupKey(meta) {
    const synced = this.syncMetaIndustries({ ...(meta || {}) });
    const keys = this.resolveTemplateUniquenessIndustryKeys(synced).sort().join('\u001f');
    return `${synced.bizType || 'non_project'}\u001f${synced.methodId || ''}\u001f${keys}`;
  },

  groupTemplateRecords(templates) {
    const map = new Map();
    (templates || []).forEach(t => {
      const meta = this.getTemplateMetaForUniqueness(t.id);
      const groupKey = this.templateLibraryGroupKey(meta);
      if (!map.has(groupKey)) map.set(groupKey, []);
      map.get(groupKey).push({ ...t, libraryVersionRank: this.resolveTemplateLibraryVersionRank(t.libraryVersionRank ?? meta.libraryVersionRank) });
    });
    const groups = [];
    map.forEach((raw, groupKey) => {
      const versions = [...raw].sort((a, b) => (a.libraryVersionRank || 1) - (b.libraryVersionRank || 1));
      groups.push({
        groupKey,
        versions,
        latest: versions[versions.length - 1] || null,
        versionCount: versions.length
      });
    });
    return groups;
  },

  pickTemplateGroupVersionAtRank(versions, rank) {
    const r = Math.max(1, Number(rank) || 1);
    return (versions || []).find(v => this.resolveTemplateLibraryVersionRank(v.libraryVersionRank) === r) || null;
  },

  applyTemplateListVersionRank(groups, rank) {
    const r = Math.max(1, Number(rank) || 1);
    return (groups || []).map(g => this.pickTemplateGroupVersionAtRank(g.versions, r)).filter(Boolean);
  },

  collectTemplateMethodsAtVersionRank(templates, rank) {
    const groups = this.groupTemplateRecords(templates || this.templates);
    const map = new Map();
    this.applyTemplateListVersionRank(groups, rank).forEach(t => {
      if (!t.methodId) return;
      if (!map.has(t.methodId)) {
        map.set(t.methodId, { id: t.methodId, label: this.methodLabel(t.methodId), count: 0 });
      }
      map.get(t.methodId).count += 1;
    });
    return [...map.values()].sort((a, b) => {
      const pa = typeof factorMethodPriority === 'function' ? factorMethodPriority(a.id) : 0;
      const pb = typeof factorMethodPriority === 'function' ? factorMethodPriority(b.id) : 0;
      return pa - pb;
    });
  },

  createTemplateLibraryNextVersion(options = {}) {
    const { methodIds = null, sourceRank = null } = options || {};
    const methodSet = methodIds?.length ? new Set(methodIds) : null;
    const groups = this.groupTemplateRecords(this.templates);
    const ranks = this.collectTemplateLibraryVersionRanks(this.templates);
    const nextRank = ranks.length + 1;
    const fromRank = sourceRank != null ? Number(sourceRank) : ranks.length;
    let added = 0;
    let skipped = 0;
    groups.forEach(g => {
      const srcTpl = this.pickTemplateGroupVersionAtRank(g.versions, fromRank) || g.versions[g.versions.length - 1];
      if (!srcTpl) {
        skipped++;
        return;
      }
      if (methodSet && !methodSet.has(srcTpl.methodId)) return;
      if (g.versions.some(v => this.resolveTemplateLibraryVersionRank(v.libraryVersionRank) === nextRank)) {
        skipped++;
        return;
      }
      const newId = `${srcTpl.id}__lv${nextRank}`;
      const copy = this.copyTemplateDetail(srcTpl.id, newId, srcTpl.industry, srcTpl.bizType, srcTpl.methodId);
      if (!copy) {
        skipped++;
        return;
      }
      copy.meta.libraryVersionRank = nextRank;
      copy.meta.status = 'draft';
      copy.meta.version = '—';
      copy.meta.templateName = srcTpl.templateName || copy.meta.templateName;
      copy.meta.updatedAt = this._today();
      copy.meta.updatedBy = this._currentOperator();
      const result = this.saveTemplateDetail(copy);
      if (!result.ok) {
        skipped++;
        return;
      }
      added++;
    });
    return { added, skipped, nextRank, prevRank: fromRank };
  }
};

METHOD_CONFIG.init();
