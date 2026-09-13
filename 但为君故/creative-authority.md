---
authority_schema: tavernweave/creative-authority/v1
project_id: danweijungu-nanjiang-awakened
title: 但为君故 · 沉吟至今（南江市异能群像 · 圆心卡）
status: candidate
target_card_type: mvu_zod
target_host: unresolved
updated: 2026-09-13
next_gate: 实机验证（需主人安装 SillyTavern）——导入 output/但为君故·沉吟至今 v0.1.png，验证三件事：能否导入、卡内脚本是否加载、变量写入是否生效
---

# 创作权威 · 《但为君故》世界观 · 卡《但为君故 · 沉吟至今》

> 本文件是本项目的**决策权威**。实现文件（设计契约、schema、世界书、脚本）与本文冲突时，**停下来记录冲突并询问**，不要自行改写本文。
>
> 编号说明：访谈阶段曾以 `DEC-N1`～`DEC-N11` 临时引用，本文改用正式编号 `DEC-###`，含义一一对应。
>
> 状态纪律：只有主人（driver）能设定 `driver-approved-design` 与 `driver-accepted`。自动化流程最多报告证据、提出升级建议，**不得代主人推进状态**。
>
> **维护纪律（2026-09-13 立，出自三次真实事故）**：编辑决策记录列表时，`old_string` **必须完整包含整行**，`new_string` **必须从该整行开头写起**（追加式编辑）。同日曾三次拿“记录行的行首片段”当 `old_string`，先后把 `DEC-056`、`DEC-053`、`DEC-058` 的记录截断或吞掉——**三次都是校验脚本发现的，不是人眼发现的**。
>
> 因此：**任何对 `Confirmed` / `Proposed` / `Open decisions` / `Rejected` 四个区块的编辑之后，必须重跑一次「DEC 编号唯一性 + 无悬空引用 + 无黏连记录」检查**，才允许声称该次修改完成。
>
> **补充纪律（2026-09-13 第二次事故后加）**：编辑 `twa-*` JSON 区块时，**该块最后一条记录没有结尾逗号**，而中间各条都有——用带逗号的片段去匹配末行必然失败（已两次踩中：`ENT-C04`、`ENT-R2`）。改 JSON 区块前后**都要用脚本重新解析一次**，确认块仍是合法 JSON；匹配失败时先 `grep` 确认原文，不要凭记忆重试。

## Goal and exclusions

**目标**：从零制作一张《但为君故》世界观下的 **MVU + Zod 角色卡**——现代都市南江市、隐秘异能社会、五人群像、玩家自捏觉醒者。本卡是《但为君故》世界观的**圆心卡**，须为后续同伴卡留下可复用的世界观地基。

**排除（本卡不做）**：

- 不做战争迷雾／知识矩阵／信息差玩法（该玩法已被主人明确废弃）；
- 不复用旧工程（`design-contract.md`、`creative-authority.md`、`lorebooks/`、`变量/`、`组装/`）作为方案依据；
- 不在本机未安装酒馆的情况下宣称任何实机可用性；
- 不打包、不发布、不覆盖任何既有文件。

## Confirmed

- [DEC-001] 卡型为 `mvu_zod`（MVU + Zod 校验）；卡本体是**世界观/GM 人格**，不是单一角色；玩家自由选角色。
- [DEC-002] 玩家开局**完全自由**：以开局问卷自捏身份、来历与异能倾向，不预设主角。
- [DEC-003] 世界观：**南江市**（现代东方都会，一核三翼）＋**隐秘异能社会**；普通人不知情，有组织维持面纱。
- [DEC-004] 玩法核心转向**异能 + 大世界沙盒**；战争迷雾／知识矩阵／信息差玩法整体废弃。
- [DEC-005] 角色沿用五人——**藤原花奈、顾清寒、鱼沉秋、楚羽笙、诺薇拉**——的**人设、背景故事、外貌、性格**。
- [DEC-006] **五人均为觉醒者**；其线上社群改造成**异能主题圈子**（网名与网聊习惯保留）。
- [DEC-007] 异能规则：**觉醒型 + 代价**——能力映照本人的执念，使用必付反噬。
- [DEC-008] 状态策略：**混合式**——只记录会影响后续的字段，细节留给叙事。
- [DEC-009] 组织格局：**一个核心官方组织 + 诸多边缘组织**；具体设定另立话题细谈。
- [DEC-010] 第一版范围冻结为 **B 标准版**：南江市全域世界书 + 五名角色完整 + 12～18 项状态 + 异能体系 + 开局问卷 + 极简状态栏。
- [DEC-011] 内容边界：**成人向，NSFW 仅限成年角色**（五人均已成年）。
- [DEC-012] 剧情 CoT 由团队在卡成型后适配；当前先搭配《绘绘260821稳定版max·但为君故适配版》预设，卡内只做**最小必要增量**。
- [DEC-013] 旧工程文件不作为方案依据；素材**只取** `设定集/`。
- [DEC-014] 本卡为《但为君故》世界观的**圆心卡**，后续有同世界观同伴卡；**跨卡共享设定归入世界观层**，不得写死在单卡私有层。
- [DEC-015] 落盘边界：设计阶段只写设计契约与决策记录，不改动任何既有文件。
- [DEC-020] **五人异能定案**（原为提案，2026-09-13 主人确认“全部接受，按提案定下”）：
  - 藤原花奈 **「留白」**——让他人对她的记忆变模糊；代价：自己的一段记忆被抹淡。
  - 顾清寒 **「威压」**——压制他人的敌意与勇气；代价：左眼旧伤剧痛并短暂失明，诱发创伤记忆。
  - 鱼沉秋 **「缝」**——缝合或剪断两人之间的情绪联结；代价：自己对某人的感觉随之变淡。
  - 楚羽笙 **「回声」**——声音被“在意她的人”听见；代价：若无人回应则当场失声。
  - 诺薇拉 **「解析」**——看出人、事、物的不合理之处；代价：越解析越看得见自己的不合理，自我怀疑反噬。
  - 详细边界与“做不到什么”见设计契约 ①-B。
