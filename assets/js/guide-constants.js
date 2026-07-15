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
    { major: '民航', codes: ['G5631', 'G5611', 'G5612'], names: ['机场', '航空旅客运输', '航空货物运输'] }
  ],
  LOAN_TYPES_IN_SCOPE: ['项目贷款', '固定资产贷款', '流动资金贷款', '票据贴现', '贸易融资项下贴现', '保理'],
  /** 贴现、保理必须发放收数任务 */
  MANDATORY_COLLECT_LOAN_TYPES: ['票据贴现', '贸易融资项下贴现', '保理', '商票贴现', '保理融资'],
  /** 候选/正式清单 — 业务种类（由信贷品种映射，见 PRODUCT_TO_ACCOUNTING_TYPE） */
  ACCOUNTING_TYPES: [
    { id: 'non_project', label: '非项目' },
    { id: 'project_as_project', label: '项目（以项目方式计算）' },
    { id: 'project_as_non_project', label: '项目（以非项目方式计算）' }
  ],
  /** 信贷品种 → 业务种类 id；映射待业务侧配置，配置前列表显示「待配置」 */
  PRODUCT_TO_ACCOUNTING_TYPE: {},
  /** 候选/正式清单 — 信贷品种（台账） */
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
  /** 信贷大表 — 公司性质 */
  COMPANY_NATURES: ['国有', '民营', '外资', '集体', '混合所有制'],
  /** 贷款主体类型（信贷 src_fld_en=CORPORGTYPE / cust_class_cd） */
  LOAN_SUBJECT_TYPES: [
    { code: 'IST0_00', label: '有限责任公司' },
    { code: 'IST0_05', label: '其他' },
    { code: 'IST0_03', label: '合伙企业' },
    { code: 'CMS0_CP', label: '企贷' },
    { code: 'IST0_02', label: '股份制有限公司（非上市）' },
    { code: 'IST0_04', label: '联营、合作企业' },
    { code: 'IST0_01', label: '上市公司' },
    { code: 'CMS0_CS', label: '个贷' },
    { code: 'CMS0_SME', label: '小微客户' }
  ],
  /** 信贷大表 — 公司类型（与贷款主体类型一致） */
  COMPANY_TYPES: [
    '有限责任公司',
    '其他',
    '合伙企业',
    '企贷',
    '股份制有限公司（非上市）',
    '联营、合作企业',
    '上市公司',
    '个贷',
    '小微客户'
  ],
  /** 候选/正式清单 — 贷款主体类型（兼容旧字段 borrowerType） */
  CANDIDATE_BORROWER_TYPES: [
    '有限责任公司',
    '其他',
    '合伙企业',
    '企贷',
    '股份制有限公司（非上市）',
    '联营、合作企业',
    '上市公司',
    '个贷',
    '小微客户'
  ],
  /** 候选/正式清单 — 所属行业（国标代码+名称） */
  CANDIDATE_INDUSTRY_OPTIONS: [
    { code: 'D4411', label: '火力发电' },
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
  /** D4411/D4417 列表与筛选仅展示简短中文行业名（监管口径说明见指引，不在 UI 重复展示） */
  GB_INDUSTRY_SHORT_DISPLAY: {
    D4411: '火力发电',
    D4417: '生物质能发电'
  },
  EXCLUSIONS: [
    { code: 'LOW_BALANCE', label: '非项目客户月均融资余额合计少于500万元' },
    { code: 'SME', label: '小型、微型企业' },
    { code: 'INDIVIDUAL', label: '个人、个体工商户' },
    { code: 'OVERSEAS', label: '融资主体在境外' },
    { code: 'NON_HIGH_CARBON', label: '非八大高碳行业' }
  ],
  BALANCE_THRESHOLD_WAN: 500,
  /** 指引核算范畴 — 默认纳入的业务品种（不含个人经营性贷款） */
  SCOPE_DEFAULT_PRODUCT_TYPES: [
    '中期流动资金贷款',
    '短期流动资金贷款',
    '出口退税账户托管贷款',
    '一般性固定资产贷款',
    '商票贴现-申请人一般授信（金融市场部）',
    '保理融资',
    '保理融资（大连、济南分行专用）'
  ],
  /** 指引核算范畴 — 默认纳入的贷款主体类型（不含个贷/小微客户） */
  SCOPE_DEFAULT_BORROWER_TYPES: [
    '有限责任公司',
    '其他',
    '合伙企业',
    '企贷',
    '股份制有限公司（非上市）',
    '联营、合作企业',
    '上市公司'
  ],
  /** 信贷大表 — 企业规模（小型与微型分开） */
  CUSTOMER_SCALES: ['大型企业', '中型企业', '小型企业', '微型企业'],
  ENTERPRISE_SCALES: ['大型企业', '中型企业', '小型企业', '微型企业'],
  /** 默认筛选：与指引核算范畴一致，不含小型/微型企业 */
  SCOPE_DEFAULT_CUSTOMER_SCALES: ['大型企业', '中型企业'],
  /** 候选清单筛选 — 境内外业务（默认仅境内，符合人行《操作指引》） */
  CANDIDATE_REGION_SCOPE_OPTIONS: [
    { value: 'domestic', label: '仅境内' },
    { value: 'overseas', label: '仅境外' },
    { value: 'all', label: '全部' }
  ],
  SCOPE_DEFAULT_REGION_SCOPE: 'domestic',
  QUALITY_LEVELS: [
    { max: 1.5, label: '优秀' },
    { max: 2.0, label: '良好' },
    { max: 3.0, label: '好' },
    { max: 4.0, label: '较好' },
    { max: Infinity, label: '一般' }
  ],
  /** 表2 数据质量等级赋值标准（弹窗展示用，不影响业务逻辑） */
  DQR_METHOD_TABLE: [
    {
      method: '报告法—权威数据',
      subject: '能提供自身碳排放数据的客户',
      basis: '企业（项目）具备权威性的碳排放数据，包括经相关政府部门核查的、经第三方机构核查/审计的、经仪器连续测量的碳排放数据，且相关证明材料完备。',
      grade: 1
    },
    {
      method: '报告法—其他',
      subject: '能提供自身碳排放数据的客户',
      basis: '企业（项目）其他未经政府部门或有资质的第三方机构核查/审计的、未经仪器连续测量的碳排放数据。',
      grade: 2
    },
    {
      method: '物理活动法—能源法',
      subject: '一般客户',
      basis: '排放量基于能源消费量数据及相应排放因子计算，并涵盖相关工艺排放。',
      grade: 2
    },
    {
      method: '物理活动法—产品法',
      subject: '一般客户',
      basis: '排放量基于主要产品产量数据及相应排放因子计算。',
      grade: 3
    },
    {
      method: '经济活动法',
      subject: '数据较难采集的客户',
      basis: '排放量基于企业营业（项目）收入，结合对应行业每单位收入的排放因子进行计算。',
      grade: 4
    },
    {
      method: '其他计算法',
      subject: '数据基本无法获得的客户',
      basis: '排放量基于贷款余额，结合对应行业排放因子进行计算。',
      grade: 5
    }
  ],
  /** 表3 数据质量评级结果划分标准（DQR → 对应等次） */
  DQR_GRADE_BANDS: [
    { max: 1.5, grade: 'A' },
    { max: 2.0, grade: 'B+' },
    { max: 3.0, grade: 'B' },
    { max: 4.0, grade: 'B-' },
    { max: Infinity, grade: 'C' }
  ],
  /** 企业信息采集字段（附录采集表） */
  ENTITY_FIELDS: {
    basic: ['customerName', 'creditCode', 'gbIndustryCode', 'gbIndustryName', 'industryMajor', 'accountingYear', 'totalAssets', 'revenue', 'avgLoanBalance'],
    report: ['reportedEmission', 'reportCarbonDataYear', 'reportScope1Emission', 'reportScope2Emission', 'reportUnitTotalCo2Emission', 'disclosureChannel', 'thirdPartyVerified'],
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
    dqr: 'DQR = Σ(单笔排放量 × 质量得分) / Σ(单笔排放量)',
    financing_intensity: '投融资碳排放强度 = 归因排放量 ÷ 投融资余额（万元），单位：tCO₂e/万元余额'
  }
};
