/** 行业表 — 来源：行业表.xlsx（GB/T 4754-2017） */
window.INDUSTRY_TABLE = [
  {
    "code": "D4411",
    "name": "火力发电",
    "major": "电力"
  },
  {
    "code": "D4412",
    "name": "热电联产",
    "major": "电力"
  },
  {
    "code": "D4417",
    "name": "生物质能发电（仅含掺烧化石燃料燃烧的生物质发电企业，不含纯使用生物质发电的企业）",
    "major": "电力"
  },
  {
    "code": "D4420",
    "name": "电力供应",
    "major": "电力"
  },
  {
    "code": "C3011",
    "name": "水泥制造",
    "major": "建材"
  },
  {
    "code": "C3041",
    "name": "平板玻璃制造",
    "major": "建材"
  },
  {
    "code": "C3110",
    "name": "炼铁",
    "major": "钢铁"
  },
  {
    "code": "C3120",
    "name": "炼钢",
    "major": "钢铁"
  },
  {
    "code": "C3130",
    "name": "钢压延加工",
    "major": "钢铁"
  },
  {
    "code": "C3216",
    "name": "铝冶炼",
    "major": "有色"
  },
  {
    "code": "C3211",
    "name": "铜冶炼",
    "major": "有色"
  },
  {
    "code": "C2511",
    "name": "原油加工及石油制品制造",
    "major": "石化"
  },
  {
    "code": "C2611",
    "name": "无机酸制造",
    "major": "化工"
  },
  {
    "code": "C2612",
    "name": "无机碱制造",
    "major": "化工"
  },
  {
    "code": "C2613",
    "name": "无机盐制造",
    "major": "化工"
  },
  {
    "code": "C2614",
    "name": "有机化学原料制造",
    "major": "化工"
  },
  {
    "code": "C2619",
    "name": "其他基础化学原料制造",
    "major": "化工"
  },
  {
    "code": "C2621",
    "name": "氮肥制造",
    "major": "化工"
  },
  {
    "code": "C2622",
    "name": "磷肥制造",
    "major": "化工"
  },
  {
    "code": "C2623",
    "name": "钾肥制造",
    "major": "化工"
  },
  {
    "code": "C2624",
    "name": "复混肥料制造",
    "major": "化工"
  },
  {
    "code": "C2625",
    "name": "有机肥料及微生物肥料制造",
    "major": "化工"
  },
  {
    "code": "C2629",
    "name": "其他肥料制造",
    "major": "化工"
  },
  {
    "code": "C2631",
    "name": "化学农药制造",
    "major": "化工"
  },
  {
    "code": "C2632",
    "name": "生物化学农药及微生物农药制造",
    "major": "化工"
  },
  {
    "code": "C2651",
    "name": "初级形态塑料及合成树脂制造",
    "major": "化工"
  },
  {
    "code": "C2652",
    "name": "合成橡胶制造",
    "major": "化工"
  },
  {
    "code": "C2653",
    "name": "合成纤维单(聚合)体制造",
    "major": "化工"
  },
  {
    "code": "C2659",
    "name": "其他合成材料制造",
    "major": "化工"
  },
  {
    "code": "C2211",
    "name": "木竹浆制造",
    "major": "造纸"
  },
  {
    "code": "C2212",
    "name": "非木竹浆制造",
    "major": "造纸"
  },
  {
    "code": "C2221",
    "name": "机制纸及纸板制造",
    "major": "造纸"
  },
  {
    "code": "G5631",
    "name": "机场",
    "major": "民航"
  }
];
/** 人行八大高碳 — 四级行业完整代码（与 INDUSTRY_TABLE 同步） */
window.INDUSTRY_EIGHT_CODES = INDUSTRY_TABLE.map(r => r.code);

/** 我行主要行业（GB/T 4754 小类，级联用小类码） */
window.INDUSTRY_BANK_MAJOR_CODES = [
  "0610", "3024", "2521", "3021", "3022", "4430", "3251", "3252", "3240", "3012",
  "2669", "5443", "4190", "2822", "1711", "2523", "3140", "5164", "5165", "7212",
  "7299", "4710", "7010", "7810", "6631", "7211"
];