- [DEC-030] **卡名定为《但为君故 · 沉吟至今》**（原为开放决策，2026-09-13 主人拍板；同时关闭“五人异能逐项确认”这一确认动作）。世界观名《但为君故》独立保留，不并入卡名。
- [DEC-032] **组织格局选定「方案 B・共生型」**：一个**半官方基金会**（负责登记、善后、调解、收容）＋**诸多边缘组织**（未登记者/候鸟/深夜频道/白房子，另有旧约教团传闻）。基调是**制度、利益与默契**，而非恐怖统治。2026-09-13 主人选定。**注**：其中“旧约教团”一名已于同日废弃，该残余分支现称**「拾遗教团」**（见 DEC-053 与 `W4-组织格局.md`）。
- [DEC-044] **世界观层文件已建立**（`worldview/`）：`README.md`（投递总策略）、`W1-面纱规则.md`、`W2-异能体系.md`、`W3-南江市.md`、`W4-组织格局.md`。状态为**草案**，其中组织名称（江海基金会）仅为提案。
- [DEC-045] **世界观层定稿**：2026-09-13 主人确认 `worldview/` 五份按提案定下（面纱纪律、异能代价、江海基金会、第九条、五人登记状态）。
- [DEC-046] **核心组织定名「江海基金会」**：表层为城市公益与城建档案基金会，实际为异常事务管理机构。
- [DEC-047] **法源与倒计时设定**：1999 年特批批文共十二条，**第九条从未公开**，面纱的执法/善后/登记权挂于其下；**2029 年 IMF 复审**将重审全部批文，构成面纱危机的长线倒计时。
- [DEC-048] **五人登记状态定案**：藤原花奈**在册但档案残缺**（登记流程因她的能力无法闭环，纸面记录仍在）／顾清寒**在册但抗拒**／鱼沉秋**在册且配合**／楚羽笙**未登记**／诺薇拉**在册做档案整理**；五人以「深夜频道」为线上交集。（2026-09-13 依对抗审查修正花奈项：原写“档案近乎空白”，与「不能抹除文字与影像记录」的能力边界冲突）
- [DEC-049] **场所层草案完成**（`worldview/W5-场所层.md`）：六条条目 `ENT-L01` 江北区、`ENT-L02` 南江新区、`ENT-L03` 月石区、`ENT-L04` 江南区、`ENT-L05` 南江大学、`ENT-L06` 深港；每区含“日常面貌（素材原有）＋隐秘面（本卡新增）”。
- [DEC-051] **南江大学源流设定**（2026-09-13 主人给定）：其前身为地下密教组织所设的**神学院**，按该传承计算确为百年老校；现代南江大学于 2000 年元旦落地，并**继承了旧神学院的大批典籍**——这批典藏**为异能者的组织化提供了强大帮助**（是登记制、分类与善后技术的知识来源）。
- [DEC-037] **数值档位已定**（2026-09-13 主人按提案值拍板，取向为“中等偏紧”）：代价——初醒 +8～+15／掌控 +3～+8／过载一次 +25～+40，休息一日 −5；暴露度——公开使用 +10～+25／被动暴露 +3～+8／长期无事件每三日 −2；好感——单次 ±3～±10，重大事件至 ±15。档位效果与禁止事项见 `ENT-V02`。
- [DEC-052] **素材冲突全部裁决并执行**（2026-09-13）：奥体中心归江北东端（紧邻新区交界）；市图书馆新馆归江北；南江大学文科与本部在江北、新区为分校区；**校史冲突按 DEC-051 解决**；滨江科创走廊归江南区；月石方位按临海工业区处理；新区人口数保留为设定值；“江北新区”按笔误处理；诺薇拉住处取江北花园洋房。裁决表见 `worldview/W5-场所层.md`。
- [DEC-053] **源流层建立**：`worldview/W6-源流与典籍.md`，条目 `ENT-H01`（源流）与 `ENT-H02`（典籍）。密教组织定名提案「**拾遗会**」、其知识机构称「**拾遗神学院**」；`W4` 中该组织的残余分支称「**拾遗教团**」，**非骗局、持有散卷**（“旧约教团”一名同日废弃）。
- [DEC-054] **变量层草案完成**：Zod schema（`schema/zod_schema.js`）、初始变量（`states/InitialVariables.json`）、三条变量层条目（`ENT-V02` 更新规则／`ENT-V03` 输出格式／`ENT-V04` 变量列表）。
- [DEC-055] **中文键名可用**：`ST-B1` §2.3 明确“中文键名直接使用，不需转义”（来源为运行时源码＋生产卡实战），故 schema 与路径全部采用中文键名，此前设计契约中“键名语言待核对”一项据此关闭。**实机仍需验证。**
- [DEC-056] **代价与暴露度数值档位提案**（代价单次幅度、暴露度幅度、好感幅度）已写入 `ENT-V02`，标注为提案值。（同日已由 DEC-037 拍板，正式生效。）
- [DEC-057] **卡层身份字段草案完成**：`cards/chenyin-zhijin/card/card-fields.md`（`ENT-C05`）。卡本体按 DEC-001 写作**世界观/GM 人格**；开局采用问卷自捏（`ENT-C04` 路由表），且**不在开场白伪造初始化块**（DEC-043）。`description` 已并入面纱纪律、群像调度、觉醒代价三条最小必要增量（`ENT-C01`～`ENT-C03` 记为 partial，完整条目待预设确认后补写）。
- [DEC-059] **脚本层草案完成**（2026-09-13）：`scripts/R1-mvu-loader.js`（`ENT-R1`，只加载 MVU 主程序并注入默认设置，**不加载 mvu_zod** 以避免跨 zod 实例）、`scripts/R2-render-regex.md`（`ENT-R2`，两条渲染层正则隐藏 `<UpdateVariable>` 与游离 `<analysis>`）、`scripts/README.md`（职责边界、执行顺序、六项未验证项）。schema 注册仍由 `schema/zod_schema.js` 独立承担（R1a）。
- [DEC-060] **花奈入学年份定为 2025 年**（2026-09-13 主人裁决）：使 `P5` 的“重修课同教室”场景成立；MAT-003 摘要中“2026 年考入”一句以本裁决为准修正（素材冲突第 13 条关闭）。
- [DEC-062] **前端设计定案与实现**（2026-09-13）：主题定为 **夜航档案 · 青冷**（结构取 A「夜航档案」，色调定 **B 青冷**）——依据两条独立证据：本产品线既有青血脉（旧前端「雾青」`#8FD0D8`）＋ 库洛入口页像素统计青为第一色族（cyan 40.8%）。交付 `frontend/tokens.md`（令牌定案）、`frontend/preview.html`（双主题样张，可切换）、`frontend/render.js`（卡内实现：状态栏 + 群像档案页）。
- [DEC-063] **前端版权边界**（2026-09-13）：全程**未使用**任何第三方站点（含库洛/鸣潮）的图片、图标、插画或代码；只采用业界**通用视觉手法**（斜切角、单色荧光、细描边、扫描线、高对比排版）自绘。整页外部资源数 **0**。唯一第三方资源为 **Lucide 图标（ISC，部分源自 Feather/MIT）**，其**署名文本必须写入 `creator_notes`**。
- [DEC-065] **首次组装完成**（2026-09-13，checkpoint package 门）：建立**本项目自建**的组装器 `tools/build-card.mjs`（不复制任何旧工程工具；pipeline 技能要求“发现项目工具”，而本项目此前无工具，故按最小实现建立）。生成 `output/card-source.json`（chara_card_v3，185 KB）、`output/worldbook.json`（世界书独立版，107 KB）、`output/build-report.json`。内嵌 **25 条**世界书条目、**3 个**卡内脚本（R1 装载／R1a schema／R3 前端渲染）、**2 条**渲染正则；Lucide 署名已写入 `creator_notes`。**未打包 PNG**（未被要求，且需要图片素材）。
- [DEC-067] **PNG 成品打包完成**（2026-09-13）：`tools/make-face.ps1`（**程序化自绘** 512×768 卡面，青冷主题，渐变＋网格＋切角边框＋标题＋五人字牌，**不使用任何第三方图片素材**；字牌为占位，待立绘到位可替换）＋ `tools/embed-png.mjs`（按 `ST-A2` §5.1 把卡 JSON 以 Base64 写入 PNG 的 `tEXt` chunk，注入 `chara` 与 `ccv3` 双块、插在 IEND 之前、自动剔除旧块）。产出 `output/但为君故·沉吟至今 v0.1.png`（503,094 字节）。**13 项回读校验全部通过**。
- [DEC-068] **本机工具链已知坑（写进脚本注释，勿改回去）**：① Windows PowerShell **5.1** 对无 BOM 的 UTF-8 `.ps1` 按 GBK 解码 → 脚本必须存为 **UTF-8 with BOM**；② 本机**脚本执行被禁用**，须 `-ExecutionPolicy Bypass`；③ `New-Object Type(a, b)` 里**逗号优先级高于减号**，`$W - $cut, 0` 会被解析成“数字减数组”，一律改用 `[Type]::new(a, b)`；④ `pwsh` 不在 PATH，工具壳跑的是 5.1。
- [DEC-058] **一致性体检与修复**（2026-09-13）：以两个**独立对抗审查视角**（世界观/角色、变量/卡层）加机器可检项完成体检，问题全部修复或入档。关键修复：
  - **变量层数据安全**：移除全部 `.catch()` 兜底（其语义是“换成固定默认值”，会把校验失败伪装成成功——代价 60 会变 0、面纱“局部暴露”会变回“完好”）；布尔字段改为手工解析（`Boolean("false") === true` 会反向置位）；`区` 收敛为四个行政区、`时段` 扩展为八档、新增 `结构版本` 与 `主控/异能倾向`；常驻型能力（留白、解析）改为按事件计代价。
  - **世界观自洽**：「第九条」改为一揽子授权（机构授权＋典籍托管＋保密义务）；2029 复审改为**整批授权失去依托**（IMF 复审看不到密级附件，原表述不成立），并明确**这是压力峰值而非注定结局**，为玩家留出介入空间；教团命名统一为拾遗会／拾遗神学院／拾遗教团；深港与南大驻点条目去重。
  - **角色层**：花奈「留白」补人数、时限、接触条件与衰减；沉秋「缝」限定为“只作用于已存在的情绪”；楚羽笙「回声」改为“优先被听到／注意力偏向”而非“强拉”；诺薇拉「解析」标注常驻型并补“看见≠能证明”。
  - **诚实性**：五份角色词条的“一字未改”改为「**摘要级核对未发现偏离**」（主控未读素材原文，非逐字比对）；常驻预算由“约 2,400 字”修正为**实测 1,417 汉字**。
  - **层次边界**：`W4` 中属于卡私有的“五人登记状态”表移出跨卡共享层，改为指向卡层的指针。

