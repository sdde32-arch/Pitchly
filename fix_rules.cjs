const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');

content = content.replace(
  "(request.resource.data.type == 'TEAM')",
  "(request.resource.data.type == 'GROUP' || request.resource.data.type == 'TEAM')"
);

fs.writeFileSync('firestore.rules', content);
