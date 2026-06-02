const DEFAULT_LOGO = 'logo.png';

const ITEXT_COMPAT_COMMENT = `<!--
iText 5 XMLWorker compatibility refactor (auto-generated)
Modifications:
  1. CSS: removed box-sizing, max-width, min-width, object-fit, flex, grid,
     @media, transforms, shadows, and other unsupported properties.
  2. Layout: outer border + sections use width="100%" tables instead of flex/max-width divs.
  3. Images: base64 data URIs replaced with file path (logo.png or CONTRACT_LOGO_URL).
  4. Meta: XHTML-style <meta charset="UTF-8"></meta> for strict XML parsers.
  5. Fonts: single Tahoma declaration (no web fonts).
  6. RTL: preserved dir="rtl" lang="fa" and direction: rtl on body.
  7. Tables: contract-table keeps rowspan/colspan; explicit width and border-collapse.
  8. Content: Persian text and clause data unchanged.
-->`;

function getLogoSrc() {
  return process.env.CONTRACT_LOGO_URL || DEFAULT_LOGO;
}

function replaceBase64Images(html, logoSrc = getLogoSrc()) {
  return html.replace(
    /<img([^>]*)\bsrc="data:[^"]*"([^>]*)>/gi,
    `<img$1 src="${logoSrc}"$2>`
  );
}

function fixEmptyTableCells(html) {
  return html.replace(/<td([^>]*)>\s*<\/td>/gi, '<td$1>&nbsp;</td>');
}

function ensureContractTableAttrs(html) {
  return html.replace(
    /<table\s+class="contract-table"([^>]*)>/gi,
    (match, rest) => {
      if (/width=/i.test(match)) {
        return match;
      }
      return `<table class="contract-table" width="100%" cellpadding="6" cellspacing="0"${rest}>`;
    }
  );
}

function stripUnsupportedInlineStyles(html) {
  return html.replace(/\sstyle="[^"]*"/gi, '');
}

function sanitizeBodyForItext(html) {
  let out = html;
  out = replaceBase64Images(out);
  out = fixEmptyTableCells(out);
  out = ensureContractTableAttrs(out);
  out = stripUnsupportedInlineStyles(out);
  out = out.replace(/<a\s+id="[^"]*"\s*>\s*<\/a>/gi, '');
  out = out.replace(/<a\s+id="[^"]*"\s*\/>/gi, '');
  return out;
}

function buildLogoImg(src = getLogoSrc()) {
  if (!src) {
    return '&nbsp;';
  }
  return `<img src="${src}" alt="لوگو" class="logo"/>`;
}

module.exports = {
  ITEXT_COMPAT_COMMENT,
  DEFAULT_LOGO,
  getLogoSrc,
  replaceBase64Images,
  sanitizeBodyForItext,
  buildLogoImg,
};
