/** 页面更新说明 — 内容来源于需求沟通记录，按版本归档；展示时按更新时间倒序 */
const CHANGELOG_SCREENSHOT_BASE = 'assets/changelog/screenshots';

const UPDATE_CHANGELOG = [
  {
    version: 'v1.1',
    date: '2026-07-22',
    summary: '模板多版本管理与任务模板版本字段',
    items: [
      {
        menu: '模板配置',
        feature: '模板多版本管理',
        type: 'feature',
        date: '2026-07-22 17:30',
        text: '模版配置列表页新增版本 Tab（v1.0、v2.0…），交互与排放因子库版本管理一致：切换 Tab 查看对应版本模板集；点击「+」可选择复制来源版本并全量复制所有模板生成新版本（草稿状态），同一行业·核算方法在不同模板版本间可并存，新建模板归属当前选中版本。',
        route: '#/method-config/templates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-version-tabs.png?v=20260722a`
      },
      {
        menu: '核算任务',
        feature: '新建/编辑/查看任务模板版本',
        type: 'field',
        date: '2026-07-22 17:50',
        text: '新建、编辑、查看核算任务表单在「因子版本」下方新增「模板版本」下拉，选项与模版配置版本 Tab（v1.0、v2.0…）一致；任务保存后按所选模板版本匹配采集模板。',
        route: '#/task-create',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/task-template-version-field.png?v=20260722b`
      }
    ]
  },
  {
    version: 'v1.1',
    date: '2026-07-21',
    summary: '数据审核状态流转、企业碳账户去重、模板校验与因子版本等体验优化',
    items: [
      {
        menu: '数据审核',
        feature: '同条采集数据状态流转单行展示',
        type: 'fix',
        date: '2026-07-21 16:30',
        text: '同一笔采集补录数据在分行初审、一键提交总行、总行终审等环节仅保留一条审批记录：列表按 supplementId 去重展示当前有效环节与状态，不再因提交或退回拆成两行；历史演示数据中 S001 双行样例已移除，迁移逻辑会将旧双行合并为单行。',
        route: '#/approvals?taskId=T2025001',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/approvals-status-flow.png?v=20260721a`
      },
      {
        menu: '数据审核',
        feature: '分行一键提交沿用同条记录',
        type: 'fix',
        date: '2026-07-21 16:35',
        text: '分行「一键提交总行」、截止日批量提交及总行退回分行时，均在原审批记录上更新 reviewLevel、status 与操作时间，不再新增平行记录；总行终审通过后仍进入排放计算，与单行展示规则一致。',
        route: '#/approvals?taskId=T2025001',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/approvals-status-flow.png?v=20260721a`
      },
      {
        menu: '企业碳账户',
        feature: '按核算年度同名企业去重',
        type: 'fix',
        date: '2026-07-21 16:40',
        text: '「按核算年度查看」下，同一核算年度、同一客户（名称/信用代码/客户号）仅展示一条账户行；多条并存时按数据质量等级优先，同等级取最新更新时间，避免「主体排放合计」重复累加。',
        route: '#/carbon-accounts',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/carbon-accounts-year-dedupe.png?v=20260721b`
      },
      {
        menu: '企业碳账户',
        feature: '按企业汇总跨年度去重',
        type: 'fix',
        date: '2026-07-21 16:45',
        text: '「按企业汇总查看」下，同一客户跨多个核算年度只保留一条汇总行（按年度分别择优后再合并），统计卡片「企业账户」按去重后企业数计算，不再因历史重复开户出现多条同名记录。',
        route: '#/carbon-accounts',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/carbon-accounts-enterprise-dedupe.png?v=20260721c`
      },
      {
        menu: '模板配置',
        feature: '同行业同核算方法唯一校验',
        type: 'feature',
        date: '2026-07-21 16:50',
        text: '新建、保存、复制模板时校验：同一行业（含多选行业交集）与同一核算方法不允许存在第二套模板（草稿/已发布均参与冲突检测）；冲突时 toast 提示已占用模板名称与状态，阻止保存。',
        route: '#/method-config/templates/new',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-industry-method-unique.png?v=20260721i`
      },
      {
        menu: '模板编辑',
        feature: '匹配排放因子展示行业并可搜索',
        type: 'feature',
        date: '2026-07-21 16:55',
        text: '模板编辑「匹配排放因子」下拉选项除因子名称、数值、单位外，增加行业名称展示（格式：行业 · 数值 · 单位）；搜索框支持按因子名称或行业关键字过滤，便于跨行业因子库中快速定位。',
        route: '#/method-config/templates/edit?step=2',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-factor-industry-search.png?v=20260721e`
      },
      {
        menu: '核算任务',
        feature: '新建/编辑任务因子版本',
        type: 'field',
        date: '2026-07-21 17:00',
        text: '新建、编辑、查看核算任务表单在「分行审批截止日期」下方新增「因子版本」下拉，选项与排放因子库版本 Tab（v1.0、v2.0…）一致。',
        route: '#/task-create',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/task-factor-version-field.png?v=20260721h`
      }
    ]
  },
  {
    version: 'v1.0',
    date: '2026-07-15',
    summary: '投融资碳核算 UAT 首发版本',
    items: [
      {
        menu: '数据审核',
        feature: '总行一级分行两级列表',
        type: 'feature',
        date: '2026-07-16 19:05',
        text: '总行角色数据审核页改为两级结构：外侧列表按「任务 + 一级分行」汇总展示，字段为序号、任务名称、核算年度、一级分行、分行审核通过条数、合计任务条数、操作（查看）；筛选项为任务名称、核算年度、一级分行。点击「查看」进入内侧明细列表（沿用原逐条审核列表字段与筛选），支持单条审核/查看及「批量审核通过」；审核完成后可返回一级分行汇总列表。分行负责人、客户经理视图保持不变。',
        route: '#/approvals',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/approvals-hq-branch-summary.png?v=20260716h`
      },
      {
        menu: '行业配置',
        feature: '精简为标识配置能力',
        type: 'feature',
        date: '2026-07-16 17:05',
        text: '行业配置页移除「新增行业」「批量导入」及演示环境 DEV 导入说明入口，列表操作列移除「删除」，仅保留标识筛选与「编辑」。绿金系统基础配置已包含行业配置功能，仅需增加配置标识功能：在既有国标四级行业上维护「人行八大高碳」「我行主要行业」等标识，供候选清单、正式清单与核算流程按标识筛选与展示。',
        route: '#/industry-config',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/industry-config-tag-only.png?v=20260716g`
      },
      {
        menu: '六步流程',
        feature: '排放计算步骤 DEV 进入规则',
        type: 'feature',
        date: '2026-07-16 16:50',
        text: '六步流程「排放计算」步骤标题旁新增橙色 DEV 标识，点击可查看进入规则说明。截止日前：当任务下全部已锁定归集单元的「排放结果（tCO₂e）」均有值时，可点击进入排放计算；到达「分行审批截止日期」当日及之后：任务自动进入排放计算步骤。截止日自动进入时，对已下发手动核算采集任务且数据状态非「填报完成」的记录，数据采集列表「数据状态」与数据审核列表「审核状态」（不论处于分行初审、总行终审或待审核等任何节点）均变更为「强制结束」。演示环境可通过 window.__DEMO_CALC_STEP_REF_DATE__ 覆盖当前日期验收截止日逻辑。',
        route: '#/data-collect?taskId=T2026002',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/calculation-step-dev-forced-end.png?v=20260716f`
      },
      {
        menu: '数据审核',
        feature: '总行一级分行列与筛选',
        type: 'field',
        date: '2026-07-16 13:45',
        text: '仅总行角色查看数据审核列表时，在「客户名称」后新增「一级分行」列，展示收集单据下发分行；筛选条件同步增加「一级分行」下拉，选项与新建核算任务「组织范围」一致（北京分行、上海分行等 30 家一级分行）。分行负责人、客户经理视图不展示该列与筛选项。',
        route: '#/approvals',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/approvals-tier1-branch.png?v=20260716a`
      },
      {
        menu: '企业碳账户',
        feature: '列表列名（企业/项目）',
        type: 'style',
        date: '2026-07-16 12:20',
        text: '账户列表表头「企业名称」改为「企业/项目名称」，「主体排放(tCO2e)」改为「企业/项目主体排放（tCO2e）」。企业行展示企业名称与法人主体排放；展开后的项目子行同一列展示项目名称与项目主体排放，列名统一体现企业/项目双层含义。',
        route: '#/carbon-accounts',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/carbon-accounts-project-expand.png?v=20260716c`
      },
      {
        menu: '排放因子库',
        feature: '计算方法选项扩展',
        type: 'field',
        date: '2026-07-16 12:13',
        text: '新增/编辑因子时，「计算方法」改为可输入组合框（不再使用「下拉 + 自定义… + 独立输入框」）：输入框 placeholder 为「请选择或输入核算方法名称」；点击可展开预设列表（报告法、物理活动法-能源法/产品法、经济活动法-营收、经济活动法-资产总额、其他计算法），也可直接在输入框键入自定义方法名称并保存；列表与筛选按所填名称展示。历史因子中 methodId 为 economy 的记录在编辑时默认回显「经济活动法-营收」，列表仍归入「经济活动法（兼容）」筛选。',
        route: '#/factors/new',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/factors-method-select.png?v=20260716e`
      },
      {
        menu: '企业碳账户',
        feature: '项目排放可展开列表',
        type: 'feature',
        date: '2026-07-16 12:00',
        text: '企业碳账户列表按「核算年度 + 统一社会信用代码」合并为一条企业行。若该企业下存在按「项目方式」核算的项目贷款，企业行序号列提供展开/收起按钮；展开后在下方逐条展示项目子行：「企业/项目名称」列显示项目名称，「企业/项目主体排放（tCO2e）」列显示项目主体排放（非归因），操作列与企业行一致（查看、编辑等，项目子行带 sub 参数）。按非项目方式核算的项目贷款不生成可展开子行。',
        route: '#/carbon-accounts',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/carbon-accounts-project-expand.png?v=20260716a`
      },
      {
        menu: '数据采集填报',
        feature: '排放数据 DEV 填报说明',
        type: 'feature',
        date: '2026-07-15 21:15',
        text: '在线收集填报页「排放数据（可同时填写多种方法）」卡片标题旁新增橙色 DEV「填报说明」入口（样式与批量导入说明一致）。侧栏说明各方法 Tab 的字段必填校验、主体排放计算条件、方法匹配与审核预览逻辑，并注明各行业各方法的采集字段、必填规则与排放量计算公式均以「碳核算模板配置中心」已发布模板为准。仅供 UAT/演示环境使用，正式系统不包含此入口。',
        route: '#/supplement-fill',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/supplement-emission-dev-spec.png?v=20260715k`
      },
      {
        menu: '碳排放计算',
        feature: '项目总投资金额筛选与提交锁定',
        type: 'feature',
        date: '2026-07-15 21:00',
        text: '排放计算页「排放计算清单」上方新增筛选：项目总投资金额（元）起、项目总投资金额（元）止。筛选项仅针对业务种类为「项目类」的归集单元；非项目类数据不参与筛选，默认全部纳入清单、统计与一键提交范围。设置区间并查询后，仅项目类按项目总投资过滤，非项目类始终保留；顶部总归因排放量、DQR/质量评级、已计算笔数及「投融资碳排放强度」均随当前可见清单实时重算。点击「一键提交数据」时，系统按当前清单（项目类筛选结果 + 非项目类全量）锁定数据；后续核算结果查询、报告导出与企业碳账户归集仅包含锁定范围内的记录。',
        route: '#/calculation',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/calculation-invest-filter.png?v=20260715l`
      },
      {
        menu: '演示环境',
        feature: '角色与客户经理切换',
        type: 'feature',
        date: '2026-07-15 20:10',
        text: '顶栏新增演示角色切换：总行绿金部、分行负责人、客户经理三类视角可一键切换，菜单与数据范围随角色联动。切换为「客户经理」后，额外展示客户经理下拉（王磊/陈静/刘洋/赵敏/周强/李娜，含所属分行），便于分别登录不同主办客户经理视角填报与验收任务清单、收集填报、审核流转等流程。该切换器仅供 UAT/演示测试使用，正式系统以宿主绿金系统统一认证与授权为准，不提供此演示下拉。',
        route: '#/manager-tasks',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/demo-role-manager-switch.png?v=20260715g`
      },
      {
        menu: '批量导入',
        feature: 'DEV 导入说明（演示专用）',
        type: 'feature',
        date: '2026-07-15 20:00',
        text: '参数管理、行业配置、排放因子库的「批量导入」按钮旁新增橙色「DEV 导入说明」入口，点击侧栏可查看导入模板表头、各字段必填规则与导入校验逻辑，便于开发与测试对照验收。该标识仅供 UAT/演示环境使用，正式系统上线不包含此入口及说明侧栏。',
        route: '#/factors',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/dev-import-spec-factor.png?v=20260715f`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '模板状态简化为草稿与已发布',
        type: 'feature',
        date: '2026-07-15 19:45',
        text: '取消模板「已停用」状态，仅保留「草稿」「已发布」两种。列表筛选与状态标签同步调整；草稿与已发布模板操作统一为「编辑」「复制」「删除」「查看」。删除已发布模板将直接移除配置，历史数据采集仍绑定原发布版本快照，不受影响。',
        route: '#/method-config/templates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-list.png?v=20260715d`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '经济活动法/其他计算法采集说明',
        type: 'feature',
        date: '2026-07-15 19:30',
        text: '新建与编辑模板时，核算方法选择「经济活动法」或「其他计算法」后，下方展示数据采集特殊说明：经济法直算路径下营业收入、因子与主体排放由系统预填且只读；其他计算法下行业因子由系统按行业自动匹配且只读。模板仍用于定义 Tab 展示结构，与能源法/产品法的手工填报+因子绑定模式区分。',
        route: '#/method-config/templates/new',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-method-collect-hint.png?v=20260715e`
      },
      {
        menu: '企业碳账户',
        feature: '注销账户处理规则',
        type: 'feature',
        date: '2026-07-15 19:10',
        text: '账户状态为「注销」时，列表操作列不再展示「编辑」入口（含项目子账户）；主体排放显示为 0，且不计入列表顶部「主体排放合计」。执行注销时，系统自动清零该账户及项目子账户各年度主体排放数据。',
        route: '#/carbon-accounts',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/carbon-accounts-cancelled.png?v=20260715c`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '附件型参数上传限制',
        type: 'field',
        date: '2026-07-15 18:45',
        text: '参数类型为「附件型」时，可在参数库配置「允许格式」「最多文件数」「单文件上限（MB）」；模板预览与数据采集提示文案（如「最多 3 个，单文件 ≤ 20MB」）均读取该参数配置，默认分别为 pdf/doc/xls/png 等、3 个、20MB。新增示例参数「报告佐证材料」便于查看与调整。',
        route: '#/method-config/params/edit?id=P_report_attach',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/param-attachment-config.png?v=20260715b`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '参数分类三类说明',
        type: 'field',
        date: '2026-07-15 18:30',
        text: '参数管理统一展示三类参数分类：① 基础信息类——说明性、佐证性字段，不参与排放公式；② 活动水平类——生产/消耗活动数据，可参与因子绑定与公式计算；③ 结果计算类——公式输出的核算结果，系统内置不可新建。新增/编辑页下拉展示全部三类，结果计算类置灰标注「系统内置，不可新建」；列表筛选与页脚同步三类说明。',
        route: '#/method-config/params/new',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/param-category-form.png`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '模板列表操作与查看',
        type: 'feature',
        date: '2026-07-15 18:00',
        text: '模板列表按状态区分操作：已停用模板为「启用」「删除」「查看」；草稿为「编辑」「复制」「删除」「查看」；已发布为「编辑」「复制」「删除」「查看」。删除已发布模板将停用该模板，历史数据采集仍绑定原发布版本；已停用模板再次删除则永久移除。',
        route: '#/method-config/templates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-list.png`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '已发布模板编辑隔离',
        type: 'feature',
        date: '2026-07-15 18:00',
        text: '已发布模板支持直接编辑；修改后需重新发布方对新数据采集生效。历史数据采集任务仍使用发布时的模板版本快照，不受后续编辑影响。编辑页与「查看」只读模式均提供说明提示。',
        route: '#/method-config/templates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-view-mode.png`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '模板因子版本',
        type: 'field',
        date: '2026-07-15 17:00',
        text: '新建与编辑模板时新增「因子版本」字段，选项与排放因子库版本 Tab 一致；在表单与核算中匹配排放因子时，下拉仅展示该版本因子库数据。',
        route: '#/method-config/templates/new',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-factor-version.png`
      },
      {
        menu: '数据审核',
        feature: '同主体排放冲突处理',
        type: 'feature',
        date: '2026-07-15 16:20',
        text: '分行审核时，若同一统一社会信用代码已有其他已通过记录且主体排放不一致，弹窗列举客户名称、业务种类、下发分行、主办客户经理、手动核算方法、手动主体排放，供审核员选择采用哪条主体排放；确认后统一同主体各条数据，被覆盖记录在数据采集与排放计算页手动主体排放后标识「（数据已覆盖）」，悬停可查看覆盖来源分行与客户经理。分行一键提交总行后，总行终审时若同主体各条数据已一致，不再重复弹窗；仅当仍存在不一致数据时才再次提示选择。',
        route: '#/approvals',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/emission-conflict-modal.png`
      },
      {
        menu: '数据审核',
        feature: '分行一键提交数据',
        type: 'feature',
        date: '2026-07-15 14:00',
        text: '分行负责人数据审核页新增「一键提交数据」：列表无「已通过」记录时按钮置灰；分行初审通过后勾选记录并提交，审核状态变为待审核，审核环节变为总行终审。',
        route: '#/approvals',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/approvals-batch-toolbar.png`
      },
      {
        menu: '排放因子库',
        feature: '因子编辑与字段统一',
        type: 'feature',
        date: '2026-07-14 18:00',
        text: '恢复因子编辑入口；新增、编辑、查看页字段统一为：因子口径、计算方法、行业名称、适用年度、因子名称、因子数值、因子单位、因子来源（非必填）。',
        route: '#/factors',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/factors-edit-fields.png`
      },
      {
        menu: '排放因子库',
        feature: '因子多版本管理',
        type: 'feature',
        date: '2026-07-14 17:30',
        text: '支持按适用年度维护多版本因子（如 2026、2027 各一版），列表可查看版本历史。',
        route: '#/factors',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/factors-version-tabs.png`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '一键更新全部因子版本',
        type: 'feature',
        date: '2026-07-14 17:00',
        text: '模板编辑页右上角新增「一键更新全部因子版本」，二次确认后将模板内因子引用批量切换至所选版本。',
        route: '#/method-config/templates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-update-factors.png`
      },
      {
        menu: '碳核算模板配置中心',
        feature: '模板行业多选',
        type: 'feature',
        date: '2026-07-14 16:30',
        text: '模板「所属行业」改为多选；新增「其他全部行业通用」枚举，匹配非人行八大高碳、非我行主要行业的默认模板。',
        route: '#/method-config/templates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/template-industry-multi.png`
      },
      {
        menu: '核算任务管理',
        feature: '新建任务筛选条件',
        type: 'field',
        date: '2026-07-14 15:00',
        text: '移除固定门槛说明文案；新增「项目月均贷款余额（元）起/止」筛选（无默认值，由用户自行填写）。',
        route: '#/candidates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/task-create-filters.png`
      },
      {
        menu: '核算任务管理',
        feature: '新建任务纳入规则',
        type: 'feature',
        date: '2026-07-14 14:30',
        text: '项目类默认全部纳入；非项目按客户维度汇总月均余额达 500 万门槛时整组纳入。',
        route: '#/candidates',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/task-create-inclusion.png`
      },
      {
        menu: '行业配置',
        feature: '行业标签筛选',
        type: 'feature',
        date: '2026-07-14 12:00',
        text: '「人行八大高碳」与「我行主要行业」标签同时勾选时，列表取并集展示。',
        route: '#/industry-config',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/industry-config-tags.png`
      },
      {
        menu: '核算任务管理',
        feature: '正式清单字段调整',
        type: 'field',
        date: '2026-07-14 10:00',
        text: '全局清单「贷款行号」拆分为「授信参考编号」「授信编号」两列。',
        route: '#/formal',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/formal-credit-columns.png`
      },
      {
        menu: '数据采集',
        feature: '核算方法独立校验',
        type: 'feature',
        date: '2026-07-14 09:30',
        text: '移除报告法页签顶部统一提示；各核算方法 Tab 独立校验必填项。',
        route: '#/data-collect',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/data-collect-method-tabs.png`
      },
      {
        menu: '数据采集',
        feature: '报告法附件校验',
        type: 'feature',
        date: '2026-07-14 09:00',
        text: '报告法「权威数据」「其他」两个页签均要求上传佐证材料。',
        route: '#/data-collect',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/data-collect-report-attach.png`
      },
      {
        menu: '数据采集',
        feature: '经济活动法字段标签',
        type: 'field',
        date: '2026-07-14 08:30',
        text: '经济活动法页签字段标签由「基数值(万元)」改为「营业收入（元）」。',
        route: '#/data-collect',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/data-collect-economy-label.png`
      },
      {
        menu: '全局',
        feature: '碳排放强度单位',
        type: 'field',
        date: '2026-07-13 18:00',
        text: '碳排放强度相关单位由「元」统一调整为「万元」。',
        route: '#/calculation',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/calculation-intensity-unit.png`
      },
      {
        menu: '核算任务管理',
        feature: '分行业碳排放强度表',
        type: 'field',
        date: '2026-07-13 17:00',
        text: '分行业碳排放强度表末列新增「质量评级」，按行业加权 DQR 展示 A/B+/B/B-/C 等次。',
        route: '#/calculation',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/calculation-quality-grade.png`
      },
      {
        menu: '台账管理',
        feature: '分行数据权限',
        type: 'feature',
        date: '2026-07-13 15:00',
        text: '分行负责人角色仅展示本分行（默认北京分行）下发数据，数据范围按角色隔离。',
        route: '#/ledger',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/ledger-branch-scope.png`
      },
      {
        menu: '企业碳账户',
        feature: '趋势分析择优规则',
        type: 'feature',
        date: '2026-07-13 14:00',
        text: '趋势分析同年多条记录时，优先取数据质量等级更高的方法；等级相同则取最新更新数据。',
        route: '#/carbon-accounts',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/carbon-trend-priority.png`
      },
      {
        menu: '企业碳账户',
        feature: '编辑权限控制',
        type: 'feature',
        date: '2026-07-13 12:00',
        text: '编辑入口仅总行绿金部可见，分行负责人只读查看。',
        route: '#/carbon-accounts',
        screenshot: `${CHANGELOG_SCREENSHOT_BASE}/carbon-accounts-edit-perm.png`
      }
    ]
  }
];

