/*!
 * 《但为君故 · 沉吟至今》· 前端渲染 v1.0（酒馆助手脚本 · 卡内嵌）
 * ---------------------------------------------------------------------------
 * 主题：夜航档案 · **青冷**（2026-09-13 定案）｜ 令牌依据：frontend/tokens.md
 * 样张：frontend/preview.html（同一套 .nd-* 类名与令牌，预览即实现基础）
 *
 * 【两个 surface，职责分离】
 *  1) 状态栏：追加在最新 AI 楼层下方——世界条（含面纱）+ 玩家自身条 + 五人条
 *  2) 群像档案页：右下角悬浮按钮 → 全屏层（跳板卡 → 单人档案）
 *   注意：**这不是控制台**。档案页只读展示，不做设置、不做写变量。
 *
 * 【状态所有权（严格遵守）】
 *  数据态：只读 Mvu.getMvuData() → stat_data。本脚本**绝不写变量**。
 *  派生视图：derive() 负责格式化/截断/兜底，不产生新的持久状态。
 *  UI 态：overlay 开关、当前档案索引，仅存内存，不落盘。
 *
 * 【防御性渲染】
 *  所有来自 stat_data 的文本一律经 esc() 转义；缺失字段有明确兜底；
 *  数值 clamp 到合法区间；未知枚举值原样显示并标为可疑，不静默吞掉。
 *
 * 【可访问性】
 *  装饰性 svg 标 aria-hidden；数值条带 role="img" + aria-label；
 *  overlay 支持 Escape 关闭并把焦点还给悬浮按钮；尊重 prefers-reduced-motion。
 *
 * 【第三方资源】
 *  图标 8 枚来自 Lucide（ISC；部分源自 Feather，MIT）。署名须写入 creator_notes。
 *
 * 【未验证声明】本文件从未在真实 SillyTavern 中运行。以下必须实机确认：
 *  (1) iframe 内 parent.document 访问是否可用；(2) Mvu 全局与事件常量；
 *  (3) 动态插入 DOM 的 class 是否被宿主命名空间化；(4) clip-path 渲染一致性；
 *  (5) 320px 窄容器与移动端键盘；(6) prefers-reduced-motion 是否传入 iframe。
 * ---------------------------------------------------------------------------
 */
