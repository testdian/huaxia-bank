/** SPA 入口与路由 */
let formalIndustryEditMode = false;

const ROUTE_TITLES = {
  '#/tasks': '核算任务管理',
  '#/task-create': '新建核算任务',
  '#/task-edit': '编辑核算任务',
  '#/task-view': '查看核算任务',
  '#/task-detail': '任务详情',
  '#/candidates': '候选业务清单',
  '#/formal': '正式清单确认',
  '#/boundary': '核算对象与边界',
  '#/data-collect': '数据采集',
  '#/branch-board': '数据采集',
  '#/manager-tasks': '客户经理任务',
  '#/supplement-fill': '在线收集填报',
  '#/approval-review': '数据审核详情',
  '#/approvals': '数据审核',
  '#/ledger': '台账管理',
  '#/ledger/detail': '排放计算清单',
  '#/factors': '排放因子库',
  '#/factors/new': '新增排放因子',
  '#/factors/edit': '编辑排放因子',
  '#/factors/import': '导入因子',
  '#/calculation': '碳排放计算',
  '#/results': '核算结果查询',
  '#/reports': '生成报告',
  '#/interfaces': '接口管理',
  '#/carbon-accounts': '企业碳账户',
  '#/carbon-account': '碳账户详情',
  '#/method-config/params': '参数管理',
  '#/method-config/params/new': '新增参数',
  '#/method-config/params/edit': '编辑参数',
  '#/method-config/templates': '模版配置',
  '#/method-config/templates/new': '新建核算模板',
  '#/method-config/templates/edit': '编辑核算模板',
  '#/industry-config': '行业配置',
  '#/permission-mgmt': '权限管理'
};

function syncRouteTaskContext() {
  const hash = location.hash || '';
  const base = hash.split('?')[0];
  const params = new URLSearchParams(hash.split('?')[1] || '');
  let taskId = params.get('taskId');
  if (!taskId && ['#/task-edit', '#/task-view', '#/task-detail'].includes(base)) {
    taskId = params.get('id');
  }
  if (taskId && Store.getTask(taskId)) {
    Store.update(d => { d.currentTaskId = taskId; });
  }
}

function route() {
  syncRouteTaskContext();
  const roleKey = Store.get().currentRole;
  let hash = location.hash || getDefaultRouteForRole(roleKey);
  let base = hash.split('?')[0];
  if (!isRouteAllowedForRole(base, roleKey)) {
    const fallback = getDefaultRouteForRole(roleKey);
    if (fallback !== base) {
      location.hash = fallback;
      return;
    }
  }
  if (base === '#/method-config' || base === '#/method-config/guide' || base === '#/methods') {
    location.hash = '#/method-config/templates';
    return;
  }
  if (base === '#/method-config/versions') {
    location.hash = '#/method-config/templates';
    return;
  }
  if (base === '#/reports') {
    const tid = Store.get().currentTaskId;
    const t = Store.getTask(tid);
    if (!isTaskViewMode() && tid && t && (t.workflowStep ?? 0) < WORKFLOW_STEP.REPORT && !t.resultsConfirmed) {
      toast('请先在排放计算页点击「一键提交数据」', 'warning');
      location.hash = '#/calculation?taskId=' + encodeURIComponent(tid);
      return;
    }
  }
  const title = (() => {
    if (base === '#/method-config/templates/edit') {
      const mode = new URLSearchParams((location.hash.split('?')[1] || '')).get('mode');
      if (mode === 'view') return '查看核算模板';
    }
    return ROUTE_TITLES[base] || '投融资碳核算';
  })();
  const ctx = renderSpaLayout(title);
  const activeTaskId = ctx.task?.id || Store.get().currentTaskId;
  if (activeTaskId && !isTaskViewMode()) {
    Store.ensureCalculationStepDeadlinePolicy(activeTaskId);
  }
  const fn = SPA_VIEWS[base] || SPA_VIEWS['#/tasks'];
  const root = document.getElementById('viewRoot');
  if (!root) return;
  if (base === '#/supplement-fill') {
    const sid = new URLSearchParams((location.hash.split('?')[1] || '')).get('id') || 'S002';
    const s0 = Store.get().supplements.find(x => x.id === sid);
    if (s0?.formalId) Store.syncSupplementInterfacePrefill(s0.taskId, s0.formalId);
  }
  if (base === '#/calculation' && !isTaskViewMode() && ctx.task?.id) {
    Store.syncCalculationsFromDataCollect(ctx.task.id);
  }
  if (base === '#/data-collect' && !isTaskViewMode() && ctx.task?.id) {
    Store.syncCalculationsFromDataCollect(ctx.task.id);
  }
  if (base !== '#/formal') formalIndustryEditMode = false;
  if (base === '#/formal') ctx.industryEditMode = formalIndustryEditMode;
  root.innerHTML = fn(ctx);
  dismissSpaOverlays();
  bindPageEvents(base, ctx);
  if (typeof BatchImportDevSpec !== 'undefined') {
    BatchImportDevSpec.bindBatchImportDevHints(root);
  }
  if (typeof SupplementEmissionDevSpec !== 'undefined') {
    SupplementEmissionDevSpec.bindSupplementEmissionDevHint(root);
  }
  if (typeof bindCalculationStepDevSpec === 'function') {
    bindCalculationStepDevSpec(root);
  }
  document.title = title + ' - 华夏银行投融资碳核算';
}

function bindParamFormFormatPanels() {
  const form = qs('#paramForm');
  if (!form) return;
  const typeToPanel = { '数值型': 'number', '文本型': 'text', '选项型': 'option', '日期型': 'date', '附件型': 'attachment' };
  const sync = () => {
    const paramType = form.querySelector('[name="paramType"]')?.value || '数值型';
    const fmt = typeToPanel[paramType] || 'number';
    form.querySelectorAll('[data-format-panel]').forEach(el => {
      el.hidden = el.dataset.formatPanel !== fmt;
    });
    const unitsPanel = form.querySelector('#paramUnitsPanel');
    if (unitsPanel) {
      unitsPanel.hidden = !(fmt === 'number' || fmt === 'option');
    }
  };
  form.addEventListener('change', e => {
    if (e.target.name === 'paramType') sync();
  });
  sync();
  bindParamUnitsCombo();
  bindParamIndustryCombo();
  bindEnumTagInput();
}

function resolveMethodIdFromName(nameOrId) {
  if (!nameOrId) return nameOrId;
  const methods = (typeof GUIDE !== 'undefined' && GUIDE.METHODS) ? GUIDE.METHODS : [];
  const byId = methods.find(m => m.id === nameOrId);
  if (byId) return byId.id;
  const byName = methods.find(m => m.name === nameOrId);
  if (byName) return byName.id;
  return nameOrId;
}

function syncMethodCollectHintForWrap(wrap) {
  if (!wrap || typeof METHOD_CONFIG === 'undefined') return;
  const input = wrap.querySelector('.method-combo-input');
  const hintEl = wrap.parentElement?.querySelector('[data-method-collect-hint]')
    || wrap.closest('.form-item')?.querySelector('[data-method-collect-hint]');
  if (!input || !hintEl) return;
  const methodId = resolveMethodIdFromName((input.value || '').trim());
  const hint = METHOD_CONFIG.getMethodCollectHint(methodId);
  if (!hint) {
    hintEl.hidden = true;
    hintEl.innerHTML = '';
    return;
  }
  hintEl.hidden = false;
  hintEl.innerHTML = `<strong>${escapeHtml(hint.title)}</strong><p>${escapeHtml(hint.text)}</p>`;
}

/** 绑定核算方法 combobox（模板新建/编辑） */
function bindMethodCombo() {
  qsa('.method-combo-wrap').forEach(wrap => {
    if (wrap.dataset.bound === '1') return;
    wrap.dataset.bound = '1';
    const field = wrap.querySelector('.method-combo-field');
    const input = wrap.querySelector('.method-combo-input');
    const dropdown = wrap.querySelector('.method-combo-dropdown');
    const arrow = wrap.querySelector('.param-units-drop-arrow');
    if (!field || !input || !dropdown) return;
    const syncHint = () => syncMethodCollectHintForWrap(wrap);
    let open = false;
    const openDrop = () => {
      open = true;
      dropdown.style.display = 'block';
      if (arrow) arrow.textContent = '▲';
    };
    const closeDrop = () => {
      open = false;
      dropdown.style.display = 'none';
      if (arrow) arrow.textContent = '▼';
    };
    field.addEventListener('click', (e) => {
      if (e.target === input) return;
      if (open) closeDrop(); else openDrop();
      input.focus();
    });
    input.addEventListener('focus', () => { if (!open) openDrop(); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrop(); });
    wrap.querySelectorAll('.method-combo-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        input.value = opt.dataset.value || opt.textContent.trim();
        closeDrop();
        syncHint();
      });
    });
    input.addEventListener('input', syncHint);
    syncHint();
    document.addEventListener('click', function onOutside(e) {
      if (!wrap.isConnected) {
        document.removeEventListener('click', onOutside);
        return;
      }
      if (!wrap.contains(e.target)) closeDrop();
    });
  });
}

function resolveImportStatus(added, total, errors) {
  if (added === total && !errors?.length) return 'success';
  if (added > 0) return 'partial';
  return 'failed';
}

function openParamBatchImportModal() {
  BatchImportModal.open({
    title: '导入',
    step1Text: '1、请下载参数导入模板，按模板格式填写参数信息',
    step2Text: BATCH_IMPORT_STEP2_TEXT,
    accept: BATCH_IMPORT_ACCEPT,
    onDownloadTemplate: () => METHOD_CONFIG.downloadParamImportTemplate(),
    getHistory: () => Store.getParamImportHistory(),
    getRecord: (id) => Store.getParamImportRecord(id),
    onConfirm: async (file, onDone) => {
      try {
        const text = await readBatchImportFileAsText(file);
        const result = METHOD_CONFIG.importParamsFromCsv(text);
        const total = result.added + result.skipped + (result.errors?.length || 0);
        const status = resolveImportStatus(result.added, Math.max(total, result.added), result.errors);
        Store.recordParamImportHistory({
          fileName: file.name,
          total: total || result.added,
          imported: result.added,
          errorCount: result.errors?.length || 0,
          status,
          reason: result.errors?.slice(0, 3).join('；') || '',
          errorReport: result.errors?.join('\n') || '',
          dataStatus: result.added ? '已入库' : '—'
        });
        const parts = [`成功导入 ${result.added} 条`];
        if (result.skipped) parts.push(`跳过 ${result.skipped} 条`);
        if (result.errors?.length) parts.push(`${result.errors.length} 条失败`);
        toast(parts.join('，'), result.added ? 'success' : 'warning');
        if (typeof onDone === 'function') onDone();
        route();
      } catch (err) {
        toast(err.message || '读取文件失败', 'warning');
      }
    }
  });
}

