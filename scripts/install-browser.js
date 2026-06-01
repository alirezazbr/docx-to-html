const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const cacheRoot = path.join(process.env.USERPROFILE || process.env.HOME, '.cache', 'puppeteer', 'chrome');

if (fs.existsSync(cacheRoot)) {
  fs.rmSync(cacheRoot, { recursive: true, force: true });
  console.log('Cleared corrupted Puppeteer Chrome cache');
}

execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
