const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');
const { enhanceDocxHtml } = require('./enhance-docx-html');
const { DEFAULT_DOCX, OUTPUT_HTML, OUTPUT_HTML_FRAGMENT } = require('./lib/paths');
const { writeContractOutputs } = require('./lib/standalone-html');

function resolveDocxPath(argv) {
  if (process.env.CONTRACT_DOCX) {
    return path.resolve(process.env.CONTRACT_DOCX);
  }
  const fileArg = argv.find((a) => !a.startsWith('-') && a.endsWith('.docx'));
  if (fileArg) return path.resolve(fileArg);
  return DEFAULT_DOCX;
}

function wrapHtml(body, title) {
  return writeContractOutputs(body, title).document;
}

const { getLogoSrc } = require('./lib/itext-html');

function convertImage(image) {
  if (process.env.CONTRACT_EMBED_IMAGES === '1') {
    return image.read('base64').then((buffer) => ({
      src: `data:${image.contentType};base64,${buffer}`,
    }));
  }
  return { src: getLogoSrc() };
}

async function convertDocxToHtml(docxPath) {
  const result = await mammoth.convertToHtml(
    { path: docxPath },
    {
      convertImage: mammoth.images.imgElement(convertImage),
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

  await convertDocxToHtml(docxPath);
  console.log('HTML generated from DOCX:', docxPath);
  console.log('  PDF HTML:', OUTPUT_HTML);
  if (process.env.CONTRACT_WRITE_FRAGMENT === '1') {
    console.log('  fragment:', OUTPUT_HTML_FRAGMENT);
  }
}

if (require.main === module) {
  renderFromDocx(resolveDocxPath(process.argv.slice(2))).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}

module.exports = { renderFromDocx, convertDocxToHtml, resolveDocxPath };
