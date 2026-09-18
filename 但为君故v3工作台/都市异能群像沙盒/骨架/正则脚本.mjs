// ============================================================================
// 正则脚本源 · 都市异能群像沙盒
// ============================================================================
//
// 【这个文件干什么】
// 这是**卡内正则**的唯一真源。生成器（生成检测卡.mjs、将来组装正式卡的脚本）
// 都从这里读，不各自抄一份。
//
// 【为什么正则不是"可选的美化"】
// 这条很容易被误解，所以写在最前面：
//
//   酒馆的自定义 XML 标签有一个**已知爆炸 bug**（GitHub Issue #3996）。
//   成因三层叠加：Showdown 的 simpleLineBreaks 把标签内的换行转成 <br>，
//   DOMPurify 又把没声明过的自定义标签当 HTMLUnknownElement 再转一次，
//   Chromium 136+ 解析更严格 → 双份 <br> 堆叠，**版面直接崩**。
//
//   而模型每一轮都会输出 `<UpdateVariable>` —— 它正是一个自定义标签。
//   所以「用正则抢在 showdown 之前把自定义标签消费掉」不是美化选项，
//   是**防止版面爆炸的必要手段**（星月卡的实战解法）。
//
// 【三条施工纪律（全部来自生产卡实证，不是推导）】
//
// 1. **显示层和送模层必须分开写**，各管一边：
//      显示层  markdownOnly:true,  promptOnly:false
//      送模层  markdownOnly:false, promptOnly:true
//    不要写 `markdownOnly:true, promptOnly:true` 的双开——A6 §4 把双开标为
//    "medium·推导未验证"，星月／交错两张生产卡里**一条双开的正则都没有**。
//
// 2. **两条路径都不修改消息数据。** 变量块留在原始消息里，重 Roll 时
//    `reprocessVariables` 才有东西可重放。正则是只读的滤镜，不是编辑器。
//
// 3. **样式只用 `<style>` 块 + class**，不依赖内联 `style=`。
//    `<style>` 能穿越 DOMPurify（encode/decode 保护）；内联 style 是版本敏感项。
//    另外：ST 会给每个 class 加 `custom-` 前缀，但 `<style>` 里的选择器会被
//    CSS AST **同步改写**成同样的名字，两边自动对齐——所以照常写 `.foo` 就行，
//    **但绝不要在 JS 里用 `.querySelector('.foo')`**，那个名字在 DOM 里是 `custom-foo`。
//
// 【执行顺序】
// 酒馆按「Global → Scoped → Preset」链式执行，同类型内按数组顺序。
// 本文件里数组的顺序就是执行顺序，改动前先想清楚依赖关系。
// ============================================================================

// ---------------------------------------------------------------------------
// 变量块 · 本轮说明 / 补丁段（显示层）
// ---------------------------------------------------------------------------
// 【为什么必须单独立这两条 —— 这是实测抓出来的真实缺陷】
// 变量块里还套着 <analysis> 和 <JSONPatch> 两个自定义标签。如果只把外层
// <UpdateVariable> 换成面板、内层标签原样留着，那两个标签就**裸着进了 showdown**
// —— 正好踩中 Issue #3996：HTMLUnknownElement + simpleLineBreaks 把换行双转成
// <br>，版面直接崩掉。这不是推测，是 2026-09-18 被 骨架/验证正则.mjs 当场抓到的。
//
// 处理方式：把标签换成带语义的块（本轮说明／补丁），既消掉标签，又让面板更好读。
// 这两条必须排在「完成态」**之前**：先把内部结构规范化，再包外壳。
//
// 正则说明：`json_?patch` 兼容 `<JSONPatch>` 与 `<json_patch>` 两种写法
// （MVU 本体自己的解析正则就是 `json_?patch`），`i` 标志兜住大小写。
const 变量块说明段 = {
  id: 'urban-esper-varblock-analysis',
  scriptName: '[MVU] 状态记录 · 本轮说明',
  findRegex: String.raw`/<analysis>\s*([\s\S]*?)\s*<\/analysis>/gi`,
  replaceString: `<div class="mvud-a">$1</div>`,
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: true,
  promptOnly: false,
  runOnEdit: false,
  substituteRegex: 0,
  minDepth: 0,
  maxDepth: null,
};

const 变量块补丁段 = {
  id: 'urban-esper-varblock-patch',
  scriptName: '[MVU] 状态记录 · 补丁',
  findRegex: String.raw`/<json_?patch>\s*([\s\S]*?)\s*<\/json_?patch>/gi`,
  replaceString: `<div class="mvud-j">$1</div>`,
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: true,
  promptOnly: false,
  runOnEdit: false,
  substituteRegex: 0,
  minDepth: 0,
  maxDepth: null,
};

