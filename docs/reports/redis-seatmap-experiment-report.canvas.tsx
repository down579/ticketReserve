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

const seatsVu50Off = {
  rps: avg([2672.5, 2476.5]),
  p95: avg([32.9, 39.7]),
};
const seatsVu50On = {
  rps: avg([4000.2, 3082.5]),
  p95: avg([18.5, 24.5]),
};
const seatsVu200Off = {
  rps: avg([2872.7, 2915.1]),
  p95: avg([149.1, 148.8]),
};
const seatsVu200On = {
  rps: avg([4017.8, 4013.2]),
  p95: avg([111.1, 110.9]),
};

const bookingOn = {
  success: avg([691, 603]),
  conflict: avg([21235, 18984]),
  rps: avg([2256.9, 2013.1]),
  p95: avg([48.3, 48.6]),
  successRate: avg([0.0315, 0.0308]),
  getSeats: avg([21926, 19587]),
};

const bookingOff = {
  success: 744,
  conflict: 18243,
  rps: 1972.4,
  p95: 54.4,
  successRate: 0.039,
  getSeats: 19100,
};

const seatsRuns = [
  { name: "off VU50 #1", cache: "off", vu: 50, rps: 2672, p95: 33 },
  { name: "off VU50 #2", cache: "off", vu: 50, rps: 2477, p95: 40 },
  { name: "on VU50 #1", cache: "on", vu: 50, rps: 4000, p95: 18 },
  { name: "on VU50 #2", cache: "on", vu: 50, rps: 3082, p95: 24 },
  { name: "off VU200 #1", cache: "off", vu: 200, rps: 2873, p95: 149 },
  { name: "off VU200 #2", cache: "off", vu: 200, rps: 2915, p95: 149 },
  { name: "on VU200 #1", cache: "on", vu: 200, rps: 4018, p95: 111 },
  { name: "on VU200 #2", cache: "on", vu: 200, rps: 4013, p95: 111 },
];

const bookingRuns = [
  { name: "on #1", cache: "on", success: 691, conflict: 21235, rps: 2257, p95: 48 },
  { name: "on #2", cache: "on", success: 603, conflict: 18984, rps: 2013, p95: 49 },
  { name: "off #1", cache: "off", success: 744, conflict: 18243, rps: 1972, p95: 54 },
];

