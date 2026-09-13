// 《但为君故 · 沉吟至今》· R1 · MVU 装载脚本（卡内嵌）
// ---------------------------------------------------------------------------
// 职责边界（重要）：
//   本脚本**只**负责：加载 MVU（MagVarUpdate）bundle + 注入生产默认设置。
//   schema 注册由独立脚本 `schema/zod_schema.js` 承担——它自己 import
//   `mvu_zod.js` 并调用 registerMvuSchema。本脚本**绝不**再加载 mvu_zod，
//   否则会造出第二个 zod 实例（跨实例地雷，ST-B1 §4.3）。
//
// 规范依据：ST-B1 §5.5 等待范式、§5.3 Mvu 核心 API、§7.2 加载范式
//
// 【未验证声明】本文件从未在真实 SillyTavern 中运行过。下列各点必须实机确认：
//   (1) 两个镜像地址在目标网络下是否可用、哪一条通；
//   (2) `waitGlobalInitialized` 是否存在于当前酒馆助手版本；
//   (3) `Mvu.settings` 是否是注入默认设置的正确入口（ST-B1 §7.2 只给了
//       applyMvuDefaults(Mvu) 的调用形式，未给实现；本文件按防御式写法处理，
//       取不到就跳过并如实提示，不静默假装成功）；
//   (4) 卡内脚本的执行时机与卡内嵌世界书的加载先后。
// ---------------------------------------------------------------------------

const MVU_MIRRORS = [
  // 国内优先
  'https://testingcf.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js',
  // 备用
  'https://cdn.jsdelivr.net/gh/MagicalAstrogy/MagVarUpdate/artifact/bundle.js',
];

// 生产默认设置（依 ST-B1 §7.2 实测范式；中英双写以兼容不同版本键名）
const MVU_DEFAULTS = Object.freeze({
  reprocessVariables: true,
  rereadInitialVariables: true,
  retryExtraModelParse: true,
  '重新处理变量': true,
  '重新读取初始变量': true,
  '重试额外模型解析': true,
});

const TAG = '[但为君故]';

async function loadMvuBundle() {
  const failures = [];
  for (const url of MVU_MIRRORS) {
    try {
      await import(url);
      return { ok: true, url };
    } catch (error) {
      failures.push(`${url}\n    -> ${error}`);
    }
  }
  return { ok: false, failures };
}

async function waitForMvu(timeoutMs = 10000) {
  if (typeof waitGlobalInitialized === 'function') {
    return await waitGlobalInitialized('Mvu');
  }
  const started = Date.now();
  while (!window.Mvu && Date.now() - started < timeoutMs) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  return window.Mvu ?? null;
}

// 注入默认设置。取不到入口就返回 false，由调用方如实提示——不假装成功。
function applyMvuDefaults(Mvu) {
  try {
    const settings = Mvu?.settings;
    if (!settings || typeof settings !== 'object') return false;
    let touched = 0;
    for (const [key, value] of Object.entries(MVU_DEFAULTS)) {
      if (key in settings && settings[key] !== value) {
        settings[key] = value;
        touched += 1;
      }
    }
    return touched > 0 || Object.keys(settings).length > 0;
  } catch (error) {
    console.warn(TAG, '注入默认设置时出错：', error);
    return false;
  }
}

function notifyFailure(message) {
  // 明确报错，不静默降级（契约 ④「失败行为」）
  console.error(TAG, message);
  try {
    if (typeof toastr !== 'undefined' && toastr.error) {
      toastr.error(message, '但为君故 · 变量系统未启动', { timeOut: 0, extendedTimeOut: 0 });
    }
  } catch (_) {
    /* toastr 不可用时只留控制台日志 */
  }
}

(async () => {
  const startedAt = Date.now();

  const loaded = await loadMvuBundle();
  if (!loaded.ok) {
    notifyFailure(
      `${TAG} MVU 主程序加载失败：两个镜像均不可用。变量系统不会启动，卡内状态无法记录。\n` +
      loaded.failures.join('\n')
    );
    return;
  }

  const Mvu = await waitForMvu();
  if (!Mvu) {
    notifyFailure(`${TAG} MVU 主程序已下载，但等待其就绪超时（10 秒）。`);
    return;
  }

  const applied = applyMvuDefaults(Mvu);
  console.info(
    `${TAG} MVU 就绪，用时 ${Date.now() - startedAt}ms（来源：${loaded.url}）；` +
    `默认设置注入：${applied ? '成功' : '已跳过（未找到 settings 入口，需实机核对）'}`
  );
})();
