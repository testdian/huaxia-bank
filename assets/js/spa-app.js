/** SPA 入口与路由 */
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
  '#/branch-board': '数据补录',
  '#/manager-tasks': '客户经理任务',
  '#/supplement-fill': '在线补录填报',
  '#/approval-review': '数据审核详情',
  '#/approvals': '数据审核',
  '#/factors': '排放因子库',
  '#/calculation': '碳排放计算',
  '#/results': '核算结果查询',
  '#/reports': '生成报告',
  '#/interfaces': '接口管理'
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
    location.hash = getDefaultRouteForRole(roleKey);
    return;
  }
  if (base === '#/calculation') {
    const tid = Store.get().currentTaskId;
    if (tid && !Store.isDataCollectionComplete(tid)) {
      toast('请先完成数据采集环节全部业务（必收数审核通过或经济法直算完成）', 'warning');
      location.hash = '#/data-collect?taskId=' + encodeURIComponent(tid);
      return;
    }
  }
  if (base === '#/reports') {
    const tid = Store.get().currentTaskId;
    const t = Store.getTask(tid);
    if (tid && t && (t.workflowStep ?? 0) < WORKFLOW_STEP.REPORT && !t.resultsConfirmed) {
      toast('请先在排放计算页点击「确认结果」', 'warning');
      location.hash = '#/calculation?taskId=' + encodeURIComponent(tid);
      return;
    }
  }
  const title = ROUTE_TITLES[base] || '投融资碳核算';
  const ctx = renderSpaLayout(title);
  const fn = SPA_VIEWS[base] || SPA_VIEWS['#/tasks'];
  const root = document.getElementById('viewRoot');
  if (!root) return;
  root.innerHTML = fn(ctx);
  bindPageEvents(base, ctx);
  document.title = title + ' - 华夏银行投融资碳核算';
}

