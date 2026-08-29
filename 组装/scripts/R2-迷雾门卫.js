/*!
 * 《在DC频道里口嗨的群友就住我隔壁？！》R2 迷雾门卫 v1.0（酒馆助手脚本）
 * 契约：DEC-010（脚本幂等门控）/ DEC-025（任一知情者翻转即启用）/ DEC-033（好感门禁与十二档阶梯）/ 设计契约 ④
 * 职责：监听 mag_variable_update_ended 等事件，从 stat_data 的 迷雾/关系/任务 容器**幂等推导**
 *       世界书词条启用开关（秘密词条×21 + 协议层 MOD 条件模块）。只翻词条开关，不写任何状态。
 * 幂等：每轮从当前聊天状态全量推导；新聊天/回溯分支自动复位（VARIABLE_INITIALIZED / chat_changed 触发重同步）。
 * 失败行为：异常仅记录日志（fail-soft），不阻塞变量更新（设计契约 ④）。
 */
(function () {
  'use strict';
  var TAG = '[R2门卫]';

  // 事实ID → 秘密词条 comment 中的名字（注册表见 lorebooks/角色层/README.md §3）。
  // 注意 Y.逃兵 的词条名为「剧本」（P4 源稿口径），其余事实与词条同名。
  var FACT_TO_ENTRY = {
    'H.家史': '家史', 'H.母亡': '母亡', 'H.药': '药', 'H.面具': '面具', 'H.轨迹': '轨迹',
    'Q.保护色': '保护色', 'Q.霸凌': '霸凌', 'Q.善良': '善良', 'Q.独居': '独居',
    'C.背锅': '背锅', 'C.社恐度': '社恐度', 'C.耳坠': '耳坠', 'C.未放弃': '未放弃',
    'Y.父母': '父母', 'Y.安静': '安静', 'Y.草稿': '草稿', 'Y.逃兵': '剧本',
    'N.拖延': '拖延', 'N.才华': '才华', 'N.家庭群': '家庭群', 'N.延毕': '延毕'
  };

  // 事实ID前缀 → 事实本人（稳定键）。本人对自身事实的知情是天然的，不计入"知情者"。
  var OWNER_OF_PREFIX = { H: '花奈', Q: '清寒', C: '沉秋', Y: '楚羽笙', N: '诺薇拉' };

  var OPEN_STATES = { '已揭示': true, '误信已纠正': true };

  // ── 从 stat_data 全量推导目标开关状态 ──
  // 返回 { secretOpen: Map<factId,boolean>, modA: boolean, modB: boolean }
  function derive(stat) {
    var mist = (stat && stat['迷雾']) || {};
    var rel = (stat && stat['关系']) || {};
    var tasks = (stat && stat['任务']) || {};

    var secretOpen = new Map();
    Object.keys(FACT_TO_ENTRY).forEach(function (factId) {
      var prefix = factId.split('.')[0];
      var owner = OWNER_OF_PREFIX[prefix];
      var open = false;
      for (var knower in mist) {
        if (!Object.prototype.hasOwnProperty.call(mist, knower)) continue;
        if (knower === owner) continue; // 任一知情者（≠事实本人）翻转即启用——DEC-025 口径
        var st = mist[knower] && mist[knower][factId];
        if (OPEN_STATES[st]) { open = true; break; }
      }
      secretOpen.set(factId, open);
    });

    // MOD-A（DEC-033 阶梯口径）：任一角色 |好感度| ≥ 50——未揭晓时门禁锁定 ±49，
    // 因此越界必已揭晓且进入 挚爱亲朋 档以上 / 不相往来 档以下，即升温/破裂阈值。
    // （N4 源稿旧记 {亲近,恋人} 为 DEC-033 前口径，已按十二档阶梯校准，见组装门记录。）
    var modA = false;
    for (var k in rel) {
      if (!Object.prototype.hasOwnProperty.call(rel, k)) continue;
      var fav = Number(rel[k] && rel[k]['好感度']);
      if (Number.isFinite(fav) && Math.abs(fav) >= 50) { modA = true; break; }
    }

    // MOD-B：任一任务 = 进行中
    var modB = false;
    for (var id in tasks) {
      if (!Object.prototype.hasOwnProperty.call(tasks, id)) continue;
      if (tasks[id] && tasks[id]['状态'] === '进行中') { modB = true; break; }
    }

    return { secretOpen: secretOpen, modA: modA, modB: modB };
  }

  // 单条世界书词条的目标 enabled 值；null = 与本门卫无关，不动。
  // 秘密词条 comment 形如 "[mvu_plot]角色层·藤原花奈·秘密：家史"；MOD 条目 comment 含 "MOD条件模块"。
  function wantedEnabled(comment, want) {
    var c = String(comment || '');
    if (c.indexOf('秘密：') !== -1) {
      for (var factId in FACT_TO_ENTRY) {
        if (!Object.prototype.hasOwnProperty.call(FACT_TO_ENTRY, factId)) continue;
        if (c.indexOf('秘密：' + FACT_TO_ENTRY[factId]) !== -1) {
          return want.secretOpen.get(factId) === true;
        }
      }
      return null; // 未知秘密词条：不臆动
    }
    if (c.indexOf('MOD条件模块') !== -1) return want.modA || want.modB;
    return null;
  }

  function pickBooks() {
    var names = [];
    try {
      var books = getCharLorebooks({ type: 'all' });
      if (books && books.primary) names.push(books.primary);
      if (books && books.additional) names = names.concat(books.additional);
    } catch (e) {
      console.warn(TAG, '获取角色世界书失败', e);
    }
    return names.filter(Boolean);
  }

  function sync(reason, statOverride) {
    try {
      if (typeof Mvu === 'undefined' || typeof getCharLorebooks === 'undefined') return;
      var stat = statOverride;
      if (!stat) {
        var data = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
        stat = data && data.stat_data;
      }
      // 未初始化（新聊天/空状态）→ 全量目标为关：与卡默认一致，实现"新聊天/回溯自动复位"。
      var want = derive(stat);
      var changed = 0;

      var collect = function (entries) {
        var patch = [];
        (entries || []).forEach(function (e) {
          var w = wantedEnabled(e && e.comment, want);
          if (w === null) return;
          if (!!e.enabled !== w) { changed++; patch.push({ uid: e.uid, enabled: w }); }
        });
        return patch;
      };

      pickBooks().forEach(function (name) {
        var run = null;
        if (typeof updateWorldbookWith === 'function') run = function () { return updateWorldbookWith(name, collect); };
        else if (typeof updateLorebookEntriesWith === 'function') run = function () { return updateLorebookEntriesWith(name, collect); };
        if (run) Promise.resolve(run()).catch(function (e) { console.warn(TAG, '同步世界书失败：' + name, e); });
      });

      if (changed > 0) console.log(TAG, reason + '：同步 ' + changed + ' 个词条开关');
    } catch (err) {
      // fail-soft：门卫异常不阻塞变量更新（设计契约 ④）
      console.error(TAG, '同步失败（迷雾门控暂失效）：', err);
    }
  }

  // 事件挂接：事件名一律用常量引用（注意框架 VARIABLE_INITIALIZED 的值是拼写坑 "mag_variable_initiailized"）
  if (typeof eventOn !== 'function') { console.warn(TAG, 'eventOn 不可用（酒馆助手过旧？）'); return; }
  var evt = (typeof Mvu !== 'undefined' && Mvu.events) ? Mvu.events : {};
  if (evt.VARIABLE_UPDATE_ENDED) {
    eventOn(evt.VARIABLE_UPDATE_ENDED, function (variables) {
      sync('变量更新', variables && variables.stat_data);
    });
  }
  if (evt.VARIABLE_INITIALIZED) {
    eventOn(evt.VARIABLE_INITIALIZED, function () { setTimeout(function () { sync('新聊天初始化'); }, 300); });
  }
  if (typeof tavern_events !== 'undefined' && tavern_events.CHAT_CHANGED) {
    eventOn(tavern_events.CHAT_CHANGED, function () { setTimeout(function () { sync('切换聊天'); }, 1500); });
  }
  setTimeout(function () { sync('脚本载入'); }, 3000);
})();
