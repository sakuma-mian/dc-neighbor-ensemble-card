// ============================================================================
// MVU 接线检测卡生成器 · 都市异能群像沙盒
// ============================================================================
//
// 【这个文件干什么】
// 把骨架里**真实的两份卡内脚本**，装进一张一次性的自包含角色卡，
// 用来在真实的 SillyTavern 里回答一个问题：
//   「MVU 这条链，到底通没通？」
//
// 【为什么需要它】
// 项目正文的卡还不存在，而 MVU 的行为**只有真机能验**。
// 与其等正式卡做完再发现接线错了，不如先拿一张空的检测卡把机制跑通。
// 之前所有关于 MVU 的结论都是静态推断（见 NEXT.md 开放风险第 1 条：
// 「全部未经真实环境验证」），这张卡就是把那一条变成证据的工具。
//
// 【它会重跑】
// 这是一只棘轮：以后每次改骨架（变量结构约束 / 变量更新规则 / 初始变量），
// 都重新生成一遍、再导入测一轮。接线退化了会立刻被看见。
//
// 【怎么跑】
//   node 骨架/生成检测卡.mjs
// 产出一个文件：
//   · MVU接线检测卡.json ← 在 SillyTavern 里"导入角色卡"
//
// 【它不含世界书，这是故意的】
// 世界书请单独导入 `骨架/但为君故V3.json`（44 条，含 [initvar] 与 [mvu_update]）。
// 理由有两个：
//   1. 那是项目真实的使用路径，用真路径测才有意义；
//   2. 卡内嵌世界书要经过一层字段名转换（key→keys / order→insertion_order ……），
//      多一层转换就多一个可能出错的地方——而这次要测的是 MVU，不是转换器。
//
// ⚠️ 导入后必须把世界书绑到这张卡上（在角色卡界面选 primary 世界书）。
//    MVU 只扫**卡绑定的**世界书，全局打开但没绑定的，它读不到。
// ============================================================================

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// 卡内正则从单一真源读（骨架/正则脚本.mjs），不在这里抄一份——正则是长期要改的东西
import { 正则列表 } from './正则脚本.mjs';

const 本目录 = dirname(fileURLToPath(import.meta.url));
const 读 = (文件名) => readFileSync(join(本目录, 文件名), 'utf8');

const 卡名 = 'MVU 接线检测';

// ---------------------------------------------------------------------------
// 卡内脚本：直接读骨架原件，不复制内容（避免两处不同步）
// ---------------------------------------------------------------------------
// 顺序有意义：加载器必须先跑，结构约束才能把 Schema 交给已经启动的 MVU。
const 脚本列表 = [
  {
    type: 'script',
    enabled: true,
    name: '① MVU 本体加载器',
    id: 'mvu-wire-check-loader',
    content: 读('mvu_加载器.js'),
    info: '拉取并启动 MVU 本体（MagicalAstrogy/MagVarUpdate）。必须排在结构约束之前。',
    button: { enabled: false, buttons: [] },
    data: {},
    export_with: { data: false, button: false },
  },
  {
    type: 'script',
    enabled: true,
    name: '② 变量结构约束',
    id: 'mvu-wire-check-schema',
    content: 读('变量结构约束.js'),
    info: '本项目真实的 Zod 变量结构（玩家／角色／世界三层）。原件在 骨架/变量结构约束.js。',
    button: { enabled: false, buttons: [] },
    data: {},
    export_with: { data: false, button: false },
  },
];

// ---------------------------------------------------------------------------
// 卡内正则
// ---------------------------------------------------------------------------
// 定义在 骨架/正则脚本.mjs（单一真源），这里只负责装进卡里。
// 顺序 = 执行顺序：完成态 → 流式态 → 提示词裁剪 → 占位符隐藏。

