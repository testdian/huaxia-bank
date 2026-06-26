/** 计算方法配置 — 模板编辑交互 */
window.MethodConfigEditor = {
  _activeFormulaInput: null,

  getEditContext() {
    const q = new URLSearchParams((location.hash.split('?')[1] || ''));
    const step = q.get('step') || '1';
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

    qs('#tplSaveDraftBtn')?.addEventListener('click', () => this.saveDraft(ctx.step));
    qs('#tplPublishBtn')?.addEventListener('click', () => this.publish());
    qs('#formulaValidateBtn')?.addEventListener('click', () => this.validateFormulas());
    qs('#tplAddFormulaBtn')?.addEventListener('click', () => this.addFormulaRow());
    qs('#tplAddFactorBtn')?.addEventListener('click', () => this.addFactorRow());
    qs('#tplExtractFactorsBtn')?.addEventListener('click', () => this.extractFactorsFromFormulas());
    qs('#tplCopyFlatGlassBtn')?.addEventListener('click', () => this.copyFromFlatGlass());

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

  saveDraft(step) {
    const form = qs('#tplEditForm');
    if (!form) return;
    const { id, detail } = this.getEditContext();
    const merged = METHOD_CONFIG.mergeTemplateStep(detail, step, form);
    const result = METHOD_CONFIG.saveTemplateDetail(merged);
    if (!result.ok) {
      toast(result.message, 'error');
      return;
    }
    toast(result.message, 'success');
    const q = new URLSearchParams((location.hash.split('?')[1] || ''));
    q.set('id', result.id);
    q.set('step', step);
    location.hash = `#/method-config/templates/edit?${q}`;
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
    const { step, detail } = this.getEditContext();
    let merged = JSON.parse(JSON.stringify(detail));
    if (form) merged = METHOD_CONFIG.mergeTemplateStep(merged, step, form);
    const result = METHOD_CONFIG.publishTemplate(merged);
    if (!result.ok) {
      toast(result.message, 'error');
      return;
    }
    toast(`模板已发布，版本 ${detail.meta.version}`, 'success');
    location.hash = `#/method-config/templates/edit?id=${encodeURIComponent(detail.meta.id)}&step=1`;
    route();
  },

  copyFromFlatGlass() {
    const { id, detail } = this.getEditContext();
    if (!confirm('将用「平板玻璃·能源法」样例覆盖当前模板配置（草稿），确定？')) return;
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
    const { step, detail } = this.getEditContext();
    const merged = METHOD_CONFIG.mergeTemplateStep(
      METHOD_CONFIG.mergeTemplateStep(detail, step, form),
      '2',
      form
    );
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

  factorLibrarySelectOptions(selectedId) {
    const opts = METHOD_CONFIG.getFactorLibraryOptions();
    const head = '<option value="">— 从排放因子库选用 —</option>';
    const body = opts.slice(0, 80).map(f =>
      `<option value="${escapeHtml(f.id)}" ${f.id === selectedId ? 'selected' : ''}>${escapeHtml(f.name)} · ${escapeHtml(String(f.value))} ${escapeHtml(f.unit)}</option>`
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
        <div class="form-item full"><label>从排放因子库选用</label><select name="factor_libraryId">${this.factorLibrarySelectOptions(libId)}</select></div>
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
