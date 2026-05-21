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
    this.patchPowerIndustryCandidates(candidates, taskId);
    const formalList = this.buildFormalList(taskId, candidates);
    const testCases = this.getSupplementTestCases();
    this.patchSupplementTestFormals(candidates, formalList, taskId, testCases);
    const supplements = this.buildSupplements(taskId, formalList, testCases);
    this.patchBranchTaskData(candidates, formalList, supplements);
    const calculations = this.buildCalculations(taskId, formalList, supplements);
    const reports = this.buildReports(taskId, calculations);
    const approvals = this.buildApprovals(taskId, supplements, formalList, calculations);
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
      candidateFilterRules: { customized: false },
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
    return [
      mainTask,
      completedTask,
      {
        id: 'T2025002',
        name: '2024年度（分行发起·补录进行中）',
        year: 2024,
        industryScope: '八大高碳行业',
        orgScope: '北京分行',
        balanceRule: '月均余额',
        goal: '监管报送',
        status: 'running',
        progress: 48,
        workflowStep: 3,
        initiatorOrg: 'branch',
        initiatorBranch: '北京分行',
        syncedFromInterface: true,
        syncedAt: '2025-03-10 14:00:00',
        syncYear: 2024,
        syncRecordTotal: 44160,
        candidateCount: 48,
        formalCount: 12,
        supplementDone: 4,
        supplementTotal: 8,
        approvalStatus: 'none',
        createdAt: '2025-03-01',
        createdBy: '王丽（北京分行）',
        deadline: '2025-09-30',
        milestone: { candidatesSynced: true, formalLocked: true, supplementDispatched: true }
      },
      {
        id: 'T2025003',
        name: '2025年度（待同步台账）',
        year: 2025,
        industryScope: '八大高碳行业',
        orgScope: '全行',
        balanceRule: '月均余额',
        goal: '内部分析',
        status: 'running',
        progress: 8,
        workflowStep: 0,
        initiatorOrg: 'hq',
        syncedFromInterface: false,
        candidateCount: 0,
        formalCount: 0,
        supplementDone: 0,
        supplementTotal: 0,
        approvalStatus: 'none',
        createdAt: '2025-05-01',
        createdBy: '张明（总行绿金部）',
        deadline: '2026-09-30'
      },
      {
        id: 'T2026001',
        name: '2026年度（新建·接口拉取演示）',
        year: 2026,
        industryScope: '八大高碳行业',
        orgScope: '全行',
        balanceRule: '月均余额',
        goal: '监管报送',
        status: 'running',
        progress: 0,
        workflowStep: 0,
        initiatorOrg: 'hq',
        syncedFromInterface: false,
        candidateCount: 0,
        formalCount: 0,
        supplementDone: 0,
        supplementTotal: 0,
        approvalStatus: 'none',
        createdAt: '2026-05-01',
        createdBy: '张明（总行绿金部）',
        deadline: '2027-09-30'
      }
    ];
  },

  buildFactors() {
    const guide = (typeof FACTORS_GUIDE !== 'undefined' ? FACTORS_GUIDE : []);
    const custom = [{
      id: 'CF001',
      methodId: 'energy',
      industryMajor: '电力',
      energyCategory: '固体燃料',
      itemName: '验收测试-烟煤',
      subIndustry: '火力发电',
      unit: 'tCO2e/t',
      value: 2.66,
      valueType: 'default',
      isBuiltin: false,
      status: 'active',
      sourceSheet: '自定义',
      sourceNote: '验收演示用自定义因子，可编辑/删除'
    }];
    return custom.concat(guide.map(f => ({ ...f })));
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
      { id: 'F008', cid: 'C2025001013', name: '江西铜业有限公司', major: '有色', code: 'C3216', biz: 'non_project', obj: '融资主体', project: null, boundary: '范围一+范围二', loc: '江西贵溪', inv: null, loanType: '保理' },
      { id: 'F033', cid: 'C2025001033', name: '大唐发电有限公司', major: '电力', code: 'D4412', biz: 'project', obj: '项目', project: '大唐内蒙煤电一体化项目', boundary: '范围一+范围二', loc: '内蒙古呼和浩特', inv: 680000 },
      { id: 'F034', cid: 'C2025001034', name: '华电能源有限公司', major: '电力', code: 'D4411', biz: 'project', obj: '项目', project: '华电燃机热电联产项目', boundary: '范围一+范围二', loc: '山东济南', inv: 410000 },
      { id: 'F035', cid: 'C2025001035', name: '申能股份有限公司', major: '电力', code: 'D4412', biz: 'project', obj: '项目', project: '申能临港燃气电厂扩建', boundary: '范围一+范围二', loc: '上海临港', inv: 550000 },
      { id: 'F036', cid: 'C2025001036', name: '粤电集团电力有限公司', major: '电力', code: 'D4411', biz: 'project', obj: '项目', project: '粤电沿海高效煤电项目', boundary: '范围一+范围二', loc: '广东阳江', inv: 720000 },
      { id: 'F037', cid: 'C2025001037', name: '三峡新能源发电有限公司', major: '电力', code: 'D4415', biz: 'project', obj: '项目', project: '三峡海上风电示范项目', boundary: '范围一+范围二', loc: '福建福清', inv: 890000 },
      { id: 'F038', cid: 'C2025001038', name: '蒙西热电联产有限公司', major: '电力', code: 'D4412', biz: 'project', obj: '项目', project: '蒙西园区热电联产工程', boundary: '范围一+范围二', loc: '内蒙古鄂尔多斯', inv: 360000 }
    ];
    const majors = ['电力', '钢铁', '建材', '化工', '有色', '石化', '造纸', '民航'];
    const codeMap = { 电力: 'D4411', 钢铁: 'C3120', 建材: 'C3011', 化工: 'C2614', 有色: 'C3216', 石化: 'C2511', 造纸: 'C2211', 民航: 'G5631' };
    const prefixes = ['华能', '国电', '宝钢', '河钢', '中建', '海螺', '万华', '中石化', '中铝', '晨鸣', '首都机场'];
    for (let i = specs.length; i < 38; i++) {
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
      industryMajor: s.major || cand?.industryMajor || '-',
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

  _methodLabel(methodId) {
    const map = { report: '报告法', energy: '能源法', product: '产品法', economy: '经济法', economy_fallback: '其他法' };
    return map[methodId] || methodId;
  },

  _bizLabel(bizType) {
    return bizType === 'project' ? '项目' : '非项目';
  },

  getSupplementTestSheets() {
    return [
      { sheet: '电力', industryMajor: '电力', gbCode: 'D4411', gbName: '火力发电', hasProduct: true },
      { sheet: '水泥', industryMajor: '建材', gbCode: 'C3011', gbName: '水泥制造', hasProduct: true },
      { sheet: '平板玻璃', industryMajor: '建材', gbCode: 'C3041', gbName: '平板玻璃制造', hasProduct: true },
      { sheet: '钢铁', industryMajor: '钢铁', gbCode: 'C3120', gbName: '炼钢', hasProduct: true },
      { sheet: '铝冶炼', industryMajor: '有色', gbCode: 'C3216', gbName: '铝冶炼', hasProduct: true },
      { sheet: '铜冶炼', industryMajor: '有色', gbCode: 'C3211', gbName: '铜冶炼', hasProduct: true },
      { sheet: '石化', industryMajor: '石化', gbCode: 'C2511', gbName: '原油加工及石油制品制造', hasProduct: true },
      { sheet: '化工', industryMajor: '化工', gbCode: 'C2614', gbName: '有机化学原料制造', hasProduct: true },
      { sheet: '造纸', industryMajor: '造纸', gbCode: 'C2211', gbName: '木竹浆制造', hasProduct: true },
      { sheet: '民航', industryMajor: '民航', gbCode: 'G5631', gbName: '机场', hasProduct: false }
    ];
  },

  getSupplementTestCases() {
    const methods = ['report', 'energy', 'product', 'economy', 'economy_fallback'];
    const bizTypes = ['project', 'non_project'];
    const branches = ['北京分行', '上海分行', '深圳分行', '杭州分行', '南京分行', '成都分行'];
    const managers = ['王磊', '陈静', '刘洋', '赵敏', '周强', '李娜'];
    const auditPipeline = [
      { status: 'pending', auditStage: 'pending_fill', approvalStatus: 'none', branchReviewStatus: 'none', hqReviewStatus: 'none', dispatched: false },
      { status: 'in_progress', auditStage: 'pending_fill', approvalStatus: 'none', branchReviewStatus: 'none', hqReviewStatus: 'none', dispatched: true },
      { status: 'completed', auditStage: 'branch_review', approvalStatus: 'pending', branchReviewStatus: 'pending', hqReviewStatus: 'none', dispatched: true },
      { status: 'completed', auditStage: 'hq_review', approvalStatus: 'pending', branchReviewStatus: 'approved', hqReviewStatus: 'pending', dispatched: true },
      { status: 'completed', auditStage: 'approved', approvalStatus: 'approved', branchReviewStatus: 'approved', hqReviewStatus: 'approved', dispatched: true },
      { status: 'returned', auditStage: 'pending_fill', approvalStatus: 'none', branchReviewStatus: 'rejected', hqReviewStatus: 'none', dispatched: true, rejectReason: '排放数据与披露报告不一致' }
    ];
    const cases = [];
    let n = 0;
    this.getSupplementTestSheets().forEach(sh => {
      bizTypes.forEach(bizType => {
        methods.forEach(methodId => {
          if (methodId === 'product' && !sh.hasProduct) return;
          const audit = auditPipeline[n % auditPipeline.length];
          cases.push({
            sheet: sh.sheet,
            industryMajor: sh.industryMajor,
            gbCode: sh.gbCode,
            gbName: sh.gbName,
            bizType,
            methodId,
            label: `${sh.sheet}·${this._bizLabel(bizType)}·${this._methodLabel(methodId)}`,
            status: audit.status,
            branch: branches[n % branches.length],
            manager: managers[n % managers.length],
            approvalStatus: audit.approvalStatus,
            auditStage: audit.auditStage,
            branchReviewStatus: audit.branchReviewStatus,
            hqReviewStatus: audit.hqReviewStatus,
            rejectReason: audit.rejectReason || null,
            dispatched: audit.dispatched,
            idx: n++
          });
        });
      });
    });
    return cases;
  },

  patchSupplementTestFormals(candidates, formalList, taskId, testCases) {
    (testCases || this.getSupplementTestCases()).forEach((tc, i) => {
      const cid = 'C99' + String(i + 1).padStart(4, '0');
      const fid = 'F99' + String(i + 1).padStart(4, '0');
      const isProject = tc.bizType === 'project';
      candidates.push({
        id: cid,
        taskId,
        customerName: `【补录测试】${tc.label}`,
        creditCode: '91310000TEST' + String(i + 1).padStart(4, '0'),
        gbIndustryCode: tc.gbCode,
        gbIndustryName: tc.gbName,
        industryMajor: tc.industryMajor,
        industryLabel: `${tc.gbCode} ${tc.gbName}`,
        bizType: tc.bizType,
        loanType: isProject ? '项目贷款' : '流动资金贷款',
        productType: isProject ? '一般性固定资产贷款' : '短期流动资金贷款',
        tier1Branch: tc.branch,
        branch: tc.branch,
        handlingBranch: tc.branch.replace('分行', '') + '营业部',
        manager: tc.manager,
        avgMonthlyBalance: 800 + (i % 20) * 120,
        operatingRevenue: 5000 + i * 200,
        status: 'confirmed',
        excluded: false,
        included: false
      });
      formalList.push({
        id: fid,
        taskId,
        customerId: cid,
        customerName: `【补录测试】${tc.label}`,
        loanType: isProject ? '项目贷款' : '流动资金贷款',
        productType: isProject ? '一般性固定资产贷款' : '短期流动资金贷款',
        collectMode: 'mandatory',
        bizType: tc.bizType,
        objectType: isProject ? '项目' : '融资主体',
        boundary: '范围一+范围二',
        scope1: true,
        scope2: true,
        scope3: false,
        controlApproach: '运营控制法',
        period: '自然年度',
        projectName: isProject ? `${tc.sheet}${this._methodLabel(tc.methodId)}示范项目` : null,
        facilityLocation: ['北京', '上海', '深圳', '杭州', '南京', '成都'][i % 6],
        boundaryNote: isProject ? '项目建设期运营边界（范围一、二）' : '融资主体运营边界（范围一、二）',
        gbIndustryCode: tc.gbCode,
        gbIndustryName: tc.gbName,
        industryMajor: tc.industryMajor,
        industryLabel: `${tc.gbCode} ${tc.gbName}`,
        tier1Branch: tc.branch,
        branch: tc.branch,
        manager: tc.manager,
        avgMonthlyBalance: 800 + (i % 20) * 120,
        operatingRevenue: 5000 + i * 200,
        totalInvestment: isProject ? 300000 + i * 15000 : null,
        status: 'confirmed',
        lockedAt: '2025-02-20',
        testCaseLabel: tc.label
      });
      tc.formalId = fid;
      tc.customerId = cid;
    });
  },

  patchPowerIndustryCandidates(candidates, taskId) {
    const rows = [
      { id: 'C2025001006', customerName: '华能发电有限公司', gbIndustryCode: 'D4411', gbIndustryName: '火力发电', industryLabel: 'D4411 火力发电 不包括既发电又提供热力的活动', tier1Branch: '北京分行', manager: '王磊' },
      { id: 'C2025001010', customerName: '国电发电有限公司', gbIndustryCode: 'D4411', gbIndustryName: '火力发电', industryLabel: 'D4411 火力发电', tier1Branch: '上海分行', manager: '陈静' },
      { id: 'C2025001033', customerName: '大唐发电有限公司', gbIndustryCode: 'D4412', gbIndustryName: '热电联产', industryLabel: 'D4412 热电联产', tier1Branch: '北京分行', manager: '王磊' },
      { id: 'C2025001034', customerName: '华电能源有限公司', gbIndustryCode: 'D4411', gbIndustryName: '火力发电', industryLabel: 'D4411 火力发电', tier1Branch: '南京分行', manager: '刘洋' },
      { id: 'C2025001035', customerName: '申能股份有限公司', gbIndustryCode: 'D4412', gbIndustryName: '热电联产', industryLabel: 'D4412 热电联产', tier1Branch: '上海分行', manager: '李娜' },
      { id: 'C2025001036', customerName: '粤电集团电力有限公司', gbIndustryCode: 'D4411', gbIndustryName: '火力发电', industryLabel: 'D4411 火力发电', tier1Branch: '深圳分行', manager: '赵敏' },
      { id: 'C2025001037', customerName: '三峡新能源发电有限公司', gbIndustryCode: 'D4415', gbIndustryName: '风力发电', industryLabel: 'D4415 风力发电', tier1Branch: '杭州分行', manager: '周强' },
      { id: 'C2025001038', customerName: '蒙西热电联产有限公司', gbIndustryCode: 'D4412', gbIndustryName: '热电联产', industryLabel: 'D4412 热电联产', tier1Branch: '成都分行', manager: '王磊' }
    ];
    rows.forEach(p => {
      let c = candidates.find(x => x.id === p.id);
      if (!c) {
        c = {
          id: p.id, taskId, creditCode: '91110000MA' + p.id.slice(-6) + 'X',
          loanType: '项目贷款', productType: '一般性固定资产贷款', bizType: 'project',
          avgMonthlyBalance: 1200 + Math.random() * 800, operatingRevenue: 8000,
          handlingBranch: p.tier1Branch.replace('分行', '') + '营业部', status: 'confirmed', excluded: false
        };
        candidates.push(c);
      }
      Object.assign(c, p, {
        industryMajor: '电力', bizType: 'project', loanType: '项目贷款',
        productType: '一般性固定资产贷款', excluded: false, excludeReason: null
      });
    });
  },

  _buildSupplementFromFormal(taskId, f, i, cfg) {
    const methodIds = ['report', 'energy', 'product', 'economy', 'economy_fallback'];
    const methodId = cfg.methodId || methodIds[i % methodIds.length];
    const m = GUIDE.METHODS.find(x => x.id === methodId);
    const status = cfg.status || 'pending';
    const branch = cfg.branch || f.branch || '北京分行';
    const manager = cfg.manager || f.manager || '王磊';
    return {
      id: cfg.id,
      taskId,
      formalId: f.id,
      customerId: f.customerId,
      customerName: f.customerName,
      branch,
      manager,
      status,
      method: m?.name || '待选择',
      methodId,
      qualityGrade: m?.qualityGrade,
      fieldsTotal: 18,
      fieldsDone: status === 'completed' ? 18 : (status === 'in_progress' ? 10 : (status === 'returned' ? 6 : 0)),
      deadline: '2025-09-30',
      approvalStatus: cfg.approvalStatus || 'none',
      needAmount: !!cfg.needAmount,
      reportedEmission: methodId === 'report' ? (cfg.reportedEmission ?? 480000 + i * 15000) : undefined,
      energyTotalEmission: methodId === 'energy' ? (cfg.energyTotalEmission ?? 390000 + i * 9000) : undefined,
      productTotalEmission: methodId === 'product' ? (cfg.productTotalEmission ?? 280000 + i * 7000) : undefined,
      economyValue: methodId === 'economy' ? (cfg.economyValue ?? 1800000 + i * 40000) : undefined,
      economyFactor: 2.35,
      economyBasis: 'revenue',
      totalAssets: cfg.totalAssets ?? 850000 + i * 18000,
      revenue: cfg.revenue ?? 420000 + i * 12000,
      avgLoanBalance: cfg.avgLoanBalance ?? 28000 + i * 900,
      loanType: f.loanType,
      bizType: f.bizType,
      industryMajor: f.industryMajor,
      gbIndustryCode: f.gbIndustryCode,
      testCaseLabel: f.testCaseLabel || cfg.testCaseLabel,
      fallbackFactor: methodId === 'economy_fallback' ? (cfg.fallbackFactor ?? 2.46 + (i % 10) * 0.05) : undefined,
      branchReviewStatus: cfg.branchReviewStatus || (status === 'completed' ? 'approved' : 'none'),
      hqReviewStatus: cfg.hqReviewStatus || 'none',
      auditStage: cfg.auditStage || (status === 'completed' ? 'hq_review' : (status === 'returned' ? 'pending_fill' : 'pending_fill')),
      rejectReason: cfg.rejectReason || null,
      dispatchedAt: cfg.dispatched === false ? null : (cfg.dispatchedAt || '2025-02-16 10:00:00'),
      dispatchedBy: cfg.dispatched === false ? null : (cfg.dispatchedBy || '张明（总行绿金部）')
    };
  },

  patchBranchTaskData(candidates, formalList, supplements) {
    const taskId = 'T2025002';
    const branchSpecs = [
      { cid: 'CB001', fid: 'FB001', name: '北京分行-华电项目客户', major: '电力', code: 'D4411', biz: 'project', manager: '王磊', method: 'report', status: 'in_progress' },
      { cid: 'CB002', fid: 'FB002', name: '北京分行-河钢主体客户', major: '钢铁', code: 'C3120', biz: 'non_project', manager: '王磊', method: 'energy', status: 'pending' },
      { cid: 'CB003', fid: 'FB003', name: '北京分行-贴现必收客户', major: '钢铁', code: 'C3120', biz: 'non_project', manager: '陈静', method: 'report', status: 'completed', loanType: '票据贴现' }
    ];
    branchSpecs.forEach((s, i) => {
      candidates.push({
        id: s.cid, taskId, customerName: s.name,
        creditCode: '91110100BRANCH' + String(i + 1).padStart(4, '0'),
        gbIndustryCode: s.code, gbIndustryName: s.major, industryMajor: s.major,
        industryLabel: `${s.code} ${s.major}`,
        bizType: s.biz, loanType: s.loanType || (s.biz === 'project' ? '项目贷款' : '流动资金贷款'),
        productType: s.biz === 'project' ? '一般性固定资产贷款' : '短期流动资金贷款',
        tier1Branch: '北京分行', branch: '北京分行', handlingBranch: '北京营业部',
        manager: s.manager, avgMonthlyBalance: 600 + i * 80, operatingRevenue: 3000 + i * 500,
        status: 'confirmed', excluded: false, included: true
      });
      formalList.push({
        id: s.fid, taskId, customerId: s.cid, customerName: s.name,
        loanType: s.loanType || (s.biz === 'project' ? '项目贷款' : '流动资金贷款'),
        collectMode: this._collectMode(s.loanType || (s.biz === 'project' ? '项目贷款' : '流动资金贷款')),
        bizType: s.biz, objectType: s.biz === 'project' ? '项目' : '融资主体',
        boundary: '范围一+范围二', scope1: true, scope2: true, scope3: false,
        gbIndustryCode: s.code, industryMajor: s.major, branch: '北京分行', manager: s.manager,
        status: 'confirmed', lockedAt: '2025-03-05'
      });
      if (s.loanType !== '票据贴现') {
        supplements.push(this.enrichSupplementFieldData(
          this._buildSupplementFromFormal(taskId, formalList[formalList.length - 1], i, {
            id: 'SB00' + (i + 1),
            methodId: s.method,
            status: s.status,
            branch: '北京分行',
            manager: s.manager,
            dispatched: s.status !== 'pending',
            auditStage: s.status === 'completed' ? 'approved' : 'pending_fill',
            approvalStatus: s.status === 'completed' ? 'approved' : 'none',
            branchReviewStatus: 'none',
            hqReviewStatus: 'none',
            reportedEmission: s.method === 'report' ? 520000 : undefined,
            energyTotalEmission: s.method === 'energy' ? 410000 : undefined
          }),
          formalList
        ));
      }
    });
  },

  buildSupplements(taskId, formalList, testCases) {
    const cases = testCases || this.getSupplementTestCases();
    const matrixSupps = cases.map((tc, i) => {
      const f = formalList.find(x => x.id === tc.formalId);
      if (!f) return null;
      return this._buildSupplementFromFormal(taskId, f, i, {
        id: 'S' + String(i + 1).padStart(3, '0'),
        methodId: tc.methodId,
        status: tc.status,
        branch: tc.branch,
        manager: tc.manager,
        approvalStatus: tc.approvalStatus,
        auditStage: tc.auditStage,
        branchReviewStatus: tc.branchReviewStatus,
        hqReviewStatus: tc.hqReviewStatus,
        testCaseLabel: tc.label,
        rejectReason: tc.rejectReason,
        dispatched: tc.dispatched,
        reportedEmission: tc.methodId === 'report' ? 420000 + i * 8000 : undefined,
        energyTotalEmission: tc.methodId === 'energy' ? 360000 + i * 7000 : undefined,
        productTotalEmission: tc.methodId === 'product' ? 260000 + i * 6000 : undefined,
        economyValue: tc.methodId === 'economy' ? 1600000 + i * 35000 : undefined,
        economyFactor: 2.35 + (i % 5) * 0.12,
        fallbackFactor: tc.methodId === 'economy_fallback' ? 2.46 + (i % 8) * 0.08 : undefined
      });
    }).filter(Boolean);

    return matrixSupps.map(s => this.enrichSupplementFieldData(s, formalList));
  },

  enrichSupplementFieldData(s, formalList) {
    const f = formalList.find(x => x.id === s.formalId);
    if (!f || !s.methodId) return s;
    const tpl = typeof SUPPLEMENT_FIELDS !== 'undefined' ? SUPPLEMENT_FIELDS.resolveTemplate({ ...s, industryMajor: f.industryMajor, bizType: f.bizType, gbIndustryCode: f.gbIndustryCode }) : null;
    const n = parseInt(String(s.id || '').replace(/\D/g, ''), 10) || 0;
    const fieldData = { ...(s.fieldData || {}) };
    if (s.methodId === 'report' && tpl?.methods?.report) {
      const sources = tpl.methods.report.sourceOptions || [];
      fieldData.report = {
        source: sources[n % sources.length],
        verified: n % 3 !== 1,
        emission: s.reportedEmission,
        attachments: s.status === 'completed'
          ? [{ name: `2024年度碳排放报告-${(f.customerName || '').slice(0, 12)}.pdf`, size: 1200000 + (n % 7) * 100000, uploadedAt: '2025-03-01 10:00:00' }]
          : (s.status === 'in_progress' ? [{ name: '碳排放数据草案.xlsx', size: 520000, uploadedAt: '2025-04-01 09:00:00' }] : [])
      };
    }
    if (s.methodId === 'energy' && tpl?.methods?.energy) {
      const en = tpl.methods.energy;
      const energy = {
        coal: 50000 + (n % 9) * 12000, coke: 4000 + (n % 5) * 500, diesel: 600 + (n % 4) * 80, gas: 150 + (n % 6) * 30,
        otherFuel1Type: (en.otherFuelOptions || [])[n % (en.otherFuelOptions.length || 1)] || null,
        otherFuel1Amount: 2000 + (n % 8) * 300,
        otherFuel2Type: (en.otherFuelOptions || [])[(n + 3) % (en.otherFuelOptions.length || 1)] || null,
        otherFuel2Amount: n % 2 === 0 ? 800 + (n % 5) * 150 : null,
        powerGrid: (en.gridOptions || ['全国平均'])[n % (en.gridOptions.length || 1)],
        purchasedElectricity: 300000 + (n % 10) * 50000
      };
      if (en.hasPurchasedHeat) energy.purchasedHeat = 8000 + (n % 7) * 1200;
      (en.processBlocks || []).forEach(block => {
        if (block.type === 'desulfur') {
          energy.desulfur1Type = (block.typeOptions || [])[n % (block.typeOptions.length || 1)];
          energy.desulfur1Amount = 1500 + (n % 6) * 200;
          if ((block.slots || 2) > 1) {
            energy.desulfur2Type = (block.typeOptions || [])[(n + 1) % (block.typeOptions.length || 1)];
            energy.desulfur2Amount = n % 3 === 0 ? 400 + (n % 4) * 80 : null;
          }
        } else if (block.type === 'carbonate') {
          const p = block.keyPrefix || 'carbonate';
          energy[p + 'Type'] = (block.typeOptions || [])[n % (block.typeOptions.length || 1)];
          energy[p + 'Amount'] = 3000 + (n % 9) * 400;
        } else if (block.type === 'amount' && block.key) {
          energy[block.key] = 500 + (n % 8) * 100;
        }
      });
      fieldData.energy = energy;
    }
    if (s.methodId === 'product' && tpl?.methods?.product?.fields?.length) {
      const product = {};
      tpl.methods.product.fields.forEach((pf, i) => {
        product[pf.key] = Math.round((10000 + (n % 11) * 2000) * (1 + (i % 3) * 0.5));
      });
      fieldData.product = product;
    }
    if (s.methodId === 'economy') {
      fieldData.economy = {
        basis: s.economyBasis || 'revenue',
        value: s.economyValue,
        factor: s.economyFactor
      };
    }
    if (s.methodId === 'economy_fallback') {
      fieldData.other = { fallbackFactor: s.fallbackFactor ?? 2.46 };
    }
    return Object.keys(fieldData).length ? { ...s, fieldData } : s;
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
    const formats = ['Excel', 'Word', '监管报表'];
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
      { id: 'RPT003', name: '归因排放明细清单', scope: scopes[2], format: 'Word', status: 'success' },
      { id: 'RPT004', name: '数据质量说明（DQR附表）', scope: scopes[0], format: 'Word', status: 'generating' }
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

  buildApprovals(taskId, supplements, formalList, calculations) {
    const list = [
      { id: 'APR001', taskId, docType: 'formal', docId: 'F001', docName: '正式清单-华能发电', submitter: '张明', submitTime: '2025-02-18 10:00', status: 'approved', approver: '李总', approveTime: '2025-02-19 15:30' },
      { id: 'APR002B', taskId, docType: 'supplement', docId: 'S001', docName: '数据采集-【补录测试】电力·项目·报告法（分行）', reviewLevel: 'branch', submitter: '王磊', submitTime: '2025-03-05 09:20', status: 'approved', approver: '王丽', approveTime: '2025-03-06 11:00' },
      { id: 'APR002', taskId, docType: 'supplement', docId: 'S001', docName: '数据采集-【补录测试】电力·项目·报告法', reviewLevel: 'hq', submitter: '王磊', submitTime: '2025-03-05 09:20', status: 'approved', approver: '张明', approveTime: '2025-03-07 14:00' },
      { id: 'APR004', taskId, docType: 'calculation', docId: 'CAL001', docName: '碳排放计算-华能发电', submitter: '张明', submitTime: '2025-05-11 14:00', status: 'approved', approver: '李总', approveTime: '2025-05-12 09:00' },
      { id: 'APR005', taskId, docType: 'calculation', docId: 'CAL002', docName: '碳排放计算-宝钢炼钢', submitter: '张明', submitTime: '2025-05-11 14:05', status: 'pending', approver: null, approveTime: null },
      { id: 'APR006', taskId, docType: 'formal', docId: 'F003', docName: '正式清单-中建水泥', submitter: '张明', submitTime: '2025-02-20 11:00', status: 'pending', approver: null, approveTime: null }
    ];
    let seq = 100;
    (supplements || []).filter(s => s.taskId === taskId).forEach(s => {
      if (s.auditStage === 'branch_review' && s.branchReviewStatus === 'pending') {
        list.push({
          id: 'APR' + seq++,
          taskId,
          docType: 'supplement',
          docId: s.id,
          docName: '数据采集-' + (s.customerName || s.id),
          reviewLevel: 'branch',
          submitter: s.manager || '王磊',
          submitTime: '2025-04-10 10:30',
          status: 'pending',
          approver: null,
          approveTime: null
        });
      }
      if (s.auditStage === 'hq_review' && s.hqReviewStatus === 'pending') {
        list.push({
          id: 'APR' + seq++,
          taskId,
          docType: 'supplement',
          docId: s.id,
          docName: '数据采集-' + (s.customerName || s.id),
          reviewLevel: 'hq',
          submitter: s.manager || '王磊',
          submitTime: '2025-04-15 16:00',
          status: 'pending',
          approver: null,
          approveTime: null
        });
      }
    });
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
