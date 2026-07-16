/** 数据采集 — 客户归集单元（正式清单逐笔保留，下发按 group） */
const CollectGroups = {
  DISPATCH_RULE_LABELS: {
    single_branch: '单分行（主办分行）',
    group_lead: '集团主办行',
    project_lead: '项目分行',
    first_disbursement: '联合贷-首笔放款行'
  },

  BUCKET_LABELS: {
    non_project: '非项目',
    project: '项目（计算方法待定）',
    project_as_project: '项目（以项目方式计算）',
    project_as_non_project: '项目（以非项目方式计算）'
  },

  resolveCreditCode(formal, candidate) {
    return (formal?.creditCode || candidate?.creditCode || '').trim()
      || `NAME:${(formal?.customerName || candidate?.customerName || '').trim()}`;
  },

  investIndustryCode(formal, candidate) {
    return formal?.investIndustryCode
      || candidate?.investIndustryCode
      || formal?.gbIndustryCode
      || candidate?.gbIndustryCode
      || '';
  },

  customerIndustryCode(formal, candidate) {
    return formal?.customerIndustryCode
      || candidate?.customerIndustryCode
      || formal?.gbIndustryCode
      || candidate?.gbIndustryCode
      || '';
  },

  customerIndustryLabel(formal, candidate, code) {
    const c = code || this.customerIndustryCode(formal, candidate);
    if (formal?.customerIndustryLabel) return formal.customerIndustryLabel;
    if (candidate?.customerIndustryLabel && this.customerIndustryCode(formal, candidate) === candidate?.gbIndustryCode) {
      return candidate.industryLabel || candidate.customerIndustryLabel;
    }
    return formal?.industryLabel || candidate?.industryLabel || c || '—';
  },

  isNonProjectBucket(formal, candidate) {
    const row = formal || candidate;
    if (!row) return false;
    const type = typeof resolveAccountingType === 'function' ? resolveAccountingType(row) : row.accountingType;
    if (type === 'non_project') return true;
    if (type === 'project_as_project' || type === 'project_as_non_project') return false;
    if (typeof candidateIsProjectType === 'function' && candidateIsProjectType(row)) return false;
    return (row.bizType || '') !== 'project';
  },

  isProjectBucket(formal, candidate) {
    const row = formal || candidate;
    if (!row) return false;
    const type = typeof resolveAccountingType === 'function' ? resolveAccountingType(row) : row.accountingType;
    if (type === 'project_as_project' || type === 'project_as_non_project') return true;
    if (typeof candidateIsProjectType === 'function' && candidateIsProjectType(row)) return true;
    return (row.bizType || '') === 'project';
  },

  /** 从 formal 推导精确的项目 bucket 类型 */
  resolveProjectBucket(formal, candidate) {
    const row = formal || candidate;
    if (!row) return 'project';
    const type = typeof resolveAccountingType === 'function' ? resolveAccountingType(row) : row.accountingType;
    if (type === 'project_as_project') return 'project_as_project';
    if (type === 'project_as_non_project') return 'project_as_non_project';
    return 'project';
  },

  formalCreditRefNo(formal) {
    const pd = Array.isArray(formal?.projectDetails) ? formal.projectDetails[0] : null;
    return (pd?.projectNo || formal?.creditRefNo || formal?.projectNo || '').trim() || null;
  },

  /** 向后兼容旧调用 */
  formalProjectNo(formal) { return this.formalCreditRefNo(formal); },

  formalLoanType(formal) {
    return (formal?.loanType || formal?.productType || '').trim();
  },

  formalProjectName(formal) {
    const pd = Array.isArray(formal?.projectDetails) ? formal.projectDetails[0] : null;
    return pd?.projectName || formal?.projectName || '';
  },

  parseDisbursementDate(formal) {
    const s = formal?.disbursementDate || '';
    const m = String(s).match(/^(\d{4})-(\d{1,2})/);
    if (!m) return Number.MAX_SAFE_INTEGER;
    return parseInt(m[1], 10) * 100 + parseInt(m[2], 10);
  },

  unique(arr) {
    return [...new Set(arr.filter(Boolean))];
  },

  sum(rows, pick) {
    return rows.reduce((s, r) => s + (Number(pick(r)) || 0), 0);
  },

  pickCustomerLevelField(rows, key) {
    for (const r of rows) {
      const v = r?.[key];
      if (v != null && v !== '' && !Number.isNaN(Number(v))) return Number(v);
    }
    return null;
  },

  pickGroupLeadBranch(rows, candidatesById) {
    for (const r of rows) {
      const c = candidatesById.get(r.customerId);
      const lead = r.groupLeadBranch || c?.groupLeadBranch;
      if (lead) return lead;
    }
    const byBalance = [...rows].sort((a, b) => (Number(b.avgMonthlyBalance) || 0) - (Number(a.avgMonthlyBalance) || 0));
    return byBalance[0]?.tier1Branch || byBalance[0]?.branch || rows[0]?.tier1Branch || rows[0]?.branch || '北京分行';
  },

  pickProjectLeadRow(rows) {
    return [...rows].sort((a, b) => this.parseDisbursementDate(a) - this.parseDisbursementDate(b))[0] || rows[0];
  },

  pickDefaultManager(rows, dispatchBranch) {
    const inBranch = rows.filter(r => (r.tier1Branch || r.branch) === dispatchBranch);
    const pool = inBranch.length ? inBranch : rows;
    const lead = this.pickProjectLeadRow(pool);
    return lead?.manager || pool[0]?.manager || '王磊';
  },

  mergeProjectDetails(rows) {
    const map = new Map();
    rows.forEach(r => {
      (r.projectDetails || []).forEach(p => {
        if (!p?.projectNo) return;
        if (!map.has(p.projectNo)) map.set(p.projectNo, { ...p });
      });
    });
    return [...map.values()];
  },

  dispatchRuleLabel(rule) {
    return this.DISPATCH_RULE_LABELS[rule] || rule || '—';
  },

  bucketLabel(bucket) {
    return this.BUCKET_LABELS[bucket] || bucket || '—';
  },

  buildGroups(taskId, formals, candidates) {
    const candidatesById = new Map((candidates || []).map(c => [c.id, c]));
    const confirmed = (formals || []).filter(f => f.taskId === taskId && f.status === 'confirmed');
    const byCredit = new Map();

    confirmed.forEach(f => {
      const cand = candidatesById.get(f.customerId);
      const key = this.resolveCreditCode(f, cand);
      if (!byCredit.has(key)) byCredit.set(key, []);
      byCredit.get(key).push({ formal: f, candidate: cand });
    });

    const groups = [];
    let seq = 0;

    byCredit.forEach((items, creditCode) => {
      const nonProject = items.filter(x => this.isNonProjectBucket(x.formal, x.candidate));
      const project = items.filter(x => this.isProjectBucket(x.formal, x.candidate));
      const customerName = items[0]?.formal?.customerName || items[0]?.candidate?.customerName || '—';

      if (nonProject.length) {
        const rows = nonProject.map(x => x.formal);
        const branches = this.unique(rows.map(r => r.tier1Branch || r.branch));
        const investCodes = this.unique(nonProject.map(x => this.investIndustryCode(x.formal, x.candidate)));
        const multiInvest = investCodes.length > 1;
        const accountingIndustryCode = multiInvest
          ? this.customerIndustryCode(rows[0], nonProject[0].candidate)
          : (investCodes[0] || this.customerIndustryCode(rows[0], nonProject[0].candidate));
        const dispatchBranch = branches.length === 1 ? branches[0] : this.pickGroupLeadBranch(rows, candidatesById);
        const dispatchRule = branches.length === 1 ? 'single_branch' : 'group_lead';
        seq += 1;
        groups.push({
          id: `G${taskId}_${seq}`,
          taskId,
          creditCode: creditCode.startsWith('NAME:') ? '' : creditCode,
          customerName,
          bucket: 'non_project',
          projectNo: '',
          projectName: '',
          memberFormalIds: rows.map(r => r.id),
          memberCount: rows.length,
          dispatchBranch,
          dispatchRule,
          assignedManager: this.pickDefaultManager(rows, dispatchBranch),
          assignedManagerSource: 'auto',
          accountingIndustryCode,
          accountingIndustryLabel: this.customerIndustryLabel(rows[0], nonProject[0].candidate, accountingIndustryCode),
          accountingIndustrySource: multiInvest ? 'customer' : (investCodes[0] ? 'invest' : 'customer'),
          aggregatedAvgBalance: this.sum(rows, r => r.avgMonthlyBalance),
          customerRevenue: this.pickCustomerLevelField(rows, 'operatingRevenue'),
          customerTotalAssets: this.pickCustomerLevelField(rows, 'totalAssets'),
          groupLeadBranch: this.pickGroupLeadBranch(rows, candidatesById),
          status: 'pending',
          supplementId: null
        });
      }

      const byLoanTypeCreditRef = new Map();
      project.forEach(({ formal, candidate }) => {
        const creditRef = this.formalCreditRefNo(formal) || `UNKNOWN_${formal.id}`;
        const loanType = this.formalLoanType(formal) || 'UNKNOWN_TYPE';
        const pkey = `${loanType}::${creditRef}`;
        if (!byLoanTypeCreditRef.has(pkey)) byLoanTypeCreditRef.set(pkey, []);
        byLoanTypeCreditRef.get(pkey).push({ formal, candidate, creditRef, loanType });
      });

      byLoanTypeCreditRef.forEach((projItems, pkey) => {
        const creditRef = projItems[0].creditRef;
        const loanType = projItems[0].loanType;
        const rows = projItems.map(x => x.formal);
        const leadRow = this.pickProjectLeadRow(rows);
        const leadCand = candidatesById.get(leadRow.customerId);
        const branches = this.unique(rows.map(r => r.tier1Branch || r.branch));
        const dispatchBranch = leadRow.projectLeadBranch
          || leadCand?.projectLeadBranch
          || leadRow.tier1Branch
          || leadRow.branch;
        const dispatchRule = branches.length > 1 ? 'first_disbursement' : 'single_branch';
        seq += 1;
        groups.push({
          id: `G${taskId}_${seq}`,
          taskId,
          creditCode: creditCode.startsWith('NAME:') ? '' : creditCode,
          customerName,
          bucket: 'project',
          creditRefNo: creditRef.startsWith('UNKNOWN_') ? '' : creditRef,
          loanType: loanType.startsWith('UNKNOWN_') ? '' : loanType,
          projectName: this.formalProjectName(leadRow) || creditRef,
          memberFormalIds: rows.map(r => r.id),
          memberCount: rows.length,
          dispatchBranch,
          dispatchRule,
          assignedManager: leadRow.manager || leadCand?.manager || this.pickDefaultManager(rows, dispatchBranch),
          assignedManagerSource: 'auto',
          accountingIndustryCode: this.investIndustryCode(leadRow, leadCand),
          accountingIndustryLabel: leadRow.industryLabel || leadCand?.industryLabel || '—',
          accountingIndustrySource: 'project',
          aggregatedAvgBalance: this.sum(rows, r => r.avgMonthlyBalance),
          projectDetails: this.mergeProjectDetails(rows),
          projectLeadBranch: dispatchBranch,
          status: 'pending',
          supplementId: null
        });
      });
    });

    return groups;
  },

  applyGroupsToFormals(groups, formals) {
    (formals || []).forEach(f => { f.collectGroupId = null; });
    (groups || []).forEach(g => {
      g.memberFormalIds.forEach(fid => {
        const f = formals.find(x => x.id === fid);
        if (f) f.collectGroupId = g.id;
      });
    });
  },

  syncGroupSupplementState(groups, supplements) {
    (groups || []).forEach(g => {
      const members = new Set(g.memberFormalIds || []);
      const sup = (supplements || []).find(s => {
        if (!s.dispatchedAt || s.taskId !== g.taskId) return false;
        if (s.collectGroupId === g.id || s.id === g.supplementId) return true;
        return s.formalId && members.has(s.formalId);
      });
      if (sup) {
        g.supplementId = sup.id;
        sup.collectGroupId = g.id;
        g.status = sup.status === 'completed' ? 'completed' : 'dispatched';
        if (sup.manager) g.assignedManager = sup.manager;
      } else {
        g.supplementId = null;
        g.status = 'pending';
      }
    });
  }
};

window.CollectGroups = CollectGroups;
