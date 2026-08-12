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

function pct(n: number) {
  return `${fmt(n * 100, 1)}%`;
}

/** 1단계: 플랫폼 스레드 스케일 (단발) */
const scale = [
  {
    vu: 50,
    rps: 3058.8,
    p95: 25.2,
    waitingP95: 24.9,
    success: 91808,
    failed: 0,
    successRate: 1,
  },
  {
    vu: 2000,
    rps: 12423.0,
    p95: 196.4,
    waitingP95: 194.4,
    success: 372579,
    failed: 2117,
    successRate: 0.9944,
  },
  {
    vu: 3000,
    rps: 12581.5,
    p95: 283.4,
    waitingP95: 283.3,
    success: 377317,
    failed: 3118,
    successRate: 0.9918,
  },
  {
    vu: 10000,
    rps: 7830.0,
    p95: 669.7,
    waitingP95: 669.6,
    success: 383846,
    failed: 86015,
    successRate: 0.8169,
  },
];

const platform2000 = {
  rps: avg([12580.1, 12821.9]),
  p95: avg([196.1, 189.5]),
  waitingP95: avg([195.8, 189.3]),
  success: avg([376296, 384509]),
  failed: avg([2765, 1827]),
  successRate: avg([0.9927, 0.9953]),
};

const platform3000 = {
  rps: avg([12547.6, 12635.9]),
  p95: avg([290.8, 274.7]),
  waitingP95: avg([290.7, 274.5]),
  success: avg([376655, 379009]),
  failed: avg([2780, 2996]),
  successRate: avg([0.9927, 0.9922]),
};

const virtual2000 = {
  rps: avg([33234.0, 35581.7]),
  p95: avg([74.1, 69.2]),
  waitingP95: avg([72.3, 67.1]),
  success: avg([993372, 1066144]),
  failed: avg([4514, 1836]),
  successRate: avg([0.9955, 0.9983]),
};

const virtual3000 = {
  rps: avg([33641.6, 36462.8]),
  p95: avg([105.1, 84.0]),
  waitingP95: avg([104.1, 83.0]),
  success: avg([1006726, 1092296]),
  failed: avg([2967, 2918]),
  successRate: avg([0.9971, 0.9973]),
};

const abRuns = [
  { name: "platform VU2000 #1", mode: "platform", vu: 2000, rps: 12580, p95: 196, success: 376296, failed: 2765 },
  { name: "platform VU2000 #2", mode: "platform", vu: 2000, rps: 12822, p95: 189, success: 384509, failed: 1827 },
  { name: "platform VU3000 #1", mode: "platform", vu: 3000, rps: 12548, p95: 291, success: 376655, failed: 2780 },
  { name: "platform VU3000 #2", mode: "platform", vu: 3000, rps: 12636, p95: 275, success: 379009, failed: 2996 },
  { name: "virtual VU2000 #1", mode: "virtual", vu: 2000, rps: 33234, p95: 74, success: 993372, failed: 4514 },
  { name: "virtual VU2000 #2", mode: "virtual", vu: 2000, rps: 35582, p95: 69, success: 1066144, failed: 1836 },
  { name: "virtual VU3000 #1", mode: "virtual", vu: 3000, rps: 33642, p95: 105, success: 1006726, failed: 2967 },
  { name: "virtual VU3000 #2", mode: "virtual", vu: 3000, rps: 36463, p95: 84, success: 1092296, failed: 2918 },
];

