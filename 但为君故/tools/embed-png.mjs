/**
 * 《但为君故 · 沉吟至今》· PNG 成品打包
 * ---------------------------------------------------------------------------
 * 做什么：把 output/card-source.json 以 Base64 嵌入 PNG 的 tEXt chunk，
 *        产出可直接拖进酒馆导入的成品卡。
 *
 * 依据 ST-A2 §5.1（PNG tEXt chunk 嵌入格式）：
 *   · chunk 结构：length(4, big-endian) + type(4) + data + crc32(4, big-endian)
 *   · CRC32 覆盖 type + data
 *   · 插入位置：IEND 之前
 *   · 两个 chunk：`chara`（V2）与 `ccv3`（V3）——ST 读取时 **ccv3 优先**
 *   · tEXt 只支持 Latin-1，但内容为 Base64（纯 ASCII），故无编码问题
 *
 * 用法：node tools/embed-png.mjs
 *   --face <path>  卡面 PNG（默认 output/card-face.png）
 *   --json <path>  卡 JSON（默认 output/card-source.json）
 *   --out  <path>  输出（默认 output/但为君故·沉吟至今 v0.1.png）
 *
 * 【未验证】成品未在真实 SillyTavern 导入过；chunk 语义相等性已离线校验，
 *   但“酒馆能否识别并正常导入”属实机范围。
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > -1 ? process.argv[i + 1] : d; };

const FACE = path.resolve(ROOT, arg('face', 'output/card-face.png'));
const JSON_IN = path.resolve(ROOT, arg('json', 'output/card-source.json'));
const OUT = path.resolve(ROOT, arg('out', 'output/但为君故·沉吟至今 v0.1.png'));

/* ── CRC32（PNG 规范标准多项式） ── */
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

/** 构造一个 PNG chunk */
function chunk(type, data) {
  const t = Buffer.from(type, 'latin1');
  const body = Buffer.concat([t, data]);
  return Buffer.concat([u32(data.length), body, u32(crc32(body))]);
}

/** tEXt chunk：keyword\0text（两者都必须是 Latin-1/ASCII） */
function textChunk(keyword, text) {
  return chunk('tEXt', Buffer.concat([Buffer.from(keyword, 'latin1'), Buffer.from([0]), Buffer.from(text, 'latin1')]));
}

/** 列出 PNG 的 chunk 结构 */
function listChunks(png) {
  const out = [];
  let off = 8; // 跳过签名
  while (off + 8 <= png.length) {
    const len = png.readUInt32BE(off);
    const type = png.toString('latin1', off + 4, off + 8);
    out.push({ type, len, offset: off });
    off += 12 + len;
    if (type === 'IEND') break;
  }
  return out;
}

