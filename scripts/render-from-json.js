const fs = require('fs');
const Handlebars = require('handlebars');
const { DEFAULT_JSON, TEMPLATE_HBS, OUTPUT_HTML } = require('./lib/paths');
const { makeStandaloneDocument } = require('./lib/standalone-html');

function renderFromJson(dataPath = DEFAULT_JSON) {
  if (!fs.existsSync(dataPath)) {
    throw new Error(`JSON not found: ${dataPath}`);
  }
  if (!fs.existsSync(TEMPLATE_HBS)) {
    throw new Error(`Template not found: ${TEMPLATE_HBS}`);
  }

  const template = fs.readFileSync(TEMPLATE_HBS, 'utf8');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const rawHtml = Handlebars.compile(template)(data);
  const html = makeStandaloneDocument(rawHtml, 'قرارداد بیمه اصحاب فرهنگ و هنر');

  fs.mkdirSync(require('path').dirname(OUTPUT_HTML), { recursive: true });
  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  console.log('HTML generated from JSON:', dataPath);
}

if (require.main === module) {
  renderFromJson();
}

module.exports = { renderFromJson };
