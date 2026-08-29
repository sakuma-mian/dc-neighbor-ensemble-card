# 《但为君故》组装·图像预处理
# 1) 头像 → 256x256 居中裁切 JPEG q85（卡内嵌一号位）
# 2) 立绘 → 高 576 等比 JPEG q82（卡内嵌二号位，揭晓态）
# 3) PNG 卡面 512x768（雾青风格底图，供 build_card.mjs 嵌入 chara/ccv3 块）
# 输出：输出/_build/（本地构建产物，不入库）
param([string]$OutDir = (Join-Path $PSScriptRoot '..\输出\_build'))

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root    = Split-Path -Parent $PSScriptRoot               # D:\工作台
$avDir   = Join-Path $root 'frontend\assets\头像'          # 源素材（本地，不入库）
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

function Save-Jpeg([System.Drawing.Bitmap]$bmp, [string]$path, [int]$quality) {
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
  $bmp.Save($path, $codec, $ep)
  $ep.Dispose()
}

function Convert-Avatar([string]$srcPath, [string]$dstPath) {
  $src = [System.Drawing.Image]::FromFile($srcPath)
  try {
    $side = [Math]::Min($src.Width, $src.Height)
    $cropX = [int](($src.Width - $side) / 2)
    $cropY = [int](($src.Height - $side) * 0.10)   # 偏上取脸
    $dst = New-Object System.Drawing.Bitmap(256, 256)
    $g = [System.Drawing.Graphics]::FromImage($dst)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.SmoothingMode = 'HighQuality'
    $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $side, $side)
    $dstRect = New-Object System.Drawing.Rectangle(0, 0, 256, 256)
    $g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    Save-Jpeg $dst $dstPath 85
    $dst.Dispose()
  } finally { $src.Dispose() }
}

function Convert-Liani([string]$srcPath, [string]$dstPath) {
  $src = [System.Drawing.Image]::FromFile($srcPath)
  try {
    $h = 576
    $w = [int][Math]::Round($src.Width * $h / $src.Height)
    $dst = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($dst)
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.SmoothingMode = 'HighQuality'
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)))
    $g.Dispose()
    Save-Jpeg $dst $dstPath 82
    $dst.Dispose()
  } finally { $src.Dispose() }
}

# ── 1/2 头像与立绘（文件名映射与 djg-render CONFIG 一致） ──
$pairs = @(
  @{ src = '佐久间眠头像.png';              av = '佐久间眠.jpg';            li = '花奈.jpg' },
  @{ src = '珍惜才配拥有 头像.png';         av = '珍惜才配拥有.jpg';        li = '清寒.jpg' },
  @{ src = 'cojack 头像.png';               av = 'cojack.jpg';              li = '沉秋.jpg' },
  @{ src = '楚楚的笙_unofficial 头像.png';  av = '楚楚的笙_unofficial.jpg'; li = '楚羽笙.jpg' },
  @{ src = '冯诺依曼 头像.png';             av = '冯诺依曼.jpg';            li = '诺薇拉.jpg' }
)
# 立绘源名按真名对应（frontend/assets/头像/ 下的 DEC-035 命名）
$lianiSrc = @{
  '花奈.jpg'   = '藤原花奈立绘.png'
  '清寒.jpg'   = '顾清寒 立绘.png'
  '沉秋.jpg'   = '鱼沉秋 立绘.png'
  '楚羽笙.jpg' = '楚羽笙 立绘.png'
  '诺薇拉.jpg' = '诺薇拉 立绘.png'
}

foreach ($p in $pairs) {
  $srcAv = Join-Path $avDir $p.src
  if (-not (Test-Path $srcAv)) { throw "缺少头像素材：$srcAv" }
  Convert-Avatar $srcAv (Join-Path $OutDir $p.av)
  $srcLi = Join-Path $avDir $lianiSrc[$p.li]
  if (-not (Test-Path $srcLi)) { throw "缺少立绘素材：$srcLi" }
  Convert-Liani $srcLi (Join-Path $OutDir $p.li)
  Write-Host ("已转换 {0} / {1}" -f $p.av, $p.li)
}

# ── 3 PNG 卡面 512x768 ──
$W = 512; $H = 768
$bmp = New-Object System.Drawing.Bitmap($W, $H)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAlias'

$bgRect = New-Object System.Drawing.Rectangle(0, 0, $W, $H)
$grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $bgRect, [System.Drawing.Color]::FromArgb(255, 11, 16, 20),
  [System.Drawing.Color]::FromArgb(255, 20, 34, 43), 90)
$g.FillRectangle($grad, $bgRect)

