/** 各页面视图渲染 */
const SPA_VIEWS = {};

function roleFilterSupplements(supps, roleKey, role) {
  if (roleKey === 'branch' && role.branch) return supps.filter(s => s.branch === role.branch);
  if (roleKey === 'manager') return supps.filter(s => s.manager === role.user);
  return supps;
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
        <li><a href="#/branch-board">数据补录填报</a> → <a href="#/approvals">数据审核</a> → 审核通过后进入排放计算</li>
        <li><a href="#/calculation">排放计算</a> → 确认结果 → <a href="#/reports">生成报告</a></li>
      </ol>
      <p style="margin-top:12px;color:#909399;font-size:13px">数据采集页发放任务，客户经理在「数据补录」填报，管理员在「数据审核」审批</p>
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
    <div class="card"><div class="card-header"><h3>各分行补数进度</h3><a href="#/branch-board" class="btn btn-sm">分行看板</a></div>
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
        <div class="filter-extra task-filter-grid">
          <div class="form-item"><label>任务名称</label><input id="tf_name" placeholder="模糊搜索" value="${filters.name || ''}"></div>
          <div class="form-item"><label>核算年度</label><select id="tf_year">${renderYearSelectOptions(filters.year, true)}</select></div>
          <div class="form-item"><label>行业范围</label>
            <select id="tf_industry">
              <option value="">全部</option>
              <option value="八大高碳行业" ${filters.industryScope === '八大高碳行业' ? 'selected' : ''}>八大高碳行业</option>
              <option value="八大+扩展" ${filters.industryScope === '八大+扩展' ? 'selected' : ''}>八大+扩展</option>
              <option value="自定义" ${filters.industryScope === '自定义' ? 'selected' : ''}>自定义</option>
            </select>
          </div>
          <div class="form-item"><label>当前进度</label>
            <select id="tf_progress"><option value="">全部</option>${progressOpts}</select>
          </div>
          <div class="form-item"><label>状态</label>
            <select id="tf_status">
              <option value="">全部</option>
              <option value="accounting" ${filters.status === 'accounting' ? 'selected' : ''}>核算中</option>
              <option value="completed" ${filters.status === 'completed' ? 'selected' : ''}>已完成</option>
            </select>
          </div>
          <div class="form-item"><label>&nbsp;</label>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary" id="taskFilterBtn">查询</button>
              <button class="btn" id="taskFilterResetBtn">重置</button>
            </div>
          </div>
        </div>
      </div>
      <div class="card-body table-wrap"><table class="data-table">
    <thead><tr>
      <th>序号</th><th>任务名称</th><th>核算年度</th><th>行业范围</th><th>截止日期</th>
      <th>当前进度</th><th>状态</th><th>操作</th>
    </tr></thead>
    <tbody>${view.rows.length ? view.rows.map((t, i) => `<tr>
      <td>${view.startIndex + i + 1}</td>
      <td>${t.name}</td>
      <td>${t.year}</td>
      <td>${formatIndustryScopeDisplay(t)}</td>
      <td>${t.deadline || '-'}</td>
      <td>${getTaskStepLabel(t)}</td>
      <td>${taskListStatusBadge(t)}</td>
      <td class="actions">
        <a href="#/task-edit?id=${t.id}" class="btn-link">编辑</a>
        <a href="#/task-view?id=${t.id}" class="btn-link">查看</a>
        <button type="button" class="btn-link task-delete-btn" data-id="${t.id}" data-name="${t.name.replace(/"/g, '&quot;')}">删除</button>
      </td>
    </tr>`).join('') : `<tr><td colspan="8" style="text-align:center;padding:40px;color:#909399">暂无符合条件的任务</td></tr>`}
    </tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
};

SPA_VIEWS['#/task-create'] = function() {
  return `
    <h1 class="page-title">新建核算任务</h1>
    ${demoSteps(0, { clickable: true })}
    <div class="card"><div class="card-body"><form id="taskForm" class="form-grid">
      ${renderTaskFormFields({ name: '2026年度投融资碳排放核算', year: 2026, industryScope: '八大高碳行业', deadline: '2027-09-30', balanceRule: '月均余额', orgScope: '全行', goal: '监管报送' })}
    </form></div>
    <div style="padding:12px 20px;text-align:right;border-top:1px solid #eee">
      <a href="#/tasks" class="btn">取消</a>
      <button class="btn btn-primary" id="saveTaskBtn">保存并启动</button>
    </div></div>`;
};

