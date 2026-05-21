/** 《商业银行投融资业务碳核算与报告指南》/ 高碳类投融资碳核算操作指引 — 常量 */
window.GUIDE = {
  /** 方法优先级：报告法 > 物理活动法-能源法 > 物理活动法-产品法 > 经济活动法 */
  METHODS: [
    { id: 'report', name: '报告法', priority: 1, qualityGrade: 1, scope: 'entity,project',
      desc: '采用核查报告、ESG报告、环境信息披露等披露的碳排放数据' },
    { id: 'energy', name: '物理活动法-能源法', priority: 2, qualityGrade: 2, scope: 'entity,project',
      desc: 'E=Σ(能源消耗量×因子)+工艺排放+净购入电热×区域因子' },
    { id: 'product', name: '物理活动法-产品法', priority: 3, qualityGrade: 3, scope: 'entity,project',
      desc: 'E=Σ(产品产量×产品碳排放因子)' },
    { id: 'economy', name: '经济活动法', priority: 4, qualityGrade: 4, scope: 'entity,project',
      desc: 'E=营业收入(或资产规模)×行业排放强度因子' },
    { id: 'economy_fallback', name: '其他计算法', priority: 5, qualityGrade: 5, scope: 'attribution_only',
      desc: '无法获取主体数据时：E业务=日均(月均)余额×行业因子' }
  ],
  /** 八大高碳行业及 GB/T 4754 代码（节选） */
  INDUSTRIES: [
    { major: '电力', codes: ['D4411', 'D4412', 'D4417', 'D4420'], names: ['火力发电', '热电联产', '生物质能发电', '电力供应'] },
    { major: '建材', codes: ['C3011', 'C3041'], names: ['水泥制造', '平板玻璃制造'] },
    { major: '钢铁', codes: ['C3110', 'C3120', 'C3130'], names: ['炼铁', '炼钢', '钢压延加工'] },
    { major: '有色', codes: ['C3216', 'C3211'], names: ['铝冶炼', '铜冶炼'] },
    { major: '石化', codes: ['C2511'], names: ['原油加工及石油制品制造'] },
    { major: '化工', codes: ['C2611', 'C2612', 'C2614', 'C2621', 'C2651'], names: ['无机酸制造', '无机碱制造', '有机化学原料制造', '氮肥制造', '合成树脂制造'] },
    { major: '造纸', codes: ['C2211', 'C2221'], names: ['木竹浆制造', '机制纸及纸板制造'] },
    { major: '民航', codes: ['G5631'], names: ['机场'] }
  ],
  LOAN_TYPES_IN_SCOPE: ['项目贷款', '固定资产贷款', '流动资金贷款', '票据贴现', '贸易融资项下贴现', '保理'],
  /** 贴现、保理必须发放收数任务 */
  MANDATORY_COLLECT_LOAN_TYPES: ['票据贴现', '贸易融资项下贴现', '保理', '商票贴现', '保理融资'],
  /** 候选/正式清单 — 业务品种（台账） */
  CANDIDATE_PRODUCT_TYPES: [
    '中期流动资金贷款',
    '短期流动资金贷款',
    '出口退税账户托管贷款',
    '一般性固定资产贷款',
    '商票贴现-申请人一般授信（金融市场部）',
    '保理融资',
    '保理融资（大连、济南分行专用）',
    '个人经营性贷款'
  ],
  /** 候选/正式清单 — 贷款主体类型 */
  CANDIDATE_BORROWER_TYPES: [
    '有限责任公司',
    '股份有限公司',
    '国有企业',
    '个人独资企业',
    '事业单位',
    '个体工商户',
    '农户'
  ],
  /** 候选/正式清单 — 所属行业（国标代码+名称） */
  CANDIDATE_INDUSTRY_OPTIONS: [
    { code: 'D4411', label: '火力发电', note: '不包括既发电又提供热力的活动' },
    { code: 'D4412', label: '热电联产' },
    { code: 'D4413', label: '水力发电' },
    { code: 'D4414', label: '核力发电' },
    { code: 'D4415', label: '风力发电' },
    { code: 'D4416', label: '太阳能发电' },
    { code: 'C3120', label: '炼钢' },
    { code: 'C3011', label: '水泥制造' },
    { code: 'C2614', label: '有机化学原料制造' },
    { code: 'C3211', label: '铜冶炼' }
  ],
  EXCLUSIONS: [
    { code: 'LOW_BALANCE', label: '报告期内月均融资额少于500万元' },
    { code: 'SME', label: '小型、微型企业' },
    { code: 'INDIVIDUAL', label: '个人、个体工商户' },
    { code: 'OVERSEAS', label: '融资主体在境外' },
    { code: 'NON_HIGH_CARBON', label: '非八大高碳行业' }
  ],
  BALANCE_THRESHOLD_WAN: 500,
  QUALITY_LEVELS: [
    { max: 1.5, label: '优秀' },
    { max: 2.0, label: '良好' },
    { max: 3.0, label: '好' },
    { max: 4.0, label: '较好' },
    { max: Infinity, label: '一般' }
  ],
  /** 企业信息采集字段（附录采集表） */
  ENTITY_FIELDS: {
    basic: ['customerName', 'creditCode', 'gbIndustryCode', 'gbIndustryName', 'industryMajor', 'accountingYear', 'totalAssets', 'revenue', 'avgLoanBalance'],
    report: ['reportedEmission', 'disclosureChannel', 'thirdPartyVerified'],
    energy: ['energyRows'],
    product: ['productRows'],
    economy: ['economyBasis', 'economyValue', 'economyFactor']
  },
  FORMULAS: {
    entity_energy: 'E = Σ(E_i × EF_i) + E_process + E_elec×EF_elec + E_heat×EF_heat',
    entity_product: 'E = Σ(P_k × EF_k)',
    entity_economy: 'E = 营业收入(或资产) × 行业排放因子',
    attribution_non_project: 'E业务 = E主体 × (投融资日均余额 / 融资主体总资产)',
    attribution_project: 'E业务 = E项目 × (项目融资日均余额 / 项目总投资额)',
    attribution_fallback: 'E业务 = 投融资日均余额 × 行业排放因子',
    dqr: 'DQR = Σ(单笔排放量 × 质量得分) / Σ(单笔排放量)'
  }
};
