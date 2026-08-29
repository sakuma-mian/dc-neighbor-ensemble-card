---
authority_schema: tavernweave/creative-authority/v1
project_id: dc-neighbor-ensemble
title: 在DC频道里口嗨的群友就住我隔壁？！
status: driver-approved-design
target_card_type: mvu_zod
target_host: SillyTavern + 酒馆助手(JS-Slash-Runner) ｜ Gemini 3.1 Pro(剧情) + Gemini 3.7 Flash(变量更新) ｜ 绘绘预设 260821稳定版max
updated: 2026-08-28
next_gate: 起源层仅剩创始人待补（群名已定「但为君故」）→ INC(plot侧)/MOD 增量与 CoT 部署设计 → R2 迷雾门卫/R3 正则/组装实现（变量层骨架已按 DEC-024 抄定 drafted）→ ACC-005 离线结构校验
---

# Creative authority

> 本文件是本项目唯一进度与决策权威（A0 L3：进度只写这一份）。
> 设计细节见 [design-contract.md](design-contract.md)；两者冲突时以本文件 Confirmed 记录为准。

## Goal and exclusions

- **Goal**：从零制作一张单卡群像 MVU Zod 角色卡《在DC频道里口嗨的群友就住我隔壁？！》——现代都市（南江市）多人沙盒，主控自捏人设开局，与 3-5 名 Discord 频道好友在现实重逢；核心体验为**重迷雾（人与人之间的信息不对等）** + 高自由度群像反应 + 主控目标选择，含创作者主线/支线引导与彩蛋；MVU 采用 JSONPatch + Zod 正路，产出可导入真实酒馆的成品卡。
- **Exclusions（本轮范围外）**：
  - 嵌入 UI（状态栏/开局页/控制中心前端）——`display_data` 留空，`status-panel/`、`control-center/`、`frontend/` 目录空置；
  - 打包发布与真实运行时验收（驱动已裁定：本轮只到离线结构校验；真实环境验收后续单独安排）；
  - 城区设定集文件的修订（驱动将单独开任务讨论）；
  - 旧测试卡 `nanjiang-mvu-test-v0.1.0.json` 的一切复用（完全重置）。

## Confirmed

