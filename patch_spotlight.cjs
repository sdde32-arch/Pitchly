const fs = require('fs');
let content = fs.readFileSync('components/home/SpotlightCarousel.tsx', 'utf8');

// replace rounded-3xl with rounded-2xl
content = content.replace(/rounded-3xl/g, 'rounded-2xl');
// update the gradient overlay from "from-black/85 via-black/25 to-black/40" to sleek one
content = content.replace(/from-black\/85 via-black\/25 to-black\/40/g, 'from-black/80 via-black/20 to-transparent');
// update the card shadows
content = content.replace(/shadow-md shadow-black\/20/g, 'shadow-md hover:shadow-lg hover:shadow-black/10');

fs.writeFileSync('components/home/SpotlightCarousel.tsx', content);
console.log('Spotlight Carousel updated');
