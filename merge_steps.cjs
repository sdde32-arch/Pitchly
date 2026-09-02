const fs = require('fs');
let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

// We want to combine step 1 and step 2.
// Currently step 1 ends with `</Card>\n            </div>\n            )\n          )}`
// and step 2 begins with `          {step === 2 && (\n            <div className="space-y-6">`

content = content.replace(
    '              </Card>\n            </div>\n            )\n          )}\n          {step === 2 && (\n            <div className="space-y-6">',
    '              </Card>\n'
);

// We also need to change `{step === 3 && (` to `{step === 2 && (`
content = content.replace('{step === 3 && (', '{step === 2 && (');

// And remove any `setStep(3)` -> `setStep(2)`? Wait, the bottom bar buttons.
// Let's check the bottom bar buttons.
fs.writeFileSync('pages/Checkout.tsx', content, 'utf8');