// ---------------------------------------------------------------------------
// 变量块 · 完成态（显示层）
// ---------------------------------------------------------------------------
// 把完整的 <UpdateVariable>…</UpdateVariable> 换成一块**可展开的折叠面板**：
// 默认收起，不抢正文的戏；玩家想核对自己这一轮的状态怎么变的，点开就能看。
//
// 为什么不是"直接藏掉"：这张卡把变量当成玩家的**档案**（代号、身份记录、
// 谁欠你一次），藏起来等于剥夺玩家核对的权利；而且模型偶尔写错变量时，
// 玩家能第一时间看见——这比事后读档便宜得多。
//
// 正则说明：
//   <UpdateVariable(?:variable)?> 同时吞掉 `<UpdateVariable>` 与
//   `<UpdateVariablevariable>` 两种写法（后者是 MVU 自己兼容的变体）。
//   `[\s\S]*?` 用惰性匹配，避免跨块把后文一起吃掉。
const 变量块完成态 = {
  id: 'urban-esper-varblock-done',
  scriptName: '[MVU] 状态记录 · 完成',
  findRegex: String.raw`/<UpdateVariable(?:variable)?>\s*([\s\S]*?)\s*<\/UpdateVariable(?:variable)?>/gi`,
  replaceString: `<details class="mvud"><summary><span class="mvud-k">状态记录</span><span class="mvud-s">本轮已同步</span></summary><div class="mvud-b">$1</div></details><style>
.mvud{margin:10px 0;border:1px solid #2e3a3f;border-left:3px solid #5b8a8f;border-radius:2px;background:#12181b;font-size:12.5px;line-height:1.6;color:#9fb0b3}
.mvud>summary{cursor:pointer;padding:6px 11px;letter-spacing:.06em;color:#7f9397;list-style:none;user-select:none}
.mvud>summary::-webkit-details-marker{display:none}
.mvud>summary::before{content:'▸';margin-right:7px;color:#5b8a8f}
.mvud[open]>summary::before{content:'▾'}
.mvud-k{color:#a8bcbf}
.mvud-s{float:right;color:#5b8a8f;font-size:11.5px}
.mvud-b{padding:6px 12px 11px;border-top:1px solid #23302f;white-space:pre-wrap;word-break:break-word;color:#8ea0a3;max-height:260px;overflow-y:auto}
.mvud-a{color:#9fb0b3}
.mvud-j{margin-top:6px;padding-top:6px;border-top:1px solid #23302f;font-family:Consolas,Menlo,monospace;font-size:11.5px;color:#7f9397;word-break:break-all}
</style>`,
  trimStrings: [],
  placement: [2], // 2 = AI 输出
  disabled: false,
  markdownOnly: true, // 只改显示
  promptOnly: false,
  runOnEdit: false,
  substituteRegex: 0,
  minDepth: 0, // 0 = 对所有楼层生效（含 Continue 追加的消息）
  maxDepth: null,
};

// ---------------------------------------------------------------------------
// 变量块 · 流式态（显示层）
// ---------------------------------------------------------------------------
// 流式生成时 `<UpdateVariable>` 还**没有闭合**，上一条正则匹配不到它，
// 于是玩家会在生成过程中看到一坨原始 XML 往外冒。这条专门认领那个中间态。
//
// 正则说明：核心是负向前瞻 `(?![\s\S]*<\/UpdateVariable>)` ——
// 只有当后面**找不到**闭合标签时才匹配，所以它绝不会误伤已经生成的完整块。
// 匹配到的半截内容直接丢弃（流式期显示半截 JSON 只会让人心慌），
// 只留一行"写入中"。
//
// ⚠️ 它必须排在完成态**之后**：让完整块先被上一条消费掉，这条只捡剩下的。
const 变量块流式态 = {
  id: 'urban-esper-varblock-streaming',
  scriptName: '[MVU] 状态记录 · 写入中',
  findRegex: String.raw`/<UpdateVariable(?:variable)?>(?![\s\S]*<\/UpdateVariable(?:variable)?>)\s*[\s\S]*$/gi`,
  replaceString: `<div class="mvuw"><span class="mvuw-d"></span>状态记录 · 写入中</div><style>
.mvuw{margin:10px 0;padding:7px 12px;border:1px dashed #2e3a3f;border-left:3px solid #5b8a8f;border-radius:2px;background:#12181b;font-size:12.5px;letter-spacing:.06em;color:#7f9397}
.mvuw-d{display:inline-block;width:6px;height:6px;margin-right:8px;vertical-align:middle;border-radius:50%;background:#5b8a8f;animation:mvuw-pulse 1.1s ease-in-out infinite}
@keyframes mvuw-pulse{0%,100%{opacity:.22}50%{opacity:1}}
</style>`,
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: true,
  promptOnly: false,
  runOnEdit: false,
  substituteRegex: 0,
  minDepth: 0,
  maxDepth: null,
};