function openIndustryBatchImportModal() {
  BatchImportModal.open({
    title: '导入',
    step1Text: '1、请下载行业配置导入模板，按模板格式填写行业信息',
    step2Text: BATCH_IMPORT_STEP2_TEXT,
    accept: BATCH_IMPORT_ACCEPT,
    onDownloadTemplate: () => IndustryConfig.downloadImportTemplate(),
    getHistory: () => Store.getIndustryImportHistory(),
    getRecord: (id) => Store.getIndustryImportRecord(id),
    onConfirm: async (file, onDone) => {
      try {
        const text = await readBatchImportFileAsText(file);
        const result = IndustryConfig.importFromCsv(text);
        const total = result.added + result.skipped + (result.errors?.length || 0);
        const status = resolveImportStatus(result.added, Math.max(total, result.added), result.errors);
        Store.recordIndustryImportHistory({
          fileName: file.name,
          total: total || result.added,
          imported: result.added,
          errorCount: result.errors?.length || 0,
          status,
          reason: result.errors?.slice(0, 3).join('；') || (result.skipped ? `跳过重复 ${result.skipped} 条` : ''),
          errorReport: result.errors?.join('\n') || '',
          dataStatus: result.added ? '已入库' : '—'
        });
        const parts = [`成功导入 ${result.added} 条`];
        if (result.skipped) parts.push(`跳过重复 ${result.skipped} 条`);
        if (result.errors?.length) parts.push(`${result.errors.length} 条失败`);
        toast(parts.join('，'), result.added ? 'success' : 'warning');
        if (typeof onDone === 'function') onDone();
        route();
      } catch (err) {
        toast(err.message || '读取文件失败', 'warning');
      }
    }
  });
}

function openFactorBatchImportModal() {
  BatchImportModal.open({
    title: '导入',
    step1Text: '1、请下载排放因子导入模板，按模板格式填写因子信息',
    step2Text: BATCH_IMPORT_STEP2_TEXT,
    accept: BATCH_IMPORT_ACCEPT,
    onDownloadTemplate: () => downloadFactorImportTemplate(),
    getHistory: () => Store.getFactorImportHistory(),
    getRecord: (id) => Store.getFactorImportRecord(id),
    onConfirm: async (file, onDone) => {
      await handleFactorImportFile(file, { stayOnPage: true, keepModal: true });
      if (typeof onDone === 'function') onDone();
    }
  });
}

/** 将核算方法名称反查为 id，未匹配时直接返回输入值（自定义方法） */
function resolveMethodIdFromName(nameOrId) {
  if (!nameOrId) return nameOrId;
  const methods = (typeof GUIDE !== 'undefined' && GUIDE.METHODS) ? GUIDE.METHODS : [];
  const byId = methods.find(m => m.id === nameOrId);
  if (byId) return byId.id;
  const byName = methods.find(m => m.name === nameOrId);
  if (byName) return byName.id;
  return nameOrId;
}

function bindEnumTagInput() {
  const wrap = qs('#enumTagsWrap');
  const hidden = qs('#enumValuesCombined');
  const listEl = qs('#enumTagsList');
  const input = qs('#enumTagInput');
  if (!wrap || !hidden || !listEl || !input) return;

  let items = hidden.value ? hidden.value.split(';').map(s => s.trim()).filter(Boolean) : [];

  function syncHidden() { hidden.value = items.join(';'); }

  function renderTags() {
    qsa('.enum-tag', listEl).forEach(el => el.remove());
    items.forEach((v, i) => {
      const span = document.createElement('span');
      span.className = 'enum-tag';
      span.draggable = true;
      span.dataset.idx = i;
      span.innerHTML = `${escapeHtml(v)}<button type="button" class="enum-tag-remove" aria-label="删除">×</button>`;
      span.querySelector('.enum-tag-remove').onclick = (e) => {
        e.stopPropagation();
        items.splice(i, 1);
        syncHidden(); renderTags();
      };
      span.addEventListener('dragstart', (e) => {
        if (e.target.closest('.enum-tag-remove')) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(i));
        span.classList.add('enum-tag--dragging');
      });
      span.addEventListener('dragend', () => {
        span.classList.remove('enum-tag--dragging');
        qsa('.enum-tag', listEl).forEach(el => el.classList.remove('enum-tag--drag-over'));
      });
      span.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        span.classList.add('enum-tag--drag-over');
      });
      span.addEventListener('dragleave', () => {
        span.classList.remove('enum-tag--drag-over');
      });
      span.addEventListener('drop', (e) => {
        e.preventDefault();
        span.classList.remove('enum-tag--drag-over');
        const from = Number(e.dataTransfer.getData('text/plain'));
        const to = i;
        if (Number.isNaN(from) || from === to || from < 0 || from >= items.length) return;
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        syncHidden();
        renderTags();
      });
      listEl.insertBefore(span, input);
    });
  }

  function addItem(val) {
    const v = val.trim();
    if (!v || items.includes(v)) return false;
    items.push(v);
    syncHidden(); renderTags();
    return true;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ';' || e.key === '；') {
      e.preventDefault();
      if (addItem(input.value)) input.value = '';
    } else if (e.key === 'Backspace' && !input.value && items.length) {
      items.pop();
      syncHidden(); renderTags();
    }
  });

  input.addEventListener('input', () => {
    const v = input.value;
    if (v.endsWith(';') || v.endsWith('；')) {
      const raw = v.slice(0, -1);
      if (addItem(raw)) input.value = '';
    }
  });

  wrap.addEventListener('click', () => input.focus());
  renderTags();
}

function bindParamIndustryCombo() {
  bindIndustryCombo({ prefix: 'param', multiple: true });
}

function bindMethodConfigIndustryCombo({ prefix, includeOtherAll = false }) {
  bindIndustryCombo({ prefix, multiple: true, includeOtherAll });
}

function bindTemplateIndustryCombo() {
  bindMethodConfigIndustryCombo({ prefix: 'tplMeta', includeOtherAll: true });
  bindMethodConfigIndustryCombo({ prefix: 'tplCreate', includeOtherAll: true });
}

function bindParamUnitsCombo() {
  const wrap = qs('#paramUnitsComboWrap');
  const hidden = qs('#paramUnitsCombined');
  const field = qs('#paramUnitsComboField');
  const tagsEl = qs('#paramUnitsTags');
  const dropdown = qs('#paramUnitsDropdown');
  const optionsEl = qs('#paramUnitsOptions');
  const inlineInput = qs('#paramUnitsInlineInput');
  const customInput = qs('#paramUnitsCustomInput');
  const arrow = qs('#paramUnitsDropArrow');
  if (!wrap || !hidden || !field || !tagsEl || !dropdown || !optionsEl) return;

  const presetOptions = METHOD_CONFIG.PARAM_UNIT_OPTIONS || [];
  let selected = [];
  try {
    const parsed = JSON.parse(hidden.value || '[]');
    selected = Array.isArray(parsed) ? parsed.map(u => String(u).trim()).filter(Boolean) : [];
  } catch (_) {
    selected = [];
  }
  let dropOpen = false;

  function syncHidden() {
    hidden.value = JSON.stringify(selected);
  }

  function addUnit(unit) {
    const val = String(unit || '').trim();
    if (!val || selected.includes(val)) return false;
    selected.push(val);
    syncHidden();
    renderTags();
    renderOptions();
    return true;
  }

  function removeUnit(unit) {
    selected = selected.filter(u => u !== unit);
    syncHidden();
    renderTags();
    renderOptions();
  }

  function renderTags() {
    tagsEl.innerHTML = selected.map(unit => `
      <span class="param-units-tag">
        ${escapeHtml(unit)}
        <button type="button" class="param-units-tag-remove" data-unit="${escapeHtml(unit)}" aria-label="移除">×</button>
      </span>
    `).join('');
    qsa('.param-units-tag-remove', tagsEl).forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        removeUnit(btn.dataset.unit);
      };
    });
  }

  function renderOptions() {
    const presetSet = new Set(presetOptions);
    const customSelected = selected.filter(u => !presetSet.has(u));
    const optionItems = [
      ...presetOptions.map(u => ({ unit: u, preset: true })),
      ...customSelected.map(u => ({ unit: u, preset: false }))
    ];
    if (!optionItems.length) {
      optionsEl.innerHTML = '<div class="param-units-empty">暂无可选单位</div>';
      return;
    }
    optionsEl.innerHTML = optionItems.map(({ unit, preset }) => {
      const isSel = selected.includes(unit);
      return `<div class="param-units-option${isSel ? ' is-selected' : ''}" data-unit="${escapeHtml(unit)}">
        <span class="param-units-option-check">${isSel ? '✓' : ''}</span>
        <span>${escapeHtml(unit)}</span>
        ${preset ? '' : '<span class="param-units-option-custom">自定义</span>'}
      </div>`;
    }).join('');
    qsa('.param-units-option', optionsEl).forEach(opt => {
      opt.onclick = (e) => {
        e.stopPropagation();
        const unit = opt.dataset.unit;
        if (selected.includes(unit)) removeUnit(unit);
        else addUnit(unit);
      };
    });
  }

  function openDropdown() {
    dropOpen = true;
    dropdown.style.display = 'block';
    if (arrow) arrow.textContent = '▲';
    renderOptions();
    setTimeout(() => customInput?.focus(), 30);
  }

  function closeDropdown() {
    dropOpen = false;
    dropdown.style.display = 'none';
    if (arrow) arrow.textContent = '▼';
  }

  function commitInputValue(input) {
    const raw = (input?.value || '').trim();
    if (!raw) return;
    const parts = typeof METHOD_CONFIG.parseUnitsInput === 'function'
      ? METHOD_CONFIG.parseUnitsInput(raw)
      : raw.split(/[,，、;；\s]+/).map(s => s.trim()).filter(Boolean);
    parts.forEach(addUnit);
    if (input) input.value = '';
  }

  field.onclick = (e) => {
    if (e.target.closest('.param-units-tag-remove')) return;
    if (dropOpen) closeDropdown();
    else openDropdown();
    inlineInput?.focus();
  };
  inlineInput?.addEventListener('focus', () => { if (!dropOpen) openDropdown(); });
  inlineInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInputValue(inlineInput);
    } else if (e.key === 'Backspace' && !inlineInput.value && selected.length) {
      removeUnit(selected[selected.length - 1]);
    }
  });
  customInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInputValue(customInput);
    }
  });

  document.addEventListener('click', function onOutside(e) {
    if (!wrap.contains(e.target)) closeDropdown();
    if (!qs('#paramUnitsComboWrap')) document.removeEventListener('click', onOutside);
  });

  renderTags();
  renderOptions();
  syncHidden();
}

function dismissSpaOverlays() {
  qsa('.modal-overlay.show, .drawer-overlay.show').forEach(el => el.classList.remove('show'));
  document.body.classList.remove('drawer-open');
}

