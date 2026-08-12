import http from 'k6/http';
import { check } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const VUS = Number(__ENV.VUS || 100);
const DURATION = __ENV.DURATION || '1m';
const EXP = __ENV.EXP || 'threads';

const threadsSuccess = new Counter('threads_success');
const threadsFailed = new Counter('threads_failed');
const threadsSuccessRate = new Rate('threads_success_rate');

export const options = {
  scenarios: {
    concurrent_threads: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.5'],
    http_req_duration: ['p(95)<5000'],
    threads_success_rate: ['rate>=0'],
  },
};

export default function threadsFlow() {
  const res = http.get(`${BASE_URL}/api/bookings/threads`, {
    tags: { step: 'get_threads' },
  });

  const ok = check(res, {
    'threads 200': (r) => r.status === 200,
  });

  if (ok) {
    threadsSuccess.add(1);
    threadsSuccessRate.add(true);
  } else {
    threadsFailed.add(1);
    threadsSuccessRate.add(false);
  }
}

function metricValues(metric) {
  return metric?.values ?? metric ?? {};
}

function collectChecks(rootGroup) {
  const result = {};
  if (!rootGroup) {
    return result;
  }

  const checks = rootGroup.checks;
  if (Array.isArray(checks)) {
    for (const check of checks) {
      if (check?.name) {
        result[check.name] = check.passes ?? 0;
      }
    }
  } else if (checks && typeof checks === 'object') {
    for (const [name, check] of Object.entries(checks)) {
      result[name] = check.passes ?? 0;
    }
  }

  const groups = rootGroup.groups;
  if (Array.isArray(groups)) {
    for (const group of groups) {
      Object.assign(result, collectChecks(group));
    }
  } else if (groups && typeof groups === 'object') {
    for (const group of Object.values(groups)) {
      Object.assign(result, collectChecks(group));
    }
  }

  return result;
}

function stepDuration(data, step) {
  const metric = data.metrics[`http_req_duration{step:${step}}`];
  if (!metric) {
    return null;
  }

  const values = metricValues(metric);
  return {
    avg: values.avg ?? null,
    med: values.med ?? null,
    p90: values['p(90)'] ?? null,
    p95: values['p(95)'] ?? null,
    max: values.max ?? null,
  };
}

function buildComparableSummary(data) {
  const duration = metricValues(data.metrics.http_req_duration);
  const waiting = metricValues(data.metrics.http_req_waiting);
  const iteration = metricValues(data.metrics.iteration_duration);
  const httpReqs = metricValues(data.metrics.http_reqs);
  const httpFailed = metricValues(data.metrics.http_req_failed);
  const successRate = metricValues(data.metrics.threads_success_rate);

  const success = metricValues(data.metrics.threads_success).count ?? 0;
  const failed = metricValues(data.metrics.threads_failed).count ?? 0;
  const checks = collectChecks(data.root_group);
  const checkCount = (name) => checks[name] ?? 0;

  return {
    experiment: {
      name: EXP,
      vus: VUS,
      duration: DURATION,
      baseUrl: BASE_URL,
      endpoint: '/api/bookings/threads',
      savedAt: new Date().toISOString(),
    },
    threads: {
      success,
      failed,
      successRate: successRate.value ?? (success + failed > 0 ? success / (success + failed) : 0),
    },
    checks: {
      getThreads: checkCount('threads 200'),
    },
    steps: {
      getThreads: stepDuration(data, 'get_threads'),
    },
    http: {
      requests: httpReqs.count ?? 0,
      rps: httpReqs.rate ?? 0,
      failedRate: httpFailed.value ?? 0,
      durationMs: {
        avg: duration.avg ?? null,
        med: duration.med ?? null,
        p90: duration['p(90)'] ?? null,
        p95: duration['p(95)'] ?? null,
        max: duration.max ?? null,
      },
      waitingMs: {
        avg: waiting.avg ?? null,
        p95: waiting['p(95)'] ?? null,
        max: waiting.max ?? null,
      },
    },
    iteration: {
      count: metricValues(data.metrics.iterations).count ?? 0,
      durationMs: {
        avg: iteration.avg ?? null,
        p95: iteration['p(95)'] ?? null,
        max: iteration.max ?? null,
      },
    },
  };
}

function buildSummaryPath() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const safeExp = String(EXP).replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeDuration = String(DURATION).replace(/[^a-zA-Z0-9_-]/g, '_');

  return `k6/results/summary-${safeExp}-vu${VUS}-${safeDuration}-${stamp}.json`;
}

export function handleSummary(data) {
  const summary = buildComparableSummary(data);
  const summaryPath = buildSummaryPath();

  console.log('\n========== threads 부하 테스트 결과 ==========');
  console.log(`실험명: ${summary.experiment.name}`);
  console.log(`엔드포인트: GET ${summary.experiment.endpoint}`);
  console.log(`동시 유저: ${summary.experiment.vus}명 / 기간: ${summary.experiment.duration}`);
  console.log(`성공: ${summary.threads.success}건`);
  console.log(`실패: ${summary.threads.failed}건`);
  console.log(`RPS: ${summary.http.rps?.toFixed?.(2) ?? summary.http.rps ?? '-'}`);
  console.log(`전체 p95: ${summary.http.durationMs.p95?.toFixed?.(2) ?? summary.http.durationMs.p95 ?? '-'}ms`);
  console.log(`waiting p95: ${summary.http.waitingMs.p95?.toFixed?.(2) ?? summary.http.waitingMs.p95 ?? '-'}ms`);
  console.log(`결과 저장: ${summaryPath}`);
  console.log('==============================================\n');

  return {
    [summaryPath]: JSON.stringify(summary, null, 2),
  };
}
