import { readFileSync } from 'node:fs';
const card = JSON.parse(readFileSync(new globalThis.URL('../输出/在DC频道里口嗨的群友就住我隔壁？！ v1.0.json', import.meta.url), 'utf8'));
const fm = card.data.first_mes;

// 1) 创角页拼接处
const i = fm.indexOf('// ── 提交（实卡写入壳');
console.log('--- 写入壳前 300 字：');
console.log(fm.slice(i - 300, i + 60).replace(/\n/g, '⏎'));
const j = fm.indexOf('})();\n</script>');
console.log('--- 结尾 240 字：');
console.log(fm.slice(j - 200, j + 40).replace(/\n/g, '⏎'));

// 2) 渲染脚本资产注入
const sc = card.data.extensions.tavern_helper.scripts;
const wu = sc.find(s => s.name === '雾青前端渲染');
console.log('--- 渲染脚本：占位符残留 =', /__DJG_[A-Z_]+__/.test(wu.content), '| 长度 =', wu.content.length, '| 头像URI =', (wu.content.match(/data:image\/jpeg;base64,/g) || []).length, '处');
console.log('--- 脚本清单:', sc.map(s => s.name + '(' + s.content.length + 'B)').join(' / '));

// 3) R2 关键行
const r2 = sc.find(s => s.name === 'R2迷雾门卫');
console.log('--- R2:', r2.content.includes("secretOpen.get(factId)"), '|', r2.content.includes("Math.abs(fav) >= 50"), '|', r2.content.includes('VARIABLE_UPDATE_ENDED'));

// 4) 正则
console.log('--- 正则:', card.data.extensions.regex_scripts.map(r => `${r.scriptName}(disabled=${r.disabled},promptOnly=${r.promptOnly},mdOnly=${r.markdownOnly})`).join(' | '));

// 5) initvar 原文头 3 行 + 变量列表原样
const e0 = card.data.character_book.entries.find(x => x.comment === '[initvar]初始');
console.log('--- initvar 首行:', JSON.stringify(e0.content.split('\n').slice(0, 3)));
console.log('--- initvar enabled =', e0.enabled, '| 常驻变量列表 enabled =', card.data.character_book.entries.find(x => x.comment === '[mvu_update]变量列表').enabled);
