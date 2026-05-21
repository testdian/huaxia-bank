# -*- coding: utf-8 -*-
from pathlib import Path

BASE = Path(__file__).parent / "pages"
BASE.mkdir(exist_ok=True)

def wr(name, title, script):
    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} - 投融资碳核算</title>
  <link rel="stylesheet" href="../assets/css/app.css">
</head>
<body>
<script src="../assets/js/mock-data.js"></script>
<script src="../assets/js/store.js"></script>
<script src="../assets/js/common.js"></script>
<script>
{script}
</script>
</body>
</html>"""
    (BASE / name).write_text(html, encoding="utf-8")
    print("OK", name)

wr("dashboard.html", "首页工作台", """
const { task } = renderLayout('首页工作台', 'dashboard.html');
const calcs = Store.getCalculations(task.id);
const totalAttr = calcs.filter(c => c.attributedEmission).reduce((s, c) => s + c.attributedEmission, 0);
document.getElementById('mainContent').innerHTML = `
  <h1 class="page-title">首页工作台</h1>
  <p class="page-desc">当前任务：${task.name}</p>
  <div class="demo-tip">演示：顶部切换角色/任务；重置数据恢复假数据。</div>
  ${demoSteps(6)}
  <motion class="stats-row">
    <div class="stat-card"><div class="label">候选业务</div><div class="value">${task.candidateCount}</div></div>
    <div class="stat-card accent"><motion class="label">补数</label><div class="value">${Math.round(task.supplementDone/task.supplementTotal*100)}%</div></div>
    <div class="stat-card"><div class="label">归因排放(t)</div><div class="value">${formatNum(totalAttr)}</div></div>
    <div class="stat-card"><div class="label">进度</div><div class="value">${task.progress}%</div></div>
  </div>
  <div class="card"><div class="card-header"><h3>快捷入口</h3></div><div class="card-body" style="display:flex;flex-wrap:wrap;gap:8px">
    <a href="tasks.html" class="btn">任务列表</a><a href="task-create.html" class="btn">新建</a>
    <a href="candidate-list.html" class="btn">候选清单</a><a href="formal-list.html" class="btn">正式清单</a>
    <a href="calculation.html" class="btn btn-primary">计算</a><a href="reports.html" class="btn btn-success">导出</a>
  </div></div>`;
