const fs = require('fs');
const { OUTPUT_HTML } = require('./lib/paths');

const UNSUPPORTED_CSS =
  /box-sizing|max-width|min-width|object-fit|position:\s*(fixed|absolute)|display:\s*(flex|grid)|@media|transform:|filter:|box-shadow|animation:|transition:/i;

/**
 * Validates output/contract.html for iText 5 XMLWorker.
 * Run: pnpm run validate:pdf
 */
function validatePdfHtml(htmlPath = OUTPUT_HTML) {
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`File not found: ${htmlPath}\nRun pnpm run build first.`);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const issues = [];
  const ok = [];

  if (!/^\s*<!DOCTYPE\s+html>/i.test(html)) {
    issues.push('Missing <!DOCTYPE html>.');
  } else {
    ok.push('<!DOCTYPE html> present.');
  }

  if (!/<html\s+dir="rtl"\s+lang="fa">/i.test(html)) {
    issues.push('Expected <html dir="rtl" lang="fa"> for Persian RTL.');
  } else {
    ok.push('RTL html root (dir="rtl" lang="fa").');
  }

  if (/<meta\s+charset="UTF-8"\s*><\/meta>/i.test(html)) {
    ok.push('XHTML meta charset closing tag.</meta>');
  } else if (/<meta\s+charset="UTF-8"\s*\/>/i.test(html)) {
    ok.push('Meta charset present (self-closing).');
  } else {
    issues.push('Missing <meta charset="UTF-8"></meta>.');
  }

  const headCount = (html.match(/<head\b/gi) || []).length;
  if (headCount !== 1) {
    issues.push(`Expected one <head>, found ${headCount}.`);
  } else {
    ok.push('Single <head> block.');
  }

  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (!styleMatch) {
    issues.push('Missing <style> block.');
  } else if (UNSUPPORTED_CSS.test(styleMatch[1])) {
    issues.push('CSS contains iText-unsupported properties (flex, max-width, @media, etc.).');
  } else {
    ok.push('CSS uses XMLWorker-safe properties only.');
  }

  if (/src="data:image/i.test(html)) {
    issues.push('Base64 data: images found — use logo.png or CONTRACT_LOGO_URL for iText 5.');
  } else {
    ok.push('No base64 image URIs.');
  }

  if (/role="presentation"/i.test(html)) {
    issues.push('Email-style role="presentation" tables found.');
  } else {
    ok.push('No presentation-role tables.');
  }

  if (!/table\.outer/i.test(html) && !/class="outer"/i.test(html)) {
    issues.push('Missing outer layout table (iText container).');
  } else {
    ok.push('Outer layout table present.');
  }

  if (!/font-family:\s*Tahoma/i.test(html)) {
    issues.push('Expected font-family: Tahoma (single PDF font).');
  } else if (/sans-serif|googleapis|@font-face/i.test(html)) {
    issues.push('Remove font stacks, web fonts, or @font-face.');
  } else {
    ok.push('Tahoma font declaration.');
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch && /<head\b|<html\b|<!DOCTYPE/i.test(bodyMatch[1])) {
    issues.push('Nested document tags inside <body>.');
  } else if (bodyMatch) {
    ok.push('No nested html/head in body.');
  }

  const nestedHeadRisk =
    'Pass the full contract.html string to XMLWorker without wrapping in another <html><head>.';

  return { ok, issues, nestedHeadRisk, pass: issues.length === 0 };
}

function main() {
  const result = validatePdfHtml();
  console.log('iText 5 HTML validation:', OUTPUT_HTML);
  console.log('');
  for (const line of result.ok) {
    console.log('  OK:', line);
  }
  for (const line of result.issues) {
    console.log('  FAIL:', line);
  }
  console.log('');
  console.log('Note:', result.nestedHeadRisk);
  console.log('');
  console.log(
    result.pass
      ? 'Result: PASS — suitable for iText 5 XMLWorker.'
      : 'Result: FAIL — fix issues above.'
  );
  process.exit(result.pass ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { validatePdfHtml };
