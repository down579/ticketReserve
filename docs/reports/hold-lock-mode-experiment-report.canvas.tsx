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

function pctDelta(from: number, to: number) {
  return ((to - from) / from) * 100;
}

/** VU50 · 비관적 · 2회 */
const pess50 = {
  rps: avg([836.2, 825.3]),
  p95: avg([232.4, 232.9]),
  wait: avg([232.3, 232.6]),
  booking: avg([733, 695]),
  conflict: avg([6960, 6935]),
  rate: avg([9.53, 9.11]),
};

/** VU50 · 낙관적 · 2회 */
const opt50 = {
  rps: avg([853.5, 903.7]),
  p95: avg([238.5, 238.6]),
  wait: avg([238.0, 238.4]),
  booking: avg([578, 604]),
  conflict: avg([7446, 7871]),
  rate: avg([7.2, 7.13]),
};

/** VU200 · 비관적 · 2회 */
const pess200 = {
  rps: avg([2177.6, 2239.6]),
  p95: avg([291.7, 292.1]),
  wait: avg([288.2, 285.8]),
  booking: avg([417, 454]),
  conflict: avg([21130, 21697]),
  rate: avg([1.93, 2.05]),
};

/** VU200 · 낙관적 · 2회 */
const opt200 = {
  rps: avg([2393.5, 2276.4]),
  p95: avg([284.6, 295.2]),
  wait: avg([279.0, 287.0]),
  booking: avg([458, 461]),
  conflict: avg([23248, 22038]),
  rate: avg([1.93, 2.04]),
};

const runs = [
  { name: "pess VU50 #1", mode: "pessimistic", vu: 50, rps: 836.2, p95: 232.4, booking: 733, conflict: 6960 },
  { name: "pess VU50 #2", mode: "pessimistic", vu: 50, rps: 825.3, p95: 232.9, booking: 695, conflict: 6935 },
  { name: "opt VU50 #1", mode: "optimistic", vu: 50, rps: 853.5, p95: 238.5, booking: 578, conflict: 7446 },
  { name: "opt VU50 #2", mode: "optimistic", vu: 50, rps: 903.7, p95: 238.6, booking: 604, conflict: 7871 },
  { name: "pess VU200 #1", mode: "pessimistic", vu: 200, rps: 2177.6, p95: 291.7, booking: 417, conflict: 21130 },
  { name: "pess VU200 #2", mode: "pessimistic", vu: 200, rps: 2239.6, p95: 292.1, booking: 454, conflict: 21697 },
  { name: "opt VU200 #1", mode: "optimistic", vu: 200, rps: 2393.5, p95: 284.6, booking: 458, conflict: 23248 },
  { name: "opt VU200 #2", mode: "optimistic", vu: 200, rps: 2276.4, p95: 295.2, booking: 461, conflict: 22038 },
];

