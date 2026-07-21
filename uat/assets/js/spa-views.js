/** 各页面视图渲染 */
const SPA_VIEWS = {};

function roleFilterSupplements(supps, roleKey, role) {
  let list = (supps || []).filter(s => s.dispatchedAt);
  if (roleKey === 'branch' && role.branch) list = list.filter(s => s.branch === role.branch);
  if (roleKey === 'manager') list = list.filter(s => s.manager === role.user);
  return list;
}

SPA_VIEWS['#/dashboard'] = function(ctx) {
  const { task } = ctx;
  const calcs = Store.getCalculations(task.id);
  const totalAttr = calcs.filter(c => c.attributedEmission).reduce((s, c) => s + c.attributedEmission, 0);
  const suppPct = task.supplementTotal ? Math.round(task.supplementDone / task.supplementTotal * 100) : 0;
  const dqr = task.dqr || Store.calcDQR(task.id);
  const ms = task.milestone || {};
  return `
    <h1 class="page-title">首页工作台</h1>
    <p class="page-desc">当前任务：${task.name}</p>
    <div class="demo-tip">演示系统：可切换角色；点击顶部「重置数据」加载全流程模拟数据（48笔候选→8笔正式→补数→计算→报告）。</div>
    ${workflowStepsBar(task)}
    <div class="stats-row">
      <div class="stat-card"><div class="label">接口同步</div><div class="value">${task.candidateCount || 0}</div><div class="sub">笔候选</div></div>
      <div class="stat-card"><div class="label">正式清单</div><div class="value">${task.formalCount || 0}</div></div>
      <div class="stat-card accent"><div class="label">补数完成</div><div class="value">${suppPct}%</div><div class="sub">${task.supplementDone}/${task.supplementTotal}</div></div>
      <div class="stat-card"><div class="label">归因排放</div><div class="value">${formatNum(totalAttr)}</div><div class="sub">吨 CO₂e</div></div>
      <div class="stat-card"><div class="label">DQR</div><div class="value">${dqr ? dqr.dqr : '-'}</div><div class="sub">${dqr ? dqr.level : '待计算'}</div></div>
    </div>
    <div class="card"><div class="card-header"><h3>流程里程碑</h3></div><div class="card-body milestone-list">
      <span class="badge ${ms.candidatesSynced?'badge-success':'badge-draft'}">① 台账已同步</span>
      <span class="badge ${ms.formalLocked?'badge-success':'badge-draft'}">② 正式清单已锁定</span>
      <span class="badge ${ms.supplementDispatched?'badge-success':'badge-draft'}">③ 补数已派发</span>
      <span class="badge ${ms.calculationDone?'badge-success':'badge-draft'}">④ 排放已计算</span>
      <span class="badge ${ms.reportGenerated?'badge-success':'badge-draft'}">⑥ 报告已生成</span>
    </div></div>
    <div class="card"><div class="card-header"><h3>演示流程指引</h3></div><div class="card-body">
      <ol style="padding-left:20px;line-height:2">
        <li><a href="#/candidates">清单识别</a> → <a href="#/formal">对象边界</a> → <a href="#/data-collect">数据采集</a></li>
        <li><a href="#/branch-board">数据采集填报</a> → <a href="#/approvals">数据审核</a> → 审核通过后进入排放计算</li>
        <li><a href="#/calculation">排放计算</a> → 确认结果 → <a href="#/reports">生成报告</a></li>
      </ol>
      <p style="margin-top:12px;color:#909399;font-size:13px">数据采集页发放任务，客户经理在「数据采集」填报，管理员在「数据审核」审批</p>
    </div></div>`;
};

SPA_VIEWS['#/progress'] = function(ctx) {
  const { task, data } = ctx;
  const suppPct = task.supplementTotal ? Math.round(task.supplementDone / task.supplementTotal * 100) : 0;
  return `
    <h1 class="page-title">任务进度总览</h1>
    <p class="page-desc">${task.name} · 总进度 ${task.progress}%</p>
    ${workflowStepsBar(task)}
    <div class="stats-row">
      <div class="stat-card"><div class="label">正式清单</div><div class="value">${task.formalCount||0}</div></div>
      <div class="stat-card accent"><div class="label">补数完成率</div><div class="value">${suppPct}%</div></div>
      <div class="stat-card"><div class="label">DQR</div><div class="value">${task.dqr ? task.dqr.dqr : '-'}</div></div>
    </div>
    <div class="card"><div class="card-header"><h3>各分行补数进度</h3><a href="#/data-collect" class="btn btn-sm">数据采集</a></div>
    ${(() => {
      const listKey = 'progress_branches';
      const view = paginateData(listKey, data.branchStats);
      return `<div class="card-body table-wrap"><table class="data-table"><thead><tr><th>分行</th><th>总数</th><th>完成</th><th>待办</th><th>逾期</th><th>完成率</th></tr></thead>
    <tbody>${view.rows.map(b => `<tr><td>${b.branch}</td><td>${b.total}</td><td>${b.done}</td><td>${b.pending}</td><td>${b.overdue}</td><td>${Math.round(b.done/b.total*100)}%</td></tr>`).join('')}</tbody></table></div>
    ${renderPagination(listKey, view)}`;
    })()}</div>`;
};

SPA_VIEWS['#/tasks'] = function(ctx) {
  const { data } = ctx;
  const filters = getTaskFilters();
  const filtered = filterTasks(data.tasks, filters);
  const listKey = 'tasks';
  const view = paginateData(listKey, filtered);
  const progressOpts = WORKFLOW_STEP_NAMES.map((name, i) =>
    `<option value="${i}" ${String(filters.progress) === String(i) ? 'selected' : ''}>${name}</option>`
  ).join('');
  return `
    <h1 class="page-title">核算任务管理</h1>
    <div class="toolbar"><a href="#/task-create" class="btn btn-primary">+ 新建核算任务</a></div>
    <div class="card">
      <div class="card-header"><h3>筛选条件</h3></div>
      <div class="filter-panel">
        <div class="filter-extra task-list-filter-grid">
          <div class="form-item"><label>任务名称</label><input id="tf_name" placeholder="模糊搜索" value="${filters.name || ''}"></div>
          <div class="form-item"><label>核算年度</label>${renderTaskYearFilterField(filters.year)}</div>
          <div class="form-item"><label>数据行业范围</label>
            ${renderTaskIndustryScopeFilterSelect('tf_data_industry', filters.dataIndustryScope || filters.investIndustryScope || filters.industryScope)}
          </div>
          <div class="form-item"><label>当前进度</label>
            <select id="tf_progress"><option value="">全部</option>${progressOpts}</select>
          </div>
          <div class="form-item"><label>&nbsp;</label>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary" id="taskFilterBtn">查询</button>
              <button class="btn" id="taskFilterResetBtn">重置</button>
            </div>
          </div>
        </div>
      </div>
      <div class="table-wrap"><table class="data-table table-col-resizable" data-col-resize-key="tasks_col_widths">
        <thead><tr>
          <th class="col-no-resize">序号</th><th>任务名称</th><th>核算年度</th><th>数据行业范围</th><th>数据采集截止</th><th>分行审批截止</th>
          <th>当前进度</th><th class="col-no-resize actions">操作</th>
        </tr></thead>
        <tbody>${view.rows.length ? view.rows.map((t, i) => {
      normalizeTaskIndustryFields(t);
      return `<tr>
      <td>${view.startIndex + i + 1}</td>
      <td>${t.name}</td>
      <td>${t.year}</td>
      <td>${renderTaskDataIndustryScopeCell(t)}</td>
      <td>${t.deadline || '-'}</td>
      <td>${t.branchDeadline || '-'}</td>
      <td>${getTaskStepLabel(t)}</td>
      <td class="actions">
        <a href="#/task-edit?id=${t.id}" class="btn-link">编辑</a>
        <a href="#/task-view?id=${t.id}" class="btn-link">查看</a>
        <button type="button" class="btn-link btn-link-danger task-delete-btn" data-id="${t.id}" data-name="${t.name.replace(/"/g, '&quot;')}">删除</button>
      </td>
    </tr>`;
    }).join('') : `<tr><td colspan="8" style="text-align:center;padding:40px;color:#909399">暂无符合条件的任务</td></tr>`}
        </tbody></table></div>
      ${renderPagination(listKey, view)}</div>`;
};

SPA_VIEWS['#/task-create'] = function() {
  return `
    <h1 class="page-title">新建核算任务</h1>
    ${demoSteps(0, { clickable: true })}
    <div class="card"><div class="card-body"><form id="taskForm" class="form-grid" novalidate>
      ${renderTaskFormFields({ name: '2026年度投融资碳排放核算', year: 2026, subjectIndustryScope: '八大高碳行业', investIndustryScope: '八大高碳行业', deadline: '2027-09-30', branchDeadline: '2027-10-15', balanceRule: '月均余额', orgScope: '全行', goal: '监管报送' })}
    </form></div>
    <div style="padding:12px 20px;text-align:right;border-top:1px solid #eee">
      <a href="#/tasks" class="btn">取消</a>
      <button type="button" class="btn btn-primary" id="saveTaskBtn">保存并启动</button>
    </div></div>`;
};

SPA_VIEWS['#/task-edit'] = function(ctx) {
  const id = getQuery('id') || ctx.task.id;
  const t = Store.getTask(id) || ctx.task;
  return `
    <h1 class="page-title">编辑核算任务</h1>
    <p class="page-desc">${t.id}</p>
    ${workflowStepsBar(t)}
    <div class="card"><div class="card-body"><form id="taskForm" class="form-grid" novalidate data-task-id="${t.id}">
      ${renderTaskFormFields(t)}
    </form></div>
    <div style="padding:12px 20px;text-align:right;border-top:1px solid #eee">
      <a href="#/tasks" class="btn">取消</a>
      <button class="btn btn-primary" id="saveTaskEditBtn">保存</button>
    </div></div>`;
};

SPA_VIEWS['#/task-view'] = function(ctx) {
  const id = getQuery('id') || ctx.task.id;
  const t = Store.getTask(id) || ctx.task;
  const taskProgress = getTaskMaxWorkflowStep(t);
  return `
    <h1 class="page-title">查看核算任务</h1>
    ${demoSteps(WORKFLOW_STEP.TASK_CREATE, { taskId: t.id, clickable: true, maxStep: taskProgress, taskProgressStep: taskProgress, viewMode: true })}
    <div class="card"><div class="card-body"><form class="form-grid task-form-readonly">
      ${renderTaskFormFields(t, { readonly: true, showRequired: false })}
    </form></div>
    <div style="padding:12px 20px;text-align:right;border-top:1px solid #eee">
      <a href="#/tasks" class="btn">返回列表</a>
      <a href="#/task-edit?id=${t.id}" class="btn btn-primary">编辑</a>
    </div></div>`;
};

SPA_VIEWS['#/task-detail'] = function(ctx) {
  const id = new URLSearchParams((location.hash.split('?')[1]||'')).get('id') || ctx.task.id;
  const t = Store.getTask(id) || ctx.task;
  return `
    <h1 class="page-title">${t.name}</h1>
    <p class="page-desc">${t.id} · ${statusBadge(t.status)} ${approvalBadge(t.approvalStatus)}</p>
    ${taskWorkflowSteps(t)}
    <div class="toolbar">
      ${t.approvalStatus === 'none' ? `<button class="btn btn-primary" onclick="openApproval('task','${t.id}','${t.name}')">提交审核</button>` : ''}
      <a href="#/candidates" class="btn">候选清单</a><a href="#/formal" class="btn">正式清单</a>
      <a href="#/data-collect" class="btn">数据采集</a>
      <a href="#/calculation" class="btn btn-primary">碳排放计算</a>
    </div>
    <div class="card"><div class="card-body form-grid">
      <div class="form-item"><label>所属行业范围</label><input readonly value="${formatSingleIndustryScopeDisplay(getTaskSubjectIndustryScope(t), t.industryCustomCodes)}"></div>
      <div class="form-item"><label>投向行业范围</label><input readonly value="${formatSingleIndustryScopeDisplay(getTaskInvestIndustryScope(t), t.investIndustryCustomCodes)}"></div>
      ${getTaskSubjectIndustryScope(t) === '自定义' && t.industryCustomCodes?.length ? `
      <div class="form-item full">
        <label>所属行业自定义明细</label>
        <div class="industry-detail-tags">${t.industryCustomCodes.map(code => {
          const item = INDUSTRY_TABLE.find(i => i.code === code);
          return item ? `<span class="industry-tag">${IndustryScope.label(item)}</span>` : '';
        }).join('')}</div>
      </div>` : ''}
      ${getTaskInvestIndustryScope(t) === '自定义' && t.investIndustryCustomCodes?.length ? `
      <div class="form-item full">
        <label>投向行业自定义明细</label>
        <div class="industry-detail-tags">${t.investIndustryCustomCodes.map(code => {
          const item = INDUSTRY_TABLE.find(i => i.code === code);
          return item ? `<span class="industry-tag">${IndustryScope.label(item)}</span>` : '';
        }).join('')}</div>
      </div>` : ''}
      <div class="form-item"><label>组织范围</label><input readonly value="${formatTaskOrgScopeDisplay(t)}"></div>
      <div class="form-item"><label>输出目标</label><input readonly value="${t.goal}"></div>
      <div class="form-item"><label>数据采集截止日期</label><input readonly value="${t.deadline}"></div>
      <div class="form-item"><label>分行审批截止日期</label><input readonly value="${t.branchDeadline || '-'}"></div>
    </div></div>`;
};