function bindTaskCreatePage() {
  const btn = document.getElementById('saveTaskBtn');
  if (btn) {
    btn.type = 'button';
    btn.addEventListener('click', () => {
      const f = document.getElementById('taskForm');
      if (!validateTaskForm(f)) return;
      const payload = readTaskFormPayload(f);
      if (!payload.investIndustryCodes?.length) {
        toast('投向行业范围请至少选择一项行业', 'warning');
        return;
      }
      if (!payload.industryCodes?.length) {
        toast('所属行业范围请至少选择一项行业', 'warning');
        return;
      }
      if (!payload.branches.length) {
        toast('组织范围请至少选择全行或一个一级分行', 'warning');
        return;
      }
      const id = 'T' + Date.now();
      Store.addTask({
        id,
        ...payload,
        balanceThreshold: 500, accountingPeriod: '自然年度',
        status: 'running', progress: 10, candidateCount: 0, formalCount: 0,
        supplementDone: 0, supplementTotal: 0, approvalStatus: 'none',
        syncedFromInterface: false,
        workflowStep: WORKFLOW_STEP.CANDIDATES,
        createdAt: new Date().toISOString().slice(0, 10),
        createdBy: Store.get().currentUser
      });
      Store.update(d => { d.currentTaskId = id; });
      toast('任务已创建，请进入「清单识别」从接口同步台账后再筛选', 'success');
      location.hash = '#/candidates';
    });
  }

  bindTaskIndustryScopeToggle();
  bindTaskOrgScopeToggle();
  bindTaskYearStepper(qs('#viewRoot'));
  bindTaskDeadlineValidation(qs('#viewRoot'));
}

async function handleMethodConfigParamListClick(e) {
  if (location.hash.split('?')[0] !== '#/method-config/params') return;
  const copyBtn = e.target.closest('[data-param-copy]');
  if (copyBtn) {
    const id = copyBtn.dataset.paramCopy;
    if (!id) return;
    const result = METHOD_CONFIG.copyParam(id);
    if (!result.ok) {
      toast(result.message, 'error');
      return;
    }
    toast(`已复制为「${result.param?.name || '副本'}」`, 'success');
    route();
    return;
  }
  const delBtn = e.target.closest('[data-param-delete]');
  if (delBtn) {
    const id = delBtn.dataset.paramDelete;
    if (!id) return;
    const ok = await showConfirmDialog({
      message: `是否确认删除参数「${id}」？`,
      detail: '若已被模板引用将无法删除。',
      danger: true
    });
    if (!ok) return;
    const result = METHOD_CONFIG.deleteParam(id);
    if (!result.ok) {
      alert(result.message);
      return;
    }
    toast(result.message, 'success');
    route();
    return;
  }
  const toggleBtn = e.target.closest('[data-param-toggle]');
  if (toggleBtn) {
    const result = METHOD_CONFIG.toggleParamStatus(toggleBtn.dataset.paramToggle);
    toast(result.message, result.ok ? 'success' : 'error');
    if (result.ok) route();
  }
}

async function handleMethodConfigTemplateListClick(e) {
  if (location.hash.split('?')[0] !== '#/method-config/templates') return;
  const copyBtn = e.target.closest('[data-tpl-copy]');
  if (copyBtn) {
    const result = METHOD_CONFIG.copyTemplateAsDraft(copyBtn.dataset.tplCopy);
    toast(result.message, result.ok ? 'success' : 'error');
    if (result.ok) {
      location.hash = `#/method-config/templates/edit?id=${encodeURIComponent(result.id)}&step=1`;
    }
    return;
  }
  const delBtn = e.target.closest('[data-tpl-delete]');
  if (delBtn) {
    const tpl = METHOD_CONFIG.templates.find(t => t.id === delBtn.dataset.tplDelete);
    const isPublished = tpl?.status === 'published';
    const isDraft = tpl?.status === 'draft';
    let message = '是否确认删除该模板？';
    let detail = '';
    if (isPublished) {
      message = '是否确认删除该已发布模板？';
      detail = '删除后不可恢复；历史数据采集仍绑定原发布版本，不受影响。';
    } else if (isDraft) {
      message = '是否确认删除该草稿模板？';
    }
    const ok = await showConfirmDialog({
      message,
      detail,
      danger: true
    });
    if (!ok) return;
    const result = METHOD_CONFIG.deleteTemplate(delBtn.dataset.tplDelete);
    toast(result.message, result.ok ? 'success' : 'error');
    if (result.ok) route();
    return;
  }
}

function ensureMethodConfigListClickHandlers() {
  const root = document.getElementById('viewRoot');
  if (!root) return;
  if (root.dataset.methodConfigParamListClick !== '1') {
    root.dataset.methodConfigParamListClick = '1';
    root.addEventListener('click', handleMethodConfigParamListClick);
  }
  if (root.dataset.methodConfigTplListClick !== '1') {
    root.dataset.methodConfigTplListClick = '1';
    root.addEventListener('click', handleMethodConfigTemplateListClick);
  }
}

