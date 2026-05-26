#!/usr/bin/env python3
"""解析线下采集表 Excel，生成 supplement-templates.json（仅方法相关字段）"""
import json
import re
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'openpyxl', '-q'])
    import openpyxl

ROOT = Path(__file__).resolve().parent.parent
NP_PATH = Path('/Users/fangdanyang/Desktop/华夏银行/人行投融资碳核算工作要求/【终版】高碳行业非项目采集表模板（线下版）.xlsx')
P_PATH = Path('/Users/fangdanyang/Desktop/华夏银行/人行投融资碳核算工作要求/【终版】高碳行业项目采集表模板（线下版）.xlsx')

INDUSTRY_SHEETS = ['电力', '水泥', '平板玻璃', '钢铁', '铝冶炼', '铜冶炼', '石化', '化工', '造纸', '民航']

SHEET_META = {
    '电力': {'industryMajor': '电力', 'gbCodes': ['D4411', 'D4412', 'D4417', 'D4420']},
    '水泥': {'industryMajor': '建材', 'gbCodes': ['C3011']},
    '平板玻璃': {'industryMajor': '建材', 'gbCodes': ['C3041']},
    '钢铁': {'industryMajor': '钢铁', 'gbCodes': ['C3110', 'C3120', 'C3130']},
    '铝冶炼': {'industryMajor': '有色', 'gbCodes': ['C3216']},
    '铜冶炼': {'industryMajor': '有色', 'gbCodes': ['C3211']},
    '石化': {'industryMajor': '石化', 'gbCodes': ['C2511']},
    '化工': {'industryMajor': '化工', 'gbCodes': ['C2611', 'C2612', 'C2613', 'C2614', 'C2619', 'C2621', 'C2622', 'C2623', 'C2624', 'C2625', 'C2629']},
    '造纸': {'industryMajor': '造纸', 'gbCodes': ['C2211', 'C2212', 'C2221']},
    '民航': {'industryMajor': '民航', 'gbCodes': ['G5631', 'G5611', 'G5612']},
}

REPORT_SOURCES_NP = [
    '碳核查', '碳排放权配额实际履约情况', '环境信息披露报告', 'ESG报告',
    '可持续发展报告', '社会责任报告', '其他'
]
REPORT_SOURCES_P = [
    '经连续测量的碳排放数据', '建设或运营过程实际产生的数据', '可行性研究报告',
    '设计文件', '节能报告', '其他'
]

GRID_OPTIONS = [
    '华北电网', '东北电网', '华东电网', '华中电网', '西北电网', '南方电网', '西南电网', '全国平均'
]

DESULFUR_OPTIONS = [
    '石灰石', '菱镁石', '纯碱', '小苏打', '毒重石', '锂盐', '草碱、珠碱', '菱锶矿', '菱铁矿'
]

CARBONATE_OPTIONS_CEMENT = ['石灰石', '白云石', '纯碱', '小苏打', '菱镁石', '毒重石', '锂盐', '草碱、珠碱', '菱锶矿', '菱铁矿']
CARBONATE_OPTIONS_CHEM = CARBONATE_OPTIONS_CEMENT + ['菱锰石']

