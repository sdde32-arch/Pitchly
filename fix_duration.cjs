const fs = require('fs');
let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

const hookText = `  const [selectedTimes, setSelectedTimes] = useState<string[]>(() => {
    return paramTime ? paramTime.split(",") : [];
  });`;
const hookReplacement = `${hookText}\n  const duration = Math.max(1, selectedTimes.length);`;

content = content.replace(hookText, hookReplacement);
fs.writeFileSync('pages/Checkout.tsx', content, 'utf8');
