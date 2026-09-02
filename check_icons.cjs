const fs = require('fs');
const glob = require('glob');

const files = glob.sync('{pages,components}/**/*.tsx');

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('className') && line.includes('flex ') && !line.includes('items-center') && line.match(/<(User|MapPin|Calendar|Star|MessageSquare|Chevron|Arrow|Check|Download|Phone|Mail|Zap|Lightbulb|Compass|Presentation|ExternalLink|Loader2|Info|Trophy|Users|Circle|ShieldCheck|Lock|LogIn|Sparkles|CalendarCheck|Send)[a-zA-Z0-9]* /)) {
      console.log(`${file}:${i+1}: ${line.trim()}`);
    }
  });
});
