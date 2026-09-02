const fs = require("fs");
const code = fs.readFileSync("pages/Bookings.tsx", "utf8");
const lines = code.split('\n');
const line19 = lines[18];
console.log(line19.slice(7000, 7100));
