/** 有色·铜铅锌原煤开采和洗选·非项目·物理活动法-能源法 — 完整配置样例（对齐行内采集表） */
(function () {
  const OTHER_FUEL_OPTIONS = ['石油焦', '原油', '燃料油', '汽油', '煤油', '液化石油气', '液化天然气', '焦油', '高炉煤气', '转炉煤气', '焦炉煤气', '炼厂干气', '无'];

  const MINING_PARAMS = [
    { id: 'P_coal', name: '煤炭消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'global', showInTemplate: true, required: true, section: 'fuel', source: '行内高碳行业采集表' },
    { id: 'P_coke', name: '焦炭消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'global', showInTemplate: true, section: 'fuel', source: '行内高碳行业采集表' },
    { id: 'P_diesel', name: '柴油消耗量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'global', showInTemplate: true, section: 'fuel', source: '行内高碳行业采集表' },
    { id: 'P_gas', name: '天然气消耗量', format: 'number', unit: '万m³', decimalPlaces: 4, scope: 'global', showInTemplate: true, section: 'fuel', source: '行内高碳行业采集表' },
    { id: 'P_mine_other_fuel_type_1', name: '其他燃料1-燃料品种', format: 'option', unit: '—', scope: 'custom', showInTemplate: true, enumValues: OTHER_FUEL_OPTIONS, section: 'fuel_other', slot: 1, source: '行内高碳行业采集表' },
    { id: 'P_mine_other_fuel_amount_1', name: '其他燃料1-消耗量', format: 'number', unit: 't或万m³', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'fuel_other', slot: 1, source: '行内高碳行业采集表' },
    { id: 'P_mine_other_fuel_type_2', name: '其他燃料2-燃料品种', format: 'option', unit: '—', scope: 'custom', showInTemplate: true, enumValues: OTHER_FUEL_OPTIONS, section: 'fuel_other', slot: 2, source: '行内高碳行业采集表' },
    { id: 'P_mine_other_fuel_amount_2', name: '其他燃料2-消耗量', format: 'number', unit: 't或万m³', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'fuel_other', slot: 2, source: '行内高碳行业采集表' },
    { id: 'P_purchased_electricity', name: '净购入电量', format: 'number', unit: 'MWh', decimalPlaces: 4, scope: 'global', showInTemplate: true, required: true, section: 'electricity', source: '行内高碳行业采集表' },
    { id: 'P_purchased_heat', name: '净购入热力', format: 'number', unit: 'GJ', decimalPlaces: 4, scope: 'global', showInTemplate: true, section: 'heat', source: '行内高碳行业采集表' },
    { id: 'P_mine_ch4_vent', name: '井工开采-通风系统CH4排放量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'ch4_underground', source: '行内高碳行业采集表' },
    { id: 'P_mine_ch4_drain', name: '井工开采-抽放系统CH4排放量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'ch4_underground', source: '行内高碳行业采集表' },
    { id: 'P_mine_ch4_recovery', name: 'CH4回收利用量', format: 'number', unit: '万m³', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'ch4_underground', source: '行内高碳行业采集表' },
    { id: 'P_mine_openpit_coal', name: '露天开采-原煤产量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'ch4_openpit', source: '行内高碳行业采集表' },
    { id: 'P_mine_post_high_gas', name: '原煤矿后活动-高瓦斯井工矿原煤产量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'ch4_post', source: '行内高碳行业采集表' },
    { id: 'P_mine_post_low_gas', name: '原煤矿后活动-低瓦斯井工矿原煤产量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'ch4_post', source: '行内高碳行业采集表' },
    { id: 'P_mine_post_openpit', name: '原煤矿后活动-露天矿原煤产量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'ch4_post', source: '行内高碳行业采集表' },
    { id: 'P_mine_co2_vent', name: '井工开采-通风系统CO2排放量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'co2_underground', source: '行内高碳行业采集表' },
    { id: 'P_mine_co2_drain', name: '井工开采-抽放系统CO2排放量', format: 'number', unit: 't', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'co2_underground', source: '行内高碳行业采集表' },
    { id: 'P_mine_co2_recovery', name: 'CO2回收利用量', format: 'number', unit: '万m³', decimalPlaces: 4, scope: 'custom', showInTemplate: true, section: 'co2_underground', source: '行内高碳行业采集表' },
    { id: 'P_remarks', name: '备注', format: 'text', unit: '—', scope: 'custom', showInTemplate: true, section: 'remark', source: '行内高碳行业采集表' }
  ];

  const MINING_FORMULAS = [
    {
      id: 'F1', sort: 1, name: '燃料燃烧排放', emissionUnit: 'tCO₂e',
      expression: '{P_coal}*{factor_coal} + {P_coke}*{factor_coke} + {P_diesel}*{factor_diesel} + {P_gas}*{factor_gas} + {P_mine_other_fuel_amount_1}*{factor_other_1} + {P_mine_other_fuel_amount_2}*{factor_other_2}',
      activityData: '煤炭/焦炭/柴油/天然气/其他燃料1/2',
      isSubtotal: true
    },
    {
      id: 'F2', sort: 2, name: '净购入电力排放', emissionUnit: 'tCO₂e',
      expression: '{P_purchased_electricity} * {factor_electricity}',
      activityData: '净购入电量',
      isSubtotal: true
    },
    {
      id: 'F3', sort: 3, name: '净购入热力排放', emissionUnit: 'tCO₂e',
      expression: '{P_purchased_heat} * {factor_heat}',
      activityData: '净购入热力',
      isSubtotal: true
    },
    {
      id: 'F4', sort: 4, name: 'CH4逃逸排放', emissionUnit: 'tCO₂e',
      expression: '({P_mine_ch4_vent} + {P_mine_ch4_drain}) * {factor_ch4_gwp} - {P_mine_ch4_recovery} * {factor_ch4_recovery} + {P_mine_openpit_coal} * {factor_ch4_openpit} + ({P_mine_post_high_gas} * {factor_ch4_high_gas} + {P_mine_post_low_gas} * {factor_ch4_low_gas} + {P_mine_post_openpit} * {factor_ch4_post_openpit})',
      activityData: '井工/露天/矿后活动',
      isSubtotal: true,
      note: '按行内采矿行业指引分项核算甲烷逃逸'
    },
    {
      id: 'F5', sort: 5, name: 'CO2逃逸排放', emissionUnit: 'tCO₂e',
      expression: '({P_mine_co2_vent} + {P_mine_co2_drain}) * {factor_co2} - {P_mine_co2_recovery} * {factor_co2_recovery}',
      activityData: '井工开采通风/抽放/回收',
      isSubtotal: true
    },
    {
      id: 'F_total', sort: 99, name: '主体排放合计', emissionUnit: 'tCO₂e',
      expression: 'SUM({F1}, {F2}, {F3}, {F4}, {F5})',
      activityData: '核算周期内碳排放量',
      isEntityTotal: true,
      summary: '主体排放 = 燃料燃烧 + 净购电 + 净购热 + CH4逃逸 + CO2逃逸'
    }
  ];

  const MINING_FACTOR_BINDINGS = [
    { refKey: 'factor_coal', label: '煤炭', matchType: 'fixed', factorSource: '行内采矿行业因子表', unitActivity: 't', unitFactor: 'tCO₂/t', defaultValue: 2.4936, caliberTag: 'bank' },
    { refKey: 'factor_coke', label: '焦炭', matchType: 'fixed', factorSource: '行内采矿行业因子表', unitActivity: 't', unitFactor: 'tCO₂/t', defaultValue: 2.8604, caliberTag: 'bank' },
    { refKey: 'factor_diesel', label: '柴油', matchType: 'fixed', factorSource: '行内采矿行业因子表', unitActivity: 't', unitFactor: 'tCO₂/t', defaultValue: 3.0959, caliberTag: 'bank' },
    { refKey: 'factor_gas', label: '天然气', matchType: 'fixed', factorSource: '行内采矿行业因子表', unitActivity: '万m³', unitFactor: 'tCO₂/万m³', defaultValue: 21.622, caliberTag: 'bank' },
    { refKey: 'factor_other_1', label: '其他燃料1', matchType: 'conditional', dependsOn: 'P_mine_other_fuel_type_1', factorSource: '行内采矿行业因子表 / 排放因子库', unitActivity: 't或万m³', unitFactor: 'tCO₂/t 或 tCO₂/万m³', caliberTag: 'bank' },
    { refKey: 'factor_other_2', label: '其他燃料2', matchType: 'conditional', dependsOn: 'P_mine_other_fuel_type_2', factorSource: '行内采矿行业因子表 / 排放因子库', unitActivity: 't或万m³', unitFactor: 'tCO₂/t 或 tCO₂/万m³', caliberTag: 'bank' },
    { refKey: 'factor_electricity', label: '电力因子', matchType: 'fixed', factorSource: '指引附2 / 因子库', unitActivity: 'MWh', unitFactor: 'tCO₂/MWh', defaultValue: 0.5306, caliberTag: 'pbo', note: '全国平均电网因子，正式可按区域电网匹配' },
    { refKey: 'factor_heat', label: '热力因子', matchType: 'fixed', factorSource: '指引附2 / 因子库', unitActivity: 'GJ', unitFactor: 'tCO₂/GJ', defaultValue: 0.11, caliberTag: 'pbo' },
    { refKey: 'factor_ch4_gwp', label: 'CH4全球变暖潜势', matchType: 'fixed', factorSource: 'IPCC / 指引', unitActivity: 't CH4', unitFactor: 'tCO₂e/t CH4', defaultValue: 28, caliberTag: 'pbo' },
    { refKey: 'factor_ch4_recovery', label: 'CH4回收抵扣', matchType: 'fixed', factorSource: '行内采矿行业因子表', unitActivity: '万m³', unitFactor: 'tCO₂e/万m³', defaultValue: 0.717, caliberTag: 'bank' },
    { refKey: 'factor_ch4_openpit', label: '露天开采CH4因子', matchType: 'fixed', factorSource: '行内采矿行业因子表', unitActivity: 't 原煤', unitFactor: 'tCO₂e/t', defaultValue: 0.0008, caliberTag: 'bank' },
    { refKey: 'factor_ch4_high_gas', label: '高瓦斯井工矿CH4因子', matchType: 'fixed', factorSource: '行内采矿行业因子表', unitActivity: 't 原煤', unitFactor: 'tCO₂e/t', defaultValue: 0.015, caliberTag: 'bank' },
    { refKey: 'factor_ch4_low_gas', label: '低瓦斯井工矿CH4因子', matchType: 'fixed', factorSource: '行内采矿行业因子表', unitActivity: 't 原煤', unitFactor: 'tCO₂e/t', defaultValue: 0.004, caliberTag: 'bank' },
    { refKey: 'factor_ch4_post_openpit', label: '矿后露天矿CH4因子', matchType: 'fixed', factorSource: '行内采矿行业因子表', unitActivity: 't 原煤', unitFactor: 'tCO₂e/t', defaultValue: 0.0005, caliberTag: 'bank' },
    { refKey: 'factor_co2', label: 'CO2逃逸', matchType: 'fixed', factorSource: '行内采矿行业因子表', unitActivity: 't CO2', unitFactor: 'tCO₂/t CO2', defaultValue: 1, caliberTag: 'bank' },
    { refKey: 'factor_co2_recovery', label: 'CO2回收抵扣', matchType: 'fixed', factorSource: '行内采矿行业因子表', unitActivity: '万m³', unitFactor: 'tCO₂/万m³', defaultValue: 1.964, caliberTag: 'bank' }
  ];

  const MINING_LAYOUT = [
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
          sectionLabel: '其他燃料（下拉选择）',
          varietyParamId: 'P_mine_other_fuel_type_1',
          amountParamId: 'P_mine_other_fuel_amount_1',
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
      sections: [{ type: 'fixed', fields: ['P_purchased_electricity'] }]
    },
    {
      type: 'partition',
      title: '净购入热力',
      sections: [{ type: 'fixed', fields: ['P_purchased_heat'] }]
    },
    {
      type: 'partition',
      title: 'CH4 逃逸排放',
      sections: [
        {
          type: 'fixed',
          title: '井工开采',
          fields: ['P_mine_ch4_vent', 'P_mine_ch4_drain', 'P_mine_ch4_recovery']
        },
        {
          type: 'fixed',
          title: '露天开采',
          fields: ['P_mine_openpit_coal']
        },
        {
          type: 'fixed',
          title: '原煤矿后活动',
          fields: ['P_mine_post_high_gas', 'P_mine_post_low_gas', 'P_mine_post_openpit']
        }
      ]
    },
    {
      type: 'partition',
      title: 'CO2 逃逸排放',
      sections: [
        {
          type: 'fixed',
          title: '井工开采',
          fields: ['P_mine_co2_vent', 'P_mine_co2_drain', 'P_mine_co2_recovery']
        }
      ]
    },
    {
      type: 'partition',
      title: '其他',
      sections: [{ type: 'fixed', fields: ['P_remarks'] }]
    }
  ];

  window.METHOD_CONFIG_MINING_ENERGY = {
    templateId: 'tpl_np_铜铅锌原煤_energy',
    meta: {
      id: 'tpl_np_铜铅锌原煤_energy',
      templateName: '有色-铜铅锌原煤开采-能源法',
      industry: '有色',
      industryMajor: '有色',
      subCategory: '铜铅锌原煤开采和洗选',
      bizType: 'non_project',
      methodId: 'energy',
      priority: 1,
      applyScene: ['entity'],
      gbCodes: ['B0810', 'B0820', 'B0610', 'B0620'],
      status: 'published',
      version: 'V1.0',
      fieldCount: MINING_PARAMS.length,
      formulaCount: MINING_FORMULAS.length,
      updatedAt: '2026-06-29',
      dataSourceCollect: '行内高碳行业非项目采集表（铜、铅、锌、原煤开采和洗选）',
      dataSourceFactor: '操作指引附2 + 行内采矿行业因子表',
      entityFormulaSummary: '主体排放 = 燃料燃烧 + 净购电 + 净购热 + CH4逃逸 + CO2逃逸',
      description: '对齐行内 Excel 采集表：燃料燃烧（含其他燃料下拉）、净购入电/热、CH4/CO2 逃逸排放及备注'
    },
    params: MINING_PARAMS,
    layout: MINING_LAYOUT,
    formulas: MINING_FORMULAS,
    factorBindings: MINING_FACTOR_BINDINGS
  };
})();