function main() {
  const problems = [];
  const warnings = [];

  for (const [label, p] of [['卡面 PNG', FACE], ['卡 JSON', JSON_IN]]) {
    if (!fs.existsSync(p)) problems.push(`${label} 不存在：${p}`);
  }
  if (problems.length) { problems.forEach(p => console.error('  ❌ ' + p)); return 1; }

  const jsonText = fs.readFileSync(JSON_IN, 'utf8');
  let card;
  try { card = JSON.parse(jsonText); } catch (e) { problems.push('卡 JSON 解析失败：' + e.message); }
  if (problems.length) { problems.forEach(p => console.error('  ❌ ' + p)); return 1; }

  // 规范：ccv3 必须是 chara_card_v3；chara 保留原样
  const ccv3Obj = { ...card, spec: 'chara_card_v3', spec_version: '3.0' };
  const b64Chara = Buffer.from(jsonText, 'utf8').toString('base64');
  const b64Ccv3 = Buffer.from(JSON.stringify(ccv3Obj), 'utf8').toString('base64');

  const png = fs.readFileSync(FACE);
  // 校验 PNG 签名
  const SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (!png.subarray(0, 8).equals(SIG)) { console.error('  ❌ 卡面不是合法 PNG（签名不符）'); return 1; }

  const before = listChunks(png);
  const iend = before.find(c => c.type === 'IEND');
  if (!iend) { console.error('  ❌ 卡面 PNG 缺少 IEND chunk'); return 1; }
  if (before.some(c => c.type === 'chara' || c.type === 'ccv3')) {
    warnings.push('卡面已含 chara/ccv3 chunk，将先剔除旧块再写入（不静默叠加）');
  }

  // 剔除旧块：保留 IEND 之前的所有非 chara/ccv3 chunk
  const head = png.subarray(0, iend.offset);
  const tail = png.subarray(iend.offset);
  const kept = (() => {
    const parts = [];
    let off = 8;
    while (off < iend.offset) {
      const len = png.readUInt32BE(off);
      const type = png.toString('latin1', off + 4, off + 8);
      const whole = png.subarray(off, off + 12 + len);
      if (type !== 'chara' && type !== 'ccv3') parts.push(whole);
      off += 12 + len;
    }
    return Buffer.concat(parts);
  })();

  const injected = Buffer.concat([
    SIG,
    kept,
    textChunk('chara', b64Chara),
    textChunk('ccv3', b64Ccv3),
    tail
  ]);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, injected);

  /* ── 回读校验：重新打开产物，解码并逐项比对 ── */
  const re = fs.readFileSync(OUT);
  const chunks = listChunks(re);
  const getText = (kw) => {
    for (const c of chunks) {
      if (c.type !== 'tEXt') continue;
      const data = re.subarray(c.offset + 8, c.offset + 8 + c.len);
      const nul = data.indexOf(0);
      if (data.toString('latin1', 0, nul) === kw) return data.toString('latin1', nul + 1);
    }
    return null;
  };
  const backChara = getText('chara');
  const backCcv3 = getText('ccv3');
  const decodedChara = backChara ? JSON.parse(Buffer.from(backChara, 'base64').toString('utf8')) : null;
  const decodedCcv3 = backCcv3 ? JSON.parse(Buffer.from(backCcv3, 'base64').toString('utf8')) : null;

  const checks = {
    pngSignature: re.subarray(0, 8).equals(SIG),
    chunkOrderIendLast: chunks[chunks.length - 1].type === 'IEND',
    hasChara: !!backChara,
    hasCcv3: !!backCcv3,
    ccv3Spec: decodedCcv3?.spec,
    ccv3SpecVersion: decodedCcv3?.spec_version,
    nameMatches: decodedChara?.name === card.name,
    entriesMatch: decodedChara?.data?.character_book?.entries?.length === card.data.character_book.entries.length,
    scriptsMatch: decodedChara?.data?.extensions?.tavern_helper?.scripts?.length === card.data.extensions.tavern_helper.scripts.length,
    regexMatch: decodedChara?.data?.extensions?.regex_scripts?.length === card.data.extensions.regex_scripts.length,
    semanticEqualChara: JSON.stringify(decodedChara) === JSON.stringify(card),
    semanticEqualCcv3: JSON.stringify(decodedCcv3) === JSON.stringify(ccv3Obj),
    // 注意：chara / ccv3 是 tEXt 的 **keyword**，不是 chunk type（type 恒为 tEXt）。
    // 早先这里误按 type 过滤，导致恒为 false —— 是校验代码的缺陷，不是产物的问题。
    noStaleChunks: (() => {
      const kwCount = (kw) => chunks.filter(c => {
        if (c.type !== 'tEXt') return false;
        const data = re.subarray(c.offset + 8, c.offset + 8 + c.len);
        const nul = data.indexOf(0);
        return data.toString('latin1', 0, nul) === kw;
      }).length;
      return kwCount('chara') === 1 && kwCount('ccv3') === 1;
    })()
  };

  console.log('=== PNG 打包报告 ===');
  console.log('  卡面   : ' + path.relative(ROOT, FACE) + '  (' + png.length + ' 字节, ' + before.length + ' 个 chunk)');
  console.log('  卡 JSON: ' + path.relative(ROOT, JSON_IN) + '  (' + jsonText.length + ' 字节)');
  console.log('  产物   : ' + path.relative(ROOT, OUT) + '  (' + re.length + ' 字节)');
  console.log('');
  console.log('  注入内容:');
  console.log('    chara  base64 ' + b64Chara.length + ' 字节');
  console.log('    ccv3   base64 ' + b64Ccv3.length + ' 字节  (spec=' + ccv3Obj.spec + ' / ' + ccv3Obj.spec_version + ')');
  console.log('');
  console.log('  回读校验:');
  for (const [k, v] of Object.entries(checks)) {
    const ok = v === true || (typeof v === 'string' && v.length > 0);
    console.log('    ' + (ok ? '✅' : '❌') + ' ' + k.padEnd(22) + ' ' + v);
  }
  if (warnings.length) { console.log('\n  ⚠ 警告:'); warnings.forEach(w => console.log('    - ' + w)); }
  const failed = Object.entries(checks).filter(([, v]) => v !== true && !(typeof v === 'string' && v.length > 0));
  if (failed.length) { console.log('\n  存在未通过项，成品可能不可用。'); return 1; }

  console.log('\n  成品卡：' + OUT);
  console.log('  （拖入 SillyTavern 即可导入；导入时酒馆助手会提示安装卡内 3 个脚本，全部允许。）');
  return 0;
}

process.exit(main());
