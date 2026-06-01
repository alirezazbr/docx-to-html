const fs = require('fs');
const { OUTPUT_HTML } = require('./lib/paths');

/**
 * Checks output/contract.html for issues that cause Tamin createPdfFile errors.
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
    issues.push('Missing <!DOCTYPE html> at the start.');
  } else {
    ok.push('Has <!DOCTYPE html>.');
  }

  const headCount = (html.match(/<head\b/gi) || []).length;
  const headCloseCount = (html.match(/<\/head>/gi) || []).length;
  if (headCount !== 1 || headCloseCount !== 1) {
    issues.push(`Expected exactly one <head> (found ${headCount} open, ${headCloseCount} close).`);
  } else {
    ok.push('Exactly one <head> block.');
  }

  const htmlOpen = (html.match(/<html\b/gi) || []).length;
  if (htmlOpen !== 1) {
    issues.push(`Expected one <html> tag, found ${htmlOpen}.`);
  } else {
    ok.push('Exactly one <html> root.');
  }

  const metaInHead = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const metaTags = metaInHead ? (metaInHead[1].match(/<meta\b/gi) || []).length : 0;
  if (metaTags !== 1) {
    issues.push(
      `Expected one <meta> inside <head> (like sampleWorkingHtml). Found ${metaTags}. Extra meta tags confuse strict XML parsers.`
    );
  } else if (!/<meta\s+charset="UTF-8"\s*\/?>/i.test(html)) {
    issues.push('<meta charset="UTF-8"/> is missing or not in expected form.');
  } else {
    ok.push('Single <meta charset="UTF-8"/> in <head>.');
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) {
    issues.push('Missing <body>...</body>.');
  } else {
    const body = bodyMatch[1];
    if (/<head\b|<html\b|<!DOCTYPE/i.test(body)) {
      issues.push(
        'Body contains <head>, <html>, or <!DOCTYPE> — never nest a full document inside body.'
      );
    } else {
      ok.push('Body has no nested document tags.');
    }
    if (/<meta\b/i.test(body)) {
      issues.push('Body contains <meta> — meta must only appear in <head>.');
    }
  }

  if (/role="presentation"/i.test(html)) {
    issues.push('Found role="presentation" tables (email layout). PDF sample uses plain tables/divs.');
  } else {
    ok.push('No email-style presentation tables.');
  }

  if (!/<style[\s\S]*<\/style>/i.test(html)) {
    issues.push('Missing embedded <style> block.');
  } else {
    ok.push('Embedded <style> present.');
  }

  const nestedHeadRisk =
    'If createPdfFile still fails with "nested tag head": your API must pass this file AS the ' +
    'entire HTML string, not inside another <html><head>...</head><body> template.';

  return { ok, issues, nestedHeadRisk, pass: issues.length === 0 };
}

function main() {
  const result = validatePdfHtml();
  console.log('PDF HTML validation:', OUTPUT_HTML);
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
  console.log(result.pass ? 'Result: PASS — safe to send contract.html to createPdfFile.' : 'Result: FAIL — fix issues above.');
  process.exit(result.pass ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { validatePdfHtml };
