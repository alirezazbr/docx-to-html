const { normalizeDocxHtml } = require('./lib/pdf-html');

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
  let logo = '';
  if (imgMatch) {
    const tag = imgMatch[0];
    const srcMatch = tag.match(/\bsrc="([^"]*)"/i);
    const src = srcMatch ? srcMatch[1] : '';
    logo = `<img src="${src}" alt="لوگو" class="logo"/>`;
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
  const termsHtml = termBlocks
    .map((b, i) => {
      if (i === 0 && /توضیحات/.test(stripTags(b.inner))) {
        return '';
      }
      return `<div class="term-item">${b.inner}</div>`;
    })
    .filter(Boolean)
    .join('\n');

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
    ? `<div class="content">\n${afterTableHtml}\n</div>`
    : '';

  return `<div class="header-top">
<table>
<tr>
<td style="width:25%;"></td>
<td style="width:50%;text-align:center;">${logo}</td>
<td style="width:25%;" class="meta-info">
<div>${metaInner}</div>
<div>${numberInner}</div>
</td>
</tr>
</table>
</div>
<div class="title-section">
<div class="main-title">${titleInner}</div>
</div>
<div class="content">
${bodyHtml}
</div>
${termsHtml ? `<div class="terms">\n${termsHtml}\n</div>` : ''}
${tableHtml}
${footerHtml}`;
}

module.exports = { enhanceDocxHtml };
