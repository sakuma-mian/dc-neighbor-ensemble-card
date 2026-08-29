/*!
 * 《在DC频道里口嗨的群友就住我隔壁？！》组装器 build_card.mjs
 * 输入：lorebooks/ 六层词条源、变量/ 四件套、frontend/排版设计/ 前端三件、组装/scripts/ 新脚本、输出/_build/ 降采样图
 * 输出：输出/ 成品卡 JSON + PNG（chara/ccv3 块）+ manifest
 * 契约：creative-authority.md DEC-001..036；ACC-005 离线校验内嵌为断言。
 * 运行：node 组装/build_card.mjs
 */
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '输出');
const BUILD = join(OUT, '_build');
const ERR = [];
const OK = [];
function assert(cond, msg) { if (cond) OK.push(msg); else ERR.push(msg); }

// ─────────────────────────── 词条内容提取 ───────────────────────────
function readText(p) { return readFileSync(p, 'utf8').replace(/^\uFEFF/, ''); }
function between(text, startMark, endMark) {
  const i = text.indexOf(startMark);
  if (i < 0) throw new Error(`找不到起始标记：${startMark}`);
  const body = text.slice(i + startMark.length);
  const j = endMark ? body.indexOf(endMark) : -1;
  const seg = j >= 0 ? body.slice(0, j) : body;
  return seg.replace(/^\s*\n/, '').replace(/\n\s*$/, '');
}