/** 我行主要行业明细（code=带门类字母四级码，major=GB/T 4754 大类名称） */
window.INDUSTRY_BANK_MAJOR_TABLE = [
  { code: "B0610", name: "烟煤和无烟煤开采洗选", major: "煤炭开采和洗选业" },
  { code: "C3024", name: "轻质建筑材料制造", major: "非金属矿物制品业" },
  { code: "C2521", name: "炼焦", major: "石油、煤炭及其他燃料加工业" },
  { code: "C3021", name: "水泥制品制造", major: "非金属矿物制品业" },
  { code: "C3022", name: "砼结构构件制造", major: "非金属矿物制品业" },
  { code: "D4430", name: "热力生产和供应", major: "电力、热力生产和供应业" },
  { code: "C3251", name: "铜压延加工", major: "有色金属冶炼和压延加工业" },
  { code: "C3252", name: "铝压延加工", major: "有色金属冶炼和压延加工业" },
  { code: "C3240", name: "有色金属合金制造", major: "有色金属冶炼和压延加工业" },
  { code: "C3012", name: "石灰和石膏制造", major: "非金属矿物制品业" },
  { code: "C2669", name: "其他专用化学产品制造", major: "化学原料和化学制品制造业" },
  { code: "G5443", name: "公路管理与养护", major: "道路运输业" },
  { code: "C4190", name: "其他未列明制造业", major: "其他制造业" },
  { code: "C2822", name: "涤纶纤维制造", major: "化学纤维制造业" },
  { code: "C1711", name: "棉纺纱加工", major: "纺织业" },
  { code: "C2523", name: "煤制液体燃料生产", major: "石油、煤炭及其他燃料加工业" },
  { code: "C3140", name: "铁合金冶炼", major: "黑色金属冶炼和压延加工业" },
  { code: "F5164", name: "金属及金属矿批发", major: "批发业" },
  { code: "F5165", name: "建材批发", major: "批发业" },
  { code: "L7212", name: "投资与资产管理", major: "商务服务业" },
  { code: "L7299", name: "其他未列明商务服务业", major: "商务服务业" },
  { code: "E4710", name: "住宅房屋建筑", major: "房屋建筑业" },
  { code: "K7010", name: "房地产开发经营", major: "房地产业" },
  { code: "N7810", name: "市政设施管理", major: "公共设施管理业" },
  { code: "J6631", name: "融资租赁服务", major: "货币金融服务" },
  { code: "L7211", name: "企业总部管理", major: "商务服务业" }
];

function toCascadeIndustryCode(code) {
  const s = String(code || '').trim();
  if (/^[A-Z]\d/.test(s)) return s.slice(1);
  return s;
}

/** 八大高碳行业大类映射（用于行业配置展示） */
window.INDUSTRY_EIGHT_MAJOR_BY_CASCADE = Object.fromEntries(
  INDUSTRY_TABLE.map(r => [toCascadeIndustryCode(r.code), r.major])
);

function isPboEightIndustryCode(code) {
  const cascade = toCascadeIndustryCode(code);
  const scoped = /^[A-Z]\d/.test(String(code || '').trim())
    ? String(code).trim()
    : toScopedIndustryCode(cascade);
  return INDUSTRY_EIGHT_CODES.includes(scoped)
    || INDUSTRY_EIGHT_CODES.some(c => toCascadeIndustryCode(c) === cascade);
}

function isBankMajorIndustryCode(code) {
  const cascade = toCascadeIndustryCode(code);
  const scoped = toScopedIndustryCode(cascade);
  return INDUSTRY_BANK_MAJOR_CODES.includes(cascade)
    || INDUSTRY_BANK_MAJOR_CODES.some(c => toScopedIndustryCode(c) === scoped);
}

function inferIndustryMajor(code) {
  const cascade = toCascadeIndustryCode(code);
  if (INDUSTRY_EIGHT_MAJOR_BY_CASCADE[cascade]) return INDUSTRY_EIGHT_MAJOR_BY_CASCADE[cascade];
  const scoped = /^[A-Z]\d/.test(String(code || '').trim()) ? String(code).trim() : toScopedIndustryCode(cascade);
  const pboRow = INDUSTRY_TABLE.find(r => r.code === scoped || toCascadeIndustryCode(r.code) === cascade);
  if (pboRow?.major) return pboRow.major;
  const bankRow = (INDUSTRY_BANK_MAJOR_TABLE || []).find(r =>
    r.code === scoped || r.code === cascade || toCascadeIndustryCode(r.code) === cascade
  );
  if (bankRow?.major) return bankRow.major;
  if (typeof IndustryConfig !== 'undefined' && IndustryConfig.isImported()) {
    const cfgRow = IndustryConfig.getRows().find(r =>
      r.code === scoped || r.cascadeCode === cascade || toCascadeIndustryCode(r.code) === cascade
    );
    if (cfgRow?.major) return cfgRow.major;
    if (cfgRow?.level2Name) return cfgRow.level2Name;
  }
  return '';
}

