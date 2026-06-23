import puppeteer from 'puppeteer';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '../public/generate-assets.html');

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1700, height: 1400, deviceScaleFactor: 1 });
page.on('console', m => console.log('[PAGE]', m.type(), m.text()));
page.on('pageerror', e => console.error('[ERROR]', e.message));

// Load via file:// — fonts are embedded in HTML
await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 15000 });

// Wait for any @font-face to be ready, then allow canvas draws to complete
await page.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 600));

// ── Logo PNG (800×800) ──────────────────────────────────────────────────────
const logoEl = await page.$('#logo');
const logoBuf = await logoEl.screenshot({ type: 'png' });
const logoOut = path.resolve(__dirname, '../public/careervision-logo.png');
writeFileSync(logoOut, logoBuf);
console.log('✓ Logo saved:', logoOut);

// ── Banner JPG (1584×396) ───────────────────────────────────────────────────
const bannerEl = await page.$('#banner');
const bannerBuf = await bannerEl.screenshot({ type: 'jpeg', quality: 96 });
const bannerOut = path.resolve(__dirname, '../public/careervision-banner.jpg');
writeFileSync(bannerOut, bannerBuf);
console.log('✓ Banner saved:', bannerOut);

// ── OG Image PNG (1200×627) ─────────────────────────────────────────────────
const ogEl = await page.$('#og');
const ogBuf = await ogEl.screenshot({ type: 'png' });
const ogOut = path.resolve(__dirname, '../public/easycareer-og.png');
writeFileSync(ogOut, ogBuf);
console.log('✓ OG image saved:', ogOut);

await browser.close();
console.log('\nDone! All assets are in /public/');
