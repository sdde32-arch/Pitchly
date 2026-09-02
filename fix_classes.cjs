const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/ -elevated/g, '');
  content = content.replace(/ -dark/g, '');
  content = content.replace(/bg-surface-elevated/g, 'bg-surface-elevated'); // leave legitimate ones
  fs.writeFileSync(file, content);
}

fixFile('pages/Tournaments.tsx');
fixFile('pages/Teams.tsx');
