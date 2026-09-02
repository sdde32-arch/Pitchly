const fs = require('fs');
let content = fs.readFileSync('components/Layout.tsx', 'utf8');

// replace invalid tailwind bracket notation with config colors
content = content.replace(/bg-\[var\(--color-bg\)\]/g, 'bg-background');
content = content.replace(/bg-\[var\(--color-surface\)\]/g, 'bg-surface');
content = content.replace(/text-\[var\(--color-text-inverse\)\]/g, 'text-text-inverse');

fs.writeFileSync('components/Layout.tsx', content);
