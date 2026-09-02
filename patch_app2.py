with open('App.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { MatchSummary } from './pages/MatchSummary';", "import { MatchSummary } from './pages/MatchSummary';\nimport { BookingConfirmation } from './pages/BookingConfirmation';")

with open('App.tsx', 'w') as f:
    f.write(content)