- [DEC-001] 卡名《在DC频道里口嗨的群友就住我隔壁？！》；前提为 Discord 频道网友阴差阳错聚于同一现代都市（南江市），"网友就在身边"是标题明示的戏剧核。（2026-08-28，驱动）
- [DEC-002] 单卡群像载体：一张卡演所有角色，角色设定以世界书分层词条存在；拒绝 ST 群聊多卡。（2026-08-28，驱动）
- [DEC-003] 迷雾核心 = 人与人之间的信息不对等（如"A 知道 B 的学历但不知道住址"）；矩阵关系写入角色人设；保密强度为**重迷雾**（未揭示事实不得进上下文）。（2026-08-28，驱动）
- [DEC-004] Discord 面仅作叙事背景（角色关系起源层），不做消息格式约定、不做渲染层。（2026-08-28，驱动）
- [DEC-005] 登场路由由主控人设决定初遇对象：路由规则法为主（世界书/CoT 路由表读 user 人设 + 登场标记），可选保留 1-2 条备选开场作快速通道；开局为自由自捏 + 正常剧情链采集，不做向导、不伪造初始化。（2026-08-28，驱动）
- [DEC-006] 玩法形态 = 高自由度 + 群像反应；驱动将在制卡途中添加特定主线/支线任务引导（任务轴承载）。（2026-08-28，驱动）
- [DEC-007] 内容边界：允许 NSFW，无额外禁忌清单；绘绘 NSFW 模块以「标准」档起步。（2026-08-28，驱动）
- [DEC-008] MVU 方言走 JSONPatch + Zod 正路（B1 v1.0.0 定稿）；禁止 VWD `[value, desc]` 二元组；LLM 输出仅 add/replace/remove/move 四种 op。（2026-08-28，驱动）
- [DEC-009] 状态轴六容器定稿：`迷雾`（角色ID→事实ID→未揭示/已揭示/误信已纠正）、`关系`（好感度+关系阶段）、`登场`（已遇标记）、`任务`（状态+进度）、`user`（开局采集的主控身份）、`环境`（日期/时段，最小保留）。无增删。（2026-08-28，驱动）
- [DEC-010] 重迷雾门控 = 迷雾门卫脚本监听 `mag_variable_update_ended`，把迷雾/关系/任务状态**幂等同步**到世界书词条启用开关（词条开关每轮从当前聊天状态推导，新聊天/回溯自动复原）；拒绝 EJS/提示词模板门控为主方案。（2026-08-28，驱动）
- [DEC-011] 更新模式 = 独立更新模型：Gemini 3.1 Pro 跑剧情，Gemini 3.7 Flash 跑变量更新；卡按双兼容基线布局（`[mvu_plot]`/`[mvu_update]` 词条标记），单模型模式仍可用。（2026-08-28，驱动）
- [DEC-012] 主 CoT 复用绘绘「通用思维链」（互斥组），卡内不重写完整链；卡侧只做增量（INC）与条件模块（MOD），并与绘绘 防上帝视角/杀强行揭示 去重。（2026-08-28，驱动）
- [DEC-013] 绘绘预设版本锁定 `260821稳定版max`（驱动口头确认"2608211"，按此文件理解，如有误由驱动纠正）；绘绘「备忘·状态持久层」**关闭**，避免与 MVU 双状态源竞争（随六张图验收一并确认，无异议；实测剧情连续性不足可复议）。（2026-08-28，驱动）
- [DEC-014] 素材规则：角色人设由现实合伙创作者提供（须按六件套模板收集并登记溯源）；城区文件修订后入库；彩蛋随世界书创建时添加并登记来源，涉及现实创作者的梗须当事人同意。（2026-08-28，驱动）
- [DEC-015] **内容隔离红线**：re0 仓库（1798547983tt/re0）仅贡献方法论，已蒸馏为 `narrative-card-harness` 技能（`.agents/skills/narrative-card-harness/`，经验证零 Re:Zero 角色内容）；该仓库的人设、剧情总结、正传、设定及任何既有角色卡信息与本卡无关，**禁止读取、引用或混入本卡任何工件**。本地副本已删除，边界机器强制。（2026-08-28，驱动）
- [DEC-016] **角色一锁定**：藤原花奈（佐久间眠）v1.0 正式稿（`设定集/人设/藤原花奈.txt`，MAT-007）。要点：线上零外貌披露→"花奈=佐久间眠"识别困难；攻略=高难度三门（识别/面具/树洞），跳步即静默退出；身体原因写实化——先天体弱+破产惊吓→长期特效药，破产后药费成为家庭最大开销（母亲之病与此相关，推断衔接），近一年断供恶化；贴身遗物=母亲项链（潜在识别物/剧情物）；头像"雨天的风铃"（暂定）；路由裁定：南江大学降落的主控遇花奈概率最大；药源追查为任务层主线候选（合流攻略，揭开家史+断供两层迷雾）。世界书写入按驱动计划延后至角色全部定稿后统一执行。（2026-08-29，驱动）
- [DEC-017] **角色二锁定**：顾清寒（珍惜才配拥有）v1.0 正式稿（`设定集/人设/顾清寒.txt`，MAT-008）。要点：年龄裁定 18 岁（高三成年，与攻略线相容）；与花奈互为镜像（线上牛皮/线下壳/壳里真）；攻略难度"中"——识别门薄（发过语音/不露脸照）情感门硬（"不把她当小孩"）；秘密四格（保护色/霸凌左眼/本性善良/家庭缺位）+误信格（"被发现是高中生会被踢"实际群不在乎）；天气信号与花奈方向相反（压力→线上消失）；开局路由走"住处轴"（新区夜市/小卖部/网吧），与花奈"学校轴"分工。（2026-08-29，驱动）
- [DEC-018] **角色池规模与扩展机制**：核心角色 **5 人**（已锁定 2/5：花奈、清寒，剩 3 名待创作者按填表模板交稿）；后续由驱动添加边缘角色或动漫/小说同人角色，走**"新群员"通道**（叙事上后入群，不改动核心五人的既有知识矩阵结构）；同人角色须登记来源作品（素材溯源红线），卡保持私域分享、不商用不公开发布。（2026-08-29，驱动）
- [DEC-019] **角色三锁定**：鱼沉秋（cojack）v1.0 正式稿（`设定集/人设/鱼沉秋.txt`，MAT-009）。要点：26 岁社恐设计师，背了不属于她的锅被前公司开除（口径"一线时尚设计师"半真，群友信否五五开）；乌鸦耳坠=毕业设计、雄心壮志的容器（一对戴一只，另一只在盒子里等"有资格的那天"）；分级社恐（线下接近失语，摘耳机=最高礼遇）；"寻找型"（黑胶店/书店/咖啡店游荡，钟摆是通勤找梦想）；雾型=状态保密型，攻略难度中低（里程碑：摘耳机→短句→长句→游荡路线→黑胶店指唱片）；天气信号=线下型；群内位置=花奈与清寒之间的粘合位；区划裁定：住 C4 南江新区文娱商圈、游荡 C5 滨江人文带、回避 C1 科创走廊前公司段（"江南新区"系笔误）。（2026-08-29，驱动）
- [DEC-020] **角色五锁定**：诺薇拉（冯诺依曼）v1.0 正式稿（`设定集/人设/冯诺依曼.txt`，MAT-012）。要点：23 岁南江大学中文系毕业（**延毕一年**，2026 夏毕业——为兑现"与花奈同教室上过课"的时间线校准，延毕本身即"再看看"哲学的执行）；现实名"诺薇拉"；家宅裁定为**江北区生态宜居带花园洋房**（原稿江湾壹号×区委干部不合 C1 定位，改为行政区体面选择，与花奈同区不同层）；父母江南区区委系统任职；早期成员（创始人候选留起源层）；同教室双盲（公共选修重修教室×大一花奈，双向不知情，揭开引信="最摸鱼的课"对上号）；署名镜像（考据收藏过沉秋被夺署名的作品而不自知）；复读梗制造机（清寒克星）；双镜（楚羽笙：轨道逃兵×轨道拒收者，全群第二个平局）；声音之谜成对（从不开麦——全群两大未解之谜之二），真声=南江话（里程碑候选：主控听见她的南江话）；雾型=轨道型，攻略难度中高（里程碑：复读带私货→分享未发布分析→考据资料库→南江话→署名"诺薇拉"发布）。（2026-08-29，驱动）
- [DEC-021] **角色四锁定**：楚羽笙（楚楚的笙_unofficial）v1.0 正式稿（`设定集/人设/楚羽笙.txt`，MAT-010）。四项提案转正：软肋注脚（_unofficial=官方版本没人盖章）、终局里程碑（换网名去掉 _unofficial 后缀）、亲密里程碑（通话不挂——房间里有人的声音）、江南商圈"双马尾有钱妹妹"。要点不变：东大金融剧本逃兵、情感真伪型雾、快开慢熟（入门最易毕业最深）、东京擦肩沉秋、线下盲（可能与任何群友擦肩而不自知）。（2026-08-29，驱动）
- [DEC-022] **第二步执行（交叉回填+关系图+角色层落盘）**：① 五人知识矩阵交叉回填——花奈补 4 格、清寒补 3 格、沉秋补 2 格、楚羽笙（随 v1.0）补冯诺依曼格，诺薇拉档原生齐装；② 群像关系图升级 v1.0（五人 10 对关系+剧情引信 TOP8，`设定集/人设/群像关系图.md`）；③ **角色层世界书落盘**：`lorebooks/起源层/G0` + `lorebooks/角色层/P1-P5`（主词条×5+秘密词条×22，一事实一条目）+ `lorebooks/角色层/README`（词条总表、R2 门控契约、迷雾事实注册表、预算自检）；order 段位扩至 161-190（城市层 191-200 不变）。状态 drafted，待驱动复核+ACC-005。（2026-08-29，agent 执行/驱动授权）
- [DEC-023] **起源层信息补全**：群名定为**「但为君故」**（出自《短歌行》"但为君故，沉吟至今"）；世界观新增——该 DC 服务器**人数众多、活跃成员不稳定**，五人+主控为当前活跃核心圈（DEC-018 新群员通道的世界观依据，保留节目=核心圈沉淀物）；入群时间表推算采纳：冯诺依曼 2022（早期成员/创始人候选）、顾清寒 2023、cojack 2024、楚楚的笙 2024（东京期）、佐久间眠 2026 上半年、主控 2026 秋（最新）。创始人**后续添加**——起源层唯一剩余待定项。（2026-08-29，驱动）

