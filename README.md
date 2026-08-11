# ticketReserve

티켓 예매 동시성·성능 실험용 Spring Boot API와 k6 부하 테스트 도구입니다.  
실제 예매 플로우(좌석 조회 → 세션 → 선점 → 장바구니 → 확정)를 MySQL 위에서 재현하고, VU·커넥션 풀·락 범위·좌석 재활용 등의 변수를 바꿔 성능을 비교합니다.

## 기술 스택

| 구분 | 내용 |
|------|------|
| Backend | Java 21, Spring Boot 4, MyBatis |
| DB | MySQL 8 (InnoDB), HikariCP |
| Load test | Grafana k6 |
| Reports | `docs/reports/*.canvas.tsx` |

## 예매 플로우

```
좌석맵 조회 → 예매 세션 생성 → 좌석 선점(HOLD) → 장바구니 → 예매 확정
                                         └─ (옵션) 즉시 취소로 좌석 재활용
```

선점 시 좌석에 `SELECT … FOR UPDATE` + version 기반 갱신을 사용해 동시 예매 충돌(409)을 처리합니다.  
조회 트랜잭션은 `READ_COMMITTED`, 쓰기 트랜잭션은 기본 isolation을 사용합니다.

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
│   └── results/                       # 실험 결과 JSON
└── docs/reports/                      # 실험 보고서(canvas)
```

## 사전 준비

1. **JDK 21**, **MySQL**, **[k6](https://grafana.com/docs/k6/latest/set-up/install-k6/)**
2. DB 생성 및 시드

```bash
mysql -u root -p < src/main/resources/db/schema.sql
mysql -u root -p < src/main/resources/db/seed.sql
# 필요 시 alter_*.sql 적용
```

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
| `BASE_URL` | `http://localhost:8080` | API 주소 |
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

| 보고서 | 초점 |
|--------|------|
| `docs/reports/vu-scale-experiment-report.canvas.tsx` | VU 증가 vs 예매 성공·p95·holdConflict |
| `docs/reports/recycle-pool-experiment-report.canvas.tsx` | 좌석 재활용 + Hikari pool 5 vs 20 |
| `docs/reports/lock-scope-experiment-report.canvas.tsx` | 락 범위 축소 전후 지연·처리량 |
| `docs/reports/daily-experiment-report.canvas.tsx` | 일별 실험 요약 |

측정 시 권장: 워밍업 run → 본측정 2회 이상 → `k6/results` JSON 비교.

## 실험 전 리셋

좌석·예매 상태를 되돌리려면:

- `POST /api/bookings/cancel-all`, 또는
- `seed.sql` 재실행

## 참고

- 이 저장소는 운영용 예매 서비스가 아니라 **동시성·DB·풀 성능 실험**이 목적입니다.
- 자격 증명·풀 크기 등은 로컬 실험용으로 `application.yaml`에 두었으므로, 공유 전 민감 정보는 분리하세요.
