const { chromium } = require('playwright');

const TARGET_URL = 'https://jo-cars-production.up.railway.app';
const results = {
  pages: [],
  brokenLinks: [],
  consoleErrors: [],
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.consoleErrors.push({ page: page.url(), message: msg.text() });
    }
  });

  page.on('requestfailed', req => {
    results.brokenLinks.push({ url: req.url(), error: req.failure()?.errorText || 'unknown' });
  });

  const testPages = [
    { name: 'Home', url: '/' },
    { name: 'Cars', url: '/cars' },
    { name: 'Sell', url: '/cars/add' },
    { name: 'Workshops', url: '/workshops' },
    { name: 'Parts', url: '/parts' },
    { name: 'Forum', url: '/forum' },
  ];

  console.log('=== JO Cars Test ===\n');

  for (const testPage of testPages) {
    const startTime = Date.now();
    try {
      const response = await page.goto(TARGET_URL + testPage.url, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      const loadTime = Date.now() - startTime;
      const status = response ? response.status() : 0;

      const screenshotPath = '/tmp/jo-cars-' + testPage.name + '.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const metrics = await page.evaluate(() => ({
        title: document.title,
        headings: document.querySelectorAll('h1, h2, h3').length,
        images: document.querySelectorAll('img').length,
        buttons: document.querySelectorAll('button').length,
      }));

      results.pages.push({
        name: testPage.name,
        url: testPage.url,
        status: status,
        loadTime: loadTime,
        metrics: metrics,
        screenshot: screenshotPath,
      });

      console.log(testPage.name + ': ' + status + ' (' + loadTime + 'ms)');
      console.log('  Title: ' + metrics.title);
      console.log('  Headings: ' + metrics.headings + ', Images: ' + metrics.images + ', Buttons: ' + metrics.buttons);
    } catch (error) {
      console.log(testPage.name + ': FAILED - ' + error.message);
      results.pages.push({
        name: testPage.name,
        url: testPage.url,
        status: 0,
        loadTime: 0,
        error: error.message,
      });
    }
  }

  console.log('\n=== Mobile Test ===\n');
  const mobileViewports = [
    { name: 'iPhone', width: 390, height: 844 },
    { name: 'Android', width: 360, height: 800 },
  ];

  for (const viewport of mobileViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    const screenshotPath = '/tmp/jo-cars-mobile-' + viewport.name + '.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(viewport.name + ' (' + viewport.width + 'x' + viewport.height + '): OK');
  }

  console.log('\n=== Car Detail Test ===\n');
  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(TARGET_URL + '/cars', { waitUntil: 'networkidle', timeout: 30000 });
    const firstCarLink = await page.locator('a[href^="/cars/"]').first().getAttribute('href');
    if (firstCarLink) {
      await page.goto(TARGET_URL + firstCarLink, { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: '/tmp/jo-cars-detail.png', fullPage: true });
      const hasAIAnalysis = await page.locator('text=تحليل بالذكاء الاصطناعي').count();
      console.log('Car detail: ' + firstCarLink);
      console.log('AI Analysis: ' + (hasAIAnalysis > 0 ? 'YES' : 'NO'));
    }
  } catch (error) {
    console.log('Car detail: FAILED - ' + error.message);
  }

  console.log('\n=== Sell Car Test ===\n');
  try {
    await page.goto(TARGET_URL + '/cars/add', { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: '/tmp/jo-cars-sell.png', fullPage: true });
    const hasAIEstimator = await page.locator('text=تقدير سعر السيارة بالذكاء الاصطناعي').count();
    console.log('Sell car page: OK');
    console.log('AI Price Estimator: ' + (hasAIEstimator > 0 ? 'YES' : 'NO'));
  } catch (error) {
    console.log('Sell car: FAILED - ' + error.message);
  }

  console.log('\n=== REPORT ===\n');
  console.log('Pages tested: ' + results.pages.length);
  console.log('Console errors: ' + results.consoleErrors.length);
  console.log('Failed requests: ' + results.brokenLinks.length);

  if (results.consoleErrors.length > 0) {
    console.log('\nConsole Errors:');
    results.consoleErrors.slice(0, 10).forEach(e => console.log('  - ' + e.message.substring(0, 200)));
  }

  if (results.brokenLinks.length > 0) {
    console.log('\nFailed Requests:');
    results.brokenLinks.slice(0, 10).forEach(l => console.log('  - ' + l.url.substring(0, 100) + ': ' + (l.error || '')));
  }

  const avgLoadTime = results.pages.reduce((sum, p) => sum + (p.loadTime || 0), 0) / results.pages.length;
  console.log('\nAvg load time: ' + Math.round(avgLoadTime) + 'ms');

  await browser.close();
  console.log('\n=== Done ===');
})();
