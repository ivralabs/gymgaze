import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, 'index.html');
const pdfPath = path.resolve(__dirname, 'GymGaze-Investor-Deck-2026.pdf');

const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
await page.pdf({
  path: pdfPath,
  format: 'A4',
  landscape: false,
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 }
});
await browser.close();
console.log('PDF generated:', pdfPath);