function bindPageEvents(base, ctx) {
  ensureMethodConfigListClickHandlers();
  const taskId = ctx?.task?.id ?? '';
  let paginationHook = null;
  const viewOnly = isTaskViewMode();

  if (base === '#/tasks') {
    qs('#taskFilterBtn')?.addEventListener('click', () => {
      saveTaskFilters({
        name: qs('#tf_name')?.value || '',
        year: qs('#tf_year')?.value || '',
        dataIndustryScope: qs('#tf_data_industry')?.value || '',
        progress: qs('#tf_progress')?.value ?? ''
      });
      setListPage('tasks', 1);
      route();
    });
    qs('#taskFilterResetBtn')?.addEventListener('click', () => {
      saveTaskFilters({});
      setListPage('tasks', 1);
      route();
    });
    qsa('.task-delete-btn').forEach(btn => {
      btn.onclick = () => confirmDeleteTask(btn.dataset.id, btn.dataset.name);
    });
    if (typeof TableColumnResize !== 'undefined') {
      TableColumnResize.init(qs('#viewRoot .table-col-resizable'), 'tasks_col_widths');
    }
  }

  if (base === '#/task-create') {
    bindTaskCreatePage();
  }

  if (base === '#/task-edit') {
    bindTaskIndustryScopeToggle();
    bindTaskOrgScopeToggle();
    bindTaskYearStepper(qs('#viewRoot'));
    bindTaskDeadlineValidation(qs('#viewRoot'));

    const btn = document.getElementById('saveTaskEditBtn');
    if (btn) btn.onclick = () => {
      const f = document.getElementById('taskForm');
      if (!validateTaskForm(f)) return;
      const taskId = f.dataset.taskId;
      const payload = readTaskFormPayload(f);
      if (!payload.investIndustryCodes?.length) {
        toast('投向行业范围请至少选择一项行业', 'warning');
        return;
      }
      if (!payload.industryCodes?.length) {
        toast('所属行业范围请至少选择一项行业', 'warning');
        return;
      }
      if (!payload.branches.length) {
        toast('组织范围请至少选择全行或一个一级分行', 'warning');
        return;
      }
      Store.updateTask(taskId, payload);
      Store.update(d => { d.currentTaskId = taskId; });
      toast('任务已保存，可点击上方步骤继续流程', 'success');
      route();
    };
  }

  if (base === '#/candidates' && !viewOnly) {
    const markCandidateInclusionCustomized = () => {
      Store.update(d => {
        const t = d.tasks.find(x => x.id === taskId);
        if (t?.candidateFilterRules) t.candidateFilterRules.customized = true;
      });
    };

    const runCandidateQuery = () => {
      const rules = readCandidateFilterRulesFromDom();
      Store.saveCandidateFilterRules(taskId, rules);
      Store.applyCandidateFilterInclusion(taskId, rules);
      route();
    };

    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.onclick = () => {
      const r = Store.syncCandidates(taskId);
      if (!r.ok) {
        toast(r.message, 'warning');
        return;
      }
      toast(
        `已从接口同步 ${r.year} 年度台账（核算年度 ${r.year}）· ${r.totalInInterface.toLocaleString()} 笔`,
        'success'
      );
      route();
    };

    qs('#candidateFilterBtn')?.addEventListener('click', () => {
      if (!Store.getTask(taskId)?.syncedFromInterface) {
        toast('请先点击「从接口同步台账」拉取数据', 'warning');
        return;
      }
      runCandidateQuery();
      toast('已按筛选条件更新列表', 'success');
    });

    qs('#candidateFilterResetBtn')?.addEventListener('click', () => {
      const defaults = getDefaultCandidateFilterRules(Store.getTask(taskId));
      Store.saveCandidateFilterRules(taskId, defaults);
      Store.applyCandidateFilterInclusion(taskId, defaults);
      toast('已恢复默认筛选条件', 'success');
      route();
    });

    qs('#candidateFilterClearBtn')?.addEventListener('click', () => {
      Store.saveCandidateFilterRules(taskId, getEmptyCandidateFilterRules());
      toast('已清除全部筛选条件', 'success');
      route();
    });

    const goFormal = document.getElementById('goFormalBtn');
    if (goFormal) goFormal.onclick = (e) => {
      e.preventDefault();
      const task = Store.getTask(taskId);
      if (!task?.syncedFromInterface) {
        toast('请先点击「从接口同步台账」拉取核算年度数据', 'warning');
        return;
      }
      const rules = Store.getCandidateFilterRules(taskId);
      const n = Store.getCandidatesForView(taskId, rules).stats.includedCount;
      if (!n) { toast('请先勾选拟纳入正式清单的业务', 'warning'); return; }
      Store.generateFormalFromCandidates(taskId);
      toast('已生成正式清单 ' + n + ' 笔，请确认对象与边界', 'success');
      location.hash = '#/formal';
    };

    qs('#checkAllPage')?.addEventListener('change', e => {
      markCandidateInclusionCustomized();
      qsa('#candidateTbody .row-check').forEach(cb => {
        cb.checked = e.target.checked;
        Store.update(d => {
          const c = d.candidates.find(x => x.id === cb.dataset.id);
          if (c) c.included = cb.checked;
        });
      });
      route();
    });

    qsa('.row-check').forEach(cb => {
      cb.onchange = () => {
        markCandidateInclusionCustomized();
        Store.update(d => {
          const c = d.candidates.find(x => x.id === cb.dataset.id);
          if (c) c.included = cb.checked;
        });
        route();
      };
    });

    qsa('.candidate-expand-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleCandidateProjectExpanded(taskId, btn.dataset.id);
        route();
      });
    });
  }

  if (base === '#/formal' && !viewOnly) {
    qs('#formalCheckAll')?.addEventListener('change', e => {
      qsa('#formalTbody .formal-row-check').forEach(cb => {
        if (!cb.disabled) cb.checked = e.target.checked;
      });
    });

    qs('#editFormalIndustryBtn')?.addEventListener('click', () => {
      formalIndustryEditMode = true;
      route();
    });

    qs('#saveFormalIndustryBtn')?.addEventListener('click', () => {
      const edits = collectFormalIndustryEdits();
      if (!edits.length) {
        toast('未检测到行业变更', 'warning');
        return;
      }
      const n = Store.updateFormalIndustries(taskId, edits);
      formalIndustryEditMode = false;
      toast(`已保存 ${n} 笔行业调整`, 'success');
      route();
    });

    qs('#cancelFormalIndustryBtn')?.addEventListener('click', () => {
      formalIndustryEditMode = false;
      route();
    });

    if (formalIndustryEditMode) bindFormalIndustryPickers(qs('#viewRoot'));

    qs('#confirmFormalBtn')?.addEventListener('click', () => {
      const list = Store.getFormalList(taskId);
      let ids = qsa('#formalTbody .formal-row-check:checked').map(cb => cb.value);
      if (!ids.length) {
        ids = list.filter(f => f.status !== 'confirmed').map(f => f.id);
      }
      if (!ids.length) {
        toast('没有可锁定的记录', 'warning');
        return;
      }
      const toLock = list.filter(f => ids.includes(f.id) && f.status !== 'confirmed');
      if (!toLock.length) {
        toast('所选记录均已锁定', 'warning');
        return;
      }
      const r = Store.confirmFormalItems(taskId, toLock.map(f => f.id));
      const groupN = Store.getCollectGroups(taskId).length;
      toast(`已锁定 ${r.locked || toLock.length} 笔，生成 ${groupN} 个归集单元，已更新 ${r.provisioned || 0} 个企业碳账户`, 'success');
      location.hash = `#/data-collect?taskId=${encodeURIComponent(taskId)}`;
    });
  }

  if (base === '#/formal') {
    qs('#exportFormalBtn')?.addEventListener('click', () => {
      const list = Store.getFormalList(taskId);
      if (!list.length) {
        toast('暂无正式清单可导出', 'warning');
        return;
      }
      exportFormalListCsv(taskId);
      toast(`已导出 ${list.length} 笔正式清单`, 'success');
    });
    qsa('.candidate-expand-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        toggleCandidateProjectExpanded(taskId, btn.dataset.id);
        route();
      });
    });
  }

  if (base === '#/approvals') {
    const hqBranch = typeof getHqApprovalBranchFromRoute === 'function' ? getHqApprovalBranchFromRoute() : '';
    qs('#hqApprovalSummaryFilterBtn')?.addEventListener('click', () => {
      saveHqApprovalSummaryFilters(taskId, readHqApprovalSummaryFilterInputs());
      setListPage('approvals_hq_branch_' + taskId, 1);
      route();
    });
    qs('#hqApprovalSummaryFilterResetBtn')?.addEventListener('click', () => {
      saveHqApprovalSummaryFilters(taskId, {});
      setListPage('approvals_hq_branch_' + taskId, 1);
      route();
    });
    qs('#hqApprovalBackBtn')?.addEventListener('click', () => {
      location.hash = typeof buildApprovalsListHash === 'function'
        ? buildApprovalsListHash(taskId, '')
        : `#/approvals?taskId=${encodeURIComponent(taskId)}`;
    });
    qs('#approvalFilterBtn')?.addEventListener('click', () => {
      saveApprovalFilters(taskId, readApprovalFilterInputs());
      setListPage(hqBranch ? `approvals_hq_detail_${taskId}_${hqBranch}` : 'approvals', 1);
      route();
    });
    qs('#approvalFilterResetBtn')?.addEventListener('click', () => {
      saveApprovalFilters(taskId, {});
      setListPage(hqBranch ? `approvals_hq_detail_${taskId}_${hqBranch}` : 'approvals', 1);
      route();
    });
    qs('#approvalBatchSelectAll')?.addEventListener('change', e => {
      qsa('.approval-batch-check:not(:disabled)').forEach(cb => { cb.checked = e.target.checked; });
    });
    qs('#branchBatchApproveBtn')?.addEventListener('click', async () => {
      const ids = qsa('.approval-batch-check:checked').filter(cb => cb.dataset.batchKind === 'approve').map(cb => cb.value);
      if (!ids.length) {
        toast('请先勾选待分行初审记录', 'warning');
        return;
      }
      const ok = await showConfirmDialog({
        message: '是否确认批量审核通过？',
        detail: `本次将处理 <strong>${ids.length}</strong> 笔记录。审核通过后需勾选并点击「一键提交数据」提交总行终审。`
      });
      if (!ok) return;
      const count = Store.bulkApproveBranchSupplements(taskId, ids);
      toast(count ? `已批量审核通过 ${count} 笔` : '没有可批量审核的记录', count ? 'success' : 'warning');
      route();
    });
    qs('#branchSubmitToHqBtn')?.addEventListener('click', async () => {
      const ids = qsa('.approval-batch-check:checked').filter(cb => cb.dataset.batchKind === 'submit').map(cb => cb.value);
      if (!ids.length) {
        toast('请先勾选分行初审已通过的记录', 'warning');
        return;
      }
      const ok = await showConfirmDialog({
        message: '是否确认一键提交数据至总行终审？',
        detail: `本次将提交 <strong>${ids.length}</strong> 笔记录，提交后审核状态将变为待审核，审核环节为总行终审。`
      });
      if (!ok) return;
      const count = Store.bulkSubmitBranchApprovedToHq(taskId, ids);
      toast(count ? `已提交 ${count} 笔至总行终审` : '没有可提交的记录', count ? 'success' : 'warning');
      route();
    });
    qs('#hqBatchApproveBtn')?.addEventListener('click', async () => {
      const ids = qsa('.approval-batch-check:checked').filter(cb => cb.dataset.batchKind === 'hq_approve').map(cb => cb.value);
      if (!ids.length) {
        toast('请先勾选待总行终审记录', 'warning');
        return;
      }
      const ok = await showConfirmDialog({
        message: '是否确认批量审核通过？',
        detail: `本次将处理 <strong>${ids.length}</strong> 笔总行终审记录。`
      });
      if (!ok) return;
      const count = Store.bulkApproveHqSupplements(taskId, ids);
      toast(count ? `已批量审核通过 ${count} 笔` : '没有可批量审核的记录', count ? 'success' : 'warning');
      route();
    });
  }

  if (base === '#/manager-tasks') {
    qs('#managerTaskFilterBtn')?.addEventListener('click', () => {
      saveManagerTaskFilters(taskId, readManagerTaskFilterInputs());
      setListPage('manager_tasks_' + taskId, 1);
      route();
    });
    qs('#managerTaskFilterResetBtn')?.addEventListener('click', () => {
      saveManagerTaskFilters(taskId, {});
      setListPage('manager_tasks_' + taskId, 1);
      route();
    });
  }

  if (base === '#/data-collect') {
    if (!viewOnly) {
    qs('#dataCollectFilterBtn')?.addEventListener('click', () => {
      saveDataCollectFilters(taskId, {
        keyword: qs('#dcf_keyword')?.value || '',
        dataStatus: qs('#dcf_data_status')?.value || ''
      });
      route();
    });
    qs('#dataCollectFilterResetBtn')?.addEventListener('click', () => {
      saveDataCollectFilters(taskId, {});
      route();
    });

    const syncDispatchCheckAll = () => {
      const all = qsa('#dispatchTbody .dispatch-group-check');
      const enabled = all.filter(cb => !cb.disabled);
      const checked = enabled.filter(cb => cb.checked);
      const master = qs('#dispatchCheckAll');
      if (!master) return;
      master.checked = enabled.length > 0 && checked.length === enabled.length;
      master.indeterminate = checked.length > 0 && checked.length < enabled.length;
      const countEl = qs('#dispatchSelectedCount');
      if (countEl) countEl.textContent = checked.length ? `已选 ${checked.length} 个归集单元` : '';
    };

    qs('#dispatchCheckAll')?.addEventListener('change', e => {
      qsa('#dispatchTbody .dispatch-group-check').forEach(cb => {
        if (!cb.disabled) cb.checked = e.target.checked;
      });
      syncDispatchCheckAll();
    });
    qsa('#dispatchTbody .dispatch-group-check').forEach(cb => {
      cb.addEventListener('change', syncDispatchCheckAll);
    });
    syncDispatchCheckAll();

    bindCollectGroupExpandRows();

    qs('#rebuildCollectGroupsBtn')?.addEventListener('click', () => {
      const n = Store.rebuildCollectGroups(taskId);
      toast(n ? `已刷新归集，共 ${n} 个单元` : '当前无已锁定正式清单，无法生成归集', n ? 'success' : 'warning');
      route();
    });

    qsa('.reassign-manager-btn').forEach(btn => {
      btn.onclick = () => {
        const groupId = btn.dataset.groupId;
        const group = Store.getCollectGroups(taskId).find(g => g.id === groupId);
        openReassignManagerModal(taskId, groupId, group?.assignedManager || '', (next) => {
          const needsWipe = collectGroupNeedsWipeConfirm(Store.get(), taskId, groupId);
          const r = Store.reassignCollectGroupManager(taskId, groupId, next, { wipeData: needsWipe });
          toast(r.message, r.ok ? 'success' : 'warning');
          if (r.ok) route();
        });
      };
    });

    const runAdminReject = (supplementId) => {
      openApprovalActionConfirm('reject', (_approved, reason) => {
        const n = Store.adminRejectSupplements(taskId, [supplementId], reason);
        if (!n) {
          toast('退回失败，请确认记录已审批通过', 'warning');
          return;
        }
        toast('已退回，请前往「数据采集」重新填报并提交审核', 'warning');
        route();
      }, {
        title: '确认退回',
        message: '该数据已完成填报，是否确认退回至客户经理？'
      });
    };

    qsa('.reject-fill-btn').forEach(btn => {
      btn.onclick = () => runAdminReject(btn.dataset.id);
    });

    qs('#dispatchSupplementBtn')?.addEventListener('click', () => {
      const ids = qsa('#dispatchTbody .dispatch-group-check:checked').map(cb => cb.value);
      if (!ids.length) {
        toast('请勾选要派发的归集单元', 'warning');
        return;
      }
      const n = Store.dispatchCollectGroups(taskId, ids);
      if (!n) {
        toast('所选归集单元无法派发（可能已派发或未锁定）', 'warning');
        return;
      }
      toast(`已发放 ${n} 个归集采集任务`, 'success');
      route();
    });

    qs('#fetchInterfaceDataBtn')?.addEventListener('click', () => {
      const d = Store.get();
      const confirmed = d.formalList.filter(f => f.taskId === taskId && f.status === 'confirmed');
      const pendingGelanIds = confirmed
        .filter(f =>
          !Store._formalHasEntityEmission(d, taskId, f)
          && isFormalGelanEligible(f, taskId, d)
        )
        .map(f => f.id);
      const economyIds = confirmed
        .filter(f => isFormalEconomyDirectEligible(f, taskId, d))
        .map(f => f.id);
      if (!pendingGelanIds.length && !economyIds.length) {
        const hint = describeEconomyDirectEmptyOutcome(taskId);
        toast(
          hint?.msg || '当前没有可调取接口数据的记录（需已锁定、主体排放为空，且非项目法以项目方式计算）',
          hint?.type || 'warning'
        );
        return;
      }
      const parts = [];
      let withData = 0;
      let ecoN = 0;
      if (pendingGelanIds.length) {
        const r = Store.fetchGelanEntityEmissions(taskId, pendingGelanIds);
        if (!r?.withData && !r?.noData && r?.ok === false) {
          toast('格澜数据调取失败', 'warning');
          return;
        }
        withData = r?.withData || 0;
        const skipHint = r?.skippedProject > 0 ? `，${r.skippedProject} 笔项目法已跳过` : '';
        parts.push(`格澜 ${withData} 笔已获取主体排放，${r?.noData || 0} 笔无数据${skipHint}`);
      }
      if (economyIds.length) {
        ecoN = Store.runEconomyDirectCalc(taskId, economyIds) || 0;
        parts.push(`经济法直算 ${ecoN} 笔`);
      }
      toast(`接口数据调取完成：${parts.join('；')}`, (withData || ecoN) ? 'success' : 'warning');
      Store.syncCalculationsFromDataCollect(taskId);
      route();
    });

    }

    qsa('.view-fill-btn').forEach(btn => {
      btn.onclick = () => openSupplementFillDrawer(btn.dataset.id);
    });
  }

  if (base === '#/branch-board') {
    qsa('.submit-review-btn').forEach(btn => {
      btn.onclick = () => {
        const ok = Store.submitSupplementForReview(btn.dataset.id);
        if (ok) {
          toast('已提交审核', 'success');
          route();
        } else {
          toast('当前状态无法提交审核', 'warning');
        }
      };
    });
  }

  if (base === '#/supplement-fill') {
    const sid = new URLSearchParams((location.hash.split('?')[1] || '')).get('id') || 'S002';
    const root = qs('#viewRoot');
    const s0 = Store.get().supplements.find(x => x.id === sid);
    const editable = isSupplementEditableByManager(s0);
    bindSupplementPageTabs(root);
    bindSupplementMethodTabs(!editable, root);
    SUPPLEMENT_FIELDS.bindFileUpload(root, sid, !editable);
    SUPPLEMENT_FIELDS.bindReportAttachmentRule(root, !editable);
    SUPPLEMENT_FIELDS.bindProjectInfoChoice(root, !editable);
    if (!editable) return;
    const save = (complete) => {
      const s = Store.get().supplements.find(x => x.id === sid);
      if (complete) {
        const submitCheck = SUPPLEMENT_FIELDS.validateSupplementSubmit(root, s);
        if (!submitCheck.ok) {
          toast(submitCheck.message, 'warning');
          if (submitCheck.tabId) {
            qsa('#methodTabs .tab', root).forEach(x => x.classList.remove('active'));
            qsa('.tab-panel', root).forEach(x => x.classList.remove('active'));
            qs(`#methodTabs .tab[data-tab="${submitCheck.tabId}"]`, root)?.classList.add('active');
            qs(`.tab-panel[data-panel="${submitCheck.tabId}"]`, root)?.classList.add('active');
          }
          return;
        }
      }
      const payload = SUPPLEMENT_FIELDS.collectAllFormData(root, s);
      payload.complete = complete;
      payload.fieldsDone = complete ? 15 : 10;
      Store.saveSupplement(sid, payload);
      Store.update(d => {
        const t = d.tasks.find(x => x.id === taskId);
        if (t && complete) {
          t.supplementDone = Math.min(t.supplementTotal, t.supplementDone + 1);
          t.progress = Math.max(t.progress, 50);
        }
        Store.syncTaskWorkflow(d, taskId);
      });
      refreshSupplementApprovalTimeline(root, sid);
      if (complete) {
        const ok = Store.submitSupplementForReview(sid);
        toast(ok ? '数据已提交，进入审核流程' : '提交审核失败，请刷新后重试', ok ? 'success' : 'warning');
        location.hash = '#/manager-tasks?taskId=' + taskId;
      } else {
        toast('已暂存', 'success');
        route();
      }
    };
    const sBtn = document.getElementById('saveSupplementBtn');
    const cBtn = document.getElementById('completeSupplementBtn');
    if (sBtn) sBtn.onclick = () => save(false);
    if (cBtn) cBtn.onclick = () => save(true);
  }

  if (base === '#/approval-review') {
    const params = new URLSearchParams((location.hash.split('?')[1] || ''));
    const auditEditing = params.get('edit') === '1';
    const root = qs('#viewRoot');
    bindSupplementPageTabs(root);
    const approvalId = qs('#approvalReviewId')?.value;
    const approval = (Store.get().approvals || []).find(a => a.id === approvalId);
    const canReview = params.get('mode') === 'review'
      && typeof canUserReviewApproval === 'function'
      && canUserReviewApproval(approval, Store.get().currentRole);
    const supplement = typeof getSupplementForApproval === 'function'
      ? getSupplementForApproval(approval)
      : null;
    const sid = supplement?.id;

    if (auditEditing && sid && canReview) {
      bindSupplementMethodTabs(false, root);
      SUPPLEMENT_FIELDS.bindFileUpload(root, sid, false);
      SUPPLEMENT_FIELDS.bindReportAttachmentRule(root, false);
      SUPPLEMENT_FIELDS.bindProjectInfoChoice(root, false);

      const saveAuditEdit = (complete) => {
        const s = Store.get().supplements.find(x => x.id === sid);
        if (!s) return;
        if (complete) {
          const submitCheck = SUPPLEMENT_FIELDS.validateSupplementSubmit(root, s);
          if (!submitCheck.ok) {
            toast(submitCheck.message, 'warning');
            if (submitCheck.tabId) {
              qsa('#methodTabs .tab', root).forEach(x => x.classList.remove('active'));
              qsa('.tab-panel', root).forEach(x => x.classList.remove('active'));
              qs(`#methodTabs .tab[data-tab="${submitCheck.tabId}"]`, root)?.classList.add('active');
              qs(`.tab-panel[data-panel="${submitCheck.tabId}"]`, root)?.classList.add('active');
            }
            return;
          }
        }
        const payload = SUPPLEMENT_FIELDS.collectAllFormData(root, s);
        payload.complete = complete;
        payload.fieldsDone = complete ? 15 : (s.fieldsDone || 10);
        Store.saveSupplement(sid, payload);
        refreshSupplementApprovalTimeline(root, sid);
        if (!complete) {
          toast('已暂存', 'success');
          route();
          return;
        }
        const finishAuditEdit = (extra) => {
          const proceed = () => {
            const ok = Store.submitSupplementAfterAuditEdit(approvalId, extra || {});
            const tid = approval?.taskId || taskId;
            if (!ok) {
              toast('提交失败，请刷新后重试', 'warning');
              return;
            }
            if (approval?.reviewLevel === 'branch') {
              toast('数据已提交，分行审核通过', 'success');
            } else {
              toast('数据已提交，审核通过', 'success');
            }
            location.hash = typeof buildApprovalsListHash === 'function'
              ? buildApprovalsListHash(tid, getHqApprovalBranchFromRoute())
              : '#/approvals?taskId=' + tid;
          };
          beginSupplementApprovalPass(approval, extra, proceed);
        };
        if (approval?.reviewLevel === 'branch') {
          openSupplementMethodApprovalConfirm(approval, (approved, _reason, extra) => {
            if (approved) finishAuditEdit(extra);
          });
        } else {
          finishAuditEdit({});
        }
      };

      qs('#auditEditSaveBtn')?.addEventListener('click', () => saveAuditEdit(false));
      qs('#auditEditSubmitBtn')?.addEventListener('click', () => saveAuditEdit(true));
      qs('#auditEditCancelBtn')?.addEventListener('click', () => {
        location.hash = `#/approval-review?approvalId=${encodeURIComponent(approvalId)}&mode=review`;
      });
      return;
    }

    bindSupplementMethodTabs(true, root);
    const finishReview = (approved, rejectReason, extra) => {
      const approval = (Store.get().approvals || []).find(a => a.id === approvalId);
      if (!approval) return;
      Store.resolveApproval(approvalId, approved, rejectReason, extra);
      const tid = approval.taskId || Store.get().currentTaskId;
      if (approved && approval.docType === 'supplement') {
        const confirmed = Store.getFormalList(tid).filter(f => f.status === 'confirmed');
        const allDone = confirmed.length > 0 && confirmed.every(f => {
          const s = Store.get().supplements.find(x => x.formalId === f.id && x.taskId === tid);
          return s && s.dispatchedAt && s.status === 'completed' && s.approvalStatus === 'approved';
        });
        if (allDone) {
          toast('全部数据采集已审核通过，任务已进入「排放计算」', 'success');
        } else {
          toast('审核通过', 'success');
        }
      } else if (!approved) {
        if (extra?.rejectAssigneeLabel) {
          const routeText = extra.rejectRoute === 'original_branch_manager'
            ? '已退回至原分行客户经理'
            : `审核不通过，已退回至 ${extra.rejectAssigneeLabel}`;
          toast(routeText, 'warning');
        } else {
          toast('审核不通过', 'warning');
        }
      } else {
        toast('审核通过', 'success');
      }
      location.hash = typeof buildApprovalsListHash === 'function'
        ? buildApprovalsListHash(tid, getHqApprovalBranchFromRoute())
        : '#/approvals?taskId=' + tid;
    };
    qs('#approvalCancelBtn')?.addEventListener('click', () => {
      location.hash = typeof buildApprovalsListHash === 'function'
        ? buildApprovalsListHash(taskId, getHqApprovalBranchFromRoute())
        : '#/approvals?taskId=' + taskId;
    });
    qs('#approvalApproveBtn')?.addEventListener('click', () => {
      const approval = (Store.get().approvals || []).find(a => a.id === approvalId);
      const runApprove = (approved, rejectReason, extra) => finishReview(approved, rejectReason, extra);
      if (approval?.docType === 'supplement' && approval?.reviewLevel === 'branch') {
        openSupplementMethodApprovalConfirm(approval, (approved, reason, extra) => {
          if (!approved) {
            finishReview(false, reason, extra);
            return;
          }
          beginSupplementApprovalPass(approval, extra, () => finishReview(true, undefined, extra));
        });
      } else if (approval?.docType === 'supplement') {
        openApprovalActionConfirm('approve', (approved, reason, extra) => {
          if (!approved) {
            finishReview(false, reason, extra);
            return;
          }
          beginSupplementApprovalPass(approval, extra || {}, () => finishReview(true, undefined, extra));
        });
      } else {
        openApprovalActionConfirm('approve', runApprove);
      }
    });
    qs('#approvalRejectBtn')?.addEventListener('click', () => {
      const approval = (Store.get().approvals || []).find(a => a.id === approvalId);
      const supplement = typeof getSupplementForApproval === 'function'
        ? getSupplementForApproval(approval)
        : null;
      openApprovalRejectConfirm(approval, supplement, finishReview, Store.getTask(approval?.taskId || taskId));
    });
    qs('#approvalModifyBtn')?.addEventListener('click', () => {
      if (!approvalId) return;
      location.hash = `#/approval-review?approvalId=${encodeURIComponent(approvalId)}&mode=review&edit=1`;
    });
  }

  if (base === '#/calculation' || base === '#/results') {
    bindDqrGradeGuideStatCards(taskId);
  }

  if (base === '#/calculation') {
    bindCollectGroupExpandRows();
  }

  if (base === '#/calculation' && !viewOnly) {
    qs('#creditFallbackBtn')?.addEventListener('click', () => {
      const n = Store.applyCreditFallbackForMissingSystemMethod(taskId);
      if (!n) {
        toast('当前无适用信贷数据兜底法的记录', 'warning');
        return;
      }
      Store.syncCalculationsFromDataCollect(taskId);
      toast(`已对 ${n} 笔记录应用信贷数据兜底法`, 'success');
      route();
    });
    qs('#calculationFilterBtn')?.addEventListener('click', () => {
      saveCalculationFilters(taskId, {
        investMin: qs('#calc_invest_min')?.value || '',
        investMax: qs('#calc_invest_max')?.value || ''
      });
      setListPage('calculation_' + taskId, 1);
      route();
    });
    qs('#calculationFilterResetBtn')?.addEventListener('click', () => {
      saveCalculationFilters(taskId, {});
      setListPage('calculation_' + taskId, 1);
      route();
    });
    qs('#submitAllDataBtn')?.addEventListener('click', () => {
      const r = Store.confirmCalculationResults(taskId);
      if (!r?.ok) {
        toast(r?.message || '无法提交数据', 'warning');
        return;
      }
      toast('数据已提交，排放记录已归集至企业碳账户', 'success');
      location.hash = '#/reports?taskId=' + encodeURIComponent(taskId);
    });
  }

  if (base === '#/carbon-accounts') {
    const readCaListFilters = () => {
      try {
        return JSON.parse(sessionStorage.getItem('ca_list_filters') || '{}');
      } catch { return {}; }
    };
    qs('#caListViewModeTabs')?.querySelectorAll('.tab[data-ca-view-mode]').forEach(tab => {
      tab.addEventListener('click', () => {
        const filters = readCaListFilters();
        filters.viewMode = tab.dataset.caViewMode;
        sessionStorage.setItem('ca_list_filters', JSON.stringify(filters));
        setListPage('carbon_accounts', 1);
        route();
      });
    });
    qs('#caListYearTabs')?.querySelectorAll('.tab[data-ca-list-year]').forEach(tab => {
      tab.addEventListener('click', () => {
        const filters = readCaListFilters();
        filters.accountingYear = tab.dataset.caListYear;
        sessionStorage.setItem('ca_list_filters', JSON.stringify(filters));
        setListPage('carbon_accounts', 1);
        route();
      });
    });
    qs('#caFilterBtn')?.addEventListener('click', () => {
      const prev = readCaListFilters();
      sessionStorage.setItem('ca_list_filters', JSON.stringify({
        ...prev,
        keyword: qs('#ca_kw')?.value || '',
        status: qs('#ca_status')?.value || ''
      }));
      setListPage('carbon_accounts', 1);
      route();
    });
    qs('#caFilterResetBtn')?.addEventListener('click', () => {
      const prev = readCaListFilters();
      const next = {};
      if (prev.viewMode) next.viewMode = prev.viewMode;
      if (prev.viewMode !== 'enterprise' && prev.accountingYear) {
        next.accountingYear = prev.accountingYear;
      }
      sessionStorage.setItem('ca_list_filters', JSON.stringify(next));
      setListPage('carbon_accounts', 1);
      route();
    });
    qsa('[data-ca-expand]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCaProjectExpanded(btn.dataset.caExpand);
        route();
      });
    });
    qsa('.ca-account-status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const accountId = btn.dataset.id;
        const nextStatus = btn.dataset.action;
        const label = CarbonAccount.ACCOUNT_STATUS_LABEL[nextStatus] || nextStatus;
        const acc = Store.getCarbonAccount(accountId);
        const curLabel = CarbonAccount.ACCOUNT_STATUS_LABEL[acc?.status || 'active'] || '正常';
        const subCount = CarbonAccount.getProjectSubAccountCount(acc);
        const subTip = subCount > 0 ? `<br>将同步影响 <strong>${subCount}</strong> 个项目子账户。` : '';
        const ok = await showConfirmDialog({
          message: `是否确认将「${acc?.customerName || accountId}」从【${curLabel}】变更为【${label}】？`,
          detail: `${subTip}操作将记入账户日志。`.replace(/^<br>/, '')
        });
        if (!ok) return;
        const r = Store.setCarbonAccountStatus(accountId, nextStatus, Store.get().currentRole);
        if (!r?.ok) {
          toast(r?.message || '状态变更失败', 'warning');
          return;
        }
        toast(r.message, 'success');
        route();
      });
    });
  }

  if (base === '#/carbon-account') {
    const caSupplementRoot = qs('.ca-profile-supplement');
    if (caSupplementRoot) {
      bindSupplementMethodTabs(!!caSupplementRoot.classList.contains('is-readonly'), caSupplementRoot);
      const isCaEdit = !!qs('#caProfileForm');
      SUPPLEMENT_FIELDS.bindReportAttachmentRule(caSupplementRoot, !isCaEdit);
      if (isCaEdit) SUPPLEMENT_FIELDS.bindProjectInfoChoice(caSupplementRoot, false);
    }
    const navigateCaAccountView = (accountId, year, sub, tab) => {
      const p = new URLSearchParams({ id: accountId, tab: tab || 'profile' });
      if (year) p.set('year', year);
      if (sub) p.set('sub', sub);
      location.hash = '#/carbon-account?' + p.toString();
    };
    const saveCaProfile = () => {
      if (!canEditCarbonAccount(Store.get().currentRole)) {
        toast('仅总行可编辑企业碳账户', 'warning');
        return;
      }
      const form = qs('#caProfileForm');
      if (!form) return;
      const supplementRoot = qs('.ca-profile-supplement');
      const acc = Store.getCarbonAccount(form.dataset.accountId);
      let payload = collectCarbonAccountProfileForm(form);
      if (supplementRoot && acc) {
        const supplementView = buildCarbonAccountSupplementView(
          Store.get(),
          acc,
          form.dataset.year,
          form.dataset.sub || ''
        );
        payload = mergeCarbonAccountSupplementIntoPayload(payload, supplementRoot, supplementView);
      }
      if (!payload?.customerName) {
        toast('请填写企业名称', 'warning');
        return;
      }
      const r = Store.saveCarbonAccountProfile(
        form.dataset.accountId,
        form.dataset.year,
        form.dataset.sub || '',
        payload,
        Store.get().currentRole
      );
      toast(r?.message || '保存失败', r?.ok ? 'success' : 'warning');
      if (r?.ok) {
        navigateCaAccountView(form.dataset.accountId, form.dataset.year, form.dataset.sub || '', 'profile');
      }
    };
    qs('#caProfileSaveBtn')?.addEventListener('click', saveCaProfile);
    qs('#caProfileCancelBtn')?.addEventListener('click', () => {
      const form = qs('#caProfileForm');
      if (form) {
        navigateCaAccountView(form.dataset.accountId, form.dataset.year, form.dataset.sub || '', 'profile');
        return;
      }
      location.hash = '#/carbon-accounts';
    });
    qs('#caDetailYearTabs')?.querySelectorAll('.tab[data-ca-list-year]').forEach(tab => {
      tab.addEventListener('click', () => {
        const params = new URLSearchParams((location.hash.split('?')[1] || ''));
        params.set('year', tab.dataset.caListYear);
        if (params.get('mode') === 'edit') {
          params.delete('tab');
        }
        location.hash = '#/carbon-account?' + params.toString();
      });
    });
    qsa('.ca-tabs .tab').forEach(tab => {
      tab.onclick = () => {
        const params = new URLSearchParams((location.hash.split('?')[1] || ''));
        params.set('tab', tab.dataset.caTab);
        location.hash = '#/carbon-account?' + params.toString();
      };
    });
  }

  if (base === '#/reports') {
    if (!viewOnly) {
    const doExport = (format) => {
      const scope = qs('#exportScope')?.value || '监管报送范围（8大行业）';
      const template = qs('#exportTemplate')?.value || '人行监管报送模板';
      Store.generateReport(taskId, scope, template, format);
      toast('已生成：' + scope + ' · ' + format + '（演示）', 'success');
      route();
    };
    qs('#exportExcel')?.addEventListener('click', () => doExport('Excel'));
    qs('#exportWord')?.addEventListener('click', () => doExport('Word'));
    }
    qsa('.report-download-btn').forEach(btn => {
      btn.onclick = () => {
        const report = Store.getReports(taskId).find(r => r.id === btn.dataset.id);
        if (downloadReportFile(report)) {
          toast('已开始下载：' + (report.name || '报告'), 'success');
        } else {
          toast('该报告暂不可下载', 'warning');
        }
      };
    });
  }

  if (base === '#/industry-config') {
    qs('#icf_search')?.addEventListener('click', () => {
      saveIndustryConfigFilters(readIndustryConfigFilterInputs());
      setListPage('industry_config', 1);
      route();
    });
    qs('#icf_reset')?.addEventListener('click', () => {
      saveIndustryConfigFilters({});
      setListPage('industry_config', 1);
      route();
    });
    qsa('.ic-edit-btn').forEach(btn => {
      btn.onclick = () => {
        const row = Store.getIndustryConfig().rows.find(r => r.id === btn.dataset.id);
        if (!row) return;
        IndustryConfig.openEditModal(row, (payload, id) => {
          if (!Store.updateIndustryConfigRow(id, payload)) {
            toast('保存失败', 'warning');
            return;
          }
          hideModal('reviewModal');
          toast('已保存', 'success');
          route();
        });
      };
    });
  }

  if (base === '#/permission-mgmt') {
    qs('#menuPermSaveBtn')?.addEventListener('click', () => {
      const next = MenuPermissions.readPanelSelections(document);
      MenuPermissions.saveVisibility(next);
      toast('菜单权限已保存', 'success');
      route();
    });
    qs('#menuPermResetBtn')?.addEventListener('click', async () => {
      const ok = await showConfirmDialog({
        message: '是否确认恢复为默认菜单配置？',
        detail: '基础配置默认不展示。'
      });
      if (!ok) return;
      MenuPermissions.resetVisibility();
      toast('已恢复默认', 'success');
      route();
    });
  }

  if (base === '#/factors') {
    qsa('[data-factor-version-rank]').forEach(btn => {
      btn.addEventListener('click', () => {
        const rank = Number(btn.dataset.factorVersionRank);
        if (!rank) return;
        setFactorListVersionRank(rank);
        setListPage('factors', 1);
        route();
      });
    });
    qsa('[data-factor-category-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        const raw = btn.dataset.factorCategoryKey || 'all';
        const key = raw === 'all' ? 'all' : decodeURIComponent(raw);
        setFactorListCategoryKey(key);
        setListPage('factors', 1);
        route();
      });
    });
    if (typeof bindFactorCategorySidebarToggle === 'function') {
      bindFactorCategorySidebarToggle(qs('#viewRoot'));
    }
    qs('#factorVersionTabAdd')?.addEventListener('click', async () => {
      const dialog = await openFactorVersionAddDialog(Store.get().factors);
      if (!dialog?.ok) return;
      if (dialog.mode === 'import') {
        setFactorListVersionRank(dialog.nextRank);
        setListPage('factors', 1);
        route();
        setTimeout(() => openFactorBatchImportModal(), 0);
        return;
      }
      const result = createFactorLibraryNextVersion(Store.get().factors, {
        methodIds: dialog.methodIds,
        sourceRank: dialog.prevRank
      });
      if (!result.added) {
        toast('未新增任何因子版本，可能所选方法在上一版本中均已存在下一版本', 'warning');
        return;
      }
      setFactorListVersionRank(result.nextRank);
      setListPage('factors', 1);
      toast(`已新增 ${result.added} 条因子版本${result.skipped ? `，跳过 ${result.skipped} 条` : ''}`, 'success');
      route();
    });
    qsa('.factor-del-group-btn').forEach(btn => {
      btn.onclick = async () => {
        const key = decodeFactorGroupKeyAttr(btn.dataset.groupKey || '');
        const g = typeof findFactorGroup === 'function' ? findFactorGroup(Store.get().factors, key) : null;
        const tip = g?.isBuiltin && !g?.isCustom ? '含人行/指引内置因子，删除后不可恢复。' : '';
        const ok = await showConfirmDialog({
          message: '是否确认删除该因子？',
          detail: tip,
          danger: true
        });
        if (!ok) return;
        if (Store.deleteFactorGroup(key)) {
          toast('已删除', 'success');
          route();
        }
      };
    });
    qsa('.factor-copy-btn').forEach(btn => {
      btn.onclick = () => {
        location.hash = '#/factors/new?copy=' + encodeURIComponent(btn.dataset.id);
      };
    });
    qsa('.factor-view-btn').forEach(btn => {
      btn.onclick = () => {
        const key = decodeFactorGroupKeyAttr(btn.dataset.groupKey || '');
        if (key) openFactorGroupViewModal(key, Store.get().factors);
        else {
          const f = Store.getFactor(btn.dataset.id);
          if (f) openFactorViewModal(f);
        }
      };
    });
    qs('#factorBatchImportBtn')?.addEventListener('click', () => openFactorBatchImportModal());
  }

  if (base === '#/factors/import') {
    location.hash = '#/factors';
    setTimeout(() => openFactorBatchImportModal(), 0);
  }

  if (base === '#/factors/new' || base === '#/factors/edit') {
    bindFactorForm(base);
  }

  if (base === '#/interfaces') {
    qsa('.if-batch-view').forEach(btn => {
      btn.onclick = () => openInterfaceBatchModal(btn.dataset.id);
    });
    qsa('.if-batch-retry').forEach(btn => {
      btn.onclick = () => {
        const ok = Store.retryInterfaceBatch(btn.dataset.id);
        if (!ok) {
          toast('重新获取失败，请确认批次状态', 'warning');
          return;
        }
        toast('已重新获取该批次台账数据', 'success');
        route();
      };
    });
  }

  if (base === '#/ledger') {
    qs('#ledgerFilterBtn')?.addEventListener('click', () => {
      saveLedgerFilters({
        taskName: qs('#lf_task_name')?.value || '',
        year: qs('#lf_year')?.value || '',
        dataIndustryScope: qs('#lf_data_industry')?.value || '',
        branch: getLedgerFilters().branch || '',
        handlingBranch: getLedgerFilters().handlingBranch || '',
        customer: getLedgerFilters().customer || ''
      });
      setListPage('ledger_tasks', 1);
      route();
    });
    qs('#ledgerFilterResetBtn')?.addEventListener('click', () => {
      saveLedgerFilters({});
      setListPage('ledger_tasks', 1);
      route();
    });
  }

  if (base === '#/ledger/detail') {
    bindCollectGroupExpandRows(qs('#viewRoot'));
    const taskId = new URLSearchParams((location.hash.split('?')[1] || '')).get('taskId') || ctx?.task?.id || '';
    const runLedgerDetailExport = (bucket) => {
      const t = Store.getTask(taskId);
      const filters = getLedgerFilters();
      const groups = getLedgerDetailGroups(taskId, filters);
      const { nonProject, project } = splitLedgerDetailGroupsByBucket(groups);
      const hasData = bucket === 'non_project' ? nonProject.length
        : bucket === 'project' ? project.length
          : groups.length;
      if (!hasData) {
        toast('当前筛选无数据可导出', 'warning');
        return;
      }
      const ok = exportLedgerDetailGroupCsv(t, filters, { bucket });
      if (!ok) {
        toast('导出失败，请重试', 'warning');
        return;
      }
      const label = bucket === 'non_project' ? '非项目' : bucket === 'project' ? '项目' : '全部';
      toast(`已导出${label}排放计算清单`, 'success');
    };
    qs('#ledgerExportNonProjectBtn')?.addEventListener('click', () => runLedgerDetailExport('non_project'));
    qs('#ledgerExportProjectBtn')?.addEventListener('click', () => runLedgerDetailExport('project'));
    qs('#ledgerExportAllBtn')?.addEventListener('click', () => runLedgerDetailExport('all'));
    qs('#ledgerDetailFilterBtn')?.addEventListener('click', () => {
      saveLedgerFilters({
        branch: qs('#ldf_branch')?.value || '',
        handlingBranch: qs('#ldf_handling')?.value || '',
        customer: qs('#ldf_customer')?.value || '',
        year: getLedgerFilters().year || ''
      });
      setListPage('ledger_detail_' + taskId, 1);
      location.hash = '#/ledger/detail?taskId=' + encodeURIComponent(taskId);
      route();
    });
    qs('#ledgerDetailFilterResetBtn')?.addEventListener('click', () => {
      saveLedgerFilters({ year: getLedgerFilters().year || '' });
      setListPage('ledger_detail_' + taskId, 1);
      location.hash = '#/ledger/detail?taskId=' + encodeURIComponent(taskId);
      route();
    });
  }

  if (base === '#/method-config/params') {
    const paramFilterForm = qs('#paramFilterForm');
    if (paramFilterForm && paramFilterForm.dataset.bound !== '1') {
      paramFilterForm.dataset.bound = '1';
      paramFilterForm.addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const q = new URLSearchParams();
        ['kw', 'category', 'industry', 'status'].forEach(k => {
          const v = (fd.get(k) || '').toString().trim();
          if (v) q.set(k, v);
        });
        location.hash = `#/method-config/params${q.toString() ? `?${q}` : ''}`;
      });
    }
    const paramFilterResetBtn = qs('#paramFilterResetBtn');
    if (paramFilterResetBtn && paramFilterResetBtn.dataset.bound !== '1') {
      paramFilterResetBtn.dataset.bound = '1';
      paramFilterResetBtn.addEventListener('click', () => {
        location.hash = '#/method-config/params';
      });
    }
    qs('#paramBatchImportBtn')?.addEventListener('click', () => openParamBatchImportModal());
  }

  if (base === '#/method-config/params/new' || base === '#/method-config/params/edit') {
    bindParamFormFormatPanels();
    qs('#paramSaveBtn')?.addEventListener('click', () => {
      const f = qs('#paramForm');
      if (f && !f.reportValidity()) return;
      const payload = METHOD_CONFIG.readParamForm(f);
      const isNew = base === '#/method-config/params/new';
      const result = METHOD_CONFIG.saveParam(payload, isNew);
      if (!result.ok) {
        toast(result.message, 'error');
        return;
      }
      toast(result.message, 'success');
      location.hash = '#/method-config/params';
    });
  }

  if (base === '#/method-config/templates') {
    const tplFilterForm = qs('#tplFilterForm');
    if (tplFilterForm && tplFilterForm.dataset.bound !== '1') {
      tplFilterForm.dataset.bound = '1';
      tplFilterForm.addEventListener('submit', e => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const q = new URLSearchParams();
        if (fd.get('kw')) q.set('kw', fd.get('kw'));
        if (fd.get('industry')) q.set('industry', fd.get('industry'));
        if (fd.get('method')) q.set('method', fd.get('method'));
        if (fd.get('status')) q.set('status', fd.get('status'));
        location.hash = `#/method-config/templates${q.toString() ? `?${q}` : ''}`;
      });
    }
    const tplFilterResetBtn = qs('#tplFilterResetBtn');
    if (tplFilterResetBtn && tplFilterResetBtn.dataset.bound !== '1') {
      tplFilterResetBtn.dataset.bound = '1';
      tplFilterResetBtn.addEventListener('click', () => {
        location.hash = '#/method-config/templates';
      });
    }
  }

  if (base === '#/method-config/templates/new') {
    bindMethodCombo();
    bindTemplateIndustryCombo();
    qs('#tplCreateBtn')?.addEventListener('click', () => {
      const form = qs('#tplCreateForm');
      if (!form?.reportValidity()) return;
      const fd = new FormData(form);
      const applyScene = fd.getAll('applyScene').filter(Boolean);
      if (!applyScene.length) {
        toast('请至少选择一个适用场景', 'warning');
        return;
      }
      const industries = METHOD_CONFIG.parseIndustriesCombined(fd.get('industryCombined'));
      if (!industries.length) {
        toast('请至少选择一个适用行业', 'warning');
        return;
      }
      const result = METHOD_CONFIG.createTemplate({
        templateName: (fd.get('templateName') || '').toString().trim(),
        industries,
        subCategory: (fd.get('subCategory') || '').toString().trim(),
        methodId: resolveMethodIdFromName((fd.get('methodId') || '').toString().trim()),
        priority: fd.get('priority'),
        applyScene,
        description: (fd.get('description') || '').toString().trim(),
        factorVersionRank: fd.get('factorVersionRank')
      });
      if (!result.ok) {
        toast(result.message, result.id ? 'warning' : 'error');
        if (result.id) {
          setTimeout(() => {
            location.hash = `#/method-config/templates/edit?id=${encodeURIComponent(result.id)}&step=2`;
          }, 600);
        }
        return;
      }
      toast('模板已创建', 'success');
      location.hash = `#/method-config/templates/edit?id=${encodeURIComponent(result.id)}&step=2`;
    });
  }

  if (base === '#/method-config/templates/edit') {
    MethodConfigEditor.bindTemplateEdit();
    bindMethodCombo();
    bindTemplateIndustryCombo();
  }

  bindListPagination(paginationHook);
}