""".replace("motion", "div").replace("</label>", "</div>").replace("<motion class=\"label\">", "<div class=\"label\">"))

wr("progress.html", "任务进度总览", """
const { task, data } = renderLayout('任务进度总览', 'progress.html');
document.getElementById('mainContent').innerHTML = `
<h1 class="page-title">任务进度总览</h1>
<p class="page-desc">${task.name}</p>
${demoSteps(4)}
<div class="card"><div class="card-header"><h3>各分行进度</h3></div>
<div class="card-body table-wrap"><table class="data-table"><thead><tr><th>分行</th><th>总数</th><th>完成</th><th>待办</th><th>逾期</th><th>完成率</th></tr></thead>
<tbody>${data.branchStats.map(b=>'<tr><td>'+b.branch+'</td><td>'+b.total+'</td><td>'+b.done+'</td><td>'+b.pending+'</td><td>'+b.overdue+'</td><td>'+Math.round(b.done/b.total*100)+'%</td></tr>').join('')}</tbody></table></motion></div>`;
""".replace("motion", "div"))

wr("tasks.html", "核算任务列表", """
const { data } = renderLayout('核算任务列表', 'tasks.html');
document.getElementById('mainContent').innerHTML = `
<h1 class="page-title">核算任务列表</h1>
<div class="toolbar"><a href="task-create.html" class="btn btn-primary">+ 新建核算任务</a></div>
<div class="card"><div class="card-body table-wrap"><table class="data-table">
<thead><tr><th>任务编号</th><th>任务名称</th><th>年度</th><th>行业范围</th><th>进度</th><th>状态</th><th>审批</th><th>操作</th></tr></thead>
<tbody>${data.tasks.map(t=>'<tr><td>'+t.id+'</td><td><a href="task-detail.html?id='+t.id+'">'+t.name+'</a></td><td>'+t.year+'</td><td>'+t.industryScope+'</td><td>'+t.progress+'%</td><td>'+statusBadge(t.status)+'</td><td>'+approvalBadge(t.approvalStatus)+'</td><td><a href="task-detail.html?id='+t.id+'" class="btn-link">详情</a></td></tr>').join('')}</tbody>
</table></div></div>`;
""")

wr("task-create.html", "新建核算任务", """
renderLayout('新建核算任务', 'task-create.html');
document.getElementById('mainContent').innerHTML = `
<h1 class="page-title">新建核算任务</h1>
${demoSteps(0)}
<div class="card"><div class="card-body">
<form id="taskForm" class="form-grid">
  <div class="form-item"><label>任务名称 <span class="req">*</span></label><input name="name" required placeholder="如：2025年度投融资碳排放核算"></div>
  <div class="form-item"><label>核算年度</label><select name="year"><option>2025</option><option>2024</option></select></div>
  <div class="form-item"><label>行业范围</label><select name="industryScope"><option>8+15行业（全量）</option><option>8大行业（监管）</option><option>自定义</option></select></div>
  <div class="form-item"><label>组织范围</label><select name="orgScope"><option>全行</option><option>指定分行</option></select></div>
  <div class="form-item"><label>输出目标</label><select name="goal"><option>监管报送</option><option>内部分析</option><option>两者</option></select></div>
  <div class="form-item"><label>截止日期</label><input type="date" name="deadline" value="2026-03-31"></div>
  <div class="form-item full"><label>参与分行</label><input name="branches" value="北京分行,上海分行,深圳分行,杭州分行"></div>
</form>
</div><div class="card-footer" style="padding:12px 20px;text-align:right">
  <a href="tasks.html" class="btn">取消</a>
  <button class="btn btn-primary" id="saveTask">保存并启动</button>
</div></div>`;
document.getElementById('saveTask').onclick = () => {
  const f = document.getElementById('taskForm');
  const id = 'T' + Date.now();
  Store.addTask({ id, name: f.name.value, year: +f.year.value, industryScope: f.industryScope.value.includes('8+')?'8+15':'8大行业',
    orgScope: f.orgScope.value, branches: f.branches.value.split(','), goal: f.goal.value, status: 'running', progress: 5,
    candidateCount: 0, formalCount: 0, supplementDone: 0, supplementTotal: 0, approvalStatus: 'none',
    createdAt: new Date().toISOString().slice(0,10), createdBy: Store.get().currentUser, deadline: f.deadline.value });
  toast('任务已创建','success'); location.href='task-detail.html?id='+id;
};
""")

wr("task-detail.html", "任务详情", """
const { task, data } = renderLayout('任务详情', 'tasks.html');
const id = getQuery('id') || data.currentTaskId;
const t = Store.getTask(id) || task;
document.getElementById('mainContent').innerHTML = `
<h1 class="page-title">${t.name}</h1>
<p class="page-desc">${t.id} · ${t.year}年 · ${statusBadge(t.status)}</p>
${demoSteps(3)}
<div class="card"><motion class="card-header"><h3>任务信息</h3>
  ${t.approvalStatus==='none'?'<button class="btn btn-primary btn-sm" onclick="openApproval(\\'task\\',\\''+t.id+'\\',\\''+t.name+'\\')">提交审核</button>':approvalBadge(t.approvalStatus)}
</div><div class="card-body form-grid">
  <div class="form-item"><label>行业范围</label><input readonly value="${t.industryScope}"></div>
  <motion class="form-item"><label>组织范围</label><input readonly value="${t.orgScope}"></div>
  <div class="form-item"><label>输出目标</label><input readonly value="${t.goal}"></div>
  <div class="form-item"><label>创建人</label><input readonly value="${t.createdBy}"></div>
</div></div>
<div class="card"><div class="card-header"><h3>流程入口</h3></div><div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap">
  <a href="candidate-list.html" class="btn">候选清单 (${t.candidateCount})</a>
  <a href="formal-list.html" class="btn">正式清单 (${t.formalCount})</a>
  <a href="branch-board.html" class="btn">补数看板</a>
  <a href="calculation.html" class="btn btn-primary">碳排放计算</a>
  <a href="reports.html" class="btn btn-success">报告导出</a>
</div></div>`;
""".replace("motion", "motion"))

print("batch1 done")
