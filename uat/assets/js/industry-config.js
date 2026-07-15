/** 行业配置 — GB/T 4754 全量导入与标识维护 */
window.IndustryConfig = {
  TAG_NONE: '',
  TAG_PBO_EIGHT: 'pbo_eight',
  TAG_BANK_MAJOR: 'bank_major',

  TAG_OPTIONS: [
    { value: '', label: '—' },
    { value: 'pbo_eight', label: '人行八大高碳' },
    { value: 'bank_major', label: '我行主要行业' }
  ],

  SELECTABLE_TAG_OPTIONS: [
    { value: 'pbo_eight', label: '人行八大高碳' },
    { value: 'bank_major', label: '我行主要行业' }
  ],

  normalizeRowTags(row) {
    if (Array.isArray(row?.tags)) {
      return row.tags.filter(t => t === this.TAG_PBO_EIGHT || t === this.TAG_BANK_MAJOR);
    }
    const legacy = row?.tag;
    if (legacy === this.TAG_PBO_EIGHT || legacy === this.TAG_BANK_MAJOR) return [legacy];
    return [];
  },

  hasTag(row, tag) {
    if (!tag) return false;
    return this.normalizeRowTags(row).includes(tag);
  },

  tagLabel(tag) {
    return this.TAG_OPTIONS.find(o => o.value === (tag || ''))?.label || '—';
  },

  tagBadge(tag) {
    if (tag === this.TAG_PBO_EIGHT) return '<span class="badge badge-success">人行八大高碳</span>';
    if (tag === this.TAG_BANK_MAJOR) return '<span class="badge badge-primary">我行主要行业</span>';
    return '';
  },

  tagBadges(row) {
    const tags = this.normalizeRowTags(row);
    if (!tags.length) return '<span style="color:#c0c4cc">—</span>';
    return tags.map(t => this.tagBadge(t)).join(' ');
  },

  isImported() {
    return !!Store.get().industryConfig?.imported;
  },

  getRows() {
    return Store.get().industryConfig?.rows || [];
  },

  getTaggedCodes(tag) {
    const scoped = this.getRows()
      .filter(r => this.hasTag(r, tag))
      .map(r => r.code || r.scopedCode)
      .filter(Boolean);
    const cascade = this.getRows()
      .filter(r => this.hasTag(r, tag))
      .map(r => r.cascadeCode || toCascadeIndustryCode(r.code))
      .filter(Boolean);
    return _uniqueIndustryCodes([...scoped, ...cascade]);
  },

  resolveAutoTags(scopedCode, cascadeCode) {
    const tags = [];
    const c = cascadeCode || toCascadeIndustryCode(scopedCode);
    const s = scopedCode || (typeof toScopedIndustryCode === 'function' ? toScopedIndustryCode(c) : c);
    if (typeof isPboEightIndustryCode === 'function' && isPboEightIndustryCode(s || c)) {
      tags.push(this.TAG_PBO_EIGHT);
    }
    if (typeof isBankMajorIndustryCode === 'function' && isBankMajorIndustryCode(s || c)) {
      tags.push(this.TAG_BANK_MAJOR);
    }
    const eight = new Set(typeof INDUSTRY_EIGHT_CODES !== 'undefined' ? INDUSTRY_EIGHT_CODES : []);
    const bank = new Set(typeof INDUSTRY_BANK_MAJOR_CODES !== 'undefined' ? INDUSTRY_BANK_MAJOR_CODES : []);
    if ((eight.has(s) || eight.has(c)) && !tags.includes(this.TAG_PBO_EIGHT)) tags.push(this.TAG_PBO_EIGHT);
    if (bank.has(c) && !tags.includes(this.TAG_BANK_MAJOR)) tags.push(this.TAG_BANK_MAJOR);
    if (typeof toScopedIndustryCode === 'function') {
      const scopedBank = [...bank].map(x => toScopedIndustryCode(x));
      if (scopedBank.includes(s) && !tags.includes(this.TAG_BANK_MAJOR)) tags.push(this.TAG_BANK_MAJOR);
    }
    return tags;
  },

  /** @deprecated 兼容旧逻辑，返回首个自动标识 */
  resolveAutoTag(scopedCode, cascadeCode) {
    return this.resolveAutoTags(scopedCode, cascadeCode)[0] || this.TAG_NONE;
  },

  buildRowFromLeaf(leafNode, indexMap) {
    const cascadeCode = leafNode.c;
    const scopedCode = typeof toScopedIndustryCode === 'function'
      ? toScopedIndustryCode(cascadeCode)
      : cascadeCode;
    const chain = [];
    const seen = new Set();
    let cur = leafNode;
    while (cur && !seen.has(cur.c)) {
      seen.add(cur.c);
      chain.unshift({ code: cur.c, name: cur.n, level: cur.l });
      cur = cur.p ? indexMap.get(cur.p) : null;
    }
    const l1 = chain.find(x => x.level === 0) || { code: '', name: '' };
    const l2 = chain.find(x => x.level === 1) || { code: '', name: '' };
    const l3 = chain.find(x => x.level === 2) || { code: '', name: '' };
    const l4 = chain.find(x => x.level === 3) || { code: cascadeCode, name: leafNode.n };
    const tableRow = (typeof INDUSTRY_TABLE !== 'undefined' ? INDUSTRY_TABLE : [])
      .find(r => r.code === scopedCode || r.code === cascadeCode || toCascadeIndustryCode(r.code) === cascadeCode);
    const major = tableRow?.major
      || (typeof inferIndustryMajor === 'function' ? inferIndustryMajor(scopedCode || cascadeCode) : '');
    return {
      id: 'IC-' + scopedCode.replace(/\W/g, ''),
      code: scopedCode,
      cascadeCode,
      level1Code: l1.code,
      level1Name: l1.name,
      level2Code: l2.code,
      level2Name: l2.name,
      level3Code: l3.code,
      level3Name: l3.name,
      level4Code: l4.code,
      level4Name: l4.name,
      name: l4.name,
      major,
      tags: this.resolveAutoTags(scopedCode, cascadeCode),
      custom: false
    };
  },

  buildImportRows() {
    if (!window.GB4754_FLAT?.length) return [];
    const indexMap = new Map(GB4754_FLAT.map(n => [n.c, n]));
    return GB4754_FLAT
      .filter(n => n.l === 3)
      .map(n => this.buildRowFromLeaf(n, indexMap));
  },

  lookupLevelsByCascadeCode(cascadeCode) {
    if (!cascadeCode || !window.GB4754_FLAT?.length) return null;
    const leaf = GB4754_FLAT.find(n => n.c === cascadeCode && n.l === 3)
      || GB4754_FLAT.find(n => n.c === cascadeCode);
    if (!leaf) return null;
    const indexMap = new Map(GB4754_FLAT.map(n => [n.c, n]));
    return this.buildRowFromLeaf(leaf.l === 3 ? leaf : { ...leaf, l: 3 }, indexMap);
  },

  filterRows(rows, filters) {
    const f = filters || {};
    let list = rows || [];
    // 支持多标识筛选（tags 数组）或兼容旧单 tag 字段
    const activeTags = Array.isArray(f.tags) ? f.tags.filter(Boolean)
      : (f.tag ? [f.tag] : []);
    if (activeTags.length) {
      list = list.filter(r => activeTags.some(t => this.hasTag(r, t)));
    }
    if (f.keyword) {
      const kw = f.keyword.trim().toLowerCase();
      if (kw) {
        list = list.filter(r => [
          r.code, r.cascadeCode, r.level1Name, r.level2Name, r.level3Name, r.level4Name,
          r.level1Code, r.level2Code, r.level3Code, r.level4Code, r.major,
          ...this.normalizeRowTags(r).map(t => this.tagLabel(t))
        ].join(' ').toLowerCase().includes(kw));
      }
    }
    return list;
  },

  stats(rows) {
    const list = rows || [];
    return {
      total: list.length,
      pboEight: list.filter(r => this.hasTag(r, this.TAG_PBO_EIGHT)).length,
      bankMajor: list.filter(r => this.hasTag(r, this.TAG_BANK_MAJOR)).length,
      custom: list.filter(r => r.custom).length
    };
  },

  renderFilterPanel(filters) {
    const f = filters || {};
    const selectedTags = new Set(
      Array.isArray(f.tags) ? f.tags : (f.tag ? [f.tag] : [])
    );
    const tagChecks = this.SELECTABLE_TAG_OPTIONS.map(o =>
      `<label class="ic-tag-filter-chip">
        <input type="checkbox" class="icf_tag_check" value="${o.value}" ${selectedTags.has(o.value) ? 'checked' : ''}>
        <span>${o.label}</span>
      </label>`
    ).join('');
    return `
      <div class="filter-panel industry-config-filter">
        <div class="filter-extra industry-config-filter-grid">
          <div class="form-item ic-tag-filter-item"><label>标识（可多选）</label>
            <div class="ic-tag-filter-chips">${tagChecks}</div>
          </div>
          <div class="form-item"><label>关键词</label>
            <input id="icf_keyword" type="search" value="${f.keyword || ''}" placeholder="行业代码或各级名称"></div>
          <div class="form-item filter-actions">
            <label>&nbsp;</label>
            <div class="filter-action-btns">
              <button type="button" class="btn btn-primary" id="icf_search">查询</button>
              <button type="button" class="btn" id="icf_reset">重置</button>
            </div>
          </div>
        </div>
      </div>`;
  },

  renderTableRow(row, startIndex, i) {
    const ops = `
      <button type="button" class="btn-link ic-edit-btn" data-id="${row.id}">编辑</button>
      <button type="button" class="btn-link btn-link-danger ic-del-btn" data-id="${row.id}">删除</button>`;
    return `<tr>
      <td>${startIndex + i + 1}</td>
      <td>${row.level1Name || '—'}<div class="cell-sub">${row.level1Code || ''}</div></td>
      <td>${row.level2Name || '—'}<div class="cell-sub">${row.level2Code || ''}</div></td>
      <td>${row.level3Name || '—'}<div class="cell-sub">${row.level3Code || ''}</div></td>
      <td>${row.level4Name || row.name || '—'}<div class="cell-sub">${row.code || row.cascadeCode || ''}</div></td>
      <td>${this.tagBadges(row)}</td>
      <td class="actions">${ops}</td>
    </tr>`;
  },

  renderFormFields(row) {
    const r = row || {};
    const selected = new Set(this.normalizeRowTags(r));
    const cascade = r.cascadeCode || toCascadeIndustryCode(r.code) || '';
    const tagChecks = this.SELECTABLE_TAG_OPTIONS.map(o =>
      `<label class="filter-check">
        <input type="checkbox" name="ic_form_tag" value="${o.value}" ${selected.has(o.value) ? 'checked' : ''}>
        <span>${o.label}</span>
      </label>`
    ).join('');
    return `
      <div class="form-grid ic-form-grid">
        <div class="form-item">${renderFormLabel('一级行业代码', { required: true })}
          <input id="ic_form_l1_code" value="${escapeHtml(r.level1Code || '')}" placeholder="如 C" maxlength="10" required></div>
        <div class="form-item">${renderFormLabel('一级行业名称', { required: true })}
          <input id="ic_form_l1" value="${escapeHtml(r.level1Name || '')}" placeholder="如 制造业" maxlength="100" required></div>

        <div class="form-item">${renderFormLabel('二级行业代码', { required: true })}
          <input id="ic_form_l2_code" value="${escapeHtml(r.level2Code || '')}" placeholder="如 30" maxlength="10" required></div>
        <div class="form-item">${renderFormLabel('二级行业名称', { required: true })}
          <input id="ic_form_l2" value="${escapeHtml(r.level2Name || '')}" placeholder="如 非金属矿物制品业" maxlength="100" required></div>

        <div class="form-item">${renderFormLabel('三级行业代码', { required: true })}
          <input id="ic_form_l3_code" value="${escapeHtml(r.level3Code || '')}" placeholder="如 301" maxlength="10" required></div>
        <div class="form-item">${renderFormLabel('三级行业名称', { required: true })}
          <input id="ic_form_l3" value="${escapeHtml(r.level3Name || '')}" placeholder="如 水泥、石灰和石膏制造" maxlength="100" required></div>

        <div class="form-item">${renderFormLabel('四级行业代码（GB/T）', { required: true })}
          <input id="ic_form_cascade" value="${escapeHtml(cascade)}" placeholder="如 3011" maxlength="10" required></div>
        <div class="form-item">${renderFormLabel('四级行业名称', { required: true })}
          <input id="ic_form_l4" value="${escapeHtml(r.level4Name || r.name || '')}" placeholder="如 水泥制造" maxlength="100" required></div>

        <div class="form-item full"><label>标识</label>
          <div class="filter-checkbox-group ic-tag-checkbox-group">${tagChecks}</div>
        </div>
      </div>`;
  },

  resolveScopedCode(rootEl) {
    const root = rootEl || document;
    const cascade = qs('#ic_form_cascade', root)?.value?.trim() || '';
    const l1Code = qs('#ic_form_l1_code', root)?.value?.trim() || '';
    if (!cascade) return '';
    if (/^[A-Z]\d/.test(cascade)) return cascade;
    const leaf = typeof toCascadeIndustryCode === 'function' ? toCascadeIndustryCode(cascade) : cascade;
    if (l1Code && /^[A-Z]$/i.test(l1Code)) return l1Code.toUpperCase() + leaf;
    return typeof toScopedIndustryCode === 'function' ? toScopedIndustryCode(cascade) : cascade;
  },

  readFormPayload(rootEl) {
    const root = rootEl || document;
    const cascade = qs('#ic_form_cascade', root)?.value?.trim() || '';
    const scoped = this.resolveScopedCode(root);
    return {
      code: scoped,
      cascadeCode: cascade,
      level1Code: qs('#ic_form_l1_code', root)?.value?.trim() || '',
      level1Name: qs('#ic_form_l1', root)?.value?.trim() || '',
      level2Code: qs('#ic_form_l2_code', root)?.value?.trim() || '',
      level2Name: qs('#ic_form_l2', root)?.value?.trim() || '',
      level3Code: qs('#ic_form_l3_code', root)?.value?.trim() || '',
      level3Name: qs('#ic_form_l3', root)?.value?.trim() || '',
      level4Code: cascade,
      level4Name: qs('#ic_form_l4', root)?.value?.trim() || '',
      name: qs('#ic_form_l4', root)?.value?.trim() || '',
      tags: typeof qsa === 'function'
        ? qsa('input[name="ic_form_tag"]:checked', root).map(el => el.value).filter(Boolean)
        : [],
      custom: true
    };
  },

  bindFormLookup(rootEl) {
    const root = rootEl || document;
    const cascadeInput = qs('#ic_form_cascade', root);
    if (!cascadeInput) return;
    const apply = () => {
      const cascade = cascadeInput.value.trim();
      if (!cascade) return;
      const row = this.lookupLevelsByCascadeCode(cascade);
      if (!row) return;
      const fields = [
        ['#ic_form_l1_code', row.level1Code],
        ['#ic_form_l1',      row.level1Name],
        ['#ic_form_l2_code', row.level2Code],
        ['#ic_form_l2',      row.level2Name],
        ['#ic_form_l3_code', row.level3Code],
        ['#ic_form_l3',      row.level3Name],
        ['#ic_form_l4',      row.level4Name || row.name]
      ];
      fields.forEach(([sel, val]) => {
        const el = qs(sel, root);
        if (el && !el.value && val) el.value = val;
      });
    };
    cascadeInput.addEventListener('change', apply);
    cascadeInput.addEventListener('blur', apply);
  },

  openEditModal(row, onSave) {
    if (!ensureReviewModal()) return;
    const isNew = !row?.id;
    qs('#reviewModal')?.querySelector('.modal')?.classList.add('modal-lg');
    qs('#reviewModalTitle').textContent = isNew ? '新增行业分类' : '编辑行业分类';
    qs('#reviewModalBody').innerHTML = this.renderFormFields(row);
    this.bindFormLookup(qs('#reviewModalBody'));
    qs('#reviewModalFooter').innerHTML = `
      <button type="button" class="btn" onclick="hideModal('reviewModal')">取消</button>
      <button type="button" class="btn btn-primary" id="icFormSaveBtn">保存</button>`;
    qs('#icFormSaveBtn').onclick = () => {
      const body = qs('#reviewModalBody');
      const payload = this.readFormPayload(body);
      const required = [
        ['四级行业代码', payload.cascadeCode],
        ['四级行业名称', payload.level4Name],
        ['三级行业代码', payload.level3Code],
        ['三级行业名称', payload.level3Name],
        ['二级行业代码', payload.level2Code],
        ['二级行业名称', payload.level2Name],
        ['一级行业代码', payload.level1Code],
        ['一级行业名称', payload.level1Name]
      ];
      const missing = required.find(([, v]) => !v);
      if (missing) {
        toast(`请填写「${missing[0]}」`, 'warning');
        return;
      }
      onSave(payload, isNew ? null : row.id);
    };
    showModal('reviewModal');
  },

  IMPORT_HEADERS: [
    '一级行业代码', '一级行业名称', '二级行业代码', '二级行业名称',
    '三级行业代码', '三级行业名称', '四级行业代码', '四级行业名称', '完整代码', '标识'
  ],

  downloadImportTemplate() {
    if (typeof downloadCsvFile !== 'function') return;
    downloadCsvFile('行业配置导入模板', this.IMPORT_HEADERS, [
      ['C', '制造业', '30', '非金属矿物制品业', '301', '水泥、石灰和石膏制造', '3011', '水泥制造', 'C3011', '人行八大高碳'],
      ['D', '电力、热力生产和供应业', '44', '电力、热力生产和供应业', '441', '电力生产', '4411', '火力发电', 'D4411', '人行八大高碳;我行主要行业']
    ]);
  },

  parseTagsFromCell(raw) {
    const text = String(raw || '').trim();
    if (!text) return [];
    const tags = [];
    text.split(/[;；、,，\s]+/).filter(Boolean).forEach(part => {
      if (/人行|八大|高碳/.test(part)) tags.push(this.TAG_PBO_EIGHT);
      else if (/我行|主要/.test(part)) tags.push(this.TAG_BANK_MAJOR);
      else if (part === this.TAG_PBO_EIGHT || part === 'pbo_eight') tags.push(this.TAG_PBO_EIGHT);
      else if (part === this.TAG_BANK_MAJOR || part === 'bank_major') tags.push(this.TAG_BANK_MAJOR);
    });
    return [...new Set(tags)];
  },

  importFromCsv(text) {
    let added = 0;
    let skipped = 0;
    const errors = [];
    const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { ok: false, added, skipped, errors: ['未解析到可导入数据'] };
    const parseLine = typeof parseFactorImportCsvLine === 'function'
      ? parseFactorImportCsvLine
      : (line) => line.split(',').map(s => s.trim());
    for (let li = 1; li < lines.length; li++) {
      const cells = parseLine(lines[li]);
      if (!cells.some(c => c)) continue;
      const payload = {
        level1Code: (cells[0] || '').trim(),
        level1Name: (cells[1] || '').trim(),
        level2Code: (cells[2] || '').trim(),
        level2Name: (cells[3] || '').trim(),
        level3Code: (cells[4] || '').trim(),
        level3Name: (cells[5] || '').trim(),
        cascadeCode: (cells[6] || '').trim(),
        level4Name: (cells[7] || '').trim(),
        code: (cells[8] || '').trim(),
        tags: this.parseTagsFromCell(cells[9])
      };
      payload.level4Code = payload.cascadeCode;
      payload.name = payload.level4Name;
      if (!payload.cascadeCode && !payload.code) {
        errors.push(`第 ${li + 1} 行：四级行业代码不能为空`);
        continue;
      }
      if (!payload.level1Name || !payload.level2Name || !payload.level3Name || !payload.level4Name) {
        errors.push(`第 ${li + 1} 行：各级行业名称均必填`);
        continue;
      }
      if (!payload.code) {
        payload.code = typeof toScopedIndustryCode === 'function'
          ? toScopedIndustryCode(payload.cascadeCode)
          : payload.cascadeCode;
      }
      const row = typeof Store !== 'undefined' ? Store.addIndustryConfigRow(payload) : null;
      if (row) added += 1;
      else skipped += 1;
    }
    return { ok: added > 0 || !errors.length, added, skipped, errors };
  }
};

function _uniqueIndustryCodes(codes) {
  return [...new Set((codes || []).filter(Boolean))];
}

const INDUSTRY_CONFIG_FILTER_KEY = 'industry_config_filters';

function getIndustryConfigFilters() {
  try {
    return JSON.parse(sessionStorage.getItem(INDUSTRY_CONFIG_FILTER_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveIndustryConfigFilters(filters) {
  sessionStorage.setItem(INDUSTRY_CONFIG_FILTER_KEY, JSON.stringify(filters || {}));
}

function readIndustryConfigFilterInputs() {
  const tags = typeof qsa === 'function'
    ? qsa('.icf_tag_check:checked').map(el => el.value).filter(Boolean)
    : [];
  return {
    tags,
    keyword: qs('#icf_keyword')?.value || ''
  };
}