## Proposed

以下均为**提案**，未经主人确认前不得当作已定事实写进实现：

- [DEC-022] MVU 字段清单（约 16 项，六分组），详见设计契约 ③。
- [DEC-023] 世界书五层分层：世界规则层／组织层／角色层／场所层／变量层。
- [DEC-024] 运行时依赖账本 DEP-001～DEP-006。
- [DEC-025] 项目目录结构：`worldview/`（跨卡共享）＋ `cards/<卡名>/`（本卡），本轮不创建。
- [DEC-026] 项目内建立独立的世界观层文件（面纱规则、异能体系、南江市、组织格局），供后续同伴卡引用。
- [DEC-027] 面纱规则契约与异能契约正文（设计契约 ①-A / ①-B），作为世界观层内容的初稿。

## Open decisions

- [DEC-033] 目标环境版本：SillyTavern / Tavern Helper / MagVarUpdate / mvu_zod 的具体版本号——**本机未安装，当前为未验证假设**。
- [DEC-034] 实机验收环境与时点（主人测试阶段安装酒馆后开此门）。
- [DEC-035] 极简状态栏第一版是否落地（涉及嵌入式 UI 与渲染正则工作量）。
- [DEC-036] 人设细项与异能世界的接合校准（例：花奈的“特效药断供”是否与异能相关、清寒的眼伤是否与觉醒有关）。