// ---------------------------------------------------------------------------
// 开场白：满足 MVU 的硬前置，同时逼出一次变量更新
// ---------------------------------------------------------------------------
// 两件事同时要办到：
//   1. 让聊天里"至少有一条消息"——没有消息时 MVU 直接拒绝初始化；
//   2. 给模型一个必然触及变量字段的场景（用能力 → 损耗与暴露会动）。
const 开场白 = [
  '【接线检测 · 第 1 轮】',
  '',
  '雨刚停。你站在南江市澜浦区一条旧巷的巷口，衣服半湿，身上没有证件、没有手机，也想不起半小时前自己在哪儿。',
  '',
  '巷子另一头传来一声闷响——像什么重物砸在铁皮上。紧接着，你的掌心开始发烫。',
  '',
  '——',
  '',
  '（这一张是 **MVU 接线检测卡**，不是正式剧情：世界书与变量结构都取自「但为君故V3」项目骨架，只有这段场景是临时的。照常扮演就好。',
  '**唯一的要求**：请在回复末尾按世界书里的规则输出 `<UpdateVariable>` 块，那是这次检测唯一要看的东西。）',
].join('\n');

// ---------------------------------------------------------------------------
// 组装
// ---------------------------------------------------------------------------
const 卡 = {
  name: 卡名,
  description:
    '一次性的接线检测卡，用来在真实 SillyTavern 里验证 MVU 变量链是否工作。世界书请单独导入「但为君故V3」并绑定到本卡。',
  personality: '（检测卡，无角色设定）',
  scenario: '南江市澜浦区的旧巷口，雨刚停。',
  first_mes: 开场白,
  mes_example: '',
  creatorcomment: '由 骨架/生成检测卡.mjs 自动生成 · 改骨架后重新生成即可',
  avatar: 'none',
  talkativeness: '0.5',
  fav: false,
  tags: ['MVU', '接线检测', '自检'],
  spec: 'chara_card_v3',
  spec_version: '3.0',
  create_date: new Date().toISOString().slice(0, 10),
  data: {
    name: 卡名,
    description:
      '一次性的接线检测卡，用来在真实 SillyTavern 里验证 MVU 变量链是否工作。世界书请单独导入「但为君故V3」并绑定到本卡。',
    personality: '（检测卡，无角色设定）',
    scenario: '南江市澜浦区的旧巷口，雨刚停。',
    first_mes: 开场白,
    mes_example: '',
    creator_notes: [
      '【怎么用】',
      '1. 先导入世界书 骨架/但为君故V3.json；',
      '2. 再导入这张卡；',
      '3. 把「但为君故V3」绑成这张卡的 primary 世界书（MVU 只扫卡绑定的世界书）；',
      '4. 开一个新聊天，按 F12 看控制台——应出现 [MVU] 本体已加载 / 接口就绪 / 找到 1 条 [initvar]；',
      '5. 随手发一条消息，检查回复末尾有没有 <UpdateVariable> 块、变量有没有变化。',
      '',
      '【它不是正式卡】世界书与变量结构取自项目骨架，剧情是临时的。检测完可以删。',
    ].join('\n'),
    system_prompt: '',
    post_history_instructions: '',
    tags: ['MVU', '接线检测', '自检'],
    creator: '骨架/生成检测卡.mjs',
    character_version: '1.0',
    alternate_greetings: [],
    group_only_greetings: [],
    extensions: {
      talkativeness: '0.5',
      fav: false,
      world: '', // 故意留空：世界书由你手动绑定，免得卡去猜一个可能不存在的名字
      depth_prompt: { prompt: '', depth: 4, role: 'system' },
      regex_scripts: 正则列表,
      tavern_helper: { scripts: 脚本列表 },
    },
  },
};

writeFileSync(join(本目录, 'MVU接线检测卡.json'), JSON.stringify(卡, null, 2), 'utf8');

// ---------------------------------------------------------------------------
// 自检：生成完立刻验一遍，别把坏卡交出去
// ---------------------------------------------------------------------------
// 这些检查都是"离线能判"的部分。**它们证明不了 MVU 在真机上能跑**——
// 那必须真机跑一轮（见卡片 creator_notes 里的五步）。
// 它们只负责一件事：确保交出去的卡，结构上是对的。
const 自检问题 = [];

// ① 两个脚本的内容必须与骨架原件逐字一致（防止一不小心嵌进旧版本）
for (const 脚本 of 脚本列表) {
  const 原件 = 读(脚本.name.includes('加载器') ? 'mvu_加载器.js' : '变量结构约束.js');
  if (脚本.content !== 原件) 自检问题.push(`${脚本.name}：内容与骨架原件不一致`);
}

