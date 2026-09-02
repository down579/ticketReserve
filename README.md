# ticketReserve

티켓 예매 동시성·성능 실험용 Spring Boot API와 k6 부하 테스트 도구입니다.  
실제 예매 플로우(좌석 조회 → 세션 → 선점 → 장바구니 → 확정)를 MySQL 위에서 재현하고, VU·커넥션 풀·락 범위·좌석 재활용 등의 변수를 바꿔 성능을 비교합니다.

## 기술 스택

| 구분 | 내용 |
|------|------|
| Backend | Java 21, Spring Boot 4, MyBatis |
| DB | MySQL 8 (InnoDB), HikariCP |
| Cache | Redis 7 (좌석맵) |
| Metrics | Spring Actuator, Prometheus, Grafana |
| Load test | Grafana k6 |
| Reports | `docs/reports/*.canvas.tsx` |

## 예매 플로우

```
좌석맵 조회 → 예매 세션 생성 → 좌석 선점(HOLD) → 장바구니 → 예매 확정
                                         └─ (옵션) 즉시 취소로 좌석 재활용
```

선점 시 `ticket.seat-hold.lock-mode`로 락 전략을 고릅니다.  
`pessimistic`(기본): `SELECT … FOR UPDATE` + version CAS · `optimistic`: 일반 SELECT + version CAS.


## 주요 API

| Method | Path | 설명 |
|--------|------|------|
| `GET` | `/api/goods/{goodsId}/sales` | 회차 목록 |
| `GET` | `/api/sales/{salesId}/seats?seatGrade=` | 좌석맵 |
| `GET` | `/api/sales/{salesId}/prices` | 가격 |
| `POST` | `/api/sessions` | 예매 세션 생성 |
| `POST` | `/api/seats/hold` | 좌석 선점 |
| `POST` | `/api/carts` | 장바구니 생성 |
| `POST` | `/api/bookings` | 예매 확정 |
| `POST` | `/api/bookings/{bookingId}/cancel` | 예매 취소 |
| `POST` | `/api/bookings/cancel-all` | 전체 취소(실험 리셋용) |

## 프로젝트 구조

```
ticketReserve/
├── src/main/java/.../ticketreserve/   # 도메인(API)
│   ├── booking / cart / hold / seat / session / goods / price
├── src/main/resources/
│   ├── application.yaml
│   ├── db/                            # schema.sql, seed.sql, alter_*.sql
│   └── mapper/                        # MyBatis XML
├── k6/
│   ├── booking-load-test.js           # 부하 테스트 스크립트
│   ├── seats-load-test.js             # 좌석맵 조회 전용
│   └── results/                       # 실험 결과 JSON
├── scripts/
│   ├── run-cluster.ps1                # 3인스턴스 클러스터 기동
│   └── run-single.ps1                 # 단일 인스턴스 + coordinator
├── monitoring/
│   ├── prometheus.yml                 # Prometheus scrape (host:8080)
│   └── grafana/                       # 데이터소스·대시보드 프로비저닝
└── docs/reports/                      # 실험 보고서(canvas)
```

## 사전 준비