OTHER_FUEL = {
    '电力': ['原油', '燃料油', '汽油', '煤油', '其他石油制品', '液化石油气', '液化天然气', '焦炉煤气', '高炉煤气', '转炉煤气', '炼厂干气', '其他煤气', '无'],
    '水泥': ['石油焦', '原油', '燃料油', '汽油', '煤油', '液化石油气', '液化天然气', '焦油', '高炉煤气', '转炉煤气', '焦炉煤气', '炼厂干气', '无'],
    '平板玻璃': ['石油焦', '原油', '燃料油', '汽油', '煤油', '液化石油气', '液化天然气', '焦油', '高炉煤气', '转炉煤气', '焦炉煤气', '炼厂干气', '无'],
    '钢铁': ['石油焦', '原油', '燃料油', '汽油', '煤油', '其他石油制品', '液化天然气', '液化石油气', '煤焦油', '高炉煤气', '转炉煤气', '焦炉煤气', '炼厂干气', '其他煤气', '无'],
    '铝冶炼': ['石油焦', '原油', '燃料油', '煤油', '其他石油制品', '液化天然气', '液化石油气', '高炉煤气', '转炉煤气', '焦炉煤气', '炼厂干气', '其他煤气', '无'],
    '铜冶炼': ['石油焦', '原油', '燃料油', '汽油', '煤油', '液化天然气', '液化石油气', '炼厂干气', '焦油', '焦炉煤气', '高炉煤气', '转炉煤气', '其他煤气', '无'],
    '石化': ['石油焦', '原油', '燃料油', '汽油', '煤油', '其他石油制品', '液化天然气', '液化石油气', '煤焦油', '高炉煤气', '转炉煤气', '焦炉煤气', '炼厂干气', '其他煤气', '无'],
    '化工': ['原油', '燃料油', '汽油', '一般煤油', '石油焦', '液化天然气', '液化石油气', '焦油', '其他石油制品', '粗苯', '炼厂干气', '高炉煤气', '转炉煤气', '焦炉煤气', '其他煤气', '无'],
    '造纸': ['石油焦', '原油', '燃料油', '汽油', '煤油', '液化天然气', '液化石油气', '炼厂干气', '焦油', '焦炉煤气', '高炉煤气', '转炉煤气', '其他煤气', '无'],
    '民航': ['石油焦', '原油', '燃料油', '汽油', '煤油', '液化天然气', '液化石油气', '炼厂干气', '焦油', '焦炉煤气', '高炉煤气', '转炉煤气', '其他煤气', '无'],
}

POWER_PRODUCT = [
    {'key': 'coalPower', 'label': '燃煤发电量（MWh）', 'group': '供电'},
    {'key': 'gasPower', 'label': '燃气发电量（MWh）', 'group': '供电'},
    {'key': 'hydroPower', 'label': '水力发电量（MWh）', 'group': '供电'},
    {'key': 'nuclearPower', 'label': '核能发电量（MWh）', 'group': '供电'},
    {'key': 'windPower', 'label': '风力发电量（MWh）', 'group': '供电'},
    {'key': 'solarPvPower', 'label': '光伏发电量（MWh）', 'group': '供电'},
    {'key': 'solarThermalPower', 'label': '光热发电量（MWh）', 'group': '供电'},
    {'key': 'biomassPower', 'label': '生物质发电量（MWh）', 'group': '供电'},
    {'key': 'chpPowerLevel1', 'label': '热电联产-供电排放水平I级机组发电量（MWh）', 'group': '供电'},
    {'key': 'chpPowerLevel2', 'label': '热电联产-供电排放水平II级机组发电量（MWh）', 'group': '供电'},
    {'key': 'chpHeatLevel1', 'label': '热电联产-供热排放水平I级机组供热量（GJ）', 'group': '供热'},
    {'key': 'chpHeatLevel2', 'label': '热电联产-供热排放水平II级机组供热量（GJ）', 'group': '供热'},
]