## Rejected

- [DEC-021] 卡名候选集合中的 A《住我隔壁的觉醒者们都不肯承认》与 B《南江面纱》**未被采用**；最终采用 C，见 [DEC-030]。
- [DEC-040] 旧工程设计文件作为本卡方案依据（已否决，仅可作形式参考）。
- [DEC-041] 战争迷雾／知识矩阵／信息差作为核心玩法（已废弃）。
- [DEC-042] `设定集/人设/test3.txt` 旧稿——角色编号、姓名、毕业年份均与现稿冲突，弃用。
- [DEC-043] 在开场白里伪造 `<initvar>`／`<UpdateVariable>` 初始化块来让开局“看起来已初始化”。

## Material index

素材全部来自主人的线上仓库（只读抓取）：

`https://github.com/sakuma-mian/dc-neighbor-ensemble-card`（分支 main）

**读取状态说明**：MAT-001、MAT-002 由主控读全文；MAT-003～MAT-008 由独立子代理只读抓取并摘要（主控**未读全文**，摘要结论引用时须标注）；MAT-009 判定为旧稿弃用；MAT-010～MAT-013 尚未读取。

```twa-materials
{
  "schemaVersion": 1,
  "materials": [
    {
      "id": "MAT-001",
      "name": "南江市城市总纲",
      "source": "设定集/南江市城市/南江市设定.txt",
      "state": "read-full"
    },
    {
      "id": "MAT-002",
      "name": "角色人设填报表模板",
      "source": "设定集/人设/角色填表模板.txt",
      "state": "read-full",
      "note": "玩法结构来源；其知识矩阵/信息差部分已随 DEC-004 废弃"
    },
    {
      "id": "MAT-003",
      "name": "藤原花奈人设",
      "source": "设定集/人设/藤原花奈.txt",
      "state": "read-summary-only",
      "note": "摘要记“2026 年考入南江大学”；本卡按冲突第 13 条裁决定为 2025 年入学"
    },
    {
      "id": "MAT-004",
      "name": "顾清寒人设",
      "source": "设定集/人设/顾清寒.txt",
      "state": "read-summary-only"
    },
    {
      "id": "MAT-005",
      "name": "鱼沉秋人设",
      "source": "设定集/人设/鱼沉秋.txt",
      "state": "read-summary-only"
    },
    {
      "id": "MAT-006",
      "name": "楚羽笙人设",
      "source": "设定集/人设/楚羽笙.txt",
      "state": "read-summary-only"
    },
    {
      "id": "MAT-007",
      "name": "诺薇拉人设（文件名沿用网名冯诺依曼）",
      "source": "设定集/人设/冯诺依曼.txt",
      "state": "read-summary-only"
    },
    {
      "id": "MAT-008",
      "name": "群像关系图",
      "source": "设定集/人设/群像关系图.md",
      "state": "read-summary-only"
    },
    {
      "id": "MAT-009",
      "name": "test3 旧稿",
      "source": "设定集/人设/test3.txt",
      "state": "rejected"
    },
    {
      "id": "MAT-010",
      "name": "市中心江北区详设",
      "source": "设定集/南江市城市/南江市市中心江北区.txt",
      "state": "read-full"
    },
    {
      "id": "MAT-014",
      "name": "南江新区详设",
      "source": "设定集/南江市城市/南江市南江新区.txt",
      "state": "read-summary-only"
    },
    {
      "id": "MAT-015",
      "name": "月石区详设",
      "source": "设定集/南江市城市/南江市月石区.txt",
      "state": "read-summary-only"
    },
    {
      "id": "MAT-016",
      "name": "市中心江南区详设",
      "source": "设定集/南江市城市/江南市市中心江南区.txt",
      "state": "read-summary-only"
    },
    {
      "id": "MAT-017",
      "name": "南江大学总览文档",
      "source": "设定集/南江市城市/南江大学设定集/南江大学总览文档.txt",
      "state": "read-summary-only"
    },
    {
      "id": "MAT-011",
      "name": "绘绘260821稳定版max · 但为君故适配版 v1.0 预设",
      "source": "设定集/预设/绘绘260821稳定版max·但为君故适配版v1.0.json",
      "state": "not-read",
      "note": "当前指定搭配的预设；未读，不作任何行为断言"
    },
    {
      "id": "MAT-012",
      "name": "预设适配说明",
      "source": "设定集/预设/适配说明.md",
      "state": "not-read"
    },
    {
      "id": "MAT-013",
      "name": "头像立绘提示词",
      "source": "设定集/人设/头像立绘提示词-GPT生图.md",
      "state": "not-read"
    }
  ]
}
```