SPA_VIEWS['#/candidates'] = function(ctx) {
  const taskId = ctx.task.id;
  const task = ctx.task;
  const viewOnly = isTaskViewMode();
  const vma = viewModeDisabledAttr();
  const synced = !!task.syncedFromInterface;
  let rules = Store.getCandidateFilterRules(taskId);
  const view = synced ? Store.getCandidatesForView(taskId, rules) : { rows: [], total: 0, stats: {} };
  const expandedProjectRows = getCandidateProjectExpandedSet(taskId);

  const rowsHtml = view.rows.length ? view.rows.map(c => {
    const expanded = expandedProjectRows.has(c.id);
    const mainRow = `
    <tr>
      <td class="col-select"><input type="checkbox" class="row-check" data-id="${c.id}" ${c.included ? 'checked' : ''} ${viewOnly || !synced ? 'disabled' : ''}></td>
      ${renderCandidateListCells(c, { showProjectToggle: true, projectExpanded: expanded, task })}
      <td>${c.included ? '<span class="badge badge-success">拟纳入</span>' : '<span class="badge badge-draft">未勾选</span>'}</td>
    </tr>`;
    if (!expanded) return mainRow;
    return mainRow + renderCandidateProjectDetailRow(c, ledgerListTableColCount({ headCheckbox: true, tailExtra: 1 }));
      }).join('') : `<tr><td colspan="${ledgerListTableColCount({ headCheckbox: true, tailExtra: 1 })}" style="text-align:center;padding:40px;color:#909399">
      ${synced ? '无符合筛选条件的记录，请调整筛选后重新查询' : '暂无台账数据，请先点击上方「从接口同步台账」'}</td></tr>`;

  const syncTip = synced
    ? `<div class="demo-tip">已从接口管理同步 <b>${task.syncYear || task.year}</b> 年度台账 · 信贷核心系统${task.syncRecordTotal ? ' · 汇总 <b>' + task.syncRecordTotal.toLocaleString() + '</b> 笔' : ''}${task.syncBatchCount ? '（' + task.syncBatchCount + ' 个成功批次）' : ''} · 最近同步：${task.syncedAt}</div>`
    : '';

  const filterPanelHtml = synced ? renderCandidateFilterPanel(rules, task, { viewOnly }) : '';

  return `
    <h1 class="page-title">候选业务清单</h1>
    ${workflowStepsBar(ctx.task)}
    ${syncTip}
    <div class="toolbar">
      <button class="btn btn-primary" id="importBtn"${vma}>从接口同步台账（${task.year}年度）</button>
      <button class="btn"${viewOnly ? vma : (synced ? '' : ' disabled title="请先同步台账"')}>Excel 导出</button>
      <span class="spacer"></span>
      <button class="btn btn-success" id="goFormalBtn"${viewOnly ? vma : (synced ? '' : ' disabled title="请先同步台账"')}>生成正式清单（${view.stats.includedCount || 0} 笔）</button>
    </div>
    <div class="card">
      <div class="card-header"><h3>筛选条件</h3><span style="font-size:12px;color:#909399">${synced ? '点击「查询」后，当前列表内业务默认拟纳入，可取消勾选' : '需先完成台账同步'}</span></div>
      ${filterPanelHtml}
      ${synced ? `<div class="list-stats">
        <span>已接入 <b>${view.stats.syncedTotal || 0}</b> 笔</span>
        <span>已勾选拟纳入 <b>${view.stats.includedCount || 0}</b> 笔</span>
        <span>当前列表 <b>${view.stats.viewCount || 0}</b> 笔</span>
      </div>` : ''}
      <div class="table-wrap"><table class="data-table">
        <thead><tr>
          <th class="col-select"><input type="checkbox" id="checkAllPage" title="全选列表" ${viewOnly || !synced ? 'disabled' : ''}></th>
          ${renderCandidateListTableHead(task)}
          <th>纳入标记</th>
        </tr></thead>
        <tbody id="candidateTbody">${rowsHtml}</tbody>
      </table></div>
    </div>`;
};

SPA_VIEWS['#/formal'] = function(ctx) {
  const taskId = ctx.task.id;
  const task = Store.getTask(taskId) || ctx.task;
  const viewOnly = isTaskViewMode();
  const vma = viewModeDisabledAttr();
  const industryEditMode = !!ctx.industryEditMode && !viewOnly;
  const list = Store.getFormalList(taskId);
  const expandedProjectRows = getCandidateProjectExpandedSet(taskId);
  const rowsHtml = list.map(f => {
    const canLock = f.status !== 'confirmed';
    const row = formalLedgerRow(f, taskId);
    const expanded = expandedProjectRows.has(f.customerId || f.id);
    const mainRow = `<tr>
      <td class="col-select"><input type="checkbox" class="formal-row-check" value="${f.id}" ${viewOnly || !canLock || industryEditMode ? 'disabled' : ''}></td>
      ${renderCandidateListCells(row, { showProjectToggle: true, projectExpanded: expanded, listKind: 'formal', task, formalId: f.id, industryEditMode })}
      <td>${statusBadge(f.status)}</td>
    </tr>`;
    if (!expanded) return mainRow;
    return mainRow + renderCandidateProjectDetailRow(row, ledgerListTableColCount({ headCheckbox: true, tailExtra: 1, summaryLedger: true }));
  }).join('');
  const toolbarExtra = viewOnly ? '' : (industryEditMode
    ? `<button class="btn btn-primary" id="saveFormalIndustryBtn">保存</button>
      <button class="btn" id="cancelFormalIndustryBtn">取消</button>`
    : `<button class="btn" id="editFormalIndustryBtn">修改行业</button>`);
  return `
    <h1 class="page-title">正式清单确认</h1>
    ${workflowStepsBar(task)}
    <div class="toolbar">
      <button class="btn btn-primary" id="confirmFormalBtn"${vma}${industryEditMode ? ' disabled' : ''}>确认锁定</button>
      <button class="btn" id="exportFormalBtn"${industryEditMode ? ' disabled' : ''}>Excel 导出</button>
      ${toolbarExtra}
    </div>
    <div class="card"><div class="table-wrap${industryEditMode ? ' formal-industry-edit-mode' : ''}"><table class="data-table${industryEditMode ? ' formal-industry-edit-mode' : ''}">
        <thead><tr>
          <th class="col-select"><input type="checkbox" id="formalCheckAll" title="全选列表" ${viewOnly ? 'disabled' : ''}></th>
          ${renderFormalListTableHead(task)}
          <th>状态</th>
        </tr></thead>
        <tbody id="formalTbody">${rowsHtml || `<tr><td colspan="${ledgerListTableColCount({ headCheckbox: true, tailExtra: 1, summaryLedger: true })}" style="text-align:center;padding:32px;color:#909399">暂无正式清单，请先在候选清单中生成</td></tr>`}</tbody>
      </table></div></div>`;
};

SPA_VIEWS['#/data-collect'] = function(ctx) {
  const taskId = ctx.task.id;
  const task = ctx.task;
  const viewOnly = isTaskViewMode();
  const vma = viewModeDisabledAttr();
  const d = Store.get();
  const roleKey = d.currentRole;
  const formals = d.formalList.filter(f => f.taskId === taskId);
  const groups = getDataCollectTableGroups(taskId, d);
  const filters = getDataCollectFilters(taskId);
  const filteredGroups = filterCollectGroupsList(groups, filters, taskId, d);
  const candidatesById = new Map();
  d.candidates.filter(c => c.taskId === taskId).forEach(c => candidatesById.set(c.id, c));
  const calcsByFormal = new Map();
  d.calculations.filter(c => c.taskId === taskId).forEach(c => calcsByFormal.set(c.formalId, c));
  const hasWanhuaDemo = groups.some(g =>
    g.taskId === taskId && (g.customerName || '').includes('万华化学归集示范') && (g.memberCount || 0) > 1
  );
  const rowsHtml = filteredGroups.map(g => {
    const supp = supplementForCollectGroup(d, taskId, g.id);
    const members = (g.memberFormalIds || []).map(fid => formals.find(f => f.id === fid)).filter(Boolean);
    const primary = members[0];
    const calc = primary ? calcsByFormal.get(primary.id) : null;
    const dataStatusCol = dataStatusBadge(primary, supp, taskId, d);
    const { systemHtml: systemEntityCol, manualHtml: manualEntityCol, effectiveHtml: effectiveEntityCol } =
      primary ? formatDataCollectEmissionCells(primary, supp, calc) : { systemHtml: '—', manualHtml: '—', effectiveHtml: '—' };
    const canDispatch = !viewOnly && !supp && g.status === 'pending';
    const canReject = !viewOnly && canHqAdminRejectSupplement(supp, roleKey, task);
    const checkCol = canDispatch
      ? `<input type="checkbox" class="dispatch-group-check" value="${g.id}">`
      : '';
    const ops = [];
    if (supp) {
      ops.push(`<button type="button" class="btn-link view-fill-btn" data-id="${supp.id}">查看填报</button>`);
      if (canReject) {
        ops.push(`<button type="button" class="btn-link reject-fill-btn" data-id="${supp.id}">退回</button>`);
      }
      if (!viewOnly && g.status !== 'completed') {
        ops.push(`<button type="button" class="btn-link reassign-manager-btn" data-group-id="${g.id}">改派收集人</button>`);
      }
    } else if (canDispatch) {
      ops.push(`<button type="button" class="btn-link reassign-manager-btn" data-group-id="${g.id}">改派收集人</button>`);
    } else if (!primary || primary.status !== 'confirmed') {
      ops.push('<span style="color:#909399">请先锁定</span>');
    } else {
      ops.push('—');
    }
    const industryNote = g.accountingIndustrySource === 'customer'
      ? '<span class="text-muted" style="font-size:12px">（多投向归客户行业）</span>'
      : '';
    const memberTable = renderCollectGroupMemberTable(g, formals, candidatesById, taskId, d, viewOnly);
    return `<tr class="collect-group-row" data-group-id="${g.id}">
      <td class="col-select">${checkCol}</td>
      <td>
        <span class="candidate-branch-cell">
          <button type="button" class="candidate-expand-toggle collect-group-expand" data-group-id="${g.id}" aria-expanded="false" title="展开逐笔明细"><span class="candidate-expand-icon"></span></button>
          <span>${g.customerName || '—'}</span>
        </span>
      </td>
      <td>${g.creditCode || '—'}</td>
      <td>${collectGroupBucketDisplay(g, d)}</td>
      <td>${g.memberCount || members.length || 0}</td>
      <td>${g.dispatchBranch || '—'}</td>
      <td>${g.assignedManager || '—'}</td>
      <td>${g.accountingIndustryLabel || g.accountingIndustryCode || '—'}${industryNote}</td>
      <td>${primary ? systemAccountingMethodBadge(primary, taskId, d) : '—'}</td>
      <td>${systemEntityCol}</td>
      <td>${primary ? manualAccountingMethodBadge(primary, taskId, d, supp) : '—'}</td>
      <td>${manualEntityCol}</td>
      <td>${effectiveEntityCol}</td>
      <td>${dataStatusCol}</td>
      <td>${ops.join(' ')}</td>
    </tr>
    <tr class="collect-group-detail-row" data-detail-for="${g.id}" hidden>
      <td colspan="15">${memberTable}</td>
    </tr>`;
  }).join('');
  const calcAccess = typeof getCalculationStepAccess === 'function'
    ? getCalculationStepAccess(taskId, d)
    : null;
  const collectDone = Store.isDataCollectionComplete(taskId);
  const deadlineTip = calcAccess?.forcedByDeadline
    ? '<div class="demo-tip calc-step-deadline-tip">分行审批截止日期已到：已下发且未完成填报的手动采集任务，数据采集「数据状态」与数据审核「审核状态」均已变更为<strong>强制结束</strong>；任务已自动进入「排放计算」步骤。</div>'
    : '';
  const emissionReadyTip = calcAccess?.allowed && calcAccess.reason === 'emission_ready'
    ? '<div class="demo-tip calc-step-emission-ready-tip">截止日前规则：全部已锁定归集单元的「排放结果（tCO₂e）」均有值，可点击进入「排放计算」步骤。</div>'
    : '';
  const collectDoneTip = collectDone && !calcAccess?.forcedByDeadline
    ? '<div class="demo-tip" style="border-color:#67c23a;background:#f0f9eb;color:#529b2e">数据采集已全部完成，可进入「排放计算」环节</div>'
    : '';
  return `
    <h1 class="page-title">数据采集</h1>
    ${workflowStepsBar(ctx.task)}
    ${hasWanhuaDemo
      ? '<div class="demo-tip">归集示范：<strong>万华化学归集示范</strong> 6 笔贷款合并为 4 个归集单元（非项目 1 + 项目 3，含跨行非项目、联合贷款与同客户多项目）。展开行可查看逐笔明细。</div>'
      : ''}
    ${deadlineTip}
    ${emissionReadyTip}
    ${collectDoneTip}
    <div class="toolbar">
      <button class="btn btn-success" id="fetchInterfaceDataBtn"${vma} title="先调取格澜报告法主体排放，再对剩余非项目主体记录执行经济活动法直算">调取接口数据</button>
      <button class="btn btn-primary" id="dispatchSupplementBtn"${vma}>发放采集任务</button>
      <span id="dispatchSelectedCount"></span>
    </div>
    <div class="card">
      <div class="card-header"><h3>筛选条件</h3></div>
      <div class="filter-panel">
        <fieldset class="view-mode-fieldset"${viewOnly ? ' disabled' : ''}>
        <div class="filter-extra task-filter-grid">
          <div class="form-item"><label>客户名称</label><input id="dcf_keyword" placeholder="模糊搜索" value="${filters.keyword || ''}"></div>
          <div class="form-item"><label>数据状态</label>
            <select id="dcf_data_status">${renderDataStatusOptions(filters.dataStatus || '')}</select>
          </div>
          <div class="form-item"><label>&nbsp;</label>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary" id="dataCollectFilterBtn">查询</button>
              <button class="btn" id="dataCollectFilterResetBtn">重置</button>
            </div>
          </div>
        </div>
        </fieldset>
      </div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr>
          <th class="col-select"><label class="dispatch-check-all-label"><input type="checkbox" id="dispatchCheckAll" title="全选可派发归集单元" ${viewOnly ? 'disabled' : ''}><span>全选</span></label></th>
          <th>客户</th><th>信用代码</th><th>业务种类</th><th>归并笔数</th><th>下发分行</th><th>主办客户经理</th><th>归集核算行业</th><th>系统核算方法</th><th>系统主体排放（tCO₂e）</th><th>手动核算方法</th><th>手动主体排放（tCO₂e）</th><th>排放结果（tCO₂e）</th><th>数据状态</th><th>操作</th>
        </tr></thead>
        <tbody id="dispatchTbody">${rowsHtml || `<tr><td colspan="15" style="text-align:center;padding:32px;color:#909399">${groups.length ? '无符合筛选条件的归集单元' : '暂无归集单元，请先锁定正式清单后点击「刷新归集」'}</td></tr>`}</tbody>
      </table></div></div>`;
};

