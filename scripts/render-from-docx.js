const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { enhanceDocxHtml } = require('./enhance-docx-html');
const { DEFAULT_DOCX, OUTPUT_HTML } = require('./lib/paths');
const { buildStandaloneHtml } = require('./lib/standalone-html');

function resolveDocxPath(argv) {
  if (process.env.CONTRACT_DOCX) {
    return path.resolve(process.env.CONTRACT_DOCX);
  }
  const fileArg = argv.find((a) => !a.startsWith('-') && a.endsWith('.docx'));
  if (fileArg) return path.resolve(fileArg);
  return DEFAULT_DOCX;
}

function wrapHtml(body, title) {
  return buildStandaloneHtml({
    title,
    body: `<div class="page docx-content">\n${body}\n</div>`,
  });
}

async function convertDocxToHtml(docxPath) {
  const result = await mammoth.convertToHtml(
    { path: docxPath },
    {
      convertImage: mammoth.images.imgElement((image) =>
        image.read('base64').then((buffer) => ({
          src: `data:${image.contentType};base64,${buffer}`,
        }))
      ),
    }
  );

  for (const message of result.messages) {
    console.warn('docx:', message.message);
  }

  const title = path.basename(docxPath, '.docx');
  return wrapHtml(enhanceDocxHtml(result.value), title);
}

async function renderFromDocx(docxPath = DEFAULT_DOCX) {
  if (!fs.existsSync(docxPath)) {
    throw new Error(
      `DOCX not found: ${docxPath}\nPlace your file at input/contract.docx or run: pnpm run build -- path/to/file.docx`
    );
  }

  const html = await convertDocxToHtml(docxPath);
  fs.mkdirSync(path.dirname(OUTPUT_HTML), { recursive: true });
  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  console.log('HTML generated from DOCX:', docxPath);
}

if (require.main === module) {
  renderFromDocx(resolveDocxPath(process.argv.slice(2))).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { renderFromDocx, convertDocxToHtml, resolveDocxPath };