function bindPageEvents(base, ctx) {
  const taskId = ctx.task.id;
  let paginationHook = null;

  if (base === '#/tasks') {
    qs('#taskFilterBtn')?.addEventListener('click', () => {
      saveTaskFilters({
        name: qs('#tf_name')?.value || '',
        year: qs('#tf_year')?.value || '',
        industryScope: qs('#tf_industry')?.value || '',
        progress: qs('#tf_progress')?.value ?? '',
        status: qs('#tf_status')?.value || ''
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
  }

  if (base === '#/task-create') {
    bindTaskIndustryScopeToggle();
    bindTaskInitiatorToggle();
    bindCustomIndustryPanel();

    const btn = document.getElementById('saveTaskBtn');
    if (btn) btn.onclick = () => {
      const f = document.getElementById('taskForm');
      if (!f.reportValidity()) return;
      const payload = readTaskFormPayload(f);
      if (payload.industryScope === '自定义' && !payload.industryCustomCodes.length) {
        toast('自定义行业为必填项，请至少选择一项行业', 'warning');
        return;
      }
      const id = 'T' + Date.now();
      Store.addTask({
        id,
        ...payload,
        balanceThreshold: 500, accountingPeriod: '自然年度',
        branches: ['北京分行', '上海分行'],
        status: 'running', progress: 10, candidateCount: 0, formalCount: 0,
        supplementDone: 0, supplementTotal: 0, approvalStatus: 'none',
        syncedFromInterface: false,
        workflowStep: WORKFLOW_STEP.CANDIDATES,
        createdAt: new Date().toISOString().slice(0, 10),
        createdBy: Store.get().currentUser
      });
      toast('任务已创建，请进入「清单识别」从接口同步台账后再筛选', 'success');
      location.hash = '#/candidates';
    };
  }

  if (base === '#/task-edit') {
    bindTaskIndustryScopeToggle();
    bindTaskInitiatorToggle();
    bindCustomIndustryPanel();

    const btn = document.getElementById('saveTaskEditBtn');
    if (btn) btn.onclick = () => {
      const f = document.getElementById('taskForm');
      if (!f.reportValidity()) return;
      const taskId = f.dataset.taskId;
      const payload = readTaskFormPayload(f);
      if (payload.industryScope === '自定义' && !payload.industryCustomCodes.length) {
        toast('自定义行业为必填项，请至少选择一项行业', 'warning');
        return;
      }
      Store.updateTask(taskId, payload);
      Store.update(d => { d.currentTaskId = taskId; });
      toast('任务已保存，可点击上方步骤继续流程', 'success');
      route();
    };
  }

  if (base === '#/task-view') {
    qsa('#taskViewTabs .tab').forEach(tab => {
      tab.onclick = () => {
        const id = getQuery('id') || ctx.task.id;
        location.hash = '#/task-view?id=' + id + '&tab=' + tab.dataset.tab;
      };
    });
  }

  if (base === '#/candidates') {
    const readFilterRules = () => ({
      tier1Branch: qs('#f_tier1')?.value || '',
      productType: qs('#f_product')?.value || '',
      borrowerType: qs('#f_borrower')?.value || '',
      industry: qs('#f_industry')?.value || '',
      manager: qs('#f_manager')?.value || '',
      balanceMin: qs('#f_bal_min')?.value ?? '',
      balanceMax: qs('#f_bal_max')?.value ?? ''
    });

    const runCandidateQuery = () => {
      Store.saveCandidateFilterRules(taskId, readFilterRules());
      setListPage('candidates_' + taskId, 1);
      route();
    };

    const importBtn = document.getElementById('importBtn');
    if (importBtn) importBtn.onclick = () => {
      const r = Store.syncCandidates(taskId);
      if (!r.ok) {
        toast(r.message, 'warning');
        return;
      }
      setListPage('candidates_' + taskId, 1);
      toast(
        `已从接口「${r.interfaceName}」（${r.source}）拉取 ${r.year} 年度全量 ${r.totalInInterface.toLocaleString()} 笔台账（演示展示 ${r.count} 笔），请筛选并勾选拟纳入业务`,
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
      Store.saveCandidateFilterRules(taskId, {
        tier1Branch: '', productType: '', borrowerType: '', industry: '', manager: '',
        balanceMin: '', balanceMax: ''
      });
      setListPage('candidates_' + taskId, 1);
      toast('筛选已重置', 'success');
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
      const n = Store.getCandidates(taskId).filter(c => c.included).length;
      if (!n) { toast('请先勾选拟纳入正式清单的业务', 'warning'); return; }
      Store.generateFormalFromCandidates(taskId);
      toast('已生成正式清单 ' + n + ' 笔，请确认对象与边界', 'success');
      location.hash = '#/formal';
    };

    paginationHook = () => {
      const rules = readFilterRules();
      Store.saveCandidateFilterRules(taskId, rules);
    };

    qs('#checkAllPage')?.addEventListener('change', e => {
      qsa('#candidateTbody .row-check').forEach(cb => {
        cb.checked = e.target.checked;
        Store.update(d => {
          const c = d.candidates.find(x => x.id === cb.dataset.id);
          if (c) c.included = cb.checked;
        });
      });
      route();
    });

    qs('#selectAllIncluded')?.addEventListener('change', e => {
      qsa('#candidateTbody tr').forEach(tr => {
        const cb = tr.querySelector('.row-check');
        if (!cb) return;
        const id = cb.dataset.id;
        cb.checked = e.target.checked;
        Store.update(d => { const x = d.candidates.find(i => i.id === id); if (x) x.included = e.target.checked; });
      });
      route();
    });

    qsa('.row-check').forEach(cb => {
      cb.onchange = () => {
        Store.update(d => {
          const c = d.candidates.find(x => x.id === cb.dataset.id);
          if (c) c.included = cb.checked;
        });
        route();
      };
    });
  }

  if (base === '#/formal') {
    qs('#formalCheckAll')?.addEventListener('change', e => {
      qsa('#formalTbody .formal-row-check').forEach(cb => {
        if (!cb.disabled) cb.checked = e.target.checked;
      });
    });

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
      Store.confirmFormalItems(taskId, toLock.map(f => f.id));
      toast(`已锁定 ${toLock.length} 笔，进入数据采集环节`, 'success');
      location.hash = `#/data-collect?taskId=${encodeURIComponent(taskId)}`;
    });
  }

  if (base === '#/data-collect') {
    qs('#dispatchCheckAll')?.addEventListener('change', e => {
      qsa('#dispatchTbody .dispatch-row-check').forEach(cb => {
        if (!cb.disabled) cb.checked = e.target.checked;
      });
    });

    qs('#dispatchSupplementBtn')?.addEventListener('click', () => {
      const ids = qsa('#dispatchTbody .dispatch-row-check:checked').map(cb => cb.value);
      if (!ids.length) {
        toast('请勾选要派发的已锁定记录', 'warning');
        return;
      }
      const n = Store.dispatchSupplements(taskId, ids);
      if (!n) {
        toast('所选记录无法派发（可能已派发或未锁定）', 'warning');
        return;
      }
      toast(`已发放 ${n} 笔补录任务`, 'success');
      route();
    });

    qs('#economyDirectBtn')?.addEventListener('click', () => {
      const economyIds = Store.getFormalList(taskId)
        .filter(f => {
          const mode = f.collectMode || resolveCollectMode(f.loanType);
          return f.status === 'confirmed' && mode === 'economy_direct' && f.economyDirectStatus !== 'done';
        })
        .map(f => f.id);
      if (!economyIds.length) {
        toast('当前没有待直算的经济法记录（需已锁定且未完成直算）', 'warning');
        return;
      }
      const n = Store.runEconomyDirectCalc(taskId, economyIds);
      toast(n ? `已完成 ${n} 笔经济法直算（主体+归因排放）` : '直算失败', n ? 'success' : 'warning');
      route();
    });

    qs('#zeroMissingBtn')?.addEventListener('click', () => {
      const n = Store.zeroMissingEntityEmissions(taskId);
      if (!n) {
        toast('当前无缺失主体排放的记录', 'warning');
        return;
      }
      toast(`已将 ${n} 笔缺失记录的主体排放置为 0，数据采集已完成`, 'success');
      route();
    });

    qs('#submitAllDataBtn')?.addEventListener('click', () => {
      const r = Store.submitAllCollectData(taskId);
      if (!r?.ok) {
        toast(r?.message || '请待全部记录计算出主体排放后再提交', 'warning');
        return;
      }
      toast('已全部提交，进入排放计算环节', 'success');
      location.hash = '#/calculation?taskId=' + encodeURIComponent(taskId);
    });

    qsa('.view-fill-btn').forEach(btn => {
      btn.onclick = () => openSupplementFillDrawer(btn.dataset.id);
    });
  }

  if (base === '#/supplement-fill') {
    const sid = new URLSearchParams((location.hash.split('?')[1] || '')).get('id') || 'S002';
    bindSupplementMethodTabs(false, qs('#viewRoot'));
    const save = (complete) => {
      const s = Store.get().supplements.find(x => x.id === sid);
      const tab = qs('.tab.active')?.dataset.tab || 'report';
      if (tab === 'economy' && isEconomyTabLockedForSupplement(s)) {
        toast('该笔业务已选择经济法直算，请择其他方法填报', 'warning');
        return;
      }
      const payload = { complete };
      if (tab === 'report') {
        payload.reportedEmission = Number(qs('#f_report_emission')?.value) || null;
        payload.disclosureChannel = qs('#f_channel')?.value;
        payload.thirdPartyVerified = qs('#f_verified')?.value === 'yes';
        payload.energyTotalEmission = null;
        payload.productTotalEmission = null;
        payload.economyValue = null;
        payload.fallbackFactor = null;
      } else if (tab === 'energy') {
        payload.energyTotalEmission = Number(qs('#f_energy_total')?.value) || null;
        payload.reportedEmission = null;
        payload.productTotalEmission = null;
        payload.economyValue = null;
        payload.fallbackFactor = null;
      } else if (tab === 'product') {
        payload.productTotalEmission = Number(qs('#f_product_total')?.value) || null;
        payload.reportedEmission = null;
        payload.energyTotalEmission = null;
        payload.economyValue = null;
        payload.fallbackFactor = null;
      } else if (tab === 'economy') {
        payload.economyValue = Number(qs('#f_economy_value')?.value) || null;
        payload.economyFactor = Number(qs('#f_economy_factor')?.value) || 2.35;
        payload.economyBasis = qs('#f_economy_basis')?.value;
        payload.reportedEmission = null;
        payload.energyTotalEmission = null;
        payload.productTotalEmission = null;
        payload.fallbackFactor = null;
      } else if (tab === 'other') {
        payload.fallbackFactor = Number(qs('#f_fallback_factor')?.value) || null;
        payload.reportedEmission = null;
        payload.energyTotalEmission = null;
        payload.productTotalEmission = null;
        payload.economyValue = null;
      }
      payload.totalAssets = Number(qs('#f_total_assets')?.value) || null;
      payload.revenue = Number(qs('#f_revenue')?.value) || null;
      payload.avgLoanBalance = Number(qs('#f_avg_loan')?.value) || null;
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
      if (complete) {
        Store.submitSupplementForReview(sid);
        toast('数据已提交，进入审核流程', 'success');
        location.hash = '#/branch-board?taskId=' + taskId;
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
    bindSupplementMethodTabs(true, qs('#viewRoot'));
    const approvalId = qs('#approvalReviewId')?.value;
    const finishReview = (approved, rejectReason) => {
      const approval = (Store.get().approvals || []).find(a => a.id === approvalId);
      if (!approval) return;
      Store.resolveApproval(approvalId, approved, rejectReason);
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
      } else {
        toast(approved ? '审核通过' : '已驳回，补录任务已退回', approved ? 'success' : 'warning');
      }
      location.hash = '#/approvals?taskId=' + tid;
    };
    qs('#approvalCancelBtn')?.addEventListener('click', () => {
      location.hash = '#/approvals?taskId=' + taskId;
    });
    qs('#approvalApproveBtn')?.addEventListener('click', () => {
      openApprovalActionConfirm('approve', finishReview);
    });
    qs('#approvalRejectBtn')?.addEventListener('click', () => {
      openApprovalActionConfirm('reject', finishReview);
    });
  }

  if (base === '#/calculation') {
    qs('#confirmResultBtn')?.addEventListener('click', () => {
      const r = Store.confirmCalculationResults(taskId);
      if (!r?.ok) {
        toast(r?.message || '无法确认结果', 'warning');
        return;
      }
      toast('结果已确认，进入生成报告环节', 'success');
      location.hash = '#/reports?taskId=' + encodeURIComponent(taskId);
    });
  }

  if (base === '#/reports') {
    const doExport = (format) => {
      const scope = qs('#exportScope')?.value || '监管报送范围（8大行业）';
      const template = qs('#exportTemplate')?.value || '人行监管报送模板';
      Store.generateReport(taskId, scope, template, format);
      toast('已生成：' + scope + ' · ' + format + '（演示）', 'success');
      route();
    };
    qs('#exportExcel')?.addEventListener('click', () => doExport('Excel'));
    qs('#exportPdf')?.addEventListener('click', () => doExport('PDF'));
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

  bindListPagination(paginationHook);
}

function openInterfaceBatchModal(batchId) {
  const { batch, rows, total } = Store.getInterfaceBatchRecords(batchId, 15);
  if (!batch) return;
  if (!ensureReviewModal()) return;

  const modal = qs('#reviewModal');
  modal?.querySelector('.modal')?.classList.add('modal-xl');

  const rowsHtml = rows.length ? rows.map(c => `<tr>${renderCandidateListCells(c)}</tr>`).join('')
    : `<tr><td colspan="12" style="text-align:center;padding:24px;color:#909399">暂无台账数据</td></tr>`;

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
          <th>一级分行</th><th>经办行</th><th>客户名称</th><th>业务品种</th><th>贷款账号</th>
          <th>投放金额（元）</th><th>投放日</th><th>贷款主体类型</th><th>所属行业</th>
          <th>月均信贷余额（万元）</th><th>营业收入（万元）</th><th>业务经理</th>
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
    <button class="btn" id="rejectReviewBtn">驳回</button>
    <button class="btn btn-primary" id="approveReviewBtn">通过</button>`;
  qs('#rejectReviewBtn').onclick = () => {
    Store.resolveApproval(approvalId, false);
    hideModal('reviewModal');
    toast('已驳回', 'success');
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
      root.innerHTML = `
        <div class="modal-overlay" id="approvalModal">
          <div class="modal">
            <div class="modal-header"><h4>提交审核</h4><button class="modal-close" id="closeApproval">&times;</button></div>
            <div class="modal-body"><p>确认将 <strong id="approvalDocName"></strong> 提交至<strong>绿金系统审批模块</strong>？</p>
            <p style="font-size:13px;color:#909399;margin-top:8px">审批流转由宿主系统处理，本模块仅回写状态。</p></div>
            <div class="modal-footer"><button class="btn" id="cancelApproval">取消</button><button class="btn btn-primary" id="approvalConfirmBtn">确认提交</button></div>
          </div>
        </div>`
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
window.addEventListener('load', () => {
  if (!location.hash) location.hash = getDefaultRouteForRole(Store.get().currentRole);
  route();
});
