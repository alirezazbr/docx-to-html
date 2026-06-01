const fs = require('fs');
const { DEFAULT_DOCX } = require('./lib/paths');
const { renderFromDocx } = require('./render-from-docx');
const { renderFromJson } = require('./render-from-json');

function resolveMode(argv) {
  if (argv.includes('--json')) return 'json';
  if (argv.includes('--docx')) return 'docx';
  if (argv.some((a) => a.endsWith('.docx'))) return 'docx';
  if (fs.existsSync(DEFAULT_DOCX)) return 'docx';
  return 'json';
}

async function main() {
  const argv = process.argv.slice(2);
  const mode = resolveMode(argv);

  if (mode === 'docx') {
    const { resolveDocxPath } = require('./render-from-docx');
    await renderFromDocx(resolveDocxPath(argv));
  } else {
    renderFromJson();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
