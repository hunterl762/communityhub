param([Parameter(Mandatory=$true)][string]$OutputDirectory)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$appRoot = Join-Path $repoRoot 'php'
if (-not (Test-Path -LiteralPath (Join-Path $appRoot 'vendor/autoload.php'))) { throw 'Run composer install --no-dev in php before packaging.' }
$outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $outputRoot | Out-Null
$stageRoot = Join-Path $outputRoot ('cpanel-stage-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $stageRoot | Out-Null
foreach ($name in @('src','bin','vendor','public')) { Copy-Item -LiteralPath (Join-Path $appRoot $name) -Destination $stageRoot -Recurse }
foreach ($name in @('.env.example','composer.json','composer.lock','README.md','public-content-defaults.json')) { Copy-Item -LiteralPath (Join-Path $appRoot $name) -Destination $stageRoot }
foreach ($name in @('css','js','images','data')) {
    $source = Join-Path $repoRoot ('public/' + $name)
    $target = Join-Path $stageRoot ('public/' + $name)
    if (Test-Path -LiteralPath $source) {
        New-Item -ItemType Directory -Force -Path $target | Out-Null
        Get-ChildItem -LiteralPath $source -Force | Copy-Item -Destination $target -Recurse -Force
    }
}
New-Item -ItemType Directory -Path (Join-Path $stageRoot 'sql') | Out-Null
Copy-Item -LiteralPath (Join-Path $repoRoot 'sql/migrations/026_php_runtime.sql') -Destination (Join-Path $stageRoot 'sql/026_php_runtime.sql')
New-Item -ItemType Directory -Path (Join-Path $stageRoot 'fivem') | Out-Null
Copy-Item -LiteralPath (Join-Path $repoRoot 'fivem/communityhub') -Destination (Join-Path $stageRoot 'fivem') -Recurse
# The source application, vendor and static assets are allowlisted; local secrets, sessions and tests are excluded.
if (Get-ChildItem -LiteralPath $stageRoot -Recurse -Force -File | Where-Object Name -EQ '.env') { throw 'Refusing to package a real .env file.' }
$zip = Join-Path $outputRoot 'communityhub-cpanel.zip'
if (Test-Path -LiteralPath $zip) { throw 'The output ZIP already exists. Choose a new output directory.' }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[IO.Compression.ZipFile]::CreateFromDirectory($stageRoot, $zip)
$archive = [IO.Compression.ZipFile]::OpenRead($zip)
try {
    foreach ($required in @('public/.htaccess','public/index.php','vendor/autoload.php','sql/026_php_runtime.sql')) {
        if (-not ($archive.Entries | Where-Object { $_.FullName.Replace('\','/') -eq $required })) { throw "Missing package file: $required" }
    }
} finally { $archive.Dispose() }
Get-FileHash -LiteralPath $zip -Algorithm SHA256 | Format-List
Write-Output "Package: $zip"