// ---------------------------------------------------------------------------
// 变量块 · 杂标签兜底（显示层）
// ---------------------------------------------------------------------------
// 上面几条已经把标准写法的标签都消费掉了。但模型偶尔会多写点东西——
// `<reasoning>`、`<thinking>`、写重了的 `<analysis>`……
// **任何一个漏网的都足以让版面崩掉**，所以这里按名单再扫一遍，只抹标签、留文字。
//
// 为什么用"名单"而不是"清掉所有非白名单标签"：后者会误吞正文里合法的 HTML。
// 名单是有界的、看得懂的；宁可漏掉一个没见过的新标签（那种情况
// 骨架/验证正则.mjs 会报警，我们再把它加进名单），也不要误伤正文。
const 变量块杂标签兜底 = {
  id: 'urban-esper-varblock-fallback',
  scriptName: '[MVU] 状态记录 · 杂标签兜底',
  findRegex: String.raw`/<\/?(?:analysis|json_?patch|reasoning|thinking|thought|update_?variable(?:variable)?)\b[^>]*>/gi`,
  replaceString: '',
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: true,
  promptOnly: false,
  runOnEdit: false,
  substituteRegex: 0,
  minDepth: 0,
  maxDepth: null,
};

// ---------------------------------------------------------------------------
// 正文对话块 · 显示层（驾驶员 2026-09-18 选定的「乙」案）
// ---------------------------------------------------------------------------
// 模型把**说出口的话**用 `<d s="称呼">…</d>` 包起来，这条把它渲染成对话块。
// 群像卡最需要的就是"一眼看出这句话谁说的"——叙述、动作、神态都留在标记外面。
//
// 格式纪律写在世界书条目 `[常驻] 正文格式 · 对话标记` 里，两边要一起改。
//
// 正则说明：
//   `s\s*=\s*["']([^"']+)["']` 容错两种引号和多余空格——
//   模型写 `<d s='花奈'>` 或 `<d s = "花奈">` 都能认。
//   `([\s\S]*?)` 惰性捕获对话内容，避免把后面几段对话一起吞掉。
//
// 样式说明（为什么这么素）：正文是主体，**不能抢主题的戏**。
//   所以这里刻意不设文字颜色——文字继承酒馆当前主题；
//   只用半透明的青灰底和左侧竖线做区分，浅色主题和深色主题下都成立。
//   这跟上面状态记录面板用「深底浅字」是两种策略：面板是外挂组件，自洽即可；
//   对话块长在正文里，必须随主题。
//
// ⚠️ 说话人那行（.espd-n）为什么是 currentColor + opacity，而不是固定的青灰：
//   算过对比度。固定色 rgba(128,150,155,1) 在白底上只有 **3.1:1**，
//   低于小字可读线 4.5:1；而它同一个值在深底上又偏暗。
//   **一个固定颜色不可能同时满足白底和深底**（数学上矛盾），
//   所以必须跟随主题色，用 opacity 拉开层次：.85 在白底上约 4.8:1，达标。
//   青灰只留在左边框和底色上——它俩是非文字元素，3:1 即可。
const 正文对话块 = {
  id: 'urban-esper-dialog-display',
  scriptName: '[正文] 对话块',
  findRegex: String.raw`/<d\s+s\s*=\s*["']([^"']+)["']\s*>([\s\S]*?)<\/d>/gi`,
  replaceString: `<div class="espd"><span class="espd-n">$1</span><span class="espd-t">$2</span></div><style>
.espd{margin:9px 0;padding:3px 0 3px 13px;border-left:2px solid rgba(128,150,155,.55);border-radius:0 2px 2px 0;background:rgba(128,150,155,.075);line-height:1.8}
.espd-n{display:block;margin-bottom:1px;font-size:11.5px;letter-spacing:.16em;color:currentColor;opacity:.85}
.espd-t{display:block}
</style>`,
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: true,
  promptOnly: false,
  runOnEdit: false,
  substituteRegex: 0,
  minDepth: null,
  maxDepth: null,
};

