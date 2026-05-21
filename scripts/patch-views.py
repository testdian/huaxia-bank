#!/usr/bin/env python3
"""Patch spa-views.js for enriched demo UI."""
from pathlib import Path

p = Path(__file__).resolve().parents[1] / 'assets/js/spa-views.js'
text = p.read_text(encoding='utf-8')

# boundary view
old_b = """SPA_VIEWS['#/boundary'] = function(ctx) {
  const list = Store.getFormalList(ctx.task.id);
  return `
    <h1 class="page-title">核算对象与边界</h1>
    ${demoSteps(2)}
    <motion class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>客户</th><th>核算对象类型</th><th>核算边界</th><th>核算周期</th><th>操作</th></tr></thead>
    <tbody>${list.map(f => `<tr><td>${f.customerName}</td><td><select onchange="toast('已更新')"><option ${f.objectType==='主体'?'selected':''}>主体</option><option ${f.objectType==='项目'?'selected':''}>项目</option></select></td>
    <td><select><option>${f.boundary}</option><option>运营边界</option><option>项目边界</option></select></td>
    <td>${f.period}</td><td><button class="btn-link">保存</button></td></tr>`).join('')}</tbody></table></div></div>`;
};"""

new_b = """SPA_VIEWS['#/boundary'] = function(ctx) {
  const list = Store.getFormalList(ctx.task.id).filter(f => f.status === 'confirmed' || f.status === 'draft');
  return `
    <h1 class="page-title">核算对象与边界</h1>
    <p class="page-desc">Step 3 · 确认核算对象类型、边界与周期（范围一、二）</p>
    ${demoSteps(2)}
    <div class="demo-tip">项目类业务核算「项目」边界；非项目类核算「融资主体」运营边界。已锁定 ${list.filter(f=>f.lockedAt).length} 笔。</div>
    <div class="card"><motion class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>客户</th><th>行业</th><th>核算对象</th><th>项目/设施</th><th>边界</th><th>控制法</th><th>周期</th><th>状态</th></tr></thead>
    <tbody>${list.map(f => `<tr>
      <td>${f.customerName}</td>
      <td>${f.industryMajor||'-'}</td>
      <td>${f.objectType}</td>
      <td>${f.projectName || f.facilityLocation || '-'}</td>
      <td>${f.boundary}</td>
      <td>${f.controlApproach || '运营控制法'}</td>
      <td>${f.period}</td>
      <td>${statusBadge(f.status)}</td>
    </tr>`).join('')}</tbody></table></motion></motion>
    <div class="card" style="margin-top:16px"><div class="card-header"><h3>边界说明示例</h3></div><div class="card-body" style="font-size:13px;line-height:1.8">
      ${list.slice(0,2).map(f => `<p><strong>${f.customerName}：</strong>${f.boundaryNote || '按指引确定范围一、二'}</p>`).join('')}
    </div></div>`;
};"""
new_b = new_b.replace('motion', 'motion').replace('motion', 'div')  # fix below
new_b = new_b.replace('motion', 'div')

if old_b.replace('motion','motion') not in text:
    # try without motion typo
    old_b = old_b.replace('motion', 'div')
    new_b = new_b.replace('motion', 'motion')
    new_b = new_b.replace('motion', 'motion')
    # rebuild new_b cleanly
    new_b = """SPA_VIEWS['#/boundary'] = function(ctx) {
  const list = Store.getFormalList(ctx.task.id);
  return `
    <h1 class="page-title">核算对象与边界</h1>
    <p class="page-desc">Step 3 · 确认核算对象类型、边界与周期（范围一、二）</p>
    ${demoSteps(2)}
    <div class="demo-tip">项目类业务核算「项目」边界；非项目类核算「融资主体」运营边界。</div>
    <motion class="card"><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>客户</th><th>行业</th><th>核算对象</th><th>项目/设施</th><th>边界</th><th>控制法</th><th>周期</th><th>状态</th></tr></thead>
    <tbody>${list.map(f => `<tr>
      <td>${f.customerName}</td><td>${f.industryMajor||'-'}</td><td>${f.objectType}</td>
      <td>${f.projectName || f.facilityLocation || '-'}</td><td>${f.boundary}</td>
      <td>${f.controlApproach || '运营控制法'}</td><td>${f.period}</td><td>${statusBadge(f.status)}</td>
    </tr>`).join('')}</tbody></table></div>
    <div class="card" style="margin-top:16px"><div class="card-header"><h3>边界说明</h3></div><motion class="card-body" style="font-size:13px;line-height:1.8">
      ${list.filter(f=>f.boundaryNote).slice(0,3).map(f => `<p><strong>${f.customerName}：</strong>${f.boundaryNote}</p>`).join('') || '<p>请在正式清单锁定后维护边界说明。</p>'}
    </div></div>`;
};"""
    new_b = new_b.replace('motion', 'div')

