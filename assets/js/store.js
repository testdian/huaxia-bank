/** localStorage 数据层 + 指引口径计算 */
const Store = {
  KEY: 'hxb_carbon_demo_v13',
  INTERFACES_KEY: 'hxb_carbon_interfaces_v1',

  _ensureInterfaces() {
    if (!localStorage.getItem(this.INTERFACES_KEY)) {
      this._migrateInterfacesFromLegacy();
    }
    if (!localStorage.getItem(this.INTERFACES_KEY)) {
      const batches = typeof DemoSeed !== 'undefined' ? DemoSeed.buildInterfaces() : [];
      localStorage.setItem(this.INTERFACES_KEY, JSON.stringify(batches));
    }
  },

  _migrateInterfacesFromLegacy() {
    ['hxb_carbon_demo_v12', 'hxb_carbon_demo_v11', 'hxb_carbon_demo_v10'].forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) return;
        const d = JSON.parse(raw);
        if (Array.isArray(d.interfaces) && d.interfaces.length) {
          localStorage.setItem(this.INTERFACES_KEY, JSON.stringify(d.interfaces));
        }
      } catch { /* ignore */ }
    });
  },

  _getInterfacesRaw() {
    this._ensureInterfaces();
    try {
      return JSON.parse(localStorage.getItem(this.INTERFACES_KEY) || '[]');
    } catch {
      return [];
    }
  },

  _migrateReportPdfToWord() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (!Array.isArray(d.reports)) return;
      let changed = false;
      d.reports.forEach(r => {
        if (r.format === 'PDF') {
          r.format = 'Word';
          changed = true;
        }
      });
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  init() {
    this._ensureInterfaces();
    this._migrateReportPdfToWord();
    if (!localStorage.getItem(this.KEY)) {
      const seed = { ...(window.MOCK_SEED || {}) };
      delete seed.interfaces;
      localStorage.setItem(this.KEY, JSON.stringify({
        ...seed,
        currentRole: 'hq',
        currentUser: '张明',
        currentTaskId: 'T2025001'
      }));
    }
  },

  get() {
    this.init();
    const data = JSON.parse(localStorage.getItem(this.KEY));
    data.interfaces = this._getInterfacesRaw();
    return data;
  },
  set(data) {
    const rest = { ...data };
    const interfaces = rest.interfaces;
    delete rest.interfaces;
    if (interfaces) {
      localStorage.setItem(this.INTERFACES_KEY, JSON.stringify(interfaces));
    }
    localStorage.setItem(this.KEY, JSON.stringify(rest));
  },
  update(fn) { const data = this.get(); fn(data); this.set(data); return data; },
  reset() {
    localStorage.removeItem(this.KEY);
    this.init();
    return this.get();
  },

  getCurrentTask() {
    const d = this.get();
    return d.tasks.find(t => t.id === d.currentTaskId) || d.tasks[0];
  },
  getTask(id) { return this.get().tasks.find(t => t.id === id); },
  getCandidates(taskId) { return this.get().candidates.filter(c => c.taskId === taskId); },
  getFormalList(taskId) { return this.get().formalList.filter(f => f.taskId === taskId); },
  getSupplements(taskId, filter) {
    let list = this.get().supplements.filter(s => s.taskId === taskId);
    if (filter?.branch) list = list.filter(s => s.branch === filter.branch);
    if (filter?.manager) list = list.filter(s => s.manager === filter.manager);
    return list;
  },
  getCalculations(taskId) { return this.get().calculations.filter(c => c.taskId === taskId); },

  isFormalCollectComplete(f, d, taskId) {
    const data = d || this.get();
    const tid = taskId || f.taskId;
    const mode = f.collectMode || resolveCollectMode(f.loanType);
    const s = data.supplements.find(x => x.formalId === f.id && x.taskId === tid);
    if (s) return s.auditStage === 'approved';
    if (mode === 'economy_direct') return f.economyDirectStatus === 'done';
    return false;
  },

  isDataCollectionComplete(taskId) {
    const t = this.getTask(taskId);
    if (t?.dataCollectSubmitted) return true;
    const formal = this.getFormalList(taskId).filter(f => f.status === 'confirmed');
    if (!formal.length) return false;
    const d = this.get();
    return formal.every(f => this.isFormalCollectComplete(f, d, taskId));
  },

  allConfirmedHaveEntityEmission(taskId) {
    const formal = this.getFormalList(taskId).filter(f => f.status === 'confirmed');
    if (!formal.length) return false;
    return formal.every(f => this.getFormalEntityEmission(taskId, f.id) != null);
  },

  hasMissingEntityEmission(taskId) {
    return this.getFormalList(taskId)
      .filter(f => f.status === 'confirmed')
      .some(f => this.getFormalEntityEmission(taskId, f.id) == null);
  },

  getFormalEntityEmission(taskId, formalId) {
    const calc = this.getCalculations(taskId).find(c => c.formalId === formalId);
    if (calc && calc.entityEmission != null) return calc.entityEmission;
    const s = this.get().supplements.find(x => x.formalId === formalId && x.taskId === taskId);
    if (s && (s.auditStage === 'approved' || s.status === 'completed')) {
      const e = this.calcEntityEmission(s);
      if (e != null && !Number.isNaN(Number(e))) return Number(e);
    }
    return null;
  },

  _markFormalCollectDone(d, f, taskId) {
    const s = d.supplements.find(x => x.formalId === f.id && x.taskId === taskId);
    const mode = f.collectMode || resolveCollectMode(f.loanType);
    if (s) {
      s.status = 'completed';
      s.auditStage = 'approved';
      s.approvalStatus = 'approved';
      s.branchReviewStatus = s.branchReviewStatus === 'pending' ? 'approved' : (s.branchReviewStatus || 'approved');
      s.hqReviewStatus = s.hqReviewStatus === 'pending' ? 'approved' : (s.hqReviewStatus || 'none');
    } else if (mode === 'economy_direct') {
      f.economyDirectStatus = 'done';
      f.economyDirectAt = f.economyDirectAt || new Date().toLocaleString('zh-CN');
    }
    f.dataCollectStatus = 'done';
  },

  _upsertCalculationFromFormal(d, f, taskId, overrides = {}) {
    const s = d.supplements.find(x => x.formalId === f.id && x.taskId === taskId);
    const cand = d.candidates.find(x => x.id === f.customerId);
    let calc = d.calculations.find(x => x.formalId === f.id && x.taskId === taskId);
    const method = s ? this.matchMethod(s) : GUIDE.METHODS.find(m => m.id === 'economy');
    let entityEmission = overrides.entityEmission;
    if (entityEmission == null && calc?.entityEmission != null) entityEmission = calc.entityEmission;
    if (entityEmission == null && s) {
      const e = this.calcEntityEmission(s);
      if (e != null) entityEmission = e;
    }
    if (entityEmission == null) entityEmission = 0;
    const avgBalance = s?.avgLoanBalance || cand?.avgMonthlyBalance || 0;
    const payload = {
      taskId,
      formalId: f.id,
      customerName: f.customerName,
      bizType: f.bizType,
      method: overrides.method || method?.name || '其他计算法',
      methodId: overrides.methodId || method?.id || 'economy_fallback',
      entityEmission,
      avgBalance,
      totalAssets: s?.totalAssets || cand?.totalAssets || 50000,
      totalInvestment: f.totalInvestment || 50000,
      industryFactor: s?.economyFactor || 2.46,
      qualityGrade: overrides.qualityGrade ?? method?.qualityGrade ?? 5,
      status: 'done',
      approvalStatus: 'none',
      source: overrides.source || 'collect_submit',
      calculatedAt: new Date().toLocaleString('zh-CN')
    };
    payload.attributedEmission = overrides.attributedEmission != null
      ? overrides.attributedEmission
      : (calc?.attributedEmission != null ? calc.attributedEmission : this.calcAttributedEmission(payload, s || {}));
    const ql = ['', '一级(优)', '二级', '三级', '四级', '五级(兜底)'];
    payload.quality = ql[payload.qualityGrade] || '-';
    if (calc) Object.assign(calc, payload);
    else {
      calc = { id: 'CAL' + f.id.replace(/\W/g, ''), ...payload };
      d.calculations.push(calc);
    }
    return calc;
  },

  submitAllCollectData(taskId) {
    if (!this.allConfirmedHaveEntityEmission(taskId)) {
      return { ok: false, message: '请待全部已锁定业务计算出主体排放后再提交' };
    }
    this.update(d => {
      d.formalList.filter(f => f.taskId === taskId && f.status === 'confirmed').forEach(f => {
        this._upsertCalculationFromFormal(d, f, taskId);
        this._markFormalCollectDone(d, f, taskId);
      });
      const t = d.tasks.find(x => x.id === taskId);
      if (t) {
        t.dataCollectSubmitted = true;
        t.dataCollectSubmittedAt = new Date().toLocaleString('zh-CN');
      }
      this.syncTaskWorkflow(d, taskId);
    });
    return { ok: true };
  },

  zeroMissingEntityEmissions(taskId) {
    let count = 0;
    this.update(d => {
      d.formalList.filter(f => f.taskId === taskId && f.status === 'confirmed').forEach(f => {
        const calc = d.calculations.find(c => c.formalId === f.id && c.taskId === taskId);
        let hasEmission = calc && calc.entityEmission != null;
        if (!hasEmission) {
          const s = d.supplements.find(x => x.formalId === f.id && x.taskId === taskId);
          if (s && (s.auditStage === 'approved' || s.status === 'completed')) {
            const e = this.calcEntityEmission(s);
            hasEmission = e != null;
          }
        }
        if (hasEmission) return;
        this._upsertCalculationFromFormal(d, f, taskId, {
          entityEmission: 0,
          attributedEmission: 0,
          method: '其他计算法',
          methodId: 'economy_fallback',
          qualityGrade: 5,
          source: 'zero_fill'
        });
        this._markFormalCollectDone(d, f, taskId);
        count++;
      });
      if (count > 0) {
        const t = d.tasks.find(x => x.id === taskId);
        if (t) {
          t.dataCollectSubmitted = true;
          t.dataCollectSubmittedAt = new Date().toLocaleString('zh-CN');
        }
        this.syncTaskWorkflow(d, taskId);
      }
    });
    return count;
  },

  getReports(taskId) { return (this.get().reports || []).filter(r => r.taskId === taskId); },
  getApprovals(taskId) { return (this.get().approvals || []).filter(a => a.taskId === taskId); },
  getIndustryStats(taskId) { return this.get().industryStats || []; },

  setWorkflowStep(taskId, step) {
    return this.update(d => {
      const t = d.tasks.find(x => x.id === taskId);
      if (t) t.workflowStep = step;
    });
  },

  getCandidateFilterRules(taskId) {
    const t = this.getTask(taskId);
    const raw = t?.candidateFilterRules;
    const normalized = normalizeCandidateFilterRules(raw, t);
    if (!raw || normalized.customized !== true) {
      return getDefaultCandidateFilterRules(t);
    }
    return normalized;
  },

  saveCandidateFilterRules(taskId, rules) {
    return this.update(d => {
      const t = d.tasks.find(x => x.id === taskId);
      if (t) t.candidateFilterRules = { ...rules };
    });
  },

  filterCandidateList(taskId, rules) {
    let list = this.getCandidates(taskId);
    if (!list.length) return [];

    const task = this.getTask(taskId);
    const r = normalizeCandidateFilterRules(rules, task);

    if (task?.industryScope === '八大高碳行业') {
      list = list.filter(c => isCandidateInGuideAccountingScope(c));
    }
    if (r.productTypes?.length) {
      list = list.filter(c => r.productTypes.includes(candidateProductType(c)));
    }
    if (r.borrowerTypes?.length) {
      list = list.filter(c => r.borrowerTypes.includes(candidateBorrowerType(c)));
    }
    if (r.industries?.length) {
      list = list.filter(c => r.industries.includes(c.gbIndustryCode));
    }
    if (r.balanceMin !== '' && r.balanceMin != null) {
      const min = Number(r.balanceMin);
      if (!Number.isNaN(min)) list = list.filter(c => Number(c.avgMonthlyBalance) >= min);
    }
    if (r.balanceMax !== '' && r.balanceMax != null) {
      const max = Number(r.balanceMax);
      if (!Number.isNaN(max)) list = list.filter(c => Number(c.avgMonthlyBalance) <= max);
    }
    return list;
  },

  applyCandidateFilterInclusion(taskId, rules) {
    const filteredIds = new Set(this.filterCandidateList(taskId, rules).map(c => c.id));
    this.update(d => {
      d.candidates.filter(c => c.taskId === taskId).forEach(c => {
        c.included = filteredIds.has(c.id);
      });
    });
    return filteredIds.size;
  },

  getCandidatesForView(taskId, rules) {
    const all = this.getCandidates(taskId);
    if (!all.length) return { rows: [], total: 0, stats: {} };

    const list = this.filterCandidateList(taskId, rules);
    const stats = {
      syncedTotal: all.length,
      includedCount: list.filter(c => c.included).length,
      viewCount: list.length
    };
    return { rows: list, total: list.length, stats };
  },

  /** 从接口管理按月批次汇总，按任务核算年度拉取全量台账（演示展示子集） */
  syncCandidates(taskId) {
    const d = this.get();
    const t = d.tasks.find(x => x.id === taskId);
    if (!t) return { ok: false, message: '任务不存在' };
    const year = t.year;
    if (!year) return { ok: false, message: '任务未设置核算年度，无法从接口拉取台账' };

    const batches = (d.interfaces || []).filter(b => b.dataYear != null);
    let totalInInterface = 0;
    let successBatchCount = 0;
    let failedBatchCount = 0;

    if (batches.length) {
      const yearBatches = batches.filter(b => b.dataYear === year);
      successBatchCount = yearBatches.filter(b => b.status === 'success').length;
      failedBatchCount = yearBatches.filter(b => b.status === 'failed').length;
      totalInInterface = interfaceYearRecordTotal(batches, year);
      if (totalInInterface <= 0) {
        const hint = failedBatchCount
          ? `该年度有 ${failedBatchCount} 个月份批次获取失败，请先在「接口管理」中重新获取`
          : `接口管理中暂无 ${year} 年度台账批次，请等待每月1日自动推送`;
        return { ok: false, message: hint };
      }
    } else {
      const iface = (d.interfaces || []).find(i => i.id === 'IF001' || i.name === '贷款台账同步');
      if (!iface) return { ok: false, message: '未在接口管理中找到贷款台账同步批次，请先配置' };
      if (iface.status === 'failed') {
        return { ok: false, message: '接口台账批次当前不可用，请先在「接口管理」中重新获取' };
      }
      totalInInterface = (iface.yearRecords || {})[year] ?? iface.records ?? 0;
      if (totalInInterface <= 0) {
        return { ok: false, message: `接口中暂无 ${year} 年度台账数据` };
      }
    }

    const displayCount = CandidateSync.demoDisplayCount(totalInInterface);
    const batch = CandidateSync.generateBatchForYear(taskId, year, displayCount);

    this.update(data => {
      data.candidates = data.candidates.filter(c => c.taskId !== taskId);
      data.candidates.push(...batch);
      const task = data.tasks.find(x => x.id === taskId);
      if (task) {
        task.candidateCount = batch.length;
        task.syncedFromInterface = true;
        task.syncedAt = new Date().toLocaleString('zh-CN');
        task.syncInterfaceName = '贷款台账同步';
        task.syncSourceSystem = '信贷核心系统';
        task.syncYear = year;
        task.syncRecordTotal = totalInInterface;
        task.syncBatchCount = successBatchCount || undefined;
        task.workflowStep = Math.max(task.workflowStep ?? 0, WORKFLOW_STEP.CANDIDATES);
        task.progress = Math.max(task.progress || 0, 15);
        task.candidateFilterRules = getDefaultCandidateFilterRules(task);
      }
      batch.forEach(c => {
        c.accountingYear = year;
        c.excludeReason = null;
        c.excluded = false;
        c.included = false;
      });
    });

    const task = this.getTask(taskId);
    if (task) {
      this.applyCandidateFilterInclusion(taskId, getDefaultCandidateFilterRules(task));
    }

    return {
      ok: true,
      count: displayCount,
      totalInInterface,
      year,
      interfaceName: '贷款台账同步',
      source: '信贷核心系统',
      batchCount: successBatchCount
    };
  },

  getInterfaceBatch(batchId) {
    return (this.get().interfaces || []).find(b => b.id === batchId);
  },

  getInterfaceBatchRecords(batchId, limit = 15) {
    const batch = this.getInterfaceBatch(batchId);
    if (!batch || batch.status !== 'success') {
      return { batch, rows: [], total: 0 };
    }
    const rows = CandidateSync.generateInterfaceBatchPreview(batch, limit);
    return { batch, rows, total: batch.recordCount || rows.length };
  },

  retryInterfaceBatch(batchId) {
    let ok = false;
    this.update(d => {
      const b = d.interfaces.find(x => x.id === batchId);
      if (!b || b.status !== 'failed') return;
      b.status = 'success';
      b.recordCount = 3680 + Number((b.dataMonth || '2025-01').slice(5)) * 112 + (b.dataYear - 2024) * 48;
      b.pushTime = new Date().toLocaleString('zh-CN');
      b.retriedAt = b.pushTime;
      ok = true;
    });
    return ok;
  },

  generateFormalFromCandidates(taskId) {
    return this.update(d => {
      const included = d.candidates.filter(c => c.taskId === taskId && c.included);
      included.forEach((c, i) => {
        if (d.formalList.some(f => f.customerId === c.id && f.taskId === taskId)) return;
        const isProject = ['一般性固定资产贷款', '出口退税账户托管贷款'].includes(c.loanType || c.productType);
        d.formalList.push({
          id: 'F' + taskId + '_' + (i + 1),
          taskId, customerId: c.id, customerName: c.customerName,
          loanType: c.loanType || c.productType,
          productType: c.productType || c.loanType,
          collectMode: resolveCollectMode(c.loanType || c.productType),
          bizType: isProject ? 'project' : 'non_project',
          objectType: isProject ? '项目' : '融资主体',
          boundary: '范围一+范围二',
          scope1: true, scope2: true, period: '自然年度',
          status: 'draft',
          economyDirectStatus: null,
          gbIndustryCode: c.gbIndustryCode, industryMajor: c.industryMajor,
          industryLabel: c.industryLabel,
          tier1Branch: c.tier1Branch || c.branch,
          handlingBranch: c.handlingBranch,
          branch: c.tier1Branch || c.branch,
          loanAccount: c.loanAccount,
          disbursementAmount: c.disbursementAmount,
          disbursementDate: c.disbursementDate,
          borrowerType: c.borrowerType,
          avgMonthlyBalance: c.avgMonthlyBalance,
          operatingRevenue: c.operatingRevenue,
          manager: c.manager
        });
      });
      const t = d.tasks.find(x => x.id === taskId);
      if (t) {
        t.formalCount = d.formalList.filter(f => f.taskId === taskId).length;
        t.workflowStep = WORKFLOW_STEP.FORMAL;
        t.progress = Math.max(t.progress || 0, 30);
      }
    });
  },

  /** 按指引优先级匹配方法 */
  matchMethod(supplement) {
    if (supplement.reportedEmission) return GUIDE.METHODS.find(m => m.id === 'report');
    if (supplement.energyTotalEmission) return GUIDE.METHODS.find(m => m.id === 'energy');
    if (supplement.productTotalEmission) return GUIDE.METHODS.find(m => m.id === 'product');
    if (supplement.economyValue) return GUIDE.METHODS.find(m => m.id === 'economy');
    if (supplement.fallbackFactor) return GUIDE.METHODS.find(m => m.id === 'economy_fallback');
    return GUIDE.METHODS.find(m => m.id === 'economy_fallback');
  },

  calcEntityEmission(s) {
    const m = this.matchMethod(s);
    if (m.id === 'report') return Number(s.reportedEmission) || 0;
    if (m.id === 'energy') return Number(s.energyTotalEmission) || 0;
    if (m.id === 'product') return Number(s.productTotalEmission) || 0;
    if (m.id === 'economy') return Number(s.economyValue) * Number(s.economyFactor || 2.35);
    return 0;
  },

  calcAttributedEmission(calc, s) {
    const entityE = calc.entityEmission ?? this.calcEntityEmission(s);
    if (calc.bizType === 'project') {
      const inv = Number(calc.totalInvestment) || 1;
      return Math.round(entityE * (Number(calc.avgBalance) / inv));
    }
    const m = this.matchMethod(s);
    if (m.id === 'economy_fallback' || !entityE) {
      return Math.round(Number(calc.avgBalance) * Number(calc.industryFactor || 2.46));
    }
    const assets = Number(calc.totalAssets) || 1;
    return Math.round(entityE * (Number(calc.avgBalance) / assets));
  },

  qualityGradeFromMethod(methodId) {
    return GUIDE.METHODS.find(m => m.id === methodId)?.qualityGrade || 5;
  },

  calcDQR(taskId) {
    const calcs = this.getCalculations(taskId).filter(c => c.attributedEmission > 0);
    if (!calcs.length) return null;
    const sum = calcs.reduce((s, c) => s + c.attributedEmission, 0);
    const dqr = calcs.reduce((s, c) => s + c.attributedEmission * (c.qualityGrade || 5), 0) / sum;
    const level = GUIDE.QUALITY_LEVELS.find(l => dqr <= l.max)?.label || '一般';
    return { dqr: dqr.toFixed(2), level, count: calcs.length };
  },

  runCalculation(taskId) {
    return this.update(d => {
      const supps = d.supplements.filter(s => s.taskId === taskId);
      const formal = d.formalList.filter(f => f.taskId === taskId && f.status === 'confirmed');
      formal.forEach(f => {
        let calc = d.calculations.find(c => c.formalId === f.id);
        const s = supps.find(x => x.customerId === f.customerId) || {};
        const method = Store.matchMethod(s);
        const entityEmission = Store.calcEntityEmission(s) || (f.bizType === 'project' ? 10000 : 500000);
        const avgBalance = s.avgLoanBalance || d.candidates.find(c => c.id === f.customerId)?.avgMonthlyBalance * 12 || 5000;
        const payload = {
          taskId, formalId: f.id, customerName: f.customerName,
          bizType: f.bizType, method: method.name, methodId: method.id,
          entityEmission, avgBalance,
          totalAssets: s.totalAssets || d.candidates.find(c => c.id === f.customerId)?.totalAssets || 50000,
          totalInvestment: s.totalInvestment || 50000,
          industryFactor: s.economyFactor || 2.46,
          qualityGrade: method.qualityGrade,
          status: 'done', approvalStatus: 'none'
        };
        payload.attributedEmission = Store.calcAttributedEmission(payload, s);
        payload.totalEmission = payload.entityEmission;
        const ql = ['', '一级(优)', '二级', '三级', '四级', '五级(兜底)'];
        payload.quality = ql[payload.qualityGrade] || '-';
        payload.calculatedAt = new Date().toLocaleString('zh-CN');
        if (!calc) {
          calc = { id: 'CAL' + f.id, ...payload };
          d.calculations.push(calc);
        } else Object.assign(calc, payload);
      });
      const t = d.tasks.find(x => x.id === taskId);
      if (t) {
        t.workflowStep = WORKFLOW_STEP.CALCULATION;
        t.progress = Math.min(90, Math.max(t.progress || 0, 70));
        t.dqr = Store.calcDQR(taskId);
        if (t.milestone) t.milestone.calculationDone = true;
      }
    });
  },

  submitApproval(docType, docId, docName, taskId, reviewLevel) {
    return this.update(d => {
      d.approvals = d.approvals || [];
      const tid = taskId || d.currentTaskId;
      d.approvals.unshift({
        id: 'APR' + Date.now() + Math.floor(Math.random() * 10000),
        taskId: tid,
        docType, docId, docName,
        reviewLevel: reviewLevel || null,
        submitter: d.currentUser, submitTime: new Date().toLocaleString('zh-CN'),
        status: 'pending'
      });
      const map = { formal: 'formalList', supplement: 'supplements', calculation: 'calculations', task: 'tasks' };
      const key = map[docType];
      if (key === 'tasks') {
        const t = d.tasks.find(x => x.id === docId);
        if (t) t.approvalStatus = 'pending';
      } else if (key && d[key]) {
        const item = d[key].find(x => x.id === docId);
        if (item) item.approvalStatus = 'pending';
      }
    });
  },

  _createSupplementApproval(d, s, task, level, round) {
    const r = round ?? s.reviewRound ?? 1;
    if (d.approvals.some(a => a.docId === s.id && a.reviewLevel === level && a.status === 'pending')) return;
    d.approvals.unshift({
      id: 'APR' + Date.now() + Math.floor(Math.random() * 10000),
      taskId: s.taskId,
      docType: 'supplement',
      docId: s.id,
      docName: '数据采集-' + s.customerName,
      reviewLevel: level,
      round: r,
      submitter: s.manager || d.currentUser,
      submitTime: new Date().toLocaleString('zh-CN'),
      status: 'pending'
    });
  },

  _createSubmitApproval(d, s, round) {
    d.approvals = d.approvals || [];
    d.approvals.unshift({
      id: 'APR' + Date.now() + Math.floor(Math.random() * 10000),
      taskId: s.taskId,
      docType: 'supplement',
      docId: s.id,
      docName: '数据采集-' + s.customerName,
      reviewLevel: 'submit',
      round,
      submitter: s.manager || d.currentUser,
      submitTime: new Date().toLocaleString('zh-CN'),
      status: 'approved',
      approver: s.manager || d.currentUser,
      approveTime: new Date().toLocaleString('zh-CN')
    });
  },

  _voidSupplementApprovedApprovals(d, supplementId) {
    (d.approvals || []).filter(a =>
      a.docType === 'supplement' && a.docId === supplementId &&
      ['branch', 'hq'].includes(a.reviewLevel) && a.status === 'approved'
    ).forEach(a => { a.status = 'voided'; });
  },

  submitSupplementForReview(supplementId) {
    let submitted = false;
    this.update(d => {
      const s = d.supplements.find(x => x.id === supplementId);
      if (!s || !canSubmitSupplementForReview(s)) return;
      if (d.approvals.some(a => a.docType === 'supplement' && a.docId === s.id && a.status === 'pending')) return;
      const task = d.tasks.find(t => t.id === s.taskId) || {};
      const round = (s.reviewRound || 0) + 1;
      s.reviewRound = round;
      s.approvalStatus = 'pending';
      s.auditStage = 'branch_review';
      s.branchReviewStatus = 'pending';
      s.hqReviewStatus = 'none';
      delete s.rejectReason;
      this._createSubmitApproval(d, s, round);
      this._createSupplementApproval(d, s, task, 'branch', round);
      this.syncTaskWorkflow(d, s.taskId);
      submitted = true;
    });
    return submitted;
  },

  submitCutoffToHq(taskId) {
    let count = 0;
    this.update(d => {
      const task = d.tasks.find(t => t.id === taskId);
      if (!task || task.initiatorOrg !== 'hq') return;
      d.supplements.filter(s =>
        s.taskId === taskId && s.status === 'completed' && s.auditStage !== 'approved'
      ).forEach(s => {
        if (s.branchReviewStatus === 'pending') return;
        if (s.auditStage === 'hq_review' || s.hqReviewStatus === 'pending') return;
        if (s.branchReviewStatus === 'approved') {
          s.auditStage = 'hq_review';
          s.hqReviewStatus = 'pending';
          this._createSupplementApproval(d, s, task, 'hq');
          count++;
        } else {
          s.approvalStatus = 'pending';
          s.auditStage = 'branch_review';
          s.branchReviewStatus = 'pending';
          s.hqReviewStatus = 'none';
          this._createSupplementApproval(d, s, task, 'branch');
          count++;
        }
      });
      task.cutoffSubmittedAt = new Date().toLocaleString('zh-CN');
      this.syncTaskWorkflow(d, taskId);
    });
    return count;
  },

  _getIndustryFactor(d, industryMajor, gbCode) {
    const factors = d.factors || [];
    if (gbCode) {
      const exact = factors.find(x =>
        x.methodId === 'economy' && x.gbCode === gbCode && x.valueType === 'default' && x.value != null
      );
      if (exact) return Number(exact.value);
    }
    const industryFactors = factors.filter(x =>
      x.methodId === 'economy' && x.industryMajor === industryMajor && x.valueType === 'default' && x.value != null
    );
    if (industryFactors.length) {
      const preferred = industryFactors.find(x => x.gbCode === 'C3120') && industryMajor === '钢铁'
        ? industryFactors.find(x => x.gbCode === 'C3120')
        : industryFactors[0];
      return Number(preferred.value);
    }
    return 2.35;
  },

  getFactor(id) {
    return (this.get().factors || []).find(x => x.id === id);
  },

  _factorDuplicateKey(f) {
    if (f.methodId === 'energy') {
      return [f.industryMajor, f.methodId, f.energyCategory, f.itemName, f.subIndustry || ''].join('|');
    }
    if (f.methodId === 'product') {
      return [f.industryMajor, f.methodId, f.productMajor, f.productSub].join('|');
    }
    return [f.methodId, f.gbCode].join('|');
  },

  addFactor(payload, options) {
    let added = null;
    this.update(d => {
      d.factors = d.factors || [];
      const item = {
        ...payload,
        id: payload.id || nextCustomFactorId(d.factors),
        isBuiltin: false,
        status: 'active',
        sourceSheet: payload.sourceSheet || '自定义'
      };
      if (!(options && options.allowDuplicate)) {
        const dup = d.factors.some(x => !x.isBuiltin && this._factorDuplicateKey(x) === this._factorDuplicateKey(item));
        if (dup) return;
      }
      d.factors.unshift(item);
      added = item;
    });
    return added;
  },

  updateFactor(id, payload) {
    let ok = false;
    this.update(d => {
      const idx = (d.factors || []).findIndex(x => x.id === id);
      if (idx < 0) return;
      if (d.factors[idx].isBuiltin) return;
      d.factors[idx] = { ...d.factors[idx], ...payload, id, isBuiltin: false };
      ok = true;
    });
    return ok;
  },

  deleteFactor(id) {
    let ok = false;
    this.update(d => {
      const f = (d.factors || []).find(x => x.id === id);
      if (!f || f.isBuiltin) return;
      d.factors = d.factors.filter(x => x.id !== id);
      ok = true;
    });
    return ok;
  },

  copyFactorAsCustom(id) {
    const src = this.getFactor(id);
    if (!src) return null;
    const copy = {
      ...src,
      id: undefined,
      isBuiltin: false,
      sourceSheet: '自定义',
      sourceNote: src.isBuiltin
        ? `由指引内置因子 ${src.id} 复制：${factorDisplayName(src)}`
        : (src.sourceNote || '')
    };
    const added = this.addFactor(copy, { allowDuplicate: true });
    return added ? added.id : null;
  },

  runEconomyDirectCalc(taskId, formalIds) {
    let count = 0;
    this.update(d => {
      formalIds.forEach(fid => {
        const f = d.formalList.find(x => x.id === fid && x.taskId === taskId);
        const mode = f?.collectMode || resolveCollectMode(f?.loanType);
        if (!f || f.status !== 'confirmed' || mode === 'mandatory') return;
        if (f.economyDirectStatus === 'done') return;
        const c = d.candidates.find(x => x.id === f.customerId);
        const revenue = Number(c?.revenue) || Number(c?.avgMonthlyBalance) * 12 || 500000;
        const totalAssets = Number(c?.totalAssets) || 800000;
        const avgBalance = Number(c?.avgMonthlyBalance) * 12 || 36000;
        const gbCode = f.gbIndustryCode || c?.gbIndustryCode;
        const factor = this._getIndustryFactor(d, f.industryMajor, gbCode);
        const entityEmission = Math.round(revenue * factor);
        const attributedEmission = f.bizType === 'project'
          ? Math.round(entityEmission * (avgBalance / (Number(f.totalInvestment) || 500000)))
          : Math.round(entityEmission * (avgBalance / totalAssets));
        f.economyDirectStatus = 'done';
        f.economyDirectAt = new Date().toLocaleString('zh-CN');
        const payload = {
          taskId, formalId: f.id, customerName: f.customerName,
          bizType: f.bizType, method: '经济活动法', methodId: 'economy',
          entityEmission, attributedEmission, totalEmission: entityEmission,
          avgBalance, totalAssets, industryFactor: factor,
          qualityGrade: 4, quality: '四级', source: 'economy_direct',
          status: 'done', approvalStatus: 'none',
          calculatedAt: new Date().toLocaleString('zh-CN')
        };
        let calc = d.calculations.find(x => x.formalId === f.id);
        if (calc) Object.assign(calc, payload);
        else d.calculations.push({ id: 'CAL' + f.id.replace(/\W/g, ''), ...payload });
        count++;
      });
      this.syncTaskWorkflow(d, taskId);
    });
    return count;
  },

  adminRejectSupplements(taskId, supplementIds, rejectReason) {
    const reason = (rejectReason || '').trim();
    if (!reason || !supplementIds?.length) return 0;
    let count = 0;
    this.update(d => {
      const task = d.tasks.find(t => t.id === taskId);
      supplementIds.forEach(sid => {
        const s = d.supplements.find(x => x.id === sid && x.taskId === taskId);
        if (!s || !canAdminRejectSupplement(s)) return;

        s.status = 'returned';
        s.auditStage = 'pending_fill';
        s.approvalStatus = 'none';
        s.branchReviewStatus = 'none';
        s.hqReviewStatus = 'none';
        s.rejectReason = reason;

        const f = d.formalList.find(x => x.id === s.formalId && x.taskId === taskId);
        if (f) delete f.dataCollectStatus;

        this._voidSupplementApprovedApprovals(d, sid);

        (d.approvals || []).filter(a => a.docType === 'supplement' && a.docId === sid).forEach(a => {
          if (a.status === 'pending') {
            a.status = 'rejected';
            a.rejectReason = reason;
            a.approver = d.currentUser;
            a.approveTime = new Date().toLocaleString('zh-CN');
          }
        });

        d.approvals.unshift({
          id: 'APR' + Date.now() + Math.floor(Math.random() * 10000),
          taskId,
          docType: 'supplement',
          docId: sid,
          docName: '数据采集-' + s.customerName,
          reviewLevel: 'admin',
          round: s.reviewRound || 1,
          submitter: d.currentUser,
          submitTime: new Date().toLocaleString('zh-CN'),
          status: 'rejected',
          rejectReason: reason,
          approver: d.currentUser,
          approveTime: new Date().toLocaleString('zh-CN')
        });
        count++;
      });

      if (task && count) {
        task.dataCollectSubmitted = false;
        delete task.dataCollectSubmittedAt;
        if (task.milestone) task.milestone.supplementApproved = false;
      }
      if (count) this.syncTaskWorkflow(d, taskId);
    });
    return count;
  },

  resolveApproval(approvalId, approved, rejectReason) {
    return this.update(d => {
      const a = (d.approvals || []).find(x => x.id === approvalId);
      if (!a || a.status !== 'pending') return;
      if (!approved && !(rejectReason || '').trim()) return;
      if (!a.taskId) a.taskId = this._inferApprovalTaskId(d, a);
      a.status = approved ? 'approved' : 'rejected';
      a.approver = d.currentUser;
      a.approveTime = new Date().toLocaleString('zh-CN');
      if (!approved) a.rejectReason = (rejectReason || '').trim();
      this._applyDocApproval(d, a, approved, rejectReason);
      if (a.taskId) {
        if (approved) this.syncTaskWorkflowAfterApprovals(d, a.taskId);
        else this.syncTaskWorkflow(d, a.taskId);
      }
    });
  },

  _inferApprovalTaskId(d, approval) {
    if (approval.taskId) return approval.taskId;
    const map = { formal: 'formalList', supplement: 'supplements', calculation: 'calculations' };
    const key = map[approval.docType];
    if (key && d[key]) {
      const item = d[key].find(x => x.id === approval.docId);
      if (item?.taskId) return item.taskId;
    }
    if (approval.docType === 'task') return approval.docId;
    return d.currentTaskId;
  },

  _applyDocApproval(d, approval, approved, rejectReason) {
    const map = { formal: 'formalList', supplement: 'supplements', calculation: 'calculations', task: 'tasks' };
    const key = map[approval.docType];
    if (key === 'tasks') {
      const t = d.tasks.find(x => x.id === approval.docId);
      if (t) t.approvalStatus = approved ? 'approved' : 'none';
      return;
    }
    if (!key || !d[key]) return;
    const item = d[key].find(x => x.id === approval.docId);
    if (!item) return;

    if (approval.docType === 'supplement') {
      const task = d.tasks.find(t => t.id === approval.taskId);
      if (!approved) {
        item.approvalStatus = 'none';
        item.auditStage = 'pending_fill';
        item.status = 'returned';
        item.rejectReason = (rejectReason || '').trim();
        if (approval.reviewLevel === 'branch') item.branchReviewStatus = 'rejected';
        if (approval.reviewLevel === 'hq') item.hqReviewStatus = 'rejected';
        return;
      }
      if (approval.reviewLevel === 'branch') {
        item.branchReviewStatus = 'approved';
        if (task?.initiatorOrg === 'branch') {
          item.auditStage = 'approved';
          item.approvalStatus = 'approved';
        } else {
          item.auditStage = 'hq_review';
          item.hqReviewStatus = 'pending';
          this._createSupplementApproval(d, item, task, 'hq', approval.round || item.reviewRound);
        }
      } else if (approval.reviewLevel === 'hq') {
        item.hqReviewStatus = 'approved';
        item.auditStage = 'approved';
        item.approvalStatus = 'approved';
      }
      return;
    }

    if (approved) {
      item.approvalStatus = 'approved';
      return;
    }
    item.approvalStatus = 'none';
  },

  syncTaskWorkflow(d, taskId) {
    const t = d.tasks.find(x => x.id === taskId);
    if (!t) return;
    const formal = d.formalList.filter(f => f.taskId === taskId);
    const supps = d.supplements.filter(s => s.taskId === taskId && s.dispatchedAt);
    t.formalCount = formal.length;
    t.supplementTotal = supps.length;
    t.supplementDone = supps.filter(s => s.status === 'completed').length;

    const hasConfirmed = formal.some(f => f.status === 'confirmed');
    if (hasConfirmed) {
      t.workflowStep = Math.max(t.workflowStep ?? 0, WORKFLOW_STEP.DATA_COLLECTION);
      t.progress = Math.max(t.progress || 0, 35);
      if (t.milestone) t.milestone.formalLocked = true;
    }

    if (supps.length) {
      t.workflowStep = Math.max(t.workflowStep ?? 0, WORKFLOW_STEP.DATA_COLLECTION);
      t.progress = Math.max(t.progress || 0, 40);
      if (t.milestone) t.milestone.supplementDispatched = true;
    }

    const allReady = this.isDataCollectionComplete(taskId);

    if (allReady) {
      t.workflowStep = WORKFLOW_STEP.CALCULATION;
      t.progress = Math.max(t.progress || 0, 65);
      if (t.milestone) t.milestone.supplementApproved = true;
    } else if (t.workflowStep >= WORKFLOW_STEP.CALCULATION) {
      t.workflowStep = WORKFLOW_STEP.DATA_COLLECTION;
    }

    const calcs = d.calculations.filter(c => c.taskId === taskId);
    if (allReady && calcs.length && calcs.every(c => c.status === 'done')) {
      t.workflowStep = Math.max(t.workflowStep ?? 0, WORKFLOW_STEP.CALCULATION);
      t.progress = Math.max(t.progress || 0, 80);
      if (t.milestone) t.milestone.calculationDone = true;
    }
  },

  syncTaskWorkflowAfterApprovals(d, taskId) {
    this.syncTaskWorkflow(d, taskId);
  },

  getApprovalDocDetail(approval) {
    const d = this.get();
    if (!approval) return null;
    if (approval.docType === 'formal') {
      const f = d.formalList.find(x => x.id === approval.docId);
      if (!f) return { title: approval.docName, rows: [['说明', '关联正式清单记录未找到（演示数据）']] };
      return {
        title: approval.docName,
        link: '#/data-collect',
        linkLabel: '查看数据采集',
        rows: [
          ['客户', f.customerName],
          ['业务类型', f.bizType === 'project' ? '项目投融资' : '非项目'],
          ['核算对象', f.objectType],
          ['边界', f.boundary],
          ['周期', f.period],
          ['清单状态', f.status === 'confirmed' ? '已锁定' : '草稿'],
          ['审批状态', f.approvalStatus === 'approved' ? '已通过' : f.approvalStatus === 'pending' ? '待审核' : '未提交']
        ]
      };
    }
    if (approval.docType === 'supplement') {
      const s = d.supplements.find(x => x.id === approval.docId);
      if (!s) return { title: approval.docName, rows: [['说明', '关联数据采集任务未找到']] };
      return {
        title: approval.docName,
        link: '#/supplement-fill?id=' + s.id,
        linkLabel: '打开补录填报',
        rows: [
          ['客户', s.customerName],
          ['客户经理', s.manager],
          ['所属分行', s.branch],
          ['填报进度', `${s.fieldsDone}/${s.fieldsTotal}`],
          ['审核环节', auditStageLabel(s, null)],
          ['分行初审', s.branchReviewStatus || '—'],
          ['总行终审', s.hqReviewStatus || '—'],
          ['核算方法', s.method || '待选择'],
          ['任务状态', s.status]
        ]
      };
    }
    if (approval.docType === 'calculation') {
      const c = d.calculations.find(x => x.id === approval.docId);
      if (!c) return { title: approval.docName, rows: [['说明', '关联计算记录未找到']] };
      return {
        title: approval.docName,
        link: '#/calculation',
        linkLabel: '查看排放计算',
        rows: [
          ['客户', c.customerName],
          ['核算方法', c.method || '-'],
          ['主体排放', formatNum(c.entityEmission)],
          ['归因排放', formatNum(c.attributedEmission)],
          ['质量等级', c.qualityGrade || '-']
        ]
      };
    }
    if (approval.docType === 'task') {
      const t = d.tasks.find(x => x.id === approval.docId);
      if (!t) return { title: approval.docName, rows: [['说明', '关联任务未找到']] };
      return {
        title: approval.docName,
        link: '#/task-view?id=' + t.id,
        linkLabel: '查看核算任务',
        rows: [
          ['任务名称', t.name],
          ['核算年度', t.year],
          ['行业范围', t.industryScope],
          ['截止日期', t.deadline],
          ['当前进度', WORKFLOW_STEP_NAMES[Math.min(t.workflowStep ?? 0, WORKFLOW_STEP_NAMES.length - 1)] || '-']
        ]
      };
    }
    return { title: approval.docName, rows: [['单据类型', approvalDocTypeLabel(approval.docType)]] };
  },

  saveSupplement(id, payload) {
    return this.update(d => {
      const s = d.supplements.find(x => x.id === id);
      if (!s) return;
      Object.assign(s, payload);
      const method = Store.matchMethod(s);
      s.method = method.name;
      s.methodId = method.id;
      s.qualityGrade = method.qualityGrade;
      if (payload.complete) s.status = 'completed';
      else if (s.status === 'returned' || s.status === 'pending') s.status = 'in_progress';
      else if (s.status !== 'returned') s.status = 'in_progress';
    });
  },

  addTask(task) {
    return this.update(d => {
      d.tasks.unshift({
        ...task,
        workflowStep: task.workflowStep ?? WORKFLOW_STEP.CANDIDATES,
        progress: task.progress ?? 10
      });
      d.currentTaskId = task.id;
    });
  },

  updateTask(id, payload) {
    return this.update(d => {
      const t = d.tasks.find(x => x.id === id);
      if (t) Object.assign(t, payload);
    });
  },

  deleteTask(id) {
    return this.update(d => {
      d.tasks = d.tasks.filter(t => t.id !== id);
      d.candidates = d.candidates.filter(c => c.taskId !== id);
      d.formalList = d.formalList.filter(f => f.taskId !== id);
      d.supplements = d.supplements.filter(s => s.taskId !== id);
      d.calculations = d.calculations.filter(c => c.taskId !== id);
      d.reports = (d.reports || []).filter(r => r.taskId !== id);
      d.approvals = (d.approvals || []).filter(a => a.taskId !== id);
      if (d.currentTaskId === id) d.currentTaskId = d.tasks[0]?.id || null;
    });
  },

  confirmFormal(taskId) {
    const ids = this.get().formalList.filter(f => f.taskId === taskId).map(f => f.id);
    return this.confirmFormalItems(taskId, ids);
  },

  confirmFormalItems(taskId, formalIds) {
    if (!formalIds?.length) return;
    return this.update(d => {
      const formal = d.formalList.filter(f => f.taskId === taskId && formalIds.includes(f.id));
      let locked = 0;
      formal.forEach(f => {
        if (f.status === 'confirmed') return;
        f.status = 'confirmed';
        f.lockedAt = new Date().toISOString().slice(0, 10);
        locked++;
      });
      if (locked > 0) {
        const t = d.tasks.find(x => x.id === taskId);
        if (t) {
          if (!t.milestone) t.milestone = {};
          t.milestone.formalLocked = true;
          t.workflowStep = Math.max(t.workflowStep ?? 0, WORKFLOW_STEP.DATA_COLLECTION);
          t.progress = Math.max(t.progress || 0, 35);
        }
      }
      this.syncTaskWorkflow(d, taskId);
    });
  },

  dispatchSupplements(taskId, formalIds) {
    if (!formalIds?.length) return 0;
    let count = 0;
    this.update(d => {
      formalIds.forEach(fid => {
        const f = d.formalList.find(x => x.id === fid && x.taskId === taskId);
        if (!f || f.status !== 'confirmed') return;
        if (d.supplements.some(s => s.formalId === fid)) return;
        d.supplements.push({
          id: 'S' + Date.now() + Math.floor(Math.random() * 10000),
          taskId, formalId: f.id, customerId: f.customerId, customerName: f.customerName,
          loanType: f.loanType, bizType: f.bizType, industryMajor: f.industryMajor,
          branch: d.candidates.find(c => c.id === f.customerId)?.branch || '北京分行',
          manager: d.candidates.find(c => c.id === f.customerId)?.manager || '王磊',
          status: 'pending', method: '待选择', fieldsTotal: 12, fieldsDone: 0,
          deadline: d.tasks.find(t => t.id === taskId)?.deadline || '2025-09-30',
          approvalStatus: 'none',
          branchReviewStatus: 'none',
          hqReviewStatus: 'none',
          auditStage: 'pending_fill',
          reviewRound: 0,
          dispatchedAt: new Date().toLocaleString('zh-CN'),
          dispatchedBy: d.currentUser
        });
        count++;
      });
      this.syncTaskWorkflow(d, taskId);
    });
    return count;
  },

  generateReport(taskId, scope, template, format) {
    return this.update(d => {
      d.reports = d.reports || [];
      const calcs = d.calculations.filter(c => c.taskId === taskId && c.attributedEmission);
      const total = calcs.reduce((s, c) => s + c.attributedEmission, 0);
      d.reports.unshift({
        id: 'RPT' + Date.now(),
        taskId,
        name: `${d.tasks.find(t => t.id === taskId)?.year || ''}年度导出-${scope}`,
        scope, template, format,
        status: 'success',
        generatedAt: new Date().toLocaleString('zh-CN'),
        generatedBy: d.currentUser,
        recordCount: calcs.length,
        totalEmission: total,
        fileSize: (1.2 + Math.random()).toFixed(1) + ' MB'
      });
      const t = d.tasks.find(x => x.id === taskId);
      if (t?.milestone) t.milestone.reportGenerated = true;
      if (t) t.workflowStep = WORKFLOW_STEP.REPORT;
    });
  },

  confirmCalculationResults(taskId) {
    const formal = this.getFormalList(taskId).filter(f => f.status === 'confirmed');
    if (!formal.length) {
      return { ok: false, message: '暂无已锁定的正式清单记录' };
    }
    if (!this.isDataCollectionComplete(taskId)) {
      return { ok: false, message: '请先完成数据采集并提交' };
    }
    this.update(d => {
      const t = d.tasks.find(x => x.id === taskId);
      if (t) {
        t.resultsConfirmed = true;
        t.resultsConfirmedAt = new Date().toLocaleString('zh-CN');
        t.workflowStep = WORKFLOW_STEP.REPORT;
        t.progress = Math.max(t.progress || 0, 85);
        if (t.milestone) {
          t.milestone.calculationDone = true;
          t.milestone.resultsConfirmed = true;
        }
      }
    });
    return { ok: true };
  }
};

Store.init();
if (typeof window !== 'undefined') window.Store = Store;
