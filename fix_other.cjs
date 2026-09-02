const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-slate-50 \/50/g, 'bg-surface/50');
  content = content.replace(/bg-slate-50/g, 'bg-surface');
  content = content.replace(/ \/5/g, '/5');
  fs.writeFileSync(file, content);
}

fixFile('components/AIChat.tsx');
fixFile('pages/owner/ManagePitches.tsx');
fixFile('pages/owner/OwnerProfile.tsx');
fixFile('pages/Tournaments.tsx');
