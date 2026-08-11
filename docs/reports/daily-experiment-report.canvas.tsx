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

const lockReduced = { label: "락 축소", p95: 170.9, waitingP95: 151.1, rps: 795.4, success: 8, holdConflict: 175 };
const pessimistic = { label: "비관적 락", p95: 198.7, waitingP95: 173.8, rps: 696.0, success: 8, holdConflict: 171 };

const pool5Runs = [
  { p95: 164.8, waitingP95: 164.7, rps: 540.7, success: 8 },
  { p95: 136.7, waitingP95: 136.5, rps: 634.8, success: 8 },
  { p95: 141.0, waitingP95: 140.9, rps: 623.8, success: 8 },
];

const pool20RetestRuns = [
  { p95: 249.1, waitingP95: 233.5, rps: 549.4, success: 8 },
  { p95: 180.4, waitingP95: 150.9, rps: 716.1, success: 8 },
  { p95: 178.9, waitingP95: 144.7, rps: 712.9, success: 8 },
];

const pool5Avg = {
  p95: avg(pool5Runs.map((r) => r.p95)),
  waitingP95: avg(pool5Runs.map((r) => r.waitingP95)),
  rps: avg(pool5Runs.map((r) => r.rps)),
};

const pool20Avg = {
  p95: avg(pool20RetestRuns.map((r) => r.p95)),
  waitingP95: avg(pool20RetestRuns.map((r) => r.waitingP95)),
  rps: avg(pool20RetestRuns.map((r) => r.rps)),
};

const pool20Stable = {
  p95: avg([pool20RetestRuns[1].p95, pool20RetestRuns[2].p95]),
  waitingP95: avg([pool20RetestRuns[1].waitingP95, pool20RetestRuns[2].waitingP95]),
  rps: avg([pool20RetestRuns[1].rps, pool20RetestRuns[2].rps]),
};

