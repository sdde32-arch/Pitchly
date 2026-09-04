const fs = require('fs');
let content = fs.readFileSync('pages/Home.tsx', 'utf8');

// Update the AVAILABLE PITCHES header to be uppercase and clean, with the green O icon
content = content.replace(
  /<h2 className="text-lg sm:text-xl font-black text-text-primary tracking-tight font-display uppercase">/g,
  '<h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight font-display uppercase">'
);

fs.writeFileSync('pages/Home.tsx', content);
console.log('Home updated');
