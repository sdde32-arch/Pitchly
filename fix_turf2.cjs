const fs = require('fs');
let content = fs.readFileSync('pages/TurfDetail.tsx', 'utf8');
content = content.replace(
  /e\.currentTarget\.parentElement\.style\.display/g,
  'e.currentTarget.parentElement!.style.display'
);
fs.writeFileSync('pages/TurfDetail.tsx', content);
