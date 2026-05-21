/** 数据补录 — 行业×业务类型 配置驱动填报（来源：线下采集表模板） */
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

  renderBasicInfo(s, dis) {
    const ctx = this.getContext(s);
    const formal = ctx.formal;
    return `
      <div class="form-item"><label>客户名称</label><input value="${s.customerName || '—'}" disabled></div>
      <div class="form-item"><label>所属行业</label><input value="${ctx.industryMajor}" disabled></div>
      <div class="form-item"><label>业务类型</label><input value="${this.bizTypeLabel(ctx.bizType)}" disabled></div>
      ${ctx.template ? `<div class="form-item"><label>采集模板</label><input value="${ctx.sheetName}（${ctx.isProject ? '项目' : '非项目'}）" disabled></div>` : ''}
      ${ctx.isProject && formal?.projectName ? `<div class="form-item full"><label>项目名称</label><input value="${formal.projectName}" disabled></div>` : ''}
      <div class="form-item"><label>总资产(万元)</label>${this.numInput('f_total_assets', s.totalAssets, dis)}</div>
      <div class="form-item"><label>营业收入(万元)</label>${this.numInput('f_revenue', s.revenue, dis)}</div>
      <div class="form-item"><label>投融资日均/月均余额(万元)</label>${this.numInput('f_avg_loan', s.avgLoanBalance, dis)}</div>`;
  },

  renderAttachmentSection(tabId, attachments, dis) {
    const inputId = `f_${tabId}_files`;
    const listId = `f_${tabId}_attach_list`;
    return `
      <div class="form-item full">
        <label>报告附件</label>
        <input type="file" id="${inputId}" ${dis} multiple accept="${this.ATTACH_ACCEPT}" style="margin-top:6px">
        <small style="color:#909399;display:block;margin-top:4px">支持 pdf、doc、docx、xls、xlsx、png、jpeg、jpg；最多 3 个，每个不超过 20MB</small>
        <ul class="attach-list" id="${listId}">${this.renderAttachList(attachments)}</ul>
      </div>`;
  },

  renderReportPanel(s, dis, panelCls, panelId) {
    const tpl = this.resolveTemplate(s);
    if (!tpl?.methods?.report) return this.renderReportPanelDefault(s, dis, panelCls, panelId);
    const d = this.fieldData(s).report || {};
    const verified = d.verified === false || d.verified === 'no' ? 'no' : 'yes';
    const attachments = d.attachments || [];
    const sources = tpl.methods.report.sourceOptions || [];
    return `
      <div class="${panelCls}" data-panel="${panelId}">
        <div class="form-grid">
          <div class="form-item"><label><span class="req">*</span>报告法数据来源</label>
            ${this.selectFromOptions(sources, this.val(d, 'source', sources[0]), dis, 'f_report_source', false)}</div>
          <div class="form-item"><label><span class="req">*</span>该数据是否经政府/第三方核查</label>
            <select id="f_report_verified" ${dis}>
              <option value="yes" ${verified === 'yes' ? 'selected' : ''}>是</option>
              <option value="no" ${verified === 'no' ? 'selected' : ''}>否</option>
            </select></div>
          <div class="form-item"><label><span class="req">*</span>核算周期内碳排放量（tCO₂）</label>
            ${this.numInput('f_report_emission', d.emission ?? s.reportedEmission, dis, '0.01')}</div>
          ${this.renderAttachmentSection('report', attachments, dis)}
        </div>
      </div>`;
  },

  renderReportPanelDefault(s, dis, panelCls, panelId) {
    const channel = s.disclosureChannel || 'ESG报告';
    const verified = s.thirdPartyVerified === false ? 'no' : 'yes';
    const attachments = this.fieldData(s).report?.attachments || [];
    return `
      <div class="${panelCls}" data-panel="${panelId}"><div class="form-grid">
        <div class="form-item"><label>碳排放量(tCO₂)</label>${this.numInput('f_report_emission', s.reportedEmission, dis)}</div>
        <div class="form-item"><label>披露渠道</label>
          <select id="f_channel" ${dis}>${['ESG报告', '年报', '核查报告'].map(c =>
            `<option ${channel === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="form-item"><label>第三方核验</label>
          <select id="f_verified" ${dis}>
            <option value="yes" ${verified === 'yes' ? 'selected' : ''}>是</option>
            <option value="no" ${verified === 'no' ? 'selected' : ''}>否</option>
          </select></div>
        ${this.renderAttachmentSection('report', attachments, dis)}
      </div></div>`;
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
    ['report', 'energy', 'product', 'other'].forEach(tabId => {
      this._bindTabFileUpload(rootEl, supplementId, tabId);
    });
  },

  _bindTabFileUpload(rootEl, supplementId, tabId) {
    const input = qs(`#f_${tabId}_files`, rootEl);
    if (!input) return;
    input.onchange = () => {
      const s = Store.get().supplements.find(x => x.id === supplementId);
      if (!s) return;
      const existing = (s.fieldData?.[tabId]?.attachments || []);
      const check = this.validateAttachments([...input.files], existing.length);
      if (!check.ok) { toast(check.message, 'warning'); input.value = ''; return; }
      Store.update(d => {
        const sup = d.supplements.find(x => x.id === supplementId);
        if (!sup) return;
        sup.fieldData = sup.fieldData || {};
        sup.fieldData[tabId] = sup.fieldData[tabId] || {};
        sup.fieldData[tabId].attachments = existing.concat(check.list);
      });
      input.value = '';
      const listEl = qs(`#f_${tabId}_attach_list`, rootEl);
      if (listEl) {
        const updated = Store.get().supplements.find(x => x.id === supplementId);
        listEl.innerHTML = this.renderAttachList(updated?.fieldData?.[tabId]?.attachments || []);
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

  collectFormData(tab, rootEl, supplement) {
    const tpl = this.resolveTemplate(supplement);
    const payload = {
      totalAssets: numVal('#f_total_assets', rootEl),
      revenue: numVal('#f_revenue', rootEl),
      avgLoanBalance: numVal('#f_avg_loan', rootEl),
      fieldData: { ...(supplement.fieldData || {}) }
    };
    if (tab === 'report') {
      if (tpl?.methods?.report) {
        const report = {
          source: qs('#f_report_source', rootEl)?.value,
          verified: qs('#f_report_verified', rootEl)?.value === 'yes',
          emission: numVal('#f_report_emission', rootEl),
          attachments: supplement.fieldData?.report?.attachments || []
        };
        payload.fieldData.report = report;
        payload.reportedEmission = report.emission;
        payload.disclosureChannel = report.source;
        payload.thirdPartyVerified = report.verified;
      } else {
        payload.reportedEmission = numVal('#f_report_emission', rootEl);
        payload.disclosureChannel = qs('#f_channel', rootEl)?.value;
        payload.thirdPartyVerified = qs('#f_verified', rootEl)?.value === 'yes';
      }
      payload.energyTotalEmission = null;
      payload.productTotalEmission = null;
      payload.economyValue = null;
      payload.fallbackFactor = null;
    } else if (tab === 'energy') {
      if (tpl?.methods?.energy) {
        const energy = this.collectEnergyData(rootEl, tpl, supplement);
        energy.attachments = supplement.fieldData?.energy?.attachments || [];
        payload.fieldData.energy = energy;
        payload.energyTotalEmission = this.estimateEnergyEmission(energy, tpl);
      } else {
        payload.energyTotalEmission = numVal('#f_energy_total', rootEl);
        payload.fieldData.energy = {
          attachments: supplement.fieldData?.energy?.attachments || []
        };
      }
      payload.reportedEmission = null;
      payload.productTotalEmission = null;
      payload.economyValue = null;
      payload.fallbackFactor = null;
    } else if (tab === 'product') {
      if (tpl?.methods?.product?.fields?.length) {
        const product = this.collectProductData(rootEl, tpl);
        product.attachments = supplement.fieldData?.product?.attachments || [];
        payload.fieldData.product = product;
        payload.productTotalEmission = this.estimateProductEmission(product, tpl);
      } else {
        payload.productTotalEmission = numVal('#f_product_total', rootEl);
        payload.fieldData.product = {
          attachments: supplement.fieldData?.product?.attachments || []
        };
      }
      payload.reportedEmission = null;
      payload.energyTotalEmission = null;
      payload.economyValue = null;
      payload.fallbackFactor = null;
    } else if (tab === 'economy') {
      payload.economyValue = numVal('#f_economy_value', rootEl);
      payload.economyFactor = numVal('#f_economy_factor', rootEl) || 2.35;
      payload.economyBasis = qs('#f_economy_basis', rootEl)?.value;
      payload.reportedEmission = null;
      payload.energyTotalEmission = null;
      payload.productTotalEmission = null;
      payload.fallbackFactor = null;
    } else if (tab === 'other') {
      payload.fallbackFactor = numVal('#f_fallback_factor', rootEl);
      payload.fieldData.other = {
        attachments: supplement.fieldData?.other?.attachments || []
      };
      payload.reportedEmission = null;
      payload.energyTotalEmission = null;
      payload.productTotalEmission = null;
      payload.economyValue = null;
    }
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

function getSupplementMethodTabs(s) {
  const tabs = [
    { id: 'report', label: '报告法' },
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