// ---------------------------------------------------------------------------
// 正文对话块 · 兜底（显示层）
// ---------------------------------------------------------------------------
// 【这条是安全网，不是装饰，删之前先读这段】
//
// 上一条只认标准写法。模型总有写歪的时候：少个引号、属性名拼错、
// 忘了闭合、嵌套一半……**任何一个没被上一条吃掉的 `<d …>` 残骸，
// 都会以自定义标签的身份进入 showdown**，进而触发 Issue #3996 的
// `<br>` 爆炸 bug —— 版面不是"难看"，是**直接崩掉**。
//
// 所以这条专门扫尾：把活下来的 `<d …>` / `</d>` 直接抹掉，只留文字内容。
// 代价是偶尔损失一个标记；收益是版面永远不崩。
// 它**必须排在上一条之后**——顺序反了会先把所有对话标记抹干净。
const 正文对话块兜底 = {
  id: 'urban-esper-dialog-fallback',
  scriptName: '[正文] 对话块 · 兜底清残骸',
  // `\b` 是词边界，所以 `<div>`、`<dialog>` 这类不会被误伤
  findRegex: String.raw`/<\/?d\b[^>]*>/gi`,
  replaceString: '',
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: true,
  promptOnly: false,
  runOnEdit: false,
  substituteRegex: 0,
  minDepth: null,
  maxDepth: null,
};

// ---------------------------------------------------------------------------
// 变量块 · 旧楼层不进提示词（送模层）
// ---------------------------------------------------------------------------
// 变量块是提示词里最占地方的东西之一：每轮一段 JSONPatch，聊到一百楼就是一百段。
// 这条把它们从**发给模型的历史**里裁掉，但保留最近 6 楼——
//
//   为什么留最近的：模型需要看见"变量块长什么样"作为格式示范。
//   一刀全裁会让它慢慢忘记输出格式，得不偿失。
//   minDepth 的语义是"深度 ≥ 6 的才执行"，深度 0 是最新一楼，
//   所以实际效果 = 最近 6 楼保留、更旧的裁掉。这个参数抄自交错宙域生产卡。
//
// ⚠️ markdownOnly 必须为 false：这条只走送模路径，**玩家界面完全看不到它发生**。
const 变量块提示词裁剪 = {
  id: 'urban-esper-varblock-prompt-trim',
  scriptName: '[MVU] 变量块 · 旧楼层不进提示词',
  findRegex: String.raw`/<UpdateVariable(?:variable)?>[\s\S]*?<\/UpdateVariable(?:variable)?>/gi`,
  replaceString: '',
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: false,
  promptOnly: true, // 只改发给模型的内容
  runOnEdit: true, // 编辑消息后要重算
  substituteRegex: 0,
  minDepth: 6, // 只裁第 6 楼及更旧的
  maxDepth: null,
};

// ---------------------------------------------------------------------------
// 状态栏占位符 · 不进提示词（送模层）
// ---------------------------------------------------------------------------
// 状态栏将来会把 `<StatusPlaceHolderImpl/>` 插进消息里当挂载点。
// 那是给前端看的，纯粹占提示词的位置，所以对模型隐掉。
//
// 检测卡暂时还没有状态栏，这条匹配不到东西——留着是为了让 MVU 的配套
// 在这一层就是齐的，等状态栏做起来不用回头补。
const 占位符不进提示词 = {
  id: 'urban-esper-placeholder-hide',
  scriptName: '[MVU] 状态栏占位符 · 不进提示词',
  findRegex: String.raw`/<StatusPlaceHolderImpl\s*\/>/g`,
  replaceString: '',
  trimStrings: [],
  placement: [2],
  disabled: false,
  markdownOnly: false,
  promptOnly: true,
  runOnEdit: false,
  substituteRegex: 0,
  minDepth: null,
  maxDepth: null,
};

// ---------------------------------------------------------------------------
// 导出
// ---------------------------------------------------------------------------
// 顺序 = 执行顺序（同类型内按数组顺序链式执行）。改顺序前先读上面的注释。
//
// ⚠️ 两条正文正则的先后**不能换**：先由标准那条把 `<d s="…">` 渲染成对话块，
//    再由兜底那条扫掉剩下的残骸。反过来的话，会先把所有对话标记抹成白字。
export const 正则列表 = [
  // —— 显示层：只影响你眼睛看到的 ——
  变量块说明段, // 必须排在完成态之前：先规范化内部，再包外壳
  变量块补丁段,
  变量块完成态,
  变量块流式态,
  变量块杂标签兜底,
  正文对话块,
  正文对话块兜底, // 必须紧跟正文对话块之后
  // —— 送模层：只影响发给模型的内容 ——
  变量块提示词裁剪,
  占位符不进提示词,
];