function extractInjection(mdPath, endMark) {          // G0 / C0-C5 / U0-U5
  const md = readText(mdPath);
  return between(md, '## 注入正文（content）', endMark || '## 溯源');
}
function extractProtocolContent(mdPath) {    // N0-N4
  const md = readText(mdPath);
  return between(md, '**content：**', '## 溯源');
}
function extractCharacterEntries(mdPath) {   // P1-P5：主词条 + 秘密词条
  const md = readText(mdPath);
  const main = between(md, '**content：**', '## 秘密词条');
  const secBlock = between(md, '## 秘密词条', '## 溯源');
  const secrets = [];
  const re = /\*\*(ENT-[A-Z]+\d+)\s*｜\s*order\s*(\d+)\s*｜\s*事实\s*([A-Z]\.[^\s｜]+)\s*｜[^\n]*\*\*\s*\ncontent：([\s\S]*?)(?=\n\*\*ENT-|\n## |$)/g;
  let m;
  while ((m = re.exec(secBlock)) !== null) {
    secrets.push({ entryId: m[1], order: Number(m[2]), factId: m[3].trim(), content: m[4].replace(/^\n/, '').replace(/\n\s*$/, '') });
  }
  return { main, secrets };
}

const L = (...p) => join(ROOT, 'lorebooks', ...p);
const entries = [];   // {id, comment, keys, constant, position(0/1), order, enabled, content, recursion:{prevent, exclude}}
let eid = 0;
function addEntry(e) {
  e.id = eid++;
  e.secondary_keys = [];
  e.selective = !e.constant;
  entries.push(e);
}

// 协议层 ENT-050..054（order 210..206，position 0；N4 默认关闭由 R2 接管）
const protocolMeta = [
  ['N0-状态对齐.md', '[mvu_plot]协议层·状态对齐', 210, true],
  ['N1-INC1保密纪律.md', '[mvu_plot]协议层·INC-1保密纪律', 209, true],
  ['N2-INC2群像调度.md', '[mvu_plot]协议层·INC-2群像调度', 208, true],
  ['N3-INC3初遇路由.md', '[mvu_plot]协议层·INC-3初遇路由', 207, true],
  ['N4-MOD条件模块.md', '[mvu_plot]协议层·MOD条件模块', 206, false], // disable 默认 true（R2 翻开关）
];
for (const [file, comment, order, enabled] of protocolMeta) {
  addEntry({ comment, keys: [], constant: true, position: 0, order, enabled, content: extractProtocolContent(L('协议层', file)), prevent: true, exclude: true });
}

// 起源层 ENT-001
addEntry({
  comment: '[mvu_plot]起源层·Discord群像·但为君故', keys: [], constant: true, position: 0, order: 205, enabled: true,
  content: extractInjection(L('起源层', 'G0-Discord群像起源.md'), '## 说明'), prevent: true, exclude: false,
});


// 城市层 ENT-002 / 003A..003E
const cityMeta = [
  ['C0-南江市总纲.md', '[mvu_plot]城市层·南江市总纲', 200, true, [], true, false],
  ['C1-市中心江南区.md', '[mvu_plot]城市层·城区·市中心江南区', 195, false, ['江南', '江湾', 'CBD', '金融环', '科创走廊', '概念验证', '夜话会', '歌剧院', '江上明珠', '双年展', '艺术季', '江湾壹号', '金融家公寓', '老码头公寓', '国际会议中心', '当代艺术博物馆'], false, true],
  ['C2-市中心江北区.md', '[mvu_plot]城市层·城区·市中心江北区', 194, false, ['江北', '大学城', '南江大学', '南江理工', '奥体中心', '人民大道', '市政府', '人民医院', '国际医学中心', '儿童医学中心', '学区', '筒子楼', '湿地公园', '清风绿道', '文化走廊', '老字号'], false, true],
  ['C3-月石区.md', '[mvu_plot]城市层·城区·月石区', 193, false, ['月石', '深水港', '港区', '集装箱码头', '岸桥', '跨运车', '产业园', '晶圆厂', '面板', '大飞机', 'C9X', '总装', '试飞跑道', '倒班宿舍', '园区食堂', '生活服务街', '月石快线', '产业大道', '发薪日'], false, true],
  ['C4-南江新区.md', '[mvu_plot]城市层·城区·南江新区', 192, false, ['新区', '旧港区', '夜市', '卧城', '通勤', '南江码', '新南江人', '同乡', '候鸟', '春节', '棋盘', '围填海', '月石快线'], false, true],
  ['C5-滨江人文带.md', '[mvu_plot]城市层·地点·滨江人文带', 191, false, ['滨江人文', '人文带', '石库门', '梧桐'], false, true],
];
for (const [file, comment, order, constant, keys, prevent, exclude] of cityMeta) {
  addEntry({ comment, keys, constant, position: 0, order, enabled: true, content: extractInjection(L('城市层', file)), prevent, exclude });
}

// 场所层 ENT-004 / 004A..004E
const uniMeta = [
  ['U0-南江大学总览.md', '[mvu_plot]场所层·南江大学·总览', 190, ['南江大学', '南大'], true],
  ['U1-世界树与主校区.md', '[mvu_plot]场所层·南江大学·世界树与主校区', 189, ['世界树', '智慧方庭', '树心', '铜钟', '钟声', '书签', '下沉广场', '架空层', '综合教学楼'], false],
  ['U2-校园生活.md', '[mvu_plot]场所层·南江大学·校园生活', 188, ['书院制', '宿舍', '四人间', '公共厨房', '研讨室', '食堂', '接驳车', '南江大学站'], false],
  ['U3-学院与学术模块.md', '[mvu_plot]场所层·南江大学·学院与学术模块', 187, ['文学院', '法学院', '哲学院', '理学院', '工学院', '医学院', '公共管理学院', '环境学院', '立法研究院', '司法研究中心', '城市文化研究所', '应用伦理', '模拟法庭', '学术模块', '树根浮雕'], false],
  ['U4-校地关系.md', '[mvu_plot]场所层·南江大学·校地关系', 186, ['智库', '红头文件', '立法评估', '一票否决', '学缘'], false],
  ['U5-学生文化.md', '[mvu_plot]场所层·南江大学·学生文化', 185, ['校训', '铸字', '辩论社', '法律援助协会', '徒步社', '三大社', '学术夜市', '开学典礼', '毕业典礼', '千禧钟', '千禧宝宝'], false],
];
for (const [file, comment, order, keys, prevent] of uniMeta) {
  addEntry({ comment, keys, constant: false, position: 0, order, enabled: true, content: extractInjection(L('场所层-南江大学', file)), prevent, exclude: !prevent });
}

// 角色层：主词条 ×5 + 秘密词条 ×21
const charMeta = [
  ['P1-藤原花奈.md', '藤原花奈', ['藤原花奈', '花奈', '佐久间眠'], 190, ['家史', '母亡', '药', '面具', '轨迹'], ['家史', '母亡', '药', '面具', '轨迹']],
  ['P2-顾清寒.md', '顾清寒', ['顾清寒', '清寒', '珍惜才配拥有'], 188, ['保护色', '霸凌', '善良', '独居'], ['保护色', '霸凌', '善良', '独居']],
  ['P3-鱼沉秋.md', '鱼沉秋', ['鱼沉秋', '沉秋', 'cojack', '猫猫头'], 186, ['背锅', '社恐度', '耳坠', '未放弃'], ['背锅', '社恐度', '耳坠', '未放弃']],
  ['P4-楚羽笙.md', '楚羽笙', ['楚羽笙', '楚楚的笙', '楚楚的笙_unofficial', '楚楚'], 184, ['父母', '安静', '草稿', '逃兵'], ['父母', '安静', '草稿', '剧本']],
  ['P5-诺薇拉.md', '诺薇拉', ['诺薇拉', '冯诺依曼'], 182, ['拖延', '才华', '家庭群', '延毕'], ['拖延', '才华', '家庭群', '延毕']],
];
const SECRET_FACTS = []; // {factId, entryName, order}
for (const [file, 短名, keys, mainOrder, factIds, entryNames] of charMeta) {
  const { main, secrets } = extractCharacterEntries(L('角色层', file));
  addEntry({
    comment: `[mvu_plot]角色层·${短名}·主词条`, keys, constant: false, position: 1, order: mainOrder, enabled: true,
    content: main, prevent: true, exclude: true,
  });
  assert(secrets.length === factIds.length, `${短名} 秘密词条数 ${secrets.length} === ${factIds.length}`);
  // 源稿秘密 order 连续递减（如 181..177）
  for (let i = 0; i < secrets.length; i++) {
    const s = secrets[i];
    assert(s.factId === `${短名 === '藤原花奈' ? 'H' : 短名 === '顾清寒' ? 'Q' : 短名 === '鱼沉秋' ? 'C' : 短名 === '楚羽笙' ? 'Y' : 'N'}.${factIds[i]}`,
      `${短名} 秘密${i + 1} 事实ID ${s.factId} === ${factIds[i]}`);
    addEntry({
      comment: `[mvu_plot]角色层·${短名}·秘密：${entryNames[i]}`, keys, constant: false, position: 1, order: s.order,
      enabled: false, // R2 门卫按迷雾状态翻转（DEC-010/025）
      content: s.content, prevent: true, exclude: true,
    });
    SECRET_FACTS.push({ factId: s.factId, entry: `角色层·${短名}·秘密：${entryNames[i]}`, order: s.order });
  }
}

// 变量层 4 条（内容按 变量/ 世界书 txt 原样照抄，DEC-024）
const V = (...p) => join(ROOT, '变量', '世界书', ...p);
const initvarContent = readText(V('[initvar] 初始.txt'));
addEntry({
  comment: '[initvar]初始', keys: [], constant: true, position: 0, order: 216, enabled: false,
  // MVU 框架读取 [initvar] 条目不要求 enabled（无 enabled 检查）；禁用避免原始 YAML 进提示词
  content: initvarContent, prevent: true, exclude: true,
});
addEntry({
  comment: '[mvu_update]变量更新规则', keys: [], constant: true, position: 0, order: 215, enabled: true,
  content: readText(V('[mvu_update]变量更新规则.txt')), prevent: true, exclude: true,
});
addEntry({
  comment: '[mvu_update]变量输出格式', keys: [], constant: true, position: 0, order: 214, enabled: true,
  content: readText(V('[mvu_update]变量输出格式.txt')), prevent: true, exclude: true,
});
addEntry({
  comment: '[mvu_update]变量列表', keys: [], constant: true, position: 0, order: 213, enabled: true,
  content: readText(V('变量列表.txt')), prevent: true, exclude: true,
});

// ─────────────────────────── 卡面文本 ───────────────────────────
const description = `【卡面·群像沙盒】现代都市南江市，2026年秋。Discord 频道「但为君故」人数众多、来来去去，当前活跃核心圈＝五名群友＋最新入群的主控（{{user}}）。{{user}} 就是 {{user}}；所有角色依世界书词条独立行动，本卡无原著。

【五名核心群友·线上公开面】（互不知晓现实身份）
· 佐久间眠——深夜树洞：爱自嘲、情感细腻、句子长
· 珍惜才配拥有——嘴炮担当：自称"黑道老大"，被笑"声音像初中生"必炸毛
· cojack——猫meme战神：自称"一线时尚设计师"，发露脸照、开语音，线下聚会鸽了无数次
· 楚楚的笙_unofficial——深夜攻击手：雌小鬼话术，爱聊恋爱与成人话题
· 冯诺依曼——考据党：冷吐槽与复读梗制造机，从不开麦、不发照（全群两大未解之谜之一）

【重迷雾】角色对他人现实身份与隐私的知晓严格以状态块迷雾表与世界书为准；未揭示事实不得出现于叙述、对话、内心与选项；线下相遇默认互不认出（识别引信见各主词条）。

【状态块】剧情侧每轮常驻收到 <status_current_variables>（只读参考，不要在正文复述）；回复末尾是否输出 <UpdateVariable> 由「协议层·状态对齐」条目裁定。`;

const personality = '';
const scenario = `南江市，2026年秋。{{user}} 刚加入 Discord 频道「但为君故」，成为活跃名单上的第六个 ID（最新）。五名群友就在这座城市里过着各自的生活——而 {{user}} 还不知道他们是谁、在哪里。`;

const mesExample = `<START>
{{user}}: 眠眠，话说你家到底住哪个区啊？上次说江北，具体哪儿呀？
{{char}}: （群里，佐久间眠的回复来得比平时慢了半拍。）
佐久间眠：江北很大诶，说了你们也不知道是哪条街啦。倒是你，刚来南江就问这么细，是要查户口吗～（她丢下一个"理直气壮"的表情，飞快把话头拐向新话题。）比起这个！昨晚是谁在游戏里送了十几个人头，自己站出来。
<START>
{{user}}: cojack 大设计师，周末线下聚一个呗，这都鸽了多少次了。
{{char}}: cojack：笑死，你们还想抓我啊？（她发来一张便利店冰柜的照片，配了一排弹幕。）
这不好笑，但我真的去不了。最近忙到起飞，甲方在追杀我，某种意义上来说的确该死。（话题被她熟练地按回群里，周末的事不了了之。）`;

const creatorNotes = `《在DC频道里口嗨的群友就住我隔壁？！》v1.0 —— MVU 变量卡 · 南江市群像沙盒

【导入即用清单】
1. SillyTavern ＋ 酒馆助手 JS-Slash-Runner（必需，≥4.8.4）：缺失时变量系统、迷雾门控、状态栏均不工作。
2. 导入本卡（JSON 或 PNG 等效）。卡内已封装：世界书 48 条（协议/起源/城市/场所/角色/变量六层）、酒馆助手脚本 4 件（MVU 加载器 / Zod schema / R2 迷雾门卫 / 雾青前端渲染）、正则 3 条。
3. 预设：配套《绘绘260821稳定版max·但为君故适配版v1.0》。载入后按协议层 README §6 核对档位（备忘关/NSFW 标准/龙族世界关/同人向关/台词匀/文风都市白描/防情感廉价开）。
4. 模型：剧情 Gemini 3.1 Pro ＋ 变量更新 Gemini 3.7 Flash（双模型）；单模型模式自动共享上下文，无需改卡。
5. 开新聊天 → 「创建你的身份」创角页 → 填写（DC 网名、年龄必填，年龄 18~99）→ 写入并开始。创角页是唯一变量写入口（DEC-036）。
6. 每轮 AI 楼层下方为雾青状态栏；右下角「◇」打开群像页（跳板/档案/揭晓态双头像位）。

【迷雾纪律】未揭示＝所有角色与叙述都不呈现；R2 门卫按迷雾表自动解锁秘密词条与 MOD 模块；手改变量可能破坏门控一致性。

【私域分享】本卡含创作者人设，仅限私域分享，不商用、不公开发布。`;

// ─────────────────────────── 脚本与正则 ───────────────────────────
const S = (...p) => join(ROOT, '变量', '脚本', ...p);
const mvuScript = JSON.parse(readText(S('酒馆助手脚本-MVU.json')));
const zodScript = JSON.parse(readText(S('酒馆助手脚本-ZOD.json')));

const r2Content = readText(join(ROOT, '组装', 'scripts', 'R2-迷雾门卫.js'));
let wuContent = readText(join(ROOT, '组装', 'scripts', '雾青渲染.js'));

// 头像/立绘 data URI 注入
const avatars = {}, lianis = {};
const imgPairs = [
  ['佐久间眠', '佐久间眠.jpg', '花奈.jpg'],
  ['珍惜才配拥有', '珍惜才配拥有.jpg', '清寒.jpg'],
  ['cojack', 'cojack.jpg', '沉秋.jpg'],
  ['楚楚的笙_unofficial', '楚楚的笙_unofficial.jpg', '楚羽笙.jpg'],
  ['冯诺依曼', '冯诺依曼.jpg', '诺薇拉.jpg'],
];
for (const [net, av, li] of imgPairs) {
  const avP = join(BUILD, av), liP = join(BUILD, li);
  assert(existsSync(avP), `头像已降采样 ${av}`); assert(existsSync(liP), `立绘已降采样 ${li}`);
  avatars[net] = 'data:image/jpeg;base64,' + readFileSync(avP).toString('base64');
  lianis[net] = 'data:image/jpeg;base64,' + readFileSync(liP).toString('base64');
}
wuContent = wuContent
  .replaceAll('__DJG_ASSETS_JSON__', JSON.stringify(avatars))
  .replaceAll('__DJG_LIANI_JSON__', JSON.stringify(lianis));
assert(!wuContent.includes('__DJG_'), '雾青渲染占位符全部替换');
assert(wuContent.includes('var AVATARS = {"佐久间眠"'), '雾青渲染 AVATARS 表已注入');
assert(wuContent.includes('var LIANIS = {"佐久间眠"'), '雾青渲染 LIANIS 表已注入');

const tavernHelperScripts = [
  mvuScript, zodScript,
  { type: 'script', enabled: true, name: 'R2迷雾门卫', id: 'a1b2c3d4-0001-4a5b-8c6d-202608290001', content: r2Content, info: '按 stat_data 迷雾/关系/任务 幂等推导世界书词条开关（DEC-010/025/033）', button: { enabled: false, buttons: [] }, data: {}, export_with: { data: true, button: false } },
  { type: 'script', enabled: true, name: '雾青前端渲染', id: 'a1b2c3d4-0002-4a5b-8c6d-202608290002', content: wuContent, info: '只读 stat_data → 雾青状态栏与群像 overlay（变量映射 v1.2）', button: { enabled: false, buttons: [] }, data: {}, export_with: { data: true, button: false } },
];

const regexScripts = [
  {
    id: 'd0c1e2f3-0001-4a5b-8c6d-202608290003', scriptName: 'R3·UpdateVariable·渲染隐藏',
    findRegex: '/<UpdateVariable>[\\s\\S]*?<\\/UpdateVariable>\\s*/g', replaceString: '',
    trimStrings: [], placement: [2], disabled: false, markdownOnly: true, promptOnly: false,
    runOnEdit: true, substituteRegex: 0, minDepth: null, maxDepth: null,
  },
  {
    id: 'd0c1e2f3-0002-4a5b-8c6d-202608290004', scriptName: 'R3·UpdateVariable·提示词剥离',
    findRegex: '/<UpdateVariable>[\\s\\S]*?<\\/UpdateVariable>\\s*/g', replaceString: '',
    trimStrings: [], placement: [2], disabled: false, markdownOnly: false, promptOnly: true,
    runOnEdit: true, substituteRegex: 0, minDepth: null, maxDepth: null,
  },
  {
    id: 'd0c1e2f3-0003-4a5b-8c6d-202608290005', scriptName: '雾青·content标签·显示隐藏（备用）',
    findRegex: '/<\\/?content>/g', replaceString: '',
    trimStrings: [], placement: [2], disabled: true, markdownOnly: true, promptOnly: false,
    runOnEdit: true, substituteRegex: 0, minDepth: null, maxDepth: null,
  },
];

// ─────────────────────────── 创角页 greeting ───────────────────────────
function buildGreeting() {
  let html = readText(join(ROOT, 'frontend', '排版设计', '开场白-创角页.html')).replace(/\r\n/g, '\n');
  const djgCreate = readText(join(ROOT, 'frontend', '排版设计', 'djg-create.js')).replace(/\r\n/g, '\n');

  // ① 背景城市剪影依赖本地原神素材：卡内剔除（纯 CSS 渐变+网格保留）
  html = html.replace(/\.cityline\{[^}]*\}\n?/, '');
  html = html.replace(/<div class="cityline"><\/div>\s*/, '');

  // ② 头像路径 → data URI
  html = html.replace("var AVATAR_DIR = '../assets/头像/';", 'var AVATAR_DIR = \'\';');
  const memRe = /\{ 网名: '([^']+)',\s*图: '([^']+)',\s*字: '(.)' \}/g;
  const avByGreetFile = {
    '佐久间眠头像.png': avatars['佐久间眠'],
    '珍惜才配拥有%20头像.png': avatars['珍惜才配拥有'],
    'cojack%20头像.png': avatars['cojack'],
    '楚楚的笙_unofficial%20头像.png': avatars['楚楚的笙_unofficial'],
    '冯诺依曼%20头像.png': avatars['冯诺依曼'],
  };
  html = html.replace(memRe, (_, net, file, ch) => {
    const uri = avByGreetFile[file];
    if (!uri) throw new Error(`开场白头像映射缺失：${file}`);
    return `{ 网名: '${net}', 图: '${uri}', 字: '${ch}' }`;
  });

  // ③ djg-create.js 内联
  html = html.replace('<script src="djg-create.js"></script>', `<script>\n${djgCreate}\n</script>`);

  // ④ 演示提交 → 实卡写入壳（Mvu 正路直写；DEC-036）
  const writeShell = `  // ── 提交（实卡写入壳：Mvu 正路直写 user 九字段 + 规则.初始化完成，DEC-036）──
  var HOST_OK = (typeof Mvu !== 'undefined') && (typeof getCurrentMessageId === 'function');
  function mesId() { try { return getCurrentMessageId(); } catch (e) { return 0; } }
  function writeVars(payload) {
    var mid = mesId();
    var data = Mvu.getMvuData({ type: 'message', message_id: mid });
    if (!data.stat_data) data.stat_data = {};
    data.stat_data.user = payload.user;
    data.stat_data['规则'] = Object.assign({}, data.stat_data['规则'], payload['规则']);
    return Promise.resolve(Mvu.replaceMvuData(data, { type: 'message', message_id: mid }));
  }
  function showDone(payload) {
    var rows = DJG_CREATE.summarize(payload).map(function (r) {
      return '<div class="row"><span class="k">' + r[0] + '</span><span class="v">' +
        String(r[1]).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span></div>';
    }).join('');
    $('#doneSum').innerHTML = rows;
    $('#formSec').style.display = 'none';
    $('#previewSec').style.display = 'none';
    $('#actions').style.display = 'none';
    $('#doneCard').style.display = 'block';
    var hint = document.querySelector('#doneCard .hint');
    if (hint) hint.textContent = '存档已写入 · 点击下方按钮开始第一轮剧情';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('#submitBtn').addEventListener('click', function () {
    var res = DJG_CREATE.validate(readForm());
    if (!res.ok) {
      var first = form.querySelector('.fld.bad');
      if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    var payload = DJG_CREATE.buildPayload(readForm());
    if (!HOST_OK) { console.log('[djg-create] 演示模式（无 Mvu）：', payload); showDone(payload); return; }
    writeVars(payload).then(function () { showDone(payload); }).catch(function (e) { alert('写入存档失败：' + e); });
  });
  $('#enterBtn').addEventListener('click', function () {
    if (!HOST_OK) return;
    var msg = '/send （你完善了自己的资料，进入了「但为君故」频道。）';
    try { TavernHelper.triggerSlash(msg + ' | /trigger'); }
    catch (e) {
      try { TavernHelper.triggerSlash(msg); setTimeout(function () { TavernHelper.triggerSlash('/trigger'); }, 600); }
      catch (e2) { console.error('[djg-create] 触发首轮剧情失败', e2); }
    }
  });
  // 幂等：已初始化则直接呈现完成态（写入后创角页不再出现表单）
  (function initCheck() {
    if (!HOST_OK) return;
    try {
      var data = Mvu.getMvuData({ type: 'message', message_id: mesId() });
      var sd = data && data.stat_data;
      if (sd && sd['规则'] && sd['规则']['初始化完成'] === true && sd.user) {
        showDone({ user: sd.user, '规则': sd['规则'] });
      }
    } catch (e) { /* 未初始化：正常显示表单 */ }
  })();`;
  const anchor = html.indexOf('  // ── 提交（演示页');
  if (anchor < 0) throw new Error('开场白提交段锚点未找到');
  const tailMark = html.indexOf('})();\n</script>', anchor);
  if (tailMark < 0) throw new Error('开场白脚本结尾锚点未找到');
  html = html.slice(0, anchor) + writeShell + '\n' + html.slice(tailMark);

  // ⑤ 页脚注记更新（本地设计稿 → 实卡）
  html = html.replace('雾青排版系统 · 开场白-创角页 v1.0 · 仅本地设计稿不入库 · DEC-036',
    '雾青排版系统 · 开场白-创角页 v1.0 · 卡内实装 · DEC-036');
  html = html.replace('演示页到此为止 · 实卡中由酒馆助手接管，开始第一轮剧情',
    '写入完成后即可进入频道，开始第一轮剧情');
  // HTML 注释头（本地稿说明）剔除
  html = html.replace(/<!--[\s\S]*?-->\n/, '');
  return html;
}
const greetingHtml = buildGreeting();
// 以代码块包裹（酒馆助手 isFrontend：含 <body 即判定为前端界面 → iframe 渲染）
const firstMes = '```html\n' + greetingHtml + '\n```';

