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

const bookingOff = {
  success: avg([718, 736]),
  conflict: avg([11732, 11716]),
  rps: avg([1312.3, 1314.7]),
  p95: avg([66.5, 58.5]),
  successRate: avg([0.0577, 0.0591]),
};

const bookingOn = {
  success: avg([520, 535]),
  conflict: avg([9444, 9782]),
  rps: avg([1043.0, 1080.3]),
  p95: avg([64.1, 58.3]),
  successRate: avg([0.0522, 0.0519]),
};

const seatsPool5Vu50Off = {
  rps: avg([1816.9, 1461.4, 1741.2]),
  p95: avg([46.0, 65.8, 38.1]),
};
const seatsPool5Vu50On = {
  rps: avg([1329.7, 1328.8, 1375.2, 1488.6]),
  p95: avg([44.0, 46.0, 44.0, 40.3]),
};
const seatsPool5Vu200Off = {
  rps: avg([1488.0, 1497.4]),
  p95: avg([213.9, 246.1]),
};
const seatsPool5Vu200On = {
  rps: avg([1442.7, 1418.8]),
  p95: avg([147.3, 170.2]),
};

const seatsPool250Vu200Off = {
  rps: avg([2134.3, 1886.8]),
  p95: avg([149.5, 204.6]),
};
const seatsPool250Vu200On = {
  rps: avg([1988.2, 1758.2]),
  p95: avg([150.9, 154.9]),
};
const seatsPool250Vu500Off = {
  rps: avg([2263.7, 1925.8]),
  p95: avg([266.8, 337.9]),
  failed: avg([398, 306]),
};
const seatsPool250Vu500On = {
  rps: avg([1690.5, 1851.5]),
  p95: avg([557.3, 378.1]),
  failed: avg([442, 351]),
};

const bookingRuns = [
  { name: "VT off #1", success: 718, conflict: 11732, rps: 1312, p95: 67 },
  { name: "VT off #2", success: 736, conflict: 11716, rps: 1315, p95: 59 },
  { name: "VT on #1", success: 520, conflict: 9444, rps: 1043, p95: 64 },
  { name: "VT on #2", success: 535, conflict: 9782, rps: 1080, p95: 58 },
];

const seatsRuns = [
  { name: "pool5 VU50 off #1", pool: 5, vu: 50, vt: "off", rps: 1817, p95: 46, failed: 0 },
  { name: "pool5 VU50 off #2", pool: 5, vu: 50, vt: "off", rps: 1461, p95: 66, failed: 0 },
  { name: "pool5 VU50 off #3", pool: 5, vu: 50, vt: "off", rps: 1741, p95: 38, failed: 0 },
  { name: "pool5 VU50 on #1", pool: 5, vu: 50, vt: "on", rps: 1330, p95: 44, failed: 0 },
  { name: "pool5 VU50 on #2", pool: 5, vu: 50, vt: "on", rps: 1329, p95: 46, failed: 0 },
  { name: "pool5 VU50 on #3", pool: 5, vu: 50, vt: "on", rps: 1375, p95: 44, failed: 0 },
  { name: "pool5 VU50 on #4", pool: 5, vu: 50, vt: "on", rps: 1489, p95: 40, failed: 0 },
  { name: "pool5 VU200 off #1", pool: 5, vu: 200, vt: "off", rps: 1488, p95: 214, failed: 0 },
  { name: "pool5 VU200 off #2", pool: 5, vu: 200, vt: "off", rps: 1497, p95: 246, failed: 0 },
  { name: "pool5 VU200 on #1", pool: 5, vu: 200, vt: "on", rps: 1443, p95: 147, failed: 0 },
  { name: "pool5 VU200 on #2", pool: 5, vu: 200, vt: "on", rps: 1419, p95: 170, failed: 0 },
  { name: "pool250 VU200 off #1", pool: 250, vu: 200, vt: "off", rps: 2134, p95: 149, failed: 0 },
  { name: "pool250 VU200 off #2", pool: 250, vu: 200, vt: "off", rps: 1887, p95: 205, failed: 0 },
  { name: "pool250 VU200 on #1", pool: 250, vu: 200, vt: "on", rps: 1988, p95: 151, failed: 0 },
  { name: "pool250 VU200 on #2", pool: 250, vu: 200, vt: "on", rps: 1758, p95: 155, failed: 0 },
  { name: "pool250 VU500 off #1", pool: 250, vu: 500, vt: "off", rps: 2264, p95: 267, failed: 398 },
  { name: "pool250 VU500 off #2", pool: 250, vu: 500, vt: "off", rps: 1926, p95: 338, failed: 306 },
  { name: "pool250 VU500 on #1", pool: 250, vu: 500, vt: "on", rps: 1691, p95: 557, failed: 442 },
  { name: "pool250 VU500 on #2", pool: 250, vu: 500, vt: "on", rps: 1851, p95: 378, failed: 351 },
];

