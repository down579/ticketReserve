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
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  useHostTheme,
} from "cursor/canvas";

const reduced = {
  label: "락 범위 축소",
  file: "summary-vu50-test-vu50-30s-20260722-222834.json",
  savedAt: "2026-07-22 22:28:34 KST",
  p95: 170.95,
  avg: 57.7,
  med: 41.26,
  p90: 116.34,
  max: 805.45,
  waitingP95: 151.1,
  rps: 795.41,
  requests: 23893,
  iterations: 23511,
  bookingSuccess: 8,
  holdSuccess: 8,
  holdConflict: 175,
  bookingFailed: 23503,
};

const pessimistic = {
  label: "비관적 락 (FOR UPDATE)",
  file: "summary-vu50-test-vu50-30s-20260722-223304.json",
  savedAt: "2026-07-22 22:33:04 KST",
  p95: 198.74,
  avg: 65.3,
  med: 45.85,
  p90: 134.53,
  max: 832.09,
  waitingP95: 173.85,
  rps: 695.97,
  requests: 20905,
  iterations: 20531,
  bookingSuccess: 8,
  holdSuccess: 8,
  holdConflict: 171,
  bookingFailed: 20523,
};

function pctDelta(a: number, b: number) {
  return ((b - a) / a) * 100;
}

