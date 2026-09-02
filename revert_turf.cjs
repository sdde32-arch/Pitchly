const fs = require('fs');
let content = fs.readFileSync('pages/TurfDetail.tsx', 'utf8');
content = content.replace(
  /\{turf\.image \? \(\s*<div className="absolute inset-0 z-\[5\] bg-\[var\(--color-surface-elevated\)\]">\s*<img\s*src=\{turf\.image\}\s*className="w-full h-full object-cover"\s*alt=\{turf\.name\}\s*onError=\{\(e\) => \{\s*e\.currentTarget\.parentElement!\.style\.display = 'none';\s*\}\}\s*\/>\s*<\/div>\s*\) : null\}/g,
  `<img src={turf.image} className="w-full h-full object-cover relative z-[5]" alt={turf.name} onError={(e) => { e.currentTarget.style.display = 'none'; }} />`
);
fs.writeFileSync('pages/TurfDetail.tsx', content);
