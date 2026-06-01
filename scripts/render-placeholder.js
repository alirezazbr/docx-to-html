const fs = require('fs');
const path = require('path');
const { ROOT, OUTPUT_HTML } = require('./lib/paths');
const { writeContractOutputs } = require('./lib/standalone-html');

const PLACEHOLDER_TEMPLATE = path.join(ROOT, 'templates', 'contract.placeholder.html');

function renderPlaceholder() {
  if (!fs.existsSync(PLACEHOLDER_TEMPLATE)) {
    throw new Error(`Template not found: ${PLACEHOLDER_TEMPLATE}`);
  }

  const body = fs.readFileSync(PLACEHOLDER_TEMPLATE, 'utf8');
  writeContractOutputs(body, 'قرارداد بیمه اصحاب فرهنگ و هنر');
  console.log('HTML generated with {placeholders}:', PLACEHOLDER_TEMPLATE);
}

if (require.main === module) {
  renderPlaceholder();
}

module.exports = { renderPlaceholder };