function bindFactorForm(base) {
  const form = qs('#factorForm');
  if (!form) return;
  bindFactorUnitCombo(form.closest('.card-body') || form);
  bindIndustryCombo({
    prefix: 'factor',
    multiple: false,
    includeOther: true
  });
  bindFactorMethodCombo(form);

  qs('#factorEditDelBtn')?.addEventListener('click', async () => {
    const editId = form.dataset.factorId;
    if (!editId) return;
    const f = Store.getFactor(editId);
    const tip = f?.isBuiltin ? '该因子为人行/指引内置，删除后不可恢复。' : '';
    const ok = await showConfirmDialog({
      message: `是否确认删除因子「${f ? factorDisplayName(f) : editId}」？`,
      detail: tip,
      danger: true
    });
    if (!ok) return;
    if (Store.deleteFactor(editId)) {
      toast('已删除', 'success');
      location.hash = '#/factors';
    }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const payload = readFactorFormPayload(form);
    if (!payload.factorName) {
      toast('请填写因子名称', 'warning');
      return;
    }
    if (payload.value == null || Number.isNaN(payload.value)) {
      toast('请填写因子数值', 'warning');
      return;
    }
    if (!payload.unit) {
      toast('请填写因子单位', 'warning');
      return;
    }
    if (!payload.industryMajor) {
      toast('请选择行业', 'warning');
      return;
    }
    if (!payload.methodId || (payload.methodId === 'custom' && !payload.methodName)) {
      toast('请选择或输入计算方法名称', 'warning');
      return;
    }
    const editId = form.dataset.factorId;
    const formMode = form.dataset.formMode || 'create';
    if (editId) {
      const result = Store.saveFactorVersion(editId, payload);
      if (!result.ok) {
        if (result.reason === 'duplicate_year') toast('该适用年度版本已存在，请更换年度或编辑对应版本', 'warning');
        else toast('保存失败，请刷新后重试', 'warning');
        return;
      }
      toast(result.mode === 'create' ? '已保存为新版本' : '已保存', 'success');
    } else {
      const added = Store.addFactor(payload);
      if (!added) {
        toast('该因子在此适用年度已存在，请通过版本管理编辑', 'warning');
        return;
      }
      toast('已新增自定义因子', 'success');
    }
    location.hash = '#/factors';
  });
}