PRODUCT_BY_SHEET = {
    '水泥': [{'key': 'clinkerOutput', 'label': '水泥熟料产量（吨）'}],
    '平板玻璃': [{'key': 'glassOutput', 'label': '平板玻璃产量（吨）'}],
    '钢铁': [
        {'key': 'pigIron', 'label': '生铁产量（吨）'},
        {'key': 'steelBof', 'label': '粗钢（转炉）产量（吨）'},
        {'key': 'steelEaf', 'label': '粗钢（电炉）产量（吨）'},
        {'key': 'rebar', 'label': '钢筋产量（吨）'},
        {'key': 'sectionSteel', 'label': '型钢产量（吨）'},
        {'key': 'largeSteel', 'label': '大型钢材产量（吨）'},
        {'key': 'smallSteel', 'label': '小型钢材产量（吨）'},
        {'key': 'lowCarbonSteel', 'label': '低碳钢产量（吨）'},
        {'key': 'ironProducts', 'label': '铁制品产量（吨）'},
        {'key': 'steelProducts', 'label': '钢制品产量（吨）'},
    ],
    '铝冶炼': [
        {'key': 'alumina', 'label': '氧化铝产量（吨）'},
        {'key': 'aluminumLiquid', 'label': '铝液（原铝）产量（吨）'},
        {'key': 'aluminumIngot', 'label': '铝锭产量（吨）'},
    ],
    '铜冶炼': [{'key': 'copperOutput', 'label': '铜产量（吨）'}],
    '石化': [
        {'key': 'crudeOil', 'label': '原油产量（吨）'},
        {'key': 'ngl', 'label': '天然气凝析液产量（吨）'},
        {'key': 'aviationGasoline', 'label': '航空汽油产量（吨）'},
        {'key': 'motorGasoline', 'label': '车用汽油产量（吨）'},
        {'key': 'aviationKerosene', 'label': '航空煤油产量（吨）'},
        {'key': 'lampKerosene', 'label': '灯用煤油产量（吨）'},
        {'key': 'diesel', 'label': '柴油产量（吨）'},
        {'key': 'marineFuelOil', 'label': '船用燃料油产量（吨）'},
        {'key': 'industrialFuelOil', 'label': '工业用燃料油产量（吨）'},
        {'key': 'lpg', 'label': '液化石油气产量（吨）'},
        {'key': 'methaneHydrogen', 'label': '甲烷氢产量（吨）'},
        {'key': 'paraffin', 'label': '石蜡产量（吨）'},
        {'key': 'coalTarPitch', 'label': '煤焦沥青产量（吨）'},
        {'key': 'petroleumAsphalt', 'label': '石油沥青产量（吨）'},
        {'key': 'petroleumCoke', 'label': '石油焦产量（吨）'},
        {'key': 'lubricant', 'label': '润滑油产量（吨）'},
        {'key': 'naphtha', 'label': '石脑油产量（吨）'},
        {'key': 'ethane', 'label': '乙烷产量（吨）'},
    ],
    '化工': [
        {'key': 'pvc1', 'label': '聚氯乙烯产量（吨）'},
        {'key': 'causticSoda', 'label': '氢氧化钠产量（吨）'},
        {'key': 'potassiumChloride', 'label': '氯化钾产量（吨）'},
        {'key': 'carbonAnode', 'label': '碳阳极产量（吨）'},
        {'key': 'ethylene', 'label': '乙烯产量（吨）'},
        {'key': 'pesticide', 'label': '化学农药产量（吨）'},
        {'key': 'ppc', 'label': '聚碳酸亚丙酯产量（吨）'},
        {'key': 'polypropylene', 'label': '聚丙烯产量（吨）'},
        {'key': 'polyethylene', 'label': '聚乙烯产量（吨）'},
        {'key': 'pvc2', 'label': '聚氯乙烯产量-2（吨）'},
        {'key': 'abs', 'label': '丙烯腈-苯乙烯-丁二烯共聚物产量（吨）'},
        {'key': 'pc', 'label': '聚碳酸酯产量（吨）'},
        {'key': 'detergentRegular', 'label': '普通洗涤液产量（吨）'},
        {'key': 'detergentConc', 'label': '浓缩洗涤液产量（吨）'},
        {'key': 'cellulose', 'label': '纤维素产量（吨）'},
        {'key': 'polyesterResin', 'label': '聚酯树脂产量（吨）'},
        {'key': 'pta', 'label': '对苯二甲酸产量（吨）'},
        {'key': 'methanol', 'label': '甲醇产量（吨）'},
        {'key': 'coating', 'label': '涂料产量（吨）'},
        {'key': 'nitrogenFertilizer', 'label': '氮肥（含尿素）产量（吨）'},
    ],
    '造纸': [
        {'key': 'packagingPaper', 'label': '包装纸（吨）'},
        {'key': 'copyPaper', 'label': '复印纸（吨）'},
        {'key': 'householdPaper', 'label': '生活用纸（吨）'},
        {'key': 'paperProducts', 'label': '纸制品（吨）'},
    ],
    '民航': [],
}