// 备选开场白（无前端环境/ swipe 用：纯文本走正常剧情链采集，DEC-005/205）
const alternateGreeting = `（周五晚十一点半，「但为君故」的语音频道挂着三两个人，文字频道正热闹。）

【珍惜才配拥有】：新来的？ ID 眼生得很。
【cojack】：欢迎欢迎～刚加就冒泡，勇气可嘉（笑）
【佐久间眠】：晚上好呀。群里很久没有第六个人了。
【冯诺依曼】：先说好，群规没有，梗很多，慢慢看就懂了。
【楚楚的笙_unofficial】：哦～？新人欧吉桑还是新人妹妹？先报上名来听听～

（你刚加入这个 Discord 频道——而你还不知道，这五个 ID 全都住在南江市，可能就在你的隔壁街区。先跟群友们打个招呼吧。）`;

// ─────────────────────────── 卡 JSON 组装 ───────────────────────────
const CARD_NAME = '在DC频道里口嗨的群友就住我隔壁？！';
const BOOK_NAME = '但为君故·世界书';

const nowDate = new Date().toISOString().slice(0, 10);
function entryToBook(e, displayIndex) {
  return {
    insertion_order: e.order,
    secondary_keys: [],
    position: e.position === 1 ? 'after_char' : 'before_char',
    content: e.content,
    keys: e.keys,
    id: e.id,
    enabled: e.enabled,
    constant: e.constant,
    selective: !e.constant,
    extensions: {
      position: e.position,
      exclude_recursion: !!e.exclude,
      prevent_recursion: !!e.prevent,
      display_index: displayIndex,
      probability: 100,
      useProbability: true,
      depth: 4,
      selectiveLogic: 0,
      group: '',
      group_override: false,
      group_weight: 100,
      scan_depth: null,
      case_sensitive: false,
      match_whole_words: false,
      use_group_scoring: false,
      automation_id: '',
      role: 0,
      vectorized: false,
      sticky: 0,
      cooldown: 0,
      delay: 0,
      delay_until_recursion: false,
    },
    comment: e.comment,
    use_regex: false,
  };
}

