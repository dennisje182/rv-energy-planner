[CmdletBinding()]
param()

$projectRoot = Split-Path -Parent $PSScriptRoot
$templatePath = Join-Path $projectRoot 'index.template.html'
$outputPath = Join-Path $projectRoot 'index.html'
$stylePath = Join-Path $projectRoot 'css/styles.css'
$scriptPaths = @(
    (Join-Path $projectRoot 'js/engine.js'),
    (Join-Path $projectRoot 'js/fridges.js'),
    (Join-Path $projectRoot 'js/app.js')
)

$template = Get-Content -LiteralPath $templatePath -Raw -Encoding UTF8
$styles = "<style>`n" + (Get-Content -LiteralPath $stylePath -Raw -Encoding UTF8) + "`n</style>"
$scripts = ($scriptPaths | ForEach-Object {
    "<script>`n(() => {`n" + (Get-Content -LiteralPath $_ -Raw -Encoding UTF8) + "`n})();`n</script>"
}) -join "`n"

$output = $template.Replace('<!-- STYLES -->', $styles).Replace('<!-- SCRIPTS -->', $scripts)
[System.IO.File]::WriteAllText($outputPath, $output, [System.Text.UTF8Encoding]::new($false))
Write-Output "Built $outputPath"