function _buildLeafSectorMap() {
  const map = {};
  const walk = (nodes, sector) => {
    (nodes || []).forEach(n => {
      const sec = n.l === 0 ? n.c : sector;
      if (n.l === 3) map[n.c] = sec;
      else walk(n.ch || [], sec);
    });
  };
  walk(window.GB4754_TREE || [], null);
  return map;
}

function toScopedIndustryCode(code) {
  const leaf = toCascadeIndustryCode(code);
  if (/^[A-Z]\d/.test(String(code || '').trim())) return String(code).trim();
  const sector = IndustryScope._leafSectorMap()[leaf];
  return sector ? sector + leaf : leaf;
}

function _uniqueCodes(codes) {
  return [...new Set((codes || []).filter(Boolean))];
}

window.IndustryScope = {
  _leafSectorCache: null,
  _leafSectorMap() {
    if (!this._leafSectorCache) this._leafSectorCache = _buildLeafSectorMap();
    return this._leafSectorCache;
  },
  /** 八大高碳行业代码（监管口径，带门类字母） */
  getEightCodes() {
    if (typeof IndustryConfig !== 'undefined' && IndustryConfig.isImported()) {
      const codes = IndustryConfig.getTaggedCodes(IndustryConfig.TAG_PBO_EIGHT);
      if (codes.length) return codes;
    }
    return INDUSTRY_EIGHT_CODES.slice();
  },
  /** 八大高碳 — 级联面板用小类码 */
  getEightCascadeCodes() {
    return _uniqueCodes(INDUSTRY_EIGHT_CODES.map(toCascadeIndustryCode));
  },
  /** 人行八大高碳 + 我行主要行业（带门类字母，用于筛选/台账） */
  getExtendedCodes() {
    if (typeof IndustryConfig !== 'undefined' && IndustryConfig.isImported()) {
      const pbo = IndustryConfig.getTaggedCodes(IndustryConfig.TAG_PBO_EIGHT);
      const bank = IndustryConfig.getTaggedCodes(IndustryConfig.TAG_BANK_MAJOR);
      if (pbo.length || bank.length) return _uniqueCodes([...pbo, ...bank]);
    }
    return _uniqueCodes([
      ...INDUSTRY_EIGHT_CODES,
      ...INDUSTRY_BANK_MAJOR_CODES.map(toScopedIndustryCode)
    ]);
  },
  /** 人行八大高碳 + 我行主要行业 — 级联面板用小类码 */
  getExtendedCascadeCodes() {
    return _uniqueCodes([
      ...this.getEightCascadeCodes(),
      ...INDUSTRY_BANK_MAJOR_CODES
    ]);
  },
  /** 按范畴选项解析纳入的行业代码（仅「自定义」时使用 customCodes） */
  resolveCodes(scope, customCodes) {
    const normalized = scope === '八大+扩展' ? '八大高碳+重点行业' : scope;
    if (normalized === '自定义') {
      return _uniqueCodes((customCodes || []).map(c => {
        const s = String(c || '').trim();
        if (!s) return '';
        if (/^[A-Z]\d/.test(s)) return s;
        return typeof toScopedIndustryCode === 'function' ? (toScopedIndustryCode(s) || s) : s;
      }).filter(Boolean));
    }
    if (normalized === '八大高碳+重点行业') return this.getExtendedCodes();
    if (normalized === '八大高碳行业') return this.getEightCodes();
    return this.getEightCodes();
  },
  /** 按行业大类分组 */
  groupByMajor(list) {
    const map = {};
    (list || INDUSTRY_TABLE).forEach(i => {
      if (!map[i.major]) map[i.major] = [];
      map[i.major].push(i);
    });
    return map;
  },
  /** 格式化显示：行业大类 · 行业名称 */
  label(item) { return item.major + ' · ' + item.name; },
  /** 自定义选择摘要 */
  summarizeCustom(codes) {
    if (!codes?.length) return '未选择';
    const nameMap = window.IndustryCascade?.nameMap() || {};
    const items = codes.map(code => {
      const row = INDUSTRY_TABLE.find(i => i.code === code);
      if (row) return this.label(row);
      const name = nameMap[code];
      return name ? `${code} ${name}` : code;
    });
    if (items.length <= 3) return items.join('、');
    return items.slice(0, 2).join('、') + ' 等' + items.length + '项';
  }
};
