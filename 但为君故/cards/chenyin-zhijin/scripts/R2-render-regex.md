# R2 · 渲染正则（隐藏变量更新块）

> 层：脚本层 / 卡内 `regex_scripts` ｜ 状态：**草案**
> 依据：`ST-A2` §7.1（字段结构）、§7.2（`placement` 枚举）、§11.4（`findRegex` 必须是含 `/flags` 的完整正则字符串）、§11.5（显示类正则的标准组合是 `markdownOnly: true` + `promptOnly: false` + `placement: [2]`）
> 写入位置：`data.extensions.regex_scripts`

---

## 条目标题 A · 隐藏整个变量更新块

```json
{
  "id": "danweijungu-r2a-hide-updatevariable",
  "scriptName": "[隐藏]变量更新块",
  "findRegex": "/<UpdateVariable>[\\s\\S]*?<\\/UpdateVariable>/gi",
  "replaceString": "",
  "trimStrings": [],
  "placement": [2],
  "disabled": false,
  "markdownOnly": true,
  "promptOnly": false,
  "runOnEdit": true,
  "substituteRegex": 0,
  "minDepth": null,
  "maxDepth": null
}
```

## 条目标题 B · 隐藏游离的 analysis 块（防御性）

```json
{
  "id": "danweijungu-r2b-hide-stray-analysis",
  "scriptName": "[隐藏]游离 analysis 块",
  "findRegex": "/<analysis>[\\s\\S]*?<\\/analysis>/gi",
  "replaceString": "",
  "trimStrings": [],
  "placement": [2],
  "disabled": false,
  "markdownOnly": true,
  "promptOnly": false,
  "runOnEdit": true,
  "substituteRegex": 0,
  "minDepth": null,
  "maxDepth": null
}
```

> **为什么要 B**：按输出格式要求，`<analysis>` 应当在 `<UpdateVariable>` 内部（A 已覆盖）。但模型偶尔会把它写到块外——B 是兜底，代价只有一条正则，没有副作用。

---

## 字段取值理由

| 字段 | 取值 | 理由 |
|---|---|---|
| `findRegex` | `/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi` | 必须写成带 `/flags` 的完整正则（`ST-A2` §11.4）；`i` 是必要的——MVU 自身的标签解析大小写不敏感，模型可能写 `updatevariable` |
| `placement` | `[2]` | `2 = AI_OUTPUT`：只处理 AI 输出，不动用户输入 |
| `markdownOnly` | `true` | **这是安全的关键**：只在 markdown 渲染层执行，**不影响送进模型的提示词** |
| `promptOnly` | `false` | 不在提示词组装时执行（若为 `true` 会把变量块从提示词里也删掉，可能破坏变量解析） |
| `replaceString` | `""` | 整段删掉，不保留占位 |
| `runOnEdit` | `true` | 用户编辑消息后重新渲染时也要隐藏 |
| `substituteRegex` | `0` | 默认安全值：不做宏替换（本正则不含 `{{char}}` 之类宏，用 1/2 反而可能破坏正则元字符） |
| `minDepth` / `maxDepth` | `null` | 不限楼层深度 |

---

## 与变量解析的关系（必须说清）

- MVU 是在**原始消息文本**上解析 `<UpdateVariable>` 的；本正则只作用于**渲染**，所以隐藏显示**不会**影响变量写入。
- 反过来说：如果谁把 `markdownOnly` 改成 `false`、或把 `promptOnly` 改成 `true`，就可能把变量块从模型侧抹掉，导致**变量系统静默失效**。修改本条目时必须重跑一次变量写入验证。

## 未验证项

1. 两条正则的实际执行顺序与叠加效果（预期：A 先删整块，B 无事可做）。
2. 在消息**编辑**与 **swipe**（重新生成）后的渲染路径中是否同样生效。
3. 与未来可能加入的状态栏正则（`DEC-035`）是否有执行冲突。
