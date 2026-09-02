const fs = require('fs');
let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

const regex = /<button\s*onClick=\{\(\) => \{\s*if \(step === 2\) \{\s*setStep\(1\);\s*\} else \{\s*if \(id\) \{\s*navigate\(\`\/pitch\/\$\{id\}\`\);\s*\} else \{\s*navigate\("\/"\);\s*\}\s*\}\s*\}\}/m;

const replacement = `<button
            onClick={() => {
              if (step === 2) {
                setStep(1);
              } else {
                handleCancelCheckout();
              }
            }}`;

content = content.replace(regex, replacement);
fs.writeFileSync('pages/Checkout.tsx', content, 'utf8');