const UPDATE_TYPE_META = {
  field: { label: '字段更新', cls: 'changelog-type-field' },
  feature: { label: '功能更新', cls: 'changelog-type-feature' },
  style: { label: '样式调整', cls: 'changelog-type-style' },
  fix: { label: '问题修复', cls: 'changelog-type-fix' }
};

function renderChangelogItem(it) {
  const meta = UPDATE_TYPE_META[it.type] || UPDATE_TYPE_META.feature;
  const routeBtn = it.route
    ? `<button type="button" class="btn btn-sm btn-changelog-view" data-changelog-route="${it.route}">查看具体页面</button>`
    : '';
  const shot = it.screenshot
    ? `<div class="changelog-shot-wrap">
        <img class="changelog-shot" src="${it.screenshot}" alt="${it.menu} · ${it.feature}" loading="lazy" data-changelog-preview="1" />
        <span class="changelog-shot-hint">点击截图可放大查看</span>
      </div>`
    : '';
  return `<li class="changelog-item">
    <div class="changelog-item-top">
      <div class="changelog-item-tags">
        <span class="changelog-menu">${it.menu}</span>
        <span class="changelog-type ${meta.cls}">${meta.label}</span>
      </div>
      ${routeBtn}
    </div>
    <dl class="changelog-fields">
      <div class="changelog-field-row">
        <dt>菜单名称</dt>
        <dd>${it.menu}</dd>
      </div>
      <div class="changelog-field-row">
        <dt>功能点名称</dt>
        <dd>${it.feature}</dd>
      </div>
      <div class="changelog-field-row">
        <dt>修改内容</dt>
        <dd>${it.text}</dd>
      </div>
    </dl>
    ${shot}
  </li>`;
}

