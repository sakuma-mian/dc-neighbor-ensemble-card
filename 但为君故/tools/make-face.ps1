<#
  《但为君故 · 沉吟至今》· 卡面生成（512×768）
  ---------------------------------------------------------------------------
  主题：夜航档案 · 青冷（与 frontend/tokens.md 同源配色）
  实现：System.Drawing（Windows 自带，无第三方库）
  输出：output/card-face.png（仅卡面；嵌卡数据见 tools/embed-png.mjs）

  工程注意（两个真实踩过的坑，勿改回去）：
  1. 本文件必须是 **UTF-8 with BOM** —— PowerShell 5.1 对无 BOM 的 UTF-8 会按 GBK 解码，中文全乱。
  2. 一律用 `[Type]::new(a, b)`，不要用 `New-Object Type(a, b)`：后者里 **逗号优先级高于减号**，
     `New-Object X($W - $cut, 0)` 会被解析成 `$W - @(26,0)`（数字减数组）而报错。
  3. 运行需 `-ExecutionPolicy Bypass`（本机脚本执行被禁用）。

  本图全部为程序化自绘（渐变 + 网格 + 切角边框 + 文字 + 字牌），不使用任何第三方图片素材。
  五人字牌为占位，待头像立绘到位后可替换。
#>
param(
  [string]$Out = 'output/card-face.png'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$W = 512; $H = 768
$C = @{
  bg1 = '#060E12'; bg2 = '#0C1A21'
  line = '#1B323B'; lineHi = '#2A4E5A'
  cyan = '#5FD4E0'; text = '#E4F1F4'; dim = '#9FBAC2'; mute = '#6E8C95'
}
function Col([string]$h) { return [System.Drawing.ColorTranslator]::FromHtml($h) }

$bmp = [System.Drawing.Bitmap]::new($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

# ── 1. 渐变底 ──
$rect = [System.Drawing.Rectangle]::new(0, 0, $W, $H)
$bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new($rect, (Col $C.bg1), (Col $C.bg2), 90)
$g.FillRectangle($bg, $rect)
$bg.Dispose()

# ── 2. 细网格 ──
$gridPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(11, 95, 212, 224), 1)
for ($x = 0; $x -lt $W; $x += 16) { $g.DrawLine($gridPen, $x, 0, $x, $H) }
for ($y = 0; $y -lt $H; $y += 16) { $g.DrawLine($gridPen, 0, $y, $W, $y) }
$gridPen.Dispose()

# ── 3. 顶部青色光晕 ──
$glowRect = [System.Drawing.Rectangle]::new(0, 0, $W, 220)
$glow = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  $glowRect, [System.Drawing.Color]::FromArgb(30, 95, 212, 224), [System.Drawing.Color]::FromArgb(0, 95, 212, 224), 90)
$g.FillRectangle($glow, $glowRect)
$glow.Dispose()

# ── 4. 切角边框 ──
$cut = 26
$x1 = $W - $cut
$y1 = $H - $cut
$pts = [System.Drawing.Point[]]@(
  [System.Drawing.Point]::new(0, 0),
  [System.Drawing.Point]::new($x1, 0),
  [System.Drawing.Point]::new($W, $cut),
  [System.Drawing.Point]::new($W, $H),
  [System.Drawing.Point]::new($cut, $H),
  [System.Drawing.Point]::new(0, $y1)
)
$framePen = [System.Drawing.Pen]::new((Col $C.lineHi), 2)
$g.DrawPolygon($framePen, $pts)
$framePen.Dispose()

$inner = [System.Drawing.Point[]]@(
  [System.Drawing.Point]::new(6, 6),
  [System.Drawing.Point]::new(($x1 - 6), 6),
  [System.Drawing.Point]::new(($W - 6), ($cut + 6)),
  [System.Drawing.Point]::new(($W - 6), ($H - 6)),
  [System.Drawing.Point]::new(($cut + 6), ($H - 6)),
  [System.Drawing.Point]::new(6, ($y1 - 6))
)
$innerPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(80, 95, 212, 224), 1)
$g.DrawPolygon($innerPen, $inner)
$innerPen.Dispose()

# ── 5. 左上角标 ──
$markPen = [System.Drawing.Pen]::new((Col $C.cyan), 2)
$g.DrawLine($markPen, 34, 34, 34, 74)
$g.DrawLine($markPen, 34, 34, 74, 34)
$markPen.Dispose()

