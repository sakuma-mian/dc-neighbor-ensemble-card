/**
 * 《但为君故 · 沉吟至今》· 最小组装器（本项目自建，不复制任何旧工程）
 * ---------------------------------------------------------------------------
 * 这是本项目**自己的** adapter：pipeline 技能要求“发现项目工具，不要假装有构建引擎”，
 * 而本项目此前没有工具，故在此建立一个最小实现。
 *
 * 输入（全部为维护源，只读）：
 *   worldview/W1..W6*.md            世界规则层 / 组织层 / 场所层 / 源流层条目
 *   cards/chenyin-zhijin/lorebooks/P1..P5*.md   角色层条目
 *   cards/chenyin-zhijin/update-rules/ENT-V0*.md 变量层条目
 *   cards/chenyin-zhijin/card/card-fields.md    卡身份字段
 *   cards/chenyin-zhijin/scripts/R2-render-regex.md  渲染正则
 *   cards/chenyin-zhijin/scripts/R1-mvu-loader.js    ┐
 *   cards/chenyin-zhijin/schema/zod_schema.js        ├ 卡内脚本
 *   cards/chenyin-zhijin/frontend/render.js          ┘
 *
 * 输出（生成物，不手改）：
 *   output/worldbook.json        世界书（酒馆原生可导入）
 *   output/card-source.json      chara_card_v3 卡源（内嵌同一份世界书 + 脚本 + 正则）
 *   output/build-report.json     组装报告（条目数、脚本、校验结果、字数统计）
 *
 * 用法：node tools/build-card.mjs            （生成）
 *       node tools/build-card.mjs --dry-run  （只解析与校验，不写文件）
 *
 * 【未验证】本脚本生成的卡 JSON 未在真实 SillyTavern 导入过；position 双轨、
 *   内嵌世界书绑定、tavern_helper.scripts 结构均需实机确认（见 ST-A2）。
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const CARD = path.join(ROOT, 'cards', 'chenyin-zhijin');
const OUT = path.join(ROOT, 'output');
const DRY = process.argv.includes('--dry-run');

const CARD_NAME = '但为君故 · 沉吟至今';
const WORLDBOOK_NAME = '但为君故·世界书';
const TODAY = '2026-09-13';

const problems = [];
const warnings = [];
function problem(msg) { problems.push(msg); }
function warn(msg) { warnings.push(msg); }

/* ══════════════ 1. 条目解析 ══════════════ */
// 源格式约定：`## 条目 ENT-XXX · 名称` 起，到下一个 `## ` 止；
// 块内含 `- **关键词**：…` 等元数据行，以及一个 ```text 内容块。
function parseEntries(mdPath, layer, sourceFile) {
  const raw = fs.readFileSync(mdPath, 'utf8').replace(/\r\n/g, '\n');
  const lines = raw.split('\n');
  const out = [];
  let cur = null;
  for (let i = 0; i < lines.length; i++) {
    // 兼容两种标题写法：`## 条目 ENT-X · 名称` 与 `## 条目 ENT-X（内容源）`
    const m = /^##\s+条目\s+(ENT-[A-Za-z0-9]+)\s*(.*)$/.exec(lines[i]);
    if (m) {
      if (cur) out.push(cur);
      const nm = m[2].trim().replace(/^·\s*/, '').replace(/^（[^）]*）\s*$/, '').trim();
      cur = { id: m[1], name: nm, layer, sourceFile, meta: {}, content: '', startLine: i + 1 };
      continue;
    }
    if (!cur) continue;
    if (/^##\s+/.test(lines[i])) { out.push(cur); cur = null; continue; }
    const kv = /^-\s+\*\*(策略|关键词|投递位置|预算|素材状态|条目名)\*\*[：:]\s*(.*)$/.exec(lines[i]);
    if (kv) { cur.meta[kv[1]] = kv[2].trim(); continue; }
    if (/^```text\s*$/.test(lines[i])) {
      const buf = [];
      for (i++; i < lines.length && !/^```\s*$/.test(lines[i]); i++) buf.push(lines[i]);
      const block = buf.join('\n').trim();
      if (!cur.content) cur.content = block;
      else if (block) warn(`${cur.id} 出现第二个 \`\`\`text 块，已忽略（请确认它不是应注入内容）`);
    }
  }
  if (cur) out.push(cur);
  return out;
}