function changelogItemSortKey(item, releaseDate) {
  return String(item.date || releaseDate || '');
}

function getSortedChangelogReleases() {
  return UPDATE_CHANGELOG
    .slice()
    .sort((a, b) => changelogItemSortKey({ date: b.date }, '').localeCompare(changelogItemSortKey({ date: a.date }, '')))
    .map(rel => ({
      ...rel,
      items: rel.items
        .slice()
        .sort((a, b) => changelogItemSortKey(b, rel.date).localeCompare(changelogItemSortKey(a, rel.date)))
    }));
}

function renderUpdateChangelogHtml() {
  return getSortedChangelogReleases().map(rel => `
    <section class="changelog-release">
      <div class="changelog-release-head">
        <span class="changelog-version">${rel.version}</span>
        <time class="changelog-date">${rel.date}</time>
      </div>
      ${rel.summary ? `<p class="changelog-summary">${rel.summary}</p>` : ''}
      <ul class="changelog-items">
        ${rel.items.map(renderChangelogItem).join('')}
      </ul>
    </section>
  `).join('');
}

function bindUpdateChangelogEvents() {
  document.querySelectorAll('[data-changelog-route]').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.onclick = () => {
      const route = btn.dataset.changelogRoute;
      hideUpdateChangelogDrawer();
      if (route) location.hash = route;
    };
  });
  document.querySelectorAll('[data-changelog-preview]').forEach(img => {
    if (img.dataset.bound) return;
    img.dataset.bound = '1';
    img.onclick = () => openChangelogImagePreview(img.src, img.alt);
  });
}

