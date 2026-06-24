/** GB/T 4754-2017 四级行业级联 — 多列面板（依赖 GB4754_TREE） */
window.IndustryCascade = {
  _nameMap: null,
  _allLeavesCache: null,

  nameMap() {
    if (!this._nameMap && window.GB4754_FLAT) {
      this._nameMap = Object.fromEntries(GB4754_FLAT.map(i => [i.c, i.n]));
    }
    return this._nameMap || {};
  },

  allLeafCodes() {
    if (this._allLeavesCache) return this._allLeavesCache;
    if (window.GB4754_FLAT) {
      this._allLeavesCache = GB4754_FLAT.filter(i => i.l === 3).map(i => i.c);
    } else {
      const codes = [];
      const walk = nodes => nodes.forEach(n => {
        if (n.l === 3) codes.push(n.c);
        else walk(n.ch || []);
      });
      walk(window.GB4754_TREE || []);
      this._allLeavesCache = codes;
    }
    return this._allLeavesCache;
  },

  label(code) {
    const name = this.nameMap()[code];
    return name ? `${code} ${name}` : code;
  },

  presetCodes(scope) {
    const s = typeof normalizeIndustryScopeValue === 'function'
      ? normalizeIndustryScopeValue(scope)
      : scope;
    if (s === '自定义') return [];
    if (s === INDUSTRY_SCOPE_KEY_EXTENDED) return IndustryScope.getExtendedCascadeCodes();
    return IndustryScope.getEightCascadeCodes();
  },

  isCustomScope(scope) {
    return scope === '自定义';
  },

  _scopeValue(scopeEl) {
    if (!scopeEl) return '';
    if (scopeEl.tagName === 'SELECT') return scopeEl.value;
    const name = scopeEl.dataset?.scopeName || scopeEl.name;
    if (!name) return scopeEl.value || '';
    const form = scopeEl.closest('form');
    if (form && form[name]) return form[name].value;
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked?.value || '';
  },

  _bindScopeChange(scopeEl, handler) {
    if (!scopeEl) return;
    if (scopeEl.tagName === 'SELECT') {
      scopeEl.addEventListener('change', handler);
      return;
    }
    const name = scopeEl.dataset?.scopeName || scopeEl.name;
    const root = scopeEl.closest('form') || document;
    qsa(`input[name="${name}"]`, root).forEach(r => r.addEventListener('change', handler));
  },

  renderPanel(selectedCodes, leafReadonly, options = {}) {
    const { wrapId = 'industryCascadePanel', countId = 'industryCascadeCount' } = options;
    const selected = selectedCodes || [];
    const presetReadonly = !!leafReadonly;
    return `
      <div class="industry-cascade-panel" id="${wrapId}" data-readonly="${presetReadonly ? '1' : '0'}" data-selected="${selected.join(',')}" data-active-path="">
        <div class="industry-cascade-toolbar">
          <span class="industry-cascade-actions" style="display:${presetReadonly ? 'none' : ''}">
            <button type="button" class="btn btn-sm industry-cascade-select-all">行业全选</button>
            <button type="button" class="btn btn-sm industry-cascade-clear-all">清空</button>
            <span class="industry-selected-count">已选 <b id="${countId}">${selected.length}</b> 项</span>
          </span>
        </div>
        <div class="industry-cascade-columns">
          <div class="industry-cascade-col" data-level="0"><div class="industry-cascade-col-body"></div></div>
          <div class="industry-cascade-col" data-level="1"><div class="industry-cascade-col-body"></div></div>
          <div class="industry-cascade-col" data-level="2"><div class="industry-cascade-col-body"></div></div>
          <div class="industry-cascade-col industry-cascade-col-leaf" data-level="3"><div class="industry-cascade-col-body"></div></div>
        </div>
      </div>`;
  },

  _findNode(code) {
    let found = null;
    const walk = nodes => {
      for (const n of nodes) {
        if (n.c === code) { found = n; return; }
        walk(n.ch || []);
        if (found) return;
      }
    };
    walk(window.GB4754_TREE || []);
    return found;
  },

  _leafCodesOf(node) {
    const codes = [];
    const walk = n => {
      if (n.l === 3) codes.push(n.c);
      else (n.ch || []).forEach(walk);
    };
    walk(node);
    return codes;
  },

  _getPath(panel) {
    return (panel.dataset.activePath || '').split(',').filter(Boolean);
  },

  _setPath(panel, path) {
    panel.dataset.activePath = path.join(',');
  },

  _selectedSet(panel) {
    return new Set((panel.dataset.selected || '').split(',').filter(Boolean));
  },

  _displaySelected(panel, scopeSelectEl) {
    const scope = this._scopeValue(scopeSelectEl);
    const readonly = this._isPresetScope(scope);
    if (readonly) return new Set(this.presetCodes(scope));
    return this._selectedSet(panel);
  },

  _isPresetScope(scope) {
    return !this.isCustomScope(scope);
  },

  _syncCount(panel, scopeSelectEl) {
    const countEl = panel.querySelector('.industry-selected-count b');
    const n = this._displaySelected(panel, scopeSelectEl).size;
    if (countEl) countEl.textContent = n;
  },

  _nodesAtLevel(level, path) {
    if (level === 0) return window.GB4754_TREE || [];
    const parentCode = path[level - 1];
    if (!parentCode) return [];
    return (this._findNode(parentCode)?.ch || []).filter(n => n.l === level);
  },

  _parentCheckState(node, displaySelected, readonly) {
    const leaves = this._leafCodesOf(node);
    if (!leaves.length) return { checked: false, indeterminate: false };
    const n = leaves.filter(c => displaySelected.has(c)).length;
    return {
      checked: n === leaves.length,
      indeterminate: n > 0 && n < leaves.length,
      disabled: readonly
    };
  },

  _renderRow(node, level, activeCode, readonly, displaySelected) {
    const isActive = node.c === activeCode;
    const hasChild = level < 3 && (node.ch || []).length > 0;
    const isLeaf = level === 3;
    let checked = false;
    let indeterminate = false;
    let disabled = readonly;

    if (isLeaf) {
      checked = displaySelected.has(node.c);
    } else {
      const st = this._parentCheckState(node, displaySelected, readonly);
      checked = st.checked;
      indeterminate = st.indeterminate;
      disabled = st.disabled;
    }

    const display = isLeaf ? `${node.c} ${node.n}` : node.n;
    const codePrefix = !isLeaf && level > 0 ? `<span class="industry-cascade-code">${node.c}</span>` : '';
    const arrow = hasChild ? '<span class="industry-cascade-arrow" aria-hidden="true">›</span>' : '<span class="industry-cascade-arrow is-empty"></span>';

    return `
      <div class="industry-cascade-item${isActive ? ' is-active' : ''}" data-code="${node.c}" data-level="${level}" title="${node.n}">
        <label class="industry-cascade-item-main" title="${node.n}">
          <input type="checkbox" class="industry-cascade-check industry-code-check" value="${node.c}" data-level="${level}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} ${indeterminate ? 'data-indeterminate="1"' : ''}>
          <span class="industry-cascade-text">${codePrefix}${display}</span>
        </label>
        ${arrow}
      </div>`;
  },

  _renderColumns(panel, scopeSelectEl) {
    const path = this._getPath(panel);
    const scope = this._scopeValue(scopeSelectEl);
    const readonly = this._isPresetScope(scope);
    const displaySelected = this._displaySelected(panel, scopeSelectEl);

    qsa('.industry-cascade-col', panel).forEach(col => {
      const level = Number(col.dataset.level);
      const body = qs('.industry-cascade-col-body', col);
      if (!body) return;
      const nodes = this._nodesAtLevel(level, path);
      if (!nodes.length) {
        body.innerHTML = level === 0
          ? '<p class="industry-cascade-col-empty">暂无行业数据</p>'
          : '<p class="industry-cascade-col-empty">—</p>';
        return;
      }
      body.innerHTML = nodes.map(n => this._renderRow(n, level, path[level], readonly, displaySelected)).join('');
      qsa('input[data-indeterminate="1"]', body).forEach(cb => { cb.indeterminate = true; });
    });
  },

  _setSelected(panel, codes) {
    panel.dataset.selected = (codes || []).join(',');
  },

  _toggleNode(panel, node, level, checked, scopeSelectEl) {
    if (this._isPresetScope(this._scopeValue(scopeSelectEl))) return;
    const selected = this._selectedSet(panel);
    const leaves = level === 3 ? [node.c] : this._leafCodesOf(node);
    leaves.forEach(c => {
      if (checked) selected.add(c);
      else selected.delete(c);
    });
    this._setSelected(panel, [...selected]);
    this._syncCount(panel, scopeSelectEl);
    this._renderColumns(panel, scopeSelectEl);
  },

  bindPanel(wrapEl, scopeSelectEl) {
    const panel = wrapEl ? qs('.industry-cascade-panel', wrapEl) : null;
    if (!panel || !window.GB4754_TREE) return;

    const applyScope = (fromUserChange = false) => {
      const scope = this._scopeValue(scopeSelectEl);
      const custom = this.isCustomScope(scope);
      panel.dataset.readonly = custom ? '0' : '1';
      const toolbar = qs('.industry-cascade-actions', panel);
      if (toolbar) toolbar.style.display = custom ? '' : 'none';

      if (custom) {
        if (fromUserChange) {
          this._setSelected(panel, []);
          this._setPath(panel, []);
        }
      } else {
        this._setSelected(panel, this.presetCodes(scope));
        this._setPath(panel, []);
      }

      this._syncCount(panel, scopeSelectEl);
      this._renderColumns(panel, scopeSelectEl);
    };

    panel.addEventListener('click', e => {
      if (e.target.closest('.industry-cascade-item-main')) return;
      const item = e.target.closest('.industry-cascade-item');
      if (!item) return;
      const code = item.dataset.code;
      const level = Number(item.dataset.level);
      const path = this._getPath(panel).slice(0, level);
      path[level] = code;
      this._setPath(panel, path);
      this._renderColumns(panel, scopeSelectEl);
    });

    panel.addEventListener('change', e => {
      const cb = e.target;
      if (!cb.classList.contains('industry-cascade-check')) return;
      e.stopPropagation();
      const node = this._findNode(cb.value);
      if (!node) return;
      this._toggleNode(panel, node, Number(cb.dataset.level), cb.checked, scopeSelectEl);
    });

    panel.addEventListener('click', e => {
      if (e.target.closest('.industry-cascade-check')) e.stopPropagation();
    }, true);

    qs('.industry-cascade-select-all', panel)?.addEventListener('click', () => {
      if (this._isPresetScope(this._scopeValue(scopeSelectEl))) return;
      this._setSelected(panel, this.allLeafCodes());
      this._syncCount(panel, scopeSelectEl);
      this._renderColumns(panel, scopeSelectEl);
    });

    qs('.industry-cascade-clear-all', panel)?.addEventListener('click', () => {
      if (this._isPresetScope(this._scopeValue(scopeSelectEl))) return;
      this._setSelected(panel, []);
      this._syncCount(panel, scopeSelectEl);
      this._renderColumns(panel, scopeSelectEl);
    });

    this._bindScopeChange(scopeSelectEl, () => applyScope(true));

    applyScope(false);
  },

  getSelectedCodes(wrapEl) {
    const panel = wrapEl ? qs('.industry-cascade-panel', wrapEl) : null;
    if (!panel) return [];
    return (panel.dataset.selected || '').split(',').filter(Boolean);
  }
};
