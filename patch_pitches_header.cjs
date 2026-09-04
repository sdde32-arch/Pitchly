const fs = require('fs');
let content = fs.readFileSync('pages/Home.tsx', 'utf8');

// Update the AVAILABLE PITCHES header dot icon to look sleek
content = content.replace(
  '<div className="w-3 h-3 rounded-full bg-primary-lime flex items-center justify-center">',
  '<div className="w-2.5 h-2.5 rounded-full bg-primary-lime flex items-center justify-center shadow-[0_0_8px_rgba(22,163,74,0.6)]">'
);
content = content.replace(
  '<div className="w-1.5 h-1.5 rounded-full bg-accent-text" />',
  ''
);

fs.writeFileSync('pages/Home.tsx', content);
console.log('Header updated');
