/** 计算方法配置 — 数据与持久化 */
window.METHOD_CONFIG = {
  params: [
    { id: 'P_coal', name: '煤炭消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'global', showInTemplate: true },
    { id: 'P_gas', name: '天然气消耗量', format: 'number', unit: '万m³', decimalPlaces: 4, scope: 'global', showInTemplate: true },
    { id: 'P_fixed_source_type', name: '固定源排放类型', format: 'option', unit: '—', scope: 'global', showInTemplate: true, enumCount: 12 },
    { id: 'P_ghg_total', name: '温室气体排放总量', format: 'number', unit: 'tCO₂e', decimalPlaces: 4, scope: 'global', showInTemplate: true },
    { id: 'P_disclosure_source', name: '数据来源及佐证材料名称', format: 'text', unit: '—', scope: 'global', showInTemplate: true },
    { id: 'P_grid_region', name: '企业所属电网', format: 'option', unit: '—', scope: 'global', showInTemplate: true, enumCount: 8 },
    { id: 'P_stationary_factor', name: '固定源的因子', format: 'number', unit: 'tCO₂e/t', decimalPlaces: 6, scope: 'global', showInTemplate: false },
    { id: 'P_clinker_output', name: '水泥熟料产量', format: 'number', unit: 't', decimalPlaces: 2, scope: 'custom', showInTemplate: true },
    { id: 'P_carbon_data_year', name: '碳数据年份', format: 'date', unit: '—', scope: 'global', showInTemplate: true }
  ],

  templateDetails: {},
  _seedTemplateDetails: {},

  DEFAULT_INDUSTRY_METHODS: ['report', 'energy', 'product'],

  industries: [
    { key: '电力', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '水泥', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '平板玻璃', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '钢铁', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '石化', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '化工', bizTypes: ['non_project', 'project'], methods: ['report', 'energy', 'product'] },
    { key: '民航', bizTypes: ['non_project', 'project'], methods: ['report', 'energy'] }
  ],

  templates: [
    { id: 'tpl_np_平板玻璃_energy', industry: '平板玻璃', bizType: 'non_project', methodId: 'energy', status: 'published', version: '2026.1', fieldCount: 19, formulaCount: 5, updatedAt: '2026-06-24', highlight: true },
    { id: 'tpl_np_电力_energy', industry: '电力', bizType: 'non_project', methodId: 'energy', status: 'published', version: '2026.1', fieldCount: 18, formulaCount: 4, updatedAt: '2026-06-20' },
    { id: 'tpl_np_电力_product', industry: '电力', bizType: 'non_project', methodId: 'product', status: 'published', version: '2026.1', fieldCount: 12, formulaCount: 2, updatedAt: '2026-06-18' },
    { id: 'tpl_np_水泥_energy', industry: '水泥', bizType: 'non_project', methodId: 'energy', status: 'published', version: '2026.1', fieldCount: 16, formulaCount: 3, updatedAt: '2026-06-15' },
    { id: 'tpl_p_电力_energy', industry: '电力', bizType: 'project', methodId: 'energy', status: 'draft', version: '2026.2', fieldCount: 17, formulaCount: 4, updatedAt: '2026-06-24' },
    { id: 'tpl_np_钢铁_energy', industry: '钢铁', bizType: 'non_project', methodId: 'energy', status: 'draft', version: '—', fieldCount: 8, formulaCount: 0, updatedAt: '2026-06-22' }
  ],

  STORAGE_KEY: 'huaxia_method_config_demo',

  init() {
    if (window.METHOD_CONFIG_FLAT_GLASS) {
      const fg = JSON.parse(JSON.stringify(METHOD_CONFIG_FLAT_GLASS));
      this._seedTemplateDetails[fg.templateId] = fg;
      this.templateDetails[fg.templateId] = JSON.parse(JSON.stringify(fg));
      fg.params.forEach(p => {
        if (!this.params.some(x => x.id === p.id)) {
          this.params.push({ ...p, enumCount: p.enumValues?.length || p.enumCount });
        }
      });
    }
    this.loadPersisted();
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

  loadPersisted() {
    const data = this._readStorage();
    Object.entries(data.paramOverrides || {}).forEach(([id, patch]) => {
      const i = this.params.findIndex(p => p.id === id);
      if (i >= 0) this.params[i] = { ...this.params[i], ...patch, id };
    });
    (data.customParams || []).forEach(p => {
      if (!this.params.some(x => x.id === p.id)) {
        this.params.push({ ...p, enumCount: p.enumValues?.length || p.enumCount });
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

  listParams() {
    return this.params.slice().sort((a, b) => a.id.localeCompare(b.id));
  },

  readParamForm(form) {
    const fd = new FormData(form);
    const format = fd.get('format') || 'number';
    const enumRaw = (fd.get('enumValues') || '').toString().trim();
    const enumValues = enumRaw ? enumRaw.split(/\n/).map(s => s.trim()).filter(Boolean) : undefined;
    const payload = {
      id: (fd.get('id') || '').toString().trim(),
      name: (fd.get('name') || '').toString().trim(),
      format,
      scope: 'custom',
      showInTemplate: fd.get('showInTemplate') !== '0',
      description: (fd.get('description') || '').toString().trim()
    };
    if (format === 'text') {
      payload.textMode = fd.get('textMode') || 'single';
      payload.maxLength = Number(fd.get('maxLength')) || 200;
      payload.unit = '—';
    } else if (format === 'number') {
      const unitType = fd.get('numberUnitType') || 'common';
      const unitRaw = (fd.get('numberUnit') || '').toString().trim();
      payload.decimalPlaces = Number(fd.get('decimalPlaces')) || 4;
      payload.unitType = unitType;
      payload.unit = unitType === 'none' ? '无单位' : (unitRaw || 't');
    } else if (format === 'option') {
      const unitType = fd.get('optionUnitType') || 'common';
      const unitRaw = (fd.get('optionUnit') || '').toString().trim();
      payload.enumValues = enumValues;
      payload.enumCount = enumValues?.length;
      payload.hasDefault = fd.get('hasDefault') === '1';
      payload.defaultValue = (fd.get('defaultValue') || '').toString().trim();
      payload.unitType = unitType;
      payload.unit = unitType === 'none' ? '无单位' : (unitRaw || '—');
    } else if (format === 'date') {
      payload.unit = '—';
    }
    return payload;
  },

  getFactorLibraryOptions() {
    if (typeof Store === 'undefined') return [];
    return (Store.get()?.factors || []).map(f => ({
      id: f.id,
      name: f.name || f.paramName || f.id,
      value: f.value ?? f.factorValue ?? '',
      unit: f.unit || f.factorUnit || ''
    }));
  },

  formulasUsingFactorRef(formulas, refKey) {
    if (!refKey) return [];
    const key = refKey.replace(/^\{|\}$/g, '');
    return (formulas || []).filter(f => (f.expression || '').includes(`{${key}}`));
  },

  saveParam(payload, isNew) {
    if (!payload.id || !payload.name) return { ok: false, message: '参数 ID 与名称必填' };
    if (payload.format === 'option' && !(payload.enumValues || []).length) {
      return { ok: false, message: '选项格式请填写至少一个枚举值' };
    }
    if (isNew && this.params.some(p => p.id === payload.id)) {
      return { ok: false, message: '参数 ID 已存在' };
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

  formatTemplateLabel(meta, tplId) {
    const m = meta || {};
    const industry = m.industry || tplId || '—';
    const biz = this.bizLabel(m.bizType || 'non_project');
    const method = this.methodLabel(m.methodId || '');
    const status = m.status === 'published' ? '已发布' : '草稿';
    return `${industry} · ${biz} · ${method}（${status}）`;
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

  /** 新建方法模板（可选从已有模板复制；支持新增自定义行业） */
  createTemplate({ industry, bizType, methodId, copyFromId, isNewIndustry }) {
    const ensured = isNewIndustry ? this.ensureIndustry(industry) : { ok: true, industry: this.getIndustryConfig(industry) };
    if (!ensured.ok) return ensured;
    const ind = ensured.industry;
    if (!ind) return { ok: false, message: '请选择有效行业' };
    if (!['non_project', 'project'].includes(bizType)) {
      return { ok: false, message: '请选择业务类型' };
    }
    if (!ind.methods.includes(methodId)) {
      return { ok: false, message: `${industry} 不支持该核算方法` };
    }
    const id = this.makeTemplateId(industry, bizType, methodId);
    const meta = this.templates.find(t => t.id === id);
    if (meta) {
      return { ok: false, message: '该行业·业务类型·核算方法已有模板，请直接编辑', id };
    }

    let detail;
    if (copyFromId) {
      detail = this.copyTemplateDetail(copyFromId, id, industry, bizType, methodId);
      if (!detail) return { ok: false, message: '复制来源模板不存在' };
    } else {
      detail = this.createEmptyTemplate(id, industry, bizType, methodId);
    }
    return this.saveTemplateDetail(detail);
  },

  createEmptyTemplate(id, industry, bizType, methodId) {
    return {
      templateId: id,
      meta: {
        id,
        industry,
        bizType,
        methodId,
        status: 'draft',
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
    return [...sections.entries()].map(([title, fields]) => ({ title, fields }));
  },

  readTemplateStep1(form) {
    const selected = [];
    form.querySelectorAll('.tpl-param-check:checked').forEach(cb => {
      const id = cb.value;
      const base = this.getParam(id) || {};
      const section = form.querySelector(`[name="param_section_${id}"]`)?.value?.trim() || '默认分区';
      const required = !!form.querySelector(`[name="param_required_${id}"]`)?.checked;
      const allowMultiRow = !!form.querySelector(`[name="param_multirow_${id}"]`)?.checked;
      selected.push({
        ...base,
        id,
        section,
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
      const s1 = this.readTemplateStep1(form);
      next.params = s1.params;
      next.layout = s1.layout;
      next.meta = { ...next.meta, ...s1.meta };
    } else if (step === '2') {
      next.formulas = this.readTemplateStep2(form).formulas;
    } else if (step === '3') {
      next.factorBindings = this.readTemplateStep3(form).factorBindings;
    }
    next.meta.fieldCount = next.params?.length || 0;
    next.meta.formulaCount = next.formulas?.length || 0;
    next.meta.updatedAt = this._today();
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
      industry: detail.meta.industry,
      bizType: detail.meta.bizType,
      methodId: detail.meta.methodId,
      status: detail.meta.status || 'draft',
      version: detail.meta.version || '—',
      fieldCount: detail.params?.length || 0,
      formulaCount: detail.formulas?.length || 0,
      updatedAt: detail.meta.updatedAt || this._today()
    };
    if (tplIdx >= 0) this.templates[tplIdx] = { ...this.templates[tplIdx], ...tplPatch };
    else this.templates.push(tplPatch);

    const data = this._readStorage();
    data.templateDetails = data.templateDetails || {};
    data.templateDetails[id] = detail;
    data.templates = this.templates.map(t => ({ ...t }));
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

  publishTemplate(detail) {
    const validation = this.validateFormulas(detail);
    if (!validation.ok) {
      return { ok: false, message: validation.errors[0], errors: validation.errors };
    }
    if (!(detail.params || []).length) {
      return { ok: false, message: '请先在 Step1 选择至少一个采集参数' };
    }
    if (!(detail.formulas || []).some(f => f.expression)) {
      return { ok: false, message: '请先在 Step2 配置计算公式' };
    }
    const prev = detail.meta.version;
    let version = '2026.1';
    if (prev && prev !== '—') {
      const m = prev.match(/^(\d{4})\.(\d+)$/);
      version = m ? `${m[1]}.${Number(m[2]) + 1}` : `${this._today().replace(/-/g, '')}.1`;
    }
    detail.meta.status = 'published';
    detail.meta.version = version;
    detail.meta.updatedAt = this._today();
    return this.saveTemplateDetail(detail);
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
    return { text: '文本', number: '数值', option: '选项', date: '日期', attachment: '附件' }[format] || format;
  },

  statusBadge(status) {
    return status === 'published'
      ? '<span class="tag tag-success">已发布</span>'
      : '<span class="tag tag-warning">草稿</span>';
  },

  gapLevelLabel(level) {
    return { ok: '满足', warn: '需增强', gap: '未覆盖' }[level] || level;
  },

  gapLevelClass(level) {
    return { ok: 'tag-success', warn: 'tag-warning', gap: 'tag-danger' }[level] || 'tag-info';
  }
};

METHOD_CONFIG.init();