# ── 6. 文字 ──
$fTag   = [System.Drawing.Font]::new('Microsoft YaHei', 11)
$fTitle = [System.Drawing.Font]::new('Microsoft YaHei', 30, [System.Drawing.FontStyle]::Bold)
$fSub   = [System.Drawing.Font]::new('Microsoft YaHei', 12)
$fBody  = [System.Drawing.Font]::new('Microsoft YaHei', 10)
$fGlyph = [System.Drawing.Font]::new('Microsoft YaHei', 20, [System.Drawing.FontStyle]::Bold)
$fFoot  = [System.Drawing.Font]::new('Microsoft YaHei', 9)

$bText = [System.Drawing.SolidBrush]::new((Col $C.text))
$bDim  = [System.Drawing.SolidBrush]::new((Col $C.dim))
$bMute = [System.Drawing.SolidBrush]::new((Col $C.mute))
$bCyan = [System.Drawing.SolidBrush]::new((Col $C.cyan))

$g.DrawString('◇ 夜航档案 · 现代都市 / 隐秘异能', $fTag, $bCyan, 78, 32)
$g.DrawString('但为君故', $fTitle, $bText, 34, 118)
$g.DrawString('沉吟至今', $fTitle, $bText, 34, 168)

$sepPen = [System.Drawing.Pen]::new((Col $C.cyan), 2)
$g.DrawLine($sepPen, 36, 226, 150, 226)
$sepPen.Dispose()

$g.DrawString('南江市 · 群像沙盒 · 玩家自捏觉醒者', $fSub, $bDim, 36, 244)
$g.DrawString('面纱之下，南江还有另一层。', $fBody, $bDim, 36, 292)
$g.DrawString('觉醒不是天赋，是要付利息的贷款。', $fBody, $bMute, 36, 314)

# ── 7. 五人字牌（占位） ──
$glyphs = @('花', '珍', '秋', '笙', '诺')
$boxW = 68; $boxH = 78; $gap = 14; $c2 = 10
$totalW = $glyphs.Count * $boxW + ($glyphs.Count - 1) * $gap
$startX = [int](($W - $totalW) / 2)
$y0 = 430

$sf = [System.Drawing.StringFormat]::new()
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$fillBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(210, 11, 22, 28))
$edgePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(120, 95, 212, 224), 1)

for ($i = 0; $i -lt $glyphs.Count; $i++) {
  $bx = $startX + $i * ($boxW + $gap)
  $bp = [System.Drawing.Point[]]@(
    [System.Drawing.Point]::new($bx, $y0),
    [System.Drawing.Point]::new(($bx + $boxW - $c2), $y0),
    [System.Drawing.Point]::new(($bx + $boxW), ($y0 + $c2)),
    [System.Drawing.Point]::new(($bx + $boxW), ($y0 + $boxH)),
    [System.Drawing.Point]::new(($bx + $c2), ($y0 + $boxH)),
    [System.Drawing.Point]::new($bx, ($y0 + $boxH - $c2))
  )
  $g.FillPolygon($fillBrush, $bp)
  $g.DrawPolygon($edgePen, $bp)
  $rf = [System.Drawing.RectangleF]::new($bx, $y0, $boxW, $boxH)
  $g.DrawString($glyphs[$i], $fGlyph, $bDim, $rf, $sf)
}
$fillBrush.Dispose(); $edgePen.Dispose()

$g.DrawString('佐久间眠 · 珍惜才配拥有 · cojack · 楚楚的笙 · 冯诺依曼', $fFoot, $bMute, 36, 528)

# ── 8. 页脚 ──
$footPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(70, 95, 212, 224), 1)
$g.DrawLine($footPen, 36, ($H - 92), ($W - 36), ($H - 92))
$footPen.Dispose()
$g.DrawString('MVU + Zod · 变量系统驱动', $fFoot, $bMute, 36, ($H - 78))
$g.DrawString('需安装酒馆助手（JS-Slash-Runner）', $fFoot, $bMute, 36, ($H - 62))
$g.DrawString('v0.1 · 2026-09-13 · 图标 Lucide(ISC)，署名见 creator_notes', $fFoot, $bMute, 36, ($H - 44))

# ── 9. 保存 ──
$full = Join-Path (Get-Location).Path $Out
$dir = Split-Path $full -Parent
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$bmp.Save($full, [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose(); $bmp.Dispose()
$fTag.Dispose(); $fTitle.Dispose(); $fSub.Dispose(); $fBody.Dispose(); $fGlyph.Dispose(); $fFoot.Dispose()
$bText.Dispose(); $bDim.Dispose(); $bMute.Dispose(); $bCyan.Dispose(); $sf.Dispose()

"卡面已生成：$Out  ($W x $H, $((Get-Item $full).Length) 字节)"