start = text.find("SPA_VIEWS['#/boundary']")
end = text.find("SPA_VIEWS['#/branch-board']")
if start >= 0 and end > start:
    text = text[:start] + new_b + '\n\n' + text[end:]
    print('boundary updated')

# results
old_r_start = text.find("SPA_VIEWS['#/results']")
old_r_end = text.find("SPA_VIEWS['#/reports']")
new_r = """SPA_VIEWS['#/results'] = function(ctx) {
  const list = Store.getCalculations(ctx.task.id);
  const total = list.filter(c=>c.attributedEmission).reduce((s,c)=>s+c.attributedEmission,0);
  const dqr = Store.calcDQR(ctx.task.id) || ctx.task.dqr;
  const industries = Store.getIndustryStats(ctx.task.id);
  return `
    <h1 class="page-title">核算结果查询</h1>
    <p class="page-desc">归因排放汇总 · DQR=${dqr ? dqr.dqr : '-'}（${dqr ? dqr.level : '待计算'}）</p>
    ${demoSteps(6)}
    <div class="stats-row">
      <div class="stat-card accent"><div class="label">总归因排放量</motion><div class="value">${formatNum(total)}</div><div class="sub">吨 CO₂e</div></div>
      <div class="stat-card"><div class="label">已计算</div><div class="value">${list.filter(c=>c.status==='done').length}</div><div class="sub">/ ${list.length} 笔</div></div>
      <div class="stat-card"><motion class="label">待计算</div><div class="value">${list.filter(c=>c.status==='pending').length}</div></div>
      <div class="stat-card"><div class="label">异常/兜底</div><motion class="value">${list.filter(c=>c.status==='warning').length}</div></div>
    </div>
    <div class="card"><div class="card-header"><h3>分行业归因排放</h3></div><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>行业</th><th>笔数</th><th>归因排放(t)</th><th>占比</th></tr></thead>
    <tbody>${(industries.length ? industries : []).map(i => `<tr><td>${i.industry}</td><td>${i.count}</td><td>${formatNum(i.emission)}</td><td>${i.share}%</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card"><div class="card-header"><h3>明细清单</h3></div><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>客户</th><th>行业</th><th>方法</th><th>主体排放</th><th>归因排放</th><th>数据质量</th><th>状态</th></tr></thead>
    <tbody>${list.map(c => `<tr><td>${c.customerName}</td><td>${c.industryMajor||'-'}</td><td>${c.method}</td><td>${formatNum(c.entityEmission)}</td><td>${formatNum(c.attributedEmission)}</td>
    <td>${c.qualityGrade ? qualityGradeBadge(c.qualityGrade) : '-'}</td><td>${statusBadge(c.status)}</td></tr>`).join('')}</tbody></table></motion></div>`;
};"""
new_r = new_r.replace('motion', 'motion')
new_r = new_r.replace('motion', 'div')
if old_r_start >= 0:
    text = text[:old_r_start] + new_r + '\n\n' + text[old_r_end:]
    print('results updated')

