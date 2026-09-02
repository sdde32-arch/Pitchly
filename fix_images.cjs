const fs = require('fs');
const files = ['pages/TurfDetail.tsx', 'pages/Bookings.tsx', 'pages/ExploreMap.tsx', 'pages/Home.tsx'];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]*\?[^\"']*/g, '');
    fs.writeFileSync(file, content);
  }
}