export default function DailyExperimentReport() {
  const theme = useHostTheme();

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1000 }}>
      <Stack gap={8}>
        <H1>ticketReserve 동시 예매 실험 종합 보고서</H1>
        <Text tone="secondary">
          2026-07-22 ~ 07-28 · k6 VU50 / 30s · 로컬 Mac (i5-5257U, 8GB) · k6 미분리
        </Text>
        <Row gap={8}>
          <Pill tone="info">목적: 설정 변경 영향 이해</Pill>
          <Pill tone="success">정합성 검증 완료</Pill>
          <Pill tone="warning">절대 SLA 아님</Pill>
        </Row>
      </Stack>

      <Callout tone="info" title="핵심 결론">
        모든 실험에서 예매 성공은 8건(가용 좌석 상한) 이내였고 더블부킹은 없었다.
        락 축소는 비관적 락 대비 p95 약 16% 개선. pool-20 재실험(3회)에서는 run 2·3이
        ~179ms로 안정화되었으나, pool-5 평균(~148ms)보다는 높았다. 로컬 단일 호스트
        환경이므로 상대 비교·trade-off 이해가 목적이다.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat label="총 실험 run" value="12+" tone="info" />
        <Stat label="락 p95 차이" value="+28ms" tone="warning" />
        <Stat label="pool-20 재실험" value="3 runs" tone="info" />
        <Stat label="예매 성공(최대)" value="8건" tone="success" />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 실험 목적 및 환경</H2>
        <Text>
          Spring Boot + MySQL 티켓 예매 시스템에서 동시 50명이 30초간 좌석 선점·예매를
          시도하는 k6 부하 테스트. 프로덕션 용량 산정이 아니라, 락 전략·격리 수준·
          커넥션 풀 변경이 동시 예매에 미치는 영향을 이해하는 것이 목적이다.
        </Text>
        <Table
          headers={["항목", "값"]}
          rows={[
            ["시나리오", "좌석조회 → 세션 → 선점 → 카트 → 예매"],
            ["VU / 기간", "50 / 30s (constant-vus)"],
            ["좌석", "salesId=1, seatGrade=R, 1석/유저"],
            ["쓰기 격리", "REPEATABLE READ"],
            ["조회 격리 (07-28~)", "READ COMMITTED"],
            ["환경 한계", "앱 + MySQL + k6 동일 PC, CPU 열·메모리 영향 가능"],
          ]}
        />
      </Stack>

      <Stack gap={12}>
        <H2>2. 실험 ① 락 범위 (07-22, pool=10)</H2>
        <Text tone="secondary">
          예매 확정에서 SELECT FOR UPDATE 사용 여부. 가장 일관된 결과가 나온 실험.
        </Text>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>HTTP p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["p95"]}
                series={[
                  { name: lockReduced.label, data: [lockReduced.p95] },
                  { name: pessimistic.label, data: [pessimistic.p95] },
                ]}
                height={180}
              />
              <Text size="small" tone="secondary">Source: k6 · VU50/30s · 07-22</Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>waiting p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["waiting p95"]}
                series={[
                  { name: lockReduced.label, data: [lockReduced.waitingP95] },
                  { name: pessimistic.label, data: [pessimistic.waitingP95] },
                ]}
                height={180}
              />
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["지표", "락 축소", "비관적 락", "영향"]}
          columnAlign={["left", "right", "right", "left"]}
          rows={[
            ["HTTP p95", "170.9ms", "198.7ms", "FOR UPDATE 대기 ↑ (~16%)"],
            ["waiting p95", "151.1ms", "173.8ms", "lock wait 증가"],
            ["RPS", "795", "696", "처리량 ~12% 감소"],
            ["예매 성공", "8", "8", "동일"],
            ["선점 충돌", "175", "171", "거의 동일"],
          ]}
        />
        <Callout tone="success" title="인사이트">
          조건부 UPDATE(락 축소)로도 정합성은 유지되며, 비관적 락보다 대기·지연이
          적다. 동시 예매에서 가장 명확한 trade-off를 보여준 실험.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>3. 실험 ② 커넥션 풀 5 vs 20 (07-28, 재실험 포함)</H2>
        <Text tone="secondary">
          pool-5: 3회 · pool-20 재실험: 3회 (cancel-all 후 동일 조건). VU 50 &gt; pool 5
          이면 커넥션 대기가 예상되나, 로컬 환경 노이즈 존재.
        </Text>
        <Card>
          <CardHeader>HTTP p95 (ms) — run별 비교</CardHeader>
          <CardBody>
            <BarChart
              categories={["Run 1", "Run 2", "Run 3"]}
              series={[
                { name: "pool-5", data: pool5Runs.map((r) => r.p95) },
                { name: "pool-20 (재실험)", data: pool20RetestRuns.map((r) => r.p95) },
              ]}
              height={220}
            />
            <Text size="small" tone="secondary">
              Source: k6 · VU50/30s · pool-5 (3 runs) vs pool-20-retest (3 runs)
            </Text>
          </CardBody>
        </Card>
        <Table
          headers={["구분", "p95 평균", "waiting p95 평균", "RPS 평균", "예매 성공"]}
          columnAlign={["left", "right", "right", "right", "right"]}
          rows={[
            ["pool-5 (3 runs)", `${fmt(pool5Avg.p95)}ms`, `${fmt(pool5Avg.waitingP95)}ms`, fmt(pool5Avg.rps, 0), "8 (매 run)"],
            ["pool-20 재실험 (3 runs)", `${fmt(pool20Avg.p95)}ms`, `${fmt(pool20Avg.waitingP95)}ms`, fmt(pool20Avg.rps, 0), "8 (매 run)"],
            ["pool-20 run 2·3만", `${fmt(pool20Stable.p95)}ms`, `${fmt(pool20Stable.waitingP95)}ms`, fmt(pool20Stable.rps, 0), "8"],
          ]}
        />
        <Table
          headers={["Run", "pool-5 p95", "pool-20 p95", "비고"]}
          columnAlign={["left", "right", "right", "left"]}
          rows={[
            ["#1", "164.8ms", "249.1ms", "pool-20 1회차 이상치"],
            ["#2", "136.7ms", "180.4ms", "둘 다 안정 구간"],
            ["#3", "141.0ms", "178.9ms", "둘 다 안정 구간"],
          ]}
        />
        <Callout tone="warning" title="pool 실험 해석">
          pool-20 1회차(249ms)가 끌어올려 평균이 높아짐. run 2·3은 ~179ms로 락
          실험(비관적 199ms)과 유사. pool-5 평균(~148ms)이 더 낮게 나왔으나, 이 PC에서는
          CPU·열 상태 영향으로 pool 크기 효과만으로 단정하기 어렵다. 정합성(성공 8건)은
          모든 run 동일.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>4. 실험 ③ READ COMMITTED 조회 (07-28)</H2>
        <Table
          headers={["Run", "p95", "RPS", "예매 성공", "비고"]}
          columnAlign={["left", "right", "right", "right", "left"]}
          rows={[
            ["#1", "266.8ms", "467", "0", "좌석 이미 소진"],
            ["#2", "238.8ms", "516", "8", "정상"],
          ]}
        />
        <Callout tone="neutral" title="인사이트">
          조회만 READ COMMITTED로 바꿔도 전체 p95에 큰 개선은 없었다. 병목은 조회
          격리보다 선점·예매 락 경합 쪽.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>5. 동시성·정합성 (전 실험 공통)</H2>
        <Table
          headers={["검증 항목", "결과"]}
          rows={[
            ["더블부킹", "관찰 없음 — 예매 성공 ≤ 8건"],
            ["선점 충돌(409)", "다수 발생 (정상 경쟁)"],
            ["대부분 실패 원인", "좌석 고갈 후 루프 조기 종료"],
            ["방어 메커니즘", "FOR UPDATE + version + active_seat_id UNIQUE"],
          ]}
        />
      </Stack>

      <Stack gap={12}>
        <H2>6. 설정별 영향 요약</H2>
        <Table
          headers={["변경", "관찰", "신뢰도", "권고"]}
          rows={[
            ["락 축소", "p95 ↓, RPS ↑, 정합성 동일", "높음", "성능·정합성 균형 양호"],
            ["비관적 락", "p95 ↑, lock wait ↑", "높음", "안전하지만 대기 증가"],
            ["조회 RC", "전체 p95 큰 변화 없음", "중간", "신선도 목적이면 유지 가능"],
            ["pool 5 vs 20", "평균상 pool-5 낮음, run 편차 큼", "낮음", "방향만 참고"],
          ]}
        />
      </Stack>

      <Stack gap={12}>
        <H2>7. 한계</H2>
        <Table
          headers={["한계", "설명"]}
          rows={[
            ["단일 호스트", "앱·DB·k6·IDE 동시 실행, k6 분리 불가"],
            ["CPU 열", "run 순서·시간에 따라 p95 흔들림"],
            ["좌석 20 vs VU 50", "성공 표본 작음(최대 8건)"],
            ["pool 실험", "07-28 초기 pool-20 run(342ms)은 재실험에서 개선됨"],
          ]}
        />
        <H3>이 실험으로 말할 수 있는 것</H3>
        <Text>
          동시 예매 시 더블부킹 없이 경쟁이 처리된다. 비관적 락은 대기를 늘리고,
          락 축소는 같은 정합성 하에 더 빠르다. pool·격리 수준은 이 환경에서는
          trade-off 방향만 참고한다.
        </Text>
      </Stack>

      <Divider />
      <Text size="small" tone="secondary" style={{ color: theme.tokens.text.secondary }}>
        데이터: k6/results/summary-*.json · 최종 갱신 2026-07-28 (pool-20 재실험 3회 반영)
      </Text>
    </Stack>
  );
}