// ② findRegex 必须是能被解析的「/模式/标志」形式
const 拆正则 = (文本) => {
  const m = /^\/(.*)\/([gimsuy]*)$/s.exec(文本);
  return m ? new RegExp(m[1], m[2]) : null;
};
for (const 规则 of 正则列表) {
  if (!拆正则(规则.findRegex)) 自检问题.push(`${规则.scriptName}：findRegex 不是 /…/flags 形式`);
}

// ③ 三态纪律：每条正则必须「只开一边」。
//    双开（markdownOnly + promptOnly）是 A6 §4 明确标注的未验证区，
//    星月／交错两张生产卡里一条都没有；两个都不开则会**永久改写消息数据**，
//    变量块再也无法重放。这条纪律靠人记不住，所以交给机器拦。
for (const 规则 of 正则列表) {
  if (规则.markdownOnly && 规则.promptOnly) {
    自检问题.push(`${规则.scriptName}：markdownOnly 与 promptOnly 双开（未验证区）`);
  }
  if (!规则.markdownOnly && !规则.promptOnly) {
    自检问题.push(`${规则.scriptName}：两个都不开 —— 会永久改写消息数据，变量块将无法重放`);
  }
}

// ④ 拿真实样例把关键正则跑一遍 —— 光看字段名不算数。
//    按 id 查找而不是按下标，免得以后往列表里插一条就全线错位。
const 按ID = (id) => 正则列表.find((r) => r.id === id);
const 完整块 = '<UpdateVariable>\n<analysis>本轮无状态变化</analysis>\n<JSONPatch>[]</JSONPatch>\n</UpdateVariable>';
const 未闭合块 = '<UpdateVariable>\n<analysis>写到一半就断了';

// --- 变量块 · 完成态 ---
const 完成态 = 按ID('urban-esper-varblock-done');
if (!完成态) {
  自检问题.push('缺少「变量块 · 完成态」正则');
} else {
  const 结果 = `正文。\n${完整块}\n`.replace(拆正则(完成态.findRegex), 完成态.replaceString);
  if (!结果.startsWith('正文。')) 自检问题.push('完成态正则啃到了正文');
  if (结果.includes('<UpdateVariable>')) {
    自检问题.push('完成态正则没把 <UpdateVariable> 消费掉（裸标签进 showdown 会触发 #3996 版面爆炸）');
  }
  if (!结果.includes('状态记录')) 自检问题.push('完成态正则没有输出面板 HTML');
}

// --- 变量块 · 流式态（负向前瞻：只认未闭合的） ---
const 流式态 = 按ID('urban-esper-varblock-streaming');
if (!流式态) {
  自检问题.push('缺少「变量块 · 流式态」正则');
} else {
  const 规则流式 = 拆正则(流式态.findRegex);
  if (!未闭合块.match(规则流式)) 自检问题.push('流式态正则没能认领未闭合的变量块');
  if (完整块.match(规则流式)) 自检问题.push('流式态正则误伤了已闭合的变量块（负向前瞻失效）');
}

// --- 正文对话块：必须吃掉 <d> 标签，同时留住说话人和内容 ---
const 对话块 = 按ID('urban-esper-dialog-display');
if (!对话块) {
  自检问题.push('缺少「正文对话块」正则');
} else {
  const 规则对话 = 拆正则(对话块.findRegex);
  const 结果 = '她合上账本。<d s="花奈">你找谁？</d>'.replace(规则对话, 对话块.replaceString);
  if (/<d\b/i.test(结果)) 自检问题.push('对话块正则没消费掉 <d> 标签（会进 showdown 触发 #3996）');
  if (!结果.includes('espd')) 自检问题.push('对话块正则没输出对话块 HTML');
  if (!结果.includes('花奈')) 自检问题.push('对话块正则丢了说话人名字');
  if (!结果.includes('你找谁？')) 自检问题.push('对话块正则丢了对话内容');
  if (!`<d s='花奈'>甲</d>`.match(规则对话)) 自检问题.push('对话块正则容错不足：单引号写法认不出来');
}