// 关键词：支持 `、` `,` `，` 分隔；`—` 或含“不需要关键词”视为常驻无键
function parseKeys(v) {
  if (!v || v === '—' || v === '-' || /不需要关键词/.test(v)) return [];
  return v.split(/[、,，]/).map(s => s.trim()).filter(Boolean);
}

// 模型可见文本清洁：源文件是给人读的（带 Markdown 强调与内部文件引用），
// 生成物是给模型读的，必须干净——否则模型会看到 `**` 与 `W6-源流与典籍.md` 这类开发者痕迹。
function cleanForModel(s) {
  return String(s)
    .replace(/（详见\s*`[^`]*`\s*）/g, '')      // 内部文件引用（详见 `X.md`）
    .replace(/（见\s*`[^`]*`\s*[^）]*）/g, '')   // 内部文件引用（见 `X.md`）
    .replace(/\*\*(.+?)\*\*/g, '$1')            // 粗体标记
    .replace(/`([^`]+)`/g, '$1')                // 行内代码标记
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
// 投递位置：`position=1` / `position=4`（At Depth，depth=4、role=0）
function parsePosition(v) {
  const p = /position\s*=\s*(\d)/.exec(v || '');
  const d = /depth\s*=\s*(\d)/.exec(v || '');
  const r = /role\s*=\s*(\d)/.exec(v || '');
  return { position: p ? Number(p[1]) : 1, depth: d ? Number(d[1]) : 4, role: r ? Number(r[1]) : 0 };
}
function isConstant(meta) {
  return /Constant|常驻/i.test(meta['策略'] || '');
}

/* ══════════════ 2. 卡字段解析 ══════════════ */
function parseCardFields(mdPath) {
  const raw = fs.readFileSync(mdPath, 'utf8').replace(/\r\n/g, '\n');
  const fields = {};
  const names = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'creator_notes', 'alternate_greetings', 'tags'];
  for (const n of names) {
    // ### `field` 之后的第一个 ```text 块（tags 例外，为 ```text 内的 JSON）
    const re = new RegExp('###\\s+`' + n + '`[\\s\\S]*?```text\\s*\\n([\\s\\S]*?)```');
    const m = re.exec(raw);
    if (m) fields[n] = m[1].trim();
  }
  return fields;
}

/* ══════════════ 3. 正则解析 ══════════════ */
function parseRegexes(mdPath) {
  const raw = fs.readFileSync(mdPath, 'utf8').replace(/\r\n/g, '\n');
  const out = [];
  const re = /\{[\s\S]*?"findRegex"[\s\S]*?\n\}/g;
  let m;
  while ((m = re.exec(raw))) {
    try {
      const o = JSON.parse(m[0]);
      out.push({
        id: o.id, scriptName: o.scriptName, findRegex: o.findRegex,
        replaceString: o.replaceString ?? '', trimStrings: o.trimStrings ?? [],
        placement: o.placement ?? [2], disabled: !!o.disabled,
        markdownOnly: !!o.markdownOnly, promptOnly: !!o.promptOnly,
        runOnEdit: !!o.runOnEdit, substituteRegex: o.substituteRegex ?? 0,
        minDepth: o.minDepth ?? null, maxDepth: o.maxDepth ?? null
      });
    } catch (e) { problem(`正则块解析失败：${e.message}`); }
  }
  return out;
}

/* ══════════════ 4. 卡内脚本 ══════════════ */
function readScript({ file, name, id, info }) {
  const p = path.join(CARD, file);
  if (!fs.existsSync(p)) { problem(`脚本缺失：${file}`); return null; }
  return {
    type: 'script', enabled: true, name, id,
    content: fs.readFileSync(p, 'utf8'),
    info, button: { enabled: false, buttons: [] },
    data: {}, export_with: { data: false, button: false }
  };
}

/* ══════════════ 5. 组装 ══════════════ */
function main() {
  // ── 条目来源 ──
  const sources = [
    ['worldview/W1-面纱规则.md', '世界规则层'],
    ['worldview/W2-异能体系.md', '世界规则层'],
    ['worldview/W3-南江市.md', '世界规则层'],
    ['worldview/W4-组织格局.md', '组织层'],
    ['worldview/W5-场所层.md', '场所层'],
    ['worldview/W6-源流与典籍.md', '世界规则层'],
    ['cards/chenyin-zhijin/lorebooks/P1-藤原花奈.md', '角色层'],
    ['cards/chenyin-zhijin/lorebooks/P2-顾清寒.md', '角色层'],
    ['cards/chenyin-zhijin/lorebooks/P3-鱼沉秋.md', '角色层'],
    ['cards/chenyin-zhijin/lorebooks/P4-楚羽笙.md', '角色层'],
    ['cards/chenyin-zhijin/lorebooks/P5-诺薇拉.md', '角色层'],
    ['cards/chenyin-zhijin/update-rules/ENT-V02-变量更新规则.md', '变量层'],
    ['cards/chenyin-zhijin/update-rules/ENT-V03-变量输出格式.md', '变量层'],
    ['cards/chenyin-zhijin/update-rules/ENT-V04-变量列表.md', '变量层']
  ];

  const parsed = [];
  for (const [rel, layer] of sources) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) { problem(`源文件缺失：${rel}`); continue; }
    const entries = parseEntries(p, layer, rel);
    if (!entries.length) warn(`未解析到条目：${rel}`);
    parsed.push(...entries);
  }

  // ── 变量层必须能接管：ENT-V02 是更新模型唯一入口，缺了变量系统等于废的 ──
  const v02 = parsed.find(e => e.id === 'ENT-V02');
  if (!v02) problem('缺少 ENT-V02（变量更新规则）——变量系统无法工作');
  else if (!/\[mvu_update\]/.test(v02.meta['条目名'] || '')) warn('ENT-V02 条目名未标 [mvu_update]');

  // ── 组装 character_book 条目 ──
  const cleanStats = [];
  const bookEntries = parsed.map((e, i) => {
    // 关键词：优先取 `- **关键词**：…`；变量层把关键词写在策略行的括号里，故回退提取
    const keysRaw = e.meta['关键词']
      || (/关键词[：:]\s*([^）)]*)/.exec(e.meta['策略'] || '') || [])[1]
      || '';
    const keys = parseKeys(keysRaw);
    const constFlag = isConstant(e.meta);
    const pos = parsePosition(e.meta['投递位置']);
    // ST-A2 §11.3：顶层 position 只有 before_char/after_char 两个值，真实位置看 extensions.position
    const topPos = pos.position === 0 ? 'before_char' : 'after_char';
    if (!e.content) problem(`${e.id} 内容为空`);
    const cleaned = cleanForModel(e.content);
    const stripped = e.content.length - cleaned.length;
    if (stripped > 0) cleanStats.push({ id: e.id, stripped });
    return {
      id: i,
      keys,
      secondary_keys: [],
      comment: `${e.id} ${e.name}`.trim(),
      content: cleaned,
      constant: constFlag,
      selective: false,
      insertion_order: 100 + i,
      enabled: true,
      position: topPos,
      use_regex: true,
      extensions: {
        position: pos.position,
        exclude_recursion: true,          // 防条目互相误触发（layers 已按关键词隔离）
        display_index: i,
        probability: 100,
        useProbability: true,
        depth: pos.depth,
        selectiveLogic: 0,
        outlet_name: '',
        group: '',
        group_override: false,
        group_weight: 100,
        prevent_recursion: false,
        delay_until_recursion: false,
        scan_depth: null,
        match_whole_words: false,         // 中文条目必须关（ST-A3 §4.3）
        use_group_scoring: false,
        case_sensitive: null,
        automation_id: '',
        role: pos.role,
        vectorized: false,
        sticky: 0,
        cooldown: 0,
        delay: 0,
        match_persona_description: false,
        match_character_description: false,
        match_character_personality: false,
        match_character_depth_prompt: false,
        match_scenario: false,
        match_creator_notes: false,
        triggers: [],
        ignore_budget: false
      },
      _meta: { layer: e.layer, source: e.sourceFile, keysSource: e.meta['关键词'] || '', constant: constFlag }
    };
  });

  // ── 卡字段 ──
  const f = parseCardFields(path.join(CARD, 'card', 'card-fields.md'));
  for (const need of ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'creator_notes']) {
    if (!f[need]) problem(`卡字段缺失或未解析到：${need}`);
  }
  let tags = [];
  try { tags = f.tags ? JSON.parse(f.tags) : []; }
  catch (e) { problem('tags 不是合法 JSON 数组'); }
  const alternates = f.alternate_greetings ? [f.alternate_greetings] : [];

  // creator_notes 追加第三方署名（DEC-063 要求）
  const CREDIT = '\n\n【第三方资源署名】\n本卡前端使用 Lucide 图标（ISC License；部分图标源自 Feather，MIT License，© Cole Bemis）。';
  if (!/Lucide/.test(f.creator_notes || '')) f.creator_notes = (f.creator_notes || '') + CREDIT;
  else warn('creator_notes 已含 Lucide 署名，未重复追加');

  // ── 脚本与正则 ──
  const scripts = [
    readScript({ file: 'scripts/R1-mvu-loader.js', name: 'R1 · MVU 装载', id: 'danweijungu-r1-mvu-loader',
      info: '加载 MVU 主程序并注入默认设置；缺失时明确报错，不静默降级。' }),
    readScript({ file: 'schema/zod_schema.js', name: 'R1a · MVU Zod schema', id: 'danweijungu-r1a-zod-schema',
      info: '注册 stat_data 的 Zod 结构约束（自行加载 mvu_zod，避免跨 zod 实例）。' }),
    readScript({ file: 'frontend/render.js', name: 'R3 · 前端渲染（状态栏 + 群像档案页）', id: 'danweijungu-r3-frontend',
      info: '只读 stat_data 渲染状态栏与群像档案页；绝不写变量。' })
  ].filter(Boolean);

  const regexes = parseRegexes(path.join(CARD, 'scripts', 'R2-render-regex.md'));
  if (regexes.length !== 2) warn(`正则数量为 ${regexes.length}（预期 2：隐藏更新块 + 隐藏游离 analysis）`);

  // ── 组卡 ──
  const book = {
    name: WORLDBOOK_NAME,
    description: '《但为君故 · 沉吟至今》随卡世界书：世界规则 / 组织 / 场所 / 源流 / 角色 / 变量。',
    extensions: {},
    entries: bookEntries
  };

  const card = {
    name: CARD_NAME,
    description: f.description || '',
    personality: f.personality || '',
    scenario: f.scenario || '',
    first_mes: f.first_mes || '',
    mes_example: f.mes_example || '',
    creatorcomment: f.creator_notes || '',
    avatar: 'none',
    talkativeness: '0.5',
    fav: false,
    tags,
    spec: 'chara_card_v3',
    spec_version: '3.0',
    create_date: TODAY,
    data: {
      name: CARD_NAME,
      description: f.description || '',
      personality: f.personality || '',
      scenario: f.scenario || '',
      first_mes: f.first_mes || '',
      mes_example: f.mes_example || '',
      creator_notes: f.creator_notes || '',
      system_prompt: '',
      post_history_instructions: '',
      tags,
      creator: '',
      character_version: '0.1',
      alternate_greetings: alternates,
      group_only_greetings: [],
      extensions: {
        talkativeness: '0.5',
        fav: false,
        world: WORLDBOOK_NAME,
        depth_prompt: { prompt: '', depth: 4, role: 'system' },
        regex_scripts: regexes,
        tavern_helper: { scripts, variables: {} }
      },
      character_book: book
    }
  };

  // ── 离线校验 ──
  const chk = {};
  chk.entriesParsed = parsed.length;
  chk.entriesInBook = bookEntries.length;
  chk.constantEntries = bookEntries.filter(e => e.constant).length;
  chk.keylessConditional = bookEntries.filter(e => !e.constant && e.keys.length === 0).length;
  chk.characterEntries = bookEntries.filter(e => e._meta.layer === '角色层').length;
  chk.scripts = scripts.map(s => s.name);
  chk.regexCount = regexes.length;
  chk.hasMvuUpdateEntry = !!v02;
  chk.creatorNotesHasCredit = /Lucide/.test(card.data.creator_notes);
  chk.characterCount = (card.data.description + card.data.personality + card.data.scenario + card.data.mes_example).length;
  chk.worldbookChars = bookEntries.reduce((n, e) => n + e.content.length, 0);
  chk.constantChars = bookEntries.filter(e => e.constant).reduce((n, e) => n + e.content.length, 0);
  chk.totalBytes = JSON.stringify(card).length;

  if (chk.constantEntries === 0) warn('没有常驻条目——面纱铁律应是常驻');
  if (chk.keylessConditional > 0) warn(`有 ${chk.keylessConditional} 个非恒驻条目既无关键词，将永不激活`);
  if (chk.characterEntries !== 5) problem(`角色层条目数为 ${chk.characterEntries}（应为 5）`);
  if (chk.totalBytes > 1600000) warn(`卡 JSON 体积 ${chk.totalBytes} 字节，偏大（脚本已内联）`);

  // ── 输出 ──
  const report = {
    generatedAt: new Date().toISOString(),
    cardName: CARD_NAME, spec: card.spec, specVersion: card.spec_version,
    checks: chk,
    cleanedForModel: cleanStats,
    problems, warnings,
    entries: bookEntries.map(e => ({ id: e.comment, layer: e._meta.layer, constant: e.constant, keys: e.keys.length, position: e.extensions.position, chars: e.content.length }))
  };

  console.log('=== 组装检查 ===');
  for (const [k, v] of Object.entries(chk)) {
    console.log('  ' + k.padEnd(22) + ' ' + (Array.isArray(v) ? v.join(' / ') : v));
  }
  console.log('\n  条目明细：');
  for (const e of report.entries) {
    console.log(`    ${e.constant ? '🔵' : '🟢'} ${e.id.padEnd(28)} keys=${String(e.keys).padStart(2)} pos=${e.position} ${String(e.chars).padStart(5)}字`);
  }
  if (cleanStats.length) {
    console.log('\n  模型可见文本清洁（去除 Markdown 标记与内部文件引用）：');
    cleanStats.sort((a, b) => b.stripped - a.stripped)
      .forEach(c => console.log(`    ${c.id.padEnd(12)} 去除 ${c.stripped} 字符`));
  }
  if (warnings.length) { console.log('\n  ⚠ 警告：'); warnings.forEach(w => console.log('    - ' + w)); }
  if (problems.length) { console.log('\n  ❌ 阻断问题：'); problems.forEach(p => console.log('    - ' + p)); }

  if (DRY) { console.log('\n--dry-run：未写文件'); return problems.length ? 1 : 0; }
  if (problems.length) { console.log('\n存在阻断问题，已中止写入。'); return 1; }

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'worldbook.json'), JSON.stringify(book, null, 2), 'utf8');
  fs.writeFileSync(path.join(OUT, 'card-source.json'), JSON.stringify(card, null, 2), 'utf8');
  fs.writeFileSync(path.join(OUT, 'build-report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('\n已写出：output/worldbook.json, output/card-source.json, output/build-report.json');
  return 0;
}

process.exit(main());
