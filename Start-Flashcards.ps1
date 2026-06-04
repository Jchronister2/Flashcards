$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot
$appPort = 4307
$appUrl = "http://localhost:$appPort"
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue

if (-not $npm) {
    Write-Host "npm was not found. Install Node.js first, then run this shortcut again."
    Read-Host "Press Enter to close"
    exit 1
}

Set-Location -LiteralPath $projectRoot
$host.UI.RawUI.WindowTitle = "Flashcards"
$env:NG_CLI_ANALYTICS = "false"

function Start-FlashcardsBrowser {
    param([string]$Url)

    $chrome = Get-Command chrome.exe -ErrorAction SilentlyContinue
    if (-not $chrome) {
        $chromeCandidates = @(
            "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
            "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
            "${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
        )
        $chrome = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    } else {
        $chrome = $chrome.Source
    }

    if ($chrome) {
        Start-Process -FilePath $chrome -ArgumentList $Url
    } else {
        Start-Process $Url
    }
}

function Test-FlashcardsApp {
    try {
        $response = Invoke-WebRequest -Uri $appUrl -UseBasicParsing -TimeoutSec 2
        if ($response.Content -match "<title>\s*Flashcard App\s*</title>") {
            return $true
        }
    } catch {
    }

    try {
        $response = Invoke-WebRequest -Uri "http://[::1]:$appPort" -UseBasicParsing -TimeoutSec 2
        return $response.Content -match "<title>\s*Flashcard App\s*</title>"
    } catch {
        return $false
    }
}

$dependencyProbePaths = @(
    (Join-Path $projectRoot "node_modules\.bin\ng.cmd"),
    (Join-Path $projectRoot "node_modules\rxjs\dist\types\index.d.ts"),
    (Join-Path $projectRoot "node_modules\@angular\common\index.d.ts")
)

$dependenciesHealthy = $true
foreach ($path in $dependencyProbePaths) {
    if (-not (Test-Path -LiteralPath $path)) {
        $dependenciesHealthy = $false
        break
    }
}

if (-not $dependenciesHealthy) {
    Write-Host "Installing Flashcards dependencies..."
    & $npm.Source ci
}

if (Test-FlashcardsApp) {
    Write-Host "Flashcards is already running at $appUrl."
    Start-FlashcardsBrowser -Url $appUrl
    exit 0
}

$browserOpener = @"
function Start-FlashcardsBrowser {
    param([string]`$Url)

    `$chrome = Get-Command chrome.exe -ErrorAction SilentlyContinue
    if (-not `$chrome) {
        `$chromeCandidates = @(
            "`${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
            "`${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
            "`${env:LocalAppData}\Google\Chrome\Application\chrome.exe"
        )
        `$chrome = `$chromeCandidates | Where-Object { Test-Path -LiteralPath `$_ } | Select-Object -First 1
    } else {
        `$chrome = `$chrome.Source
    }

    if (`$chrome) {
        Start-Process -FilePath `$chrome -ArgumentList `$Url
    } else {
        Start-Process `$Url
    }
}

`$uri = "$appUrl"
for (`$i = 0; `$i -lt 90; `$i++) {
    try {
        `$response = Invoke-WebRequest -Uri `$uri -UseBasicParsing -TimeoutSec 2
        if (`$response.Content -match "<title>\s*Flashcard App\s*</title>") {
            Start-FlashcardsBrowser -Url `$uri
            exit 0
        }
    } catch {
    }
    Start-Sleep -Seconds 2
}
"@

Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    $browserOpener
) -WindowStyle Hidden

Write-Host "Starting Flashcards at $appUrl ..."
& $npm.Source start -- --port $appPort --host localhost

if ($LASTEXITCODE -ne 0) {
    Read-Host "Flashcards stopped with an error. Press Enter to close"
}
