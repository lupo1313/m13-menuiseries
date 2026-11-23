# Prépare un dossier + zip prêts à envoyer sur Hostinger (liste blanche). Ne déploie rien.
# Usage : powershell -ExecutionPolicy Bypass -File .\package-deploy.ps1
$ErrorActionPreference = 'Stop'
$root  = $PSScriptRoot
$out   = Join-Path $root 'dist-hostinger'
$stage = Join-Path $out 'site'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

# Liste blanche : seuls ces éléments sont publiés.
Get-ChildItem $root -File -Filter *.html | Where-Object { $_.Name -ne 'test-liquid-glass.html' } | Copy-Item -Destination $stage
foreach ($f in '.htaccess','robots.txt','sitemap.xml') { Copy-Item (Join-Path $root $f) $stage }
foreach ($d in 'css','js','assets') { Copy-Item (Join-Path $root $d) $stage -Recurse }

# Contrôle de sécurité : échec si un fichier interdit s'est glissé dans le paquet.
$bad = Get-ChildItem $stage -Recurse -Force -File | Where-Object {
  $_.Name -match '^(\.mcp\.json|\.env.*|test-liquid-glass\.html|settings\.local\.json)$' -or
  $_.Extension -in '.zip','.md','.ps1','.pem','.key','.sql','.log','.bak' -or
  $_.FullName -match '[\/](strategie|Md 13 Menuiserie|\.git|\.claude|\.agents)[\/]'
}
if ($bad) { $bad | ForEach-Object { Write-Error "Fichier interdit : $($_.FullName)" }; exit 1 }

$zip = Join-Path $out 'm13menuiseries-hostinger.zip'
Push-Location $stage
& "$env:SystemRoot\System32\tar.exe" -a -cf $zip *.html .htaccess robots.txt sitemap.xml css js assets
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Error 'Echec de la création du zip'; exit 1 }
Pop-Location
Write-Host "OK : $zip ($((Get-ChildItem $stage -Recurse -File -Force).Count) fichiers)"
