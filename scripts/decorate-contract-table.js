function parseSpan(tag, name) {
  const match = tag.match(new RegExp(`${name}="(\\d+)"`, 'i'));
  return match ? parseInt(match[1], 10) : 1;
}

function addClassesToTdOpenTag(openTag, classNames) {
  const merged = [...new Set(classNames)];
  if (/\bclass="/i.test(openTag)) {
    return openTag.replace(/\bclass="([^"]*)"/i, (_, existing) => {
      const all = [...new Set([...existing.split(/\s+/).filter(Boolean), ...merged])];
      return `class="${all.join(' ')}"`;
    });
  }
  return openTag.replace(/<td/i, `<td class="${merged.join(' ')}"`);
}

/**
 * Marks title cells (header rows) and column 0 (جنسیت / first column in DOCX).
 */
function decorateContractTable(tableHtml) {
  const trMatches = [...tableHtml.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)];
  if (!trMatches.length) return tableHtml;

  const TITLE_ROW_COUNT = 2;
  const placements = [];
  const occupied = [];

  trMatches.forEach((trMatch, rowIndex) => {
    const rowHtml = trMatch[1];
    const cellRegex = /<td([^>]*)>([\s\S]*?)<\/td>/gi;
    let cellMatch;
    let colIndex = 0;

    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      while (occupied[rowIndex]?.[colIndex]) colIndex++;

      const openTag = `<td${cellMatch[1]}>`;
      const rowspan = parseSpan(openTag, 'rowspan');
      const colspan = parseSpan(openTag, 'colspan');

      placements.push({
        rowIndex,
        colIndex,
        openTag,
        inner: cellMatch[2],
        fullMatch: cellMatch[0],
        trStart: trMatch.index,
        cellStart: trMatch.index + trMatch[0].indexOf(cellMatch[0]),
      });

      for (let dr = 0; dr < rowspan; dr++) {
        for (let dc = 0; dc < colspan; dc++) {
          if (!occupied[rowIndex + dr]) occupied[rowIndex + dr] = [];
          occupied[rowIndex + dr][colIndex + dc] = true;
        }
      }

      colIndex += colspan;
    }
  });

  const classByCellStart = new Map();

  for (const cell of placements) {
    const classes = [];

    if (cell.colIndex === 0) {
      classes.push('table-col-first');
    }

    if (cell.rowIndex < TITLE_ROW_COUNT) {
      classes.push('table-title-cell');
    }

    if (classes.length) {
      classByCellStart.set(cell.cellStart, classes);
    }
  }

  let result = tableHtml;
  const sorted = [...placements].sort((a, b) => b.cellStart - a.cellStart);

  for (const cell of sorted) {
    const classes = classByCellStart.get(cell.cellStart);
    if (!classes?.length) continue;

    const newCell = `${addClassesToTdOpenTag(cell.openTag, classes)}${cell.inner}</td>`;
    result = result.slice(0, cell.cellStart) + newCell + result.slice(cell.cellStart + cell.fullMatch.length);
  }

  return result;
}

module.exports = { decorateContractTable };
