/** 计算方法配置 — 操作指引文案 */
window.METHOD_CONFIG_GUIDE = {
  roles: '总行绿金部（配置）· 分行/客户经理（使用已发布模板填报，不可改配置）',

  layers: [
    { name: '参数字段库', desc: '定义「有哪些字段」：名称、类型、单位、小数位、枚举值', menu: '#/method-config/params', editable: '演示：可新增/编辑并本地保存' },
    { name: '排放因子库', desc: '维护因子数值与口径（已有独立菜单）', menu: '#/factors', editable: '已可增删改（演示）' },
    { name: '方法模板', desc: '把字段 + 公式 + 因子绑成「某行业某方法」的完整方案', menu: '#/method-config/templates', editable: 'Step1～3 可编辑、可保存草稿与发布' }
  ],

  workflow: [
    { step: 1, title: '维护参数字段库', where: '#/method-config/params', action: '新增或编辑参数（如「煤炭消耗量」：数值型、t、4位小数）', output: '得到全局可复用的参数 ID（如 P_coal）' },
    { step: 2, title: '创建/打开方法模板', where: '#/method-config/templates', action: '选行业 → 项目/非项目 → 核算方法 → 进入编辑', output: '一份草稿模板（如 平板玻璃·非项目·能源法）' },
    { step: 3, title: 'Step1 编排采集字段', where: '模板编辑 step=1', action: '从字段库勾选本模板要展示的项；配置分区（燃料/电网/过程排放）', output: '客户经理收集页要填的表单结构' },
    { step: 4, title: 'Step2 配置计算公式', where: '模板编辑 step=2', action: '按业务公式写分项（燃料+购电+购热+过程）及合计；执行公式校验', output: '主体排放计算规则' },
    { step: 5, title: 'Step3 绑定排放因子', where: '模板编辑 step=3', action: '为公式中 {factor_xxx} 指定因子来源：固定 / 按电网匹配 / 按品种匹配', output: '消耗量 × 因子 的完整链路' },
    { step: 6, title: '预览并发布', where: '模板编辑页', action: '预览收集页 → 发布模板（生成版本号如 2026.1）', output: '新任务/新年度使用新版本；在途任务可锁定旧版本' },
    { step: 7, title: '业务侧使用', where: '数据采集填报', action: '客户经理按已发布模板填报；系统按公式+因子算主体排放', output: '与配置一致的核算结果' }
  ],

  changeScenarios: [
    { scene: '采集表增删字段', who: '总行', how: '字段库新增参数 → 打开对应模板 Step1 加入/移除 → 若公式用到则改 Step2 → 发布新版本', example: '平板玻璃增加「外购蒸汽」字段' },
    { scene: '调整主体排放公式', who: '总行', how: '模板 Step2 修改分项公式 → 校验 → 发布；在途任务仍用旧版', example: '过程排放合并脱硫与碳酸盐' },
    { scene: '因子数值更新', who: '总行', how: '优先在「排放因子库」改因子/新增年度版本；模板 Step3 引用关系一般不变', example: '2027 年电力因子调表' },
    { scene: '赤道表与人行表不一致', who: '总行', how: '因子库用 caliberTag 区分口径；模板 Step3 指定默认口径；必要时双因子对照', example: '煤炭合并 vs 分煤种' },
    { scene: '新增行业模板', who: '总行', how: '复制相近行业模板 → 改 Step1～3 → 发布', example: '复制水泥模板做化工' },
    { scene: '仅改文案/必填', who: '总行', how: '改参数属性或模板 Step1 必填标记 → 发布小版本', example: '天然气改为必填' }
  ],

  prototypeLimits: [
    { item: '参数字段库', now: '可新增/编辑，保存到浏览器 localStorage（刷新仍在，点「重置数据」会清空）', later: '服务端持久化 + 权限 + 审计' },
    { item: '方法模板 Step1～3', now: '可勾选字段、编辑公式与因子绑定；保存草稿/发布到 localStorage', later: '服务端持久化 + 审批 + 驱动收集页渲染' },
    { item: '发布模板', now: '校验公式后写入版本号并标记已发布', later: '写版本表，驱动收集页与计算引擎' },
    { item: '收集填报页', now: '仍读静态 SUPPLEMENT_TEMPLATES', later: '读取已发布模板动态渲染' }
  ]
};