SPA_VIEWS['#/boundary'] = function(ctx) {
  const listKey = 'boundary_' + ctx.task.id;
  const list = Store.getFormalList(ctx.task.id);
  const view = paginateData(listKey, list);
  return `
    <h1 class="page-title">核算对象与边界</h1>
    <p class="page-desc">Step 3 · 确认核算对象类型、边界与周期（范围一、二）</p>
    ${workflowStepsBar(ctx.task)}
    <div class="demo-tip">项目类业务核算「项目」边界；非项目类核算「融资主体」运营边界。</div>
    <div class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>客户</th><th>行业</th><th>核算对象</th><th>项目/设施</th><th>边界</th><th>控制法</th><th>周期</th><th>状态</th></tr></thead>
    <tbody>${view.rows.map(f => `<tr>
      <td>${f.customerName}</td><td>${f.industryMajor||'-'}</td><td>${f.objectType}</td>
      <td>${f.projectName || f.facilityLocation || '-'}</td><td>${f.boundary}</td>
      <td>${f.controlApproach || '运营控制法'}</td><td>${f.period}</td><td>${statusBadge(f.status)}</td>
    </tr>`).join('')}</tbody></table></div>
    ${renderPagination(listKey, view)}</div>
    <div class="card" style="margin-top:16px"><div class="card-header"><h3>边界说明</h3></div><div class="card-body" style="font-size:13px;line-height:1.8">
      ${list.filter(f=>f.boundaryNote).slice(0,3).map(f => `<p><strong>${f.customerName}：</strong>${f.boundaryNote}</p>`).join('') || '<p>请在正式清单锁定后维护边界说明。</p>'}
    </div></div>`;
};

SPA_VIEWS['#/branch-board'] = function(ctx) {
  const roleKey = Store.get().currentRole;
  const role = ctx.role;
  let supps = Store.getSupplements(ctx.task.id);
  supps = roleFilterSupplements(supps, roleKey, role);
  const listKey = 'branch_board_' + ctx.task.id;
  const view = paginateData(listKey, supps);
  return `
    <h1 class="page-title">数据采集</h1>
    <div class="stats-row">${['pending','in_progress','completed','returned'].map((st,i) => {
      const n = supps.filter(s=>s.status===st||(st==='pending'&&s.status==='pending')).length;
      const labels = {pending:'待处理',in_progress:'填报中',completed:'已完成',returned:'已退回'};
      return `<div class="stat-card"><div class="label">${labels[st]||st}</div><div class="value">${supps.filter(s=>s.status===st).length}</div></div>`;
    }).join('')}</div>
    <div class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>客户名称</th><th>客户经理</th><th>计算方法</th><th>填报截止日期</th><th>状态</th><th>操作</th></tr></thead>
    <tbody>${view.rows.map(s => `<tr><td>${s.customerName}</td><td>${s.manager}</td><td>${calcMethodLabel(s)}</td>
    <td>${s.deadline}</td><td>${supplementTaskStatusBadge(s)}</td>
    <td>${renderManagerSupplementOp(s)}</td></tr>`).join('')}</tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
};

SPA_VIEWS['#/manager-tasks'] = function(ctx) {
  const roleKey = Store.get().currentRole;
  const filters = getManagerTaskFilters(ctx.task.id);
  const roleScoped = roleFilterSupplements(Store.getSupplements(ctx.task.id), roleKey, ctx.role);
  const supps = filterManagerTaskList(roleScoped, filters);
  const listKey = 'manager_tasks_' + ctx.task.id;
  const view = paginateData(listKey, supps);
  return `
    <h1 class="page-title">客户经理任务清单</h1>
    <div class="card">
      <div class="card-header"><h3>筛选条件</h3></div>
      ${renderManagerTaskFilterPanel(filters)}
      <div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>客户名称</th><th>填报截止日期</th><th>状态</th><th>操作</th></tr></thead>
    <tbody>${view.rows.map(s => `<tr><td>${s.customerName}</td><td>${s.deadline}</td><td>${supplementTaskStatusBadge(s)}</td>
    <td>${renderManagerSupplementOp(s, { showSubmit: false })}</td></tr>`).join('')}
    ${view.rows.length === 0 ? `<tr><td colspan="4" style="text-align:center;padding:32px">${roleScoped.length ? '无符合筛选条件的任务' : '当前角色下无待办，请切换为客户经理(王磊)或总行视角'}</td></tr>` : ''}
    </tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
};

SPA_VIEWS['#/supplement-fill'] = function(ctx) {
  const sid = new URLSearchParams((location.hash.split('?')[1]||'')).get('id') || 'S002';
  const s = Store.get().supplements.find(x => x.id === sid) || Store.getSupplements(ctx.task.id)[0];
  const editable = isSupplementEditableByManager(s);
  const footer = editable
    ? `<div style="padding:12px 20px;border-top:1px solid #eee;text-align:right">
      <button class="btn" onclick="location.hash='#/manager-tasks'">返回</button>
      <button class="btn btn-primary" id="saveSupplementBtn">暂存</button>
      <button class="btn btn-success" id="completeSupplementBtn">提交数据</button>
    </div>`
    : `<div style="padding:12px 20px;border-top:1px solid #eee;text-align:right">
      <button class="btn" onclick="location.hash='#/manager-tasks'">返回</button>
    </div>`;
  return `
    <h1 class="page-title">数据采集</h1>
    ${workflowStepsBar(ctx.task)}
    ${renderSupplementPageWithTabs(s, ctx.task, { readonly: !editable })}
    ${footer}`;
};

