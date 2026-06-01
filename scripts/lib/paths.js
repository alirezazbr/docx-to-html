const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

module.exports = {
  ROOT,
  DEFAULT_DOCX: path.join(ROOT, 'input', 'contract.docx'),
  DEFAULT_JSON: path.join(ROOT, 'data', 'contract.json'),
  TEMPLATE_HBS: path.join(ROOT, 'templates', 'contract.hbs'),
  OUTPUT_HTML: path.join(ROOT, 'output', 'contract.html'),
  OUTPUT_PDF: path.join(ROOT, 'output', 'contract.pdf'),
  CONTRACT_CSS: path.join(ROOT, 'assets', 'css', 'contract.css'),
  CONTRACT_FONT: path.join(ROOT, 'assets', 'fonts', 'B-NAZANIN.TTF'),
};
