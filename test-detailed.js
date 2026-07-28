const { chromium } = require('playwright');

const TARGET_URL = 'https://jo-cars-production.up.railway.app';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  const errors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('requestfailed', req => {
    networkErrors.push({
      url: req.url(),
      error: req.failure()?.errorText,
    });
  });

  console.log('=== Detailed Test ===\n');

  // Test 1: Homepage performance
  console.log('1. Homepage Performance Test');
  const start1 = Date.now();
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  const domTime = Date.now() - start1;
  console.log('   DOM loaded: ' + domTime + 'ms');

  // Wait a bit more for content
  await page.waitForTimeout(3000);
  const totalTime = Date.now() - start1;
  console.log('   Content loaded: ' + totalTime + 'ms');

  // Check key elements
  const hasHeader = await page.locator('header').count();
  const hasFooter = await page.locator('footer').count();
  const hasNav = await page.locator('nav').count();
  console.log('   Header: ' + (hasHeader > 0 ? 'YES' : 'NO'));
  console.log('   Footer: ' + (hasFooter > 0 ? 'YES' : 'NO'));
  console.log('   Nav: ' + (hasNav > 0 ? 'YES' : 'NO'));

  // Test 2: Cars page
  console.log('\n2. Cars Page Test');
  const start2 = Date.now();
  await page.goto(TARGET_URL + '/cars', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  const carsTime = Date.now() - start2;
  console.log('   Load time: ' + carsTime + 'ms');

  const carCards = await page.locator('[class*="car"], [class*="Card"]').count();
  console.log('   Car cards found: ' + carCards);

  // Test 3: Sell car page (with domcontentloaded instead of networkidle)
  console.log('\n3. Sell Car Page Test');
  const start3 = Date.now();
  try {
    await page.goto(TARGET_URL + '/cars/add', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    const sellTime = Date.now() - start3;
    console.log('   Load time: ' + sellTime + 'ms');

    const hasForm = await page.locator('form').count();
    const hasPriceEstimator = await page.locator('text=تقدير سعر السيارة بالذكاء الاصطناعي').count();
    console.log('   Form: ' + (hasForm > 0 ? 'YES' : 'NO'));
    console.log('   AI Price Estimator: ' + (hasPriceEstimator > 0 ? 'YES' : 'NO'));
  } catch (error) {
    console.log('   FAILED: ' + error.message);
  }

  // Test 4: Workshops page
  console.log('\n4. Workshops Page Test');
  const start4 = Date.now();
  await page.goto(TARGET_URL + '/workshops', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);
  const workshopsTime = Date.now() - start4;
  console.log('   Load time: ' + workshopsTime + 'ms');

  // Test 5: Check for missing pages
  console.log('\n5. Missing Pages Test');
  const missingPages = [
    '/auth/forgot-password',
    '/privacy',
    '/terms',
    '/about',
    '/contact',
  ];

  for (const p of missingPages) {
    try {
      const response = await page.goto(TARGET_URL + p, { waitUntil: 'domcontentloaded', timeout: 10000 });
      const status = response ? response.status() : 0;
      console.log('   ' + p + ': ' + (status === 200 ? 'OK' : 'STATUS ' + status));
    } catch (error) {
      console.log('   ' + p + ': TIMEOUT');
    }
  }

  // Test 6: Console errors summary
  console.log('\n6. Console Errors Summary');
  const errorTypes = {};
  errors.forEach(e => {
    const type = e.substring(0, 50);
    errorTypes[type] = (errorTypes[type] || 0) + 1;
  });
  Object.entries(errorTypes).forEach(([type, count]) => {
    console.log('   [' + count + '] ' + type);
  });

  // Test 7: Network errors summary
  console.log('\n7. Network Errors Summary');
  const networkErrorTypes = {};
  networkErrors.forEach(e => {
    const type = e.error || 'unknown';
    networkErrorTypes[type] = (networkErrorTypes[type] || 0) + 1;
  });
  Object.entries(networkErrorTypes).forEach(([type, count]) => {
    console.log('   [' + count + '] ' + type);
  });

  // Test 8: Mobile responsive
  console.log('\n8. Mobile Responsive Test');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(2000);

  const mobileMenu = await page.locator('button[class*="menu"], button[class*="Menu"]').count();
  const mobileSearch = await page.locator('input[type="search"], input[placeholder*="بحث"]').count();
  console.log('   Mobile menu button: ' + (mobileMenu > 0 ? 'YES' : 'NO'));
  console.log('   Mobile search: ' + (mobileSearch > 0 ? 'YES' : 'NO'));

  await browser.close();
  console.log('\n=== Done ===');
})();
