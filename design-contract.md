# 设计契约 · 《在DC频道里口嗨的群友就住我隔壁？！》

> 版本：v1.0（2026-08-28）｜ 状态：驱动已验收（ACC-004）
> 决策权威：[creative-authority.md](creative-authority.md)（DEC 记录）；本文件是六张图的实现级细节。
> 证据基线：TavernWeave 库快照 2026-08-18（ST-A0/A3/B1 已读，A2/A4/A6/C10 按阶段待读）；`variable-systems.md`、`card-types-and-runtime-dependencies.md` 已读；绘绘 260821稳定版max 只读体检（MAT-006）。

---

## ① 内容图

| 项 | 契约 | 素材/状态 |
|---|---|---|
| 卡名 | 《在DC频道里口嗨的群友就住我隔壁？！》 | DEC-001 定稿 |
| 世界观 | 南江市（现代都市，"一核三翼"超新型特区，MAT-001 系） | 城区文件待修订（DEC-202） |
| 前提 | Discord 频道好友阴差阳错聚于南江；主控自捏人设开局；标题即戏剧核（网友就在身边） | DEC-001/004 |
| 角色 | 3-5 名固定角色；六件套模板收集（身份档案/线上线下反差/**知识矩阵**/关系起点/攻略锚点/城区绑定） | DEC-201 等待交付 |
| 关系起源 | Discord 频道聊天史（叙事背景层，ENT-001） | DEC-004 |
| 玩法 | 高自由度群像 + 攻略目标选择 + 主线/支线引导（任务层） | DEC-006 |
| 彩蛋 | 创作者梗 → 低频隐藏词条，来源登记 + 当事人同意 | DEC-204 |
| 开场 | 主开场：自捏人设 → 首条用户消息走正常剧情链 → 路由表选初遇对象；备选开场待定（DEC-205） | DEC-005 |
| 内容边界 | NSFW 允许，无额外禁忌；绘绘 NSFW「标准」档起步 | DEC-007 |
| 示例对话 | 每角色 1-2 条；必须示范"被问到迷雾区事实时的打岔反应" | 随人设到位 |

## ② CoT 图

**主链**：绘绘「通用思维链」（互斥组，MAT-006）。卡内不重写完整链。

**部署契约**：卡增量经世界书/卡字段注入，遵循绘绘 `erii_*` 输出标签约定与「卡思维链」槽位；`<UpdateVariable>` 块由 R3 正则对渲染隐藏。

**卡增量**（收件人：剧情模型；按双兼容基线标 `[mvu_plot]`）：

| ID | 名称 | 职责 | 去重对象 |
|---|---|---|---|
| INC-1 | 保密纪律 | 逐条引用当前已揭示迷雾格；未揭示事实（含角色彼此的）一律不得出现在叙述与对话中；示范打岔方式；误信（`误信已纠正` 前的假认知）按角色主观视角表述 | 绘绘 防·上帝视角 / 杀·强行揭示——只写卡特定收窄，不复制 |
| INC-2 | 群像调度 | 在场角色 × 知识矩阵 × 关系矩阵 → 决定谁有反应、反应什么；场外角色不得表现出其不应知的信息 | 新增（绘绘无群像机制） |
| INC-3 | 初遇路由 | 读 user 人设关键词 + `登场` 标记 → 按路由表选初遇对象与场景 | 新增 |

**条件模块**：MOD-A 攻略事件（`关系.阶段` 达阈值触发升温/破裂场景）；MOD-B 任务钩子（任务词条激活时的引导规则）。

**更新模型侧**（标 `[mvu_update]`，ENT-040）：变量规则（六容器 JSONPatch 规则 + op 限制）+ 更新输出格式 + 当前状态注入。不收：剧情 CoT、文风脚手架、NPC 日程、NSFW 模块。

**回退**：若目标运行时不支持独立更新模型，同一卡切换单模型模式（标记不生效时条目自然共享上下文），无需改卡。

**验收口径**：行为级——不泄底、路由正确、群像反应符合矩阵；不要求完整推理输出。

## ③ 状态图（六容器 · DEC-009）

```text
stat_data
├─ 迷雾/   角色 → 事实ID → "未揭示" | "已揭示" | "误信已纠正"
├─ 关系/   角色 → { 好感度: number, 关系阶段: string }
├─ 登场/   角色 → boolean（已遇标记）
├─ 任务/   任务ID → { 状态: 未接|进行中|完成|失败, 进度备注: string }
├─ user/   { 身份, 来历, …（开局采集） }
└─ 环境/   { 日期, 时段 }
```

**字段台账规则**（实现时逐字段登记）：path / type / default / writer / reader / renderer / cleanup / migration / example。没有消费者的字段不加。

- **事实 ID 注册表**：迷雾格的 `事实ID` 由人设六件套产生（如 `A.住址`、`B.学历`），实现时在 `schema/` 旁维护注册表（事实ID → 描述 → 门控词条 ID）；schema 用 `z.record()` 承接动态键，`.passthrough()` 仅加在确需扩展的层。
- **初始化**：共享默认值 = InitialVariables（zod `prefault` 兜底）；`user/` 由自由开场经正常剧情链采集（LLM 以 add/replace 写入），**不在开场白伪造 `<initvar>`/`<UpdateVariable>`**。
- **display_data**：留空（无嵌入 UI）。
- **清理/迁移**：`迷雾` 揭示后不回退（无清理）；`任务` 完成态保留；schema 带 `schemaVersion`，迁移规则幂等、失败安全。
- **写入纪律**：每字段单一写入者（剧情链）；脚本只做确定性推导（R2 门控是读方，不写状态）。

