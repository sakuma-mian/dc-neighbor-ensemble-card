# NEXT · 交接摘要

> 项目：《但为君故 · 沉吟至今》（《但为君故》世界观的**圆心卡**）
> 最后更新：2026-09-13（本次会话结束）
> 本文件是**跨会话交接**。新会话开工时：先读本文件 → 再读 `creative-authority.md` 的 Status / Goal / Confirmed / Open decisions / Acceptance ledger / Next gate。

---

## 一句话现状

从零设计并组装出一张 **MVU + Zod 群像沙盒卡**：现代都市南江市 + 隐秘异能社会 + 五人攻略群像 + 完整前端。

**设计、实现、组装、PNG 打包全部完成**，产物可直接导入酒馆。**唯一未做的是实机验证——本机没有安装 SillyTavern**，所有实机结论为空。

---

## 本次会话完成的事

1. 读 `A0` 三格并与主人确认；旧仓库判定为**旧工程**（只取 `设定集/` 素材）。
2. **世界观层** `worldview/W1～W6`：面纱规则、异能体系、南江市、组织格局、场所层（六城区）、源流与典籍。
3. **角色层** `lorebooks/P1～P5`：五人的外貌／线上线下／说话方式／异能／背景／关系／登记／城区／相处要点。
4. **变量层**：Zod schema、初始变量、变量列表、更新规则、输出格式。
5. **卡层** `card/card-fields.md`：description／personality／scenario／first_mes（含开局问卷）／mes_example／creator_notes／备选开场。
6. **脚本层**：R1 MVU 装载、R2 渲染正则、**R3 前端渲染**（状态栏 + 群像档案页）。
7. **一致性体检**：两个独立对抗审查员 + 机器检查；严重 12 / 中等 12 / 轻微 10，全部修复或入档。
8. **前端设计**：定案 **夜航档案 · 青冷**；`tokens.md`（令牌）+ `preview.html`（双主题样张）+ `render.js`（卡内实现）。
9. **组装**：自建 `tools/build-card.mjs` → `output/card-source.json`、`worldbook.json`、`build-report.json`。
10. **PNG 打包**：`tools/make-face.ps1`（自绘卡面）+ `tools/embed-png.mjs` → **`output/但为君故·沉吟至今 v0.1.png`（503 KB，可导入）**。

---

## 关键决策速查（新会话先读这张表）

| 项 | 定论 |
|---|---|
| 卡名 | **《但为君故 · 沉吟至今》**（世界观名《但为君故》独立保留） |
| 卡型 | `mvu_zod`；卡本体是**世界观/GM 人格**，不是单一角色 |
| 玩家 | 开局**问卷自捏**，起点是**尚未觉醒的普通人** |
| 世界观 | 南江市 + **隐秘异能社会**；面纱法源＝1999 年批文未公开的**第九条**（一揽子：机构授权＋典籍托管＋保密义务） |
| 倒计时 | 2029 **政策授权失去依托**（不是“附件被翻开”），且**是压力峰值不是注定结局** |
| 玩法 | **异能 + 大世界沙盒**；战争迷雾/知识矩阵/信息差**已废弃** |
| 异能 | **觉醒型 + 代价**；分**主动型／常驻型**（常驻型按事件计代价） |
| 组织 | **方案 B・共生型**：半官方「江海基金会」+ 边缘组织（黑户／候鸟／深夜频道／白房子／拾遗教团） |
| 群像 | 花奈「留白」/ 清寒「威压」/ 沉秋「缝」/ 楚羽笙「回声」/ 诺薇拉「解析」 |
| 数值 | 代价 +8~+15（初醒）／+3~+8（掌控）／过载 +25~+40／日 −5；暴露 +10~+25；好感 ±3~±10 |
| 前端 | **夜航档案 · 青冷**（青 `#5FD4E0`；斜切角＋内描边＋扫描线）；两个 surface：状态栏 + 群像档案页 |
| 内容边界 | 成人向，**仅限成年角色** |
| 预设 | 暂用《绘绘260821稳定版max · 但为君故适配版》；剧情 CoT 由团队后续适配 |

---

## 文件地图

```text
但为君故/
├─ NEXT.md                    ← 本文件（交接）
├─ creative-authority.md      ← 决策权威（55 条 DEC + 素材索引 + 条目映射 + 依赖账本 + 16 条验收）
├─ design-contract.md         ← 设计契约（六张图 + 离线验收清单 + 待读指南）
├─ worldview/                 ← 跨卡共享层（同伴卡也用）
│   └─ README + W1～W6（面纱/异能/南江/组织/场所/源流）
├─ cards/chenyin-zhijin/      ← 本卡私有层
│   ├─ card/card-fields.md       卡身份字段（含开局问卷）
│   ├─ lorebooks/P1～P5          角色层 + README
│   ├─ schema/zod_schema.js      Zod 结构约束
│   ├─ states/InitialVariables.json
│   ├─ update-rules/             ENT-V02 更新规则 / V03 输出格式 / V04 变量列表
│   ├─ scripts/                  R1 装载 / R2 正则 / README
│   └─ frontend/                 tokens.md（令牌）/ preview.html（双主题样张）/ render.js（卡内实现）
├─ tools/                     ← 本项目自建工具（不复制旧工程）
│   ├─ build-card.mjs            组装器（--dry-run 只读校验）
│   ├─ make-face.ps1             卡面自绘 512×768
│   └─ embed-png.mjs             PNG 打包（tEXt chara/ccv3 双块）
└─ output/                    ← 生成物（不手改）
    ├─ card-source.json          卡源 185 KB
    ├─ worldbook.json            世界书独立版 107 KB
    ├─ card-face.png             卡面
    ├─ build-report.json         组装报告
    └─ 但为君故·沉吟至今 v0.1.png   成品卡 503 KB（可导入）
```

