/** 数据采集 — 行业×业务类型 配置驱动填报（来源：线下采集表模板） */
window.SUPPLEMENT_FIELDS = {
  ATTACH_ACCEPT: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpeg,.jpg',
  ATTACH_MAX_COUNT: 3,
  ATTACH_MAX_MB: 20,
  ATTACH_MAX_MB_AUTHORITY: 2048,
  REPORT_ATTACH_LABEL: '报告法佐证材料',
  /** @deprecated */ REPORT_AUTHORITY_ATTACH_LABEL: '报告法佐证材料',

  /** 提交必填：项目（按项目计算） */
  PROJECT_SUBMIT_REQUIRED: [
    { id: 'f_prj_revenue', label: '项目收入（元）', type: 'number' },
    { id: 'f_prj_total_invest', label: '项目总投资（元）', type: 'number' }
  ],
  /** 提交必填：非项目 / 项目（按非项目计算） */
  ENTITY_SUBMIT_REQUIRED: [
    { id: 'f_revenue', label: '营业收入（元）', type: 'number' },
    { id: 'f_avg_total_assets', label: '平均资产总额（元）', type: 'number' }
  ],

  reqLabel(text, required = true) {
    if (!required) return `<span class="field-label-text">${escapeHtml(text)}</span>`;
    return fieldLabel(text);
  },

  allTemplates() {
    return (typeof SUPPLEMENT_TEMPLATES !== 'undefined' ? SUPPLEMENT_TEMPLATES : []);
  },

  inferSheetName(industryMajor, gbCode) {
    const map = {
      C3011: '水泥', C3041: '平板玻璃',
      C3216: '铝冶炼', C3211: '铜冶炼',
    };
    if (gbCode && map[gbCode]) return map[gbCode];
    const byMajor = {
      电力: '电力', 建材: '水泥', 钢铁: '钢铁', 有色: '铝冶炼',
      石化: '石化', 化工: '化工', 造纸: '造纸', 民航: '民航'
    };
    return byMajor[industryMajor] || '电力';
  },

  resolveTemplate(s) {
    const formal = typeof getFormalForSupplement === 'function' ? getFormalForSupplement(s) : null;
    const bizType = formal?.bizType || s.bizType || 'non_project';
    const gbCode = formal?.gbIndustryCode || s.gbIndustryCode;
    const industryMajor = formal?.industryMajor || s.industryMajor || '-';
    const sheetName = this.inferSheetName(industryMajor, gbCode);
    const list = this.allTemplates();
    let tpl = list.find(t => t.bizType === bizType && t.gbCodes?.includes(gbCode));
    if (!tpl) tpl = list.find(t => t.bizType === bizType && t.sheetName === sheetName);
    if (!tpl) tpl = list.find(t => t.bizType === bizType && t.industryMajor === industryMajor);
    return tpl || null;
  },

  getAccountingType(s) {
    const formal = typeof getFormalForSupplement === 'function' ? getFormalForSupplement(s) : null;
    const row = { ...(formal || {}), ...(s || {}) };
    if (typeof resolveAccountingType === 'function') {
      const resolved = resolveAccountingType(row);
      if (resolved) return resolved;
      if (typeof isProjectAccountingPending === 'function' && isProjectAccountingPending(row)) return null;
    }
    return (formal?.bizType || s?.bizType) === 'project' ? null : 'non_project';
  },

  getContext(s) {
    const formal = typeof getFormalForSupplement === 'function' ? getFormalForSupplement(s) : null;
    const row = { ...(formal || {}), ...(s || {}) };
    const industryMajor = formal?.industryMajor || s.industryMajor || '-';
    const bizType = formal?.bizType || s.bizType || 'non_project';
    const isProject = bizType === 'project'
      || (typeof candidateIsProjectType === 'function' && candidateIsProjectType(row));
    const accountingType = this.getAccountingType(s);
    const template = this.resolveTemplate(s);
    const projectInfoAvailable = s.projectInfoAvailable ?? formal?.projectInfoAvailable ?? null;
    const hasSyncedProject = Array.isArray(row.projectDetails) && row.projectDetails.length > 0
      && !(typeof candidateProjectFinancialMissing === 'function' && candidateProjectFinancialMissing(row));
    const showProjectInfoChoice = isProject
      && accountingType == null
      && projectInfoAvailable == null
      && !hasSyncedProject;
    const needsProjectFinancials = accountingType === 'project_as_project'
      || projectInfoAvailable === true
      || hasSyncedProject;
    return {
      formal,
      row,
      industryMajor,
      gbIndustryCode: formal?.gbIndustryCode || s.gbIndustryCode || '',
      gbIndustryName: formal?.gbIndustryName || s.gbIndustryName || '',
      bizType,
      isProject,
      accountingType,
      projectInfoAvailable,
      showProjectInfoChoice,
      needsProjectFinancials,
      needsEntityFinancials: accountingType === 'non_project' || accountingType === 'project_as_non_project',
      isPowerIndustry: String(industryMajor).includes('电力'),
      template,
      templateKey: template?.id || 'default',
      sheetName: template?.sheetName || this.inferSheetName(industryMajor, formal?.gbIndustryCode || s.gbIndustryCode)
    };
  },

  productSupported(s) {
    const tpl = this.resolveTemplate(s);
    return tpl?.methods?.product?.supported !== false && (tpl?.methods?.product?.fields?.length > 0);
  },

  bizTypeLabel(bizType) {
    return bizType === 'project' ? '项目类' : '非项目类';
  },

  fieldData(s) {
    return s.fieldData || {};
  },

  reportFieldKey(tabId) {
    return tabId === 'report_authority' ? 'reportAuthority' : 'reportOther';
  },

  reportAuthoritySources(isProject) {
    return isProject
      ? ['经连续测量的碳排放数据', '建设或运营过程实际产生的数据']
      : ['碳核查', '碳排放权配额实际履约情况'];
  },

  reportOtherSources(isProject) {
    const gelan = typeof GELAN_REPORT_DATA_SOURCE !== 'undefined' ? GELAN_REPORT_DATA_SOURCE : '报告法-其他数据来源';
    return isProject
      ? ['可行性研究报告', '设计文件', '节能报告', '其他']
      : ['环境信息披露报告', 'ESG报告', '可持续发展报告', '社会责任报告', '其他', gelan];
  },

  isAuthorityReportSource(source, isProject) {
    if (!source) return false;
    return this.reportAuthoritySources(isProject).includes(source);
  },

  normalizeReportFieldData(s) {
    const fd = { ...(s?.fieldData || {}) };
    if (fd.reportAuthority || fd.reportOther) return fd;
    const legacy = fd.report;
    if (!legacy) {
      return { ...fd, reportAuthority: {}, reportOther: {} };
    }
    const ctx = this.getContext(s || {});
    const isAuth = this.isAuthorityReportSource(legacy.source, ctx.isProject);
    return {
      ...fd,
      reportAuthority: isAuth ? { ...legacy } : {},
      reportOther: isAuth ? {} : { ...legacy }
    };
  },

  reportKindFieldValues(s, tabId) {
    const fd = this.normalizeReportFieldData(s);
    const key = this.reportFieldKey(tabId);
    const row = fd[key] || {};
    return {
      carbonDataYear: row.carbonDataYear ?? s.reportCarbonDataYear ?? s.gelanPrefill?.carbonDataYear ?? '',
      ghgTotalEmission: row.ghgTotalEmission ?? row.emission ?? s.reportedEmission ?? s.gelanPrefill?.ghgTotalEmission ?? '',
      scope1Emission: row.scope1Emission ?? s.reportScope1Emission ?? s.gelanPrefill?.scope1Emission ?? '',
      scope2Emission: row.scope2Emission ?? s.reportScope2Emission ?? s.gelanPrefill?.scope2Emission ?? '',
      unitTotalCo2Emission: row.unitTotalCo2Emission ?? s.reportUnitTotalCo2Emission ?? s.gelanPrefill?.unitTotalCo2Emission ?? '',
      source: row.source ?? '',
      verified: row.verified === false || row.verified === 'no' ? 'no' : 'yes',
      attachments: row.attachments || []
    };
  },

  /** @deprecated 兼容旧调用 */
  reportFieldValues(s) {
    return this.reportKindFieldValues(s, 'report_other');
  },

  renderReportExtendedFieldsForTab(s, dis, tabId, kind) {
    const r = this.reportKindFieldValues(s, tabId);
    if (kind === 'authority' || kind === 'other') {
      return `
      <div class="form-item"><label>核算周期内碳排放量（温室气体排放总量，tCO2e）</label>
        ${this.numInput(`f_${tabId}_emission`, r.ghgTotalEmission, dis, '0.01')}</div>`;
    }
    const ctx = this.getContext(s);
    const powerUnitField = ctx.isPowerIndustry
      ? `<div class="form-item"><label>全部机组二氧化碳排放总量（tCO2e）</label>${this.numInput(`f_${tabId}_unit_total`, r.unitTotalCo2Emission, dis, '0.01')}</div>`
      : '';
    return `
      <div class="form-item"><label>碳数据年份</label>${this.numInput(`f_${tabId}_carbon_year`, r.carbonDataYear, dis, '1')}</div>
      <div class="form-item"><label>核算周期内碳排放量（温室气体排放总量，tCO2e）</label>
        ${this.numInput(`f_${tabId}_emission`, r.ghgTotalEmission, dis, '0.01')}</div>
      <div class="form-item"><label>范围一的排放总量（tCO2e）</label>${this.numInput(`f_${tabId}_scope1`, r.scope1Emission, dis, '0.01')}</div>
      <div class="form-item"><label>范围二的排放总量（tCO2e）</label>${this.numInput(`f_${tabId}_scope2`, r.scope2Emission, dis, '0.01')}</div>
      ${powerUnitField}`;
  },

  renderReportVerifiedField(tabId, kind, dis, row) {
    if (kind === 'authority') {
      return `<div class="form-item"><label>该数据是否经政府/第三方核查</label>
        <input type="text" value="是" disabled>
        <input type="hidden" id="f_${tabId}_verified" value="yes"></div>`;
    }
    if (kind === 'other') {
      return `<div class="form-item"><label>该数据是否经政府/第三方核查</label>
        <input type="text" value="否" disabled>
        <input type="hidden" id="f_${tabId}_verified" value="no"></div>`;
    }
    const verified = row?.verified === 'no' || row?.verified === false ? 'no' : 'yes';
    return `<div class="form-item"><label>该数据是否经政府/第三方核查</label>
      <select id="f_${tabId}_verified" ${dis}>
        <option value="yes" ${verified === 'yes' ? 'selected' : ''}>是</option>
        <option value="no" ${verified === 'no' ? 'selected' : ''}>否</option>
      </select></div>`;
  },

  reportAttachOptions(kind) {
    if (kind === 'authority' || kind === 'other') {
      return { required: true, label: this.REPORT_ATTACH_LABEL, maxMb: this.ATTACH_MAX_MB_AUTHORITY };
    }
    return { required: false };
  },

  formatAttachMaxHint(maxMb) {
    if (maxMb >= 1024) return `每个不超过 ${Math.round(maxMb / 1024)}GB`;
    return `每个不超过 ${maxMb}MB`;
  },

  collectReportExtendedFieldsForTab(rootEl, tabId) {
    const ghgTotalEmission = qs(`#f_${tabId}_emission`, rootEl) ? numVal(`#f_${tabId}_emission`, rootEl) : null;
    const carbonEl = qs(`#f_${tabId}_carbon_year`, rootEl);
    const carbonDataYear = carbonEl ? numVal(`#f_${tabId}_carbon_year`, rootEl) : null;
    const hasPowerUnit = !!qs(`#f_${tabId}_unit_total`, rootEl);
    const hasScope1 = !!qs(`#f_${tabId}_scope1`, rootEl);
    return {
      carbonDataYear: carbonDataYear != null ? Math.round(carbonDataYear) : null,
      ghgTotalEmission,
      emission: ghgTotalEmission,
      scope1Emission: hasScope1 ? numVal(`#f_${tabId}_scope1`, rootEl) : null,
      scope2Emission: qs(`#f_${tabId}_scope2`, rootEl) ? numVal(`#f_${tabId}_scope2`, rootEl) : null,
      unitTotalCo2Emission: hasPowerUnit ? numVal(`#f_${tabId}_unit_total`, rootEl) : null
    };
  },

  resolveReportActiveTab(s) {
    const fd = this.normalizeReportFieldData(s || {});
    const auth = fd.reportAuthority || {};
    const other = fd.reportOther || {};
    const authVal = auth.ghgTotalEmission ?? auth.emission;
    const otherVal = other.ghgTotalEmission ?? other.emission;
    if (authVal != null && authVal !== '') return 'report_authority';
    if (otherVal != null && otherVal !== '') return 'report_other';
    if (s?.gelanPrefill || s?.disclosureChannel === GELAN_REPORT_DATA_SOURCE) return 'report_other';
    return 'report_authority';
  },

  applyReportFieldsToPayload(report, payload) {
    payload.reportedEmission = report.emission ?? report.ghgTotalEmission;
    payload.reportCarbonDataYear = report.carbonDataYear;
    payload.reportScope1Emission = report.scope1Emission;
    payload.reportScope2Emission = report.scope2Emission;
    payload.reportUnitTotalCo2Emission = report.unitTotalCo2Emission;
  },

  val(data, key, fallback = '') {
    const v = data?.[key];
    return v == null ? fallback : v;
  },

  projectAmountYuanInput(wanValue, yuanFallback) {
    if (wanValue != null && wanValue !== '' && wanValue !== '-') {
      return typeof projectWanToYuanFormValue === 'function'
        ? projectWanToYuanFormValue(wanValue)
        : (Number(wanValue) * 10000).toFixed(2);
    }
    if (yuanFallback == null || yuanFallback === '') return '';
    const n = Number(yuanFallback);
    return Number.isFinite(n) ? n.toFixed(2) : '';
  },

  projectYuanFieldToWan(sel, rootEl) {
    const yuan = numVal(sel, rootEl);
    if (yuan == null) return null;
    return typeof projectYuanFormToWan === 'function' ? projectYuanFormToWan(yuan) : yuan;
  },

  numInput(id, value, dis, step) {
    const st = step ? ` step="${step}"` : '';
    const v = value == null ? '' : value;
    return `<input id="${id}" type="number"${st} value="${v}" ${dis}>`;
  },

  numField(value, dis, step, attrs) {
    const st = step ? ` step="${step}"` : '';
    const v = value == null ? '' : value;
    return `<input type="number"${st} value="${v}" ${attrs || 'data-field="amount"'} ${dis}>`;
  },

  selectFromOptions(list, selected, dis, id, placeholder) {
    const opts = (placeholder !== false ? `<option value="">${placeholder || '请选择'}</option>` : '')
      + (list || []).map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return `<option value="${v}" ${selected === v ? 'selected' : ''}>${l}</option>`;
      }).join('');
    return `<select id="${id}" ${dis}>${opts}</select>`;
  },

  selectField(list, selected, dis, placeholder, attrs) {
    const placeholderText = placeholder === false ? false : (typeof placeholder === 'string' && placeholder ? placeholder : '请选择');
    const opts = (placeholderText !== false ? `<option value="">${placeholderText}</option>` : '')
      + (list || []).map(o => {
        const v = typeof o === 'string' ? o : o.value;
        const l = typeof o === 'string' ? o : o.label;
        return `<option value="${v}" ${selected === v ? 'selected' : ''}>${l}</option>`;
      }).join('');
    return `<select ${attrs || 'data-field="type"'} ${dis}>${opts}</select>`;
  },

  /** 从 legacy 编号字段或数组归一化为 { type, amount }[] */
  normalizePairRows(d, arrayKey, legacyPrefix, minRows = 1) {
    if (Array.isArray(d[arrayKey]) && d[arrayKey].length) {
      return d[arrayKey].map(r => ({ type: r?.type ?? null, amount: r?.amount ?? null }));
    }
    const rows = [];
    if (legacyPrefix === 'otherFuel') {
      if (d.otherFuel1Type || d.otherFuel1Amount != null) {
        rows.push({ type: d.otherFuel1Type || null, amount: d.otherFuel1Amount ?? null });
      }
      if (d.otherFuel2Type || d.otherFuel2Amount != null) {
        rows.push({ type: d.otherFuel2Type || null, amount: d.otherFuel2Amount ?? null });
      }
    } else if (legacyPrefix === 'desulfur') {
      for (let i = 1; i <= 20; i++) {
        const type = d['desulfur' + i + 'Type'];
        const amount = d['desulfur' + i + 'Amount'];
        if (type || amount != null) rows.push({ type: type || null, amount: amount ?? null });
      }
    } else {
      const type = d[legacyPrefix + 'Type'];
      const amount = d[legacyPrefix + 'Amount'];
      if (type || amount != null) rows.push({ type: type || null, amount: amount ?? null });
    }
    while (rows.length < minRows) rows.push({ type: null, amount: null });
    return rows;
  },

  renderRepeatablePairRow(row, config, dis, options = {}) {
    const { typeOptions, amountStep } = config;
    const showLabels = !!options.showLabels;
    const removeBtn = dis === 'disabled' ? '' : `<div class="form-item repeatable-row-actions"><button type="button" class="btn btn-sm btn-link repeatable-remove-row">删除</button></div>`;
    const typeLabel = showLabels ? `<label>${config.typeLabel}</label>` : '';
    const amountLabel = showLabels ? `<label>${config.amountLabel}</label>` : '';
    return `<div class="repeatable-row">
      <div class="repeatable-row-inner">
        <div class="form-item repeatable-col">${typeLabel}${this.selectField(typeOptions, row.type, dis, '请选择', 'data-field="type"')}</div>
        <div class="form-item repeatable-col">${amountLabel}${this.numField(row.amount, dis, amountStep, 'data-field="amount"')}</div>
        ${removeBtn}
      </div>
    </div>`;
  },

  renderRepeatablePairSection(listId, rows, config, dis) {
    const minRows = config.minRows ?? 1;
    const maxRows = config.maxRows ?? 20;
    const rowHtml = rows.map(r => this.renderRepeatablePairRow(r, config, dis)).join('');
    const addBtn = dis === 'disabled' ? '' : `<button type="button" class="btn btn-sm repeatable-add-row" data-repeatable-id="${listId}">+ 添加一行</button>`;
    return `<div class="repeatable-list-wrap">
      <div class="repeatable-list" data-repeatable-id="${listId}" data-min-rows="${minRows}" data-max-rows="${maxRows}" data-cols="2">
        <div class="repeatable-list-head">
          <span class="repeatable-head-cell">${config.typeLabel}</span>
          <span class="repeatable-head-cell">${config.amountLabel}</span>
          <span class="repeatable-head-cell repeatable-col-actions">操作</span>
        </div>
        ${rowHtml}
      </div>
      ${addBtn}
    </div>`;
  },

  collectRepeatablePairList(rootEl, listId) {
    const list = qs(`.repeatable-list[data-repeatable-id="${listId}"]`, rootEl);
    if (!list) return [];
    return qsa('.repeatable-row', list).map(row => ({
      type: qs('[data-field="type"]', row)?.value || null,
      amount: numVal('[data-field="amount"]', row)
    })).filter(r => r.type || (r.amount != null && r.amount !== '' && !Number.isNaN(Number(r.amount))));
  },

  normalizeCustomFuelRows(d) {
    if (Array.isArray(d.customFuels) && d.customFuels.length) {
      return d.customFuels.map(r => ({
        category: r?.category ?? '',
        item: r?.item ?? '',
        amount: r?.amount ?? null,
        unit: r?.unit ?? ''
      }));
    }
    return [{ category: '', item: '', amount: null, unit: '' }];
  },

  normalizeCustomProductRows(d) {
    if (Array.isArray(d.customProducts) && d.customProducts.length) {
      return d.customProducts.map(r => ({
        name: r?.name ?? '',
        amount: r?.amount ?? null,
        unit: r?.unit ?? '吨'
      }));
    }
    return [{ name: '', amount: null, unit: '吨' }];
  },

  renderRepeatableCustomRow(row, fields, dis) {
    const removeBtn = dis === 'disabled' ? '' : `<div class="form-item repeatable-row-actions"><button type="button" class="btn btn-sm btn-link repeatable-remove-row">删除</button></div>`;
    const cells = fields.map(f => {
      const val = row[f.key] == null ? '' : row[f.key];
      const placeholder = f.placeholder || f.label || '';
      if (f.type === 'number') {
        return `<div class="form-item repeatable-col"><input type="number" step="${f.step || '0.0001'}" data-field="${f.key}" value="${val}" ${dis} placeholder="${placeholder}" aria-label="${f.label}"></div>`;
      }
      return `<div class="form-item repeatable-col"><input type="text" data-field="${f.key}" value="${val}" ${dis} placeholder="${placeholder}" aria-label="${f.label}"></div>`;
    }).join('');
    return `<div class="repeatable-row"><div class="repeatable-row-inner">${cells}${removeBtn}</div></div>`;
  },

  renderRepeatableCustomSection(listId, rows, fieldDefs, dis, options = {}) {
    const minRows = options.minRows ?? 0;
    const maxRows = options.maxRows ?? 20;
    const rowHtml = rows.map(r => this.renderRepeatableCustomRow(r, fieldDefs, dis)).join('');
    const addBtn = dis === 'disabled' ? '' : `<button type="button" class="btn btn-sm repeatable-add-row" data-repeatable-id="${listId}">${options.addLabel || '+ 添加一行'}</button>`;
    const headCells = fieldDefs.map(f => `<span class="repeatable-head-cell">${f.label}</span>`).join('');
    return `<div class="repeatable-list-wrap">
      <div class="repeatable-list" data-repeatable-id="${listId}" data-min-rows="${minRows}" data-max-rows="${maxRows}" data-cols="${fieldDefs.length}">
        <div class="repeatable-list-head">
          ${headCells}
          <span class="repeatable-head-cell repeatable-col-actions">操作</span>
        </div>
        ${rowHtml}
      </div>
      ${addBtn}
    </div>`;
  },

  collectRepeatableCustomList(rootEl, listId, fieldKeys) {
    const list = qs(`.repeatable-list[data-repeatable-id="${listId}"]`, rootEl);
    if (!list) return [];
    return qsa('.repeatable-row', list).map(row => {
      const item = {};
      fieldKeys.forEach(key => {
        const el = qs(`[data-field="${key}"]`, row);
        if (!el) return;
        item[key] = el.type === 'number' ? numVal(`[data-field="${key}"]`, row) : (el.value || '').trim();
      });
      return item;
    }).filter(r => fieldKeys.some(k => r[k] != null && r[k] !== ''));
  },

  syncLegacyPairRows(d, arrayKey, legacyPrefix) {
    const rows = d[arrayKey] || [];
    for (let i = 1; i <= 20; i++) {
      delete d[legacyPrefix + i + 'Type'];
      delete d[legacyPrefix + i + 'Amount'];
    }
    rows.forEach((r, i) => {
      const n = i + 1;
      d[legacyPrefix + n + 'Type'] = r.type ?? null;
      d[legacyPrefix + n + 'Amount'] = r.amount ?? null;
    });
    if (legacyPrefix === 'otherFuel') {
      d.otherFuel1Type = rows[0]?.type ?? null;
      d.otherFuel1Amount = rows[0]?.amount ?? null;
      d.otherFuel2Type = rows[1]?.type ?? null;
      d.otherFuel2Amount = rows[1]?.amount ?? null;
    } else if (legacyPrefix !== 'desulfur') {
      d[legacyPrefix + 'Type'] = rows[0]?.type ?? null;
      d[legacyPrefix + 'Amount'] = rows[0]?.amount ?? null;
    }
  },

  bindRepeatableLists(rootEl, readonly) {
    const root = rootEl || document;
    if (readonly) return;
    const bindRemove = (listEl) => {
      qsa('.repeatable-remove-row', listEl).forEach(btn => {
        if (btn._repeatableBound) return;
        btn._repeatableBound = true;
        btn.onclick = () => {
          const min = Number(listEl.dataset.minRows) || 1;
          if (qsa('.repeatable-row', listEl).length <= min) return;
          btn.closest('.repeatable-row')?.remove();
        };
      });
    };
    qsa('.repeatable-list', root).forEach(listEl => {
      bindRemove(listEl);
      const wrap = listEl.closest('.repeatable-list-wrap');
      const addBtn = wrap?.querySelector('.repeatable-add-row');
      if (addBtn && !addBtn._repeatableBound) {
        addBtn._repeatableBound = true;
        addBtn.onclick = () => {
          const max = Number(listEl.dataset.maxRows) || 20;
          const rows = qsa('.repeatable-row', listEl);
          if (rows.length >= max) return;
          const last = rows[rows.length - 1];
          const clone = last.cloneNode(true);
          qsa('select', clone).forEach(s => { s.selectedIndex = 0; });
          qsa('input', clone).forEach(i => { i.value = ''; });
          listEl.appendChild(clone);
          bindRemove(listEl);
        };
      }
    });
  },

  renderProjectInfoChoice(s, dis, ctx) {
    const val = s.projectInfoAvailable ?? ctx.formal?.projectInfoAvailable;
    const selected = val === true ? 'yes' : (val === false ? 'no' : '');
    return `
      <div class="form-item full" data-project-info-choice>
        <label class="field-label field-label--required">${this.reqLabel('是否可提供项目信息')}</label>
        <select id="f_project_info_available" ${dis}>
          <option value="" ${selected === '' ? 'selected' : ''}>请选择</option>
          <option value="yes" ${selected === 'yes' ? 'selected' : ''}>是</option>
          <option value="no" ${selected === 'no' ? 'selected' : ''}>否</option>
        </select>
        <small class="text-muted">项目类业务需先确认是否可提供项目信息。选「是」需填写项目字段；选「否」将按非项目方式核算。</small>
      </div>`;
  },

  bindProjectInfoChoice(rootEl, readonly) {
    if (readonly) return;
    const root = rootEl || document;
    qsa('#f_project_info_available', root).forEach(sel => {
      if (sel._projectInfoBound) return;
      sel._projectInfoBound = true;
      const scope = sel.closest('.card-body') || sel.closest('.form-grid') || root;
      const sync = () => {
        const choice = sel.value;
        const projectFields = qs('[data-project-info-fields]', scope);
        const entityFields = qs('[data-entity-info-fields]', scope);
        if (projectFields) projectFields.style.display = choice === 'yes' ? '' : 'none';
        if (entityFields) entityFields.style.display = choice === 'no' ? '' : 'none';
      };
      sel.addEventListener('change', sync);
      sync();
    });
  },

  renderBasicInfo(s, dis, basicEditable = false) {
    const ctx = this.getContext(s);
    const formal = ctx.formal;
    const basicDis = basicEditable ? '' : 'disabled';
    const projectSeed = (Array.isArray(formal?.projectDetails) && formal.projectDetails[0])
      || (Array.isArray(s.projectDetails) && s.projectDetails[0])
      || {};
    const projectInfo = s.projectInfo || {};
    const projectVal = (key, fallback = '') => this.val(projectInfo, key, projectSeed?.[key] ?? fallback);
    const accountingLabel = typeof candidateAccountingTypeLabel === 'function'
      ? candidateAccountingTypeLabel({ ...(formal || {}), ...(s || {}), accountingType: ctx.accountingType })
      : (ctx.accountingType || '—');
    const avgAssetsVal = s.avgTotalAssets ?? formal?.avgTotalAssets ?? s.totalAssets ?? '';
    const revenueVal = s.revenue ?? formal?.operatingRevenue ?? s.operatingRevenue ?? '';
    const showProjectFields = ctx.needsProjectFinancials || ctx.showProjectInfoChoice;
    const projectFieldsHidden = ctx.showProjectInfoChoice && !ctx.needsProjectFinancials;
    const entityFieldsHidden = ctx.showProjectInfoChoice && !ctx.needsEntityFinancials;
    return `
      <div class="form-item"><label>客户名称</label><input id="f_customer_name" value="${s.customerName || ''}" ${basicDis}></div>
      <div class="form-item"><label>所属行业</label><input id="f_industry_major" value="${ctx.industryMajor}" ${basicDis}></div>
      ${ctx.gbIndustryCode ? `<div class="form-item"><label>国民经济行业（4级）</label><input value="${ctx.gbIndustryCode} ${ctx.gbIndustryName || ''}" disabled></div>` : ''}
      <div class="form-item"><label>业务种类</label><input value="${accountingLabel || '项目（计算方法待定）'}" disabled></div>
      ${ctx.template ? `<div class="form-item"><label>采集模板</label><input value="${ctx.sheetName}（${ctx.isProject ? '项目' : '非项目'}）" disabled></div>` : ''}
      ${ctx.showProjectInfoChoice ? this.renderProjectInfoChoice(s, dis, ctx) : ''}
      ${showProjectFields ? `<div class="form-item full project-info-fields" data-project-info-fields${projectFieldsHidden ? ' style="display:none"' : ''}>
        <div class="form-section-title">项目信息填报</div>
        <div class="form-grid">
          <div class="form-item"><label class="field-label">${this.reqLabel('项目号', false)}</label><input id="f_prj_no" value="${projectVal('projectNo')}" ${dis}></div>
          <div class="form-item"><label class="field-label">${this.reqLabel('项目名称', false)}</label><input id="f_prj_name" value="${projectVal('projectName')}" ${dis}></div>
          <div class="form-item"><label class="field-label">${this.reqLabel('项目所在地区域（省）', false)}</label><input id="f_prj_province" value="${projectVal('projectProvince')}" ${dis}></div>
          <div class="form-item"><label class="field-label">${this.reqLabel('项目所属行业', false)}</label><input id="f_prj_industry" value="${projectVal('projectIndustry', ctx.industryMajor)}" ${dis}></div>
          <div class="form-item"><label class="field-label">${this.reqLabel('客户号', false)}</label><input id="f_prj_customer_no" value="${projectVal('customerNo')}" ${dis}></div>
          <div class="form-item"><label class="field-label">${this.reqLabel('客户名称', false)}</label><input id="f_prj_customer_name" value="${projectVal('customerName', s.customerName || '')}" ${dis}></div>
          <div class="form-item"><label class="field-label">${this.reqLabel('统一社会信用代码', false)}</label><input id="f_prj_credit_code" value="${projectVal('creditCode', formal?.creditCode || '')}" ${dis}></div>
          <div class="form-item"><label class="field-label">${this.reqLabel('国民经济行业代码（4级）', false)}</label><input id="f_prj_industry_code_lv4" value="${projectVal('nationalIndustryCodeLv4', formal?.gbIndustryCode || '')}" ${dis}></div>
          <div class="form-item"><label class="field-label">${this.reqLabel('项目月均贷款余额（元）', false)}</label>${this.numInput('f_prj_avg_loan', this.projectAmountYuanInput(projectVal('projectAvgLoanBalanceWan', null), s.avgLoanBalance), dis, '0.01')}</div>
          <div class="form-item"><label class="field-label field-label--required">${this.reqLabel('项目收入（元）')}</label>${this.numInput('f_prj_revenue', this.projectAmountYuanInput(projectVal('projectRevenueWan', null), s.revenue), dis, '0.01')}</div>
          <div class="form-item"><label class="field-label field-label--required">${this.reqLabel('项目总投资（元）')}</label>${this.numInput('f_prj_total_invest', this.projectAmountYuanInput(projectVal('projectTotalInvestmentWan', null), formal?.projectTotalInvestmentWan), dis, '0.01')}</div>
        </div>
      </div>` : ''}
      ${(ctx.needsEntityFinancials || ctx.showProjectInfoChoice) ? `
      <div class="entity-info-fields" data-entity-info-fields${entityFieldsHidden ? ' style="display:none"' : ''}>
      <div class="form-item"><label class="field-label field-label--required">${this.reqLabel('营业收入（元）')}</label>${this.numInput('f_revenue', revenueVal, dis)}</div>
      <div class="form-item"><label class="field-label field-label--required">${this.reqLabel('平均资产总额（元）')}</label>${this.numInput('f_avg_total_assets', avgAssetsVal, dis)}</div>
      <div class="form-item"><label class="field-label">${this.reqLabel('月均贷款余额（元）', false)}</label>${this.numInput('f_avg_loan', s.avgLoanBalance, dis)}</div>
      </div>` : ''}`;
  },

  renderAttachmentSection(tabId, attachments, dis, options = {}) {
    const required = !!options.required;
    const label = options.label || '报告附件';
    const labelHtml = required
      ? `<label class="field-label field-label--required">${fieldLabel(label)}</label>`
      : `<label class="field-label"><span class="field-label-text">${escapeHtml(label)}</span></label>`;
    const maxMb = options.maxMb ?? this.ATTACH_MAX_MB;
    const inputId = `f_${tabId}_files`;
    const listId = `f_${tabId}_attach_list`;
    const wrapAttrs = (tabId === 'report_authority' || tabId === 'report_other')
      ? ` id="f_${tabId}_attach_wrap"` : '';
    const sizeHint = this.formatAttachMaxHint(maxMb);
    const extraHint = required ? '；报告法提交时必须上传佐证材料' : '';
    return `
      <div class="form-item full"${wrapAttrs}>
        ${labelHtml}
        <input type="file" id="${inputId}" ${dis} multiple accept="${this.ATTACH_ACCEPT}" style="margin-top:6px">
        <small style="color:#909399;display:block;margin-top:4px">支持 pdf、doc、docx、xls、xlsx、png、jpeg、jpg；最多 ${this.ATTACH_MAX_COUNT} 个，${sizeHint}${extraHint}</small>
        <ul class="attach-list" id="${listId}">${this.renderAttachList(attachments)}</ul>
      </div>`;
  },

  renderReportKindPanel(s, dis, panelCls, panelId, kind) {
    const tpl = this.resolveTemplate(s);
    const ctx = this.getContext(s);
    const tabId = panelId;
    const row = this.reportKindFieldValues(s, tabId);
    const attachments = row.attachments || [];
    const sources = kind === 'authority'
      ? this.reportAuthoritySources(ctx.isProject)
      : this.reportOtherSources(ctx.isProject);
    const defaultSource = row.source || sources[0] || '';
    const attachOptions = this.reportAttachOptions(kind);
    if (!tpl?.methods?.report) {
      return this.renderReportKindPanelDefault(s, dis, panelCls, panelId, kind);
    }
    return `
      <div class="${panelCls}" data-panel="${panelId}">
        <div class="form-grid">
          <div class="form-item"><label>报告法数据来源</label>
            ${this.selectFromOptions(sources, defaultSource, dis, `f_${tabId}_source`, false)}</div>
          ${this.renderReportVerifiedField(tabId, kind, dis, row)}
          ${this.renderReportExtendedFieldsForTab(s, dis, tabId, kind)}
          ${this.renderAttachmentSection(tabId, attachments, dis, attachOptions)}
        </div>
      </div>`;
  },

  renderReportKindPanelDefault(s, dis, panelCls, panelId, kind) {
    const tabId = panelId;
    const row = this.reportKindFieldValues(s, tabId);
    const attachments = row.attachments || [];
    const ctx = this.getContext(s);
    const sources = kind === 'authority'
      ? this.reportAuthoritySources(ctx.isProject)
      : (kind === 'other' ? ['ESG报告', '年报', '核查报告', GELAN_REPORT_DATA_SOURCE || '其他'] : []);
    const channel = row.source || s.disclosureChannel || sources[0] || 'ESG报告';
    const attachOptions = this.reportAttachOptions(kind);
    return `
      <div class="${panelCls}" data-panel="${panelId}"><div class="form-grid">
        ${this.renderReportExtendedFieldsForTab(s, dis, tabId, kind)}
        <div class="form-item"><label>报告法数据来源</label>
          <select id="f_${tabId}_source" ${dis}>${sources.map(c =>
            `<option ${channel === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        ${this.renderReportVerifiedField(tabId, kind, dis, row)}
        ${this.renderAttachmentSection(tabId, attachments, dis, attachOptions)}
      </div></div>`;
  },

  /** @deprecated */
  renderReportPanel(s, dis, panelCls, panelId) {
    return this.renderReportKindPanel(s, dis, panelCls, panelId || 'report_authority', 'authority');
  },

  renderEnergyPanel(s, dis, panelCls, panelId) {
    const tpl = this.resolveTemplate(s);
    if (!tpl?.methods?.energy) return this.renderEnergyPanelDefault(s, dis, panelCls, panelId);
    const en = tpl.methods.energy;
    const d = { ...(this.fieldData(s).energy || {}) };
    let fuelBody = '';
    if (en.fuelCategories?.length) {
      en.fuelCategories.forEach(cat => {
        fuelBody += `<div class="form-section-title">${cat.category}</div><div class="form-grid form-grid-3">`;
        (cat.items || []).forEach(item => {
          const unitHint = item.unit ? `（${item.unit}）` : '';
          fuelBody += `<div class="form-item"><label>${item.label}${unitHint}</label>${this.numInput('f_en_' + item.key, d[item.key], dis, '0.0001')}</div>`;
        });
        fuelBody += '</div>';
      });
    } else {
      const fuelHtml = (en.fuelFixed || []).map(f =>
        `<div class="form-item"><label>${f.label}</label>${this.numInput('f_en_' + f.key, d[f.key], dis, f.step)}</div>`
      ).join('');
      const otherFuelOpts = en.otherFuelOptions || [];
      const otherFuelRows = this.normalizePairRows(d, 'otherFuels', 'otherFuel', 1);
      const otherFuelSection = otherFuelOpts.length
        ? this.renderRepeatablePairSection('otherFuels', otherFuelRows, {
          typeLabel: '燃料品种',
          amountLabel: '消耗量（吨或万立方米）',
          typeOptions: otherFuelOpts,
          amountStep: '0.0001',
          minRows: 1,
          maxRows: 20
        }, dis)
        : '';
      fuelBody = `
        <div class="form-section-title">燃料燃烧排放</div>
        <div class="form-grid form-grid-3">${fuelHtml}</div>
        ${otherFuelSection ? `<div class="form-section-title">其他能源（下拉选择）</div>${otherFuelSection}` : ''}`;
    }
    const customFuelSection = en.allowCustomFuel !== false
      ? `<div class="form-section-title">其他能源（手动新增）</div>${this.renderRepeatableCustomSection('customFuels', this.normalizeCustomFuelRows(d), [
        { key: 'category', label: '能源类型', placeholder: '如固体燃料、液体燃料' },
        { key: 'item', label: '细分项', placeholder: '如无烟煤、天然气' },
        { key: 'amount', label: '消耗量', type: 'number', step: '0.0001' },
        { key: 'unit', label: '单位', placeholder: 't（吨）或 104Nm3' }
      ], dis, { minRows: 0, addLabel: '+ 添加能源' })}`
      : '';
    const gridLabel = en.gridLabel || '所属电网';
    return `
      <div class="${panelCls}" data-panel="${panelId}">
        ${fuelBody}
        ${customFuelSection}
        <div class="form-section-title">净购入电量</div>
        <div class="form-grid">
          <div class="form-item"><label>${gridLabel}</label>${this.selectFromOptions(en.gridOptions || [], d.powerGrid || '全国平均', dis, 'f_en_grid', false)}</div>
          <div class="form-item"><label>数值（MWh）</label>${this.numInput('f_en_elec', d.purchasedElectricity, dis, '0.01')}</div>
        </div>
        ${en.hasPurchasedHeat ? `
        <div class="form-section-title">净购入热力</div>
        <div class="form-grid">
          <div class="form-item"><label>数值（GJ）</label>${this.numInput('f_en_heat', d.purchasedHeat, dis, '0.01')}</div>
        </div>` : ''}
        ${this.renderProcessBlocks(en.processBlocks || [], d, dis)}
      </div>`;
  },

  renderProcessBlocks(blocks, d, dis) {
    if (!blocks.length) return '';
    let html = '';
    const amountBlocks = blocks.filter(b => b.type === 'amount');
    blocks.forEach(block => {
      if (block.type === 'desulfur') {
        const rows = this.normalizePairRows(d, 'desulfurRows', 'desulfur', 1);
        html += `<div class="form-section-title">过程排放 — ${block.label || '脱硫试剂'}（下拉选择）</div>`;
        html += this.renderRepeatablePairSection('desulfurRows', rows, {
          typeLabel: `${block.label || '脱硫试剂'} · 试剂类型`,
          amountLabel: `${block.label || '脱硫试剂'} · 消耗量（吨）`,
          typeOptions: block.typeOptions || [],
          amountStep: '0.01',
          minRows: 1,
          maxRows: 20
        }, dis);
      } else if (block.type === 'carbonate') {
        const prefix = block.keyPrefix || 'carbonate';
        const arrayKey = prefix + 'Rows';
        const rows = this.normalizePairRows(d, arrayKey, prefix, 1);
        html += `<div class="form-section-title">过程排放 — ${block.label || '碳酸盐分解'}（下拉选择）</div>`;
        html += this.renderRepeatablePairSection(arrayKey, rows, {
          typeLabel: `${block.label || '碳酸盐分解'} · 类型`,
          amountLabel: `${block.label || '碳酸盐分解'} · 消耗量（吨）`,
          typeOptions: block.typeOptions || [],
          amountStep: '0.01',
          minRows: 1,
          maxRows: 20
        }, dis);
      } else if (block.type === 'process') {
        const prefix = block.keyPrefix || 'process';
        const arrayKey = prefix + 'Rows';
        const rows = this.normalizePairRows(d, arrayKey, prefix, 1);
        html += `<div class="form-section-title">过程排放 — ${block.label || '生产过程'}（下拉选择）</div>`;
        html += this.renderRepeatablePairSection(arrayKey, rows, {
          typeLabel: `${block.label || '生产过程'} · 类型`,
          amountLabel: `${block.label || '生产过程'} · 消耗量/产量`,
          typeOptions: block.typeOptions || [],
          amountStep: '0.01',
          minRows: 1,
          maxRows: 20
        }, dis);
      }
    });
    if (amountBlocks.length) {
      html += '<div class="form-section-title">过程排放</div><div class="form-grid">';
      amountBlocks.forEach(block => {
        html += `<div class="form-item"><label>${block.label}</label>${this.numInput('f_en_' + block.key, d[block.key], dis, '0.01')}</div>`;
      });
      html += '</div>';
    }
    return html;
  },

  renderEnergyPanelDefault(s, dis, panelCls, panelId) {
    return `
      <div class="${panelCls}" data-panel="${panelId}"><div class="form-grid">
        <div class="form-item full"><label>物理活动法-能源法排放总量(tCO₂)</label>
          ${this.numInput('f_energy_total', s.energyTotalEmission, dis)}</div>
      </div></div>`;
  },

  renderProductPanel(s, dis, panelCls, panelId) {
    const tpl = this.resolveTemplate(s);
    const d = this.fieldData(s).product || {};
    const productCfg = tpl?.methods?.product;
    const fields = productCfg?.fields;
    if (!productCfg?.supported || !fields?.length) {
      return `<div class="${panelCls}" data-panel="${panelId}">
        <p style="color:#909399;padding:12px">该行业采集模板不含产品法字段</p>
      </div>`;
    }
    const groups = {};
    fields.forEach(f => {
      const g = f.group || '产品产量';
      if (!groups[g]) groups[g] = [];
      groups[g].push(f);
    });
    let body = '';
    Object.keys(groups).forEach(g => {
      body += `<div class="form-section-title">${g}</div><div class="form-grid form-grid-2">`;
      body += groups[g].map(f => {
        const unitHint = f.unit && !String(f.label).includes(String(f.unit)) ? `（${f.unit}）` : '';
        return `<div class="form-item"><label>${f.label}${unitHint}</label>${this.numInput('f_pd_' + f.key, d[f.key], dis, '0.01')}</div>`;
      }).join('');
      body += '</div>';
    });
    const customSection = productCfg.allowCustomProducts !== false
      ? `<div class="form-section-title">其他产品（手动新增）</div>${this.renderRepeatableCustomSection('customProducts', this.normalizeCustomProductRows(d), [
        { key: 'name', label: '产品名称', placeholder: '如粗钢、聚氯乙烯' },
        { key: 'amount', label: '产量', type: 'number', step: '0.01' },
        { key: 'unit', label: '单位', placeholder: '吨' }
      ], dis, { minRows: 0, addLabel: '+ 添加产品' })}`
      : '';
    return `
      <div class="${panelCls}" data-panel="${panelId}">
        ${body}
        ${customSection}
      </div>`;
  },

  renderAttachList(list) {
    if (!list?.length) return '<li class="attach-empty">暂无附件</li>';
    return list.map(f =>
      `<li>${f.name} <span class="attach-meta">(${this.formatFileSize(f.size)})</span></li>`).join('');
  },

  formatFileSize(bytes) {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MB';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  },

  isReportVerifiedYes(rootEl, tabId) {
    const el = qs(`#f_${tabId}_verified`, rootEl);
    return el?.value === 'yes';
  },

  getReportAttachments(supplement, tabId) {
    const key = this.reportFieldKey(tabId);
    const fd = this.normalizeReportFieldData(supplement || {});
    return fd[key]?.attachments || [];
  },

  syncReportAttachmentRequired(rootEl) {
    ['report_authority', 'report_other'].forEach(tabId => {
      const wrap = qs(`#f_${tabId}_attach_wrap`, rootEl);
      if (!wrap) return;
      const label = wrap.querySelector('label');
      const hint = wrap.querySelector('small');
      if (label && !label.querySelector('.field-required-dot')) {
        label.classList.add('field-label', 'field-label--required');
        label.insertAdjacentHTML('afterbegin', renderRequiredDot());
      }
      if (hint) {
        hint.textContent = `支持 pdf、doc、docx、xls、xlsx、png、jpeg、jpg；最多 ${this.ATTACH_MAX_COUNT} 个，${this.formatAttachMaxHint(this.ATTACH_MAX_MB_AUTHORITY)}；提交时必须上传佐证材料`;
      }
    });
  },

  bindReportAttachmentRule(rootEl, readonly) {
    if (readonly) return;
    this.syncReportAttachmentRequired(rootEl);
  },

  _validateRequiredFields(rootEl, fields) {
    for (const field of fields) {
      const val = field.type === 'number'
        ? numVal('#' + field.id, rootEl)
        : txtVal('#' + field.id, rootEl);
      if (val == null || val === '') {
        return { ok: false, message: `请填写${field.label}` };
      }
    }
    return { ok: true };
  },

  validateReportAuthorityAttachments() {
    return { ok: true };
  },

  validateActiveReportAttachments(rootEl, supplement) {
    const activeTab = qs('#methodTabs .tab.active', rootEl)?.dataset.tab || supplement?.activeMethodTab;
    if (activeTab !== 'report_authority' && activeTab !== 'report_other') return { ok: true };
    const attachments = this.getReportAttachments(supplement, activeTab);
    if (!attachments.length) {
      return { ok: false, tabId: activeTab, message: '报告法佐证材料为必填项，请先上传附件' };
    }
    return { ok: true };
  },

  validateSupplementSubmit(rootEl, supplement) {
    const ctx = this.getContext(supplement);
    const reportCheck = this.validateActiveReportAttachments(rootEl, supplement);
    if (!reportCheck.ok) return reportCheck;
    if (ctx.showProjectInfoChoice || (ctx.isProject && ctx.projectInfoAvailable == null && ctx.accountingType == null)) {
      const choice = qs('#f_project_info_available', rootEl)?.value;
      if (!choice) return { ok: false, message: '请选择是否可提供项目信息' };
    }
    const projectChoice = qs('#f_project_info_available', rootEl)?.value;
    if (projectChoice === 'yes' || ctx.needsProjectFinancials) {
      return this._validateRequiredFields(rootEl, this.PROJECT_SUBMIT_REQUIRED);
    }
    if (projectChoice === 'no' || ctx.needsEntityFinancials) {
      return this._validateRequiredFields(rootEl, this.ENTITY_SUBMIT_REQUIRED);
    }
    return { ok: true };
  },

  validateProjectInfo(rootEl, supplement) {
    return this.validateSupplementSubmit(rootEl, supplement);
  },

  validateAttachments(files, existingCount, options = {}) {
    const allowed = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpeg', 'jpg'];
    const maxMb = options.maxMb ?? this.ATTACH_MAX_MB;
    const maxBytes = maxMb * 1024 * 1024;
    const sizeLabel = maxMb >= 1024 ? `${Math.round(maxMb / 1024)}GB` : `${maxMb}MB`;
    const list = [];
    for (const f of files) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!allowed.includes(ext)) return { ok: false, message: `不支持的文件格式：${f.name}` };
      if (f.size > maxBytes) return { ok: false, message: `${f.name} 超过 ${sizeLabel} 限制` };
      list.push({ name: f.name, size: f.size, uploadedAt: new Date().toLocaleString('zh-CN') });
    }
    if (existingCount + list.length > this.ATTACH_MAX_COUNT) {
      return { ok: false, message: `最多上传 ${this.ATTACH_MAX_COUNT} 个附件` };
    }
    return { ok: true, list };
  },

  bindFileUpload(rootEl, supplementId, readonly) {
    if (readonly) return;
    ['report_authority', 'report_other', 'other'].forEach(tabId => {
      this._bindTabFileUpload(rootEl, supplementId, tabId);
    });
  },

  _fieldKeyForAttachTab(tabId) {
    if (tabId === 'report_authority' || tabId === 'report_other') return this.reportFieldKey(tabId);
    return tabId;
  },

  _bindTabFileUpload(rootEl, supplementId, tabId) {
    const input = qs(`#f_${tabId}_files`, rootEl);
    if (!input) return;
    const fieldKey = this._fieldKeyForAttachTab(tabId);
    input.onchange = () => {
      const s = Store.get().supplements.find(x => x.id === supplementId);
      if (!s) return;
      const fd = this.normalizeReportFieldData(s);
      const existing = (s.fieldData?.[fieldKey]?.attachments || fd[fieldKey]?.attachments || []);
      const maxMb = (tabId === 'report_authority' || tabId === 'report_other')
        ? this.ATTACH_MAX_MB_AUTHORITY
        : this.ATTACH_MAX_MB;
      const check = this.validateAttachments([...input.files], existing.length, { maxMb });
      if (!check.ok) { toast(check.message, 'warning'); input.value = ''; return; }
      Store.update(d => {
        const sup = d.supplements.find(x => x.id === supplementId);
        if (!sup) return;
        sup.fieldData = sup.fieldData || {};
        sup.fieldData[fieldKey] = sup.fieldData[fieldKey] || {};
        sup.fieldData[fieldKey].attachments = existing.concat(check.list);
      });
      input.value = '';
      const listEl = qs(`#f_${tabId}_attach_list`, rootEl);
      if (listEl) {
        const updated = Store.get().supplements.find(x => x.id === supplementId);
        const key = this._fieldKeyForAttachTab(tabId);
        listEl.innerHTML = this.renderAttachList(updated?.fieldData?.[key]?.attachments || []);
      }
      toast('附件已添加（演示：仅保存在浏览器本地）', 'success');
    };
  },

  collectEnergyData(rootEl, tpl, supplement) {
    const en = tpl.methods.energy;
    const d = {};
    if (en.fuelCategories?.length) {
      en.fuelCategories.forEach(cat => {
        (cat.items || []).forEach(item => {
          d[item.key] = numVal('#f_en_' + item.key, rootEl);
        });
      });
    } else {
      (en.fuelFixed || []).forEach(f => { d[f.key] = numVal('#f_en_' + f.key, rootEl); });
      d.otherFuels = this.collectRepeatablePairList(rootEl, 'otherFuels');
      this.syncLegacyPairRows(d, 'otherFuels', 'otherFuel');
    }
    if (en.allowCustomFuel !== false) {
      d.customFuels = this.collectRepeatableCustomList(rootEl, 'customFuels', ['category', 'item', 'amount', 'unit']);
    }
    d.powerGrid = qs('#f_en_grid', rootEl)?.value;
    d.purchasedElectricity = numVal('#f_en_elec', rootEl);
    if (en.hasPurchasedHeat) d.purchasedHeat = numVal('#f_en_heat', rootEl);
    (en.processBlocks || []).forEach(block => {
      if (block.type === 'desulfur') {
        d.desulfurRows = this.collectRepeatablePairList(rootEl, 'desulfurRows');
        this.syncLegacyPairRows(d, 'desulfurRows', 'desulfur');
      } else if (block.type === 'carbonate' || block.type === 'process') {
        const prefix = block.keyPrefix || (block.type === 'carbonate' ? 'carbonate' : 'process');
        const arrayKey = prefix + 'Rows';
        d[arrayKey] = this.collectRepeatablePairList(rootEl, arrayKey);
        this.syncLegacyPairRows(d, arrayKey, prefix);
      } else if (block.type === 'amount') {
        d[block.key] = numVal('#f_en_' + block.key, rootEl);
      }
    });
    return d;
  },

  collectProductData(rootEl, tpl) {
    const product = {};
    (tpl.methods.product.fields || []).forEach(f => {
      product[f.key] = numVal('#f_pd_' + f.key, rootEl);
    });
    if (tpl.methods.product.allowCustomProducts !== false) {
      product.customProducts = this.collectRepeatableCustomList(rootEl, 'customProducts', ['name', 'amount', 'unit']);
    }
    return product;
  },

  _collectBasicFormData(rootEl, supplement) {
    const ctx = this.getContext(supplement);
    const payload = {
      customerName: txtVal('#f_customer_name', rootEl) || supplement.customerName,
      industryMajor: txtVal('#f_industry_major', rootEl) || supplement.industryMajor,
      accountingType: ctx.accountingType,
      fieldData: { ...(supplement.fieldData || {}) }
    };
    const choiceEl = qs('#f_project_info_available', rootEl);
    if (choiceEl) {
      const choice = choiceEl.value;
      if (choice === 'yes') payload.projectInfoAvailable = true;
      else if (choice === 'no') payload.projectInfoAvailable = false;
      else payload.projectInfoAvailable = supplement.projectInfoAvailable ?? null;
    }
    const includeProjectFields = ctx.needsProjectFinancials || payload.projectInfoAvailable === true;
    if (ctx.needsEntityFinancials && payload.projectInfoAvailable !== true) {
      payload.revenue = numVal('#f_revenue', rootEl);
      payload.avgTotalAssets = numVal('#f_avg_total_assets', rootEl);
      payload.totalAssets = payload.avgTotalAssets;
      payload.avgLoanBalance = numVal('#f_avg_loan', rootEl);
    }
    if (includeProjectFields) {
      payload.projectInfo = {
        projectNo: txtVal('#f_prj_no', rootEl),
        projectName: txtVal('#f_prj_name', rootEl),
        projectProvince: txtVal('#f_prj_province', rootEl),
        projectIndustry: txtVal('#f_prj_industry', rootEl),
        customerNo: txtVal('#f_prj_customer_no', rootEl),
        customerName: txtVal('#f_prj_customer_name', rootEl),
        creditCode: txtVal('#f_prj_credit_code', rootEl),
        nationalIndustryCodeLv4: txtVal('#f_prj_industry_code_lv4', rootEl),
        projectAvgLoanBalanceWan: this.projectYuanFieldToWan('#f_prj_avg_loan', rootEl),
        projectRevenueWan: this.projectYuanFieldToWan('#f_prj_revenue', rootEl),
        projectTotalInvestmentWan: this.projectYuanFieldToWan('#f_prj_total_invest', rootEl)
      };
      payload.projectDetails = [payload.projectInfo];
      payload.projectInfoAvailable = true;
      payload.revenue = payload.projectInfo.projectRevenueWan;
    }
    return payload;
  },

  _mergeReportTabs(rootEl, supplement, payload, tpl) {
    const ctx = this.getContext(supplement);
    payload.fieldData = payload.fieldData || {};
    ['report_authority', 'report_other'].forEach(tabId => {
      const fieldKey = this.reportFieldKey(tabId);
      const verifiedEl = qs(`#f_${tabId}_verified`, rootEl);
      if (!verifiedEl) return;
      const reportExt = this.collectReportExtendedFieldsForTab(rootEl, tabId);
      const report = {
        source: qs(`#f_${tabId}_source`, rootEl)?.value || null,
        verified: tabId === 'report_authority' ? true : (tabId === 'report_other' ? false : verifiedEl.value === 'yes'),
        attachments: supplement.fieldData?.[fieldKey]?.attachments
          || this.normalizeReportFieldData(supplement)[fieldKey]?.attachments
          || [],
        ...reportExt
      };
      payload.fieldData[fieldKey] = report;
    });
    const auth = payload.fieldData.reportAuthority;
    const other = payload.fieldData.reportOther;
    const pick = (auth?.ghgTotalEmission ?? auth?.emission) != null && (auth?.ghgTotalEmission ?? auth?.emission) !== ''
      ? auth
      : ((other?.ghgTotalEmission ?? other?.emission) != null && (other?.ghgTotalEmission ?? other?.emission) !== '' ? other : auth);
    if (pick) {
      this.applyReportFieldsToPayload(pick, payload);
      payload.disclosureChannel = pick.source;
      payload.thirdPartyVerified = pick.verified;
    }
    payload.fieldData.report = pick || payload.fieldData.report;
  },

  _mergeReportTab(rootEl, supplement, payload, tpl) {
    this._mergeReportTabs(rootEl, supplement, payload, tpl);
  },

  _mergeEnergyTab(rootEl, supplement, payload, tpl) {
    if (tpl?.methods?.energy) {
      const energy = this.collectEnergyData(rootEl, tpl, supplement);
      payload.fieldData.energy = energy;
      payload.energyTotalEmission = this.estimateEnergyEmission(energy, tpl);
    } else if (qs('#f_energy_total', rootEl)) {
      payload.energyTotalEmission = numVal('#f_energy_total', rootEl);
      payload.fieldData.energy = { ...(payload.fieldData.energy || {}) };
    }
  },

  _mergeProductTab(rootEl, supplement, payload, tpl) {
    if (tpl?.methods?.product?.fields?.length) {
      const product = this.collectProductData(rootEl, tpl);
      payload.fieldData.product = product;
      payload.productTotalEmission = this.estimateProductEmission(product, tpl);
    } else if (qs('#f_product_total', rootEl)) {
      payload.productTotalEmission = numVal('#f_product_total', rootEl);
      payload.fieldData.product = { ...(payload.fieldData.product || {}) };
    }
  },

  _mergeEconomyTab(rootEl, payload) {
    if (!qs('#f_economy_value', rootEl)) return;
    payload.economyValue = numVal('#f_economy_value', rootEl);
    payload.economyFactor = numVal('#f_economy_factor', rootEl) || 2.35;
  },

  _mergeOtherTab(rootEl, supplement, payload) {
    if (!qs('#f_fallback_factor', rootEl)) return;
    payload.fallbackFactor = numVal('#f_fallback_factor', rootEl);
    payload.fieldData.other = {
      attachments: supplement.fieldData?.other?.attachments || []
    };
  },

  /** 同时采集各核算方法 Tab 表单（客户经理可并行填写多种方法） */
  collectAllFormData(rootEl, supplement) {
    const tpl = this.resolveTemplate(supplement);
    const payload = this._collectBasicFormData(rootEl, supplement);
    payload.reportedEmission = supplement.reportedEmission ?? null;
    payload.energyTotalEmission = supplement.energyTotalEmission ?? null;
    payload.productTotalEmission = supplement.productTotalEmission ?? null;
    payload.economyValue = supplement.economyValue ?? null;
    payload.economyFactor = supplement.economyFactor ?? null;
    payload.economyBasis = supplement.economyBasis ?? null;
    payload.fallbackFactor = supplement.fallbackFactor ?? null;
    this._mergeReportTab(rootEl, supplement, payload, tpl);
    this._mergeEnergyTab(rootEl, supplement, payload, tpl);
    if (this.productSupported(supplement)) {
      this._mergeProductTab(rootEl, supplement, payload, tpl);
    }
    if (!(typeof isEconomyInterfaceReadonly === 'function' && isEconomyInterfaceReadonly(supplement))) {
      this._mergeEconomyTab(rootEl, payload);
    }
    if (!(typeof isOtherCalcReadonly === 'function' && isOtherCalcReadonly(supplement))) {
      this._mergeOtherTab(rootEl, supplement, payload);
    }
    payload.activeMethodTab = qs('#methodTabs .tab.active', rootEl)?.dataset.tab
      || supplement.activeMethodTab
      || (typeof supplementActiveTab === 'function' ? supplementActiveTab(supplement) : 'report_authority');
    return payload;
  },

  collectFormData(tab, rootEl, supplement) {
    const tpl = this.resolveTemplate(supplement);
    const payload = this._collectBasicFormData(rootEl, supplement);
    if (tab === 'report_authority' || tab === 'report_other' || tab === 'report') {
      this._mergeReportTabs(rootEl, supplement, payload, tpl);
    } else if (tab === 'energy') this._mergeEnergyTab(rootEl, supplement, payload, tpl);
    else if (tab === 'product') this._mergeProductTab(rootEl, supplement, payload, tpl);
    else if (tab === 'economy') {
      if (!(typeof isEconomyInterfaceReadonly === 'function' && isEconomyInterfaceReadonly(supplement))) {
        this._mergeEconomyTab(rootEl, payload);
      }
    } else if (tab === 'other') {
      if (!(typeof isOtherCalcReadonly === 'function' && isOtherCalcReadonly(supplement))) {
        this._mergeOtherTab(rootEl, supplement, payload);
      }
    }
    return payload;
  },

  estimateEnergyEmission(energy, tpl) {
    if (!energy || typeof energy !== 'object') return null;
    let total = 0;
    let has = false;
    const bump = (v, factor) => {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) {
        total += n * factor;
        has = true;
      }
    };
    bump(energy.purchasedElectricity, 0.55);
    bump(energy.purchasedHeat, 0.11);
    bump(energy.coal, 2.2);
    bump(energy.coke, 2.86);
    bump(energy.diesel, 3.1);
    bump(energy.gas, 21.6);
    const skipKeys = new Set([
      'powerGrid', 'attachments', 'otherFuels', 'customFuels',
      'purchasedElectricity', 'purchasedHeat', 'coal', 'coke', 'diesel', 'gas'
    ]);
    Object.entries(energy).forEach(([k, v]) => {
      if (skipKeys.has(k) || k.endsWith('Rows')) return;
      if (typeof v === 'number') bump(v, 2.5);
    });
    const rowKeys = Object.keys(energy).filter(k => k.endsWith('Rows'));
    rowKeys.forEach(key => {
      (energy[key] || []).forEach(r => bump(r?.amount, 0.44));
    });
    (energy.customFuels || []).forEach(r => bump(r?.amount, 2.5));
    return has ? Math.round(total) : null;
  },

  estimateProductEmission(product, tpl) {
    if (!product || typeof product !== 'object') return null;
    let sum = 0;
    let has = false;
    Object.entries(product).forEach(([k, v]) => {
      if (k === 'attachments' || k === 'customProducts') return;
      if (typeof v === 'number' && v > 0) {
        sum += v;
        has = true;
      }
    });
    (product.customProducts || []).forEach(r => {
      if (Number(r?.amount) > 0) {
        sum += Number(r.amount);
        has = true;
      }
    });
    if (!has) return null;
    const sheet = tpl?.sheetName;
    const factor = sheet === '水泥' ? 0.88 : sheet === '平板玻璃' ? 1.13 : 0.82;
    return Math.round(sum * factor * 0.001);
  },

  /** 分行审核选方法：预览各 Tab 能否算出主体排放量 */
  resolveMethodTabEmissionPreview(s, tabId) {
    const tpl = this.resolveTemplate(s || {});
    if (tabId === 'report_authority' || tabId === 'report_other') {
      const fd = this.normalizeReportFieldData(s || {});
      const key = this.reportFieldKey(tabId);
      const row = fd[key] || {};
      const raw = row.ghgTotalEmission ?? row.emission;
      if (raw != null && raw !== '' && Number(raw) >= 0) {
        return { ok: true, value: Math.round(Number(raw)) };
      }
      return { ok: false };
    }
    if (tabId === 'energy') {
      if (s?.energyTotalEmission != null && s.energyTotalEmission !== '') {
        return { ok: true, value: Math.round(Number(s.energyTotalEmission)) };
      }
      const est = this.estimateEnergyEmission(s?.fieldData?.energy, tpl);
      return est != null ? { ok: true, value: est } : { ok: false };
    }
    if (tabId === 'product') {
      if (s?.productTotalEmission != null && s.productTotalEmission !== '') {
        return { ok: true, value: Math.round(Number(s.productTotalEmission)) };
      }
      const est = this.estimateProductEmission(s?.fieldData?.product, tpl);
      return est != null ? { ok: true, value: est } : { ok: false };
    }
    if (tabId === 'economy') {
      const prefill = typeof getEconomyDirectPrefill === 'function' ? getEconomyDirectPrefill(s) : null;
      if (prefill?.entityEmission != null && prefill.entityEmission !== '') {
        return { ok: true, value: Math.round(Number(prefill.entityEmission)) };
      }
      if (s?.economyEntityEmission != null && s.economyEntityEmission !== '') {
        return { ok: true, value: Math.round(Number(s.economyEntityEmission)) };
      }
      const formal = typeof getFormalForSupplement === 'function' ? getFormalForSupplement(s) : null;
      const val = Number(s?.economyValue ?? s?.fieldData?.economy?.value ?? s?.revenue ?? formal?.operatingRevenue);
      const factor = Number(s?.economyFactor ?? s?.fieldData?.economy?.factor ?? 2.35);
      if (Number.isFinite(val) && val > 0 && Number.isFinite(factor) && factor > 0) {
        return { ok: true, value: Math.round(val * factor) };
      }
      return { ok: false };
    }
    if (tabId === 'other') {
      return { ok: false };
    }
    return { ok: false };
  },

  formatMethodEmissionPreview(preview) {
    if (preview?.ok && preview.value != null && !Number.isNaN(preview.value)) {
      return `${typeof formatNum === 'function' ? formatNum(preview.value) : preview.value} tCO₂e`;
    }
    return '缺少数据';
  }
};

function numVal(sel, root) {
  const el = qs(sel, root);
  const v = Number(el?.value);
  return Number.isFinite(v) && el?.value !== '' ? v : null;
}

function txtVal(sel, root) {
  const el = qs(sel, root);
  if (!el) return null;
  const v = (el.value || '').trim();
  return v || null;
}

function supplementTabToMethodId(tabId) {
  if (tabId === 'other') return 'economy_fallback';
  if (tabId === 'report_authority' || tabId === 'report_other' || tabId === 'report') return 'report';
  return tabId;
}

function getSupplementMethodTabs(s) {
  const tabs = [
    { id: 'report_authority', label: '报告法-权威数据' },
    { id: 'report_other', label: '报告法-其他' },
    { id: 'energy', label: '物理活动法-能源法' },
    { id: 'product', label: '物理活动法-产品法' },
    { id: 'economy', label: '经济活动法' },
    { id: 'other', label: '其他计算法' }
  ];
  if (!SUPPLEMENT_FIELDS.productSupported(s)) {
    return tabs.filter(t => t.id !== 'product');
  }
  return tabs;
}
