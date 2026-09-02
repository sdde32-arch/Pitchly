const fs = require('fs');

let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

// 1. Remove INTERACTIVE MONTH CALENDAR, TIME SLOT SELECTION, SELECT DURATION
const startRemove = '{/* 2. INTERACTIVE MONTH CALENDAR */}';
const endRemove = '{/* 5. ORDER SUMMARY */}';

const startIndex = content.indexOf(startRemove);
const endIndex = content.indexOf(endRemove);

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex);
    console.log("Removed redundant calendar and time selection.");
} else {
    console.error("Could not find calendar or order summary markers.");
}

// 2. Fix duration to be tied to selectedTimes.length
content = content.replace(
    'const [duration, setDuration] = useState<number>(1);',
    'const duration = Math.max(1, selectedTimes.length);'
);

fs.writeFileSync('pages/Checkout.tsx', content, 'utf8');
