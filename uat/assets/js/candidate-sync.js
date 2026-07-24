/** 生成接口同步用候选业务假数据 */
const CandidateSync = {
  NAMES: {
    电力: ['华能', '国电', '大唐', '华电', '申能'],
    钢铁: ['宝钢', '鞍钢', '首钢', '河钢', '沙钢'],
    建材: ['中建', '海螺', '冀东', '华润水泥', '金隅'],
    化工: ['中石化', '巴斯夫', '万华', '恒力', '桐昆'],
    有色: ['中国铝业', '江西铜业', '紫金', '云铝', '南山铝业'],
    石化: ['中石油', '中石化炼化', '恒逸', '荣盛', '东方石化'],
    造纸: ['晨鸣', '太阳', '博汇', '山鹰', '华泰'],
    民航: ['首都机场', '白云机场', '浦东机场', '深圳机场', '成都机场']
  },
  LOAN_TYPES: GUIDE.CANDIDATE_PRODUCT_TYPES,
  HANDLING_SUFFIX: ['营业部', '朝阳支行', '海淀支行', '浦东支行', '福田支行', '西湖支行'],
  BRANCHES: ['北京分行', '上海分行', '深圳分行', '杭州分行', '南京分行', '成都分行'],
  MANAGERS: ['王磊', '陈静', '刘洋', '赵敏', '周强', '李娜'],
  CODE_MAP: {
    电力: ['D4411', 'D4412', 'D4420'],
    建材: ['C3011', 'C3041'],
    钢铁: ['C3110', 'C3120', 'C3130'],
    有色: ['C3211', 'C3216'],
    石化: ['C2511'],
    化工: ['C2614', 'C2621', 'C2651'],
    造纸: ['C2211', 'C2221'],
    民航: ['G5631', 'G5611', 'G5612']
  },

  /** 该笔贷款在核算年度内于本行的存续月份（非固定 12） */
  tenureMonths(disbursementDate, accountingYear) {
    const year = Number(accountingYear) || new Date().getFullYear();
    if (!disbursementDate) return 12;
    const m = String(disbursementDate).match(/^(\d{4})-(\d{1,2})/);
    if (!m) return 12;
    const dy = parseInt(m[1], 10);
    const dm = parseInt(m[2], 10);
    if (dy > year) return 1;
    if (dy < year) return 12;
    return Math.max(1, 12 - dm + 1);
  },

  /** 格澜 mock：信用代码数字末两位 %5===0 则接口无数据 */
  _creditCodeForGelan(idx, loanType, bizType) {
    const mandatory = (GUIDE.MANDATORY_COLLECT_LOAN_TYPES || []).some(t => (loanType || '').includes(t));
    if (bizType !== 'non_project' || mandatory) {
      return '91' + String(110000 + idx).slice(0, 6) + 'MA' + String(idx).padStart(4, '0') + 'X';
    }
    const gelanHasData = idx % 2 === 1;
    const tail = gelanHasData ? (11 + (idx % 4)) : (10 + (idx % 3) * 5);
    return `91110109MA01${String(idx % 100).padStart(2, '0')}${String(tail).padStart(2, '0')}X`;
  },

  generateBatch(taskId, count = 48, year, month) {
    const rows = [];
    const majors = GUIDE.INDUSTRIES.map(i => i.major);
    const yearOff = (year ? (year - 2020) * 11 : 0) + (month ? month * 17 : 0);
    for (let i = 0; i < count; i++) {
      const idx = i + yearOff;
      const major = majors[idx % majors.length];
      const names = this.NAMES[major] || ['示范'];
      const name = names[idx % names.length] + (major === '电力' ? '发电' : major === '钢铁' ? '炼钢' : '') + '有限公司';
      const code = this.CODE_MAP[major][idx % this.CODE_MAP[major].length];
      const loanType = this.LOAN_TYPES[idx % this.LOAN_TYPES.length];
      const bizType = ['一般性固定资产贷款', '出口退税账户托管贷款'].includes(loanType) ? 'project' : 'non_project';
      const tier1Branch = this.BRANCHES[idx % this.BRANCHES.length];
      const handlingBranch = tier1Branch.replace('分行', '') + this.HANDLING_SUFFIX[idx % this.HANDLING_SUFFIX.length];
      let industryMajor = major;
      const industryOpt = (GUIDE.CANDIDATE_INDUSTRY_OPTIONS || [])[idx % (GUIDE.CANDIDATE_INDUSTRY_OPTIONS.length || 1)] || { code, label: major };
      const industryLabel = (typeof isGbIndustryNameOnlyDisplay === 'function'
        && isGbIndustryNameOnlyDisplay(industryOpt.code))
        ? (typeof resolveGbIndustryShortName === 'function'
          ? resolveGbIndustryShortName(industryOpt.code, industryOpt.label)
          : industryOpt.label)
        : `${industryOpt.code} ${industryOpt.label}`;

      let excludeReason = null;
      let avgMonthlyBalance = 800 + (idx * 137) % 12000;
      let isSme = false;
      let isIndividual = false;
      let isOverseas = false;
      const borrowerTypes = GUIDE.CANDIDATE_BORROWER_TYPES || ['有限责任公司'];
      let borrowerType = borrowerTypes[idx % borrowerTypes.length];

      const bucket = idx % 20;
      if (bucket === 0) {
        avgMonthlyBalance = 80 + (idx % 400);
        if (bizType === 'non_project') excludeReason = 'LOW_BALANCE';
      }
      else if (bucket === 1) { isSme = true; excludeReason = 'SME'; avgMonthlyBalance = 600; borrowerType = '小微客户'; }
      else if (bucket === 2) { isIndividual = true; excludeReason = 'INDIVIDUAL'; avgMonthlyBalance = 300; borrowerType = '个贷'; }
      else if (bucket === 3) { isOverseas = true; excludeReason = 'OVERSEAS'; avgMonthlyBalance = 2000; borrowerType = '上市公司'; }
      else if (bucket === 4) { industryMajor = null; excludeReason = 'NON_HIGH_CARBON'; }

      let customerScale = '大型企业';
      let enterpriseScale = '大型企业';
      if (isSme) {
        enterpriseScale = idx % 2 === 0 ? '小型企业' : '微型企业';
        customerScale = enterpriseScale;
      } else if (idx % 3 === 0) {
        customerScale = '中型企业';
        enterpriseScale = '中型企业';
      }
      const companyNatures = GUIDE.COMPANY_NATURES || ['国有', '民营'];
      const companyTypes = GUIDE.COMPANY_TYPES || GUIDE.CANDIDATE_BORROWER_TYPES || ['有限责任公司'];
      const companyNature = companyNatures[idx % companyNatures.length];
      const companyType = isIndividual ? '个贷' : (isSme ? '小微客户' : companyTypes[idx % companyTypes.length]);

      const excluded = !!excludeReason;
      const disbursementAmount = Math.round(avgMonthlyBalance * 10000 * (8 + (idx % 5)));
      const accountingYear = year || 2024;
      const disbursementDate = `${accountingYear}-${String((idx % 12) + 1).padStart(2, '0')}-${String(10 + (idx % 18)).padStart(2, '0')}`;
      const bankTenureMonths = this.tenureMonths(disbursementDate, accountingYear);
      const monthEndBalanceSum = Math.round(avgMonthlyBalance * bankTenureMonths);
      avgMonthlyBalance = monthEndBalanceSum / bankTenureMonths;
      const totalAssets = avgMonthlyBalance * 80 + idx * 1000;
      const prevYearTotalAssets = avgMonthlyBalance * 75 + idx * 900;
      const avgTotalAssets = (totalAssets + prevYearTotalAssets) / 2;
      const operatingRevenue = Math.round(avgMonthlyBalance * 6 + idx * 500);
      const hasSyncedProjectInfo = bizType === 'project' && (idx % 3 !== 0);
      const projectTotalInvestmentWan = hasSyncedProjectInfo
        ? Math.round((avgMonthlyBalance || 0) * (18 + (idx % 7)))
        : null;
      const projectDetails = hasSyncedProjectInfo
        ? [{
          projectNo: `PRJ${String(year || 2024)}${String(i + 1).padStart(4, '0')}`,
          projectName: `${name.replace('有限公司', '')}项目`,
          projectProvince: tier1Branch.replace('分行', ''),
          projectIndustry: industryMajor || major,
          customerNo: `KH${String(100000 + idx)}`,
          customerName: name,
          creditCode: this._creditCodeForGelan(idx, loanType, bizType),
          nationalIndustryCodeLv4: industryMajor ? (industryOpt.code || code) : 'C4190',
          projectAvgLoanBalanceWan: avgMonthlyBalance,
          projectRevenueWan: operatingRevenue,
          projectTotalInvestmentWan
        }]
        : [];
      rows.push({
        id: 'C' + taskId.replace(/\D/g, '').slice(-6) + String(i + 1).padStart(3, '0'),
        taskId,
        customerName: name,
        customerScale,
        enterpriseScale,
        companyNature,
        companyType,
        creditCode: this._creditCodeForGelan(idx, loanType, bizType),
        gbIndustryCode: industryMajor ? (industryOpt.code || code) : 'C4190',
        gbIndustryName: industryMajor
          ? (typeof resolveGbIndustryShortName === 'function'
            ? resolveGbIndustryShortName(industryOpt.code, industryOpt.label)
            : (industryOpt.label || GUIDE.INDUSTRIES.find(x => x.major === major)?.names[0]))
          : '其他',
        industryMajor: industryMajor || '-',
        industryLabel: industryMajor ? industryLabel : 'C4190 其他',
        borrowerType,
        productType: loanType,
        loanType,
        bizType,
        accountingType: bizType === 'project'
          ? (projectDetails.length ? 'project_as_project' : null)
          : 'non_project',
        projectInfoAvailable: (bizType === 'project' && projectDetails.length) ? true : null,
        tier1Branch,
        handlingBranch,
        creditRefNo: `CREF${year || 2024}${String(100000 + idx)}`,
        creditNo: `CREDIT${year || 2024}${String(100000 + idx)}`,
        loanAccount: '622' + String(1000000000000 + idx * 7919).slice(0, 13),
        disbursementAmount,
        disbursementDate,
        operatingRevenue,
        projectTotalInvestmentWan,
        projectDetails,
        monthEndBalanceSum,
        bankTenureMonths,
        avgMonthlyBalance,
        totalAssets,
        prevYearTotalAssets,
        avgTotalAssets,
        branch: tier1Branch,
        manager: this.MANAGERS[idx % this.MANAGERS.length],
        isSme,
        isIndividual,
        isOverseas,
        excludeReason,
        excluded,
        included: !excluded,
        syncedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        accountingYear: year || null
      });
    }
    this.injectAnsteelEmissionConflictDemo(rows, taskId, year);
    return rows;
  },

  /**
   * 接口同步演示数据：鞍钢炼钢有限公司 ×3，统一社会信用代码相同，
   * 分别对应非项目、项目（计算方法待定）、项目（以项目方式计算），便于测试同主体排放冲突。
   */
  injectAnsteelEmissionConflictDemo(rows, taskId, year) {
    const uscc = '91110100MA3ANSTEELX';
    const customerName = '鞍钢炼钢有限公司';
    if ((rows || []).some(r => r._ansteelConflictDemo && r.taskId === taskId)) return rows;
    const major = '钢铁';
    const code = 'C3120';
    const accountingYear = year || 2024;
    const taskNum = String(taskId || '').replace(/\D/g, '').slice(-6).padStart(6, '0');
    const specs = [
      {
        suffix: '01',
        bizType: 'non_project',
        accountingType: 'non_project',
        loanType: '短期流动资金贷款',
        branch: '北京分行',
        manager: '王磊',
        balance: 5200,
        projectDetails: [],
        projectInfoAvailable: null,
        bizLabel: '非项目'
      },
      {
        suffix: '02',
        bizType: 'project',
        accountingType: null,
        loanType: '一般性固定资产贷款',
        branch: '北京分行',
        manager: '陈静',
        balance: 4800,
        projectDetails: [],
        projectInfoAvailable: null,
        bizLabel: '项目（计算方法待定）'
      },
      {
        suffix: '03',
        bizType: 'project',
        accountingType: 'project_as_project',
        loanType: '一般性固定资产贷款',
        branch: '北京分行',
        manager: '刘洋',
        balance: 6100,
        projectDetails: [{
          projectNo: 'PRJ-ANSTEEL-2024',
          projectName: '鞍钢炼钢节能技改项目',
          projectProvince: '辽宁',
          projectIndustry: '钢铁',
          customerNo: 'KHANSTEEL01',
          customerName,
          creditCode: uscc,
          nationalIndustryCodeLv4: code,
          projectAvgLoanBalanceWan: 6100,
          projectRevenueWan: 36000,
          projectTotalInvestmentWan: 480000
        }],
        projectInfoAvailable: true,
        bizLabel: '项目（以项目方式计算）'
      }
    ];
    const injected = specs.map((s, i) => {
      const idx = 9000 + i;
      const tier1Branch = s.branch;
      const handlingBranch = tier1Branch.replace('分行', '') + '营业部';
      const disbursementDate = `${accountingYear}-0${i + 3}-15`;
      const bankTenureMonths = this.tenureMonths(disbursementDate, accountingYear);
      const monthEndBalanceSum = Math.round(s.balance * bankTenureMonths);
      const avgMonthlyBalance = monthEndBalanceSum / bankTenureMonths;
      const operatingRevenue = Math.round(s.balance * 6 + idx * 10);
      const totalAssets = avgMonthlyBalance * 80 + idx * 100;
      const prevYearTotalAssets = avgMonthlyBalance * 75 + idx * 90;
      return {
        id: 'C' + taskNum + 'AS' + s.suffix,
        taskId,
        customerName,
        testCaseLabel: `【冲突测试】${s.bizLabel}`,
        customerScale: '大型企业',
        enterpriseScale: '大型企业',
        companyNature: '国有',
        companyType: '有限责任公司',
        creditCode: uscc,
        gbIndustryCode: code,
        gbIndustryName: '炼钢',
        industryMajor: major,
        industryLabel: `${code} 炼钢`,
        borrowerType: '有限责任公司',
        productType: s.loanType,
        loanType: s.loanType,
        bizType: s.bizType,
        accountingType: s.accountingType,
        projectInfoAvailable: s.projectInfoAvailable,
        tier1Branch,
        handlingBranch,
        creditRefNo: `CREF${accountingYear}ANST${s.suffix}`,
        creditNo: `CREDIT${accountingYear}ANST${s.suffix}`,
        loanAccount: '622' + String(8800000000000 + idx).slice(0, 13),
        disbursementAmount: Math.round(avgMonthlyBalance * 10000 * 9),
        disbursementDate,
        operatingRevenue,
        projectTotalInvestmentWan: s.projectDetails[0]?.projectTotalInvestmentWan || null,
        projectDetails: s.projectDetails,
        monthEndBalanceSum,
        bankTenureMonths,
        avgMonthlyBalance,
        totalAssets,
        prevYearTotalAssets,
        avgTotalAssets: (totalAssets + prevYearTotalAssets) / 2,
        branch: tier1Branch,
        manager: s.manager,
        isSme: false,
        isIndividual: false,
        isOverseas: false,
        excludeReason: null,
        excluded: false,
        included: true,
        syncedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        accountingYear,
        _ansteelConflictDemo: true
      };
    });
    rows.unshift(...injected);
    return rows;
  },

  /** 与候选清单一致的演示企业名称 */
  formatCompanyName(major, idx) {
    const names = this.NAMES[major] || ['示范'];
    const brand = names[idx % names.length];
    const mid = major === '电力' ? '发电' : (major === '钢铁' ? '炼钢' : '');
    return `${brand}${mid}有限公司`;
  },

  /** 接口管理批次查看：按数据月份生成台账预览（字段与候选清单一致） */
  generateInterfaceBatchPreview(batch, limit = 15) {
    const year = batch.dataYear || Number((batch.dataMonth || '2025-01').slice(0, 4));
    const month = Number((batch.dataMonth || '2025-01').slice(5, 7)) || 1;
    const count = Math.min(limit, Math.max(10, Math.round((batch.recordCount || 3000) / 250)));
    return this.generateBatch(batch.id, count, year, month);
  },

  /** 按核算年度从接口台账池生成演示数据（全量在接口侧，演示页展示子集） */
  generateBatchForYear(taskId, year, count) {
    return this.generateBatch(taskId, count, year);
  },

  /** 演示列表展示笔数（接口全量可能达数万笔） */
  demoDisplayCount(totalInInterface) {
    return Math.min(56, Math.max(40, Math.round(Math.sqrt(totalInInterface / 15))));
  }
};

if (typeof window !== 'undefined') window.CandidateSync = CandidateSync;