const bookEntries = entries.map(entryToBook);
// display_index 按 UI 友好序重排（协议→变量→起源→城市→场所→角色）：此处按协议层最后（最常用核对）→ 保持 id 序即可
const data = {
  name: CARD_NAME,
  description,
  personality,
  scenario,
  first_mes: firstMes,
  mes_example: mesExample,
  creator_notes: creatorNotes,
  system_prompt: '',
  post_history_instructions: '',
  alternate_greetings: [alternateGreeting],
  tags: ['群像', 'MVU', '现代都市', '重迷雾', '酒馆助手', '南江市'],
  creator: '但为君故:只需等待线上抄咕委员会 × sakuma-mian',
  character_version: '1.0.0',
  group_only_greetings: [],
  character_book: {
    name: BOOK_NAME,
    description: '六层世界书：协议层（INC/MOD）· 变量层（[initvar]/[mvu_update]）· 起源层 · 城市层 · 场所层 · 角色层（R2 门控秘密词条）',
    scan_depth: 4,
    token_budget: 0,
    recursive_scanning: false,
    extensions: { world: BOOK_NAME },
    entries: bookEntries,
  },
  extensions: {
    world: BOOK_NAME,
    talkativeness: 0.5,
    fav: false,
    tavern_helper: { variables: {}, scripts: tavernHelperScripts },
    regex_scripts: regexScripts,
  },
};

