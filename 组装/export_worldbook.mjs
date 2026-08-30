/**
 * 《但为君故》世界书单独导出器
 * 输入：输出/在DC频道里口嗨的群友就住我隔壁？！ v1.0.json（组装产物，唯一事实源）
 * 输出：输出/但为君故·世界书 v1.0.json —— 酒馆世界书面板原生格式
 *   （{ name, entries: { "<uid>": 条目 } }；服务端 /api/worldinfo/import 硬性要求含 entries 键，
 *     客户端 convertCharacterBook 仅用于卡内书导入，独立文件必须用原生字段名——字段映射照抄
 *     SillyTavern world-info.js convertCharacterBook + newWorldInfoEntryDefinition，release 分支核对）
 * 运行：node 组装/export_worldbook.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, '输出');
const CARD = join(OUT, '在DC频道里口嗨的群友就住我隔壁？！ v1.0.json');

const card = JSON.parse(readFileSync(CARD, 'utf8'));
const book = card.data.character_book;
if (!book || !Array.isArray(book.entries)) throw new Error('卡内 character_book 结构异常');

// 原生条目模板（SillyTavern newWorldInfoEntryDefinition 的模板字段子集，值按本卡口径覆盖）
function toNative(e, index) {
  const ext = e.extensions || {};
  return {
    uid: e.id,
    key: e.keys || [],
    keysecondary: e.secondary_keys || [],
    comment: e.comment || '',
    content: e.content,
    constant: !!e.constant,
    vectorized: false,
    selective: !e.constant,
    selectiveLogic: ext.selectiveLogic ?? 0,
    addMemo: !!e.comment,
    order: e.insertion_order,
    position: ext.position ?? (e.position === 'before_char' ? 0 : 1),
    disable: !e.enabled,
    ignoreBudget: false,
    excludeRecursion: !!ext.exclude_recursion,
    preventRecursion: !!ext.prevent_recursion,
    matchPersonaDescription: false,
    matchCharacterDescription: false,
    matchCharacterPersonality: false,
    matchCharacterDepthPrompt: false,
    matchScenario: false,
    matchCreatorNotes: false,
    delayUntilRecursion: 0,
    probability: ext.probability ?? 100,
    useProbability: ext.useProbability ?? true,
    depth: ext.depth ?? 4,
    outletName: '',
    group: ext.group ?? '',
    groupOverride: !!ext.group_override,
    groupWeight: ext.group_weight ?? 100,
    scanDepth: ext.scan_depth ?? null,
    caseSensitive: ext.case_sensitive ?? false,
    matchWholeWords: ext.match_whole_words ?? false,
    useGroupScoring: ext.use_group_scoring ?? false,
    automationId: ext.automation_id ?? '',
    role: ext.role ?? 0,
    sticky: ext.sticky ?? 0,
    cooldown: ext.cooldown ?? 0,
    delay: ext.delay ?? 0,
    triggers: [],
    displayIndex: ext.display_index ?? index,
  };
}

const entries = {};
book.entries.forEach((e, index) => {
  const native = toNative(e, index);
  entries[String(native.uid)] = native;
});

const worldbook = {
  name: book.name || '但为君故·世界书',
  entries,
};

const outPath = join(OUT, '但为君故·世界书 v1.0.json');
writeFileSync(outPath, JSON.stringify(worldbook, null, 1), 'utf8');

// ── 校验 ──
const errs = [];
const list = Object.values(entries);
if (list.length !== 48) errs.push(`条目数 ${list.length} ≠ 48`);
if (list.filter(x => x.disable).length !== 23) errs.push(`默认禁用数 ${list.filter(x => x.disable).length} ≠ 23（[initvar]+21秘密+N4）`);
const updateCnt = list.filter(x => x.comment.includes('[mvu_update]')).length;
const plotCnt = list.filter(x => x.comment.includes('[mvu_plot]')).length;
if (updateCnt !== 3 || plotCnt !== 44) errs.push(`标记统计异常 [mvu_update]=${updateCnt} [mvu_plot]=${plotCnt}`);
const secret = list.filter(x => x.comment.includes('秘密：'));
if (secret.length !== 21 || secret.some(x => !x.disable)) errs.push('秘密词条 21 条全默认禁用未满足');
if (list.some(x => !x.content || typeof x.content !== 'string')) errs.push('存在空 content');
const c0 = list.find(x => x.comment.includes('城市层·南江市总纲'));
if (!c0 || c0.position !== 0 || c0.constant !== true || !c0.preventRecursion) errs.push('C0 字段映射异常');
const c1 = list.find(x => x.comment.includes('城区·市中心江南区'));
if (!c1 || !Array.isArray(c1.key) || c1.key[0] !== '江南' || c1.matchWholeWords !== false) errs.push('C1 关键词/全词匹配映射异常');
const main = list.find(x => x.comment.includes('藤原花奈·主词条'));
if (!main || main.position !== 1 || main.disable !== false) errs.push('花奈主词条映射异常');

if (errs.length) {
  console.error('导出校验失败：');
  errs.forEach(e => console.error('  ✗ ' + e));
  process.exit(1);
}
console.log(`✓ 世界书已导出：输出/但为君故·世界书 v1.0.json（48 条，禁用 ${list.filter(x => x.disable).length}，字节 ${Math.round(JSON.stringify(worldbook).length / 1024)}KB）`);