SPA_VIEWS['#/task-edit'] = function(ctx) {
  const id = getQuery('id') || ctx.task.id;
  const t = Store.getTask(id) || ctx.task;
  return `
    <h1 class="page-title">编辑核算任务</h1>
    <p class="page-desc">${t.id}</p>
    ${workflowStepsBar(t)}
    <div class="card"><div class="card-body"><form id="taskForm" class="form-grid" data-task-id="${t.id}">
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
  const tab = getQuery('tab') || 'basic';
  const suppPct = t.supplementTotal ? Math.round(t.supplementDone / t.supplementTotal * 100) : 0;
  const dqr = t.dqr || Store.calcDQR(t.id);
  return `
    <h1 class="page-title">查看核算任务</h1>
    <p class="page-desc">${t.id} · ${taskListStatusBadge(t)}</p>
    ${workflowStepsBar(t)}
    <div class="tabs" id="taskViewTabs">
      <div class="tab ${tab === 'basic' ? 'active' : ''}" data-tab="basic">基本信息</div>
      <div class="tab ${tab === 'progress' ? 'active' : ''}" data-tab="progress">执行进度</div>
      <div class="tab ${tab === 'stats' ? 'active' : ''}" data-tab="stats">业务统计</div>
    </div>
    <div class="card tab-panel ${tab === 'basic' ? 'active' : ''}" data-panel="basic" style="display:${tab === 'basic' ? 'block' : 'none'}">
      <div class="card-body"><form class="form-grid">
        ${renderTaskFormFields(t, { readonly: true, showRequired: false })}
      </form></div>
    </div>
    <div class="card tab-panel ${tab === 'progress' ? 'active' : ''}" data-panel="progress" style="display:${tab === 'progress' ? 'block' : 'none'}">
      <div class="card-body">
        ${taskWorkflowSteps(t)}
        <div class="form-grid" style="margin-top:16px">
          <div class="form-item"><label>当前进度</label><input readonly value="${getTaskStepLabel(t)}"></div>
          <div class="form-item"><label>状态</label><input readonly value="${taskListStatusText(t)}"></div>
          <div class="form-item"><label>任务进度</label><input readonly value="${t.progress ?? 0}%"></div>
          <div class="form-item"><label>创建时间</label><input readonly value="${t.createdAt || '-'}"></div>
          <div class="form-item"><label>创建人</label><input readonly value="${t.createdBy || '-'}"></div>
        </div>
      </div>
    </div>
    <div class="card tab-panel ${tab === 'stats' ? 'active' : ''}" data-panel="stats" style="display:${tab === 'stats' ? 'block' : 'none'}">
      <div class="card-body">
        <div class="stats-row">
          <div class="stat-card"><div class="label">候选清单</div><div class="value">${t.candidateCount || 0}</div></div>
          <div class="stat-card"><div class="label">正式清单</div><div class="value">${t.formalCount || 0}</div></div>
          <div class="stat-card accent"><div class="label">补数完成</div><div class="value">${suppPct}%</div><div class="sub">${t.supplementDone || 0}/${t.supplementTotal || 0}</div></div>
          <div class="stat-card"><div class="label">DQR</div><div class="value">${dqr ? dqr.dqr : '-'}</div><div class="sub">${dqr ? dqr.level : '-'}</div></div>
        </div>
      </div>
    </div>
    <div style="margin-top:16px;text-align:right">
      <a href="#/tasks" class="btn">返回列表</a>
      <a href="#/task-edit?id=${t.id}" class="btn btn-primary">编辑</a>
    </div>`;
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
      <div class="form-item"><label>行业范围</label><input readonly value="${formatIndustryScopeDisplay(t)}"></div>
      ${t.industryScope === '自定义' && t.industryCustomCodes?.length ? `
      <div class="form-item full">
        <label>自定义行业明细</label>
        <div class="industry-detail-tags">${t.industryCustomCodes.map(code => {
          const item = INDUSTRY_TABLE.find(i => i.code === code);
          return item ? `<span class="industry-tag">${IndustryScope.label(item)}</span>` : '';
        }).join('')}</div>
      </div>` : ''}
      <div class="form-item"><label>组织范围</label><input readonly value="${t.orgScope}"></div>
      <div class="form-item"><label>输出目标</label><input readonly value="${t.goal}"></div>
      <div class="form-item"><label>截止日期</label><input readonly value="${t.deadline}"></div>
    </div></div>`;
};

