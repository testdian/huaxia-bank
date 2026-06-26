/**
 * 企业碳账户：法人+贷款号建档，核算确认后挂载排放记录；总行/分行按一级分行过滤
 */
const CarbonAccount = {
  ACCOUNT_STATUS_LABEL: { active: '正常', disabled: '停用', cancelled: '注销' },

  isAccountActive(acc) {
    return (acc?.status || 'active') === 'active';
  },

  getProjectSubAccountCount(acc) {
    const subs = acc?.projectSubAccounts?.length
      ? acc.projectSubAccounts
      : (acc?.projectDetails || []);
    return subs.length;
  },

  appendOperationLog(acc, entry) {
    if (!acc) return;
    if (!acc.operationLogs) acc.operationLogs = [];
    acc.operationLogs.push({
      at: new Date().toLocaleString('zh-CN'),
      ...entry
    });
  },

  resolveOperatorLabel(operatorKey) {
    const role = typeof ROLES !== 'undefined' ? ROLES[operatorKey] : null;
    return role ? `${role.label}（${role.user}）` : (operatorKey || '系统');
  },

  /** 企业碳账户「核算方法」展示枚举 */
  METHOD_LABEL: {
    REPORT_AUTHORITY: '报告法权威数据',
    REPORT_OTHER: '报告法其他数据',
    ENERGY: '能源法数据',
    PRODUCT_PBOC: '产品法-人行因子数据',
    PRODUCT_BANK: '产品法-我行因子数据',
    ECONOMY_REVENUE: '经济活动法',
    ECONOMY_LOAN: '经济活动法-贷款数据'
  },

  /** 演示：产品法因子来源（行业×项目/非项目，待客户确认正式规则） */
  PRODUCT_FACTOR_PROVIDER_MOCK: {
    default: { project: 'pboc', non_project: 'bank' },
    byIndustry: {
      电力: { project: 'pboc', non_project: 'pboc' },
      钢铁: { project: 'bank', non_project: 'pboc' },
      建材: { project: 'pboc', non_project: 'bank' },
      石化: { project: 'bank', non_project: 'bank' },
      有色: { project: 'pboc', non_project: 'bank' },
      化工: { project: 'bank', non_project: 'pboc' },
      造纸: { project: 'pboc', non_project: 'pboc' },
      民航: { project: 'bank', non_project: 'pboc' }
    }
  },

  /** 当前状态允许的操作（CA003） */
  getAccountStatusActions(status) {
    const s = status || 'active';
    if (s === 'active') {
      return [
        { next: 'disabled', label: '停用' },
        { next: 'cancelled', label: '注销' }
      ];
    }
    if (s === 'disabled') return [{ next: 'active', label: '恢复' }];
    return [];
  },

  canTransitionStatus(from, to) {
    return this.getAccountStatusActions(from).some(a => a.next === to);
  },

  makeAccountId(creditCode, loanAccount) {
    const raw = `${creditCode || 'UNKNOWN'}|${loanAccount || 'UNKNOWN'}`;
    return 'CA_' + raw.replace(/[^0-9A-Za-z\u4e00-\u9fa5]/g, '_').slice(0, 48);
  },

  accountUniqueKey(creditCode, loanAccount) {
    return `${creditCode || ''}|${loanAccount || ''}`;
  },

  /** 法人+贷款号唯一：合并重复账户并重挂排放记录 */
  dedupeCarbonAccounts(accounts, records) {
    const kept = [];
    const keyToAccount = new Map();
    const idRemap = new Map();

    (accounts || []).forEach(acc => {
      const key = this.accountUniqueKey(acc.creditCode, acc.loanAccount);
      const canonical = keyToAccount.get(key);
      if (!canonical) {
        keyToAccount.set(key, acc);
        kept.push(acc);
        return;
      }
      idRemap.set(acc.id, canonical.id);
      if (!canonical.customerName && acc.customerName) canonical.customerName = acc.customerName;
      if (!canonical.industryMajor && acc.industryMajor) canonical.industryMajor = acc.industryMajor;
      if (!canonical.gbIndustryCode && acc.gbIndustryCode) canonical.gbIndustryCode = acc.gbIndustryCode;
      if (!canonical.primaryBranch && acc.primaryBranch) canonical.primaryBranch = acc.primaryBranch;
      if (acc.statusHistory?.length) {
        canonical.statusHistory = (canonical.statusHistory || []).concat(acc.statusHistory);
      }
      if (acc.status === 'cancelled') canonical.status = 'cancelled';
      else if (acc.status === 'disabled' && canonical.status === 'active') canonical.status = 'disabled';
    });

    (records || []).forEach(r => {
      if (idRemap.has(r.accountId)) r.accountId = idRemap.get(r.accountId);
    });

    return kept;
  },

  resolveLedgerRow(d, formal, calc) {
    const cand = d.candidates.find(c => c.id === formal?.customerId);
    return {
      creditCode: formal?.creditCode || cand?.creditCode || '',
      loanAccount: formal?.loanAccount || cand?.loanAccount || '',
      customerName: formal?.customerName || calc?.customerName || cand?.customerName || '-',
      tier1Branch: formal?.tier1Branch || formal?.branch || cand?.tier1Branch || cand?.branch || '-',
      handlingBranch: formal?.handlingBranch || cand?.handlingBranch || '-',
      industryMajor: formal?.industryMajor || calc?.industryMajor || cand?.industryMajor || '-',
      gbIndustryCode: formal?.gbIndustryCode || cand?.gbIndustryCode || '',
      loanType: formal?.loanType || formal?.productType || cand?.loanType || cand?.productType || '-',
      bizType: formal?.bizType || calc?.bizType || 'non_project',
      manager: formal?.manager || cand?.manager || '-'
    };
  },

  filterRecordsByRole(records, roleKey, role) {
    if (roleKey === 'hq') return records.slice();
    if (roleKey === 'branch' && role?.branch) {
      return records.filter(r => r.tier1Branch === role.branch);
    }
    return [];
  },

  filterAccountsForRole(accounts, records, roleKey, role) {
    const visibleRecords = this.filterRecordsByRole(records, roleKey, role);
    const accountIds = new Set(visibleRecords.map(r => r.accountId));
    /** 【业务规则】对象边界确认锁定后建档的账户，无排放记录也应在列表可见 */
    const visible = accounts.filter(a => {
      if (accountIds.has(a.id)) return true;
      if (a.provisionSource !== 'formal_lock') return false;
      if (roleKey === 'hq') return true;
      if (roleKey === 'branch' && role?.branch) return a.primaryBranch === role.branch;
      return false;
    });
    const uniq = [];
    const seen = new Set();
    visible.forEach(a => {
      if (seen.has(a.id)) return;
      seen.add(a.id);
      uniq.push(this.enrichAccount(a, visibleRecords));
    });
    return uniq;
  },

  enrichAccount(account, records) {
    const recs = records.filter(r => r.accountId === account.id);
    const emission = recs.reduce((s, r) => s + (Number(r.attributedEmission) || 0), 0);
    const entity = recs.reduce((s, r) => s + (Number(r.entityEmission) || 0), 0);
    return {
      ...account,
      visibleRecordCount: recs.length,
      visibleAttributedEmission: emission,
      visibleEntityEmission: entity
    };
  },

  /** 列表可选年度：排放记录年度 + 账户建档任务年度 + 年度快照 */
  getListYears(d, accounts, records) {
    const years = new Set(this.getAvailableYears(records));
    (accounts || []).forEach(a => {
      Object.keys(a.annualProfiles || {}).forEach(y => years.add(String(y)));
      if (a.taskId) {
        const t = (d.tasks || []).find(x => x.id === a.taskId);
        if (t?.year) years.add(String(t.year));
      }
    });
    return [...years].sort((a, b) => a.localeCompare(b));
  },

  resolveListYear(d, accounts, records, preferred) {
    const years = this.getListYears(d, accounts, records);
    if (!years.length) return { year: null, years: [] };
    if (preferred && preferred !== 'all' && years.includes(String(preferred))) {
      return { year: String(preferred), years };
    }
    return { year: years[years.length - 1], years };
  },

  resolveCustomerNo(d, account, formal, projectDetail) {
    if (projectDetail?.customerNo) return projectDetail.customerNo;
    if (account?.customerNo) return account.customerNo;
    const pd = formal?.projectDetails?.[0] || account?.projectDetails?.[0];
    if (pd?.customerNo) return pd.customerNo;
    const profiles = account?.annualProfiles || {};
    const profileYears = Object.keys(profiles).sort();
    if (profileYears.length && profiles[profileYears[profileYears.length - 1]]?.customerNo) {
      return profiles[profileYears[profileYears.length - 1]].customerNo;
    }
    const cand = (d.candidates || []).find(c => c.id === (formal?.customerId || account?.customerId));
    if (cand?.projectDetails?.[0]?.customerNo) return cand.projectDetails[0].customerNo;
    if (cand?.creditCode) return 'KH' + String(cand.creditCode.replace(/\D/g, '')).slice(-6);
    return '-';
  },

  /** 解析账户在指定年度的核算方法、客户号与主体排放 */
  resolveYearMetrics(d, account, year) {
    const yearStr = String(year || '');
    const formal = (d.formalList || []).find(f => f.id === account.formalId);
    const task = (d.tasks || []).find(t => t.id === account.taskId);
    const customerNo = this.resolveCustomerNo(d, account, formal, null);

    if (account.annualProfiles?.[yearStr]) {
      const p = account.annualProfiles[yearStr];
      return this._finalizeMetrics(d, account, yearStr, {
        entityEmission: p.entityEmission,
        method: p.methodLabel || p.method || '-',
        methodId: p.methodId || null,
        methodLabel: p.methodLabel,
        customerNo: p.customerNo || customerNo,
        source: p.source,
        formal,
        task,
        supplement: null,
        calc: null,
        reportDetail: p.reportDetail
      });
    }

    const recs = (d.carbonAccountRecords || []).filter(r =>
      r.accountId === account.id && String(r.year) === yearStr
    );
    if (recs.length) {
      const r = recs[recs.length - 1];
      return this._finalizeMetrics(d, account, yearStr, {
        entityEmission: r.entityEmission,
        method: r.method || '-',
        methodId: this.mapMethodId(r.method),
        customerNo,
        source: 'record',
        formal,
        task,
        supplement: null,
        calc: null
      });
    }

    const calc = (d.calculations || []).find(c =>
      c.formalId === account.formalId && c.taskId === account.taskId
    );
    const supp = (d.supplements || []).find(s =>
      s.formalId === account.formalId && s.taskId === account.taskId
    );
    if (typeof getEffectiveEntityEmission === 'function' && formal) {
      const entityEmission = getEffectiveEntityEmission(account.taskId, account.formalId);
      if (entityEmission != null && (!task?.year || String(task.year) === yearStr)) {
        const manualVal = typeof getManualEntityEmissionValue === 'function'
          ? getManualEntityEmissionValue(account.taskId, account.formalId)
          : null;
        const methodLabel = manualVal != null && typeof resolveManualAccountingMethodLabel === 'function'
          ? resolveManualAccountingMethodLabel(formal, account.taskId, d)
          : (typeof resolveSystemAccountingMethodLabel === 'function'
            ? resolveSystemAccountingMethodLabel(formal, account.taskId, d)
            : '-');
        return this._finalizeMetrics(d, account, yearStr, {
          entityEmission,
          method: methodLabel !== '—' ? methodLabel : (calc?.method || '-'),
          methodId: manualVal != null && supp
            ? (supp.approvedMethodId || Store.matchMethod(supp)?.id)
            : (calc?.methodId || this.mapMethodId(calc?.method)),
          methodLabel: methodLabel !== '—' ? methodLabel : undefined,
          customerNo,
          source: manualVal != null ? 'supplement' : (calc?.source || (formal.gelanEntityEmission != null ? 'gelan' : 'calc')),
          formal,
          task,
          supplement: manualVal != null ? supp : null,
          calc,
          reportDetail: manualVal != null
            ? (supp?.fieldData?.report || null)
            : (calc?.reportDetail || formal.gelanPrefill || null)
        });
      }
    }

    if (calc?.entityEmission != null && (!task?.year || String(task.year) === yearStr)) {
      return this._finalizeMetrics(d, account, yearStr, {
        entityEmission: calc.entityEmission,
        method: calc.method || '-',
        methodId: calc.methodId || this.mapMethodId(calc.method),
        customerNo,
        source: calc.source || 'calc',
        formal,
        task,
        supplement: null,
        calc
      });
    }

    if (formal?.gelanEntityEmission != null && task && String(task.year) === yearStr) {
      return this._finalizeMetrics(d, account, yearStr, {
        entityEmission: formal.gelanEntityEmission,
        method: '报告法',
        methodId: 'report',
        customerNo,
        source: 'gelan',
        formal,
        task,
        supplement: null,
        calc,
        reportDetail: formal.gelanPrefill ? {
          source: formal.gelanPrefill.reportSource || '其他',
          ...formal.gelanPrefill
        } : null
      });
    }

    return this._finalizeMetrics(d, account, yearStr, {
      entityEmission: null,
      method: '-',
      methodId: null,
      customerNo,
      source: null,
      formal,
      task,
      supplement: null,
      calc
    });
  },

  mapMethodId(methodName) {
    if (!methodName) return null;
    const m = (typeof GUIDE !== 'undefined' ? GUIDE.METHODS : []).find(x =>
      x.name === methodName || x.id === methodName
    );
    return m?.id || null;
  },

  getReportDataSource(ctx) {
    const reportDetail = ctx.reportDetail;
    const supp = ctx.supplement;
    const formal = ctx.formal;
    const calc = ctx.calc;
    if (reportDetail?.source) return reportDetail.source;
    if (supp?.fieldData?.reportAuthority?.source) return supp.fieldData.reportAuthority.source;
    if (supp?.fieldData?.reportOther?.source) return supp.fieldData.reportOther.source;
    if (supp?.fieldData?.report?.source) return supp.fieldData.report.source;
    if (formal?.gelanPrefill?.reportSource) return formal.gelanPrefill.reportSource;
    if (calc?.source === 'gelan' || formal?.gelanEntityEmission != null) {
      return typeof GELAN_REPORT_DATA_SOURCE !== 'undefined' ? GELAN_REPORT_DATA_SOURCE : '其他';
    }
    if (supp?.disclosureChannel && supp?.methodId === 'report') return supp.disclosureChannel;
    return null;
  },

  resolveReportMethodLabel(reportSource) {
    const other = typeof GELAN_REPORT_DATA_SOURCE !== 'undefined' ? GELAN_REPORT_DATA_SOURCE : '其他';
    if (!reportSource || reportSource === other) return this.METHOD_LABEL.REPORT_OTHER;
    return this.METHOD_LABEL.REPORT_AUTHORITY;
  },

  resolveProductMethodLabel(formal, account) {
    const industry = formal?.industryMajor || account?.industryMajor || '';
    const bizType = formal?.bizType || account?.bizType || 'non_project';
    const key = bizType === 'project' ? 'project' : 'non_project';
    const map = this.PRODUCT_FACTOR_PROVIDER_MOCK.byIndustry[industry]
      || this.PRODUCT_FACTOR_PROVIDER_MOCK.default;
    return map[key] === 'pboc'
      ? this.METHOD_LABEL.PRODUCT_PBOC
      : this.METHOD_LABEL.PRODUCT_BANK;
  },

  /** 企业碳账户核算方法展示名（七类枚举） */
  resolveAccountMethodLabel(d, ctx) {
    if (ctx.methodLabel) return ctx.methodLabel;
    const formal = ctx.formal;
    const account = ctx.account;
    const calc = ctx.calc;
    let methodId = ctx.methodId || calc?.methodId || null;
    if (!methodId && ctx.supplement && typeof Store !== 'undefined') {
      methodId = Store.matchMethod(ctx.supplement)?.id || null;
    }
    if (ctx.source === 'gelan' || calc?.source === 'gelan' || formal?.gelanEntityEmission != null) {
      return this.resolveReportMethodLabel(this.getReportDataSource(ctx));
    }
    if (methodId === 'report' || calc?.methodId === 'report') {
      return this.resolveReportMethodLabel(this.getReportDataSource(ctx));
    }
    if (methodId === 'energy') return this.METHOD_LABEL.ENERGY;
    if (methodId === 'product') return this.resolveProductMethodLabel(formal, account);
    if (methodId === 'economy' || calc?.source === 'economy_direct') {
      return this.METHOD_LABEL.ECONOMY_REVENUE;
    }
    if (methodId === 'economy_fallback') return this.METHOD_LABEL.ECONOMY_LOAN;
    return ctx.method || '-';
  },

  _finalizeMetrics(d, account, yearStr, metrics) {
    const calc = metrics.calc || (d.calculations || []).find(c =>
      c.formalId === account.formalId && c.taskId === account.taskId
    );
    const reportDetail = metrics.reportDetail
      || account.annualProfiles?.[yearStr]?.reportDetail
      || calc?.reportDetail
      || null;
    const supplement = metrics.supplement || (d.supplements || []).find(s =>
      s.formalId === account.formalId && s.taskId === account.taskId
    );
    const formal = metrics.formal || (d.formalList || []).find(f => f.id === account.formalId);
    const methodLabel = this.resolveAccountMethodLabel(d, {
      ...metrics,
      account,
      calc,
      supplement,
      reportDetail,
      formal,
      methodId: metrics.methodId || calc?.methodId
    });
    return {
      ...metrics,
      calc,
      supplement,
      reportDetail,
      formal,
      methodLabel,
      method: methodLabel
    };
  },

  /** 企业碳账户列表行：主账户每年一行，项目贷款追加子账户行 */
  buildAccountListRows(d, accounts, year) {
    const rows = [];
    (accounts || []).forEach(acc => {
      const metrics = this.resolveYearMetrics(d, acc, year);
      const formal = metrics.formal;
      const cand = (d.candidates || []).find(c =>
        c.id === (formal?.customerId || acc.customerId)
      );
      const enterpriseName = this.resolveEnterpriseDisplayName(cand, formal, acc);
      const projects = (Array.isArray(acc.projectDetails) && acc.projectDetails.length
        ? acc.projectDetails
        : resolveFormalProjectDetails(formal || acc, cand));
      rows.push({
        rowId: `${acc.id}|${year}|main`,
        accountId: acc.id,
        isSubAccount: false,
        year: String(year),
        customerName: enterpriseName,
        creditCode: acc.creditCode || '-',
        customerNo: metrics.customerNo || '-',
        method: metrics.method || '-',
        entityEmission: metrics.entityEmission,
        account: acc,
        metrics
      });
      const isProjectLoan = acc.bizType === 'project' || formal?.bizType === 'project' ||
        projects.length > 0;
      if (isProjectLoan && projects.length) {
        projects.forEach((p, idx) => {
          const subStore = (acc.projectSubAccounts || []).find(x => x.projectNo === p.projectNo);
          const subProfile = subStore?.annualProfiles?.[String(year)] || {};
          rows.push({
            rowId: `${acc.id}|${year}|sub|${p.projectNo || idx}`,
            accountId: acc.id,
            isSubAccount: true,
            projectNo: p.projectNo || ('P' + (idx + 1)),
            year: String(year),
            customerName: p.customerName || enterpriseName,
            creditCode: p.creditCode || acc.creditCode || '-',
            customerNo: p.customerNo || metrics.customerNo || '-',
            method: subProfile.methodLabel || subProfile.method || metrics.methodLabel || metrics.method || '-',
            entityEmission: subProfile.entityEmission ?? metrics.entityEmission,
            account: acc,
            project: p,
            metrics: { ...metrics, ...subProfile }
          });
        });
      }
    });
    return rows;
  },

  _isInvalidDemoCustomerName(name) {
    if (!name || name === '-') return true;
    return /样本|【收集测试】|配套工程|项目子账户|演示客户/.test(name)
      || /(北京|上海|深圳|杭州|南京|成都).{0,3}样本/.test(name);
  },

  _formatDemoCompanyName(major, idx) {
    if (typeof CandidateSync !== 'undefined') {
      return CandidateSync.formatCompanyName(major, idx);
    }
    const roots = ['华能', '国电', '大唐', '宝钢', '河钢', '万华', '中建', '海螺'];
    const mid = major === '电力' ? '发电' : (major === '钢铁' ? '炼钢' : '');
    return `${roots[idx % roots.length]}${mid}有限公司`;
  },

  resolveEnterpriseDisplayName(cand, formal, acc) {
    const pick = [cand?.customerName, formal?.customerName, acc?.customerName];
    for (const n of pick) {
      if (n && !this._isInvalidDemoCustomerName(n)) return n;
    }
    const major = formal?.industryMajor || acc?.industryMajor || cand?.industryMajor || '电力';
    const idx = parseInt(String(acc?.id || formal?.id || cand?.id || '0').replace(/\D/g, ''), 10) || 0;
    return this._formatDemoCompanyName(major, idx);
  },

  fixInvalidLedgerCustomerNames(d) {
    const majors = (typeof GUIDE !== 'undefined' && GUIDE.INDUSTRIES)
      ? GUIDE.INDUSTRIES.map(i => i.major)
      : ['电力', '钢铁', '建材', '化工', '有色', '石化', '造纸', '民航'];
    (d.formalList || []).forEach((f, i) => {
      if (!this._isInvalidDemoCustomerName(f.customerName)) return;
      const idx = parseInt(String(f.id || i).replace(/\D/g, ''), 10) || (880 + i);
      const name = this._formatDemoCompanyName(f.industryMajor || majors[i % majors.length], idx);
      f.customerName = name;
      const cand = (d.candidates || []).find(c => c.id === f.customerId);
      if (cand && this._isInvalidDemoCustomerName(cand.customerName)) cand.customerName = name;
      (d.supplements || []).filter(s => s.formalId === f.id).forEach(s => {
        if (this._isInvalidDemoCustomerName(s.customerName)) s.customerName = name;
      });
    });
  },

  /** 从台账同步企业名称，并修正批量演示中的非规范名称 */
  syncCustomerNamesFromLedger(d) {
    this.fixInvalidLedgerCustomerNames(d);
    const majors = (typeof GUIDE !== 'undefined' && GUIDE.INDUSTRIES)
      ? GUIDE.INDUSTRIES.map(i => i.major)
      : ['电力', '钢铁', '建材', '化工', '有色', '石化', '造纸', '民航'];
    (d.carbonAccounts || []).forEach((acc, i) => {
      const formal = (d.formalList || []).find(f => f.id === acc.formalId);
      const cand = formal
        ? (d.candidates || []).find(c => c.id === formal.customerId)
        : (d.candidates || []).find(c => c.creditCode === acc.creditCode && c.loanAccount === acc.loanAccount);
      let name = this.resolveEnterpriseDisplayName(cand, formal, acc);
      if (!name || this._isInvalidDemoCustomerName(name)) {
        const major = acc.industryMajor || formal?.industryMajor || majors[i % majors.length];
        const idx = parseInt(String(acc.id || i).replace(/\D/g, ''), 10) || i;
        name = this._formatDemoCompanyName(major, idx);
      }
      acc.customerName = name;
      if (formal && this._isInvalidDemoCustomerName(formal.customerName)) formal.customerName = name;
      if (cand && this._isInvalidDemoCustomerName(cand.customerName)) cand.customerName = name;
      (acc.projectDetails || []).forEach(p => {
        if (!p.customerName || p.customerName === p.projectName || this._isInvalidDemoCustomerName(p.customerName)) {
          p.customerName = name;
        }
      });
      (d.carbonAccountRecords || []).filter(r => r.accountId === acc.id).forEach(r => {
        if (name) r.customerName = name;
      });
    });
  },

  /** 格澜/直算等写入任务数据后，同步更新企业碳账户年度主体排放 */
  syncEntityFromFormalEmission(d, taskId, formal, payload) {
    if (!formal) return null;
    const row = this.resolveLedgerRow(d, formal, payload);
    const acc = this.upsertAccount(d, row);
    acc.formalId = formal.id;
    acc.taskId = taskId;
    acc.provisionSource = acc.provisionSource || 'formal_lock';
    const cand = (d.candidates || []).find(c => c.id === formal.customerId);
    acc.projectDetails = resolveFormalProjectDetails(formal, cand);
    acc.bizType = formal.bizType || row.bizType || acc.bizType;
    const task = (d.tasks || []).find(t => t.id === taskId);
    const year = String(task?.year || new Date().getFullYear());
    const customerNo = this.resolveCustomerNo(d, acc, formal, null);
    if (!acc.annualProfiles) acc.annualProfiles = {};
    const reportDetail = payload.reportDetail || null;
    const methodLabel = this.resolveAccountMethodLabel(d, {
      methodId: payload.methodId,
      formal,
      calc: payload,
      reportDetail,
      source: payload.source,
      account: acc
    });
    acc.annualProfiles[year] = {
      entityEmission: payload.entityEmission,
      method: methodLabel,
      methodId: payload.methodId || 'report',
      methodLabel,
      customerNo,
      source: payload.source || 'gelan',
      updatedAt: new Date().toLocaleString('zh-CN'),
      reportDetail
    };
    acc.customerNo = customerNo;
    if (acc.projectDetails.length) {
      acc.projectSubAccounts = acc.projectDetails.map(p => ({
        projectNo: p.projectNo,
        customerNo: p.customerNo,
        customerName: p.customerName,
        creditCode: p.creditCode || row.creditCode,
        annualProfiles: {
          [year]: {
            entityEmission: payload.entityEmission,
            method: methodLabel,
            methodId: payload.methodId || 'report',
            methodLabel,
            source: payload.source || 'gelan',
            reportDetail
          }
        }
      }));
    }
    return acc;
  },

  /** 手工保存碳账户档案（账户列表「编辑」入口） */
  saveAccountProfile(d, accountId, year, subProjectNo, payload, operator) {
    const acc = (d.carbonAccounts || []).find(a => a.id === accountId);
    if (!acc || !payload) return null;
    if (!this.isAccountActive(acc)) return null;
    const yearStr = String(year || new Date().getFullYear());
    const methodLabel = payload.methodLabel || '-';
    const methodId = this._methodIdFromLabel(methodLabel);
    const reportDetail = payload.reportDetail || null;
    const profilePatch = {
      entityEmission: payload.entityEmission,
      method: methodLabel,
      methodLabel,
      methodId: payload.methodId || methodId,
      customerNo: payload.customerNo,
      source: 'manual',
      updatedAt: new Date().toLocaleString('zh-CN'),
      reportDetail
    };
    if (payload.supplementSnapshot) {
      profilePatch.supplementSnapshot = payload.supplementSnapshot;
    }

    if (subProjectNo) {
      const sub = (acc.projectSubAccounts || []).find(x => String(x.projectNo) === String(subProjectNo));
      if (sub) {
        if (!sub.annualProfiles) sub.annualProfiles = {};
        sub.annualProfiles[yearStr] = { ...(sub.annualProfiles[yearStr] || {}), ...profilePatch };
        if (payload.customerName) sub.customerName = payload.customerName;
        if (payload.creditCode) sub.creditCode = payload.creditCode;
        if (payload.customerNo) sub.customerNo = payload.customerNo;
      }
      const pd = (acc.projectDetails || []).find(p => String(p.projectNo) === String(subProjectNo));
      if (pd) {
        if (payload.customerName) pd.customerName = payload.customerName;
        if (payload.creditCode) pd.creditCode = payload.creditCode;
        if (payload.customerNo) pd.customerNo = payload.customerNo;
      }
    } else {
      if (payload.customerName) acc.customerName = payload.customerName;
      if (payload.creditCode) acc.creditCode = payload.creditCode;
      if (payload.customerNo) acc.customerNo = payload.customerNo;
      if (!acc.annualProfiles) acc.annualProfiles = {};
      acc.annualProfiles[yearStr] = { ...(acc.annualProfiles[yearStr] || {}), ...profilePatch };
    }

    (d.carbonAccountRecords || []).forEach(r => {
      if (r.accountId !== accountId || String(r.year) !== yearStr) return;
      if (payload.entityEmission != null) r.entityEmission = payload.entityEmission;
      if (methodLabel) r.method = methodLabel;
    });
    acc.profileEditedAt = new Date().toLocaleString('zh-CN');
    const subLabel = subProjectNo ? `项目子账户 ${subProjectNo}` : '主账户';
    this.appendOperationLog(acc, {
      action: 'profile_edit',
      actionLabel: '档案编辑',
      summary: `${yearStr} 年度${subLabel}档案已更新`,
      operator: operator || '系统',
      year: yearStr,
      subProjectNo: subProjectNo || null,
      detail: {
        customerName: payload.customerName,
        methodLabel: payload.methodLabel,
        entityEmission: payload.entityEmission
      }
    });
    return acc;
  },

  /** 变更账户状态（主账户与项目子账户同步） */
  transitionAccountStatus(d, accountId, nextStatus, operatorKey) {
    const acc = (d.carbonAccounts || []).find(a => a.id === accountId);
    if (!acc) return { ok: false, message: '未找到碳账户' };
    const cur = acc.status || 'active';
    if (!this.canTransitionStatus(cur, nextStatus)) {
      return { ok: false, message: '当前状态不允许该操作' };
    }
    const operator = this.resolveOperatorLabel(operatorKey);
    const subCount = this.getProjectSubAccountCount(acc);
    const at = new Date().toLocaleString('zh-CN');
    if (!acc.statusHistory) acc.statusHistory = [];
    acc.statusHistory.push({ from: cur, to: nextStatus, at, operator });
    const toLabel = this.ACCOUNT_STATUS_LABEL[nextStatus] || nextStatus;
    const fromLabel = this.ACCOUNT_STATUS_LABEL[cur] || cur;
    const subRemark = subCount > 0 ? `同步影响 ${subCount} 个项目子账户` : '无项目子账户';
    this.appendOperationLog(acc, {
      action: 'status_change',
      actionLabel: '状态变更',
      summary: `${fromLabel} → ${toLabel}`,
      operator,
      from: cur,
      to: nextStatus,
      fromLabel,
      toLabel,
      remark: subRemark,
      subAccountCount: subCount
    });
    acc.status = nextStatus;
    acc.statusChangedAt = at;
    (acc.projectSubAccounts || []).forEach(sub => {
      sub.status = nextStatus;
    });
    const label = toLabel;
    return {
      ok: true,
      message: subCount > 0
        ? `账户已${label}（含 ${subCount} 个项目子账户）`
        : `账户已${label}`
    };
  },

  _methodIdFromLabel(label) {
    const text = String(label || '');
    if (text.includes('能源')) return 'energy';
    if (text.includes('产品法')) return 'product';
    if (text.includes('贷款')) return 'economy_fallback';
    if (text.includes('营收') || text.includes('经济')) return 'economy';
    return 'report';
  },

  getAccountOperationLogs(acc) {
    const logs = [];
    (acc?.operationLogs || []).forEach(item => logs.push({ ...item }));
    if (!logs.length && acc?.statusHistory?.length) {
      acc.statusHistory.forEach(h => {
        logs.push({
          at: h.at,
          action: 'status_change',
          actionLabel: '状态变更',
          summary: `${this.ACCOUNT_STATUS_LABEL[h.from] || h.from || '-'} → ${this.ACCOUNT_STATUS_LABEL[h.to] || h.to || '-'}`,
          operator: h.operator,
          remark: '历史记录迁移'
        });
      });
    }
    return logs.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
  },

  aggregateBy(records, keyFn) {
    const map = {};
    records.forEach(r => {
      const k = keyFn(r) || '其他';
      if (!map[k]) map[k] = { label: k, count: 0, emission: 0, entity: 0 };
      map[k].count += 1;
      map[k].emission += Number(r.attributedEmission) || 0;
      map[k].entity += Number(r.entityEmission) || 0;
    });
    const total = Object.values(map).reduce((s, i) => s + i.emission, 0) || 1;
    return Object.values(map)
      .map(i => ({ ...i, share: +((100 * i.emission) / total).toFixed(1) }))
      .sort((a, b) => b.emission - a.emission);
  },

  /** 趋势分析：汇总该客户（法人+贷款号）全部核算年度的排放记录 */
  collectTrendRecordsForAccount(d, account) {
    if (!account) return [];
    const key = this.accountUniqueKey(account.creditCode, account.loanAccount);
    const matchRow = row => this.accountUniqueKey(row?.creditCode, row?.loanAccount) === key;
    const records = [];
    const calcIds = new Set();

    (d.carbonAccountRecords || []).forEach(r => {
      if (r.accountId !== account.id && !matchRow(r)) return;
      records.push(r);
      if (r.calcId) calcIds.add(r.calcId);
    });

    (d.tasks || []).forEach(task => {
      if (!task?.resultsConfirmed) return;
      (d.calculations || []).forEach(calc => {
        if (calc.taskId !== task.id || calc.status !== 'done' || calc.entityEmission == null) return;
        if (calcIds.has(calc.id)) return;
        const formal = (d.formalList || []).find(f => f.id === calc.formalId);
        if (!formal || formal.status !== 'confirmed') return;
        const row = this.resolveLedgerRow(d, formal, calc);
        if (!matchRow(row)) return;
        records.push(this.buildRecordPayload(d, task, formal, calc, account.id));
        calcIds.add(calc.id);
      });
    });

    Object.keys(account.annualProfiles || {}).forEach(yearStr => {
      if (records.some(r => String(r.year) === yearStr)) return;
      const p = account.annualProfiles[yearStr];
      records.push({
        accountId: account.id,
        creditCode: account.creditCode,
        loanAccount: account.loanAccount,
        customerName: account.customerName,
        year: yearStr,
        period: yearStr,
        entityEmission: p.entityEmission,
        attributedEmission: p.attributedEmission ?? null,
        operatingRevenue: p.operatingRevenue ?? p.revenue,
        method: p.methodLabel || p.method
      });
    });

    return records;
  },

  trendByYear(records) {
    const map = {};
    records.forEach(r => {
      const y = String(r.year || r.period || '-');
      if (!map[y]) map[y] = { year: y, emission: 0, entity: 0, count: 0, revenue: 0 };
      map[y].emission += Number(r.attributedEmission) || 0;
      map[y].entity += Number(r.entityEmission) || 0;
      map[y].count += 1;
      map[y].revenue += Number(r.operatingRevenue ?? r.revenue) || 0;
    });
    return Object.values(map)
      .map(row => ({
        ...row,
        label: row.year,
        intensity: row.revenue > 0 ? +((row.entity / row.revenue).toFixed(4)) : null
      }))
      .sort((a, b) => String(a.year).localeCompare(String(b.year)));
  },

  /** 主体碳强度趋势 tCO₂e / 万元营业收入（主体口径） */
  trendIntensityByYear(records) {
    return this.trendByYear(records).filter(t => t.intensity != null);
  },

  /** 补齐列表可选年度，避免趋势图 X 轴缺少年份 */
  fillTrendYearGaps(trend, years) {
    const map = {};
    (trend || []).forEach(t => { map[String(t.year)] = t; });
    const allYears = [...new Set([
      ...(years || []).map(y => String(y)),
      ...(trend || []).map(t => String(t.year))
    ])].filter(Boolean).sort((a, b) => a.localeCompare(b));
    return allYears.map(y => map[y] || {
      year: y,
      label: y,
      emission: null,
      entity: null,
      count: 0,
      revenue: null,
      intensity: null
    });
  },

  getAvailableYears(records) {
    return [...new Set((records || []).map(r => String(r.year)).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  },

  resolveAccountingYear(records, preferred) {
    const years = this.getAvailableYears(records);
    if (!years.length) return { year: null, years };
    if (preferred && preferred !== 'all' && years.includes(String(preferred))) {
      return { year: String(preferred), years };
    }
    return { year: years[years.length - 1], years };
  },

  filterRecords(records, filters = {}) {
    let list = records.slice();
    const year = filters.year != null && filters.year !== '' ? String(filters.year) : '';
    if (year) list = list.filter(r => String(r.year) === year);
    const productType = filters.productType || filters.loanType;
    if (productType) {
      list = list.filter(r => caRecordProductType(r) === productType);
    }
    if (filters.industry) list = list.filter(r => r.industryMajor === filters.industry);
    if (filters.branch) {
      list = list.filter(r => r.handlingBranch === filters.branch || r.tier1Branch === filters.branch);
    }
    if (filters.bizType) list = list.filter(r => r.bizType === filters.bizType);
    const kw = (filters.keyword || '').trim().toLowerCase();
    if (kw) {
      list = list.filter(r => {
        const row = caRecordAsCandidateRow(r);
        return String(r.year).includes(kw) ||
          (r.customerName || '').toLowerCase().includes(kw) ||
          (row.loanAccount || '').toLowerCase().includes(kw) ||
          (r.handlingBranch || '').toLowerCase().includes(kw) ||
          caRecordProductType(r).toLowerCase().includes(kw) ||
          (r.industryMajor || '').toLowerCase().includes(kw) ||
          (r.method || '').toLowerCase().includes(kw);
      });
    }
    return list;
  },

  recordIntensity(r) {
    const bal = Number(r.avgBalance) || 0;
    const em = Number(r.attributedEmission) || 0;
    if (bal <= 0) return null;
    return +((em / bal) * 10000).toFixed(4);
  },

  formatIntensity(n) {
    if (n == null || Number.isNaN(n)) return '-';
    return Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 4 });
  },

  parseYearFromDateTime(s) {
    const m = String(s || '').match(/^(\d{4})/);
    return m ? Number(m[1]) : null;
  },

  /** 核算完成时间落在核算年度的上一年（核算年度 = 完成时间年份 + 1） */
  completionTimeForAccountingYear(accountingYear, salt = 0) {
    const accYear = Number(accountingYear);
    const y = accYear - 1;
    if (!accYear || y < 1900) return `${accYear || new Date().getFullYear()}-01-15 10:00:00`;
    const seed = Math.abs(Number(salt) || 0);
    const m = (seed % 12) + 1;
    const d = (seed % 28) + 1;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} 10:00:00`;
  },

  alignRecordYearCompletion(record) {
    if (!record) return record;
    const accYear = Number(record.year);
    if (!accYear) return record;
    const salt = String(record.id || record.calcId || '').split('')
      .reduce((s, c) => s + c.charCodeAt(0), 0);
    const confYear = this.parseYearFromDateTime(record.confirmedAt || record.mountedAt);
    if (confYear == null || confYear >= accYear) {
      record.confirmedAt = this.completionTimeForAccountingYear(accYear, salt);
    }
    if (record.mountedAt) record.mountedAt = record.confirmedAt;
    record.period = String(record.year);
    return record;
  },

  buildRecordPayload(d, task, formal, calc, accountId) {
    const row = this.resolveLedgerRow(d, formal, calc);
    const cand = (d.candidates || []).find(c => c.id === formal?.customerId);
    const year = Number(task?.year) || new Date().getFullYear();
    const salt = String(calc?.id || formal?.id || '').split('')
      .reduce((s, c) => s + c.charCodeAt(0), 0);
    let confirmedAt = task?.resultsConfirmedAt || calc?.confirmedAt || '';
    const confYear = this.parseYearFromDateTime(confirmedAt);
    if (!confirmedAt || confYear == null || confYear >= year) {
      confirmedAt = this.completionTimeForAccountingYear(year, salt);
    }
    return {
      id: 'CAR_' + calc.id,
      accountId,
      taskId: task.id,
      calcId: calc.id,
      formalId: formal.id,
      creditCode: row.creditCode,
      loanAccount: row.loanAccount,
      customerName: row.customerName,
      tier1Branch: row.tier1Branch,
      handlingBranch: row.handlingBranch,
      industryMajor: row.industryMajor,
      gbIndustryCode: row.gbIndustryCode,
      industryLabel: cand?.industryLabel ?? formal?.industryLabel,
      productType: cand?.productType || formal?.productType || cand?.loanType || row.loanType,
      loanType: row.loanType,
      disbursementAmount: cand?.disbursementAmount ?? formal?.disbursementAmount,
      disbursementDate: cand?.disbursementDate ?? formal?.disbursementDate,
      borrowerType: cand?.borrowerType ?? formal?.borrowerType,
      avgMonthlyBalance: cand?.avgMonthlyBalance ?? formal?.avgMonthlyBalance,
      operatingRevenue: cand?.operatingRevenue ?? formal?.operatingRevenue ?? cand?.revenue,
      bizType: row.bizType,
      bizLabel: row.bizType === 'project' ? '项目贷款' : '非项目贷款',
      manager: row.manager,
      entityEmission: calc.entityEmission,
      attributedEmission: calc.attributedEmission,
      avgBalance: calc.avgBalance,
      year,
      period: String(year),
      method: calc.method,
      confirmedAt,
      status: 'confirmed'
    };
  },

  upsertAccount(d, row, openedAt) {
    const id = this.makeAccountId(row.creditCode, row.loanAccount);
    let acc = d.carbonAccounts.find(a => a.id === id);
    if (!acc) {
      acc = {
        id,
        creditCode: row.creditCode,
        loanAccount: row.loanAccount,
        customerName: row.customerName,
        industryMajor: row.industryMajor,
        gbIndustryCode: row.gbIndustryCode,
        primaryBranch: row.tier1Branch,
        status: 'active',
        openedAt: openedAt || new Date().toLocaleString('zh-CN'),
        statusHistory: []
      };
      d.carbonAccounts.push(acc);
    } else {
      if (!acc.customerName && row.customerName) acc.customerName = row.customerName;
      if (!acc.industryMajor && row.industryMajor) acc.industryMajor = row.industryMajor;
    }
    return acc;
  },

  /**
   * 【业务规则】对象边界「确认锁定」后，按正式清单逐笔生成企业碳账户（法人+贷款号）
   * 有项目明细的账户保留 projectDetails，供列表展开展示项目客户名称
   */
  provisionFromFormalLock(d, taskId, formals) {
    d.carbonAccounts = d.carbonAccounts || [];
    if (!formals?.length) return 0;
    const openedAt = new Date().toLocaleString('zh-CN');
    let count = 0;
    formals.forEach(f => {
      if (f.status !== 'confirmed') return;
      const row = this.resolveLedgerRow(d, f, null);
      if (!row.creditCode || !row.loanAccount) return;
      const acc = this.upsertAccount(d, row, openedAt);
      acc.formalId = f.id;
      acc.taskId = taskId;
      acc.provisionSource = 'formal_lock';
      acc.provisionedAt = acc.provisionedAt || openedAt;
      acc.customerName = row.customerName;
      acc.primaryBranch = row.tier1Branch || acc.primaryBranch;
      const cand = (d.candidates || []).find(c => c.id === f.customerId);
      acc.projectDetails = resolveFormalProjectDetails(f, cand);
      acc.bizType = f.bizType || acc.bizType;
      acc.accountingType = f.accountingType || null;
      acc.loanType = row.loanType;
      count++;
    });
    return count;
  },

  /** 为历史已锁定清单补建碳账户（迁移/演示种子） */
  backfillProvisionFromLockedFormals(d) {
    const taskIds = [...new Set((d.formalList || [])
      .filter(f => f.status === 'confirmed')
      .map(f => f.taskId))];
    let total = 0;
    taskIds.forEach(taskId => {
      const formals = d.formalList.filter(f => f.taskId === taskId && f.status === 'confirmed');
      total += this.provisionFromFormalLock(d, taskId, formals);
    });
    return total;
  },

  /** 仅核算已确认结果的任务、且计算完成的记录 */
  syncTask(d, taskId) {
    d.carbonAccounts = d.carbonAccounts || [];
    d.carbonAccountRecords = d.carbonAccountRecords || [];
    const task = d.tasks.find(t => t.id === taskId);
    if (!task?.resultsConfirmed) return { accounts: 0, records: 0 };

    const formals = d.formalList.filter(f => f.taskId === taskId && f.status === 'confirmed');
    const calcs = d.calculations.filter(c =>
      c.taskId === taskId && c.status === 'done' && c.attributedEmission != null
    );
    let added = 0;
    calcs.forEach(calc => {
      const formal = formals.find(f => f.id === calc.formalId);
      if (!formal) return;
      const row = this.resolveLedgerRow(d, formal, calc);
      if (!row.creditCode || !row.loanAccount) return;
      const acc = this.upsertAccount(d, row);
      const existing = d.carbonAccountRecords.find(r => r.id === 'CAR_' + calc.id);
      const payload = this.buildRecordPayload(d, task, formal, calc, acc.id);
      if (existing) {
        Object.assign(existing, payload);
      } else {
        d.carbonAccountRecords.push(payload);
        added += 1;
      }
    });
    return { accounts: d.carbonAccounts.length, records: added };
  },

  backfillAll(d) {
    d.carbonAccounts = [];
    d.carbonAccountRecords = [];
    (d.tasks || []).forEach(t => {
      if (t.resultsConfirmed) this.syncTask(d, t.id);
    });
  },

  buildFromSeed(tasks, candidates, formalList, calculations) {
    const d = {
      tasks,
      candidates,
      formalList,
      calculations,
      carbonAccounts: [],
      carbonAccountRecords: []
    };
    tasks.forEach(t => {
      const locked = formalList.filter(f => f.taskId === t.id && f.status === 'confirmed');
      if (locked.length) this.provisionFromFormalLock(d, t.id, locked);
      if (t.resultsConfirmed) this.syncTask(d, t.id);
    });
    return { carbonAccounts: d.carbonAccounts, carbonAccountRecords: d.carbonAccountRecords };
  },

  /**
   * 大批量演示数据（与核算挂载数据合并）
   * @param {object} base - 已有 accounts / records
   * @param {object} opts - accountTarget, recordTarget
   */
  buildBulkDemoData(base, opts) {
    const options = opts || {};
    const accountTarget = options.accountTarget ?? 500;
    const recordTarget = options.recordTarget ?? 1800;
    const accounts = (base?.carbonAccounts || []).slice();
    const records = (base?.carbonAccountRecords || []).slice();
    const recordIds = new Set(records.map(r => r.id));
    const accountIds = new Set(accounts.map(a => a.id));

    const branchConfig = [
      { tier1: '北京分行', handling: ['北京营业部', '朝阳支行', '海淀支行', '丰台支行'] },
      { tier1: '上海分行', handling: ['上海营业部', '浦东支行', '闵行支行', '宝山支行'] },
      { tier1: '深圳分行', handling: ['深圳营业部', '南山支行', '福田支行'] },
      { tier1: '杭州分行', handling: ['杭州营业部', '西湖支行', '滨江支行'] },
      { tier1: '南京分行', handling: ['南京营业部', '鼓楼支行', '江宁支行'] },
      { tier1: '成都分行', handling: ['成都营业部', '锦江支行', '高新支行'] }
    ];
    const industries = (typeof GUIDE !== 'undefined' && GUIDE.INDUSTRIES)
      ? GUIDE.INDUSTRIES
      : [
        { major: '电力', codes: ['D4411'] },
        { major: '建材', codes: ['C3011'] },
        { major: '钢铁', codes: ['C3120'] },
        { major: '有色', codes: ['C3216'] },
        { major: '石化', codes: ['C2511'] },
        { major: '化工', codes: ['C2614'] },
        { major: '造纸', codes: ['C2211'] },
        { major: '民航', codes: ['G5631'] }
      ];
    const loanTypes = ['流动资金贷款', '一般性固定资产贷款', '项目贷款', '短期流动资金贷款', '中期流动资金贷款'];
    const methods = (typeof GUIDE !== 'undefined' && GUIDE.METHODS)
      ? GUIDE.METHODS.map(m => m.name)
      : ['报告法', '物理活动法-能源法', '经济活动法'];
    const nameRoots = [
      '华能', '国电', '大唐', '华电', '宝钢', '首钢', '河钢', '鞍钢', '中建', '海螺',
      '中石化', '中石油', '万华', '恒力', '魏桥', '中铝', '江西铜业', '晨鸣', '太阳纸业', '首都机场'
    ];
    const years = [2022, 2023, 2024, 2025];
    const taskIds = ['T2025001', 'T2024002', 'T2023001'];
    const managers = ['王磊', '陈静', '刘洋', '赵敏', '周强', '李娜', '孙浩', '马超'];

    const ensureAccount = (row, openedAt) => {
      const acc = this.upsertAccount({ carbonAccounts: accounts }, row, openedAt);
      accountIds.add(acc.id);
      return acc;
    };

    const pushRecord = (payload) => {
      if (recordIds.has(payload.id)) return false;
      records.push(payload);
      recordIds.add(payload.id);
      return true;
    };

    let seq = records.length + 1;

    const addRecord = (acc, row, year, emissionScale) => {
      const entity = Math.round((8000 + (seq % 97) * 1370) * emissionScale);
      const attr = Math.round(entity * (0.08 + (seq % 11) * 0.012));
      const y = year;
      const mounted = this.completionTimeForAccountingYear(y, seq);
      pushRecord({
        id: 'CAR_BD_' + String(seq++).padStart(5, '0'),
        accountId: acc.id,
        taskId: taskIds[seq % taskIds.length],
        calcId: 'CAL_BD_' + seq,
        formalId: 'F_BD_' + seq,
        creditCode: row.creditCode,
        loanAccount: row.loanAccount,
        customerName: row.customerName,
        tier1Branch: row.tier1Branch,
        handlingBranch: row.handlingBranch,
        industryMajor: row.industryMajor,
        gbIndustryCode: row.gbIndustryCode,
        loanType: row.loanType,
        bizType: row.bizType,
        bizLabel: row.bizType === 'project' ? '项目贷款' : '非项目贷款',
        manager: row.manager,
        entityEmission: entity,
        attributedEmission: attr,
        avgBalance: 12000 + (seq % 80) * 650,
        year: y,
        period: String(y),
        method: methods[seq % methods.length],
        confirmedAt: mounted,
        status: 'confirmed'
      });
    };

    // 场景1：同一法人+贷款号单账户，多条排放记录（跨经办行/年度，明细页可见）
    (() => {
      const creditCode = '91310100MA0000CROSS01';
      const loanAccount = '6221000888001';
      const customerName = '华夏示范制造股份有限公司';
      const acc = ensureAccount({
        creditCode,
        loanAccount,
        customerName,
        industryMajor: '钢铁',
        gbIndustryCode: 'C3120',
        tier1Branch: '北京分行',
        handlingBranch: '北京营业部',
        loanType: '流动资金贷款',
        bizType: 'non_project',
        manager: '王磊'
      }, '2023-06-01 09:00:00');
      [
        { tier1: '北京分行', handling: '北京营业部', year: 2023 },
        { tier1: '北京分行', handling: '朝阳支行', year: 2024 },
        { tier1: '北京分行', handling: '海淀支行', year: 2024 },
        { tier1: '深圳分行', handling: '深圳营业部', year: 2024 }
      ].forEach((x, i) => {
        addRecord(acc, {
          creditCode,
          loanAccount,
          customerName,
          industryMajor: '钢铁',
          gbIndustryCode: 'C3120',
          tier1Branch: x.tier1,
          handlingBranch: x.handling,
          loanType: '流动资金贷款',
          bizType: 'non_project',
          manager: ['王磊', '陈静', '刘洋', '赵敏'][i]
        }, x.year, 1.1 + i * 0.15);
      });
    })();

    // 场景2：单账户多年度趋势
    (() => {
      const creditCode = '91110000MA0000TREND01';
      const loanAccount = '6221000888002';
      const customerName = '国电示范发电有限公司';
      const acc = ensureAccount({
        creditCode,
        loanAccount,
        customerName,
        industryMajor: '电力',
        gbIndustryCode: 'D4411',
        tier1Branch: '上海分行',
        handlingBranch: '浦东支行',
        loanType: '项目贷款',
        bizType: 'project',
        manager: '陈静'
      }, '2022-01-15 10:00:00');
      years.forEach((y, i) => {
        addRecord(acc, {
          creditCode,
          loanAccount,
          customerName,
          industryMajor: '电力',
          gbIndustryCode: 'D4411',
          tier1Branch: '上海分行',
          handlingBranch: '浦东支行',
          loanType: '项目贷款',
          bizType: 'project',
          manager: '陈静'
        }, y, 0.85 + i * 0.12);
      });
    })();

    // 场景3：集团多贷款号（同法人不同贷款）
    (() => {
      const creditCode = '91310000MA0000GROUP01';
      const customerName = '万华化学示范集团股份有限公司';
      ['6221000888101', '6221000888102', '6221000888103'].forEach((loanAccount, li) => {
        const br = branchConfig[li % branchConfig.length];
        const h = br.handling[li % br.handling.length];
        const acc = ensureAccount({
          creditCode,
          loanAccount,
          customerName,
          industryMajor: '化工',
          gbIndustryCode: 'C2614',
          tier1Branch: br.tier1,
          handlingBranch: h,
          loanType: loanTypes[li % loanTypes.length],
          bizType: li === 0 ? 'project' : 'non_project',
          manager: ['李娜', '周强', '王磊'][li]
        }, '2024-03-01 11:00:00');
        [2023, 2024].forEach(y => addRecord(acc, {
          creditCode,
          loanAccount,
          customerName,
          industryMajor: '化工',
          gbIndustryCode: 'C2614',
          tier1Branch: br.tier1,
          handlingBranch: h,
          loanType: loanTypes[li % loanTypes.length],
          bizType: acc.id.endsWith('8101') ? 'project' : 'non_project',
          manager: ['李娜', '周强', '王磊'][li]
        }, y, 1 + li * 0.2));
      });
    })();

    // 场景4：各一级分行密集样本（便于分行角色筛选）
    branchConfig.forEach((brCfg, bi) => {
      const tier1 = brCfg.tier1;
      const perBranch = tier1 === '北京分行' || tier1 === '上海分行' ? 45 : 22;
      for (let k = 0; k < perBranch; k++) {
        const i = bi * 50 + k + 500;
        const ind = industries[k % industries.length];
        const handling = brCfg.handling[k % brCfg.handling.length];
        const creditCode = '91' + String(210000 + i).padStart(6, '0') + 'MA' + String(3000 + i) + 'X';
        const loanAccount = '622' + String(3000000000000 + i * 4999).slice(-13);
        const customerName = typeof CandidateSync !== 'undefined'
          ? CandidateSync.formatCompanyName(ind.major, i)
          : `${nameRoots[k % nameRoots.length]}${ind.major === '电力' ? '发电' : ind.major === '钢铁' ? '炼钢' : ''}有限公司`;
        const acc = ensureAccount({
          creditCode,
          loanAccount,
          customerName,
          industryMajor: ind.major,
          gbIndustryCode: ind.codes[0],
          tier1Branch: tier1,
          handlingBranch: handling,
          loanType: loanTypes[k % loanTypes.length],
          bizType: k % 5 === 0 ? 'project' : 'non_project',
          manager: managers[k % managers.length]
        }, '2024-05-01 10:00:00');
        [2023, 2024, 2025].forEach(y => addRecord(acc, {
          creditCode,
          loanAccount,
          customerName,
          industryMajor: ind.major,
          gbIndustryCode: ind.codes[0],
          tier1Branch: tier1,
          handlingBranch: handling,
          loanType: loanTypes[k % loanTypes.length],
          bizType: k % 5 === 0 ? 'project' : 'non_project',
          manager: managers[k % managers.length]
        }, y, 1 + k * 0.03));
      }
    });

    while (accounts.length < accountTarget && seq < recordTarget + 500) {
      const i = accounts.length;
      const ind = industries[i % industries.length];
      const br = branchConfig[i % branchConfig.length];
      const handling = br.handling[i % br.handling.length];
      const creditCode = '91' + String(110000 + (i % 900000)).padStart(6, '0') + 'MA' + String(1000 + i).slice(-4) + 'X';
      const loanAccount = '622' + String(2000000000000 + i * 7919).slice(-13);
      const customerName = typeof CandidateSync !== 'undefined'
        ? CandidateSync.formatCompanyName(ind.major, i)
        : `${nameRoots[i % nameRoots.length]}${ind.major === '电力' ? '发电' : ind.major === '钢铁' ? '炼钢' : ''}有限公司`;
      const bizType = i % 4 === 0 ? 'project' : 'non_project';
      const row = {
        creditCode,
        loanAccount,
        customerName,
        industryMajor: ind.major,
        gbIndustryCode: ind.codes[0],
        tier1Branch: br.tier1,
        handlingBranch: handling,
        loanType: loanTypes[i % loanTypes.length],
        bizType,
        manager: managers[i % managers.length]
      };
      const acc = ensureAccount(row, `2023-${String((i % 12) + 1).padStart(2, '0')}-10 09:00:00`);
      const recordCount = 1 + (i % 4);
      for (let r = 0; r < recordCount && records.length < recordTarget; r++) {
        const y = years[(i + r) % years.length];
        const br2 = branchConfig[(i + r) % branchConfig.length];
        const h2 = br2.handling[(i + r) % br2.handling.length];
        addRecord(acc, {
          ...row,
          tier1Branch: br2.tier1,
          handlingBranch: h2
        }, y, 0.9 + ((i + r) % 10) * 0.08);
      }
    }

    while (records.length < recordTarget) {
      const acc = accounts[seq % accounts.length];
      if (!acc) break;
      const i = records.length;
      const br = branchConfig[i % branchConfig.length];
      addRecord(acc, {
        creditCode: acc.creditCode,
        loanAccount: acc.loanAccount,
        customerName: acc.customerName,
        industryMajor: acc.industryMajor,
        gbIndustryCode: acc.gbIndustryCode || '',
        tier1Branch: br.tier1,
        handlingBranch: br.handling[i % br.handling.length],
        loanType: loanTypes[i % loanTypes.length],
        bizType: i % 3 === 0 ? 'project' : 'non_project',
        manager: managers[i % managers.length]
      }, years[i % years.length], 0.7 + (i % 15) * 0.05);
    }

    const fewDisabled = accounts.filter((_, idx) => idx % 47 === 0).slice(0, 8);
    fewDisabled.forEach(a => {
      a.status = 'disabled';
      a.statusChangedAt = '2024-06-01 10:00:00';
      a.statusHistory = [{ from: 'active', to: 'disabled', at: a.statusChangedAt, operator: '总行绿金部' }];
    });
    accounts.filter((_, idx) => idx % 113 === 0).slice(0, 2).forEach(a => {
      a.status = 'cancelled';
      a.statusChangedAt = '2024-09-01 10:00:00';
      a.statusHistory = [{ from: 'active', to: 'cancelled', at: a.statusChangedAt, operator: '总行绿金部' }];
    });

    const dedupedAccounts = this.dedupeCarbonAccounts(accounts, records);
    return { carbonAccounts: dedupedAccounts, carbonAccountRecords: records };
  },

  applyBulkDemoToStore(d, opts) {
    const base = {
      carbonAccounts: d.carbonAccounts || [],
      carbonAccountRecords: d.carbonAccountRecords || []
    };
    const bulk = this.buildBulkDemoData(base, opts);
    d.carbonAccounts = bulk.carbonAccounts;
    d.carbonAccountRecords = bulk.carbonAccountRecords;
    return bulk;
  }
};

if (typeof Store !== 'undefined') {
  Object.assign(Store, {
    getCarbonAccounts() {
      return this.get().carbonAccounts || [];
    },
    getCarbonAccountRecords() {
      return this.get().carbonAccountRecords || [];
    },
    getCarbonAccount(id) {
      return this.getCarbonAccounts().find(a => a.id === id);
    },
    getCarbonRecordsForAccount(accountId) {
      return this.getCarbonAccountRecords().filter(r => r.accountId === accountId);
    },
    getCarbonContext(roleKey, role) {
      const d = this.get();
      const allRecords = d.carbonAccountRecords || [];
      const records = CarbonAccount.filterRecordsByRole(allRecords, roleKey, role);
      const accounts = CarbonAccount.filterAccountsForRole(d.carbonAccounts || [], allRecords, roleKey, role);
      return { accounts, records, allRecords };
    },
    syncCarbonAccountsForTask(taskId) {
      return this.update(d => CarbonAccount.syncTask(d, taskId));
    },
    setCarbonAccountStatus(accountId, nextStatus, operatorKey) {
      let result = { ok: false, message: '状态变更失败' };
      this.update(d => {
        result = CarbonAccount.transitionAccountStatus(d, accountId, nextStatus, operatorKey);
      });
      return result;
    },
    saveCarbonAccountProfile(accountId, year, subProjectNo, payload, operatorKey) {
      if (!accountId || !payload) return { ok: false, message: '缺少保存数据' };
      const acc = this.getCarbonAccount(accountId);
      if (!acc) return { ok: false, message: '未找到碳账户' };
      if (!CarbonAccount.isAccountActive(acc)) {
        return { ok: false, message: '仅正常状态账户可编辑' };
      }
      const operator = CarbonAccount.resolveOperatorLabel(operatorKey);
      this.update(d => {
        CarbonAccount.saveAccountProfile(d, accountId, year, subProjectNo, payload, operator);
      });
      return { ok: true, message: '账户档案已保存' };
    },
    _migrateCarbonAccounts(d) {
      if (!d.carbonAccounts) d.carbonAccounts = [];
      if (!d.carbonAccountRecords) d.carbonAccountRecords = [];
      (d.carbonAccountRecords || []).forEach(r => {
        if (!r.confirmedAt && r.mountedAt) r.confirmedAt = r.mountedAt;
        CarbonAccount.alignRecordYearCompletion(r);
      });
      d.carbonAccounts = CarbonAccount.dedupeCarbonAccounts(
        d.carbonAccounts,
        d.carbonAccountRecords
      );
      (d.carbonAccounts || []).forEach(acc => {
        if (!acc.status) acc.status = 'active';
        if (!acc.operationLogs?.length && acc.statusHistory?.length) {
          acc.operationLogs = acc.statusHistory.map(h => ({
            at: h.at,
            action: 'status_change',
            actionLabel: '状态变更',
            summary: `${CarbonAccount.ACCOUNT_STATUS_LABEL[h.from] || h.from || '-'} → ${CarbonAccount.ACCOUNT_STATUS_LABEL[h.to] || h.to || '-'}`,
            operator: h.operator,
            remark: '历史记录迁移'
          }));
        }
      });
      CarbonAccount.backfillProvisionFromLockedFormals(d);
      const needsBackfill = d.carbonAccounts.length < 50;
      if (needsBackfill) CarbonAccount.backfillAll(d);
      if (d.carbonAccountRecords.length < 1500) {
        CarbonAccount.applyBulkDemoToStore(d, {
          accountTarget: 500,
          recordTarget: 1800
        });
      }
      d.carbonAccounts = CarbonAccount.dedupeCarbonAccounts(
        d.carbonAccounts,
        d.carbonAccountRecords
      );
      CarbonAccount.syncCustomerNamesFromLedger(d);
    }
  });

  (function hydrateMockSeedCarbon() {
    if (!window.MOCK_SEED) return;
    const s = window.MOCK_SEED;
    let carbon = { carbonAccounts: [], carbonAccountRecords: [] };
    if (s.tasks?.length) {
      carbon = CarbonAccount.buildFromSeed(
        s.tasks, s.candidates, s.formalList, s.calculations
      );
    }
    const bulk = CarbonAccount.buildBulkDemoData(carbon, {
      accountTarget: 500,
      recordTarget: 1800
    });
    s.carbonAccounts = bulk.carbonAccounts;
    s.carbonAccountRecords = bulk.carbonAccountRecords;
    CarbonAccount.syncCustomerNamesFromLedger(s);
  })();

  (function migrateCarbonAccountsOnce() {
    const d = Store.get();
    if (!d.calculations?.length && !(d.carbonAccounts || []).length) return;
    (d.carbonAccountRecords || []).forEach(r => CarbonAccount.alignRecordYearCompletion(r));
    d.carbonAccounts = CarbonAccount.dedupeCarbonAccounts(
      d.carbonAccounts || [],
      d.carbonAccountRecords || []
    );
    CarbonAccount.syncCustomerNamesFromLedger(d);
    if ((d.carbonAccountRecords || []).length < 1500) {
      Store._migrateCarbonAccounts(d);
    }
    CarbonAccount.syncCustomerNamesFromLedger(d);
    Store.set(d);
  })();
}

if (typeof window !== 'undefined') window.CarbonAccount = CarbonAccount;