function ensureChangelogImagePreview() {
  let el = document.getElementById('changelogImagePreview');
  if (el) return el;
  const root = document.getElementById('changelogDrawerRoot') || document.body;
  const wrap = document.createElement('div');
  wrap.id = 'changelogImagePreview';
  wrap.className = 'changelog-image-preview';
  wrap.innerHTML = `
    <div class="changelog-image-preview-backdrop"></div>
    <div class="changelog-image-preview-panel" role="dialog" aria-label="截图预览">
      <button type="button" class="changelog-image-preview-close" aria-label="关闭">&times;</button>
      <img class="changelog-image-preview-img" alt="" />
      <p class="changelog-image-preview-caption"></p>
    </div>`;
  root.appendChild(wrap);
  wrap.querySelector('.changelog-image-preview-backdrop').onclick = hideChangelogImagePreview;
  wrap.querySelector('.changelog-image-preview-close').onclick = hideChangelogImagePreview;
  return wrap;
}

function openChangelogImagePreview(src, caption) {
  const el = ensureChangelogImagePreview();
  el.querySelector('.changelog-image-preview-img').src = src;
  el.querySelector('.changelog-image-preview-caption').textContent = caption || '';
  el.classList.add('show');
}

function hideChangelogImagePreview() {
  document.getElementById('changelogImagePreview')?.classList.remove('show');
}

