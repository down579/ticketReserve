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

/** 워밍업 후 본측정 (각 VU 2회 평균) */
const measured = [
  {
    vu: 10,
    success: avg([701, 710]),
    conflict: avg([2679, 2883]),
    rps: avg([407.2, 428.7]),
    p95: avg([47.8, 43.9]),
    waitingP95: avg([47.7, 43.7]),
    successRate: avg([0.2074, 0.1976]),
  },
  {
    vu: 30,
    success: avg([410, 398]),
    conflict: avg([4691, 4496]),
    rps: avg([549.0, 526.2]),
    p95: avg([90.6, 96.7]),
    waitingP95: avg([90.5, 96.6]),
    successRate: avg([0.0804, 0.0813]),
  },
  {
    vu: 50,
    success: avg([316, 305]),
    conflict: avg([5010, 5090]),
    rps: avg([560.6, 566.4]),
    p95: avg([150.0, 147.4]),
    waitingP95: avg([149.9, 147.3]),
    successRate: avg([0.0593, 0.0565]),
  },
];

const runs = [
  { name: "vu10 #1", vu: 10, success: 701, conflict: 2679, rps: 407, p95: 48 },
  { name: "vu10 #2", vu: 10, success: 710, conflict: 2883, rps: 429, p95: 44 },
  { name: "vu30 #1", vu: 30, success: 410, conflict: 4691, rps: 549, p95: 91 },
  { name: "vu30 #2", vu: 30, success: 398, conflict: 4496, rps: 526, p95: 97 },
  { name: "vu50 #1", vu: 50, success: 316, conflict: 5010, rps: 561, p95: 150 },
  { name: "vu50 #2", vu: 50, success: 305, conflict: 5090, rps: 566, p95: 147 },
];

