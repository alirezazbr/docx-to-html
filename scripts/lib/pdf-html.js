const fs = require('fs');
const { CONTRACT_CSS_PDF } = require('./paths');
const { ITEXT_COMPAT_COMMENT, sanitizeBodyForItext } = require('./itext-html');

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

/** Outer table wraps content — replaces max-width/auto-margin div container for XMLWorker. */
function wrapContractBody(innerHtml) {
  if (/class="outer"/i.test(innerHtml)) {
    return sanitizeBodyForItext(innerHtml);
  }
  const inner = sanitizeBodyForItext(innerHtml);
  return `<table class="outer" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr>
<td class="contract-box">
${inner}
</td>
</tr>
</table>`;
}

function buildPdfDocument({ body, title }) {
  const css = getPdfCss();

  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
${ITEXT_COMPAT_COMMENT}
<head>
<meta charset="UTF-8"></meta>
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

  out = out.replace(/<table(\s[^>]*)?>/gi, (match, attrs = '') => {
    if (/class="contract-table"/i.test(match)) {
      return match;
    }
    if (/class="/i.test(match)) {
      return match.replace(/\bclass="/i, 'class="contract-table ');
    }
    return `<table class="contract-table" width="100%" cellpadding="6" cellspacing="0"${attrs}>`;
  });

  return sanitizeBodyForItext(out);
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