PROCESS_BY_SHEET = {
    '电力': [{
        'type': 'desulfur',
        'label': '脱硫试剂',
        'slots': 2,
        'typeOptions': DESULFUR_OPTIONS,
        'amountUnit': 't'
    }],
    '水泥': [{
        'type': 'carbonate',
        'label': '碳酸盐分解',
        'typeOptions': CARBONATE_OPTIONS_CEMENT,
        'amountUnit': 't'
    }],
    '平板玻璃': [{
        'type': 'carbonate',
        'label': '碳酸盐分解',
        'typeOptions': CARBONATE_OPTIONS_CEMENT,
        'amountUnit': 't'
    }],
    '钢铁': [
        {'type': 'amount', 'key': 'electrode', 'label': '电极使用消耗量（吨）'},
        {'type': 'amount', 'key': 'limestone', 'label': '石灰石分解消耗量（吨）'},
        {'type': 'amount', 'key': 'dolomite', 'label': '白云石分解消耗量（吨）'},
    ],
    '铝冶炼': [],
    '铜冶炼': [],
    '石化': [],
    '化工': [
        {'type': 'amount', 'key': 'n2oEmission', 'label': '氧化亚氮排放（吨）'},
        {'type': 'carbonate', 'label': '碳酸盐分解', 'typeOptions': CARBONATE_OPTIONS_CHEM, 'amountUnit': 't', 'keyPrefix': 'carbonate'},
    ],
    '造纸': [],
    '民航': [],
}


def slug_key(label):
    s = re.sub(r'[^\w]', '', label)
    return s[:40] if s else 'field'


def build_template(sheet_name, biz_type):
    meta = SHEET_META[sheet_name]
    is_project = biz_type == 'project'
    has_heat = sheet_name != '电力'
    has_product = sheet_name != '民航' and (
        sheet_name == '电力' or bool(PRODUCT_BY_SHEET.get(sheet_name))
    )

    energy = {
        'fuelFixed': [
            {'key': 'coal', 'label': '煤炭消耗量（吨）', 'required': True},
            {'key': 'coke', 'label': '焦炭消耗量（吨）', 'required': True},
            {'key': 'diesel', 'label': '柴油消耗量（吨）', 'required': False},
            {'key': 'gas', 'label': '天然气消耗量（万立方米）', 'required': True, 'step': '0.0001'},
        ],
        'otherFuelOptions': OTHER_FUEL.get(sheet_name, OTHER_FUEL['电力']),
        'gridOptions': GRID_OPTIONS,
        'gridLabel': '项目所属电网' if is_project else '企业所属电网',
        'hasPurchasedHeat': has_heat,
        'processBlocks': PROCESS_BY_SHEET.get(sheet_name, []),
    }

    product_fields = []
    if sheet_name == '电力':
        product_fields = POWER_PRODUCT
    elif has_product:
        product_fields = PRODUCT_BY_SHEET[sheet_name]

    return {
        'id': f"{biz_type}_{sheet_name}",
        'bizType': biz_type,
        'sheetName': sheet_name,
        'industryMajor': meta['industryMajor'],
        'gbCodes': meta['gbCodes'],
        'methods': {
            'report': {
                'sourceOptions': REPORT_SOURCES_P if is_project else REPORT_SOURCES_NP,
                'hasAttachments': True,
            },
            'energy': energy,
            'product': {
                'supported': has_product,
                'fields': product_fields,
            },
        },
    }


def build_all():
    templates = []
    for sheet in INDUSTRY_SHEETS:
        templates.append(build_template(sheet, 'non_project'))
        templates.append(build_template(sheet, 'project'))
    return templates


def write_outputs(templates):
    out_dir = ROOT / 'assets' / 'data'
    out_dir.mkdir(parents=True, exist_ok=True)
    meta = {
        'version': 'offline-template-2026',
        'source': '高碳行业采集表模板（线下版）· 方法字段',
        'count': len(templates),
        'templates': templates,
    }
    json_path = out_dir / 'supplement-templates.json'
    json_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8')
    js_path = ROOT / 'assets' / 'js' / 'supplement-templates-data.js'
    js_path.write_text(
        '/** 补录模板 · 由 scripts/parse-supplement-templates.py 生成 */\n'
        f'window.SUPPLEMENT_TEMPLATES = {json.dumps(templates, ensure_ascii=False)};\n',
        encoding='utf-8'
    )
    return json_path, js_path


def main():
    templates = build_all()
    json_path, js_path = write_outputs(templates)
    print(f'Generated {len(templates)} supplement templates')
    print(f'  Wrote {json_path}')
    print(f'  Wrote {js_path}')


if __name__ == '__main__':
    main()
