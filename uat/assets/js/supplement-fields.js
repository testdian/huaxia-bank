/** 数据收集 — 行业×业务类型 配置驱动填报（来源：线下采集表模板） */
window.SUPPLEMENT_FIELDS = {
  ATTACH_ACCEPT: '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpeg,.jpg',
  ATTACH_MAX_COUNT: 3,
  ATTACH_MAX_MB: 20,

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

  getContext(s) {
    const formal = typeof getFormalForSupplement === 'function' ? getFormalForSupplement(s) : null;
    const industryMajor = formal?.industryMajor || s.industryMajor || '-';
    const bizType = formal?.bizType || s.bizType || 'non_project';
    const isProject = bizType === 'project';
    const template = this.resolveTemplate(s);
    return {
      formal,
      industryMajor,
      bizType,
      isProject,
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

  renderReportExtendedFieldsForTab(s, dis, tabId) {
    const r = this.reportKindFieldValues(s, tabId);
    return `
      <div class="form-item"><label>碳数据年份</label>${this.numInput(`f_${tabId}_carbon_year`, r.carbonDataYear, dis, '1')}</div>
      <div class="form-item"><label><span class="req">*</span>核算周期内碳排放量（温室气体排放总量，tCO2e）</label>
        ${this.numInput(`f_${tabId}_emission`, r.ghgTotalEmission, dis, '0.01')}</div>
      <div class="form-item"><label>范围一的排放总量（tCO2e）</label>${this.numInput(`f_${tabId}_scope1`, r.scope1Emission, dis, '0.01')}</div>
      <div class="form-item"><label>范围二的排放总量（tCO2e）</label>${this.numInput(`f_${tabId}_scope2`, r.scope2Emission, dis, '0.01')}</div>
      <div class="form-item"><label>全部机组二氧化碳排放总量（tCO2e）</label>${this.numInput(`f_${tabId}_unit_total`, r.unitTotalCo2Emission, dis, '0.01')}</div>`;
  },

  collectReportExtendedFieldsForTab(rootEl, tabId) {
    const carbonDataYear = numVal(`#f_${tabId}_carbon_year`, rootEl);
    const ghgTotalEmission = numVal(`#f_${tabId}_emission`, rootEl);
    return {
      carbonDataYear: carbonDataYear != null ? Math.round(carbonDataYear) : null,
      ghgTotalEmission,
      emission: ghgTotalEmission,
      scope1Emission: numVal(`#f_${tabId}_scope1`, rootEl),
      scope2Emission: numVal(`#f_${tabId}_scope2`, rootEl),
      unitTotalCo2Emission: numVal(`#f_${tabId}_unit_total`, rootEl)
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

  numInput(id, value, dis, step) {
    const st = step ? ` step="${step}"` : '';
    const v = value == null ? '' : value;
    return `<input id="${id}" type="number"${st} value="${v}" ${dis}>`;
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

  renderBasicInfo(s, dis, basicEditable = false) {
    const ctx = this.getContext(s);
    const formal = ctx.formal;
    const basicDis = basicEditable ? '' : 'disabled';
    const projectSeed = (Array.isArray(formal?.projectDetails) && formal.projectDetails[0])
      || (Array.isArray(s.projectDetails) && s.projectDetails[0])
      || {};
    const projectInfo = s.projectInfo || {};
    const projectInfoAvailable = s.projectInfoAvailable === true ? 'yes'
      : (s.projectInfoAvailable === false ? 'no' : '');
    const projectVal = (key, fallback = '') => this.val(projectInfo, key, projectSeed?.[key] ?? fallback);
    return `
      <div class="form-item"><label>客户名称</label><input id="f_customer_name" value="${s.customerName || ''}" ${basicDis}></div>
      <div class="form-item"><label>所属行业</label><input id="f_industry_major" value="${ctx.industryMajor}" ${basicDis}></div>
      <div class="form-item"><label>业务类型</label><input id="f_biz_type" value="${this.bizTypeLabel(ctx.bizType)}" ${basicDis}></div>
      ${ctx.isProject ? `<div class="form-item"><label>是否可提供项目信息</label>
        <select id="f_project_info_available" ${dis}>
          <option value="" ${projectInfoAvailable === '' ? 'selected' : ''}>请选择</option>
          <option value="yes" ${projectInfoAvailable === 'yes' ? 'selected' : ''}>是</option>
          <option value="no" ${projectInfoAvailable === 'no' ? 'selected' : ''}>否</option>
        </select></div>` : ''}
      ${ctx.template ? `<div class="form-item"><label>采集模板</label><input value="${ctx.sheetName}（${ctx.isProject ? '项目' : '非项目'}）" disabled></div>` : ''}
      ${ctx.isProject && formal?.projectName ? `<div class="form-item full"><label>项目名称</label><input value="${formal.projectName}" disabled></div>` : ''}
      ${ctx.isProject ? `<div class="form-item full project-info-fields" data-project-info-fields style="${projectInfoAvailable === 'yes' ? '' : 'display:none'}">
        <div class="form-section-title">项目信息填报</div>
        <div class="form-grid">
          <div class="form-item"><label>项目号</label><input id="f_prj_no" value="${projectVal('projectNo')}" ${dis}></div>
          <div class="form-item"><label>项目名称</label><input id="f_prj_name" value="${projectVal('projectName')}" ${dis}></div>
          <div class="form-item"><label>项目所在地区域（省）</label><input id="f_prj_province" value="${projectVal('projectProvince')}" ${dis}></div>
          <div class="form-item"><label>项目所属行业</label><input id="f_prj_industry" value="${projectVal('projectIndustry', ctx.industryMajor)}" ${dis}></div>
          <div class="form-item"><label>客户号</label><input id="f_prj_customer_no" value="${projectVal('customerNo')}" ${dis}></div>
          <div class="form-item"><label>客户名称</label><input id="f_prj_customer_name" value="${projectVal('customerName', s.customerName || '')}" ${dis}></div>
          <div class="form-item"><label>统一社会信用代码</label><input id="f_prj_credit_code" value="${projectVal('creditCode', formal?.creditCode || '')}" ${dis}></div>
          <div class="form-item"><label>国民经济行业代码（4级）</label><input id="f_prj_industry_code_lv4" value="${projectVal('nationalIndustryCodeLv4', formal?.gbIndustryCode || '')}" ${dis}></div>
          <div class="form-item"><label>项目均贷款余额（万元）</label>${this.numInput('f_prj_avg_loan', projectVal('projectAvgLoanBalanceWan', s.avgLoanBalance), dis, '0.01')}</div>
          <div class="form-item"><label>项目收入（万元）</label>${this.numInput('f_prj_revenue', projectVal('projectRevenueWan', s.revenue), dis, '0.01')}</div>
          <div class="form-item"><label>项目总投资（万元）</label>${this.numInput('f_prj_total_invest', projectVal('projectTotalInvestmentWan', formal?.projectTotalInvestmentWan), dis, '0.01')}</div>
        </div>
      </div>` : ''}
      <div class="form-item"><label>总资产(万元)</label>${this.numInput('f_total_assets', s.totalAssets, dis)}</div>
      <div class="form-item"><label>年报营业收入(元)</label>${this.numInput('f_revenue', s.revenue, dis)}</div>
      <div class="form-item"><label>月均贷款余额（元）</label>${this.numInput('f_avg_loan', s.avgLoanBalance, dis)}</div>`;
  },

  renderAttachmentSection(tabId, attachments, dis, options = {}) {
    const required = !!options.required;
    const reqHtml = required ? '<span class="req">*</span>' : '';
    const inputId = `f_${tabId}_files`;
    const listId = `f_${tabId}_attach_list`;
    const wrapAttrs = (tabId === 'report_authority' || tabId === 'report_other')
      ? ` id="f_${tabId}_attach_wrap"` : '';
    return `
      <div class="form-item full"${wrapAttrs}>
        <label>${reqHtml}报告附件</label>
        <input type="file" id="${inputId}" ${dis} multiple accept="${this.ATTACH_ACCEPT}" style="margin-top:6px">
        <small style="color:#909399;display:block;margin-top:4px">支持 pdf、doc、docx、xls、xlsx、png、jpeg、jpg；最多 3 个，每个不超过 20MB${required ? '；经政府/第三方核查时须上传佐证文件' : ''}</small>
        <ul class="attach-list" id="${listId}">${this.renderAttachList(attachments)}</ul>
      </div>`;
  },

  renderReportKindPanel(s, dis, panelCls, panelId, kind) {
    const tpl = this.resolveTemplate(s);
    const ctx = this.getContext(s);
    const tabId = panelId;
    const fieldKey = this.reportFieldKey(tabId);
    const row = this.reportKindFieldValues(s, tabId);
    const verified = row.verified === 'no' ? 'no' : 'yes';
    const attachments = row.attachments || [];
    const sources = kind === 'authority'
      ? this.reportAuthoritySources(ctx.isProject)
      : this.reportOtherSources(ctx.isProject);
    const defaultSource = row.source || sources[0] || '';
    if (!tpl?.methods?.report) {
      return this.renderReportKindPanelDefault(s, dis, panelCls, panelId, kind);
    }
    return `
      <div class="${panelCls}" data-panel="${panelId}">
        <div class="form-grid">
          <div class="form-item"><label><span class="req">*</span>报告法数据来源</label>
            ${this.selectFromOptions(sources, defaultSource, dis, `f_${tabId}_source`, false)}</div>
          <div class="form-item"><label><span class="req">*</span>该数据是否经政府/第三方核查</label>
            <select id="f_${tabId}_verified" ${dis}>
              <option value="yes" ${verified === 'yes' ? 'selected' : ''}>是</option>
              <option value="no" ${verified === 'no' ? 'selected' : ''}>否</option>
            </select></div>
          ${this.renderReportExtendedFieldsForTab(s, dis, tabId)}
          ${this.renderAttachmentSection(tabId, attachments, dis, { required: verified === 'yes' })}
        </div>
      </div>`;
  },

  renderReportKindPanelDefault(s, dis, panelCls, panelId, kind) {
    const tabId = panelId;
    const row = this.reportKindFieldValues(s, tabId);
    const verified = row.verified === 'no' ? 'no' : 'yes';
    const attachments = row.attachments || [];
    const ctx = this.getContext(s);
    const sources = kind === 'authority'
      ? this.reportAuthoritySources(ctx.isProject)
      : (kind === 'other' ? ['ESG报告', '年报', '核查报告', GELAN_REPORT_DATA_SOURCE || '其他'] : []);
    const channel = row.source || s.disclosureChannel || sources[0] || 'ESG报告';
    return `
      <div class="${panelCls}" data-panel="${panelId}"><div class="form-grid">
        ${this.renderReportExtendedFieldsForTab(s, dis, tabId)}
        <div class="form-item"><label><span class="req">*</span>报告法数据来源</label>
          <select id="f_${tabId}_source" ${dis}>${sources.map(c =>
            `<option ${channel === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="form-item"><label><span class="req">*</span>该数据是否经政府/第三方核查</label>
          <select id="f_${tabId}_verified" ${dis}>
            <option value="yes" ${verified === 'yes' ? 'selected' : ''}>是</option>
            <option value="no" ${verified === 'no' ? 'selected' : ''}>否</option>
          </select></div>
        ${this.renderAttachmentSection(tabId, attachments, dis, { required: verified === 'yes' })}
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
    const d = this.fieldData(s).energy || {};
    const fuelHtml = (en.fuelFixed || []).map(f =>
      `<div class="form-item"><label>${f.required ? '<span class="req">*</span>' : ''}${f.label}</label>${this.numInput('f_en_' + f.key, d[f.key], dis, f.step)}</div>`
    ).join('');
    const otherFuelOpts = en.otherFuelOptions || [];
    const gridLabel = en.gridLabel || '所属电网';
    return `
      <div class="${panelCls}" data-panel="${panelId}">
        <div class="form-section-title">燃料燃烧排放</div>
        <div class="form-grid form-grid-3">${fuelHtml}</div>
        <div class="form-section-title">其他能源（下拉选择）</div>
        <div class="form-grid">
          <div class="form-item"><label>其他燃料1 · 燃料品种</label>${this.selectFromOptions(otherFuelOpts, d.otherFuel1Type, dis, 'f_en_of1_type')}</div>
          <div class="form-item"><label>其他燃料1 · 消耗量（吨或万立方米）</label>${this.numInput('f_en_of1_amt', d.otherFuel1Amount, dis, '0.0001')}</div>
          <div class="form-item"><label>其他燃料2 · 燃料品种</label>${this.selectFromOptions(otherFuelOpts, d.otherFuel2Type, dis, 'f_en_of2_type')}</div>
          <div class="form-item"><label>其他燃料2 · 消耗量（吨或万立方米）</label>${this.numInput('f_en_of2_amt', d.otherFuel2Amount, dis, '0.0001')}</div>
        </div>
        <div class="form-section-title">净购入电量</div>
        <div class="form-grid">
          <div class="form-item"><label><span class="req">*</span>${gridLabel}</label>${this.selectFromOptions(en.gridOptions || [], d.powerGrid || '全国平均', dis, 'f_en_grid', false)}</div>
          <div class="form-item"><label><span class="req">*</span>数值（MWh）</label>${this.numInput('f_en_elec', d.purchasedElectricity, dis, '0.01')}</div>
        </div>
        ${en.hasPurchasedHeat ? `
        <div class="form-section-title">净购入热力</div>
        <div class="form-grid">
          <div class="form-item"><label>数值（GJ）</label>${this.numInput('f_en_heat', d.purchasedHeat, dis, '0.01')}</div>
        </div>` : ''}
        ${this.renderProcessBlocks(en.processBlocks || [], d, dis)}
        <div class="form-grid">${this.renderAttachmentSection('energy', d.attachments || [], dis)}</div>
        <small style="color:#909399">E = Σ(能源消耗量×因子)+工艺排放+净购入电热×区域因子（演示原型暂不自动试算）</small>
      </div>`;
  },

  renderProcessBlocks(blocks, d, dis) {
    if (!blocks.length) return '';
    let html = '<div class="form-section-title">过程排放</div><div class="form-grid">';
    blocks.forEach((block, bi) => {
      if (block.type === 'desulfur') {
        const slots = block.slots || 2;
        for (let i = 1; i <= slots; i++) {
          html += `
            <div class="form-item"><label>${block.label}${i} · 试剂类型</label>
              ${this.selectFromOptions(block.typeOptions, d['desulfur' + i + 'Type'], dis, 'f_en_ds' + i + '_type')}</div>
            <div class="form-item"><label>${block.label}${i} · 消耗量（吨）</label>
              ${this.numInput('f_en_ds' + i + '_amt', d['desulfur' + i + 'Amount'], dis, '0.01')}</div>`;
        }
      } else if (block.type === 'carbonate') {
        const prefix = block.keyPrefix || 'carbonate';
        html += `
          <div class="form-item"><label>${block.label} · 类型</label>
            ${this.selectFromOptions(block.typeOptions, d[prefix + 'Type'], dis, 'f_en_' + prefix + '_type')}</div>
          <div class="form-item"><label>${block.label} · 消耗量（吨）</label>
            ${this.numInput('f_en_' + prefix + '_amt', d[prefix + 'Amount'], dis, '0.01')}</div>`;
      } else if (block.type === 'amount') {
        html += `<div class="form-item"><label>${block.label}</label>${this.numInput('f_en_' + block.key, d[block.key], dis, '0.01')}</div>`;
      }
    });
    html += '</div>';
    return html;
  },

  renderEnergyPanelDefault(s, dis, panelCls, panelId) {
    const attachments = this.fieldData(s).energy?.attachments || [];
    return `
      <div class="${panelCls}" data-panel="${panelId}"><div class="form-grid">
        <div class="form-item full"><label>物理活动法-能源法排放总量(tCO₂)</label>
          ${this.numInput('f_energy_total', s.energyTotalEmission, dis)}
          <small style="color:#909399">E=Σ(能耗×因子)+工艺+净购入电热</small></div>
        ${this.renderAttachmentSection('energy', attachments, dis)}
      </div></div>`;
  },

  renderProductPanel(s, dis, panelCls, panelId) {
    const tpl = this.resolveTemplate(s);
    const d = this.fieldData(s).product || {};
    const attachments = d.attachments || [];
    const fields = tpl?.methods?.product?.fields;
    if (!fields?.length) {
      return `<div class="${panelCls}" data-panel="${panelId}">
        <p style="color:#909399;padding:12px">该行业采集模板不含产品法字段</p>
        <div class="form-grid">${this.renderAttachmentSection('product', attachments, dis)}</div>
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
      body += groups[g].map(f =>
        `<div class="form-item"><label>${f.label}</label>${this.numInput('f_pd_' + f.key, d[f.key], dis, '0.01')}</div>`
      ).join('');
      body += '</div>';
    });
    return `
      <div class="${panelCls}" data-panel="${panelId}">
        ${body}
        <div class="form-grid">${this.renderAttachmentSection('product', attachments, dis)}</div>
        <small style="color:#909399">E = Σ(产品产量×产品碳排放因子)（演示原型暂不自动试算）</small>
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
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
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
      const required = this.isReportVerifiedYes(rootEl, tabId);
      const label = wrap.querySelector('label');
      const hint = wrap.querySelector('small');
      if (label) {
        const hasReq = label.querySelector('.req');
        if (required && !hasReq) label.insertAdjacentHTML('afterbegin', '<span class="req">*</span>');
        else if (!required && hasReq) hasReq.remove();
      }
      if (hint) {
        const base = '支持 pdf、doc、docx、xls、xlsx、png、jpeg、jpg；最多 3 个，每个不超过 20MB';
        hint.textContent = required ? `${base}；经政府/第三方核查时须上传佐证文件` : base;
      }
    });
  },

  bindReportAttachmentRule(rootEl, readonly) {
    if (readonly) return;
    const handler = () => this.syncReportAttachmentRequired(rootEl);
    ['report_authority', 'report_other'].forEach(tabId => {
      qs(`#f_${tabId}_verified`, rootEl)?.addEventListener('change', handler);
    });
    handler();
  },

  validateReportAttachments(rootEl, supplement) {
    const tabs = [
      { id: 'report_authority', label: '报告法-权威数据' },
      { id: 'report_other', label: '报告法-其他' }
    ];
    for (const tab of tabs) {
      if (!this.isReportVerifiedYes(rootEl, tab.id)) continue;
      if (this.getReportAttachments(supplement, tab.id).length > 0) continue;
      return {
        ok: false,
        tabId: tab.id,
        message: `${tab.label}：已选择「经政府/第三方核查」，请上传报告附件佐证文件`
      };
    }
    return { ok: true };
  },

  validateAttachments(files, existingCount) {
    const allowed = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpeg', 'jpg'];
    const maxBytes = this.ATTACH_MAX_MB * 1024 * 1024;
    const list = [];
    for (const f of files) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!allowed.includes(ext)) return { ok: false, message: `不支持的文件格式：${f.name}` };
      if (f.size > maxBytes) return { ok: false, message: `${f.name} 超过 ${this.ATTACH_MAX_MB}MB 限制` };
      list.push({ name: f.name, size: f.size, uploadedAt: new Date().toLocaleString('zh-CN') });
    }
    if (existingCount + list.length > this.ATTACH_MAX_COUNT) {
      return { ok: false, message: `最多上传 ${this.ATTACH_MAX_COUNT} 个附件` };
    }
    return { ok: true, list };
  },

  bindFileUpload(rootEl, supplementId, readonly) {
    if (readonly) return;
    ['report_authority', 'report_other', 'energy', 'product', 'other'].forEach(tabId => {
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
      const check = this.validateAttachments([...input.files], existing.length);
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
    (en.fuelFixed || []).forEach(f => { d[f.key] = numVal('#f_en_' + f.key, rootEl); });
    d.otherFuel1Type = qs('#f_en_of1_type', rootEl)?.value || null;
    d.otherFuel1Amount = numVal('#f_en_of1_amt', rootEl);
    d.otherFuel2Type = qs('#f_en_of2_type', rootEl)?.value || null;
    d.otherFuel2Amount = numVal('#f_en_of2_amt', rootEl);
    d.powerGrid = qs('#f_en_grid', rootEl)?.value;
    d.purchasedElectricity = numVal('#f_en_elec', rootEl);
    if (en.hasPurchasedHeat) d.purchasedHeat = numVal('#f_en_heat', rootEl);
    (en.processBlocks || []).forEach(block => {
      if (block.type === 'desulfur') {
        for (let i = 1; i <= (block.slots || 2); i++) {
          d['desulfur' + i + 'Type'] = qs('#f_en_ds' + i + '_type', rootEl)?.value || null;
          d['desulfur' + i + 'Amount'] = numVal('#f_en_ds' + i + '_amt', rootEl);
        }
      } else if (block.type === 'carbonate') {
        const prefix = block.keyPrefix || 'carbonate';
        d[prefix + 'Type'] = qs('#f_en_' + prefix + '_type', rootEl)?.value || null;
        d[prefix + 'Amount'] = numVal('#f_en_' + prefix + '_amt', rootEl);
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
    return product;
  },

  _collectBasicFormData(rootEl, supplement) {
    const payload = {
      customerName: txtVal('#f_customer_name', rootEl) || supplement.customerName,
      industryMajor: txtVal('#f_industry_major', rootEl) || supplement.industryMajor,
      totalAssets: numVal('#f_total_assets', rootEl),
      revenue: numVal('#f_revenue', rootEl),
      avgLoanBalance: numVal('#f_avg_loan', rootEl),
      fieldData: { ...(supplement.fieldData || {}) }
    };
    const projectInfoFlagEl = qs('#f_project_info_available', rootEl);
    if (projectInfoFlagEl) {
      const v = projectInfoFlagEl.value;
      payload.projectInfoAvailable = v === 'yes' ? true : (v === 'no' ? false : null);
      if (payload.projectInfoAvailable === true) {
        payload.projectInfo = {
          projectNo: txtVal('#f_prj_no', rootEl),
          projectName: txtVal('#f_prj_name', rootEl),
          projectProvince: txtVal('#f_prj_province', rootEl),
          projectIndustry: txtVal('#f_prj_industry', rootEl),
          customerNo: txtVal('#f_prj_customer_no', rootEl),
          customerName: txtVal('#f_prj_customer_name', rootEl),
          creditCode: txtVal('#f_prj_credit_code', rootEl),
          nationalIndustryCodeLv4: txtVal('#f_prj_industry_code_lv4', rootEl),
          projectAvgLoanBalanceWan: numVal('#f_prj_avg_loan', rootEl),
          projectRevenueWan: numVal('#f_prj_revenue', rootEl),
          projectTotalInvestmentWan: numVal('#f_prj_total_invest', rootEl)
        };
        payload.projectDetails = [payload.projectInfo];
      } else if (payload.projectInfoAvailable === false) {
        payload.projectInfo = null;
        payload.projectDetails = [];
      }
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
        verified: verifiedEl.value === 'yes',
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
      energy.attachments = supplement.fieldData?.energy?.attachments || [];
      payload.fieldData.energy = energy;
      payload.energyTotalEmission = this.estimateEnergyEmission(energy, tpl);
    } else if (qs('#f_energy_total', rootEl)) {
      payload.energyTotalEmission = numVal('#f_energy_total', rootEl);
      payload.fieldData.energy = {
        ...(payload.fieldData.energy || {}),
        attachments: supplement.fieldData?.energy?.attachments || []
      };
    }
  },

  _mergeProductTab(rootEl, supplement, payload, tpl) {
    if (tpl?.methods?.product?.fields?.length) {
      const product = this.collectProductData(rootEl, tpl);
      product.attachments = supplement.fieldData?.product?.attachments || [];
      payload.fieldData.product = product;
      payload.productTotalEmission = this.estimateProductEmission(product, tpl);
    } else if (qs('#f_product_total', rootEl)) {
      payload.productTotalEmission = numVal('#f_product_total', rootEl);
      payload.fieldData.product = {
        ...(payload.fieldData.product || {}),
        attachments: supplement.fieldData?.product?.attachments || []
      };
    }
  },

  _mergeEconomyTab(rootEl, payload) {
    if (!qs('#f_economy_value', rootEl)) return;
    payload.economyValue = numVal('#f_economy_value', rootEl);
    payload.economyFactor = numVal('#f_economy_factor', rootEl) || 2.35;
    payload.economyBasis = qs('#f_economy_basis', rootEl)?.value;
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
    this._mergeEconomyTab(rootEl, payload);
    this._mergeOtherTab(rootEl, supplement, payload);
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
    else if (tab === 'economy') this._mergeEconomyTab(rootEl, payload);
    else if (tab === 'other') this._mergeOtherTab(rootEl, supplement, payload);
    return payload;
  },

  estimateEnergyEmission(energy, tpl) {
    const nums = Object.values(energy || {}).filter(v => typeof v === 'number');
    const has = nums.some(v => v != null && v > 0);
    if (!has) return null;
    const coal = energy.coal || 0;
    const gas = energy.gas || 0;
    const elec = energy.purchasedElectricity || 0;
    const heat = energy.purchasedHeat || 0;
    return Math.round(coal * 2.2 + gas * 21.6 + elec * 0.55 + heat * 0.11);
  },

  estimateProductEmission(product, tpl) {
    const vals = Object.values(product || {}).filter(v => v != null && v > 0);
    if (!vals.length) return null;
    const sum = vals.reduce((s, v) => s + Number(v), 0);
    const sheet = tpl?.sheetName;
    const factor = sheet === '水泥' ? 0.88 : sheet === '平板玻璃' ? 1.13 : 0.82;
    return Math.round(sum * factor * 0.001);
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