export default function VtDbApiExperimentReport() {
  const theme = useHostTheme();

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1040 }}>
      <Stack gap={8}>
        <H1>가상 스레드 × DB API 실험 보고서</H1>
        <Text tone="secondary">
          2026-08-18 · 예매 플로우 + GET /api/sales/1/seats · VT on/off · 풀 5→250 · 로컬 Windows
        </Text>
        <Row gap={8}>
          <Pill tone="warning">sleep 3배는 DB API로 안 옮겨짐</Pill>
          <Pill tone="info">풀 5 = 조회 RPS 천장</Pill>
          <Pill tone="warning">풀 250 + VU500도 VT 이득 없음</Pill>
        </Row>
      </Stack>

      <Callout tone="info" title="핵심 결론">
        8/12 sleep API에서 가상 스레드 RPS가 약 2.8배였지만, 오늘 DB를 타는 API에서는
        이득이 없었다. 예매는 VT on이 성공 건수·RPS 모두 낮았고, 좌석 조회는 풀 5에서
        VU를 늘려도 RPS가 ~1.5k에 붙었다. 풀을 250으로 키워도 RPS는 ~2k 수준이고
        VU 500에서 VT가 더 느렸다. 병목은 톰캣 워커가 아니라 Hikari·MySQL이다.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat label="예매 RPS (off→on)" value={`${fmt(bookingOff.rps, 0)}→${fmt(bookingOn.rps, 0)}`} tone="danger" />
        <Stat label="조회 pool5 천장" value="~1.5k RPS" tone="warning" />
        <Stat label="조회 pool250 VU200" value={`~${fmt(seatsPool250Vu200Off.rps / 1000, 1)}k`} tone="info" />
        <Stat
          label="VU500 RPS (off vs on)"
          value={`${fmt(seatsPool250Vu500Off.rps, 0)} / ${fmt(seatsPool250Vu500On.rps, 0)}`}
          tone="warning"
        />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 실험 설계</H2>
        <Table
          headers={["항목", "값"]}
          rows={[
            ["가설", "sleep에서 이긴 VT가 조회 API에는 소~중 이득, 예매에는 거의 없음"],
            ["예매", "booking-load-test.js · CANCEL_AFTER_BOOK=true · VU50 · 30s"],
            ["조회", "seats-load-test.js · GET /api/sales/1/seats?seatGrade=R"],
            ["1단계", "풀 5 · VT on/off · 예매 VU50, 조회 VU50/200"],
            ["2단계", "풀 250 · 조회 VU200/500 · VT on/off"],
            ["톰캣", "max-connections=20000 · accept-count=2000 · 워커 기본 200"],
            ["환경", "로컬 Windows · 앱+MySQL+k6 동일 호스트"],
          ]}
        />
        <Text tone="secondary">
          예매 첫 run(success 0)과 VT on 전환 직후 1회는 워밍업/설정 전환으로 보고
          본측정에서 제외했다.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>2. 예매 플로우 (풀 5 · VU 50)</H2>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>예매 성공 건수 (30초)</CardHeader>
            <CardBody>
              <BarChart
                categories={["VT off", "VT on"]}
                series={[
                  {
                    name: "booking.success",
                    data: [Math.round(bookingOff.success), Math.round(bookingOn.success)],
                    tone: "warning",
                  },
                ]}
                height={200}
              />
              <Text size="small" tone="secondary">
                Source: k6 · booking · VU50 · 2-run avg · 2026-08-18
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>HTTP RPS</CardHeader>
            <CardBody>
              <BarChart
                categories={["VT off", "VT on"]}
                series={[
                  {
                    name: "RPS",
                    data: [Math.round(bookingOff.rps), Math.round(bookingOn.rps)],
                    tone: "info",
                  },
                ]}
                height={200}
              />
              <Text size="small" tone="secondary">
                Source: k6 · http_reqs.rate · 2-run avg
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["모드", "예매 성공", "holdConflict", "성공률", "RPS", "p95"]}
          columnAlign={["left", "right", "right", "right", "right", "right"]}
          rows={[
            [
              "플랫폼",
              fmt(bookingOff.success, 0),
              fmt(bookingOff.conflict, 0),
              pct(bookingOff.successRate),
              fmt(bookingOff.rps, 0),
              `${fmt(bookingOff.p95, 0)}ms`,
            ],
            [
              "가상 스레드",
              fmt(bookingOn.success, 0),
              fmt(bookingOn.conflict, 0),
              pct(bookingOn.successRate),
              fmt(bookingOn.rps, 0),
              `${fmt(bookingOn.p95, 0)}ms`,
            ],
          ]}
        />
        <Callout tone="warning" title="예매는 VT가 오히려 낮음">
          성공 ~727 → ~528건, RPS ~1,313 → ~1,062. 충돌(409) 비율은 둘 다 ~94%.
          좌석 FOR UPDATE + 풀 5가 천장이고, 가상 스레드는 성공 처리량을 늘리지 못했다.
        </Callout>
        <Table
          headers={["Run", "성공", "충돌", "RPS", "p95"]}
          columnAlign={["left", "right", "right", "right", "right"]}
          rows={bookingRuns.map((r) => [r.name, String(r.success), String(r.conflict), String(r.rps), `${r.p95}ms`])}
        />
      </Stack>

      <Stack gap={12}>
        <H2>3. 좌석 조회 · 풀 5 (VT가 안 보이는 이유)</H2>
        <Text>
          VU 50은 톰캣 워커 200에 한참 못 미친다. Little’s law로 VU50 × ~30ms ≈ 1.7k RPS이고
          실측이 그 근처다. VU를 200으로 올려도 RPS는 안 오르고 p95만 4~5배가 된다.
        </Text>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>조회 RPS (풀 5)</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU50 off", "VU50 on", "VU200 off", "VU200 on"]}
                series={[
                  {
                    name: "RPS",
                    data: [
                      Math.round(seatsPool5Vu50Off.rps),
                      Math.round(seatsPool5Vu50On.rps),
                      Math.round(seatsPool5Vu200Off.rps),
                      Math.round(seatsPool5Vu200On.rps),
                    ],
                    tone: "info",
                  },
                ]}
                referenceLines={[{ value: 1500, label: "천장 ~1.5k", tone: "warning" }]}
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · seats · pool=5 · 2026-08-18
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>HTTP p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU50 off", "VU50 on", "VU200 off", "VU200 on"]}
                series={[
                  {
                    name: "p95 (ms)",
                    data: [
                      Math.round(seatsPool5Vu50Off.p95),
                      Math.round(seatsPool5Vu50On.p95),
                      Math.round(seatsPool5Vu200Off.p95),
                      Math.round(seatsPool5Vu200On.p95),
                    ],
                    tone: "warning",
                  },
                ]}
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · http_req_duration p95 · pool=5
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["조건", "RPS", "p95"]}
          columnAlign={["left", "right", "right"]}
          rows={[
            ["VU50 플랫폼", fmt(seatsPool5Vu50Off.rps, 0), `${fmt(seatsPool5Vu50Off.p95, 0)}ms`],
            ["VU50 가상 스레드", fmt(seatsPool5Vu50On.rps, 0), `${fmt(seatsPool5Vu50On.p95, 0)}ms`],
            ["VU200 플랫폼", fmt(seatsPool5Vu200Off.rps, 0), `${fmt(seatsPool5Vu200Off.p95, 0)}ms`],
            ["VU200 가상 스레드", fmt(seatsPool5Vu200On.rps, 0), `${fmt(seatsPool5Vu200On.p95, 0)}ms`],
          ]}
        />
      </Stack>

      <Stack gap={12}>
        <H2>4. 좌석 조회 · 풀 250 (톰캣 vs MySQL)</H2>
        <Text>
          풀을 5→250으로 올리면 VU200 RPS가 ~1.5k에서 ~2.0k로 소폭 오른다. VU500으로
          늘려도 RPS는 ~2k에 머물고 실패가 생긴다. 가상 스레드는 워커 200 한도를 푸는데도
          플랫폼보다 RPS가 낮고 p95가 더 길다.
        </Text>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>조회 RPS (풀 250)</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU200 off", "VU200 on", "VU500 off", "VU500 on"]}
                series={[
                  {
                    name: "RPS",
                    data: [
                      Math.round(seatsPool250Vu200Off.rps),
                      Math.round(seatsPool250Vu200On.rps),
                      Math.round(seatsPool250Vu500Off.rps),
                      Math.round(seatsPool250Vu500On.rps),
                    ],
                    tone: "info",
                  },
                ]}
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · seats · pool=250 · 2-run avg · 2026-08-18
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>HTTP p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU200 off", "VU200 on", "VU500 off", "VU500 on"]}
                series={[
                  {
                    name: "p95 (ms)",
                    data: [
                      Math.round(seatsPool250Vu200Off.p95),
                      Math.round(seatsPool250Vu200On.p95),
                      Math.round(seatsPool250Vu500Off.p95),
                      Math.round(seatsPool250Vu500On.p95),
                    ],
                    tone: "warning",
                  },
                ]}
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · http_req_duration p95 · pool=250
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["조건", "RPS", "p95", "실패"]}
          columnAlign={["left", "right", "right", "right"]}
          rows={[
            ["VU200 플랫폼", fmt(seatsPool250Vu200Off.rps, 0), `${fmt(seatsPool250Vu200Off.p95, 0)}ms`, "0"],
            ["VU200 가상 스레드", fmt(seatsPool250Vu200On.rps, 0), `${fmt(seatsPool250Vu200On.p95, 0)}ms`, "0"],
            [
              "VU500 플랫폼",
              fmt(seatsPool250Vu500Off.rps, 0),
              `${fmt(seatsPool250Vu500Off.p95, 0)}ms`,
              fmt(seatsPool250Vu500Off.failed, 0),
            ],
            [
              "VU500 가상 스레드",
              fmt(seatsPool250Vu500On.rps, 0),
              `${fmt(seatsPool250Vu500On.p95, 0)}ms`,
              fmt(seatsPool250Vu500On.failed, 0),
            ],
          ]}
        />
        <Callout tone="warning" title="톰캣이 아니라 MySQL">
          플랫폼 VU500은 워커 200에 걸릴 수 있다. 가상 스레드는 그 한도를 넘고 풀 250까지
          쿼리할 수 있는데도 RPS가 오르지 않았다. VU200 × 평균 ~100ms ≈ 2,000 RPS로,
          동시 쿼리가 늘자 요청당 지연이 풀 5 시절(~30ms)보다 커졌다. 워커를 풀면 DB가
          먼저 지친다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>5. 해석</H2>
        <H3>왜 sleep 3배가 조회에 안 나오나</H3>
        <Text>
          sleep은 공유 자원 없이 스레드만 점유한다. 조회는 Hikari·MySQL을 공유한다.
          풀 5면 동시 DB 작업이 5개라 VT가 워커를 아껴도 처리량이 안 는다. 풀 250이면
          커넥션은 남지만 로컬 MySQL이 ~2k RPS에서 포화한다. 플랫폼 워커 200은 우연히
          DB 부하 제한기 역할을 했고, VT는 그 제한을 풀어 DB를 더 때렸다.
        </Text>
        <Table
          headers={["변화", "수치", "의미"]}
          rows={[
            [
              "예매 성공 (VU50)",
              `${fmt(bookingOff.success, 0)} → ${fmt(bookingOn.success, 0)}`,
              "VT가 예매 처리량을 늘리지 못함",
            ],
            [
              "조회 RPS 풀5 VU50→200",
              `${fmt(seatsPool5Vu50Off.rps, 0)} → ${fmt(seatsPool5Vu200Off.rps, 0)}`,
              "사람만 늘리면 지연↑, 처리량 그대로",
            ],
            [
              "조회 RPS 풀5→250 (VU200 off)",
              `${fmt(seatsPool5Vu200Off.rps, 0)} → ${fmt(seatsPool250Vu200Off.rps, 0)}`,
              "풀 확대는 소폭 이득 (1.5k→2.0k)",
            ],
            [
              "조회 VU500 off vs on",
              `${fmt(seatsPool250Vu500Off.rps, 0)} vs ${fmt(seatsPool250Vu500On.rps, 0)}`,
              "워커 한도를 풀어도 VT가 더 느림",
            ],
            ["8/12 sleep VU2000", "12.7k → 34.4k (2.7×)", "스레드가 병목일 때만 VT 이득"],
          ]}
        />
        <Callout tone="success" title="인사이트">
          가상 스레드는 톰캣 워커 부족을 푸는 도구다. 티켓 예매·좌석맵처럼 DB가 천장인
          API에는 성능 카드가 아니다. 운영에 켜 둬도 큰 사고는 아니지만, 오픈런 용량을
          VT로 늘리겠다는 기대는 접는 편이 맞다. 다음은 풀·쿼리·캐시·락이지 스레드 모델이 아니다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>6. run별 원본 (조회)</H2>
        <Table
          headers={["Run", "풀", "VU", "VT", "RPS", "p95", "실패"]}
          columnAlign={["left", "right", "right", "left", "right", "right", "right"]}
          rows={seatsRuns.map((r) => [
            r.name,
            String(r.pool),
            String(r.vu),
            r.vt,
            String(r.rps),
            `${r.p95}ms`,
            String(r.failed),
          ])}
        />
      </Stack>

      <Stack gap={12}>
        <H2>7. 한계</H2>
        <Table
          headers={["한계", "설명"]}
          rows={[
            ["로컬 단일 호스트", "앱·MySQL·k6가 같은 머신. 절대 SLA 아님"],
            ["풀 5→250 점프", "20/50 중간값이 없어 풀 곡선을 세밀히 못 봄"],
            ["MySQL 튜닝 없음", "innodb/max_connections 등 서버 한도는 미측정"],
            ["JDBC 핀닝", "커넥터 동기화가 VT를 더 나쁘게 했을 가능성"],
            ["예매는 VU50만", "예매×풀250×고마 VU는 오늘 안 함"],
          ]}
        />
      </Stack>

      <Divider />
      <Text size="small" tone="secondary" style={{ color: theme.tokens.text.secondary }}>
        데이터: k6/results/summary-seats-* · summary-virtual-threads-* · 20260818 · 작성 2026-08-18
      </Text>
    </Stack>
  );
}