function openInterfaceBatchModal(batchId) {
  const { batch, rows, total } = Store.getInterfaceBatchRecords(batchId, 15);
  if (!batch) return;
  if (!ensureReviewModal()) return;
  const task = Store.getTask(Store.get().currentTaskId);

  const modal = qs('#reviewModal');
  modal?.querySelector('.modal')?.classList.add('modal-xl');

  const rowsHtml = rows.length ? rows.map(c => `<tr>${renderCandidateListCells(c, { task })}</tr>`).join('')
    : `<tr><td colspan="${ledgerListTableColCount()}" style="text-align:center;padding:24px;color:#909399">暂无台账数据</td></tr>`;

  qs('#reviewModalTitle').textContent = '查看台账 · ' + batch.batchNo;
  qs('#reviewModalBody').innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:12px;font-size:13px;color:#606266">
      <span>数据月份：<b>${batch.dataMonth}</b></span>
      <span>推送时间：${batch.pushTime}</span>
      <span>数据条数：<b>${(total || 0).toLocaleString()}</b> 笔</span>
      <span>来源：${batch.source || '信贷核心系统'}</span>
    </div>
    <div class="table-wrap" style="max-height:420px;overflow:auto">
      <table class="data-table">
        <thead><tr>
          ${renderCandidateListTableHead(task)}
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <p style="font-size:12px;color:#909399;margin:12px 0 0">共 ${(total || 0).toLocaleString()} 笔，演示展示前 ${rows.length} 笔（字段与候选业务清单一致）</p>`;
  qs('#reviewModalFooter').innerHTML = `<button class="btn" onclick="hideModal('reviewModal')">关闭</button>`;
  showModal('reviewModal');
}

function ensureReviewModal() {
  let modal = qs('#reviewModal');
  if (modal) return modal;
  const root = qs('#modalRoot');
  if (!root) return null;
  root.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="reviewModal">
      <div class="modal">
        <div class="modal-header"><h4 id="reviewModalTitle">审核</h4><button class="modal-close" id="closeReview">&times;</button></div>
        <div class="modal-body" id="reviewModalBody"></div>
        <div class="modal-footer" id="reviewModalFooter"></div>
      </div>
    </div>`);
  modal = qs('#reviewModal');
  qs('#closeReview').onclick = () => hideModal('reviewModal');
  return modal;
}

