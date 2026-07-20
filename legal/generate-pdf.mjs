import puppeteer from '../node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.goto('file://' + join(__dirname, 'LEASE-AGREEMENT-TEMPLATE.html'), { waitUntil: 'networkidle0' });
await page.pdf({
  path: join(__dirname, 'GymGaze-Licence-to-Occupy-Agreement.pdf'),
  format: 'A4',
  landscape: false,
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 }
});
await browser.close();
console.log('PDF generated.');
