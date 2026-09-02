import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  useHostTheme,
} from "cursor/canvas";

const experiments = [
  {
    when: "07-22",
    topic: "락 범위",
    file: "lock-scope-experiment-report.canvas.tsx",
    oneLiner: "확정 경로 FOR UPDATE 복구 시 p95 +16%, RPS −12%. 성공 건수는 동일.",
    metric: "p95 171→199ms",
  },
  {
    when: "07-22~28",
    topic: "초기 종합 / 풀",
    file: "daily-experiment-report.canvas.tsx",
    oneLiner: "성공 ≤ 가용 좌석, 더블부킹 없음. 풀·워밍업이 절대치에 영향.",
    metric: "성공 상한 8건",
  },
  {
    when: "07-30",
    topic: "풀 + 재활용",
    file: "recycle-pool-experiment-report.canvas.tsx",
    oneLiner: "풀 크기보다 워밍업 후 안정 구간이 더 중요. pool-20 핫런이 당일 최고.",
    metric: "최고 328건 / RPS 559",
  },
  {
    when: "08-05",
    topic: "VU 스케일",
    file: "vu-scale-experiment-report.canvas.tsx",
    oneLiner: "VU↑ → RPS 소폭↑, 예매 성공↓, holdConflict↑, p95↑. 사람≠예매.",
    metric: "VU10 706건 → VU50 311건",
  },
  {
    when: "08-12",
    topic: "가상 스레드 (sleep)",
    file: "virtual-threads-experiment-report.canvas.tsx",
    oneLiner: "블로킹 sleep에서 VT RPS ~2.8배. VU10000 실패는 max-connections.",
    metric: "RPS 12.5k → 35k",
  },
  {
    when: "08-18",
    topic: "VT × DB API",
    file: "vt-db-api-experiment-report.canvas.tsx",
    oneLiner: "예매·좌석조회에서 VT 이득 없음. 병목은 Hikari·MySQL·행 락.",
    metric: "풀5 seats ~1.5k RPS 천장",
  },
  {
    when: "08-21",
    topic: "Redis 좌석맵",
    file: "redis-seatmap-experiment-report.canvas.tsx",
    oneLiner: "조회 RPS ~1.4배·p95↓. 예매 성공은 캐시로 안 늘어남.",
    metric: "조회 VU200 2.9k→4.0k",
  },
  {
    when: "08-24",
    topic: "Cache stampede",
    file: "cache-stampede-experiment-report.canvas.tsx",
    oneLiner: "TTL 만료 때 miss 폭주·pending·RPS 딥. single-flight는 꼬리 지연(p95) 방어.",
    metric: "평균 RPS≈ / 만료 p95↓",
  },
  {
    when: "08-26",
    topic: "선점 낙관/비관",
    file: "hold-lock-mode-experiment-report.canvas.tsx",
    oneLiner: "e2e p95 유사. 취소 재활용 VU50에선 비관 성공 ~17% 더 많음.",
    metric: "성공 714 vs 591",
  },
  {
    when: "08-31",
    topic: "Redis 분산 락",
    file: "redis-distributed-lock-experiment-report.canvas.tsx",
    oneLiner: "3노드 + coordinator=redis PoC. 유효 run p95 ~27ms, RPS ~11.7k. none/local A/B 없음.",
    metric: "3대 · p95 ~27ms",
  },
  {
    when: "09-02",
    topic: "JVM · GC",
    file: "jvm-gc-experiment-report.canvas.tsx",
    oneLiner: "힙 512m에서 GC count peak 절반(4.7→2.25/s), p95 소폭↓. VT ON/OFF 차이 없음.",
    metric: "256m p95 26ms → 512m 23ms",
  },
];

