const fs = require('fs');
const { CONTRACT_CSS_PDF } = require('./paths');

let cachedCss = null;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getPdfCss() {
  if (!cachedCss) {
    cachedCss = fs.readFileSync(CONTRACT_CSS_PDF, 'utf8');
  }
  return cachedCss;
}

function wrapContractBody(innerHtml) {
  if (/class="container"/i.test(innerHtml)) {
    return innerHtml;
  }
  return `<div class="container contract-box">\n${innerHtml}\n</div>`;
}

/**
 * Full HTML document matching Tamin PDF parser expectations
 * (see input/sampleWorkingHtml.html).
 */
function buildPdfDocument({ body, title }) {
  const css = getPdfCss();

  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8"/>
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

function normalizeDocxHtml(html) {
  let out = html;

  out = out.replace(/<a\s+id="[^"]*"\s*>\s*<\/a>/gi, '');
  out = out.replace(/<a\s+id="[^"]*"\s*\/>/gi, '');

  out = out.replace(/<table(\s[^>]*)?>/gi, (match, attrs = '') => {
    if (/class="contract-table"/i.test(match)) {
      return match;
    }
    if (/class="/i.test(match)) {
      return match.replace(/\bclass="/i, 'class="contract-table ');
    }
    return `<table class="contract-table"${attrs}>`;
  });

  out = out.replace(/\srole="presentation"/gi, '');
  out = out.replace(/\sstyle="[^"]*"/gi, '');

  return out;
}

function buildContractHtml(body, title = 'قرارداد بیمه اصحاب فرهنگ و هنر') {
  const inner = wrapContractBody(body);
  return {
    document: buildPdfDocument({ body: inner, title }),
    fragment: inner,
  };
}

module.exports = {
  buildPdfDocument,
  buildContractHtml,
  wrapContractBody,
  normalizeDocxHtml,
  getPdfCss,
};