- [DEC-024] **变量层骨架抄定（MVU · re0 变量系统）**：按驱动指令直接采用 re0 仓库 `变量/` 骨架（2026-08-29 快照）——`世界书/变量列表.txt` 与 `脚本/酒馆助手脚本-MVU.json`（框架加载器，import NLKASHEI/MVU-offline@v1.0.1，testingcf 镜像）**原样照抄**；`[initvar] 初始`、`[mvu_update]变量更新规则`、`[mvu_update]变量输出格式`、`脚本/酒馆助手脚本-ZOD.json` 四件按本卡六容器（DEC-009）重写，schema 版本 `dc-neighbor-state-v1`。re0 与本卡同为 JSONPatch+Zod 方言（限 add/replace/remove/move 四 op），与 DEC-008 同源无冲突；DEC-015 隔离红线在变量层豁免——仅取机制文本，re0 专属容器（轮回/菜月昴/战斗/资产）全部弃用，零 Re:Zero 内容混入。落盘 `变量/`（世界书×4 + 脚本×2 + README），离线校验 19/19 通过，状态 drafted 待复核。工件图偏差（替代契约⑤对应项）：InitialVariables.json→[initvar] 世界书路线；zod_schema.js 维护源→暂由 ZOD 脚本直接承担；update-rules/→[mvu_update] 两件（ENT-040）。关键语义：迷雾=知情者→事实ID→状态，本人对自身事实不入表（每行排除自身前缀格）；好感度 -100~100 默认 50（开局校准 40~60）；稳定键=主控/五人规范短名，网名变化不改键。遗留待裁决：角色层 README"22 格"注释与表格 21 行不符（initvar 暂按 21 格=105 迷雾单元落盘）；R2 取数口径（推荐任一知情者翻转即启用秘密词条，或仅主控行）；变量层 position/order 待组装门核定。（2026-08-29，驱动指令/agent 执行）