const card = {
  spec: 'chara_card_v3',
  spec_version: '3.0',
  create_date: nowDate,
  name: CARD_NAME,
  description,
  personality,
  scenario,
  first_mes: firstMes,
  mes_example: mesExample,
  creatorcomment: creatorNotes,
  avatar: 'none',
  talkativeness: 0.5,
  fav: false,
  tags: data.tags,
  data,
};

const cardJson = JSON.stringify(card, null, 1);

// ─────────────────────────── ACC-005 离线校验 ───────────────────────────
// 1) 结构
assert(entries.length === 48, `词条总数 48（实际 ${entries.length}）`);
for (const e of entries) {
  assert(e.content && e.content.trim().length > 20, `词条内容非空：${e.comment}`);
  assert(!/## 溯源|## 取舍|## 说明/.test(e.content), `词条未混入源稿文档节：${e.comment}`);
  assert(!e.content.includes('entryId:'), `词条未混入 YAML 头：${e.comment}`);
}

// 2) 协议/起源/城市/场所 order 段位
const byComment = Object.fromEntries(entries.map(e => [e.comment, e]));
assert(byComment['[mvu_plot]协议层·状态对齐'].order === 210, 'N0 order 210');
assert(byComment['[mvu_plot]协议层·MOD条件模块'].order === 206 && byComment['[mvu_plot]协议层·MOD条件模块'].enabled === false, 'N4 order 206 + 默认关闭');
assert(byComment['[mvu_plot]起源层·Discord群像·但为君故'].order === 205, 'G0 order 205');
assert(byComment['[mvu_plot]城市层·南江市总纲'].order === 200, 'C0 order 200');
assert(byComment['[mvu_plot]场所层·南江大学·总览'].order === 190, 'U0 order 190');
assert(byComment['[mvu_plot]角色层·藤原花奈·主词条'].position === 1, '主词条 position 1');

// 3) 迷雾事实注册表 ↔ 秘密词条 一一对应（21 格）
assert(SECRET_FACTS.length === 21, `秘密词条 21（实际 ${SECRET_FACTS.length}）`);
const EXPECTED_FACTS = ['H.家史', 'H.母亡', 'H.药', 'H.面具', 'H.轨迹', 'Q.保护色', 'Q.霸凌', 'Q.善良', 'Q.独居',
  'C.背锅', 'C.社恐度', 'C.耳坠', 'C.未放弃', 'Y.父母', 'Y.安静', 'Y.草稿', 'Y.逃兵',
  'N.拖延', 'N.才华', 'N.家庭群', 'N.延毕'];
assert(JSON.stringify(SECRET_FACTS.map(s => s.factId)) === JSON.stringify(EXPECTED_FACTS), '事实ID 注册表一致');
assert([...new Set(SECRET_FACTS.map(s => s.entry))].length === 21, '秘密词条 comment 无重复');
// R2 表与注册表一致
const r2Src = r2Content;
for (const f of EXPECTED_FACTS) assert(r2Src.includes(`'${f}':`), `R2 表含 ${f}`);
for (const f of ['Y.逃兵']) assert(r2Src.includes("'Y.逃兵': '剧本'"), 'R2 映射 Y.逃兵→剧本');

// 4) initvar 行结构（21/16/17/17/17/17 = 105 单元）
function parseInitvar(txt) {
  const lines = txt.split(/\r?\n/);
  const rows = {}; let cur = null;
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, '').trimEnd();
    if (!line.trim() || line.trim() === '---') continue;
    const row = /^\s{2}([^ :]+):\s*$/;
    const cell = /^\s{4}([^ :]+):\s*(.+?)\s*$/;
    const top = /^([^ :#\s]+):\s*(.*?)\s*$/;
    let m;
    if ((m = line.match(top)) && !raw.startsWith('    ') && !raw.startsWith('  ')) {
      cur = m[1]; rows[cur] = { type: typeof rows[cur] === 'undefined' ? 'top' : rows[cur].type };
      if (m[2] === '{}') rows[cur] = { value: '{}' };
      continue;
    }
    if ((m = line.match(row))) { cur = null; rows._sub = rows._sub || {}; rows._sub[m[1]] = []; rows._sub[m[1]].key = m[1]; continue; }
    if ((m = line.match(cell))) {
      const sub = line.match(/^  ([^ :]+):\s*$/);
      if (sub) { rows._sub[sub[1]] = []; }
      else if (rows._sub) {
        const owner = Object.keys(rows._sub).pop();
        rows._sub[owner].push({ key: m[1], val: m[2] });
      }
    }
  }
  return rows;
}
// 直接数格子（结构简单，逐行按缩进判）
const ivLines = initvarContent.split(/\r?\n/);
let secName = null, topName = null; const mistCounts = {}; const relKeys = new Set(); const userFields = new Set(); const dengchang = [];
let mistMode = false;
for (const raw of ivLines) {
  const line = raw.replace(/#.*$/, '').trimEnd();
  if (!line.trim()) continue;
  const t = line.trim();
  if (/^迷雾:$/.test(t)) { mistMode = true; continue; }
  if (/^关系:$|^登场:$|^任务:|^user:$|^环境:$|^规则:$/.test(t)) { mistMode = false; topName = t.replace(':', ''); continue; }
  if (mistMode) {
    const sub = t.match(/^([^ :]+):$/);
    const cell = t.match(/^([^ :]+):\s*(.+)$/);
    if (sub && raw.startsWith('  ')) { secName = sub[1]; mistCounts[secName] = 0; }
    else if (cell && raw.startsWith('    ') && secName) { mistCounts[secName]++; }
    continue;
  }
  if (topName === '关系') { const c = t.match(/^([^ :]+):\s*$/); const f = t.match(/^([^ :]+):\s*(.+)$/); if (c && raw.startsWith('  ')) relKeys.add(c[1]); }
  if (topName === 'user') { const f = t.match(/^([^ :]+):\s*(.*)$/); if (f && raw.startsWith('  ')) userFields.add(f[1]); }
  if (topName === '登场') { const f = t.match(/^([^ :]+):\s*(.+)$/); if (f && raw.startsWith('  ')) dengchang.push(f[1]); }
}
assert(mistCounts['主控'] === 21, `主控迷雾 21 格（实际 ${mistCounts['主控']}）`);
assert(mistCounts['花奈'] === 16 && mistCounts['清寒'] === 17 && mistCounts['沉秋'] === 17 && mistCounts['楚羽笙'] === 17 && mistCounts['诺薇拉'] === 17,
  `知情者行 16/17/17/17/17（实际 ${mistCounts['花奈']}/${mistCounts['清寒']}/${mistCounts['沉秋']}/${mistCounts['楚羽笙']}/${mistCounts['诺薇拉']}）`);
const mistTotal = Object.values(mistCounts).reduce((a, b) => a + b, 0);
assert(mistTotal === 105, `迷雾总单元 105（实际 ${mistTotal}）`);
assert(JSON.stringify([...relKeys]) === JSON.stringify(['花奈', '清寒', '沉秋', '楚羽笙', '诺薇拉']), '关系行五键');
assert(userFields.has('DC网名') && userFields.has('年龄') && userFields.size === 9, `user 九字段（实际 ${userFields.size}）`);
assert(dengchang.length === 5, '登场五行');

// 5) schema 一致性
const zodContent = zodScript.content;
assert(zodContent.includes("z.literal('dc-neighbor-state-v1')"), 'Zod schema 版本字面量');
assert(initvarContent.includes('schema版本: dc-neighbor-state-v1'), 'initvar schema 版本');
assert(zodContent.includes('身份揭晓'), 'Zod 含身份揭晓字段');
assert(zodContent.includes("prefault('线上好友')") || zodContent.includes("'线上好友'"), 'Zod 关系阶段默认');

// 6) 更新规则/输出格式纪律（DEC-024/033）
const updRules = readText(V('[mvu_update]变量更新规则.txt'));
for (const kw of ['-49~+49', '永不背叛', '不死不休', 'add、replace、remove、move', '误信已纠正', '初始化完成']) assert(updRules.includes(kw), `更新规则含「${kw}」`);
const updFmt = readText(V('[mvu_update]变量输出格式.txt'));
assert(updFmt.includes('<UpdateVariable>') && updFmt.includes('<Analysis>') && updFmt.includes('<JSONPatch>'), '输出格式标签（MVU v1.0.1 兼容 Analysis/JSONPatch）');
assert(updFmt.includes('空数组 []'), '无变化输出 []');

// 7) 开场白纪律（DEC-005 不伪造初始化）
assert(!firstMes.includes('<UpdateVariable>') && !firstMes.includes('[initvar'), '开场白无伪造变量块');
assert(firstMes.includes('<body'), '开场白含 <body（酒馆助手前端渲染判定）');
assert(greetingHtml.includes('初始化完成') && greetingHtml.includes('replaceMvuData'), '创角页写入壳就位');
assert(greetingHtml.includes('data:image/jpeg;base64,'), '创角页头像已内嵌');
assert(!greetingHtml.includes('../assets/'), '创角页无本地相对路径');
assert(!greetingHtml.includes('genshin-official'), '创角页无原神素材引用');

// 8) 脚本语法检查（非 ESM 件用 new Function 编译校验）
try { new Function(r2Content); OK.push('R2 脚本语法通过'); } catch (e) { ERR.push('R2 语法错误: ' + e.message); }
try { new Function(wuContent); OK.push('雾青渲染语法通过'); } catch (e) { ERR.push('雾青渲染语法错误: ' + e.message); }
try { new Function(djgCreateSrc()); OK.push('djg-create 语法通过'); } catch (e) { ERR.push('djg-create 语法错误: ' + e.message); }
function djgCreateSrc() { return readText(join(ROOT, 'frontend', '排版设计', 'djg-create.js')); }

// 9) 正则与脚本挂载
assert(tavernHelperScripts.length === 4 && tavernHelperScripts.every(s => s.content), '酒馆助手脚本 4 件');
assert(regexScripts.length === 3, '正则 3 条');
assert(regexScripts[0].promptOnly === false && regexScripts[1].promptOnly === true, 'R3 渲染/剥离分工');

// 10) 预算粗检（激活态常驻词条字数）
const resident = ['[mvu_plot]协议层·状态对齐', '[mvu_plot]协议层·INC-1保密纪律', '[mvu_plot]协议层·INC-2群像调度',
  '[mvu_plot]协议层·INC-3初遇路由', '[mvu_plot]起源层·Discord群像·但为君故', '[mvu_plot]城市层·南江市总纲',
  '[mvu_update]变量更新规则', '[mvu_update]变量输出格式', '[mvu_update]变量列表'];
const residentChars = resident.reduce((a, c) => a + byComment[c].content.length, 0);
assert(residentChars <= 12000, `常驻词条字数 ${residentChars} ≤ 12000（token≈${Math.round(residentChars * 0.9)}，Gemini 2M 上下文充裕）`);

if (ERR.length) {
  console.error('===== ACC-005 校验失败 =====');
  ERR.forEach(e => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log('===== ACC-005 校验通过 =====');
OK.forEach(o => console.log('  ✓ ' + o));

// ─────────────────────────── 落盘 ───────────────────────────
writeFileSync(join(OUT, `${CARD_NAME} v1.0.json`), cardJson, 'utf8');

// ── PNG 封装（chara = base64(V3 JSON)；ccv3 = 原文 V3 JSON）──
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'latin1');
  Buffer.from(data).copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'latin1'), Buffer.from(data)])), 8 + data.length);
  return out;
}
function latin1(s) { return Buffer.from(s, 'latin1'); }

