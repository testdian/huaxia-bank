/**
 * 演示环境专用：六步流程「排放计算」步骤进入规则说明（上线版本不包含此脚本即可移除）
 */
(function () {
  const ENABLED = window.__DEMO_CALC_STEP_DEV_SPEC__ !== false;

  function esc(s) {
    return typeof escapeHtml === 'function' ? escapeHtml(s) : String(s || '');
  }

  function getSpec() {
    return {
      title: '排放计算步骤 · 开发说明',
      rules: [
        '分行审批截止日期前：当任务下全部已锁定业务的「排放结果（tCO₂e）」均有值（手动优先、否则系统）时，六步流程可点击进入「排放计算」步骤。',
        '到达分行审批截止日期当日及之后：任务自动进入「排放计算」步骤（workflowStep 推进至排放计算）。',
        '截止日自动进入时，对已下发手动核算采集任务（dispatchedAt 有值）且数据状态非「填报完成」的记录：数据采集列表「数据状态」统一变更为「强制结束」；数据审核列表「审核状态」不论处于分行初审/总行终审/待审核等任何节点，均变更为「强制结束」。',
        '已填报完成（auditStage=approved）的采集任务不受影响；未派发的归集单元、系统直算/格澜路径记录按既有口径保留排放结果。',
        '演示环境可通过 window.__DEMO_CALC_STEP_REF_DATE__ 覆盖「当前日期」以验收截止日逻辑；正式系统使用服务器日期。'
      ],
      fields: [
        { name: '分行审批截止日期', source: 'task.branchDeadline', note: '新建核算任务表单「组织范围」下方字段' },
        { name: '排放结果（tCO₂e）', source: 'getEffectiveEntityEmission', note: '数据采集列表：手动主体排放优先，否则系统主体排放' },
        { name: '数据状态 · 强制结束', source: 'supplement.auditStage=forced_end', note: '数据采集列表展示橙色「强制结束」' },
        { name: '审核状态 · 强制结束', source: 'approval.status=forced_end', note: '数据审核列表（总行/分行）展示「强制结束」' }
      ]
    };
  }

  function renderStepTrigger() {
    if (!ENABLED) return '';
    return `<button type="button" class="dev-calc-step-trigger" data-calc-step-spec="1" title="演示专用：点击查看排放计算步骤进入规则（上线版无此标识）">
      <span class="dev-import-spec-tag">DEV</span>
    </button>`;
  }

  function renderSpecHtml(spec) {
    const rules = (spec.rules || []).map(t => `<li>${esc(t)}</li>`).join('');
    const fieldRows = (spec.fields || []).map(f =>
      `<tr><td>${esc(f.name)}</td><td><code>${esc(f.source)}</code></td><td>${esc(f.note || '—')}</td></tr>`
    ).join('');
    return `
      <p class="dev-import-spec-banner">演示环境专用标识，正式系统不包含此说明入口。</p>
      <h5 class="dev-import-spec-section-title">进入规则</h5>
      <ul class="dev-import-spec-logic">${rules}</ul>
      <h5 class="dev-import-spec-section-title">关键字段</h5>
      <div class="table-wrap dev-import-spec-table-wrap">
        <table class="data-table dev-import-spec-table">
          <thead><tr><th>名称</th><th>数据口径</th><th>说明</th></tr></thead>
          <tbody>${fieldRows}</tbody>
        </table>
      </div>`;
  }

  function ensureDrawer() {
    let root = document.getElementById('calcStepDevSpecRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'calcStepDevSpecRoot';
      document.body.appendChild(root);
    }
    if (document.getElementById('calcStepDevSpecDrawer')) return;
    root.innerHTML = `
      <div class="drawer-overlay dev-import-spec-drawer" id="calcStepDevSpecDrawer">
        <div class="drawer-panel dev-import-spec-drawer-panel" role="dialog" aria-labelledby="calcStepDevSpecTitle">
          <div class="drawer-header dev-import-spec-drawer-header">
            <h4 id="calcStepDevSpecTitle">排放计算步骤说明</h4>
            <button type="button" class="drawer-close" id="closeCalcStepDevSpecDrawer" aria-label="关闭">&times;</button>
          </div>
          <div class="drawer-body dev-import-spec-drawer-body" id="calcStepDevSpecContent"></div>
        </div>
      </div>`;
    document.getElementById('closeCalcStepDevSpecDrawer').onclick = () => hideDrawer();
    document.getElementById('calcStepDevSpecDrawer').onclick = (e) => {
      if (e.target.id === 'calcStepDevSpecDrawer') hideDrawer();
    };
  }

  function showDrawer() {
    ensureDrawer();
    const spec = getSpec();
    document.getElementById('calcStepDevSpecTitle').textContent = spec.title;
    document.getElementById('calcStepDevSpecContent').innerHTML = renderSpecHtml(spec);
    document.getElementById('calcStepDevSpecDrawer').classList.add('show');
    document.body.classList.add('drawer-open');
  }

  function hideDrawer() {
    document.getElementById('calcStepDevSpecDrawer')?.classList.remove('show');
    document.body.classList.remove('drawer-open');
  }

  function bindTriggers(root) {
    if (!ENABLED) return;
    (root || document).querySelectorAll('[data-calc-step-spec="1"]').forEach(btn => {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showDrawer();
      });
    });
  }

  window.renderCalculationStepDevTrigger = renderStepTrigger;
  window.bindCalculationStepDevSpec = bindTriggers;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('[data-calc-step-spec="1"]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      showDrawer();
    }
  });
})();