SPA_VIEWS['#/approval-review'] = function(ctx) {
  const params = new URLSearchParams((location.hash.split('?')[1] || ''));
  const approvalId = params.get('approvalId');
  const mode = params.get('mode') || 'view';
  const auditEditing = params.get('edit') === '1';
  const approval = (Store.get().approvals || []).find(a => a.id === approvalId);
  if (!approval) {
    return `<h1 class="page-title">数据审核</h1><p class="page-desc">未找到审核记录</p>
      <button class="btn" onclick="location.hash='#/approvals'">返回列表</button>`;
  }
  const task = Store.getTask(approval.taskId) || ctx.task;
  const roleKey = Store.get().currentRole;
  const canReview = mode === 'review' && canUserReviewApproval(approval, roleKey);
  const isView = !canReview && !auditEditing;
  const canAuditEdit = canReview && auditEditing;

  if (approval.docType !== 'supplement') {
    const detail = Store.getApprovalDocDetail(approval);
    return `
      <h1 class="page-title">${isView ? '查看' : '审核'} · ${approval.docName}</h1>
      <p class="page-desc">${approval.reviewLevel ? reviewLevelLabel(approval.reviewLevel) : approvalDocTypeLabel(approval.docType)}</p>
      <div class="card"><div class="card-body table-wrap"><table class="data-table"><tbody>
        ${detail.rows.map(r => `<tr><td style="width:140px;color:#909399">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}
      </tbody></table></div></div>
      ${renderApprovalReviewActions(canReview, approval, task, { auditEditing: canAuditEdit })}
      <input type="hidden" id="approvalReviewId" value="${approval.id}">`;
  }

  const s = getSupplementForApproval(approval);
  if (!s) {
    return `<h1 class="page-title">数据审核</h1><p class="page-desc">关联收集数据未找到</p>
      <button class="btn" onclick="location.hash='${typeof buildApprovalsListHash === 'function' ? buildApprovalsListHash(approval.taskId, getHqApprovalBranchFromRoute()) : '#/approvals'}'">返回</button>`;
  }

  const defaultTab = (approval.status === 'rejected' || s.status === 'returned') ? 'approval' : 'fill';
  const pageDesc = canAuditEdit
    ? '修改收集填报内容（提交后将视为本级审核通过）'
    : `${isView ? '查看' : '审核'}收集填报内容`;

  return `
    <h1 class="page-title">数据采集</h1>
    <p class="page-desc">${pageDesc}</p>
    ${renderSupplementPageWithTabs(s, task, { readonly: !canAuditEdit, defaultTab })}
    ${renderApprovalReviewActions(canReview, approval, task, { auditEditing: canAuditEdit })}
    <input type="hidden" id="approvalReviewId" value="${approval.id}">`;
};

function approvalDocTypeLabel(type) {
  const map = { formal: '正式清单', supplement: '数据采集', calculation: '排放计算', task: '核算任务' };
  return map[type] || type;
}

function approvalRecordBadge(status) {
  return approvalStatusBadge(status);
}

function renderApprovalDetailTable(ctx, options = {}) {
  const {
    listKey = 'approvals',
    roleKey,
    task,
    all,
    twoLevel,
    showTier1BranchCol = false,
    canBatchBranch = false,
    canBatchHq = false,
    batchableApprovals = [],
    submittableApprovals = [],
    hqBatchableApprovals = []
  } = options;
  const view = paginateData(listKey, all);
  const colSpan = (twoLevel ? 12 : 11)
    + (canBatchBranch || canBatchHq ? 1 : 0)
    + (showTier1BranchCol ? 1 : 0);
  const batchToolbar = canBatchBranch
    ? `<div class="toolbar approval-batch-toolbar">
        <button type="button" class="btn btn-primary" id="branchBatchApproveBtn" ${batchableApprovals.length ? '' : 'disabled'}>批量审核通过</button>
        <button type="button" class="btn btn-primary" id="branchSubmitToHqBtn" ${submittableApprovals.length ? '' : 'disabled'}>一键提交数据</button>
      </div>`
    : (canBatchHq
      ? `<div class="toolbar approval-batch-toolbar">
          <button type="button" class="btn btn-primary" id="hqBatchApproveBtn" ${hqBatchableApprovals.length ? '' : 'disabled'}>批量审核通过</button>
        </div>`
      : '');
  return `
      ${batchToolbar}
      <table class="data-table">
    <thead><tr>${(canBatchBranch || canBatchHq) ? '<th class="col-select col-no-resize"><input type="checkbox" id="approvalBatchSelectAll" title="选择当前页可批量审核记录"></th>' : ''}<th>序号</th><th>任务名称</th><th>核算年度</th><th>客户名称</th>${showTier1BranchCol ? '<th>一级分行</th>' : ''}<th>审核环节</th><th>审核状态</th><th>提交人</th><th>提交时间</th>
    ${twoLevel ? '<th>当前审批人</th><th>下一节点审批人</th>' : '<th>审批人</th><th>审批时间</th>'}
    <th>操作</th></tr></thead>
    <tbody>${view.rows.map((a, i) => {
      const canReview = canUserReviewApproval(a, roleKey);
      const canBatchRow = canBatchBranch && a.docType === 'supplement' && a.reviewLevel === 'branch' && a.status === 'pending' && canReview;
      const canSubmitRow = canBatchBranch && isBranchApprovedReadyForHqSubmit(a, ctx.data);
      const canHqBatchRow = canBatchHq && a.docType === 'supplement' && a.reviewLevel === 'hq' && a.status === 'pending' && canReview;
      const hqBranchCtx = typeof getHqApprovalBranchFromRoute === 'function' ? getHqApprovalBranchFromRoute() : '';
      const reviewQuery = (mode) => {
        const p = new URLSearchParams({ approvalId: a.id, mode });
        if (hqBranchCtx) p.set('hqBranch', hqBranchCtx);
        return `#/approval-review?${p}`;
      };
      const ops = [];
      if (canReview) ops.push(`<a href="${reviewQuery('review')}" class="btn-link">审核</a>`);
      ops.push(`<a href="${reviewQuery('view')}" class="btn-link">查看</a>`);
      const approverCols = twoLevel && a.docType === 'supplement'
        ? `<td>${approvalCurrentApproverLabel(a, task)}</td><td>${approvalNextApproverLabel(a, task)}</td>`
        : `<td>${a.approver || approvalCurrentApproverLabel(a, task) || '-'}</td><td>${a.approveTime || '-'}</td>`;
      const reviewStage = a.reviewLevel ? reviewLevelLabel(a.reviewLevel) : approvalDocTypeLabel(a.docType);
      const batchKind = canBatchRow ? 'approve' : (canSubmitRow ? 'submit' : (canHqBatchRow ? 'hq_approve' : ''));
      return `<tr>
      ${(canBatchBranch || canBatchHq) ? `<td class="col-select"><input type="checkbox" class="approval-batch-check" value="${a.id}" data-batch-kind="${batchKind}" ${batchKind ? '' : 'disabled'}></td>` : ''}
      <td>${view.startIndex + i + 1}</td>
      <td>${approvalTaskName(a)}</td>
      <td>${approvalTaskYear(a)}</td>
      <td>${approvalCustomerName(a)}</td>
      ${showTier1BranchCol ? `<td>${approvalTier1Branch(a)}</td>` : ''}
      <td>${reviewStage}</td>
      <td>${approvalRecordBadge(a.status)}</td>
      <td>${a.submitter}</td>
      <td>${a.submitTime}</td>
      ${approverCols}
      <td>${ops.join(' · ')}</td>
    </tr>`;
    }).join('')}${view.rows.length === 0 ? `<tr><td colspan="${colSpan}" style="text-align:center;padding:32px;color:#909399">无符合筛选条件的审核记录</td></tr>` : ''}</tbody></table>
    ${renderPagination(listKey, view)}`;
}

SPA_VIEWS['#/approvals'] = function(ctx) {
  const roleKey = Store.get().currentRole;
  const task = ctx.task;
  const twoLevel = task.initiatorOrg !== 'branch';
  const roleScoped = filterApprovalsForRole(Store.get().approvals || [], roleKey, ctx.role, task.id);
  const hqBranch = roleKey === 'hq' ? getHqApprovalBranchFromRoute() : '';

  if (roleKey === 'hq' && !hqBranch) {
    const summaryFilters = getHqApprovalSummaryFilters(task.id);
    const groups = filterHqApprovalBranchSummary(
      buildHqApprovalBranchGroups(roleScoped, task.id, ctx.data),
      summaryFilters
    );
    const listKey = 'approvals_hq_branch_' + task.id;
    const view = paginateData(listKey, groups);
    return `
    <h1 class="page-title">数据审核</h1>
    <p class="page-desc">按一级分行汇总；点击「查看」进入该分行下待审核明细，支持单条审核与批量审核。</p>
    <div class="card">
      <div class="card-header"><h3>筛选条件</h3></div>
      ${renderHqApprovalSummaryFilterPanel(summaryFilters)}
      <div class="card-body table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>序号</th><th>任务名称</th><th>核算年度</th><th>一级分行</th><th>分行审核通过条数</th><th>合计任务条数</th><th>操作</th>
        </tr></thead>
        <tbody>${view.rows.map((g, i) => `<tr>
          <td>${view.startIndex + i + 1}</td>
          <td>${escapeHtml(g.taskName || '—')}</td>
          <td>${g.year || '—'}</td>
          <td>${escapeHtml(g.tier1Branch || '—')}</td>
          <td>${g.branchApprovedCount || 0}</td>
          <td>${g.totalCount || 0}</td>
          <td><a href="${buildApprovalsListHash(task.id, g.tier1Branch)}" class="btn-link" data-hq-approval-branch="${escapeHtml(g.tier1Branch || '')}">查看</a></td>
        </tr>`).join('')}${view.rows.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:32px;color:#909399">无符合筛选条件的一级分行汇总</td></tr>' : ''}</tbody>
      </table></div>
      ${renderPagination(listKey, view)}</div>`;
  }

  const listKey = hqBranch ? `approvals_hq_detail_${task.id}_${hqBranch}` : 'approvals';
  const filters = getApprovalFilters(task.id);
  let all = filterApprovalList(roleScoped, filters);
  if (hqBranch) {
    all = all.filter(a => approvalTier1Branch(a) === hqBranch);
  }
  const canBatchBranch = roleKey === 'branch' && twoLevel;
  const canBatchHq = roleKey === 'hq' && !!hqBranch;
  const batchableApprovals = canBatchBranch
    ? all.filter(a => a.docType === 'supplement' && a.reviewLevel === 'branch' && a.status === 'pending' && canUserReviewApproval(a, roleKey))
    : [];
  const submittableApprovals = canBatchBranch
    ? all.filter(a => isBranchApprovedReadyForHqSubmit(a, ctx.data))
    : [];
  const hqBatchableApprovals = canBatchHq
    ? all.filter(a => a.docType === 'supplement' && a.reviewLevel === 'hq' && a.status === 'pending' && canUserReviewApproval(a, roleKey))
    : [];
  const backBar = hqBranch
    ? `<div class="toolbar approval-hq-back-toolbar">
        <button type="button" class="btn" id="hqApprovalBackBtn">返回一级分行列表</button>
        <span class="text-muted" style="font-size:13px">当前一级分行：<strong>${escapeHtml(hqBranch)}</strong></span>
      </div>`
    : '';
  return `
    <h1 class="page-title">数据审核</h1>
    ${backBar}
    <div class="card">
      <div class="card-header"><h3>筛选条件</h3></div>
      ${renderApprovalFilterPanel(filters, { showTier1Branch: false })}
      <div class="card-body table-wrap${canBatchBranch || canBatchHq ? ' approval-table-body' : ''}">
      ${renderApprovalDetailTable(ctx, {
        listKey,
        roleKey,
        task,
        all,
        twoLevel,
        showTier1BranchCol: false,
        canBatchBranch,
        canBatchHq,
        batchableApprovals,
        submittableApprovals,
        hqBatchableApprovals
      })}
      </div></div>`;
};

SPA_VIEWS['#/factors'] = function(ctx) {
  const all = ctx.data.factors || [];
  const versionRanks = collectFactorLibraryVersionRanks(all);
  const activeRank = Math.min(getFactorListVersionRank(), versionRanks.length || 1);
  if (activeRank !== getFactorListVersionRank()) setFactorListVersionRank(activeRank);
  let versionGroups = groupFactorRecords(all);
  versionGroups = applyFactorListVersionRank(versionGroups, activeRank);
  const categoryTabs = collectFactorCategoryTabs(versionGroups);
  let categoryKey = getFactorListCategoryKey();
  if (categoryKey !== 'all' && !categoryTabs.some(t => t.key === categoryKey)) {
    categoryKey = 'all';
    setFactorListCategoryKey('all');
  }
  const groups = filterFactorGroupsByCategory(versionGroups, categoryKey);
  const listKey = 'factors';
  const view = paginateData(listKey, groups);
  const latestRank = versionRanks.length ? versionRanks[versionRanks.length - 1] : 1;
  let versionLabel = formatFactorVersionNo(activeRank);
  if (activeRank === latestRank) versionLabel += '（最新版本）';
  return `
    <h1 class="page-title">排放因子库</h1>
    <div class="card factor-library-card">
      ${renderFactorVersionTabBar(all, activeRank)}
      <div class="factor-library-body${isFactorCategorySidebarCollapsed() ? ' is-category-sidebar-collapsed' : ''}" id="factorLibraryBody">
        ${renderFactorCategoryTabBar(versionGroups, categoryKey)}
        <div class="factor-library-main">
          <div class="card-body" style="padding-top:0">
          <div class="factor-library-main-toolbar">
            <span class="factor-library-version-ops-label">当前版本：${escapeHtml(versionLabel)}</span>
            <div class="factor-library-version-ops">
              <a href="#/factors/new" class="btn btn-primary">新增因子</a>
              <button type="button" class="btn" id="factorBatchImportBtn">批量导入</button>
            </div>
          </div>
          <div class="table-wrap"><table class="data-table">
            <thead>${renderFactorTableHead('unified')}</thead>
            <tbody>${view.rows.length
              ? view.rows.map(g => renderFactorGroupTableRow(g)).join('')
              : `<tr><td colspan="9" style="text-align:center;padding:24px;color:#909399">当前版本暂无匹配的因子</td></tr>`}
            </tbody></table></div>
          ${renderPagination(listKey, view)}
          </div>
        </div>
      </div>
    </div>`;
};

SPA_VIEWS['#/industry-config'] = function(ctx) {
  const cfg = Store.getIndustryConfig();
  const filters = getIndustryConfigFilters();
  const all = cfg.rows || [];
  const filtered = IndustryConfig.filterRows(all, filters);
  const listKey = 'industry_config';
  const view = paginateData(listKey, filtered);
  return `
    <h1 class="page-title">行业配置</h1>
    <div class="card">
      <div class="card-header">
        <h3>行业列表</h3>
      </div>
      ${IndustryConfig.renderFilterPanel(filters)}
      <div class="card-body" style="padding-top:0">
        <div class="table-wrap"><table class="data-table industry-config-table">
          <thead><tr>
            <th>序号</th><th>一级行业</th><th>二级行业</th><th>三级行业</th><th>四级行业</th><th>标识</th><th>操作</th>
          </tr></thead>
          <tbody>${view.rows.length
            ? view.rows.map((r, i) => IndustryConfig.renderTableRow(r, view.startIndex, i)).join('')
            : `<tr><td colspan="7" style="text-align:center;padding:32px;color:#909399">${cfg.imported ? '无匹配行业' : '正在加载行业数据…'}</td></tr>`}
          </tbody>
        </table></div>
        ${renderPagination(listKey, view)}
      </div>
    </div>`;
};

SPA_VIEWS['#/factors/import'] = function(ctx) {
  return renderFactorImportPage(ctx);
};

SPA_VIEWS['#/factors/new'] = function(ctx) {
  const params = new URLSearchParams((location.hash.split('?')[1] || ''));
  const copyId = params.get('copy');
  const methodParam = params.get('method') || 'energy';
  const industryParam = params.get('industry') || '';
  const codeParam = params.get('code') || '';
  let seed = null;
  if (copyId) {
    seed = Store.getFactor(copyId);
    if (seed) {
      const g = typeof findFactorGroup === 'function'
        ? findFactorGroup(Store.get().factors || [], factorGroupKey(seed))
        : null;
      const years = g?.versionYears?.length ? g.versionYears : [normalizeFactorVersionYear(seed)];
      const nextYear = Math.max(...years, new Date().getFullYear()) + 1;
      seed = {
        ...seed,
        id: undefined,
        isBuiltin: false,
        sourceNote: '',
        factorName: typeof getFactorName === 'function' ? getFactorName(seed) : seed.factorName,
        versionYear: nextYear
      };
    }
  }
  return `
    <h1 class="page-title">新增排放因子</h1>
    <p class="page-desc">${copyId ? '基于已有因子复制为新版本' : '字段：因子口径、计算方法、行业、适用年度、因子名称、因子数值、因子单位、因子来源（选填）'}</p>
    <div class="card"><div class="card-body">
      <form id="factorForm" novalidate data-form-mode="create">
        ${renderFactorFormFields(seed?.methodId || methodParam, seed?.industryMajor || industryParam, seed || (codeParam ? { gbCode: codeParam, industryMajor: industryParam } : null), {
          formMode: 'create'
        })}
        <div class="toolbar" style="margin-top:16px">
          <a href="#/factors" class="btn">取消</a>
          <button type="submit" class="btn btn-primary">保存</button>
        </div>
      </form>
    </div></div>`;
};

SPA_VIEWS['#/factors/edit'] = function(ctx) {
  const id = new URLSearchParams((location.hash.split('?')[1] || '')).get('id');
  const f = Store.getFactor(id);
  if (!f) {
    return `<h1 class="page-title">编辑排放因子</h1><p class="page-desc">未找到因子 <code>${id || ''}</code></p>
      <a href="#/factors" class="btn">返回列表</a>`;
  }
  return `
    <h1 class="page-title">编辑排放因子</h1>
    <p class="page-desc">字段：因子口径、计算方法、行业、适用年度、因子名称、因子数值、因子单位、因子来源（选填）</p>
    <div class="card"><div class="card-body">
      <form id="factorForm" data-factor-id="${f.id}" novalidate data-form-mode="edit">
        ${renderFactorFormFields(f.methodId, f.industryMajor, f, { formMode: 'edit' })}
        <div class="toolbar" style="margin-top:16px">
          <a href="#/factors" class="btn">取消</a>
          <button type="submit" class="btn btn-primary">保存</button>
        </div>
      </form>
    </div></div>`;
};

SPA_VIEWS['#/calculation'] = function(ctx) {
  const taskId = ctx.task.id;
  const d = Store.get();
  const vma = viewModeDisabledAttr();
  const listKey = 'calculation_' + taskId;
  const allGroups = getDataCollectTableGroups(taskId, d);
  const filters = getActiveCalculationFilters(taskId, ctx.task);
  const filterLocked = !!filters.locked || !!ctx.task.resultsConfirmed;
  const groups = getCalculationDisplayGroups(taskId, d);
  const calcs = getCalculationScopedCalcs(taskId, d, groups);
  const total = calcs.filter(c => c.attributedEmission != null).reduce((s, c) => s + (c.attributedEmission || 0), 0);
  const doneCount = groups.filter(g => {
    const primaryId = g.memberFormalIds?.[0];
    return primaryId && getEffectiveEntityEmission(taskId, primaryId) != null;
  }).length;
  const dqr = calcDQRFromCalcs(calcs.filter(c => c.attributedEmission > 0)) || Store.calcDQR(taskId) || ctx.task.dqr;
  const dqrGrade = dqr?.grade || resolveDqrGrade(dqr?.dqr);
  const intensityStats = computePboEightFinancingIntensityStats(taskId, calcs);
  const hasMissingSystemMethod = Store.hasMissingSystemAccountingMethod(taskId, d);
  const hasInvestFilter = hasCalculationInvestmentFilter(filters);
  const scopeHint = ctx.task.resultsConfirmed ? formatCalculationScopeLockHint(ctx.task) : '';
  const view = paginateData(listKey, groups);
  return `
    <h1 class="page-title">碳排放计算</h1>
    ${workflowStepsBar(ctx.task)}
    ${scopeHint ? `<div class="demo-tip" style="border-color:#409eff;background:#ecf5ff;color:#337ecc">已按提交时筛选范围锁定数据：${escapeHtml(scopeHint)}。上方统计、强度及后续报告导出均基于该范围。</div>` : ''}
    <div class="toolbar">
      <button type="button" class="btn" id="creditFallbackBtn"${vma}${hasMissingSystemMethod ? '' : ' disabled title="当前无系统核算方法为空的记录"'}>信贷数据兜底法</button>
      <button type="button" class="btn btn-primary" id="submitAllDataBtn"${vma}${filterLocked ? ' disabled title="数据已提交锁定"' : ''}>一键提交数据</button>
    </div>
    <div class="stats-row">
      <div class="stat-card accent"><div class="label">总归因排放量</div><div class="value">${formatNum(total)}</div><div class="sub">吨 CO₂e${hasInvestFilter || scopeHint ? '（当前筛选范围）' : ''}</div></div>
      ${renderDqrQualityStatCards(dqr, dqrGrade)}
      <div class="stat-card"><div class="label">已计算</div><div class="value">${doneCount}</div><div class="sub">/ ${groups.length} 个归集单元（有排放结果）${allGroups.length !== groups.length ? ` · 共 ${allGroups.length} 个` : ''}</div></div>
    </div>
    ${renderCalculationIntensitySection(ctx.task, intensityStats)}
    <div class="card">
      <div class="card-header"><h3>筛选</h3></div>
      <div class="filter-panel">
        <fieldset class="view-mode-fieldset"${filterLocked ? ' disabled' : ''}>
        <div class="filter-extra calculation-filter-grid">
          <div class="form-item"><label>项目总投资金额（元）起</label><input id="calc_invest_min" type="number" min="0" step="0.01" placeholder="不限" value="${escapeHtml(filters.investMin ?? '')}"></div>
          <div class="form-item"><label>项目总投资金额（元）止</label><input id="calc_invest_max" type="number" min="0" step="0.01" placeholder="不限" value="${escapeHtml(filters.investMax ?? '')}"></div>
          <div class="form-item filter-action-cell"><label>&nbsp;</label>
            <div class="filter-action-btns">
              <button type="button" class="btn btn-primary" id="calculationFilterBtn"${filterLocked ? ' disabled' : ''}>查询</button>
              <button type="button" class="btn" id="calculationFilterResetBtn"${filterLocked ? ' disabled' : ''}>重置</button>
            </div>
          </div>
        </div>
        <p class="calculation-filter-hint">项目总投资筛选仅作用于业务种类为「项目类」的归集单元；非项目类数据不受筛选影响，默认全部纳入统计与提交范围。</p>
        </fieldset>
      </div>
    </div>
    <div class="card"><div class="card-header"><h3>排放计算清单</h3></div><div class="card-body table-wrap"><table class="data-table">
    <thead><tr>${renderCalculationGroupTableHead()}</tr></thead>
    <tbody>${view.rows.length ? view.rows.map(g => renderCalculationGroupTableRow(g, taskId, d)).join('') : `<tr><td colspan="${calculationGroupTableColCount()}" style="text-align:center;padding:32px;color:#909399">${allGroups.length && hasInvestFilter ? '无符合项目总投资筛选条件的项目类归集单元（非项目类不受筛选影响）' : '暂无排放计算清单数据'}</td></tr>`}</tbody></table></div>
    ${groups.length ? renderPagination(listKey, view) : ''}</div>`;
};

SPA_VIEWS['#/results'] = function(ctx) {
  const list = getCalculationScopedCalcs(ctx.task.id);
  const total = list.filter(c => c.attributedEmission != null).reduce((s, c) => s + (c.attributedEmission || 0), 0);
  const dqr = calcDQRFromCalcs(list.filter(c => c.attributedEmission > 0)) || Store.calcDQR(ctx.task.id) || ctx.task.dqr;
  const dqrGrade = dqr?.grade || resolveDqrGrade(dqr?.dqr);
  const industries = computeIndustryStatsFromCalcs(ctx.task.id, list);
  const scopeHint = formatCalculationScopeLockHint(ctx.task);
  const industryKey = 'results_industry_' + ctx.task.id;
  const detailKey = 'results_detail_' + ctx.task.id;
  const industryView = paginateData(industryKey, industries.length ? industries : []);
  const detailView = paginateData(detailKey, list);
  return `
    <h1 class="page-title">核算结果查询</h1>
    <p class="page-desc">归因排放汇总 · DQR=${dqr ? dqr.dqr : '-'}（${dqr ? dqr.level : '待计算'}）${scopeHint ? ` · 数据范围：${escapeHtml(scopeHint)}` : ''}</p>
    ${workflowStepsBar(ctx.task)}
    <div class="stats-row">
      <div class="stat-card accent"><div class="label">总归因排放量</div><div class="value">${formatNum(total)}</div><div class="sub">吨 CO₂e</div></div>
      ${renderDqrQualityStatCards(dqr, dqrGrade)}
      <div class="stat-card"><div class="label">已计算</div><div class="value">${list.filter(c => c.status === 'done' || c.entityEmission != null).length}</div><div class="sub">/ ${list.length} 笔</div></div>
    </div>
    <div class="card"><div class="card-header"><h3>分行业归因排放</h3></div><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>行业</th><th>笔数</th><th>归因排放(t)</th><th>占比</th></tr></thead>
    <tbody>${industryView.rows.length ? industryView.rows.map(i => `<tr><td>${i.industry}</td><td>${i.count}</td><td>${formatNum(i.emission)}</td><td>${i.share}%</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:24px;color:#909399">暂无分行业数据</td></tr>'}</tbody></table></div>
    ${industries.length ? renderPagination(industryKey, industryView) : ''}</div>
    <div class="card"><div class="card-header"><h3>明细清单</h3></div><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>客户</th><th>行业</th><th>方法</th><th>主体排放</th><th>归因排放</th><th>数据质量</th><th>状态</th></tr></thead>
    <tbody>${detailView.rows.map(c => `<tr><td>${c.customerName}</td><td>${c.industryMajor||'-'}</td><td>${calcMethodLabel(c)}</td><td>${formatNum(c.entityEmission)}</td><td>${formatNum(c.attributedEmission)}</td>
    <td>${c.qualityGrade ? qualityGradeBadge(c.qualityGrade) : '-'}</td><td>${statusBadge(c.status)}</td></tr>`).join('')}</tbody></table></div>
    ${renderPagination(detailKey, detailView)}</div>`;
};

SPA_VIEWS['#/reports'] = function(ctx) {
  const reports = Store.getReports(ctx.task.id);
  const vma = viewModeDisabledAttr();
  const listKey = 'reports_' + ctx.task.id;
  const view = paginateData(listKey, reports);
  const scopeHint = formatCalculationScopeLockHint(ctx.task);
  return `
    <h1 class="page-title">生成报告</h1>
    ${workflowStepsBar(ctx.task)}
    ${scopeHint ? `<div class="demo-tip" style="border-color:#409eff;background:#ecf5ff;color:#337ecc">报告导出将基于排放计算提交时锁定的数据范围：${escapeHtml(scopeHint)}</div>` : ''}
    <div class="card"><div class="card-header"><h3>新建导出</h3></div><div class="card-body form-grid">
      <fieldset class="view-mode-fieldset"${isTaskViewMode() ? ' disabled' : ''}>
      <div class="form-item"><label>导出范围</label><select id="exportScope"><option>监管报送范围（8大行业）</option><option>管理分析范围（8+15）</option><option>全量</option></select></div>
      <div class="form-item"><label>报表模板</label><select id="exportTemplate"><option>人行监管报送模板</option><option>内部管理报表</option><option>自定义统计表单</option></select></div>
      <div class="form-item full"><label>导出格式</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" id="exportExcel"${vma}>导出 Excel</button>
          <button class="btn" id="exportWord"${vma}>导出 Word</button>
        </div>
      </div>
      </fieldset>
    </div></div>
    <div class="card"><div class="card-header"><h3>历史导出记录</h3></div><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>报告名称</th><th>范围</th><th>格式</th><th>笔数</th><th>排放量</th><th>生成时间</th><th>操作人</th><th>操作</th></tr></thead>
    <tbody>${view.rows.map(r => {
      const canDownload = r.status === 'success';
      const op = canDownload
        ? `<button type="button" class="btn-link report-download-btn" data-id="${r.id}">下载</button>`
        : `<span style="color:#909399">${r.status === 'generating' ? '生成中' : r.status === 'failed' ? '生成失败' : '—'}</span>`;
      return `<tr><td>${r.name}</td><td>${r.scope}</td><td>${r.format}</td><td>${r.recordCount||'-'}</td><td>${r.totalEmission != null ? formatNum(r.totalEmission) : '-'}</td><td>${r.generatedAt||'-'}</td><td>${r.generatedBy||r.operator||'-'}</td><td>${op}</td></tr>`;
    }).join('')}
    ${view.rows.length===0?'<tr><td colspan="8" style="text-align:center;padding:24px">暂无报告，请在上方新建导出</td></tr>':''}
    </tbody></table></div>
    ${renderPagination(listKey, view)}</div>
    <div style="margin-top:16px;text-align:right">
      <a href="#/tasks" class="btn">返回核算任务列表</a>
    </div>`;
};

SPA_VIEWS['#/mapping-field'] = function(ctx) {
  const listKey = 'fieldMappings';
  const view = paginateData(listKey, ctx.data.fieldMappings);
  return `<h1 class="page-title">字段映射管理</h1>
    <div class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>源字段</th><th>源系统</th><th>目标字段</th><th>转换规则</th><th>状态</th></tr></thead>
    <tbody>${view.rows.map(m=>`<tr><td>${m.sourceField}</td><td>${m.sourceSystem}</td><td>${m.targetField}</td><td>${m.rule}</td><td>${statusBadge('done')}</td></tr>`).join('')}</tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
};

const CA_CHART_COLORS = ['#3d7cc9', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#5b8fd9', '#9b59b6', '#1abc9c'];

function getCaChartLabel(item) {
  const raw = item.label ?? item.year ?? item.name;
  return raw != null && String(raw).trim() !== '' ? String(raw) : '其他';
}

function caChartEmpty() {
  return '<p class="ca-chart-empty">暂无数据</p>';
}

function renderCaBarChart(items, valueKey) {
  if (!items.length) return caChartEmpty();
  const key = valueKey || 'emission';
  const max = Math.max(...items.map(i => Number(i[key]) || 0), 1);
  return `<div class="ca-bars">${items.map(i => {
    const v = Number(i[key]) || 0;
    const pct = Math.max(4, Math.round((100 * v) / max));
    const label = getCaChartLabel(i);
    return `<div class="ca-bar-row">
      <span class="ca-bar-label" title="${label}">${label}</span>
      <div class="ca-bar-track"><div class="ca-bar-fill" style="width:${pct}%"></div></div>
      <span class="ca-bar-val">${formatNum(v)}</span>
    </div>`;
  }).join('')}</div>`;
}

function renderCaDonutChart(items, valueKey) {
  if (!items.length) return caChartEmpty();
  const key = valueKey || 'emission';
  const total = items.reduce((s, i) => s + (Number(i[key]) || 0), 0);
  if (total <= 0) return caChartEmpty();
  let acc = 0;
  const segments = items.map((item, idx) => {
    const v = Number(item[key]) || 0;
    const pct = (100 * v) / total;
    const start = acc;
    acc += pct;
    return {
      label: getCaChartLabel(item),
      v,
      share: +pct.toFixed(1),
      start,
      end: acc,
      color: CA_CHART_COLORS[idx % CA_CHART_COLORS.length]
    };
  });
  const gradient = segments.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ');
  return `<div class="ca-chart-donut-wrap">
    <div class="ca-chart-donut-ring">
      <div class="ca-chart-donut" style="background:conic-gradient(${gradient})" role="img" aria-label="排放占比环图"></div>
      <div class="ca-chart-donut-center"><strong>${formatNum(total)}</strong><span>tCO₂e</span></div>
    </div>
    <ul class="ca-chart-legend">${segments.map(s =>
      `<li><i style="background:${s.color}"></i><span class="ca-legend-label" title="${s.label}">${s.label}</span><span class="ca-legend-val">${formatNum(s.v)}</span><span class="ca-legend-pct">${s.share}%</span></li>`
    ).join('')}</ul>
  </div>`;
}

function renderCaColumnChart(items, valueKey) {
  if (!items.length) return caChartEmpty();
  const key = valueKey || 'emission';
  const max = Math.max(...items.map(i => Number(i[key]) || 0), 1);
  return `<div class="ca-chart-columns">${items.map((item, idx) => {
    const v = Number(item[key]) || 0;
    const h = Math.max(6, Math.round((100 * v) / max));
    const label = getCaChartLabel(item);
    return `<div class="ca-chart-col" title="${label}: ${formatNum(v)}">
      <div class="ca-chart-col-val">${formatNum(v)}</div>
      <div class="ca-chart-col-bar-wrap"><div class="ca-chart-col-bar" style="height:${h}%;background:${CA_CHART_COLORS[idx % CA_CHART_COLORS.length]}"></div></div>
      <div class="ca-chart-col-label">${label}</div>
    </div>`;
  }).join('')}</div>`;
}

function getCaLineValue(item, key) {
  const raw = item?.[key];
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** 折线图点位：有效值 / 无法计算(—) / 无数据间隔 */
function resolveCaLinePoint(item, key) {
  const v = getCaLineValue(item, key);
  const noYearData = Number(item?.count) === 0 && (item?.entity == null || item?.entity === '');
  if (v != null) {
    if (noYearData && v === 0) return { type: 'gap' };
    return { type: 'value', v };
  }
  const hasActivity = Number(item?.count) > 0 || item?.entity != null;
  if (key === 'intensity' && hasActivity && item?.revenue != null && Number(item.revenue) <= 0) {
    return { type: 'missing', label: '—' };
  }
  return { type: 'gap' };
}

function formatCaLineAxisValue(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  if (Math.abs(n) >= 10000) return (n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '') + '万';
  if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString('zh-CN');
  if (Math.abs(n) >= 10) return n.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

function formatCaChartPointValue(v, key) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  if (key === 'intensity') {
    if (Math.abs(n) >= 100) return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
    if (Math.abs(n) >= 10) return n.toLocaleString('zh-CN', { maximumFractionDigits: 1 });
    return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 });
  }
  if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString('zh-CN');
  return formatNum(n);
}

function formatCaLineValue(v, key) {
  if (key === 'intensity' && typeof CarbonAccount !== 'undefined') {
    return CarbonAccount.formatEntityIntensity(v);
  }
  return formatNum(v);
}

function estimateCaLabelWidth(text) {
  return Math.max(40, String(text).length * 6.2 + 14);
}

function renderCaLinePointLabel(x, y, text, color, options = {}) {
  const { above = true, missing = false } = options;
  const labelY = above ? y - 16 : y + 20;
  const w = estimateCaLabelWidth(text);
  const h = 18;
  const rx = 4;
  const circle = missing
    ? `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="${color}" stroke-width="2" stroke-dasharray="3 2"/>`
    : `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="${color}" stroke-width="2"/>
       <circle cx="${x}" cy="${y}" r="2" fill="${color}"/>`;
  return `<g class="ca-line-point${missing ? ' ca-line-point--missing' : ''}">
    ${circle}
    <rect x="${x - w / 2}" y="${labelY - h / 2}" width="${w}" height="${h}" rx="${rx}" class="ca-line-value-bg"/>
    <text x="${x}" y="${labelY}" class="ca-line-value-label" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </g>`;
}

function buildCaLineYScale(maxVal) {
  if (!Number.isFinite(maxVal) || maxVal <= 0) return { max: 1, ticks: [0, 0.25, 0.5, 0.75, 1] };
  const headroom = maxVal * 1.18;
  const roughStep = headroom / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const step = Math.ceil(roughStep / mag) * mag || 1;
  const max = step * 4;
  const ticks = [0, 1, 2, 3, 4].map(i => (max * i) / 4);
  return { max, ticks };
}

function renderCaChartLegend(defs) {
  if (!defs?.length) return '';
  return `<div class="ca-chart-line-legend ca-chart-line-legend--header">${defs.map(s =>
    `<span><i style="background:${s.color}"></i>${s.label}</span>`
  ).join('')}</div>`;
}

function renderCaLineChart(items, series, options = {}) {
  if (!items.length) return caChartEmpty();
  const defs = series || [{ key: 'emission', label: '归因排放', color: '#3d7cc9' }];
  const hideLegend = options.hideLegend;
  const w = 560;
  const h = 260;
  const pad = { l: 56, r: 20, t: 40, b: 40 };
  const edgeInset = Math.min(28, Math.max(12, (w - pad.l - pad.r) * 0.08));
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const allVals = defs.flatMap(s =>
    items.flatMap(i => {
      const st = resolveCaLinePoint(i, s.key);
      return st.type === 'value' ? [st.v] : [];
    })
  );
  const rawMax = allVals.length ? Math.max(...allVals) : 0;
  const { max: safeMax, ticks: yTicks } = buildCaLineYScale(rawMax);
  const n = items.length;
  const xAt = i => {
    if (n <= 1) return pad.l + innerW / 2;
    return pad.l + edgeInset + (i / (n - 1)) * (innerW - 2 * edgeInset);
  };
  const yAt = v => pad.t + innerH - (v / safeMax) * innerH;
  const bottomY = pad.t + innerH;
  const gradId = 'caLineGrad' + Math.random().toString(36).slice(2, 8);

  const gridY = yTicks.map(val => {
    const t = safeMax > 0 ? val / safeMax : 0;
    const y = pad.t + innerH * (1 - t);
    const isBase = val === 0;
    return `<line x1="${pad.l}" y1="${y}" x2="${w - pad.r}" y2="${y}" class="ca-line-grid${isBase ? ' ca-line-grid--base' : ''}"/>
      <text x="${pad.l - 8}" y="${y + 4}" class="ca-line-grid-label" text-anchor="end" dominant-baseline="middle">${formatCaLineAxisValue(val)}</text>`;
  }).join('');

  const xAxisLine = `<line x1="${pad.l}" y1="${bottomY}" x2="${w - pad.r}" y2="${bottomY}" class="ca-line-axis"/>`;
  const xAxis = items.map((item, i) =>
    `<text x="${xAt(i)}" y="${h - 14}" class="ca-line-x-label" text-anchor="middle">${getCaChartLabel(item)}</text>`
  ).join('');

  const lines = defs.map((s, sIdx) => {
    const valuePoints = [];
    const missingPoints = [];
    items.forEach((item, i) => {
      const st = resolveCaLinePoint(item, s.key);
      const x = xAt(i);
      if (st.type === 'value') {
        valuePoints.push({ x, y: yAt(st.v), v: st.v, i });
      } else if (st.type === 'missing') {
        missingPoints.push({ x, y: bottomY - 8, label: st.label, i });
      }
    });

    const segments = [];
    let current = [];
    valuePoints.forEach(p => {
      if (!current.length || p.i === current[current.length - 1].i + 1) {
        current.push(p);
      } else {
        if (current.length) segments.push(current);
        current = [p];
      }
    });
    if (current.length) segments.push(current);

    const areas = segments.filter(seg => seg.length >= 2).map(seg => {
      const pts = seg.map(p => `${p.x},${p.y}`).join(' L ');
      const d = `M ${seg[0].x},${bottomY} L ${pts} L ${seg[seg.length - 1].x},${bottomY} Z`;
      return `<path class="ca-line-area" d="${d}" fill="url(#${gradId}-${sIdx})"/>`;
    }).join('');

    const polylines = segments.filter(seg => seg.length >= 2).map(seg =>
      `<polyline class="ca-line-path" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${seg.map(p => `${p.x},${p.y}`).join(' ')}"/>`
    ).join('');

    const valueMarks = valuePoints.map(p => {
      const nearTop = p.y - pad.t < innerH * 0.22;
      return renderCaLinePointLabel(p.x, p.y, formatCaChartPointValue(p.v, s.key), s.color, { above: !nearTop });
    }).join('');

    const missingMarks = missingPoints.map(p =>
      renderCaLinePointLabel(p.x, p.y, p.label, s.color, { above: true, missing: true })
    ).join('');

    return `${areas}${polylines}${valueMarks}${missingMarks}`;
  }).join('');

  const gradients = defs.map((s, i) =>
    `<linearGradient id="${gradId}-${i}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${s.color}" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="${s.color}" stop-opacity="0.02"/>
    </linearGradient>`
  ).join('');

  const legend = hideLegend ? '' : `<div class="ca-chart-line-legend">${defs.map(s =>
    `<span><i style="background:${s.color}"></i>${s.label}</span>`
  ).join('')}</div>`;

  return `<div class="ca-chart-line">
    ${legend}
    <svg class="ca-line-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>${gradients}</defs>
      ${gridY}${xAxisLine}${lines}${xAxis}
    </svg>
  </div>`;
}

