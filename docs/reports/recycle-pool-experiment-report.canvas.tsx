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

/** 시간순 recycle runs (07-30) */
const runs = [
  { t: "22:01", pool: 20, success: 243, rps: 371, p95: 360, phase: "cold" },
  { t: "22:10", pool: 5, success: 204, rps: 367, p95: 247, phase: "warming" },
  { t: "22:14", pool: 5, success: 274, rps: 506, p95: 171, phase: "warm" },
  { t: "22:18", pool: 20, success: 242, rps: 382, p95: 320, phase: "mixed" },
  { t: "22:22", pool: 5, success: 266, rps: 463, p95: 182, phase: "warm" },
  { t: "22:24", pool: 20, success: 237, rps: 365, p95: 345, phase: "mixed" },
  { t: "22:27", pool: 20, success: 328, rps: 559, p95: 213, phase: "hot" },
  { t: "22:30", pool: 5, success: 236, rps: 450, p95: 183, phase: "warm" },
];

const pool5 = runs.filter((r) => r.pool === 5);
const pool20 = runs.filter((r) => r.pool === 20);

const warmPool5 = pool5.filter((r) => r.phase === "warm");
const hotPool20 = pool20.filter((r) => r.phase === "hot" || r.t === "22:27");

export default function RecyclePoolExperimentReport() {
  const theme = useHostTheme();

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1040 }}>
      <Stack gap={8}>
        <H1>예매→취소 재활용 실험 보고서</H1>
        <Text tone="secondary">
          2026-07-30 · CANCEL_AFTER_BOOK=true · VU50 / 30s · pool 5 vs 20 · 로컬 Mac
        </Text>
        <Row gap={8}>
          <Pill tone="info">좌석 재활용 시나리오</Pill>
          <Pill tone="success">워밍업 효과 확인</Pill>
          <Pill tone="warning">풀 크기 ≠ 무조건 성능</Pill>
        </Row>
      </Stack>

      <Callout tone="info" title="핵심 결론">
        예매 성공 후 즉시 취소하는 recycle 시나리오에서, 초반에는 pool-5가 더 좋아
        보였지만 워밍업이 진행될수록 수치가 전반적으로 개선되었다. 가장 뜨거운
        run(22:27 pool-20)은 예매 328건·RPS 559로 당일 최고치였다. 즉 “풀이
        작아서 빠르다”보다 “한 번 워밍업되면 제 성능이 나온다”가 오늘 실험의
        더 큰 인사이트다.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat label="총 recycle run" value="8" tone="info" />
        <Stat label="최고 예매 성공" value="328건" tone="success" />
        <Stat label="최고 RPS" value="559" tone="success" />
        <Stat label="취소 실패" value="0" tone="success" />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 실험 설계</H2>
        <Table
          headers={["항목", "값"]}
          rows={[
            ["시나리오", "좌석조회 → 세션 → 선점 → 카트 → 예매 → 즉시 취소"],
            ["목적", "좌석 고갈 없이 쓰기 경로(선점/예매/취소)에서 pool 영향 관찰"],
            ["VU / 기간", "50 / 30s"],
            ["풀 설정", "Hikari maximum-pool-size 5 vs 20"],
            ["환경", "앱+MySQL+k6 동일 호스트 (i5-5257U, 8GB)"],
          ]}
        />
        <Text tone="secondary">
          이전 고갈형 실험은 대부분 GET만 돌아 풀 효과가 희석됐다. 오늘은
          book→cancel로 좌석을 되돌려, 30초 내내 쓰기 API가 돌아가게 했다.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>2. 시간순 결과 (워밍업이 보인다)</H2>
        <Card>
          <CardHeader>예매 성공 건수 (시간순)</CardHeader>
          <CardBody>
            <BarChart
              categories={runs.map((r) => `${r.t}\np${r.pool}`)}
              series={[
                {
                  name: "booking.success",
                  data: runs.map((r) => r.success),
                },
              ]}
              height={220}
            />
            <Text size="small" tone="secondary">
              Source: k6 recycle · 07-30 · CANCEL_AFTER_BOOK=true
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>RPS (시간순)</CardHeader>
          <CardBody>
            <BarChart
              categories={runs.map((r) => `${r.t}\np${r.pool}`)}
              series={[{ name: "RPS", data: runs.map((r) => r.rps) }]}
              height={220}
            />
          </CardBody>
        </Card>
        <Table
          headers={["시각", "pool", "예매 성공", "RPS", "p95", "상태 해석"]}
          columnAlign={["left", "right", "right", "right", "right", "left"]}
          rows={runs.map((r) => [
            r.t,
            String(r.pool),
            String(r.success),
            String(r.rps),
            `${r.p95}ms`,
            r.phase === "cold"
              ? "콜드 스타트"
              : r.phase === "hot"
                ? "워밍업 후 최고"
                : r.phase === "warm"
                  ? "워밍업됨"
                  : "중간",
          ])}
        />
        <Callout tone="success" title="워밍업 관찰">
          같은 pool-5인데 22:10(RPS 367) → 22:14(RPS 506)으로 뛰었다. pool-20도
          초반 360~345ms p95에서, 22:27에는 p95 213ms·RPS 559까지 개선됐다.
          “돌수록 빨라진다”는 감각은 데이터와 일치한다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>3. pool 5 vs 20 — 어떻게 읽어야 하나</H2>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>pool-5 평균 (4 runs)</CardHeader>
            <CardBody>
              <Stack gap={8}>
                <Text>예매 성공 avg: {fmt(avg(pool5.map((r) => r.success)), 0)}건</Text>
                <Text>RPS avg: {fmt(avg(pool5.map((r) => r.rps)), 0)}</Text>
                <Text>p95 avg: {fmt(avg(pool5.map((r) => r.p95)), 0)}ms</Text>
              </Stack>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>pool-20 평균 (4 runs)</CardHeader>
            <CardBody>
              <Stack gap={8}>
                <Text>예매 성공 avg: {fmt(avg(pool20.map((r) => r.success)), 0)}건</Text>
                <Text>RPS avg: {fmt(avg(pool20.map((r) => r.rps)), 0)}</Text>
                <Text>p95 avg: {fmt(avg(pool20.map((r) => r.p95)), 0)}ms</Text>
              </Stack>
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["비교 축", "관찰", "해석"]}
          rows={[
            [
              "초반 (cold/mixed)",
              "pool-5 p95·체감이 유리",
              "워밍업 + 동시 트랜잭션 수↓로 락 대기열이 짧아 보일 수 있음",
            ],
            [
              "후반 (warm/hot)",
              "pool-20 최고치(328건, RPS 559)",
              "워밍업 후엔 커넥션 여유가 처리량에 도움될 수 있음",
            ],
            [
              "평균만 보면",
              "pool-5 p95 평균이 더 낮음",
              "콜드 run이 pool-20 평균을 끌어내림 → 단독 결론 위험",
            ],
            [
              "정합성",
              "cancelFailed=0, 더블부킹 없음",
              "recycle 중에도 취소·좌석 복구가 안정적",
            ],
          ]}
        />
        <Callout tone="warning" title="주의">
          “pool 5가 무조건 더 좋다”고 단정하면 안 된다. 오늘 데이터는 워밍업
          효과가 풀 효과보다 크게 보인다. 공정 비교는 워밍업 run을 제외하거나,
          동일 워밍업 후 ABBA로 봐야 한다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>4. 왜 워밍업이 필요한가</H2>
        <Table
          headers={["계층", "워밍업 내용"]}
          rows={[
            ["JVM", "JIT가 핫 경로를 컴파일 → 초반보다 중반이 빠름"],
            ["MySQL", "InnoDB buffer pool에 좌석/인덱스 페이지 적재"],
            ["OS", "페이지 캐시에 자주 쓰는 블록 유지"],
            ["커넥션 풀", "Hikari가 이미 연결을 열어 둔 상태"],
            ["앱 캐시", "메타데이터·플랜 캐시 등 준비"],
          ]}
        />
        <Text>
          티켓팅처럼 오픈 순간에 트래픽이 몰리면, “콜드 상태로 오픈”하면 오늘
          22:01처럼 p95가 높게 나올 수 있다. 그래서 실서비스에서는 오픈 전에
          의도적으로 트래픽을 흘려 워밍업하는 경우가 많다.
        </Text>
      </Stack>

      <Stack gap={12}>
        <H2>5. AWS에도 pre-warming이 있나?</H2>
        <Text>
          있다. 다만 이름이 서비스마다 다르고, “버튼을 하나 누르면 끝나는
          마법”보다는 계층별 준비에 가깝다.
        </Text>
        <Table
          headers={["AWS / 실무", "무엇을 워밍업하나"]}
          rows={[
            [
              "Lambda Provisioned Concurrency",
              "실행 환경을 미리 띄워 콜드 스타트 제거 (가장 유명한 pre-warm)",
            ],
            [
              "ALB Slow Start",
              "새 타겟에 트래픽을 서서히 올려 워밍업",
            ],
            [
              "Auto Scaling / 최소 용량",
              "오픈 전 EC2/ECS 태스크를 미리 늘려 둠",
            ],
            [
              "RDS / RDS Proxy",
              "버퍼 풀·프록시 커넥션을 미리 채움 (합성 트래픽 + 풀 설정)",
            ],
            [
              "ElastiCache",
              "캐시 키를 미리 채우는 cache warming",
            ],
            [
              "앱 레벨 (가장 중요)",
              "오픈 N분 전 헬스체크·좌석조회·더미 예매로 JIT/DB/캐시 예열",
            ],
          ]}
        />
        <Callout tone="info" title="티켓팅에 대입하면">
          AWS “pre-warm 버튼” 하나보다, 오픈 전 합성 트래픽으로 좌석맵·선점
          경로를 예열하고, 인스턴스/커넥션 풀/캐시를 미리 채워 두는 조합이
          실무에 가깝다. 오늘 로컬 실험이 보여준 것도 그 필요성이다.
        </Callout>
      </Stack>

      <Stack gap={12}>
        <H2>6. 오늘 실험으로 말할 수 있는 것</H2>
        <Table
          headers={["주장", "근거"]}
          rows={[
            [
              "recycle 시나리오는 pool 실험에 유효하다",
              "예매 성공 200~300건대, 취소 실패 0",
            ],
            [
              "워밍업이 성능에 큰 영향을 준다",
              "동일 pool에서도 run 간 RPS·p95 차이 큼",
            ],
            [
              "pool을 키운다고 항상 좋아지지 않는다",
              "초반 pool-20은 락 경합·콜드로 불리해 보임",
            ],
            [
              "워밍업 후에는 pool-20도 강하다",
              "22:27: 328건 / RPS 559 / p95 213ms",
            ],
          ]}
        />
        <H3>한계</H3>
        <Text>
          단일 호스트·CPU 열·변수(풀 변경 시 서버 재시작)가 섞여 절대 SLA로는
          쓸 수 없다. 다만 “설정 변경 + 워밍업이 동시 예매에 미치는 영향
          이해”라는 목적에는 충분하다.
        </Text>
      </Stack>

      <Divider />
      <Text size="small" tone="secondary" style={{ color: theme.tokens.text.secondary }}>
        데이터: k6/results/summary-pool-*-recycle-*-20260730-*.json · 작성 2026-07-30
      </Text>
    </Stack>
  );
}
