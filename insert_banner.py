import re

with open("pages/Home.tsx", "r") as f:
    content = f.read()

target = '          {/* 3. DUAL-COLUMN MATCHDAY DASHBOARD GRID */}'
replacement = '          <TournamentBanner />\n\n          {/* 3. DUAL-COLUMN MATCHDAY DASHBOARD GRID */}'

content = content.replace(target, replacement)

with open("pages/Home.tsx", "w") as f:
    f.write(content)
