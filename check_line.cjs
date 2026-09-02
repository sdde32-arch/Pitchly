const fs = require('fs');
const content = fs.readFileSync('pages/TurfDetail.tsx', 'utf8');
const lines = content.split('\n');
console.log(lines[84]);
