/**
 * 演示全流程模拟数据：范畴确定 → 清单识别 → 对象边界 → 数据采集 → 计算 → 报告
 * 依赖：GUIDE、CandidateSync（须在 candidate-sync.js 之后加载）
 */
const DemoSeed = {
  _collectMode(loanType) {
    if (!loanType) return 'economy_direct';
    const mandatory = (GUIDE.MANDATORY_COLLECT_LOAN_TYPES || []).some(t => loanType.includes(t));
    return mandatory ? 'mandatory' : 'economy_direct';
  },
  _loanTypeForSpec(s, i) {
    if (s.loanType) return s.loanType;
    if (s.id === 'F004') return '票据贴现';
    if (s.id === 'F008') return '保理';
    if (i % 17 === 0) return '票据贴现';
    if (i % 19 === 0) return '保理';
    return s.biz === 'project' ? '项目贷款' : '流动资金贷款';
  },

  build() {
    const taskId = 'T2025001';
    const candidates = CandidateSync.generateBatch(taskId, 48);
    const formalList = this.buildFormalList(taskId, candidates);
    const supplements = this.buildSupplements(taskId, formalList);
    const calculations = this.buildCalculations(taskId, formalList, supplements);
    const reports = this.buildReports(taskId, calculations);
    const approvals = this.buildApprovals(taskId);
    const dqr = this.calcDqrPreview(calculations);
    const mainTask = {
      id: taskId,
      name: '2024年度投融资碳排放核算',
      year: 2024,
      industryScope: '八大高碳行业',
      orgScope: '全行',
      balanceRule: '月均余额',
      balanceThreshold: 500,
      accountingPeriod: '自然年度',
      reportDeadline: '次年09-30',
      branches: ['北京分行', '上海分行', '深圳分行', '杭州分行', '南京分行', '成都分行'],
      goal: '监管报送',
      status: 'running',
      progress: 82,
      candidateCount: candidates.length,
      formalCount: formalList.length,
      supplementDone: supplements.filter(s => s.status === 'completed').length,
      supplementTotal: supplements.length,
      approvalStatus: 'none',
      workflowStep: 4,
      initiatorOrg: 'hq',
      initiatorBranch: null,
      branchReviewEnabled: true,
      dataCutoffAt: '2025-06-30 18:00:00',
      createdAt: '2025-01-08',
      createdBy: '张明（总行绿金部）',
      deadline: '2025-09-30',
      syncedFromInterface: true,
      syncedAt: '2025-05-18 09:30:00',
      syncInterfaceId: 'IF001',
      syncInterfaceName: '贷款台账同步',
      syncSourceSystem: '信贷核心系统',
      syncYear: 2024,
      syncRecordTotal: 0,
      candidateFilterRules: {
        tier1Branch: '',
        productType: '',
        borrowerType: '',
        industry: '',
        manager: '',
        balanceMin: '',
        balanceMax: ''
      },
      dqr,
      milestone: {
        candidatesSynced: true,
        formalLocked: true,
        supplementDispatched: true,
        calculationDone: true,
        reportGenerated: true
      }
    };
    const completedTask = {
      id: 'T2024002',
      name: '2023年度投融资碳排放核算（已完成）',
      year: 2023,
      industryScope: '八大高碳行业',
      orgScope: '全行',
      status: 'closed',
      progress: 100,
      candidateCount: 1102,
      formalCount: 892,
      supplementDone: 892,
      supplementTotal: 892,
      approvalStatus: 'approved',
      workflowStep: 5,
      deadline: '2024-09-30',
      dqr: { dqr: '1.92', level: '良好', count: 892 }
    };

    const interfaces = this.buildInterfaces();
    mainTask.syncRecordTotal = interfaces
      .filter(b => b.dataYear === mainTask.year && b.status === 'success')
      .reduce((sum, b) => sum + (b.recordCount || 0), 0);

    return {
      tasks: this.buildTasks(mainTask, completedTask),
      candidates,
      formalList,
      supplements,
      calculations,
      reports,
      approvals,
      methods: GUIDE.METHODS,
      factors: this.buildFactors(),
      mappings: this.buildMappings(),
      fieldMappings: this.buildFieldMappings(),
      interfaces,
      branchStats: this.buildBranchStats(),
      industryStats: this.buildIndustryStats()
    };
  },

  buildTasks(mainTask, completedTask) {
    const scopes = ['八大高碳行业', '八大+扩展', '自定义'];
    const goals = ['监管报送', '内部分析'];
    const orgScopes = ['全行', '北京分行', '上海分行', '长三角区域', '珠三角区域'];
    const balanceRules = ['月均余额', '日均余额'];
    const tasks = [mainTask, completedTask];
    for (let i = 0; i < 33; i++) {
      const year = 2025 - (i % 6);
      const step = (i + 1) % 6;
      const completed = i % 5 === 0;
      tasks.push({
        id: `T${year}${String(200 + i)}`,
        name: `${year}年度投融资碳排放核算（${orgScopes[i % orgScopes.length]}）`,
        year,
        industryScope: scopes[i % scopes.length],
        orgScope: orgScopes[i % orgScopes.length],
        balanceRule: balanceRules[i % 2],
        goal: goals[i % 2],
        status: completed ? 'closed' : 'running',
        progress: completed ? 100 : 15 + step * 12,
        workflowStep: completed ? 5 : step,
        deadline: `${year + 1}-09-30`,
        candidateCount: 80 + i * 15,
        formalCount: 20 + i * 3,
        supplementDone: completed ? 40 + i : step * 4,
        supplementTotal: 40 + i,
        approvalStatus: completed ? 'approved' : 'none',
        createdAt: `${year}-${String((i % 12) + 1).padStart(2, '0')}-15`,
        createdBy: '张明（总行绿金部）'
      });
    }
    return tasks;
  },

  buildFactors() {
    const base = [
      { id: 'EF001', name: '煤炭', value: 2.66, unit: 'tCO2/t', type: '能源法', industry: '通用' },
      { id: 'EF002', name: '天然气', value: 21.84, unit: 'tCO2/万m³', type: '能源法', industry: '通用' },
      { id: 'EF003', name: '电力（全国平均）', value: 0.557, unit: 'tCO2/MWh', type: '能源法', industry: '电力' },
      { id: 'EF004', name: '水泥熟料', value: 0.88, unit: 'tCO2/t', type: '产品法', industry: '建材' },
      { id: 'EF005', name: '化工-营业收入法', value: 2.35, unit: 'tCO2/万元', type: '经济法', industry: '化工' },
      { id: 'EF006', name: '钢铁-资产规模法', value: 2.46, unit: 'tCO2/万元', type: '经济法', industry: '钢铁' },
      { id: 'EF007', name: '火电-供电煤耗缺省', value: 0.82, unit: 'tCO2/MWh', type: '能源法', industry: '电力' }
    ];
    const industries = ['电力', '钢铁', '建材', '化工', '有色', '石化', '造纸', '民航'];
    const types = ['能源法', '产品法', '经济法'];
    for (let i = base.length; i < 28; i++) {
      const ind = industries[i % industries.length];
      base.push({
        id: 'EF' + String(i + 1).padStart(3, '0'),
        name: `${ind}行业排放因子-${i + 1}`,
        value: +(1.2 + (i % 10) * 0.35).toFixed(2),
        unit: types[i % 3] === '经济法' ? 'tCO2/万元' : 'tCO2/t',
        type: types[i % 3],
        industry: ind
      });
    }
    return base;
  },

  buildMappings() {
    const base = [
      { id: 'MAP001', sourceCode: 'A01', sourceName: '行内-电力', targetCode: 'D4411', targetName: '火力发电', carbonIndustry: '电力' },
      { id: 'MAP002', sourceCode: 'B02', sourceName: '行内-钢铁', targetCode: 'C3120', targetName: '炼钢', carbonIndustry: '钢铁' },
      { id: 'MAP003', sourceCode: 'C03', sourceName: '行内-建材', targetCode: 'C3011', targetName: '水泥制造', carbonIndustry: '建材' },
      { id: 'MAP004', sourceCode: 'D04', sourceName: '行内-化工', targetCode: 'C2614', targetName: '有机化学原料制造', carbonIndustry: '化工' },
      { id: 'MAP005', sourceCode: 'E05', sourceName: '行内-有色', targetCode: 'C3216', targetName: '铝冶炼', carbonIndustry: '有色' }
    ];
    const table = (typeof INDUSTRY_TABLE !== 'undefined' ? INDUSTRY_TABLE : GUIDE.INDUSTRIES.flatMap(i =>
      i.codes.map((code, j) => ({ code, name: i.names[j] || code, major: i.major }))
    ));
    for (let i = base.length; i < 30; i++) {
      const item = table[i % table.length] || { code: 'C0000', name: '其他', major: '其他' };
      base.push({
        id: 'MAP' + String(i + 1).padStart(3, '0'),
        sourceCode: 'X' + String(i + 1).padStart(2, '0'),
        sourceName: `行内-${item.major}-${i + 1}`,
        targetCode: item.code,
        targetName: item.name,
        carbonIndustry: item.major
      });
    }
    return base;
  },

  buildFieldMappings() {
    const systems = ['信贷系统', '客户主数据', '财务系统', '风险系统', 'ESG平台'];
    const fields = [
      ['LOAN_AVG_BAL', 'avgMonthlyBalance', '月均余额(万元)'],
      ['CUST_USCC', 'creditCode', '直接映射'],
      ['INDUSTRY_CODE', 'gbIndustryCode', '映射至GB/T4754'],
      ['LOAN_TYPE', 'loanType', '枚举转换'],
      ['BRANCH_ORG', 'branch', '机构树映射'],
      ['TOTAL_ASSETS', 'totalAssets', '万元换算'],
      ['REVENUE', 'revenue', '万元换算'],
      ['REPORTED_EMISSION', 'reportedEmission', '吨CO2'],
      ['ENERGY_CONSUMPTION', 'energyRows', 'JSON数组'],
      ['PRODUCT_OUTPUT', 'productRows', 'JSON数组']
    ];
    const list = fields.map((f, i) => ({
      id: 'FM' + String(i + 1).padStart(3, '0'),
      sourceField: f[0],
      sourceSystem: systems[i % systems.length],
      targetField: f[1],
      rule: f[2]
    }));
    for (let i = fields.length; i < 24; i++) {
      list.push({
        id: 'FM' + String(i + 1).padStart(3, '0'),
        sourceField: 'FIELD_' + (i + 1),
        sourceSystem: systems[i % systems.length],
        targetField: 'targetField' + (i + 1),
        rule: '规则映射-' + (i + 1)
      });
    }
    return list;
  },

  buildInterfaces() {
    const batches = [];
    const now = new Date(2026, 4, 20);
    const failedKeys = new Set(['2025-05', '2026-03']);

    [2024, 2025, 2026].forEach(year => {
      for (let m = 1; m <= 12; m++) {
        const pushMonth = m === 12 ? 1 : m + 1;
        const pushYear = m === 12 ? year + 1 : year;
        const pushDate = new Date(pushYear, pushMonth - 1, 1, 1, 0, 0);
        if (pushDate > now) continue;

        const dataMonth = `${year}-${String(m).padStart(2, '0')}`;
        const failed = failedKeys.has(dataMonth);
        const recordCount = failed ? 0 : 3680 + m * 112 + (year - 2024) * 48;

        batches.push({
          id: `IB${year}${String(m).padStart(2, '0')}`,
          batchNo: `LT${year}${String(m).padStart(2, '0')}`,
          pushTime: `${pushYear}-${String(pushMonth).padStart(2, '0')}-01 01:00:${String(6 + (m % 50)).padStart(2, '0')}`,
          recordCount,
          status: failed ? 'failed' : 'success',
          dataMonth,
          dataYear: year,
          source: '信贷核心系统',
          fetchRule: '每月1日 01:00 获取上一自然月全部台账'
        });
      }
    });

    return batches.sort((a, b) => b.pushTime.localeCompare(a.pushTime));
  },

  buildBranchStats() {
    const branches = ['北京分行', '上海分行', '深圳分行', '杭州分行', '南京分行', '成都分行', '广州分行', '武汉分行', '西安分行', '重庆分行', '天津分行', '苏州分行', '青岛分行', '大连分行', '厦门分行', '宁波分行', '长沙分行', '郑州分行', '济南分行', '合肥分行', '福州分行', '石家庄分行', '哈尔滨分行', '长春分行', '南昌分行', '昆明分行', '贵阳分行', '南宁分行', '海口分行', '兰州分行'];
    return branches.map((branch, i) => ({
      branch,
      total: 8 + (i % 12),
      done: 5 + (i % 8),
      overdue: i % 5 === 0 ? 1 : 0,
      pending: Math.max(0, (8 + (i % 12)) - (5 + (i % 8)) - (i % 5 === 0 ? 1 : 0))
    }));
  },

  buildIndustryStats() {
    const industries = ['电力', '钢铁', '建材', '化工', '有色', '石化', '造纸', '民航', '煤炭', '油气', '玻璃', '电解铝', '水泥', '氮肥', '磷肥'];
    return industries.map((industry, i) => ({
      industry,
      count: 1 + (i % 5),
      emission: 80000 + i * 18500,
      share: +(100 / industries.length).toFixed(1)
    }));
  },

  buildFormalList(taskId, candidates) {
    const specs = [
      { id: 'F001', cid: 'C2025001006', name: '华能发电有限公司', major: '电力', code: 'D4411', biz: 'project', obj: '项目', project: '华能京津冀清洁煤电扩建项目', boundary: '范围一+范围二', loc: '河北唐山', inv: 500000 },
      { id: 'F002', cid: 'C2025001007', name: '宝钢炼钢有限公司', major: '钢铁', code: 'C3120', biz: 'non_project', obj: '融资主体', project: null, boundary: '范围一+范围二', loc: '上海宝山', inv: null },
      { id: 'F003', cid: 'C2025001008', name: '中建水泥股份有限公司', major: '建材', code: 'C3011', biz: 'project', obj: '项目', project: '西南绿色建材一体化基地', boundary: '范围一+范围二', loc: '四川宜宾', inv: 800000 },
      { id: 'F004', cid: 'C2025001009', name: '东方贸易贴现客户', major: '钢铁', code: 'C3120', biz: 'non_project', obj: '融资主体', project: null, boundary: '范围一+范围二', loc: '上海浦东', inv: null, loanType: '票据贴现' },
      { id: 'F005', cid: 'C2025001010', name: '国电发电有限公司', major: '电力', code: 'D4411', biz: 'project', obj: '项目', project: '国电沿海风电配套调峰', boundary: '范围一+范围二', loc: '江苏盐城', inv: 320000 },
      { id: 'F006', cid: 'C2025001011', name: '万华化学有限公司', major: '化工', code: 'C2614', biz: 'non_project', obj: '融资主体', project: null, boundary: '范围一+范围二', loc: '山东烟台', inv: null },
      { id: 'F007', cid: 'C2025001012', name: '海螺水泥有限公司', major: '建材', code: 'C3011', biz: 'project', obj: '项目', project: '海螺熟料生产线节能改造', boundary: '范围一+范围二', loc: '安徽芜湖', inv: 450000 },
      { id: 'F008', cid: 'C2025001013', name: '江西铜业有限公司', major: '有色', code: 'C3216', biz: 'non_project', obj: '融资主体', project: null, boundary: '范围一+范围二', loc: '江西贵溪', inv: null, loanType: '保理' }
    ];
    const majors = ['电力', '钢铁', '建材', '化工', '有色', '石化', '造纸', '民航'];
    const codeMap = { 电力: 'D4411', 钢铁: 'C3120', 建材: 'C3011', 化工: 'C2614', 有色: 'C3216', 石化: 'C2511', 造纸: 'C2211', 民航: 'G5631' };
    const prefixes = ['华能', '国电', '宝钢', '河钢', '中建', '海螺', '万华', '中石化', '中铝', '晨鸣', '首都机场'];
    for (let i = specs.length; i < 32; i++) {
      const major = majors[i % majors.length];
      specs.push({
        id: 'F' + String(i + 1).padStart(3, '0'),
        cid: 'C2025001' + String(100 + i).padStart(3, '0'),
        name: `${prefixes[i % prefixes.length]}${major}示范企业${i + 1}有限公司`,
        major,
        code: codeMap[major],
        biz: i % 3 === 0 ? 'project' : 'non_project',
        obj: i % 3 === 0 ? '项目' : '融资主体',
        project: i % 3 === 0 ? `${major}绿色升级项目-${i + 1}` : null,
        boundary: '范围一+范围二',
        loc: ['北京', '上海', '深圳', '杭州', '南京', '成都'][i % 6],
        inv: i % 3 === 0 ? 200000 + i * 10000 : null
      });
    }
    return specs.map((s, i) => {
      const loanType = this._loanTypeForSpec(s, i);
      const collectMode = this._collectMode(loanType);
      const cand = (candidates || []).find(c => c.id === s.cid);
      return {
      id: s.id,
      taskId,
      customerId: s.cid,
      customerName: s.name,
      loanType,
      productType: cand?.productType || loanType,
      collectMode,
      bizType: s.biz,
      objectType: s.obj,
      boundary: s.boundary,
      scope1: true,
      scope2: true,
      scope3: false,
      controlApproach: '运营控制法',
      period: '自然年度',
      projectName: s.project,
      facilityLocation: s.loc,
      boundaryNote: s.biz === 'project' ? '核算边界为项目建设期运营阶段，含范围一、二' : '核算边界为融资主体运营边界（范围一、二）',
      gbIndustryCode: cand?.gbIndustryCode || s.code,
      gbIndustryName: cand?.gbIndustryName,
      industryMajor: cand?.industryMajor || s.major,
      industryLabel: cand?.industryLabel,
      tier1Branch: cand?.tier1Branch || cand?.branch,
      handlingBranch: cand?.handlingBranch,
      branch: cand?.tier1Branch || cand?.branch,
      loanAccount: cand?.loanAccount,
      disbursementAmount: cand?.disbursementAmount,
      disbursementDate: cand?.disbursementDate,
      borrowerType: cand?.borrowerType,
      avgMonthlyBalance: cand?.avgMonthlyBalance,
      operatingRevenue: cand?.operatingRevenue,
      manager: cand?.manager,
      totalInvestment: s.inv,
      status: i < 28 ? 'confirmed' : 'draft',
      economyDirectStatus: collectMode === 'economy_direct' && i < 20 ? 'done' : null,
      economyDirectAt: collectMode === 'economy_direct' && i < 20 ? '2025-03-01 10:00:00' : null,
      lockedAt: i < 28 ? '2025-02-15' : null
    }; });
  },

  buildSupplements(taskId, formalList) {
    const mandatoryFormals = formalList.filter(f => f.collectMode === 'mandatory');
    const methodIds = ['report', 'energy', 'product', 'economy', 'economy_fallback'];
    const statuses = ['completed', 'in_progress', 'pending', 'returned'];
    const branches = ['北京分行', '上海分行', '深圳分行', '杭州分行', '南京分行', '成都分行'];
    const managers = ['王磊', '陈静', '刘洋', '赵敏', '周强', '李娜'];
    const templates = mandatoryFormals.map((f, i) => {
      const methodId = methodIds[i % methodIds.length];
      const m = GUIDE.METHODS.find(x => x.id === methodId);
      const status = i < 20 ? 'completed' : statuses[i % statuses.length];
      return {
        id: 'S' + String(i + 1).padStart(3, '0'),
        formalId: f.id,
        methodId,
        status,
        branch: i === 3 ? '北京分行' : branches[i % branches.length],
        manager: managers[i % managers.length],
        reportedEmission: methodId === 'report' ? 500000 + i * 12000 : undefined,
        energyTotalEmission: methodId === 'energy' ? 400000 + i * 8000 : undefined,
        productTotalEmission: methodId === 'product' ? 300000 + i * 6000 : undefined,
        economyValue: methodId === 'economy' ? 2000000 + i * 50000 : undefined,
        economyFactor: 2.35,
        economyBasis: 'revenue',
        totalAssets: 800000 + i * 20000,
        revenue: 400000 + i * 15000,
        avgLoanBalance: 30000 + i * 1200,
        fieldsTotal: 12 + (i % 4),
        fieldsDone: status === 'completed' ? 12 + (i % 4) : (i % 4) * 2,
        approvalStatus: i % 4 === 0 ? 'approved' : 'none',
        needAmount: i === 3
      };
    });
    const base = templates.map(t => {
      const f = formalList.find(x => x.id === t.formalId);
      const m = GUIDE.METHODS.find(x => x.id === t.methodId);
      return {
        id: t.id,
        taskId,
        formalId: t.formalId,
        customerId: f.customerId,
        customerName: f.customerName,
        branch: t.branch,
        manager: t.manager,
        status: t.status,
        method: m?.name || '待选择',
        methodId: t.methodId,
        qualityGrade: m?.qualityGrade,
        fieldsTotal: t.fieldsTotal,
        fieldsDone: t.fieldsDone,
        deadline: '2025-09-30',
        approvalStatus: t.approvalStatus,
        needAmount: t.needAmount,
        reportedEmission: t.reportedEmission,
        energyTotalEmission: t.energyTotalEmission,
        productTotalEmission: t.productTotalEmission,
        economyValue: t.economyValue,
        economyFactor: t.economyFactor,
        economyBasis: t.economyBasis,
        totalAssets: t.totalAssets,
        revenue: t.revenue,
        avgLoanBalance: t.avgLoanBalance,
        loanType: f.loanType,
        branchReviewStatus: t.approvalStatus === 'approved' ? 'approved' : (t.status === 'completed' ? 'approved' : 'none'),
        hqReviewStatus: t.approvalStatus === 'approved' ? 'approved' : (t.status === 'completed' ? 'pending' : 'none'),
        auditStage: t.approvalStatus === 'approved' ? 'approved' : (t.status === 'completed' ? 'hq_review' : 'pending_fill'),
        dispatchedAt: '2025-02-16',
        dispatchedBy: '张明（总行绿金部）'
      };
    });
    const economyDispatched = formalList
      .filter(f => f.collectMode === 'economy_direct' && f.status === 'confirmed' && f.economyDirectStatus === 'done')
      .slice(0, 2);
    const extras = economyDispatched.map((f, j) => ({
      id: 'S9' + String(j + 1).padStart(2, '0'),
      taskId,
      formalId: f.id,
      customerId: f.customerId,
      customerName: f.customerName,
      branch: f.branch || branches[j % branches.length],
      manager: f.manager || managers[j % managers.length],
      status: j === 0 ? 'in_progress' : 'pending',
      method: '待选择',
      methodId: null,
      fieldsTotal: 12,
      fieldsDone: j === 0 ? 4 : 0,
      deadline: '2025-09-30',
      approvalStatus: 'none',
      totalAssets: 600000,
      revenue: 350000,
      avgLoanBalance: 28000,
      loanType: f.loanType,
      branchReviewStatus: 'none',
      hqReviewStatus: 'none',
      auditStage: 'pending_fill',
      dispatchedAt: '2025-03-02 11:00:00',
      dispatchedBy: '张明（总行绿金部）'
    }));
    return base.concat(extras);
  },

  buildCalculations(taskId, formalList, supplements) {
    const qualityLabels = ['', '一级(优)', '二级', '三级', '四级', '五级(兜底)'];
    return formalList.map((f, i) => {
      const s = supplements.find(x => x.formalId === f.id);
      if (f.collectMode === 'economy_direct' && f.economyDirectStatus === 'done') {
        const revenue = 400000 + i * 15000;
        const factor = 2.35;
        const entity = Math.round(revenue * factor);
        const balance = 30000 + i * 500;
        const assets = 800000 + i * 20000;
        const attr = f.bizType === 'project'
          ? Math.round(entity * (balance / (f.totalInvestment || 500000)))
          : Math.round(entity * (balance / assets));
        return {
          id: 'CAL' + String(i + 1).padStart(3, '0'),
          taskId, formalId: f.id, customerName: f.customerName, bizType: f.bizType,
          industryMajor: f.industryMajor, method: '经济活动法', methodId: 'economy',
          entityEmission: entity, avgBalance: balance, totalAssets: assets,
          attributedEmission: attr, totalEmission: entity, industryFactor: factor,
          qualityGrade: 4, quality: '四级', source: 'economy_direct',
          status: 'done', approvalStatus: 'none', calculatedAt: f.economyDirectAt || '2025-03-01'
        };
      }
      const m = GUIDE.METHODS.find(x => x.id === s?.methodId);
      const fallback = s?.methodId === 'economy_fallback';
      const entity = s?.reportedEmission || s?.energyTotalEmission || s?.productTotalEmission || (s?.economyValue ? s.economyValue * (s.economyFactor || 2.35) : 500000 + i * 10000);
      const balance = s?.avgLoanBalance || 30000 + i * 500;
      const attr = f.bizType === 'project'
        ? Math.round(entity * (balance / (f.totalInvestment || 500000)))
        : Math.round(entity * (balance / (s?.totalAssets || 800000)));
      const grade = m?.qualityGrade || (fallback ? 5 : 3);
      const status = i < 25 ? 'done' : (i === 25 ? 'warning' : 'pending');
      return {
        id: 'CAL' + String(i + 1).padStart(3, '0'),
        taskId,
        formalId: f.id,
        customerName: f.customerName,
        bizType: f.bizType,
        industryMajor: f.industryMajor,
        method: fallback ? '其他计算法' : (m?.name || '-'),
        methodId: fallback ? 'economy_fallback' : s?.methodId,
        entityEmission: status === 'pending' ? null : entity,
        totalEmission: status === 'pending' ? null : entity,
        avgBalance: balance,
        totalAssets: s?.totalAssets,
        totalInvestment: f.totalInvestment,
        industryFactor: 2.46,
        attributedEmission: status === 'pending' ? null : (status === 'warning' ? Math.round(balance * 2.46) : attr),
        qualityGrade: grade,
        quality: grade ? qualityLabels[grade] : '-',
        status,
        approvalStatus: i % 5 === 0 ? 'approved' : 'none',
        calculatedAt: status === 'done' ? '2025-05-10 14:22:00' : null
      };
    });
  },

  buildReports(taskId, calculations) {
    const total = calculations.filter(c => c.attributedEmission).reduce((s, c) => s + c.attributedEmission, 0);
    const done = calculations.filter(c => c.status === 'done').length;
    const scopes = ['监管报送范围（8大行业）', '管理分析范围（8+15）', '全量', '自定义范围'];
    const formats = ['Excel', 'PDF', '监管报表'];
    const templates = ['人行监管报送模板', '内部管理报表', '自定义统计表单'];
    const operators = ['张明', '王丽', '李强', '王磊', '陈静'];
    const pickStatus = (i) => {
      if (i % 7 === 0) return 'failed';
      if (i % 4 === 0) return 'generating';
      return 'success';
    };
    const list = [
      { id: 'RPT001', name: '2024年度监管报送报表（八大行业）', scope: scopes[0], format: 'Excel', status: 'success' },
      { id: 'RPT002', name: '2024年度管理分析报表（8+15行业）', scope: scopes[1], format: 'Excel', status: 'success' },
      { id: 'RPT003', name: '归因排放明细清单', scope: scopes[2], format: 'PDF', status: 'success' },
      { id: 'RPT004', name: '数据质量说明（DQR附表）', scope: scopes[0], format: 'PDF', status: 'generating' }
    ];
    for (let i = list.length; i < 22; i++) {
      list.push({
        id: 'RPT' + String(i + 1).padStart(3, '0'),
        name: `2024年度导出报表-${i + 1}`,
        scope: scopes[i % scopes.length],
        format: formats[i % formats.length],
        status: pickStatus(i)
      });
    }
    return list.map((r, i) => {
      const operator = operators[i % operators.length];
      const isSuccess = r.status === 'success';
      const isFailed = r.status === 'failed';
      return {
        ...r,
        taskId,
        template: templates[i % templates.length],
        generatedAt: isSuccess || isFailed
          ? `2025-05-${String(10 + (i % 8)).padStart(2, '0')} 16:${String(30 + (i % 30)).padStart(2, '0')}:00`
          : null,
        generatedBy: operator,
        recordCount: isSuccess ? done : isFailed ? 0 : '-',
        totalEmission: isSuccess ? total : isFailed ? null : null,
        fileSize: isSuccess ? (1.2 + i * 0.1).toFixed(1) + ' MB' : null
      };
    });
  },

  buildApprovals(taskId) {
    const types = [
      { docType: 'formal', prefix: '正式清单' },
      { docType: 'supplement', prefix: '数据采集' },
      { docType: 'calculation', prefix: '碳排放计算' },
      { docType: 'task', prefix: '核算任务' }
    ];
    const submitters = ['张明', '王磊', '陈静', '刘洋', '赵敏'];
    const list = [
      { id: 'APR001', taskId, docType: 'formal', docId: 'F001', docName: '正式清单-华能发电', submitter: '张明', submitTime: '2025-02-18 10:00', status: 'approved', approver: '李总', approveTime: '2025-02-19 15:30' },
      { id: 'APR002', taskId, docType: 'supplement', docId: 'S001', docName: '数据采集-华能发电', reviewLevel: 'hq', submitter: '王磊', submitTime: '2025-03-05 09:20', status: 'approved', approver: '张明', approveTime: '2025-03-07 14:00' },
      { id: 'APR002B', taskId, docType: 'supplement', docId: 'S001', docName: '数据采集-华能发电', reviewLevel: 'branch', submitter: '王磊', submitTime: '2025-03-05 09:20', status: 'approved', approver: '王丽', approveTime: '2025-03-06 11:00' },
      { id: 'APR003', taskId, docType: 'supplement', docId: 'S004', docName: '数据采集-万华钢铁示范企业18有限公司', reviewLevel: 'branch', submitter: '赵敏', submitTime: '2025-04-10 10:30', status: 'pending', approver: null, approveTime: null },
      { id: 'APR003H', taskId, docType: 'supplement', docId: 'S003', docName: '数据采集-江西铜业有限公司', reviewLevel: 'hq', submitter: '刘洋', submitTime: '2025-04-15 16:00', status: 'pending', approver: null, approveTime: null },
      { id: 'APR004', taskId, docType: 'calculation', docId: 'CAL001', docName: '碳排放计算-华能发电', submitter: '张明', submitTime: '2025-05-11 14:00', status: 'approved', approver: '李总', approveTime: '2025-05-12 09:00' },
      { id: 'APR005', taskId, docType: 'calculation', docId: 'CAL002', docName: '碳排放计算-宝钢炼钢', submitter: '张明', submitTime: '2025-05-11 14:05', status: 'pending', approver: null, approveTime: null },
      { id: 'APR006', taskId, docType: 'formal', docId: 'F003', docName: '正式清单-中建水泥', submitter: '张明', submitTime: '2025-02-20 11:00', status: 'pending', approver: null, approveTime: null }
    ];
    for (let i = list.length; i < 28; i++) {
      const t = types[i % types.length];
      list.push({
        id: 'APR' + String(i + 1).padStart(3, '0'),
        taskId,
        docType: t.docType,
        docId: 'DOC' + i,
        docName: `${t.prefix}-示例单据-${i + 1}`,
        submitter: submitters[i % submitters.length],
        submitTime: `2025-0${(i % 9) + 1}-${String(10 + (i % 18)).padStart(2, '0')} ${String(9 + (i % 8)).padStart(2, '0')}:00`,
        status: i % 4 === 0 ? 'pending' : 'approved',
        approver: i % 4 === 0 ? null : '李总',
        approveTime: i % 4 === 0 ? null : `2025-0${(i % 9) + 1}-${String(11 + (i % 18)).padStart(2, '0')} 10:00`
      });
    }
    return list;
  },

  calcDqrPreview(calculations) {
    const calcs = calculations.filter(c => c.attributedEmission > 0);
    if (!calcs.length) return null;
    const sum = calcs.reduce((s, c) => s + c.attributedEmission, 0);
    const dqr = calcs.reduce((s, c) => s + c.attributedEmission * (c.qualityGrade || 5), 0) / sum;
    const level = GUIDE.QUALITY_LEVELS.find(l => dqr <= l.max)?.label || '一般';
    return { dqr: dqr.toFixed(2), level, count: calcs.length };
  }
};

window.MOCK_SEED = DemoSeed.build();
if (typeof window !== 'undefined') window.DemoSeed = DemoSeed;