function ensureUpdateChangelogDrawer() {
  let root = document.getElementById('changelogDrawerRoot');
  if (!root) {
    root = document.createElement('div');
    root.id = 'changelogDrawerRoot';
    document.body.appendChild(root);
  }
  if (document.getElementById('updateChangelogDrawer')) return document.getElementById('updateChangelogDrawer');
  root.innerHTML = `
    <div class="drawer-overlay" id="updateChangelogDrawer">
      <div class="drawer-panel changelog-drawer-panel" role="dialog" aria-labelledby="updateChangelogTitle">
        <div class="drawer-header">
          <h4 id="updateChangelogTitle">更新说明</h4>
          <button type="button" class="drawer-close" id="closeUpdateChangelogDrawer" aria-label="关闭">&times;</button>
        </div>
        <div class="drawer-body changelog-drawer-body">
          <p class="changelog-intro">以下为近期根据需求沟通完成的页面调整。每条记录包含菜单名称、功能点名称与修改内容，配图均为当前最新页面真实截图，可点击放大或跳转查看。</p>
          <div id="updateChangelogContent">${renderUpdateChangelogHtml()}</div>
        </div>
      </div>
    </div>`;
  const overlay = document.getElementById('updateChangelogDrawer');
  document.getElementById('closeUpdateChangelogDrawer').onclick = () => hideUpdateChangelogDrawer();
  overlay.onclick = (e) => { if (e.target === overlay) hideUpdateChangelogDrawer(); };
  bindUpdateChangelogEvents();
  return overlay;
}

function openUpdateChangelogDrawer() {
  ensureUpdateChangelogDrawer();
  const content = document.getElementById('updateChangelogContent');
  if (content) content.innerHTML = renderUpdateChangelogHtml();
  bindUpdateChangelogEvents();
  document.getElementById('updateChangelogDrawer').classList.add('show');
  document.body.classList.add('drawer-open');
}

function hideUpdateChangelogDrawer() {
  hideChangelogImagePreview();
  document.getElementById('updateChangelogDrawer')?.classList.remove('show');
  document.body.classList.remove('drawer-open');
}
