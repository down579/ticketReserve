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

/** 8/31 유효 run (#2~#4) */
const validRuns = [
  { name: "#2 21:53", rps: 10457, p95: 31.4, max: 7802, success: 1882555 },
  { name: "#3 21:59", rps: 10963, p95: 28.2, max: 2903, success: 1973356 },
  { name: "#4 22:03", rps: 13561, p95: 22.3, max: 3984, success: 2441110 },
];

const failedRun = {
  name: "#1 21:42",
  note: "클러스터 미준비 · 성공 0건 · 분석 제외",
  failed: 11883,
};

const validAvg = {
  rps: avg(validRuns.map((r) => r.rps)),
  p95: avg(validRuns.map((r) => r.p95)),
  max: avg(validRuns.map((r) => r.max)),
};

/** 8/24 참고 (1인스턴스) */
const refLocalSf = {
  label: "8/24 local SF · 1대",
  rps: avg([7890, 7511]),
  p95: avg([39.4, 40.9]),
  max: avg([987, 3926]),
};

const refStampede = {
  label: "8/24 none · 1대",
  rps: 1479,
  p95: 166.9,
};

export default function RedisDistributedLockExperimentReport() {
  const theme = useHostTheme();

  return (
    <Stack gap={24} style={{ padding: 24, maxWidth: 1040 }}>
      <Stack gap={8}>
        <H1>Redis 분산 락 실험 보고서 (PoC)</H1>
        <Text tone="secondary">
          2026-08-31 · coordinator=redis · 3인스턴스(8080~8082) · VU200 · 3m ·
          Hikari pool=5 · TTL 30s · miss-delay=200ms · k6 seats-load-test
        </Text>
        <Row gap={8}>
          <Pill tone="info">PoC · redis만 측정</Pill>
          <Pill tone="success">유효 run p95 ~27ms</Pill>
          <Pill tone="warning">none/local A/B 미실시</Pill>
        </Row>
      </Stack>

      <Callout tone="info" title="핵심 결론">
        앱 3대 + Redis SET NX 분산 락으로 좌석맵 miss 조율 PoC를 완료했다. 유효 3회
        run(#2~#4)는 성공률 100%, 평균 RPS ~11.7k, p95 ~27ms였다. 8/24 single-flight
        1대(~7.7k RPS, p95 ~40ms)보다 처리량·지연이 양호했다. 다만 none/local과의
        동시 A/B는 없어 “클러스터 전체 miss=1”은 k6만으로는 미증명이며, Grafana
        lock_acquired / miss 카운터로 보강하는 것이 좋다.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat label="유효 run" value="3 / 4" tone="info" />
        <Stat label="평균 RPS" value={fmt(validAvg.rps / 1000, 1) + "k"} tone="success" />
        <Stat label="평균 p95" value={fmtMs(validAvg.p95, 0)} tone="success" />
        <Stat label="인스턴스" value="3" tone="info" />
      </Grid>

      <Divider />

      <Stack gap={12}>
        <H2>1. 실험 설계</H2>
        <Table
          headers={["항목", "값"]}
          rows={[
            ["목적", "멀티 인스턴스 환경에서 Redis 분산 락으로 캐시 miss DB 중복 로드 방지 PoC"],
            ["coordinator", "redis — SET key token NX EX + Lua token 해제"],
            ["대기 실패 시", "캐시 폴링(50ms) 최대 10s, timeout 시 500"],
            ["부하", "VU 200 · 3m · BASE_URLS 3노드 라운드로빈"],
            ["캐시", "TTL 30s · miss-delay-ms 200"],
            ["풀", "Hikari maximum-pool-size=5 (인스턴스당)"],
            ["기동", "bootJar 1회 + java -jar ×3 (run-cluster.ps1)"],
            ["미실시", "coordinator none / local 동일 조건 A/B"],
          ]}
        />
        <Text tone="secondary">
          JVM local single-flight(8/24)는 프로세스 1대만 통한다. 오늘은 Redis를
          중앙 조율자로 두어 3대가 동시 miss여도 리더 1명만 DB를 치도록 설계했다.
        </Text>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>2. Run별 결과</H2>
        <Table
          headers={["run", "성공", "RPS", "p95 (ms)", "max (ms)", "비고"]}
          rows={[
            [failedRun.name, "0", "—", "—", "—", failedRun.note],
            ...validRuns.map((r) => [
              r.name,
              r.success.toLocaleString(),
              fmt(r.rps, 0),
              fmt(r.p95, 1),
              fmt(r.max, 0),
              r.name === "#4 22:03" ? "워밍업 후 최고 RPS" : "유효",
            ]),
          ]}
        />
        <Callout tone="warning" title="#1 run 제외">
          21:42 run은 HTTP 200이 0건이다. 8080 점유·클러스터 미기동 등 환경 이슈로
          보이며, duration 0ms는 연결 실패 패턴이다. 이후 run부터 정상화되었다.
        </Callout>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>3. 유효 run 요약 vs 8/24 참고</H2>
        <Grid columns={2} gap={16}>
          <Card>
            <CardHeader>HTTP p95 (ms)</CardHeader>
            <CardBody>
              <BarChart
                categories={["오늘 redis 3대 (avg)", refLocalSf.label, refStampede.label]}
                series={[{ name: "p95 (ms)", data: [validAvg.p95, refLocalSf.p95, refStampede.p95] }]}
                valueSuffix=" ms"
                height={200}
              />
              <Text tone="secondary" style={{ marginTop: 8 }}>
                Source: k6 summary · VU200 · 3m · 오늘 #2~#4 avg
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader>HTTP RPS</CardHeader>
            <CardBody>
              <BarChart
                categories={["오늘 redis 3대 (avg)", refLocalSf.label, refStampede.label]}
                series={[{ name: "RPS", data: [validAvg.rps, refLocalSf.rps, refStampede.rps] }]}
                height={200}
              />
              <Text tone="secondary" style={{ marginTop: 8 }}>
                3노드 분산 + hit 비중 ↑ · 조건 상이(인스턴스 수) 주의
              </Text>
            </CardBody>
          </Card>
        </Grid>
        <Table
          headers={["구간", "RPS", "p95", "해석"]}
          rows={[
            ["오늘 redis · 3대 avg", fmt(validAvg.rps, 0), fmtMs(validAvg.p95, 1), "PoC 정상 구간"],
            [refLocalSf.label, fmt(refLocalSf.rps, 0), fmtMs(refLocalSf.p95, 1), "8/24 SF ON · 비교 참고"],
            [refStampede.label, fmt(refStampede.rps, 0), fmtMs(refStampede.p95, 1), "스탬피드 베이스라인"],
          ]}
        />
        <Text tone="secondary">
          RPS는 3노드로 부하가 나뉘어 8/24 1대와 직접 비교하기 어렵다. p95·max 꼬리가
          스탬피드 OFF(167ms)보다 훨씬 낮고, SF 1대(40ms)와 비슷~더 낮은 것이 PoC
          관찰 포인트다.
        </Text>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>4. Redis 분산 락 동작 (구현)</H2>
        <Table
          headers={["단계", "동작"]}
          rows={[
            ["획득", "SET lockKey UUID NX EX — 클러스터 전체 1명만 성공"],
            ["리더", "DB load + Redis 캐시 put → Lua로 token 일치 시 DEL"],
            ["팔로워", "락 실패 → Redis 캐시 폴링 → lock_wait_hit"],
            ["TTL", "15s — holder 장애 시 자동 만료"],
          ]}
        />
        <Callout tone="success" title="local SF와의 차이">
          local은 ConcurrentHashMap + CompletableFuture로 JVM 1대만 조율한다.
          redis는 8080·8081·8082가 같은 lockKey를 Redis에서 경쟁한다.
        </Callout>
      </Stack>

      <Divider />

      <Stack gap={12}>
        <H2>5. 해석 · 한계</H2>
        <H3>PoC로 말할 수 있는 것</H3>
        <Text>
          3인스턴스 + coordinator=redis에서 3분 부하를 성공률 100%로 처리했고,
          p95는 22~31ms 구간으로 안정적이었다. max 2.9~7.8s 스파이크는 TTL 만료·
          lock 대기·DB miss-delay 구간의 꼬리 지연으로, 8/24 SF 실험과 같은
          “평균 RPS보다 max/p95 스파이크가 중요” 패턴이다.
        </Text>
        <H3>아직 말할 수 없는 것</H3>
        <Table
          headers={["주장", "이유"]}
          rows={[
            ["redis &lt; local &lt; none 순서 증명", "오늘 none/local run 없음"],
            ["miss TTL당 1건", "k6 summary에 cache miss 미포함"],
            ["Redis 장애 시 동작", "정상 Redis만 가정"],
          ]}
        />
        <Callout tone="info" title="실무 시사점">
          멀티 인스턴스 + 공유 캐시면 miss 조율도 프로세스 밖(Redis)에 둬야 한다.
          SET NX + token + TTL은 Redisson 없이도 PoC 가능. 프로덕션은 fencing token,
          Redlock 논쟁, watch dog 연장 등을 추가 검토한다.
        </Callout>
      </Stack>

      <Divider />

      <Stack gap={8}>
        <H2>6. 원본 · 후속</H2>
        <Table
          headers={["파일", "비고"]}
          rows={[
            ["k6/results/summary-dist-lock-redis-vu200-3m-20260831-*.json", "오늘 4 run"],
            ["scripts/run-cluster.ps1", "3노드 기동"],
            ["docs/reports/cache-stampede-experiment-report.canvas.tsx", "선행 SF 실험"],
          ]}
        />
        <Text tone="secondary" style={{ color: theme.textSecondary }}>
          후속: none/local 각 2회 + Grafana miss·lock_acquired 캡처 → 3-way 비교 보고서.
        </Text>
      </Stack>
    </Stack>
  );
}
