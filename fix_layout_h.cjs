const fs = require('fs');
let content = fs.readFileSync('components/Layout.tsx', 'utf8');

content = content.replace(
  'h-16 bg-surface-dark rounded-[32px]',
  'min-h-[64px] py-2 bg-surface-dark rounded-[32px]'
);

fs.writeFileSync('components/Layout.tsx', content);
