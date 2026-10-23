# reencode: shrink the hero reference jpg to ~1920px wide q74 for LCP sanity.
Add-Type -AssemblyName System.Drawing
$src = 'C:\Users\Subhan\Music\opencode\DeepArt\assets\recreate_2K_20261024013825.jpg'
$img = [System.Drawing.Image]::FromFile($src)
"src: $($img.Width)x$($img.Height)"
$targetW = 1920
$r = $img.Width / $img.Height
$t = New-Object System.Drawing.Bitmap($targetW, [int]($targetW / $r))
$g = [System.Drawing.Graphics]::FromImage($t)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($img, 0, 0, $t.Width, $t.Height)
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 74L)
$out = 'C:\Users\Subhan\Music\opencode\DeepArt\public\hero-flock.jpg'
$t.Save($out, $enc, $ep)
$g.Dispose(); $t.Dispose(); $img.Dispose()
"out: $(Get-Item $out | ForEach-Object { [Math]::Round($_.Length/1KB) })KB"