function renderCaTrendTable(trend) {
  if (!trend.length) return '<p style="color:#909399">暂无年度数据</p>';
  return `<table class="data-table"><thead><tr>
    <th>年度</th><th>笔数</th><th>核算方法</th><th>主体排放(tCO₂e)</th>
    <th>营业收入(元)</th><th>碳强度(tCO₂e/万元)</th>
  </tr></thead>
  <tbody>${trend.map(t => `<tr>
    <td>${t.year}</td><td>${t.count || '—'}</td><td>${t.method || '—'}</td><td>${t.entity != null ? formatNum(t.entity) : '—'}</td>
    <td>${t.revenue != null && t.revenue !== 0 ? formatLedgerAmountYuan(t.revenue) : (t.revenue === 0 ? '0.00' : '—')}</td>
    <td>${CarbonAccount.formatEntityIntensity(t.intensity)}</td>
  </tr>`).join('')}
  </tbody></table>`;
}

function getCaListFilters() {
  try {
    return JSON.parse(sessionStorage.getItem('ca_list_filters') || '{}');
  } catch { return {}; }
}

function renderCaYearSwitcher(years, selected, tabsId = 'caListYearTabs') {
  if (!years.length) return '';
  const cur = selected || years[years.length - 1];
  const isDetail = tabsId === 'caDetailYearTabs';
  const switcherCls = isDetail ? ' ca-year-switcher--detail' : '';
  return `<div class="ca-year-switcher${switcherCls}">
    <span class="ca-year-switcher-label">核算年度</span>
    <div class="tabs tabs-segment ca-year-tabs" id="${tabsId}">${years.map(y =>
      `<div class="tab ${String(cur) === String(y) ? 'active' : ''}" data-ca-list-year="${y}">${y}</div>`
    ).join('')}</div>
  </div>`;
}

