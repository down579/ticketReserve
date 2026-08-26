import {
  BarChart,
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

function avg(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function fmt(n: number, d = 1) {
  return n.toFixed(d);
}

const warmup = {
  name: "warmup",
  time: "22:27",
  vu: 50,
  duration: "10s",
  rps: 1183,
  p95: 93.5,
  max: 831,
  note: "워밍업",
};

const ttl2s = [
  {
    name: "TTL 2s #1",
    time: "22:28",
    vu: 200,
    duration: "60s",
    rps: 1438,
    p95: 337.7,
    max: 449,
    note: "상시 스탬피드 · Grafana에 봉우리 안 보임",
  },
  {
    name: "TTL 2s #2",
    time: "22:31",
    vu: 200,
    duration: "60s",
    rps: 1480,
    p95: 332.6,
    max: 844,
    note: "재현. p95·RPS 동일 구간",
  },
  {
    name: "TTL 2s 3m",
    time: "22:38",
    vu: 200,
    duration: "3m",
    rps: 1479,
    p95: 166.9,
    max: 1687,
    note: "RPS가 60s와 같음 → 앱 TTL 미반영으로 추정",
  },
];

const ttl30s = [
  {
    name: "TTL 30s A",
    time: "22:54",
    vu: 200,
    duration: "3m",
    rps: 7890,
    p95: 39.4,
    max: 987,
    note: "single-flight ON 직후 추정. 꼬리(max) 짧음",
  },
  {
    name: "TTL 30s B",
    time: "22:58",
    vu: 200,
    duration: "3m",
    rps: 7511,
    p95: 40.9,
    max: 3926,
    note: "설정 false 확인. 꼬리(max) 4초 근처",
  },
];

const ttl2sAvg = {
  rps: avg(ttl2s.slice(0, 2).map((r) => r.rps)),
  p95: avg(ttl2s.slice(0, 2).map((r) => r.p95)),
};

const ttl30sAvg = {
  rps: avg(ttl30s.map((r) => r.rps)),
  p95: avg(ttl30s.map((r) => r.p95)),
};

export default function CacheStampedeExperimentReport() {
  const theme = useHostTheme();

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1040 }}>
      <Stack gap={8}>
        <H1>캐시 스탬피드 · single-flight 실험 보고서</H1>
        <Text tone="secondary">
          2026-08-24 · GET /api/sales/1/seats · seats-stampede · Hikari pool=5 ·
          miss-delay=200ms · 로컬 Windows · Prometheus/Grafana
        </Text>
        <Row gap={8}>
          <Pill tone="warning">TTL 2s는 상시 스탬피드</Pill>
          <Pill tone="info">TTL 30s에서 파동이 보임</Pill>
          <Pill tone="success">SF는 p95 스파이크를 낮춤</Pill>
        </Row>
      </Stack>

      <Callout tone="info" title="핵심 결론">
        Redis TTL이 짧고 miss가 무거우면 캐시는 있어도 DB가 상시 맞는다. 관측 창을
        TTL보다 촘촘히 맞춘 뒤에야 스탬피드가 Grafana에 파동으로 찍혔다.
        single-flight는 3분 평균 RPS를 거의 바꾸지 않지만, 만료 순간의 p95·풀
        pending·max를 줄인다. 이 실험의 승부는 처리량이 아니라 꼬리 지연이다.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat
          label="TTL 2s RPS"
          value={`${fmt(ttl2sAvg.rps / 1000, 1)}k`}
          tone="warning"
        />
        <Stat
          label="TTL 30s RPS"
          value={`${fmt(ttl30sAvg.rps / 1000, 1)}k`}
          tone="success"
        />
        <Stat
          label="TTL 2s → 30s p95"
          value={`${fmt(ttl2sAvg.p95, 0)}→${fmt(ttl30sAvg.p95, 0)}ms`}
          tone="info"
        />
        <Stat
          label="TTL 30s max (A/B)"
          value={`${fmt(ttl30s[0].max / 1000, 1)}s / ${fmt(ttl30s[1].max / 1000, 1)}s`}
          tone="danger"
        />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 실험 설계</H2>
        <Table
          headers={["항목", "값"]}
          rows={[
            ["가설", "TTL 만료 때 miss가 몰리면 풀이 막히고, single-flight면 키당 DB 1건"],
            ["엔드포인트", "GET /api/sales/1/seats?seatGrade=R"],
            ["부하", "k6 seats-load-test · VU 200 · 60s 후 3m"],
            ["고정", "캐시 ON · Hikari 5 · miss-delay 200ms · 가상 스레드 ON"],
            ["1단계", "TTL 2s · Prometheus scrape 5s → 스탬피드 재현·관측 실패"],
            ["2단계", "TTL 30s · scrape 1s · Grafana rate 5s · refresh 1s"],
            ["3단계", "프로세스 내 single-flight (ConcurrentHashMap + CompletableFuture)"],
            ["관측", "k6 RPS/p95/max + Grafana 캐시 hit/miss/join · Hikari pending · HTTP p95"],
          ]}
        />
        <Text tone="secondary">
          miss 1건 ≈ 200ms. 풀 5개면 이론상 동시 miss 처리량 25 RPS.
          VU 200이 한꺼번에 miss면 대기열 ≈ 200 × 0.2s / 5 = 8초. TTL이 이보다
          짧으면 파동이 아니라 상시 스탬피드가 된다.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>2. 1단계 — TTL 2초, 스탬피드는 있는데 안 보인다</H2>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>HTTP RPS</CardHeader>
            <CardBody>
              <BarChart
                categories={["warmup", "TTL2s #1", "TTL2s #2", "TTL2s 3m"]}
                series={[
                  {
                    name: "RPS",
                    data: [warmup.rps, ttl2s[0].rps, ttl2s[1].rps, ttl2s[2].rps],
                    tone: "warning",
                  },
                ]}
                valueSuffix=""
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · seats-stampede · 2026-08-24 22:27–22:38 · req/s
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>HTTP p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["warmup", "TTL2s #1", "TTL2s #2", "TTL2s 3m"]}
                series={[
                  {
                    name: "p95 (ms)",
                    data: [
                      Math.round(warmup.p95),
                      Math.round(ttl2s[0].p95),
                      Math.round(ttl2s[1].p95),
                      Math.round(ttl2s[2].p95),
                    ],
                    tone: "danger",
                  },
                ]}
                valueSuffix=" ms"
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · http_req_duration p95 · ms
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["시각", "조건", "RPS", "p95", "max"]}
          columnAlign={["left", "left", "right", "right", "right"]}
          rows={[
            [warmup.time, "VU50 10s warmup", String(warmup.rps), `${fmt(warmup.p95, 0)}ms`, `${warmup.max}ms`],
            ...ttl2s.map((r) => [
              r.time,
              `${r.duration} VU${r.vu}`,
              String(r.rps),
              `${fmt(r.p95, 0)}ms`,
              `${r.max}ms`,
            ]),
          ]}
        />
        <Callout tone="warning" title="샘플링 에일리어싱 + 상시 스탬피드">
          TTL 2초 &lt; Prometheus 5초라 만료 스파이크가 스크래이프 사이에 묻힌다.
          miss 백로그(~8초)가 TTL보다 길어서 캐시가 채워지기도 전에 다음 만료가
          온다. Grafana에는 봉우리가 아니라 평평한 부하로 보인다. k6도 RPS가
          1.4~1.5k에 붙고 p95가 330ms대다. 캐시가 켜져 있어도 hit 구간이 거의 없다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>3. 2단계 — 관측을 맞추니 파동이 보인다</H2>
        <Table
          headers={["항목", "이전", "변경"]}
          rows={[
            ["Redis TTL", "2s", "30s"],
            ["Prometheus scrape / eval", "5s", "1s"],
            ["Grafana rate 창", "[15s]", "[5s]"],
            ["캐시 패널", "rate[15s]", "increase[2s]"],
            ["대시보드 refresh", "5s / 15m", "1s / 5m"],
          ]}
        />
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>TTL 변경 후 조회 RPS</CardHeader>
            <CardBody>
              <BarChart
                categories={["TTL 2s 평균", "TTL 30s A", "TTL 30s B"]}
                series={[
                  {
                    name: "RPS",
                    data: [
                      Math.round(ttl2sAvg.rps),
                      ttl30s[0].rps,
                      ttl30s[1].rps,
                    ],
                    tone: "success",
                  },
                ]}
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · VU200 · TTL 2s는 60s 2회 평균, TTL 30s는 3m
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>TTL 변경 후 HTTP p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["TTL 2s 평균", "TTL 30s A", "TTL 30s B"]}
                series={[
                  {
                    name: "p95 (ms)",
                    data: [
                      Math.round(ttl2sAvg.p95),
                      Math.round(ttl30s[0].p95),
                      Math.round(ttl30s[1].p95),
                    ],
                    tone: "info",
                  },
                ]}
                valueSuffix=" ms"
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · 3분 집계 p95. 히트 구간이 평균을 잡아먹음
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Callout tone="success" title="실측 관측 (Grafana)">
          TTL 30초 구간에서 만료 때마다 Hikari pending이 올라가고, 같은 타이밍에
          HTTP RPS가 살짝 떨어졌다. miss 파동 → 풀 5개 소진 → 대기 → 처리량 딥.
          스탬피드의 인과가 그래프에 겹쳐 보인다.
        </Callout>
        <Text>
          k6 평균 RPS는 1.5k → 7.7k (약 5.3배), 집계 p95는 335ms → 40ms.
          이제는 29초 hit + 수 초 miss라서 평균은 캐시가 이긴다. 스탬피드는 평균이
          아니라 만료 순간의 pending·p95 스파이크에 남아 있다.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>4. 3단계 — single-flight</H2>
        <Text>
          같은 좌석맵 키는 inflight 맵에 Future 하나. putIfAbsent로 1등만 DB(+200ms)를
          치고, 나머지는 join으로 그 결과를 받는다. 팔로워는 Redis를 다시 GET하지 않는다.
        </Text>
        <Grid columns={3} gap={12}>
          <Card>
            <CardHeader trailing={<Pill size="sm">hit</Pill>}>Redis 적중</CardHeader>
            <CardBody>
              <Text size="small">맵에 안 들어감. DB·풀 미사용.</Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Pill size="sm" tone="warning">miss</Pill>}>리더 1건</CardHeader>
            <CardBody>
              <Text size="small">delay 200ms + MySQL + Redis put + complete.</Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Pill size="sm" tone="info">join</Pill>}>팔로워</CardHeader>
            <CardBody>
              <Text size="small">리더 Future에서 대기. 커넥션을 안 잡음.</Text>
            </CardBody>
          </Card>
        </Grid>
        <H3>k6 3분 집계는 거의 같다</H3>
        <Table
          headers={["Run", "시각", "RPS", "p95", "max", "해석"]}
          columnAlign={["left", "left", "right", "right", "right", "left"]}
          rows={[
            [
              "TTL 30s A",
              ttl30s[0].time,
              String(ttl30s[0].rps),
              `${fmt(ttl30s[0].p95, 1)}ms`,
              `${ttl30s[0].max}ms`,
              ttl30s[0].note,
            ],
            [
              "TTL 30s B",
              ttl30s[1].time,
              String(ttl30s[1].rps),
              `${fmt(ttl30s[1].p95, 1)}ms`,
              `${ttl30s[1].max}ms`,
              ttl30s[1].note,
            ],
          ]}
        />
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>TTL 30s 꼬리 지연 max (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["22:54 A", "22:58 B"]}
                series={[
                  {
                    name: "max (ms)",
                    data: [ttl30s[0].max, ttl30s[1].max],
                    tone: "danger",
                  },
                ]}
                valueSuffix=" ms"
                height={200}
              />
              <Text size="small" tone="secondary">
                Source: k6 · http_req_duration max · 3m VU200
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>같은 구간의 3분 p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["22:54 A", "22:58 B"]}
                series={[
                  {
                    name: "p95 (ms)",
                    data: [Math.round(ttl30s[0].p95), Math.round(ttl30s[1].p95)],
                    tone: "neutral",
                  },
                ]}
                valueSuffix=" ms"
                beginAtZero={false}
                height={200}
              />
              <Text size="small" tone="secondary">
                Source: k6 · 3분 집계. 히트 비율이 높아 A/B가 묻힘
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Callout tone="warning" title="평균 RPS로 보면 ‘별 차이 없음’이 맞다">
          만료 파동은 3분 중 일부다. VU는 그 순간만 200ms(또는 풀 대기)로 느려졌다가
          다시 hit으로 돌아온다. 그래서 집계 RPS는 7890 vs 7511, p95는 39 vs 41ms로
          비슷하다. 차이는 Grafana 시계열 p95와 Hikari pending, 그리고 max(0.99s vs
          3.93s)에 남는다.
        </Callout>
        <Callout tone="success" title="Grafana 관측 (실험자 확인)">
          single-flight를 켠 쪽은 만료 구간 p95가 낮고, 끈 쪽은 p95가 높다.
          리더 1건만 풀을 쓰므로 pending 줄이 안 생기고, 꼬리가 miss-delay 근처에
          붙는다. 끈 쪽은 200명이 풀 5개에 줄 서서 p95가 올라간다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>5. 해석</H2>
        <Table
          headers={["관찰", "숫자 / 근거", "의미"]}
          rows={[
            [
              "TTL 2s RPS",
              `${fmt(ttl2sAvg.rps, 0)} (p95 ${fmt(ttl2sAvg.p95, 0)}ms)`,
              "캐시 ON이어도 hit 구간이 없음",
            ],
            [
              "TTL 30s RPS",
              `${fmt(ttl30sAvg.rps, 0)} (p95 ${fmt(ttl30sAvg.p95, 0)}ms)`,
              "대부분 hit. 평균은 캐시가 이김",
            ],
            [
              "Grafana pending + RPS 딥",
              "TTL 만료와 동시",
              "스탬피드 → 풀 소진 → 처리량 하락",
            ],
            [
              "SF ON/OFF 3분 p95",
              "39ms vs 41ms",
              "집계로는 안 보임. 시계열 p95를 봐야 함",
            ],
            [
              "SF 꼬리 max",
              `${ttl30s[0].max}ms vs ${ttl30s[1].max}ms`,
              "풀 대기열이 꼬리를 수 초로 늘림",
            ],
          ]}
        />
        <H3>왜 single-flight가 RPS를 안 올리나</H3>
        <Text>
          팔로워도 리더가 complete할 때까지 그 요청을 붙잡고 있다. 만료 순간 200 VU의
          응답 시간은 비슷하게 늘어나고, 그 VU는 그동안 다음 GET을 못 보낸다.
          막는 것은 중복 DB이지, 대기 자체는 아니다. 이득은 DB 폭주와 p95/p99다.
        </Text>
        <H3>이 구현의 범위</H3>
        <Text>
          inflight 맵은 JVM 메모리라 인스턴스 1대 기준이다. 앱을 N대 띄우면 리더가
          최대 N명이다. 클러스터 전체 1건이 필요하면 Redis SETNX 같은 분산 락이 다음
          단계다.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>6. run별 원본</H2>
        <Table
          headers={["파일", "시각", "VU", "시간", "RPS", "p95", "max"]}
          columnAlign={["left", "left", "right", "right", "right", "right", "right"]}
          rows={[
            ["warmup-vu50-10s-222711", warmup.time, "50", "10s", String(warmup.rps), `${fmt(warmup.p95, 0)}ms`, `${warmup.max}ms`],
            ["vu200-60s-222848", "22:28", "200", "60s", "1438", "338ms", "449ms"],
            ["vu200-60s-223116", "22:31", "200", "60s", "1480", "333ms", "844ms"],
            ["vu200-3m-223842", "22:38", "200", "3m", "1479", "167ms", "1687ms"],
            ["vu200-3m-225407", "22:54", "200", "3m", "7890", "39.4ms", "987ms"],
            ["vu200-3m-225810", "22:58", "200", "3m", "7511", "40.9ms", "3926ms"],
          ]}
        />
      </Stack>

      <Stack gap={12}>
        <H2>7. 한계</H2>
        <Table
          headers={["한계", "설명"]}
          rows={[
            ["로컬 단일 호스트", "앱·MySQL·Redis·k6·Prometheus 동일 머신. 절대 SLA 아님"],
            ["SF ON/OFF 태그 없음", "k6 EXP가 둘 다 seats-stampede. 22:54/22:58은 타임라인·설정으로 추정"],
            ["3분 집계 p95", "히트 비율이 높아 스탬피드 A/B가 묻힘. 근거는 Grafana 시계열"],
            ["miss-delay 200ms", "인위적 지연. 실제 좌석맵 쿼리가 이보다 짧으면 파동이 작다"],
            ["single-flight 프로세스 로컬", "다중 인스턴스 스탬피드는 검증하지 않음"],
            ["현재 yaml", "single-flight-enabled: false 로 남아 있음"],
          ]}
        />
      </Stack>

      <Divider />
      <Text size="small" tone="secondary" style={{ color: theme.tokens.text.secondary }}>
        데이터: k6/results/summary-seats-stampede-* · 20260824 · Grafana ticketreserve-overview · 작성 2026-08-24 KST
      </Text>
    </Stack>
  );
}