// --- 正文对话块 · 兜底：顺序必须对，且不能误伤普通标签 ---
const 兜底规则 = 按ID('urban-esper-dialog-fallback');
if (!兜底规则) {
  自检问题.push('缺少「正文对话块 · 兜底」正则');
} else {
  const i对话 = 正则列表.findIndex((r) => r.id === 'urban-esper-dialog-display');
  const i兜底 = 正则列表.findIndex((r) => r.id === 'urban-esper-dialog-fallback');
  if (i兜底 !== i对话 + 1) {
    自检问题.push('「对话块兜底」没有紧跟「对话块」——顺序错了会先把对话标记抹干净');
  }
  const 规则兜底 = 拆正则(兜底规则.findRegex);
  if (!'<d s=花奈>你好'.match(规则兜底)) 自检问题.push('兜底正则认不出畸形标签残骸');
  if (!'</d>'.match(规则兜底)) 自检问题.push('兜底正则认不出孤立的闭合标签');
  if ('<div class="x">正文</div>'.match(规则兜底)) 自检问题.push('兜底正则误伤了普通 <div>（词边界失效）');
  if ('<dialog open>'.match(规则兜底)) 自检问题.push('兜底正则误伤了 <dialog>');
}

// --- 变量块 · 提示词裁剪：要匹配得到、要落在送模层、要带深度过滤 ---
const 裁剪 = 按ID('urban-esper-varblock-prompt-trim');
if (!裁剪) {
  自检问题.push('缺少「变量块 · 旧楼层不进提示词」正则');
} else {
  if (!完整块.match(拆正则(裁剪.findRegex))) 自检问题.push('提示词裁剪正则匹配不到变量块');
  if (裁剪.markdownOnly || !裁剪.promptOnly) 自检问题.push('提示词裁剪正则没有落在送模层');
  if (typeof 裁剪.minDepth !== 'number') {
    自检问题.push('提示词裁剪正则没设 minDepth —— 一刀全裁会让模型慢慢忘掉输出格式');
  }
}

// ⑤ 世界书里必须真的有 [initvar] 条目 —— 复刻 MVU 本体源码里的认领规则
//    （comment 转小写后包含 '[initvar]'；关闭状态也读得到）
//    这一条是 2026-09-18 那次"变量链断了"的直接回归测试。
let 初始变量条数 = null;
try {
  const 世界书 = JSON.parse(读('但为君故V3.json'));
  const 全部 = Object.values(世界书.entries ?? {});
  初始变量条数 = 全部.filter((e) => (e.comment ?? '').toLowerCase().includes('[initvar]')).length;
  if (初始变量条数 === 0) 自检问题.push('但为君故V3.json 里找不到 [initvar] 条目 —— 变量表会是空的');
  if (全部.length === 0) 自检问题.push('但为君故V3.json 里没有条目 —— 先跑 node 骨架/生成世界书.mjs');
} catch (错误) {
  初始变量条数 = null;
  自检问题.push(`读不到 但为君故V3.json（先跑 node 骨架/生成世界书.mjs）：${错误.message}`);
}

console.log('✅ MVU接线检测卡.json 已生成');
console.log(`   卡内脚本 ${脚本列表.length} 个（${脚本列表.map((s) => s.name).join(' / ')}）`);
console.log(`   卡内正则 ${正则列表.length} 条`);
if (初始变量条数 !== null) console.log(`   世界书里的 [initvar] 条目：${初始变量条数} 条`);
else console.log('   世界书里的 [initvar] 条目：未检查');

if (自检问题.length) {
  console.log('');
  console.log(`❌ 自检没全过（${自检问题.length} 处）：`);
  自检问题.forEach((p) => console.log(`   · ${p}`));
  process.exitCode = 1;
} else {
  console.log('   自检：脚本一致性、三态纪律、关键正则实测行为、[initvar] 认领规则 —— 全过');
}
console.log('   ⚠️ 这不等于 MVU 在真机上能跑。导入酒馆跑一轮才算数。');
console.log('   ⚠️ 记得先导入 骨架/但为君故V3.json，再把它绑成这张卡的 primary 世界书。');
