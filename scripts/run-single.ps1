# 단일 인스턴스 (coordinator / JVM 옵션)
# 사용: .\scripts\run-single.ps1 -Port 8080 -Heap 256m -GcLog
#       .\scripts\run-single.ps1 -PlatformThreads -Heap 256m -GcLog

param(
    [ValidateSet('none', 'local', 'redis')]
    [string]$Coordinator = 'none',
    [int]$Port = 8080,
    [string]$Heap = '256m',
    [switch]$GcLog,
    [switch]$PlatformThreads,
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Jar = Join-Path $Root 'build\libs\ticketReserve-0.0.1-SNAPSHOT.jar'
$LogsDir = Join-Path $Root 'logs'

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

$jvmArgs = @(
    "-Xms$Heap",
    "-Xmx$Heap",
    "-XX:+UseG1GC"
)

if ($GcLog) {
    New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
    $gcLogFile = "logs/gc-$Port.log"
    $jvmArgs += "-Xlog:gc*:file=$gcLogFile:time,uptime,level:tags"
    Write-Host "GC log: $Root\$gcLogFile"
}

$springArgs = @(
    "-jar", $Jar,
    "--server.port=$Port",
    "--ticket.instance-id=$Port",
    "--ticket.seat-map.coordinator=$Coordinator"
)

if ($PlatformThreads) {
    $springArgs += '--spring.threads.virtual.enabled=false'
}

Write-Host "Starting port=$Port coordinator=$Coordinator heap=$Heap virtualThreads=$(-not $PlatformThreads)"
& java @jvmArgs @springArgs