export default function HoldLockModeExperimentReport() {
  const theme = useHostTheme();
  const bookingDelta50 = pctDelta(pess50.booking, opt50.booking);
  const conflictDelta50 = pctDelta(pess50.conflict, opt50.conflict);
  const p95Delta50 = pctDelta(pess50.p95, opt50.p95);
  const p95Delta200 = pctDelta(pess200.p95, opt200.p95);

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1040 }}>
      <Stack gap={8}>
        <H1>선점 락 전략 비교 실험 보고서</H1>
        <Text tone="secondary">
          2026-08-26 · booking-load-test · pessimistic vs optimistic · VU 50/200 · 30s · 각 2회 · Hikari pool=20 · CANCEL_AFTER_BOOK=true
        </Text>
        <Row gap={8}>
          <Pill tone="warning">VU50 성공 비관 &gt; 낙관 (~17%)</Pill>
          <Pill tone="info">전체 p95 거의 동일</Pill>
          <Pill tone="neutral">가설(낙관=빠르다) 기각</Pill>
        </Row>
      </Stack>

      <Callout tone="warning" title="핵심 결론">
        예매 end-to-end HTTP p95는 낙관/비관이 거의 같다(VU50 +2.5%, VU200 −0.7%).
        반면 VU50에서는 비관적 락이 예매 성공을 더 많이 가져가고(평균 714 vs 591),
        낙관적은 holdConflict가 약 10% 많다. 취소 재활용 부하에서는 “줄 서서 이어받기”가
        “즉시 409 후 재시도”보다 성공에 유리할 수 있다. 락 차이는 p95보다 성공·충돌 지표에 더 잘 드러난다.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat
          label="VU50 예매 성공 (비관→낙관)"
          value={`${fmt(pess50.booking, 0)}→${fmt(opt50.booking, 0)}`}
          tone="warning"
        />
        <Stat
          label="VU50 성공 변화"
          value={`${fmt(bookingDelta50, 1)}%`}
          tone="warning"
        />
        <Stat
          label="VU50 p95 변화"
          value={`${fmt(p95Delta50, 1)}%`}
          tone="info"
        />
        <Stat
          label="VU200 p95 변화"
          value={`${fmt(p95Delta200, 1)}%`}
          tone="info"
        />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 실험 설계</H2>
        <Table
          headers={["항목", "값"]}
          rows={[
            ["가설", "동일 부하에서 성공 건수는 유사, 낙관적은 p95·waiting이 낮고 비관적은 lock wait로 꼬리 지연↑"],
            ["변수", "ticket.seat-hold.lock-mode = pessimistic | optimistic"],
            ["비관적", "SELECT … FOR UPDATE + version CAS"],
            ["낙관적", "일반 SELECT + version CAS (경합 시 즉시 409)"],
            ["시나리오", "좌석맵 → 세션 → 선점 → 카트 → 예매 → 즉시 취소"],
            ["부하", "VU 50 / 200 · 30s · 모드별 2회"],
            ["풀", "Hikari maximum-pool-size=20"],
            ["기타", "virtual threads ON · seat-map cache ON · miss-delay-ms=200"],
            ["환경", "로컬 Windows · 앱+MySQL+Redis+k6 동일 호스트"],
          ]}
        />
        <Text tone="secondary">
          7/22 락 범위 실험은 예매 확정 경로의 FOR UPDATE 유무였다. 오늘은 선점(hold) 경로만 분리한 A/B다.
        </Text>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>2. VU50 결과 (2회 평균)</H2>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>예매 성공 건수</CardHeader>
            <CardBody>
              <BarChart
                categories={["pessimistic", "optimistic"]}
                series={[{ name: "예매 성공 (건)", data: [pess50.booking, opt50.booking] }]}
                height={200}
              />
              <Text tone="secondary" style={{ marginTop: 8 }}>
                Source: k6 summary · VU50 · 30s · 2-run avg · Y: 성공 건수
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>holdConflict</CardHeader>
            <CardBody>
              <BarChart
                categories={["pessimistic", "optimistic"]}
                series={[{ name: "holdConflict (건)", data: [pess50.conflict, opt50.conflict] }]}
                height={200}
              />
              <Text tone="secondary" style={{ marginTop: 8 }}>
                Source: k6 summary · VU50 · 30s · 2-run avg · Y: 충돌 건수
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["지표", "비관적", "낙관적", "낙관−비관"]}
          rows={[
            ["HTTP RPS", fmt(pess50.rps, 0), fmt(opt50.rps, 0), `${fmt(pctDelta(pess50.rps, opt50.rps), 1)}%`],
            ["HTTP p95 (ms)", fmt(pess50.p95, 1), fmt(opt50.p95, 1), `${fmt(p95Delta50, 1)}%`],
            ["waiting p95 (ms)", fmt(pess50.wait, 1), fmt(opt50.wait, 1), `${fmt(pctDelta(pess50.wait, opt50.wait), 1)}%`],
            ["예매 성공", fmt(pess50.booking, 0), fmt(opt50.booking, 0), `${fmt(bookingDelta50, 1)}%`],
            ["holdConflict", fmt(pess50.conflict, 0), fmt(opt50.conflict, 0), `${fmt(conflictDelta50, 1)}%`],
            ["성공률", `${fmt(pess50.rate, 1)}%`, `${fmt(opt50.rate, 1)}%`, `${fmt(opt50.rate - pess50.rate, 1)}pp`],
          ]}
        />
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>3. VU200 결과 (2회 평균)</H2>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>HTTP p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["pessimistic", "optimistic"]}
                series={[{ name: "HTTP p95", data: [pess200.p95, opt200.p95] }]}
                valueSuffix=" ms"
                height={200}
              />
              <Text tone="secondary" style={{ marginTop: 8 }}>
                Source: k6 summary · VU200 · 30s · 2-run avg · Y: latency (ms)
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>예매 성공 건수</CardHeader>
            <CardBody>
              <BarChart
                categories={["pessimistic", "optimistic"]}
                series={[{ name: "예매 성공 (건)", data: [pess200.booking, opt200.booking] }]}
                height={200}
              />
              <Text tone="secondary" style={{ marginTop: 8 }}>
                Source: k6 summary · VU200 · 30s · 2-run avg · Y: 성공 건수
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["지표", "비관적", "낙관적", "낙관−비관"]}
          rows={[
            ["HTTP RPS", fmt(pess200.rps, 0), fmt(opt200.rps, 0), `${fmt(pctDelta(pess200.rps, opt200.rps), 1)}%`],
            ["HTTP p95 (ms)", fmt(pess200.p95, 1), fmt(opt200.p95, 1), `${fmt(p95Delta200, 1)}%`],
            ["waiting p95 (ms)", fmt(pess200.wait, 1), fmt(opt200.wait, 1), `${fmt(pctDelta(pess200.wait, opt200.wait), 1)}%`],
            ["예매 성공", fmt(pess200.booking, 0), fmt(opt200.booking, 0), `${fmt(pctDelta(pess200.booking, opt200.booking), 1)}%`],
            ["holdConflict", fmt(pess200.conflict, 0), fmt(opt200.conflict, 0), `${fmt(pctDelta(pess200.conflict, opt200.conflict), 1)}%`],
            ["성공률", `${fmt(pess200.rate, 1)}%`, `${fmt(opt200.rate, 1)}%`, `${fmt(opt200.rate - pess200.rate, 1)}pp`],
          ]}
        />
        <Text tone="secondary">
          VU200에서는 성공·p95 모두 차이가 작다. 경합이 극단적이라 좌석 상한·409 폭증이
          락 전략 차이를 덮어쓴 구간으로 해석한다.
        </Text>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>4. Run별 원본</H2>
        <Table
          headers={["run", "mode", "VU", "RPS", "p95", "booking", "conflict"]}
          rows={runs.map((r) => [
            r.name,
            r.mode,
            String(r.vu),
            fmt(r.rps, 1),
            fmt(r.p95, 1),
            String(r.booking),
            String(r.conflict),
          ])}
        />
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>5. 해석</H2>
        <H3>가설 판정</H3>
        <Table
          headers={["가설", "결과", "판정"]}
          rows={[
            ["성공 건수는 유사", "VU50에서 비관이 ~17% 더 많음", "기각(조건부)"],
            ["낙관적 p95가 낮다", "VU50 +2.5% / VU200 −0.7%", "기각(관찰 불가)"],
            ["비관적 waiting이 길다", "전체 waiting p95도 거의 동일", "기각(end-to-end)"],
          ]}
        />

        <H3>왜 p95가 안 갈렸나</H3>
        <Text>
          k6가 측정한 것은 hold만이 아니라 좌석맵·세션·카트·확정·취소 전체다.
          락이 걸리는 구간은 선점 트랜잭션뿐이라 end-to-end p95에 묻힌다.
          또한 hold 트랜잭션이 짧아 FOR UPDATE 대기 시간이 길지 않았고,
          miss-delay-ms=200·캐시 TTL 등이 꼬리 지연 노이즈로 섞였다.
          결과 JSON의 steps.holdSeats도 null이라 hold 단독 p95는 이번에 못 봤다.
        </Text>

        <H3>왜 VU50에서 비관 성공이 더 많나</H3>
        <Text>
          CANCEL_AFTER_BOOK=true면 좌석이 금세 다시 AVAILABLE이 된다.
          비관적 락은 같은 행에 줄 서서 처리하므로, 앞선 요청이 예매→취소로 풀면
          대기 중이던 다음 요청이 그 좌석을 이어받을 여지가 있다.
          낙관적은 경합 시 즉시 409로 빠져 플로우를 처음부터 다시 타므로,
          같은 30초 안에 완료되는 성공은 줄고 conflict만 늘어난 것으로 보인다.
        </Text>

        <Callout tone="info" title="실무 시사점">
          “낙관적 락 = 항상 빠르다”는 성립하지 않는다. 핫시트 + 짧은 점유(홀드/취소) 패턴에서는
          비관적 직렬화가 성공 처리량에 유리할 수 있다. 낙관적은 실패가 싸고 재시도 정책이
          명확할 때, 경합이 낮은 분산 좌석에서 더 잘 맞는다. 지표는 p95만이 아니라
          성공 건수·충돌 수·재시도 비용을 같이 봐야 한다.
        </Callout>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>6. 한계 · 다음 실험</H2>
        <Table
          headers={["한계", "다음"]}
          rows={[
            ["hold 단계 latency 미분리", "k6에 holdSeats 태그 duration / summary 추가"],
            ["CANCEL_AFTER_BOOK=true만 측정", "false(고갈형)로 성공 상한 동일성 재확인"],
            ["miss-delay·캐시 노이즈", "miss-delay-ms=0, 캐시 고정 후 재측정"],
            ["핫시트 강제 없음", "동일 seatId 고정 타격으로 lock wait 극대화"],
            ["확정 경로 락은 고정", "booking FOR UPDATE와 hold 전략 교차 실험"],
          ]}
        />
        <Text tone="secondary" style={{ color: theme.textSecondary }}>
          원본: k6/results/summary-lock-{"{optimistic|pessimistic}"}-vu{"{50|200}"}-30s-20260826-*.json
        </Text>
      </Stack>
    </Stack>
  );
}