function renderCaListViewModeSwitcher(viewMode) {
  const mode = viewMode === 'enterprise' ? 'enterprise' : 'year';
  return `<div class="ca-list-view-switcher">
    <div class="tabs tabs-segment ca-list-view-tabs" id="caListViewModeTabs">
      <div class="tab ${mode === 'year' ? 'active' : ''}" data-ca-view-mode="year">按核算年度查看</div>
      <div class="tab ${mode === 'enterprise' ? 'active' : ''}" data-ca-view-mode="enterprise">按企业汇总查看</div>
    </div>
  </div>`;
}

function renderCaListToolbar(years, accountingYear, viewMode) {
  const mode = viewMode === 'enterprise' ? 'enterprise' : 'year';
  const yearSwitcher = mode === 'year' && years.length
    ? renderCaYearSwitcher(years, accountingYear)
    : '';
  return `<div class="ca-year-toolbar">
    ${renderCaListViewModeSwitcher(mode)}
    ${yearSwitcher}
  </div>`;
}

function renderCaDetailNav(activeTab, yearSwitcher, isEditMode) {
  const mainTabs = isEditMode ? '' : carbonAccountTabs(activeTab);
  const yearRow = yearSwitcher ? `<div class="ca-detail-year-row">${yearSwitcher}</div>` : '';
  if (!mainTabs && !yearRow) return '';
  return `<div class="ca-detail-nav-panel">${mainTabs}${yearRow}</div>`;
}

