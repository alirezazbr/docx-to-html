const fs = require('fs');
const path = require('path');
const { buildContractHtml, wrapContractBody } = require('./pdf-html');
const { OUTPUT_HTML, OUTPUT_HTML_FRAGMENT } = require('./paths');

function extractBody(html) {
  const match = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1].trim() : html;
}

function extractTitle(html, fallback = 'قرارداد بیمه اصحاب فرهنگ و هنر') {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : fallback;
}

function stripDocumentWrapper(html) {
  const trimmed = html.trim();
  if (/^\s*<!DOCTYPE/i.test(trimmed) || /^\s*<html[\s>]/i.test(trimmed)) {
    return extractBody(html);
  }
  return trimmed;
}

function makeContractOutputs(html, fallbackTitle = 'قرارداد بیمه اصحاب فرهنگ و هنر') {
  const body = stripDocumentWrapper(html);
  const title = extractTitle(html, fallbackTitle);
  const { document, fragment } = buildContractHtml(body, title);

  fs.mkdirSync(path.dirname(OUTPUT_HTML), { recursive: true });
  fs.writeFileSync(OUTPUT_HTML, document, 'utf8');

  if (process.env.CONTRACT_WRITE_FRAGMENT === '1') {
    fs.writeFileSync(OUTPUT_HTML_FRAGMENT, fragment, 'utf8');
  }

  return { document, fragment };
}

/** @deprecated Use makeContractOutputs — kept as alias */
function makeStandaloneDocument(html, fallbackTitle) {
  return makeContractOutputs(html, fallbackTitle).document;
}

module.exports = {
  makeStandaloneDocument,
  makeContractOutputs,
  writeContractOutputs: makeContractOutputs,
  extractBody,
  extractTitle,
  stripDocumentWrapper,
};