- [DEC-025] **变量层三项裁决**：① 迷雾格数确认为 **21 格**（花奈 5 + 清寒/沉秋/楚羽笙/诺薇拉各 4）——DEC-022/ENT-011/角色层 README 所记"22"系统计笔误，ENT-011 标题与角色层 README 注释已勘误，initvar 按 21 格=105 迷雾单元维持不变；② R2 取数口径定为**任一知情者翻转即启用**——任一知情者格（知情者≠事实本人）变为已揭示/误信已纠正即把对应秘密词条 disable=false，不采用"仅主控行"；③ 关系好感度基准确认为 **50**（开局校准区间 40~60，initvar/ZOD schema 已一致）。变量/README.md §3 已转 confirmed 口径。（2026-08-29，驱动）

## Proposed

- [DEC-101] 实现阶段工程布局：六容器 schema 定稿于 `schema/zod_schema.js`；初始变量 `states/InitialVariables.json`；更新规则文本 `update-rules/`；世界书源 `lorebooks/`；脚本 `scripts/`（R1 装载、R2 门卫）；正则与卡源 JSON 组装与校验走 `$sillytavern-card-components` / `$sillytavern-card-pipeline`。待实现开工时随第一批文件提案确认。

## Confirmed（场所层·南江大学，2026-08-29 驱动确认）

- [DEC-106] 场所层·南江大学词条架构：ENT-004 总览 + ENT-004A..004E 共 6 条（世界树与主校区/校园生活/学院与学术模块/校地关系/学生文化），源文件在 `lorebooks/场所层-南江大学/`；**无 constant 词条**（大学是"进入才存在"的舞台，全部关键词激活）；全部标 `[mvu_plot]`；U0 设"阻断后续递归"、U1-U5 设"不可被递归激活"（与城市层同构）；position=0、order 段位 181-190（全局约定：城市层 191-200 > 场所层 181-190 > 角色层建议 171-180）；**场所层正文与 key 一律禁止出现角色名**（迷雾纪律）。（驱动确认 2026-08-29）
- [DEC-107] 南江大学草案与城市层三处冲突的裁定：**方案乙（承继调和）**——南大=2000年以"南江大学（原）"为主体重组新设、品牌承继原校百年校史；原南江大学校园=江北老校区（民国风，MAT-002 成立）；新区新校区=2015年后扩张产物（C4 成立），"七个学院"=新校区先行入驻的理工医应用学科组团（CLM-063/064）。**修订已执行**：草案微调 4 处（§2.2 历史包袱句、§5.1 建筑限定、§8.1 学生画像措辞、§十 总结句）+ 新增 §4.5"校区格局"（一校三区）；MAT-011 contentHash 重算（bef5ce91…）；U0/U3/U5 词条同步定稿化。裁定后完成**全设定交叉审查**（城建×大学×四份人设×群像关系图，逐项记录见 material-provenance.md"全设定交叉审查"节）：零阻塞冲突，场所层与草案一并 **v1.0 定档**。（驱动确认 2026-08-29）

## Confirmed（城市层，2026-08-28 驱动确认）

