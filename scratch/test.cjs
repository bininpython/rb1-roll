const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('ERR:', err.message));
  try {
    await page.goto('http://localhost:5173', {waitUntil: 'networkidle0', timeout: 5000});
  } catch (e) {
    console.log('Timeout or error:', e.message);
  }
  await browser.close();
})();
