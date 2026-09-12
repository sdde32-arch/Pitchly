const fs = require('fs');
let code = fs.readFileSync('pages/Home.tsx', 'utf-8');
code = code.replace(
  "useEffect(() => {\n    if (!loading) {\n      fetchPitches();\n      fetchUserUpcomingBooking();\n    }\n  }, [loading, user]);",
  "useEffect(() => {\n    console.log('useEffect triggered in Home', {loading, user});\n    if (!loading) {\n      fetchPitches();\n      fetchUserUpcomingBooking();\n    }\n  }, [loading, user]);"
);
fs.writeFileSync('pages/Home.tsx', code);
