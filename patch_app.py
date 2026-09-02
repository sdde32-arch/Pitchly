with open('App.tsx', 'r') as f:
    content = f.read()

import_stmt = 'import { MatchSummary } from "./pages/MatchSummary";\nimport { BookingConfirmation } from "./pages/BookingConfirmation";'
content = content.replace('import { MatchSummary } from "./pages/MatchSummary";', import_stmt)

route_stmt = '<Route path="/booking-confirmation/:id" element={<RequireAuth><PageTransition><BookingConfirmation /></PageTransition></RequireAuth>} />\n        <Route path="/match-summary/:bookingId" element={<RequireAuth><PageTransition><MatchSummary /></PageTransition></RequireAuth>} />'
content = content.replace('<Route path="/match-summary/:bookingId" element={<RequireAuth><PageTransition><MatchSummary /></PageTransition></RequireAuth>} />', route_stmt)

with open('App.tsx', 'w') as f:
    f.write(content)
