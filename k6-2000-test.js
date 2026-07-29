/**
 * k6 Load Test — JO Cars 2000 Users
 * Tests all main pages under heavy load
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://jo-cars-production.up.railway.app';

// Custom metrics
const errorRate = new Rate('errors');
const aiChatDuration = new Trend('ai_chat_duration', true);
const pageLoadDuration = new Trend('page_load_duration', true);

export const options = {
  scenarios: {
    // Smoke: verify site is up
    smoke: {
      executor: 'constant-vus',
      vus: 5,
      duration: '1m',
      startTime: '0s',
    },
    // Ramp up to 2000 users over 5 minutes
    ramp_up: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 200 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '2m', target: 2000 },
        { duration: '5m', target: 2000 }, // Hold 2000 for 5 minutes
        { duration: '2m', target: 0 },     // Ramp down
      ],
      startTime: '0s',
    },
  },
  thresholds: {
    http_req_duration: [
      'p(50)<500',
      'p(95)<3000',
      'p(99)<8000',
    ],
    errors: ['rate<0.15'],  // Allow up to 15% errors under extreme load
    http_req_failed: ['rate<0.20'],
  },
};

const PAGES = [
  { name: 'Homepage', path: '/' },
  { name: 'Cars Listing', path: '/cars' },
  { name: 'Featured Cars', path: '/cars?featured=true' },
  { name: 'Car Search', path: '/cars?search=toyota' },
  { name: 'Workshops', path: '/workshops' },
  { name: 'Parts', path: '/parts' },
  { name: 'Forum', path: '/forum' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
  { name: 'Privacy', path: '/privacy' },
];

const API_ENDPOINTS = [
  { name: 'API Cars List', path: '/api/cars?limit=20' },
  { name: 'API Featured', path: '/api/cars?featured=true&limit=6' },
  { name: 'API Search', path: '/api/cars?search=camry&limit=10' },
];

export default function () {
  const group = __VU % 3; // Distribute users across groups

  if (group === 0) {
    // Group 1: Page browsing (most common user behavior)
    const page = PAGES[Math.floor(Math.random() * PAGES.length)];
    const res = http.get(`${BASE_URL}${page.path}`, {
      timeout: '15s',
      tags: { name: page.name },
    });
    pageLoadDuration.add(res.timings.duration);
    check(res, {
      [`${page.name} status 200`]: (r) => r.status === 200,
      [`${page.name} < 3s`]: (r) => r.timings.duration < 3000,
    }) || errorRate.add(1);
    errorRate.add(res.status !== 200);
  } else if (group === 1) {
    // Group 2: API calls
    const api = API_ENDPOINTS[Math.floor(Math.random() * API_ENDPOINTS.length)];
    const res = http.get(`${BASE_URL}${api.path}`, {
      timeout: '10s',
      tags: { name: api.name },
    });
    pageLoadDuration.add(res.timings.duration);
    check(res, {
      [`${api.name} status 200`]: (r) => r.status === 200,
      [`${api.name} < 2s`]: (r) => r.timings.duration < 2000,
    }) || errorRate.add(1);
    errorRate.add(res.status !== 200);
  } else {
    // Group 3: AI Chat (simulated — just hit the page)
    const queries = [
      'كامري 2020',
      'ورشة في عمان',
      'قطع غيار تويوتا',
      'أفضل سيارة بـ 5000 دينار',
      'كيف أبيع سيارتي',
    ];
    const query = queries[Math.floor(Math.random() * queries.length)];

    const payload = JSON.stringify({
      messages: [{ role: 'user', content: query }],
      sessionId: `test-vu-${__VU}`,
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
      timeout: '25s',
      tags: { name: 'AI Chat' },
    };

    const res = http.post(`${BASE_URL}/api/ai/chat`, payload, params);
    aiChatDuration.add(res.timings.duration);

    check(res, {
      'AI Chat status 200': (r) => r.status === 200,
      'AI Chat response valid': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.success === true && body.data?.message;
        } catch {
          return false;
        }
      },
      'AI Chat < 10s': (r) => r.timings.duration < 10000,
    }) || errorRate.add(1);
    errorRate.add(res.status !== 200);
  }

  sleep(Math.random() * 2 + 1); // 1-3s between requests
}

export function handleSummary(data) {
  const metrics = data.metrics;

  const summary = `
╔══════════════════════════════════════════════════════════════╗
║              JO CARS LOAD TEST RESULTS (2000 Users)        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Total Requests:  ${String(metrics.http_reqs?.values?.count || 0).padStart(10)}                       ║
║  Request Rate:    ${String((metrics.http_req_rate?.values?.rate || 0).toFixed(1)).padStart(10)} req/s                     ║
║                                                              ║
║  Response Times:                                             ║
║    Average:       ${String((metrics.http_req_duration?.values?.avg || 0).toFixed(0)).padStart(8)} ms                          ║
║    Median (P50):  ${String((metrics.http_req_duration?.values?.med || 0).toFixed(0)).padStart(8)} ms                          ║
║    P95:           ${String((metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(0)).padStart(8)} ms                          ║
║    P99:           ${String((metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(0)).padStart(8)} ms                          ║
║    Max:           ${String((metrics.http_req_duration?.values?.max || 0).toFixed(0)).padStart(8)} ms                          ║
║                                                              ║
║  Error Rate:      ${String(((metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)).padStart(6)} %                          ║
║  Checks Passed:   ${String(((metrics.checks?.values?.rate || 0) * 100).toFixed(1)).padStart(6)} %                          ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  AI Chat Performance:                                        ║
║    Avg Duration:  ${String((metrics.ai_chat_duration?.values?.avg || 0).toFixed(0)).padStart(8)} ms                          ║
║    P95:           ${String((metrics.ai_chat_duration?.values?.['p(95)'] || 0).toFixed(0)).padStart(8)} ms                          ║
║    Max:           ${String((metrics.ai_chat_duration?.values?.max || 0).toFixed(0)).padStart(8)} ms                          ║
║                                                              ║
║  Page Load Performance:                                      ║
║    Avg Duration:  ${String((metrics.page_load_duration?.values?.avg || 0).toFixed(0)).padStart(8)} ms                          ║
║    P95:           ${String((metrics.page_load_duration?.values?.['p(95)'] || 0).toFixed(0)).padStart(8)} ms                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;

  console.log(summary);

  return {
    stdout: summary,
    'k6-2000-results.json': JSON.stringify(data, null, 2),
  };
}
