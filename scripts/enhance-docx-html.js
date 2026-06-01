const { decorateContractTable } = require('./decorate-contract-table');

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

function extractLogoAndDate(inner) {
  const imgMatch = inner.match(/<img[^>]*>/i);
  const logo = imgMatch ? imgMatch[0] : '';
  const dateInner = imgMatch ? inner.replace(imgMatch[0], '').trim() : inner.trim();
  return { logo, dateInner };
}

function enhanceDocxHtml(html) {
  const blocks = parseTopLevelBlocks(html);
  if (blocks.length < 3) {
    return html;
  }

  const { logo, dateInner } = extractLogoAndDate(blocks[0].inner);
  const numberInner = blocks[1].inner;
  const titleInner = blocks[2].inner;

  const notesStart = blocks.findIndex(
    (b, i) => i > 2 && /توضیحات/.test(stripTags(b.inner))
  );
  const tableIndex = blocks.findIndex((b) => b.tag === 'table');

  const bodyEnd = notesStart === -1 ? (tableIndex === -1 ? blocks.length : tableIndex) : notesStart;
  const notesEnd = tableIndex === -1 ? blocks.length : tableIndex;

  const bodyHtml = blocks
    .slice(3, bodyEnd)
    .map((b) => b.html)
    .join('\n');

  let notesHtml = '';
  if (notesStart !== -1) {
    notesHtml = blocks
      .slice(notesStart, notesEnd)
      .map((b, i) => {
        if (i === 0) {
          return `<p class="contract-notes-title">${b.inner}</p>`;
        }
        return b.html;
      })
      .join('\n');
  }

  const tableHtml =
    tableIndex === -1
      ? ''
      : `<div class="contract-table-wrap">${decorateContractTable(
          blocks[tableIndex].html.replace(/<table>/i, '<table class="contract-table">')
        )}</div>`;

  const afterTableHtml =
    tableIndex === -1
      ? ''
      : blocks
          .slice(tableIndex + 1)
          .map((b) => b.html)
          .join('\n');

  const logoBlock = logo ? `<div class="contract-logo">${logo}</div>` : '';

  return `<div class="contract-header">
<div class="contract-meta">
<div class="contract-meta-line">${dateInner}</div>
<div class="contract-meta-line">${numberInner}</div>
</div>
${logoBlock}
</div>
<h1 class="contract-title">${titleInner}</h1>
<div class="contract-body">
${bodyHtml}
</div>
${notesHtml ? `<div class="contract-notes">\n${notesHtml}\n</div>` : ''}
${tableHtml}
${afterTableHtml ? `<div class="contract-after-table">\n${afterTableHtml}\n</div>` : ''}`;
}

module.exports = { enhanceDocxHtml };