export default function LockScopeExperimentReport() {
  const theme = useHostTheme();
  const p95Delta = pctDelta(reduced.p95, pessimistic.p95);
  const rpsDelta = pctDelta(reduced.rps, pessimistic.rps);
  const waitDelta = pctDelta(reduced.waitingP95, pessimistic.waitingP95);

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 960 }}>
      <Stack gap={8}>
        <H1>예매 락 범위 비교 실험 보고서</H1>
        <Text tone="secondary">
          ticketReserve · k6 VU50 / 30초 · 동일 시나리오 2회 실행 비교
        </Text>
        <Row gap={8}>
          <Pill tone="info">락 축소 p95 170.9ms</Pill>
          <Pill tone="neutral">비관적 락 p95 198.7ms</Pill>
          <Pill tone="warning">p95 +16.3%</Pill>
        </Row>
      </Stack>

      <Callout tone="info" title="한 줄 결론">
        예매 성공·선점 충돌 수는 거의 동일하지만, 비관적 락(FOR UPDATE)을 다시
        적용하면 HTTP p95가 약 28ms(+16%) 느려지고 RPS는 약 12% 감소했다.
        정합성은 유지하면서 처리량·지연은 락 범위 축소가 유리하다.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat
          label="p95 차이"
          value={`+${(pessimistic.p95 - reduced.p95).toFixed(1)}ms`}
          tone="warning"
        />
        <Stat
          label="p95 변화율"
          value={`+${p95Delta.toFixed(1)}%`}
          tone="warning"
        />
        <Stat
          label="RPS 변화"
          value={`${rpsDelta.toFixed(1)}%`}
          tone="danger"
        />
        <Stat label="예매 성공" value="8 = 8" tone="success" />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 실험 조건</H2>
        <Table
          headers={["항목", "값"]}
          rows={[
            ["시나리오", "좌석조회 → 세션 → 선점 → 카트 → 예매"],
            ["동시 유저 (VU)", "50"],
            ["지속 시간", "30초"],
            ["좌석/유저", "1석 · seatGrade=R · salesId=1"],
            ["실험 A", `${reduced.label} · ${reduced.savedAt}`],
            ["실험 B", `${pessimistic.label} · ${pessimistic.savedAt}`],
            ["결과 파일 A", reduced.file],
            ["결과 파일 B", pessimistic.file],
          ]}
        />
        <Text size="small" tone="secondary">
          실험 A: 예매 확정에서 SELECT FOR UPDATE 제거, 조건부 UPDATE로 카트/좌석
          전환. 실험 B: 카트·좌석 SELECT FOR UPDATE 복구.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>2. 성능 비교</H2>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>HTTP 응답시간 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["avg", "med", "p90", "p95"]}
                series={[
                  {
                    name: reduced.label,
                    data: [reduced.avg, reduced.med, reduced.p90, reduced.p95],
                  },
                  {
                    name: pessimistic.label,
                    data: [
                      pessimistic.avg,
                      pessimistic.med,
                      pessimistic.p90,
                      pessimistic.p95,
                    ],
                  },
                ]}
                height={220}
              />
              <Spacer height={8} />
              <Text size="small" tone="secondary">
                Source: k6 summary · durationMs · VU50 / 30s
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>처리량 (RPS)</CardHeader>
            <CardBody>
              <BarChart
                categories={["requests/sec"]}
                series={[
                  { name: reduced.label, data: [reduced.rps] },
                  { name: pessimistic.label, data: [pessimistic.rps] },
                ]}
                height={220}
              />
              <Spacer height={8} />
              <Text size="small" tone="secondary">
                Source: k6 summary · http.rps · VU50 / 30s
              </Text>
            </CardBody>
          </Card>
        </Grid>

        <Table
          headers={["지표", "락 축소", "비관적 락", "차이"]}
          columnAlign={["left", "right", "right", "right"]}
          rows={[
            [
              "avg (ms)",
              reduced.avg.toFixed(1),
              pessimistic.avg.toFixed(1),
              `+${(pessimistic.avg - reduced.avg).toFixed(1)}`,
            ],
            [
              "med (ms)",
              reduced.med.toFixed(1),
              pessimistic.med.toFixed(1),
              `+${(pessimistic.med - reduced.med).toFixed(1)}`,
            ],
            [
              "p90 (ms)",
              reduced.p90.toFixed(1),
              pessimistic.p90.toFixed(1),
              `+${(pessimistic.p90 - reduced.p90).toFixed(1)}`,
            ],
            [
              "p95 (ms)",
              reduced.p95.toFixed(1),
              pessimistic.p95.toFixed(1),
              `+${(pessimistic.p95 - reduced.p95).toFixed(1)} (+${p95Delta.toFixed(1)}%)`,
            ],
            [
              "waiting p95 (ms)",
              reduced.waitingP95.toFixed(1),
              pessimistic.waitingP95.toFixed(1),
              `+${(pessimistic.waitingP95 - reduced.waitingP95).toFixed(1)} (+${waitDelta.toFixed(1)}%)`,
            ],
            [
              "RPS",
              reduced.rps.toFixed(1),
              pessimistic.rps.toFixed(1),
              `${(pessimistic.rps - reduced.rps).toFixed(1)} (${rpsDelta.toFixed(1)}%)`,
            ],
            [
              "총 요청 수",
              String(reduced.requests),
              String(pessimistic.requests),
              String(pessimistic.requests - reduced.requests),
            ],
          ]}
        />
      </Stack>

      <Stack gap={12}>
        <H2>3. 동시성·정합성</H2>
        <Table
          headers={["지표", "락 축소", "비관적 락", "해석"]}
          columnAlign={["left", "right", "right", "left"]}
          rows={[
            [
              "예매 성공",
              String(reduced.bookingSuccess),
              String(pessimistic.bookingSuccess),
              "동일 — 가용 좌석 상한 내에서 성공",
            ],
            [
              "선점 성공",
              String(reduced.holdSuccess),
              String(pessimistic.holdSuccess),
              "동일",
            ],
            [
              "선점 충돌(409)",
              String(reduced.holdConflict),
              String(pessimistic.holdConflict),
              "거의 동일 — 경쟁 실패 패턴 유사",
            ],
            [
              "예매 실패",
              String(reduced.bookingFailed),
              String(pessimistic.bookingFailed),
              "대부분 좌석 고갈 후 루프 실패",
            ],
          ]}
        />
        <Callout tone="success" title="정합성">
          두 방식 모두 예매 성공 8건·선점 성공 8건으로, 이번 부하에서는 더블부킹
          없이 동등한 안전성을 보였다. 차이는 지연·처리량에 집중된다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>4. 원인 분석</H2>
        <H3>왜 비관적 락이 더 느린가</H3>
        <Text>
          예매 확정에서 카트·좌석에 SELECT … FOR UPDATE를 걸면, 트랜잭션이 끝날
          때까지 row lock을 유지한다. 같은 리소스에 대한 동시 접근 시 lock wait가
          쌓이고, k6의 http_req_waiting p95가 151ms → 174ms로 증가한 점이 이를
          뒷받침한다.
        </Text>
        <Spacer height={8} />
        <H3>왜 락 축소가 더 빠른가</H3>
        <Text>
          락 없이 검증한 뒤 조건부 UPDATE(카트 ACTIVE→CONVERTED, 좌석 HOLD→SOLD)로
          원자성을 확보하면, 잠금 구간이 짧아져 대기열이 줄어든다. 실패 시에는
          UPDATE 영향 행 수 0으로 409를 반환하고 트랜잭션 롤백으로 정합성을
          유지한다.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>5. 한계 및 권고</H2>
        <Table
          headers={["구분", "내용"]}
          rows={[
            [
              "한계",
              "각 조건 1회 측정. JVM 워밍업·DB 상태·좌석 잔여에 따른 분산 가능",
            ],
            [
              "한계",
              "전체 HTTP p95에는 좌석조회 요청이 많이 포함되어 예매 API만의 지연은 희석됨",
            ],
            [
              "권고",
              "동일 조건 2~3회 반복 후 평균/분산 확인",
            ],
            [
              "권고",
              "step 태그별(hold_seats, confirm_booking) p95를 분리 저장하면 원인 분석이 더 정확",
            ],
            [
              "권고",
              "성능 우선 시 락 축소 유지, 운영 안정성 검증 후 채택 여부 결정",
            ],
          ]}
        />
      </Stack>

      <Divider />
      <Text size="small" tone="secondary" style={{ color: theme.tokens.textSecondary }}>
        작성: 2026-07-22 · 데이터 소스: k6/results/summary-vu50-test-vu50-30s-*.json
      </Text>
    </Stack>
  );
}
