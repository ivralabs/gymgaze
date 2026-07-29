const puppeteer = require('./node_modules/puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, '../../busakwe-advertising/legal/PUBLISHER-REP-AGREEMENT.html'), { waitUntil: 'networkidle0' });
  await page.pdf({
    path: path.join(__dirname, '../../busakwe-advertising/legal/Busakwe-Advertising-Publisher-Rep-Agreement.pdf'),
    format: 'A4',
    landscape: false,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  await browser.close();
  console.log('Done.');
})();
