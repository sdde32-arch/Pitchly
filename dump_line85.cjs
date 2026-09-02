const fs = require('fs');
const content = fs.readFileSync('pages/TurfDetail.tsx', 'utf8');
const lines = content.split('\n');
fs.writeFileSync('line85.jsx', lines[84]);