## ④ 运行时图

| ID | 组件 | 交付 | 契约 |
|---|---|---|---|
| R1 | MVU 装载脚本 | 卡内嵌（酒馆助手脚本） | 等待 WorldbookReady → 双区域加载（cn 优先/testingcf 备用 → global 兜底）→ MVU bundle → `waitGlobalInitialized('Mvu')` → 注入生产默认（reprocess/reread/retry） |
| R1a | schema 注册 | 卡内嵌（`schema/zod_schema.js`） | 全局 `z`（绝不自带 CDN zod）；`$()` 回调内 `registerMvuSchema(Schema)`；prefault 兜底 + 必要处 passthrough |
| R2 | 迷雾门卫脚本 | 卡内嵌 | 监听 `mag_variable_update_ended`（常量引用，注意 `initiailized` 拼写坑）→ 读 stat_data 的 迷雾/关系/任务/登场 → **幂等**同步世界书词条启用开关；每轮从状态全量推导，新聊天/回溯自动复原；不写状态 |
| R3 | 渲染正则 | 卡内嵌 `regex_scripts` | 隐藏 `<UpdateVariable>`/`<analysis>` 块（仅渲染层，不影响解析） |
| — | 嵌入 UI | 排除 | 维持 DEC 排除项 |

**失败行为**：CDN 失败 → 备镜像兜底 → 均失败时明确报错提示（不静默降级）；门卫脚本异常不阻塞变量更新（fail-soft，仅迷雾门控暂失效并提示）。

## ⑤ 工件图

| 维护源 | 生成物 |
|---|---|
| `schema/zod_schema.js` + 事实ID注册表 | 卡内嵌 schema 脚本 |
| `states/InitialVariables.json` | 初始变量 |
| `update-rules/`（变量规则文本） | ENT-040 `[mvu_update]` 词条内容 |
| `lorebooks/`（分层词条源） | 卡世界书 |
| `scripts/`（R1/R2） | 酒馆助手脚本（`tavern_helper.scripts`） |
| `tests/`（结构校验） | 校验报告（ACC-005） |
| 卡源 JSON（身份字段/开场/示例） | chara_card_v3 成品 |

`status-panel/`、`control-center/`、`frontend/` 空置。组装/校验/打包走 `$sillytavern-card-components` → `$sillytavern-card-pipeline`；**打包发布另立门，本轮不含**。

## ⑥ 依赖账本（玩家口径措辞见 authority 文件）

| id | 角色 | class | delivery | fallback / failureMode | validationOwner |
|---|---|---|---|---|---|
| DEP-001 | 酒馆助手 JS-Slash-Runner | host_required | 宿主安装 | 缺失 = 卡完全不工作，装卡须知首条 | 真实运行时（ACC-006） |
| DEP-002 | MagVarUpdate bundle.js | remote_runtime | jsDelivr（主+备镜像） | 备镜像兜底；均失败 = 变量系统不启动并提示 | 真实运行时 |
| DEP-003 | StageDog mvu_zod.js | remote_runtime | jsDelivr（cn/global 双装） | 区域择路；失败 = schema 校验不生效并提示 | 真实运行时 |
| DEP-004 | zod v4 core | remote_runtime | 由 DEP-003 内部加载 | 随 DEP-003 | 真实运行时 |
| DEP-005 | zod_schema.js / R1 / R2 / R3 / InitialVariables / 世界书 | embedded_required | 随卡封装 | 组装门校验缺失即阻断 | 离线校验（ACC-005） |
| DEP-006 | Node + 校验脚本 | development_only | 开发机 | 不进玩家须知 | 开发环境 |

## ⑦ 实现阶段离线验收清单（对应 ACC-005）

1. schema：zod 定义可静态解析；六容器齐全；无 VWD 格式；事实 ID 注册表与迷雾词条一一对应。
2. 初始化：InitialVariables 与 schema 默认值一致；开场白无伪造初始化块。
3. 更新规则：op 限四种；`<analysis>` 每行对应 patch 的规则在文本中；无硬编码可复制输出示例。
4. 词条标记：`[mvu_update]`/`[mvu_plot]` 清单齐全，未标记条目逐条说明共享理由；与绘绘防/杀系列无语义重复。
5. 脚本：R1 镜像序正确；R2 幂等性（同状态两次同步结果一致）；事件名用常量。
6. 正则：渲染隐藏且不破坏解析。
7. 素材：入卡内容均可溯源到 MAT/CLM；彩蛋有同意记录；无隐私信息入卡。
8. 预算：激活态词条 token 估算 ≤ 世界书预算（默认 25%，可调）。

## ⑧ 实现前待读指南

A2《角色卡格式规范》（组装前必读）、A4《提示词与预设》（写 INC 前精读绘绘交互面）、A6《正则机制》（写 R3 前）、C10《开局页与自定义开局》（定 DEC-205 时）。版本敏感 API 一律经 `$sillytavern-api-reference` 核对，不从本契约臆造。
