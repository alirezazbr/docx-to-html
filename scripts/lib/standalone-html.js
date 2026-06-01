const fs = require('fs');
const { CONTRACT_CSS, CONTRACT_FONT } = require('./paths');

let cachedCss = null;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getEmbeddedCss() {
  if (cachedCss) return cachedCss;

  let css = fs.readFileSync(CONTRACT_CSS, 'utf8');

  if (fs.existsSync(CONTRACT_FONT)) {
    const fontBase64 = fs.readFileSync(CONTRACT_FONT).toString('base64');
    css = css.replace(
      /url\(['"]?\.\.\/fonts\/[^'")]+['"]?\)\s*format\(['"]truetype['"]\)/i,
      `url(data:font/ttf;base64,${fontBase64}) format('truetype')`
    );
  }

  cachedCss = css;
  return css;
}

function buildStandaloneHtml({ body, title }) {
  const css = getEmbeddedCss();
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
${css}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1].trim() : html;
}

function extractTitle(html, fallback = 'contract') {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : fallback;
}

/** Turn any HTML document into a self-contained file (inline CSS + font). */
function makeStandaloneDocument(html, fallbackTitle = 'contract') {
  return buildStandaloneHtml({
    body: extractBody(html),
    title: extractTitle(html, fallbackTitle),
  });
}

module.exports = {
  buildStandaloneHtml,
  makeStandaloneDocument,
  getEmbeddedCss,
};
