function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Inline styles safe for common email clients (no web fonts, no external CSS). */
const S = {
  body: 'margin:0;padding:0;background-color:#f4f4f4;',
  outerTd: 'padding:20px;',
  container:
    'max-width:900px;width:100%;border:2px solid #000000;background-color:#ffffff;',
  innerTd:
    'padding:20px;font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;color:#000000;',
  headerMeta:
    'font-size:14px;line-height:2;font-family:Tahoma,Arial,sans-serif;direction:rtl;text-align:right;',
  logoImg:
    'width:100px;height:100px;display:block;margin:0 auto;border:0;outline:none;text-decoration:none;',
  title:
    'text-align:center;font-size:22px;font-weight:bold;padding:20px 0;font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#000000;',
  content:
    'text-align:justify;line-height:2.5;font-size:15px;padding:20px 0;font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#000000;',
  highlight:
    'display:inline-block;min-width:80px;text-align:center;border-bottom:1px solid #000000;padding:0 5px;',
  termItem:
    'text-align:justify;line-height:2.2;font-size:14px;padding:0 0 15px 20px;font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#000000;',
  contractTable:
    'width:100%;border-collapse:collapse;margin-top:20px;font-size:12px;border:1px solid #000000;',
  contractTd:
    'border:1px solid #000000;padding:6px;text-align:center;font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#000000;',
  docxP:
    'margin:0 0 8px 0;text-align:justify;line-height:1.85;font-size:12px;font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#000000;',
  docxOl:
    'margin:8px 0;padding-right:24px;font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#000000;',
  docxLi:
    'margin:0 0 6px 0;text-align:justify;line-height:1.85;font-size:12px;font-family:Tahoma,Arial,sans-serif;direction:rtl;color:#000000;',
  docxTable:
    'width:100%;border-collapse:collapse;margin-top:16px;font-size:9px;border:1px solid #000000;',
  docxTd:
    'border:1px solid #000000;padding:4px 5px;text-align:center;vertical-align:middle;font-family:Tahoma,Arial,sans-serif;direction:rtl;font-size:9px;color:#000000;',
};

function isWrappedFragment(body) {
  return (
    /max-width:900px/i.test(body) &&
    /role="presentation"/i.test(body) &&
    /border:2px solid #000000/i.test(body)
  );
}

function wrapEmailBody(innerHtml) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="${S.body}">
<tr>
<td align="center" style="${S.outerTd}">
<table role="presentation" width="900" cellspacing="0" cellpadding="0" border="0" style="${S.container}">
<tr>
<td style="${S.innerTd}">
${innerHtml}
</td>
</tr>
</table>
</td>
</tr>
</table>`;
}

/** Body-only HTML for Java/XML PDF engines that wrap content in their own &lt;html&gt;&lt;head&gt;. */
function buildHtmlFragment(body) {
  return isWrappedFragment(body) ? body : wrapEmailBody(body);
}

/**
 * Full XHTML document (browser, email, local Puppeteer).
 * Uses explicit &lt;/meta&gt; — avoids "expected closing tag meta" in strict XML parsers.
 */
function buildEmailDocument({ body, title }) {
  const inner = buildHtmlFragment(body);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fa" dir="rtl">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></meta>
<title>${escapeHtml(title)}</title>
</head>
<body dir="rtl" style="${S.body}">
${inner}
</body>
</html>`;
}

function buildContractHtml(body, title = 'contract') {
  const fragment = buildHtmlFragment(body);
  return {
    fragment,
    document: buildEmailDocument({ body: fragment, title }),
  };
}

function styleLogoImg(imgTag) {
  if (!imgTag) return '';
  if (/style="/i.test(imgTag)) {
    return imgTag.replace(/\bstyle="([^"]*)"/i, (_, existing) => {
      return `style="${existing};${S.logoImg}"`;
    });
  }
  return imgTag.replace(/<img/i, `<img style="${S.logoImg}"`);
}

/** Add inline styles to HTML fragments produced by mammoth (DOCX). */
function inlineDocxFragment(html) {
  let out = html;

  out = out.replace(/<a\s+id="[^"]*"\s*>\s*<\/a>/gi, '');
  out = out.replace(/<a\s+id="[^"]*"\s*\/>/gi, '');

  out = out.replace(/<table(\s[^>]*)?>/gi, (match, attrs = '') => {
    if (/style="/i.test(match)) return match;
    return `<table cellspacing="0" cellpadding="0" border="0" style="${S.docxTable}"${attrs}>`;
  });

  out = out.replace(/<td(\s[^>]*)?>/gi, (match, attrs = '') => {
    if (/style="/i.test(match)) return match;
    return `<td style="${S.docxTd}"${attrs}>`;
  });

  out = out.replace(/<p(\s[^>]*)?>/gi, (match, attrs = '') => {
    if (/style="/i.test(match)) return match;
    return `<p style="${S.docxP}"${attrs}>`;
  });

  out = out.replace(/<ol(\s[^>]*)?>/gi, (match, attrs = '') => {
    if (/style="/i.test(match)) return match;
    return `<ol style="${S.docxOl}"${attrs}>`;
  });

  out = out.replace(/<li(\s[^>]*)?>/gi, (match, attrs = '') => {
    if (/style="/i.test(match)) return match;
    return `<li style="${S.docxLi}"${attrs}>`;
  });

  out = out.replace(/<img([^>]*)>/gi, (match) => styleLogoImg(match));

  return out;
}

module.exports = {
  S,
  wrapEmailBody,
  buildHtmlFragment,
  buildEmailDocument,
  buildContractHtml,
  inlineDocxFragment,
  styleLogoImg,
};
