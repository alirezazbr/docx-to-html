const fs = require('fs');
const Handlebars = require('handlebars');
const { DEFAULT_JSON, TEMPLATE_HBS, OUTPUT_HTML } = require('./lib/paths');
const { writeContractOutputs } = require('./lib/standalone-html');

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
  writeContractOutputs(rawHtml, 'قرارداد بیمه اصحاب فرهنگ و هنر');
  console.log('HTML generated from JSON:', dataPath);
}

if (require.main === module) {
  renderFromJson();
}

module.exports = { renderFromJson };
