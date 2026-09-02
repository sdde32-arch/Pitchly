const fs = require('fs');
let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

// 1. Remove Player Contact Details
// We need to find the <Card> that contains "Player contact details" and remove it entirely.
const startPlayerDetails = content.indexOf('<h3 className="text-xs font-medium text-[#A1A1AA]">\n                  Player contact details\n                </h3>');

// Actually, wait, let's use regex or just rewrite the entire file since there are many layout tweaks.
// Let's rewrite the main parts using string replacement carefully.