export default function RedisSeatMapExperimentReport() {
  const theme = useHostTheme();

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1040 }}>
      <Stack gap={8}>
        <H1>Redis 좌석맵 캐시 실험 보고서</H1>
        <Text tone="secondary">
          2026-08-21 · seats-load-test + booking-load-test · cache on/off · TTL 3s · Hikari pool=50 · 로컬 Windows
        </Text>
        <Row gap={8}>
          <Pill tone="success">조회 RPS ~1.4배</Pill>
          <Pill tone="info">VU200 p95 149→111ms</Pill>
          <Pill tone="warning">예매 성공은 안 늘음</Pill>
        </Row>
      </Stack>

      <Callout tone="info" title="핵심 결론">
        좌석맵을 Redis에 두면 조회 전용 RPS가 VU50·VU200 모두 약 1.4배로 오르고
        p95도 내려간다. 반면 예매 플로우에서는 캐시 ON이 HTTP RPS를 조금 올리지만
        예매 성공은 ~647건으로 OFF(744건)보다 오히려 적고 holdConflict만 늘어난다.
        “읽기는 캐시, 선점은 DB”라는 가설이 숫자로 맞았다.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat
          label="조회 VU50 RPS"
          value={`${fmt(seatsVu50Off.rps / 1000, 1)}k→${fmt(seatsVu50On.rps / 1000, 1)}k`}
          tone="success"
        />
        <Stat
          label="조회 VU200 RPS"
          value={`${fmt(seatsVu200Off.rps / 1000, 1)}k→${fmt(seatsVu200On.rps / 1000, 1)}k`}
          tone="success"
        />
        <Stat
          label="예매 성공 (on/off)"
          value={`${fmt(bookingOn.success, 0)} / ${bookingOff.success}`}
          tone="warning"
        />
        <Stat
          label="조회 배율 (VU200)"
          value={`${fmt(seatsVu200On.rps / seatsVu200Off.rps, 1)}×`}
          tone="info"
        />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 실험 설계</H2>
        <Table
          headers={["항목", "값"]}
          rows={[
            ["가설", "좌석맵 Redis 캐시 → 조회 RPS↑ / 예매 성공은 거의 동일"],
            ["캐시", "ticketReserve:seatmap:{salesId}:{grade}:{block} · TTL 3초"],
            ["무효화", "선점·예매·취소 커밋 후 해당 salesId 키 삭제"],
            ["1순위", "GET /api/sales/1/seats · cache on/off · VU 50/200 · 30s · 각 2회"],
            ["2순위", "예매→즉시취소 · VU50 · 30s · on 2회 + off 1회"],
            ["워밍업", "캐시 ON 전 seats 10s warmup"],
            ["풀", "Hikari maximum-pool-size=50"],
            ["환경", "로컬 Windows · 앱+MySQL+Redis+k6 동일 호스트"],
          ]}
        />
        <Text tone="secondary">
          8/18 VT 실험 때 풀 5·250과 달리 오늘은 풀 50이다. OFF 조회 RPS(~2.5~2.9k)가
          그때(~1.5~2k)보다 높은 것은 풀 차이다. A/B 비교는 오늘 on/off만 본다.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>2. 좌석 조회 (1순위)</H2>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>조회 RPS</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU50 off", "VU50 on", "VU200 off", "VU200 on"]}
                series={[
                  {
                    name: "RPS",
                    data: [
                      Math.round(seatsVu50Off.rps),
                      Math.round(seatsVu50On.rps),
                      Math.round(seatsVu200Off.rps),
                      Math.round(seatsVu200On.rps),
                    ],
                    tone: "success",
                  },
                ]}
                height={220}
              />
              <Text size="small" tone="secondary">
                Source: k6 · seats-load-test · 2-run avg · 2026-08-21
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
                      Math.round(seatsVu50Off.p95),
                      Math.round(seatsVu50On.p95),
                      Math.round(seatsVu200Off.p95),
                      Math.round(seatsVu200On.p95),
                    ],
                    tone: "warning",
                  },
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
          headers={["조건", "RPS", "배율", "p95"]}
          columnAlign={["left", "right", "right", "right"]}
          rows={[
            ["VU50 MySQL", fmt(seatsVu50Off.rps, 0), "1.0×", `${fmt(seatsVu50Off.p95, 0)}ms`],
            [
              "VU50 Redis",
              fmt(seatsVu50On.rps, 0),
              `${fmt(seatsVu50On.rps / seatsVu50Off.rps, 1)}×`,
              `${fmt(seatsVu50On.p95, 0)}ms`,
            ],
            ["VU200 MySQL", fmt(seatsVu200Off.rps, 0), "1.0×", `${fmt(seatsVu200Off.p95, 0)}ms`],
            [
              "VU200 Redis",
              fmt(seatsVu200On.rps, 0),
              `${fmt(seatsVu200On.rps / seatsVu200Off.rps, 1)}×`,
              `${fmt(seatsVu200On.p95, 0)}ms`,
            ],
          ]}
        />
        <Callout tone="success" title="조회는 캐시가 이긴다">
          VU200에서 RPS 2.9k → 4.0k, p95 149ms → 111ms. 실패는 전 구간 0.
          VU50 on #2(3082)는 #1(4000)보다 낮아 편차가 있지만, 둘 다 OFF 평균(2575)보다 높다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>3. 예매 플로우 (2순위)</H2>
        <Text>
          CANCEL_AFTER_BOOK=true · VU50 · 30초. 캐시 ON 2회 평균 vs OFF 1회.
        </Text>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>예매 성공 건수</CardHeader>
            <CardBody>
              <BarChart
                categories={["Redis on", "Redis off"]}
                series={[
                  {
                    name: "booking.success",
                    data: [Math.round(bookingOn.success), bookingOff.success],
                    tone: "warning",
                  },
                ]}
                height={200}
              />
              <Text size="small" tone="secondary">
                Source: k6 · booking-load-test · VU50 · 2026-08-21
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>HTTP RPS / holdConflict</CardHeader>
            <CardBody>
              <BarChart
                categories={["RPS on", "RPS off", "충돌 on/100", "충돌 off/100"]}
                series={[
                  {
                    name: "값",
                    data: [
                      Math.round(bookingOn.rps),
                      Math.round(bookingOff.rps),
                      Math.round(bookingOn.conflict / 100),
                      Math.round(bookingOff.conflict / 100),
                    ],
                    tone: "info",
                  },
                ]}
                height={200}
              />
              <Text size="small" tone="secondary">
                충돌은 ÷100으로 스케일 (on ~201, off ~182)
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["모드", "예매 성공", "holdConflict", "성공률", "좌석조회 횟수", "RPS", "p95"]}
          columnAlign={["left", "right", "right", "right", "right", "right", "right"]}
          rows={[
            [
              "Redis on",
              fmt(bookingOn.success, 0),
              fmt(bookingOn.conflict, 0),
              pct(bookingOn.successRate),
              fmt(bookingOn.getSeats, 0),
              fmt(bookingOn.rps, 0),
              `${fmt(bookingOn.p95, 0)}ms`,
            ],
            [
              "Redis off",
              String(bookingOff.success),
              String(bookingOff.conflict),
              pct(bookingOff.successRate),
              String(bookingOff.getSeats),
              fmt(bookingOff.rps, 0),
              `${fmt(bookingOff.p95, 0)}ms`,
            ],
          ]}
        />
        <Callout tone="warning" title="예매 성공은 캐시로 안 늘어난다">
          ON은 좌석조회·세션을 더 많이 돌리고(HTTP RPS↑) 409도 더 많다.
          성공 건수는 OFF가 오히려 많다. 병목은 여전히 FOR UPDATE 선점이다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>4. 해석</H2>
        <H3>왜 조회만 빨라지나</H3>
        <Text>
          조회 전용은 같은 키를 반복 GET한다. TTL 3초 안 hit이면 MySQL SELECT·풀 대기가
          빠진다. VU200에서도 Redis가 MySQL보다 RPS가 높고 지연이 낮다.
        </Text>
        <H3>왜 예매는 그대로(또는 성공↓)인가</H3>
        <Text>
          플로우의 비싼 구간은 hold의 좌석 락이다. 캐시가 조회를 싸게 만들면 VU가 같은
          시간에 더 많은 선점 시도를 하고, 성공 가능한 좌석 수는 그대로라 409가 는다.
          8/12·8/18에 본 “시도↑ → 충돌↑ → 성공 정체”와 같은 패턴이다.
        </Text>
        <Table
          headers={["변화", "수치", "의미"]}
          rows={[
            [
              "조회 VU200 RPS",
              `${fmt(seatsVu200Off.rps, 0)} → ${fmt(seatsVu200On.rps, 0)} (${fmt(seatsVu200On.rps / seatsVu200Off.rps, 1)}×)`,
              "읽기 캐시 효과",
            ],
            [
              "조회 VU200 p95",
              `${fmt(seatsVu200Off.p95, 0)}ms → ${fmt(seatsVu200On.p95, 0)}ms`,
              "DB 대기 감소",
            ],
            [
              "예매 성공",
              `${fmt(bookingOn.success, 0)} (on) vs ${bookingOff.success} (off)`,
              "캐시가 예매 처리량을 올리지 않음",
            ],
            [
              "holdConflict",
              `${fmt(bookingOn.conflict, 0)} vs ${bookingOff.conflict}`,
              "빠른 조회 → 더 많은 선점 시도",
            ],
            ["8/18 VT 조회", "풀만 키워도 ~2k, VT 이득 없음", "오늘은 캐시가 맞는 레버"],
          ]}
        />
        <Callout tone="success" title="인사이트">
          VT는 DB API에서 약했고, Redis 좌석맵 캐시는 조회에서 분명한 이득이다.
          오픈런 체감(맵이 빨리 뜨는 것)과 예매 성공률은 다른 문제다. 다음 레버는
          선점 경로(락 설계·대기열·Redis SET NX)이지 조회 캐시 추가 튜닝이 아니다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>5. run별 원본</H2>
        <H3>조회</H3>
        <Table
          headers={["Run", "캐시", "VU", "RPS", "p95"]}
          columnAlign={["left", "left", "right", "right", "right"]}
          rows={seatsRuns.map((r) => [
            r.name,
            r.cache,
            String(r.vu),
            String(r.rps),
            `${r.p95}ms`,
          ])}
        />
        <H3>예매</H3>
        <Table
          headers={["Run", "캐시", "성공", "충돌", "RPS", "p95"]}
          columnAlign={["left", "left", "right", "right", "right", "right"]}
          rows={bookingRuns.map((r) => [
            r.name,
            r.cache,
            String(r.success),
            String(r.conflict),
            String(r.rps),
            `${r.p95}ms`,
          ])}
        />
      </Stack>

      <Stack gap={12}>
        <H2>6. 한계</H2>
        <Table
          headers={["한계", "설명"]}
          rows={[
            ["로컬 단일 호스트", "앱·MySQL·Redis·k6 동일 머신. 절대 SLA 아님"],
            ["예매 OFF 1회만", "on은 2회, off는 1회라 편차 해석에 주의"],
            ["VU50 on 편차", "4000 vs 3082. 워밍업·머신 노이즈 가능"],
            ["TTL 3초 고정", "1초/10초·무효화 전략 비교는 안 함"],
            ["풀 50", "8/18(풀5/250)과 절대 RPS 직접 비교 금지"],
          ]}
        />
      </Stack>

      <Divider />
      <Text size="small" tone="secondary" style={{ color: theme.tokens.text.secondary }}>
        데이터: k6/results/summary-seats-redis-* · summary-booking-redis-* · 20260821 · 작성 2026-08-21
      </Text>
    </Stack>
  );
}
