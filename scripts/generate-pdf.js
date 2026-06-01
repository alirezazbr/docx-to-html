const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function resolveChromeExecutable() {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  const bundled = puppeteer.executablePath();
  if (bundled && fs.existsSync(bundled)) return bundled;

  const candidates = [
    path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env.LOCALAPPDATA &&
      path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    'Chrome not found. Install Google Chrome, set CHROME_PATH, or run: pnpm run browser:install'
  );
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: resolveChromeExecutable(),
  });
  const page = await browser.newPage();

  const { OUTPUT_HTML, OUTPUT_PDF } = require('./lib/paths');

  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 1 });

  await page.goto('file://' + OUTPUT_HTML, {
    waitUntil: 'networkidle0',
  });

  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
  });

  await browser.close();
  console.log('PDF generated');
})();