- [DEC-102] 城市层词条架构：ENT-003 拆为 5 子词条——ENT-003A 江南区 / 003B 江北区 / 003C 月石区 / 003D 南江新区 / 003E 滨江人文带，加 ENT-002 总纲共 6 条，源文件在 `lorebooks/城市层/`；C0 总纲为唯一常驻（constant），城区词条全部关键词激活（绿灯）；全部标 `[mvu_plot]`；C0 设"阻断后续递归"、城区词条设"不可被递归激活"；position=0、order 段位 191-200（方向语义实现时经 Prompt Manager 预览核对）。设计稿：[lorebooks/城市层/README.md](lorebooks/城市层/README.md)。（驱动确认 2026-08-28）
- [DEC-103] MAT-005 文件名笔误判定：`江南市市中心江南区.txt` 系命名笔误，内容属南江系列且首句自证；词条定名"南江市·市中心江南区"。MAT-005"未澄清不得入卡"限制解除。（驱动确认 2026-08-28）
- [DEC-104] 城市层源冲突解读：① 奥体中心取两源相容表述"江北区东端、毗邻新区交界"；② 总纲"东翼临港智造城"与月石区按同一板块对应（推断桥，medium）；③ 当代全市总人口不虚构，仅保留"2010年突破2200万"历史坐标；④ "一核三翼"口号不直接入词条（改写为地理描述）。（驱动确认 2026-08-28）
- [DEC-105] 城区取舍基线：砍宏观经济数据、产业与机构名录、政策史细节、国际竞合；保留生活质感、感官调性、场景锚点与角色可绑定的生活切片。全部取舍经 CLM-001..039 登记于 [material-provenance.md](material-provenance.md)。（驱动确认 2026-08-28）

## Open decisions

- [DEC-201] 角色池名单——**5/5 全部齐备并锁定**：花奈（DEC-016）、清寒（DEC-017）、沉秋（DEC-019）、诺薇拉（DEC-020）、楚羽笙（DEC-021）。角色层世界书已按 DEC-022 落盘（drafted：起源层 G0 + 角色层 P1-P5 + 迷雾事实注册表 22 格）。下一步：起源层三问（群名/创始人/入群时间表）→ 起源层转 confirmed → INC/MOD 增量与 CoT 部署设计 → schema/InitialVariables/R1/R2 实现 → ACC-005 离线校验。
- [DEC-202] 城区设定集（5 文件）的修订与取舍——驱动将单独开任务讨论（届时按 MAT→CLM→ENT 溯源链录入）。
- [DEC-203] 主线/支线任务清单与触发条件——制卡途中由驱动撰写。
- [DEC-204] 彩蛋具体内容与触发方式——随世界书创建时收集（含当事人同意记录）。
- [DEC-205] 备选开场（是否保留 1-2 条快速通道开场）及其分支初始化——角色池定稿后与开局策略一并定。

## Rejected

- [DEC-901] 旧测试卡 `D:\酒馆\nanjiang-mvu-test-v0.1.0.json` 作为素材或基础（仅验证过运行，与本次设计无任何关联；完全重置）。
- [DEC-902] ST 群聊多卡载体（信息差难以跨卡协同；见 DEC-002）。
- [DEC-903] VWD `[value, desc]` 二元组格式（B1 已定稿废弃）。
- [DEC-904] EJS/提示词模板词条门控作为重迷雾主方案（依赖预设开启模板，换预设即失效；脚本门控不依赖预设）。
- [DEC-905] 预设备忘·状态持久层常开（与 MVU 状态双写竞争；可复议，见 DEC-013）。

## Material index

