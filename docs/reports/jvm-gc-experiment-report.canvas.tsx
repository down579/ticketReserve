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

function fmtMs(n: number, d = 1) {
  return fmt(n, d) + "ms";
}

function fmtK(n: number, d = 1) {
  return fmt(n / 1000, d) + "k";
}

/** k6 유효 run — successRate=1 만 포함 */
const runs256VtOn = [
  { label: "VT ON · 8/31", rps: 12573, p95: 26.2, med: 12.7, avg: 15.1 },
];

const runs256VtOff = [
  { label: "VT OFF #1", rps: 12848, p95: 24.2, med: 13.8, avg: 14.9 },
  { label: "VT OFF #2", rps: 12594, p95: 27.9, med: 13.7, avg: 15.2 },
];

const runs512VtOn = [
  { label: "VT ON #1", rps: 12822, p95: 23.5, med: 13.3, avg: 14.9 },
  { label: "VT ON #2 warm", rps: 17207, p95: 20.0, med: 9.5, avg: 11.2 },
];

const runs512VtOff = [
  { label: "VT OFF #1 warm", rps: 17664, p95: 19.2, med: 9.3, avg: 10.9 },
  { label: "VT OFF #2", rps: 13147, p95: 23.2, med: 13.2, avg: 14.5 },
];

const failedRuns = [
  { label: "VT OFF 9/2 early", note: "앱 미준비 · success 0 · 분석 제외" },
  { label: "VT OFF 9/2 #2", note: "success 0 · 분석 제외" },
  { label: "VT OFF 9/2 #3", note: "success 0 · 분석 제외" },
];

/** Grafana peak — 사용자 관측 */
const gcObs = {
  heap256PauseCountPeak: 4.7,
  heap512PauseCountPeak: 2.25,
  pauseMaxNote: "256m·512m 모두 ~30ms 전후 · 큰 차이 없음 (Grafana peak, 미기록)",
};

const avg256Off = {
  rps: avg(runs256VtOff.map((r) => r.rps)),
  p95: avg(runs256VtOff.map((r) => r.p95)),
};

const heapCompare = [
  {
    heap: "256m",
    vt: "ON",
    rps: runs256VtOn[0].rps,
    p95: runs256VtOn[0].p95,
    med: runs256VtOn[0].med,
    gcPeak: gcObs.heap256PauseCountPeak,
  },
  {
    heap: "256m",
    vt: "OFF (avg)",
    rps: avg256Off.rps,
    p95: avg256Off.p95,
    med: avg(runs256VtOff.map((r) => r.med)),
    gcPeak: gcObs.heap256PauseCountPeak,
  },
  {
    heap: "512m",
    vt: "ON #1",
    rps: runs512VtOn[0].rps,
    p95: runs512VtOn[0].p95,
    med: runs512VtOn[0].med,
    gcPeak: gcObs.heap512PauseCountPeak,
  },
  {
    heap: "512m",
    vt: "OFF #2",
    rps: runs512VtOff[1].rps,
    p95: runs512VtOff[1].p95,
    med: runs512VtOff[1].med,
    gcPeak: gcObs.heap512PauseCountPeak,
  },
];