1. **JDK 21**, **MySQL**, **Redis**, **[k6](https://grafana.com/docs/k6/latest/set-up/install-k6/)**
2. DB 생성 및 시드

```bash
mysql -u root -p < src/main/resources/db/schema.sql
mysql -u root -p < src/main/resources/db/seed.sql
# 필요 시 alter_*.sql 적용
```

Redis (좌석맵 캐시, 기본 TTL 3초)와 모니터링:

```bash
docker compose up -d redis prometheus grafana
```

캐시를 끄려면 `ticket.seat-map.cache-enabled: false`.

3. `src/main/resources/application.yaml`의 datasource URL / username / password를 환경에 맞게 수정

기본 DB: `ticket_reserve`  
시드 회원: `memberId` 1, 2 / 상품·회차: `goodsId=1`, `salesId=1`

## 앱 실행

```bash
./gradlew bootRun
# Windows: gradlew.bat bootRun
```

기본 포트: `http://localhost:8080`

관련 설정 (`application.yaml`):

- Hikari `maximum-pool-size` / `minimum-idle` — 풀 크기 실험용
- `ticket.session.ttl-minutes` — 세션 TTL (기본 10분)
- `ticket.seat-hold.ttl-minutes` — 선점 TTL (기본 7분)
- `ticket.seat-hold.lock-mode` — `pessimistic` | `optimistic` (선점 락 전략)
- `ticket.seat-map.cache-enabled` / `ttl-seconds` — 좌석맵 Redis 캐시
- `ticket.seat-map.coordinator` — `none` | `local` | `redis` (캐시 miss DB 로드 조율)
- `ticket.instance-id` — Prometheus/Grafana 인스턴스 구분 (기본: server.port)

### Redis 분산 락 · 스탬피드 실험

캐시 TTL 만료 시 miss 조율 방식을 바꿔 비교합니다.

| coordinator | 의미 |
|-------------|------|
| `none` | 스탬피드 재현 (miss마다 DB) |
| `local` | JVM 내 single-flight (인스턴스당 리더 1명) |
| `redis` | Redis SET NX 분산 락 (클러스터 전체 리더 1명) |

권장: Hikari pool **5**, TTL **30s**, `miss-delay-ms: 200`, VU **200**, 3m, Grafana scrape **1s**.

**3인스턴스 클러스터** (분산 락 차이를 보려면 필수). `bootJar` 1회 후 `java -jar`로 3프로세스 기동 (Gradle 락 충돌 방지):

```powershell
.\scripts\run-cluster.ps1 -Coordinator none   # 또는 local / redis
docker compose restart prometheus grafana
```

이미 빌드된 jar가 있으면 `-SkipBuild`로 건너뛸 수 있습니다.

```powershell
$env:BASE_URLS="http://localhost:8080,http://localhost:8081,http://localhost:8082"
$env:VUS="200"; $env:DURATION="3m"; $env:EXP="dist-lock-local"
k6 run k6/seats-load-test.js
```

기동 로그: `seat-map coordinator=LOCAL|REDIS|NONE`.  
Grafana: 캐시 hit/miss/join, `ticket_seatmap_coordinator_total` (lock_acquired, lock_wait, lock_wait_hit), Hikari pending, p95.

**A/B 순서:** `none` (3인스턴스) → `local` (3인스턴스) → `redis` (3인스턴스).  
기대: local은 miss≈인스턴스 수, redis는 miss≈1, 만료 구간 p95·pending은 redis≈local(1대).

단일 인스턴스만 쓸 때:

```powershell
.\scripts\run-single.ps1 -Coordinator redis -Port 8080
```

### JVM · GC 실험

힙·GC pause·할당량을 Grafana와 gc.log로 관찰합니다. **인스턴스 1대** 권장.

| 옵션 | 기본 | 설명 |
|------|------|------|
| `-Heap` | `256m` | `-Xms` / `-Xmx` (작을수록 GC가 자주 보임) |
| `-GcLog` | off | `logs/gc-{port}.log`에 G1 GC 로그 |
| `-PlatformThreads` | off | 가상 스레드 끄기 (VT ON/OFF A/B) |

```powershell
# GC 로그 + 작은 힙으로 기동
.\scripts\run-single.ps1 -Heap 256m -GcLog -Port 8080

# 플랫폼 스레드 비교
.\scripts\run-single.ps1 -Heap 256m -GcLog -PlatformThreads -Port 8080
```

부하 예시 (학습 순서):

```powershell
# 1) 객체 할당 많음 — 좌석맵
$env:VUS="200"; $env:DURATION="3m"; $env:EXP="jvm-seats-vt-on"
k6 run k6/seats-load-test.js

# 2) VT OFF — application.yaml 또는 -PlatformThreads 후 동일 k6
$env:EXP="jvm-seats-vt-off"
k6 run k6/seats-load-test.js

# 3) sleep API — DB 없이 JVM/Tomcat만
$env:VUS="2000"; $env:DURATION="30s"; $env:EXP="jvm-threads-vt-on"
k6 run k6/threads-load-test.js
```

Grafana **ticketReserve 실험 모니터**에서 같이 볼 패널:

- **JVM heap** — used/max 톱니(Young GC), 급락(Mixed/Full)
- **GC pause count rate** — 초당 GC 횟수 (`action=end of minor GC` 등)
- **GC pause max** — STW 최대 시간 → HTTP p95 스파이크와 시간 맞춰 보기
- **GC heap allocate rate** — 할당 속도 + `live after GC`
- **GC pause time rate** — pause 초/초 (부하 대비 GC 비용)

gc.log에서 `Pause Young` / `Pause Mixed` 줄을 k6 시작 시각과 맞추면 “이론 → 눈” 연결에 좋습니다.

Prometheus에 `jvm_gc_*`가 없으면 앱 기동 후 `http://localhost:8080/actuator/prometheus`에서 `jvm_gc` 검색으로 확인하세요.

### 낙관적 vs 비관적 락 실험

가설: **성공 건수는 비슷**하고, 낙관적은 **p95·waiting이 낮으며**, 비관적은 lock wait로 꼬리 지연이 길다.

권장 통제: Hikari pool **20** (풀 5면 커넥션 대기가 락 대기를 가림), `CANCEL_AFTER_BOOK=true`, VU 50·200, 30s, 각 모드 2회.

```yaml
# application.yaml
spring.datasource.hikari.maximum-pool-size: 20
spring.datasource.hikari.minimum-idle: 20
ticket.seat-hold.lock-mode: pessimistic   # 또는 optimistic
```

앱 재시작 후 로그에 `seat-hold lock-mode=PESSIMISTIC|OPTIMISTIC`이 보여야 합니다.

```powershell
# 비관적
# (yaml에서 lock-mode: pessimistic 후 앱 재시작)
$env:VUS="50"; $env:DURATION="30s"; $env:EXP="lock-pessimistic"; $env:CANCEL_AFTER_BOOK="true"
k6 run k6/booking-load-test.js

# 낙관적
# (yaml에서 lock-mode: optimistic 후 앱 재시작)
$env:VUS="50"; $env:DURATION="30s"; $env:EXP="lock-optimistic"; $env:CANCEL_AFTER_BOOK="true"
k6 run k6/booking-load-test.js
```

비교 지표: `booking_success`, `hold_success`, `hold_conflict`, HTTP p95, waiting p95, RPS.  
성공 건수가 거의 같고 p95만 갈리면 가설이 맞습니다.

## 모니터링 (Prometheus / Grafana)

앱이 `http://localhost:8080`에서 떠 있는 상태에서:

```powershell
docker compose up -d prometheus grafana
```

| 주소 | 설명 |
|------|------|
| http://localhost:8080/actuator/prometheus | 앱 메트릭 (scrape 대상) |
| http://localhost:9090 | Prometheus |
| http://localhost:3000 | Grafana (admin / admin) |

Grafana 폴더 `ticketReserve` → 대시보드 **ticketReserve 실험 모니터**.  
k6 돌리는 동안 HTTP RPS·p95, 409, Hikari 풀, 톰캣 스레드, 좌석맵 캐시 hit/miss, **JVM heap·GC pause**를 같이 보면 됩니다.

Prometheus는 Docker에서 호스트 앱을 `host.docker.internal:8080`으로 긁습니다. Status → Targets가 UP이어야 합니다.

## k6 부하 테스트

**프로젝트 루트**에서 실행합니다. 결과는 `k6/results/summary-{EXP}-vu{VUS}-{DURATION}-{timestamp}.json`에 저장됩니다.

### 기본 실행

```bash
k6 run k6/booking-load-test.js
```

### PowerShell 예시

```powershell
$env:VUS="50"
$env:DURATION="30s"
$env:EXP="vu50"
$env:CANCEL_AFTER_BOOK="true"
k6 run k6/booking-load-test.js
```

### 환경 변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `BASE_URL` | `http://localhost:8080` | API 주소 (단일) |
| `BASE_URLS` | `BASE_URL`과 동일 | 콤마 구분 다중 인스턴스 (VU 라운드로빈) |
| `VUS` | `100` | 동시 Virtual User |
| `DURATION` | `1m` | 테스트 시간 |
| `GOODS_ID` / `SALES_ID` | `1` / `1` | 상품·회차 |
| `SEAT_GRADE` | `R` | 좌석 등급 |
| `EXP` | `default` | 결과 파일용 실험명 |
| `CANCEL_AFTER_BOOK` | `false` | `true`면 예매 후 즉시 취소(좌석 재활용) |

### 시나리오 모드

- **예매만** (`CANCEL_AFTER_BOOK=false`): 좌석 고갈형. 성공 건수 ≈ 가용 좌석 상한
- **예매→취소** (`CANCEL_AFTER_BOOK=true`): 좌석 재활용. 장시간 RPS·경합 관찰에 적합

## 실험 테마 (기존 보고서)

**입구:** [`docs/reports/experiment-summary.canvas.tsx`](docs/reports/experiment-summary.canvas.tsx) — 전체 기간 종합 정리

| 보고서 | 초점 |
|--------|------|
| `docs/reports/experiment-summary.canvas.tsx` | **종합** · 병목 스토리라인 · 실무 시사점 |
| `docs/reports/vu-scale-experiment-report.canvas.tsx` | VU 증가 vs 예매 성공·p95·holdConflict |
| `docs/reports/recycle-pool-experiment-report.canvas.tsx` | 좌석 재활용 + Hikari pool 5 vs 20 |
| `docs/reports/lock-scope-experiment-report.canvas.tsx` | 락 범위 축소 전후 지연·처리량 |
| `docs/reports/hold-lock-mode-experiment-report.canvas.tsx` | 선점 낙관적 vs 비관적 락 |
| `docs/reports/virtual-threads-experiment-report.canvas.tsx` | sleep API · 가상 스레드 RPS |
| `docs/reports/vt-db-api-experiment-report.canvas.tsx` | VT × 예매/좌석조회(DB) |
| `docs/reports/redis-seatmap-experiment-report.canvas.tsx` | Redis 좌석맵 캐시 |
| `docs/reports/cache-stampede-experiment-report.canvas.tsx` | 캐시 스탬피드 · single-flight |
| `docs/reports/redis-distributed-lock-experiment-report.canvas.tsx` | Redis 분산 락 · 3노드 PoC |
| `docs/reports/jvm-gc-experiment-report.canvas.tsx` | JVM · GC · 힙 256m vs 512m · VT A/B |
| `docs/reports/daily-experiment-report.canvas.tsx` | 7월 초반 일별 요약 |

측정 시 권장: 워밍업 run → 본측정 2회 이상 → `k6/results` JSON 비교.

## 실험 전 리셋

좌석·예매 상태를 되돌리려면:

- `POST /api/bookings/cancel-all`, 또는
- `seed.sql` 재실행

## 참고

- 이 저장소는 운영용 예매 서비스가 아니라 **동시성·DB·풀 성능 실험**이 목적입니다.
- 자격 증명·풀 크기 등은 로컬 실험용으로 `application.yaml`에 두었으므로, 공유 전 민감 정보는 분리하세요.