**已知素材冲突（须在使用前裁决）**：

1. 诺薇拉住处两份文件冲突：旧稿为江南区江湾壹号大平层，新稿为江北区生态宜居带花园洋房。
2. `test3.txt` 为旧稿（角色编号、姓名、毕业年份冲突），已列 Rejected。
3. 花奈年龄时间线：18 岁、2026 入学大一，与“15–16 岁母亲病逝”叙述存在年份挤压空间，未写死。
4. 命名不一致：关系图写“楚楚的笙”，档案为“楚楚的笙_unofficial”。
5. **奥体中心归属重复**：江北文件称在本区东端，新区文件称在“新区与江北交界处”。
6. **市图书馆新馆归属重复**：江北与新区均将其列入本区设施。
7. **南江大学校区与院系归属冲突**：江北有主校区、新区另有约 3000 亩新校区，两地均称文学院等三院系“坐镇”。
8. **南江大学校史互斥**：已解决——见 DEC-051（前身密教神学院、2000 年落地、继承典籍）。
9. **滨江科创走廊归属**：月石文件称与其“隔河相望”，但该走廊在江南区文件内属江南区辖下。
10. **月石区方位含混**：“东临东海、南接杭州湾北岸”与“一核三翼”框架关系不明。
11. **新区人口口径异常**：约 600 km²、常住约 1350 万，密度远高于江北（280 km²/300 万）与江南（160 km²/220 万），属设定值。
12. **疑似笔误**：月石文件出现“江北新区”字样，应为“南江新区”。
13. **花奈入学年份**（2026-09-13 **已裁决**）：定为**花奈 2025 年入学**（大一），使 `P5` 的“重修课同教室”场景成立；MAT-003 摘要中“2026 年考入南江大学”一句**以本裁决为准予以修正**。

> 裁决建议见 `worldview/W5-场所层.md` 末节「素材冲突与裁决」。**其中第 8 条建议保留张力、升格为设定留白，不当作错误修掉。**

## Entry and component map

世界书分层与条目规划（**规划态，尚未创建文件**）：

