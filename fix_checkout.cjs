const fs = require('fs');
let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

// 1. Move duration definition after selectedTimes
content = content.replace('const duration = Math.max(1, selectedTimes.length);\n', '');
// Find where selectedTimes is declared and add duration right after it
content = content.replace(
    '  const [selectedTimes, setSelectedTimes] = useState<string[]>(() => {',
    '  const [selectedTimes, setSelectedTimes] = useState<string[]>(() => {\n'
);
content = content.replace(
    '  });',
    '  });\n  const duration = Math.max(1, selectedTimes.length);'
);

// 2. Remove setDuration lines
content = content.replace(/setDuration\(.*?\);/g, '');

// 3. Remove the entire `Maintain duration in sync` useEffect
const useEffectToRemove = `  // Maintain duration in sync with selectedTimes length
  useEffect(() => {
    if (selectedTimes.length > 0) {
      
    }
  }, [selectedTimes]);`;

content = content.replace(useEffectToRemove, '');

fs.writeFileSync('pages/Checkout.tsx', content, 'utf8');