SPA_VIEWS['#/candidates'] = function(ctx) {
  const taskId = ctx.task.id;
  const rules = Store.getCandidateFilterRules(taskId);
  const listKey = 'candidates_' + taskId;
  const { page, pageSize } = getListPageState(listKey);
  const task = ctx.task;
  const synced = !!task.syncedFromInterface;
  const view = synced ? Store.getCandidatesForView(taskId, rules, page, pageSize) : { rows: [], total: 0, page, pageSize, stats: {} };
  view.totalPages = Math.max(1, Math.ceil(view.total / view.pageSize));
  const allCandidates = Store.getCandidates(taskId);
  const tier1Branches = [...new Set(allCandidates.map(c => candidateTier1Branch(c)).filter(x => x && x !== '-'))];
  const productOptions = GUIDE.CANDIDATE_PRODUCT_TYPES || [...new Set(allCandidates.map(c => candidateProductType(c)).filter(x => x && x !== '-'))];
  const borrowerOptions = GUIDE.CANDIDATE_BORROWER_TYPES || [...new Set(allCandidates.map(c => candidateBorrowerType(c)).filter(Boolean))];
  const industryOptions = [...new Set(allCandidates.map(c => candidateIndustryLabel(c)).filter(x => x && x !== '-'))];
  if (!industryOptions.length && GUIDE.CANDIDATE_INDUSTRY_OPTIONS) {
    GUIDE.CANDIDATE_INDUSTRY_OPTIONS.forEach(o => {
      industryOptions.push(o.note ? `${o.code} ${o.label} ${o.note}` : `${o.code} ${o.label}`);
    });
  }
  const managers = [...new Set(allCandidates.map(c => c.manager).filter(Boolean))];

  const rowsHtml = view.rows.length ? view.rows.map(c => `
    <tr>
      <td><input type="checkbox" class="row-check" data-id="${c.id}" ${c.included ? 'checked' : ''}></td>
      ${renderCandidateListCells(c)}
      <td>${c.included ? '<span class="badge badge-success">拟纳入</span>' : '<span class="badge badge-draft">未勾选</span>'}</td>
    </tr>`).join('') : `<tr><td colspan="14" style="text-align:center;padding:40px;color:#909399">
      ${synced ? '无符合筛选条件的记录，请调整筛选后重新查询' : '暂无台账数据，请先点击上方「从接口同步台账」'}</td></tr>`;

  const syncTip = synced
    ? `<div class="demo-tip">已从接口管理同步 <b>${task.syncYear || task.year}</b> 年度台账 · 信贷核心系统${task.syncRecordTotal ? ' · 汇总 <b>' + task.syncRecordTotal.toLocaleString() + '</b> 笔' : ''}${task.syncBatchCount ? '（' + task.syncBatchCount + ' 个成功批次）' : ''} · 最近同步：${task.syncedAt}</div>`
    : `<div class="demo-tip" style="border-color:#e6a23c;background:#fdf6ec;color:#b88230">本任务核算年度：<b>${task.year}</b> · 请先从「接口管理」确认该年度月度批次已获取成功，再点击上方按钮同步台账</div>`;

  const filterPanelHtml = synced ? `
      <div class="filter-panel">
        <div class="filter-extra task-filter-grid">
          <div class="form-item"><label>一级分行</label>
            <select id="f_tier1"><option value="">全部</option>${tier1Branches.map(b => `<option value="${b}" ${rules.tier1Branch === b ? 'selected' : ''}>${b}</option>`).join('')}</select>
          </div>
          <div class="form-item"><label>业务品种</label>
            <select id="f_product"><option value="">全部</option>${productOptions.map(p => `<option value="${p}" ${rules.productType === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
          </div>
          <div class="form-item"><label>贷款主体类型</label>
            <select id="f_borrower"><option value="">全部</option>${borrowerOptions.map(b => `<option value="${b}" ${rules.borrowerType === b ? 'selected' : ''}>${b}</option>`).join('')}</select>
          </div>
          <div class="form-item"><label>所属行业</label>
            <select id="f_industry"><option value="">全部</option>${industryOptions.map(ind => `<option value="${ind}" ${rules.industry === ind ? 'selected' : ''}>${ind}</option>`).join('')}</select>
          </div>
          <div class="form-item"><label>业务经理</label>
            <select id="f_manager"><option value="">全部</option>${managers.map(m => `<option value="${m}" ${rules.manager === m ? 'selected' : ''}>${m}</option>`).join('')}</select>
          </div>
          <div class="form-item"><label>月均信贷余额(万元) 起</label>
            <input id="f_bal_min" type="number" placeholder="最小值" value="${rules.balanceMin ?? ''}">
          </div>
          <div class="form-item"><label>月均信贷余额(万元) 止</label>
            <input id="f_bal_max" type="number" placeholder="最大值" value="${rules.balanceMax ?? ''}">
          </div>
          <div class="form-item"><label>&nbsp;</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <button class="btn btn-primary" id="candidateFilterBtn">查询</button>
              <button class="btn" id="candidateFilterResetBtn">重置</button>
              <label style="cursor:pointer;margin:0"><input type="checkbox" id="selectAllIncluded"> 全选当前页</label>
            </div>
          </div>
        </div>
      </div>` : `
      <div class="filter-panel" style="padding:32px 24px;text-align:center;color:#909399">
        <p style="margin:0 0 8px;font-size:15px;color:#606266">同步台账后可进行筛选</p>
        <p style="margin:0;font-size:13px">数据来源：接口管理 · 每月1日 01:00 推送上一自然月台账 · ${task.year} 年度</p>
      </div>`;

  return `
    <h1 class="page-title">候选业务清单</h1>
    <p class="page-desc">（二）清单识别 · 同步台账后筛选目标业务，勾选拟纳入项并生成正式清单</p>
    ${workflowStepsBar(ctx.task)}
    ${syncTip}
    <div class="toolbar">
      <button class="btn btn-primary" id="importBtn">从接口同步台账（${task.year}年度）</button>
      <button class="btn" ${synced ? '' : 'disabled title="请先同步台账"'}>Excel 导出</button>
      <span class="spacer"></span>
      <button class="btn btn-success" id="goFormalBtn" ${synced ? '' : 'disabled title="请先同步台账"'}>生成正式清单（${view.stats.includedCount || 0} 笔）</button>
    </div>
    <div class="card">
      <div class="card-header"><h3>筛选条件</h3><span style="font-size:12px;color:#909399">${synced ? '设置条件后点击「查询」，再勾选拟纳入正式清单的业务' : '需先完成台账同步'}</span></div>
      ${filterPanelHtml}
      ${synced ? `<div class="list-stats">
        <span>已接入 <b>${view.stats.syncedTotal || 0}</b> 笔</span>
        <span>已勾选拟纳入 <b>${view.stats.includedCount || 0}</b> 笔</span>
        <span>当前列表 <b>${view.stats.viewCount || 0}</b> 笔</span>
      </div>` : ''}
      <div class="table-wrap"><table class="data-table">
        <thead><tr>
          <th><input type="checkbox" id="checkAllPage" title="全选当前页" ${synced ? '' : 'disabled'}></th>
          <th>一级分行</th><th>经办行</th><th>客户名称</th><th>业务品种</th><th>贷款账号</th>
          <th>投放金额（元）</th><th>投放日</th><th>贷款主体类型</th><th>所属行业</th>
          <th>月均信贷余额（万元）</th><th>营业收入（万元）</th><th>业务经理</th><th>纳入标记</th>
        </tr></thead>
        <tbody id="candidateTbody">${rowsHtml}</tbody>
      </table></div>
      ${synced ? renderPagination(listKey, view) : ''}
    </div>`;
};

SPA_VIEWS['#/formal'] = function(ctx) {
  const taskId = ctx.task.id;
  const task = Store.getTask(taskId) || ctx.task;
  const listKey = 'formal_' + taskId;
  const list = Store.getFormalList(taskId);
  const view = paginateData(listKey, list);
  const rowsHtml = view.rows.map(f => {
    const canLock = f.status !== 'confirmed';
    return `<tr>
      <td><input type="checkbox" class="formal-row-check" value="${f.id}" ${canLock ? '' : 'disabled'}></td>
      ${renderCandidateListCells(formalLedgerRow(f, taskId))}
      <td>${statusBadge(f.status)}</td>
    </tr>`;
  }).join('');
  return `
    <h1 class="page-title">正式清单确认</h1>
    <p class="page-desc">对象边界 · 确认核算对象与边界后锁定，再前往「数据采集」发放补录任务</p>
    ${workflowStepsBar(task)}
    <div class="toolbar">
      <button class="btn btn-primary" id="confirmFormalBtn">确认锁定</button>
    </div>
    <div class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th><input type="checkbox" id="formalCheckAll" title="全选当前页"></th>
      <th>一级分行</th><th>经办行</th><th>客户名称</th><th>业务品种</th><th>贷款账号</th>
      <th>投放金额（元）</th><th>投放日</th><th>贷款主体类型</th><th>所属行业</th>
      <th>月均信贷余额（万元）</th><th>营业收入（万元）</th><th>业务经理</th><th>状态</th></tr></thead>
    <tbody id="formalTbody">${rowsHtml}</tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
};

SPA_VIEWS['#/data-collect'] = function(ctx) {
  const taskId = ctx.task.id;
  const task = ctx.task;
  const listKey = 'data_collect_' + taskId;
  const list = Store.getFormalList(taskId);
  const supps = Store.getSupplements(taskId);
  const view = paginateData(listKey, list);
  const initiatorLabel = task.initiatorOrg === 'branch'
    ? `分行发起 · ${task.initiatorBranch || task.orgScope}`
    : `总行发起${task.branchReviewEnabled !== false ? ' · 分行初审可选' : ' · 不经分行初审'}`;
  const stats = {
    locked: list.filter(f => f.status === 'confirmed').length,
    mandatory: list.filter(f => (f.collectMode || resolveCollectMode(f.loanType)) === 'mandatory').length,
    economyDirect: list.filter(f => f.economyDirectStatus === 'done').length,
    dispatched: supps.filter(s => s.dispatchedAt).length,
    pendingFill: supps.filter(s => s.dispatchedAt && s.status !== 'completed').length,
    pendingAudit: supps.filter(s => s.status === 'completed' && s.auditStage !== 'approved').length,
    done: supps.filter(s => s.auditStage === 'approved').length + list.filter(f => f.economyDirectStatus === 'done').length
  };
  const rowsHtml = view.rows.map(f => {
    const supp = getSupplementByFormalId(f.id);
    const cand = Store.getCandidates(taskId).find(c => c.id === f.customerId);
    const mode = f.collectMode || resolveCollectMode(f.loanType);
    const canDispatch = f.status === 'confirmed' && !supp;
    const dispatchCol = supp
      ? dispatchStatusBadge(f, supp)
      : (mode === 'economy_direct' ? economyDirectStatusBadge(f) : dispatchStatusBadge(f, supp));
    const fillCol = supp
      ? fillStatusBadge(supp)
      : (mode === 'economy_direct' && f.economyDirectStatus === 'done'
        ? '<span class="badge badge-success">系统直算</span>' : fillStatusBadge(supp));
    const auditCol = supp ? auditStageBadge(supp, task) : '—';
    const entityCol = formatFormalEntityEmission(taskId, f.id);
    return `<tr>
      <td>${canDispatch ? `<input type="checkbox" class="dispatch-row-check" value="${f.id}" data-mode="${mode}">` : '—'}</td>
      <td>${f.customerName}</td>
      <td>${f.loanType || cand?.loanType || '—'}</td>
      <td>${collectModeBadge(mode)}</td>
      <td>${f.manager || supp?.manager || cand?.manager || '—'}</td>
      <td>${entityCol}</td>
      <td>${dispatchCol}</td>
      <td>${fillCol}</td>
      <td>${auditCol}</td>
      <td>${supp ? `<button type="button" class="btn-link view-fill-btn" data-id="${supp.id}">查看填报</button>` : (f.status !== 'confirmed' ? '<span style="color:#909399">请先锁定</span>' : '—')}</td>
    </tr>`;
  }).join('');
  const collectDone = Store.isDataCollectionComplete(taskId);
  const allHaveEntity = Store.allConfirmedHaveEntityEmission(taskId);
  const hasMissingEntity = Store.hasMissingEntityEmission(taskId);
  return `
    <h1 class="page-title">数据采集</h1>
    <p class="page-desc">${initiatorLabel} · 贴现/保理默认必收数，其他类型可经济法直算；已直算记录仍可下发补录任务</p>
    ${workflowStepsBar(ctx.task)}
    ${collectDone
      ? '<div class="demo-tip" style="border-color:#67c23a;background:#f0f9eb;color:#529b2e">数据采集已全部完成，可进入「排放计算」环节</div>'
      : allHaveEntity
        ? '<div class="demo-tip" style="border-color:#409eff;background:#ecf5ff;color:#337ecc">全部记录已计算出主体排放，可点击「一键提交数据」进入排放计算</div>'
        : '<div class="demo-tip">全部已锁定业务须计算出主体排放；未完成填报且主体排放为空时，可使用「数据为0」置零并完成采集</div>'}
    <div class="demo-tip">
      必收数：发放任务 → <a href="#/branch-board?taskId=${taskId}">数据补录</a> 填报 →
      ${task.initiatorOrg === 'branch' ? '分行审核' : '分行初审(可选) → 总行终审'}（<a href="#/approvals">数据审核</a>）
      · 截止：${task.dataCutoffAt || '未设置'}
    </div>
    <div class="toolbar">
      <button class="btn btn-primary" id="dispatchSupplementBtn">发放补录任务</button>
      <button class="btn btn-success" id="economyDirectBtn" title="对全部已锁定、收数方式为经济法直算且未完成直算的记录一键计算">经济法直算</button>
      <button class="btn btn-primary" id="submitAllDataBtn" ${allHaveEntity ? '' : 'disabled title="请待全部记录计算出主体排放"'}>一键提交数据</button>
      <button class="btn" id="zeroMissingBtn" ${hasMissingEntity ? '' : 'disabled title="当前无缺失主体排放的记录"'}>数据为0</button>
    </div>
    <div class="stats-row">
      <div class="stat-card"><div class="label">已锁定</div><div class="value">${stats.locked}</div></div>
      <div class="stat-card"><div class="label">必收数笔数</div><div class="value">${stats.mandatory}</div></div>
      <div class="stat-card"><div class="label">已派发</div><div class="value">${stats.dispatched}</div></div>
      <div class="stat-card accent"><div class="label">待填报/直算</div><div class="value">${stats.pendingFill + list.filter(f => f.economyDirectStatus !== 'done' && (f.collectMode || resolveCollectMode(f.loanType)) === 'economy_direct' && f.status === 'confirmed').length}</div></div>
      <div class="stat-card"><div class="label">经济法已直算</div><div class="value">${stats.economyDirect}</div></div>
      <div class="stat-card"><div class="label">已完成</div><div class="value">${stats.done}</div></div>
    </div>
    <div class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr>
      <th><input type="checkbox" id="dispatchCheckAll" title="全选可派发项（已锁定且未派发）"></th>
      <th>客户</th><th>贷款类型</th><th>收数方式</th><th>客户经理</th><th>主体排放(tCO₂e)</th><th>派发/直算</th><th>填报状态</th><th>审核环节</th><th>操作</th>
    </tr></thead>
    <tbody id="dispatchTbody">${rowsHtml}</tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
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
    <h1 class="page-title">数据补录</h1>
    <div class="stats-row">${['pending','in_progress','completed','returned'].map((st,i) => {
      const n = supps.filter(s=>s.status===st||(st==='pending'&&s.status==='pending')).length;
      const labels = {pending:'待处理',in_progress:'填报中',completed:'已完成',returned:'已退回'};
      return `<div class="stat-card"><div class="label">${labels[st]||st}</div><div class="value">${supps.filter(s=>s.status===st).length}</div></div>`;
    }).join('')}</div>
    <div class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>客户</th><th>客户经理</th><th>计算方法</th><th>截止</th><th>状态</th><th>操作</th></tr></thead>
    <tbody>${view.rows.map(s => `<tr><td>${s.customerName}</td><td>${s.manager}</td><td>${calcMethodLabel(s)}</td>
    <td>${s.deadline}</td><td>${statusBadge(s.status)}</td>
    <td><a href="#/supplement-fill?id=${s.id}" class="btn-link">查看</a>
    ${s.status==='completed'&&s.auditStage!=='approved'?`<button class="btn-link" onclick="Store.submitSupplementForReview('${s.id}'); toast('已提交审核','success'); route();">提交审核</button>`:''}</td></tr>`).join('')}</tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
};

SPA_VIEWS['#/manager-tasks'] = function(ctx) {
  const roleKey = Store.get().currentRole;
  const supps = roleFilterSupplements(Store.getSupplements(ctx.task.id), roleKey, ctx.role);
  const listKey = 'manager_tasks_' + ctx.task.id;
  const view = paginateData(listKey, supps);
  return `
    <h1 class="page-title">客户经理任务清单</h1>
    <p class="page-desc">Step 6 · 我的待办</p>
    <div class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>客户</th><th>缺口字段</th><th>截止</th><th>状态</th><th>操作</th></tr></thead>
    <tbody>${view.rows.map(s => `<tr><td>${s.customerName}</td><td>${s.fieldsTotal - s.fieldsDone} 项</td><td>${s.deadline}</td><td>${statusBadge(s.status)}</td>
    <td><a href="#/supplement-fill?id=${s.id}" class="btn btn-sm btn-primary">去填报</a></td></tr>`).join('')}
    ${view.rows.length===0?'<tr><td colspan="5" style="text-align:center;padding:32px">当前角色下无待办，请切换为客户经理(王磊)或总行视角</td></tr>':''}
    </tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
};

SPA_VIEWS['#/supplement-fill'] = function(ctx) {
  const sid = new URLSearchParams((location.hash.split('?')[1]||'')).get('id') || 'S002';
  const s = Store.get().supplements.find(x => x.id === sid) || Store.getSupplements(ctx.task.id)[0];
  return `
    <h1 class="page-title">碳排放信息采集</h1>
    <p class="page-desc">${s.customerName} · 按指引优先级填报</p>
    ${workflowStepsBar(ctx.task)}
    ${renderSupplementFillBody(s, { readonly: false })}
    <div style="padding:12px 20px;border-top:1px solid #eee;text-align:right">
      <button class="btn" onclick="location.hash='#/branch-board'">返回</button>
      <button class="btn btn-primary" id="saveSupplementBtn">暂存</button>
      <button class="btn btn-success" id="completeSupplementBtn">提交数据</button>
    </div>`;
};

SPA_VIEWS['#/approval-review'] = function(ctx) {
  const params = new URLSearchParams((location.hash.split('?')[1] || ''));
  const approvalId = params.get('approvalId');
  const mode = params.get('mode') || 'view';
  const approval = (Store.get().approvals || []).find(a => a.id === approvalId);
  if (!approval) {
    return `<h1 class="page-title">数据审核</h1><p class="page-desc">未找到审核记录</p>
      <button class="btn" onclick="location.hash='#/approvals'">返回列表</button>`;
  }
  const task = Store.getTask(approval.taskId) || ctx.task;
  const roleKey = Store.get().currentRole;
  const canReview = mode === 'review' && canUserReviewApproval(approval, roleKey);
  const isView = !canReview;
  const twoLevel = task.initiatorOrg !== 'branch' && approval.reviewLevel;

  if (approval.docType !== 'supplement') {
    const detail = Store.getApprovalDocDetail(approval);
    return `
      <h1 class="page-title">${isView ? '查看' : '审核'} · ${approval.docName}</h1>
      <p class="page-desc">${approval.reviewLevel ? reviewLevelLabel(approval.reviewLevel) : approvalDocTypeLabel(approval.docType)}</p>
      <div class="card"><div class="card-body table-wrap"><table class="data-table"><tbody>
        ${detail.rows.map(r => `<tr><td style="width:140px;color:#909399">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}
      </tbody></table></div></div>
      ${renderApprovalReviewActions(canReview)}
      <input type="hidden" id="approvalReviewId" value="${approval.id}">`;
  }

  const s = getSupplementForApproval(approval);
  if (!s) {
    return `<h1 class="page-title">数据审核</h1><p class="page-desc">关联补录数据未找到</p>
      <button class="btn" onclick="location.hash='#/approvals'">返回</button>`;
  }

  const auditMeta = twoLevel ? `
    <div class="demo-tip" style="margin-bottom:12px">
      审核环节：<b>${reviewLevelLabel(approval.reviewLevel)}</b> ·
      当前审批人：<b>${approvalCurrentApproverLabel(approval, task)}</b> ·
      下一节点：<b>${approvalNextApproverLabel(approval, task)}</b> ·
      提交人：${approval.submitter} · ${approval.submitTime}
    </div>` : `
    <div class="demo-tip" style="margin-bottom:12px">
      审核环节：<b>${reviewLevelLabel(approval.reviewLevel || 'branch')}</b> ·
      提交人：${approval.submitter} · ${approval.submitTime}
    </div>`;

  const rejectInfo = approval.status === 'rejected' && approval.rejectReason
    ? `<div class="demo-tip" style="border-color:#f56c6c;background:#fef0f0;color:#c45656;margin-bottom:12px">驳回原因：${approval.rejectReason}</div>` : '';

  return `
    <h1 class="page-title">碳排放信息采集</h1>
    <p class="page-desc">${s.customerName} · ${isView ? '查看' : '审核'}（与补录填报内容一致）</p>
    ${auditMeta}
    ${rejectInfo}
    ${renderSupplementFillBody(s, { readonly: true })}
    ${renderApprovalReviewActions(canReview)}
    <input type="hidden" id="approvalReviewId" value="${approval.id}">`;
};

function approvalDocTypeLabel(type) {
  const map = { formal: '正式清单', supplement: '数据采集', calculation: '排放计算', task: '核算任务' };
  return map[type] || type;
}

function approvalRecordBadge(status) {
  const map = {
    pending: ['待审核', 'badge-warning'],
    approved: ['已通过', 'badge-success'],
    rejected: ['已驳回', 'badge-danger']
  };
  const [text, cls] = map[status] || [status, 'badge-draft'];
  return `<span class="badge ${cls}">${text}</span>`;
}

SPA_VIEWS['#/approvals'] = function(ctx) {
  const listKey = 'approvals';
  const roleKey = Store.get().currentRole;
  const task = ctx.task;
  const twoLevel = task.initiatorOrg !== 'branch';
  const all = filterApprovalsForRole(Store.get().approvals || [], roleKey, ctx.role, task.id);
  const view = paginateData(listKey, all);
  const pending = all.filter(a => a.status === 'pending').length;
  const roleHint = roleKey === 'manager'
    ? '客户经理：可查看本人提交的补录审核进度'
    : roleKey === 'branch'
      ? '分行管理员：可审核本分行业务的分行初审，查看全部相关记录'
      : '总行管理员：可执行总行终审，查看全行补录审核';
  const auditHint = task.initiatorOrg === 'branch'
    ? '分行发起任务：分行审核通过即可'
    : '总行发起：分行初审 → 总行终审；到达截止时点可「截止提交总行」';
  return `
    <h1 class="page-title">数据审核</h1>
    <p class="page-desc">${roleHint} · ${auditHint}</p>
    <div class="stats-row">
      <div class="stat-card"><div class="label">可见记录</div><div class="value">${all.length}</div></div>
      <div class="stat-card accent"><div class="label">待审核</div><div class="value">${pending}</div></div>
      <div class="stat-card"><div class="label">已通过</div><div class="value">${all.filter(a => a.status === 'approved').length}</div></div>
    </div>
    <div class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>序号</th><th>单据名称</th><th>审核环节</th><th>提交人</th><th>提交时间</th><th>状态</th>
    ${twoLevel ? '<th>当前审批人</th><th>下一节点审批人</th>' : '<th>审批人</th><th>审批时间</th>'}
    <th>操作</th></tr></thead>
    <tbody>${view.rows.map((a, i) => {
      const canReview = canUserReviewApproval(a, roleKey);
      const ops = [];
      if (canReview) ops.push(`<a href="#/approval-review?approvalId=${a.id}&mode=review" class="btn-link">审核</a>`);
      ops.push(`<a href="#/approval-review?approvalId=${a.id}&mode=view" class="btn-link">查看</a>`);
      const approverCols = twoLevel && a.docType === 'supplement'
        ? `<td>${approvalCurrentApproverLabel(a, task)}</td><td>${approvalNextApproverLabel(a, task)}</td>`
        : `<td>${a.approver || '-'}</td><td>${a.approveTime || '-'}</td>`;
      return `<tr>
      <td>${view.startIndex + i + 1}</td>
      <td>${a.docName}</td>
      <td>${a.reviewLevel ? reviewLevelLabel(a.reviewLevel) : approvalDocTypeLabel(a.docType)}</td>
      <td>${a.submitter}</td>
      <td>${a.submitTime}</td>
      <td>${approvalRecordBadge(a.status)}</td>
      ${approverCols}
      <td>${ops.join(' · ')}</td>
    </tr>`;
    }).join('')}${view.rows.length === 0 ? `<tr><td colspan="${twoLevel ? 10 : 9}" style="text-align:center;padding:32px;color:#909399">当前角色下无可见审核记录</td></tr>` : ''}</tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
};

SPA_VIEWS['#/methods'] = function(ctx) {
  const methods = ctx.data.methods.length ? ctx.data.methods : GUIDE.METHODS;
  const listKey = 'methods';
  const view = paginateData(listKey, methods);
  return `
    <h1 class="page-title">核算方法配置</h1>
    <div class="card"><div class="card-body"><div class="flow-banner"><strong>指引优先级：</strong>${GUIDE.FORMULAS.entity_energy}</div></div></div>
    <div class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>优先级</th><th>方法</th><th>质量等级</th><th>说明</th></tr></thead>
    <tbody>${view.rows.map(m => `<tr><td>${m.priority}</td><td>${m.name}</td><td>${m.qualityGrade||'-'}</td><td>${m.desc}</td></tr>`).join('')}</tbody></table></div>
    ${renderPagination(listKey, view)}</div>
    <div class="card"><div class="card-header"><h3>归因计算公式</h3></div><div class="card-body" style="font-size:13px;line-height:1.8">
      <p><strong>非项目：</strong>${GUIDE.FORMULAS.attribution_non_project}</p>
      <p><strong>项目：</strong>${GUIDE.FORMULAS.attribution_project}</p>
      <p><strong>兜底：</strong>${GUIDE.FORMULAS.attribution_fallback}</p>
      <p><strong>DQR：</strong>${GUIDE.FORMULAS.dqr}</p>
    </div></div>`;
};

SPA_VIEWS['#/factors'] = function(ctx) {
  const listKey = 'factors';
  const view = paginateData(listKey, ctx.data.factors);
  return `
    <h1 class="page-title">排放因子库</h1>
    <div class="toolbar"><button class="btn btn-primary">新增因子</button></div>
    <div class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>因子名称</th><th>取值</th><th>单位</th><th>类型</th><th>行业</th></tr></thead>
    <tbody>${view.rows.map(f => `<tr><td>${f.name}</td><td>${f.value}</td><td>${f.unit}</td><td>${f.type||'-'}</td><td>${f.industry}</td></tr>`).join('')}</tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
};

SPA_VIEWS['#/calculation'] = function(ctx) {
  const taskId = ctx.task.id;
  const listKey = 'calculation_' + taskId;
  const industryKey = 'calc_industry_' + taskId;
  const calcs = Store.getCalculations(taskId);
  const total = calcs.filter(c => c.attributedEmission != null).reduce((s, c) => s + (c.attributedEmission || 0), 0);
  const doneCount = calcs.filter(c => c.status === 'done' || c.entityEmission != null).length;
  const industries = computeIndustryStatsFromCalcs(taskId);
  const industryView = paginateData(industryKey, industries);
  const rows = Store.getFormalList(taskId)
    .filter(f => f.status === 'confirmed')
    .map(f => ({ f, calc: calcs.find(c => c.formalId === f.id) }));
  const view = paginateData(listKey, rows);
  return `
    <h1 class="page-title">碳排放计算</h1>
    <p class="page-desc">（四）排放量计算 · 主体/项目排放与归因排放汇总</p>
    ${workflowStepsBar(ctx.task)}
    <div class="toolbar">
      <button type="button" class="btn btn-success" id="confirmResultBtn">确认结果</button>
    </div>
    <div class="stats-row">
      <div class="stat-card accent"><div class="label">总归因排放量</div><div class="value">${formatNum(total)}</div><div class="sub">吨 CO₂e</div></div>
      <div class="stat-card"><div class="label">已计算</div><div class="value">${doneCount}</div><div class="sub">/ ${calcs.length} 笔</div></div>
    </div>
    <div class="card"><div class="card-header"><h3>分行业归因排放</h3></div><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>行业</th><th>笔数</th><th>归因排放(t)</th><th>占比</th></tr></thead>
    <tbody>${industryView.rows.length ? industryView.rows.map(i => `<tr><td>${i.industry}</td><td>${i.count}</td><td>${formatNum(i.emission)}</td><td>${i.share}%</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;padding:24px;color:#909399">暂无分行业数据</td></tr>'}</tbody></table></div>
    ${industries.length ? renderPagination(industryKey, industryView) : ''}</div>
    <div class="card"><div class="card-header"><h3>排放计算清单</h3></div><div class="card-body table-wrap"><table class="data-table">
    <thead><tr>
      <th>一级分行</th><th>经办行</th><th>客户名称</th><th>业务品种</th><th>贷款账号</th>
      <th>投放金额（元）</th><th>投放日</th><th>贷款主体类型</th><th>所属行业</th>
      <th>月均信贷余额（万元）</th><th>营业收入（万元）</th><th>业务经理</th>
      <th>主体排放(tCO₂e)</th><th>归因排放(tCO₂e)</th><th>质量等级</th>
    </tr></thead>
    <tbody>${view.rows.map(({ f, calc }) => `<tr>${renderCalculationListCells(f, calc, taskId)}</tr>`).join('')}</tbody></table></div>
    ${renderPagination(listKey, view)}</div>`;
};

SPA_VIEWS['#/results'] = function(ctx) {
  const list = Store.getCalculations(ctx.task.id);
  const total = list.filter(c => c.attributedEmission != null).reduce((s, c) => s + (c.attributedEmission || 0), 0);
  const dqr = Store.calcDQR(ctx.task.id) || ctx.task.dqr;
  const industries = computeIndustryStatsFromCalcs(ctx.task.id);
  const industryKey = 'results_industry_' + ctx.task.id;
  const detailKey = 'results_detail_' + ctx.task.id;
  const industryView = paginateData(industryKey, industries.length ? industries : []);
  const detailView = paginateData(detailKey, list);
  return `
    <h1 class="page-title">核算结果查询</h1>
    <p class="page-desc">归因排放汇总 · DQR=${dqr ? dqr.dqr : '-'}（${dqr ? dqr.level : '待计算'}）</p>
    ${workflowStepsBar(ctx.task)}
    <div class="stats-row">
      <div class="stat-card accent"><div class="label">总归因排放量</div><div class="value">${formatNum(total)}</div><div class="sub">吨 CO₂e</div></div>
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
  const listKey = 'reports_' + ctx.task.id;
  const view = paginateData(listKey, reports);
  const calcs = Store.getCalculations(ctx.task.id);
  const total = calcs.filter(c => c.attributedEmission).reduce((s, c) => s + c.attributedEmission, 0);
  return `
    <h1 class="page-title">生成报告</h1>
    <p class="page-desc">Step 6 · 监管范围提取与报表生成 · 当前可归因排放 ${formatNum(total)} tCO₂e</p>
    ${workflowStepsBar(ctx.task)}
    <div class="card"><div class="card-header"><h3>新建导出</h3></div><div class="card-body form-grid">
      <div class="form-item"><label>导出范围</label><select id="exportScope"><option>监管报送范围（8大行业）</option><option>管理分析范围（8+15）</option><option>全量</option></select></div>
      <div class="form-item"><label>报表模板</label><select id="exportTemplate"><option>人行监管报送模板</option><option>内部管理报表</option><option>自定义统计表单</option></select></div>
      <div class="form-item full"><label>导出格式</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" id="exportExcel">导出 Excel</button>
          <button class="btn" id="exportPdf">导出 PDF</button>
        </div>
      </div>
    </div></div>
    <div class="card"><div class="card-header"><h3>历史导出记录</h3></div><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>报告名称</th><th>范围</th><th>格式</th><th>笔数</th><th>排放量</th><th>生成时间</th><th>操作人</th><th>状态</th></tr></thead>
    <tbody>${view.rows.map(r => `<tr><td>${r.name}</td><td>${r.scope}</td><td>${r.format}</td><td>${r.recordCount||'-'}</td><td>${r.totalEmission != null ? formatNum(r.totalEmission) : '-'}</td><td>${r.generatedAt||'-'}</td><td>${r.generatedBy||r.operator||'-'}</td><td>${reportStatusBadge(r.status)}</td></tr>`).join('')}
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

