// 《但为君故 · 沉吟至今》· MVU Zod Schema
// ---------------------------------------------------------------------------
// 版本：v0.2（2026-09-13 依对抗审查修正）
// 规范依据：ST-B1《变量更新规则》v1.0.0（TavernWeave 库快照 2026-08-18）
// 依赖：
//   - 全局 z：由 TavernHelper（JS-Slash-Runner v3.3.2+）注入，**不 import**（三实例地雷，ST-B1 §4.3）
//   - registerMvuSchema：由 StageDog/tavern_resource 的 mvu_zod.js 提供（远程加载，主/备镜像）
//
// 【v0.2 关键修正】不要用 .catch() 兜底
//   v0.1 曾对数值与枚举使用 .catch(默认值)，以为那是“失败安全”，实际是**静默数据损坏**：
//   catch 的语义不是“保留原值”，而是“换成一个固定默认值”。于是
//     代价 60 → 模型写成 "60点" → 校验失败 → 变成 0
//     关系阶段 "熟悉" → 写成 "很熟" → 变成 "陌生人"
//     面纱 "局部暴露" → 一次非法值 → 变回 "完好"（直接违反“只降不升”）
//   正解：**不加 catch**。非法值让验证失败，由 MVU 拒掉该条 patch，原值自然保留。
//   只有 `undefined`（字段缺失）走 prefault —— 那才是我们真正要的兜底。
//
// 【布尔字段】z.coerce.boolean() 等价于 Boolean(v)，而 Boolean("false") === true，
//   会把字符串 "false" 解析成 true（反向置位）。因此必须手工解析字符串布尔。
//
// 【未验证声明】本文件未经任何实机运行。下列要点必须实测：
//   (1) 中文键名与中文枚举值在 MVU 路径解析中的行为（ST-B1 §2.3 称支持，来源为生产卡实战）
//   (2) 非法值导致验证失败时，MVU 是否确实拒掉该 patch 而保留原值（**本文件的核心假设**）
//   (3) z.record() 在深层 record 中 prefault 的行为（ST-B1 §9 悬案 P7）
//   (4) 注册时机与 schemaVersion 迁移钩子的可用性
// ---------------------------------------------------------------------------

let registerMvuSchema;
try {
  ({ registerMvuSchema } = await import(
    'https://cdn.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js'
  ));
} catch (error) {
  ({ registerMvuSchema } = await import(
    'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js'
  ));
}

// —— 工具函数 ——
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// 文本：undefined / null / '' → fallback；其余一律转字符串
const 文本 = (fallback = '') =>
  z.preprocess(
    v => (v === undefined || v === null || v === '' ? fallback : String(v)),
    z.string()
  ).prefault(fallback);

// 数值：undefined → prefault；无法转成数字 → 验证失败（原值保留，不重置）
const 数值 = (lo, hi, fallback = 0) =>
  z.coerce.number().transform(v => clamp(v, lo, hi)).prefault(fallback);

// 枚举：undefined → prefault；不在取值域内 → 验证失败（原值保留，不回落）
const 枚举 = (values, fallback) => z.enum(values).prefault(fallback);

// 布尔：手工解析字符串，避免 Boolean("false") === true 的反向置位
const 布尔 = (fallback = false) =>
  z.preprocess(v => {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      if (s === 'true') return true;
      if (s === 'false') return false;
      return v; // 无法判定 → 交给 z.boolean() 判失败，不猜
    }
    if (typeof v === 'number') {
      if (v === 1) return true;
      if (v === 0) return false;
    }
    return v;
  }, z.boolean()).prefault(fallback);

// —— 枚举定义 ——
// 时段取 8 档：卡层正文实际出现「傍晚 / 下午四点 / 凌晨四点」，四档会把这些合法叙述判为非法值
const 时段枚举 = ['早间', '上午', '午间', '下午', '傍晚', '晚间', '深夜', '凌晨'];
const 面纱枚举 = ['完好', '有裂痕', '局部暴露']; // 只降不升
// 区取四个行政区 + 未定。注意：滨江（人文带）属江南区，南江大学与深港是场所而非行政区，
// 三者都写进 `场所` 字段，不占用 `区`
const 城区枚举 = ['江北', '江南', '新区', '月石', '未定'];
const 觉醒阶段枚举 = ['未觉醒', '初醒', '掌控', '过载'];
const 关系阶段枚举 = ['陌生人', '认识', '熟悉', '信任', '亲密', '破裂'];
const 事件状态枚举 = ['未接', '进行中', '完成', '失败'];

// —— 顶层容器：世界 ——
const 世界Schema = z.object({
  日期: 文本('纪年第1日'),
  时段: 枚举(时段枚举, '早间'),
  区: 枚举(城区枚举, '未定'),
  场所: 文本(''),
  面纱: 枚举(面纱枚举, '完好'),
}).prefault({});

// —— 顶层容器：主控（玩家自捏） ——
const 主控Schema = z.object({
  姓名: 文本(''),
  来历: 文本(''),
  异能倾向: 文本(''),      // 问卷第 4 问的答案：觉醒尚未发生，此处只记倾向
  异能: 文本(''),          // 觉醒后由剧情链写入，须含“能做到/做不到/代价”要素
  觉醒阶段: 枚举(觉醒阶段枚举, '未觉醒'),
  代价: 数值(0, 100, 0),    // 反噬累积
  暴露度: 数值(0, 100, 0),  // 被普通人注意的程度
}).prefault({});

// —— 角色 record 的值 ——
const 角色状态Schema = z.object({
  已遇: 布尔(false),
  现实身份已知: 布尔(false),
  已知为觉醒者: 布尔(false),
  关系阶段: 枚举(关系阶段枚举, '陌生人'),
  好感: 数值(-100, 100, 0),
  其他信息: 文本(''),      // 临时状态：伤势、人情、约定
}).prefault({});

// —— 顶层容器：事件（上限 5 条由规则文本约束，schema 层不加 max 以便保留 writeback 数据） ——
const 事件项Schema = z.object({
  标题: 文本(''),
  状态: 枚举(事件状态枚举, '未接'),
}).prefault({});

const 事件Schema = z.object({
  进行中: z.array(事件项Schema).prefault([]),
}).prefault({});

// —— 顶层 schema（对应 stat_data 层级） ——
// 说明：五名角色的初始状态由 InitialVariables.json 预置（那才是共享默认值的来源）；
// 这里的 prefault 只在 record 整体缺失时兜住结构，不作为第二份初值来源。
export const Schema = z.object({
  结构版本: z.coerce.number().prefault(1),
  世界: 世界Schema,
  主控: 主控Schema,
  角色: z.record(z.string(), 角色状态Schema).prefault({}),
  事件: 事件Schema,
});

// —— 注册（必须在 $() 回调中，ST-B1 §8.7） ——
$(() => {
  registerMvuSchema(Schema);
});
