import { readFileSync } from 'node:fs';
const buf = readFileSync(new globalThis.URL('../输出/在DC频道里口嗨的群友就住我隔壁？！ v1.0.png', import.meta.url));
let off = 8; const chunks = [];
let chara = null, ccv3 = null;
while (off < buf.length) {
  const len = buf.readUInt32BE(off);
  const type = buf.toString('latin1', off + 4, off + 8);
  chunks.push(type + ':' + len);
  const data = buf.subarray(off + 8, off + 8 + len);
  if (type === 'tEXt') {
    const nul = data.indexOf(0);
    const kw = data.toString('latin1', 0, nul);
    const val = data.subarray(nul + 1);
    if (kw === 'chara') chara = JSON.parse(Buffer.from(val.toString('latin1'), 'base64').toString('utf8'));
    if (kw === 'ccv3') ccv3 = JSON.parse(val.toString('utf8'));
  }
  if (type === 'IEND') break;
  off += 12 + len;
}
console.log('chunks:', chunks.join(', '));
console.log('chara spec:', chara && chara.spec, '| entries:', chara && chara.data.character_book.entries.length, '| scripts:', chara && chara.data.extensions.tavern_helper.scripts.length, '| regex:', chara && chara.data.extensions.regex_scripts.length);
console.log('ccv3 spec:', ccv3 && ccv3.spec, '| name:', ccv3 && ccv3.data.name, '| alternate:', ccv3 && ccv3.data.alternate_greetings.length);
console.log('ccv3===chara:', JSON.stringify(ccv3) === JSON.stringify(chara));
// 结构抽查
const e = ccv3.data.character_book.entries;
const pos0 = e.filter(x => x.extensions.position === 0).length;
const pos1 = e.filter(x => x.extensions.position === 1).length;
const disabled = e.filter(x => x.enabled === false).length;
console.log('position 0/1:', pos0, '/', pos1, '| disabled(默认关):', disabled, '(=initvar+21秘密+N4=23)');
const mvuE = e.filter(x => x.comment.includes('[mvu_update]'));
const plotE = e.filter(x => x.comment.includes('[mvu_plot]'));
console.log('[mvu_update]:', mvuE.length, '| [mvu_plot]:', plotE.length, '| 未标记(=initvar):', e.length - mvuE.length - plotE.length);
// 创角页抽查
const fm = ccv3.data.first_mes;
console.log('first_mes: 长度', fm.length, '| 代码块包裹:', fm.startsWith('```html'), '| Mvu写回:', fm.includes('replaceMvuData'), '| triggerSlash:', fm.includes('triggerSlash'), '| base64头像:', (fm.match(/data:image\/jpeg;base64,/g) || []).length, '处');
// JSON 卡同样抽查
const json = JSON.parse(readFileSync(new globalThis.URL('../输出/在DC频道里口嗨的群友就住我隔壁？！ v1.0.json', import.meta.url), 'utf8'));
console.log('json.spec:', json.spec, '| 与 png 卡一致:', JSON.stringify(json) === JSON.stringify(ccv3));
