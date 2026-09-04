const fs = require('fs');
let content = fs.readFileSync('components/home/SpotlightCarousel.tsx', 'utf8');

// Remove negative margins, use standard layout
content = content.replace(
  'className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0"',
  'className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x snap-mandatory w-full"'
);

// Update card widths so they are smaller and multiple can fit, or just one that aligns perfectly
content = content.replace(
  /w-\[85vw\] max-w-\[320px\] sm:min-w-\[340px\] sm:max-w-\[360px\] h-\[220px\] sm:h-\[240px\]/g,
  'w-[280px] sm:w-[340px] h-[200px] sm:h-[220px]'
);

fs.writeFileSync('components/home/SpotlightCarousel.tsx', content);
console.log('Carousel updated');
