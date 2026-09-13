# 脚本层 · 《但为君故 · 沉吟至今》

> 层：脚本层 ｜ 状态：**草案**
> 规范依据：`ST-B1`《变量更新规则》v1.0.0、`ST-A2`《角色卡格式规范》v1.0.0
> 对应设计契约：④ 运行时图（R1 / R1a / R2）

---

## 文件清单与职责边界

| 文件 | 组件 | 写入卡内位置 | 职责 |
|---|---|---|---|
| `R1-mvu-loader.js` | R1 装载脚本 | `data.extensions.tavern_helper.scripts` | **只**加载 MVU（MagVarUpdate）bundle + 注入生产默认设置 |
| `../schema/zod_schema.js` | R1a schema | 同上（独立脚本） | 自己 import `mvu_zod.js` 并 `registerMvuSchema(Schema)` |
| `R2-render-regex.md` | R2 渲染正则 | `data.extensions.regex_scripts` | 隐藏 `<UpdateVariable>` 与游离的 `<analysis>`（仅渲染层） |

### 为什么 R1 不加载 mvu_zod

`zod_schema.js` 需要 `mvu_zod.js` 提供的 `registerMvuSchema`，它**自己**会 import 那个模块（主/备镜像）。如果 R1 再加载一次同一模块，就存在**第二个 zod 实例**的风险——`ST-B1` §4.3 指出跨实例 `instanceof` 必失败、`parse` 会静默产出 `NaN`/`undefined`。

**职责划分**：R1 管 MVU 主程序，schema 脚本管自己那一个 helper。两者互不代劳。

---

## 执行顺序与依赖

```text
宿主：Tavern Helper（JS-Slash-Runner）——必须在宿主中安装或启用
        ↓
R1：加载 MVU bundle（testingcf 优先 → cdn.jsdelivr.net 备用）
        ↓
等待 Mvu 全局就绪（waitGlobalInitialized('Mvu')，取不到则轮询）
        ↓
R1：注入生产默认设置（reprocessVariables / rereadInitialVariables / retryExtraModelParse）
        ↓
zod_schema.js：import mvu_zod.js → $(() => registerMvuSchema(Schema))
        ↓
R2：渲染层隐藏变量块（不影响解析）
```

**玩家须知口径**（照依赖账本原文，不要写成“安装全部依赖”）：

- Tavern Helper：**需要在宿主中安装或启用**；
- MVU 主程序与 `mvu_zod.js`：**运行时从远程地址加载**；
- 世界书、变量规则、正则、卡内脚本：**已随卡封装，无需另行安装**。

---

## 卡内脚本字段结构（`ST-A2` §8）

两个 JS 脚本都写成同一结构，`content` 取各自文件内容：

```json
{
  "type": "script",
  "enabled": true,
  "name": "R1 · MVU 装载",
  "id": "danweijungu-r1-mvu-loader",
  "content": "<R1-mvu-loader.js 的全文>",
  "info": "加载 MVU 主程序并注入默认设置；缺失时明确报错，不静默降级。",
  "button": { "enabled": false, "buttons": [] },
  "data": {},
  "export_with": { "data": false, "button": false }
}
```

---

## 失败行为（契约 ④ 的落实）

| 情形 | 行为 |
|---|---|
| MVU 两个镜像都加载失败 | **明确报错**：控制台 + toastr 常驻提示“变量系统未启动”，**不静默降级** |
| MVU 已下载但等待就绪超时 | 同上，报“等待就绪超时” |
| 找不到 `settings` 入口 | **跳过并在日志中如实写明“已跳过（需实机核对）”**，不假装注入成功 |
| 渲染正则异常 | 只影响显示，不得破坏变量解析（见 `R2-render-regex.md` 的取值理由） |

---

## 未验证项（必须在真实 SillyTavern 中确认）

1. 两条镜像在本机网络下哪一条可用；
2. `waitGlobalInitialized` 在当前酒馆助手版本中是否存在（`ST-B1` §5.5 称其为本地实战做法）；
3. `Mvu.settings` 是否为注入默认设置的正确入口——`ST-B1` §7.2 只给了 `applyMvuDefaults(Mvu)` 的调用形式，**未给实现**，本脚本按防御式写法处理；
4. 卡内脚本与卡内嵌世界书的加载先后；
5. R2 两条正则的实际叠加效果；
6. 变量写入端到端是否真的成功（这是**唯一能证明整套系统可用**的证据）。

> **以上六项在本机安装酒馆之前全部为未验证状态**（`DEC-034`）。本层不宣称任何可用性。
