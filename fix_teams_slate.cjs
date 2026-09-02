const fs = require('fs');
let content = fs.readFileSync('pages/Teams.tsx', 'utf8');

content = content.replace(/bg-slate-50 \/5/g, 'bg-surface/5');
content = content.replace(/border-slate-50 \/5/g, 'border-border/5');
content = content.replace(/bg-slate-50\/50 \/5/g, 'bg-surface/5');
content = content.replace(/bg-slate-100 \/5/g, 'bg-surface/5');
content = content.replace(/bg-surface \/5/g, 'bg-surface/5');
content = content.replace(/border-border \/5/g, 'border-border/5');
content = content.replace(/bg-slate-200 \/5/g, 'bg-surface-elevated/5');
content = content.replace(/bg-slate-50/g, 'bg-surface');
content = content.replace(/border-slate-100 \/5/g, 'border-border/5');
content = content.replace(/border-slate-100/g, 'border-border');
content = content.replace(/bg-slate-100/g, 'bg-surface-elevated');
content = content.replace(/bg-slate-200/g, 'bg-surface-elevated');
content = content.replace(/text-slate-500/g, 'text-text-secondary');

fs.writeFileSync('pages/Teams.tsx', content);
console.log("Done");