export default function JvmGcExperimentReport() {
  const theme = useHostTheme();

  const heapChartData = [
    { name: "256m", p95: runs256VtOn[0].p95, gcRate: gcObs.heap256PauseCountPeak },
    { name: "512m", p95: runs512VtOn[0].p95, gcRate: gcObs.heap512PauseCountPeak },
  ];

  const vtChartData = [
    { name: "256m VT ON", p95: runs256VtOn[0].p95 },
    { name: "256m VT OFF", p95: avg256Off.p95 },
    { name: "512m VT ON", p95: runs512VtOn[0].p95 },
    { name: "512m VT OFF", p95: runs512VtOff[1].p95 },
  ];

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1040 }}>
      <Stack gap={8}>
        <H1>JVM · GC 실험 보고서</H1>
        <Text tone="secondary">
          2026-08-31 ~ 09-02 · G1GC · run-single.ps1 · 좌석맵 GET · VU200 · 3m ·
          1인스턴스 · Redis 캐시 hit · Grafana GC 패널 + k6
        </Text>
        <Row gap={8}>
          <Pill tone="info">힙 256m vs 512m</Pill>
          <Pill tone="success">GC count 4.7 → 2.25/s</Pill>
          <Pill tone="warning">VT ON/OFF 차이 없음</Pill>
        </Row>
      </Stack>

      <Callout tone="info" title="핵심 결론">
        힙을 256m에서 512m으로 키우면 Young GC 빈도가 약 절반(peak count rate 4.7 →
        2.25/s)으로 줄고, HTTP p95도 소폭 개선(26ms → 23ms대)되었다. pause max는
        힙 크기와 무관하게 ~30ms 전후로 비슷했다. 좌석맵 조회(VU200)에서는 가상
        스레드와 플랫폼 스레드의 RPS·p95 차이가 없어, 병목은 스레드 모델이 아니라
        할당·GC·캐시 쪽에 있다(8/18 VT×DB 실험과 일치).
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat label="256m p95 (VT ON)" value={fmtMs(26.2, 0)} tone="info" />
        <Stat label="512m p95 (VT ON #1)" value={fmtMs(23.5, 0)} tone="success" />
        <Stat label="GC count peak ↓" value="~52%" tone="success" />
        <Stat label="VT A/B" value="≈ 동일" tone="info" />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 실험 설계</H2>
        <Table
          headers={["항목", "값"]}
          rows={[
            ["목적", "힙·GC가 tail latency에 미치는 영향 관측 + VT ON/OFF 통제"],
            ["워크로드", "GET /api/sales/1/seats?seatGrade=R — Redis hit · 객체 할당 많음"],
            ["JVM", "G1GC · -Xms=-Xmx · run-single.ps1 -Heap -GcLog"],
            ["힙 A/B", "256m vs 512m"],
            ["스레드 A/B", "VT ON (기본) vs -PlatformThreads"],
            ["부하", "k6 seats-load-test · VU 200 · 3m"],
            ["관측", "Grafana: pause count rate, max, time rate, allocate rate"],
            ["제외 run", "앱 미준비 3건 (success 0)"],
          ]}
        />
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>2. GC 관측 (Grafana peak)</H2>
        <Table
          headers={["힙", "pause count rate peak", "대략 GC 간격", "pause max"]}
          rows={[
            [
              "256m",
              "4.7 /s",
              "~210ms",
              "~30ms (8/31 관측, 9/2 유사)",
            ],
            [
              "512m",
              "2.25 /s",
              "~440ms",
              "~30ms (큰 차이 없음)",
            ],
          ]}
        />
        <Text tone="secondary">
          count rate 비율 4.7 ÷ 2.25 ≈ 2.1 — 힙 2배에 GC 빈도 약 절반. pause max는
          힙을 키워도 비슷해, 꼬리 지연 개선은 “빈도 감소” 쪽 기여가 더 크다.
        </Text>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>3. k6 HTTP 지표</H2>
        <H3>힙 비교 (VT ON, 재기동 직후 유사 run)</H3>
        <Table
          headers={["힙", "VT", "RPS", "med", "p95", "GC peak /s"]}
          rows={heapCompare.map((r) => [
            r.heap,
            r.vt,
            fmtK(r.rps, 1),
            fmtMs(r.med, 1),
            fmtMs(r.p95, 1),
            String(r.gcPeak),
          ])}
        />
        <Text tone="secondary" style={{ color: theme.textSecondary }}>
          Source: k6/results/summary-jvm-*.json · 9/2 · VU200 · 3m
        </Text>

        <H3>VT ON vs OFF (256m, 유효 run 평균)</H3>
        <Table
          headers={["구성", "RPS", "p95"]}
          rows={[
            ["256m VT ON", fmtK(12573, 1), fmtMs(26.2, 1)],
            ["256m VT OFF (2회 avg)", fmtK(avg256Off.rps, 1), fmtMs(avg256Off.p95, 1)],
          ]}
        />

        <H3>512m — 캐시 워밍 후 run (참고)</H3>
        <Table
          headers={["run", "RPS", "p95", "비고"]}
          rows={[
            ["VT ON #2 warm", fmtK(17207, 1), fmtMs(20.0, 1), "캐시·JVM 워밍 후"],
            ["VT OFF #1 warm", fmtK(17664, 1), fmtMs(19.2, 1), "VT와 무관하게 RPS↑"],
          ]}
        />
        <Text tone="secondary">
          512m에서 RPS 12.8k vs 17k 차이는 VT보다 캐시 워밍·재기동 타이밍 영향.
          힙·VT 비교는 재기동 직후 #1 run 쌍을 기준으로 한다.
        </Text>
      </Stack>

      <Divider />

      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader>힙 vs p95 · GC count</CardHeader>
          <CardBody>
            <BarChart
              data={heapChartData}
              xKey="name"
              series={[
                { key: "p95", label: "HTTP p95 (ms)", color: theme.accent },
                { key: "gcRate", label: "GC count peak (/s)", color: theme.textSecondary },
              ]}
              height={220}
            />
            <Text tone="secondary" style={{ marginTop: 8, fontSize: 12 }}>
              Source: k6 + Grafana · 256m VT ON vs 512m VT ON #1
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>VT ON/OFF p95 (재기동 직후 run)</CardHeader>
          <CardBody>
            <BarChart
              data={vtChartData}
              xKey="name"
              series={[{ key: "p95", label: "HTTP p95 (ms)", color: theme.accent }]}
              height={220}
            />
            <Text tone="secondary" style={{ marginTop: 8, fontSize: 12 }}>
              Source: k6/results · 차이 ~2ms 이내 — 측정 노이즈 수준
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>4. 해석</H2>
        <Grid columns={2} gap={12}>
          <Card>
            <CardHeader>힙 튜닝</CardHeader>
            <CardBody>
              <Text>
                GC STW는 tail latency에 기여한다. 힙을 키우면 Young GC 빈도가 줄고 p95가
                소폭 내려간다. 다만 pause max는 ~30ms로 비슷해, “한 번의 긴 pause”보다
                “잦은 짧은 pause 누적”이 256m에서 더 두드러진다.
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>VT × 좌석맵</CardHeader>
            <CardBody>
              <Text>
                Redis hit + 짧은 CPU 작업은 200 VU에서 플랫폼 스레드 풀 병목이 되지
                않는다. VT 이득은 threads-load-test(sleep)나 DB·풀 병목 예매 API에서
                관측된 바와 같다.
              </Text>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>5. 제외 run · 한계</H2>
        <Table
          headers={["run", "사유"]}
          rows={failedRuns.map((r) => [r.label, r.note])}
        />
        <Callout tone="warning" title="한계">
          pause max·time rate는 Grafana에서 정성적으로만 확인(수치 미기록). Mixed GC
          비율·allocate rate peak는 보고서에 미포함. 힙 1g·할당 최적화는 후속 후보.
        </Callout>
      </Stack>

      <Divider />

      <Stack gap={8}>
        <H2>6. 실무 시사점</H2>
        <Table
          headers={["교훈", "적용"]}
          rows={[
            ["GC는 성능 요소", "p99·p95 튜닝 시 heap·allocate rate 같이 본다"],
            ["힙은 trade-off", "빈도↓ vs RSS↑ · 목표 latency에 맞는 최소 힙"],
            ["VT는 만능 아님", "I/O·풀·락 병목이면 VT 전환만으로는 개선 없음"],
            ["꼬리만 움직임", "avg/med 유사 · p95·GC 지표로 tail 분석"],
          ]}
        />
      </Stack>
    </Stack>
  );
}