function renderCaAccountStatusBadge(acc) {
  const s = acc?.status || 'active';
  if (s === 'active') return '<span class="badge badge-success">正常</span>';
  if (s === 'cancelled') return '<span class="badge badge-danger">注销</span>';
  return '<span class="badge badge-draft">停用</span>';
}

function renderCaAccountActions(row, roleKey, accountingYear, options = {}) {
  const { showHistory = false } = options;
  const acc = row.account || row;
  const accountId = row.accountId || acc.id;
  const rowYear = row.year || accountingYear;
  const yearQ = rowYear ? `&year=${encodeURIComponent(rowYear)}` : (accountingYear ? `&year=${encodeURIComponent(accountingYear)}` : '');
  const subQ = row.isSubAccount && row.projectNo ? `&sub=${encodeURIComponent(row.projectNo)}` : '';
  const isActive = CarbonAccount.isAccountActive(acc);
  const isCancelled = CarbonAccount.isAccountCancelled(acc);
  const canEdit = canEditCarbonAccount(roleKey);
  const canManageStatus = canManageCarbonAccountStatus(roleKey);
  const view = `<a href="#/carbon-account?id=${encodeURIComponent(accountId)}${yearQ}${subQ}&tab=profile" class="btn-link">查看</a>`;
  const edit = !canEdit || isCancelled
    ? ''
    : (isActive
      ? `<a href="#/carbon-account?id=${encodeURIComponent(accountId)}${yearQ}${subQ}&mode=edit" class="btn-link">编辑</a>`
      : `<span class="btn-link is-disabled" title="仅正常状态可编辑" style="color:#c0c4cc;cursor:not-allowed">编辑</span>`);
  const historyBtn = showHistory
    ? `<button type="button" class="btn-link ca-history-btn" data-id="${accountId}">历年记录</button>`
    : '';
  const statusBtns = canManageStatus && !row.isSubAccount
    ? CarbonAccount.getAccountStatusActions(acc.status).map(o =>
      `<button type="button" class="btn-link ca-account-status-btn" data-id="${acc.id}" data-action="${o.next}">${o.label}</button>`
    ).join('')
    : '';

  if (row.isSubAccount) {
    return `<span class="actions">${view}${edit ? ' ' + edit : ''}</span>`;
  }
  const parts = [view];
  if (edit) parts.push(edit);
  if (historyBtn) parts.push(historyBtn);
  if (statusBtns) parts.push(statusBtns);
  return `<span class="actions">${parts.join(' ')}</span>`;
}

function renderCaStatusHistoryPanel(acc) {
  const logs = CarbonAccount.getAccountOperationLogs(acc);
  if (!logs.length) return '';
  return `<div class="card" style="margin-top:16px"><div class="card-header"><h3>操作日志</h3></div>
    <div class="card-body"><table class="data-table">
      <thead><tr><th>操作时间</th><th>操作类型</th><th>操作内容</th><th>备注</th><th>操作人</th></tr></thead>
      <tbody>${logs.map(h => `<tr>
        <td>${h.at || '-'}</td>
        <td>${h.actionLabel || (h.action === 'status_change' ? '状态变更' : h.action === 'profile_edit' ? '档案编辑' : '-')}</td>
        <td>${h.summary || `${CarbonAccount.ACCOUNT_STATUS_LABEL[h.from] || h.from || '-'} → ${CarbonAccount.ACCOUNT_STATUS_LABEL[h.to] || h.to || '-'}`}</td>
        <td>${h.remark || '—'}</td>
        <td>${h.operator || '-'}</td>
      </tr>`).join('')}</tbody>
    </table></div></div>`;
}

function carbonAccountTabs(active) {
  const tabs = [
    { id: 'profile', label: '账户档案' },
    { id: 'trend', label: '趋势分析' }
  ];
  return `<div class="tabs tabs-segment ca-tabs">${tabs.map(t =>
    `<div class="tab ${active === t.id ? 'active' : ''}" data-ca-tab="${t.id}">${t.label}</div>`
  ).join('')}</div>`;
}

function renderCaAccountPageFooter(isEditMode) {
  if (isEditMode) {
    return `<div class="toolbar ca-profile-page-actions">
      <span class="spacer"></span>
      <button type="button" class="btn" id="caProfileCancelBtn">取消</button>
      <button type="button" class="btn btn-primary" id="caProfileSaveBtn">保存</button>
    </div>`;
  }
  return `<div style="margin-top:16px"><a href="#/carbon-accounts" class="btn">返回列表</a></div>`;
}

SPA_VIEWS['#/ledger'] = function(ctx) {
  const roleKey = Store.get().currentRole;
  const filters = getRoleScopedLedgerFilters(getLedgerFilters(), roleKey);
  const filtered = filterLedgerTasks(ctx.data.tasks, filters, roleKey);
  const listKey = 'ledger_tasks';
  const view = paginateData(listKey, filtered);
  return `
    <h1 class="page-title">台账管理</h1>
    <div class="card">
      <div class="card-header"><h3>查询条件</h3></div>
      <div class="filter-panel">
        <div class="filter-extra ledger-list-filter-grid">
          <div class="form-item"><label>任务名称</label><input id="lf_task_name" placeholder="模糊搜索" value="${escapeHtml(filters.taskName || '')}"></div>
          <div class="form-item"><label>核算年度</label>${renderTaskYearFilterField(filters.year, 'lf_year')}</div>
          <div class="form-item"><label>数据行业范围</label>
            ${renderTaskIndustryScopeFilterSelect('lf_data_industry', filters.dataIndustryScope || filters.investIndustryScope || filters.industryScope)}
          </div>
          <div class="form-item filter-action-cell"><label>&nbsp;</label>
            <div class="filter-action-btns">
              <button type="button" class="btn btn-primary" id="ledgerFilterBtn">查询</button>
              <button type="button" class="btn" id="ledgerFilterResetBtn">重置</button>
            </div>
          </div>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>序号</th><th>任务名称</th><th>核算年度</th><th>数据行业范围</th><th>台账笔数</th><th>操作</th>
          </tr></thead>
          <tbody>${view.rows.length ? view.rows.map((t, i) => {
            normalizeTaskIndustryFields(t);
            const count = getLedgerDetailRows(t.id, { branch: filters.branch, customer: filters.customer }).length;
            return `<tr>
              <td>${view.startIndex + i + 1}</td>
              <td>${escapeHtml(t.name)}</td>
              <td>${t.year}</td>
              <td>${renderTaskDataIndustryScopeCell(t)}</td>
              <td>${count}</td>
              <td><a href="#/ledger/detail?taskId=${encodeURIComponent(t.id)}" class="btn-link">查看</a></td>
            </tr>`;
          }).join('') : `<tr><td colspan="6" style="text-align:center;padding:40px;color:#909399">暂无符合条件的台账任务（需已锁定正式清单并完成排放计算）</td></tr>`}
          </tbody>
        </table>
      </div>
      ${renderPagination(listKey, view)}
    </div>`;
};

SPA_VIEWS['#/ledger/detail'] = function(ctx) {
  const taskId = getQuery('taskId') || ctx.task.id;
  const t = Store.getTask(taskId) || ctx.task;
  const roleKey = Store.get().currentRole;
  const filters = getRoleScopedLedgerFilters(getLedgerFilters(), roleKey);
  const d = Store.get();
  const sections = renderLedgerDetailGroupSections(taskId, filters, d);
  normalizeTaskIndustryFields(t);
  return `
    <div class="toolbar ledger-detail-toolbar">
      <a href="#/ledger" class="btn">← 返回台账列表</a>
      <div class="ledger-export-actions">
        <span class="ledger-export-label">导出清单</span>
        <button type="button" class="btn" id="ledgerExportNonProjectBtn">非项目</button>
        <button type="button" class="btn" id="ledgerExportProjectBtn">项目</button>
        <button type="button" class="btn btn-primary" id="ledgerExportAllBtn">全部</button>
      </div>
    </div>
    <h1 class="page-title">排放计算清单</h1>
    <p class="page-desc">${escapeHtml(t.name || '')} · ${t.year}年 · ${renderTaskDataIndustryScopeCell(t)}</p>
    <div class="card">
      <div class="card-header"><h3>筛选</h3></div>
      <div class="filter-panel">
        <div class="filter-extra ledger-detail-filter-grid">
          <div class="form-item"><label>一级分行</label>${renderLedgerBranchFilterSelect('ldf_branch', filters.branch, roleKey === 'branch')}</div>
          <div class="form-item"><label>经办行</label>${renderLedgerHandlingBranchFilterSelect('ldf_handling', filters.handlingBranch)}</div>
          <div class="form-item"><label>客户名称</label><input id="ldf_customer" placeholder="模糊搜索" value="${escapeHtml(filters.customer || '')}"></div>
          <div class="form-item filter-action-cell"><label>&nbsp;</label>
            <div class="filter-action-btns">
              <button type="button" class="btn btn-primary" id="ledgerDetailFilterBtn">查询</button>
              <button type="button" class="btn" id="ledgerDetailFilterResetBtn">重置</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    ${sections.groups.length ? sections.html : `<div class="card"><div class="card-body" style="text-align:center;padding:40px;color:#909399">暂无排放计算清单数据</div></div>`}`;
};

