const fs = require('fs');
let content = fs.readFileSync('components/Layout.tsx', 'utf8');

content = content.replace(
  'bg-background rounded-[32px] flex justify-around items-center z-50 shadow-2xl px-2 border border-[rgba(255,255,255,0.05)] pb-[env(safe-area-inset-bottom)]',
  'bg-surface-dark rounded-[32px] flex justify-around items-center z-50 shadow-2xl px-2 border border-border-light safe-area-pb'
);

fs.writeFileSync('components/Layout.tsx', content);
