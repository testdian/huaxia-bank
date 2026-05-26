/**
 * 企业碳账户：法人+贷款号建档，核算确认后挂载排放记录；总行/分行按一级分行过滤
 */
const CarbonAccount = {
  ACCOUNT_STATUS_LABEL: { active: '启用', disabled: '停用', cancelled: '注销' },

  /** 当前状态允许的操作（CA003） */
  getAccountStatusActions(status) {
    const s = status || 'active';
    if (s === 'active') {
      return [
        { next: 'disabled', label: '停用' },
        { next: 'cancelled', label: '注销' }
      ];
    }
    if (s === 'disabled') return [{ next: 'active', label: '启用' }];
    return [];
  },

  canTransitionStatus(from, to) {
    return this.getAccountStatusActions(from).some(a => a.next === to);
  },

  makeAccountId(creditCode, loanAccount) {
    const raw = `${creditCode || 'UNKNOWN'}|${loanAccount || 'UNKNOWN'}`;
    return 'CA_' + raw.replace(/[^0-9A-Za-z\u4e00-\u9fa5]/g, '_').slice(0, 48);
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
    return accounts
      .filter(a => accountIds.has(a.id))
      .map(a => this.enrichAccount(a, visibleRecords));
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

  trendByYear(records) {
    const map = {};
    records.forEach(r => {
      const y = String(r.year || r.period || '-');
      if (!map[y]) map[y] = { year: y, emission: 0, entity: 0, count: 0, balance: 0 };
      map[y].emission += Number(r.attributedEmission) || 0;
      map[y].entity += Number(r.entityEmission) || 0;
      map[y].count += 1;
      map[y].balance += Number(r.avgBalance) || 0;
    });
    return Object.values(map)
      .map(row => ({
        ...row,
        label: row.year,
        intensity: row.balance > 0 ? +((row.emission / row.balance) * 10000).toFixed(4) : null
      }))
      .sort((a, b) => String(a.year).localeCompare(String(b.year)));
  },

  /** 贷款余额碳强度趋势 tCO₂e / 万元（AV009） */
  trendIntensityByYear(records) {
    return this.trendByYear(records).filter(t => t.intensity != null);
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
    if (filters.loanType) list = list.filter(r => r.loanType === filters.loanType);
    if (filters.industry) list = list.filter(r => r.industryMajor === filters.industry);
    if (filters.branch) {
      list = list.filter(r => r.handlingBranch === filters.branch || r.tier1Branch === filters.branch);
    }
    if (filters.bizType) list = list.filter(r => r.bizType === filters.bizType);
    const kw = (filters.keyword || '').trim().toLowerCase();
    if (kw) {
      list = list.filter(r =>
        String(r.year).includes(kw) ||
        (r.handlingBranch || '').toLowerCase().includes(kw) ||
        (r.loanType || '').toLowerCase().includes(kw) ||
        (r.industryMajor || '').toLowerCase().includes(kw) ||
        (r.bizLabel || '').toLowerCase().includes(kw) ||
        (r.method || '').toLowerCase().includes(kw)
      );
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

  buildRecordPayload(d, task, formal, calc, accountId) {
    const row = this.resolveLedgerRow(d, formal, calc);
    const year = task?.year || new Date().getFullYear();
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
      loanType: row.loanType,
      bizType: row.bizType,
      bizLabel: row.bizType === 'project' ? '项目贷款' : '非项目贷款',
      manager: row.manager,
      entityEmission: calc.entityEmission,
      attributedEmission: calc.attributedEmission,
      avgBalance: calc.avgBalance,
      year,
      period: String(year),
      method: calc.method,
      confirmedAt: new Date().toLocaleString('zh-CN'),
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
      if (!accountIds.has(acc.id)) {
        accounts.push(acc);
        accountIds.add(acc.id);
      } else {
        const idx = accounts.findIndex(a => a.id === acc.id);
        if (idx >= 0) accounts[idx] = acc;
      }
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
      const mounted = `${y}-${String((seq % 12) + 1).padStart(2, '0')}-${String((seq % 28) + 1).padStart(2, '0')} 10:00:00`;
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

    // 场景1：同一法人+贷款号，多经办行（W/E/R 演示）
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
        const customerName = nameRoots[k % nameRoots.length] + tier1.slice(0, 2) + '样本' + k + '有限公司';
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
      const customerName = nameRoots[i % nameRoots.length] + ['能源', '钢铁', '建材', '化工', '物流', '装备'][i % 6] +
        ['有限公司', '股份有限公司'][i % 2];
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

    return { carbonAccounts: accounts, carbonAccountRecords: records };
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
      const d = this.get();
      const acc = (d.carbonAccounts || []).find(a => a.id === accountId);
      if (!acc) return { ok: false, message: '未找到碳账户' };
      const cur = acc.status || 'active';
      if (!CarbonAccount.canTransitionStatus(cur, nextStatus)) {
        return { ok: false, message: '当前状态不允许该操作' };
      }
      const role = typeof ROLES !== 'undefined' ? ROLES[operatorKey] : null;
      const operator = role ? `${role.label}（${role.user}）` : (operatorKey || '系统');
      const at = new Date().toLocaleString('zh-CN');
      this.update(data => {
        const a = (data.carbonAccounts || []).find(x => x.id === accountId);
        if (!a) return;
        if (!a.statusHistory) a.statusHistory = [];
        a.statusHistory.push({
          from: cur,
          to: nextStatus,
          at,
          operator
        });
        a.status = nextStatus;
        a.statusChangedAt = at;
      });
      const label = CarbonAccount.ACCOUNT_STATUS_LABEL[nextStatus] || nextStatus;
      return { ok: true, message: `账户已${label}` };
    },
    _migrateCarbonAccounts(d) {
      if (!d.carbonAccounts) d.carbonAccounts = [];
      if (!d.carbonAccountRecords) d.carbonAccountRecords = [];
      (d.carbonAccountRecords || []).forEach(r => {
        if (!r.confirmedAt && r.mountedAt) r.confirmedAt = r.mountedAt;
      });
      const needsBackfill = d.carbonAccounts.length < 50;
      if (needsBackfill) CarbonAccount.backfillAll(d);
      if (d.carbonAccountRecords.length < 1500) {
        CarbonAccount.applyBulkDemoToStore(d, {
          accountTarget: 500,
          recordTarget: 1800
        });
      }
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
  })();

  (function migrateCarbonAccountsOnce() {
    const d = Store.get();
    if (!d.calculations?.length) return;
    if ((d.carbonAccountRecords || []).length >= 1500) return;
    Store._migrateCarbonAccounts(d);
    Store.set(d);
  })();
}

if (typeof window !== 'undefined') window.CarbonAccount = CarbonAccount;