export default function VirtualThreadsExperimentReport() {
  const theme = useHostTheme();

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1040 }}>
      <Stack gap={8}>
        <H1>가상 스레드 실험 보고서</H1>
        <Text tone="secondary">
          2026-08-12 · GET /api/bookings/threads · Thread.sleep(10) · VU 50/2000/3000/10000 · 로컬 Windows
        </Text>
        <Row gap={8}>
          <Pill tone="info">플랫폼 스레드 천장 ~12.5k RPS</Pill>
          <Pill tone="success">가상 스레드 RPS ~2.8배</Pill>
          <Pill tone="warning">VU10000 실패는 커넥션 한도</Pill>
        </Row>
      </Stack>

      <Callout tone="info" title="핵심 결론">
        블로킹 sleep API에서 톰캣 플랫폼 스레드(기본 200)는 VU 2000부터 RPS가
        약 12.5k에서 멈춘다. 가상 스레드를 켜면 같은 VU에서 RPS가 약 2.7~2.8배로
        오르고 p95는 193~283ms에서 72~95ms로 줄어든다. VU 10000의 실패 18%는
        스레드 풀 포화가 아니라 max-connections(8192)를 넘는 접속 거절이다.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat label="플랫폼 천장 RPS" value="12.5k" tone="warning" />
        <Stat
          label="VT VU2000 RPS"
          value={`${fmt(virtual2000.rps / 1000, 1)}k`}
          tone="success"
        />
        <Stat
          label="RPS 배율 (VU2000)"
          value={`${fmt(virtual2000.rps / platform2000.rps, 1)}×`}
          tone="success"
        />
        <Stat
          label="p95 (VU3000)"
          value={`${fmt(platform3000.p95, 0)}→${fmt(virtual3000.p95, 0)}ms`}
          tone="info"
        />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 실험 설계</H2>
        <Table
          headers={["항목", "값"]}
          rows={[
            ["엔드포인트", "GET /api/bookings/threads (Thread.sleep(10), DB 없음)"],
            ["목적", "플랫폼 스레드 한도 확인 후 가상 스레드가 처리량을 늘리는지 검증"],
            ["도구", "k6/threads-load-test.js · constant-vus · 30초"],
            ["1단계", "플랫폼 스레드 · VU 50 / 2000 / 3000 / 10000 (단발)"],
            ["2단계", "플랫폼 vs 가상 스레드 · VU 2000 / 3000 (각 2회)"],
            ["가상 스레드", "spring.threads.virtual.enabled=true"],
            ["톰캣 기본", "threads.max=200 · max-connections=8192 · accept-count=100"],
            ["환경", "로컬 Windows · 앱+k6 동일 호스트"],
          ]}
        />
        <Text tone="secondary">
          예매 API가 아니라 sleep API를 쓴 이유: Hikari 풀·FOR UPDATE 경합을 빼고
          스레드 모델만 비교하기 위함.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>2. 플랫폼 스레드 스케일</H2>
        <Text>
          워커 200개, 요청당 약 16ms이면 이론 천장은 200 / 0.016s ≈ 12,500 RPS다.
          실측이 그 근처에서 평평해진다.
        </Text>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>RPS vs VU (플랫폼)</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU50", "VU2000", "VU3000", "VU10000"]}
                series={[{ name: "RPS", data: scale.map((s) => Math.round(s.rps)), tone: "info" }]}
                referenceLines={[{ value: 12500, label: "이론 천장 12.5k", tone: "warning" }]}
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · platform threads · 2026-08-12 21:48–21:52
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>HTTP p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU50", "VU2000", "VU3000", "VU10000"]}
                series={[{ name: "p95 (ms)", data: scale.map((s) => Math.round(s.p95)), tone: "warning" }]}
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · http_req_duration p95 · 2026-08-12
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["VU", "RPS", "p95", "waiting p95", "성공", "실패", "성공률"]}
          columnAlign={["right", "right", "right", "right", "right", "right", "right"]}
          rows={scale.map((s) => [
            String(s.vu),
            fmt(s.rps, 0),
            `${fmt(s.p95, 0)}ms`,
            `${fmt(s.waitingP95, 0)}ms`,
            fmt(s.success, 0),
            fmt(s.failed, 0),
            pct(s.successRate),
          ])}
        />
        <Callout tone="warning" title="VU 10000 실패는 스레드 풀 거절이 아님">
          톰캣은 워커 200개가 바빠도 보통 503을 내지 않고 큐에서 기다린다.
          성공 건의 p95 670ms는 그 큐잉이다. 실패 86,015건(18.3%)은 동시 연결
          10,000이 max-connections 8,192을 넘어 접속이 거절/리셋된 쪽에 가깝다.
          RPS가 12.5k에서 7.8k로 떨어진 것도 같은 이유다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>3. 플랫폼 vs 가상 스레드 (본측정 2회 평균)</H2>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>RPS</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU2000", "VU3000"]}
                series={[
                  { name: "플랫폼", data: [Math.round(platform2000.rps), Math.round(platform3000.rps)], tone: "neutral" },
                  { name: "가상 스레드", data: [Math.round(virtual2000.rps), Math.round(virtual3000.rps)], tone: "success" },
                ]}
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · 2-run avg · 2026-08-12 22:01–22:09
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>HTTP p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU2000", "VU3000"]}
                series={[
                  { name: "플랫폼", data: [Math.round(platform2000.p95), Math.round(platform3000.p95)], tone: "warning" },
                  { name: "가상 스레드", data: [Math.round(virtual2000.p95), Math.round(virtual3000.p95)], tone: "info" },
                ]}
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · http_req_duration p95 · 2-run avg
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["VU", "모드", "RPS", "배율", "p95", "waiting p95", "성공", "성공률"]}
          columnAlign={["right", "left", "right", "right", "right", "right", "right", "right"]}
          rows={[
            [
              "2000",
              "플랫폼",
              fmt(platform2000.rps, 0),
              "1.0×",
              `${fmt(platform2000.p95, 0)}ms`,
              `${fmt(platform2000.waitingP95, 0)}ms`,
              fmt(platform2000.success, 0),
              pct(platform2000.successRate),
            ],
            [
              "2000",
              "가상 스레드",
              fmt(virtual2000.rps, 0),
              `${fmt(virtual2000.rps / platform2000.rps, 1)}×`,
              `${fmt(virtual2000.p95, 0)}ms`,
              `${fmt(virtual2000.waitingP95, 0)}ms`,
              fmt(virtual2000.success, 0),
              pct(virtual2000.successRate),
            ],
            [
              "3000",
              "플랫폼",
              fmt(platform3000.rps, 0),
              "1.0×",
              `${fmt(platform3000.p95, 0)}ms`,
              `${fmt(platform3000.waitingP95, 0)}ms`,
              fmt(platform3000.success, 0),
              pct(platform3000.successRate),
            ],
            [
              "3000",
              "가상 스레드",
              fmt(virtual3000.rps, 0),
              `${fmt(virtual3000.rps / platform3000.rps, 1)}×`,
              `${fmt(virtual3000.p95, 0)}ms`,
              `${fmt(virtual3000.waitingP95, 0)}ms`,
              fmt(virtual3000.success, 0),
              pct(virtual3000.successRate),
            ],
          ]}
        />
      </Stack>

      <Stack gap={12}>
        <H2>4. run별 원본 (A/B 본측정)</H2>
        <Table
          headers={["Run", "VU", "RPS", "p95", "성공", "실패"]}
          columnAlign={["left", "right", "right", "right", "right", "right"]}
          rows={abRuns.map((r) => [
            r.name,
            String(r.vu),
            String(r.rps),
            `${r.p95}ms`,
            String(r.success),
            String(r.failed),
          ])}
        />
        <Text tone="secondary">
          같은 모드끼리 편차가 작다. 플랫폼은 VU를 늘려도 RPS가 12.5~12.8k에
          고정되고, 가상 스레드는 33~36k 대역이다.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>5. 해석</H2>
        <H3>왜 플랫폼은 12.5k에서 멈추나</H3>
        <Text>
          sleep(10) 동안 플랫폼 워커 1개를 점유한다. 워커가 200개면 동시에 200개
          요청만 진행되고 나머지는 큐에 쌓인다. VU를 2000에서 3000으로 늘려도
          RPS는 그대로이고 p95만 193ms → 283ms로 늘어난 것이 그 증거다.
        </Text>
        <H3>왜 가상 스레드는 RPS가 오르나</H3>
        <Text>
          가상 스레드에서 Thread.sleep은 캐리어 스레드를 붙잡지 않는다. 그래서
          톰캣 워커 200개 한도를 넘고, 같은 30초에 성공 건수가 약 38만에서
          약 103만으로 늘어난다. waiting ≈ duration 이므로 지연 감소도 큐잉이
          줄어든 결과다.
        </Text>
        <Table
          headers={["변화", "수치", "의미"]}
          rows={[
            [
              "VU2000 RPS",
              `${fmt(platform2000.rps, 0)} → ${fmt(virtual2000.rps, 0)} (${fmt(virtual2000.rps / platform2000.rps, 1)}×)`,
              "스레드 천장 돌파",
            ],
            [
              "VU3000 RPS",
              `${fmt(platform3000.rps, 0)} → ${fmt(virtual3000.rps, 0)} (${fmt(virtual3000.rps / platform3000.rps, 1)}×)`,
              "동시성↑에도 처리량 유지",
            ],
            [
              "VU2000 p95",
              `${fmt(platform2000.p95, 0)}ms → ${fmt(virtual2000.p95, 0)}ms`,
              "큐잉 감소",
            ],
            [
              "VU3000 p95",
              `${fmt(platform3000.p95, 0)}ms → ${fmt(virtual3000.p95, 0)}ms`,
              "지연이 VU 증가에 덜 민감",
            ],
            [
              "성공률",
              "둘 다 99%대",
              "실패를 줄인 게 아니라 같은 성공률로 더 많이 처리",
            ],
            [
              "VT VU2000 vs VU3000 RPS",
              `${fmt(virtual2000.rps, 0)} vs ${fmt(virtual3000.rps, 0)}`,
              "다음은 CPU·루프백·k6 병목 가능성",
            ],
          ]}
        />
        <Callout tone="success" title="인사이트">
          블로킹 대기가 많은 API에서는 워커 수를 키우기 전에 가상 스레드가
          처리량·지연 모두에 이득이다. 다만 예매 선점처럼 DB 락이 병목이면
          스레드 모델만 바꿔서는 성공 건수가 늘지 않는다. 오늘 증명은
          “스레드가 병목인 구간”에 한정된다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>6. 한계</H2>
        <Table
          headers={["한계", "설명"]}
          rows={[
            ["로컬 단일 호스트", "절대 SLA·프로덕션 용량으로 해석 금지"],
            ["sleep API", "DB·락이 없는 인위적 블로킹. 예매 플로우와 별개"],
            ["VU10000", "max-connections가 먼저 터져 스레드 비교에 부적합"],
            ["k6 동일 호스트", "가상 스레드 35k RPS 구간에서 클라이언트 CPU도 섞일 수 있음"],
            ["요약 failedRate", "스크립트가 rate가 아니라 value를 읽어 항상 0으로 나옴"],
          ]}
        />
      </Stack>

      <Divider />
      <Text size="small" tone="secondary" style={{ color: theme.tokens.text.secondary }}>
        데이터: k6/results/summary-threads-* · summary-virtual-threads-* · 20260812 · 작성 2026-08-12
      </Text>
    </Stack>
  );
}