function openApprovalView(approvalId) {
  qs('#reviewModal')?.querySelector('.modal')?.classList.remove('modal-xl');
  const approval = (Store.get().approvals || []).find(a => a.id === approvalId);
  if (!approval) return;
  const detail = Store.getApprovalDocDetail(approval);
  if (!ensureReviewModal()) return;
  qs('#reviewModalTitle').textContent = '查看 · ' + (detail.title || approval.docName);
  qs('#reviewModalBody').innerHTML = `
    <table class="data-table" style="margin-bottom:12px"><tbody>
      ${detail.rows.map(r => `<tr><td style="width:120px;color:#909399">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}
    </tbody></table>
    <p style="font-size:13px;color:#909399">提交人：${approval.submitter} · ${approval.submitTime}</p>
    ${approval.approver ? `<p style="font-size:13px;color:#909399">审批人：${approval.approver} · ${approval.approveTime}</p>` : ''}
    ${detail.link ? `<p style="margin-top:12px"><a href="${detail.link}" class="btn btn-sm">${detail.linkLabel || '查看详情'}</a></p>` : ''}`;
  qs('#reviewModalFooter').innerHTML = `<button class="btn" onclick="hideModal('reviewModal')">关闭</button>`;
  showModal('reviewModal');
}

function openApprovalReview(approvalId) {
  qs('#reviewModal')?.querySelector('.modal')?.classList.remove('modal-xl');
  const approval = (Store.get().approvals || []).find(a => a.id === approvalId);
  if (!approval || approval.status !== 'pending') return;
  if (!ensureReviewModal()) return;
  const detail = Store.getApprovalDocDetail(approval);
  qs('#reviewModalTitle').textContent = '审核 · ' + approval.docName + (approval.reviewLevel ? '（' + reviewLevelLabel(approval.reviewLevel) + '）' : '');
  qs('#reviewModalBody').innerHTML = `
    <p>请确认是否通过以下单据：</p>
    <table class="data-table" style="margin:12px 0"><tbody>
      ${detail.rows.slice(0, 5).map(r => `<tr><td style="width:120px;color:#909399">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}
    </tbody></table>
    <p style="font-size:13px;color:#909399">提交人：${approval.submitter} · ${approval.submitTime}</p>
    ${approval.docType === 'formal' ? '<p style="font-size:13px;color:#e6a23c;margin-top:8px">通过后，已锁定的正式清单将生效，并进入数据采集环节。</p>' : ''}`;
  qs('#reviewModalFooter').innerHTML = `
    <button class="btn" id="rejectReviewBtn">退回</button>
    <button class="btn btn-primary" id="approveReviewBtn">通过</button>`;
  qs('#rejectReviewBtn').onclick = () => {
    Store.resolveApproval(approvalId, false);
    hideModal('reviewModal');
    toast('已退回', 'success');
    route();
  };
  qs('#approveReviewBtn').onclick = () => {
    Store.resolveApproval(approvalId, true);
    hideModal('reviewModal');
    const tid = approval.taskId || (() => {
      const s = Store.get().supplements.find(x => x.id === approval.docId);
      return s?.taskId;
    })() || Store.get().currentTaskId;
    const confirmed = Store.getFormalList(tid).filter(f => f.status === 'confirmed');
    const allDone = confirmed.length > 0 && confirmed.every(f => {
      const s = Store.get().supplements.find(x => x.formalId === f.id && x.taskId === tid);
      return s && s.dispatchedAt && s.status === 'completed' && s.approvalStatus === 'approved';
    });
    if (approval.docType === 'supplement' && allDone) {
      toast('全部数据采集已审核通过，任务已进入「排放计算」', 'success');
    } else {
      toast('审核通过', 'success');
    }
    route();
  };
  showModal('reviewModal');
}

// 审批弹窗挂载到 modalRoot
const _openApproval = openApproval;
openApproval = function(docType, docId, docName) {
  let modal = qs('#approvalModal');
  if (!modal) {
    const root = qs('#modalRoot');
    if (root) {
      root.insertAdjacentHTML('beforeend', `
        <div class="modal-overlay" id="approvalModal">
          <div class="modal">
            <div class="modal-header"><h4>提交审核</h4><button class="modal-close" id="closeApproval">&times;</button></div>
            <div class="modal-body"><p>确认将 <strong id="approvalDocName"></strong> 提交至<strong>绿金系统审批模块</strong>？</p>
            <p style="font-size:13px;color:#909399;margin-top:8px">审批流转由宿主系统处理，本模块仅回写状态。</p></div>
            <div class="modal-footer"><button class="btn" id="cancelApproval">取消</button><button class="btn btn-primary" id="approvalConfirmBtn">确认提交</button></div>
          </div>
        </div>`);
      modal = qs('#approvalModal');
      qs('#closeApproval').onclick = () => hideModal('approvalModal');
      qs('#cancelApproval').onclick = () => hideModal('approvalModal');
    }
  }
  if (modal) {
    qs('#approvalDocName').textContent = docName;
    qs('#approvalConfirmBtn').onclick = () => {
      Store.submitApproval(docType, docId, docName);
      toast('已提交审核！请在绿金系统待办中处理', 'success');
      hideModal('approvalModal');
      route();
    };
    showModal('approvalModal');
  }
};

window.addEventListener('hashchange', route);
window.addEventListener('load', route);

/* ============================================================
   企业历年排放记录弹窗
   ============================================================ */
function openCaHistoryModal(accountId) {
  const d = Store.get();
  const acc = Store.getCarbonAccount(accountId);
  if (!acc) { toast('未找到账户', 'warning'); return; }

  const trendRecords = CarbonAccount.collectTrendRecordsForAccount(d, acc);
  const { years } = CarbonAccount.resolveListYear(d, [acc], trendRecords, null);
  const trendRows = CarbonAccount.buildTrendForAccount(d, acc, years);
  const formal = (d.formalList || []).find(f => f.id === acc.formalId);
  const customerNo = CarbonAccount.resolveCustomerNo(d, acc, formal, null);

  const yearSet = new Set([
    ...Object.keys(acc.annualProfiles || {}),
    ...trendRows.map(t => String(t.year)),
    ...(d.carbonAccountRecords || []).filter(r => r.accountId === acc.id).map(r => String(r.year))
  ]);
  const allYears = [...yearSet].filter(Boolean).sort((a, b) => b.localeCompare(a));
  const canEdit = canEditCarbonAccount(Store.get().currentRole);

  const tbody = allYears.map(yearStr => {
    const metrics = CarbonAccount.resolveYearMetrics(d, acc, yearStr);
    const entityVal = metrics.entityEmission != null ? formatNum(metrics.entityEmission) : '—';
    const viewHref = `#/carbon-account?id=${encodeURIComponent(accountId)}&year=${encodeURIComponent(yearStr)}&tab=profile`;
    const editHref = `#/carbon-account?id=${encodeURIComponent(accountId)}&year=${encodeURIComponent(yearStr)}&mode=edit`;
    const isActive = CarbonAccount.isAccountActive(acc);
    const statusBadge = renderCaAccountStatusBadge(acc);
    return `<tr>
      <td>${yearStr}年</td>
      <td>${metrics.method || '—'}</td>
      <td style="text-align:right">${entityVal}</td>
      <td>${statusBadge}</td>
      <td>
        <a href="${viewHref}" class="btn-link" onclick="hideModal('reviewModal')">查看</a>
        ${isActive && canEdit ? `<a href="${editHref}" class="btn-link" onclick="hideModal('reviewModal')" style="margin-left:6px">编辑</a>` : ''}
      </td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="text-align:center;padding:24px;color:#909399">暂无历年记录</td></tr>`;

  const customerName = acc.customerName || '—';

  ensureReviewModal();
  qs('#reviewModal')?.querySelector('.modal')?.classList.add('modal-lg');
  qs('#reviewModalTitle').textContent = `历年排放记录 · ${customerName}`;
  qs('#reviewModalBody').innerHTML = `
    <div style="margin-bottom:12px;color:#606266;font-size:13px">
      <span>客户号：${customerNo || '—'}</span>
    </div>
    <div class="table-wrap"><table class="data-table">
      <thead><tr>
        <th>核算年度</th><th>核算方法</th>
        <th style="text-align:right">主体排放(tCO₂e)</th>
        <th>账户状态</th><th>操作</th>
      </tr></thead>
      <tbody>${tbody}</tbody>
    </table></div>`;
  qs('#reviewModalFooter').innerHTML = `<button class="btn" onclick="hideModal('reviewModal')">关闭</button>`;
  showModal('reviewModal');
}