# 细网格
$gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(12, 143, 208, 216))
for ($x = 0; $x -lt $W; $x += 56) { $g.DrawLine($gridPen, $x, 0, $x, $H) }
for ($y = 0; $y -lt $H; $y += 56) { $g.DrawLine($gridPen, 0, $y, $W, $y) }
$gridPen.Dispose()

function Cut-Rect([single]$x, [single]$y, [single]$w, [single]$h, [single]$c) {
  return [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF(($x + $c), $y)),
    (New-Object System.Drawing.PointF(($x + $w), $y)),
    (New-Object System.Drawing.PointF(($x + $w), ($y + $h - $c))),
    (New-Object System.Drawing.PointF(($x + $w - $c), ($y + $h))),
    (New-Object System.Drawing.PointF($x, ($y + $h))),
    (New-Object System.Drawing.PointF($x, ($y + $c)))
  )
}
$framePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, 140, 200, 210))
$g.DrawPolygon($framePen, (Cut-Rect 16 16 ($W - 32) ($H - 32) 16))
$framePen.Dispose()

function Center-Text([string]$text, [single]$cy, [string]$fontFamily, [single]$size, $color, [bool]$bold) {
  $style = [System.Drawing.FontStyle]::Regular
  if ($bold) { $style = [System.Drawing.FontStyle]::Bold }
  $font = New-Object System.Drawing.Font($fontFamily, $size, $style)
  $sz = $g.MeasureString($text, $font)
  $brush = New-Object System.Drawing.SolidBrush($color)
  $g.DrawString($text, $font, $brush, [single](($W - $sz.Width) / 2), [single]($cy - $sz.Height / 2))
  $brush.Dispose(); $font.Dispose()
}

$yahei = 'Microsoft YaHei'
Center-Text 'DISCORD · 南江市 · 2026 秋' 76 $yahei 11 ([System.Drawing.Color]::FromArgb(255, 108, 127, 168)) $false
Center-Text '在DC频道里口嗨的群友' 146 $yahei 27 ([System.Drawing.Color]::FromArgb(255, 230, 237, 242)) $true
Center-Text '就住我隔壁？！' 196 $yahei 31 ([System.Drawing.Color]::FromArgb(255, 143, 208, 216)) $true
Center-Text '— 但为君故 —' 262 $yahei 15 ([System.Drawing.Color]::FromArgb(255, 230, 237, 242)) $false
Center-Text '「但为君故，沉吟至今」——《短歌行》' 298 $yahei 10 ([System.Drawing.Color]::FromArgb(255, 94, 112, 122)) $false

# 五人六边形雾字牌（佐珍秋笙诺）
$glyphs = @('佐', '珍', '秋', '笙', '诺')
$hexFill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 19, 29, 35))
$hexPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 140, 200, 210))
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 147, 167, 177))
$gxFont = New-Object System.Drawing.Font($yahei, 20, [System.Drawing.FontStyle]::Bold)
$cyc = 420; $hw = 34; $hh = 38; $gap = 22
$totalW = 5 * 2 * $hw + 4 * $gap
for ($i = 0; $i -lt 5; $i++) {
  $cx = ($W - $totalW) / 2 + $i * (2 * $hw + $gap) + $hw
  $pts = [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF($cx, ($cyc - $hh))),
    (New-Object System.Drawing.PointF(($cx + $hw), ($cyc - $hh / 2))),
    (New-Object System.Drawing.PointF(($cx + $hw), ($cyc + $hh / 2))),
    (New-Object System.Drawing.PointF($cx, ($cyc + $hh))),
    (New-Object System.Drawing.PointF(($cx - $hw), ($cyc + $hh / 2))),
    (New-Object System.Drawing.PointF(($cx - $hw), ($cyc - $hh / 2)))
  )
  $g.FillPolygon($hexFill, $pts)
  $g.DrawPolygon($hexPen, $pts)
  $sz = $g.MeasureString($glyphs[$i], $gxFont)
  $g.DrawString($glyphs[$i], $gxFont, $textBrush,
    [single]($cx - $sz.Width / 2), [single]($cyc - $sz.Height / 2))
}
$hexFill.Dispose(); $hexPen.Dispose(); $textBrush.Dispose(); $gxFont.Dispose()

Center-Text 'MVU 变量 · 重迷雾 · 群像沙盒' 646 $yahei 11 ([System.Drawing.Color]::FromArgb(255, 108, 127, 168)) $false
Center-Text '需要酒馆助手 + 绘绘预设（详见说明）' 676 $yahei 10 ([System.Drawing.Color]::FromArgb(255, 94, 112, 122)) $false

$g.Dispose()
$cardPng = Join-Path $OutDir 'card-base.png'
$bmp.Save($cardPng, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "已生成卡面 $cardPng"
Write-Host '图像预处理完成。'