**层次判定规则**：同伴卡也要遵守的 → `worldview/`；只属于这五个人的 → `cards/`。

---

## 强制维护纪律（出自真实事故，不要忘）

1. **编辑决策记录列表**：`old_string` 必须**完整包含整行**，`new_string` 必须**从整行开头写起**。同日三次拿“行首片段”当 `old_string`，把 `DEC-056`／`DEC-053`／`DEC-058` 截断或吞掉。
2. **编辑 `twa-*` JSON 区块**：**末条无结尾逗号**，中间各条都有——用带逗号的片段匹配末行必然失败（踩过两次：`ENT-C04`、`ENT-R2`）。改前后都要**用脚本重新解析**确认仍是合法 JSON。
3. **每次改动四个决策区块后，必须重跑**：DEC 编号唯一性 + 无悬空引用 + 无黏连记录。
4. **禁止在 schema 里用 `.catch()` 兜底**：其语义是“换成固定默认值”，会把校验失败伪装成成功（代价 60 会变 0、面纱“局部暴露”会变回“完好”）。非法值应验证失败、原值保留。
5. **布尔字段必须手工解析**：`Boolean("false") === true` 会反向置位。
6. **不得在开场白伪造 `<initvar>` / `<UpdateVariable>`**。
7. **R1 不得加载 `mvu_zod.js`**（跨 zod 实例地雷）——它只属于 `zod_schema.js`。
8. **估算不是证据**：写进文件前先实测（曾把常驻预算高估 52%~80%）。
9. **自己的校验工具也要先被验证**：本会话里“工具报失败”有 **4 次是工具自身写错**（JSON 源文本当正则编译、`g` 标志 `lastIndex` 污染、PowerShell 函数名撞内置别名 `R`、把 `chara` 当 chunk type 而非 tEXt keyword）。**报失败先查根因，别急着改产物。**

### 本机工具链已知坑（Windows PowerShell 5.1）

| 坑 | 修法 |
|---|---|
| 5.1 对无 BOM 的 UTF-8 `.ps1` 按 GBK 解码 → 中文乱 | 脚本存 **UTF-8 with BOM** |
| 本机脚本执行被禁用 | `-ExecutionPolicy Bypass` |
| `New-Object Type(a, b)` 里逗号优先级高于减号 → `$W - $cut, 0` 变成“数字减数组” | 一律用 `[Type]::new(a, b)` |
| `pwsh` 不在 PATH | 工具壳跑的是 5.1，按 5.1 的规矩写 |

---

## 未完成 / 阻塞

| 项 | 状态 |
|---|---|
| **实机验证** | **阻塞**（本机未装 SillyTavern）。要验三件事：能否导入、卡内脚本是否加载、变量写入是否生效 |
| 指定预设 `MAT-011/012` | **未读**——卡增量 CoT 的挂接位置未定（DEC-012） |
| 卡面五人字牌 | **占位**，待头像立绘到位后替换 |
| “当前状态注入”机制 | **未定义**，不得凭推测写死 |
| `DEC-036` 人设与异能接合 | 未拍板（如花奈的“特效药断供”是否与异能有关） |
| `DEC-035` 极简状态栏 | 已被“完整版状态栏”取代（DEC-064 记录为范围变更） |
| 轻微遗留 | 面纱三处重复表述、新区通勤派生矛盾（已记录未改） |

---

## 下次怎么接上

1. 读本文件。
2. 读 `creative-authority.md` 的：front matter（含 `next_gate`）→ `Goal and exclusions` → `Confirmed` → `Open decisions` → `Acceptance ledger` → `Next gate`。
3. 读 `design-contract.md` 的 ③ 状态图与 ⑦ 离线验收清单。
4. 按 `next_gate` 继续；**不要重开已确认的决定**，除非主人改口或文件互相矛盾。

**当前 `next_gate`**：实机验证——导入 `output/但为君故·沉吟至今 v0.1.png`，验证能否导入、卡内脚本是否加载、变量写入是否生效。

**重建命令**（改源之后）：

```powershell
node tools/build-card.mjs                 # 组装（先加 --dry-run 只读校验）
powershell -ExecutionPolicy Bypass -File tools/make-face.ps1   # 卡面
node tools/embed-png.mjs                  # 打包 PNG
```

---

## 最后一句提醒

**成品卡已经存在**（`output/但为君故·沉吟至今 v0.1.png`，503 KB），但它**从未在真实 SillyTavern 里打开过**。离线校验只能证明结构与语义正确，**证明不了“导入后能用”**。

在主人装好酒馆、亲手导入并跑通“开局问卷 → 变量真的更新”之前，**任何“卡能用了”的说法都不成立**。
