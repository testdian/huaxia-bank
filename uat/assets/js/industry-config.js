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
    if (f.tag) list = list.filter(r => this.hasTag(r, f.tag));
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
    const tagOpts = this.TAG_OPTIONS.map(o =>
      `<option value="${o.value}" ${(f.tag || '') === o.value ? 'selected' : ''}>${o.label === '—' ? '全部标识' : o.label}</option>`
    ).join('');
    return `
      <div class="filter-panel industry-config-filter">
        <div class="filter-extra industry-config-filter-grid">
          <div class="form-item"><label>标识</label><select id="icf_tag">${tagOpts}</select></div>
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
    const tagChecks = this.SELECTABLE_TAG_OPTIONS.map(o =>
      `<label class="filter-check">
        <input type="checkbox" name="ic_form_tag" value="${o.value}" ${selected.has(o.value) ? 'checked' : ''}>
        <span>${o.label}</span>
      </label>`
    ).join('');
    return `
      <div class="form-grid">
        <div class="form-item"><label>四级行业代码 *</label>
          <input id="ic_form_cascade" value="${r.cascadeCode || toCascadeIndustryCode(r.code) || ''}" placeholder="如 2614"></div>
        <div class="form-item"><label>完整代码</label>
          <input id="ic_form_scoped" value="${r.code || ''}" placeholder="自动带出，如 C2614"></div>
        <div class="form-item"><label>一级行业</label><input id="ic_form_l1" value="${r.level1Name || ''}" readonly></div>
        <div class="form-item"><label>二级行业</label><input id="ic_form_l2" value="${r.level2Name || ''}" readonly></div>
        <div class="form-item"><label>三级行业</label><input id="ic_form_l3" value="${r.level3Name || ''}" readonly></div>
        <div class="form-item"><label>四级行业名称</label><input id="ic_form_l4" value="${r.level4Name || r.name || ''}"></div>
        <div class="form-item full"><label>标识</label>
          <div class="filter-checkbox-group ic-tag-checkbox-group">${tagChecks}</div>
        </div>
      </div>
      <p class="candidate-filter-hint" style="margin-top:8px">输入四级代码后可从 GB/T 4754 自动回填各级名称；标识可多选，同一行业可同时属于「人行八大高碳」与「我行主要行业」。</p>`;
  },

  readFormPayload(rootEl) {
    const root = rootEl || document;
    const cascade = qs('#ic_form_cascade', root)?.value?.trim() || '';
    const scoped = qs('#ic_form_scoped', root)?.value?.trim()
      || (typeof toScopedIndustryCode === 'function' ? toScopedIndustryCode(cascade) : cascade);
    const auto = cascade ? this.lookupLevelsByCascadeCode(cascade) : null;
    return {
      code: scoped,
      cascadeCode: cascade,
      level1Code: auto?.level1Code || '',
      level1Name: qs('#ic_form_l1', root)?.value?.trim() || auto?.level1Name || '',
      level2Code: auto?.level2Code || '',
      level2Name: qs('#ic_form_l2', root)?.value?.trim() || auto?.level2Name || '',
      level3Code: auto?.level3Code || '',
      level3Name: qs('#ic_form_l3', root)?.value?.trim() || auto?.level3Name || '',
      level4Code: auto?.level4Code || cascade,
      level4Name: qs('#ic_form_l4', root)?.value?.trim() || auto?.level4Name || '',
      name: qs('#ic_form_l4', root)?.value?.trim() || auto?.level4Name || '',
      major: auto?.major || '',
      tags: typeof qsa === 'function'
        ? qsa('input[name="ic_form_tag"]:checked', root).map(el => el.value).filter(Boolean)
        : [],
      custom: true
    };
  },

  bindFormLookup(rootEl) {
    const root = rootEl || document;
    const cascadeInput = qs('#ic_form_cascade', root);
    const scopedInput = qs('#ic_form_scoped', root);
    if (!cascadeInput) return;
    const apply = () => {
      const cascade = cascadeInput.value.trim();
      if (!cascade) return;
      const row = this.lookupLevelsByCascadeCode(cascade);
      if (scopedInput) scopedInput.value = row?.code || (typeof toScopedIndustryCode === 'function' ? toScopedIndustryCode(cascade) : cascade);
      if (row) {
        qs('#ic_form_l1', root).value = row.level1Name || '';
        qs('#ic_form_l2', root).value = row.level2Name || '';
        qs('#ic_form_l3', root).value = row.level3Name || '';
        qs('#ic_form_l4', root).value = row.level4Name || '';
      }
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
      const payload = this.readFormPayload(qs('#reviewModalBody'));
      if (!payload.cascadeCode && !payload.code) {
        toast('请填写四级行业代码', 'warning');
        return;
      }
      onSave(payload, isNew ? null : row.id);
    };
    showModal('reviewModal');
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
  return {
    tag: qs('#icf_tag')?.value || '',
    keyword: qs('#icf_keyword')?.value || ''
  };
}
