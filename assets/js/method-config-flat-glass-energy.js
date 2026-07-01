/** 建材·平板玻璃·非项目·物理活动法-能源法 — 完整配置样例 */
(function () {
  const GRID_OPTIONS = ['华北电网', '东北电网', '华东电网', '华中电网', '西北电网', '南方电网', '西南电网', '全国平均'];
  const OTHER_FUEL_OPTIONS = ['石油焦', '原油', '燃料油', '汽油', '煤油', '液化石油气', '液化天然气', '焦油', '高炉煤气', '转炉煤气', '焦炉煤气', '炼厂干气', '无'];
  const CARBONATE_OPTIONS = ['石灰石', '白云石', '纯碱', '小苏打', '菱镁石', '毒重石', '锂盐', '草碱、珠碱', '菱锶矿', '菱铁矿', '菱锰石', '碳粉'];

  const FLAT_GLASS_PARAMS = [
    { id: 'P_coal', name: '煤炭消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'global', showInTemplate: true, required: true, section: 'fuel', source: '联合赤道采集表' },
    { id: 'P_coke', name: '焦炭消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'global', showInTemplate: true, required: true, section: 'fuel', source: '联合赤道采集表' },
    { id: 'P_diesel', name: '柴油消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'global', showInTemplate: true, section: 'fuel', source: '联合赤道采集表' },
    { id: 'P_gas', name: '天然气消耗量', format: 'number', unit: '万m³', decimalPlaces: 4, scope: 'global', showInTemplate: true, required: true, section: 'fuel', source: '联合赤道采集表' },
    { id: 'P_other_fuel_type_1', name: '其他能源1-燃料品种', format: 'option', unit: '—', scope: 'custom', showInTemplate: true, enumValues: OTHER_FUEL_OPTIONS, section: 'fuel_other', slot: 1, source: '联合赤道采集表' },
    { id: 'P_other_fuel_amount_1', name: '其他能源1-消耗量', format: 'number', unit: 't或万m³', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'fuel_other', slot: 1, source: '联合赤道采集表' },
    { id: 'P_other_fuel_type_2', name: '其他能源2-燃料品种', format: 'option', unit: '—', scope: 'custom', showInTemplate: true, enumValues: OTHER_FUEL_OPTIONS, section: 'fuel_other', slot: 2, source: '联合赤道采集表' },
    { id: 'P_other_fuel_amount_2', name: '其他能源2-消耗量', format: 'number', unit: 't或万m³', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'fuel_other', slot: 2, source: '联合赤道采集表' },
    { id: 'P_grid_region', name: '企业所属电网', format: 'option', unit: '—', scope: 'global', showInTemplate: true, required: true, enumValues: GRID_OPTIONS, section: 'electricity', source: '联合赤道采集表' },
    { id: 'P_purchased_electricity', name: '净购入电量', format: 'number', unit: 'MWh', decimalPlaces: 4, scope: 'global', showInTemplate: true, required: true, section: 'electricity', source: '联合赤道采集表' },
    { id: 'P_purchased_heat', name: '净购入热力', format: 'number', unit: 'GJ', decimalPlaces: 4, scope: 'global', showInTemplate: true, section: 'heat', source: '联合赤道采集表' },
    { id: 'P_carbon_powder', name: '碳粉使用消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'process', source: '联合赤道采集表' },
    { id: 'P_carbonate_type_1', name: '碳酸盐分解1-类型', format: 'option', unit: '—', scope: 'custom', showInTemplate: true, enumValues: CARBONATE_OPTIONS, section: 'process_carbonate', slot: 1, source: '联合赤道采集表' },
    { id: 'P_carbonate_amount_1', name: '碳酸盐分解1-消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'process_carbonate', slot: 1, source: '联合赤道采集表' },
    { id: 'P_carbonate_type_2', name: '碳酸盐分解2-类型', format: 'option', unit: '—', scope: 'custom', showInTemplate: true, enumValues: CARBONATE_OPTIONS, section: 'process_carbonate', slot: 2, source: '联合赤道采集表' },
    { id: 'P_carbonate_amount_2', name: '碳酸盐分解2-消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'process_carbonate', slot: 2, source: '联合赤道采集表' },
    { id: 'P_desulfur_type_1', name: '脱硫试剂1-试剂类型', format: 'option', unit: '—', scope: 'custom', showInTemplate: true, enumValues: CARBONATE_OPTIONS.filter(x => x !== '碳粉'), section: 'process_desulfur', slot: 1, source: '联合赤道采集表（过程排放）' },
    { id: 'P_desulfur_amount_1', name: '脱硫试剂1-消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'process_desulfur', slot: 1, source: '联合赤道采集表' },
    { id: 'P_desulfur_type_2', name: '脱硫试剂2-试剂类型', format: 'option', unit: '—', scope: 'custom', showInTemplate: true, enumValues: CARBONATE_OPTIONS.filter(x => x !== '碳粉'), section: 'process_desulfur', slot: 2, source: '联合赤道采集表' },
    { id: 'P_desulfur_amount_2', name: '脱硫试剂2-消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'process_desulfur', slot: 2, source: '联合赤道采集表' }
  ];

  const FLAT_GLASS_FORMULAS = [
    {
      id: 'F1', sort: 1, name: '燃料燃烧排放', emissionUnit: 'tCO₂e',
      expression: '{P_coal}*{factor_coal} + {P_coke}*{factor_coke} + {P_diesel}*{factor_diesel} + {P_gas}*{factor_gas} + {P_other_fuel_amount_1}*{factor_other_1} + {P_other_fuel_amount_2}*{factor_other_2}',
      activityData: '煤炭/焦炭/柴油/天然气/其他能源1/2',
      isSubtotal: true
    },
    {
      id: 'F2', sort: 2, name: '净购入电力排放', emissionUnit: 'tCO₂e',
      expression: '{P_purchased_electricity} * LOOKUP({P_grid_region}, factor_grid)',
      activityData: '净购入电量 × 电网因子',
      isSubtotal: true,
      note: '电网因子按「企业所属电网」选项匹配'
    },
    {
      id: 'F3', sort: 3, name: '净购入热力排放', emissionUnit: 'tCO₂e',
      expression: '{P_purchased_heat} * {factor_heat}',
      activityData: '净购入热力',
      isSubtotal: true
    },
    {
      id: 'F4', sort: 4, name: '过程排放', emissionUnit: 'tCO₂e',
      expression: '{P_carbon_powder}*{factor_carbon_powder} + {P_carbonate_amount_1}*LOOKUP({P_carbonate_type_1}, factor_carbonate) + {P_carbonate_amount_2}*LOOKUP({P_carbonate_type_2}, factor_carbonate) + {P_desulfur_amount_1}*LOOKUP({P_desulfur_type_1}, factor_carbonate) + {P_desulfur_amount_2}*LOOKUP({P_desulfur_type_2}, factor_carbonate)',
      activityData: '碳粉/碳酸盐/脱硫试剂',
      isSubtotal: true
    },
    {
      id: 'F_total', sort: 99, name: '主体排放合计', emissionUnit: 'tCO₂e',
      expression: 'SUM({F1}, {F2}, {F3}, {F4})',
      activityData: '主体A排放',
      isEntityTotal: true,
      summary: '主体A排放 = 燃料燃烧排放 + 净购电排放 + 净购热排放 + 过程排放'
    }
  ];

  const FLAT_GLASS_FACTOR_BINDINGS = [
    { refKey: 'factor_coal', label: '煤炭', matchType: 'fixed', factorSource: '赤道平板玻璃因子表', unitActivity: 't', unitFactor: 'tCO₂/t', defaultValue: 2.4936, caliberTag: 'bank', note: '联合赤道合并为「煤炭」；人行附2分无烟煤/焦煤等' },
    { refKey: 'factor_coke', label: '焦炭', matchType: 'fixed', factorSource: '赤道平板玻璃因子表', unitActivity: 't', unitFactor: 'tCO₂/t', defaultValue: 2.8604, caliberTag: 'bank' },
    { refKey: 'factor_diesel', label: '柴油', matchType: 'fixed', factorSource: '赤道平板玻璃因子表', unitActivity: 't', unitFactor: 'tCO₂/t', defaultValue: 3.0959, caliberTag: 'bank' },
    { refKey: 'factor_gas', label: '天然气', matchType: 'fixed', factorSource: '赤道平板玻璃因子表', unitActivity: '万m³', unitFactor: 'tCO₂/万m³', defaultValue: 21.622, unitConversion: '1 万m³ = 1 万m³', caliberTag: 'bank' },
    { refKey: 'factor_other_1', label: '其他能源1', matchType: 'conditional', dependsOn: 'P_other_fuel_type_1', factorSource: '赤道平板玻璃因子表 / 排放因子库', unitActivity: 't或万m³', unitFactor: 'tCO₂/t 或 tCO₂/万m³', unitConversion: '按品种自动匹配单位', caliberTag: 'bank' },
    { refKey: 'factor_other_2', label: '其他能源2', matchType: 'conditional', dependsOn: 'P_other_fuel_type_2', factorSource: '赤道平板玻璃因子表 / 排放因子库', unitActivity: 't或万m³', unitFactor: 'tCO₂/t 或 tCO₂/万m³', unitConversion: '按品种自动匹配单位', caliberTag: 'bank' },
    { refKey: 'factor_grid', label: '区域电力因子', matchType: 'lookup', dependsOn: 'P_grid_region', factorSource: '赤道平板玻璃因子表', unitActivity: 'MWh', unitFactor: 'tCO₂/MWh', lookupExamples: '华北电网 0.6361；华东电网 0.5500；全国平均 0.5306', caliberTag: 'bank' },
    { refKey: 'factor_heat', label: '热力因子', matchType: 'fixed', factorSource: '指引附2 / 因子库', unitActivity: 'GJ', unitFactor: 'tCO₂/GJ', defaultValue: 0.11, caliberTag: 'pbo', note: '原型演示值，正式以因子库为准' },
    { refKey: 'factor_carbon_powder', label: '碳粉', matchType: 'fixed', factorSource: '赤道平板玻璃因子表', unitActivity: 't', unitFactor: 'tCO₂/t', defaultValue: 3.6667, caliberTag: 'bank' },
    { refKey: 'factor_carbonate', label: '碳酸盐/脱硫试剂', matchType: 'lookup', dependsOn: 'P_carbonate_type_1|P_carbonate_type_2|P_desulfur_type_1|P_desulfur_type_2', factorSource: '赤道平板玻璃因子表', unitActivity: 't', unitFactor: 'tCO₂/t', lookupExamples: '石灰石 0.4397；白云石 0.4773；纯碱 0.4149', caliberTag: 'bank' }
  ];

  const FLAT_GLASS_LAYOUT = [
    {
      type: 'partition',
      title: '燃料燃烧排放',
      sections: [
        {
          type: 'fixed',
          fields: ['P_coal', 'P_coke', 'P_diesel', 'P_gas'],
          emissionSources: [
            { id: 'es_coal', fields: ['P_coal'] },
            { id: 'es_coke', fields: ['P_coke'] },
            { id: 'es_diesel', fields: ['P_diesel'] },
            { id: 'es_gas', fields: ['P_gas'] }
          ]
        },
        {
          type: 'dynamic_row',
          sectionLabel: '其他能源（下拉选择）',
          varietyParamId: 'P_other_fuel_type_1',
          amountParamId: 'P_other_fuel_amount_1',
          presetRows: OTHER_FUEL_OPTIONS.filter(x => x !== '无').slice(0, 2).map((label, i) => ({
            label: `其他燃料${i + 1}`,
            enumValue: label,
            refKey: `factor_other_${i + 1}`
          })),
          allowAddRow: true,
          allowDeleteRow: true
        }
      ]
    },
    {
      type: 'partition',
      title: '净购入电量',
      sections: [{ type: 'fixed', fields: ['P_grid_region', 'P_purchased_electricity'] }]
    },
    {
      type: 'partition',
      title: '净购入热力',
      sections: [{ type: 'fixed', fields: ['P_purchased_heat'] }]
    },
    {
      type: 'partition',
      title: '过程排放',
      sections: [
        { type: 'fixed', title: '碳粉', fields: ['P_carbon_powder'] },
        {
          type: 'fixed',
          fields: ['P_carbonate_type_1', 'P_carbonate_amount_1', 'P_carbonate_type_2', 'P_carbonate_amount_2']
        },
        {
          type: 'fixed',
          fields: ['P_desulfur_type_1', 'P_desulfur_amount_1', 'P_desulfur_type_2', 'P_desulfur_amount_2']
        }
      ]
    }
  ];

  const DESIGN_GAPS = [
    { level: 'ok', item: '分层采集字段', detail: '燃料固定项 + 其他能源/碳酸盐（类型+消耗量同区块）+ 电网 + 过程排放块' },
    { level: 'ok', item: '数值小数位', detail: '消耗量字段 decimalPlaces=4，因子支持 4～6 位' },
    { level: 'ok', item: '选项枚举', detail: '其他燃料、电网、碳酸盐/脱硫试剂均配置 enumValues' },
    { level: 'ok', item: '主体排放分项求和', detail: 'F1～F4 分项 + F_total 合计，对应业务公式四段结构' },
    { level: 'warn', item: '条件因子 LOOKUP', detail: '「其他能源×品种→因子」「电网→电力因子」「碳酸盐类型→因子」需公式引擎支持 LOOKUP/条件匹配；当前原型仅演示占位' },
    { level: 'warn', item: '双因子口径', detail: '联合赤道因子表 vs 人行附2 数值/分项不一致，需 caliberTag=bank/pbo 及「首选赤道、人行兜底」策略' },
    { level: 'warn', item: '活动数据单位混用', detail: '其他能源消耗量「t或万m³」需按品种切换单位校验与因子分母匹配' },
    { level: 'gap', item: '采集表 vs 因子表版本', detail: '需独立维护「采集模板版本」与「因子表版本」，发布时绑定 effectiveFrom' },
    { level: 'gap', item: '与收集页渲染打通', detail: '配置发布后须驱动 supplement-fields 动态渲染，当前收集页仍读静态 SUPPLEMENT_TEMPLATES' }
  ];

  window.METHOD_CONFIG_FLAT_GLASS = {
    templateId: 'tpl_np_平板玻璃_energy',
    meta: {
      id: 'tpl_np_平板玻璃_energy',
      templateName: '建材-平板玻璃-能源法',
      industry: '建材',
      industryMajor: '建材',
      subCategory: '平板玻璃',
      bizType: 'non_project',
      methodId: 'energy',
      priority: 1,
      applyScene: ['entity', 'project_loan'],
      gbCodes: ['C3041'],
      status: 'published',
      version: 'V1.0',
      fieldCount: FLAT_GLASS_PARAMS.length,
      formulaCount: FLAT_GLASS_FORMULAS.length,
      updatedAt: '2026-06-24',
      dataSourceCollect: '【终版】高碳行业非项目采集表模板（联合赤道）',
      dataSourceFactor: '操作指引附2 + 联合赤道行业因子表（取消隐藏）',
      entityFormulaSummary: '主体A排放 = 燃料燃烧排放 + 净购电排放 + 净购热排放 + 过程排放'
    },
    params: FLAT_GLASS_PARAMS,
    layout: FLAT_GLASS_LAYOUT,
    formulas: FLAT_GLASS_FORMULAS,
    factorBindings: FLAT_GLASS_FACTOR_BINDINGS,
    designGaps: DESIGN_GAPS
  };
})();
