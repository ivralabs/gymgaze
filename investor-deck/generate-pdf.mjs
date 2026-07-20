import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, 'index.html');
const pdfPath = path.resolve(__dirname, 'GymGaze-Investor-Deck-2026.pdf');

console.log('Launching browser...');
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();

console.log('Loading HTML...');
await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

// Wait for fonts
await page.evaluateHandle(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 2000));

console.log('Generating PDF...');
await page.pdf({
  path: pdfPath,
  width: '297mm',
  height: '210mm',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  preferCSSPageSize: false
});

await browser.close();
console.log('PDF generated:', pdfPath);
