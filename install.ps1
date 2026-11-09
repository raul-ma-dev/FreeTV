param([string]$Device = 'freetv')
$ErrorActionPreference = 'Stop'
foreach ($command in @('ares-package', 'ares-install', 'ares-launch')) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) { throw "Falta $command. Instala Node.js y ejecuta: npm install -g @webos-tools/cli" }
}
$stage = Join-Path $PSScriptRoot 'build\app'
$output = Join-Path $PSScriptRoot 'build'
New-Item -ItemType Directory -Force -Path $stage | Out-Null
foreach ($file in @('appinfo.json', 'index.html', 'style.css', 'app.js', 'icon.png', 'playlist.m3u')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $stage -Force
}
& ares-package $stage -o $output
if ($LASTEXITCODE -ne 0) { throw 'Falló el empaquetado.' }
$appInfo = Get-Content -LiteralPath (Join-Path $stage 'appinfo.json') -Raw | ConvertFrom-Json
& ares-install --device $Device (Join-Path $output "$($appInfo.id)_$($appInfo.version)_all.ipk")
if ($LASTEXITCODE -ne 0) { throw 'Falló la instalación. Comprueba Developer Mode y Key Server.' }
& ares-launch --device $Device com.freetv.player
if ($LASTEXITCODE -ne 0) { throw 'No se pudo iniciar FreeTV.' }
