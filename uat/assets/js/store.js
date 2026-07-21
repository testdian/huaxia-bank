/** localStorage 数据层 + 指引口径计算 */
const Store = {
  KEY: 'hxb_carbon_demo_v19',
  LEGACY_STORAGE_KEYS: [
    'hxb_carbon_demo_v18', 'hxb_carbon_demo_v17', 'hxb_carbon_demo_v16',
    'hxb_carbon_demo_v15', 'hxb_carbon_demo_v14', 'hxb_carbon_demo_v13',
    'hxb_carbon_demo_v12', 'hxb_carbon_demo_v11', 'hxb_carbon_demo_v10'
  ],
  INTERFACES_KEY: 'hxb_carbon_interfaces_v1',
  _cache: null,
  _initDone: false,
  _economyFactorLookup: null,

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

  /** 按当前规则刷新候选/正式清单上的核算类型（兼容旧 localStorage，清除 project_pending） */
  _refreshAccountingTypes() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof resolveAccountingType !== 'function') return;
    try {
      const d = JSON.parse(raw);
      let changed = false;
      const supplementCompleted = (formalId, groupId) => (d.supplements || []).some(s =>
        s.status === 'completed' && (s.formalId === formalId || (groupId && s.collectGroupId === groupId))
      );
      (d.candidates || []).forEach(c => {
        if (c.accountingType === 'project_pending') {
          c.accountingType = null;
          changed = true;
        }
        const relatedFormal = (d.formalList || []).find(f => f.customerId === c.id);
        const collectDone = relatedFormal && supplementCompleted(relatedFormal.id, relatedFormal.collectGroupId);
        if (candidateIsProjectType(c) && !collectDone
          && (c.accountingType === 'project_as_project' || c.accountingType === 'project_as_non_project')) {
          c.accountingType = null;
          changed = true;
          return;
        }
        const next = resolveAccountingType(c);
        if (next && c.accountingType !== next) {
          c.accountingType = next;
          changed = true;
        }
      });
      (d.formalList || []).forEach(f => {
        if (f.accountingType === 'project_pending') {
          f.accountingType = null;
          changed = true;
        }
        const collectDone = supplementCompleted(f.id, f.collectGroupId);
        if (candidateIsProjectType(f) && !collectDone
          && (f.accountingType === 'project_as_project' || f.accountingType === 'project_as_non_project')) {
          f.accountingType = null;
          changed = true;
          return;
        }
        const next = resolveAccountingType(f);
        if (next && f.accountingType !== next) {
          f.accountingType = next;
          changed = true;
        }
      });
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 进入排放计算后，将待定项目类核算类型定档为三档终态之一（仅用内存数据，避免 init 递归） */
  _finalizeFormalAccountingType(d, f, taskId) {
    if (!f || typeof finalizeAccountingType !== 'function') return;
    const cand = d.candidates.find(c => c.id === f.customerId);
    const row = {
      ...(cand || {}),
      ...f,
      projectDetails: f.projectDetails ?? cand?.projectDetails,
      projectInfoAvailable: f.projectInfoAvailable ?? cand?.projectInfoAvailable,
      projectInfo: f.projectInfo ?? cand?.projectInfo,
      loanType: f.loanType ?? cand?.loanType,
      productType: f.productType ?? cand?.productType,
      bizType: f.bizType ?? cand?.bizType
    };
    const sup = (d.supplements || []).find(s =>
      s.formalId === f.id || (f.collectGroupId && s.collectGroupId === f.collectGroupId)
    );
    const task = d.tasks.find(t => t.id === taskId);
    const inCalculation = task && typeof WORKFLOW_STEP !== 'undefined'
      && task.workflowStep >= WORKFLOW_STEP.CALCULATION;
    if (typeof candidateIsProjectType === 'function' && candidateIsProjectType(row)
      && !inCalculation && sup?.status !== 'completed') {
      return;
    }
    const next = finalizeAccountingType(row);
    if (!next) return;
    if (f.accountingType !== next) f.accountingType = next;
    if (cand && cand.accountingType !== next) cand.accountingType = next;
  },

  _finalizeTaskAccountingTypes(d, taskId) {
    d.formalList.filter(f => f.taskId === taskId && f.status === 'confirmed').forEach(f => {
      this._finalizeFormalAccountingType(d, f, taskId);
    });
  },

  /** 保障演示数据存在「项目类待收集定档」样本（无 project_pending 枚举） */
  _ensureProjectPendingSamples() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (!Array.isArray(d.candidates) || !Array.isArray(d.formalList)) return;
      const hasPending = d.candidates.some(c =>
        c?.bizType === 'project' &&
        (!Array.isArray(c.projectDetails) || c.projectDetails.length === 0) &&
        c.projectInfoAvailable !== false
      );
      if (hasPending) return;

      const targetCandidates = d.candidates
        .filter(c => c?.bizType === 'project' && Array.isArray(c.projectDetails) && c.projectDetails.length > 0)
        .slice(0, 4);
      if (!targetCandidates.length) return;

      targetCandidates.forEach(c => {
        c.projectDetails = [];
        c.projectInfoAvailable = null;
        c.accountingType = null;
        const relatedFormals = d.formalList.filter(f => f.customerId === c.id);
        relatedFormals.forEach(f => {
          f.projectDetails = [];
          f.projectInfoAvailable = null;
          f.accountingType = null;
        });
      });
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  init() {
    if (this._initDone) return;
    if (this._initRunning) return;
    this._initRunning = true;
    try {
    this._ensureInterfaces();
    this._migrateLegacyStorageKey();
    this._migrateReportPdfToWord();
    if (!localStorage.getItem(this.KEY)) {
      const seed = { ...(window.MOCK_SEED || {}) };
      delete seed.interfaces;
      if (typeof CarbonAccount !== 'undefined') {
        CarbonAccount.compactStoragePayload(seed, CarbonAccount.STORAGE_TARGETS);
      }
      const initial = {
        ...seed,
        currentRole: 'hq',
        currentUser: '张明',
        currentManagerUser: '王磊',
        currentTaskId: 'T2025001',
        _carbonPersistedV3: true
      };
      this._cache = initial;
      this._persistMainStore(initial);
    }
    this._refreshAccountingTypes();
    this._ensureProjectPendingSamples();
    this._migrateFinalizedAccountingTypes();
    this._migrateCalculationEmissionSplit();
    this._ensureDataCollectDemoTask();
    this._ensureDataCollectDemoSupplements();
    this._ensureCollectGroupDemo();
    this._ensureCollectGroupsStructure();
    this._migrateTaskIndustryScopes();
    this._migrateCandidateCustomerScale();
    this._migrateCarbonAccountProvision();
    this._migrateCarbonAccountProjectDetails();
    this._migrateCarbonAccountCustomerNames();
    this._migrateCarbonAccountEntityDedupe();
    this._migrateCarbonAccountMixedLoanMetrics();
    this._migrateCarbonAccountDemoMetricsV3();
    this._migrateFactorMeta();
    this._migrateFactorSourceSheet();
    this._migrateFactorDedupe();
    this._migrateFactorVersions();
    this._migrateFactorImportHistory();
    this._migrateTaskBranchDeadline();
    this._migrateTaskFactorVersionRank();
    this._fixTaskBranchDeadlineOrder();
    this._ensureIndustryConfig();
    this._ensureMenuPermissions();
    this._ensureTasksArray();
    this._migrateSupplementApprovalSingleRow();
    this._compactOversizedCarbonStorage();
    this._initDone = true;
    } finally {
      this._initRunning = false;
    }
  },

  /** 采集审核：同一 docId 只保留当前环节一条记录（兼容旧数据重复行） */
  _normalizeSupplementApprovalsInData(d) {
    if (!Array.isArray(d.approvals) || !Array.isArray(d.supplements)) return false;
    let changed = false;
    const toRemove = new Set();
    const byDoc = new Map();
    d.approvals.forEach(a => {
      if (a.docType !== 'supplement' || ['submit', 'branch_edit', 'hq_edit'].includes(a.reviewLevel)) return;
      if (!byDoc.has(a.docId)) byDoc.set(a.docId, []);
      byDoc.get(a.docId).push(a);
    });
    byDoc.forEach((group, docId) => {
      if (group.length <= 1) return;
      const s = d.supplements.find(x => x.id === docId);
      if (!s) return;
      const task = (d.tasks || []).find(t => t.id === s.taskId);
      const active = typeof pickActiveSupplementApproval === 'function'
        ? pickActiveSupplementApproval(group, s, task)
        : group[group.length - 1];
      if (!active) return;

      if (s.auditStage === 'hq_review' && s.hqReviewStatus === 'pending'
        && active.reviewLevel === 'branch' && active.status === 'approved') {
        active.reviewLevel = 'hq';
        active.status = 'pending';
        active.approver = null;
        active.approveTime = null;
        changed = true;
      }

      group.forEach(a => {
        if (a.id === active.id) return;
        if (['branch', 'hq'].includes(a.reviewLevel) && a.status !== 'voided') {
          toRemove.add(a.id);
          changed = true;
        }
      });
    });
    if (toRemove.size) {
      d.approvals = d.approvals.filter(a => !toRemove.has(a.id));
    }
    return changed;
  },

  _migrateSupplementApprovalSingleRow() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      const changed = this._normalizeSupplementApprovalsInData(d);
      if (changed || !d._supplementApprovalSingleRowV1) {
        d._supplementApprovalSingleRowV1 = true;
        localStorage.setItem(this.KEY, JSON.stringify(d));
      }
      if (this._cache) this._normalizeSupplementApprovalsInData(this._cache);
    } catch { /* ignore */ }
  },

  /** 从旧版 hxb_carbon_demo_v* 迁移；先删旧 key 释放配额，再写入 v19 */
  _migrateLegacyStorageKey() {
    if (localStorage.getItem(this.KEY)) return;
    for (const oldKey of (this.LEGACY_STORAGE_KEYS || [])) {
      const raw = localStorage.getItem(oldKey);
      if (!raw) continue;
      try { localStorage.removeItem(oldKey); } catch { /* ignore */ }
      if (raw.length > 2.5 * 1024 * 1024) continue;
      try {
        const d = JSON.parse(raw);
        if (typeof CarbonAccount !== 'undefined') {
          CarbonAccount.compactStoragePayload(d, CarbonAccount.STORAGE_EMERGENCY);
        } else {
          d.carbonAccounts = (d.carbonAccounts || []).slice(0, 30);
          d.carbonAccountRecords = (d.carbonAccountRecords || []).slice(0, 80);
        }
        d._carbonPersistedV3 = false;
        delete d._carbonPersistedV2;
        d._storageMigratedV19 = true;
        this._cache = d;
        this._persistMainStore(d);
        return;
      } catch { /* 写入失败则走全新种子 */ }
    }
  },

  /** 排放因子库：同一因子组只保留一条记录（优先自定义） */
  _migrateFactorDedupe() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof factorGroupKey !== 'function' || typeof pickFactorRecord !== 'function') return;
    try {
      const d = JSON.parse(raw);
      if (d._factorDedupeMigrated) return;
      const map = new Map();
      (d.factors || []).forEach(f => {
        const gk = factorGroupKey(f);
        if (!map.has(gk)) map.set(gk, []);
        map.get(gk).push(f);
      });
      const kept = [];
      map.forEach(candidates => {
        const picked = pickFactorRecord(candidates);
        if (picked) kept.push(picked);
      });
      d.factors = kept;
      d._factorDedupeMigrated = true;
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 排放因子导入历史：演示种子 */
  _migrateFactorImportHistory() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d._factorImportHistoryMigrated) return;
      if (!Array.isArray(d.factorImportHistory)) d.factorImportHistory = [];
      if (!d.factorImportHistory.length) {
        d.factorImportHistory = [
          {
            id: 'FI-DEMO-1',
            fileName: '自定义因子批量导入.csv',
            total: 12,
            imported: 12,
            errorCount: 0,
            status: 'success',
            operator: d.currentUser || '张明',
            importTime: '2026-04-18 10:15:22'
          },
          {
            id: 'FI-DEMO-2',
            fileName: '产品法因子补充.csv',
            total: 5,
            imported: 3,
            errorCount: 2,
            status: 'partial',
            operator: d.currentUser || '张明',
            importTime: '2026-04-20 16:29:37',
            errorReport: '第 4 行：产品法须填写主要产品与产品细分\n第 5 行：来源说明不能为空'
          }
        ];
      }
      d._factorImportHistoryMigrated = true;
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** @deprecated 保留空实现，兼容旧 localStorage 标记 */
  _migrateFactorVersionHistory() {},

  /** 排放因子库：补全适用年度，同组同年度去重，演示多版本样本 */
  _migrateFactorVersions() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof factorGroupKey !== 'function' || typeof normalizeFactorVersionYear !== 'function') return;
    try {
      const d = JSON.parse(raw);
      if (d._factorVersionsMigrated) return;
      let changed = false;
      (d.factors || []).forEach(f => {
        const prev = f.versionYear;
        f.versionYear = normalizeFactorVersionYear(f);
        if (prev !== f.versionYear) changed = true;
      });
      const map = new Map();
      (d.factors || []).forEach(f => {
        const key = `${factorGroupKey(f)}\u001e${normalizeFactorVersionYear(f)}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(f);
      });
      const kept = [];
      map.forEach(candidates => {
        const picked = typeof pickFactorRecord === 'function' ? pickFactorRecord(candidates) : candidates[0];
        if (picked) kept.push(picked);
      });
      if (kept.length !== (d.factors || []).length) {
        d.factors = kept;
        changed = true;
      }
      const cf2026 = (d.factors || []).find(f => f.id === 'CF001');
      const hasCf2027 = (d.factors || []).some(f =>
        f.id !== 'CF001'
        && typeof factorGroupKey === 'function'
        && cf2026
        && factorGroupKey(f) === factorGroupKey(cf2026)
        && normalizeFactorVersionYear(f) === 2027
      );
      if (cf2026 && !hasCf2027) {
        d.factors.unshift({
          ...cf2026,
          id: 'CF001-2027',
          versionYear: 2027,
          value: 2.71,
          sourceNote: '2027年度更新版（演示）',
          updatedAt: '2026-07-01 10:00:00'
        });
        changed = true;
      }
      d._factorVersionsMigrated = true;
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 排放因子库：补全口径标签 */
  _migrateFactorMeta() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d._factorMetaMigrated) return;
      let changed = false;
      (d.factors || []).forEach(f => {
        if (!f.caliberTag) {
          f.caliberTag = f.isBuiltin ? 'pbo' : 'bank';
          changed = true;
        }
      });
      d._factorMetaMigrated = true;
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 排放因子库：Excel tab 连写表号（2-1CC）规范为人行附2表号（2-1C） */
  _migrateFactorSourceSheet() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof normalizeFactorSourceSheet !== 'function') return;
    try {
      const d = JSON.parse(raw);
      if (d._factorSourceSheetMigrated) return;
      let changed = false;
      (d.factors || []).forEach(f => {
        if (!f.sourceSheet) return;
        const norm = normalizeFactorSourceSheet(f.sourceSheet);
        if (norm !== f.sourceSheet) {
          if (f.id && f.id.startsWith('EF-' + f.sourceSheet + '-')) {
            f.id = 'EF-' + norm + f.id.slice(('EF-' + f.sourceSheet).length);
          }
          f.sourceSheet = norm;
          changed = true;
        }
      });
      d._factorSourceSheetMigrated = true;
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 任务：行业范围值迁移、补全分行审批截止日期 */
  _migrateTaskBranchDeadline() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d._taskBranchDeadlineMigrated) return;
      let changed = false;
      (d.tasks || []).forEach(t => {
        if (t.subjectIndustryScope === '八大+扩展') {
          t.subjectIndustryScope = '八大高碳+重点行业';
          changed = true;
        }
        if (t.investIndustryScope === '八大+扩展') {
          t.investIndustryScope = '八大高碳+重点行业';
          changed = true;
        }
        if (t.industryScope === '八大+扩展') {
          t.industryScope = '八大高碳+重点行业';
          changed = true;
        }
        if (!t.branchDeadline && t.deadline) {
          t.branchDeadline = typeof addCalendarDays === 'function'
            ? addCalendarDays(t.deadline, 15)
            : t.deadline;
          changed = true;
        } else if (t.branchDeadline && t.deadline && t.deadline >= t.branchDeadline) {
          t.branchDeadline = typeof addCalendarDays === 'function'
            ? addCalendarDays(t.deadline, 15)
            : t.branchDeadline;
          changed = true;
        }
      });
      d._taskBranchDeadlineMigrated = true;
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 任务：补全因子版本（默认取因子库最新版本序号） */
  _migrateTaskFactorVersionRank() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d._taskFactorVersionRankMigrated) return;
      let changed = false;
      const defaultRank = typeof resolveTaskFactorVersionRank === 'function'
        ? resolveTaskFactorVersionRank()
        : 1;
      (d.tasks || []).forEach(t => {
        if (t.factorVersionRank == null || t.factorVersionRank === '') {
          t.factorVersionRank = defaultRank;
          changed = true;
        }
      });
      d._taskFactorVersionRankMigrated = true;
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 修正数据采集截止不早于分行审批截止的历史任务 */
  _fixTaskBranchDeadlineOrder() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      if (d._taskBranchDeadlineOrderFixed) return;
      let changed = false;
      (d.tasks || []).forEach(t => {
        if (!t.deadline) return;
        if (!t.branchDeadline || t.deadline >= t.branchDeadline) {
          t.branchDeadline = typeof addCalendarDays === 'function'
            ? addCalendarDays(t.deadline, 15)
            : t.deadline;
          changed = true;
        }
      });
      d._taskBranchDeadlineOrderFixed = true;
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 已进入排放计算的任务：核算类型定档为三档终态 */
  _migrateFinalizedAccountingTypes() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof finalizeAccountingType !== 'function') return;
    try {
      const d = JSON.parse(raw);
      if (d._accountingTypeFinalizedMigrated) return;
      let changed = false;
      const calcTaskIds = new Set((d.calculations || []).map(c => c.taskId).filter(Boolean));
      (d.tasks || []).forEach(t => {
        const inCalc = calcTaskIds.has(t.id)
          || (t.workflowStep != null && t.workflowStep >= (WORKFLOW_STEP?.CALCULATION ?? 4))
          || t.milestone?.calculationDone
          || t.dataCollectSubmitted;
        if (!inCalc) return;
        d.formalList.filter(f => f.taskId === t.id && f.status === 'confirmed').forEach(f => {
          const before = f.accountingType;
          this._finalizeFormalAccountingType(d, f, t.id);
          if (f.accountingType !== before) changed = true;
        });
      });
      d._accountingTypeFinalizedMigrated = true;
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 计算记录拆分法人主体排放 / 项目主体排放（兼容旧数据） */
  _migrateCalculationEmissionSplit() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof applyCalculationEmissionSplit !== 'function') return;
    try {
      const d = JSON.parse(raw);
      let changed = false;
      (d.calculations || []).forEach(calc => {
        if (calc.entityEmission == null) return;
        const f = (d.formalList || []).find(x => x.id === calc.formalId && x.taskId === calc.taskId);
        if (!f) return;
        const before = `${calc.legalEntityEmission}|${calc.projectEntityEmission}`;
        applyCalculationEmissionSplit(calc, f, calc.taskId, calc.entityEmission, d);
        const after = `${calc.legalEntityEmission}|${calc.projectEntityEmission}`;
        if (before !== after) changed = true;
      });
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 补入数据采集·格澜+直算演示任务（兼容已有 localStorage） */
  _ensureDataCollectDemoTask() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof DemoSeed === 'undefined' || !DemoSeed.buildDataCollectDemoSlice) return;
    try {
      const d = JSON.parse(raw);
      const slice = DemoSeed.buildDataCollectDemoSlice();
      if ((d.tasks || []).some(t => t.id === slice.task.id)) return;
      d.tasks.push(slice.task);
      d.candidates.push(...slice.candidates);
      d.formalList.push(...slice.formalList);
      if (typeof DemoSeed.buildDataCollectDemoSupplements === 'function') {
        const pack = DemoSeed.buildDataCollectDemoSupplements(slice.task.id, d.formalList);
        d.supplements = d.supplements || [];
        d.approvals = d.approvals || [];
        d.supplements.push(...pack.supplements);
        d.approvals.push(...pack.approvals);
      }
      if (typeof CarbonAccount !== 'undefined') {
        CarbonAccount.provisionFromFormalLock(d, slice.task.id, slice.formalList);
      }
      if (typeof CollectGroups !== 'undefined') {
        this._rebuildCollectGroupsInPlace(d, slice.task.id);
      }
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 为 T2026002 补全演示用手动采集与审核单据（已有 localStorage 时增量注入） */
  _ensureDataCollectDemoSupplements() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof DemoSeed === 'undefined' || !DemoSeed.buildDataCollectDemoSupplements) return;
    try {
      const d = JSON.parse(raw);
      if (d._dataCollectDemoSuppsPatched) return;
      const taskId = 'T2026002';
      if (!(d.tasks || []).some(t => t.id === taskId)) return;
      if ((d.supplements || []).some(s => s.taskId === taskId && String(s.id || '').startsWith('SDC'))) {
        d._dataCollectDemoSuppsPatched = true;
        localStorage.setItem(this.KEY, JSON.stringify(d));
        return;
      }
      const pack = DemoSeed.buildDataCollectDemoSupplements(taskId, d.formalList);
      d.supplements = d.supplements || [];
      d.approvals = d.approvals || [];
      d.supplements.push(...pack.supplements);
      d.approvals.push(...pack.approvals);
      if (typeof CollectGroups !== 'undefined') {
        this._rebuildCollectGroupsInPlace(d, taskId);
      }
      d._dataCollectDemoSuppsPatched = true;
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 注入万华化学归集示范数据（已有 localStorage 时补全） */
  _ensureCollectGroupDemo() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof DemoSeed === 'undefined' || !DemoSeed.patchCollectGroupDemo) return;
    try {
      const d = JSON.parse(raw);
      if (d._collectGroupDemoPatchedV2) return;
      const demoFormalIds = new Set(['FCG01', 'FCG02', 'FCG03', 'FCG04', 'FCG05', 'FCG06']);
      const demoCandIds = new Set(['CGC01', 'CGC02', 'CGC03', 'CGC04', 'CGC05', 'CGC06']);
      if (d._collectGroupDemoPatched) {
        d.formalList = (d.formalList || []).filter(f => !demoFormalIds.has(f.id));
        d.candidates = (d.candidates || []).filter(c => !demoCandIds.has(c.id));
        d.collectGroups = (d.collectGroups || []).filter(g =>
          !(g.memberFormalIds || []).some(fid => demoFormalIds.has(fid))
        );
      }
      const before = (d.formalList || []).length;
      DemoSeed.patchCollectGroupDemo(d.candidates, d.formalList, 'T2025001');
      if ((d.formalList || []).length === before) {
        d._collectGroupDemoPatchedV2 = true;
        localStorage.setItem(this.KEY, JSON.stringify(d));
        return;
      }
      d.collectGroups = d.collectGroups || [];
      if (typeof CarbonAccount !== 'undefined') {
        const added = d.formalList.filter(f => f.taskId === 'T2025001' && demoFormalIds.has(f.id));
        CarbonAccount.provisionFromFormalLock(d, 'T2025001', added);
      }
      if (typeof CollectGroups !== 'undefined') {
        this._rebuildCollectGroupsInPlace(d, 'T2025001');
      }
      const task = (d.tasks || []).find(t => t.id === 'T2025001');
      if (task) {
        task.formalCount = d.formalList.filter(f => f.taskId === 'T2025001').length;
        task.candidateCount = d.candidates.filter(c => c.taskId === 'T2025001').length;
      }
      d._collectGroupDemoPatched = true;
      d._collectGroupDemoPatchedV2 = true;
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 为已锁定任务补建 collectGroups */
  _ensureCollectGroupsStructure() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof CollectGroups === 'undefined') return;
    try {
      const d = JSON.parse(raw);
      let changed = false;
      d.collectGroups = d.collectGroups || [];
      (d.tasks || []).forEach(t => {
        const confirmed = (d.formalList || []).filter(f => f.taskId === t.id && f.status === 'confirmed');
        if (!confirmed.length) return;
        const hasGroups = d.collectGroups.some(g => g.taskId === t.id);
        if (hasGroups) return;
        this._rebuildCollectGroupsInPlace(d, t.id);
        changed = true;
      });
      if (changed) {
        d._collectGroupsStructureMigrated = true;
        localStorage.setItem(this.KEY, JSON.stringify(d));
      }
    } catch { /* ignore */ }
  },

  /** 补全候选/正式清单企业规模字段 */
  _migrateCandidateCustomerScale() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof candidateEnterpriseScale !== 'function') return;
    try {
      const d = JSON.parse(raw);
      let changed = false;
      const patchScale = (row) => {
        if (!row) return;
        const next = candidateEnterpriseScale(row);
        if (row.enterpriseScale !== next) {
          row.enterpriseScale = next;
          changed = true;
        }
        if (row.customerScale !== next) {
          row.customerScale = next;
          changed = true;
        }
      };
      (d.candidates || []).forEach(patchScale);
      (d.formalList || []).forEach(f => {
        const cand = (d.candidates || []).find(c => c.id === f.customerId);
        const next = candidateEnterpriseScale({ ...f, ...cand });
        if (f.enterpriseScale !== next) {
          f.enterpriseScale = next;
          changed = true;
        }
        if (f.customerScale !== next) {
          f.customerScale = next;
          changed = true;
        }
      });
      (d.tasks || []).forEach(t => {
        const rules = t.candidateFilterRules;
        if (rules?.customerScales?.includes('小微企业')) {
          rules.customerScales = rules.customerScales.flatMap(s =>
            s === '小微企业' ? ['小型企业', '微型企业'] : [s]
          );
          changed = true;
        }
        if (!rules || rules.customized === true) return;
        if (rules.customerScales == null) {
          t.candidateFilterRules = getDefaultCandidateFilterRules(t);
          changed = true;
        }
      });
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 兼容旧任务：将 industryScope 拆分为所属/投向行业范围 */
  _migrateTaskIndustryScopes() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof normalizeTaskIndustryFields !== 'function') return;
    try {
      const d = JSON.parse(raw);
      let changed = false;
      (d.tasks || []).forEach(t => {
        const before = JSON.stringify({
          subjectIndustryScope: t.subjectIndustryScope,
          investIndustryScope: t.investIndustryScope,
          industryScope: t.industryScope,
          dataIndustryScopeKind: t.dataIndustryScopeKind
        });
        normalizeTaskIndustryFields(t);
        if (JSON.stringify({
          subjectIndustryScope: t.subjectIndustryScope,
          investIndustryScope: t.investIndustryScope,
          industryScope: t.industryScope,
          dataIndustryScopeKind: t.dataIndustryScopeKind
        }) !== before) changed = true;
      });
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 补全项目贷款 projectDetails / loanAccount，并重建碳账户子账户数据 */
  _migrateCarbonAccountProjectDetails() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof resolveFormalProjectDetails !== 'function') return;
    try {
      const d = JSON.parse(raw);
      if (d._caProjectSubAccountsMigrated) return;
      (d.formalList || []).forEach((f, i) => {
        if (!f.loanAccount) {
          const cand = (d.candidates || []).find(c => c.id === f.customerId);
          const seed = String(f.customerId || f.id || i + 1).replace(/\D/g, '');
          f.loanAccount = cand?.loanAccount || ('622' + seed.slice(-13).padStart(13, '0'));
          if (cand && !cand.loanAccount) cand.loanAccount = f.loanAccount;
        }
        if (Array.isArray(f.projectDetails) && f.projectDetails.length) return;
        const cand = (d.candidates || []).find(c => c.id === f.customerId);
        const details = resolveFormalProjectDetails(f, cand);
        if (details.length) {
          f.projectDetails = details;
          if (!f.accountingType || f.accountingType === 'project_pending') {
            f.accountingType = 'project_as_project';
          }
          f.projectInfoAvailable = true;
        }
      });
      if (typeof CarbonAccount !== 'undefined') {
        CarbonAccount.backfillProvisionFromLockedFormals(d);
      }
      (d.carbonAccounts || []).forEach(acc => {
        const formal = (d.formalList || []).find(f => f.id === acc.formalId);
        if (!formal) return;
        const details = resolveFormalProjectDetails(formal, (d.candidates || []).find(c => c.id === formal.customerId));
        if (details.length) {
          acc.projectDetails = details;
          acc.bizType = formal.bizType || acc.bizType;
        }
      });
      d._caProjectSubAccountsMigrated = true;
      delete d._caProjectDetailsMigrated;
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 【业务规则】对象边界锁定后补建企业碳账户 */
  _migrateCarbonAccountProvision() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof CarbonAccount === 'undefined') return;
    try {
      const d = JSON.parse(raw);
      if (d._carbonProvisionMigrated) return;
      CarbonAccount.backfillProvisionFromLockedFormals(d);
      d._carbonProvisionMigrated = true;
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 企业碳账户：同一主体（统一社会信用代码）合并为一个账户，并清理演示名称后缀 */
  _migrateCarbonAccountEntityDedupe() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof CarbonAccount === 'undefined') return;
    try {
      const d = JSON.parse(raw);
      if (d._carbonEntityAccountMigratedV1) return;
      d.carbonAccounts = CarbonAccount.dedupeCarbonAccounts(
        d.carbonAccounts || [],
        d.carbonAccountRecords || []
      );
      CarbonAccount.syncCustomerNamesFromLedger(d);
      (d.candidates || []).forEach(c => {
        if (c.customerName) c.customerName = CarbonAccount._sanitizeDemoCompanyName(c.customerName);
      });
      (d.formalList || []).forEach(f => {
        if (f.customerName) f.customerName = CarbonAccount._sanitizeDemoCompanyName(f.customerName);
      });
      (d.carbonAccountRecords || []).forEach(r => {
        if (r.customerName) r.customerName = CarbonAccount._sanitizeDemoCompanyName(r.customerName);
      });
      d._carbonEntityAccountMigratedV1 = true;
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 碳账户：同一主体兼项目/非项目贷时，法人主体与项目主体排放、方法差异化 */
  _migrateCarbonAccountMixedLoanMetrics() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof DemoSeed === 'undefined' || typeof CarbonAccount === 'undefined') return;
    try {
      const d = JSON.parse(raw);
      if (d._caMixedLoanMetricsV2) return;
      if (typeof DemoSeed.patchMixedLoanCarbonDemo === 'function') {
        DemoSeed.patchMixedLoanCarbonDemo(d, 'T2025001');
      }
      (d.carbonAccounts || []).forEach(acc => CarbonAccount.reconcileMixedLoanAccount(d, acc));
      d._caMixedLoanMetricsV2 = true;
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 碳账户列表：补全项目子行客户号/方法/排放，企业行法人主体排放 */
  _migrateCarbonAccountDemoMetricsV3() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof DemoSeed === 'undefined' || typeof CarbonAccount === 'undefined') return;
    try {
      const d = JSON.parse(raw);
      if (d._caDemoMetricsV3) return;
      if (typeof DemoSeed.patchCarbonAccountDemoMetrics === 'function') {
        DemoSeed.patchCarbonAccountDemoMetrics(d);
      }
      d._caDemoMetricsV3 = true;
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 同步企业碳账户企业名称（与候选/正式清单一致，修正批量演示脏数据） */
  _migrateCarbonAccountCustomerNames() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof CarbonAccount === 'undefined') return;
    try {
      const d = JSON.parse(raw);
      if (d._carbonCustomerNameSyncedV2) return;
      CarbonAccount.syncCustomerNamesFromLedger(d);
      d._carbonCustomerNameSyncedV2 = true;
      delete d._carbonCustomerNameSyncedV1;
      localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  get() {
    this.init();
    if (this._cache) {
      this._cache.interfaces = this._getInterfacesRaw();
      return this._cache;
    }
    const raw = localStorage.getItem(this.KEY);
    if (!raw) {
      this.init();
      return this.get();
    }
    const data = JSON.parse(raw);
    data.interfaces = this._getInterfacesRaw();
    if (!data.currentManagerUser) data.currentManagerUser = '王磊';
    this._cache = data;
    return data;
  },
  set(data) {
    const rest = { ...data };
    const interfaces = rest.interfaces;
    delete rest.interfaces;
    if (interfaces) {
      this._safeSetItem(this.INTERFACES_KEY, JSON.stringify(interfaces));
    }
    this._cache = rest;
    this._economyFactorLookup = null;
    this._persistMainStore(rest);
  },

  _safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {
      if (err && err.name === 'QuotaExceededError') {
        console.warn('localStorage 配额已满:', key);
      }
      throw err;
    }
  },

  compactStoragePayload(d, level = 1) {
    if (typeof CarbonAccount === 'undefined' || !d) return d;
    const map = [
      CarbonAccount.STORAGE_TARGETS,
      CarbonAccount.STORAGE_COMPACT,
      CarbonAccount.STORAGE_EMERGENCY
    ];
    const opts = map[Math.min(level, map.length) - 1] || map[map.length - 1];
    CarbonAccount.compactStoragePayload(d, {
      maxAccounts: opts.accounts,
      maxRecords: opts.records
    });
    return d;
  },

  _persistMainStore(rest, compactLevel = 0) {
    if (compactLevel === 0 && typeof CarbonAccount !== 'undefined') {
      CarbonAccount.compactStoragePayload(rest, CarbonAccount.STORAGE_TARGETS);
    }
    let payload = JSON.stringify(rest);
    if (compactLevel === 0 && payload.length > 3 * 1024 * 1024 && typeof CarbonAccount !== 'undefined') {
      this.compactStoragePayload(rest, 1);
      payload = JSON.stringify(rest);
    }
    try {
      this._safeSetItem(this.KEY, payload);
    } catch (err) {
      if (!(err && err.name === 'QuotaExceededError') || compactLevel >= 4) {
        if (typeof toast === 'function') {
          toast('浏览器存储空间已满，请点击右上角「重置数据」后刷新页面', 'warning');
        }
        throw err;
      }
      if (compactLevel >= 3) {
        rest.carbonAccounts = [];
        rest.carbonAccountRecords = [];
      } else {
        this.compactStoragePayload(rest, compactLevel + 1);
      }
      if (compactLevel === 0 && typeof toast === 'function') {
        toast('演示数据已自动压缩以释放浏览器存储空间', 'warning');
      }
      this._persistMainStore(rest, compactLevel + 1);
    }
  },
  update(fn) { const data = this.get(); fn(data); this.set(data); return data; },
  reset() {
    localStorage.removeItem(this.KEY);
    (this.LEGACY_STORAGE_KEYS || []).forEach(k => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
    });
    this._cache = null;
    this._initDone = false;
    this._economyFactorLookup = null;
    if (typeof invalidateSpaLayout === 'function') invalidateSpaLayout();
    this.init();
    return this.get();
  },

  getCurrentTask() {
    const d = this.get();
    const tasks = Array.isArray(d.tasks) ? d.tasks : [];
    return tasks.find(t => t.id === d.currentTaskId) || tasks[0] || null;
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

  allConfirmedHaveEntityEmission(taskId, data) {
    const d = data || this.get();
    const formal = d.formalList.filter(f => f.taskId === taskId && f.status === 'confirmed');
    if (!formal.length) return false;
    return formal.every(f => this._formalHasEntityEmission(d, taskId, f));
  },

  /** 分行审批截止日：强制结束未完成手动采集，并推进至排放计算（演示 DEV 规则） */
  _applyCalculationStepDeadlinePolicyInPlace(d, taskId) {
    const t = d.tasks.find(x => x.id === taskId);
    if (!t || typeof isBranchApprovalDeadlineReached !== 'function' || !isBranchApprovalDeadlineReached(t)) {
      return false;
    }
    const nowStr = new Date().toLocaleString('zh-CN');
    let changed = false;
    (d.supplements || []).filter(s => s.taskId === taskId && s.dispatchedAt).forEach(s => {
      if (s.auditStage === 'approved') return;
      if (s.auditStage !== 'forced_end') {
        s.auditStage = 'forced_end';
        changed = true;
      }
      if (!s.forcedEnd) {
        s.forcedEnd = true;
        changed = true;
      }
      s.forcedEndAt = s.forcedEndAt || nowStr;
      (d.approvals || []).filter(a =>
        a.docType === 'supplement' && a.docId === s.id && a.status !== 'approved' && a.status !== 'voided'
      ).forEach(a => {
        if (a.status !== 'forced_end') {
          a.status = 'forced_end';
          a.approver = a.approver || '系统';
          a.approveTime = a.approveTime || nowStr;
          changed = true;
        }
      });
    });
    if (!t.calculationForcedByDeadline) {
      t.calculationForcedByDeadline = true;
      changed = true;
    }
    if ((t.workflowStep ?? 0) < WORKFLOW_STEP.CALCULATION) {
      t.workflowStep = WORKFLOW_STEP.CALCULATION;
      changed = true;
    }
    t.progress = Math.max(t.progress || 0, 65);
    if (t.milestone) t.milestone.calculationForcedByDeadline = true;
    return changed;
  },

  ensureCalculationStepDeadlinePolicy(taskId) {
    const tid = taskId || this.get().currentTaskId;
    if (!tid) return;
    const task = this.getTask(tid);
    if (!task || typeof isBranchApprovalDeadlineReached !== 'function' || !isBranchApprovalDeadlineReached(task)) {
      return;
    }
    let needSync = false;
    this.update(d => {
      if (this._applyCalculationStepDeadlinePolicyInPlace(d, tid)) needSync = true;
      this.syncTaskWorkflow(d, tid);
    });
    if (needSync) this.syncCalculationsFromDataCollect(tid);
  },

  hasMissingEntityEmission(taskId, data) {
    const d = data || this.get();
    return d.formalList
      .filter(f => f.taskId === taskId && f.status === 'confirmed')
      .some(f => !this._formalHasEntityEmission(d, taskId, f));
  },

  hasMissingSystemAccountingMethod(taskId, data) {
    const d = data || this.get();
    if (typeof resolveSystemAccountingMethodLabel !== 'function') return false;
    return d.formalList
      .filter(f => f.taskId === taskId && f.status === 'confirmed')
      .some(f => resolveSystemAccountingMethodLabel(f, taskId, d) === '—');
  },

  syncCalculationsFromDataCollect(taskId) {
    this.update(d => {
      const formals = d.formalList.filter(f => f.taskId === taskId && f.status === 'confirmed');
      formals.forEach(f => {
        const supp = this.findSupplementForFormal(d, taskId, f.id);
        const calc = d.calculations.find(c => c.formalId === f.id && c.taskId === taskId);
        const hasEmission = typeof getEffectiveEntityEmission === 'function'
          && getEffectiveEntityEmission(taskId, f.id) != null;
        const hasCollectData = !!supp?.dispatchedAt;
        if (!hasEmission && !hasCollectData && !calc) return;
        this._finalizeFormalAccountingType(d, f, taskId);
        this._upsertCalculationFromFormal(d, f, taskId);
      });
      const t = d.tasks.find(x => x.id === taskId);
      if (t) t.dqr = Store.calcDQR(taskId);
    });
  },

  applyCreditFallbackForMissingSystemMethod(taskId) {
    let count = 0;
    this.update(d => {
      d.formalList.filter(f => f.taskId === taskId && f.status === 'confirmed').forEach(f => {
        if (typeof resolveSystemAccountingMethodLabel === 'function') {
          if (resolveSystemAccountingMethodLabel(f, taskId, d) !== '—') return;
        }
        const c = d.candidates.find(x => x.id === f.customerId);
        const avgBalance = Number(c?.avgMonthlyBalance) || Number(f.avgMonthlyBalance) || 0;
        const task = d.tasks.find(x => x.id === taskId);
        const factor = this._getIndustryFactor(d, f.industryMajor, f.gbIndustryCode || c?.gbIndustryCode, task?.year);
        const entityEmission = Math.round(avgBalance * factor);
        this._upsertCalculationFromFormal(d, f, taskId, {
          entityEmission,
          attributedEmission: entityEmission,
          method: '其他计算法',
          methodId: 'economy_fallback',
          qualityGrade: 5,
          source: 'credit_fallback'
        });
        count++;
      });
      if (count > 0) this.syncTaskWorkflow(d, taskId);
    });
    return count;
  },

  getFormalEntityEmission(taskId, formalId) {
    if (typeof getEffectiveEntityEmission === 'function') {
      return getEffectiveEntityEmission(taskId, formalId);
    }
    const calc = this.getCalculations(taskId).find(c => c.formalId === formalId);
    if (calc && calc.entityEmission != null) return calc.entityEmission;
    const f = this.getFormalList(taskId).find(x => x.id === formalId);
    if (f?.gelanEntityEmission != null) return f.gelanEntityEmission;
    const s = this.get().supplements.find(x => x.formalId === formalId && x.taskId === taskId);
    if (s && (s.auditStage === 'approved' || s.status === 'completed')) {
      const e = this.calcEntityEmission(s);
      if (e != null && !Number.isNaN(Number(e))) return Number(e);
    }
    return null;
  },

  _formalHasEntityEmission(d, taskId, f) {
    if (typeof getEffectiveEntityEmission === 'function') {
      return getEffectiveEntityEmission(taskId, f.id) != null;
    }
    const calc = d.calculations.find(c => c.formalId === f.id && c.taskId === taskId);
    if (calc?.entityEmission != null) return true;
    if (f.gelanEntityEmission != null) return true;
    const s = d.supplements.find(x => x.formalId === f.id && x.taskId === taskId);
    if (s && (s.auditStage === 'approved' || s.status === 'completed')) {
      const e = this.calcEntityEmission(s);
      if (e != null && !Number.isNaN(Number(e))) return true;
    }
    return false;
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
    const s = this.findSupplementForFormal(d, taskId, f.id);
    const cand = d.candidates.find(x => x.id === f.customerId);
    let calc = d.calculations.find(x => x.formalId === f.id && x.taskId === taskId);
    const manualEmission = typeof getManualEntityEmissionValue === 'function'
      ? getManualEntityEmissionValue(taskId, f.id)
      : null;
    let method;
    if (manualEmission != null && s) {
      method = this.matchMethod(s);
    } else if (calc?.methodId) {
      method = GUIDE.METHODS.find(m => m.id === calc.methodId);
    } else {
      method = s ? this.matchMethod(s) : GUIDE.METHODS.find(m => m.id === 'economy');
    }
    let entityEmission = overrides.entityEmission;
    if (entityEmission == null && typeof getManualEntityEmissionValue === 'function') {
      entityEmission = getManualEntityEmissionValue(taskId, f.id);
    }
    if (entityEmission == null && typeof getSystemEntityEmissionValue === 'function') {
      entityEmission = getSystemEntityEmissionValue(taskId, f.id);
    }
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
      source: overrides.source || (manualEmission != null ? 'collect_submit' : (calc?.source || 'collect_submit')),
      calculatedAt: new Date().toLocaleString('zh-CN')
    };
    payload.attributedEmission = overrides.attributedEmission != null
      ? overrides.attributedEmission
      : (calc?.attributedEmission != null ? calc.attributedEmission : this.calcAttributedEmission(payload, s || {}));
    const ql = ['', '一级(优)', '二级', '三级', '四级', '五级(兜底)'];
    payload.quality = ql[payload.qualityGrade] || '-';
    if (typeof applyCalculationEmissionSplit === 'function') {
      applyCalculationEmissionSplit(payload, f, taskId, payload.entityEmission, d);
    }
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
        this._finalizeFormalAccountingType(d, f, taskId);
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
        let hasEmission = typeof getEffectiveEntityEmission === 'function'
          ? getEffectiveEntityEmission(taskId, f.id) != null
          : (calc && calc.entityEmission != null);
        if (!hasEmission) {
          const s = d.supplements.find(x => x.formalId === f.id && x.taskId === taskId);
          if (s && (s.auditStage === 'approved' || s.status === 'completed')) {
            const e = this.calcEntityEmission(s);
            hasEmission = e != null;
          }
        }
        if (hasEmission) return;
        const c = d.candidates.find(x => x.id === f.customerId);
        const avgBalance = Number(c?.avgMonthlyBalance) || Number(f.avgMonthlyBalance) || 0;
        const task = d.tasks.find(x => x.id === taskId);
        const factor = this._getIndustryFactor(d, f.industryMajor, f.gbIndustryCode || c?.gbIndustryCode, task?.year);
        const entityEmission = Math.round(avgBalance * factor);
        this._upsertCalculationFromFormal(d, f, taskId, {
          entityEmission,
          attributedEmission: entityEmission,
          method: '其他计算法',
          methodId: 'economy_fallback',
          qualityGrade: 5,
          source: 'credit_fallback'
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

  filterCandidateList(taskId, rules, data) {
    const d = data || this.get();
    let list = (d.candidates || []).filter(c => c.taskId === taskId);
    if (!list.length) return [];

    const task = d.tasks.find(t => t.id === taskId);
    if (typeof normalizeCandidateLedgerFields === 'function') {
      list = list.map(c => {
        const row = { ...c };
        normalizeCandidateLedgerFields(row, task?.year);
        return row;
      });
    }
    const r = normalizeCandidateFilterRules(rules, task);

    if (task?.subjectIndustryScope === '八大高碳行业' || (!task?.subjectIndustryScope && task?.industryScope === '八大高碳行业')) {
      list = list.filter(c => isCandidateInGuideAccountingScope(c, task));
    }
    if (r.productTypes?.length) {
      list = list.filter(c => r.productTypes.includes(candidateProductType(c)));
    }
    if (r.borrowerTypes?.length) {
      list = list.filter(c => r.borrowerTypes.includes(candidateLoanSubjectType(c)));
    }
    if (r.customerScales?.length) {
      list = list.filter(c => r.customerScales.includes(candidateEnterpriseScale(c)));
    }
    if (r.industries?.length) {
      list = list.filter(c => {
        const ic = candidateInvestIndustryCode(c);
        return r.industries.some(sel => industryFilterCodesMatch(sel, ic));
      });
    }
    if (r.regionScope && r.regionScope !== 'all') {
      list = list.filter(c => candidateMatchesRegionScope(c, r.regionScope));
    }
    const min = r.balanceMin !== '' && r.balanceMin != null ? Number(r.balanceMin) : null;
    const max = r.balanceMax !== '' && r.balanceMax != null ? Number(r.balanceMax) : null;
    const hasMin = min != null && !Number.isNaN(min);
    const hasMax = max != null && !Number.isNaN(max);
    if (hasMin || hasMax) {
      const nonProjectBalanceByCustomer = new Map();
      list.forEach(c => {
        if (candidateIsProjectType(c)) return;
        const customerKey = String(c.creditCode || c.customerName || c.id || '').trim().toUpperCase();
        const balanceWan = computeCandidateAvgMonthlyBalance(c, task?.year);
        nonProjectBalanceByCustomer.set(
          customerKey,
          (nonProjectBalanceByCustomer.get(customerKey) || 0) + (Number(balanceWan) || 0)
        );
      });
      list = list.filter(c => {
        if (candidateIsProjectType(c)) return true;
        const customerKey = String(c.creditCode || c.customerName || c.id || '').trim().toUpperCase();
        const customerBalanceWan = nonProjectBalanceByCustomer.get(customerKey) || 0;
        if (hasMin && customerBalanceWan < min) return false;
        if (hasMax && customerBalanceWan > max) return false;
        return true;
      });
    }
    const projMin = r.projectBalanceMin !== '' && r.projectBalanceMin != null ? Number(r.projectBalanceMin) : null;
    const projMax = r.projectBalanceMax !== '' && r.projectBalanceMax != null ? Number(r.projectBalanceMax) : null;
    const hasProjMin = projMin != null && !Number.isNaN(projMin);
    const hasProjMax = projMax != null && !Number.isNaN(projMax);
    if (hasProjMin || hasProjMax) {
      list = list.filter(c => {
        if (!candidateIsProjectType(c)) return true;
        const balanceWan = typeof computeCandidateProjectAvgLoanBalanceWan === 'function'
          ? computeCandidateProjectAvgLoanBalanceWan(c, task?.year)
          : null;
        if (balanceWan == null) return false;
        if (hasProjMin && balanceWan < projMin) return false;
        if (hasProjMax && balanceWan > projMax) return false;
        return true;
      });
    }
    return list;
  },

  applyCandidateFilterInclusion(taskId, rules, data) {
    const d = data || this.get();
    const filteredIds = new Set(this.filterCandidateList(taskId, rules, d).map(c => c.id));
    const apply = (target) => {
      target.candidates.filter(c => c.taskId === taskId).forEach(c => {
        c.included = filteredIds.has(c.id);
      });
    };
    if (data) {
      apply(data);
      return filteredIds.size;
    }
    this.update(target => apply(target));
    return filteredIds.size;
  },

  getCandidatesForView(taskId, rules) {
    const d = this.get();
    const all = (d.candidates || []).filter(c => c.taskId === taskId);
    if (!all.length) return { rows: [], total: 0, stats: {} };

    const list = this.filterCandidateList(taskId, rules, d);
    const autoInclude = !rules?.customized;
    const rows = autoInclude
      ? list.map(c => (c.included ? c : { ...c, included: true }))
      : list;
    const stats = {
      syncedTotal: all.length,
      includedCount: autoInclude ? list.length : list.filter(c => c.included).length,
      viewCount: list.length
    };
    return { rows, total: list.length, stats };
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
        batch.forEach(c => {
          c.accountingYear = year;
          c.excludeReason = null;
          c.excluded = false;
          c.included = false;
          if (typeof normalizeCandidateLedgerFields === 'function') {
            normalizeCandidateLedgerFields(c, year);
          }
        });
        this.applyCandidateFilterInclusion(taskId, task.candidateFilterRules, data);
      }
    });

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
      const rules = this.getCandidateFilterRules(taskId);
      const included = !rules?.customized
        ? this.filterCandidateList(taskId, rules, d)
        : d.candidates.filter(c => c.taskId === taskId && c.included);
      included.forEach((c, i) => {
        if (d.formalList.some(f => f.customerId === c.id && f.taskId === taskId)) return;
        const isProject = ['一般性固定资产贷款', '出口退税账户托管贷款'].includes(c.loanType || c.productType);
        d.formalList.push({
          id: 'F' + taskId + '_' + (i + 1),
          taskId, customerId: c.id, customerName: c.customerName,
          loanType: c.loanType || c.productType,
          productType: c.productType || c.loanType,
          accountingType: c.accountingType || resolveAccountingType(c),
      collectMode: resolveCollectMode(c.loanType || c.productType),
          bizType: isProject ? 'project' : 'non_project',
          objectType: isProject ? '项目' : '融资主体',
          boundary: '范围一+范围二',
          scope1: true, scope2: true, period: '自然年度',
          status: 'draft',
          economyDirectStatus: null,
          creditCode: c.creditCode || '',
          investIndustryCode: c.investIndustryCode || c.gbIndustryCode || '',
          customerIndustryCode: c.customerIndustryCode || c.gbIndustryCode || '',
          customerIndustryLabel: c.customerIndustryLabel || c.industryLabel || '',
          groupLeadBranch: c.groupLeadBranch || '',
          projectLeadBranch: c.projectLeadBranch || '',
          gbIndustryCode: c.gbIndustryCode, industryMajor: c.industryMajor,
          industryLabel: c.industryLabel,
          tier1Branch: c.tier1Branch || c.branch,
          handlingBranch: c.handlingBranch,
          branch: c.tier1Branch || c.branch,
          creditRefNo: c.creditRefNo || (typeof candidateCreditReferenceNo === 'function' ? candidateCreditReferenceNo(c) : ''),
          creditNo: c.creditNo || (typeof candidateCreditNo === 'function' ? candidateCreditNo(c) : ''),
          loanAccount: c.loanAccount,
          disbursementAmount: c.disbursementAmount,
          disbursementDate: c.disbursementDate,
          borrowerType: c.borrowerType,
          companyNature: c.companyNature,
          companyType: c.companyType,
          customerScale: c.customerScale || candidateCustomerScale(c),
          enterpriseScale: c.enterpriseScale || c.customerScale || candidateEnterpriseScale(c),
          avgMonthlyBalance: c.avgMonthlyBalance,
          monthEndBalanceSum: c.monthEndBalanceSum,
          huaxiaTenureMonths: c.huaxiaTenureMonths,
          totalAssets: c.totalAssets,
          prevYearTotalAssets: c.prevYearTotalAssets,
          avgTotalAssets: c.avgTotalAssets,
          operatingRevenue: c.operatingRevenue,
          manager: c.manager,
          projectDetails: c.projectDetails,
          projectInfoAvailable: c.projectInfoAvailable
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

  /** 按指引优先级匹配方法；分行审核选定后优先使用 approvedMethodId */
  matchMethod(supplement) {
    if (supplement?.approvedMethodId) {
      const locked = GUIDE.METHODS.find(m => m.id === supplement.approvedMethodId);
      if (locked) return locked;
    }
    if (supplement.reportedEmission) return GUIDE.METHODS.find(m => m.id === 'report');
    if (supplement.energyTotalEmission) return GUIDE.METHODS.find(m => m.id === 'energy');
    if (supplement.productTotalEmission) return GUIDE.METHODS.find(m => m.id === 'product');
    if (supplement.economyValue) return GUIDE.METHODS.find(m => m.id === 'economy');
    if (supplement.fallbackFactor) return GUIDE.METHODS.find(m => m.id === 'economy_fallback');
    return GUIDE.METHODS.find(m => m.id === 'economy_fallback');
  },

  applySupplementApprovedMethod(s, methodId, activeMethodTab) {
    const method = GUIDE.METHODS.find(m => m.id === methodId);
    if (!method || !s) return;
    s.approvedMethodId = methodId;
    s.methodId = methodId;
    s.method = method.name;
    s.qualityGrade = method.qualityGrade;
    if (methodId === 'energy') s.activeMethodTab = 'energy';
    else if (methodId === 'product') s.activeMethodTab = 'product';
    else if (methodId === 'economy') s.activeMethodTab = 'economy';
    else if (methodId === 'economy_fallback') s.activeMethodTab = 'other';
    else if (methodId === 'report') {
      s.activeMethodTab = activeMethodTab
        || (typeof SUPPLEMENT_FIELDS !== 'undefined' ? SUPPLEMENT_FIELDS.resolveReportActiveTab(s) : 'report_authority');
    }
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
    const eligibleIds = new Set(
      (typeof getCollectEmissionEligibleFormals === 'function' ? getCollectEmissionEligibleFormals(taskId) : [])
        .map(f => f.id)
    );
    const calcs = this.getCalculations(taskId).filter(c =>
      c.attributedEmission > 0 && (eligibleIds.size === 0 || eligibleIds.has(c.formalId))
    );
    if (!calcs.length) return null;
    const sum = calcs.reduce((s, c) => s + c.attributedEmission, 0);
    const dqr = calcs.reduce((s, c) => s + c.attributedEmission * (c.qualityGrade || 5), 0) / sum;
    const level = GUIDE.QUALITY_LEVELS.find(l => dqr <= l.max)?.label || '一般';
    const grade = typeof resolveDqrGrade === 'function' ? resolveDqrGrade(dqr) : null;
    return { dqr: dqr.toFixed(2), level, grade, count: calcs.length };
  },

  runCalculation(taskId) {
    return this.update(d => {
      const supps = d.supplements.filter(s => s.taskId === taskId);
      const formal = d.formalList.filter(f => f.taskId === taskId && f.status === 'confirmed');
      formal.forEach(f => {
        this._finalizeFormalAccountingType(d, f, taskId);
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
        if (typeof applyCalculationEmissionSplit === 'function') {
          applyCalculationEmissionSplit(payload, f, taskId, entityEmission, d);
        }
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

  _recordAuditEditApproval(d, s, level, operator, round) {
    d.approvals = d.approvals || [];
    d.approvals.unshift({
      id: 'APR' + Date.now() + Math.floor(Math.random() * 10000),
      taskId: s.taskId,
      docType: 'supplement',
      docId: s.id,
      docName: '数据采集-' + s.customerName,
      reviewLevel: level === 'branch' ? 'branch_edit' : 'hq_edit',
      round: round ?? s.reviewRound ?? 1,
      submitter: operator,
      submitTime: new Date().toLocaleString('zh-CN'),
      status: 'approved',
      approver: operator,
      approveTime: new Date().toLocaleString('zh-CN')
    });
  },

  submitSupplementAfterAuditEdit(approvalId, options = {}) {
    let ok = false;
    this.update(d => {
      const a = (d.approvals || []).find(x => x.id === approvalId);
      if (!a || a.status !== 'pending' || a.docType !== 'supplement') return;
      if (!['branch', 'hq'].includes(a.reviewLevel)) return;
      const item = d.supplements.find(x => x.id === a.docId);
      if (!item) return;
      const task = d.tasks.find(t => t.id === a.taskId);
      const now = new Date().toLocaleString('zh-CN');
      const operator = d.currentUser;

      this._recordAuditEditApproval(d, item, a.reviewLevel, operator, a.round || item.reviewRound);

      a.status = 'approved';
      a.approver = operator;
      a.approveTime = now;

      delete item.rejectReason;
      delete item.rejectRoute;
      delete item.rejectAssignee;
      delete item.rejectAssigneeLabel;
      delete item.localAuditFix;
      delete item.needsRefill;

      if (a.reviewLevel === 'branch') {
        const methodId = options.selectedMethodId || Store.matchMethod(item).id;
        Store.applySupplementApprovedMethod(item, methodId, options.activeMethodTab);
        item.branchReviewStatus = 'approved';
        if (task?.initiatorOrg === 'branch') {
          item.auditStage = 'approved';
          item.approvalStatus = 'approved';
        } else {
          item.auditStage = 'branch_approved';
          item.approvalStatus = 'approved';
          item.hqReviewStatus = 'none';
        }
      } else {
        item.hqReviewStatus = 'approved';
        item.auditStage = 'approved';
        item.approvalStatus = 'approved';
      }
      if (a.taskId) this.syncTaskWorkflowAfterApprovals(d, a.taskId);
      ok = true;
    });
    return ok;
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
      s.submittedAt = new Date().toLocaleString('zh-CN');
      delete s.rejectReason;
      this._createSubmitApproval(d, s, round);
      this._createSupplementApproval(d, s, task, 'branch', round);
      this.syncTaskWorkflow(d, s.taskId);
      submitted = true;
    });
    return submitted;
  },

  bulkApproveBranchSupplements(taskId, approvalIds = []) {
    let count = 0;
    this.update(d => {
      const ids = new Set(approvalIds);
      const now = new Date().toLocaleString('zh-CN');
      const operator = d.currentUser;
      const rows = (d.approvals || []).filter(a =>
        ids.has(a.id) &&
        a.taskId === taskId &&
        a.docType === 'supplement' &&
        a.reviewLevel === 'branch' &&
        a.status === 'pending'
      );
      rows.forEach(a => {
        a.status = 'approved';
        a.approver = operator;
        a.approveTime = now;
        this._applyDocApproval(d, a, true, '', {});
        count++;
      });
      if (count) this.syncTaskWorkflowAfterApprovals(d, taskId);
    });
    return count;
  },

  bulkApproveHqSupplements(taskId, approvalIds = []) {
    let count = 0;
    this.update(d => {
      const ids = new Set(approvalIds);
      const now = new Date().toLocaleString('zh-CN');
      const operator = d.currentUser;
      const rows = (d.approvals || []).filter(a =>
        ids.has(a.id) &&
        a.taskId === taskId &&
        a.docType === 'supplement' &&
        a.reviewLevel === 'hq' &&
        a.status === 'pending'
      );
      rows.forEach(a => {
        a.status = 'approved';
        a.approver = operator;
        a.approveTime = now;
        this._applyDocApproval(d, a, true, '', {});
        count++;
      });
      if (count) this.syncTaskWorkflowAfterApprovals(d, taskId);
    });
    return count;
  },

  bulkSubmitBranchApprovedToHq(taskId, approvalIds = []) {
    let count = 0;
    this.update(d => {
      const ids = new Set(approvalIds);
      const task = d.tasks.find(t => t.id === taskId);
      if (!task || task.initiatorOrg === 'branch') return;
      const rows = (d.approvals || []).filter(a =>
        ids.has(a.id) &&
        a.taskId === taskId &&
        a.docType === 'supplement' &&
        a.reviewLevel === 'branch' &&
        a.status === 'approved' &&
        typeof isBranchApprovedReadyForHqSubmit === 'function' &&
        isBranchApprovedReadyForHqSubmit(a, d)
      );
      rows.forEach(a => {
        const item = d.supplements.find(x => x.id === a.docId);
        if (!item) return;
        item.auditStage = 'hq_review';
        item.hqReviewStatus = 'pending';
        item.approvalStatus = 'pending';
        // 沿用同一条审核记录，仅更新环节与状态，不新增总行待审行
        a.reviewLevel = 'hq';
        a.status = 'pending';
        a.approver = null;
        a.approveTime = null;
        a.submitTime = new Date().toLocaleString('zh-CN');
        count++;
      });
      if (count) this.syncTaskWorkflowAfterApprovals(d, taskId);
    });
    return count;
  },

  applyCreditCodeEmissionResolution({ taskId, currentSupplementId, chosenSupplementId, reviewLevel, methodExtra }) {
    let ok = false;
    this.update(d => {
      const current = d.supplements.find(s => s.id === currentSupplementId);
      if (!current) return;
      const creditCode = typeof getSupplementCreditCode === 'function'
        ? getSupplementCreditCode(current, d)
        : '';
      if (!creditCode) return;

      const chosen = d.supplements.find(s => s.id === chosenSupplementId);
      let snapshot;
      if (chosenSupplementId === currentSupplementId) {
        snapshot = typeof buildSupplementEmissionSnapshot === 'function'
          ? buildSupplementEmissionSnapshot(current, taskId, d, methodExtra)
          : null;
      } else {
        snapshot = chosen && typeof buildSupplementEmissionSnapshot === 'function'
          ? buildSupplementEmissionSnapshot(chosen, taskId, d)
          : null;
      }
      if (!snapshot) return;

      const sourceMeta = {
        branch: chosen?.branch || '—',
        manager: chosen?.manager || '—',
        sourceSupplementId: chosenSupplementId,
        overwrittenAt: new Date().toLocaleString('zh-CN')
      };

      const syncTargets = (d.supplements || []).filter(s =>
        s.taskId === taskId &&
        typeof getSupplementCreditCode === 'function' &&
        getSupplementCreditCode(s, d) === creditCode &&
        (
          s.id === currentSupplementId ||
          (typeof isSupplementAuditApproved === 'function' && isSupplementAuditApproved(s, reviewLevel))
        )
      );

      syncTargets.forEach(s => {
        if (typeof applySupplementEmissionSnapshot === 'function') {
          applySupplementEmissionSnapshot(s, snapshot);
        }
        if (s.id !== chosenSupplementId) {
          s.emissionOverwritten = true;
          s.emissionOverwriteMeta = { ...sourceMeta };
        } else {
          delete s.emissionOverwritten;
          delete s.emissionOverwriteMeta;
        }
        if (s.formalId) this._refreshFormalCalculationFromSupplement(d, taskId, s.formalId);
      });
      ok = true;
    });
    return ok;
  },

  _refreshFormalCalculationFromSupplement(d, taskId, formalId) {
    const f = (d.formalList || []).find(x => x.id === formalId && x.taskId === taskId);
    const s = (d.supplements || []).find(x => x.formalId === formalId && x.taskId === taskId);
    if (!f || !s) return;
    let calc = (d.calculations || []).find(c => c.formalId === formalId && c.taskId === taskId);
    const method = this.matchMethod(s);
    const entityEmission = this.calcEntityEmission(s);
    const avgBalance = s.avgLoanBalance
      || (d.candidates || []).find(c => c.id === f.customerId)?.avgMonthlyBalance * 12
      || 5000;
    const payload = {
      taskId,
      formalId,
      customerName: f.customerName,
      bizType: f.bizType,
      method: method.name,
      methodId: s.approvedMethodId || method.id,
      entityEmission,
      avgBalance,
      totalAssets: s.totalAssets || (d.candidates || []).find(c => c.id === f.customerId)?.totalAssets || 50000,
      totalInvestment: s.totalInvestment || 50000,
      industryFactor: s.economyFactor || 2.46,
      qualityGrade: method.qualityGrade,
      status: 'done',
      approvalStatus: calc?.approvalStatus || 'none'
    };
    payload.attributedEmission = this.calcAttributedEmission(payload, s);
    payload.totalEmission = payload.entityEmission;
    if (typeof applyCalculationEmissionSplit === 'function') {
      applyCalculationEmissionSplit(payload, f, taskId, entityEmission, d);
    }
    if (!calc) {
      calc = { id: 'CAL' + formalId, ...payload };
      d.calculations.push(calc);
    } else {
      Object.assign(calc, payload);
    }
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
          s.approvalStatus = 'pending';
          const existing = (d.approvals || []).find(a =>
            a.docType === 'supplement' && a.docId === s.id &&
            a.reviewLevel === 'branch' && a.status === 'approved'
          );
          if (existing) {
            existing.reviewLevel = 'hq';
            existing.status = 'pending';
            existing.approver = null;
            existing.approveTime = null;
            existing.submitTime = new Date().toLocaleString('zh-CN');
          } else {
            this._createSupplementApproval(d, s, task, 'hq');
          }
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

  _isPboBuiltinFactor(f) {
    if (!f?.isBuiltin) return false;
    if (typeof normalizeFactorCaliber === 'function') return normalizeFactorCaliber(f) === 'pbo';
    return f.caliberTag === 'pbo' || !f.caliberTag;
  },

  _pickPreferredEconomyFactor(prev, next) {
    if (!next) return prev || null;
    if (!prev) return next;
    const prevPbo = this._isPboBuiltinFactor(prev);
    const nextPbo = this._isPboBuiltinFactor(next);
    if (nextPbo && !prevPbo) return next;
    if (prevPbo && !nextPbo) return prev;
    return prev;
  },

  _buildEconomyFactorLookup(d) {
    this._economyFactorLookup = {
      factorLen: (d.factors || []).length,
      taskYear: null
    };
  },

  _pickEconomyFactorFromPool(pool, taskYear) {
    if (!pool.length) return null;
    if (typeof groupFactorRecords === 'function' && typeof pickFactorVersion === 'function') {
      const groups = groupFactorRecords(pool);
      const picked = groups.map(g => pickFactorVersion(g.versions, taskYear)).filter(Boolean);
      if (!picked.length) return null;
      return picked.reduce((a, b) => this._pickPreferredEconomyFactor(a, b));
    }
    return pool[0];
  },

  _getIndustryFactor(d, industryMajor, gbCode, taskYear) {
    const factors = (d.factors || []).filter(x =>
      x.methodId === 'economy' && x.valueType === 'default' && x.value != null
    );
    if (!factors.length) return 2.35;
    if (gbCode) {
      const pool = factors.filter(f => f.gbCode === gbCode);
      const hit = this._pickEconomyFactorFromPool(pool, taskYear);
      if (hit) return Number(hit.value);
    }
    if (industryMajor === '钢铁') {
      const pool = factors.filter(x => x.gbCode === 'C3120');
      const hit = this._pickEconomyFactorFromPool(pool, taskYear);
      if (hit) return Number(hit.value);
    }
    if (industryMajor) {
      const pool = factors.filter(f => f.industryMajor === industryMajor);
      const hit = this._pickEconomyFactorFromPool(pool, taskYear);
      if (hit) return Number(hit.value);
    }
    return 2.35;
  },

  getFactor(id) {
    return (this.get().factors || []).find(x => x.id === id);
  },

  _ensureMenuPermissions() {
    if (typeof MenuPermissions === 'undefined') return;
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      const defaults = MenuPermissions.DEFAULT_VISIBILITY;
      if (!d.menuVisibility || typeof d.menuVisibility !== 'object') {
        d.menuVisibility = { ...defaults };
        localStorage.setItem(this.KEY, JSON.stringify(d));
        return;
      }
      let changed = false;
      Object.keys(defaults).forEach(k => {
        if (d.menuVisibility[k] === undefined) {
          d.menuVisibility[k] = defaults[k];
          changed = true;
        }
      });
      if (!d._menuBasicVisibleMigrated) {
        ['method-params', 'method-templates', 'industry-config'].forEach(k => {
          d.menuVisibility[k] = true;
        });
        d._menuBasicVisibleMigrated = true;
        changed = true;
      }
      if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
    } catch { /* ignore */ }
  },

  /** 兼容旧 localStorage：tasks 缺失或为空时从演示种子恢复 */
  _ensureTasksArray() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw || typeof DemoSeed === 'undefined' || !DemoSeed.build) return;
    try {
      const d = JSON.parse(raw);
      if (Array.isArray(d.tasks) && d.tasks.length) return;
      const seed = DemoSeed.build();
      if (!Array.isArray(seed.tasks) || !seed.tasks.length) return;
      d.tasks = seed.tasks;
      if (!d.currentTaskId) d.currentTaskId = seed.tasks[0]?.id || d.currentTaskId;
      localStorage.setItem(this.KEY, JSON.stringify(d));
      this._cache = null;
    } catch { /* ignore */ }
  },

  /** 启动时压缩过大的碳账户演示数据，修复 localStorage 配额溢出 */
  _compactOversizedCarbonStorage() {
    if (typeof CarbonAccount === 'undefined') return;
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      const targets = CarbonAccount.STORAGE_TARGETS;
      const oversized = (d.carbonAccountRecords || []).length > targets.records
        || (d.carbonAccounts || []).length > targets.accounts
        || raw.length > 4 * 1024 * 1024;
      if (!oversized) return;
      CarbonAccount.compactStoragePayload(d, targets);
      d._carbonPersistedV3 = true;
      this._cache = null;
      this._persistMainStore(d);
    } catch { /* ignore */ }
  },

  getIndustryConfig() {
    const d = this.get();
    return d.industryConfig || { imported: false, importedAt: null, rows: [] };
  },

  _ensureIndustryConfig() {
    if (typeof IndustryConfig === 'undefined' || !window.GB4754_FLAT?.length) return;
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return;
    try {
      const d = JSON.parse(raw);
      const needsSeed = !d.industryConfig?.imported || !(d.industryConfig?.rows?.length);
      if (needsSeed) {
        const rows = IndustryConfig.buildImportRows();
        if (rows.length) {
          d.industryConfig = {
            imported: true,
            importedAt: new Date().toLocaleString('zh-CN'),
            seeded: true,
            rows
          };
          localStorage.setItem(this.KEY, JSON.stringify(d));
        }
      } else if (!d.industryConfig) {
        d.industryConfig = { imported: false, importedAt: null, rows: [] };
        localStorage.setItem(this.KEY, JSON.stringify(d));
      }
      this._migrateIndustryConfigTags(d);
      this._migrateIndustryConfigAutoTagsV2(d);
    } catch { /* ignore */ }
  },

  /** 行业配置：单选 tag 迁移为多选 tags */
  _migrateIndustryConfigTags(d) {
    if (!d?.industryConfig?.rows?.length || typeof IndustryConfig === 'undefined') return;
    if (d._industryConfigTagsMigrated) return;
    let changed = false;
    d.industryConfig.rows.forEach(r => {
      if (Array.isArray(r.tags)) {
        const normalized = IndustryConfig.normalizeRowTags(r);
        if (JSON.stringify(r.tags) !== JSON.stringify(normalized)) {
          r.tags = normalized;
          changed = true;
        }
      } else if (r.tag) {
        r.tags = IndustryConfig.normalizeRowTags(r);
        delete r.tag;
        changed = true;
      } else if (!r.tags) {
        r.tags = [];
        changed = true;
      }
    });
    d._industryConfigTagsMigrated = true;
    localStorage.setItem(this.KEY, JSON.stringify(d));
  },

  /** 行业配置：按最新 INDUSTRY_TABLE 重新同步八大高碳/我行主要行业标识（如补全 G5611/G5612） */
  _migrateIndustryConfigAutoTagsV2(d) {
    if (!d?.industryConfig?.rows?.length || typeof IndustryConfig === 'undefined') return;
    if (d._industryConfigAutoTagsV2) return;
    let changed = false;
    d.industryConfig.rows.forEach(r => {
      const autoTags = IndustryConfig.resolveAutoTags(r.code, r.cascadeCode);
      if (r.custom) {
        const current = IndustryConfig.normalizeRowTags(r);
        const merged = [...new Set([...current, ...autoTags])];
        if (JSON.stringify([...current].sort()) !== JSON.stringify([...merged].sort())) {
          r.tags = merged;
          changed = true;
        }
      } else if (JSON.stringify(IndustryConfig.normalizeRowTags(r).sort()) !== JSON.stringify([...autoTags].sort())) {
        r.tags = autoTags;
        changed = true;
      }
    });
    d._industryConfigAutoTagsV2 = true;
    if (changed) localStorage.setItem(this.KEY, JSON.stringify(d));
  },

  importIndustryConfigFromGb4754() {
    if (typeof IndustryConfig === 'undefined') return { ok: false, message: '行业数据未加载', count: 0 };
    const rows = IndustryConfig.buildImportRows();
    if (!rows.length) return { ok: false, message: 'GB/T 4754 数据不可用', count: 0 };
    this.update(d => {
      d.industryConfig = {
        imported: true,
        importedAt: new Date().toLocaleString('zh-CN'),
        rows
      };
    });
    return { ok: true, count: rows.length };
  },

  addIndustryConfigRow(payload) {
    if (!payload?.code && !payload?.cascadeCode) return null;
    let added = null;
    this.update(d => {
      d.industryConfig = d.industryConfig || { imported: false, rows: [] };
      const scoped = payload.code || (typeof toScopedIndustryCode === 'function'
        ? toScopedIndustryCode(payload.cascadeCode)
        : payload.cascadeCode);
      if (d.industryConfig.rows.some(r => r.code === scoped || r.cascadeCode === payload.cascadeCode)) return;
      const row = {
        id: 'IC-' + String(scoped).replace(/\W/g, '') + '-' + Date.now(),
        ...payload,
        code: scoped,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        custom: true
      };
      delete row.tag;
      d.industryConfig.rows.unshift(row);
      d.industryConfig.imported = true;
      added = row;
    });
    return added;
  },

  updateIndustryConfigRow(id, payload) {
    let ok = false;
    this.update(d => {
      const row = d.industryConfig?.rows?.find(r => r.id === id);
      if (!row) return;
      Object.assign(row, payload, {
        id,
        custom: row.custom !== false,
        tags: Array.isArray(payload.tags) ? payload.tags : IndustryConfig.normalizeRowTags(row)
      });
      delete row.tag;
      ok = true;
    });
    return ok;
  },

  deleteIndustryConfigRow(id) {
    let ok = false;
    this.update(d => {
      if (!d.industryConfig?.rows) return;
      const before = d.industryConfig.rows.length;
      d.industryConfig.rows = d.industryConfig.rows.filter(r => r.id !== id);
      ok = d.industryConfig.rows.length < before;
    });
    return ok;
  },

  _factorGroupKey(f) {
    if (typeof factorGroupKey === 'function') return factorGroupKey(f);
    return `${f.methodId}|${f.industryMajor || ''}`;
  },

  _factorVersionKey(f) {
    const gk = this._factorGroupKey(f);
    const year = typeof normalizeFactorVersionYear === 'function'
      ? normalizeFactorVersionYear(f)
      : (Number(f.versionYear) || 0);
    return `${gk}\u001e${year}`;
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
        sourceSheet: payload.sourceSheet || '自定义',
        versionYear: typeof normalizeFactorVersionYear === 'function'
          ? normalizeFactorVersionYear(payload)
          : (Number(payload.versionYear) || new Date().getFullYear()),
        createdAt: payload.createdAt || new Date().toLocaleString('zh-CN')
      };
      if (!(options && options.allowDuplicate)) {
        const vk = this._factorVersionKey(item);
        if (d.factors.some(x => this._factorVersionKey(x) === vk)) return;
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
      const prev = d.factors[idx];
      d.factors[idx] = {
        ...prev,
        ...payload,
        id,
        isBuiltin: false,
        sourceSheet: payload.sourceSheet || prev.sourceSheet || '自定义',
        versionYear: typeof normalizeFactorVersionYear === 'function'
          ? normalizeFactorVersionYear({ ...prev, ...payload })
          : (Number(payload.versionYear) || prev.versionYear),
        updatedAt: new Date().toLocaleString('zh-CN'),
        updatedBy: d.currentUser || '—'
      };
      ok = true;
    });
    return ok;
  },

  saveFactorVersion(id, payload) {
    const prev = this.getFactor(id);
    if (!prev) return { ok: false, reason: 'missing' };
    const nextYear = typeof normalizeFactorVersionYear === 'function'
      ? normalizeFactorVersionYear({ ...prev, ...payload })
      : Number(payload.versionYear);
    const sameYear = typeof normalizeFactorVersionYear === 'function'
      ? normalizeFactorVersionYear(prev) === nextYear
      : Number(prev.versionYear) === nextYear;
    if (sameYear) {
      const ok = this.updateFactor(id, payload);
      return ok ? { ok: true, mode: 'update', id } : { ok: false, reason: 'update_failed' };
    }
    const added = this.addFactor({ ...payload, versionYear: nextYear });
    if (!added) return { ok: false, reason: 'duplicate_year' };
    return { ok: true, mode: 'create', id: added.id };
  },

  deleteFactor(id) {
    let ok = false;
    this.update(d => {
      const f = (d.factors || []).find(x => x.id === id);
      if (!f) return;
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

  deleteFactorGroup(groupKey) {
    let ok = false;
    this.update(d => {
      const before = (d.factors || []).length;
      d.factors = (d.factors || []).filter(f => {
        if (typeof factorGroupKey !== 'function') return true;
        return factorGroupKey(f) !== groupKey;
      });
      ok = d.factors.length < before;
    });
    return ok;
  },

  getFactorImportHistory() {
    return [...(this.get().factorImportHistory || [])].sort((a, b) =>
      String(b.importTime || '').localeCompare(String(a.importTime || ''))
    );
  },

  recordFactorImportHistory(entry) {
    let record = null;
    this.update(d => {
      d.factorImportHistory = d.factorImportHistory || [];
      record = {
        id: 'FI' + Date.now(),
        operator: d.currentUser || '—',
        importTime: new Date().toLocaleString('zh-CN'),
        ...entry
      };
      d.factorImportHistory.unshift(record);
    });
    return record;
  },

  getFactorImportRecord(id) {
    return (this.get().factorImportHistory || []).find(x => x.id === id) || null;
  },

  getParamImportHistory() {
    return [...(this.get().paramImportHistory || [])].sort((a, b) =>
      String(b.importTime || '').localeCompare(String(a.importTime || ''))
    );
  },

  recordParamImportHistory(entry) {
    let record = null;
    this.update(d => {
      d.paramImportHistory = d.paramImportHistory || [];
      record = {
        id: 'PI' + Date.now(),
        operator: d.currentUser || '—',
        importTime: new Date().toLocaleString('zh-CN'),
        ...entry
      };
      d.paramImportHistory.unshift(record);
    });
    return record;
  },

  getParamImportRecord(id) {
    return (this.get().paramImportHistory || []).find(x => x.id === id) || null;
  },

  getIndustryImportHistory() {
    return [...(this.get().industryImportHistory || [])].sort((a, b) =>
      String(b.importTime || '').localeCompare(String(a.importTime || ''))
    );
  },

  recordIndustryImportHistory(entry) {
    let record = null;
    this.update(d => {
      d.industryImportHistory = d.industryImportHistory || [];
      record = {
        id: 'II' + Date.now(),
        operator: d.currentUser || '—',
        importTime: new Date().toLocaleString('zh-CN'),
        ...entry
      };
      d.industryImportHistory.unshift(record);
    });
    return record;
  },

  getIndustryImportRecord(id) {
    return (this.get().industryImportHistory || []).find(x => x.id === id) || null;
  },

  importIndustryConfigFromCsv(text) {
    if (typeof IndustryConfig === 'undefined' || !IndustryConfig.importFromCsv) {
      return { ok: false, added: 0, skipped: 0, errors: ['导入解析器不可用'] };
    }
    return IndustryConfig.importFromCsv(text);
  },

  importFactors(rows) {
    const result = { added: 0, skipped: 0, errors: [] };
    if (!rows?.length) return result;
    this.update(d => {
      d.factors = d.factors || [];
      rows.forEach((row, idx) => {
        const rowNum = idx + 2;
        const parsed = typeof parseFactorImportRow === 'function'
          ? parseFactorImportRow(row, rowNum)
          : { error: '导入解析器不可用' };
        if (parsed.error) {
          result.errors.push(parsed.error);
          return;
        }
        const item = {
          ...parsed.payload,
          id: typeof nextCustomFactorId === 'function' ? nextCustomFactorId(d.factors) : ('EF-C' + Date.now()),
          isBuiltin: false,
          status: 'active',
          sourceSheet: parsed.payload.sourceSheet || '导入',
          versionYear: typeof normalizeFactorVersionYear === 'function'
            ? normalizeFactorVersionYear(parsed.payload)
            : (Number(parsed.payload.versionYear) || new Date().getFullYear())
        };
        const vk = this._factorVersionKey(item);
        if (d.factors.some(x => this._factorVersionKey(x) === vk)) {
          result.skipped++;
          return;
        }
        d.factors.unshift(item);
        result.added++;
      });
    });
    return result;
  },

  /** 调取格澜数据：为已锁定且尚无主体排放的记录写入报告法主体排放（不含项目法-以项目方式计算） */
  fetchGelanEntityEmissions(taskId, formalIds) {
    const task = this.getTask(taskId);
    if (!task) {
      return { ok: false, message: '任务不存在', withData: 0, noData: 0, skipped: 0, skippedProject: 0 };
    }
    let withData = 0;
    let noData = 0;
    let skipped = 0;
    let skippedProject = 0;
    this.update(d => {
      let targets = d.formalList.filter(f =>
        f.taskId === taskId && f.status === 'confirmed' && !this._formalHasEntityEmission(d, taskId, f)
      );
      if (formalIds?.length) {
        const idSet = new Set(formalIds);
        targets = targets.filter(f => idSet.has(f.id));
      }
      const candById = new Map(d.candidates.map(c => [c.id, c]));
      targets.forEach(f => {
        if (typeof isFormalGelanEligible === 'function' && !isFormalGelanEligible(f, taskId, d)) {
          skippedProject++;
          return;
        }
        const row = typeof CarbonAccount !== 'undefined'
          ? CarbonAccount.resolveLedgerRow(d, f, null)
          : formalLedgerRow(f, taskId);
        const gelan = typeof fetchGelanEntityDataMock === 'function'
          ? fetchGelanEntityDataMock(row, task)
          : { ok: false, reason: 'invalid' };
        f.gelanFetchedAt = new Date().toLocaleString('zh-CN');
        if (!gelan.ok) {
          f.gelanStatus = gelan.reason || 'no_data';
          noData++;
          return;
        }
        const c = candById.get(f.customerId);
        const entityEmission = gelan.data.ghgTotalEmission ?? gelan.data.entityEmission;
        const totalAssets = Number(c?.totalAssets) || 800000;
        const avgBalance = Number(c?.avgMonthlyBalance) || Number(f.avgMonthlyBalance) || 3000;
        const attributedEmission = f.bizType === 'project'
          ? Math.round(entityEmission * (avgBalance / (Number(f.totalInvestment) || 500000)))
          : Math.round(entityEmission * (avgBalance / totalAssets));
        f.gelanStatus = 'success';
        f.gelanEntityEmission = entityEmission;
        f.gelanPrefill = gelan.data;
        const reportDetail = {
          carbonDataYear: gelan.data.carbonDataYear ?? gelan.data.reportYear,
          ghgTotalEmission: entityEmission,
          emission: entityEmission,
          scope1Emission: gelan.data.scope1Emission,
          scope2Emission: gelan.data.scope2Emission,
          unitTotalCo2Emission: gelan.data.unitTotalCo2Emission,
          source: gelan.data.reportSource || '其他'
        };
        const payload = {
          taskId,
          formalId: f.id,
          customerName: f.customerName,
          bizType: f.bizType,
          method: '报告法',
          methodId: 'report',
          entityEmission,
          attributedEmission,
          totalEmission: entityEmission,
          avgBalance,
          totalAssets,
          totalInvestment: f.totalInvestment || 500000,
          qualityGrade: 1,
          quality: '一级(优)',
          source: 'gelan',
          status: 'pending',
          approvalStatus: 'none',
          calculatedAt: gelan.data.fetchedAt,
          reportDetail
        };
        if (typeof applyCalculationEmissionSplit === 'function') {
          applyCalculationEmissionSplit(payload, f, taskId, entityEmission, d);
        }
        let calc = d.calculations.find(x => x.formalId === f.id && x.taskId === taskId);
        if (calc) Object.assign(calc, payload);
        else d.calculations.push({ id: 'CAL' + f.id.replace(/\W/g, ''), ...payload });
        if (typeof CarbonAccount !== 'undefined') {
          CarbonAccount.syncEntityFromFormalEmission(d, taskId, f, payload);
        }
        const sup = d.supplements.find(x => x.taskId === taskId && x.formalId === f.id);
        if (sup && typeof applyInterfacePrefillToSupplement === 'function') {
          applyInterfacePrefillToSupplement(sup, f, taskId);
        }
        withData++;
      });
      skipped = d.formalList.filter(f =>
        f.taskId === taskId && f.status === 'confirmed' && this._formalHasEntityEmission(d, taskId, f)
      ).length;
      this.syncTaskWorkflow(d, taskId);
    });
    return { ok: true, withData, noData, skipped, skippedProject };
  },

  runEconomyDirectCalc(taskId, formalIds) {
    let count = 0;
    this.update(d => {
      formalIds.forEach(fid => {
        const f = d.formalList.find(x => x.id === fid && x.taskId === taskId);
        if (!f || typeof isFormalEconomyDirectEligible === 'function' && !isFormalEconomyDirectEligible(f, taskId, d)) {
          return;
        }
        const mode = f?.collectMode || resolveCollectMode(f?.loanType);
        if (!f || f.status !== 'confirmed' || mode === 'mandatory') return;
        if (f.economyDirectStatus === 'done') return;
        if (this._formalHasEntityEmission(d, taskId, f)) return;
        const c = d.candidates.find(x => x.id === f.customerId);
        const task = d.tasks.find(x => x.id === taskId);
        const revenue = Number(c?.operatingRevenue ?? c?.revenue) || Number(c?.avgMonthlyBalance) * 12 || 500000;
        const totalAssets = (typeof computeCandidateAvgTotalAssets === 'function'
          ? computeCandidateAvgTotalAssets(c)
          : null) || Number(c?.totalAssets) || 800000;
        const avgBalance = (typeof computeCandidateAvgMonthlyBalance === 'function'
          ? computeCandidateAvgMonthlyBalance(c, task?.year)
          : null) || Number(c?.avgMonthlyBalance) || 36000;
        const gbCode = f.gbIndustryCode || c?.gbIndustryCode;
        const factor = this._getIndustryFactor(d, f.industryMajor, gbCode, task?.year);
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
        if (typeof applyCalculationEmissionSplit === 'function') {
          applyCalculationEmissionSplit(payload, f, taskId, entityEmission, d);
        }
        let calc = d.calculations.find(x => x.formalId === f.id);
        if (calc) Object.assign(calc, payload);
        else d.calculations.push({ id: 'CAL' + f.id.replace(/\W/g, ''), ...payload });
        if (typeof CarbonAccount !== 'undefined') {
          CarbonAccount.syncEntityFromFormalEmission(d, taskId, f, payload);
        }
        const sup = d.supplements.find(x => x.taskId === taskId && x.formalId === f.id);
        if (sup && typeof applyInterfacePrefillToSupplement === 'function') {
          applyInterfacePrefillToSupplement(sup, f, taskId);
        }
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

  _applySupplementIndustryCorrection(d, supplement, opts) {
    if (!supplement || !opts?.correctedIndustryCode) return;
    supplement.gbIndustryCode = opts.correctedIndustryCode;
    supplement.gbIndustryName = opts.correctedIndustryName || '';
    supplement.industryLabel = opts.correctedIndustryLabel || opts.correctedIndustryCode;
    supplement.industryMajor = opts.correctedIndustryMajor || supplement.industryMajor;
    supplement.subjectIndustryEdited = true;
    supplement.status = 'returned';
    supplement.auditStage = 'pending_fill';
    supplement.approvalStatus = 'none';
    supplement.fieldsDone = 0;
    supplement.complete = false;
    if (supplement.formalId) {
      const f = (d.formalList || []).find(x => x.id === supplement.formalId);
      if (f) {
        f.gbIndustryCode = opts.correctedIndustryCode;
        f.gbIndustryName = opts.correctedIndustryName || '';
        f.industryLabel = opts.correctedIndustryLabel || opts.correctedIndustryCode;
        f.industryMajor = opts.correctedIndustryMajor || f.industryMajor;
        f.customerIndustryCode = opts.correctedIndustryCode;
        f.customerIndustryLabel = opts.correctedIndustryLabel || opts.correctedIndustryCode;
        f.subjectIndustryEdited = true;
      }
      const c = (d.candidates || []).find(x => x.id === f?.customerId);
      if (c) {
        c.gbIndustryCode = opts.correctedIndustryCode;
        c.gbIndustryName = opts.correctedIndustryName || '';
        c.industryLabel = opts.correctedIndustryLabel || opts.correctedIndustryCode;
        c.industryMajor = opts.correctedIndustryMajor || c.industryMajor;
      }
    }
  },

  resolveApproval(approvalId, approved, rejectReason, options) {
    const opts = options || {};
    return this.update(d => {
      const a = (d.approvals || []).find(x => x.id === approvalId);
      if (!a || a.status !== 'pending') return;
      if (!approved && !(rejectReason || '').trim()) return;
      if (!a.taskId) a.taskId = this._inferApprovalTaskId(d, a);
      a.status = approved ? 'approved' : 'rejected';
      a.approver = d.currentUser;
      a.approveTime = new Date().toLocaleString('zh-CN');
      if (!approved) a.rejectReason = (rejectReason || '').trim();
      this._applyDocApproval(d, a, approved, rejectReason, opts);
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

  _applyDocApproval(d, approval, approved, rejectReason, options) {
    const opts = options || {};
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
        const rejectTarget = opts.rejectTarget || 'manager';
        if (opts.rejectReasonType === 'industry_error' && opts.correctedIndustryCode) {
          this._applySupplementIndustryCorrection(d, item, opts);
        }
        if (approval.reviewLevel === 'hq' && rejectTarget === 'branch') {
          item.approvalStatus = 'pending';
          item.auditStage = 'branch_review';
          item.branchReviewStatus = 'pending';
          item.hqReviewStatus = 'rejected';
          item.rejectReason = (rejectReason || '').trim();
          approval.reviewLevel = 'branch';
          approval.status = 'pending';
          approval.approver = null;
          approval.approveTime = null;
          approval.submitTime = new Date().toLocaleString('zh-CN');
          return;
        }
        item.approvalStatus = 'none';
        item.auditStage = 'pending_fill';
        item.status = 'returned';
        item.rejectReason = (rejectReason || '').trim();
        item.rejectAssignee = opts.rejectAssignee || null;
        item.rejectAssigneeLabel = opts.rejectAssigneeLabel || null;
        item.rejectRoute = opts.rejectRoute || null;
        item.rejectReasonType = opts.rejectReasonType || null;
        item.needsRefill = opts.rejectReasonType === 'industry_error';
        if (opts.rejectRoute === 'other_manager' && opts.rejectAssigneeLabel) {
          item.manager = opts.rejectAssigneeLabel;
        }
        delete item.approvedMethodId;
        if (approval.reviewLevel === 'branch') item.branchReviewStatus = 'rejected';
        if (approval.reviewLevel === 'hq') item.hqReviewStatus = 'rejected';
        return;
      }
      if (approval.reviewLevel === 'branch') {
        const methodId = opts.selectedMethodId || Store.matchMethod(item).id;
        Store.applySupplementApprovedMethod(item, methodId, opts.activeMethodTab);
        item.branchReviewStatus = 'approved';
        if (task?.initiatorOrg === 'branch') {
          item.auditStage = 'approved';
          item.approvalStatus = 'approved';
        } else {
          item.auditStage = 'branch_approved';
          item.approvalStatus = 'approved';
          item.hqReviewStatus = 'none';
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

    const access = typeof getCalculationStepAccess === 'function'
      ? getCalculationStepAccess(taskId, d)
      : { allowed: this.isDataCollectionComplete(taskId), forcedByDeadline: false };

    if (access.forcedByDeadline) {
      this._applyCalculationStepDeadlinePolicyInPlace(d, taskId);
    }

    if (access.allowed) {
      t.workflowStep = WORKFLOW_STEP.CALCULATION;
      t.progress = Math.max(t.progress || 0, 65);
      if (access.forcedByDeadline) {
        t.calculationForcedByDeadline = true;
        if (t.milestone) t.milestone.calculationForcedByDeadline = true;
      } else if (this.isDataCollectionComplete(taskId)) {
        if (t.milestone) t.milestone.supplementApproved = true;
      } else if (access.reason === 'emission_ready') {
        if (t.milestone) t.milestone.emissionReadyForCalc = true;
      }
    } else if (t.workflowStep >= WORKFLOW_STEP.CALCULATION && !t.calculationForcedByDeadline && !t.dataCollectSubmitted) {
      t.workflowStep = WORKFLOW_STEP.DATA_COLLECTION;
    }

    const calcs = d.calculations.filter(c => c.taskId === taskId);
    const allReady = this.isDataCollectionComplete(taskId);
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
        linkLabel: '打开收集填报',
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
          ['法人主体排放', formatCalculationEmissionCell(c.legalEntityEmission ?? (c.projectEntityEmission == null ? c.entityEmission : null))],
          ['项目主体排放', formatCalculationEmissionCell(c.projectEntityEmission)],
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
          ['所属行业范围', getTaskSubjectIndustryScope(t)],
          ['投向行业范围', getTaskInvestIndustryScope(t)],
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
      const method = s.approvedMethodId
        ? GUIDE.METHODS.find(m => m.id === s.approvedMethodId)
        : Store.matchMethod(s);
      s.method = method.name;
      s.methodId = method.id;
      s.qualityGrade = method.qualityGrade;
      if (payload.complete) s.status = 'completed';
      else if (s.status === 'returned' || s.status === 'pending') s.status = 'in_progress';
      else if (s.status !== 'returned') s.status = 'in_progress';

      const formal = d.formalList.find(f => f.id === s.formalId);
      const candidate = d.candidates.find(c => c.id === (s.customerId || formal?.customerId));
      if (payload.industryMajor != null || payload.gbIndustryCode != null) {
        this._syncSupplementIndustry(d, s, formal, candidate, {
          industryMajor: payload.industryMajor ?? s.industryMajor,
          gbIndustryCode: payload.gbIndustryCode ?? s.gbIndustryCode,
          gbIndustryName: payload.gbIndustryName ?? s.gbIndustryName
        });
      }
      if (s.bizType === 'project') {
        const hasSupplementProject = Array.isArray(s.projectDetails) && s.projectDetails.length > 0;
        if (hasSupplementProject) {
          if (formal) formal.projectDetails = s.projectDetails;
          if (candidate) candidate.projectDetails = s.projectDetails;
        }
        if (s.projectInfoAvailable === false) {
          if (formal) formal.projectDetails = [];
          if (candidate) candidate.projectDetails = [];
        }
        if (formal && s.projectInfoAvailable != null) formal.projectInfoAvailable = s.projectInfoAvailable;
        if (candidate && s.projectInfoAvailable != null) candidate.projectInfoAvailable = s.projectInfoAvailable;
        if (payload.complete) {
          let accountingType = null;
          if (s.projectInfoAvailable === false) {
            accountingType = 'project_as_non_project';
          } else {
            const row = {
              ...(candidate || {}),
              ...(formal || {}),
              projectDetails: s.projectDetails ?? formal?.projectDetails ?? candidate?.projectDetails,
              projectInfoAvailable: s.projectInfoAvailable
            };
            accountingType = (Array.isArray(row.projectDetails) && row.projectDetails.length > 0
              && typeof candidateProjectFinancialMissing === 'function'
              && !candidateProjectFinancialMissing(row))
              ? 'project_as_project'
              : 'project_as_non_project';
          }
          s.accountingType = accountingType;
          if (formal) formal.accountingType = accountingType;
          if (candidate) candidate.accountingType = accountingType;
        }
      }
      const formalForSync = d.formalList.find(f => f.id === s.formalId);
      if (formalForSync) {
        this._finalizeFormalAccountingType(d, formalForSync, s.taskId);
        this._upsertCalculationFromFormal(d, formalForSync, s.taskId);
        const t = d.tasks.find(x => x.id === s.taskId);
        if (t) t.dqr = Store.calcDQR(s.taskId);
      }
    });
  },

  _syncSupplementIndustry(d, s, formal, candidate, industry) {
    if (!s) return;
    s.industryMajor = industry.industryMajor ?? s.industryMajor;
    s.gbIndustryCode = industry.gbIndustryCode ?? s.gbIndustryCode ?? '';
    s.gbIndustryName = industry.gbIndustryName ?? s.gbIndustryName ?? '';
    if (formal) {
      formal.industryMajor = s.industryMajor;
      formal.gbIndustryCode = s.gbIndustryCode;
      formal.gbIndustryName = s.gbIndustryName;
    }
    if (candidate) {
      candidate.industryMajor = s.industryMajor;
      candidate.gbIndustryCode = s.gbIndustryCode;
      candidate.gbIndustryName = s.gbIndustryName;
    }
  },

  applyApprovalAuditAdjustments(supplementId, data) {
    const payload = data || {};
    return this.update(d => {
      const s = d.supplements.find(x => x.id === supplementId);
      if (!s) return;
      const formal = d.formalList.find(f => f.id === s.formalId);
      const candidate = d.candidates.find(c => c.id === (s.customerId || formal?.customerId));
      const task = d.tasks.find(t => t.id === s.taskId);

      if (payload.clearIndustry) {
        this._syncSupplementIndustry(d, s, formal, candidate, {
          industryMajor: '-',
          gbIndustryCode: '',
          gbIndustryName: ''
        });
      } else if (payload.industryMajor != null) {
        this._syncSupplementIndustry(d, s, formal, candidate, {
          industryMajor: payload.industryMajor || '-',
          gbIndustryCode: payload.gbIndustryCode || '',
          gbIndustryName: payload.gbIndustryName || ''
        });
      }

      if (payload.clearFactor) {
        delete s.auditFactorId;
        delete s.auditFactorMethodId;
        delete s.auditFactorLabel;
        delete s.auditFactorValue;
        const auto = this._getIndustryFactor(d, s.industryMajor, s.gbIndustryCode, task?.year);
        s.economyFactor = auto;
        s.fallbackFactor = auto;
      } else {
        if (payload.factorId) {
          const f = d.factors.find(x => x.id === payload.factorId);
          s.auditFactorId = payload.factorId;
          s.auditFactorMethodId = payload.factorMethodId || f?.methodId || 'economy';
          s.auditFactorLabel = typeof factorDisplayName === 'function' && f ? factorDisplayName(f) : '';
          if (f?.value != null) s.auditFactorValue = Number(f.value);
        }
        if (payload.factorValue != null && payload.factorValue !== '' && !Number.isNaN(Number(payload.factorValue))) {
          s.auditFactorValue = Number(payload.factorValue);
        }
        const val = s.auditFactorValue ?? this._getIndustryFactor(d, s.industryMajor, s.gbIndustryCode, task?.year);
        const methodId = payload.factorMethodId || s.auditFactorMethodId || 'economy';
        if (methodId === 'economy' || methodId === 'economy_fallback') {
          s.economyFactor = val;
          if (methodId === 'economy_fallback' || s.fallbackFactor) s.fallbackFactor = val;
        }
      }

      s.auditAdjustedAt = new Date().toLocaleString('zh-CN');
      s.auditAdjustedBy = d.currentUser;
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
    if (!formalIds?.length) return { locked: 0, provisioned: 0 };
    let locked = 0;
    let provisioned = 0;
    this.update(d => {
      const formal = d.formalList.filter(f => f.taskId === taskId && formalIds.includes(f.id));
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
      // 【业务规则】确认锁定后，在企业碳账户模块生成清单内全部客户账户
      if (typeof CarbonAccount !== 'undefined') {
        const targets = d.formalList.filter(f =>
          f.taskId === taskId && formalIds.includes(f.id) && f.status === 'confirmed'
        );
        provisioned = CarbonAccount.provisionFromFormalLock(d, taskId, targets);
      }
      if (typeof CollectGroups !== 'undefined') {
        this._rebuildCollectGroupsInPlace(d, taskId);
      }
      this.syncTaskWorkflow(d, taskId);
    });
    return { locked, provisioned };
  },

  _sameMemberSet(a, b) {
    const sa = new Set(a || []);
    const sb = new Set(b || []);
    if (sa.size !== sb.size) return false;
    for (const x of sa) if (!sb.has(x)) return false;
    return true;
  },

  _rebuildCollectGroupsInPlace(d, taskId) {
    if (typeof CollectGroups === 'undefined') return;
    d.collectGroups = d.collectGroups || [];
    const formals = d.formalList.filter(f => f.taskId === taskId);
    const candidates = d.candidates.filter(c => c.taskId === taskId);
    const next = CollectGroups.buildGroups(taskId, formals, candidates);
    const old = d.collectGroups.filter(g => g.taskId === taskId);
    next.forEach(g => {
      const match = old.find(o =>
        o.bucket === g.bucket
        && (o.creditRefNo || o.projectNo || '') === (g.creditRefNo || '')
        && (o.creditCode || o.customerName) === (g.creditCode || g.customerName)
        && this._sameMemberSet(o.memberFormalIds, g.memberFormalIds)
      );
      if (match) {
        g.assignedManager = match.assignedManager || g.assignedManager;
        g.assignedManagerSource = match.assignedManagerSource || g.assignedManagerSource;
        if (match.supplementId) g.supplementId = match.supplementId;
      }
    });
    CollectGroups.syncGroupSupplementState(next, d.supplements);
    CollectGroups.applyGroupsToFormals(next, formals);
    d.collectGroups = d.collectGroups.filter(g => g.taskId !== taskId).concat(next);
  },

  rebuildCollectGroups(taskId) {
    this.update(d => this._rebuildCollectGroupsInPlace(d, taskId));
    return this.getCollectGroups(taskId).length;
  },

  getCollectGroups(taskId) {
    return (this.get().collectGroups || []).filter(g => g.taskId === taskId);
  },

  findSupplementForFormal(d, taskId, formalId) {
    const direct = (d.supplements || []).find(s => s.taskId === taskId && s.formalId === formalId);
    if (direct) return direct;
    const formal = (d.formalList || []).find(f => f.id === formalId && f.taskId === taskId);
    if (!formal?.collectGroupId) return null;
    return (d.supplements || []).find(s => s.taskId === taskId && s.collectGroupId === formal.collectGroupId) || null;
  },

  findSupplementForGroup(d, taskId, groupId) {
    const s = (d.supplements || []).find(x => x.taskId === taskId && x.collectGroupId === groupId);
    return s?.dispatchedAt ? s : null;
  },

  /** 查找归集单元 supplement（含未派发，供内部清理等使用） */
  findSupplementForGroupRaw(d, taskId, groupId) {
    return (d.supplements || []).find(x => x.taskId === taskId && x.collectGroupId === groupId) || null;
  },

  reassignCollectGroupManager(taskId, groupId, manager, options = {}) {
    const name = (manager || '').trim();
    if (!name) return { ok: false, message: '请填写客户经理姓名' };
    const wipeData = !!options.wipeData;
    let updated = false;
    this.update(d => {
      const g = (d.collectGroups || []).find(x => x.id === groupId && x.taskId === taskId);
      if (!g) return;
      g.assignedManager = name;
      g.assignedManagerSource = 'branch_override';

      if (wipeData) {
        const sup = this.findSupplementForGroupRaw(d, taskId, groupId);
        if (sup) {
          d.supplements = (d.supplements || []).filter(x => x.id !== sup.id);
          d.approvals = (d.approvals || []).filter(a =>
            !(a.docType === 'supplement' && a.docId === sup.id)
          );
        }
        g.supplementId = null;
        g.status = 'pending';
      } else {
        const sup = this.findSupplementForGroupRaw(d, taskId, groupId);
        if (sup) sup.manager = name;
      }
      updated = true;
      this.syncTaskWorkflow(d, taskId);
    });
    if (!updated) return { ok: false, message: '归集单元不存在' };
    return wipeData
      ? { ok: true, message: '已改派收集人，原填报与审核任务已清空' }
      : { ok: true, message: '已更新收集人' };
  },

  dispatchCollectGroups(taskId, groupIds) {
    if (!groupIds?.length) return 0;
    let count = 0;
    this.update(d => {
      groupIds.forEach(gid => {
        const g = (d.collectGroups || []).find(x => x.id === gid && x.taskId === taskId);
        if (!g || g.supplementId) return;
        const members = d.formalList.filter(f => g.memberFormalIds.includes(f.id) && f.status === 'confirmed');
        if (!members.length) return;
        if (d.supplements.some(s => s.collectGroupId === gid)) return;
        const primary = members[0];
        const cand = d.candidates.find(c => c.id === primary.customerId);
        const sup = {
          id: 'S' + Date.now() + Math.floor(Math.random() * 10000),
          taskId,
          collectGroupId: g.id,
          memberFormalIds: g.memberFormalIds.slice(),
          formalId: primary.id,
          customerId: primary.customerId,
          customerName: g.customerName || primary.customerName,
          loanType: members.length > 1 ? `归集${members.length}笔` : (primary.loanType || cand?.loanType),
          bizType: g.bucket === 'non_project' ? 'non_project' : 'project',
          industryMajor: primary.industryMajor || cand?.industryMajor,
          accountingType: typeof resolveAccountingType === 'function'
            ? (resolveAccountingType(primary) || null)
            : (g.bucket === 'non_project' ? 'non_project' : null),
          accountingIndustryCode: g.accountingIndustryCode,
          accountingIndustryLabel: g.accountingIndustryLabel,
          accountingIndustrySource: g.accountingIndustrySource,
          projectInfoAvailable: primary.projectInfoAvailable ?? null,
          projectDetails: primary.projectDetails || g.projectDetails || [],
          creditRefNo: g.creditRefNo || g.projectNo || '',
          projectNo: g.creditRefNo || g.projectNo || '',
          projectName: g.projectName || '',
          branch: g.dispatchBranch,
          dispatchBranch: g.dispatchBranch,
          dispatchRule: g.dispatchRule,
          manager: g.assignedManager || primary.manager || cand?.manager || '王磊',
          status: 'pending',
          method: '待选择',
          fieldsTotal: 12,
          fieldsDone: 0,
          deadline: d.tasks.find(t => t.id === taskId)?.deadline || '2025-09-30',
          approvalStatus: 'none',
          branchReviewStatus: 'none',
          hqReviewStatus: 'none',
          auditStage: 'pending_fill',
          reviewRound: 0,
          dispatchedAt: new Date().toLocaleString('zh-CN'),
          dispatchedBy: d.currentUser
        };
        if (typeof applyInterfacePrefillToSupplement === 'function') {
          applyInterfacePrefillToSupplement(sup, primary, taskId);
        }
        d.supplements.push(sup);
        g.supplementId = sup.id;
        g.status = 'dispatched';
        members.forEach(f => { f.collectGroupId = g.id; });
        count++;
      });
      this.syncTaskWorkflow(d, taskId);
    });
    return count;
  },

  dispatchSupplements(taskId, formalIds) {
    if (!formalIds?.length) return 0;
    let count = 0;
    this.update(d => {
      formalIds.forEach(fid => {
        const f = d.formalList.find(x => x.id === fid && x.taskId === taskId);
        if (!f || f.status !== 'confirmed') return;
        if (d.supplements.some(s => s.formalId === fid)) return;
        const sup = {
          id: 'S' + Date.now() + Math.floor(Math.random() * 10000),
          taskId, formalId: f.id, customerId: f.customerId, customerName: f.customerName,
          loanType: f.loanType, bizType: f.bizType, industryMajor: f.industryMajor,
          accountingType: f.accountingType || null,
          projectInfoAvailable: f.projectInfoAvailable ?? (f.accountingType === 'project_as_project' ? true : (f.accountingType === 'project_as_non_project' ? false : null)),
          projectDetails: Array.isArray(f.projectDetails) ? f.projectDetails : [],
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
        };
        if (typeof applyInterfacePrefillToSupplement === 'function') {
          applyInterfacePrefillToSupplement(sup, f, taskId);
        }
        d.supplements.push(sup);
        count++;
      });
      this.syncTaskWorkflow(d, taskId);
    });
    return count;
  },

  syncSupplementInterfacePrefill(taskId, formalId) {
    if (!taskId || !formalId || typeof applyInterfacePrefillToSupplement !== 'function') return;
    this.update(d => {
      const s = d.supplements.find(x => x.taskId === taskId && x.formalId === formalId);
      const f = d.formalList.find(x => x.taskId === taskId && x.id === formalId);
      if (s && f) applyInterfacePrefillToSupplement(s, f, taskId);
    });
  },

  updateFormalIndustries(taskId, edits) {
    if (!taskId || !Array.isArray(edits) || !edits.length) return 0;
    let count = 0;
    this.update(d => {
      edits.forEach(edit => {
        const f = d.formalList.find(x => x.id === edit.formalId && x.taskId === taskId);
        if (!f) return;
        const c = d.candidates.find(x => x.id === f.customerId);
        if (edit.subjectIndustryEdited) {
          f.gbIndustryCode = edit.gbIndustryCode;
          f.gbIndustryName = edit.gbIndustryName;
          f.industryLabel = edit.industryLabel;
          f.industryMajor = edit.industryMajor;
          f.customerIndustryCode = edit.gbIndustryCode;
          f.customerIndustryLabel = edit.industryLabel;
          f.subjectIndustryEdited = true;
          if (c) {
            c.gbIndustryCode = edit.gbIndustryCode;
            c.gbIndustryName = edit.gbIndustryName;
            c.industryLabel = edit.industryLabel;
            c.industryMajor = edit.industryMajor;
          }
        }
        if (edit.investIndustryEdited) {
          f.investIndustryCode = edit.investIndustryCode;
          f.investIndustryName = edit.investIndustryName;
          f.investIndustryEdited = true;
          const details = Array.isArray(f.projectDetails)
            ? f.projectDetails.map(p => ({ ...p }))
            : (Array.isArray(c?.projectDetails) ? c.projectDetails.map(p => ({ ...p })) : []);
          if (!details.length) details.push({});
          details[0] = {
            ...details[0],
            nationalIndustryCodeLv4: edit.investIndustryCode,
            projectIndustry: edit.investIndustryName || edit.investIndustryCode
          };
          f.projectDetails = details;
          if (c) {
            c.investIndustryCode = edit.investIndustryCode;
            c.investIndustryName = edit.investIndustryName;
            c.investIndustryEdited = true;
            const cDetails = Array.isArray(c.projectDetails) ? c.projectDetails.map(p => ({ ...p })) : [];
            if (!cDetails.length) cDetails.push({});
            cDetails[0] = {
              ...cDetails[0],
              nationalIndustryCodeLv4: edit.investIndustryCode,
              projectIndustry: edit.investIndustryName || edit.investIndustryCode
            };
            c.projectDetails = cDetails;
          }
        }
        count += 1;
      });
    });
    return count;
  },

  generateReport(taskId, scope, template, format) {
    return this.update(d => {
      d.reports = d.reports || [];
      const task = d.tasks.find(t => t.id === taskId);
      const lockIds = task?.calculationScopeLock?.formalIds;
      let calcs = d.calculations.filter(c => c.taskId === taskId && c.attributedEmission);
      if (lockIds?.length) {
        const idSet = new Set(lockIds);
        calcs = calcs.filter(c => idSet.has(c.formalId));
      }
      const total = calcs.reduce((s, c) => s + c.attributedEmission, 0);
      const scopeLabel = lockIds?.length && typeof formatCalculationScopeLockHint === 'function'
        ? `${scope}（${formatCalculationScopeLockHint(task)}）`
        : scope;
      d.reports.unshift({
        id: 'RPT' + Date.now(),
        taskId,
        name: `${task?.year || ''}年度导出-${scope}`,
        scope: scopeLabel, template, format,
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
    const eligible = typeof getCollectEmissionEligibleFormals === 'function'
      ? getCollectEmissionEligibleFormals(taskId)
      : [];
    if (!eligible.length) {
      return { ok: false, message: '暂无排放结果可提交的记录，请先在数据采集页完成排放结果' };
    }
    const d = this.get();
    const allGroups = typeof getDataCollectTableGroups === 'function'
      ? getDataCollectTableGroups(taskId, d)
      : [];
    const filters = typeof getCalculationFilters === 'function' ? getCalculationFilters(taskId) : {};
    const hasInvestFilter = typeof hasCalculationInvestmentFilter === 'function'
      && hasCalculationInvestmentFilter(filters);
    const filteredGroups = hasInvestFilter && typeof filterCalculationGroupsByInvestment === 'function'
      ? filterCalculationGroupsByInvestment(allGroups, filters, taskId, d)
      : allGroups;
    if (hasInvestFilter && !filteredGroups.length) {
      return { ok: false, message: '当前项目总投资筛选条件下无项目类排放计算清单，请调整筛选范围后再提交' };
    }
    const groupsForLock = hasInvestFilter ? filteredGroups : allGroups;
    const scopedFormalIds = typeof getFormalIdsFromCalculationGroups === 'function'
      ? Array.from(getFormalIdsFromCalculationGroups(groupsForLock))
      : eligible.map(f => f.id);
    this.syncCalculationsFromDataCollect(taskId);
    this.update(d => {
      const t = d.tasks.find(x => x.id === taskId);
      if (t) {
        t.resultsConfirmed = true;
        t.resultsConfirmedAt = new Date().toLocaleString('zh-CN');
        t.workflowStep = WORKFLOW_STEP.REPORT;
        t.progress = Math.max(t.progress || 0, 85);
        t.calculationScopeLock = {
          investMin: filters.investMin ?? null,
          investMax: filters.investMax ?? null,
          formalIds: scopedFormalIds,
          groupCount: groupsForLock.length,
          lockedAt: new Date().toLocaleString('zh-CN')
        };
        const scopedCalcs = d.calculations.filter(c =>
          c.taskId === taskId && scopedFormalIds.includes(c.formalId) && c.attributedEmission > 0
        );
        t.dqr = typeof calcDQRFromCalcs === 'function'
          ? (calcDQRFromCalcs(scopedCalcs) || Store.calcDQR(taskId))
          : Store.calcDQR(taskId);
        if (t.milestone) {
          t.milestone.calculationDone = true;
          t.milestone.resultsConfirmed = true;
        }
      }
      this._finalizeTaskAccountingTypes(d, taskId);
      if (typeof CarbonAccount !== 'undefined') {
        CarbonAccount.syncTask(d, taskId);
      }
    });
    return { ok: true };
  }
};

Store.init();
if (typeof window !== 'undefined') window.Store = Store;
