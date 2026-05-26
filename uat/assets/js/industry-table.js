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
window.INDUSTRY_EIGHT_CODES = ["C2211", "C2221", "C2511", "C2611", "C2612", "C2614", "C2621", "C2651", "C3011", "C3041", "C3110", "C3120", "C3130", "C3211", "C3216", "D4411", "D4412", "D4417", "D4420", "G5631"];

window.IndustryScope = {
  /** 八大高碳行业代码（监管口径） */
  getEightCodes() { return INDUSTRY_EIGHT_CODES.slice(); },
  /** 八大+扩展：行业表全量代码 */
  getExtendedCodes() { return INDUSTRY_TABLE.map(i => i.code); },
  /** 按范畴选项解析纳入的行业代码 */
  resolveCodes(scope, customCodes) {
    if (scope === '八大高碳行业') return this.getEightCodes();
    if (scope === '八大+扩展') return this.getExtendedCodes();
    if (scope === '自定义' && customCodes?.length) return customCodes.slice();
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
    const items = INDUSTRY_TABLE.filter(i => codes.includes(i.code));
    if (items.length <= 3) return items.map(i => this.label(i)).join('、');
    return items.slice(0, 2).map(i => this.label(i)).join('、') + ' 等' + items.length + '项';
  }
};