```twa-entries
{
  "schemaVersion": 1,
  "entries": [
    { "id": "ENT-W01", "layer": "世界规则层", "name": "面纱铁律（常驻）", "state": "drafted", "source": "worldview/W1-面纱规则.md" },
    { "id": "ENT-W01b", "layer": "世界规则层", "name": "面纱细则", "state": "drafted", "source": "worldview/W1-面纱规则.md" },
    { "id": "ENT-W02", "layer": "世界规则层", "name": "异能体系总则", "state": "drafted", "source": "worldview/W2-异能体系.md" },
    { "id": "ENT-W03", "layer": "世界规则层", "name": "觉醒与代价", "state": "drafted", "source": "worldview/W2-异能体系.md" },
    { "id": "ENT-W04", "layer": "世界规则层", "name": "南江概览", "state": "drafted", "source": "worldview/W3-南江市.md" },
    { "id": "ENT-W04b", "layer": "世界规则层", "name": "隐秘南江", "state": "drafted", "source": "worldview/W3-南江市.md" },
    { "id": "ENT-H01", "layer": "世界规则层", "name": "源流：神学院与那笔交易", "state": "drafted", "source": "worldview/W6-源流与典籍.md" },
    { "id": "ENT-H02", "layer": "世界规则层", "name": "典籍：异能的教科书", "state": "drafted", "source": "worldview/W6-源流与典籍.md" },
    { "id": "ENT-F01", "layer": "组织层", "name": "江海基金会（提案名）", "state": "drafted", "source": "worldview/W4-组织格局.md" },
    { "id": "ENT-F01b", "layer": "组织层", "name": "基金会内部派系", "state": "drafted", "source": "worldview/W4-组织格局.md" },
    { "id": "ENT-F02", "layer": "组织层", "name": "边缘组织群像", "state": "drafted", "source": "worldview/W4-组织格局.md" },
    { "id": "ENT-P01", "layer": "角色层", "name": "藤原花奈（佐久间眠）", "state": "drafted", "source": "cards/chenyin-zhijin/lorebooks/P1-藤原花奈.md" },
    { "id": "ENT-P02", "layer": "角色层", "name": "顾清寒（珍惜才配拥有）", "state": "drafted", "source": "cards/chenyin-zhijin/lorebooks/P2-顾清寒.md" },
    { "id": "ENT-P03", "layer": "角色层", "name": "鱼沉秋（cojack）", "state": "drafted", "source": "cards/chenyin-zhijin/lorebooks/P3-鱼沉秋.md" },
    { "id": "ENT-P04", "layer": "角色层", "name": "楚羽笙（楚楚的笙_unofficial）", "state": "drafted", "source": "cards/chenyin-zhijin/lorebooks/P4-楚羽笙.md" },
    { "id": "ENT-P05", "layer": "角色层", "name": "诺薇拉（冯诺依曼）", "state": "drafted", "source": "cards/chenyin-zhijin/lorebooks/P5-诺薇拉.md" },
    { "id": "ENT-L01", "layer": "场所层", "name": "江北区", "state": "drafted", "source": "worldview/W5-场所层.md" },
    { "id": "ENT-L02", "layer": "场所层", "name": "南江新区", "state": "drafted", "source": "worldview/W5-场所层.md" },
    { "id": "ENT-L03", "layer": "场所层", "name": "月石区", "state": "drafted", "source": "worldview/W5-场所层.md" },
    { "id": "ENT-L04", "layer": "场所层", "name": "江南区", "state": "drafted", "source": "worldview/W5-场所层.md" },
    { "id": "ENT-L05", "layer": "场所层", "name": "南江大学", "state": "drafted", "source": "worldview/W5-场所层.md" },
    { "id": "ENT-L06", "layer": "场所层", "name": "深港（地下城）", "state": "drafted", "source": "worldview/W5-场所层.md" },
    { "id": "ENT-V01", "layer": "变量层", "name": "[initvar] 初始变量", "state": "drafted", "source": "cards/chenyin-zhijin/states/InitialVariables.json" },
    { "id": "ENT-V02", "layer": "变量层", "name": "[mvu_update] 变量更新规则", "state": "drafted", "source": "cards/chenyin-zhijin/update-rules/ENT-V02-变量更新规则.md" },
    { "id": "ENT-V03", "layer": "变量层", "name": "[mvu_update] 变量输出格式", "state": "drafted", "source": "cards/chenyin-zhijin/update-rules/ENT-V03-变量输出格式.md" },
    { "id": "ENT-V04", "layer": "变量层", "name": "变量列表（共享上下文）", "state": "drafted", "source": "cards/chenyin-zhijin/update-rules/ENT-V04-变量列表.md" },
    { "id": "ENT-S01", "layer": "变量层", "name": "Zod schema", "state": "drafted", "source": "cards/chenyin-zhijin/schema/zod_schema.js" },
    { "id": "ENT-C01", "layer": "卡层", "name": "卡增量：面纱纪律", "state": "partial", "source": "card/card-fields.md description 职责2", "note": "完整条目待 MAT-011/012 预设确认后补写" },
    { "id": "ENT-C02", "layer": "卡层", "name": "卡增量：群像调度", "state": "partial", "source": "card/card-fields.md description 职责3", "note": "同上" },
    { "id": "ENT-C03", "layer": "卡层", "name": "卡增量：觉醒与代价判定", "state": "partial", "source": "card/card-fields.md description 职责4", "note": "同上" },
    { "id": "ENT-C04", "layer": "卡层", "name": "卡增量：开局问卷路由", "state": "drafted", "source": "card/card-fields.md 第四节" },
    { "id": "ENT-C05", "layer": "卡层", "name": "卡身份字段（description/personality/scenario/first_mes/mes_example 等）", "state": "drafted", "source": "card/card-fields.md" },
    { "id": "ENT-R1", "layer": "脚本层", "name": "R1 MVU 装载脚本", "state": "drafted", "source": "cards/chenyin-zhijin/scripts/R1-mvu-loader.js" },
    { "id": "ENT-R2", "layer": "脚本层", "name": "R2 渲染正则（隐藏变量块）", "state": "drafted", "source": "cards/chenyin-zhijin/scripts/R2-render-regex.md" },
    { "id": "ENT-R3", "layer": "脚本层", "name": "前端渲染（状态栏 + 群像档案页）", "state": "drafted", "source": "cards/chenyin-zhijin/frontend/render.js" },
    { "id": "ENT-R4", "layer": "脚本层", "name": "前端设计令牌与样张", "state": "drafted", "source": "cards/chenyin-zhijin/frontend/tokens.md + preview.html" },
    { "id": "ENT-B1", "layer": "工件层", "name": "组装器（本项目自建）", "state": "drafted", "source": "tools/build-card.mjs" },
    { "id": "ENT-B3", "layer": "工件层", "name": "卡面生成 + PNG 打包脚本", "state": "drafted", "source": "tools/make-face.ps1 + tools/embed-png.mjs" },
    { "id": "ENT-B2", "layer": "工件层", "name": "生成物：card-source.json / worldbook.json / build-report.json", "state": "drafted", "source": "output/" }
  ]
}
```

