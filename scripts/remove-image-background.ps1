param(
  [Parameter(Mandatory = $true)]
  [string]$SourceDirectory,

  [Parameter(Mandatory = $true)]
  [string]$DestinationDirectory
)

Add-Type -AssemblyName System.Drawing

$sourcePath = (Resolve-Path -LiteralPath $SourceDirectory).Path
New-Item -ItemType Directory -Path $DestinationDirectory -Force | Out-Null
$destinationPath = (Resolve-Path -LiteralPath $DestinationDirectory).Path

Get-ChildItem -LiteralPath $sourcePath -Filter '*.png' -File | ForEach-Object {
  $sourceBitmap = [System.Drawing.Bitmap]::new($_.FullName)
  $resultBitmap = [System.Drawing.Bitmap]::new($sourceBitmap)
  $background = $sourceBitmap.GetPixel(0, 0)
  $resultBitmap.MakeTransparent($background)

  $visiblePixels = 0
  $minX = $resultBitmap.Width
  $minY = $resultBitmap.Height
  $maxX = -1
  $maxY = -1
  $visibleByRow = [int[]]::new($resultBitmap.Height)
  for ($y = 0; $y -lt $resultBitmap.Height; $y += 1) {
    for ($x = 0; $x -lt $resultBitmap.Width; $x += 1) {
      if ($resultBitmap.GetPixel($x, $y).A -gt 0) {
        $visiblePixels += 1
        $minX = [Math]::Min($minX, $x)
        $minY = [Math]::Min($minY, $y)
        $maxX = [Math]::Max($maxX, $x)
        $maxY = [Math]::Max($maxY, $y)
        $visibleByRow[$y] += 1
      }
    }
  }
  if ($visiblePixels -eq 0) {
    $resultBitmap.Dispose()
    $sourceBitmap.Dispose()
    throw "Background extraction produced an empty image: $($_.Name)"
  }

  # The legacy source files include a small text caption below the pictogram.
  # Keep the densest connected vertical band so the category name is rendered
  # by the UI only once, while isolated caption pixels are discarded.
  $bestStart = $minY
  $bestEnd = $maxY
  $bestPixelCount = 0
  $currentStart = -1
  $currentPixelCount = 0
  for ($y = 0; $y -le $resultBitmap.Height; $y += 1) {
    $rowHasPixels = $y -lt $resultBitmap.Height -and $visibleByRow[$y] -gt 0
    if ($rowHasPixels) {
      if ($currentStart -lt 0) {
        $currentStart = $y
      }
      $currentPixelCount += $visibleByRow[$y]
    } elseif ($currentStart -ge 0) {
      if ($currentPixelCount -gt $bestPixelCount) {
        $bestStart = $currentStart
        $bestEnd = $y - 1
        $bestPixelCount = $currentPixelCount
      }
      $currentStart = -1
      $currentPixelCount = 0
    }
  }
  $minY = $bestStart
  $maxY = $bestEnd
  $minX = $resultBitmap.Width
  $maxX = -1
  for ($y = $minY; $y -le $maxY; $y += 1) {
    for ($x = 0; $x -lt $resultBitmap.Width; $x += 1) {
      if ($resultBitmap.GetPixel($x, $y).A -gt 0) {
        $minX = [Math]::Min($minX, $x)
        $maxX = [Math]::Max($maxX, $x)
      }
    }
  }

  $padding = 6
  $cropX = [Math]::Max(0, $minX - $padding)
  $cropY = [Math]::Max(0, $minY - $padding)
  $cropRight = [Math]::Min($resultBitmap.Width - 1, $maxX + $padding)
  $cropBottom = [Math]::Min($resultBitmap.Height - 1, $maxY + $padding)
  $cropWidth = $cropRight - $cropX + 1
  $cropHeight = $cropBottom - $cropY + 1
  $croppedBitmap = [System.Drawing.Bitmap]::new(
    $cropWidth,
    $cropHeight,
    [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  )
  $graphics = [System.Drawing.Graphics]::FromImage($croppedBitmap)
  $graphics.DrawImage(
    $resultBitmap,
    [System.Drawing.Rectangle]::new(0, 0, $cropWidth, $cropHeight),
    [System.Drawing.Rectangle]::new($cropX, $cropY, $cropWidth, $cropHeight),
    [System.Drawing.GraphicsUnit]::Pixel
  )

  $outputPath = Join-Path $destinationPath $_.Name
  $croppedBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $croppedBitmap.Dispose()
  $resultBitmap.Dispose()
  $sourceBitmap.Dispose()
}
