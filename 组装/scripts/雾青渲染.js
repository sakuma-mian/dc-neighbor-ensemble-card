/*!
 * 《但为君故》雾青前端渲染 v1.0（酒馆助手脚本 · 卡内嵌）
 * 契约：变量映射-v1.md（渲染层只读）＋ DEC-029/030/031（迷雾命名纪律/双头像位/一人一档案）
 * 结构：
 *   1) 最新 AI 楼层下追加「状态栏」（五人条，纯 CSS 雾珠，零外部资源）；
 *   2) 悬浮「◇ 群像」按钮 → 全屏 overlay：群像跳板 + 单人档案（双头像位，揭晓态切换）。
 * 数据：只读 Mvu stat_data → derive() → HTML；绝不写变量（写入口仅创角页，R2 只翻词条开关）。
 * 资产：头像/立绘两张映射表由构建脚本在占位符处注入（见 build_card.mjs，勿在本文件写死）。
 */
(function () {
  'use strict';
  var TAG = '[雾青]';

  // ── 资产注入（构建期替换） ──
  var AVATARS = __DJG_ASSETS_JSON__;   // 网名 → 头像 dataURI
  var LIANIS = __DJG_LIANI_JSON__;     // 网名 → 立绘 dataURI

  // ── 稳定配置（与 djg-render v1.1 一致；键与网名解耦） ──
  var MEMBERS = [
    { 键: '花奈',   前缀: 'H', 网名: '佐久间眠',            真名: '花奈',   头像字: '佐', 立绘字: '花' },
    { 键: '清寒',   前缀: 'Q', 网名: '珍惜才配拥有',        真名: '顾清寒', 头像字: '珍', 立绘字: '清' },
    { 键: '沉秋',   前缀: 'C', 网名: 'cojack',              真名: '鱼沉秋', 头像字: '秋', 立绘字: '鱼' },
    { 键: '楚羽笙', 前缀: 'Y', 网名: '楚楚的笙_unofficial', 真名: '楚羽笙', 头像字: '笙', 立绘字: '楚' },
    { 键: '诺薇拉', 前缀: 'N', 网名: '冯诺依曼',            真名: '诺薇拉', 头像字: '诺', 立绘字: '诺' }
  ];
  var FACT_ORDER = {
    'H': ['家史', '母亡', '药', '面具', '轨迹'],
    'Q': ['保护色', '霸凌', '善良', '独居'],
    'C': ['背锅', '社恐度', '耳坠', '未放弃'],
    'Y': ['父母', '安静', '草稿', '逃兵'],
    'N': ['拖延', '才华', '家庭群', '延毕']
  };
  var OPEN_STATES = { '已揭示': true, '误信已纠正': true };
  var STAGE_LADDER = [
    { min: 100, 阶段: '永不背叛' }, { min: 90, 阶段: '交换誓言' }, { min: 70, 阶段: '红颜知己' },
    { min: 50, 阶段: '挚爱亲朋' }, { min: 40, 阶段: '无话不谈' }, { min: 20, 阶段: '相知相识' },
    { min: -19, 阶段: '线上好友' }, { min: -39, 阶段: '关系僵硬' }, { min: -49, 阶段: '互不顺眼' },
    { min: -69, 阶段: '不相往来' }, { min: -89, 阶段: '互为仇敌' }, { min: -99, 阶段: '不共戴天' },
    { min: -100, 阶段: '不死不休' }
  ];

  function stageOf(fav) {
    for (var i = 0; i < STAGE_LADDER.length; i++) if (fav >= STAGE_LADDER[i].min) return STAGE_LADDER[i].阶段;
    return '线上好友';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function favorPct(fav) { return Math.round((fav + 100) / 2); }

  function cssOrb(open) {
    return '<span class="djg-orb' + (open ? ' op' : '') + '"><span class="fr"></span>' +
      '<span class="cn"><span class="bd"></span></span><span class="pip"></span></span>';
  }
  function avImg(m, which) {
    var ch = which === '立绘' ? m.立绘字 : m.头像字;
    var src = which === '立绘' ? (LIANIS[m.网名] || '') : (AVATARS[m.网名] || '');
    return esc(ch) + (src ? '<img class="djg-avimg" src="' + src + '" alt="" onerror="this.remove()">' : '');
  }

  // ── derive：stat_data → 视图模型（只读） ──
  function derive(stat) {
    stat = stat || {};
    var mistMe = (stat['迷雾'] && stat['迷雾']['主控']) || {};
    var rel = stat['关系'] || {};
    var met = stat['登场'] || {};
    var env = stat['环境'] || {};
    var members = MEMBERS.map(function (m) {
      var facts = (FACT_ORDER[m.前缀] || []).map(function (name) {
        var id = m.前缀 + '.' + name;
        var st = mistMe[id] || '未揭示';
        return { id: id, name: name, open: OPEN_STATES[st] === true };
      });
      var r = rel[m.键] || {};
      var fav = typeof r['好感度'] === 'number' ? r['好感度'] : 0;
      if (!isFinite(fav)) fav = 0;
      fav = Math.max(-100, Math.min(100, fav));
      var revealed = r['身份揭晓'] === true;
      return {
        键: m.键, 网名: m.网名, 真名: m.真名, 头像字: m.头像字, 立绘字: m.立绘字,
        好感: fav, 阶段: stageOf(fav), 身份揭晓: revealed, 登场: met[m.键] === true,
        mist: facts, 揭开数: facts.filter(function (f) { return f.open; }).length, 总数: facts.length
      };
    });
    var totalOpen = 0, totalFacts = 0;
    members.forEach(function (m) { totalOpen += m.揭开数; totalFacts += m.总数; });
    return {
      members: members, 日期: env['日期'] || '未知', 时段: env['时段'] || '时段未详',
      user: stat.user || {}, 总揭开: totalOpen, 总格数: totalFacts, 规则: stat['规则'] || {}
    };
  }

  // ── HTML 构件 ──
  function barHTML(vm) {
    var revealed = vm.身份揭晓, neg = vm.好感 < 0;
    return '<div class="djg-bar' + (revealed ? ' djg-rv' : '') + '"><div class="in">' +
      '<div class="djg-head">' +
        '<div class="djg-av"><span class="fr"></span>' +
          '<span class="cn fog-only">' + avImg(vm, '头像') + '</span>' +
          '<span class="cn rv-only">' + avImg(vm, '立绘') + '</span>' +
          '<span class="dc fog-only">DC</span><span class="dc rv-only">立绘</span></div>' +
        '<div class="djg-hb">' +
          '<div class="nm">' + esc(vm.网名) + '</div>' +
          '<div class="rl"><span class="fog-only">身份未揭晓</span><span class="rv-only">' + esc(vm.真名) + '（真名）</span></div>' +
        '</div></div>' +
      '<div class="djg-fav"><span class="tk"><span class="fl' + (neg ? ' neg' : '') + '" style="width:' + favorPct(vm.好感) + '%"></span></span>' +
        '<span class="num' + (neg ? ' neg' : '') + '">好感 ' + (vm.好感 >= 0 ? '+' + vm.好感 : '\u2212' + Math.abs(vm.好感)) + ' / 100</span></div>' +
      '<div class="djg-fog"><span class="cap">迷雾</span>' +
        vm.mist.map(function (f) { return cssOrb(f.open); }).join('') +
        '<span class="cnt">' + vm.揭开数 + ' / ' + vm.总数 + '</span></div>' +
      '<div class="djg-foot"><span><span class="k">登场</span>' + (vm.登场 ? '已线下相遇' : '未相遇') + '</span>' +
        '<span class="stg">关系阶段 · <b>' + esc(vm.阶段) + '</b></span></div>' +
    '</div></div>';
  }

  function hubCardHTML(vm, idx) {
    var neg = vm.好感 < 0;
    return '<a class="djg-hubcard" data-arch="' + idx + '"><span class="dj-frame"><span class="dj-panel hc">' +
      '<span class="hc-top"><span class="hc-av' + (vm.身份揭晓 ? ' rv' : '') + '"><span class="fr"></span>' +
        '<span class="cn">' + avImg(vm, vm.身份揭晓 ? '立绘' : '头像') + '</span></span>' +
      '<span class="hc-id"><span class="hc-net">' + esc(vm.网名) + '</span>' +
        '<span class="hc-state' + (vm.身份揭晓 ? ' rv' : '') + '">' + (vm.身份揭晓 ? '已揭晓 · ' + esc(vm.真名) : '身份未揭晓') + '</span></span></span>' +
      '<span class="hc-mist">' + vm.mist.map(function (f) { return cssOrb(f.open); }).join('') +
        '<span class="lbl">' + vm.揭开数 + '/' + vm.总数 + '</span></span>' +
      '<span class="hc-favor"><span class="track"><span class="fill' + (neg ? ' neg' : '') + '" style="width:' + favorPct(vm.好感) + '%"></span></span>' +
        '<span class="num' + (neg ? ' neg' : '') + '">' + (vm.好感 >= 0 ? '+' + vm.好感 : '\u2212' + Math.abs(vm.好感)) + '</span></span>' +
      '<span class="hc-stage">关系阶段 · <b>' + esc(vm.阶段) + '</b></span>' +
      '<span class="hc-go">打开档案 ◇</span>' +
    '</span></span></a>';
  }

  function archiveHTML(vm) {
    var neg = vm.好感 < 0;
    return '<div class="dj-archback"><a class="dj-backlink" data-back="1">◇ 返回群像</a></div>' +
      '<div class="dj-charpage">' +
      '<div class="dj-frame"><div class="dj-panel portrait">' +
        '<div class="glyph fog-only">' + esc(vm.头像字) + '</div>' +
        '<div class="glyph rv-only">' + esc(vm.立绘字) + '</div>' +
        '<div class="pimg fog-only"><img src="' + (AVATARS[vm.网名] || '') + '" alt="" onerror="this.remove()"></div>' +
        '<div class="pimg rv-only"><img src="' + (LIANIS[vm.网名] || '') + '" alt="" onerror="this.remove()"></div>' +
      '</div></div>' +
      '<div class="dj-col">' +
        '<div class="dj-frame"><div class="dj-panel"><div class="dj-ptitle">关系 <small>STAT · 仅变量</small></div>' +
          '<dl class="dj-kv">' +
            '<dt>网名</dt><dd>' + esc(vm.网名) + '</dd>' +
            '<dt class="fog-only">身份</dt><dd class="fog-only"><span class="unk">？？？（未揭晓）</span></dd>' +
            '<dt class="rv-only">身份</dt><dd class="rv-only">' + esc(vm.真名) + '（真名 · 揭晓态）</dd>' +
            '<dt>关系阶段</dt><dd>' + esc(vm.阶段) + '</dd>' +
            '<dt>登场</dt><dd>' + (vm.登场 ? '已线下相遇' : '未相遇') + '</dd>' +
          '</dl></div></div>' +
        '<div class="dj-frame"><div class="dj-panel"><div class="dj-ptitle">迷雾格 <small>FOG · ' + vm.总数 + '</small></div>' +
          '<div class="dj-orbrow">' + vm.mist.map(function (f) { return cssOrb(f.open); }).join('') +
          '<span class="lbl">已揭 ' + vm.揭开数 + ' / 共 ' + vm.总数 + '</span></div>' +
          '<div class="dj-factrow">' + vm.mist.map(function (f) {
            return '<span class="dj-fact' + (f.open ? ' op' : '') + '">' + esc(f.name) + '</span>';
          }).join('') + '</div></div></div>' +
        '<div class="dj-frame"><div class="dj-panel"><div class="dj-ptitle">好感度 <small>FAVOR</small></div>' +
          '<div class="dj-favor"><span class="track"><span class="fill' + (neg ? ' neg' : '') + '" style="width:' + favorPct(vm.好感) + '%"></span></span>' +
          '<span class="num' + (neg ? ' neg' : '') + '">好感 ' + (vm.好感 >= 0 ? '+' + vm.好感 : '\u2212' + Math.abs(vm.好感)) + ' / 100</span></div></div></div>' +
      '</div></div>';
  }

  // ── CSS（全部作用域限定在 .djg-status / #djg-fab / #djg-layer） ──
  var CSS = [
    '.djg-status{max-width:680px;margin:10px auto 4px;font-family:"Microsoft YaHei",微软雅黑,sans-serif;',
    'display:flex;flex-direction:column;gap:12px;align-items:center}',
    '.djg-status .djg-meta{color:#5E707A;font-size:11px;letter-spacing:.12em;font-variant-numeric:tabular-nums;text-align:center}',
    '.djg-status .djg-meta b{color:#8FD0D8;font-weight:600}',
    '.djg-status .djg-bars{display:flex;flex-direction:column;gap:10px;width:100%}',
    '.djg-bar{--djghex:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);',
    '--djgcut:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px);',
    'position:relative;width:100%;color:#E6EDF2;font-size:13px;line-height:1.8;',
    'background:rgba(140,200,210,.20);clip-path:var(--djgcut);padding:1px}',
    '.djg-bar .in{background:rgba(21,30,37,.94);clip-path:var(--djgcut);padding:13px 17px 12px}',
    '.djg-bar .djg-av{position:relative;width:42px;height:47px;flex:none}',
    '.djg-bar .djg-av .fr{position:absolute;inset:0;clip-path:var(--djghex);background:rgba(140,200,210,.28)}',
    '.djg-bar .djg-av .cn{position:absolute;inset:1px;clip-path:var(--djghex);background:linear-gradient(160deg,#28323E,#1B242D);',
    'display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#93A7B1;overflow:hidden}',
    '.djg-bar .djg-av .cn .djg-avimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 15%}',
    '.djg-bar .djg-av .dc{position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);font-size:8px;color:#5E707A;letter-spacing:.2em}',
    '.djg-bar.djg-rv .djg-av .cn{background:linear-gradient(160deg,#1E3238,#152228);color:#8FD0D8}',
    '.djg-bar .djg-head{display:flex;align-items:center;gap:13px}',
    '.djg-bar .djg-hb{flex:1;min-width:0}',
    '.djg-bar .nm{font-size:16px;font-weight:700;letter-spacing:.12em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.djg-bar .rl{font-size:11px;color:#5E707A;letter-spacing:.18em;margin-top:1px}',
    '.djg-bar.djg-rv .rl{color:#93A7B1;letter-spacing:.06em}',
    '.djg-bar .djg-fav{display:flex;align-items:center;gap:10px;margin-top:9px}',
    '.djg-bar .djg-fav .tk{flex:1;height:4px;background:#1B2830;position:relative;overflow:hidden}',
    '.djg-bar .djg-fav .fl{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#3E7F8E,#8FD0D8)}',
    '.djg-bar .djg-fav .fl.neg{background:linear-gradient(90deg,#7A4638,#C97A5A)}',
    '.djg-bar .djg-fav .num{font-size:12px;color:#93A7B1;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.djg-bar .djg-fav .num.neg{color:#C97A5A}',
    '.djg-bar .djg-fog{display:flex;align-items:center;gap:8px;margin-top:9px}',
    '.djg-bar .djg-fog .cap{font-size:11px;color:#5E707A;letter-spacing:.2em;margin-right:2px}',
    '.djg-orb{position:relative;width:18px;height:20px;flex:none;display:inline-block}',
    '.djg-orb .fr{position:absolute;inset:0;clip-path:var(--djghex, polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%));background:rgba(140,200,210,.26)}',
    '.djg-orb .cn{position:absolute;inset:1px;clip-path:var(--djghex, polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%));background:#131D23;display:flex;align-items:center;justify-content:center}',
    '.djg-orb .bd{width:8px;height:8px;border-radius:50%;background:radial-gradient(circle at 42% 38%,rgba(230,237,242,.38),rgba(147,167,177,.10) 62%,transparent 78%)}',
    '.djg-orb .pip{position:absolute;left:50%;top:52%;width:3px;height:3px;transform:translate(-50%,-50%);border-radius:50%;background:#8FD0D8;opacity:.8}',
    '.djg-orb.op .fr{background:#8FD0D8}',
    '.djg-orb.op .bd{background:radial-gradient(circle at 42% 36%,#DFF4F7,#5FA8B4 55%,#2C5B66);box-shadow:0 0 7px rgba(143,208,216,.55)}',
    '.djg-bar .djg-fog .cnt{font-size:11px;color:#5E707A;font-variant-numeric:tabular-nums;letter-spacing:.08em;margin-left:auto}',
    '.djg-bar .djg-foot{display:flex;gap:16px;margin-top:10px;padding-top:9px;border-top:1px solid rgba(140,200,210,.14);',
    'font-size:12px;color:#93A7B1;letter-spacing:.05em}',
    '.djg-bar .djg-foot .k{color:#5E707A;letter-spacing:.14em;margin-right:5px}',
    '.djg-bar .djg-foot .stg{margin-left:auto;color:#5E707A;font-size:11px;letter-spacing:.1em}',
    '.djg-bar .djg-foot .stg b{color:#93A7B1;font-weight:600}',
    '.djg-bar .rv-only{display:none!important}',
    '.djg-bar.djg-rv .fog-only{display:none!important}',
    '.djg-bar.djg-rv .rv-only{display:revert!important}',
    // 悬浮按钮
    '#djg-fab{position:fixed;right:14px;bottom:16px;z-index:9990;width:46px;height:50px;cursor:pointer;',
    'clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:rgba(140,200,210,.30);',
    'display:flex;align-items:center;justify-content:center;font-family:"Microsoft YaHei",微软雅黑,sans-serif}',
    '#djg-fab .in{position:absolute;inset:1px;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);',
    'background:rgba(17,24,30,.94);color:#8FD0D8;font-size:15px;display:flex;align-items:center;justify-content:center}',
    '#djg-fab:hover .in{color:#DFF4F7}',
    // 群像 overlay
    '#djg-layer{position:fixed;inset:0;z-index:9991;overflow:auto;color:#E6EDF2;',
    'font-family:"Microsoft YaHei",微软雅黑,sans-serif;font-size:14px;line-height:1.9;',
    'background:radial-gradient(900px 480px at 82% -10%,rgba(110,160,175,.10),transparent 60%),',
    'radial-gradient(760px 520px at -12% 30%,rgba(108,127,168,.09),transparent 62%),#0B1014F2}',
    '#djg-layer .dj-wrap{max-width:1080px;margin:0 auto;padding:26px 24px 80px}',
    '#djg-layer .dj-nav{display:flex;align-items:center;gap:20px;margin-bottom:26px;',
    'border-bottom:1px solid rgba(140,200,210,.22);padding-bottom:12px}',
    '#djg-layer .dj-nav .group{font-size:17px;font-weight:700;letter-spacing:.2em}',
    '#djg-layer .dj-nav .group i{font-style:normal;color:#8FD0D8;margin-right:8px}',
    '#djg-layer .dj-nav .mist-total{font-size:12px;color:#5E707A;letter-spacing:.08em;font-variant-numeric:tabular-nums}',
    '#djg-layer .dj-nav .mist-total b{color:#8FD0D8}',
    '#djg-layer .dj-nav .dj-close{margin-left:auto;cursor:pointer;background:none;border:1px solid rgba(140,200,210,.3);',
    'color:#93A7B1;font-family:inherit;font-size:12px;letter-spacing:.14em;padding:4px 14px}',
    '#djg-layer .dj-nav .dj-close:hover{color:#8FD0D8;border-color:#8FD0D8}',
    '#djg-layer .dj-hub{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px}',
    '#djg-layer a.djg-hubcard{text-decoration:none;color:inherit;display:block;cursor:pointer;transition:transform .15s ease}',
    '#djg-layer a.djg-hubcard:hover{transform:translateY(-3px)}',
    '#djg-layer .dj-frame{display:flex;background:rgba(140,200,210,.22);',
    'clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)}',
    '#djg-layer .dj-panel{flex:1;margin:1px;background:rgba(21,30,37,.88);min-width:0;',
    'clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)}',
    '#djg-layer .hc{padding:18px 16px 14px;height:100%;display:flex;flex-direction:column;min-width:0}',
    '#djg-layer .hc-top{display:flex;align-items:center;gap:12px;max-width:100%;overflow:hidden}',
    '#djg-layer .hc-av{position:relative;width:46px;height:52px;flex:none}',
    '#djg-layer .hc-av .fr{position:absolute;inset:0;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);background:rgba(140,200,210,.28)}',
    '#djg-layer .hc-av .cn{position:absolute;inset:1px;clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);',
    'background:linear-gradient(160deg,#28323E,#1B242D);display:flex;align-items:center;justify-content:center;',
    'font-size:20px;font-weight:700;color:#93A7B1;overflow:hidden}',
    '#djg-layer .hc-av.rv .cn{background:linear-gradient(160deg,#1E3238,#152228);color:#8FD0D8}',
    '#djg-layer .hc-av .cn .djg-avimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 15%}',
    '#djg-layer .hc-id{display:block;min-width:0;flex:1}',
    '#djg-layer .hc-net{display:block;font-size:14px;font-weight:700;letter-spacing:.04em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#djg-layer .hc-state{display:block;font-size:10px;letter-spacing:.14em;color:#5E707A;margin-top:2px}',
    '#djg-layer .hc-state.rv{color:#8FD0D8}',
    '#djg-layer .hc-mist{display:flex;gap:7px;align-items:center;margin:13px 0 4px;max-width:100%}',
    '#djg-layer .hc-mist .lbl{font-size:11px;color:#5E707A;font-variant-numeric:tabular-nums;letter-spacing:.06em;margin-left:auto}',
    '#djg-layer .hc-favor{display:flex;align-items:center;gap:9px;margin-top:8px}',
    '#djg-layer .hc-favor .track,#djg-layer .dj-favor .track{flex:1;height:4px;background:#1B2830;position:relative}',
    '#djg-layer .hc-favor .fill,#djg-layer .dj-favor .fill{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#3E7F8E,#8FD0D8)}',
    '#djg-layer .hc-favor .fill.neg,#djg-layer .dj-favor .fill.neg{background:linear-gradient(90deg,#7A4638,#C97A5A)}',
    '#djg-layer .hc-favor .num{font-size:11px;color:#93A7B1;font-variant-numeric:tabular-nums;white-space:nowrap}',
    '#djg-layer .hc-favor .num.neg,#djg-layer .dj-favor .num.neg{color:#C97A5A}',
    '#djg-layer .hc-stage{margin-top:8px;font-size:11px;color:#5E707A;letter-spacing:.1em}',
    '#djg-layer .hc-stage b{color:#93A7B1;font-weight:600}',
    '#djg-layer .hc-go{margin-top:auto;padding-top:10px;border-top:1px solid rgba(140,200,210,.12);',
    'font-size:11px;color:#5E707A;letter-spacing:.22em;text-align:right}',
    '#djg-layer a.djg-hubcard:hover .hc-go{color:#8FD0D8}',
    // 档案页
    '#djg-layer .dj-archback{margin-bottom:12px}',
    '#djg-layer .dj-backlink{display:inline-block;font-size:12px;color:#5E707A;letter-spacing:.18em;cursor:pointer;text-decoration:none}',
    '#djg-layer .dj-backlink:hover{color:#8FD0D8}',
    '#djg-layer .dj-charpage{display:grid;grid-template-columns:5fr 4fr;gap:16px}',
    '#djg-layer .portrait{min-height:420px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;',
    'background:linear-gradient(165deg,#121B21,#0D1418);outline:1px dashed rgba(140,200,210,.28);outline-offset:-14px}',
    '#djg-layer .portrait .pimg{position:absolute;inset:14px;display:flex;align-items:center;justify-content:center}',
    '#djg-layer .portrait .pimg img{max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain}',
    '#djg-layer .portrait .glyph{font-size:92px;font-weight:700;color:rgba(108,127,168,.5)}',
    '#djg-layer .portrait .glyph.rv-only{color:rgba(143,208,216,.5)}',
    '#djg-layer .dj-col{display:flex;flex-direction:column;gap:14px;min-width:0}',
    '#djg-layer .dj-col .dj-panel{padding:18px 20px}',
    '#djg-layer .dj-ptitle{font-size:15px;font-weight:600;letter-spacing:.18em;color:#8FD0D8}',
    '#djg-layer .dj-ptitle::before{content:"◇ ";font-weight:400;font-size:12px}',
    '#djg-layer .dj-ptitle small{margin-left:8px;font-size:11px;color:#5E707A;letter-spacing:.1em;font-weight:400}',
    '#djg-layer .dj-kv{display:grid;grid-template-columns:88px 1fr;row-gap:8px;font-size:13px;margin-top:12px}',
    '#djg-layer .dj-kv dt{color:#5E707A;letter-spacing:.14em}',
    '#djg-layer .dj-kv dd{color:#E6EDF2;margin:0}',
    '#djg-layer .dj-kv dd .unk{color:#5E707A;letter-spacing:.3em}',
    '#djg-layer .dj-orbrow{display:flex;gap:9px;align-items:center;margin:12px 0 6px}',
    '#djg-layer .dj-orbrow .djg-orb{width:22px;height:24px}',
    '#djg-layer .dj-orbrow .lbl{font-size:11px;color:#5E707A;letter-spacing:.08em;font-variant-numeric:tabular-nums;margin-left:4px}',
    '#djg-layer .dj-factrow{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}',
    '#djg-layer .dj-fact{font-size:11px;letter-spacing:.1em;color:#5E707A;border:1px solid rgba(140,200,210,.18);padding:2px 9px}',
    '#djg-layer .dj-fact.op{color:#8FD0D8;border-color:rgba(143,208,216,.5)}',
    '#djg-layer .dj-favor{display:flex;align-items:center;gap:10px;margin-top:13px}',
    '#djg-layer .dj-favor .num{font-size:12px;color:#93A7B1;font-variant-numeric:tabular-nums;min-width:70px;text-align:right}',
    '#djg-layer .rv-only{display:none!important}',
    '#djg-layer .dj-rv .fog-only{display:none!important}',
    '#djg-layer .dj-rv .rv-only{display:revert!important}',
    '#djg-layer .dj-rv .pimg.rv-only{display:flex!important}',
    '@media (max-width:860px){#djg-layer .dj-charpage{grid-template-columns:1fr}}'
  ].join('\n');

  // ── 宿主挂载 ──
  var pdoc, pwin;
  var state = { lastMesId: null, overlay: null, overlayArch: null };

  function findLatestAiMes() {
    var all = pdoc.querySelectorAll('#chat > .mes');
    for (var i = all.length - 1; i >= 0; i--) {
      var isUser = all[i].getAttribute('is_user');
      var isSys = all[i].getAttribute('is_system');
      if (isUser !== 'true' && isSys !== 'true') return { el: all[i], mesid: Number(all[i].getAttribute('mesid')) };
    }
    return null;
  }

  function statFor(mesid) {
    try {
      var data = Mvu.getMvuData({ type: 'message', message_id: mesid });
      return data && data.stat_data;
    } catch (e) { return null; }
  }

  function renderLatest() {
    if (typeof Mvu === 'undefined') return;
    var target = findLatestAiMes();
    if (!target || !isFinite(target.mesid)) return;
    var stat = statFor(target.mesid);
    if (!stat || !stat['迷雾'] || !stat['规则']) { // 未初始化：不渲染
      return;
    }
    var holder = target.el.querySelector(':scope > .mes_text') || target.el.querySelector('.mes_text');
    if (!holder) return;
    var box = holder.querySelector(':scope > .djg-status');
    if (!box) {
      box = pdoc.createElement('div');
      box.className = 'djg-status';
      holder.appendChild(box);
    }
    var vm = derive(stat);
    var bars = '<div class="djg-bars">' + vm.members.map(barHTML).join('') + '</div>';
    var meta = '<div class="djg-meta">南江市 · ' + esc(vm.日期) + ' · ' + esc(vm.时段) +
      ' ｜ 迷雾已揭 <b>' + vm.总揭开 + '</b> / ' + vm.总格数 +
      (vm.规则['初始化完成'] ? '' : ' ｜ <b>存档未初始化</b>') + '</div>';
    box.innerHTML = bars + meta;
    state.lastMesId = target.mesid;
    if (state.overlay) renderOverlayContent();
  }

  // ── 群像 overlay ──
  function ensureFab() {
    if (pdoc.getElementById('djg-fab')) return;
    var fab = pdoc.createElement('div');
    fab.id = 'djg-fab';
    fab.title = '群像 · 但为君故';
    fab.innerHTML = '<span class="in">◇</span>';
    fab.addEventListener('click', function () { openOverlay(null); });
    pdoc.body.appendChild(fab);
  }
  function ensureStyle() {
    if (pdoc.getElementById('djg-style')) return;
    var st = pdoc.createElement('style');
    st.id = 'djg-style';
    st.textContent = CSS;
    pdoc.head.appendChild(st);
  }
  function openOverlay(archIdx) {
    closeOverlay();
    var layer = pdoc.createElement('div');
    layer.id = 'djg-layer';
    layer.innerHTML = '<div class="dj-wrap"><div class="dj-nav">' +
      '<span class="group"><i>◇</i>但为君故</span>' +
      '<span class="mist-total" id="djg-total"></span>' +
      '<button class="dj-close" id="djg-close">收起 ×</button></div>' +
      '<div id="djg-body"></div></div>';
    pdoc.body.appendChild(layer);
    state.overlay = layer;
    state.overlayArch = archIdx;
    layer.querySelector('#djg-close').addEventListener('click', closeOverlay);
    layer.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('a.djg-hubcard, .dj-backlink') : null;
      if (!t) return;
      e.preventDefault();
      if (t.hasAttribute('data-back')) state.overlayArch = null;
      else state.overlayArch = Number(t.getAttribute('data-arch'));
      renderOverlayContent();
    });
    renderOverlayContent();
  }
  function closeOverlay() {
    if (state.overlay) { state.overlay.remove(); state.overlay = null; state.overlayArch = null; }
  }
  function renderOverlayContent() {
    var layer = state.overlay;
    if (!layer) return;
    var stat = statFor(state.lastMesId != null ? state.lastMesId : 'latest') || statFor('latest');
    if (!stat || !stat['迷雾']) return;
    var vm = derive(stat);
    layer.querySelector('#djg-total').innerHTML =
      '迷雾 <b>' + vm.总格数 + '</b> 格 · 已揭 <b>' + vm.总揭开 + '</b> · ' + esc(vm.日期) + ' · ' + esc(vm.时段);
    var body = layer.querySelector('#djg-body');
    if (state.overlayArch == null) {
      body.innerHTML = '<div class="dj-hub">' + vm.members.map(hubCardHTML).join('') + '</div>';
    } else {
      var m = vm.members[state.overlayArch];
      body.innerHTML = m ? ('<div class="dj-arch' + (m.身份揭晓 ? ' dj-rv' : '') + '">' + archiveHTML(m) + '</div>') : '';
    }
  }

  // ── 事件接线 ──
  var debTimer = null;
  function debouncedRender() {
    if (debTimer) clearTimeout(debTimer);
    debTimer = setTimeout(renderLatest, 350);
  }
  function boot() {
    try { pdoc = parent && parent.document ? parent.document : document; } catch (_) { pdoc = document; }
    try { pwin = parent && parent.window ? parent.window : window; } catch (_) { pwin = window; }
    if (typeof Mvu === 'undefined') { console.warn(TAG, 'Mvu 全局不可用——状态栏停用（变量系统未加载？）'); return; }
    ensureStyle();
    ensureFab();
    renderLatest();

    var evt = Mvu.events || {};
    if (typeof eventOn === 'function') {
      if (evt.VARIABLE_UPDATE_ENDED) eventOn(evt.VARIABLE_UPDATE_ENDED, debouncedRender);
      if (evt.VARIABLE_INITIALIZED) eventOn(evt.VARIABLE_INITIALIZED, function () { setTimeout(renderLatest, 400); });
      if (typeof tavern_events !== 'undefined') {
        ['MESSAGE_UPDATED', 'MESSAGE_SWIPED', 'MESSAGE_RECEIVED', 'CHAT_CHANGED', 'MORE_MESSAGES_LOADED']
          .forEach(function (k) { if (tavern_events[k]) eventOn(tavern_events[k], debouncedRender); });
      }
    }
    // 兜底：聊天 DOM 变化（滚动加载/编辑/删除）时重渲染
    try {
      var chatEl = pdoc.getElementById('chat');
      if (chatEl && typeof MutationObserver === 'function') {
        var mo = new MutationObserver(debouncedRender);
        mo.observe(chatEl, { childList: true, subtree: false });
      }
    } catch (e) { /* 观察失败不影响主流程 */ }
  }

  if (typeof $ === 'function') {
    if (typeof errorCatched === 'function') $(errorCatched(boot)); else $(boot);
  } else if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