```twa-materials
{
  "schemaVersion": 1,
  "materials": [
    {
      "id": "MAT-001",
      "title": "南江市设定（总纲）",
      "sourceType": "user-file",
      "locator": "设定集/南江市城市/南江市设定.txt",
      "contentHash": "sha256:2392d47ba11a75b12ad576ec6285f44066383bd4cf123e7bc8cd15e448776f1d",
      "license": "private-user-material",
      "privacy": "project-private",
      "authority": "reference",
      "notes": "城市总设定，2 行长文；修订任务（DEC-202）后才能作为城区词条的确认素材"
    },
    {
      "id": "MAT-002",
      "title": "南江市·南江新区",
      "sourceType": "user-file",
      "locator": "设定集/南江市城市/南江市南江新区.txt",
      "contentHash": "sha256:ece7d179aed7239818995196d9784e8c820912143e02278a1e54adb7f88e249f",
      "license": "private-user-material",
      "privacy": "project-private",
      "authority": "reference",
      "notes": "城区文件，待修订（DEC-202）"
    },
    {
      "id": "MAT-003",
      "title": "南江市·市中心江北区",
      "sourceType": "user-file",
      "locator": "设定集/南江市城市/南江市市中心江北区.txt",
      "contentHash": "sha256:c7184a2a2f53f564eecfb3d04e06bcc2fa7baf4306efca42b06802bfc7180c0b",
      "license": "private-user-material",
      "privacy": "project-private",
      "authority": "reference",
      "notes": "城区文件，待修订（DEC-202）"
    },
    {
      "id": "MAT-004",
      "title": "南江市·月石区",
      "sourceType": "user-file",
      "locator": "设定集/南江市城市/南江市月石区.txt",
      "contentHash": "sha256:97fc9bfbc5fc59ba2c58dfae98362376b8a6c3f2252e57881776619f7961f0cb",
      "license": "private-user-material",
      "privacy": "project-private",
      "authority": "reference",
      "notes": "城区文件，待修订（DEC-202）"
    },
    {
      "id": "MAT-005",
      "title": "江南市·市中心江南区",
      "sourceType": "user-file",
      "locator": "设定集/南江市城市/江南市市中心江南区.txt",
      "contentHash": "sha256:a28f3a7f8d02622ec644a00a3ced84ca732af264f43f4508e261eda2097817f8",
      "license": "private-user-material",
      "privacy": "project-private",
      "authority": "reference",
      "notes": "文件名为江南市、内容属南江系列——命名笔误已判定（DEC-103，驱动确认 2026-08-28），可正常入卡"
    },
    {
      "id": "MAT-006",
      "title": "绘绘预设 260821稳定版max（运行环境证据）",
      "sourceType": "user-file",
      "locator": "D:/酒馆/绘绘绘绘绘~260821稳定版max.json（环境证据，非卡内容素材）",
      "contentHash": "unrecorded",
      "license": "third-party-preset",
      "privacy": "environment-reference",
      "authority": "reference",
      "notes": "187 条提示词；含通用思维链/卡思维链槽/erii_* 输出标签约定/NSFW 模块/防上帝视角与杀强行揭示；不含 MVU 机制；无 EJS 标记。仅作 CoT 去重与预算证据，不复制其文本入卡"
    },
    {
      "id": "MAT-007",
      "title": "角色一·正式稿（藤原花奈/佐久间眠，v1.0）",
      "sourceType": "user-file",
      "locator": "设定集/人设/藤原花奈.txt",
      "contentHash": "unrecorded",
      "license": "private-user-material",
      "privacy": "project-private",
      "authority": "confirmed-character",
      "notes": "首个角色，2026-08-29 驱动锁定 v1.0（详见 DEC-016）。角色层世界书词条与迷雾事实 ID 注册表的维护源；后续角色知识矩阵交叉回填对象"
    },
    {
      "id": "MAT-008",
      "title": "角色二·正式稿（顾清寒/珍惜才配拥有，v1.0）",
      "sourceType": "user-file",
      "locator": "设定集/人设/顾清寒.txt",
      "contentHash": "unrecorded",
      "license": "private-user-material",
      "privacy": "project-private",
      "authority": "confirmed-character",
      "notes": "第二个角色，2026-08-29 驱动锁定 v1.0（详见 DEC-017）。与花奈档互为镜像设计；角色层世界书词条与迷雾事实 ID 注册表的维护源"
    },
    {
      "id": "MAT-009",
      "title": "角色三·正式稿（鱼沉秋/cojack，v1.0）",
      "sourceType": "user-file",
      "locator": "设定集/人设/鱼沉秋.txt",
      "contentHash": "unrecorded",
      "license": "private-user-material",
      "privacy": "project-private",
      "authority": "confirmed-character",
      "notes": "第三个角色，2026-08-29 驱动锁定 v1.0（详见 DEC-019）。状态保密型雾；角色层世界书词条与迷雾事实 ID 注册表的维护源"
    },
    {
      "id": "MAT-010",
      "title": "角色四·正式稿（楚羽笙/楚楚的笙_unofficial，v1.0）",
      "sourceType": "user-file",
      "locator": "设定集/人设/楚羽笙.txt",
      "contentHash": "unrecorded",
      "license": "private-user-material",
      "privacy": "project-private",
      "authority": "confirmed-character",
      "notes": "第四个角色，2026-08-29 驱动锁定 v1.0（详见 DEC-021），四项提案全部转正。情感真伪型雾，快开慢熟"
    },
    {
      "id": "MAT-011",
      "title": "南江大学总览文档（v1.0 定档）",
      "sourceType": "user-file",
      "locator": "设定集/南江市城市/南江大学设定集/南江大学总览文档.txt",
      "contentHash": "sha256:bef5ce9191488e79976f36d45999280cd004582d99cae1ddab4d6ec45065f154",
      "license": "private-user-material",
      "privacy": "project-private",
      "authority": "reference",
      "notes": "场所层世界书主基准。2026-08-29 按方案乙（DEC-107 驱动确认）完成修订定档：4 处微调 + 新增 §4.5 校区格局（一校三区）；hash 为修订后指纹（原始草案指纹 50bd4602… 留档于会话记录）。全设定交叉审查零阻塞冲突后与场所层词条一并 v1.0"
    },
    {
      "id": "MAT-012",
      "title": "角色五·正式稿（诺薇拉/冯诺依曼，v1.0）",
      "sourceType": "user-file",
      "locator": "设定集/人设/冯诺依曼.txt",
      "contentHash": "unrecorded",
      "license": "private-user-material",
      "privacy": "project-private",
      "authority": "confirmed-character",
      "notes": "第五个角色（收尾位），2026-08-29 驱动锁定 v1.0（详见 DEC-020）。轨道型雾；与花奈为同教室双盲学姐学妹（延毕一年裁定）；院系/校区细节以 MAT-011 为准"
    }
  ]
}
```