# reports
old_rep_start = text.find("SPA_VIEWS['#/reports']")
old_rep_end = text.find("SPA_VIEWS['#/mapping-industry']")
reports_fn = """SPA_VIEWS['#/reports'] = function(ctx) {
  const reports = Store.getReports(ctx.task.id);
  const calcs = Store.getCalculations(ctx.task.id);
  const total = calcs.filter(c => c.attributedEmission).reduce((s, c) => s + c.attributedEmission, 0);
  const approvals = Store.getApprovals(ctx.task.id).filter(a => a.status === 'pending');
  return `
    <h1 class="page-title">报告与导出</h1>
    <p class="page-desc">Step 8 · 监管范围提取与报表生成 · 当前可归因排放 ${formatNum(total)} tCO₂e</p>
    ${demoSteps(8)}
    <div class="stats-row">
      <div class="stat-card"><div class="label">已生成报告</div><div class="value">${reports.filter(r=>r.status==='generated').length}</motion></div>
      <div class="stat-card"><div class="label">待审批</div><div class="value">${approvals.length}</div></div>
    </div>
    <div class="card"><div class="card-header"><h3>历史导出记录</h3></div><div class="card-body table-wrap"><table class="data-table">
    <thead><tr><th>报告名称</th><th>范围</th><th>格式</th><th>笔数</th><th>排放量</th><th>生成时间</th><th>状态</th></tr></thead>
    <tbody>${reports.map(r => `<tr><td>${r.name}</td><td>${r.scope}</td><td>${r.format}</td><td>${r.recordCount||'-'}</td><td>${r.totalEmission != null ? formatNum(r.totalEmission) : '-'}</td><td>${r.generatedAt||'-'}</td><td>${statusBadge(r.status==='generated'?'done':'draft')}</td></tr>`).join('')}
    ${reports.length===0?'<tr><td colspan="7" style="text-align:center;padding:24px">暂无报告，请下方新建导出</td></tr>':''}
    </tbody></table></div></div>
    <div class="card"><div class="card-header"><h3>新建导出</h3></div><div class="card-body form-grid">
      <div class="form-item"><label>导出范围</label><select id="exportScope"><option>监管报送范围（8大行业）</option><option>管理分析范围（8+15）</option><option>全量</option></select></div>
      <div class="form-item"><label>报表模板</label><select id="exportTemplate"><option>人行监管报送模板</option><option>内部管理报表</option><option>自定义统计表单</option></select></div>
      <div class="form-item full"><label>导出格式</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" id="exportExcel">导出 Excel</button>
          <button class="btn" id="exportWord">导出 Word</button>
          <button class="btn btn-success" id="exportReg">生成监管报表</button>
        </div>
      </div>
    </div></div>`;
};"""
reports_fn = reports_fn.replace('motion', 'div')
if old_rep_start >= 0:
    text = text[:old_rep_start] + reports_fn + '\n\n' + text[old_rep_end:]
    print('reports updated')

# progress - add supplement summary
old_p = """SPA_VIEWS['#/progress'] = function(ctx) {
  const { task, data } = ctx;
  return `
    <h1 class="page-title">任务进度总览</h1>
    <p class="page-desc">${task.name}</p>
    ${demoSteps(4)}
    <div class="card"><motion class="card-header"><h3>各分行进度</h3><a href="#/branch-board" class="btn btn-sm">分行看板</a></div>"""

# use slice replace for progress
p_start = text.find("SPA_VIEWS['#/progress']")
p_end = text.find("SPA_VIEWS['#/tasks']")
new_p = """SPA_VIEWS['#/progress'] = function(ctx) {
  const { task, data } = ctx;
  const suppPct = task.supplementTotal ? Math.round(task.supplementDone / task.supplementTotal * 100) : 0;
  return `
    <h1 class="page-title">任务进度总览</h1>
    <p class="page-desc">${task.name} · 总进度 ${task.progress}%</p>
    ${demoSteps(task.workflowStep ?? 4)}
    <div class="stats-row">
      <div class="stat-card"><div class="label">正式清单</div><div class="value">${task.formalCount||0}</div></div>
      <div class="stat-card accent"><div class="label">补数完成率</div><motion class="value">${suppPct}%</div></motion>
      <div class="stat-card"><div class="label">DQR</div><div class="value">${task.dqr ? task.dqr.dqr : '-'}</div></div>
    </div>
    <div class="card"><div class="card-header"><h3>各分行补数进度</h3><a href="#/branch-board" class="btn btn-sm">分行看板</a></div>
    <div class="card-body table-wrap"><table class="data-table"><thead><tr><th>分行</th><th>总数</th><th>完成</th><th>待办</th><th>逾期</th><th>完成率</th></tr></thead>
    <tbody>${data.branchStats.map(b => `<tr><td>${b.branch}</td><td>${b.total}</td><td>${b.done}</td><td>${b.pending}</td><td>${b.overdue}</td><td>${Math.round(b.done/b.total*100)}%</td></tr>`).join('')}</tbody></table></div></div>`;
};"""
new_p = new_p.replace('motion', 'motion')
new_p = new_p.replace('motion', 'div')
if p_start >= 0 and p_end > p_start:
    text = text[:p_start] + new_p + '\n\n' + text[p_end:]
    print('progress updated')

# supplement-fill add dispatch banner
needle = '<div class="demo-tip">方法优先级：'
if needle in text and 'dispatchedAt' not in text[text.find(needle)-200:text.find(needle)+200]:
    text = text.replace(
        needle,
        '<div class="demo-tip">派发：${s.dispatchedAt || "-"} · ${s.dispatchedBy || "总行绿金部"} · 截止 ${s.deadline}</motion>\n    ' + needle
    )
    text = text.replace('</motion>\n    <div class="demo-tip">方法优先级', '</div>\n    <div class="demo-tip">方法优先级', 1)
    print('supplement dispatch tip added')

p.write_text(text, encoding='utf-8')
print('done')