export default function ExperimentSummaryReport() {
  const theme = useHostTheme();

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1080 }}>
      <Stack gap={8}>
        <H1>ticketReserve 실험 종합 정리</H1>
        <Text tone="secondary">
          2026-07-22 ~ 08-31 · 개별 보고서 취합 · 로컬 Windows/k6 · 상대 비교 목적(절대 SLA 아님)
        </Text>
        <Row gap={8} wrap>
          <Pill tone="info">11개 주제</Pill>
          <Pill tone="success">정합성: 더블부킹 없음</Pill>
          <Pill tone="warning">병목은 스레드 → DB/락 → 캐시로 이동</Pill>
        </Row>
      </Stack>

      <Callout tone="info" title="한 줄 스토리">
        동시 접속을 늘려도 예매 성공은 좌석·행 락 한도에 막힌다. 가상 스레드는
        DB 없는 블로킹 I/O에서만 크게 이기고, DB·풀·FOR UPDATE가 천장이면 무력하다.
        조회는 Redis가 이기고, TTL 만료 스탬피드는 single-flight로 꼬리 지연을 줄인다.
        선점 락은 “낙관=항상 빠르다”가 아니라, 취소 재활용 경합에서는 비관이 성공에
        유리할 수 있다.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat label="실험 기간" value="7/22–8/26" tone="info" />
        <Stat label="주제 수" value="11" tone="info" />
        <Stat label="VT sleep 배율" value="~2.8×" tone="success" />
        <Stat label="조회 Redis 배율" value="~1.4×" tone="success" />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 병목 스토리라인</H2>
        <Table
          headers={["단계", "질문", "답", "대표 실험"]}
          rows={[
            [
              "1. 동시성",
              "사람만 늘리면 예매가 늘까?",
              "아니요. RPS↑·성공↓·conflict↑",
              "VU 스케일",
            ],
            [
              "2. 락·풀",
              "락/풀을 바꾸면?",
              "지연·워밍업에 영향. 성공 상한은 좌석",
              "락 범위 · 풀/재활용",
            ],
            [
              "3. 스레드",
              "VT로 처리량이 늘까?",
              "sleep API는 ~2.8배. DB API는 거의 없음",
              "VT sleep · VT×DB",
            ],
            [
              "4. 캐시",
              "읽기 캐시가 예매를 구하나?",
              "조회만 구함. 선점 성공은 DB",
              "Redis 좌석맵",
            ],
            [
              "5. 스탬피드",
              "TTL 만료 때 무엇이 터지나?",
              "miss 폭주 → 풀 pending → p95↑. single-flight로 완화",
              "Cache stampede",
            ],
            [
              "6. 선점 락",
              "낙관이 항상 유리한가?",
              "e2e p95는 비슷. 재활용 경합에선 비관 성공↑",
              "Hold lock-mode",
            ],
          ]}
        />
        <Text tone="secondary">
          흐름: 스레드 한도 → VT로 돌파(sleep) → DB/풀/락에서 VT 무력 → 조회는 Redis →
          스탬피드 방어(single-flight) → 선점 락은 시나리오 의존.
        </Text>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>2. 실험별 한 줄 결론</H2>
        <Table
          headers={["날짜", "주제", "핵심 지표", "한 줄"]}
          rows={experiments.map((e) => [e.when, e.topic, e.metric, e.oneLiner])}
        />
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>3. 숫자로 보는 대비</H2>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>가상 스레드가 이긴 곳 / 진 곳</CardHeader>
            <CardBody>
              <Table
                headers={["조건", "결과"]}
                rows={[
                  ["sleep(10) API", "RPS ~2.8×, p95 대폭↓"],
                  ["예매 플로우", "성공·RPS 이득 없음(또는 하락)"],
                  ["좌석 조회 + 풀5", "RPS ~1.5k 천장, VT 무력"],
                  ["좌석 조회 + 풀250", "소폭 변화, VU500에서 VT 더 느릴 수 있음"],
                ]}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>캐시가 바꾼 것 / 못 바꾼 것</CardHeader>
            <CardBody>
              <Table
                headers={["조건", "결과"]}
                rows={[
                  ["좌석맵 조회", "RPS ~1.4×, p95↓"],
                  ["예매 성공 건수", "거의 안 늘음 (OFF가 더 많을 수도)"],
                  ["TTL 만료 스탬피드", "pending·RPS 딥·p95↑"],
                  ["single-flight ON", "평균 RPS≈, 만료 구간 p95·pending↓"],
                ]}
              />
            </CardBody>
          </Card>
        </Grid>
        <Card>
          <CardHeader>락 전략 요약</CardHeader>
          <CardBody>
            <Table
              headers={["실험", "비교", "지연", "성공"]}
              rows={[
                ["락 범위(확정)", "FOR UPDATE on/off", "on이 p95 +16%", "동일"],
                ["선점 lock-mode", "pessimistic vs optimistic", "e2e p95 유사", "재활용 VU50: 비관 우위"],
              ]}
            />
            <Text tone="secondary" style={{ marginTop: 8 }}>
              정합성(더블부킹 방지)은 version CAS·UNIQUE·상태 전이로 유지. 차이는 대기 vs 즉시 실패.
            </Text>
          </CardBody>
        </Card>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>4. 실무 시사점</H2>
        <Grid columns={2} gap={12}>
          <Card>
            <CardHeader>용량·동시성</CardHeader>
            <CardBody>
              <Text>
                VU(동시 접속)와 예매 성공은 비례하지 않는다. 티켓팅 용량은
                “동시 HTTP”가 아니라 좌석 수·행 락·커넥션 풀·취소/홀드 TTL로 설계한다.
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>가상 스레드</CardHeader>
            <CardBody>
              <Text>
                BFF·외부 API 대기·순수 I/O에는 켜 두는 편이 이득. DB 풀이 작고
                핫로우 FOR UPDATE가 천장인 예매 핵심 경로에는 기대를 낮춘다.
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>캐시</CardHeader>
            <CardBody>
              <Text>
                읽기(좌석맵)는 Redis. 쓰기(선점)는 DB. TTL이 짧고 miss가 무거우면
                single-flight(또는 분산 락)로 스탬피드를 막는다. 평균 RPS만 보면 놓친다.
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>낙관 vs 비관</CardHeader>
            <CardBody>
              <Text>
                경합이 낮고 실패 후 재시도가 싸면 낙관. 짧은 점유·취소 재활용으로
                같은 행을 이어받을 가치가 있으면 비관 직렬화가 성공 처리량에 유리할 수 있다.
                지표는 p95만이 아니라 성공·conflict를 같이 본다.
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Callout tone="success" title="측정 교훈">
          가설이 깨진 실험(VT×DB, 낙관=빠르다)도 보고서 가치가 있다.
          end-to-end 평균에 묻히는 현상은 단계별 latency·시계열(Grafana)·꼬리 지연으로 봐야 한다.
        </Callout>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>5. 개별 보고서 인덱스</H2>
        <Text tone="secondary">
          세부 수치·차트는 아래 파일에 있습니다. Cursor에서 각 `.canvas.tsx`를 열면 됩니다.
        </Text>
        <Table
          headers={["파일", "주제"]}
          rows={experiments.map((e) => [`docs/reports/${e.file}`, e.topic])}
        />
        <H3>관련 산출물</H3>
        <Table
          headers={["경로", "용도"]}
          rows={[
            ["k6/*.js · k6/results/", "부하 스크립트 · 원본 JSON"],
            ["monitoring/", "Prometheus / Grafana"],
            ["README.md", "실행 방법 · 설정 스위치"],
          ]}
        />
      </Stack>

      <Divider />

      <Stack gap={8}>
        <H2>6. 아직 남은 실험 (후보)</H2>
        <Table
          headers={["후보", "왜"]}
          rows={[
            ["hold 단계 단독 p95", "락 전략 차이를 e2e에서 분리"],
            ["CANCEL_AFTER_BOOK=false 고갈형", "낙관/비관 성공 상한 동일성 확인"],
            ["분산 single-flight (Redis 락)", "앱 다중화 시 스탬피드"],
            ["낙관적 락 + 풀 확대 × VT", "핫로우 완화 후 VT 이득 재검증"],
          ]}
        />
        <Text tone="secondary" style={{ color: theme.textSecondary }}>
          초반 7월 요약은 daily-experiment-report에, 이 문서는 전체 기간 포트폴리오 요약이다.
        </Text>
      </Stack>
    </Stack>
  );
}