> 待登记素材：创作者人设（六件套，到位即登记 MAT-007+，来源标注创作者身份）；彩蛋素材（含同意记录）。
> 收集模板已发布：[人设收集模板.md](人设收集模板.md)（面向合伙创作者的可转发版，2026-08-28），交回稿件按 MAT-007+ 登记。
> 填表版模板：[设定集/人设/角色填表模板.txt](设定集/人设/角色填表模板.txt)（2026-08-29，按花奈档结构定制的直接填写版，内含已有角色名单区供知识矩阵交叉回填）。

## Entry and component map

```twa-entries
{
  "schemaVersion": 1,
  "entries": [
    { "id": "ENT-001", "kind": "worldbook", "title": "起源层·Discord群像「但为君故」（G0；创始人待后续添加）", "claimIds": [], "status": "drafted", "recipient": "plot-model", "sourcePath": "lorebooks/起源层/G0-Discord群像起源.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-002", "kind": "worldbook", "title": "城市层·南江市总纲（C0，常驻）", "claimIds": [], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/城市层/C0-南江市总纲.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-003A", "kind": "worldbook", "title": "城市层·城区·市中心江南区（C1）", "claimIds": [], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/城市层/C1-市中心江南区.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-003B", "kind": "worldbook", "title": "城市层·城区·市中心江北区（C2）", "claimIds": [], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/城市层/C2-市中心江北区.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-003C", "kind": "worldbook", "title": "城市层·城区·月石区（C3）", "claimIds": [], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/城市层/C3-月石区.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-003D", "kind": "worldbook", "title": "城市层·城区·南江新区（C4）", "claimIds": [], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/城市层/C4-南江新区.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-003E", "kind": "worldbook", "title": "城市层·地点·滨江人文带（C5）", "claimIds": [], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/城市层/C5-滨江人文带.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-004", "kind": "worldbook", "title": "场所层·南江大学·总览（U0）", "claimIds": ["CLM-063"], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/场所层-南江大学/U0-南江大学总览.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-004A", "kind": "worldbook", "title": "场所层·南江大学·世界树与主校区（U1）", "claimIds": [], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/场所层-南江大学/U1-世界树与主校区.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-004B", "kind": "worldbook", "title": "场所层·南江大学·校园生活（U2）", "claimIds": [], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/场所层-南江大学/U2-校园生活.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-004C", "kind": "worldbook", "title": "场所层·南江大学·学院与学术模块（U3）", "claimIds": ["CLM-064"], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/场所层-南江大学/U3-学院与学术模块.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-004D", "kind": "worldbook", "title": "场所层·南江大学·校地关系（U4）", "claimIds": [], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/场所层-南江大学/U4-校地关系.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-004E", "kind": "worldbook", "title": "场所层·南江大学·学生文化（U5）", "claimIds": [], "status": "confirmed", "recipient": "plot-model", "sourcePath": "lorebooks/场所层-南江大学/U5-学生文化.md", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-010", "kind": "worldbook", "title": "角色层·角色主词条×5（P1花奈/P2清寒/P3沉秋/P4楚羽笙/P5诺薇拉）", "claimIds": [], "status": "drafted", "recipient": "plot-model", "sourcePath": "lorebooks/角色层/", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-011", "kind": "worldbook", "title": "角色层·秘密子词条×21（迷雾门控：R2按事实ID切换disable，任一知情者翻转即启用·DEC-025，注册表见角色层README）", "claimIds": [], "status": "drafted", "recipient": "plot-model", "sourcePath": "lorebooks/角色层/", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-020", "kind": "worldbook", "title": "任务层·主线/支线钩子词条（条件注入）", "claimIds": [], "status": "planned", "recipient": "plot-model", "sourcePath": "lorebooks/", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-030", "kind": "worldbook", "title": "彩蛋层·低频隐藏词条（来源登记+当事人同意）", "claimIds": [], "status": "planned", "recipient": "plot-model", "sourcePath": "lorebooks/", "acceptanceIds": ["ACC-005"] },
    { "id": "ENT-040", "kind": "worldbook", "title": "变量层·[mvu_update]变量更新规则/变量输出格式/变量列表 + [initvar]初始（DEC-024；另含 ZOD schema 脚本）", "claimIds": [], "status": "drafted", "recipient": "update-model", "sourcePath": "变量/", "acceptanceIds": ["ACC-005"] }
  ]
}
```