## Runtime dependency ledger

| id | 组件 | class | delivery | fallback / failureMode | validationOwner |
|---|---|---|---|---|---|
| DEP-001 | Tavern Helper / JS-Slash-Runner | `host_required` | 宿主安装 | 缺失＝卡完全不工作 | 真实运行时（未验证） |
| DEP-002 | MagVarUpdate（MVU bundle） | `remote_runtime` | jsDelivr 主 + 备镜像 | 备镜像兜底；均失败＝变量系统不启动并明确报错 | 真实运行时（未验证） |
| DEP-003 | StageDog mvu_zod.js | `remote_runtime` | jsDelivr cn/global 双区域 | 区域择路；失败＝schema 校验不生效并报错 | 真实运行时（未验证） |
| DEP-004 | zod v4 core | `remote_runtime` | 由 DEP-003 内部拉起 | 随 DEP-003 | 真实运行时（未验证） |
| DEP-005 | zod_schema / MVU 装载脚本 / 初始变量 / 世界书 / 更新规则 / 渲染正则 | `embedded_required` | 随卡封装 | 组装门校验缺失即阻断 | 离线校验 |
| DEP-006 | Node + 校验脚本 | `development_only` | 开发机 | 不进玩家须知 | 开发环境 |

**玩家口径措辞（写进装卡须知时照此）**：“需要在宿主中安装或启用”＝DEP-001；“运行时从远程地址加载”＝DEP-002/003/004；“已随卡封装，无需另行安装”＝DEP-005；“仅开发环境需要”＝DEP-006。不得使用笼统的“安装全部依赖”。

## Acceptance ledger

