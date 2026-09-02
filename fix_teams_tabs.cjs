const fs = require('fs');
let content = fs.readFileSync('pages/Teams.tsx', 'utf8');

content = content.replace(/bg-surface -elevated/g, 'bg-surface-elevated');
content = content.replace(/border-slate-100 \/5/g, 'border-border-light');
content = content.replace(/text-secondary/g, 'text-text-secondary');
content = content.replace(/text-muted/g, 'text-text-muted');

fs.writeFileSync('pages/Teams.tsx', content);
