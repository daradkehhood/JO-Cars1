import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const BASE_URL = 'https://jo-cars-production.up.railway.app';
const pageLoadTime = new Trend('page_load_time');
const apiResponseTime = new Trend('api_response_time');
const failRate = new Rate('fail_rate');

export const options = {
  scenarios: {
    quick_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 5 },
        { duration: '30s', target: 5 },
        { duration: '15s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '15s', target: 15 },
        { duration: '15s', target: 15 },
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.15'],
  },
};

function timedGet(url) {
  const start = Date.now();
  const res = http.get(url, { timeout: '10s' });
  pageLoadTime.add(Date.now() - start);
  failRate.add(res.status >= 400);
  return res;
}

export default function () {
  const r = Math.random();

  group('Homepage', () => {
    const res = timedGet(BASE_URL);
    check(res, { 'home 200': (r) => r.status === 200 });
    sleep(0.5);
  });

  if (r < 0.35) {
    group('Cars Listing', () => {
      const res = timedGet(`${BASE_URL}/cars`);
      check(res, { 'cars 200': (r) => r.status === 200 });
      sleep(0.5);
    });
  } else if (r < 0.55) {
    group('Search Cars', () => {
      const q = ['sedan', 'SUV', '2020', 'toyota', 'manual'][Math.floor(Math.random() * 5)];
      const res = timedGet(`${BASE_URL}/cars?search=${q}`);
      check(res, { 'search 200': (r) => r.status === 200 });
      sleep(0.5);
    });
  } else if (r < 0.7) {
    group('Workshops', () => {
      const res = timedGet(`${BASE_URL}/workshops`);
      check(res, { 'workshops 200': (r) => r.status === 200 });
      sleep(0.5);
    });
  } else if (r < 0.85) {
    group('Car Detail', () => {
      const list = timedGet(`${BASE_URL}/api/cars?limit=3`);
      if (list.status === 200) {
        try {
          const cars = JSON.parse(list.body);
          if (cars.cars && cars.cars.length > 0) {
            const detail = timedGet(`${BASE_URL}/api/cars/${cars.cars[0].id}`);
            check(detail, { 'detail 200': (r) => r.status === 200 });
          }
        } catch (e) {}
      }
      sleep(0.5);
    });
  } else {
    group('AI Chat', () => {
      const start = Date.now();
      const res = http.post(`${BASE_URL}/api/ai/chat`,
        JSON.stringify({ message: 'مرحبا' }),
        { headers: { 'Content-Type': 'application/json' }, timeout: '10s' }
      );
      apiResponseTime.add(Date.now() - start);
      failRate.add(res.status >= 400);
      check(res, { 'chat responds': (r) => r.status === 200 || r.status === 429 });
      sleep(0.5);
    });
  }

  sleep(Math.random() * 2 + 0.5);
}

export function handleSummary(data) {
  const dur = data.metrics.http_req_duration;
  const reqs = data.metrics.http_reqs;
  const passed = data.root_group.checks?.checks || 0;
  
  return {
    stdout: `
============================================
  JO CARS LOAD TEST RESULTS
============================================
  Duration:     ~2m
  Total VUs:    15 (peak)
  Requests:     ${reqs.values.count}
  
  Response Time:
    Average:    ${dur.values.avg.toFixed(0)}ms
    Median:     ${dur.values.med.toFixed(0)}ms
    P95:        ${dur.values.p95.toFixed(0)}ms
    P99:        ${dur.values.p99.toFixed(0)}ms
    Max:        ${dur.values.max.toFixed(0)}ms
  
  Error Rate:   ${(data.metrics.http_req_failed.values.rate * 100).toFixed(1)}%
  Throughput:   ${reqs.values.rate.toFixed(1)} req/s
============================================
`,
  };
}