SPA_VIEWS['#/carbon-accounts'] = function(ctx) {
  const roleKey = Store.get().currentRole;
  const d = Store.get();
  const { accounts, records: allRecords } = Store.getCarbonContext(roleKey, ctx.role);
  const listKey = 'carbon_accounts';
  const filters = getCaListFilters();
  const viewMode = filters.viewMode === 'enterprise' ? 'enterprise' : 'year';
  const { year: accountingYear, years } = CarbonAccount.resolveListYear(d, accounts, allRecords, filters.accountingYear);
  if (viewMode === 'year' && accountingYear && filters.accountingYear !== accountingYear) {
    filters.accountingYear = accountingYear;
    sessionStorage.setItem('ca_list_filters', JSON.stringify(filters));
  }
  let visibleAccounts = accounts;
  const kw = (filters.keyword || '').trim();
  const kwLower = kw.toLowerCase();
  const isEnterpriseSearch = !!kwLower;
  if (viewMode === 'year' && accountingYear && !isEnterpriseSearch) {
    visibleAccounts = CarbonAccount.filterAccountsForYear(d, accounts, allRecords, accountingYear);
  } else if (viewMode === 'enterprise' && !isEnterpriseSearch) {
    visibleAccounts = accounts.filter(a =>
      years.some(y => CarbonAccount.accountHasYearData(d, a, allRecords, y))
    );
  }
  if (isEnterpriseSearch) {
    visibleAccounts = accounts.filter(a => CarbonAccount.matchAccountKeyword(a, kw));
  }
  let listRows = [];
  if (viewMode === 'enterprise') {
    listRows = years.length
      ? CarbonAccount.buildAccountListRowsAllYears(d, visibleAccounts, years, allRecords)
      : [];
  } else if (accountingYear) {
    listRows = CarbonAccount.buildAccountListRows(d, visibleAccounts, accountingYear);
  }
  if (isEnterpriseSearch && kwLower) {
    listRows = listRows.filter(r =>
      (r.customerName || '').toLowerCase().includes(kwLower) ||
      (r.creditCode || '').includes(kw) ||
      (r.customerNo || '').toLowerCase().includes(kwLower)
    );
  }
  if (filters.status) {
    listRows = listRows.filter(r => (r.account?.status || 'active') === filters.status);
  }
  const expandedSet = getCaProjectExpandedSet();
  const visibleListRows = filterVisibleCaListRows(listRows, expandedSet);
  const showCreditCodeCol = viewMode === 'enterprise' || !isEnterpriseSearch;
  const showYearCol = viewMode === 'enterprise';
  const tableColCount = (showCreditCodeCol ? 1 : 0) + (showYearCol ? 1 : 0) + 7;
  const view = paginateData(listKey, visibleListRows);
  const mainRows = listRows.filter(r => !r.isSubAccount);
  const totalEntity = mainRows.reduce((s, r) => s + (Number(r.entityEmission) || 0), 0);
  const uniqueMainAccounts = viewMode === 'enterprise'
    ? new Set(mainRows.map(r => CarbonAccount.companyListDedupeKey(r))).size
    : mainRows.length;
  const statsSubLabel = viewMode === 'enterprise'
    ? `跨 ${years.length || 0} 个核算年度`
    : (accountingYear ? accountingYear + '年' : '');
  const emptyMessage = isEnterpriseSearch
    ? '未找到匹配企业'
    : (viewMode === 'enterprise'
      ? '暂无跨年度企业碳账户数据'
      : (accountingYear ? accountingYear + ' 年度暂无碳账户数据' : '暂无碳账户。请先在对象边界步骤【确认锁定】正式清单。'));
  return `
    <h1 class="page-title">企业碳账户</h1>
    <div id="caAccountsRoot">
    ${renderCaListToolbar(years, accountingYear, viewMode)}
    <div class="stats-row stats-row--compact">
      <div class="stat-card"><div class="label">${viewMode === 'enterprise' ? '企业账户' : '正常账户'}</div><div class="value">${viewMode === 'enterprise' ? uniqueMainAccounts : mainRows.length}</div><div class="sub">${statsSubLabel}</div></div>
      <div class="stat-card accent"><div class="label">主体排放合计</div><div class="value">${formatNum(totalEntity)}</div><div class="sub">tCO2e</div></div>
      <div class="stat-card"><div class="label">含项目子账户</div><div class="value">${listRows.filter(r => r.isSubAccount).length}</div><div class="sub">${viewMode === 'enterprise' ? '跨年度累计' : '按项目方式核算'}</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>账户列表</h3></div>
      <div class="filter-panel" style="padding:12px 16px">
        <div class="filter-extra carbon-account-filter-grid">
          <div class="form-item"><label>企业/客户号</label><input id="ca_kw" placeholder="名称、信用代码、客户号" value="${filters.keyword || ''}"></div>
          <div class="form-item"><label>账户状态</label>
            <select id="ca_status">
              <option value="">全部</option>
              <option value="active" ${filters.status === 'active' ? 'selected' : ''}>${CarbonAccount.ACCOUNT_STATUS_LABEL.active}</option>
              <option value="disabled" ${filters.status === 'disabled' ? 'selected' : ''}>${CarbonAccount.ACCOUNT_STATUS_LABEL.disabled}</option>
              <option value="cancelled" ${filters.status === 'cancelled' ? 'selected' : ''}>${CarbonAccount.ACCOUNT_STATUS_LABEL.cancelled}</option>
            </select>
          </div>
          <div class="form-item filter-actions"><label>&nbsp;</label>
            <div class="filter-action-btns">
              <button class="btn btn-primary" id="caFilterBtn">查询</button>
              <button class="btn" id="caFilterResetBtn">重置</button>
            </div>
          </div>
        </div>
      </div>
      <div class="table-wrap"><table class="data-table">
        <thead><tr>
          <th>序号</th>${showYearCol ? '<th>核算年度</th>' : ''}<th>企业/项目名称</th>${showCreditCodeCol ? '<th>统一社会信用代码</th>' : ''}<th>客户号</th>
          <th>核算方法</th><th>企业/项目主体排放（tCO2e）</th><th>账户状态</th><th>操作</th>
        </tr></thead>
        <tbody>${view.rows.length ? view.rows.map((r, i) => `<tr class="${r.isSubAccount ? 'ca-sub-account-row' : (r.hasExpandableProjects ? 'ca-parent-account-row' : '')}">
          <td>${renderCaListIndexCell(r, expandedSet, view.startIndex + i + 1)}</td>
          ${showYearCol ? `<td>${r.year || '—'}</td>` : ''}
          <td class="${r.isSubAccount ? 'ca-sub-name-cell' : ''}">${r.customerName || '-'}</td>
          ${showCreditCodeCol ? `<td><code style="font-size:12px">${r.creditCode || '-'}</code></td>` : ''}
          <td>${r.customerNo || '-'}</td>
          <td>${r.method || '-'}</td>
          <td>${r.entityEmission != null ? formatNum(r.entityEmission) : '—'}</td>
          <td>${renderCaAccountStatusBadge(r.account)}</td>
          <td>${renderCaAccountActions(r, roleKey, accountingYear, { showHistory: false })}</td>
        </tr>`).join('') : `<tr><td colspan="${tableColCount}" style="text-align:center;padding:32px;color:#909399">${emptyMessage}</td></tr>`}
        </tbody></table></div>
      ${renderPagination(listKey, view)}
    </div></div>`;
};

SPA_VIEWS['#/carbon-account'] = function(ctx) {
  const params = new URLSearchParams((location.hash.split('?')[1] || ''));
  const accountId = params.get('id');
  const tab = params.get('tab') || 'profile';
  const normalizedTab = (tab === 'records' || tab === 'summary') ? 'profile' : tab;
  const subProjectNo = params.get('sub') || '';
  const d = Store.get();
  const acc = Store.getCarbonAccount(accountId);
  if (!acc) {
    return `<h1 class="page-title">企业碳账户</h1><p class="page-desc">未找到账户</p>
      <a href="#/carbon-accounts" class="btn">返回列表</a>`;
  }
  const roleKey = Store.get().currentRole;
  const isEditMode = params.get('mode') === 'edit'
    && CarbonAccount.isAccountActive(acc)
    && canEditCarbonAccount(roleKey);
  const activeTab = isEditMode ? 'profile' : normalizedTab;
  const scopeYear = params.get('year') || getCaListFilters().accountingYear || null;
  const trendRecords = CarbonAccount.collectTrendRecordsForAccount(d, acc);
  const profileRow = resolveCarbonAccountProfileRow(d, acc, scopeYear, subProjectNo);
  const { years: detailYears } = CarbonAccount.resolveListYear(d, [acc], trendRecords, scopeYear);
  const trend = CarbonAccount.buildTrendForAccount(d, acc, detailYears);

  let panel = '';
  if (activeTab === 'profile') {
    panel = renderCarbonAccountProfilePanel(d, acc, scopeYear, subProjectNo, { editable: isEditMode }) +
      (!isEditMode && !CarbonAccount.isAccountActive(acc)
        ? `<div class="demo-tip" style="margin-top:12px">当前账户状态为「${CarbonAccount.ACCOUNT_STATUS_LABEL[acc.status] || acc.status || '停用'}」，仅可查看，不可编辑。</div>`
        : '') +
      (!isEditMode ? renderCaStatusHistoryPanel(acc) : '');
  } else if (activeTab === 'trend') {
    const entitySeries = [{ key: 'entity', label: '主体排放 (tCO₂e)', color: '#2d8f4e' }];
    const intensitySeries = [{ key: 'intensity', label: '碳强度 (tCO₂e/万元)', color: '#d48806' }];
    panel = `<div class="ca-trend-grid">
      <div class="card ca-trend-chart-card">
        <div class="card-header ca-trend-chart-header">
          <h3>年度排放趋势</h3>
          ${renderCaChartLegend(entitySeries)}
        </div>
        <div class="card-body">${renderCaLineChart(trend, entitySeries, { hideLegend: true })}</div>
      </div>
      <div class="card ca-trend-chart-card">
        <div class="card-header ca-trend-chart-header">
          <h3>排放强度趋势</h3>
          ${renderCaChartLegend(intensitySeries)}
        </div>
        <div class="card-body">
          ${renderCaLineChart(trend, intensitySeries, { hideLegend: true })}
        </div>
      </div>
      <div class="card ca-summary-full"><div class="card-header"><h3>年度明细</h3></div><div class="card-body">${renderCaTrendTable(trend)}</div></div>
    </div>`;
  }

  const yearSwitcher = activeTab === 'profile'
    ? renderCaYearSwitcher(detailYears, scopeYear, 'caDetailYearTabs')
    : '';
  return `
    ${renderCaDetailNav(activeTab, yearSwitcher, isEditMode)}
    <div class="ca-detail-panel">${panel}</div>
    ${renderCaAccountPageFooter(isEditMode)}`;
};

SPA_VIEWS['#/permission-mgmt'] = function(ctx) {
  const roleKey = Store.get().currentRole;
  return `
    <h1 class="page-title">权限管理</h1>
    <p class="page-desc">配置左侧菜单各模块是否展示；取消勾选后对应菜单隐藏，且无法通过地址栏直接进入。</p>
    <div class="card">
      <div class="card-header"><h3>菜单可见性</h3></div>
      <div class="card-body">
        ${MenuPermissions.renderSettingsPanel(roleKey)}
        <div class="toolbar" style="margin-top:16px">
          <button type="button" class="btn btn-primary" id="menuPermSaveBtn">保存并应用</button>
          <button type="button" class="btn" id="menuPermResetBtn">恢复默认</button>
        </div>
        <p class="candidate-filter-hint" style="margin-top:12px">默认不展示「基础配置」下各子菜单；勾选保存后立即生效。</p>
      </div>
    </div>`;
};

SPA_VIEWS['#/interfaces'] = function(ctx) {
  const listKey = 'interfaces';
  const batches = ctx.data.interfaces || [];
  const view = paginateData(listKey, batches);
  const successCount = batches.filter(b => b.status === 'success').length;
  const failedCount = batches.filter(b => b.status === 'failed').length;

  return `<h1 class="page-title">接口管理</h1>
    <p class="page-desc">贷款台账同步 · 每月1日 01:00 自动从信贷核心系统获取<strong>上一自然月</strong>全部对公信贷台账；候选清单按核算年度汇总已成功批次</p>
    <div class="demo-tip">当前共 <b>${batches.length}</b> 个批次 · 获取成功 <b>${successCount}</b> · 获取失败 <b>${failedCount}</b> · 覆盖 2024—2026 年月度台账</div>
    <div class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>批次号</th><th>推送时间</th><th>数据条数</th><th>状态</th><th>操作</th></tr></thead>
    <tbody>${view.rows.map(b => `<tr>
      <td><code>${b.batchNo}</code><div style="font-size:12px;color:#909399;margin-top:2px">数据月份：${b.dataMonth || '—'}</div></td>
      <td>${b.pushTime}</td>
      <td>${b.status === 'success' ? (b.recordCount || 0).toLocaleString() : '—'}</td>
      <td>${interfaceBatchStatusBadge(b.status)}</td>
      <td>${b.status === 'success'
        ? `<button class="btn-link if-batch-view" data-id="${b.id}">查看</button>`
        : `<button class="btn-link if-batch-retry" data-id="${b.id}">重新获取</button>`}
      </td>
    </tr>`).join('')}</tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
};

