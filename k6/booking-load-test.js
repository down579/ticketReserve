import http from 'k6/http';
import { check } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const GOODS_ID = Number(__ENV.GOODS_ID || 1);
const SALES_ID = Number(__ENV.SALES_ID || 1);
const SEAT_GRADE = __ENV.SEAT_GRADE || 'R';
const VUS = Number(__ENV.VUS || 100);
const DURATION = __ENV.DURATION || '1m';
const SEATS_PER_USER = 1;
const EXP = __ENV.EXP || 'default';
// 예매 성공 후 즉시 취소해 좌석을 재활용 (pool 실험용)
const CANCEL_AFTER_BOOK = String(__ENV.CANCEL_AFTER_BOOK || 'false').toLowerCase() === 'true';

const bookingSuccess = new Counter('booking_success');
const bookingFailed = new Counter('booking_failed');
const holdConflict = new Counter('hold_conflict');
const holdSuccess = new Counter('hold_success');
const cancelSuccess = new Counter('cancel_success');
const cancelFailed = new Counter('cancel_failed');
const bookingSuccessRate = new Rate('booking_success_rate');

export const options = {
  scenarios: {
    concurrent_booking: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.5'],
    http_req_duration: ['p(95)<5000'],
    booking_success_rate: ['rate>=0'],
  },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function parseJson(response) {
  try {
    return response.json();
  } catch (_) {
    return null;
  }
}

function pickAvailableSeats(seatMap, count) {
  const seatIds = [];
  if (!seatMap || !seatMap.blocks) {
    return seatIds;
  }

  for (const block of seatMap.blocks) {
    for (const seat of block.seats || []) {
      if (seat.seatStatus === 'AVAILABLE') {
        seatIds.push(seat.seatId);
        if (seatIds.length >= count) {
          return seatIds;
        }
      }
    }
  }
  return seatIds;
}

export default function bookingFlow() {
  const memberId = ((__VU - 1) % 2) + 1;

  // 1) 좌석맵 조회
  const seatsRes = http.get(
    `${BASE_URL}/api/sales/${SALES_ID}/seats?seatGrade=${SEAT_GRADE}`,
    { tags: { step: 'get_seats' } },
  );

  check(seatsRes, {
    '좌석맵 조회 200': (r) => r.status === 200,
  });

  if (seatsRes.status !== 200) {
    bookingFailed.add(1);
    bookingSuccessRate.add(false);
    return;
  }

  const seatIds = pickAvailableSeats(parseJson(seatsRes), SEATS_PER_USER);
  if (seatIds.length < SEATS_PER_USER) {
    bookingFailed.add(1);
    bookingSuccessRate.add(false);
    return;
  }

  // 2) 예매 세션 생성
  const sessionRes = http.post(
    `${BASE_URL}/api/sessions`,
    JSON.stringify({
      memberId,
      goodsId: GOODS_ID,
      salesId: SALES_ID,
    }),
    { headers: JSON_HEADERS, tags: { step: 'create_session' } },
  );

  const sessionOk = check(sessionRes, {
    '세션 생성 200': (r) => r.status === 200,
  });

  if (!sessionOk) {
    bookingFailed.add(1);
    bookingSuccessRate.add(false);
    return;
  }

  const session = parseJson(sessionRes);
  const sessionId = session.sessionId;

  // 3) 좌석 선점
  const holdRes = http.post(
    `${BASE_URL}/api/seats/hold`,
    JSON.stringify({
      sessionId,
      salesId: SALES_ID,
      seatIds,
    }),
    { headers: JSON_HEADERS, tags: { step: 'hold_seats' } },
  );

  if (holdRes.status === 409) {
    holdConflict.add(1);
    bookingFailed.add(1);
    bookingSuccessRate.add(false);
    return;
  }

  const holdOk = check(holdRes, {
    '좌석 선점 200': (r) => r.status === 200,
  });

  if (!holdOk) {
    bookingFailed.add(1);
    bookingSuccessRate.add(false);
    return;
  }

  holdSuccess.add(1);

  // 4) 장바구니 생성
  const cartRes = http.post(
    `${BASE_URL}/api/carts`,
    JSON.stringify({
      sessionId,
      goodsId: GOODS_ID,
      salesId: SALES_ID,
      seatIds,
    }),
    { headers: JSON_HEADERS, tags: { step: 'create_cart' } },
  );

  const cartOk = check(cartRes, {
    '장바구니 생성 200': (r) => r.status === 200,
  });

  if (!cartOk) {
    bookingFailed.add(1);
    bookingSuccessRate.add(false);
    return;
  }

  const cart = parseJson(cartRes);
  const cartId = cart.cartId;

  // 5) 예매 확정
  const bookingRes = http.post(
    `${BASE_URL}/api/bookings`,
    JSON.stringify({ cartId }),
    { headers: JSON_HEADERS, tags: { step: 'confirm_booking' } },
  );

  const bookingOk = check(bookingRes, {
    '예매 확정 200': (r) => r.status === 200,
    '예매 상태 CONFIRMED': (r) => {
      const body = parseJson(r);
      return body && body.bookingStatus === 'CONFIRMED';
    },
  });

  if (!bookingOk) {
    bookingFailed.add(1);
    bookingSuccessRate.add(false);
    return;
  }

  bookingSuccess.add(1);
  bookingSuccessRate.add(true);

  // 6) (옵션) 예매 즉시 취소 → 좌석 복구 후 다음 루프에서 재사용
  if (!CANCEL_AFTER_BOOK) {
    return;
  }

  const booking = parseJson(bookingRes);
  const bookingId = booking?.bookingId;
  if (!bookingId) {
    cancelFailed.add(1);
    return;
  }

  const cancelRes = http.post(
    `${BASE_URL}/api/bookings/${bookingId}/cancel`,
    null,
    { tags: { step: 'cancel_booking' } },
  );

  const cancelOk = check(cancelRes, {
    '예매 취소 200': (r) => r.status === 200,
    '예매 상태 CANCELLED': (r) => {
      const body = parseJson(r);
      return body && body.bookingStatus === 'CANCELLED';
    },
  });

  if (cancelOk) {
    cancelSuccess.add(1);
  } else {
    cancelFailed.add(1);
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
  const bookingSuccessRate = metricValues(data.metrics.booking_success_rate);

  const success = metricValues(data.metrics.booking_success).count ?? 0;
  const failed = metricValues(data.metrics.booking_failed).count ?? 0;
  const holds = metricValues(data.metrics.hold_success).count ?? 0;
  const conflicts = metricValues(data.metrics.hold_conflict).count ?? 0;
  const cancels = metricValues(data.metrics.cancel_success).count ?? 0;
  const cancelFails = metricValues(data.metrics.cancel_failed).count ?? 0;

  const checks = collectChecks(data.root_group);
  const checkCount = (name) => checks[name] ?? 0;

  return {
    experiment: {
      name: EXP,
      vus: VUS,
      duration: DURATION,
      seatsPerUser: SEATS_PER_USER,
      goodsId: GOODS_ID,
      salesId: SALES_ID,
      seatGrade: SEAT_GRADE,
      baseUrl: BASE_URL,
      cancelAfterBook: CANCEL_AFTER_BOOK,
      readIsolation: 'READ_COMMITTED',
      writeIsolation: 'REPEATABLE_READ',
      savedAt: new Date().toISOString(),
    },
    booking: {
      success,
      failed,
      holdSuccess: holds,
      holdConflict: conflicts,
      cancelSuccess: cancels,
      cancelFailed: cancelFails,
      successRate: bookingSuccessRate.value ?? (success + failed > 0 ? success / (success + failed) : 0),
    },
    checks: {
      getSeats: checkCount('좌석맵 조회 200'),
      createSession: checkCount('세션 생성 200'),
      holdSeats: checkCount('좌석 선점 200'),
      createCart: checkCount('장바구니 생성 200'),
      confirmBooking: checkCount('예매 확정 200'),
      cancelBooking: checkCount('예매 취소 200'),
    },
    steps: {
      getSeats: stepDuration(data, 'get_seats'),
      createSession: stepDuration(data, 'create_session'),
      holdSeats: stepDuration(data, 'hold_seats'),
      createCart: stepDuration(data, 'create_cart'),
      confirmBooking: stepDuration(data, 'confirm_booking'),
      cancelBooking: stepDuration(data, 'cancel_booking'),
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

  console.log('\n========== 예매 부하 테스트 결과 ==========');
  console.log(`실험명: ${summary.experiment.name}`);
  console.log(`모드: ${CANCEL_AFTER_BOOK ? '예매→즉시취소 (좌석 재활용)' : '예매만 (좌석 고갈형)'}`);
  console.log(`동시 유저: ${summary.experiment.vus}명 / 기간: ${summary.experiment.duration}`);
  console.log(`좌석 수: ${summary.experiment.seatsPerUser}개`);
  console.log(`예매 성공: ${summary.booking.success}건`);
  console.log(`예매 실패: ${summary.booking.failed}건`);
  console.log(`선점 성공: ${summary.booking.holdSuccess}건`);
  console.log(`선점 충돌(409): ${summary.booking.holdConflict}건`);
  if (CANCEL_AFTER_BOOK) {
    console.log(`취소 성공: ${summary.booking.cancelSuccess}건`);
    console.log(`취소 실패: ${summary.booking.cancelFailed}건`);
  }
  console.log(`전체 p95: ${summary.http.durationMs.p95?.toFixed?.(2) ?? summary.http.durationMs.p95 ?? '-'}ms`);
  console.log(`좌석조회 p95: ${summary.steps.getSeats?.p95?.toFixed?.(2) ?? '-'}ms`);
  console.log(`선점 p95: ${summary.steps.holdSeats?.p95?.toFixed?.(2) ?? '-'}ms`);
  console.log(`예매 p95: ${summary.steps.confirmBooking?.p95?.toFixed?.(2) ?? '-'}ms`);
  if (CANCEL_AFTER_BOOK) {
    console.log(`취소 p95: ${summary.steps.cancelBooking?.p95?.toFixed?.(2) ?? '-'}ms`);
  }
  console.log(`결과 저장: ${summaryPath}`);
  console.log('==========================================\n');

  return {
    [summaryPath]: JSON.stringify(summary, null, 2),
  };
}
