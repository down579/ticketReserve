# 단일 인스턴스 (coordinator 변경)
# 사용: .\scripts\run-single.ps1 -Coordinator none -Port 8080

param(
    [ValidateSet('none', 'local', 'redis')]
    [string]$Coordinator = 'none',
    [int]$Port = 8080,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Jar = Join-Path $Root 'build\libs\ticketReserve-0.0.1-SNAPSHOT.jar'

Set-Location $Root

if (-not $SkipBuild) {
    Write-Host 'Building bootJar...'
    & "$Root\gradlew.bat" bootJar -q
    if ($LASTEXITCODE -ne 0) {
        throw 'Gradle bootJar failed.'
    }
}

if (-not (Test-Path $Jar)) {
    throw "Jar not found: $Jar"
}

Write-Host "Starting port=$Port coordinator=$Coordinator"
& java -jar $Jar "--server.port=$Port" "--ticket.instance-id=$Port" "--ticket.seat-map.coordinator=$Coordinator"
