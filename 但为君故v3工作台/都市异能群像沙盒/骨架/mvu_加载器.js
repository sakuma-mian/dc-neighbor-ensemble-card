// ============================================================================
// MVU 本体加载器（卡内脚本 · 排第 1 位）
// 项目：都市异能群像沙盒
// 建立：2026-09-18（接线）
// ============================================================================
//
// 【这个脚本干什么】
// 把 MVU 框架本体（MagicalAstrogy/MagVarUpdate）拉下来并跑起来。
// 它**只管加载**，不定义变量结构——结构在「变量结构约束.js」里。
//
// 【为什么必须单独有这一层】
// MVU 不是酒馆自带的扩展，是卡自己带的一段脚本：它负责解析模型输出的
// <UpdateVariable> 块、对变量打补丁、再派发生命周期事件。
// 少了它，「变量结构约束.js」里的 Schema 写得再对也没人调用
// —— 这正是本项目 2026-09-18 之前的状态。
//
// 【三个前置条件（缺一个就跑不起来）】
// 1. 酒馆必须装「酒馆助手」（JS-Slash-Runner）。
//    本脚本与结构约束脚本用到的 z / eventOn / getLorebookEntries /
//    registerVariableSchema 全由它提供。
// 2. 需要联网。bundle.js 有 573 KB，从 jsdelivr 拉；下面两个镜像互为备份。
//    2026-09-18 实测：两个镜像从本机都可达（约 0.6–1.4 秒）。
// 3. **必须有一条开场白**。MVU 在没有任何消息时会直接中止，并提示
//    「需要有开场白才能初始化变量」——这是官方源码里写死的判断，不是配置问题。
//
// 【执行顺序】
// 本脚本要排在「变量结构约束.js」**之前**（酒馆助手按脚本数组顺序执行）。
// 顺序反了也不会崩：结构约束只负责注册监听器，事件由本脚本拉下来的本体派发。
// ============================================================================

const MVU_镜像 = [
  'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js',
  'https://cdn.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js',
];

let 已加载镜像 = '';
for (const 地址 of MVU_镜像) {
  try {
    await import(地址);
    已加载镜像 = 地址;
    console.log('[MVU] 本体已加载：' + 地址);
    break;
  } catch (错误) {
    console.warn('[MVU] 这个镜像拉不动，换下一个：' + 地址, 错误);
  }
}

if (!已加载镜像) {
  console.error(
    '[MVU] 两个镜像都没拉下来 —— 变量系统不会工作。\n' +
      '  处理办法：确认网络能访问 jsdelivr；或改用酒馆助手把 bundle.js 存成本地脚本再引。'
  );
}

// 等 Mvu 接口挂到全局。拉不到时这里会超时退出，但不会卡住酒馆。
try {
  if (typeof waitGlobalInitialized === 'function') {
    await waitGlobalInitialized('Mvu');
    console.log('[MVU] 接口就绪。');
  } else {
    const 起点 = Date.now();
    while (!window.Mvu && Date.now() - 起点 < 8000) {
      await new Promise((下一步) => setTimeout(下一步, 50));
    }
    console.log(window.Mvu ? '[MVU] 接口就绪（轮询等到的）。' : '[MVU] 等接口超时。');
  }
} catch (错误) {
  console.warn('[MVU] 等接口时出错：', 错误);
}

// ---------------------------------------------------------------------------
// 接线自检：三件"不报错、但功能全坏"的事，主动喊出来
// ---------------------------------------------------------------------------
// 这三条都不会让脚本崩，只会让变量静默地不工作——所以值得花几行把它们说清楚。
try {
  // ① 一条消息都没有 → MVU 拒绝初始化（官方源码里写死的判断）
  if (typeof SillyTavern !== 'undefined' && Array.isArray(SillyTavern.chat) && SillyTavern.chat.length === 0) {
    console.error('[MVU] 当前一条消息都没有 —— MVU 不会初始化变量。先让这张卡带一条开场白。');
  }

  // ② 卡没绑世界书 → 初始变量和更新规则都读不到
  if (typeof getCharLorebooks === 'function') {
    const 书 = await getCharLorebooks();
    const 名单 = [书?.primary, ...(Array.isArray(书?.additional) ? 书.additional : [])].filter(Boolean);

    if (名单.length === 0) {
      console.warn('[MVU] 这张卡没有绑定世界书 —— [initvar] 初始变量和 [mvu_update] 更新规则都读不到。');
    } else if (typeof getLorebookEntries === 'function') {
      // ③ 世界书里没有 [initvar] 条目 → stat_data 会建成空的，模型看到的变量表也是空的
      let 初始变量条数 = 0;
      for (const 书名 of 名单) {
        for (const 条目 of await getLorebookEntries(书名)) {
          // 认领规则抄自 MVU 本体源码：comment 转小写后包含 '[initvar]'
          if (条目?.comment?.toLowerCase().includes('[initvar]')) 初始变量条数++;
        }
      }
      if (初始变量条数 === 0) {
        console.error('[MVU] 绑定的世界书里找不到 [initvar] 条目 —— 变量表会是空的。');
      } else {
        console.log(`[MVU] 找到 ${初始变量条数} 条 [initvar] 初始变量，绑定世界书：${名单.join('、')}`);
      }
    }
  }
} catch (错误) {
  console.warn('[MVU] 自检时出错（不影响运行）：', 错误);
}
