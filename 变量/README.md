# 变量层（MVU · JSONPatch + Zod）

> 版本：v0.1（2026-08-29）｜ 状态：drafted——骨架按 DEC-024 抄自 re0 仓库 `变量/` 文件夹（2026-08-29 快照），六容器内容为本卡 DEC-009 状态轴；待驱动复核 + ACC-005
> 来源边界（DEC-015 之变量层豁免）：本层只取 re0 的变量系统机制文本；Re:Zero 人设/剧情/设定零混入——re0 专属容器（轮回/菜月昴/战斗/资产等）全部弃用，重写件不含任何 Re:Zero 词汇

## 1. 文件清单（对应 re0 `变量/` 结构）

| 文件 | 来源 | 说明 |
|---|---|---|
| 世界书/[initvar] 初始.txt | 重写 | 本卡初始变量树：迷雾/关系/登场/任务/user/环境 + 规则头（schema版本 dc-neighbor-state-v1 / 初始化完成 false） |
| 世界书/[mvu_update]变量更新规则.txt | 重写 | 总则 + Patch约定（框架句沿用 re0）+ 初始化 + 六容器各自规则 + 清理与不变量 |
| 世界书/[mvu_update]变量输出格式.txt | 重写 | `<UpdateVariable>` 输出块（框架结构沿用 re0），Analysis 八项对应六容器 |
| 世界书/变量列表.txt | **原样照抄** | `<status_current_variables>{{format_message_variable::stat_data}}</status_current_variables>`（框架件，97B） |
| 脚本/酒馆助手脚本-MVU.json | **原样照抄** | MVU 框架加载器：import NLKASHEI/MVU-offline@v1.0.1 `mvu_bundle_full.js`（testingcf 镜像），含楼层操作按钮 |
| 脚本/酒馆助手脚本-ZOD.json | 重写 | `registerMvuSchema(Schema)`：helper（signedPercent/text）沿用 re0；schema 版本 `dc-neighbor-state-v1` |

## 2. 世界书装配建议（组装门 / ACC-005 核定）

- comment：`[initvar]初始`、`[mvu_update]变量更新规则`、`[mvu_update]变量输出格式`、`[mvu_update]变量列表`
- `[initvar]初始` 建议 constant（MVU 框架读取初始树）；三个 `[mvu_update]` 条目建议 constant（更新模型每轮都需要）；双模型模式下只进更新模型侧，单模型回退时自然共享上下文（DEC-011 双兼容基线）
- position / order：待与 plot 侧词条在 Prompt Manager 预览核对后定，不臆造方向语义

## 3. 本卡变量语义决策（DEC-025 驱动裁决，2026-08-29）

- **迷雾 = 知情者 → 事实ID → 知情状态**；本人对自身事实的知情是天然的，不入表（花奈行无 H.* 格，依此类推）
- **迷雾格数 = 21 格**（花奈 5 + 清寒/沉秋/楚羽笙/诺薇拉各 4；H5+Q4+C4+Y4+N4）。角色层 README 旧注释"22 行"系统计笔误，已勘误；initvar 按 21 格 = 105 迷雾单元落盘
- **R2 取数口径 = 任一知情者翻转即启用**：任一知情者格（知情者≠事实本人）变为「已揭示」或「误信已纠正」，R2 即把对应秘密词条 `disable=false`；不采用"仅主控行"口径
- **好感度基准 = 50**（线上普通群友交情），范围 -100~100，开局校准区间 40~60；schema 默认值与 initvar 一致（prefault 50）
- 稳定键：主控 / 花奈 / 清寒 / 沉秋 / 楚羽笙 / 诺薇拉；网名、化名变化不改键（楚羽笙 换掉 _unofficial 的终局不改键）
- 任务表当前为空（DEC-203），更新规则已禁止凭空新增；变量层 position/order 仍留组装门核定

## 4. 与设计契约 ⑤ 工件图的偏差（DEC-024 登记）

- `states/InitialVariables.json` → 由 `[initvar] 初始.txt`（世界书路线，MVU 原生机制）承担
- `schema/zod_schema.js` 维护源 → 暂由 `脚本/酒馆助手脚本-ZOD.json` 直接承担；组装门若需维护源再拆分
- `update-rules/` → 由 世界书 `[mvu_update]` 两件承担（即 ENT-040）
- R1 双区域镜像序（cn 优先 → global 兜底）为后续增强项；当前照抄 re0 单镜像（testingcf），失败行为=框架不启动并报错

## 5. 校验挂钩（ACC-005）

1. schema 可静态解析；六容器齐全；无 VWD `[value, desc]`；op 限四种
2. initvar 与 schema 默认值一致（好感度 50、关系阶段 线上群友、迷雾全未揭示、登场全 false、初始化完成 false、schema版本 dc-neighbor-state-v1）
3. 更新规则/输出格式：迷雾翻转因果纪律、揭示不可逆、无臆造变化的规则在文本中；无硬编码可复制的完整输出示例
4. 事实ID 与 lorebooks/角色层 秘密词条一一对应（21 格，DEC-025 已定）