(function () {
  'use strict';

  var TAG = '[夜航档案]';
  var FAB_ID = 'nd-fab';
  var LAYER_ID = 'nd-layer';
  var STYLE_ID = 'nd-style';
  var STATUS_CLS = 'nd-status';

  /* ══════════════════════════════════════════════════════════
     1. 令牌与样式（青冷主题；作用域限定在 .nd-scope）
     ══════════════════════════════════════════════════════════ */
  var CSS = [
    /* ── 令牌 ── */
    '.nd-scope{',
    '--nd-bg-deep:#060E12;--nd-bg-panel:#0B161C;--nd-bg-raise:#12222A;',
    '--nd-line:#1B323B;--nd-line-strong:#2A4E5A;--nd-line-soft:#14262E;',
    '--nd-text:#E4F1F4;--nd-text-dim:#9FBAC2;--nd-text-mute:#6E8C95;',
    '--nd-cyan:#5FD4E0;--nd-safe:#74C08A;--nd-warn:#D9A93C;--nd-seal:#E06055;',
    '--nd-font:"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",system-ui,sans-serif;',
    '--nd-fs-lg:15px;--nd-fs-md:13px;--nd-fs-sm:12px;--nd-fs-xs:11px;',
    '--nd-ls-label:.18em;--nd-ls-name:.08em;--nd-num:tabular-nums;',
    '--nd-sp-1:4px;--nd-sp-2:8px;--nd-sp-3:12px;--nd-sp-4:16px;--nd-sp-5:22px;',
    '--nd-panel-w:680px;--nd-overlay-w:1080px;--nd-bar-h:5px;--nd-tap:44px;',
    '--nd-grid-line:rgba(95,212,224,.022);',
    '--nd-noise:url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'160\' height=\'160\' filter=\'url(%23n)\'/%3E%3C/svg%3E");',
    '--nd-hatch:repeating-linear-gradient(135deg,rgba(232,228,217,.055) 0 1px,transparent 1px 7px);',
    'font-family:var(--nd-font);font-size:var(--nd-fs-md);line-height:1.75;color:var(--nd-text);',
    'box-sizing:border-box;',
    '}',
    '.nd-scope *,.nd-scope *::before,.nd-scope *::after{box-sizing:border-box;}',

    /* ── 图标 ── */
    '.nd-ico{width:13px;height:13px;flex:none;stroke:currentColor;stroke-width:2;fill:none;',
    'stroke-linecap:round;stroke-linejoin:round;vertical-align:-2px;opacity:.9;}',

    /* ── 状态栏容器 ── */
    '.nd-status{width:min(100%,var(--nd-panel-w));margin:var(--nd-sp-4) auto var(--nd-sp-2);',
    'display:flex;flex-direction:column;gap:var(--nd-sp-3);}',

    /* ── 面板 / 卡片（斜切 + 内描边 + 细网格） ── */
    '.nd-panel,.nd-card{position:relative;background-color:var(--nd-bg-panel);',
    'background-image:repeating-linear-gradient(0deg,var(--nd-grid-line) 0 1px,transparent 1px 9px),',
    'repeating-linear-gradient(90deg,var(--nd-grid-line) 0 1px,transparent 1px 9px);',
    'border-top:1px solid var(--nd-line);border-left:2px solid var(--nd-line);',
    'clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));',
    'box-shadow:inset 0 0 0 1px rgba(95,212,224,.12),inset 0 2px 12px rgba(6,14,18,.55);}',
    '.nd-panel{padding:var(--nd-sp-3) var(--nd-sp-4);}',
    '.nd-panel.is-warn,.nd-card.is-warn{border-left-color:var(--nd-warn);}',
    '.nd-panel.is-seal,.nd-card.is-seal{border-left-color:var(--nd-seal);}',
    '.nd-panel.is-safe,.nd-card.is-safe{border-left-color:var(--nd-safe);}',

    /* ── 标签 ── */
    '.nd-label{font-size:var(--nd-fs-xs);letter-spacing:var(--nd-ls-label);color:var(--nd-text-dim);',
    'display:inline-flex;align-items:center;gap:var(--nd-sp-1);}',
    '.nd-label .nd-ico{color:var(--nd-cyan);}',

    /* ── 数值条（带刻度） ── */
    '.nd-bar{position:relative;height:var(--nd-bar-h);background:var(--nd-bg-raise);overflow:hidden;flex:1;min-width:40px;',
    'background-image:repeating-linear-gradient(90deg,transparent 0 23.5%,rgba(6,14,18,.8) 23.5% 25%);}',
    '.nd-bar>i{position:absolute;inset:0 auto 0 0;display:block;background:var(--nd-safe);}',
    '.nd-bar>i.is-warn{background:var(--nd-warn);}',
    '.nd-bar>i.is-seal{background:var(--nd-seal);}',
    '.nd-bar>i.is-neg{background:linear-gradient(90deg,#7A4638,var(--nd-seal));}',

    /* ── 形状标记 ── */
    '.nd-shape{display:inline-block;width:8px;height:8px;flex:none;vertical-align:-1px;}',
    '.nd-shape.s-normal{border:1px solid var(--nd-text-dim);}',
    '.nd-shape.s-warn{border:1px solid var(--nd-warn);background:linear-gradient(135deg,var(--nd-warn) 0 50%,transparent 50% 100%);}',
    '.nd-shape.s-danger{background:var(--nd-seal);}',
    '.nd-shape.s-safe{border:1px solid var(--nd-safe);border-radius:50%;}',

    /* ── 徽记 ── */
    '.nd-tag{display:inline-flex;align-items:center;gap:var(--nd-sp-1);font-size:var(--nd-fs-xs);letter-spacing:.08em;',
    'border:1px solid var(--nd-line);color:var(--nd-text-dim);padding:1px var(--nd-sp-2);white-space:nowrap;}',
    '.nd-tag.is-safe{border-color:rgba(116,192,138,.55);color:var(--nd-safe);}',
    '.nd-tag.is-seal{border-color:rgba(224,96,85,.55);color:var(--nd-seal);}',
    '.nd-tag.is-off{border-color:var(--nd-line-soft);color:var(--nd-text-mute);}',
    '.nd-tag.is-warn{border-color:rgba(217,169,60,.5);color:var(--nd-warn);}',

    /* ── 世界条 ── */
    '.nd-now{display:flex;flex-wrap:wrap;gap:var(--nd-sp-3) var(--nd-sp-5);align-items:flex-start;}',
    '.nd-now .grp{display:flex;flex-direction:column;gap:var(--nd-sp-1);min-width:0;}',
    '.nd-now .grp.grow{flex:1 1 180px;}',
    '.nd-now .val{font-size:var(--nd-fs-md);color:var(--nd-text);}',
    '.nd-now .val .sep{color:var(--nd-text-mute);margin:0 var(--nd-sp-1);}',
    '.nd-veil{display:inline-flex;align-items:center;gap:var(--nd-sp-2);padding:2px var(--nd-sp-2);',
    'border:1px solid currentColor;background-image:var(--nd-hatch);box-shadow:inset 0 0 0 1px rgba(95,212,224,.0);}',
    '.nd-veil.is-ok{color:var(--nd-text-dim);}',
    '.nd-veil.is-warn{color:var(--nd-warn);}',
    '.nd-veil.is-seal{color:var(--nd-seal);}',
    '.nd-rule{height:1px;background:var(--nd-line);margin:var(--nd-sp-2) 0;border:0;}',
    '.nd-meter{display:flex;align-items:center;gap:var(--nd-sp-2);}',
    '.nd-meter .k{font-size:var(--nd-fs-xs);letter-spacing:var(--nd-ls-label);color:var(--nd-text-mute);',
    'white-space:nowrap;display:inline-flex;align-items:center;gap:var(--nd-sp-1);}',
    '.nd-meter .v{font-size:var(--nd-fs-sm);color:var(--nd-text-dim);font-variant-numeric:var(--nd-num);white-space:nowrap;}',
    '.nd-meter .g{font-size:var(--nd-fs-xs);letter-spacing:.1em;white-space:nowrap;display:inline-flex;align-items:center;gap:var(--nd-sp-1);}',
    '.nd-meter .g.is-safe{color:var(--nd-safe);}',
    '.nd-meter .g.is-warn{color:var(--nd-warn);}',
    '.nd-meter .g.is-seal{color:var(--nd-seal);}',

    /* ── 五人条 ── */
    '.nd-mem{display:flex;flex-direction:column;gap:var(--nd-sp-2);}',
    '.nd-card .in{display:flex;gap:var(--nd-sp-3);padding:var(--nd-sp-3);}',
    '.nd-face{width:44px;height:52px;flex:none;border:1px solid var(--nd-line-strong);background:var(--nd-bg-raise);',
    'display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:var(--nd-text-mute);',
    'position:relative;box-shadow:inset 0 0 0 3px rgba(6,14,18,.7);}',
    '.nd-card.is-safe .nd-face{color:var(--nd-safe);border-color:rgba(116,192,138,.5);}',
    '.nd-face img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 15%;}',
    '.nd-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:var(--nd-sp-2);}',
    '.nd-idline{display:flex;align-items:baseline;gap:var(--nd-sp-2);flex-wrap:wrap;}',
    '.nd-idline .net{font-size:var(--nd-fs-lg);font-weight:700;letter-spacing:var(--nd-ls-name);word-break:break-word;}',
    '.nd-idline .real{font-size:var(--nd-fs-sm);color:var(--nd-safe);}',
    '.nd-idline .real.unknown{color:var(--nd-text-mute);letter-spacing:.2em;}',
    '.nd-mask{display:flex;gap:var(--nd-sp-1);flex-wrap:wrap;}',
    '.nd-stage{display:flex;align-items:center;gap:var(--nd-sp-2);flex-wrap:wrap;}',
    '.nd-stage .stg{font-size:var(--nd-fs-sm);color:var(--nd-text);}',
    '.nd-stage .stg.is-safe{color:var(--nd-safe);}',
    '.nd-stage .stg.is-seal{color:var(--nd-seal);}',

    /* ── 悬浮按钮 ── */
    '#' + FAB_ID + '{position:fixed;right:14px;bottom:16px;z-index:9990;width:var(--nd-tap);height:var(--nd-tap);',
    'cursor:pointer;background:rgba(95,212,224,.28);border:0;padding:0;',
    'clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));',
    'font-family:var(--nd-font);}',
    '#' + FAB_ID + ' .in{position:absolute;inset:1px;display:flex;align-items:center;justify-content:center;',
    'background:rgba(6,14,18,.95);color:var(--nd-cyan);font-size:15px;letter-spacing:.1em;',
    'clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));}',
    '#' + FAB_ID + ':hover .in,#' + FAB_ID + ':focus-visible .in{color:#DFF7FA;}',

    /* ── 群像层 ── */
    '#' + LAYER_ID + '{position:fixed;inset:0;z-index:9991;overflow:auto;background-color:var(--nd-bg-deep);',
    'background-image:radial-gradient(760px 420px at 84% -8%,rgba(95,212,224,.06),transparent 62%),',
    'radial-gradient(620px 420px at -10% 28%,rgba(224,96,85,.04),transparent 60%),var(--nd-noise);',
    'font-family:var(--nd-font);color:var(--nd-text);}',
    '#' + LAYER_ID + '::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.3;z-index:2;',
    'background-image:repeating-linear-gradient(0deg,rgba(95,212,224,.06) 0 1px,transparent 1px 4px);}',
    '#' + LAYER_ID + ' .nd-wrap{position:relative;z-index:3;max-width:var(--nd-overlay-w);margin:0 auto;padding:var(--nd-sp-5) var(--nd-sp-5) 80px;}',
    '#' + LAYER_ID + ' .nd-nav{display:flex;align-items:center;gap:var(--nd-sp-4);flex-wrap:wrap;',
    'border-bottom:1px solid var(--nd-line);padding-bottom:var(--nd-sp-3);margin-bottom:var(--nd-sp-4);}',
    '#' + LAYER_ID + ' .nd-ttl{font-size:var(--nd-fs-lg);font-weight:700;letter-spacing:var(--nd-ls-label);}',
    '#' + LAYER_ID + ' .nd-ttl::before{content:"▍";color:var(--nd-cyan);margin-right:var(--nd-sp-2);font-weight:400;}',
    '#' + LAYER_ID + ' .nd-meta{font-size:var(--nd-fs-xs);color:var(--nd-text-mute);letter-spacing:.06em;}',
    '#' + LAYER_ID + ' .nd-close{margin-left:auto;cursor:pointer;background:none;border:1px solid var(--nd-line-strong);',
    'color:var(--nd-text-dim);font-family:inherit;font-size:var(--nd-fs-xs);letter-spacing:.14em;',
    'padding:6px 14px;min-height:32px;}',
    '#' + LAYER_ID + ' .nd-close:hover,#' + LAYER_ID + ' .nd-close:focus-visible{color:var(--nd-cyan);border-color:var(--nd-cyan);}',
    '#' + LAYER_ID + ' .nd-hub{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:var(--nd-sp-3);}',
    '#' + LAYER_ID + ' a.nd-hubcard{text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:var(--nd-sp-2);',
    'padding:var(--nd-sp-3);cursor:pointer;transition:transform .15s ease;}',
    '#' + LAYER_ID + ' a.nd-hubcard:hover,#' + LAYER_ID + ' a.nd-hubcard:focus-visible{transform:translateY(-2px);border-left-color:var(--nd-cyan);}',
    '#' + LAYER_ID + ' .nd-hubcard .top{display:flex;align-items:center;gap:var(--nd-sp-3);min-width:0;}',
    '#' + LAYER_ID + ' .nd-hubcard .go{margin-top:auto;padding-top:var(--nd-sp-2);border-top:1px solid var(--nd-line-soft);',
    'font-size:var(--nd-fs-xs);color:var(--nd-text-mute);letter-spacing:.16em;text-align:right;}',
    '#' + LAYER_ID + ' .nd-hubcard:hover .go{color:var(--nd-cyan);}',
    '#' + LAYER_ID + ' .nd-arch{display:grid;grid-template-columns:5fr 4fr;gap:var(--nd-sp-4);}',
    '#' + LAYER_ID + ' .nd-arch>*{min-width:0;display:flex;flex-direction:column;gap:var(--nd-sp-3);}',
    '#' + LAYER_ID + ' .nd-portrait{min-height:360px;display:flex;align-items:center;justify-content:center;position:relative;',
    'background-color:var(--nd-bg-panel);border:1px solid var(--nd-line-strong);',
    'background-image:linear-gradient(160deg,rgba(95,212,224,.05),transparent 55%);',
    'clip-path:polygon(0 0,calc(100% - 20px) 0,100% 20px,100% 100%,20px 100%,0 calc(100% - 20px));}',
    '#' + LAYER_ID + ' .nd-portrait .glyph{font-size:84px;font-weight:700;color:rgba(110,140,149,.42);}',
    '#' + LAYER_ID + ' .nd-portrait .cap{position:absolute;left:var(--nd-sp-3);bottom:var(--nd-sp-3);',
    'font-size:var(--nd-fs-xs);color:var(--nd-text-mute);letter-spacing:var(--nd-ls-label);}',
    '#' + LAYER_ID + ' .nd-ptitle{font-size:var(--nd-fs-md);font-weight:600;letter-spacing:var(--nd-ls-label);',
    'display:flex;align-items:center;gap:var(--nd-sp-2);}',
    '#' + LAYER_ID + ' .nd-ptitle::before{content:"◇";font-size:9px;color:var(--nd-cyan);font-weight:400;}',
    '#' + LAYER_ID + ' .nd-ptitle small{font-size:var(--nd-fs-xs);color:var(--nd-text-mute);letter-spacing:.08em;font-weight:400;}',
    '#' + LAYER_ID + ' .nd-kv{display:grid;grid-template-columns:92px 1fr;gap:var(--nd-sp-2) var(--nd-sp-3);margin-top:var(--nd-sp-3);font-size:var(--nd-fs-sm);}',
    '#' + LAYER_ID + ' .nd-kv dt{color:var(--nd-text-mute);letter-spacing:.14em;font-size:var(--nd-fs-xs);display:flex;align-items:center;gap:var(--nd-sp-1);}',
    '#' + LAYER_ID + ' .nd-kv dd{margin:0;color:var(--nd-text);word-break:break-word;}',
    '.nd-facts{display:flex;flex-wrap:wrap;gap:var(--nd-sp-2);margin-top:var(--nd-sp-3);}',
    '#' + LAYER_ID + ' .nd-back{color:var(--nd-text-dim);font-size:var(--nd-fs-xs);letter-spacing:var(--nd-ls-label);',
    'background:none;border:0;padding:var(--nd-sp-2) 0;cursor:pointer;font-family:inherit;}',
    '#' + LAYER_ID + ' .nd-back:hover{color:var(--nd-cyan);}',

    /* ── 窄容器与动效降级 ── */
    '@media (max-width:860px){#' + LAYER_ID + ' .nd-arch{grid-template-columns:1fr;}}',
    '@media (max-width:420px){.nd-status{width:100%;}.nd-card .in{padding:var(--nd-sp-2);gap:var(--nd-sp-2);}}',
    '@media (prefers-reduced-motion:reduce){#' + LAYER_ID + ' a.nd-hubcard{transition:none;}#' + LAYER_ID + ' a.nd-hubcard:hover{transform:none;}}'
  ].join('');

  /* ══════════════════════════════════════════════════════════
     2. 静态配置
     ══════════════════════════════════════════════════════════ */
  // 角色键＝现实名（与 schema/InitialVariables 一致）；net 为线上网名
  var MEMBERS = [
    { key: '藤原花奈', net: '佐久间眠',            glyph: '花' },
    { key: '顾清寒',   net: '珍惜才配拥有',        glyph: '珍' },
    { key: '鱼沉秋',   net: 'cojack',              glyph: '秋' },
    { key: '楚羽笙',   net: '楚楚的笙_unofficial', glyph: '笙' },
    { key: '诺薇拉',   net: '冯诺依曼',            glyph: '诺' }
  ];

  // Lucide 图标（ISC）——内联 path，currentColor 继承
  var ICON = {
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    veil: '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    zap: '<path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/>',
    pulse: '<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/><path d="M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
    card: '<path d="M13 19a4 4 0 00-8 0"/><path d="M16 10h2"/><path d="M16 14h2"/><circle cx="9" cy="12" r="3"/><rect x="2" y="5" width="20" height="14" rx="2"/>',
    search: '<path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/>'
  };

  // 枚举取值域（与 zod_schema 保持一致；用于“可疑值”判定）
  var ENUM = {
    时段: ['早间','上午','午间','下午','傍晚','晚间','深夜','凌晨'],
    面纱: ['完好','有裂痕','局部暴露'],
    觉醒阶段: ['未觉醒','初醒','掌控','过载'],
    关系阶段: ['陌生人','认识','熟悉','信任','亲密','破裂']
  };

  /* ══════════════════════════════════════════════════════════
     3. 工具
     ══════════════════════════════════════════════════════════ */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function ico(name) {
    return '<svg class="nd-ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[name] || '') + '</svg>';
  }
  function text(v, fallback) {
    if (v === undefined || v === null || v === '') return fallback === undefined ? '未知' : fallback;
    var s = String(v);
    return s.length > 120 ? s.slice(0, 118) + '…' : s;   // 长 CJK 截断，避免撑破容器
  }
  function num(v, lo, hi, fallback) {
    var n = typeof v === 'number' ? v : Number(v);
    if (!isFinite(n)) return fallback === undefined ? 0 : fallback;
    return Math.max(lo, Math.min(hi, n));
  }
  // 枚举值校验：非法值原样显示并标记，不静默吞
  function enumOf(group, v, fallback) {
    var s = v === undefined || v === null || v === '' ? fallback : String(v);
    var ok = ENUM[group] && ENUM[group].indexOf(s) >= 0;
    return { text: s, suspect: !ok };
  }
  function favorPct(fav) { return Math.round((fav + 100) / 2); }
  function signed(n) { return (n >= 0 ? '+' : '\u2212') + Math.abs(n); }

  // 数值 → 档位（颜色 + 文字 + 形状，三重编码）
  function meter(v) {
    if (v <= 20) return { text: '轻微', cls: 'is-safe', shape: 's-safe' };
    if (v <= 50) return { text: '明显', cls: 'is-warn', shape: 's-warn' };
    if (v <= 80) return { text: '严重', cls: 'is-warn', shape: 's-warn' };
    return { text: '危险', cls: 'is-seal', shape: 's-danger' };
  }
  // 面纱三态
  function veil(v) {
    if (v === '完好')     return { text: '完好',     cls: 'is-ok',   shape: 's-normal', box: '' };
    if (v === '有裂痕')   return { text: '有裂痕',   cls: 'is-warn', shape: 's-warn',   box: 'is-warn' };
    if (v === '局部暴露') return { text: '局部暴露', cls: 'is-seal', shape: 's-danger', box: 'is-seal' };
    return { text: text(v, '未知'), cls: 'is-ok', shape: 's-normal', box: '' };
  }
  function stageCls(s) {
    if (s === '信任' || s === '亲密') return 'is-safe';
    if (s === '破裂') return 'is-seal';
    return '';
  }

  /* ══════════════════════════════════════════════════════════
     4. 数据映射：stat_data → 视图模型（**只读**）
     ══════════════════════════════════════════════════════════ */
  function derive(stat) {
    stat = stat || {};
    var w = stat['世界'] || {};
    var p = stat['主控'] || {};
    var roles = stat['角色'] || {};
    var ev = stat['事件'] || {};

    var veilState = enumOf('面纱', w['面纱'], '完好');
    var awake = enumOf('觉醒阶段', p['觉醒阶段'], '未觉醒');

    var members = MEMBERS.map(function (m) {
      var r = roles[m.key] || {};
      var fav = num(r['好感'], -100, 100, 0);
      var stageRaw = enumOf('关系阶段', r['关系阶段'], '陌生人');
      var 已遇 = r['已遇'] === true;
      var 身份已知 = r['现实身份已知'] === true;
      var 觉醒已知 = r['已知为觉醒者'] === true;
      return {
        key: m.key, net: m.net, glyph: m.glyph,
        name: text(m.key, ''),           // 键即现实名
        已遇: 已遇, 身份已知: 身份已知, 觉醒已知: 觉醒已知,
        阶段: stageRaw.text, 阶段可疑: stageRaw.suspect, 阶段类: stageCls(stageRaw.text),
        好感: fav, 其他信息: text(r['其他信息'], '')
      };
    });
     var 已揭面具 = 0, 总面具 = members.length * 2;
    members.forEach(function (m) { if (m.身份已知) 已揭面具++; if (m.觉醒已知) 已揭面具++; });

    var events = Array.isArray(ev['进行中']) ? ev['进行中'].slice(0, 5) : [];

    return {
      世界: {
        日期: text(w['日期'], '日期未详'),
        时段: enumOf('时段', w['时段'], '时段未详').text,
        区: text(w['区'], '未定'),
        场所: text(w['场所'], ''),
        面纱: veilState.text,
        面纱可疑: veilState.suspect
      },
      主控: {
        姓名: text(p['姓名'], '（未命名）'),
        来历: text(p['来历'], '未知'),
        异能: text(p['异能'], ''),
        异能倾向: text(p['异能倾向'], ''),
        觉醒阶段: awake.text,
        觉醒可疑: awake.suspect,
        代价: num(p['代价'], 0, 100, 0),
        暴露度: num(p['暴露度'], 0, 100, 0)
      },
      成员: members,
      事件: events,
      已揭面具: 已揭面具,
      总面具: 总面具,
      结构版本: num(stat['结构版本'], 0, 999, 1)
    };
  }

  /* ══════════════════════════════════════════════════════════
     5. 构件
     ══════════════════════════════════════════════════════════ */
  function meterHTML(k, iconName, value, extra) {
    var m = meter(value);
    return '<div class="nd-meter">' +
      '<span class="k">' + ico(iconName) + esc(k) + '</span>' +
      '<span class="nd-bar" role="img" aria-label="' + esc(k) + ' ' + value + ' / 100，' + esc(m.text) + '">' +
        '<i class="' + (m.cls === 'is-safe' ? '' : m.cls) + '" style="width:' + value + '%"></i></span>' +
      '<span class="v">' + value + ' / 100</span>' +
      '<span class="g ' + m.cls + '"><span class="nd-shape ' + m.shape + '"></span> ' + esc(m.text) + '</span>' +
      (extra || '') +
    '</div>';
  }

  function nowHTML(vm) {
    var w = vm.世界, p = vm.主控;
    var v = veil(w.面纱);
    var place = w.场所 ? (w.区 + ' · ' + w.场所) : w.区;
    return '<div class="nd-panel ' + (v.box || '') + '">' +
      '<div class="nd-now">' +
        '<div class="grp"><span class="nd-label">' + ico('clock') + '时间地点</span>' +
          '<span class="val">' + esc(w.日期) + '<span class="sep">·</span>' + esc(w.时段) +
          '<span class="sep">·</span>' + esc(place) + '</span></div>' +
        '<div class="grp"><span class="nd-label">' + ico('veil') + '面纱</span>' +
          '<span class="nd-veil ' + v.cls + '"><span class="nd-shape ' + v.shape + '"></span>' + esc(v.text) +
          (w.面纱可疑 ? '<span class="u">（值可疑）</span>' : '') + '</span></div>' +
        '<div class="grp grow"><span class="nd-label">' + ico('zap') + '你自己</span>' +
          '<span class="val">' + esc(p.觉醒阶段) +
          (p.异能 ? ('<span class="sep">·</span>' + esc(p.异能)) : '<span class="sep">·</span>异能未定型') +
          '</span></div>' +
      '</div>' +
      '<hr class="nd-rule">' +
      meterHTML('代价', 'pulse', p.代价) +
      '<div style="height:' + '8px"></div>' +
      meterHTML('暴露度', 'eye', p.暴露度) +
    '</div>';
  }

  function memberHTML(m) {
    var idHTML = m.身份已知
      ? '<span class="real">' + esc(m.name) + '</span>'
      : '<span class="real unknown">？？？</span>';
    var tags = [];
    tags.push(m.身份已知
      ? '<span class="nd-tag is-safe"><span class="nd-shape s-safe"></span>身份已知</span>'
      : '<span class="nd-tag is-off"><span class="nd-shape s-normal"></span>身份未揭晓</span>');
    tags.push(m.觉醒已知
      ? '<span class="nd-tag is-safe"><span class="nd-shape s-safe"></span>觉醒者已知</span>'
      : '<span class="nd-tag is-off"><span class="nd-shape s-normal"></span>觉醒者未知</span>');
    if (!m.已遇) tags = ['<span class="nd-tag is-off"><span class="nd-shape s-normal"></span>未相遇</span>'];
    var fav = m.好感, neg = fav < 0, pct = favorPct(fav);
    var cardCls = m.阶段类 ? (' is-' + m.阶段类.replace('is-', '')) : '';
    return '<div class="nd-card' + cardCls + '"><div class="in">' +
      '<div class="nd-face" aria-hidden="true">' + esc(m.glyph) + '</div>' +
      '<div class="nd-body">' +
        '<div class="nd-idline"><span class="net">' + esc(m.net) + '</span>' + idHTML + '</div>' +
        '<div class="nd-mask">' + tags.join('') + '</div>' +
        '<div class="nd-stage">' +
          '<span class="nd-bar" role="img" aria-label="好感 ' + fav + '，关系阶段 ' + esc(m.阶段) + '">' +
            '<i class="' + (neg ? 'is-neg' : '') + '" style="width:' + pct + '%"></i></span>' +
          '<span class="v" style="font-size:var(--nd-fs-sm);color:' + (neg ? 'var(--nd-seal)' : 'var(--nd-text-dim)') +
            ';font-variant-numeric:var(--nd-num)">好感 ' + signed(fav) + '</span>' +
          '<span class="stg ' + m.阶段类 + '">' + esc(m.阶段) + (m.阶段可疑 ? '？' : '') + '</span>' +
        '</div>' +
      '</div>' +
    '</div></div>';
  }

  function eventsHTML(vm) {
    if (!vm.事件.length) return '';
    var items = vm.事件.map(function (e) {
      var t = text(e && e['标题'], '未命名线索');
      var s = text(e && e['状态'], '未接');
      return '<span class="nd-tag">' + ico('search') + esc(t) + ' · ' + esc(s) + '</span>';
    }).join('');
    return '<div class="nd-panel"><div class="nd-label">' + ico('search') + '进行中</div>' +
      '<div class="nd-facts">' + items + '</div></div>';
  }

  function statusHTML(vm) {
    return '<div class="' + STATUS_CLS + ' nd-scope">' +
      nowHTML(vm) +
      eventsHTML(vm) +
      '<div class="nd-mem">' + vm.成员.map(memberHTML).join('') + '</div>' +
    '</div>';
  }

  /* ── 群像层构件 ── */
  function hubCardHTML(m, idx) {
    var fav = m.好感, neg = fav < 0;
    return '<a class="nd-hubcard nd-card' + (m.阶段类 ? (' is-' + m.阶段类.replace('is-', '')) : '') + '" data-arch="' + idx + '" href="#" role="button">' +
      '<span class="top"><span class="nd-face" aria-hidden="true">' + esc(m.glyph) + '</span>' +
        '<span style="min-width:0"><span style="display:block;font-size:var(--nd-fs-md);font-weight:700;letter-spacing:var(--nd-ls-name);word-break:break-word">' + esc(m.net) + '</span>' +
        '<span style="display:block;font-size:var(--nd-fs-xs);letter-spacing:.1em;color:' + (m.身份已知 ? 'var(--nd-safe)' : 'var(--nd-text-mute)') + '">' +
          (m.身份已知 ? ('已揭晓 · ' + esc(m.name)) : (m.已遇 ? '身份未揭晓' : '未相遇')) + '</span></span></span>' +
      '<span class="nd-mask">' + (m.身份已知
        ? '<span class="nd-tag is-safe"><span class="nd-shape s-safe"></span>身份已知</span>'
        : '<span class="nd-tag is-off"><span class="nd-shape s-normal"></span>身份未揭晓</span>') +
        (m.觉醒已知 ? '<span class="nd-tag is-safe"><span class="nd-shape s-safe"></span>觉醒者已知</span>' : '') + '</span>' +
      '<span class="nd-stage"><span class="nd-bar"><i class="' + (neg ? 'is-neg' : '') + '" style="width:' + favorPct(fav) + '%"></i></span>' +
        '<span class="v" style="font-size:var(--nd-fs-sm);color:var(--nd-text-dim);font-variant-numeric:var(--nd-num)">' + signed(fav) + '</span></span>' +
      '<span class="nd-stage"><span class="stg ' + m.阶段类 + '">' + esc(m.阶段) + '</span></span>' +
      '<span class="go">打开档案 ◇</span>' +
    '</a>';
  }

  function archiveHTML(m) {
    var neg = m.好感 < 0;
    return '<div class="nd-arch">' +
      '<div><div class="nd-portrait"><span class="glyph" aria-hidden="true">' + esc(m.glyph) + '</span>' +
        '<span class="cap">' + (m.身份已知 ? '立绘位（身份已揭晓）' : '头像位（身份未揭晓）') + '</span></div></div>' +
      '<div>' +
        '<div class="nd-panel ' + (m.阶段类 || '') + '">' +
          '<div class="nd-ptitle">档案 <small>DOSSIER</small></div>' +
          '<dl class="nd-kv">' +
            '<dt>' + ico('card') + '网名</dt><dd>' + esc(m.net) + '</dd>' +
            '<dt>身份</dt><dd' + (m.身份已知 ? '' : ' style="color:var(--nd-text-mute);letter-spacing:.2em"') + '>' +
              (m.身份已知 ? esc(m.name) + '（真名 · 已揭晓）' : '？？？（未揭晓）') + '</dd>' +
            '<dt>关系</dt><dd>' + esc(m.阶段) + '</dd>' +
            '<dt>登场</dt><dd>' + (m.已遇 ? '已线下相遇' : '未相遇') + '</dd>' +
            (m.其他信息 ? ('<dt>备注</dt><dd>' + esc(m.其他信息) + '</dd>') : '') +
          '</dl>' +
          '<hr class="nd-rule">' +
          '<div class="nd-ptitle">面具 <small>MASK</small></div>' +
          '<div class="nd-facts">' +
            (m.身份已知
              ? '<span class="nd-tag is-safe"><span class="nd-shape s-safe"></span>身份已知</span>'
              : '<span class="nd-tag is-off"><span class="nd-shape s-normal"></span>身份未揭晓</span>') +
            (m.觉醒已知
              ? '<span class="nd-tag is-safe"><span class="nd-shape s-safe"></span>觉醒者已知</span>'
              : '<span class="nd-tag is-off"><span class="nd-shape s-normal"></span>觉醒者未知</span>') +
          '</div>' +
        '</div>' +
        '<div class="nd-panel">' +
          '<div class="nd-ptitle">好感 <small>FAVOR</small></div>' +
          '<div class="nd-meter" style="margin-top:var(--nd-sp-3)">' +
            '<span class="nd-bar" role="img" aria-label="好感 ' + m.好感 + '"><i class="' + (neg ? 'is-neg' : '') + '" style="width:' + favorPct(m.好感) + '%"></i></span>' +
            '<span class="v">' + signed(m.好感) + ' / 100</span>' +
            '<span class="g ' + m.阶段类 + '">' + esc(m.阶段) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  /* ══════════════════════════════════════════════════════════
     6. 挂载与生命周期
     ══════════════════════════════════════════════════════════ */
  var pdoc = document, pwin = window;
  var state = { lastMesId: null, overlay: null, archIdx: null, openBtn: null };
  var debTimer = null, lastSig = '';

  function ensureStyle() {
    if (pdoc.getElementById(STYLE_ID)) return;
    var st = pdoc.createElement('style');
    st.id = STYLE_ID;
    st.textContent = CSS;
    (pdoc.head || pdoc.documentElement).appendChild(st);
  }

  function latestAiMes() {
    var all = pdoc.querySelectorAll('#chat > .mes');
    for (var i = all.length - 1; i >= 0; i--) {
      var isUser = all[i].getAttribute('is_user');
      var isSys = all[i].getAttribute('is_system');
      if (isUser !== 'true' && isSys !== 'true') {
        return { el: all[i], mesid: Number(all[i].getAttribute('mesid')) };
      }
    }
    return null;
  }

  function statFor(mesid) {
    try {
      if (typeof Mvu === 'undefined' || !Mvu.getMvuData) return null;
      var d = Mvu.getMvuData({ type: 'message', message_id: mesid });
      return d && d.stat_data ? d.stat_data : null;
    } catch (e) { return null; }
  }

  function renderLatest() {
    if (typeof Mvu === 'undefined') return;
    var t = latestAiMes();
    if (!t || !isFinite(t.mesid)) return;
    var stat = statFor(t.mesid);
    // 未初始化：不渲染（避免污染开局页面）
    if (!stat || !stat['世界'] || !stat['角色']) return;

    var holder = t.el.querySelector(':scope > .mes_text') || t.el.querySelector('.mes_text');
    if (!holder) return;

    var vm = derive(stat);
    var sig = JSON.stringify([vm.世界, vm.主控, vm.成员.map(function (m) { return [m.已遇, m.身份已知, m.觉醒已知, m.好感, m.阶段]; }), vm.事件.length]);
    var box = holder.querySelector(':scope > .' + STATUS_CLS);
    // 签名未变且结构在 → 跳过，避免无谓重排；用户操作后可强制刷新
    if (box && sig === lastSig && state.lastMesId === t.mesid) return;

    if (!box) {
      box = pdoc.createElement('div');
      holder.appendChild(box);
    }
    box.outerHTML = statusHTML(vm);   // 用最新结构替换（含 nd-scope 作用域）
    state.lastMesId = t.mesid;
    lastSig = sig;

    if (state.overlay) renderOverlayBody();
  }

  function ensureFab() {
    if (pdoc.getElementById(FAB_ID)) return;
    var btn = pdoc.createElement('button');
    btn.id = FAB_ID;
    btn.type = 'button';
    btn.title = '群像 · 但为君故';
    btn.setAttribute('aria-label', '打开群像档案页');
    btn.innerHTML = '<span class="in">◇</span>';
    btn.addEventListener('click', function (e) { openOverlay(e.currentTarget); });
    (pdoc.body || pdoc.documentElement).appendChild(btn);
  }

  function currentStat() {
    var stat = state.lastMesId != null ? statFor(state.lastMesId) : null;
    if (!stat) stat = statFor('latest');
    return stat;
  }

  function openOverlay(opener) {
    closeOverlay();
    var layer = pdoc.createElement('div');
    layer.id = LAYER_ID;
    layer.className = 'nd-scope';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-label', '群像档案');
    layer.innerHTML = '<div class="nd-wrap">' +
      '<div class="nd-nav"><span class="nd-ttl">但为君故</span>' +
        '<span class="nd-meta" id="nd-meta"></span>' +
        '<button class="nd-close" id="nd-close" type="button">收起 ×</button></div>' +
      '<div id="nd-body"></div></div>';
    (pdoc.body || pdoc.documentElement).appendChild(layer);
    state.overlay = layer;
    state.archIdx = null;
    state.openBtn = opener || pdoc.getElementById(FAB_ID);
    layer.querySelector('#nd-close').addEventListener('click', closeOverlay);
    layer.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('a.nd-hubcard') : null;
      if (card) {
        e.preventDefault();
        state.archIdx = Number(card.getAttribute('data-arch'));
        renderOverlayBody();
      }
    });
    renderOverlayBody();
    var closeBtn = layer.querySelector('#nd-close');
    if (closeBtn && closeBtn.focus) closeBtn.focus();
  }

  function closeOverlay() {
    if (!state.overlay) return;
    state.overlay.remove();
    state.overlay = null;
    state.archIdx = null;
    if (state.openBtn && state.openBtn.focus) { try { state.openBtn.focus(); } catch (e) {} }
    state.openBtn = null;
  }

  function renderOverlayBody() {
    var layer = state.overlay;
    if (!layer) return;
    var stat = currentStat();
    if (!stat) return;
    var vm = derive(stat);
    var meta = layer.querySelector('#nd-meta');
    if (meta) {
      meta.textContent = '五人 · 已揭面具 ' + vm.已揭面具 + ' / ' + vm.总面具 +
        ' · ' + vm.世界.日期 + ' · ' + vm.世界.时段;
    }
    var body = layer.querySelector('#nd-body');
    if (!body) return;
    if (state.archIdx == null) {
      body.innerHTML = '<div class="nd-hub">' + vm.成员.map(hubCardHTML).join('') + '</div>';
    } else {
      var m = vm.成员[state.archIdx];
      body.innerHTML = m
        ? ('<button class="nd-back" id="nd-back" type="button">◇ 返回群像</button>' + archiveHTML(m))
        : '';
      var back = layer.querySelector('#nd-back');
      if (back) back.addEventListener('click', function () { state.archIdx = null; renderOverlayBody(); });
    }
  }

  function debouncedRender() {
    if (debTimer) clearTimeout(debTimer);
    debTimer = setTimeout(function () { debTimer = null; renderLatest(); }, 350);
  }

  function boot() {
    try { pdoc = (parent && parent.document) ? parent.document : document; } catch (e) { pdoc = document; }
    try { pwin = (parent && parent.window) ? parent.window : window; } catch (e) { pwin = window; }

    if (typeof Mvu === 'undefined') {
      console.warn(TAG, 'Mvu 全局不可用——状态栏与群像页停用（变量系统未加载？）');
      return;
    }
    ensureStyle();
    ensureFab();
    renderLatest();

    // 事件接线：变量更新 / 消息变化 / 兜底 DOM 观察
    if (typeof eventOn === 'function') {
      var ev = (typeof Mvu !== 'undefined' && Mvu.events) || {};
      if (ev.VARIABLE_UPDATE_ENDED) eventOn(ev.VARIABLE_UPDATE_ENDED, debouncedRender);
      if (ev.VARIABLE_INITIALIZED) eventOn(ev.VARIABLE_INITIALIZED, function () { setTimeout(renderLatest, 400); });
      if (typeof tavern_events !== 'undefined') {
        ['MESSAGE_UPDATED','MESSAGE_SWIPED','MESSAGE_RECEIVED','CHAT_CHANGED','MORE_MESSAGES_LOADED']
          .forEach(function (k) { if (tavern_events[k]) eventOn(tavern_events[k], debouncedRender); });
      }
    }
    try {
      var chatEl = pdoc.getElementById('chat');
      if (chatEl && typeof MutationObserver === 'function') {
        new MutationObserver(debouncedRender).observe(chatEl, { childList: true, subtree: false });
      }
    } catch (e) { /* 观察失败不影响主流程 */ }

    // Escape 关闭群像层
    try {
      pdoc.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && state.overlay) { closeOverlay(); }
      });
    } catch (e) {}
  }

  if (typeof $ === 'function') {
    if (typeof errorCatched === 'function') $(errorCatched(boot)); else $(boot);
  } else if (document.readyState !== 'loading') {
    boot();
  } else {
    document.addEventListener('DOMContentLoaded', boot);
  }
})();