const basePng = readFileSync(join(BUILD, 'card-base.png'));
assert(basePng.readUInt32BE(0) === 0x89504E47, 'PNG 签名');
// 定位 IHDR 结束
const ihdrLen = basePng.readUInt32BE(8);
const afterIhdr = 8 + 12 + ihdrLen;
const tEXtChara = chunk('tEXt', Buffer.concat([latin1('chara'), Buffer.from([0]), Buffer.from(Buffer.from(cardJson, 'utf8').toString('base64'), 'latin1')]));
const tEXtCcv3 = chunk('tEXt', Buffer.concat([latin1('ccv3'), Buffer.from([0]), Buffer.from(cardJson, 'utf8')]));
const outPng = Buffer.concat([basePng.subarray(0, afterIhdr), tEXtChara, tEXtCcv3, basePng.subarray(afterIhdr)]);
writeFileSync(join(OUT, `${CARD_NAME} v1.0.png`), outPng);

// ── manifest ──
const sha256 = s => createHash('sha256').update(s).digest('hex');
const manifest = {
  card: CARD_NAME, version: '1.0.0', built: new Date().toISOString(),
  entries: entries.length,
  entryBreakdown: { 协议层: 5, 变量层: 4, 起源层: 1, 城市层: 6, 场所层: 6, 角色层主词条: 5, 角色层秘密词条: 21 },
  scripts: tavernHelperScripts.map(s => ({ name: s.name, bytes: s.content.length })),
  regex: regexScripts.map(r => ({ name: r.scriptName, disabled: r.disabled, promptOnly: r.promptOnly, markdownOnly: r.markdownOnly })),
  json_sha256: sha256(cardJson),
  json_bytes: Buffer.byteLength(cardJson),
  png_sha256: sha256(outPng),
  png_bytes: outPng.length,
  secrets: SECRET_FACTS,
};
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`\n已输出：\n  输出/${CARD_NAME} v1.0.json (${manifest.json_bytes} bytes)\n  输出/${CARD_NAME} v1.0.png (${manifest.png_bytes} bytes)\n  输出/manifest.json`);