> 组件（R1 MVU 装载脚本、R2 迷雾门卫脚本、R3 正则、zod_schema.js）契约见 [design-contract.md](design-contract.md) ④；实现时在 `$sillytavern-card-components` 登记组件记录。

## Runtime dependency ledger

- **Embedded（已随卡封装，无需另行安装）**：`zod_schema.js`（卡专用 schema）、R1 MVU 装载脚本、R2 迷雾门卫脚本、InitialVariables、卡世界书、隐藏 `<UpdateVariable>` 正则。
- **Host-required（需要在宿主中安装或启用）**：SillyTavern；酒馆助手 JS-Slash-Runner（脚本执行、全局 `z` 注入、世界书 API、MVU 生命周期事件）。
- **Remote runtime（运行时从远程地址加载）**：MagVarUpdate `bundle.js`（jsDelivr，主/testingcf 备镜像）；StageDog `mvu_zod.js`；zod v4 core（由 mvu_zod.js 加载）。卡内绝不自带 CDN zod 实例（三实例地雷）。
- **Regional alternative（区域双装）**：`mvu_zod_cn.js`（国区优先）/ `mvu_zod_global.js`（全球备用），二者同内容不同镜像序，随卡双封装、按网络择路。
- **Optional**：无（嵌入 UI 整体排除）。
- **Development-only（仅开发环境需要）**：Node + 仓库校验脚本（结构校验、authority 校验）；不进玩家安装须知。

## Acceptance ledger

```twa-acceptance
{
  "schemaVersion": 1,
  "items": [
    {
      "id": "ACC-001",
      "object": "需求访谈与开工三格（目标/红线/验收）+ 复述纠偏",
      "gate": "driver",
      "evidence": "会话 2026-08-28：目标（先设计稿）、红线（未确认不落盘/不覆盖、不伪造初始化、素材溯源与内容边界）、验收（本轮只到离线校验）逐项确认",
      "status": "driver-accepted",
      "date": "2026-08-28",
      "actor": "driver"
    },
    {
      "id": "ACC-002",
      "object": "概念与思路版图（六大分叉：迷雾核心/单卡群像/Discord叙事层/自由度+任务/登场路由/重迷雾）",
      "gate": "driver",
      "evidence": "会话 2026-08-28 六问逐条答复",
      "status": "driver-accepted",
      "date": "2026-08-28",
      "actor": "driver"
    },
    {
      "id": "ACC-003",
      "object": "MVU 重开：方言（JSONPatch+Zod）、状态轴六容器、门控机制（脚本幂等同步）、双模型路由",
      "gate": "driver",
      "evidence": "会话 2026-08-28 四项确认（同意/无增删/同意/Gemini 3.1 Pro + 3.7 Flash）",
      "status": "driver-accepted",
      "date": "2026-08-28",
      "actor": "driver"
    },
    {
      "id": "ACC-004",
      "object": "设计契约六张图（内容/CoT/状态/运行时/工件/依赖）+ 卡名/绘绘版本/双模型定稿",
      "gate": "driver",
      "evidence": "会话 2026-08-28：驱动给出卡名、确认通用思维链为主链、版本 260821、双模型；无异议项（备忘层关闭、占位名→正式名）一并确认",
      "status": "driver-accepted",
      "date": "2026-08-28",
      "actor": "driver"
    },
    {
      "id": "ACC-005",
      "object": "实现阶段产物（schema/脚本/世界书/卡源）的结构校验与字段台账",
      "gate": "automation",
      "evidence": "未开始——等待角色池与城区修订（DEC-201/202）",
      "status": "pending",
      "date": "",
      "actor": "automation"
    },
    {
      "id": "ACC-006",
      "object": "真实 SillyTavern 运行时验收（开局初始化→变量更新→门控生效→无报错）",
      "gate": "driver",
      "evidence": "驱动裁定后续单独安排（本轮只到离线校验）",
      "status": "deferred",
      "date": "2026-08-28",
      "actor": "driver"
    }
  ]
}
```

## Next gate

**实现阶段开工门**：角色人设六件套到位（DEC-201）后——① 按六件套填字段台账（迷雾事实 ID 注册表、关系轴实例、登场/任务实例）；② 产出 `zod_schema.js` + InitialVariables + R1/R2 脚本 + 世界书首批词条；③ 跑离线结构校验（ACC-005）。城区修订（DEC-202）可并行单开。真实运行时验收（ACC-006）按驱动节奏另约。在此之前不写实现代码、不打包。