```twa-acceptance
{
  "schemaVersion": 1,
  "items": [
    {
      "id": "ACC-001",
      "gate": "design",
      "item": "设计契约与决策清单经主人逐项确认",
      "state": "partial",
      "evidence": "2026-09-13 主人已拍板卡名（DEC-030）并确认五人异能（DEC-020）；契约其余条款（状态字段、依赖账本、验收口径、DEC-035/036/037）尚未逐项核对"
    },
    {
      "id": "ACC-002",
      "gate": "offline",
      "item": "schema 静态可解析、字段与初始值一致、更新规则 op 合法、词条标记齐全、正则不破坏解析、预算不超",
      "state": "not-started"
    },
    {
      "id": "ACC-003",
      "gate": "real-host",
      "item": "导入酒馆后：远程加载成功、开局问卷跑通、变量真实更新、群像调度与面纱纪律不泄底",
      "state": "blocked",
      "blockedBy": "本机尚未安装 SillyTavern（DEC-034）"
    },
    {
      "id": "ACC-004",
      "gate": "driver",
      "item": "主人亲手试玩并确认手感",
      "state": "not-started"
    },
    {
      "id": "ACC-016",
      "gate": "offline-artifact",
      "item": "PNG 成品打包并回读校验：chara/ccv3 双块各一、语义与源 JSON 完全相等、chunk 结构完整",
      "state": "passed",
      "evidence": "2026-09-13：产物 output/但为君故·沉吟至今 v0.1.png（503,094 字节，SHA256 BD070906B4BEACC6…）。回读 13 项全过：PNG 签名、IEND 位于末位、chara/ccv3 各 1 个（按 tEXt keyword 统计）、ccv3 spec=chara_card_v3/3.0、name／条目数／脚本数／正则数一致、decoded === source **语义完全相等**。卡面为程序化自绘（无第三方素材）。**未验证**：真实 SillyTavern 导入与识别"
    },
    {
      "id": "ACC-015",
      "gate": "offline",
      "item": "首次组装并回读校验：JSON 合法、字段完整、position 双轨、中文关全词匹配、两份产物内容一致、署名就位",
      "state": "passed",
      "evidence": "2026-09-13 组装后回读验证：character_book 25 条与独立世界书逐条内容一致；tavern_helper.scripts 3 个 enabled=true；regex_scripts 2 条；顶层必填字段无缺失；全部条目字段完整、match_whole_words=false、顶层 position 字符串与 extensions.position 对应正确；无“非恒驻却无关键词”的条目。**未验证**：真实导入、卡内脚本执行、远程加载、变量写入 —— 均为 ACC-003 实机范围"
    },
    {
      "id": "ACC-014",
      "gate": "offline",
      "item": "前端实现产出并通过离线校验：语法合法、令牌无未定义、类名与样式对齐、无变量写入",
      "state": "partial",
      "evidence": "2026-09-13 产出 frontend/render.js（状态栏 + 群像档案页两个 surface，40.7 KB）、tokens.md（166 行）、preview.html（51 KB 双主题样张）。校验：node --check PASS；令牌定义/引用一致；外部网络资源 0；Mvu 写操作 0 次；esc() 29 处。**未验证**：iframe 内 parent.document、动态插入 DOM 的 class 命名空间、clip-path 渲染、320px 窄容器、prefers-reduced-motion 传递 —— 均为真机范围"
    },
    {
      "id": "ACC-013",
      "gate": "offline",
      "item": "脚本层产出并通过离线校验：R1 语法合法；R2 两条正则经 JSON 解析后编译并样例验证；六项实机未验证项已登记",
      "state": "partial",
      "evidence": "2026-09-13 校验：(1) `node --check` 对 R1-mvu-loader.js 返回 0；(2) R2 两条正则 JSON 合法、解析后编译通过——A 命中整合块且替换后剩余 0，B 命中游离 analysis 块；(3) 六项实机未验证项（镜像可用性、waitGlobalInitialized 存在性、Mvu.settings 入口、脚本与世界书加载先后、正则叠加、变量写入端到端）已登记在 scripts/README.md。**本项不证明远程加载与变量写入可用**"
    },
    {
      "id": "ACC-012",
      "gate": "offline",
      "item": "一致性体检：两个独立对抗审查视角 + 机器可检项（引用完整性、字段闭环、预算复核）",
      "state": "passed",
      "evidence": "2026-09-13 完成。机器检查：DEC 引用（修复 1 处悬空引用）、文件路径引用、更新规则 14 条路径与 schema/变量列表全部对齐、常驻预算实测 1,417 汉字。对抗审查：世界观/角色 6 严重 + 6 中等 + 5 轻微；变量/卡层 6 严重 + 6 中等 + 5 轻微——**均已修复或入档**，细节见 DEC-058"
    },
    {
      "id": "ACC-011",
      "gate": "offline",
      "item": "卡层身份字段草案产出（description/personality/scenario/first_mes/mes_example/creator_notes/alternate_greetings/tags + extensions 规划）",
      "state": "partial",
      "evidence": "2026-09-13 产出 cards/chenyin-zhijin/card/card-fields.md；description 已并入面纱纪律/群像调度/觉醒代价三条最小必要增量（ENT-C01～C03 记为 partial）；完整卡增量条目待 MAT-011/012 预设确认挂接方式。**预算数字已于同日修正**：原估“约 2,400 字/轮”作废，实测常驻四段 1,417 汉字（详见 ACC-012）"
    },
    {
      "id": "ACC-010",
      "gate": "offline",
      "item": "变量层产出并通过离线校验：Zod 脚本可解析、初始变量 JSON 合法、四容器与五角色结构正确",
      "state": "passed",
      "evidence": "2026-09-13 校验：(1) node --check 对 zod_schema.js 返回 0（ES module 语法合法，含 top-level await）；(2) InitialVariables.json 合法 UTF-8 且 JSON 解析通过，顶层=世界/主控/角色/事件，角色 5 名。注意：这**只证明语法与结构**，不证明 MVU 运行时行为、schema 拦截或远程加载可用"
    },
    {
      "id": "ACC-009",
      "gate": "offline",
      "item": "角色层五人词条 ENT-P01～P05 产出（外貌/线上线下/说话方式/异能/背景/关系/登记/城区/相处要点）",
      "state": "partial",
      "evidence": "2026-09-13 产出 cards/chenyin-zhijin/lorebooks/ P1～P5 与角色层 README；外貌、家庭、年份、说话方式、关系经**子代理摘要级核对未发现偏离**（⚠️ 主控未读素材原文，非逐字比对；原“一字未改”表述已于同日依对抗审查修正），异能与登记状态为新增（DEC-020/DEC-048）；单条 880～900 字，合计约 4,480 字"
    },
    {
      "id": "ACC-008",
      "gate": "offline",
      "item": "源流层 ENT-H01/H02 产出；场所层南大条目按 DEC-051 更新；12 条素材冲突全部裁决入档",
      "state": "passed",
      "evidence": "2026-09-13 产出 worldview/W6-源流与典籍.md；W5 南大条目与裁决表、W4 教团条目、README 目录均已同步"
    },
    {
      "id": "ACC-007",
      "gate": "offline",
      "item": "场所层词条 ENT-L01～L06 产出（六城区/专项空间），素材冲突清单扩充至 12 条并附裁决建议",
      "state": "partial",
      "evidence": "2026-09-13 产出 worldview/W5-场所层.md；江北区素材主控读全文，其余四份为子代理只读摘要；条目字数仍为估算，未实测 token"
    },
    {
      "id": "ACC-006",
      "gate": "offline",
      "item": "世界观层草案（worldview/ 五份）产出，条目映射与投递策略已登记",
      "state": "passed",
      "evidence": "2026-09-13 产出 README/W1/W2/W3/W4，条目 state=drafted；同日主人确认采纳（DEC-045）。字数仍仅为起草估算，未实测 token"
    },
    {
      "id": "ACC-005",
      "gate": "integrity",
      "item": "权威文件写入后回读验证：UTF-8 合法、机器可读区块 JSON 可解析、DEC 编号无重复",
      "state": "passed",
      "evidence": "2026-09-13 校验：creative-authority.md 14,249 字节、合法 UTF-8、twa-materials/twa-entries/twa-acceptance 三块 JSON 全部解析通过"
    }
  ]
}
```

## Next gate

**下一道门**：**场所层词条**——待 `MAT-010`（南江市各区详设）读取完成后撰写（2026-09-13 主人指定先补城区素材）；随后进入**角色层词条**与 **MVU schema 细化**。

在此之前**不进入**角色层词条、schema 与脚本编写；任何实机结论在酒馆安装前一律标记为未验证（DEC-033 / DEC-034）。

**已知阻塞**：`MAT-011/012`（指定预设与适配说明）未读，卡增量 CoT 的挂接位置无法确认（DEC-012）。数值档位已由 DEC-037 拍板并写入 `ENT-V02`，**不再是阻塞项**。
