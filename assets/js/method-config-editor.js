/** 计算方法配置 — 模板编辑交互 */
window.MethodConfigEditor = {
  _activeFormulaInput: null,

  getEditContext() {
    const q = new URLSearchParams((location.hash.split('?')[1] || ''));
    const step = METHOD_CONFIG.normalizeTemplateEditStep(q.get('step') || '1');
    const { id, tpl, detail } = METHOD_CONFIG.resolveTemplateForEdit(q);
    return { q, step, id, tpl, detail };
  },

  insertAtCursor(textarea, text) {
    if (!textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    const val = textarea.value;
    textarea.value = val.slice(0, start) + text + val.slice(end);
    const pos = start + text.length;
    textarea.focus();
    textarea.setSelectionRange(pos, pos);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  },

  bindTemplateEdit() {
    const form = qs('#tplEditForm');
    if (!form) return;
    const ctx = this.getEditContext();
    if (ctx.q.get('mode') === 'view') {
      form.querySelectorAll('input:not([type="hidden"]), select, textarea, button').forEach(el => {
        el.disabled = true;
      });
      return;
    }

    qs('#tplSaveDraftBtn')?.addEventListener('click', () => this.saveDraft(ctx.step));
    qs('#tplNextBtn')?.addEventListener('click', e => {
      if (ctx.step !== '2') return;
      e.preventDefault();
      const href = e.currentTarget.getAttribute('href');
      if (!href) return;
      this.saveDraft('2', () => {
        location.hash = href.startsWith('#') ? href : `#${href}`;
        route();
      });
    });
    qs('#tplPrevBtn')?.addEventListener('click', e => {
      if (ctx.step !== '2') return;
      e.preventDefault();
      const href = e.currentTarget.getAttribute('href');
      if (!href) return;
      this.persistStep2Draft({ silent: true });
      location.hash = href.startsWith('#') ? href : `#${href}`;
      route();
    });
    qs('#tplPublishBtn')?.addEventListener('click', () => this.publish());
    qs('#tplRunValidateBtn')?.addEventListener('click', () => this.runPreviewValidate());
    qs('#formulaValidateBtn')?.addEventListener('click', () => this.validateFormulas());
    qs('#tplAddFormulaBtn')?.addEventListener('click', () => this.addFormulaRow());
    qs('#tplAddFactorBtn')?.addEventListener('click', () => this.addFactorRow());
    qs('#tplExtractFactorsBtn')?.addEventListener('click', () => this.extractFactorsFromFormulas());
    qs('#tplAddPartitionBtn')?.addEventListener('click', () => this.addPartition());
    qs('#tplGenFormulasBtn')?.addEventListener('click', () => this.generateFormulasFromStructure());
    qs('#tplUpdateAllFactorVersionsBtn')?.addEventListener('click', () => this.updateAllFactorVersions());

    this.bindBlockEditor(form);
    this.bindInlineFactorPickers(form);
    this.bindFormulaBuilder(form);
    this.bindFactorCards(form);

    form.addEventListener('click', e => {
      const btn = e.target.closest('[data-remove-formula]');
      if (btn) {
        btn.closest('tr')?.remove();
        return;
      }
      const fbtn = e.target.closest('[data-remove-factor]');
      if (fbtn) fbtn.closest('[data-factor-row]')?.remove();
    });

    qs('#tplParamFilter')?.addEventListener('input', e => {
      const kw = e.target.value.trim().toLowerCase();
      qsa('#tplParamBody tr', form).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = !kw || text.includes(kw) ? '' : 'none';
      });
    });

    qs('#tplSelectAllParams')?.addEventListener('click', () => {
      qsa('#tplParamBody .tpl-param-check', form).forEach(cb => { cb.checked = true; });
    });
    qs('#tplClearAllParams')?.addEventListener('click', () => {
      qsa('#tplParamBody .tpl-param-check', form).forEach(cb => { cb.checked = false; });
    });
  },

  paramOptionList(filter) {
    return METHOD_CONFIG.listParams()
      .filter(p => p.status !== 'inactive')
      .filter(p => {
        if (filter === 'option') return p.format === 'option' || p.paramType === '选项型';
        if (filter === 'number') return p.format === 'number' || p.paramType === '数值型';
        return true;
      })
      .map(p => ({ id: p.id, name: p.name, unit: p.unit || '' }));
  },

  paramSelectHtml(name, selected, filter, emptyLabel) {
    const opts = this.paramOptionList(filter).map(p =>
      `<option value="${escapeHtml(p.id)}" ${p.id === selected ? 'selected' : ''}>${escapeHtml(p.name)} (${escapeHtml(p.id)})</option>`
    ).join('');
    return `<select name="${name}"><option value="">${emptyLabel || '— 选择参数 —'}</option>${opts}</select>`;
  },

  dynamicParamSelectHtml(name, selected, kind, options = {}) {
    const saved = !!options.saved;
    const disabledAttr = saved ? ' disabled' : '';
    const list = kind === 'option' ? METHOD_CONFIG.listOptionParams() : METHOD_CONFIG.listNumberParams();
    const emptyLabel = kind === 'option' ? '— 选择品种参数（选项型）—' : '— 选择消耗量参数（数值型）—';
    const opts = list.map(p =>
      `<option value="${escapeHtml(p.id)}" ${p.id === selected ? 'selected' : ''}>${escapeHtml(p.name)}</option>`
    ).join('');
    return `<select name="${name}" class="dynamic-param-select" data-dynamic-param-kind="${kind}"${disabledAttr}><option value="">${emptyLabel}</option>${opts}</select>`;
  },

  dynamicSectionFormulaRefKey(pIndex, sIndex) {
    return `dyn_formula_${pIndex}-${sIndex}`;
  },

  isDynamicSectionSaved(sectionEl) {
    return sectionEl?.dataset.dynamicSaved === '1';
  },

  inferDynamicSectionSaved(section) {
    if (section?.saved === true) return true;
    if (section?.saved === false) return false;
    const norm = METHOD_CONFIG.normalizeDynamicBlock(section || {});
    return !!(norm.varietyParamId && norm.amountParamId && (norm.presetRows || []).length);
  },

  getDraftDynamicSection(scopeEl) {
    const root = scopeEl?.closest?.('[data-partition-row]') || scopeEl;
    return root?.querySelector?.('[data-section-type="dynamic_row"][data-dynamic-draft="1"]') || null;
  },

  dynamicSectionFooterActionsHtml(sectionKey, saved) {
    return saved
      ? `<button type="button" class="btn btn-sm" data-edit-dynamic-section="${escapeHtml(sectionKey)}">编辑</button>`
      : `<button type="button" class="btn btn-sm btn-primary" data-save-dynamic-section="${escapeHtml(sectionKey)}">保存排放源</button>`;
  },

  dynamicSectionSaveFooterHtml(sectionKey, saved) {
    return saved
      ? `<div class="structure-emission-footer structure-emission-footer--saved">
          ${this.dynamicSectionFooterActionsHtml(sectionKey, true)}
          <span class="text-muted structure-emission-save-hint">修改参数、因子或公式后请再次保存</span>
        </div>`
      : `<div class="structure-emission-footer">
          ${this.dynamicSectionFooterActionsHtml(sectionKey, false)}
          <span class="text-muted structure-emission-save-hint">保存后锁定此动态行，需修改时点击编辑</span>
        </div>`;
  },

  dynamicPresetRowHtml(row, blockIndex, rowIndex, block, detail, options = {}) {
    const saved = !!options.saved;
    const disabledAttr = saved ? ' disabled' : '';
    const refKey = row.refKey || METHOD_CONFIG.dynamicRowRefKey(block, row);
    const binding = this.getBinding(detail, refKey);
    const factorSource = binding.factorSource || row.factorSource || '';
    const amountP = METHOD_CONFIG.getParam(block.amountParamId);
    return `<tr data-preset-row data-preset-index="${rowIndex}">
      <td>
        <input type="hidden" name="preset_label" value="${escapeHtml(row.label || '')}">
        <input type="hidden" name="preset_enum" value="${escapeHtml(row.enumValue || row.label || '')}">
        <input type="hidden" name="preset_refKey" value="${escapeHtml(refKey)}">
        <span class="structure-dynamic-variety-name">${escapeHtml(row.label || '—')}</span>
      </td>
      <td class="structure-dynamic-factor-cell">
        ${this.inlineFactorPickerHtml(refKey, factorSource, detail?.meta?.factorVersionRank).replace('class="inline-factor-search"', `class="inline-factor-search"${disabledAttr}`)}
        ${this.inlineUnitConversionHtml(refKey, block.amountParamId, amountP, binding, { saved })}
      </td>
    </tr>`;
  },

  patchDynamicFormulaContext(ctx) {
    return METHOD_CONFIG.patchDynamicFormulaContext(ctx);
  },

  dynamicSectionFormulaHtml(blockNorm, pIndex, sIndex, detail, options = {}) {
    const saved = !!options.saved;
    const refKey = this.dynamicSectionFormulaRefKey(pIndex, sIndex);
    const amountId = blockNorm.amountParamId;
    const fieldIds = [amountId, blockNorm.varietyParamId].filter(Boolean);
    const binding = this.getBinding(detail, refKey);
    const defaultExpr = amountId ? `{${amountId}}*{factor}` : '{factor}';
    const formulaExpr = binding.formulaExpression || defaultExpr;
    const formulaCtx = METHOD_CONFIG.patchDynamicFormulaContext(
      METHOD_CONFIG.buildInlineFormulaContext(amountId, fieldIds, refKey, detail, amountId ? [amountId] : [])
    );
    const displayFormula = METHOD_CONFIG.expressionToDisplayFormula(formulaExpr, formulaCtx)
      || formulaCtx?.defaultDisplay
      || '';
    return `
      <div class="structure-emission-row2 structure-dynamic-formula">
        <div class="structure-emission-col-head">
          <span class="structure-emission-step">3</span>
          <div>
            <strong class="structure-emission-col-title">排放量计算公式</strong>
            <p class="structure-emission-col-hint">各行共用此公式模板；「因子」对应该行所选排放因子，保存时自动展开</p>
          </div>
        </div>
        <div class="structure-emission-formula-box">
          <span class="structure-emission-eq-label">每行排放量 =</span>
          ${saved
            ? `<div class="structure-emission-formula-readonly">${escapeHtml(displayFormula || formulaCtx?.defaultDisplay || '—')}</div>
          <input type="hidden" class="inline-formula-visual" name="inline_formula_display_${escapeHtml(refKey)}"
            value="${escapeHtml(displayFormula)}" data-ref-key="${escapeHtml(refKey)}" data-field-id="${escapeHtml(amountId || '')}">`
            : `<input type="text" class="inline-formula-visual" name="inline_formula_display_${escapeHtml(refKey)}"
            value="${escapeHtml(displayFormula)}" data-ref-key="${escapeHtml(refKey)}" data-field-id="${escapeHtml(amountId || '')}"
            placeholder="${escapeHtml(formulaCtx?.defaultDisplay || '燃料消耗量 × 因子')}">`}
          <input type="hidden" name="inline_formula_expr_${escapeHtml(refKey)}" value="${escapeHtml(formulaExpr)}">
        </div>
        ${saved ? '' : this.inlineFormulaChipBar(refKey, amountId, fieldIds, detail, amountId ? [amountId] : [])}
      </div>`;
  },

  dynamicParamRequiredHtml(paramId, pIndex, detail, options = {}) {
    if (!paramId) return '';
    const saved = !!options.saved;
    const req = (detail?.params || []).find(x => x.id === paramId)?.required
      ?? METHOD_CONFIG.getParam(paramId)?.required;
    return `<label class="req-inline structure-dynamic-param-req"><input type="checkbox" name="field_required_${escapeHtml(paramId)}" data-partition-index="${pIndex}" ${req ? 'checked' : ''}${saved ? ' disabled' : ''}> 必填</label>`;
  },

  refreshDynamicPresetUnitPanel(presetRowEl, form) {
    if (!presetRowEl) return;
    const refKey = presetRowEl.querySelector('[name="preset_refKey"]')?.value?.trim();
    if (!refKey) return;
    const sectionEl = presetRowEl.closest('[data-section-type="dynamic_row"]');
    const amountId = sectionEl?.querySelector('[name="block_amountParam"]')?.value?.trim() || '';
    const param = METHOD_CONFIG.getParam(amountId);
    const libId = presetRowEl.querySelector(`[name="inline_factor_lib_${refKey}"]`)?.value?.trim() || '';
    const factorUnit = libId ? METHOD_CONFIG.getFactorUnitFromLibrary(libId) : '';
    const units = METHOD_CONFIG.getParamUnits(param);

    // 多单位模式
    if (units.length > 1) {
      const multiPanel = presetRowEl.querySelector(`.structure-unit-multi-conv[data-ref-key="${refKey}"]`);
      if (multiPanel) {
        const hasFactor = !!libId;
        const newHtml = this._multiUnitConversionHtml(refKey, units, factorUnit, null, hasFactor, false, '');
        multiPanel.insertAdjacentHTML('afterend', newHtml);
        multiPanel.remove();
        const newPanel = presetRowEl.querySelector(`.structure-unit-multi-conv[data-ref-key="${refKey}"]`);
        if (newPanel) this._bindMultiUnitPresets(newPanel, refKey, units, factorUnit);
      }
      return;
    }

    // 单单位模式
    const assess = METHOD_CONFIG.assessParamUnitConversion(param, factorUnit);
    const panel = presetRowEl.querySelector(`.structure-unit-conversion[data-ref-key="${refKey}"]`);
    if (!libId) {
      if (panel) panel.hidden = true;
      return;
    }
    if (panel) {
      panel.hidden = !assess.needsConversion;
      if (assess.needsConversion) {
        const actEl = qs('.unit-conv-activity', panel);
        const facEl = qs('.unit-conv-factor', panel);
        if (actEl) actEl.textContent = assess.activityUnit;
        if (facEl) facEl.textContent = assess.factorDenominator;
        const cfInput = qs(`[name="inline_unit_factor_${refKey}"]`, panel);
        const noteInput = qs(`[name="inline_unit_note_${refKey}"]`, panel);
        if (cfInput && cfInput.value === '' && assess.suggestedFactor !== '') {
          cfInput.value = assess.suggestedFactor;
        }
        if (noteInput && !noteInput.value && assess.suggestedLabel) {
          noteInput.value = assess.suggestedLabel;
        }
      }
    }
  },

  dynamicBlockBodyHtml(section, pIndex, sIndex, detail, options = {}) {
    const saved = !!options.saved;
    const blockNorm = METHOD_CONFIG.normalizeDynamicBlock(section);
    const amountP = METHOD_CONFIG.getParam(blockNorm.amountParamId);
    const sectionKey = `${pIndex}-${sIndex}`;
    const presets = (blockNorm.presetRows || [])
      .map((row, ri) => this.dynamicPresetRowHtml(row, pIndex, ri, blockNorm, detail, { saved }))
      .join('');
    const formulaHtml = (blockNorm.presetRows || []).length
      ? this.dynamicSectionFormulaHtml(blockNorm, pIndex, sIndex, detail, { saved })
      : '';
    const saveFooter = this.dynamicSectionSaveFooterHtml(sectionKey, saved);

    return `
      <div class="structure-dynamic-editor" data-dynamic-editor="${sectionKey}" data-dynamic-section-key="${sectionKey}">
        <div class="structure-emission-col structure-dynamic-config-col">
          <div class="structure-emission-col-head">
            <span class="structure-emission-step">1</span>
            <div>
              <strong class="structure-emission-col-title">关联参数</strong>
              <p class="structure-emission-col-hint">选择品种与消耗量参数后，将自动按枚举生成品种行</p>
            </div>
          </div>
          <div class="form-grid structure-dynamic-param-grid">
            <div class="form-item">
              <label class="structure-dynamic-param-label">
                <span>品种参数</span>
                ${this.dynamicParamRequiredHtml(blockNorm.varietyParamId, pIndex, detail, { saved })}
              </label>
              ${this.dynamicParamSelectHtml('block_varietyParam', blockNorm.varietyParamId, 'option', { saved })}
            </div>
            <div class="form-item">
              <label class="structure-dynamic-param-label">
                <span>消耗量参数</span>
                ${this.dynamicParamRequiredHtml(blockNorm.amountParamId, pIndex, detail, { saved })}
              </label>
              ${this.dynamicParamSelectHtml('block_amountParam', blockNorm.amountParamId, 'number', { saved })}
              ${amountP && METHOD_CONFIG.paramUnitsDisplay(amountP) !== '—' ? `<p class="text-muted structure-dynamic-enum-hint">活动数据单位：${escapeHtml(METHOD_CONFIG.paramUnitsDisplay(amountP))}</p>` : ''}
            </div>
          </div>
        </div>
        <div class="structure-dynamic-row-table-wrap">
          <div class="structure-emission-col-head">
            <span class="structure-emission-step">2</span>
            <div>
              <strong class="structure-emission-col-title">品种行与排放因子</strong>
              <p class="structure-emission-col-hint">每个枚举品种绑定独立因子；若活动单位与因子分母不一致，将显示单位换算</p>
            </div>
          </div>
          ${(blockNorm.presetRows || []).length ? `
          <table class="data-table structure-dynamic-row-table">
            <thead><tr><th>品种</th><th>排放因子</th></tr></thead>
            <tbody data-preset-body="${sectionKey}">${presets}</tbody>
          </table>` : `<p class="text-muted structure-dynamic-empty-rows">请先选择品种参数（需维护选项枚举）</p>`}
        </div>
        ${formulaHtml}
        ${saveFooter}
      </div>`;
  },

  readDynamicSectionFromDom(sectionEl) {
    return METHOD_CONFIG.readDynamicSectionFromForm(sectionEl);
  },

  renderStructureTab(detail) {
    const layout = METHOD_CONFIG.normalizeLayoutBlocks(METHOD_CONFIG.ensureDetailLayout(detail));
    const paramLib = METHOD_CONFIG.listParams()
      .map(p => `<button type="button" class="param-lib-chip${p.status === 'inactive' ? ' param-lib-chip--inactive' : ''}" data-add-param="${escapeHtml(p.id)}" title="${escapeHtml(p.paramCode || p.id)}">${escapeHtml(p.name)}</button>`)
      .join('');
    const partitions = layout.map((partition, idx) => this.structurePartitionHtml(partition, idx, detail)).join('');

    return `
      <div class="method-config-structure-layout">
        <aside class="structure-param-lib card">
          <div class="card-header"><h3>参数库</h3></div>
          <div class="card-body">
            <input type="search" id="tplParamLibFilter" placeholder="搜索参数…" style="width:100%;margin-bottom:8px">
            <div class="param-lib-list" id="tplParamLib">${paramLib}</div>
          </div>
        </aside>
        <div class="structure-canvas">
          <div class="toolbar" style="margin-bottom:12px;flex-wrap:wrap">
            <button type="button" class="btn btn-sm btn-primary structure-add-partition-btn" id="tplAddPartitionBtn">+ 新增分区</button>
          </div>
          <div id="tplBlockList" class="structure-partition-list">${partitions || this.structurePartitionHtml({ type: 'partition', title: '默认分区', sections: [{ type: 'fixed', fields: [] }] }, 0, detail)}</div>
        </div>
      </div>`;
  },

  refreshFormPreview() {
    const container = qs('#tplLiveFormPreview');
    if (!container || typeof window.renderMethodConfigFormPreview !== 'function') return;
    const form = qs('#tplEditForm');
    const merged = form ? this.readInlineFormulaDetail(form) : this.getEditContext().detail;
    container.innerHTML = window.renderMethodConfigFormPreview(merged, form);
  },

  getBinding(detail, refKey) {
    return (detail?.factorBindings || []).find(b => b.refKey === refKey) || {};
  },

  getTemplateFactorVersionRank(form) {
    const formEl = form || qs('#tplEditForm');
    const fromHidden = formEl?.querySelector('[name="tpl_factor_version_rank"]')?.value;
    if (fromHidden != null && fromHidden !== '') {
      return METHOD_CONFIG.resolveTemplateFactorVersionRank(fromHidden);
    }
    const { detail } = this.getEditContext();
    return METHOD_CONFIG.resolveTemplateFactorVersionRank(detail?.meta || {});
  },

  inlineFactorPickerHtml(refKey, selectedId, versionRank) {
    const rank = versionRank != null
      ? METHOD_CONFIG.resolveTemplateFactorVersionRank(versionRank)
      : METHOD_CONFIG.getDefaultFactorVersionRank();
    const opts = METHOD_CONFIG.getFactorLibraryOptions(rank);
    const selected = opts.find(f => f.id === selectedId);
    const display = selected?.displayLabel || '';
    const listItems = opts.length
      ? opts.map(f => {
        const metaParts = [
          f.industryLabel,
          `${f.valueText} · ${f.unit || '—'}`
        ].filter(Boolean);
        return `
        <li class="inline-factor-option" role="option" data-factor-id="${escapeHtml(f.id)}"
          data-factor-label="${escapeHtml(f.displayLabel)}"
          data-factor-unit="${escapeHtml(f.unit || '')}"
          data-factor-text="${escapeHtml(f.searchText)}">
          <span class="inline-factor-option-name">${escapeHtml(f.detailLabel)}</span>
          <span class="inline-factor-option-meta">${escapeHtml(metaParts.join(' · '))}</span>
        </li>`;
      }).join('')
      : '<li class="inline-factor-empty text-muted">暂无可用因子，请先在排放因子库维护</li>';
    return `
      <div class="inline-factor-picker" data-ref-key="${escapeHtml(refKey)}">
        <input type="hidden" name="inline_factor_lib_${escapeHtml(refKey)}" value="${escapeHtml(selectedId || '')}">
        <input type="search" class="inline-factor-search" value="${escapeHtml(display)}" placeholder="搜索名称/细分项、行业、因子值…" autocomplete="off">
        <div class="inline-factor-dropdown" hidden>
          <ul class="inline-factor-options">${listItems}</ul>
        </div>
      </div>`;
  },

  inlineUnitConversionHtml(refKey, fid, param, binding, options = {}) {
    const saved = !!options.saved;
    const disabledAttr = saved ? ' disabled' : '';
    const factorUnit = binding?.factorSource
      ? METHOD_CONFIG.getFactorUnitFromLibrary(binding.factorSource)
      : (binding?.unitFactor || '');
    const hasFactor = !!(binding?.factorSource || factorUnit);
    const units = METHOD_CONFIG.getParamUnits(param);

    // 多单位模式：每个单位独立一行换算配置
    if (units.length > 1) {
      return this._multiUnitConversionHtml(refKey, units, factorUnit, binding, hasFactor, saved, disabledAttr);
    }

    // 单单位模式（原有逻辑）
    const assess = METHOD_CONFIG.assessParamUnitConversion(param, factorUnit);
    const showConvert = hasFactor && assess.needsConversion;
    const cf = binding?.conversionFactor ?? assess.suggestedFactor ?? '';
    const note = binding?.unitConversion || assess.suggestedLabel || '';
    const presetOpts = [{ factor: '', label: '常用换算…' }]
      .concat(assess.presets || [])
      .map(p => `<option value="${p.factor}" ${String(cf) === String(p.factor) && p.factor !== '' ? 'selected' : ''}>${escapeHtml(p.label)}</option>`)
      .join('');
    return `
      <div class="structure-unit-conversion" data-ref-key="${escapeHtml(refKey)}" ${showConvert ? '' : 'hidden'}>
        <div class="structure-unit-conversion-head">
          <span class="tag tag-warning">需单位换算</span>
          <span class="structure-unit-conversion-pair">
            活动单位 <strong class="unit-conv-activity">${escapeHtml(assess.activityUnit)}</strong>
            <span class="unit-conv-arrow">→</span>
            因子分母 <strong class="unit-conv-factor">${escapeHtml(assess.factorDenominator)}</strong>
          </span>
        </div>
        <div class="structure-unit-conversion-fields">
          <div class="form-item inline-unit-factor-item">
            <label>换算系数</label>
            <input type="number" step="any" name="inline_unit_factor_${escapeHtml(refKey)}" class="inline-unit-factor-input"
              value="${cf !== '' && cf != null ? escapeHtml(String(cf)) : ''}" placeholder="如 1000" data-ref-key="${escapeHtml(refKey)}"${disabledAttr}>
          </div>
          <div class="form-item inline-unit-preset-item">
            <label>快捷选择</label>
            <select name="inline_unit_preset_${escapeHtml(refKey)}" class="inline-unit-preset-select" data-ref-key="${escapeHtml(refKey)}"${disabledAttr}>${presetOpts}</select>
          </div>
        </div>
        <input type="hidden" name="inline_unit_note_${escapeHtml(refKey)}" value="${escapeHtml(note)}">
      </div>`;
  },

  /** 多单位换算面板 HTML（每个单位一行） */
  _multiUnitConversionHtml(refKey, units, factorUnit, binding, hasFactor, saved, disabledAttr) {
    const prevConversions = binding?.unitConversions || [];
    const rows = units.map((u, i) => {
      const assess = hasFactor ? METHOD_CONFIG.assessUnitConversion(u, factorUnit) : null;
      const prev = prevConversions.find(c => c.unit === u) || {};
      const cf = prev.conversionFactor !== undefined ? prev.conversionFactor
        : (assess?.suggestedFactor ?? '');
      const note = prev.conversionNote || assess?.suggestedLabel || '';
      const presetOpts = [{ factor: '', label: '常用换算…' }]
        .concat(assess?.presets || [])
        .map(p => `<option value="${p.factor}" ${String(cf) === String(p.factor) && p.factor !== '' ? 'selected' : ''}>${escapeHtml(p.label)}</option>`)
        .join('');
      const hiddenInputs = `
        <input type="hidden" name="inline_unit_name_${escapeHtml(refKey)}_u${i}" value="${escapeHtml(u)}">
        <input type="hidden" name="inline_unit_note_${escapeHtml(refKey)}_u${i}" value="${escapeHtml(note)}">`;
      if (!hasFactor) {
        return `<tr>${hiddenInputs}
          <td><span class="structure-emission-unit">${escapeHtml(u)}</span></td>
          <td colspan="2" class="text-muted" style="font-size:12px">请先选择排放因子</td></tr>`;
      }
      if (assess?.match) {
        return `<tr>${hiddenInputs}
          <input type="hidden" name="inline_unit_factor_${escapeHtml(refKey)}_u${i}" value="1">
          <td><span class="structure-emission-unit">${escapeHtml(u)}</span></td>
          <td><span class="unit-conv-arrow">→</span> 因子分母 <strong>${escapeHtml(assess.factorDenominator)}</strong></td>
          <td><span class="tag tag-success">单位一致，无需换算</span></td></tr>`;
      }
      return `<tr class="unit-conv-multi-row">${hiddenInputs}
        <td><span class="structure-emission-unit">${escapeHtml(u)}</span></td>
        <td><span class="unit-conv-arrow">→</span> 因子分母 <strong>${escapeHtml(assess?.factorDenominator || '—')}</strong></td>
        <td>
          <div class="inline-multi-unit-inputs">
            <input type="number" step="any"
              name="inline_unit_factor_${escapeHtml(refKey)}_u${i}"
              class="inline-unit-factor-input" value="${cf !== '' && cf != null ? escapeHtml(String(cf)) : ''}"
              placeholder="换算系数"${disabledAttr}>
            <select name="inline_unit_preset_${escapeHtml(refKey)}_u${i}"
              class="inline-unit-preset-select"${disabledAttr}>${presetOpts}</select>
          </div>
        </td></tr>`;
    }).join('');

    return `
      <div class="structure-unit-multi-conv" data-ref-key="${escapeHtml(refKey)}" ${hasFactor ? '' : 'hidden'}>
        <input type="hidden" name="inline_unit_count_${escapeHtml(refKey)}" value="${units.length}">
        <table class="unit-conv-multi-table">
          <thead><tr><th>单位</th><th>换算关系</th><th>换算系数 / 快捷选择</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  },

  refreshUnitConversionPanel(sourceEl, form) {
    if (!sourceEl) return;
    const ctx = this.getEmissionSourceContext(sourceEl);
    if (!ctx) return;
    const { primary, refKey } = ctx;
    const param = METHOD_CONFIG.getParam(primary);
    const libId = sourceEl.querySelector(`[name="inline_factor_lib_${refKey}"]`)?.value?.trim() || '';
    const factorUnit = libId ? METHOD_CONFIG.getFactorUnitFromLibrary(libId) : '';
    const units = METHOD_CONFIG.getParamUnits(param);

    // 多单位模式：重渲染整个多单位面板
    if (units.length > 1) {
      const multiPanel = sourceEl.querySelector(`.structure-unit-multi-conv[data-ref-key="${refKey}"]`);
      if (multiPanel) {
        const hasFactor = !!libId;
        const newHtml = this._multiUnitConversionHtml(refKey, units, factorUnit, null, hasFactor, false, '');
        multiPanel.outerHTML && multiPanel.insertAdjacentHTML('afterend', newHtml);
        multiPanel.remove();
        // 重绑定 preset 事件
        const newPanel = sourceEl.querySelector(`.structure-unit-multi-conv[data-ref-key="${refKey}"]`);
        if (newPanel) this._bindMultiUnitPresets(newPanel, refKey, units, factorUnit);
      }
      this.syncEmissionRowExpression(sourceEl, form);
      return;
    }

    // 单单位模式
    const assess = METHOD_CONFIG.assessParamUnitConversion(param, factorUnit);
    const panel = sourceEl.querySelector(`.structure-unit-conversion[data-ref-key="${refKey}"]`);
    if (!libId) {
      if (panel) panel.hidden = true;
      return;
    }
    if (panel) {
      panel.hidden = !assess.needsConversion;
      if (assess.needsConversion) {
        const actEl = qs('.unit-conv-activity', panel);
        const facEl = qs('.unit-conv-factor', panel);
        if (actEl) actEl.textContent = assess.activityUnit;
        if (facEl) facEl.textContent = assess.factorDenominator;
        const cfInput = qs(`[name="inline_unit_factor_${refKey}"]`, panel);
        const noteInput = qs(`[name="inline_unit_note_${refKey}"]`, panel);
        if (cfInput && cfInput.value === '' && assess.suggestedFactor !== '') {
          cfInput.value = assess.suggestedFactor;
        }
        if (noteInput && !noteInput.value && assess.suggestedLabel) {
          noteInput.value = assess.suggestedLabel;
        }
      }
    }
    this.syncEmissionRowExpression(sourceEl, form);
  },

  /** 绑定多单位换算面板中的快捷选择下拉 */
  _bindMultiUnitPresets(panelEl, refKey, units, factorUnit) {
    units.forEach((u, i) => {
      const sel = panelEl.querySelector(`[name="inline_unit_preset_${refKey}_u${i}"]`);
      const cfInput = panelEl.querySelector(`[name="inline_unit_factor_${refKey}_u${i}"]`);
      const noteInput = panelEl.querySelector(`[name="inline_unit_note_${refKey}_u${i}"]`);
      if (!sel || !cfInput) return;
      sel.addEventListener('change', () => {
        const v = sel.value;
        if (v !== '' && cfInput) cfInput.value = v;
        const assess = METHOD_CONFIG.assessUnitConversion(u, factorUnit);
        const preset = assess?.presets?.find(p => String(p.factor) === String(v));
        if (preset && noteInput) noteInput.value = preset.label;
      });
    });
  },

  syncEmissionRowExpression(sourceEl, form) {
    if (!sourceEl) return;
    const ctx0 = this.getEmissionSourceContext(sourceEl);
    if (!ctx0) return;
    const { primary, refKey, fieldIds, sourceFields } = ctx0;
    const visual = sourceEl.querySelector(`[name="inline_formula_display_${refKey}"]`);
    const hidden = sourceEl.querySelector(`[name="inline_formula_expr_${refKey}"]`);
    if (!visual || !hidden) return;
    const ctx = METHOD_CONFIG.buildInlineFormulaContext(
      primary,
      fieldIds,
      refKey,
      this.getEditContext().detail,
      sourceFields
    );
    let base = METHOD_CONFIG.displayFormulaToExpression(visual.value, ctx);
    const cf = sourceEl.querySelector(`[name="inline_unit_factor_${refKey}"]`)?.value;
    const factorUnit = METHOD_CONFIG.getFactorUnitFromLibrary(
      sourceEl.querySelector(`[name="inline_factor_lib_${refKey}"]`)?.value
    );
    const assess = METHOD_CONFIG.assessParamUnitConversion(METHOD_CONFIG.getParam(primary), factorUnit);
    const conversionFactor = assess.needsConversion ? (cf !== '' ? Number(cf) : 1) : 1;
    hidden.value = METHOD_CONFIG.applyConversionFactorToExpr(base, primary, conversionFactor);
  },

  setInlineFactorPickerValue(picker, factorId, form) {
    if (!picker) return false;
    const refKey = picker.dataset.refKey;
    if (!refKey) return false;
    const opts = METHOD_CONFIG.getFactorLibraryOptions(this.getTemplateFactorVersionRank(form));
    const opt = opts.find(f => f.id === factorId);
    const hidden = qs(`[name="inline_factor_lib_${refKey}"]`, picker);
    const search = qs('.inline-factor-search', picker);
    if (!hidden) return false;
    hidden.value = factorId || '';
    if (search) search.value = opt?.displayLabel || '';
    const sourceEl = picker.closest('[data-emission-source]');
    const presetRow = picker.closest('[data-preset-row]');
    if (sourceEl) this.refreshUnitConversionPanel(sourceEl, form);
    if (presetRow) this.refreshDynamicPresetUnitPanel(presetRow, form);
    if (presetRow && !presetRow.closest('[data-section-type="dynamic_row"][data-dynamic-saved="1"]')) {
      this.refreshPartitionFormulaBar(
        presetRow.closest('[data-partition-row]'),
        this.readInlineFormulaDetail(form)
      );
    }
    return true;
  },

  updateAllFactorVersions() {
    this._runUpdateAllFactorVersions();
  },

  async _runUpdateAllFactorVersions() {
    const form = qs('#tplEditForm');
    if (!form) return;
    const { detail } = this.getEditContext();
    if (detail.meta?.methodId === 'report') {
      toast('报告法模板无需绑定排放因子', 'info');
      return;
    }
    const bound = [...form.querySelectorAll('input[name^="inline_factor_lib_"]')]
      .filter(h => h.value?.trim());
    if (!bound.length) {
      toast('当前模板暂无已绑定的排放因子', 'warning');
      return;
    }
    const versionOptions = METHOD_CONFIG.getFactorLibraryVersionOptions();
    const defaultRank = versionOptions.length
      ? String(versionOptions[versionOptions.length - 1].rank)
      : '1';
    const dialogResult = await showConfirmDialog({
      title: '更新因子版本',
      message: `模板内共有 ${bound.length} 处因子绑定，确认按所选版本号批量更新吗？`,
      detail: '系统将按排放因子库中各因子组对应版本重新匹配；已是该版本的绑定将自动跳过。',
      confirmText: '确认更新',
      select: {
        label: '请选择将模板内因子更新为哪一个版本？',
        options: versionOptions.map(o => ({ value: String(o.rank), label: o.label })),
        defaultValue: defaultRank
      }
    });
    const confirmed = dialogResult === true || dialogResult?.ok;
    if (!confirmed) return;
    const versionRank = Number(
      (typeof dialogResult === 'object' && dialogResult?.value != null)
        ? dialogResult.value
        : defaultRank
    );
    const versionLabel = typeof formatFactorVersionNo === 'function'
      ? formatFactorVersionNo(Math.max(1, versionRank))
      : `v${versionRank}.0`;

    let updated = 0;
    let skipped = 0;
    let failed = 0;
    bound.forEach(hidden => {
      const oldId = hidden.value.trim();
      const newId = METHOD_CONFIG.resolveFactorVersionUpgradeByRank(oldId, versionRank);
      if (!newId || newId === oldId) {
        skipped++;
        return;
      }
      const picker = hidden.closest('.inline-factor-picker');
      if (!picker || !this.setInlineFactorPickerValue(picker, newId, form)) {
        failed++;
        return;
      }
      updated++;
    });
    const parts = [];
    if (updated) parts.push(`已更新 ${updated} 处为 ${versionLabel}`);
    if (skipped) parts.push(`${skipped} 处已是 ${versionLabel}`);
    if (failed) parts.push(`${failed} 处更新失败`);
    toast(parts.join('，') || '未发生变更', updated ? 'success' : 'info');
  },

  bindInlineFactorPickers(form) {
    if (!form) return;

    const closeAllPickers = except => {
      qsa('.inline-factor-picker', form).forEach(p => {
        if (except && p === except) return;
        p.classList.remove('open');
        qs('.inline-factor-dropdown', p)?.setAttribute('hidden', '');
      });
    };

    const filterPicker = picker => {
      const kw = qs('.inline-factor-search', picker)?.value.trim().toLowerCase() || '';
      const selectedId = qs(`[name="inline_factor_lib_${picker.dataset.refKey}"]`, picker)?.value || '';
      qsa('.inline-factor-option', picker).forEach(opt => {
        const text = (opt.dataset.factorText || opt.textContent || '').toLowerCase();
        const isSelected = opt.dataset.factorId === selectedId;
        opt.hidden = !!kw && !text.includes(kw) && !isSelected;
      });
    };

    form.addEventListener('focusin', e => {
      const search = e.target.closest('.inline-factor-search');
      if (!search || !form.contains(search)) return;
      const picker = search.closest('.inline-factor-picker');
      if (!picker) return;
      closeAllPickers(picker);
      picker.classList.add('open');
      qs('.inline-factor-dropdown', picker)?.removeAttribute('hidden');
      filterPicker(picker);
    });

    form.addEventListener('input', e => {
      const search = e.target.closest('.inline-factor-search');
      if (!search || !form.contains(search)) return;
      const picker = search.closest('.inline-factor-picker');
      if (!picker) return;
      const hidden = qs(`[name="inline_factor_lib_${picker.dataset.refKey}"]`, picker);
      if (hidden) hidden.value = '';
      picker.classList.add('open');
      qs('.inline-factor-dropdown', picker)?.removeAttribute('hidden');
      filterPicker(picker);
    });

    form.addEventListener('click', e => {
      const opt = e.target.closest('.inline-factor-option');
      if (opt && form.contains(opt)) {
        const picker = opt.closest('.inline-factor-picker');
        if (!picker) return;
        this.setInlineFactorPickerValue(picker, opt.dataset.factorId || '', form);
        closeAllPickers();
        e.preventDefault();
        return;
      }
      if (!e.target.closest('.inline-factor-picker')) closeAllPickers();
    });

    form.addEventListener('input', e => {
      if (e.target.matches('.inline-unit-factor-input')) {
        e.target.dataset.touched = '1';
        this.syncEmissionRowExpression(e.target.closest('[data-emission-source]'), form);
        return;
      }
    });

    form.addEventListener('change', e => {
      if (!e.target.matches('.inline-unit-preset-select')) return;
      const refKey = e.target.dataset.refKey;
      const sourceEl = e.target.closest('[data-emission-source]');
      const presetRow = e.target.closest('[data-preset-row]');
      const dynamicSection = presetRow?.closest('[data-section-type="dynamic_row"]');
      if (dynamicSection && this.isDynamicSectionSaved(dynamicSection)) return;
      const scopeEl = sourceEl || presetRow;
      const factor = e.target.value;
      if (!factor || !scopeEl) return;
      const cfInput = scopeEl.querySelector(`[name="inline_unit_factor_${refKey}"]`);
      const noteInput = scopeEl.querySelector(`[name="inline_unit_note_${refKey}"]`);
      const label = e.target.selectedOptions[0]?.textContent || '';
      if (cfInput) {
        cfInput.value = factor;
        cfInput.dataset.touched = '1';
      }
      if (noteInput) noteInput.value = label;
      if (sourceEl) this.syncEmissionRowExpression(sourceEl, form);
    });
  },

  inlineFactorSelectHtml(refKey, selectedId, versionRank) {
    return this.inlineFactorPickerHtml(refKey, selectedId, versionRank);
  },

  renderFormulaChip(c, refKey) {
    return `<button type="button" class="inline-formula-chip" data-insert-inline-formula data-target="${escapeHtml(refKey)}" data-text="${escapeHtml(c.text)}"${c.title ? ` title="${escapeHtml(c.title)}"` : ''}>${escapeHtml(c.label)}</button>`;
  },

  inlineFormulaChipBar(refKey, fieldId, fieldIds, detail, sourceFieldIds) {
    const ctx = METHOD_CONFIG.buildInlineFormulaContext(fieldId, fieldIds, refKey, detail, sourceFieldIds);
    const tokenChips = (ctx.tokens || []).map(t => ({
      label: t.display,
      text: t.display === '因子' ? '因子' : ` ${t.display} `
    }));
    const opChips = [
      { label: '×', text: ' × ' },
      { label: '÷', text: ' ÷ ' },
      { label: '+', text: ' + ' },
      { label: '−', text: ' - ' },
      { label: 'Σ', text: ' SUM(', title: '累加求和' },
      { label: '(', text: '(' },
      { label: ')', text: ')' },
      { label: '[', text: '[' },
      { label: ']', text: ']' },
      { label: '{', text: '｛', title: '左大括号' },
      { label: '}', text: '｝', title: '右大括号' },
      { label: '%', text: '%', title: '百分号，如 44%' }
    ];
    const tokenHtml = tokenChips.map(c => this.renderFormulaChip(c, refKey)).join('');
    const opHtml = opChips.map(c => this.renderFormulaChip(c, refKey)).join('');
    return `
      <div class="inline-formula-chip-groups">
        <div class="inline-formula-chip-group">
          <span class="inline-formula-chip-label">插入参数</span>
          <div class="inline-formula-chips">${tokenHtml}</div>
        </div>
        <div class="inline-formula-chip-group">
          <span class="inline-formula-chip-label">运算符</span>
          <div class="inline-formula-chips">${opHtml}</div>
        </div>
      </div>`;
  },

  getFixedSectionEl(partitionEl) {
    return partitionEl?.querySelector('[data-section-type="fixed"]');
  },

  getFieldIdsFromBlock(sectionEl) {
    const scope = sectionEl?.matches?.('[data-section-type="fixed"]')
      ? sectionEl
      : (sectionEl?.querySelector('[data-section-type="fixed"]') || sectionEl);
    if (!scope) return [];
    const ids = [];
    scope.querySelectorAll('.structure-field-row:not(.structure-field-row--emission) [name="block_field"]').forEach(i => {
      if (i.value && !ids.includes(i.value)) ids.push(i.value);
    });
    scope.querySelectorAll('[name="source_field"]').forEach(i => {
      if (i.value && !ids.includes(i.value)) ids.push(i.value);
    });
    return ids;
  },

  readEmissionSourcesFromBlock(sectionEl) {
    const scope = sectionEl?.matches?.('[data-section-type="fixed"]')
      ? sectionEl
      : (sectionEl?.querySelector('[data-section-type="fixed"]') || sectionEl);
    const sources = [];
    scope?.querySelectorAll('[data-emission-source]').forEach(esEl => {
      const id = esEl.dataset.emissionSourceId
        || esEl.querySelector('[name="emission_source_id"]')?.value
        || '';
      const fields = [...esEl.querySelectorAll('[name="source_field"]')].map(i => i.value).filter(Boolean);
      if (fields.length) sources.push({ id: id || `es_${fields[0]}`, fields });
    });
    return sources;
  },

  buildBlockFromDom(sectionEl) {
    return METHOD_CONFIG.readFixedSectionFromForm(
      sectionEl?.matches?.('[data-section-type="fixed"]') ? sectionEl : sectionEl?.querySelector('[data-section-type="fixed"]')
    ) || { type: 'fixed', fields: [] };
  },

  buildPartitionFromDom(partitionEl) {
    const title = partitionEl?.querySelector('[name="partition_title"]')?.value?.trim() || '未命名分区';
    const requiredGroup = !!partitionEl?.querySelector('[name="partition_requiredGroup"]')?.checked;
    const sections = [];
    partitionEl?.querySelectorAll('[data-section-row]').forEach(sectionEl => {
      sections.push(sectionEl.dataset.sectionType === 'dynamic_row'
        ? this.readDynamicSectionFromDom(sectionEl)
        : METHOD_CONFIG.readFixedSectionFromForm(sectionEl));
    });
    return { type: 'partition', title, requiredGroup, sections };
  },

  getEmissionSourceContext(sourceEl) {
    if (!sourceEl) return null;
    const partitionEl = sourceEl.closest('[data-partition-row]');
    const fixedSection = this.getFixedSectionEl(partitionEl);
    const fieldIds = this.getFieldIdsFromBlock(fixedSection);
    const sourceFields = [...sourceEl.querySelectorAll('[name="source_field"]')].map(i => i.value).filter(Boolean);
    const source = {
      id: sourceEl.dataset.emissionSourceId || sourceEl.querySelector('[name="emission_source_id"]')?.value,
      fields: sourceFields
    };
    const primary = METHOD_CONFIG.primaryFieldForSource(source, fieldIds);
    const refKey = METHOD_CONFIG.refKeyForEmissionSource(source, fieldIds);
    return { partitionEl, fixedSection, fieldIds, source, sourceFields, primary, refKey };
  },

  syncInlineFormulaFromVisual(visualInput, form) {
    if (!visualInput) return;
    const refKey = visualInput.dataset.refKey;
    const sourceEl = visualInput.closest('[data-emission-source]');
    const dynamicSection = visualInput.closest('[data-section-type="dynamic_row"]');
    let primary;
    let fieldIds;
    let sourceFields;

    if (sourceEl) {
      const ctx0 = this.getEmissionSourceContext(sourceEl);
      if (!ctx0) return;
      ({ primary, fieldIds, sourceFields } = ctx0);
    } else if (dynamicSection && String(refKey || '').startsWith('dyn_formula_')) {
      primary = dynamicSection.querySelector('[name="block_amountParam"]')?.value?.trim()
        || visualInput.dataset.fieldId
        || '';
      const varietyId = dynamicSection.querySelector('[name="block_varietyParam"]')?.value?.trim() || '';
      fieldIds = [primary, varietyId].filter(Boolean);
      sourceFields = primary ? [primary] : [];
      const ctx = METHOD_CONFIG.patchDynamicFormulaContext(METHOD_CONFIG.buildInlineFormulaContext(
        primary,
        fieldIds,
        refKey,
        this.getEditContext().detail,
        sourceFields
      ));
      const technical = METHOD_CONFIG.displayFormulaToExpression(visualInput.value, ctx);
      const hidden = form?.querySelector(`[name="inline_formula_expr_${refKey}"]`);
      if (hidden) hidden.value = technical;
      const normalized = METHOD_CONFIG.expressionToDisplayFormula(technical, ctx);
      if (normalized && visualInput.value !== normalized) {
        visualInput.value = normalized;
      }
      return technical;
    } else {
      return;
    }

    const ctx = METHOD_CONFIG.buildInlineFormulaContext(
      primary,
      fieldIds,
      refKey,
      this.getEditContext().detail,
      sourceFields
    );
    const technical = METHOD_CONFIG.displayFormulaToExpression(visualInput.value, ctx);
    const hidden = form?.querySelector(`[name="inline_formula_expr_${refKey}"]`);
    if (hidden) hidden.value = technical;
    const normalized = METHOD_CONFIG.expressionToDisplayFormula(technical, ctx);
    if (normalized && visualInput.value !== normalized) {
      visualInput.value = normalized;
    }
    return technical;
  },

  refreshBlockFormulaBar(partitionEl, detail) {
    this.refreshPartitionFormulaBar(partitionEl, detail);
  },

  summarizePartitionFormulaFromDom(partitionEl) {
    if (!partitionEl) return '—';
    const parts = [];
    const pIndex = partitionEl.dataset.partitionIndex ?? '0';
    partitionEl.querySelectorAll('[data-section-row]').forEach(sectionEl => {
      const sectionType = sectionEl.dataset.sectionType || 'fixed';
      if (sectionType === 'dynamic_row') {
        const sIndex = sectionEl.dataset.sectionIndex ?? '0';
        const refKey = `dyn_formula_${pIndex}-${sIndex}`;
        const displayEl = sectionEl.querySelector(`[name="inline_formula_display_${refKey}"]`);
        const formula = displayEl?.value?.trim() || displayEl?.textContent?.trim() || '';
        const rowCount = sectionEl.querySelectorAll('[data-preset-row]').length;
        if (formula && rowCount) parts.push(`Σ${rowCount}行（${formula}）`);
        else if (formula) parts.push(formula);
        return;
      }
      sectionEl.querySelectorAll('[data-emission-source]').forEach(sourceEl => {
        const text = sourceEl.querySelector('.structure-emission-formula-readonly')?.textContent?.trim()
          || sourceEl.querySelector('[name^="inline_formula_display_"]')?.value?.trim()
          || '';
        if (text && text !== '—') parts.push(text);
      });
    });
    return parts.length ? parts.join(' + ') : '—';
  },

  refreshPartitionFormulaBar(partitionEl, detail) {
    if (!partitionEl) return;
    const bar = partitionEl.querySelector('.structure-partition-formula-bar span');
    if (!bar) return;
    const fromDom = this.summarizePartitionFormulaFromDom(partitionEl);
    if (fromDom !== '—') {
      bar.textContent = fromDom;
      return;
    }
    const pIndex = Number(partitionEl.dataset.partitionIndex) || 0;
    const partition = this.buildPartitionFromDom(partitionEl);
    bar.textContent = METHOD_CONFIG.humanizePartitionFormula(partition, detail, pIndex);
  },

  ensureBlockFormulaBar() {},

  readInlineFormulaDetail(form) {
    const { detail } = this.getEditContext();
    const merged = JSON.parse(JSON.stringify(detail));
    if (form) {
      const structure = METHOD_CONFIG.readTemplateStructure(form);
      merged.layout = structure.layout;
      merged.params = structure.params;
      const inlineBindings = METHOD_CONFIG.readInlineFactorBindings(form, structure.layout, detail.factorBindings);
      const dynamicBindings = METHOD_CONFIG.readDynamicRowFactorBindings(form, structure.layout, detail.factorBindings);
      const seen = new Set(inlineBindings.map(b => b.refKey));
      merged.factorBindings = inlineBindings.concat(dynamicBindings.filter(b => b.refKey && !seen.has(b.refKey)));
    }
    return merged;
  },

  getDraftEmissionSource(scopeEl) {
    return scopeEl?.querySelector('[data-emission-source][data-emission-draft="1"]');
  },

  emissionParamRowHtml(fid, blockIndex, sourceId, canRemove, saved) {
    const p = METHOD_CONFIG.getParam(fid);
    const req = p?.required;
    const showRemove = canRemove && !saved;
    const units = p ? METHOD_CONFIG.getParamUnits(p) : [];
    const unitHtml = units.length
      ? units.map(u => `<span class="structure-emission-unit">${escapeHtml(u)}</span>`).join('')
      : (p && METHOD_CONFIG.paramUnitsDisplay(p) !== '—'
        ? `<span class="structure-emission-unit">${escapeHtml(METHOD_CONFIG.paramUnitsDisplay(p))}</span>`
        : '');
    return `<div class="structure-emission-param-row" data-source-param="${escapeHtml(fid)}">
      <input type="hidden" name="source_field" data-source-id="${escapeHtml(sourceId)}" value="${escapeHtml(fid)}">
      <span class="structure-emission-param-name">${escapeHtml(p?.name || fid)}</span>
      ${unitHtml}
      <label class="req-inline structure-emission-req"><input type="checkbox" name="field_required_${escapeHtml(fid)}" data-partition-index="${blockIndex}" ${req ? 'checked' : ''} ${saved ? 'disabled' : ''}> 必填</label>
      ${showRemove ? `<button type="button" class="btn btn-sm structure-source-param-remove" data-remove-source-param="${escapeHtml(fid)}" title="移除此参数">×</button>` : ''}
    </div>`;
  },

  emissionSourceHtml(source, blockIndex, block, detail, options = {}) {
    const saved = !!(options.saved ?? source.saved);
    const fieldIds = block.fields || [];
    const sourceId = source.id || `es_${(source.fields || [])[0] || 'new'}`;
    const sourceFields = source.fields || [];
    const primary = METHOD_CONFIG.primaryFieldForSource(source, fieldIds);
    const refKey = METHOD_CONFIG.refKeyForEmissionSource(source, fieldIds);
    const binding = this.getBinding(detail, refKey);
    const p = METHOD_CONFIG.getParam(primary);
    const formulaExpr = METHOD_CONFIG.normalizeFormulaFactorRef(
      binding.formulaExpression || METHOD_CONFIG.defaultSourceFormulaExpression(source, fieldIds),
      refKey
    );
    const formulaCtx = METHOD_CONFIG.buildInlineFormulaContext(primary, fieldIds, refKey, detail, sourceFields);
    let displayFormula = METHOD_CONFIG.expressionToDisplayFormula(formulaExpr, formulaCtx);
    if (!displayFormula || /^[\s×*]+$/.test(displayFormula)) {
      displayFormula = formulaCtx?.defaultDisplay || '';
    }
    const paramRows = sourceFields
      .map(fid => this.emissionParamRowHtml(fid, blockIndex, sourceId, sourceFields.length > 1, saved))
      .join('');
    const metaLabel = saved
      ? (sourceFields.length > 1
        ? `${sourceFields.length} 个填报参数`
        : '单参数排放')
      : (sourceFields.length > 1
        ? `${sourceFields.length} 个填报参数 · 共用一个因子与公式`
        : '单参数排放 · 待保存');
    const paramHint = saved
      ? '已锁定；点击「编辑」后可修改，保存后继续从左侧选参创建新卡片'
      : '从左侧参数库点击继续添加字段，配置完成后保存此卡片';
    const draftAttr = saved ? '' : ' data-emission-draft="1"';
    const savedAttr = saved ? ' data-emission-saved="1"' : '';
    const disabledAttr = saved ? ' disabled' : '';
    const saveFooter = saved ? `
            <div class="structure-emission-footer structure-emission-footer--saved">
              <button type="button" class="btn btn-sm" data-edit-emission-source="${escapeHtml(sourceId)}">编辑</button>
              <span class="text-muted structure-emission-save-hint">修改因子、公式或参数后请再次保存</span>
            </div>` : `
            <div class="structure-emission-footer">
              <button type="button" class="btn btn-sm btn-primary" data-save-emission-source="${escapeHtml(sourceId)}">保存排放源</button>
              <span class="text-muted structure-emission-save-hint">保存后锁定此卡片，左侧新选参数将创建下一个排放源</span>
            </div>`;
    const formulaFieldHtml = saved
      ? `<div class="structure-emission-formula-readonly">${escapeHtml(displayFormula || formulaCtx?.defaultDisplay || '—')}</div>
                <input type="hidden" class="inline-formula-visual" name="inline_formula_display_${escapeHtml(refKey)}"
                  value="${escapeHtml(displayFormula)}" data-ref-key="${escapeHtml(refKey)}" data-field-id="${escapeHtml(primary)}">`
      : `<input type="text" class="inline-formula-visual" name="inline_formula_display_${escapeHtml(refKey)}"
                  value="${escapeHtml(displayFormula)}" data-ref-key="${escapeHtml(refKey)}" data-field-id="${escapeHtml(primary)}"
                  placeholder="${escapeHtml(formulaCtx?.defaultDisplay || '煤炭消耗量 × 因子')}">`;

    return `<div class="structure-emission-source${saved ? ' structure-emission-source--saved' : ' structure-emission-source--draft'}" data-emission-source data-emission-source-id="${escapeHtml(sourceId)}"${draftAttr}${savedAttr}>
      <input type="hidden" name="emission_source_id" value="${escapeHtml(sourceId)}">
      <div class="structure-field-row structure-field-row--emission">
        <div class="structure-field-preview">
          <div class="structure-inline-factor structure-emission-editor">
            <div class="structure-emission-source-head">
              <span class="tag tag-info">排放源</span>
              <span class="text-muted structure-emission-source-meta">${escapeHtml(metaLabel)}</span>
              ${saved ? '<span class="tag tag-success structure-emission-saved-tag">已保存</span>' : '<span class="tag tag-warning">编辑中</span>'}
            </div>
            <div class="structure-emission-row1">
              <div class="structure-emission-col structure-emission-col-param">
                <div class="structure-emission-col-head">
                  <span class="structure-emission-step">1</span>
                  <div>
                    <strong class="structure-emission-col-title">客户填报字段</strong>
                    <p class="structure-emission-col-hint">${escapeHtml(paramHint)}</p>
                  </div>
                </div>
                <div class="structure-emission-param-list">${paramRows}</div>
              </div>
              <div class="structure-emission-col structure-emission-col-factor">
                <div class="structure-emission-col-head">
                  <span class="structure-emission-step">2</span>
                  <div>
                    <strong class="structure-emission-col-title">匹配排放因子</strong>
                    <p class="structure-emission-col-hint">搜索因子库并选择</p>
                  </div>
                </div>
                ${this.inlineFactorPickerHtml(refKey, binding.factorSource, detail?.meta?.factorVersionRank).replace('class="inline-factor-search"', `class="inline-factor-search"${disabledAttr}`)}
                ${this.inlineUnitConversionHtml(refKey, primary, p, binding, { saved })}
              </div>
            </div>
            <div class="structure-emission-row2">
              <div class="structure-emission-col-head">
                <span class="structure-emission-step">3</span>
                <div>
                  <strong class="structure-emission-col-title">排放量计算公式</strong>
                  <p class="structure-emission-col-hint">点击「插入参数 / 运算符」拼公式，也可直接输入数值（如 44%）</p>
                </div>
              </div>
              <div class="structure-emission-formula-box">
                <span class="structure-emission-eq-label">排放量 =</span>
                ${formulaFieldHtml}
                <input type="hidden" name="inline_formula_expr_${escapeHtml(refKey)}" value="${escapeHtml(formulaExpr)}">
              </div>
              ${saved ? '' : this.inlineFormulaChipBar(refKey, primary, fieldIds, detail, sourceFields)}
            </div>
            ${saveFooter}
          </div>
        </div>
        <button type="button" class="btn btn-sm structure-field-remove structure-emission-source-remove" data-remove-emission-source="${escapeHtml(sourceId)}" title="删除此排放源">×</button>
      </div>
    </div>`;
  },

  simpleFieldRowHtml(fid, blockIndex, block, detail) {
    const p = METHOD_CONFIG.getParam(fid) || (detail?.params || []).find(x => x.id === fid);
    const req = (detail?.params || []).find(x => x.id === fid)?.required;
    const isOption = METHOD_CONFIG.fieldIsOptionType(p);
    const isAttachment = METHOD_CONFIG.fieldIsAttachmentType(p);

    let inputPreview;
    if (isAttachment) {
      inputPreview = `<div class="structure-attach-preview">
        <button type="button" class="btn btn-sm" disabled>选择文件</button>
        <p class="text-muted attach-meta">${escapeHtml(METHOD_CONFIG.formatAttachMetaText(p))}</p>
        <ul class="attach-list"><li class="attach-empty">暂无附件</li></ul>
      </div>`;
    } else if (isOption) {
      const sample = (p?.enumValues || [])[0] || '请选择';
      inputPreview = `<select disabled class="preview-input"><option>${escapeHtml(sample)}</option></select>`;
    } else if (METHOD_CONFIG.fieldIsNumberType(p)) {
      inputPreview = `<input disabled class="preview-input" placeholder="${escapeHtml(p?.unit || '请输入')}">`;
    } else {
      inputPreview = `<input disabled class="preview-input" placeholder="—">`;
    }

    return `<div class="structure-field-row" data-field-row data-field-id="${escapeHtml(fid)}">
      <input type="hidden" name="block_field" value="${escapeHtml(fid)}">
      <div class="structure-field-preview">
        <div class="form-item structure-preview-field">
          <label class="structure-preview-label">
            ${escapeHtml(p?.name || fid)}
            <label class="req-inline"><input type="checkbox" name="field_required_${escapeHtml(fid)}" data-partition-index="${blockIndex}" ${req ? 'checked' : ''}> 必填</label>
          </label>
          ${inputPreview}
        </div>
      </div>
      <button type="button" class="btn btn-sm structure-field-remove" data-remove-field="${escapeHtml(fid)}" title="移除">×</button>
    </div>`;
  },

  rerenderEmissionSource(sourceEl, blockIndex, blockEl, detail, options = {}) {
    if (!sourceEl || !blockEl) return null;
    const sourceId = sourceEl.dataset.emissionSourceId;
    const saved = options.saved ?? sourceEl.dataset.emissionSaved === '1';
    const fields = [...sourceEl.querySelectorAll('[name="source_field"]')].map(i => i.value).filter(Boolean);
    const block = this.buildBlockFromDom(blockEl);
    block.fields = [...new Set([...block.fields, ...fields])];
    const source = { id: sourceId, fields };
    const html = this.emissionSourceHtml(source, blockIndex, block, detail, { saved });
    sourceEl.outerHTML = html;
    return blockEl.querySelector(`[data-emission-source-id="${sourceId}"]`);
  },

  addParamToEmissionSource(sourceEl, paramId, blockIndex, blockEl, detail) {
    if (sourceEl?.dataset.emissionSaved === '1') return sourceEl;
    const sourceId = sourceEl.dataset.emissionSourceId;
    const currentFields = [...sourceEl.querySelectorAll('[name="source_field"]')].map(i => i.value);
    if (currentFields.includes(paramId)) return sourceEl;
    const newFields = [...currentFields, paramId];
    const block = this.buildBlockFromDom(blockEl);
    block.fields = [...new Set([...block.fields, paramId])];
    const source = { id: sourceId, fields: newFields };
    const html = this.emissionSourceHtml(source, blockIndex, block, detail, { saved: false });
    sourceEl.outerHTML = html;
    return blockEl.querySelector(`[data-emission-source-id="${sourceId}"]`);
  },

  createEmissionSource(blockEl, blockIndex, fields, detail) {
    const sourceId = `es_${fields[0]}_${Date.now().toString(36)}`;
    const block = this.buildBlockFromDom(blockEl);
    block.fields = [...new Set([...block.fields, ...fields])];
    const source = { id: sourceId, fields };
    const list = blockEl.querySelector('.structure-field-list');
    list?.insertAdjacentHTML('beforeend', this.emissionSourceHtml(source, blockIndex, block, detail, { saved: false }));
    return blockEl.querySelector(`[data-emission-source-id="${sourceId}"]`);
  },

  saveEmissionSource(sourceEl, form) {
    if (!sourceEl || sourceEl.dataset.emissionSaved === '1') return;
    const ctx = this.getEmissionSourceContext(sourceEl);
    if (!ctx?.sourceFields?.length) {
      toast('请至少添加一个填报参数', 'warning');
      return;
    }
    const factorId = sourceEl.querySelector(`[name="inline_factor_lib_${ctx.refKey}"]`)?.value?.trim();
    if (!factorId) {
      toast('请先选择排放因子', 'warning');
      return;
    }
    this.syncEmissionRowExpression(sourceEl, form);
    const expr = sourceEl.querySelector(`[name="inline_formula_expr_${ctx.refKey}"]`)?.value?.trim();
    if (!expr) {
      toast('请配置排放量计算公式', 'warning');
      return;
    }
    const result = this.persistStep2Draft({ silent: true });
    if (!result.ok) {
      toast(result.message, 'error');
      return;
    }
    const merged = result.detail;
    const pIndex = Number(ctx.partitionEl?.dataset.partitionIndex) || 0;
    const newEl = this.rerenderEmissionSource(sourceEl, pIndex, ctx.fixedSection, merged, { saved: true });
    this._activeEmissionSourceEl = newEl;
    if (ctx.partitionEl) this.refreshPartitionFormulaBar(ctx.partitionEl, merged);
    this.refreshFormPreview(merged);
    toast('排放源已保存', 'success');
  },

  editEmissionSource(sourceEl, form) {
    if (!sourceEl || sourceEl.dataset.emissionSaved !== '1') return;
    const ctx = this.getEmissionSourceContext(sourceEl);
    const fixedSection = ctx?.fixedSection;
    if (!fixedSection) return;
    if (this.getDraftEmissionSource(fixedSection)) {
      toast('请先保存当前编辑中的排放源', 'warning');
      return;
    }
    const merged = this.readInlineFormulaDetail(form);
    const pIndex = Number(ctx.partitionEl?.dataset.partitionIndex) || 0;
    const newEl = this.rerenderEmissionSource(sourceEl, pIndex, fixedSection, merged, { saved: false });
    this._activeEmissionSourceEl = newEl;
    this.refreshFormPreview(merged);
    toast('已进入编辑模式，修改完成后请再次保存', 'info');
  },

  updateDynamicSectionHead(sectionEl, blockNorm, saved) {
    if (!sectionEl) return;
    const head = sectionEl.querySelector('.structure-section-head');
    if (!head) return;
    head.querySelector('.structure-dynamic-saved-tag')?.remove();
    head.querySelector('.structure-dynamic-draft-tag')?.remove();
    const removeBtn = head.querySelector('[data-remove-section]');
    const statusTag = saved
      ? '<span class="tag tag-success structure-dynamic-saved-tag">已保存</span>'
      : '<span class="tag tag-warning structure-dynamic-draft-tag">编辑中</span>';
    removeBtn?.insertAdjacentHTML('beforebegin', statusTag);
  },

  applyDynamicSectionSavedState(sectionEl, saved) {
    if (!sectionEl) return;
    if (saved) {
      sectionEl.dataset.dynamicSaved = '1';
      delete sectionEl.dataset.dynamicDraft;
    } else {
      sectionEl.dataset.dynamicDraft = '1';
      delete sectionEl.dataset.dynamicSaved;
    }
    sectionEl.classList.toggle('structure-section--dynamic-saved', saved);
    sectionEl.classList.toggle('structure-section--dynamic-draft', !saved);
  },

  rerenderDynamicSection(sectionEl, pIndex, sIndex, detail, options = {}) {
    if (!sectionEl) return sectionEl;
    const saved = !!options.saved;
    const section = this.readDynamicSectionFromDom(sectionEl);
    section.saved = saved;
    const blockNorm = METHOD_CONFIG.normalizeDynamicBlock(section);
    this.applyDynamicSectionSavedState(sectionEl, saved);
    this.updateDynamicSectionHead(sectionEl, blockNorm, saved);
    const sectionKey = `${pIndex}-${sIndex}`;
    const editor = sectionEl.querySelector(`[data-dynamic-editor="${sectionKey}"]`);
    if (editor) {
      editor.outerHTML = this.dynamicBlockBodyHtml(blockNorm, pIndex, sIndex, detail, { saved });
    }
    return sectionEl;
  },

  syncDynamicSectionFormula(sectionEl, form) {
    if (!sectionEl) return;
    const pIndex = Number(sectionEl.closest('[data-partition-row]')?.dataset.partitionIndex) || 0;
    const sIndex = Number(sectionEl.dataset.sectionIndex) || 0;
    const refKey = this.dynamicSectionFormulaRefKey(pIndex, sIndex);
    const visual = sectionEl.querySelector(`[name="inline_formula_display_${refKey}"]`);
    const hidden = sectionEl.querySelector(`[name="inline_formula_expr_${refKey}"]`);
    if (!visual || !hidden) return;
    const amountId = sectionEl.querySelector('[name="block_amountParam"]')?.value?.trim() || '';
    const varietyId = sectionEl.querySelector('[name="block_varietyParam"]')?.value?.trim() || '';
    const ctx = METHOD_CONFIG.patchDynamicFormulaContext(METHOD_CONFIG.buildInlineFormulaContext(
      amountId,
      [amountId, varietyId].filter(Boolean),
      refKey,
      this.getEditContext().detail,
      amountId ? [amountId] : []
    ));
    hidden.value = METHOD_CONFIG.displayFormulaToExpression(visual.value, ctx) || hidden.value;
  },

  saveDynamicSection(sectionEl, form) {
    if (!sectionEl || this.isDynamicSectionSaved(sectionEl)) return;
    const varietyId = sectionEl.querySelector('[name="block_varietyParam"]')?.value?.trim();
    const amountId = sectionEl.querySelector('[name="block_amountParam"]')?.value?.trim();
    if (!varietyId || !amountId) {
      toast('请先选择品种参数与消耗量参数', 'warning');
      return;
    }
    const rows = [...sectionEl.querySelectorAll('[data-preset-row]')];
    if (!rows.length) {
      toast('请先选择品种参数以生成品种行', 'warning');
      return;
    }
    const missingFactor = rows.find(row => !row.querySelector('[name^="inline_factor_lib_"]')?.value?.trim());
    if (missingFactor) {
      toast('请为每个品种行选择排放因子', 'warning');
      return;
    }
    this.syncDynamicSectionFormula(sectionEl, form);
    const pIndex = Number(sectionEl.closest('[data-partition-row]')?.dataset.partitionIndex) || 0;
    const sIndex = Number(sectionEl.dataset.sectionIndex) || 0;
    const refKey = this.dynamicSectionFormulaRefKey(pIndex, sIndex);
    const expr = sectionEl.querySelector(`[name="inline_formula_expr_${refKey}"]`)?.value?.trim();
    if (!expr) {
      toast('请配置排放量计算公式', 'warning');
      return;
    }
    const result = this.persistStep2Draft({ silent: true });
    if (!result.ok) {
      toast(result.message, 'error');
      return;
    }
    const merged = result.detail;
    const partitionEl = sectionEl.closest('[data-partition-row]');
    this.rerenderDynamicSection(sectionEl, pIndex, sIndex, merged, { saved: true });
    if (partitionEl) this.refreshPartitionFormulaBar(partitionEl, merged);
    this.refreshFormPreview(merged);
    toast('排放源已保存', 'success');
  },

  editDynamicSection(sectionEl, form) {
    if (!sectionEl || !this.isDynamicSectionSaved(sectionEl)) return;
    const partitionEl = sectionEl.closest('[data-partition-row]');
    const draft = this.getDraftDynamicSection(partitionEl);
    if (draft && draft !== sectionEl) {
      toast('请先保存当前编辑中的动态行', 'warning');
      return;
    }
    const merged = this.readInlineFormulaDetail(form);
    const pIndex = Number(partitionEl?.dataset.partitionIndex) || 0;
    const sIndex = Number(sectionEl.dataset.sectionIndex) || 0;
    this.rerenderDynamicSection(sectionEl, pIndex, sIndex, merged, { saved: false });
    this.refreshFormPreview(merged);
    toast('已进入编辑模式，修改完成后请再次保存', 'info');
  },

  refreshDynamicSectionBody(sectionEl, pIndex, sIndex, detail) {
    if (!sectionEl) return;
    const partitionEl = sectionEl.closest('[data-partition-row]');
    const form = qs('#tplEditForm');
    const mergedDetail = form ? this.readInlineFormulaDetail(form) : detail;
    const section = this.readDynamicSectionFromDom(sectionEl);
    const saved = this.isDynamicSectionSaved(sectionEl);
    const sectionKey = `${pIndex}-${sIndex}`;
    const editor = sectionEl.querySelector(`[data-dynamic-editor="${sectionKey}"]`);
    if (!editor) return;
    editor.outerHTML = this.dynamicBlockBodyHtml(section, pIndex, sIndex, mergedDetail || detail, { saved });
    this.updateDynamicSectionHead(sectionEl, METHOD_CONFIG.normalizeDynamicBlock(section), saved);
    if (partitionEl) this.refreshPartitionFormulaBar(partitionEl, mergedDetail || detail);
  },

  fixedSectionHtml(section, pIndex, sIndex, detail) {
    const blockNorm = { ...section, fields: section.fields || [] };
    const sources = METHOD_CONFIG.ensureEmissionSources(blockNorm);
    const inSource = METHOD_CONFIG.fieldsInEmissionSources(blockNorm);
    const simpleFields = (blockNorm.fields || []).filter(fid => !inSource.has(fid));
    const simpleRows = simpleFields.map(fid => this.simpleFieldRowHtml(fid, pIndex, blockNorm, detail)).join('');
    const sourceRows = sources.map(s => this.emissionSourceHtml(s, pIndex, blockNorm, detail, {
      saved: s.saved !== false
    })).join('');
    const hasContent = simpleFields.length || sources.length;
    return `<div class="structure-section structure-section--fixed" data-section-row data-section-type="fixed" data-section-index="${sIndex}">
      <div class="structure-section-head">
        <span class="tag tag-info">固定字段</span>
        <span class="text-muted structure-section-hint">从左侧参数库选择参数，追加到当前编辑中的卡片，保存后锁定</span>
        <button type="button" class="btn btn-sm btn-link-danger structure-section-remove" data-remove-section="${pIndex}-${sIndex}" title="移除此固定字段区块">×</button>
      </div>
      <div class="structure-field-drop structure-form-canvas" data-field-drop="${pIndex}-${sIndex}">
        ${hasContent ? '' : '<p class="text-muted structure-empty-hint">从左侧参数库点击参数即可添加，可连续选参直到保存</p>'}
        <div class="structure-field-list">${simpleRows}${sourceRows}</div>
      </div>
    </div>`;
  },

  dynamicSectionHtml(section, pIndex, sIndex, detail) {
    const blockNorm = METHOD_CONFIG.normalizeDynamicBlock(section);
    const label = blockNorm.sectionLabel || '动态行';
    const saved = this.inferDynamicSectionSaved(section);
    const savedAttr = saved ? ' data-dynamic-saved="1"' : ' data-dynamic-draft="1"';
    const stateClass = saved ? ' structure-section--dynamic-saved' : ' structure-section--dynamic-draft';
    const statusTag = saved
      ? '<span class="tag tag-success structure-dynamic-saved-tag">已保存</span>'
      : '<span class="tag tag-warning structure-dynamic-draft-tag">编辑中</span>';
    return `<div class="structure-section structure-section--dynamic${stateClass}" data-section-row data-section-type="dynamic_row" data-section-index="${sIndex}"${savedAttr}>
      <input type="hidden" name="section_label" value="${escapeHtml(label)}">
      <div class="structure-section-head">
        <span class="tag tag-info">动态行</span>
        ${statusTag}
        <button type="button" class="btn btn-sm btn-link-danger structure-section-remove" data-remove-section="${pIndex}-${sIndex}" title="移除此动态行区块">×</button>
      </div>
      ${this.dynamicBlockBodyHtml({ ...blockNorm, saved }, pIndex, sIndex, detail, { saved })}
    </div>`;
  },

  structurePartitionHtml(partition, pIndex, detail) {
    const title = partition.title || '未命名分区';
    const sections = partition.sections || [];
    const sectionsHtml = sections.length
      ? sections.map((s, sIndex) => s.type === 'dynamic_row'
        ? this.dynamicSectionHtml(s, pIndex, sIndex, detail)
        : this.fixedSectionHtml(s, pIndex, sIndex, detail)).join('')
      : '<p class="text-muted structure-partition-empty">请添加固定字段或动态行区块</p>';

    return `<div class="structure-partition card" data-partition-row data-partition-index="${pIndex}">
      <div class="structure-partition-head">
        <span class="tag tag-success">分区</span>
        <div class="structure-partition-title-wrap">
          <input name="partition_title" value="${escapeHtml(title)}" placeholder="分区名称，如：燃料燃烧排放" class="structure-partition-title" aria-describedby="partition-title-hint-${pIndex}">
          <span class="structure-tip-bubble" id="partition-title-hint-${pIndex}">
            <button type="button" class="structure-tip-icon" aria-label="分区名称说明">?</button>
            <span class="structure-tip-popover" role="tooltip">点击输入框可编辑分区名称，如「燃料燃烧排放」「过程排放」等，将用于采集表分组与分项公式命名</span>
          </span>
        </div>
        <div class="structure-partition-actions">
          <button type="button" class="btn btn-sm" data-add-section="fixed" data-partition-index="${pIndex}">+ 固定字段</button>
          <button type="button" class="btn btn-sm" data-add-section="dynamic_row" data-partition-index="${pIndex}">+ 动态行</button>
          <span class="structure-partition-actions-sep" aria-hidden="true"></span>
          <button type="button" class="btn btn-sm" data-move-partition="${pIndex}" data-dir="up">↑</button>
          <button type="button" class="btn btn-sm" data-move-partition="${pIndex}" data-dir="down">↓</button>
          <button type="button" class="btn btn-sm btn-link-danger" data-remove-partition="${pIndex}">删除</button>
        </div>
      </div>
      <div class="structure-partition-body">
        <div class="structure-partition-sections">${sectionsHtml}</div>
      </div>
    </div>`;
  },

  structureBlockHtml(partition, pIndex, detail) {
    return this.structurePartitionHtml(partition, pIndex, detail);
  },

  presetRowHtml(row, blockIndex, rowIndex) {
    return this.dynamicPresetRowHtml(row, blockIndex, rowIndex, {}, {});
  },

  bindBlockEditor(form) {
    if (!form || !qs('#tplBlockList', form)) return;
    this._activePartitionIndex = 0;
    this._activeEmissionSourceEl = null;

    form.addEventListener('click', async (e) => {
      const partitionEl = e.target.closest('[data-partition-row]');
      if (partitionEl) this._activePartitionIndex = Number(partitionEl.dataset.partitionIndex) || 0;

      const sourceEl = e.target.closest('[data-emission-source]');
      if (sourceEl && partitionEl?.contains(sourceEl)) {
        this._activeEmissionSourceEl = sourceEl;
      }

      const libChip = e.target.closest('[data-add-param]');
      if (libChip) {
        this.addFieldToBlock(libChip.dataset.addParam, this._activePartitionIndex);
        return;
      }

      const chip = e.target.closest('[data-insert-inline-formula]');
      if (chip) {
        const refKey = chip.dataset.target;
        const visual = form.querySelector(`[name="inline_formula_display_${refKey}"]`);
        if (!visual) return;
        this.insertAtCursor(visual, chip.dataset.text || '');
        this.syncInlineFormulaFromVisual(visual, form);
        const sourceEl = visual.closest('[data-emission-source]');
        if (sourceEl) this.syncEmissionRowExpression(sourceEl, form);
        const pEl = chip.closest('[data-partition-row]');
        this.refreshPartitionFormulaBar(pEl, this.readInlineFormulaDetail(form));
        return;
      }

      const addSectionBtn = e.target.closest('[data-add-section]');
      if (addSectionBtn) {
        const pIndex = Number(addSectionBtn.dataset.partitionIndex) || 0;
        this.addSection(pIndex, addSectionBtn.dataset.addSection || 'fixed');
        return;
      }

      const saveSourceBtn = e.target.closest('[data-save-emission-source]');
      if (saveSourceBtn) {
        const sourceEl2 = saveSourceBtn.closest('[data-emission-source]');
        this.saveEmissionSource(sourceEl2, form);
        return;
      }

      const editSourceBtn = e.target.closest('[data-edit-emission-source]');
      if (editSourceBtn) {
        const sourceEl2 = editSourceBtn.closest('[data-emission-source]');
        this.editEmissionSource(sourceEl2, form);
        return;
      }

      const saveDynamicBtn = e.target.closest('[data-save-dynamic-section]');
      if (saveDynamicBtn) {
        const sectionEl2 = saveDynamicBtn.closest('[data-section-type="dynamic_row"]');
        this.saveDynamicSection(sectionEl2, form);
        return;
      }

      const editDynamicBtn = e.target.closest('[data-edit-dynamic-section]');
      if (editDynamicBtn) {
        const sectionEl2 = editDynamicBtn.closest('[data-section-type="dynamic_row"]');
        this.editDynamicSection(sectionEl2, form);
        return;
      }

      const rmSource = e.target.closest('[data-remove-emission-source]');
      if (rmSource) {
        const ok = await showConfirmDialog({
          message: '是否确认删除此排放源及其公式配置？',
          danger: true
        });
        if (!ok) return;
        const fixedSection = rmSource.closest('[data-section-type="fixed"]');
        const partitionEl2 = rmSource.closest('[data-partition-row]');
        rmSource.closest('[data-emission-source]')?.remove();
        if (this._activeEmissionSourceEl && !form.contains(this._activeEmissionSourceEl)) {
          this._activeEmissionSourceEl = null;
        }
        const drop = fixedSection?.querySelector('[data-field-drop]');
        if (drop && !drop.querySelector('.structure-field-row, [data-emission-source]')) {
          drop.insertAdjacentHTML('afterbegin', '<p class="text-muted structure-empty-hint">从左侧参数库点击参数即可添加，可连续选参直到保存</p>');
        }
        this.refreshPartitionFormulaBar(partitionEl2, this.readInlineFormulaDetail(form));
        this.persistStep2Draft({ silent: true });
        return;
      }

      const rmSourceParam = e.target.closest('[data-remove-source-param]');
      if (rmSourceParam) {
        const sourceEl2 = rmSourceParam.closest('[data-emission-source]');
        if (sourceEl2?.dataset.emissionSaved === '1') {
          toast('已保存的排放源请先点击「编辑」再修改参数', 'warning');
          return;
        }
        const paramId = rmSourceParam.dataset.removeSourceParam;
        const fields = [...sourceEl2.querySelectorAll('[name="source_field"]')].map(i => i.value).filter(Boolean);
        const fixedSection = rmSourceParam.closest('[data-section-type="fixed"]');
        const partitionEl2 = rmSourceParam.closest('[data-partition-row]');
        const pIndex = Number(partitionEl2?.dataset.partitionIndex) || 0;
        if (fields.length <= 1) {
          const ok = await showConfirmDialog({
            message: '移除最后一个参数将删除整个排放源，是否继续？',
            danger: true
          });
          if (!ok) return;
          sourceEl2.remove();
        } else {
          rmSourceParam.closest('[data-source-param]')?.remove();
          const merged = this.readInlineFormulaDetail(form);
          this._activeEmissionSourceEl = this.rerenderEmissionSource(sourceEl2, pIndex, fixedSection, merged);
        }
        const drop = fixedSection?.querySelector('[data-field-drop]');
        if (drop && !drop.querySelector('.structure-field-row, [data-emission-source]')) {
          drop.insertAdjacentHTML('afterbegin', '<p class="text-muted structure-empty-hint">从左侧参数库点击参数即可添加，可连续选参直到保存</p>');
        }
        this.refreshPartitionFormulaBar(partitionEl2, this.readInlineFormulaDetail(form));
        this.persistStep2Draft({ silent: true });
        return;
      }

      const rmPartition = e.target.closest('[data-remove-partition]');
      if (rmPartition) {
        const ok = await showConfirmDialog({
          message: '是否确认删除该分区及其全部配置？',
          danger: true
        });
        if (!ok) return;
        rmPartition.closest('[data-partition-row]')?.remove();
        this.reindexPartitions(form);
        this.persistStep2Draft({ silent: true });
        return;
      }

      const rmSection = e.target.closest('[data-remove-section]');
      if (rmSection) {
        const ok = await showConfirmDialog({
          message: '是否确认删除该区块？',
          danger: true
        });
        if (!ok) return;
        const sectionEl = rmSection.closest('[data-section-row]');
        const partitionEl2 = sectionEl?.closest('[data-partition-row]');
        sectionEl?.remove();
        if (partitionEl2 && !partitionEl2.querySelector('[data-section-row]')) {
          partitionEl2.querySelector('.structure-partition-sections')?.insertAdjacentHTML(
            'beforeend',
            '<p class="text-muted structure-partition-empty">请添加固定字段或动态行区块</p>'
          );
        }
        this.reindexPartitions(form);
        this.refreshPartitionFormulaBar(partitionEl2, this.readInlineFormulaDetail(form));
        this.persistStep2Draft({ silent: true });
        return;
      }

      const rmField = e.target.closest('[data-remove-field]');
      if (rmField) {
        const partitionEl2 = rmField.closest('[data-partition-row]');
        rmField.closest('.structure-field-row')?.remove();
        const drop = rmField.closest('[data-field-drop]');
        if (drop && !drop.querySelector('.structure-field-row, [data-emission-source]')) {
          drop.insertAdjacentHTML('afterbegin', '<p class="text-muted structure-empty-hint">从左侧参数库点击参数即可添加，可连续选参直到保存</p>');
        }
        this.refreshPartitionFormulaBar(partitionEl2, this.readInlineFormulaDetail(form));
        return;
      }

      const rmPreset = e.target.closest('[data-remove-preset]');
      if (rmPreset) {
        rmPreset.closest('[data-preset-row]')?.remove();
        this.persistStep2Draft({ silent: true });
        return;
      }

      const movePartition = e.target.closest('[data-move-partition]');
      if (movePartition) {
        const row = movePartition.closest('[data-partition-row]');
        const list = qs('#tplBlockList', form);
        if (!row || !list) return;
        if (movePartition.dataset.dir === 'up' && row.previousElementSibling) {
          list.insertBefore(row, row.previousElementSibling);
        } else if (movePartition.dataset.dir === 'down' && row.nextElementSibling) {
          list.insertBefore(row.nextElementSibling, row);
        }
        this.reindexPartitions(form);
        this.persistStep2Draft({ silent: true });
      }
    });

    qs('#tplParamLibFilter', form)?.addEventListener('input', ev => {
      const kw = ev.target.value.trim().toLowerCase();
      qsa('#tplParamLib [data-add-param]', form).forEach(btn => {
        btn.style.display = !kw || btn.textContent.toLowerCase().includes(kw) || (btn.title || '').toLowerCase().includes(kw) ? '' : 'none';
      });
    });

    form.addEventListener('input', e => {
      if (e.target.matches('.inline-formula-visual')) {
        this.syncInlineFormulaFromVisual(e.target, form);
        const sourceEl = e.target.closest('[data-emission-source]');
        if (sourceEl) this.syncEmissionRowExpression(sourceEl, form);
        const partitionEl = e.target.closest('[data-partition-row]');
        this.refreshPartitionFormulaBar(partitionEl, this.readInlineFormulaDetail(form));
        return;
      }
      if (e.target.matches('[name="partition_title"]')) {
        const partitionEl = e.target.closest('[data-partition-row]');
        this.refreshPartitionFormulaBar(partitionEl, this.readInlineFormulaDetail(form));
        return;
      }
      if (e.target.matches('.inline-factor-search')) {
        const sourceEl2 = e.target.closest('[data-emission-source]');
        const refKey = e.target.closest('.inline-factor-picker')?.dataset.refKey;
        if (sourceEl2 && refKey) {
          const panel = sourceEl2.querySelector(`.structure-unit-conversion[data-ref-key="${refKey}"]`);
          if (panel) panel.hidden = true;
        }
      }
    });

    form.addEventListener('change', e => {
      const dynamicFields = ['block_varietyParam', 'block_amountParam'];
      if (!dynamicFields.includes(e.target.name)) return;
      const sectionEl = e.target.closest('[data-section-row][data-section-type="dynamic_row"]');
      if (!sectionEl) return;
      if (this.isDynamicSectionSaved(sectionEl)) return;
      const partitionEl = sectionEl.closest('[data-partition-row]');
      const pIndex = Number(partitionEl?.dataset.partitionIndex) || 0;
      const sIndex = Number(sectionEl?.dataset.sectionIndex) || 0;
      const merged = this.readInlineFormulaDetail(form);
      let section = this.readDynamicSectionFromDom(sectionEl);
      if (e.target.name === 'block_varietyParam' && section.varietyParamId) {
        section.presetRows = METHOD_CONFIG.buildDynamicPresetRows(
          section.varietyParamId,
          [],
          METHOD_CONFIG.getParam(section.amountParamId)
        );
      } else if (e.target.name === 'block_amountParam' && section.varietyParamId) {
        section.presetRows = METHOD_CONFIG.buildDynamicPresetRows(
          section.varietyParamId,
          section.presetRows,
          METHOD_CONFIG.getParam(section.amountParamId)
        );
      }
      this.refreshDynamicSectionBody(sectionEl, pIndex, sIndex, merged);
      if (e.target.name === 'block_varietyParam' && !section.presetRows.length) {
        toast('该参数未配置枚举值，请先在参数管理维护', 'warning');
      }
      this.refreshPartitionFormulaBar(partitionEl, merged);
    });

    qsa('#tplBlockList [data-partition-row]', form).forEach(row => {
      this.refreshPartitionFormulaBar(row, this.readInlineFormulaDetail(form));
    });
    this.refreshFormPreview();
  },

  reindexPartitions(form) {
    qsa('#tplBlockList [data-partition-row]', form).forEach((row, pIndex) => {
      row.dataset.partitionIndex = pIndex;
      row.querySelectorAll('[data-partition-index]').forEach(el => { el.dataset.partitionIndex = pIndex; });
      row.querySelectorAll('[data-add-section]').forEach(el => { el.dataset.partitionIndex = pIndex; });
      row.querySelectorAll('[data-move-partition]').forEach(el => { el.dataset.movePartition = pIndex; });
      qsa('[data-section-row]', row).forEach((sectionEl, sIndex) => {
        sectionEl.dataset.sectionIndex = sIndex;
        const sectionKey = `${pIndex}-${sIndex}`;
        sectionEl.querySelector('[data-remove-section]')?.setAttribute('data-remove-section', sectionKey);
        sectionEl.querySelector('[data-field-drop]')?.setAttribute('data-field-drop', sectionKey);
        sectionEl.querySelector('[data-dynamic-editor]')?.setAttribute('data-dynamic-editor', sectionKey);
        sectionEl.querySelector('[data-preset-body]')?.setAttribute('data-preset-body', sectionKey);
      });
    });
  },

  addFieldToBlock(paramId, partitionIndex) {
    const form = qs('#tplEditForm');
    const partitionEl = form?.querySelector(`[data-partition-row][data-partition-index="${partitionIndex}"]`);
    const fixedSection = this.getFixedSectionEl(partitionEl);
    if (!fixedSection) {
      toast('请先在分区内添加「固定字段」区块', 'warning');
      return;
    }
    const drop = fixedSection.querySelector('[data-field-drop]');
    const list = drop?.querySelector('.structure-field-list');
    if (!drop || !list) return;
    const existingFields = this.getFieldIdsFromBlock(fixedSection);
    if (existingFields.includes(paramId)) return;
    drop.querySelector('.structure-empty-hint')?.remove();

    const { detail } = this.getEditContext();
    const mergedDetail = this.readInlineFormulaDetail(form);
    const p = METHOD_CONFIG.getParam(paramId);
    const scope = [...existingFields, paramId];
    const needsEmission = METHOD_CONFIG.fieldNeedsFactorBinding(paramId, scope, p);

    if (needsEmission) {
      const draft = this.getDraftEmissionSource(fixedSection);
      let targetSource = draft
        || (this._activeEmissionSourceEl
          && fixedSection.contains(this._activeEmissionSourceEl)
          && this._activeEmissionSourceEl.dataset.emissionDraft === '1'
          ? this._activeEmissionSourceEl
          : null);

      if (targetSource) {
        this._activeEmissionSourceEl = this.addParamToEmissionSource(
          targetSource,
          paramId,
          partitionIndex,
          fixedSection,
          mergedDetail
        );
      } else {
        this._activeEmissionSourceEl = this.createEmissionSource(
          fixedSection,
          partitionIndex,
          [paramId],
          mergedDetail
        );
      }
    } else {
      const block = this.buildBlockFromDom(fixedSection);
      block.fields = [...existingFields, paramId];
      const firstSource = list.querySelector('[data-emission-source]');
      const html = this.simpleFieldRowHtml(paramId, partitionIndex, block, detail);
      if (firstSource) {
        firstSource.insertAdjacentHTML('beforebegin', html);
      } else {
        list.insertAdjacentHTML('beforeend', html);
      }
    }
    this.refreshPartitionFormulaBar(partitionEl, this.readInlineFormulaDetail(form));
  },

  addPartition() {
    const list = qs('#tplBlockList');
    if (!list) return;
    const index = list.querySelectorAll('[data-partition-row]').length;
    const { detail } = this.getEditContext();
    const partition = {
      type: 'partition',
      title: '新区块',
      sections: [{ type: 'fixed', fields: [] }]
    };
    list.insertAdjacentHTML('beforeend', this.structurePartitionHtml(partition, index, detail));
    this._activePartitionIndex = index;
    this.persistStep2Draft({ silent: true });
  },

  addSection(partitionIndex, type) {
    const form = qs('#tplEditForm');
    const partitionEl = form?.querySelector(`[data-partition-row][data-partition-index="${partitionIndex}"]`);
    if (!partitionEl) return;
    const { detail } = this.getEditContext();
    const sectionsContainer = partitionEl.querySelector('.structure-partition-sections');
    sectionsContainer?.querySelector('.structure-partition-empty')?.remove();
    const sIndex = sectionsContainer?.querySelectorAll('[data-section-row]').length || 0;
    const section = type === 'dynamic_row'
      ? METHOD_CONFIG.normalizeDynamicBlock({
        type: 'dynamic_row',
        sectionLabel: '动态行',
        varietyParamId: '',
        amountParamId: '',
        presetRows: [],
        saved: false,
        allowAddRow: true,
        allowDeleteRow: true
      })
      : { type: 'fixed', fields: [] };
    const html = type === 'dynamic_row'
      ? this.dynamicSectionHtml(section, partitionIndex, sIndex, detail)
      : this.fixedSectionHtml(section, partitionIndex, sIndex, detail);
    sectionsContainer?.insertAdjacentHTML('beforeend', html);
    this.reindexPartitions(form);
    if (type === 'dynamic_row') {
      const newSection = sectionsContainer?.querySelector('[data-section-row]:last-child');
      if (newSection) this.applyDynamicSectionSavedState(newSection, false);
    }
    this.refreshPartitionFormulaBar(partitionEl, this.readInlineFormulaDetail(form));
  },

  generateFormulasFromStructure() {
    const form = qs('#tplEditForm');
    const { detail } = this.getEditContext();
    let merged = JSON.parse(JSON.stringify(detail));
    if (form) {
      const structure = METHOD_CONFIG.readTemplateStructure(form);
      merged.layout = structure.layout;
      merged.params = structure.params;
    }
    const formulas = METHOD_CONFIG.generateFormulasFromLayout(merged);
    if (!formulas) {
      toast('无法从当前结构生成分项公式，请先配置区块与参数', 'warning');
      return;
    }
    const tbody = qs('#tplFormulaBody');
    if (!tbody) {
      METHOD_CONFIG.saveTemplateDetail({ ...merged, formulas });
      toast(`已生成 ${formulas.length} 条分项/合计公式`, 'success');
      return;
    }
    tbody.innerHTML = formulas.map(f => this.formulaRowHtml(f)).join('');
    toast(`已生成 ${formulas.length} 条分项/合计公式`, 'success');
  },

  bindFormulaBuilder(form) {
    form.addEventListener('focusin', e => {
      if (e.target.matches('[name="formula_expression"]')) {
        this._activeFormulaInput = e.target;
        qsa('.formula-expression-input', form).forEach(el => el.classList.remove('is-active'));
        e.target.classList.add('is-active');
      }
    });
    form.addEventListener('click', e => {
      const chip = e.target.closest('[data-insert]');
      if (!chip || !form.contains(chip)) return;
      const ta = this._activeFormulaInput || form.querySelector('[name="formula_expression"].is-active') || form.querySelector('[name="formula_expression"]');
      if (!ta) {
        toast('请先点击某一行的「表达式」输入框', 'warning');
        return;
      }
      this.insertAtCursor(ta, chip.dataset.insert || '');
    });
    form.addEventListener('change', e => {
      if (e.target.name === 'formula_subtotal') {
        const row = e.target.closest('tr');
        const multi = row?.querySelector('[name="formula_multirow"]');
        if (multi) {
          multi.disabled = !e.target.checked;
          if (!e.target.checked) multi.checked = false;
        }
      }
    });
  },

  bindFactorCards(form) {
    form.addEventListener('change', e => {
      if (e.target.name === 'factor_libraryId') {
        const card = e.target.closest('[data-factor-row]');
        if (!card) return;
        const id = e.target.value;
        if (!id || typeof Store === 'undefined') return;
        const lib = Store.getFactor(id);
        if (!lib) return;
        const def = card.querySelector('[name="factor_defaultValue"]');
        const unitF = card.querySelector('[name="factor_unitFactor"]');
        if (def && !def.value) def.value = String(lib.value ?? lib.factorValue ?? '');
        if (unitF && !unitF.value) unitF.value = lib.unit || lib.factorUnit || '';
        const label = card.querySelector('[name="factor_label"]');
        if (label && !label.value) label.value = lib.name || lib.paramName || '';
      }
      if (e.target.name === 'factor_matchType') {
        const card = e.target.closest('[data-factor-row]');
        const dep = card?.querySelector('[data-factor-depends-wrap]');
        if (dep) dep.hidden = e.target.value === 'fixed';
      }
    });
    form.addEventListener('click', e => {
      const toggle = e.target.closest('[data-toggle-factor-advanced]');
      if (toggle) {
        const panel = toggle.closest('[data-factor-row]')?.querySelector('[data-factor-advanced]');
        if (panel) panel.hidden = !panel.hidden;
      }
    });
  },

  currentDetail(step) {
    const form = qs('#tplEditForm');
    const { detail } = this.getEditContext();
    return METHOD_CONFIG.mergeTemplateStep(detail, step, form);
  },

  persistStep2Draft(options = {}) {
    const form = qs('#tplEditForm');
    if (!form) return { ok: false, message: '表单不存在' };
    const { detail } = this.getEditContext();
    const merged = METHOD_CONFIG.mergeTemplateStep(detail, '2', form);
    const result = METHOD_CONFIG.saveTemplateDetail(merged);
    if (!result.ok) return result;
    result.detail = merged;
    if (options.toast) {
      toast(typeof options.toast === 'string' ? options.toast : '已保存：表单、因子与核算公式已同步', 'success');
    }
    return result;
  },

  saveDraft(step, callback) {
    const form = qs('#tplEditForm');
    if (!form) return;
    const { id, detail } = this.getEditContext();
    let result;
    if (step === '2') {
      result = this.persistStep2Draft({ toast: !callback });
    } else if (step === '3') {
      result = METHOD_CONFIG.saveTemplateDetail(detail);
    } else {
      const merged = METHOD_CONFIG.mergeTemplateStep(detail, step, form);
      if (step === '1' && !METHOD_CONFIG.normalizeTemplateIndustries(merged.meta).length) {
        toast('请至少选择一个适用行业', 'warning');
        return;
      }
      result = METHOD_CONFIG.saveTemplateDetail(merged);
    }
    if (!result.ok) {
      toast(result.message, 'error');
      return;
    }
    if (step === '1') toast(result.message, 'success');
    if (typeof callback === 'function') {
      callback(result);
      return;
    }
    const q = new URLSearchParams((location.hash.split('?')[1] || ''));
    q.set('id', result.id);
    q.set('step', step);
    location.hash = `#/method-config/templates/edit?${q}`;
  },

  runPreviewValidate() {
    const form = qs('#tplEditForm');
    const { detail } = this.getEditContext();
    const merged = form ? METHOD_CONFIG.mergeAllTemplateSteps(detail, form) : detail;
    const v = METHOD_CONFIG.validateTemplate(merged);
    if (v.ok) toast('校验通过，可发布模板', 'success');
    else toast(v.errors[0], 'error');
    route();
  },

  validateFormulas() {
    const { step } = this.getEditContext();
    const detail = this.currentDetail(step);
    const v = METHOD_CONFIG.validateFormulas(detail);
    if (v.ok) toast('公式校验通过：参数与因子引用一致', 'success');
    else toast(v.errors[0], 'error');
  },

  publish() {
    const form = qs('#tplEditForm');
    const { detail } = this.getEditContext();
    let merged = JSON.parse(JSON.stringify(detail));
    if (form) merged = METHOD_CONFIG.mergeAllTemplateSteps(detail, form);
    const result = METHOD_CONFIG.publishTemplate(merged);
    if (!result.ok) {
      toast(result.message, 'error');
      return;
    }
    toast(`模板已发布，版本 ${merged.meta.version}`, 'success');
    location.hash = `#/method-config/templates/edit?id=${encodeURIComponent(detail.meta.id)}&step=3`;
    route();
  },

  async copyFromFlatGlass() {
    const { id, detail } = this.getEditContext();
    const ok = await showConfirmDialog({
      message: '是否确认用「平板玻璃·能源法」样例覆盖当前模板配置（草稿）？',
      detail: '覆盖后当前草稿内容将被替换，请确认后再继续。'
    });
    if (!ok) return;
    const copy = METHOD_CONFIG.copyTemplateDetail(
      'tpl_np_平板玻璃_energy',
      id,
      detail.meta.industry,
      detail.meta.bizType,
      detail.meta.methodId
    );
    if (!copy) {
      toast('复制失败：找不到样例', 'error');
      return;
    }
    METHOD_CONFIG.saveTemplateDetail(copy);
    toast('已从平板玻璃样例复制，请按需修改', 'success');
    const q = new URLSearchParams((location.hash.split('?')[1] || ''));
    q.set('id', id);
    q.set('step', '1');
    location.hash = `#/method-config/templates/edit?${q}`;
    route();
  },

  addFormulaRow() {
    const tbody = qs('#tplFormulaBody');
    if (!tbody) return;
    const idx = tbody.querySelectorAll('tr').length + 1;
    tbody.insertAdjacentHTML('beforeend', this.formulaRowHtml({
      id: `F${idx}`,
      sort: idx,
      name: '',
      expression: '',
      emissionUnit: 'tCO₂e'
    }));
  },

  addFactorRow() {
    const container = qs('#tplFactorBody');
    if (!container) return;
    if (container.querySelector('p.text-muted')) container.innerHTML = '';
    const { detail } = this.getEditContext();
    container.insertAdjacentHTML('beforeend', this.factorCardHtml({}, detail));
  },

  extractFactorsFromFormulas() {
    const form = qs('#tplEditForm');
    const { detail } = this.getEditContext();
    let merged = JSON.parse(JSON.stringify(detail));
    if (form) {
      merged = METHOD_CONFIG.mergeTemplateStep(merged, '4', form);
    }
    const refs = METHOD_CONFIG.extractRefsFromFormulas(merged.formulas);
    const container = qs('#tplFactorBody');
    if (!container) return;
    if (container.querySelector('p.text-muted')) container.innerHTML = '';
    const existing = new Set([...container.querySelectorAll('[name="factor_refKey"]')].map(i => i.value.trim()));
    let added = 0;
    refs.factors.filter(k => !/^F\d+$/.test(k)).forEach(refKey => {
      if (existing.has(refKey)) return;
      container.insertAdjacentHTML('beforeend', this.factorCardHtml({ refKey, label: refKey.replace(/^factor_/, '') }, merged));
      added++;
    });
    toast(added ? `已添加 ${added} 个因子引用` : '没有新的因子引用', added ? 'success' : 'info');
  },

  formulasUsingFactorLabel(detail, refKey) {
    const used = METHOD_CONFIG.formulasUsingFactorRef(detail.formulas, refKey);
    if (!used.length) return '尚未在公式中引用';
    return used.map(f => `${f.id} ${f.name || ''}`.trim()).join('、');
  },

  factorLibrarySelectOptions(selectedId, versionRank) {
    const rank = versionRank != null
      ? METHOD_CONFIG.resolveTemplateFactorVersionRank(versionRank)
      : this.getTemplateFactorVersionRank();
    const opts = METHOD_CONFIG.getFactorLibraryOptions(rank);
    const head = '<option value="">— 从排放因子库选用 —</option>';
    const body = opts.slice(0, 80).map(f =>
      `<option value="${escapeHtml(f.id)}" ${f.id === selectedId ? 'selected' : ''}>${escapeHtml(f.displayLabel)}</option>`
    ).join('');
    return head + body;
  },

  formulaRowHtml(f) {
    const sub = !!f.isSubtotal;
    return `<tr data-formula-row>
      <td><input name="formula_sort" type="number" min="1" value="${f.sort ?? 1}" style="width:56px"></td>
      <td><input name="formula_id" value="${escapeHtml(f.id || '')}" style="width:72px"></td>
      <td><input name="formula_name" value="${escapeHtml(f.name || '')}" placeholder="分项名称"></td>
      <td><textarea name="formula_expression" class="formula-expression-input" rows="2" placeholder="点击下方按钮插入">${escapeHtml(f.expression || '')}</textarea></td>
      <td><input name="formula_unit" value="${escapeHtml(f.emissionUnit || 'tCO₂e')}" style="width:88px"></td>
      <td><input name="formula_activity" value="${escapeHtml(f.activityData || '')}" placeholder="活动数据说明"></td>
      <td style="white-space:nowrap;font-size:12px">
        <label class="radio-chip" title="一类排放子项"><input type="checkbox" name="formula_subtotal" ${sub ? 'checked' : ''}> 分项</label>
        <label class="radio-chip" title="主体总排放 SUM"><input type="checkbox" name="formula_total" ${f.isEntityTotal ? 'checked' : ''}> 合计</label>
        <label class="radio-chip" title="采集页可增删多行"><input type="checkbox" name="formula_multirow" ${f.allowMultiRow ? 'checked' : ''} ${sub ? '' : 'disabled'}> 可增行</label>
      </td>
      <td><button type="button" class="btn btn-sm" data-remove-formula>删除</button></td>
    </tr>`;
  },

  factorCardHtml(b, detail) {
    const matchOpts = [
      ['fixed', '固定因子（品种不变）'],
      ['lookup', '按选项匹配（如电网区域）'],
      ['conditional', '按品种匹配（如燃料类型）']
    ].map(([v, l]) => `<option value="${v}" ${b.matchType === v ? 'selected' : ''}>${l}</option>`).join('');
    const caliberOpts = [
      ['bank', '赤道/我行'],
      ['pbo', '人行口径']
    ].map(([v, l]) => `<option value="${v}" ${(b.caliberTag || 'bank') === v ? 'selected' : ''}>${l}</option>`).join('');
    const usedIn = this.formulasUsingFactorLabel(detail || {}, b.refKey);
    const libId = b.factorSource || '';
    const showDep = (b.matchType || 'fixed') !== 'fixed';
    const refEditable = !b.refKey;
    return `<div class="factor-binding-card" data-factor-row>
      <div class="factor-card-head">
        <code class="factor-card-key">${b.refKey ? `{${escapeHtml(b.refKey)}}` : '新因子引用'}</code>
        <span class="factor-card-used">用于公式：${escapeHtml(usedIn)}</span>
        <button type="button" class="btn btn-sm" data-remove-factor>删除</button>
      </div>
      <div class="form-grid factor-card-body">
        ${refEditable ? `<div class="form-item"><label>引用 key</label><input name="factor_refKey" value="" placeholder="factor_coal"></div>` : `<input type="hidden" name="factor_refKey" value="${escapeHtml(b.refKey || '')}">`}
        <div class="form-item"><label>显示名称</label><input name="factor_label" value="${escapeHtml(b.label || '')}" placeholder="如：煤炭排放因子"></div>
        <div class="form-item"><label>匹配方式</label><select name="factor_matchType">${matchOpts}</select></div>
        <div class="form-item" data-factor-depends-wrap ${showDep ? '' : 'hidden'}><label>依赖采集字段</label><input name="factor_dependsOn" value="${escapeHtml(b.dependsOn || '')}" placeholder="如 P_grid_region"></div>
        <div class="form-item full"><label>从排放因子库选用</label><select name="factor_libraryId">${this.factorLibrarySelectOptions(libId, detail?.meta?.factorVersionRank)}</select></div>
        <div class="form-item"><label>缺省因子值</label><input name="factor_defaultValue" value="${escapeHtml(b.defaultValue ?? '')}" placeholder="未匹配时的默认值"></div>
        <div class="form-item"><label>因子单位</label><input name="factor_unitFactor" value="${escapeHtml(b.unitFactor || '')}" placeholder="tCO₂/t"></div>
        <div class="form-item full">
          <button type="button" class="btn btn-sm btn-link" data-toggle-factor-advanced>高级设置（口径、换算等）</button>
        </div>
        <div class="form-item full factor-card-advanced" data-factor-advanced hidden>
          <div class="form-grid">
            <div class="form-item"><label>活动数据单位</label><input name="factor_unitActivity" value="${escapeHtml(b.unitActivity || '')}"></div>
            <div class="form-item"><label>单位换算</label><input name="factor_unitConversion" value="${escapeHtml(b.unitConversion || '')}"></div>
            <div class="form-item"><label>口径</label><select name="factor_caliberTag">${caliberOpts}</select></div>
            <div class="form-item full"><label>匹配示例</label><input name="factor_lookupExamples" value="${escapeHtml(b.lookupExamples || '')}" placeholder="华北电网 0.6361"></div>
            <div class="form-item full"><label>备注</label><input name="factor_note" value="${escapeHtml(b.note || '')}"></div>
          </div>
        </div>
      </div>
    </div>`;
  },

  /** @deprecated 保留兼容 */
  factorRowHtml(b) {
    return this.factorCardHtml(b, {});
  }
};
