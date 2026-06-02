const { normalizeDocxHtml } = require('./lib/pdf-html');
const { buildLogoImg, sanitizeBodyForItext } = require('./lib/itext-html');

function parseTopLevelBlocks(html) {
  const blocks = [];
  let rest = html.trim();

  while (rest.length) {
    const match = rest.match(/^<(p|ol|ul|table)(\s[^>]*)?>([\s\S]*?)<\/\1>/);
    if (!match) break;
    blocks.push({ tag: match[1], inner: match[3], html: match[0] });
    rest = rest.slice(match[0].length).trim();
  }

  return blocks;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function extractLogoAndMeta(inner) {
  const imgMatch = inner.match(/<img[^>]*>/i);
  let logo = buildLogoImg();
  if (imgMatch) {
    const tag = imgMatch[0];
    const srcMatch = tag.match(/\bsrc="([^"]*)"/i);
    const src = srcMatch ? srcMatch[1] : '';
    if (src && !/^data:/i.test(src)) {
      logo = buildLogoImg(src);
    }
  }
  const metaInner = imgMatch ? inner.replace(imgMatch[0], '').trim() : inner.trim();
  return { logo, metaInner };
}

function enhanceDocxHtml(html) {
  const blocks = parseTopLevelBlocks(html);
  if (blocks.length < 3) {
    return normalizeDocxHtml(html);
  }

  const { logo, metaInner } = extractLogoAndMeta(blocks[0].inner);
  const numberInner = blocks[1].inner;
  const titleInner = blocks[2].inner;

  const notesStart = blocks.findIndex(
    (b, i) => i > 2 && /توضیحات/.test(stripTags(b.inner))
  );
  const tableIndex = blocks.findIndex((b) => b.tag === 'table');

  const bodyEnd = notesStart === -1 ? (tableIndex === -1 ? blocks.length : tableIndex) : notesStart;
  const notesEnd = tableIndex === -1 ? blocks.length : tableIndex;

  const bodyHtml = normalizeDocxHtml(
    blocks
      .slice(3, bodyEnd)
      .map((b) => b.html)
      .join('\n')
  );

  const termBlocks =
    notesStart === -1 ? [] : blocks.slice(notesStart, notesEnd);
  const termsRows = termBlocks
    .map((b, i) => {
      if (i === 0 && /توضیحات/.test(stripTags(b.inner))) {
        return '';
      }
      return `<tr><td class="term-item">${b.inner}</td></tr>`;
    })
    .filter(Boolean)
    .join('\n');

  const termsHtml = termsRows
    ? `<table class="terms-table" width="100%" border="0" cellpadding="0" cellspacing="0">\n${termsRows}\n</table>`
    : '';

  const tableHtml =
    tableIndex === -1 ? '' : normalizeDocxHtml(blocks[tableIndex].html);

  const afterTableHtml =
    tableIndex === -1
      ? ''
      : normalizeDocxHtml(
          blocks
            .slice(tableIndex + 1)
            .map((b) => b.html)
            .join('\n')
        );

  const footerHtml = afterTableHtml
    ? `<table class="layout-table" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr><td class="content">${afterTableHtml}</td></tr>
</table>`
    : '';

  const body = `<!-- iText 5: header row table (replaces flex/div header-top) -->
<table class="header-table" width="100%" border="0" cellpadding="4" cellspacing="0">
<tr>
<td width="25%">&nbsp;</td>
<td width="50%" align="center">${logo}</td>
<td width="25%" align="right" class="meta-info">
<div>${metaInner}</div>
<div>${numberInner}</div>
</td>
</tr>
</table>
<!-- iText 5: title row table -->
<table class="layout-table" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr><td align="center" class="main-title">${titleInner}</td></tr>
</table>
<!-- iText 5: main contract body -->
<table class="layout-table" width="100%" border="0" cellpadding="0" cellspacing="0">
<tr><td class="content">${bodyHtml}</td></tr>
</table>
${termsHtml}
${tableHtml}
${footerHtml}`;

  return sanitizeBodyForItext(body);
}

module.exports = { enhanceDocxHtml };
