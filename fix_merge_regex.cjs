const fs = require('fs');
let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

const regexMerge1 = /<\/Card>\s*<\/div>\s*\)\s*\)\}\s*\{step === 2 && \(\s*<div className="space-y-6">/m;
content = content.replace(regexMerge1, '</Card>');

const regexMerge2 = /<\/Card>\s*<\/div>\s*\)\}\s*\{step === 2 && \(/m;
const replacement2 = `</Card>\n            </div>\n            )\n          )}\n          {step === 2 && (`;
content = content.replace(regexMerge2, replacement2);

fs.writeFileSync('pages/Checkout.tsx', content, 'utf8');
