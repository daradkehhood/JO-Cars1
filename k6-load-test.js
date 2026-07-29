import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const httpReqFailed = new Rate('custom_http_req_failed');
const pageLoadTime = new Trend('page_load_time');
const apiResponseTime = new Trend('api_response_time');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://jo-cars-production.up.railway.app';

// Test scenarios
export const options = {
  scenarios: {
    // Smoke test - verify site is up
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
      exec: 'smokeTest',
      startTime: '0s',
    },
    // Load test - simulate normal traffic
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },   // Ramp up to 10 users
        { duration: '5m', target: 10 },   // Stay at 10 users
        { duration: '2m', target: 20 },   // Ramp up to 20 users
        { duration: '5m', target: 20 },   // Stay at 20 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      exec: 'loadTest',
      startTime: '1m',
    },
    // Stress test - find breaking point
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 30 },   // Ramp up to 30 users
        { duration: '3m', target: 30 },   // Stay at 30 users
        { duration: '1m', target: 50 },   // Spike to 50 users
        { duration: '3m', target: 50 },   // Stay at 50 users
        { duration: '2m', target: 0 },    // Ramp down
      ],
      exec: 'stressTest',
      startTime: '15m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],       // Less than 10% failure rate
    custom_http_req_failed: ['rate<0.05'], // Less than 5% failure rate
  },
};

// Helper function to make requests with timing
function timedRequest(url, params = {}) {
  const start = Date.now();
  const response = http.get(url, params);
  const duration = Date.now() - start;
  
  pageLoadTime.add(duration);
  
  return { response, duration };
}

// Smoke Test - Basic connectivity
export function smokeTest() {
  group('Smoke Test - Basic Connectivity', () => {
    // Test homepage
    const { response: homeRes } = timedRequest(BASE_URL);
    check(homeRes, {
      'homepage status 200': (r) => r.status === 200,
      'homepage has content': (r) => r.body.length > 0,
    });

    sleep(1);

    // Test cars listing
    const { response: carsRes } = timedRequest(`${BASE_URL}/cars`);
    check(carsRes, {
      'cars page status 200': (r) => r.status === 200,
    });

    sleep(1);

    // Test API health
    const { response: apiRes } = timedRequest(`${BASE_URL}/api/health`);
    check(apiRes, {
      'API health check': (r) => r.status === 200 || r.status === 404,
    });
  });
}

// Load Test - Normal traffic simulation
export function loadTest() {
  group('Load Test - Normal Traffic', () => {
    // Simulate realistic user behavior
    const userJourney = Math.random();

    if (userJourney < 0.4) {
      // 40% - Browse cars
      browseCars();
    } else if (userJourney < 0.7) {
      // 30% - Search functionality
      searchCars();
    } else if (userJourney < 0.85) {
      // 15% - View car details
      viewCarDetails();
    } else {
      // 15% - AI features
      useAIFeatures();
    }

    sleep(Math.random() * 3 + 1); // Random delay 1-4 seconds
  });
}

// Stress Test - Find breaking point
export function stressTest() {
  group('Stress Test - High Load', () => {
    // Mix of all user behaviors under stress
    const action = Math.floor(Math.random() * 4);
    
    switch (action) {
      case 0:
        browseCars();
        break;
      case 1:
        searchCars();
        break;
      case 2:
        viewCarDetails();
        break;
      case 3:
        useAIFeatures();
        break;
    }

    sleep(Math.random() * 2 + 0.5); // Shorter delays under stress
  });
}

// Helper functions for different user behaviors
function browseCars() {
  group('Browse Cars', () => {
    const { response } = timedRequest(`${BASE_URL}/cars`);
    check(response, {
      'browse cars status 200': (r) => r.status === 200,
      'browse cars has content': (r) => r.body.length > 1000,
    });
    
    // Sometimes filter by brand
    if (Math.random() > 0.5) {
      const brands = ['toyota', 'honda', 'hyundai', 'kia', 'nissan'];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const { response: filterRes } = timedRequest(`${BASE_URL}/cars?brand=${brand}`);
      check(filterRes, {
        'filter by brand status 200': (r) => r.status === 200,
      });
    }
  });
}

function searchCars() {
  group('Search Cars', () => {
    const searches = ['sedan', 'SUV', '2020', 'manual', 'automatic'];
    const query = searches[Math.floor(Math.random() * searches.length)];
    
    const { response } = timedRequest(`${BASE_URL}/cars?search=${query}`);
    check(response, {
      'search status 200': (r) => r.status === 200,
    });
  });
}

function viewCarDetails() {
  group('View Car Details', () => {
    // First get list of cars
    const { response: listRes } = timedRequest(`${BASE_URL}/api/cars?limit=5`);
    
    if (listRes.status === 200) {
      try {
        const cars = JSON.parse(listRes.body);
        if (cars.cars && cars.cars.length > 0) {
          const carId = cars.cars[0].id;
          const { response: detailRes } = timedRequest(`${BASE_URL}/api/cars/${carId}`);
          check(detailRes, {
            'car detail status 200': (r) => r.status === 200,
          });
        }
      } catch (e) {
        // Parse error - continue
      }
    }
  });
}

function useAIFeatures() {
  group('AI Features', () => {
    // Test AI chat endpoint (POST)
    const chatPayload = JSON.stringify({
      message: 'ما هي أفضل سيارة عائلية؟',
      conversationId: `test-${Date.now()}`
    });
    
    const start = Date.now();
    const { response: chatRes } = timedRequest(`${BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: chatPayload,
    });
    apiResponseTime.add(Date.now() - start);
    
    check(chatRes, {
      'AI chat responds': (r) => r.status === 200 || r.status === 429, // 429 = rate limit OK
      'AI chat has content': (r) => r.body.length > 0,
    });
  });
}

// Summary output
export function handleSummary(data) {
  const summary = `
========================================
         JO CARS LOAD TEST SUMMARY
========================================

Duration: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms (avg)
          ${data.metrics.http_req_duration.values.p95.toFixed(2)}ms (p95)
          ${data.metrics.http_req_duration.values.max.toFixed(2)}ms (max)

Requests: ${data.metrics.http_reqs.values.count}
Failed:   ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%

Throughput: ${data.metrics.iterations.values.rate.toFixed(2)} req/s

Thresholds:
  http_req_duration p95: ${data.metrics.http_req_duration.values.p95.toFixed(2)}ms
  http_req_failed rate: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%
========================================
`;

  console.log(summary);

  return {
    'k6-results.json': JSON.stringify(data, null, 2),
    stdout: summary,
  };
}
