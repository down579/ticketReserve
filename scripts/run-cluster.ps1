# 3인스턴스 클러스터 기동 (Redis 분산 락 실험용)
# bootRun x3 대신 bootJar 1회 후 java -jar x3 (Gradle 락 충돌 방지)
#
# 사용: .\scripts\run-cluster.ps1 -Coordinator none
#       .\scripts\run-cluster.ps1 -Coordinator local
#       .\scripts\run-cluster.ps1 -Coordinator redis

param(
    [ValidateSet('none', 'local', 'redis')]
    [string]$Coordinator = 'local',
    [int[]]$Ports = @(8080, 8081, 8082),
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Jar = Join-Path $Root 'build\libs\ticketReserve-0.0.1-SNAPSHOT.jar'

Set-Location $Root

if (-not $SkipBuild) {
    Write-Host 'Building bootJar (once)...'
    & "$Root\gradlew.bat" bootJar -q
    if ($LASTEXITCODE -ne 0) {
        throw 'Gradle bootJar failed. Fix compile errors and retry.'
    }
}

if (-not (Test-Path $Jar)) {
    throw "Jar not found: $Jar"
}

foreach ($Port in $Ports) {
    $springArgs = @(
        "-jar", $Jar,
        "--server.port=$Port",
        "--ticket.instance-id=$Port",
        "--ticket.seat-map.coordinator=$Coordinator"
    )
    Write-Host "Starting instance port=$Port coordinator=$Coordinator"
    Start-Process -FilePath 'java' -ArgumentList $springArgs -WorkingDirectory $Root -WindowStyle Normal
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Cluster started on ports: $($Ports -join ', ')"
Write-Host "Coordinator: $Coordinator"
Write-Host "Health: http://localhost:$($Ports[0])/actuator/health"
Write-Host ""
Write-Host "k6 example:"
Write-Host '  $env:BASE_URLS="http://localhost:8080,http://localhost:8081,http://localhost:8082"'
Write-Host ('  $env:VUS="200"; $env:DURATION="3m"; $env:EXP="dist-lock-{0}"' -f $Coordinator)
Write-Host '  k6 run k6/seats-load-test.js'