export default function VuScaleExperimentReport() {
  const theme = useHostTheme();

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1040 }}>
      <Stack gap={8}>
        <H1>VU 스케일 실험 보고서</H1>
        <Text tone="secondary">
          2026-08-05 · CANCEL_AFTER_BOOK=true · VU 10/30/50 · 워밍업 후 측정 · pool=5
        </Text>
        <Row gap={8}>
          <Pill tone="info">동시성 ↑ → 지연 ↑</Pill>
          <Pill tone="warning">동시성 ↑ → 예매 성공 ↓</Pill>
          <Pill tone="success">취소 실패 0</Pill>
        </Row>
      </Stack>

      <Callout tone="info" title="핵심 결론">
        동시 유저(VU)를 늘리면 HTTP RPS는 소폭 오르지만, 예매 성공 건수와
        성공률은 오히려 감소하고 p95는 크게 증가한다. VU10(~706건, p95~46ms)이
        VU50(~311건, p95~149ms)보다 예매 처리에 효율적이다. 원인은 좌석
        FOR UPDATE 경합(holdConflict) 증가로, “사람만 늘린다”고 예매가 늘지
        않는다는 점을 확인했다.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat label="본측정 run" value="6" tone="info" />
        <Stat
          label="VU10 예매 성공"
          value={`${fmt(measured[0].success, 0)}건`}
          tone="success"
        />
        <Stat
          label="VU50 예매 성공"
          value={`${fmt(measured[2].success, 0)}건`}
          tone="warning"
        />
        <Stat
          label="p95 (10→50)"
          value={`${fmt(measured[0].p95, 0)}→${fmt(measured[2].p95, 0)}ms`}
          tone="danger"
        />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 실험 설계</H2>
        <Table
          headers={["항목", "값"]}
          rows={[
            ["시나리오", "예매 성공 → 즉시 취소 (좌석 재활용)"],
            ["목적", "동시 유저 증가가 성공 건수·지연·충돌에 미치는 영향"],
            ["VU", "10 / 30 / 50 (각 2회)"],
            ["워밍업", "사전 warmup run 실시 후 본측정"],
            ["기간", "30초"],
            ["커넥션 풀", "Hikari maximum-pool-size=5"],
            ["환경", "로컬 Mac · 앱+MySQL+k6 동일 호스트"],
          ]}
        />
      </Stack>

      <Stack gap={12}>
        <H2>2. VU별 평균 비교 (본측정 2회 평균)</H2>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>예매 성공 건수 (30초)</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU10", "VU30", "VU50"]}
                series={[
                  {
                    name: "booking.success",
                    data: measured.map((m) => Math.round(m.success)),
                  },
                ]}
                height={200}
              />
              <Text size="small" tone="secondary">
                Source: k6 · VU scale · 2026-08-05 · 2-run avg
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>HTTP p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU10", "VU30", "VU50"]}
                series={[
                  {
                    name: "p95",
                    data: measured.map((m) => Math.round(m.p95)),
                  },
                ]}
                height={200}
              />
            </CardBody>
          </Card>
        </Grid>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>RPS</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU10", "VU30", "VU50"]}
                series={[
                  {
                    name: "RPS",
                    data: measured.map((m) => Math.round(m.rps)),
                  },
                ]}
                height={200}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>선점 충돌 (409)</CardHeader>
            <CardBody>
              <BarChart
                categories={["VU10", "VU30", "VU50"]}
                series={[
                  {
                    name: "holdConflict",
                    data: measured.map((m) => Math.round(m.conflict)),
                  },
                ]}
                height={200}
              />
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={[
            "VU",
            "예매 성공",
            "성공률",
            "holdConflict",
            "RPS",
            "p95",
            "waiting p95",
          ]}
          columnAlign={[
            "right",
            "right",
            "right",
            "right",
            "right",
            "right",
            "right",
          ]}
          rows={measured.map((m) => [
            String(m.vu),
            fmt(m.success, 0),
            `${fmt(m.successRate * 100, 1)}%`,
            fmt(m.conflict, 0),
            fmt(m.rps, 0),
            `${fmt(m.p95, 0)}ms`,
            `${fmt(m.waitingP95, 0)}ms`,
          ])}
        />
      </Stack>

      <Stack gap={12}>
        <H2>3. run별 원본 (본측정)</H2>
        <Table
          headers={["Run", "VU", "예매 성공", "충돌", "RPS", "p95"]}
          columnAlign={["left", "right", "right", "right", "right", "right"]}
          rows={runs.map((r) => [
            r.name,
            String(r.vu),
            String(r.success),
            String(r.conflict),
            String(r.rps),
            `${r.p95}ms`,
          ])}
        />
        <Text tone="secondary">
          같은 VU끼리 편차가 작다 (예: VU10 701 vs 710). 워밍업 후라 비교 신뢰도가
          이전 pool 실험보다 높다.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>4. 해석</H2>
        <H3>왜 VU를 늘리면 예매 성공이 줄까</H3>
        <Text>
          좌석 수는 한정적이고, 선점은 FOR UPDATE + 상태 전이로 직렬화된다. VU가
          늘면 같은 좌석을 동시에 노리는 요청이 늘어 holdConflict(409)가 폭증한다.
          실패한 시도도 조회·세션·선점 실패 경로를 타며 자원을 쓰므로, 성공
          사이클(예매→취소) 수는 오히려 줄어든다.
        </Text>
        <H3>RPS는 왜 올라가나</H3>
        <Text>
          RPS에는 좌석조회·세션·409 응답이 모두 포함된다. VU↑ → 짧은 실패
          요청이 많아져 요청/초는 늘지만, “의미 있는 예매 처리량”은 감소한다.
          티켓팅에서는 RPS만 보면 착시가 난다.
        </Text>
        <Table
          headers={["변화 (VU10→50)", "수치", "의미"]}
          rows={[
            [
              "예매 성공",
              `${fmt(measured[0].success, 0)} → ${fmt(measured[2].success, 0)} (−56%)`,
              "동시성↑가 성공 처리량↓",
            ],
            [
              "성공률",
              `${fmt(measured[0].successRate * 100, 1)}% → ${fmt(measured[2].successRate * 100, 1)}%`,
              "헛시도 비율 증가",
            ],
            [
              "holdConflict",
              `${fmt(measured[0].conflict, 0)} → ${fmt(measured[2].conflict, 0)}`,
              "락 경합 심화",
            ],
            [
              "p95",
              `${fmt(measured[0].p95, 0)}ms → ${fmt(measured[2].p95, 0)}ms (~3.2×)`,
              "대기·경합으로 지연 증가",
            ],
            [
              "RPS",
              `${fmt(measured[0].rps, 0)} → ${fmt(measured[2].rps, 0)}`,
              "요청량은 늘지만 품질↓",
            ],
          ]}
        />
        <Callout tone="success" title="인사이트">
          오픈런에서 “서버만 많이 붙이고 VU처럼 동시 접속만 키우는 것”과 비슷하게,
          좌석 락이 병목이면 동시성만 키워도 예매 성공은 늘지 않고 지연·충돌만
          커질 수 있다. 대기열·입장 제한·선점 대상 분산이 필요한 이유와 맞닿는다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>5. 워밍업과의 연결</H2>
        <Text>
          오늘은 사전 warmup 후 본측정을 했다. 같은 VU끼리 run 편차가 작아,
          “돌수록 빨라짐” 노이즈를 줄인 상태에서 VU 효과를 볼 수 있었다. 이전
          날짜에 배운 워밍업을 실험 방법에 반영한 점이 유효했다.
        </Text>
        <Table
          headers={["검증", "결과"]}
          rows={[
            ["cancelFailed", "전 run 0"],
            ["더블부킹", "관찰 없음 (성공=취소 건수 일치)"],
            ["정합성", "recycle 중에도 좌석 복구 안정"],
          ]}
        />
      </Stack>

      <Stack gap={12}>
        <H2>6. 한계</H2>
        <Table
          headers={["한계", "설명"]}
          rows={[
            ["로컬 단일 호스트", "절대 SLA·프로덕션 용량으로 해석 금지"],
            ["pool=5 고정", "풀이 작아 VU50에서 커넥션 대기도 섞일 수 있음"],
            ["좌석 수 고정", "seat 수가 늘면 곡선이 달라질 수 있음"],
            ["전체 HTTP p95", "조회·409가 포함되어 예매 API만의 지연은 희석"],
          ]}
        />
      </Stack>

      <Divider />
      <Text size="small" tone="secondary" style={{ color: theme.tokens.text.secondary }}>
        데이터: k6/results/summary-vu*-20260805-*.json · 작성 2026-08-05
      </Text>
    </Stack>
  );
}
